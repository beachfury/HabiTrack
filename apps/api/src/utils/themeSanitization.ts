// apps/api/src/utils/themeSanitization.ts
// Server-side theme sanitization for import and update operations

export interface SanitizationResult {
  sanitized: string;
  warnings: string[];
}

/**
 * Sanitize a CSS string by removing dangerous patterns.
 * Applied to customCSS fields in elementStyles on import and theme update.
 */
export function sanitizeCSS(css: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitized = css;

  // Remove external URL references (keep local/relative/data URLs)
  sanitized = sanitized.replace(
    /url\s*\(\s*['"]?https?:\/\/[^)]*\)/gi,
    (match) => {
      warnings.push(`Removed external URL: ${match.slice(0, 80)}`);
      return '';
    }
  );

  // Remove @import directives
  sanitized = sanitized.replace(
    /@import\s+[^;]+;/gi,
    (match) => {
      warnings.push(`Removed @import: ${match.slice(0, 80)}`);
      return '';
    }
  );

  // Remove javascript: URLs
  sanitized = sanitized.replace(
    /url\s*\(\s*['"]?javascript:[^)]*\)/gi,
    (match) => {
      warnings.push(`Removed javascript URL`);
      return '';
    }
  );

  // Remove expression() (IE-specific, XSS vector)
  sanitized = sanitized.replace(
    /expression\s*\([^)]*\)/gi,
    (match) => {
      warnings.push(`Removed expression()`);
      return '';
    }
  );

  // Remove -moz-binding (Firefox XBL, XSS vector)
  sanitized = sanitized.replace(
    /-moz-binding\s*:[^;]+;?/gi,
    (match) => {
      warnings.push(`Removed -moz-binding`);
      return '';
    }
  );

  // Remove behavior property (IE, XSS vector)
  sanitized = sanitized.replace(
    /behavior\s*:[^;]+;?/gi,
    (match) => {
      warnings.push(`Removed behavior property`);
      return '';
    }
  );

  return { sanitized, warnings };
}

/**
 * Sanitize all customCSS fields within an elementStyles object.
 */
export function sanitizeElementStyles(
  elementStyles: Record<string, any> | null | undefined
): { sanitized: Record<string, any> | null; warnings: string[] } {
  if (!elementStyles) return { sanitized: null, warnings: [] };

  const allWarnings: string[] = [];
  const sanitized: Record<string, any> = {};

  for (const [elementId, style] of Object.entries(elementStyles)) {
    if (style && typeof style === 'object') {
      const newStyle = { ...style };
      if (typeof newStyle.customCSS === 'string' && newStyle.customCSS.trim()) {
        const result = sanitizeCSS(newStyle.customCSS);
        newStyle.customCSS = result.sanitized;
        for (const w of result.warnings) {
          allWarnings.push(`${elementId}: ${w}`);
        }
      }
      sanitized[elementId] = newStyle;
    } else {
      sanitized[elementId] = style;
    }
  }

  return { sanitized, warnings: allWarnings };
}

// Known image magic bytes for validation
const IMAGE_MAGIC_BYTES: Record<string, number[]> = {
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
  svg: [0x3c], // < (XML start)
  ico: [0x00, 0x00, 0x01, 0x00],
};

/**
 * Validate that a base64 string represents an image file.
 * Returns the detected format or null if invalid.
 */
export function validateBase64Image(base64Data: string): string | null {
  try {
    // Decode first few bytes
    const raw = Buffer.from(base64Data.slice(0, 20), 'base64');
    const bytes = Array.from(raw);

    for (const [format, magic] of Object.entries(IMAGE_MAGIC_BYTES)) {
      const match = magic.every((byte, i) => bytes[i] === byte);
      if (match) return format;
    }

    return null;
  } catch {
    return null;
  }
}

/** Maximum total theme file size (5MB) */
export const MAX_THEME_SIZE = 5 * 1024 * 1024;

/**
 * Validate and sanitize a full theme import payload.
 */
export function validateThemeImport(data: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid theme data'], warnings };
  }

  if (data.formatVersion !== '1.0') {
    errors.push('Unsupported format version');
  }

  if (!data.manifest?.name) {
    errors.push('Missing theme name');
  }

  if (!data.theme || typeof data.theme !== 'object') {
    errors.push('Missing theme data');
  }

  // Check total size
  const jsonSize = JSON.stringify(data).length;
  if (jsonSize > MAX_THEME_SIZE) {
    errors.push(`Theme file exceeds ${MAX_THEME_SIZE / 1024 / 1024}MB limit`);
  }

  // Validate assets
  if (Array.isArray(data.assets)) {
    for (const asset of data.assets) {
      if (asset.data && typeof asset.data === 'string') {
        const format = validateBase64Image(asset.data);
        if (!format) {
          warnings.push(`Asset "${asset.filename}" may not be a valid image`);
        }
      }
    }
  }

  // Sanitize element styles
  if (data.theme?.elementStyles) {
    const { warnings: cssWarnings } = sanitizeElementStyles(data.theme.elementStyles);
    warnings.push(...cssWarnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}
