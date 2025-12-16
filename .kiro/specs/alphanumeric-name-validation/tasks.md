# Implementation Plan

- [x] 1. Create validation infrastructure
  - Create AlphanumericTextField component with real-time input filtering and visual feedback
  - Create ValidationUtils module with centralized validation constants and functions
  - Implement alphanumeric regex pattern and filtering logic
  - Add proper Material-UI integration and accessibility support
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5_

- [x] 1.1 Write property test for alphanumeric input filtering
  - **Property 1: Alphanumeric input filtering**
  - **Validates: Requirements 1.1, 2.1, 3.1, 4.1**

- [ ]* 1.2 Write property test for real-time character prevention
  - **Property 2: Real-time character prevention**
  - **Validates: Requirements 1.2, 2.2, 3.2, 4.2**

- [ ]* 1.3 Write property test for consistent validation pattern
  - **Property 5: Consistent validation pattern**
  - **Validates: Requirements 5.1, 5.2**

- [ ]* 1.4 Write property test for paste filtering
  - **Property 11: Paste filtering**
  - **Validates: Requirements 6.5**

- [ ]* 1.5 Write unit tests for AlphanumericTextField component
  - Test component renders with correct props and helper text
  - Test onChange handler filters non-alphanumeric characters
  - Test error states appear and clear correctly
  - Test paste event filtering behavior
  - Test maxLength enforcement and required field validation
  - Test accessibility attributes and ARIA labels
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.5, 3.1, 3.2, 3.5, 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5_

- [ ]* 1.6 Write unit tests for ValidationUtils module
  - Test filterAlphanumeric function with various input strings
  - Test isAlphanumeric function with valid and invalid strings
  - Test regex pattern matches expected alphanumeric characters
  - Test validation message constants are defined correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Update session creation page
  - Replace session name TextField in CreateSessionPage with AlphanumericTextField
  - Remove existing toUnderscore transformation logic
  - Import and configure AlphanumericTextField with appropriate props
  - Maintain existing form submission and validation logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 2.1 Write property test for form submission validation
  - **Property 3: Form submission validation**
  - **Validates: Requirements 1.3, 2.3, 3.3, 4.3**

- [ ]* 2.2 Write property test for valid input acceptance
  - **Property 4: Valid input acceptance**
  - **Validates: Requirements 1.4, 2.4, 3.4, 4.4**

- [ ]* 2.3 Write unit tests for CreateSessionPage integration
  - Test session name field uses AlphanumericTextField component
  - Test form submission works with valid alphanumeric session names
  - Test form submission blocked with invalid session names
  - Test existing session creation functionality remains unchanged
  - Test helper text displays correctly on field focus
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Update empire joining page
  - Replace empire name, homeworld name, and starbase name TextFields in SessionWaitingTableRow with AlphanumericTextField
  - Remove existing handleItemChange sanitization logic
  - Update state setters to work directly with filtered values
  - Maintain existing form submission and abbreviation calculation logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 3.1 Write property test for consistent error messaging
  - **Property 6: Consistent error messaging**
  - **Validates: Requirements 5.3**

- [ ]* 3.2 Write property test for consistent helper text
  - **Property 7: Consistent helper text**
  - **Validates: Requirements 5.4**

- [ ]* 3.3 Write property test for immediate visual feedback
  - **Property 8: Immediate visual feedback**
  - **Validates: Requirements 6.1**

- [ ]* 3.4 Write property test for positive validation feedback
  - **Property 9: Positive validation feedback**
  - **Validates: Requirements 6.2**

- [ ]* 3.5 Write property test for error state clearing
  - **Property 10: Error state clearing**
  - **Validates: Requirements 6.3**

- [ ]* 3.6 Write unit tests for SessionWaitingTableRow integration
  - Test all three name fields use AlphanumericTextField component
  - Test empire joining works with valid alphanumeric names
  - Test empire joining blocked with invalid names
  - Test existing empire joining functionality remains unchanged
  - Test helper text displays correctly on all name fields
  - Test abbreviation calculation works with filtered empire names
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Verify existing functionality remains unchanged
  - Test session creation workflow with alphanumeric names
  - Test empire joining workflow with alphanumeric names
  - Verify all existing form validation and submission logic works
  - Verify UI styling and layout remains consistent
  - Test accessibility compliance with screen readers
  - _Requirements: 1.4, 2.4, 3.4, 4.4, 5.1, 5.2, 5.3, 5.4_

- [ ]* 4.1 Write integration tests for end-to-end workflows
  - Test complete session creation flow with alphanumeric validation
  - Test complete empire joining flow with alphanumeric validation
  - Test error recovery scenarios and user experience
  - Test paste behavior across different browsers and devices
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.5_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.