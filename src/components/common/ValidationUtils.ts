/**
 * Validation utilities for alphanumeric input validation
 * Provides centralized validation logic, constants, and functions
 */

// Regular expression for alphanumeric validation
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]*$/;

/**
 * Filter non-alphanumeric characters from input string
 * @param input - The input string to filter
 * @returns String with only alphanumeric characters
 */
export const filterAlphanumeric = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Validate if string contains only alphanumeric characters
 * @param input - The input string to validate
 * @returns True if string is alphanumeric, false otherwise
 */
export const isAlphanumeric = (input: string): boolean => {
  return ALPHANUMERIC_REGEX.test(input);
};

// Constants for validation messages
export const VALIDATION_MESSAGES = {
  ALPHANUMERIC_HELPER: 'Only letters and numbers are allowed',
  ALPHANUMERIC_ERROR: 'Name must contain only letters and numbers',
  REQUIRED_ERROR: 'This field is required',
} as const;

// Maximum length constants
export const NAME_MAX_LENGTHS = {
  SESSION_NAME: 50,
  EMPIRE_NAME: 30,
  HOMEWORLD_NAME: 30,
  STARBASE_NAME: 30,
} as const;
