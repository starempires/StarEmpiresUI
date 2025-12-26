# Implementation Plan

- [x] 1. Add boolean properties infrastructure to CreateSessionPage
  - Add BooleanSessionPropertyDef interface with key, name, and defaultValue fields
  - Add BOOLEAN_SESSION_PROPERTIES configuration with localizeFramesOfReference property
  - Add BOOLEAN_SESSION_PROPERTIES_LIST array for iteration
  - Add booleanConfigValues state management with default value initialization
  - Import Material-UI Switch and FormControlLabel components
  - _Requirements: 1.5, 2.4, 3.1, 5.2, 5.4_

- [x] 1.1 Write property test for default value initialization
  - **Property 3: Default value initialization**
  - **Validates: Requirements 1.5, 5.4**

- [x] 1.2 Write property test for boolean value validation
  - **Property 7: Boolean value validation**
  - **Validates: Requirements 5.5**

- [ ]* 1.3 Write unit tests for boolean properties infrastructure
  - Test BooleanSessionPropertyDef interface structure
  - Test BOOLEAN_SESSION_PROPERTIES configuration contains localizeFramesOfReference
  - Test booleanConfigValues state initializes with correct default values
  - Test state management functions work correctly
  - _Requirements: 1.5, 2.4, 3.1, 5.2, 5.4_

- [x] 2. Implement boolean properties UI section
  - Add "Boolean Properties" subsection header in Session Parameters
  - Implement Switch components for each boolean property using Grid layout
  - Add FormControlLabel with proper labeling and layout
  - Use Paper variant="outlined" for consistent styling with integer properties
  - Implement toggle event handlers to update booleanConfigValues state
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [x] 2.1 Write property test for boolean toggle state synchronization
  - **Property 1: Boolean toggle state synchronization**
  - **Validates: Requirements 1.2, 2.2, 2.3**

- [x] 2.2 Write property test for visual state reflection
  - **Property 5: Visual state reflection**
  - **Validates: Requirements 4.3**

- [ ]* 2.3 Write unit tests for boolean properties UI
  - Test boolean properties section renders with correct header
  - Test Switch components render for each boolean property
  - Test FormControlLabel displays correct property names
  - Test toggle interactions update state correctly
  - Test UI layout and styling consistency
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [ ] 3. Integrate boolean properties with session creation API
  - Update handleSubmit function to include boolean properties in overrideProperties
  - Implement boolean to string conversion ("true"/"false")
  - Combine integer and boolean properties into single overrideProperties object
  - Maintain existing session creation workflow and error handling
  - _Requirements: 1.3, 1.4, 2.5, 6.1, 6.2_

- [ ] 3.1 Write property test for boolean to string conversion
  - **Property 2: Boolean to string conversion**
  - **Validates: Requirements 1.4**

- [ ] 3.2 Write property test for complete property inclusion in API calls
  - **Property 4: Complete property inclusion in API calls**
  - **Validates: Requirements 1.3, 2.5**

- [ ] 3.3 Write property test for combined properties in API
  - **Property 8: Combined properties in API**
  - **Validates: Requirements 6.2**

- [ ]* 3.4 Write unit tests for API integration
  - Test handleSubmit includes boolean properties in overrideProperties
  - Test boolean values converted to strings correctly
  - Test both integer and boolean properties included in API call
  - Test existing session creation functionality remains unchanged
  - Test error handling works with boolean properties
  - _Requirements: 1.3, 1.4, 2.5, 6.1, 6.2_

- [x] 4. Verify scalability and extensibility
  - Test system handles arbitrary number of boolean properties
  - Verify new boolean properties can be added via configuration only
  - Ensure existing functionality preservation with boolean properties
  - Test form validation works with boolean properties
  - _Requirements: 5.1, 5.3, 6.1, 6.5_

- [x] 4.1 Write property test for scalable property handling
  - **Property 6: Scalable property handling**
  - **Validates: Requirements 5.3**

- [x] 4.2 Write property test for existing functionality preservation
  - **Property 9: Existing functionality preservation**
  - **Validates: Requirements 6.1, 6.5**

- [ ]* 4.3 Write integration tests for extensibility
  - Test adding multiple boolean properties to configuration
  - Test system handles empty boolean properties configuration
  - Test boolean properties don't interfere with integer properties
  - Test form validation includes boolean property validation
  - Test session creation workflow remains unchanged
  - _Requirements: 5.1, 5.3, 6.1, 6.5_

- [x] 5. Final verification and testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5.1 Write end-to-end integration tests
  - Test complete session creation workflow with boolean properties
  - Test localizeFramesOfReference toggle functionality end-to-end
  - Test error scenarios and recovery with boolean properties
  - Test accessibility compliance with Switch components
  - Test browser compatibility across different environments
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4_