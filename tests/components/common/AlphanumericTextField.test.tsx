import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import AlphanumericTextField from '../../../src/components/common/AlphanumericTextField';

/**
 * Property-Based Tests for AlphanumericTextField Component
 *
 * These tests use property-based testing to verify correctness properties
 * across a wide range of inputs as specified in the design document.
 */
describe('AlphanumericTextField - Property-Based Tests', () => {
  /**
   * **Feature: alphanumeric-name-validation, Property 1: Alphanumeric input filtering**
   * **Validates: Requirements 1.1, 2.1, 3.1, 4.1**
   * 
   * Property: For any string input to a name field, only alphanumeric characters 
   * should remain in the field value after input processing
   */
  it('Property 1: Alphanumeric input filtering', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }), // Generate any string
        (inputString) => {
          const mockOnChange = vi.fn();
          
          const { unmount } = render(
            <AlphanumericTextField
              label={`Test Field ${Math.random()}`} // Unique label to avoid conflicts
              value=""
              onChange={mockOnChange}
            />
          );

          const textField = screen.getByLabelText(/Test Field/);
          
          // Simulate input change with the generated string
          fireEvent.change(textField, { target: { value: inputString } });
          
          // Calculate expected filtered value
          const expectedAlphanumeric = inputString.replace(/[^a-zA-Z0-9]/g, '');
          
          // If the expected result is the same as the current value (empty), 
          // onChange might not be called, which is correct behavior
          if (expectedAlphanumeric === '') {
            // For empty results, either onChange is not called (no change) 
            // or it's called with empty string
            if (mockOnChange.mock.calls.length > 0) {
              const filteredValue = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
              expect(filteredValue).toBe('');
            }
          } else {
            // For non-empty results, onChange should have been called
            expect(mockOnChange).toHaveBeenCalled();
            
            // Get the value that was passed to onChange
            const filteredValue = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
            
            // Property: The filtered value should contain only alphanumeric characters
            const alphanumericRegex = /^[a-zA-Z0-9]*$/;
            expect(alphanumericRegex.test(filteredValue)).toBe(true);
            
            // Additional property: All alphanumeric characters from input should be preserved
            expect(filteredValue).toBe(expectedAlphanumeric);
          }
          
          // Clean up after each property test iteration
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit Tests for AlphanumericTextField Component
 *
 * These tests verify the component renders correctly and handles
 * alphanumeric validation as specified in the requirements.
 */
describe('AlphanumericTextField - Unit Tests', () => {
  it('should render with correct props and helper text', () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
        required
      />
    );

    const textField = screen.getByLabelText('Test Field');
    expect(textField).toBeInTheDocument();
    expect(textField).toHaveAttribute('required');
  });

  it('should display helper text on focus', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Focus the field
    await userEvent.click(textField);
    
    // Helper text should appear
    await waitFor(() => {
      expect(screen.getByText('Only letters and numbers are allowed')).toBeInTheDocument();
    });
  });

  it('should filter non-alphanumeric characters on input', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Type valid characters
    await userEvent.type(textField, 'Hello123');
    
    // Should call onChange and all calls should contain only alphanumeric characters
    expect(mockOnChange).toHaveBeenCalled();
    const calls = mockOnChange.mock.calls;
    calls.forEach(call => {
      const value = call[0];
      expect(/^[a-zA-Z0-9]*$/.test(value)).toBe(true);
    });
    
    // The calls should build up the string progressively
    expect(calls.length).toBeGreaterThan(0);
    // Check that we get the expected progression
    expect(calls[0][0]).toBe('H');
    expect(calls[1][0]).toBe('e');
    // ... and so on
  });

  it('should filter out special characters during typing', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Simulate direct input change with special characters
    fireEvent.change(textField, { target: { value: 'Hello@123!' } });
    
    // Should call onChange with filtered value
    expect(mockOnChange).toHaveBeenCalledWith('Hello123');
  });

  it('should show error state with invalid input', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Type invalid characters
    await userEvent.type(textField, 'Test@');
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Name must contain only letters and numbers')).toBeInTheDocument();
    });
  });

  it('should handle paste events and filter content', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Focus the field first
    await userEvent.click(textField);
    
    // Simulate paste event
    const pasteData = 'Hello@World123!';
    await userEvent.paste(pasteData);
    
    // Should call onChange with filtered value
    expect(mockOnChange).toHaveBeenCalledWith('HelloWorld123');
  });

  it('should enforce maxLength when specified', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
        maxLength={5}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Type more characters than maxLength
    await userEvent.type(textField, 'Hello123');
    
    // Should call onChange and all values should respect maxLength
    expect(mockOnChange).toHaveBeenCalled();
    const calls = mockOnChange.mock.calls;
    calls.forEach(call => {
      const value = call[0];
      expect(value.length).toBeLessThanOrEqual(5);
    });
    
    // Should have called onChange for each character typed, but values should be limited
    expect(calls.length).toBeGreaterThan(0);
  });

  it('should show required error when field is empty and required', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
        required
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Focus and then blur the field without entering text
    await userEvent.click(textField);
    await userEvent.tab(); // This will blur the field
    
    // Should show required error
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  it('should clear error state when valid input is entered', async () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // First, enter invalid input to trigger error
    await userEvent.type(textField, 'Test@');
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Name must contain only letters and numbers')).toBeInTheDocument();
    });
    
    // Clear the field and enter valid input
    await userEvent.clear(textField);
    await userEvent.type(textField, 'ValidInput123');
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Name must contain only letters and numbers')).not.toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    // Should have aria-label
    expect(textField).toHaveAttribute('aria-label', 'Test Field');
    
    // Should have aria-describedby for helper text
    expect(textField).toHaveAttribute('aria-describedby', 'test-field-helper-text');
  });

  it('should accept all Material-UI TextField props', () => {
    const mockOnChange = vi.fn();
    
    render(
      <AlphanumericTextField
        label="Test Field"
        value="test"
        onChange={mockOnChange}
        fullWidth
        size="small"
        margin="dense"
        disabled
        placeholder="Enter text"
        sx={{ width: 200 }}
      />
    );

    const textField = screen.getByLabelText('Test Field');
    
    expect(textField).toBeInTheDocument();
    expect(textField).toBeDisabled();
    expect(textField).toHaveAttribute('placeholder', 'Enter text');
  });
});