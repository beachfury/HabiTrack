// apps/api/src/utils/validation.ts
// Input validation utilities

/**
 * Validate required string field
 */
export function isValidString(value: any, minLength: number = 1): boolean {
  return typeof value === 'string' && value.trim().length >= minLength;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate PIN format (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string, minLength: number = 8): boolean {
  return typeof password === 'string' && password.length >= minLength;
}

/**
 * Validate positive integer
 */
export function isPositiveInt(value: any): boolean {
  const num = parseInt(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegative(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate array with minimum items
 */
export function isValidArray(value: any, minLength: number = 0): boolean {
  return Array.isArray(value) && value.length >= minLength;
}

/**
 * Validate enum value
 */
export function isValidEnum<T extends string>(value: any, allowedValues: T[]): value is T {
  return allowedValues.includes(value);
}

/**
 * Sanitize string (trim and remove dangerous chars)
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

/**
 * Parse and validate integer
 */
export function parseIntOrNull(value: any): number | null {
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

/**
 * Parse and validate float
 */
export function parseFloatOrNull(value: any): number | null {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}
