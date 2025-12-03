# Requirements Document

## Introduction

This feature automates the session startup workflow when players register for a new game session. Currently, when a session is in WAITING_FOR_PLAYERS status, players can join by registering their empires, but the session must be manually transitioned to READY_TO_START status and snapshots must be manually generated. This feature will automatically transition the session status and generate snapshots when all player slots are filled, while controlling access to empire maps based on player role (GM vs non-GM) until the session officially starts.

## Glossary

- **Session**: A game instance with a defined number of player slots
- **Empire**: A player's faction within a session
- **Game Master (GM)**: A special player role with administrative privileges who manages the session
- **Session Status**: The current state of a session (e.g., WAITING_FOR_PLAYERS, READY_TO_START, IN_PROGRESS)
- **Empire Registration**: The process where a player joins a session by creating an empire with a name, homeworld, and starbase
- **Snapshot**: A generated view of the game state for a specific empire at a specific turn
- **Empire Map Link**: A clickable link that navigates to an empire's map view for a specific turn
- **Session Capacity**: The total number of player slots defined when a session is created (stored in Session.numPlayers)
- **Active Empire**: An empire with empireType set to ACTIVE (excludes GM, OBSERVER, and other special types)

## Requirements

### Requirement 1

**User Story:** As a player, I want the session to automatically become ready when all players have joined, so that the GM can make any final adjustments to the game map before formally starting the game.

#### Acceptance Criteria

1. WHEN a player registers an empire for a session THEN the System SHALL count the number of ACTIVE empires in that session
2. WHEN the number of ACTIVE empires equals the session capacity THEN the System SHALL automatically change the session status from WAITING_FOR_PLAYERS to READY_TO_START
3. WHEN the session status changes to READY_TO_START THEN the System SHALL call the backend startSession API before generating snapshots
4. WHEN the startSession API call completes successfully THEN the System SHALL trigger snapshot generation for turn 0
5. WHEN snapshot generation completes THEN the System SHALL make the snapshots available for viewing
6. WHEN a player registers an empire but the session is not yet full THEN the System SHALL keep the session status as WAITING_FOR_PLAYERS

### Requirement 2

**User Story:** As a Game Master, I want immediate access to all empire maps when the session becomes ready, so that I can verify the initial game state before starting the session.

#### Acceptance Criteria

1. WHEN a session transitions to READY_TO_START status THEN the System SHALL display active empire map links for the GM
2. WHEN the GM views the session list THEN the System SHALL show clickable links to each empire's map for turn 0
3. WHEN the GM clicks an empire map link THEN the System SHALL navigate to that empire's map view
4. WHEN the GM views any empire in a READY_TO_START session THEN the System SHALL display the generated snapshot data

### Requirement 3

**User Story:** As a non-GM player, I want to see a waiting message instead of my empire map link until the session starts, so that I understand the session is not yet active.

#### Acceptance Criteria

1. WHEN a non-GM player views a session with READY_TO_START status THEN the System SHALL display a waiting message instead of an empire map link
2. WHEN displaying the waiting message THEN the System SHALL indicate that the session is waiting for the GM to start it
3. WHEN a non-GM player views a session with IN_PROGRESS status THEN the System SHALL display active empire map links
4. WHEN the waiting message displays THEN the System SHALL not provide any navigation to the empire map view

### Requirement 4

**User Story:** As a Game Master, I want to manually start the session when I'm satisfied with the initial state, so that players can begin viewing their empires and submitting orders.

#### Acceptance Criteria

1. WHEN the GM views a session with READY_TO_START status THEN the System SHALL display a "Start Session" action
2. WHEN the GM clicks the "Start Session" action THEN the System SHALL change the session status from READY_TO_START to IN_PROGRESS
3. WHEN the session status changes to IN_PROGRESS THEN the System SHALL make empire map links active for all players
4. WHEN a session is in IN_PROGRESS status THEN the System SHALL not allow the status to revert to READY_TO_START

### Requirement 5

**User Story:** As a developer, I want the empire counting logic to be accurate and reliable, so that sessions transition to READY_TO_START only when truly full.

#### Acceptance Criteria

1. WHEN counting empires for session capacity THEN the System SHALL include only empires with empireType set to ACTIVE or NPC
2. WHEN counting empires for session capacity THEN the System SHALL exclude GM empires from the count
3. WHEN counting empires for session capacity THEN the System SHALL exclude OBSERVER empires from the count
4. WHEN counting empires for session capacity THEN the System SHALL exclude INACTIVE, ABANDONED, and HOMELESS empires from the count
5. WHEN comparing empire count to session capacity THEN the System SHALL use the Session.numPlayers field as the capacity value

### Requirement 6

**User Story:** As a system administrator, I want proper error handling during the auto-start process, so that failures don't leave sessions in an inconsistent state.

#### Acceptance Criteria

1. WHEN snapshot generation fails THEN the System SHALL log the error and keep the session in WAITING_FOR_PLAYERS status
2. WHEN session status update fails THEN the System SHALL log the error and not trigger snapshot generation
3. WHEN an error occurs during auto-start THEN the System SHALL display an error message to the user who triggered the registration
4. WHEN an error occurs during auto-start THEN the System SHALL allow retry by registering another empire or manual GM intervention
5. WHEN snapshot generation is in progress THEN the System SHALL prevent duplicate snapshot generation requests

### Requirement 7

**User Story:** As a player, I want clear visual feedback about the session state, so that I understand whether I can access my empire or need to wait.

#### Acceptance Criteria

1. WHEN a session is in WAITING_FOR_PLAYERS status THEN the System SHALL display the number of registered players and total capacity
2. WHEN a session is in READY_TO_START status THEN the System SHALL display a status indicator showing the session is ready but not started
3. WHEN a session is in IN_PROGRESS status THEN the System SHALL display the current turn number and deadline
4. WHEN displaying empire information THEN the System SHALL clearly distinguish between accessible links and waiting messages
5. WHEN a session transitions between states THEN the System SHALL update the UI to reflect the new state without requiring a page refresh

### Requirement 8

**User Story:** As a Game Master, I want to see all empires in the session regardless of status, so that I can verify all players have registered correctly.

#### Acceptance Criteria

1. WHEN the GM views a session in READY_TO_START status THEN the System SHALL display all registered empires including their types
2. WHEN the GM views empire information THEN the System SHALL show the player name associated with each empire
3. WHEN the GM views a READY_TO_START session THEN the System SHALL display the GM empire separately from player empires
4. WHEN displaying empire lists THEN the System SHALL sort empires with GM first, then alphabetically by empire name

### Requirement 9

**User Story:** As a developer, I want the auto-start logic to be triggered only at the appropriate time, so that it doesn't interfere with other session operations.

#### Acceptance Criteria

1. WHEN a player registers an empire THEN the System SHALL check session capacity only after successful empire registration
2. WHEN checking session capacity THEN the System SHALL query the current empire count from the database
3. WHEN the session is not in WAITING_FOR_PLAYERS status THEN the System SHALL not perform auto-start checks
4. WHEN multiple players register simultaneously THEN the System SHALL handle concurrent registrations without duplicate status transitions
5. WHEN the auto-start process begins THEN the System SHALL complete all steps before allowing additional registrations
