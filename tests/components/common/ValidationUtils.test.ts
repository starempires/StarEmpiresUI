import { describe, it, expect } from 'vitest';
import {
  ALPHANUMERIC_REGEX,
  filterAlphanumeric,
  isAlphanumeric,
  VALIDATION_MESSAGES,
  NAME_MAX_LENGTHS,
} from '../../../src/components/common/ValidationUtils';

/**
 * Unit Tests for ValidationUtils Module
 *
 * These tests verify the core validation functions and constants
 * used by the AlphanumericTextField component.
 */
describe('ValidationUtils - Unit Tests', () => {
  describe('filterAlphanumeric', () => {
    it('should remove non-alphanumeric characters', () => {
      expect(filterAlphanumeric('Hello123')).toBe('Hello123');
      expect(filterAlphanumeric('Hello@123!')).toBe('Hello123');
      expect(filterAlphanumeric('Test_Name-123')).toBe('TestName123');
      expect(filterAlphanumeric('   spaces   ')).toBe('spaces');
      expect(filterAlphanumeric('Special!@#$%^&*()Characters')).toBe('SpecialCharacters');
    });

    it('should handle empty strings', () => {
      expect(filterAlphanumeric('')).toBe('');
      expect(filterAlphanumeric('   ')).toBe('');
      expect(filterAlphanumeric('!@#$%^&*()')).toBe('');
    });

    it('should preserve alphanumeric characters', () => {
      expect(filterAlphanumeric('abc123XYZ')).toBe('abc123XYZ');
      expect(filterAlphanumeric('0123456789')).toBe('0123456789');
      expect(filterAlphanumeric('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      expect(filterAlphanumeric('abcdefghijklmnopqrstuvwxyz')).toBe('abcdefghijklmnopqrstuvwxyz');
    });
  });

  describe('isAlphanumeric', () => {
    it('should return true for valid alphanumeric strings', () => {
      expect(isAlphanumeric('Hello123')).toBe(true);
      expect(isAlphanumeric('abc')).toBe(true);
      expect(isAlphanumeric('123')).toBe(true);
      expect(isAlphanumeric('ABC123xyz')).toBe(true);
      expect(isAlphanumeric('')).toBe(true); // Empty string is valid
    });

    it('should return false for strings with non-alphanumeric characters', () => {
      expect(isAlphanumeric('Hello 123')).toBe(false); // Space
      expect(isAlphanumeric('Hello@123')).toBe(false); // Special character
      expect(isAlphanumeric('Test_Name')).toBe(false); // Underscore
      expect(isAlphanumeric('Test-Name')).toBe(false); // Hyphen
      expect(isAlphanumeric('Hello!')).toBe(false); // Exclamation
    });
  });

  describe('ALPHANUMERIC_REGEX', () => {
    it('should match valid alphanumeric strings', () => {
      expect(ALPHANUMERIC_REGEX.test('Hello123')).toBe(true);
      expect(ALPHANUMERIC_REGEX.test('abc')).toBe(true);
      expect(ALPHANUMERIC_REGEX.test('123')).toBe(true);
      expect(ALPHANUMERIC_REGEX.test('')).toBe(true);
    });

    it('should not match strings with non-alphanumeric characters', () => {
      expect(ALPHANUMERIC_REGEX.test('Hello 123')).toBe(false);
      expect(ALPHANUMERIC_REGEX.test('Hello@123')).toBe(false);
      expect(ALPHANUMERIC_REGEX.test('Test_Name')).toBe(false);
    });
  });

  describe('VALIDATION_MESSAGES', () => {
    it('should have all required message constants', () => {
      expect(VALIDATION_MESSAGES.ALPHANUMERIC_HELPER).toBe('Only letters and numbers are allowed');
      expect(VALIDATION_MESSAGES.ALPHANUMERIC_ERROR).toBe('Name must contain only letters and numbers');
      expect(VALIDATION_MESSAGES.REQUIRED_ERROR).toBe('This field is required');
    });
  });

  describe('NAME_MAX_LENGTHS', () => {
    it('should have all required length constants', () => {
      expect(NAME_MAX_LENGTHS.SESSION_NAME).toBe(50);
      expect(NAME_MAX_LENGTHS.EMPIRE_NAME).toBe(30);
      expect(NAME_MAX_LENGTHS.HOMEWORLD_NAME).toBe(30);
      expect(NAME_MAX_LENGTHS.STARBASE_NAME).toBe(30);
    });
  });
});