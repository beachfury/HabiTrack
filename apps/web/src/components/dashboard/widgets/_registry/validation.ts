// _registry/validation.ts
// Widget manifest validation and code scanning utilities.
// Used by registerCommunityWidget() and future widget import flows.

import type { WidgetManifest, WidgetCategory } from '../../../../types/widget';

const VALID_CATEGORIES: WidgetCategory[] = [
  'general', 'calendar', 'chores', 'shopping', 'meals',
  'messages', 'family', 'finance', 'custom',
];

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;
const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a widget manifest against the standard schema.
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest must be a JSON object'], warnings };
  }

  const m = manifest as Record<string, unknown>;

  // Required string fields
  if (!m.id || typeof m.id !== 'string') {
    errors.push('Missing or invalid "id" (must be a string)');
  } else if (!KEBAB_CASE_REGEX.test(m.id)) {
    errors.push('"id" must be kebab-case (e.g. "my-widget")');
  }

  if (!m.version || typeof m.version !== 'string') {
    errors.push('Missing or invalid "version" (must be a string)');
  } else if (!SEMVER_REGEX.test(m.version)) {
    errors.push('"version" must be semver format (e.g. "1.0.0")');
  }

  if (!m.name || typeof m.name !== 'string') {
    errors.push('Missing or invalid "name"');
  }

  if (!m.description || typeof m.description !== 'string') {
    errors.push('Missing or invalid "description"');
  }

  if (!m.author || typeof m.author !== 'string') {
    errors.push('Missing or invalid "author"');
  }

  if (!m.category || !VALID_CATEGORIES.includes(m.category as WidgetCategory)) {
    errors.push(`"category" must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!m.icon || typeof m.icon !== 'string') {
    errors.push('Missing or invalid "icon"');
  }

  // Size object
  if (!m.size || typeof m.size !== 'object') {
    errors.push('Missing or invalid "size" object');
  } else {
    const s = m.size as Record<string, unknown>;
    for (const key of ['defaultW', 'defaultH', 'minW', 'minH']) {
      if (typeof s[key] !== 'number' || (s[key] as number) < 1) {
        errors.push(`"size.${key}" must be a positive number`);
      }
    }
    for (const key of ['maxW', 'maxH']) {
      if (s[key] !== null && (typeof s[key] !== 'number' || (s[key] as number) < 1)) {
        errors.push(`"size.${key}" must be a positive number or null`);
      }
    }
  }

  // dataSources
  if (!Array.isArray(m.dataSources)) {
    errors.push('"dataSources" must be an array of strings');
  } else {
    for (const ds of m.dataSources) {
      if (typeof ds !== 'string') {
        errors.push('Each entry in "dataSources" must be a string');
        break;
      }
    }
  }

  // roles
  if (m.roles !== null && !Array.isArray(m.roles)) {
    errors.push('"roles" must be an array of strings or null');
  }

  // tags
  if (!Array.isArray(m.tags)) {
    errors.push('"tags" must be an array of strings');
  }

  // builtIn
  if (typeof m.builtIn !== 'boolean') {
    errors.push('"builtIn" must be a boolean');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================================
// Code scanning for security (used during widget import)
// ============================================================================

const FORBIDDEN_PATTERNS: { pattern: RegExp; description: string }[] = [
  { pattern: /\bfetch\s*\(/, description: 'fetch() — network request' },
  { pattern: /\bXMLHttpRequest\b/, description: 'XMLHttpRequest — network request' },
  { pattern: /\bWebSocket\b/, description: 'WebSocket — network connection' },
  { pattern: /\bnavigator\.sendBeacon\b/, description: 'sendBeacon — network request' },
  { pattern: /\bimport\s*\(/, description: 'Dynamic import() — code loading' },
  { pattern: /\brequire\s*\(/, description: 'require() — module loading' },
  { pattern: /\bnew\s+Worker\b/, description: 'Web Worker — background execution' },
  { pattern: /\bnew\s+SharedWorker\b/, description: 'SharedWorker — background execution' },
  { pattern: /\beval\s*\(/, description: 'eval() — arbitrary code execution' },
  { pattern: /\bFunction\s*\(/, description: 'Function() constructor — code execution' },
  { pattern: /https?:\/\//, description: 'External URL reference' },
  { pattern: /\bwindow\.open\b/, description: 'window.open — opens new window' },
  { pattern: /\bdocument\.cookie\b/, description: 'document.cookie — cookie access' },
  { pattern: /\blocalStorage\b/, description: 'localStorage — local storage access' },
  { pattern: /\bsessionStorage\b/, description: 'sessionStorage — session storage access' },
  { pattern: /\bindexedDB\b/, description: 'indexedDB — database access' },
];

export interface CodeScanResult {
  safe: boolean;
  violations: { line: number; pattern: string; description: string }[];
}

/**
 * Scan widget code for forbidden patterns (network calls, storage access, etc.).
 * This is defense-in-depth — CSP is the primary enforcement mechanism.
 */
export function scanWidgetCode(code: string): CodeScanResult {
  const violations: CodeScanResult['violations'] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, description } of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          line: i + 1,
          pattern: pattern.source,
          description,
        });
      }
    }
  }

  return { safe: violations.length === 0, violations };
}
