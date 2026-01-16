# Implementation Plan: Orders Syntax Overlay

## Overview

This implementation plan converts the syntax overlay design into discrete coding tasks. The approach builds incrementally, starting with grammar service enhancements, then context analysis, content generation, UI components, and finally OrdersPane integration. Each task builds on previous work and includes comprehensive testing to ensure the overlay enhances the user experience without disrupting existing functionality.

## Tasks

- [x] 1. Enhance GrammarService for command metadata extraction
  - Extend existing GrammarService to parse command definitions from PEG grammar
  - Add methods to extract command categories, parameters, and descriptions
  - Create interfaces for CommandDefinition and ParameterDefinition
  - Implement grammar rule parsing and metadata extraction logic
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 1.1 Write property test for grammar metadata extraction
  - **Property 6: Grammar integration consistency**
  - **Validates: Requirements 6.1, 6.2, 6.4, 6.5**

- [x] 2. Create OverlayContextAnalyzer service
  - Implement context analysis to determine overlay content type
  - Add logic to detect blank lines, comment lines, and command lines
  - Create methods to extract command names from text lines
  - Implement cursor position analysis for context determination
  - _Requirements: 3.1, 3.2, 4.1, 4.4, 4.5, 5.1_

- [ ]* 2.1 Write property test for context analysis
  - **Property 2: Context-aware content display**
  - **Validates: Requirements 3.1, 3.2, 4.1, 4.4, 4.5, 5.1**

- [x] 3. Implement OverlayContentGenerator service
  - Create service to generate formatted overlay content
  - Implement all-commands content generation with categorization
  - Add specific command syntax content generation
  - Create content formatting and organization logic
  - _Requirements: 3.3, 3.4, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 3.1 Write property test for content generation
  - **Property 3: Content organization and completeness**
  - **Validates: Requirements 3.3, 3.4, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 4. Create SyntaxOverlay UI component
  - Build React component for semi-translucent overlay display
  - Implement scrollable content area with custom scrollbar styling
  - Add header with title and visibility toggle button
  - Create content rendering for different overlay item types
  - _Requirements: 1.4, 1.5, 2.2, 2.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 4.1 Write property test for overlay UI behavior
  - **Property 7: Visual design and positioning**
  - **Validates: Requirements 1.4, 1.5, 2.4, 3.5, 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ]* 4.2 Write property test for scrolling functionality and scroll containment
  - **Property 4: Scrolling and content management**
  - **Validates: Requirements 1.4, 2.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 5. Checkpoint - Ensure core overlay services are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate overlay system with OrdersPane
  - Add overlay state management to OrdersPane component
  - Implement overlay position calculation within text area
  - Add overlay content updates based on cursor position changes
  - Integrate with existing text change and cursor change handlers
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 5.1, 5.2, 7.1, 7.4, 7.5_

- [ ]* 6.1 Write property test for OrdersPane integration
  - **Property 1: Overlay visibility and non-intrusive behavior**
  - **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 7.1, 7.2, 7.4, 7.5**

- [x] 7. Implement overlay visibility controls and session persistence

  - Add toggle functionality for overlay visibility
  - Implement session storage for visibility preference
  - Add visual feedback for toggle state changes
  - Create state restoration logic for overlay content and scroll position
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ]* 7.1 Write property test for session state persistence
  - **Property 8: Session state persistence**
  - **Validates: Requirements 2.3, 2.4, 2.5**

- [x] 8. Add performance optimizations and responsiveness
  - Implement debouncing for overlay content updates
  - Add performance monitoring for update timing requirements
  - Optimize content generation for large command sets
  - Ensure overlay updates don't interrupt typing flow
  - _Requirements: 5.3, 5.5, 7.2_

- [ ]* 8.1 Write property test for performance requirements
  - **Property 5: Performance and responsiveness**
  - **Validates: Requirements 5.3, 5.5, 7.2**

- [x] 9. Implement error handling and fallback mechanisms
  - Add error boundaries for overlay component rendering
  - Implement fallback content for grammar parsing failures
  - Create graceful degradation for service unavailability
  - Add error logging and recovery mechanisms
  - _Requirements: 6.3, 7.3_

- [ ]* 9.1 Write unit tests for error handling scenarios
  - Test grammar parsing failures and fallback behavior
  - Test component error boundaries and recovery
  - _Requirements: 6.3, 7.3_

- [x] 10. Ensure compatibility with existing OrdersPane features
  - Test overlay with existing autocomplete functionality
  - Verify compatibility with validation indicators
  - Ensure helper text system works with overlay active
  - Test all existing OrdersPane interactions and workflows
  - _Requirements: 7.3, 7.5_

- [ ]* 10.1 Write property test for feature compatibility
  - **Property 9: Compatibility with existing features**
  - **Validates: Requirements 7.3, 7.5**

- [x] 11. Add visual polish and smooth transitions
  - Implement smooth animations for overlay state changes
  - Add transition effects for content updates
  - Optimize overlay positioning and sizing
  - Ensure consistent visual hierarchy across content types
  - _Requirements: 5.4, 8.4, 8.5_

- [ ]* 11.1 Write unit tests for visual transitions
  - Test CSS transition properties and timing
  - Test animation behavior during state changes
  - _Requirements: 5.4, 8.5_

- [x] 12. Checkpoint - Ensure complete integration is working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Comprehensive testing and validation
  - Run full test suite including property-based tests
  - Test overlay behavior across different screen sizes
  - Validate performance requirements with large command sets
  - Test accessibility features and keyboard navigation
  - _Requirements: All requirements integration_

- [ ]* 13.1 Write integration tests for complete workflows
  - Test complete overlay workflow from cursor movement to content display
  - Test overlay behavior with real grammar file and command definitions
  - Test performance with realistic order text sizes

- [x] 14. Fix scroll containment and pointer events in SyntaxOverlay component
  - **CRITICAL**: Add `e.stopPropagation()` to the onWheel event handler to prevent scroll events from reaching browser window
  - Add overscrollBehavior: 'contain' and overscrollBehaviorY: 'contain' CSS properties to the scrollable content area
  - Ensure the onWheel handler works for ALL content types (all-commands, specific-command, AND partial-commands)
  - Verify that when typing "DE" and seeing DEPLOY/DESTRUCT/DESIGN commands, scrolling works within overlay only
  - Test that scrollbar is visible and functional when content exceeds container height in all scenarios
  - Confirm pointerEvents are properly configured to allow scrolling within content area
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 15. Final polish and optimization
  - Optimize overlay rendering performance
  - Add accessibility attributes and ARIA labels
  - Implement keyboard shortcuts for overlay control
  - Add comprehensive error logging and debugging support
  - _Requirements: All requirements integration_

- [x] 16. Final checkpoint - Ensure all functionality is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and quality
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- All new functionality is additive and preserves existing OrdersPane behavior
- TypeScript is used throughout for type safety and maintainability
- The overlay system integrates with existing grammar parsing infrastructure
- Performance requirements are validated through automated testing
- Error handling ensures graceful degradation when services are unavailable