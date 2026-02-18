// apps/web/src/utils/themeValidation.ts
// Theme import validation — validates .habi-theme files on the frontend

export interface ThemeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
const RGB_REGEX = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/;
const HSL_REGEX = /^hsla?\(\s*\d{1,3}/;

/** Dangerous patterns in CSS that should be flagged */
const DANGEROUS_CSS_PATTERNS: { pattern: RegExp; description: string }[] = [
  { pattern: /url\s*\(\s*['"]?https?:\/\//gi, description: 'External URL in CSS' },
  { pattern: /@import\s+/gi, description: '@import directive' },
  { pattern: /url\s*\(\s*['"]?javascript:/gi, description: 'javascript: URL in CSS' },
  { pattern: /expression\s*\(/gi, description: 'CSS expression()' },
  { pattern: /-moz-binding/gi, description: 'Mozilla binding (XBL)' },
  { pattern: /behavior\s*:/gi, description: 'IE behavior property' },
];

function isValidColor(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return HEX_COLOR_REGEX.test(value) || RGB_REGEX.test(value) || HSL_REGEX.test(value);
}

/**
 * Validate a .habi-theme file structure before import.
 */
export function validateThemeFile(data: unknown): ThemeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Theme file must be a JSON object'], warnings };
  }

  const d = data as Record<string, unknown>;

  // Format version
  if (!d.formatVersion || d.formatVersion !== '1.0') {
    errors.push('Missing or unsupported "formatVersion" (expected "1.0")');
  }

  // Manifest
  if (!d.manifest || typeof d.manifest !== 'object') {
    errors.push('Missing "manifest" object');
  } else {
    const m = d.manifest as Record<string, unknown>;
    if (!m.name || typeof m.name !== 'string') errors.push('Missing manifest.name');
    if (!m.author || typeof m.author !== 'string') warnings.push('Missing manifest.author');
    if (!m.version || typeof m.version !== 'string') warnings.push('Missing manifest.version');
  }

  // Theme data
  if (!d.theme || typeof d.theme !== 'object') {
    errors.push('Missing "theme" object');
  } else {
    const t = d.theme as Record<string, unknown>;

    // Validate color objects
    for (const colorKey of ['colorsLight', 'colorsDark']) {
      if (t[colorKey] && typeof t[colorKey] === 'object') {
        const colors = t[colorKey] as Record<string, unknown>;
        for (const [key, value] of Object.entries(colors)) {
          if (value && !isValidColor(value)) {
            warnings.push(`Invalid color in ${colorKey}.${key}: "${value}"`);
          }
        }
      }
    }

    // Scan customCSS fields in elementStyles
    if (t.elementStyles && typeof t.elementStyles === 'object') {
      const elements = t.elementStyles as Record<string, Record<string, unknown>>;
      for (const [elementId, style] of Object.entries(elements)) {
        if (style?.customCSS && typeof style.customCSS === 'string') {
          const cssWarnings = scanCSSForDangerousPatterns(style.customCSS);
          for (const w of cssWarnings) {
            warnings.push(`${elementId}.customCSS: ${w}`);
          }
        }
      }
    }
  }

  // Assets
  if (d.assets !== null && d.assets !== undefined) {
    if (!Array.isArray(d.assets)) {
      errors.push('"assets" must be an array or null');
    } else {
      let totalSize = 0;
      for (const asset of d.assets) {
        if (!asset.data || typeof asset.data !== 'string') {
          errors.push('Each asset must have a base64 "data" field');
          continue;
        }
        // Rough size estimate: base64 is ~4/3 of original
        const estimatedSize = (asset.data.length * 3) / 4;
        totalSize += estimatedSize;
        if (estimatedSize > 2 * 1024 * 1024) {
          warnings.push(`Asset "${asset.filename}" exceeds 2MB`);
        }
      }
      if (totalSize > 5 * 1024 * 1024) {
        warnings.push('Total asset size exceeds 5MB — import may be slow');
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Scan a CSS string for dangerous patterns.
 * Returns an array of warning descriptions.
 */
export function scanCSSForDangerousPatterns(css: string): string[] {
  const warnings: string[] = [];
  for (const { pattern, description } of DANGEROUS_CSS_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(css)) {
      warnings.push(description);
    }
  }
  return warnings;
}
