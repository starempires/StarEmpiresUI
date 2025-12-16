import { useState, useCallback, ClipboardEvent, ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import { filterAlphanumeric, VALIDATION_MESSAGES } from './ValidationUtils';

interface AlphanumericTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  margin?: 'none' | 'dense' | 'normal';
  sx?: any;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

/**
 * AlphanumericTextField - A reusable text field component with built-in alphanumeric validation
 * 
 * Features:
 * - Real-time input filtering (prevents non-alphanumeric characters)
 * - Visual error states with consistent messaging
 * - Paste event filtering
 * - Accessibility compliance with proper ARIA labels
 * - Consistent helper text display
 */
export default function AlphanumericTextField({
  label,
  value,
  onChange,
  required = false,
  fullWidth = false,
  size = 'medium',
  margin = 'none',
  sx,
  placeholder,
  disabled = false,
  maxLength,
}: AlphanumericTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle input change with real-time filtering
  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Filter to only alphanumeric characters first
    const filteredValue = filterAlphanumeric(inputValue);
    
    // Apply maxLength constraint if specified
    const finalValue = maxLength ? filteredValue.slice(0, maxLength) : filteredValue;
    
    // Update error state based on whether filtering occurred
    const hadInvalidChars = inputValue !== filteredValue;
    setHasError(hadInvalidChars && inputValue.length > 0);
    
    // Call parent onChange with final value
    onChange(finalValue);
  }, [onChange, maxLength]);

  // Handle paste events to filter non-alphanumeric characters
  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    
    const pastedText = event.clipboardData.getData('text');
    const filteredText = filterAlphanumeric(pastedText);
    
    // Apply maxLength constraint if specified
    const currentValue = value || '';
    const availableLength = maxLength ? maxLength - currentValue.length : Infinity;
    const finalText = filteredText.slice(0, availableLength);
    
    // Show error if characters were filtered out
    const hadInvalidChars = pastedText !== filteredText;
    setHasError(hadInvalidChars && pastedText.length > 0);
    
    // Update value with filtered paste content
    const newValue = currentValue + finalText;
    onChange(newValue);
  }, [value, onChange, maxLength]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setFocused(true);
    setHasError(false); // Clear error state on focus
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Validate on blur for required fields
    if (required && !value.trim()) {
      setHasError(true);
    }
  }, [required, value]);

  // Determine if field should show error state
  const showError = hasError || (required && !value.trim() && !focused);
  
  // Determine helper text to display
  const getHelperText = () => {
    if (showError) {
      if (required && !value.trim()) {
        return VALIDATION_MESSAGES.REQUIRED_ERROR;
      }
      return VALIDATION_MESSAGES.ALPHANUMERIC_ERROR;
    }
    if (focused || value) {
      return VALIDATION_MESSAGES.ALPHANUMERIC_HELPER;
    }
    return '';
  };

  return (
    <TextField
      label={label}
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      required={required}
      fullWidth={fullWidth}
      size={size}
      margin={margin}
      sx={sx}
      placeholder={placeholder}
      disabled={disabled}
      error={showError}
      helperText={getHelperText()}
      inputProps={{
        maxLength,
        'aria-label': label,
        'aria-describedby': `${label.toLowerCase().replace(/\s+/g, '-')}-helper-text`,
      }}
      FormHelperTextProps={{
        id: `${label.toLowerCase().replace(/\s+/g, '-')}-helper-text`,
      }}
    />
  );
}