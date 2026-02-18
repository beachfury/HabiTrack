// apps/api/src/routes/updates/index.ts
// Update management routes - check for and apply updates from GitHub

import type { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getUser } from '../../utils/auth';
import { authRequired, forbidden, serverError } from '../../utils/errors';
import { getVersionInfo } from '../../utils/version';
import { logAudit } from '../../audit';
import { createLogger } from '../../services/logger';

const execAsync = promisify(exec);
const log = createLogger('updates');

// GitHub repo for HabiTrack
const GITHUB_REPO = 'beachfury/HabiTrack';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  // Pad arrays to same length
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}

/**
 * GET /api/updates/check
 * Check for available updates from GitHub releases
 * Requires admin authentication
 */
export async function checkForUpdates(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const versionInfo = getVersionInfo();
    const currentVersion = versionInfo.version;

    // Fetch latest release from GitHub
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'HabiTrack-UpdateChecker',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No releases yet
        return res.json({
          updateAvailable: false,
          currentVersion,
          message: 'No releases found on GitHub',
        });
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release: GitHubRelease = await response.json();

    // Skip prereleases and drafts
    if (release.prerelease || release.draft) {
      return res.json({
        updateAvailable: false,
        currentVersion,
        message: 'Latest release is a prerelease or draft',
      });
    }

    const latestVersion = release.tag_name.replace(/^v/, '');
    const comparison = compareVersions(latestVersion, currentVersion);
    const updateAvailable = comparison > 0;

    log.info('Update check completed', {
      currentVersion,
      latestVersion,
      updateAvailable,
    });

    return res.json({
      updateAvailable,
      currentVersion,
      latestVersion,
      releaseName: release.name || `v${latestVersion}`,
      releaseNotes: release.body || 'No release notes available.',
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
    });
  } catch (err) {
    log.error('Failed to check for updates', { error: String(err) });
    return serverError(res, 'Failed to check for updates');
  }
}

/**
 * POST /api/updates/apply
 * Apply the latest update by pulling from git
 * Requires admin authentication
 *
 * Note: This only pulls the code. Container rebuild requires manual restart
 * or external orchestration.
 */
export async function applyUpdate(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const versionInfo = getVersionInfo();
    const beforeVersion = versionInfo.version;

    log.info('Starting update process', { beforeVersion, userId: user.id });

    // First fetch the latest from origin
    try {
      const fetchResult = await execAsync('git fetch origin', {
        cwd: process.cwd(),
        timeout: 30000, // 30 second timeout
      });
      log.debug('Git fetch completed', { stdout: fetchResult.stdout, stderr: fetchResult.stderr });
    } catch (fetchErr: any) {
      log.error('Git fetch failed', { error: fetchErr.message });
      return res.status(500).json({
        success: false,
        error: { code: 'GIT_FETCH_FAILED', message: 'Failed to fetch updates from GitHub' },
      });
    }

    // Pull the latest changes
    try {
      const pullResult = await execAsync('git pull origin main', {
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      });
      log.info('Git pull completed', { stdout: pullResult.stdout, stderr: pullResult.stderr });
    } catch (pullErr: any) {
      log.error('Git pull failed', { error: pullErr.message });
      return res.status(500).json({
        success: false,
        error: { code: 'GIT_PULL_FAILED', message: 'Failed to pull updates. You may have local changes.' },
      });
    }

    await logAudit({
      action: 'system.update.apply',
      result: 'ok',
      actorId: user.id,
      details: { beforeVersion },
    });

    return res.json({
      success: true,
      message: 'Update downloaded successfully. Please restart the containers to complete the update.',
      instructions: [
        '1. The code has been updated',
        '2. Restart the containers to apply changes:',
        '   docker compose down && docker compose up -d --build',
        '3. Clear your browser cache if you see old UI',
      ],
    });
  } catch (err) {
    log.error('Update process failed', { error: String(err) });

    await logAudit({
      action: 'system.update.apply',
      result: 'error',
      actorId: getUser(req)?.id,
      details: { error: String(err) },
    });

    return serverError(res, 'Update process failed');
  }
}

/**
 * GET /api/updates/status
 * Get the current git status (for showing if there are pending changes)
 * Requires admin authentication
 */
export async function getUpdateStatus(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) return authRequired(res);
    if (user.roleId !== 'admin') return forbidden(res, 'Admin access required');

    const versionInfo = getVersionInfo();

    // Get current git status
    let gitStatus = { clean: true, branch: 'unknown', behind: 0 };
    try {
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: process.cwd(),
        timeout: 5000,
      });
      gitStatus.branch = branchOut.trim();

      // Check if working directory is clean
      const { stdout: statusOut } = await execAsync('git status --porcelain', {
        cwd: process.cwd(),
        timeout: 5000,
      });
      gitStatus.clean = statusOut.trim() === '';

      // Check how many commits behind origin
      try {
        await execAsync('git fetch origin --dry-run', { cwd: process.cwd(), timeout: 10000 });
        const { stdout: behindOut } = await execAsync('git rev-list HEAD..origin/main --count', {
          cwd: process.cwd(),
          timeout: 5000,
        });
        gitStatus.behind = parseInt(behindOut.trim(), 10) || 0;
      } catch {
        // Can't determine behind count, that's okay
      }
    } catch {
      // Git commands failed, probably not a git repo
    }

    return res.json({
      version: versionInfo.version,
      environment: versionInfo.environment,
      git: gitStatus,
    });
  } catch (err) {
    log.error('Failed to get update status', { error: String(err) });
    return serverError(res, 'Failed to get update status');
  }
}
