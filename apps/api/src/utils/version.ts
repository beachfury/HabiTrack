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
    // Try to read from root package.json (monorepo root)
    const packagePath = join(process.cwd(), '../../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

    cachedVersion = {
      version: packageJson.version || '0.0.0',
      name: packageJson.name || 'habitrack',
      environment: process.env.NODE_ENV || 'development',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
    };
  } catch {
    // Fallback if package.json not found
    cachedVersion = {
      version: '1.0.0',
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
