# Design Document: Alphanumeric Name Validation

## Overview

This design adds comprehensive input validation to ensure all player-entered names (session names, empire names, starbase names, and homeworld names) contain only alphanumeric characters (A-Z, a-z, 0-9). The validation will be implemented as a reusable component that provides real-time input filtering, visual feedback, and consistent error handling across all name input fields in the Star Empires application.

The feature builds upon existing validation patterns found in ShipDesignPage.tsx and extends them to all name input scenarios during session creation and empire joining workflows.

## Architecture

### High-Level Architecture

The alphanumeric validation system follows a component-based approach:

1. **Validation Component**: A reusable `AlphanumericTextField` component that wraps Material-UI TextField
2. **Input Filtering**: Real-time character filtering using onChange handlers
3. **Visual Feedback**: Immediate error states and helper text display
4. **Form Integration**: Seamless integration with existing form submission logic

### Component Interaction Flow

```
User Types Character
    ↓
AlphanumericTextField.onChange()
    ↓
Filter Non-Alphanumeric Characters
    ↓
Update Input Value (Filtered)
    ↓
Validate Current Value
    ↓
Update Visual State (Error/Success)
    ↓
Display Helper Text/Error Message
```

## Components and Interfaces

### 1. AlphanumericTextField Component

**File**: `src/components/common/AlphanumericTextField.tsx` (new file)

**Purpose**: Reusable text field component with built-in alphanumeric validation

**Component Interface**:
```typescript
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

export default function AlphanumericTextField(props: AlphanumericTextFieldProps): JSX.Element
```

**Implementation Details**:

- Uses Material-UI TextField as base component
- Implements real-time character filtering using regex: `/[^a-zA-Z0-9]/g`
- Shows helper text: "Only letters and numbers are allowed"
- Displays error state when invalid characters are detected
- Supports paste event filtering
- Maintains all standard TextField props for compatibility

**Key Features**:
- Real-time input filtering (prevents invalid characters from appearing)
- Visual error states with red border and error text
- Consistent helper text across all instances
- Paste event handling with character filtering
- Support for maxLength validation
- Accessibility compliance with proper ARIA labels

### 2. Updated CreateSessionPage

**File**: `src/pages/CreateSessionPage.tsx`

**Purpose**: Replace session name TextField with AlphanumericTextField

**Changes**:
- Import AlphanumericTextField component
- Replace existing TextField for session name with AlphanumericTextField
- Remove existing `toUnderscore` transformation (handled by component)
- Maintain existing form submission logic

**Updated JSX**:
```tsx
<AlphanumericTextField
  required
  label="Session Name"
  value={sessionName}
  onChange={setSessionName}
  size="small"
  margin="dense"
  sx={{ width: 280 }}
  maxLength={50}
/>
```

### 3. Updated SessionWaitingTableRow

**File**: `src/pages/SessionWaitingTableRow.tsx`

**Purpose**: Replace empire, homeworld, and starbase name TextFields with AlphanumericTextField

**Changes**:
- Import AlphanumericTextField component
- Replace all three TextField components (empire, homeworld, starbase) with AlphanumericTextField
- Remove existing `handleItemChange` sanitization logic (handled by component)
- Update state setters to work directly with filtered values
- Maintain existing form submission and abbreviation logic

**Updated JSX**:
```tsx
<AlphanumericTextField
  required
  label="Empire Name"
  value={empireName}
  onChange={setEmpireName}
  size="small"
  margin="dense"
  sx={{ maxWidth: 200 }}
  maxLength={30}
/>

<AlphanumericTextField
  required
  label="Homeworld Name"
  value={homeworldName}
  onChange={setHomeworldName}
  size="small"
  margin="dense"
  sx={{ maxWidth: 200 }}
  maxLength={30}
/>

<AlphanumericTextField
  required
  label="Starbase Name"
  value={starbaseName}
  onChange={setStarbaseName}
  size="small"
  margin="dense"
  sx={{ maxWidth: 200 }}
  maxLength={30}
/>
```

### 4. Validation Utilities

**File**: `src/components/common/ValidationUtils.ts` (new file)

**Purpose**: Centralized validation logic and constants

**Exports**:
```typescript
// Regular expression for alphanumeric validation
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]*$/;

// Function to filter non-alphanumeric characters
export const filterAlphanumeric = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9]/g, '');
};

// Function to validate alphanumeric string
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
```

## Data Models

### Existing Models (No Schema Changes Required)

The validation is purely client-side and does not require any changes to existing data models or database schemas. All existing data structures remain unchanged:

**Session Model** (DynamoDB):
```typescript
{
  name: string; // Now guaranteed to be alphanumeric
  sessionId: string;
  status: string;
  // ... other fields unchanged
}
```

**Empire Model** (DynamoDB):
```typescript
{
  name: string; // Now guaranteed to be alphanumeric
  playerName: string;
  sessionName: string;
  homeworldName: string; // Now guaranteed to be alphanumeric
  starbaseName: string; // Now guaranteed to be alphanumeric
  // ... other fields unchanged
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Alphanumeric input filtering
*For any* string input to a name field, only alphanumeric characters should remain in the field value after input processing
**Validates: Requirements 1.1, 2.1, 3.1, 4.1**

### Property 2: Real-time character prevention
*For any* non-alphanumeric character typed in a name field, the character should not appear in the input field value
**Validates: Requirements 1.2, 2.2, 3.2, 4.2**

### Property 3: Form submission validation
*For any* form containing name fields with invalid characters, the form submission should be prevented and an error message should be displayed
**Validates: Requirements 1.3, 2.3, 3.3, 4.3**

### Property 4: Valid input acceptance
*For any* valid alphanumeric string entered in a name field, the form should allow successful submission
**Validates: Requirements 1.4, 2.4, 3.4, 4.4**

### Property 5: Consistent validation pattern
*For any* name input field in the application, the same alphanumeric validation regex pattern should be applied
**Validates: Requirements 5.1, 5.2**

### Property 6: Consistent error messaging
*For any* name input field displaying an error, the error message text should be identical across all field types
**Validates: Requirements 5.3**

### Property 7: Consistent helper text
*For any* name input field displaying helper text, the guidance text should be identical across all field types
**Validates: Requirements 5.4**

### Property 8: Immediate visual feedback
*For any* invalid character entry in a name field, visual error indicators should appear immediately
**Validates: Requirements 6.1**

### Property 9: Positive validation feedback
*For any* valid alphanumeric input in a name field, positive visual indicators should be displayed
**Validates: Requirements 6.2**

### Property 10: Error state clearing
*For any* name field in an error state, clearing the invalid input should immediately remove error indicators
**Validates: Requirements 6.3**

### Property 11: Paste filtering
*For any* text pasted into a name field containing non-alphanumeric characters, only the alphanumeric characters should remain in the field
**Validates: Requirements 6.5**

## Error Handling

### Input Validation Errors

**Error Types**:
1. `INVALID_CHARACTER`: Non-alphanumeric character entered
2. `EMPTY_REQUIRED_FIELD`: Required field left empty
3. `EXCEEDS_MAX_LENGTH`: Input exceeds maximum allowed length

**Error Handling Strategy**:
- Real-time validation prevents invalid characters from appearing
- Visual error states with red borders and error text
- Helper text provides guidance on valid input format
- Form submission blocked until all validation passes
- No console errors or exceptions thrown for normal validation failures

### Visual Error States

**Error Indicators**:
- Red border around input field
- Error text displayed below field
- Error icon in input field (Material-UI standard)
- Submit button disabled when validation fails

**Success Indicators**:
- Green border around input field (optional)
- Success icon in input field (optional)
- Submit button enabled when all validation passes

### Paste Event Handling

**Paste Behavior**:
- Intercept paste events on name input fields
- Filter pasted content to remove non-alphanumeric characters
- Update field value with filtered content
- Show temporary notification if characters were filtered
- Maintain cursor position after filtering

## Testing Strategy

### Test Organization

All test files will be organized in the `tests/` directory:
- `tests/components/common/AlphanumericTextField.test.tsx` - Tests for the validation component
- `tests/components/common/ValidationUtils.test.ts` - Tests for validation utilities
- `tests/pages/CreateSessionPage.test.tsx` - Integration tests for session creation
- `tests/pages/SessionWaitingTableRow.test.tsx` - Integration tests for empire joining

### Test Runner Configuration

The project uses **Vitest** as the test runner with **fast-check** for property-based testing:
- Test environment: jsdom (for React component testing)
- Property tests run minimum 100 iterations
- Mock Material-UI components for consistent testing

### Unit Testing

**AlphanumericTextField Tests**:
- Test component renders with correct props
- Test onChange handler filters non-alphanumeric characters
- Test helper text displays correctly
- Test error states appear with invalid input
- Test paste event filtering
- Test maxLength enforcement
- Test required field validation
- Test accessibility attributes

**ValidationUtils Tests**:
- Test filterAlphanumeric function with various inputs
- Test isAlphanumeric function with valid/invalid strings
- Test regex pattern matches expected characters
- Test validation message constants

**Integration Tests**:
- Test CreateSessionPage uses AlphanumericTextField for session name
- Test SessionWaitingTableRow uses AlphanumericTextField for all name fields
- Test form submission behavior with valid/invalid names
- Test existing functionality remains unchanged

### Property-Based Testing

Property-based tests will use **fast-check** library with custom generators:

**Test Data Generators**:
```typescript
// Generator for alphanumeric strings
const alphanumericArb = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
  { minLength: 1, maxLength: 50 }
);

// Generator for strings with non-alphanumeric characters
const nonAlphanumericArb = fc.string().filter(s => 
  s.length > 0 && !/^[a-zA-Z0-9]*$/.test(s)
);

// Generator for mixed strings
const mixedStringArb = fc.string({ minLength: 1, maxLength: 100 });

// Generator for name field types
const nameFieldTypeArb = fc.constantFrom(
  'sessionName', 'empireName', 'homeworldName', 'starbaseName'
);
```

**Property Test Structure**:
```typescript
// Example property test
it('Property 1: Alphanumeric input filtering', () => {
  fc.assert(
    fc.property(mixedStringArb, (input) => {
      // Setup: Render AlphanumericTextField
      // Act: Simulate user input
      // Assert: Only alphanumeric characters remain
    }),
    { numRuns: 100 }
  );
});
```

### Manual Testing Checklist

1. Session creation with alphanumeric session name works ✓
2. Session creation with special characters filters input ✓
3. Empire joining with alphanumeric names works ✓
4. Empire joining with special characters filters input ✓
5. Helper text appears on field focus ✓
6. Error states appear with invalid input ✓
7. Error states clear when input becomes valid ✓
8. Paste events filter non-alphanumeric characters ✓
9. Form submission blocked with invalid names ✓
10. Existing functionality remains unchanged ✓

## Implementation Notes

### Performance Considerations

1. **Real-time Filtering**: Character filtering on every keystroke has minimal performance impact
2. **Regex Performance**: Simple alphanumeric regex is highly optimized
3. **Component Reuse**: Single component reduces bundle size compared to duplicated logic
4. **Memory Usage**: No significant memory overhead from validation logic

### Accessibility Considerations

1. **ARIA Labels**: Proper labeling for screen readers
2. **Error Announcements**: Error messages announced to assistive technology
3. **Keyboard Navigation**: Full keyboard accessibility maintained
4. **Color Contrast**: Error states meet WCAG contrast requirements
5. **Focus Management**: Logical tab order preserved

### Browser Compatibility

1. **Regex Support**: Alphanumeric regex supported in all modern browsers
2. **Paste Events**: Clipboard API support for paste filtering
3. **Material-UI**: Component inherits Material-UI browser support
4. **Input Events**: Standard input event handling across browsers

### Future Enhancements

1. **Custom Validation Rules**: Support for different character sets per field type
2. **Internationalization**: Support for non-English alphanumeric characters
3. **Advanced Filtering**: Support for spaces, hyphens, or underscores in specific contexts
4. **Validation Presets**: Predefined validation rules for common use cases
5. **Real-time Suggestions**: Auto-suggest valid alternatives for invalid input

## Dependencies

### External Libraries
- `@mui/material`: Already in use for TextField component
- `react`: Already in use for component development
- `fast-check`: Already in use for property-based testing

### Internal Dependencies
- Existing Material-UI theme and styling
- Existing form submission logic in CreateSessionPage and SessionWaitingTableRow
- Existing test infrastructure and setup

### No New Dependencies Required
- All validation logic uses standard JavaScript regex
- No additional npm packages needed
- Builds on existing Material-UI patterns

## Migration Strategy

### Phase 1: Create Validation Infrastructure
1. Create AlphanumericTextField component
2. Create ValidationUtils module
3. Add unit tests for new components
4. Verify component works in isolation

### Phase 2: Update Session Creation
1. Replace TextField in CreateSessionPage with AlphanumericTextField
2. Remove existing toUnderscore transformation
3. Add integration tests for session creation
4. Verify existing session creation functionality

### Phase 3: Update Empire Joining
1. Replace TextFields in SessionWaitingTableRow with AlphanumericTextField
2. Remove existing handleItemChange sanitization
3. Add integration tests for empire joining
4. Verify existing empire joining functionality

### Phase 4: Testing and Refinement
1. Add property-based tests for all validation scenarios
2. Perform manual testing across all affected workflows
3. Verify accessibility compliance
4. Refine error messages and visual feedback

### Rollback Plan
- New component can be easily replaced with standard TextField
- Validation logic is contained within single component
- No database or API changes required for rollback
- Existing functionality preserved during migration

## Code Changes Summary

### Files to Create

1. **src/components/common/AlphanumericTextField.tsx**
   - Reusable validation component
   - Real-time input filtering
   - Consistent error handling and visual feedback

2. **src/components/common/ValidationUtils.ts**
   - Centralized validation constants and functions
   - Regex patterns and validation messages
   - Maximum length constants

### Files to Modify

1. **src/pages/CreateSessionPage.tsx**
   - Replace session name TextField with AlphanumericTextField
   - Remove toUnderscore transformation
   - Import new validation component

2. **src/pages/SessionWaitingTableRow.tsx**
   - Replace all three name TextFields with AlphanumericTextField
   - Remove handleItemChange sanitization logic
   - Import new validation component

### Files to Create for Testing

1. **tests/components/common/AlphanumericTextField.test.tsx**
   - Unit tests for validation component
   - Property-based tests for input filtering

2. **tests/components/common/ValidationUtils.test.ts**
   - Unit tests for validation utilities
   - Property-based tests for validation functions

### No Changes Required

- Database schemas or data models
- API endpoints or backend logic
- Existing form submission workflows
- Other UI components or pages
- Amplify configuration or authentication