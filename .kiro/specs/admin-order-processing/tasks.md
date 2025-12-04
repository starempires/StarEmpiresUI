# Implementation Plan

- [x] 1. Update SessionAPI.updateTurn to accept optional processAdminOnly parameter
  - Modify the `updateTurn` function signature to include optional `processAdminOnly?: boolean` parameter
  - Update request payload construction to conditionally include processAdminOnly when true
  - Omit processAdminOnly from payload when false or undefined for backward compatibility
  - Maintain existing error handling and response parsing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.1 Write property test for processAdminOnly parameter inclusion
  - **Property 3: Admin flag inclusion**
  - **Validates: Requirements 2.3**

- [x] 1.2 Write property test for processAdminOnly parameter omission
  - **Property 4: Admin flag omission**
  - **Validates: Requirements 2.4**

- [x] 1.3 Write property test for backward compatibility
  - **Property 5: Backward compatibility**
  - **Validates: Requirements 2.5, 5.2, 5.3, 5.4**

- [x] 1.4 Write unit tests for updateTurn parameter handling
  - Test updateTurn with processAdminOnly=true includes flag in payload
  - Test updateTurn with processAdminOnly=false omits flag from payload
  - Test updateTurn with processAdminOnly=undefined omits flag from payload
  - Test updateTurn without parameter omits flag from payload
  - Test updateTurn returns response correctly
  - Test updateTurn handles errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Add handleProcessAdminOrders function to GMControls
  - Create new async function `handleProcessAdminOrders(sessionId: string)`
  - Set processing state to true and display "Processing Admin Orders..." message
  - Get current turn number using `getCurrentTurnNumber(sessionId)`
  - Call `updateTurn(session.sessionName, currentTurn, true)` with processAdminOnly flag
  - Parse JSON response and update processing message with backend response
  - Update processing message to "Generating Snapshots..."
  - Call `generateSnapshots(session.sessionName, currentTurn)` to refresh snapshots
  - Parse JSON response and update processing message with snapshot response
  - Handle errors by logging to console
  - Set processing state to false in finally block
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 2.1 Write property test for processing state during admin orders
  - **Property 6: Processing state during admin orders**
  - **Validates: Requirements 4.2**

- [ ]* 2.2 Write property test for snapshot generation after admin orders
  - **Property 11: Snapshot generation after admin orders**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 2.3 Write property test for snapshot generation message display
  - **Property 12: Snapshot generation message display**
  - **Validates: Requirements 6.3**

- [ ]* 2.4 Write unit tests for handleProcessAdminOrders
  - Test function calls updateTurn with processAdminOnly=true
  - Test function displays "Processing Admin Orders..." message
  - Test function calls generateSnapshots after updateTurn
  - Test function displays "Generating Snapshots..." message
  - Test function updates processing message with backend responses
  - Test function handles updateTurn errors gracefully
  - Test function handles generateSnapshots errors gracefully
  - Test processing state is set correctly
  - _Requirements: 1.2, 1.3, 1.5, 4.2, 6.1, 6.3, 6.4_

- [x] 3. Add "Process Admin Orders" button to GMControls UI
  - Add conditional rendering block for `session.status === 'READY_TO_START'`
  - Create "Process Admin Orders" button with lightblue background
  - Set button onClick to call `handleProcessAdminOrders(session.sessionId)`
  - Set button disabled when `processing` is true
  - Position button alongside "Generate Snapshots" button
  - _Requirements: 1.1, 3.1, 3.5, 4.2_

- [ ]* 3.1 Write property test for button visibility in READY_TO_START
  - **Property 1: Button visibility in READY_TO_START**
  - **Validates: Requirements 3.1**

- [ ]* 3.2 Write property test for button hidden in other statuses
  - **Property 2: Button hidden in other statuses**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ]* 3.3 Write property test for button disabled during processing
  - **Property 7: Button disabled during processing**
  - **Validates: Requirements 4.2**

- [ ]* 3.4 Write unit tests for button rendering
  - Test button appears in READY_TO_START status
  - Test button does not appear in WAITING_FOR_PLAYERS status
  - Test button does not appear in IN_PROGRESS status
  - Test button is disabled when processing=true
  - Test button is enabled when processing=false
  - Test button calls handleProcessAdminOrders on click
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.2_

- [x] 4. Verify existing functionality remains unchanged
  - Verify handleUpdateTurn still calls updateTurn without processAdminOnly parameter
  - Verify normal turn processing workflow is unaffected
  - Verify other GM control buttons work correctly
  - Verify backward compatibility with existing code
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.1 Write property test for normal turn processing unchanged
  - **Property 9: Normal turn processing unchanged**
  - **Validates: Requirements 5.1**

- [x] 4.2 Write unit tests for backward compatibility
  - Test handleUpdateTurn calls updateTurn without processAdminOnly
  - Test existing turn processing workflow unchanged
  - Test other GM buttons unaffected
  - _Requirements: 5.1, 5.4_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
