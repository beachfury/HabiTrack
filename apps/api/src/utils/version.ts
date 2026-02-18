// apps/api/src/utils/version.ts
// Version information for the application

import { readFileSync } from 'fs';
import { join } from 'path';

interface VersionInfo {
  version: string;
  name: string;
  environment: string;
  buildDate: string;
  nodeVersion: string;
}

let cachedVersion: VersionInfo | null = null;

/**
 * Get application version info
 * Reads from root package.json and caches the result
 */
export function getVersionInfo(): VersionInfo {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Try multiple paths to find the ROOT package.json (which has the version)
    // Note: apps/api/package.json does NOT have a version field
    // In Docker: WORKDIR is /app, root package.json is at /app/package.json
    // In dev: We need to find the monorepo root package.json
    const possiblePaths = [
      join(process.cwd(), 'package.json'),           // Docker: /app/package.json OR dev from monorepo root
      join(process.cwd(), '..', '..', 'package.json'), // Dev: from apps/api -> monorepo root
    ];

    let version: string | undefined;
    let name: string | undefined;

    for (const packagePath of possiblePaths) {
      try {
        const content = readFileSync(packagePath, 'utf-8');
        const pkg = JSON.parse(content);
        // Only accept if this package.json has a version AND is named "habitrack"
        // This ensures we get the root package.json, not apps/api/package.json
        if (pkg.version && pkg.name === 'habitrack') {
          version = pkg.version;
          name = pkg.name;
          break;
        }
      } catch {
        // Try next path
      }
    }

    if (!version) {
      throw new Error('Could not find root package.json with version');
    }

    cachedVersion = {
      version,
      name: name || 'habitrack',
      environment: process.env.NODE_ENV || 'development',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
    };
  } catch {
    // Fallback if package.json not found - use build-time version from env
    cachedVersion = {
      version: process.env.HABITRACK_VERSION || '0.0.0-unknown',
      name: 'habitrack',
      environment: process.env.NODE_ENV || 'development',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
    };
  }

  return cachedVersion;
}

/**
 * Get just the version string
 */
export function getVersion(): string {
  return getVersionInfo().version;
}
