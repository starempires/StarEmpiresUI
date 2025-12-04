# Requirements Document

## Introduction

This feature adds the ability for Game Masters to process administrative orders separately from regular player orders during the initial setup phase of a game session. When a session is in READY_TO_START status, the GM needs to process admin-only orders (such as initial world generation, resource allocation, or other setup tasks) before the session officially begins. This allows the GM to prepare the game state without processing player orders, which should only be processed once the session transitions to IN_PROGRESS status.

## Glossary

- **Game Master (GM)**: A special player role with administrative privileges who manages the session
- **Session Status**: The current state of a session (e.g., WAITING_FOR_PLAYERS, READY_TO_START, IN_PROGRESS)
- **Admin Orders**: Special orders that are processed during session setup, typically for world generation and initial state configuration
- **Player Orders**: Regular orders submitted by players during normal gameplay
- **Turn Processing**: The backend operation that executes orders and updates the game state
- **SessionAPI**: The frontend API module that communicates with the backend Star Empires API
- **GM Controls**: The UI component that provides administrative functions to the Game Master

## Requirements

### Requirement 1

**User Story:** As a Game Master, I want to process admin-only orders during session setup, so that I can initialize the game world before players begin submitting orders.

#### Acceptance Criteria

1. WHEN the GM views a session with READY_TO_START status THEN the System SHALL display a "Process Admin Orders" button
2. WHEN the GM clicks the "Process Admin Orders" button THEN the System SHALL call the backend updateTurn API with a processAdminOnly flag set to true
3. WHEN the backend receives the processAdminOnly flag set to true THEN the System SHALL process only administrative orders
4. WHEN the backend receives the processAdminOnly flag set to false or omitted THEN the System SHALL process all orders normally
5. WHEN admin order processing completes successfully THEN the System SHALL display a success message to the GM

### Requirement 2

**User Story:** As a developer, I want the updateTurn function to accept an optional processAdminOnly parameter, so that the system can distinguish between admin-only and normal turn processing.

#### Acceptance Criteria

1. WHEN the updateTurn function is called THEN the System SHALL accept an optional processAdminOnly boolean parameter
2. WHEN the processAdminOnly parameter is omitted THEN the System SHALL default the value to false
3. WHEN the processAdminOnly parameter is true THEN the System SHALL include it in the API request payload
4. WHEN the processAdminOnly parameter is false THEN the System SHALL omit it from the API request payload or set it to false
5. WHEN the API request is sent THEN the System SHALL maintain backward compatibility with existing updateTurn calls

### Requirement 3

**User Story:** As a Game Master, I want the "Process Admin Orders" button to appear only in READY_TO_START status, so that I don't accidentally process admin orders during normal gameplay.

#### Acceptance Criteria

1. WHEN a session is in READY_TO_START status THEN the System SHALL display the "Process Admin Orders" button
2. WHEN a session is in WAITING_FOR_PLAYERS status THEN the System SHALL not display the "Process Admin Orders" button
3. WHEN a session is in IN_PROGRESS status THEN the System SHALL not display the "Process Admin Orders" button
4. WHEN a session is in any other status THEN the System SHALL not display the "Process Admin Orders" button
5. WHEN the "Process Admin Orders" button is displayed THEN the System SHALL position it alongside other GM control buttons

### Requirement 4

**User Story:** As a Game Master, I want visual feedback during admin order processing, so that I know the operation is in progress and when it completes.

#### Acceptance Criteria

1. WHEN the GM clicks "Process Admin Orders" THEN the System SHALL display a processing dialog with a message indicating admin order processing
2. WHEN admin order processing is in progress THEN the System SHALL disable the "Process Admin Orders" button
3. WHEN admin order processing completes successfully THEN the System SHALL update the processing message with the backend response
4. WHEN admin order processing encounters an error THEN the System SHALL log the error and close the processing dialog
5. WHEN the processing dialog closes THEN the System SHALL re-enable the "Process Admin Orders" button

### Requirement 5

**User Story:** As a developer, I want existing updateTurn calls to remain unchanged, so that the new feature doesn't break existing functionality.

#### Acceptance Criteria

1. WHEN the "Update Turn" button is clicked in IN_PROGRESS status THEN the System SHALL call updateTurn without the processAdminOnly flag
2. WHEN updateTurn is called without the processAdminOnly parameter THEN the System SHALL process orders normally
3. WHEN the backend receives a request without the processAdminOnly field THEN the System SHALL treat it as a normal turn update
4. WHEN existing turn processing workflows execute THEN the System SHALL maintain the same behavior as before the feature addition
5. WHEN the API payload is constructed THEN the System SHALL only include processAdminOnly when explicitly set to true

### Requirement 6

**User Story:** As a Game Master, I want snapshots to be regenerated after processing admin orders, so that players can see the updated game state.

#### Acceptance Criteria

1. WHEN admin order processing completes successfully THEN the System SHALL call the generateSnapshots API
2. WHEN calling generateSnapshots after admin orders THEN the System SHALL use the current turn number
3. WHEN snapshot generation is in progress THEN the System SHALL update the processing message to indicate snapshot generation
4. WHEN snapshot generation completes THEN the System SHALL display the success message from the backend response
5. WHEN snapshot generation fails THEN the System SHALL log the error but still close the processing dialog

### Requirement 7

**User Story:** As a Game Master, I want clear error handling for admin order processing, so that I understand what went wrong if the operation fails.

#### Acceptance Criteria

1. WHEN admin order processing fails due to a network error THEN the System SHALL log the error to the console
2. WHEN admin order processing fails due to a backend error THEN the System SHALL display the error message from the backend response
3. WHEN admin order processing fails THEN the System SHALL close the processing dialog
4. WHEN an error occurs THEN the System SHALL allow the GM to retry the operation
5. WHEN the backend returns a non-200 status code THEN the System SHALL handle it gracefully without crashing the UI
