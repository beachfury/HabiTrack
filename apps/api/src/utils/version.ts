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
    // Try multiple paths to find package.json
    // In Docker: WORKDIR is /app, so package.json is at /app/package.json
    // In dev: process.cwd() might be apps/api or the monorepo root
    const possiblePaths = [
      join(process.cwd(), 'package.json'),           // Docker: /app/package.json
      join(process.cwd(), '../../package.json'),     // Dev from apps/api
      join(__dirname, '../../../../package.json'),   // Relative to this file
    ];

    let packageJson: { version?: string; name?: string } | null = null;

    for (const packagePath of possiblePaths) {
      try {
        packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        if (packageJson?.version) break;
      } catch {
        // Try next path
      }
    }

    if (!packageJson?.version) {
      throw new Error('Could not find package.json with version');
    }

    cachedVersion = {
      version: packageJson.version,
      name: packageJson.name || 'habitrack',
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
