# Implementation Plan

- [x] 1. Create Authorization Service
  - Create `src/services/AuthorizationService.ts` with core authorization logic
  - Implement `canAccessEmpire()` method to check empire ownership and GM status
  - Implement `isGameMaster()` helper method to check if user is GM for a session
  - Return structured authorization results with reasons for denial
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [x] 1.1 Write property test for owner access validation
  - **Property 1: Owner access validation**
  - **Validates: Requirements 1.1**

- [x] 1.2 Write property test for unauthorized access denial
  - **Property 2: Unauthorized access denial**
  - **Validates: Requirements 1.2, 3.2**

- [x] 1.3 Write property test for GM universal access
  - **Property 4: GM universal access within session**
  - **Validates: Requirements 2.1**

- [x] 1.4 Write property test for GM session boundary
  - **Property 5: GM session boundary**
  - **Validates: Requirements 2.2**

- [x] 1.5 Write property test for error message security
  - **Property 6: Error message security**
  - **Validates: Requirements 4.2**

- [x] 1.6 Write unit tests for AuthorizationService
  - Test canAccessEmpire with various ownership scenarios
  - Test isGameMaster with GM and non-GM users
  - Test error handling for missing sessions/empires
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Create custom authorization hook
  - Create `src/hooks/useAuthorization.ts` hook for components
  - Implement loading, authorized, and error states
  - Call AuthorizationService and handle results
  - Re-run authorization when sessionName or empireName changes
  - _Requirements: 1.1, 1.4, 3.1, 3.3_

- [x] 2.1 Write property test for re-authorization on navigation
  - **Property 3: Re-authorization on navigation**
  - **Validates: Requirements 1.4, 3.1**

- [x] 2.2 Write unit tests for useAuthorization hook
  - Test hook with authorized access
  - Test hook with unauthorized access
  - Test loading states
  - Test re-authorization on parameter changes
  - _Requirements: 1.4, 3.1_

- [x] 3. Create Unauthorized error page
  - Create `src/pages/UnauthorizedPage.tsx` component
  - Display user-friendly error message based on failure reason
  - Add "Return to Sessions" button linking to home page
  - Ensure no sensitive information is exposed in error messages
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Create ProtectedRoute component
  - Create `src/components/auth/ProtectedRoute.tsx` wrapper component
  - Accept `requiresEmpireAccess` and `staticPage` props
  - Check authentication status first, redirect to login if not authenticated
  - For empire pages, extract sessionName and empireName from URL params
  - Call useAuthorization hook for empire access validation
  - Show loading state during authorization check
  - Render children if authorized, redirect to UnauthorizedPage if not
  - Bypass empire checks for static pages (only check authentication)
  - _Requirements: 1.1, 1.2, 3.1, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3_

- [x] 4.1 Write property test for unauthenticated redirect
  - **Property 10: Unauthenticated redirect**
  - **Validates: Requirements 7.1, 7.2, 7.4**

- [x] 4.2 Write property test for static page access
  - **Property 11: Static page access**
  - **Validates: Requirements 8.1, 8.2**

- [x] 4.3 Write property test for page type distinction
  - **Property 12: Page type distinction**
  - **Validates: Requirements 8.3**

- [x] 4.4 Write unit tests for ProtectedRoute component
  - Test rendering with authorized access
  - Test redirect on unauthorized access
  - Test redirect on unauthenticated access
  - Test loading state display
  - Test static page bypass
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 8.1_

- [x] 5. Update App.tsx routing configuration
  - Import ProtectedRoute component
  - Wrap empire-specific routes (MapPage, NewsPage, MessagesPage, ShipClassesPage) with ProtectedRoute
  - Set `requiresEmpireAccess={true}` for empire routes
  - Wrap HomePage (session view) with ProtectedRoute (authentication only)
  - Mark static routes (ShipDesignPage, CreateSessionPage) with `staticPage={true}`
  - Add route for UnauthorizedPage at `/unauthorized`
  - _Requirements: 1.1, 1.2, 7.1, 7.2, 8.1, 8.2_

- [x] 6. Update HomePage session filtering
  - Modify session loading logic to filter based on player's empires
  - Ensure only sessions where player has an empire are displayed
  - Ensure only empires the player controls or can access as GM are shown
  - Verify GM sees all empires in their managed sessions
  - _Requirements: 6.1, 6.2_

- [x] 6.1 Write property test for session view filtering
  - **Property 7: Session view filtering**
  - **Validates: Requirements 6.1**

- [x] 6.2 Write property test for empire list filtering
  - **Property 8: Empire list filtering**
  - **Validates: Requirements 6.2**

- [x] 6.3 Write property test for session view consistency
  - **Property 9: Session view consistency**
  - **Validates: Requirements 6.3**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Manual testing and refinement
  - Test login as regular player accessing owned empire
  - Test login as regular player attempting to access non-owned empire
  - Test login as GM accessing empires in managed session
  - Test login as GM attempting to access empire in other session
  - Test accessing empire view without authentication
  - Test URL manipulation and browser back/forward buttons
  - Test static page access while authenticated
  - Verify session view shows only relevant sessions and empires
  - _Requirements: All_

- [x] 9. Add installation of fast-check for property-based testing
  - Install fast-check library: `npm install --save-dev fast-check @types/fast-check`
  - Configure test setup to use fast-check
  - _Requirements: Testing infrastructure_
