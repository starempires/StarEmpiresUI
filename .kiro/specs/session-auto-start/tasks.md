# Implementation Plan

- [x] 1. Add session capacity checking functions to ClientFunctions
  - Add `countActiveEmpires(sessionName)` function that counts empires with empireType ACTIVE or NPC
  - Add `checkSessionCapacity(sessionName)` function that returns isFull, activeEmpireCount, and capacity
  - Use existing `getEmpiresForSession()` and `getSession()` functions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 1.1 Write property test for active empire counting
  - **Property 1: Active empire counting accuracy**
  - **Validates: Requirements 5.1**

- [x] 1.2 Write property test for capacity checking
  - **Property 14: Capacity field usage**
  - **Validates: Requirements 5.5**

- [x] 1.3 Write unit tests for capacity functions
  - Test `countActiveEmpires()` with various empire type configurations
  - Test `checkSessionCapacity()` with full and partial sessions
  - Test error handling for missing sessions
  - _Requirements: 5.1, 5.5_

- [x] 2. Add auto-start orchestration function to ClientFunctions
  - Add `attemptAutoStart(sessionName)` function that orchestrates the auto-start process
  - Check if session is in WAITING_FOR_PLAYERS status
  - Call `checkSessionCapacity()` to verify session is full
  - Update session status to READY_TO_START using existing `updateSessionStatus()`
  - Call `startSession()` from SessionAPI to initialize backend session state
  - Call `generateSnapshots()` from SessionAPI for turn 0
  - Handle errors and return success/failure result
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 9.1, 9.2, 9.3_

- [ ]* 2.1 Write property test for auto-transition on capacity
  - **Property 2: Auto-transition on capacity**
  - **Validates: Requirements 1.2**

- [ ]* 2.2 Write property test for backend session initialization
  - **Property 3: Backend session initialization**
  - **Validates: Requirements 1.3**

- [ ]* 2.3 Write property test for snapshot generation trigger
  - **Property 4: Snapshot generation trigger**
  - **Validates: Requirements 1.4**

- [ ]* 2.4 Write property test for status preservation when not full
  - **Property 6: Status preservation when not full**
  - **Validates: Requirements 1.6**

- [ ]* 2.5 Write property test for auto-start guard condition
  - **Property 29: Auto-start guard condition**
  - **Validates: Requirements 9.3**

- [ ]* 2.6 Write property test for capacity check timing
  - **Property 27: Capacity check timing**
  - **Validates: Requirements 9.1**

- [ ]* 2.7 Write property test for fresh data for capacity check
  - **Property 28: Fresh data for capacity check**
  - **Validates: Requirements 9.2**

- [ ]* 2.8 Write property test for backend initialization before snapshots
  - **Property 30: Backend initialization before snapshots**
  - **Validates: Requirements 1.3, 1.4**

- [ ]* 2.9 Write unit tests for auto-start orchestration
  - Test `attemptAutoStart()` with full sessions
  - Test `attemptAutoStart()` with partial sessions
  - Test status transition from WAITING_FOR_PLAYERS to READY_TO_START
  - Test startSession is called before snapshot generation
  - Test snapshot generation is triggered after startSession
  - Test error handling for startSession failures
  - Test error handling for snapshot failures
  - Test error handling for status update failures
  - Test that auto-start skips non-WAITING_FOR_PLAYERS sessions
  - _Requirements: 1.2, 1.3, 1.4, 1.6, 9.3_

- [x] 3. Add error handling properties to auto-start function
  - Implement error handling for startSession failures
  - Implement error handling for snapshot generation failures
  - Implement error handling for status update failures
  - Ensure session remains in consistent state on errors
  - Return detailed error information in result object
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 3.1 Write property test for error handling preserves state
  - **Property 16: Error handling preserves state**
  - **Validates: Requirements 6.1**

- [ ]* 3.2 Write property test for status update failure prevents snapshots
  - **Property 17: Status update failure prevents snapshots**
  - **Validates: Requirements 6.2**

- [ ]* 3.3 Write property test for error reporting
  - **Property 18: Error reporting**
  - **Validates: Requirements 6.3**

- [ ]* 3.4 Write property test for system recovery after errors
  - **Property 19: System recovery after errors**
  - **Validates: Requirements 6.4**

- [ ]* 3.5 Write unit tests for error handling
  - Test error handling when startSession fails
  - Test error handling when snapshot generation fails
  - Test error handling when status update fails
  - Test that errors are returned in result object
  - Test that session remains in valid state after errors
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4. Update SessionWaitingTableRow to trigger auto-start
  - After successful empire registration, call `attemptAutoStart()`
  - Display processing state during auto-start
  - Show success/error messages based on auto-start result
  - Refresh session list after auto-start completes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1_

- [ ]* 4.1 Write unit tests for SessionWaitingTableRow auto-start integration
  - Test that auto-start is called after successful registration
  - Test that processing state is displayed during auto-start
  - Test that error messages are displayed on failure
  - Test that session list refreshes after auto-start
  - _Requirements: 1.2, 9.1_

- [x] 5. Create useSessionAccess hook for access control
  - Create `src/hooks/useSessionAccess.ts` hook
  - Accept sessionName, empireName, sessionStatus, and playerName parameters
  - Determine if player is GM using existing `getGMEmpireForPlayer()`
  - Return canAccessMap, showWaitingMessage, waitingMessageText, and isGM
  - Implement logic: GM always has access, non-GM has access only in IN_PROGRESS
  - _Requirements: 2.1, 2.2, 3.1, 3.3, 3.4_

- [ ]* 5.1 Write property test for GM map access in READY_TO_START
  - **Property 7: GM map access in READY_TO_START**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 5.2 Write property test for non-GM waiting message in READY_TO_START
  - **Property 8: Non-GM waiting message in READY_TO_START**
  - **Validates: Requirements 3.1**

- [ ]* 5.3 Write property test for non-GM map access in IN_PROGRESS
  - **Property 9: Non-GM map access in IN_PROGRESS**
  - **Validates: Requirements 3.3**

- [ ]* 5.4 Write property test for no navigation with waiting message
  - **Property 10: No navigation with waiting message**
  - **Validates: Requirements 3.4**

- [ ]* 5.5 Write unit tests for useSessionAccess hook
  - Test GM access in all session statuses
  - Test non-GM access based on session status
  - Test waiting message display logic
  - Test access control for different player roles
  - _Requirements: 2.1, 3.1, 3.3_

- [x] 6. Update SessionTableRow to use access control
  - Import and use `useSessionAccess` hook
  - For READY_TO_START sessions: show links for GM, waiting message for non-GM
  - For IN_PROGRESS sessions: show active links for all players
  - Display "Waiting for GM to start session" message when showWaitingMessage is true
  - Ensure links and messages are mutually exclusive
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 7.4_

- [ ]* 6.1 Write property test for link and message mutual exclusivity
  - **Property 23: Link and message mutual exclusivity**
  - **Validates: Requirements 7.4**

- [ ]* 6.2 Write unit tests for SessionTableRow access control
  - Test GM sees links in READY_TO_START
  - Test non-GM sees waiting message in READY_TO_START
  - Test all players see links in IN_PROGRESS
  - Test waiting message content
  - _Requirements: 2.1, 3.1, 3.3_

- [x] 7. Add manual session start function to ClientFunctions
  - Add `startSessionManually(sessionId, sessionName)` function
  - Verify session is in READY_TO_START status using existing `getSession()`
  - Update session status to IN_PROGRESS using existing `updateSessionStatus()`
  - Optionally call backend `startSession()` from SessionAPI if needed
  - Return success/failure result
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 7.1 Write property test for manual start transition
  - **Property 12: Manual start transition**
  - **Validates: Requirements 4.2**

- [ ]* 7.2 Write property test for universal access after start
  - **Property 13: Universal access after start**
  - **Validates: Requirements 4.3**

- [ ]* 7.3 Write property test for no status regression
  - **Property 14: No status regression**
  - **Validates: Requirements 4.4**

- [ ]* 7.4 Write unit tests for manual session start
  - Test `startSessionManually()` transitions READY_TO_START to IN_PROGRESS
  - Test that IN_PROGRESS sessions cannot revert to READY_TO_START
  - Test error handling for invalid status transitions
  - _Requirements: 4.2, 4.4_

- [x] 8. Add "Start Session" button for GM in SessionTableRow
  - Display "Start Session" button for GM when session status is READY_TO_START
  - Call `startSessionManually()` when button is clicked
  - Show processing state during status transition
  - Display success/error messages
  - Refresh session list after successful start
  - _Requirements: 4.1, 4.2_

- [ ]* 8.1 Write property test for GM start action availability
  - **Property 11: GM start action availability**
  - **Validates: Requirements 4.1**

- [ ]* 8.2 Write unit tests for Start Session button
  - Test button appears for GM in READY_TO_START
  - Test button does not appear for non-GM
  - Test button does not appear in other statuses
  - Test button calls startSessionManually
  - _Requirements: 4.1, 4.2_

- [x] 9. Add UI feedback for session status
  - Display player count and capacity for WAITING_FOR_PLAYERS sessions
  - Display status indicator for READY_TO_START sessions
  - Display turn number and deadline for IN_PROGRESS sessions
  - Ensure UI clearly distinguishes between accessible links and waiting messages
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 9.1 Write property test for capacity display in WAITING_FOR_PLAYERS
  - **Property 21: Capacity display in WAITING_FOR_PLAYERS**
  - **Validates: Requirements 7.1**

- [ ]* 9.2 Write property test for turn and deadline display in IN_PROGRESS
  - **Property 22: Turn and deadline display in IN_PROGRESS**
  - **Validates: Requirements 7.3**

- [ ]* 9.3 Write unit tests for UI feedback
  - Test capacity display in WAITING_FOR_PLAYERS
  - Test status indicator in READY_TO_START
  - Test turn and deadline display in IN_PROGRESS
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Add GM empire visibility features
  - Ensure GM sees all empires in READY_TO_START sessions
  - Display empire types for all empires
  - Show player names associated with each empire
  - Sort empires with GM first, then alphabetically
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 10.1 Write property test for GM sees all empires
  - **Property 24: GM sees all empires**
  - **Validates: Requirements 8.1**

- [ ]* 10.2 Write property test for player name visibility
  - **Property 25: Player name visibility**
  - **Validates: Requirements 8.2**

- [ ]* 10.3 Write property test for empire sorting order
  - **Property 26: Empire sorting order**
  - **Validates: Requirements 8.3, 8.4**

- [ ]* 10.4 Write unit tests for GM empire visibility
  - Test GM sees all empires including types
  - Test player names are displayed
  - Test empire sorting (GM first, then alphabetical)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
