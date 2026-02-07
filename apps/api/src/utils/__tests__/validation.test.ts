// apps/api/src/utils/__tests__/validation.test.ts
// Pure function tests - no mocking required

import { describe, it, expect } from '@jest/globals';
import {
  isValidString,
  isValidEmail,
  isValidPin,
  isValidPassword,
  isPositiveInt,
  isNonNegative,
  isValidArray,
  isValidEnum,
  sanitizeString,
  parseIntOrNull,
  parseFloatOrNull,
} from '../validation.js';

describe('validation utilities', () => {
  describe('isValidString', () => {
    it('returns true for valid strings', () => {
      expect(isValidString('hello')).toBe(true);
      expect(isValidString('ab', 2)).toBe(true);
      expect(isValidString('  hello  ')).toBe(true);
    });

    it('returns false for invalid strings', () => {
      expect(isValidString('')).toBe(false);
      expect(isValidString('a', 2)).toBe(false);
      expect(isValidString(null)).toBe(false);
      expect(isValidString(undefined)).toBe(false);
      expect(isValidString(123)).toBe(false);
    });

    it('handles whitespace-only strings', () => {
      expect(isValidString('   ')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('returns true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('isValidPin', () => {
    it('returns true for valid PINs (4-6 digits)', () => {
      expect(isValidPin('1234')).toBe(true);
      expect(isValidPin('12345')).toBe(true);
      expect(isValidPin('123456')).toBe(true);
    });

    it('returns false for invalid PINs', () => {
      expect(isValidPin('')).toBe(false);
      expect(isValidPin('123')).toBe(false);
      expect(isValidPin('1234567')).toBe(false);
      expect(isValidPin('abcd')).toBe(false);
      expect(isValidPin('12a4')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('returns true for valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('short', 5)).toBe(true);
    });

    it('returns false for invalid passwords', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('1234', 5)).toBe(false);
    });
  });

  describe('isPositiveInt', () => {
    it('returns true for positive integers', () => {
      expect(isPositiveInt(1)).toBe(true);
      expect(isPositiveInt(100)).toBe(true);
      expect(isPositiveInt('5')).toBe(true);
    });

    it('returns false for non-positive values', () => {
      expect(isPositiveInt(0)).toBe(false);
      expect(isPositiveInt(-1)).toBe(false);
      expect(isPositiveInt('abc')).toBe(false);
      expect(isPositiveInt(null)).toBe(false);
    });
  });

  describe('isNonNegative', () => {
    it('returns true for non-negative numbers', () => {
      expect(isNonNegative(0)).toBe(true);
      expect(isNonNegative(1)).toBe(true);
      expect(isNonNegative(1.5)).toBe(true);
      expect(isNonNegative('0')).toBe(true);
    });

    it('returns false for negative or invalid values', () => {
      expect(isNonNegative(-1)).toBe(false);
      expect(isNonNegative(-0.5)).toBe(false);
      expect(isNonNegative('abc')).toBe(false);
    });
  });

  describe('isValidArray', () => {
    it('returns true for valid arrays', () => {
      expect(isValidArray([])).toBe(true);
      expect(isValidArray([1, 2, 3])).toBe(true);
      expect(isValidArray([1], 1)).toBe(true);
    });

    it('returns false for invalid arrays', () => {
      expect(isValidArray(null)).toBe(false);
      expect(isValidArray(undefined)).toBe(false);
      expect(isValidArray('not array')).toBe(false);
      expect(isValidArray([], 1)).toBe(false);
    });
  });

  describe('isValidEnum', () => {
    const colors = ['red', 'green', 'blue'];

    it('returns true for valid enum values', () => {
      expect(isValidEnum('red', colors)).toBe(true);
      expect(isValidEnum('green', colors)).toBe(true);
    });

    it('returns false for invalid enum values', () => {
      expect(isValidEnum('yellow', colors)).toBe(false);
      expect(isValidEnum('', colors)).toBe(false);
      expect(isValidEnum(null, colors)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('removes < and > characters', () => {
      expect(sanitizeString('<script>')).toBe('script');
      expect(sanitizeString('hello<world>')).toBe('helloworld');
    });

    it('handles normal text', () => {
      expect(sanitizeString('normal text')).toBe('normal text');
    });
  });

  describe('parseIntOrNull', () => {
    it('parses valid integers', () => {
      expect(parseIntOrNull('123')).toBe(123);
      expect(parseIntOrNull(456)).toBe(456);
      expect(parseIntOrNull('10.5')).toBe(10);
    });

    it('returns null for invalid values', () => {
      expect(parseIntOrNull('abc')).toBe(null);
      expect(parseIntOrNull(null)).toBe(null);
      expect(parseIntOrNull(undefined)).toBe(null);
    });
  });

  describe('parseFloatOrNull', () => {
    it('parses valid floats', () => {
      expect(parseFloatOrNull('123.45')).toBe(123.45);
      expect(parseFloatOrNull(456.78)).toBe(456.78);
      expect(parseFloatOrNull('10')).toBe(10);
    });

    it('returns null for invalid values', () => {
      expect(parseFloatOrNull('abc')).toBe(null);
      expect(parseFloatOrNull(null)).toBe(null);
    });
  });
});
