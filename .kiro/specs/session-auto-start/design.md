# Design Document: Session Auto-Start

## Overview

This design implements an automated session startup workflow that triggers when all player slots in a session are filled. The system will automatically transition the session from WAITING_FOR_PLAYERS to READY_TO_START status, generate initial snapshots for all empires, and control access to empire maps based on player role and session status. The GM will have immediate access to verify the initial game state, while non-GM players will see a waiting message until the GM manually starts the session.

## Architecture

### High-Level Architecture

The auto-start system follows an event-driven approach:

1. **Empire Registration Layer**: Handles player empire registration
2. **Session Capacity Monitor**: Checks if session is full after each registration
3. **Auto-Start Orchestrator**: Coordinates status transition and snapshot generation
4. **Access Control Layer**: Determines which players can access empire maps based on session status
5. **UI Feedback Layer**: Displays appropriate links or waiting messages based on player role and session status

### Component Interaction Flow

```
Player Registers Empire
    ↓
Empire Registration Complete
    ↓
Check Session Capacity
    ↓
If Full → Auto-Start Orchestrator
    ↓
Update Session Status (WAITING_FOR_PLAYERS → READY_TO_START)
    ↓
Generate Snapshots for Turn 0
    ↓
Update UI (GM sees links, Players see waiting message)
    ↓
GM Clicks "Start Session"
    ↓
Update Session Status (READY_TO_START → IN_PROGRESS)
    ↓
Update UI (All players see active links)
```

## Components and Interfaces

### 1. Session Capacity Functions

**File**: `src/components/common/ClientFunctions.tsx` (add new functions)

**Purpose**: Determines if a session has reached full capacity

**New Functions**:
```typescript
/**
 * Checks if a session has reached full capacity
 * @param sessionName - The session name
 * @returns Object with isFull, activeEmpireCount, and capacity
 */
async function checkSessionCapacity(sessionName: string): Promise<{
  isFull: boolean;
  activeEmpireCount: number;
  capacity: number;
}>;

/**
 * Counts active empires in a session (excludes GM, OBSERVER, etc.)
 * @param sessionName - The session name
 * @returns Count of active empires
 */
async function countActiveEmpires(sessionName: string): Promise<number>;
```

**Implementation Details**:

- `checkSessionCapacity()`: Main capacity check
  - Queries session using existing `getSession()` to get numPlayers capacity
  - Counts ACTIVE empires using `countActiveEmpires()`
  - Returns whether session is full

- `countActiveEmpires()`: Counts ACTIVE and NPC empires
  - Uses existing `getEmpiresForSession()` function
  - Filters to only empireType === 'ACTIVE' or empireType === 'NPC'
  - Returns count

### 2. Auto-Start Orchestrator Functions

**File**: `src/components/common/ClientFunctions.tsx` (add new function)

**Purpose**: Orchestrates the automatic session startup process

**New Function**:
```typescript
/**
 * Attempts to auto-start a session if it's full
 * @param sessionName - The session name
 * @returns Result object with success, newStatus, and optional error
 */
async function attemptAutoStart(sessionName: string): Promise<{
  success: boolean;
  newStatus?: string;
  error?: string;
}>;
```

**Implementation Details**:

- `attemptAutoStart()`: Main orchestration method
  - Uses existing `getSession()` to check if session is in WAITING_FOR_PLAYERS status
  - Calls `checkSessionCapacity()` to verify session is at full capacity
  - Uses existing `updateSessionStatus()` to change status to READY_TO_START
  - Calls `startSession()` from SessionAPI to initialize the backend session state
  - Calls `generateSnapshots()` from SessionAPI for turn 0
  - Returns success/failure with error details
  - Handles all errors and ensures session remains in consistent state

### 3. Session Access Control Hook

**File**: `src/hooks/useSessionAccess.ts`

**Purpose**: Determines what access a player has to empire maps based on session status

**Interface**:
```typescript
interface SessionAccessResult {
  canAccessMap: boolean;
  showWaitingMessage: boolean;
  waitingMessageText?: string;
  isGM: boolean;
}

function useSessionAccess(
  sessionName: string,
  empireName: string,
  sessionStatus: string,
  playerName: string
): SessionAccessResult;
```

**Logic**:
- If player is GM: always `canAccessMap = true`
- If session status is IN_PROGRESS: `canAccessMap = true` for all
- If session status is READY_TO_START and player is not GM: `showWaitingMessage = true`
- Otherwise: `canAccessMap = false`

### 4. Updated SessionWaitingTableRow Component

**File**: `src/pages/SessionWaitingTableRow.tsx`

**Purpose**: Handle empire registration and trigger auto-start check

**Changes**:
- After successful empire registration, call `AutoStartService.attemptAutoStart()`
- Display success/error messages based on auto-start result
- Show processing state during auto-start
- Refresh session list after auto-start completes

### 5. Updated SessionTableRow Component

**File**: `src/pages/SessionTableRow.tsx`

**Purpose**: Display appropriate links or waiting messages based on session status and player role

**Changes**:
- Use `useSessionAccess` hook to determine display mode
- For READY_TO_START sessions:
  - GM: Show active empire map links
  - Non-GM: Show "Waiting for GM to start session" message
- For IN_PROGRESS sessions: Show active links for all players
- Add "Start Session" button for GM when status is READY_TO_START

### 6. Session Start Function

**File**: `src/components/common/ClientFunctions.tsx` (add new function)

**Purpose**: Handle manual session start by GM

**New Function**:
```typescript
/**
 * Starts a session (transitions from READY_TO_START to IN_PROGRESS)
 * @param sessionId - The session ID
 * @param sessionName - The session name
 * @returns Result object with success and optional error
 */
async function startSessionManually(sessionId: string, sessionName: string): Promise<{
  success: boolean;
  error?: string;
}>;
```

**Implementation Details**:

- `startSessionManually()`: Transitions session to IN_PROGRESS
  - Uses existing `getSession()` to verify session is in READY_TO_START status
  - Calls existing `updateSessionStatus()` to change status to IN_PROGRESS
  - Optionally calls backend `startSession()` from SessionAPI if needed
  - Returns success/failure

## Data Models

### Existing Models (No Schema Changes Required)

**Session Model** (DynamoDB via Amplify):
```typescript
{
  name: string;
  gmPlayerName: string;
  status: 'WAITING_FOR_PLAYERS' | 'READY_TO_START' | 'IN_PROGRESS' | ...;
  numPlayers: number;        // Session capacity
  currentTurnNumber: number;
  // ... other fields
}
```

**Empire Model** (DynamoDB via Amplify):
```typescript
{
  name: string;
  playerName: string;
  sessionName: string;
  empireType: 'ACTIVE' | 'GM' | 'OBSERVER' | 'INACTIVE' | ...;
  ordersLocked: boolean;
}
```

### Session Status Flow

```
WAITING_FOR_PLAYERS
    ↓ (auto-start when full)
READY_TO_START
    ↓ (GM manual start)
IN_PROGRESS
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Active empire counting accuracy
*For any* session with a mix of empire types, counting active empires should return only the count of empires with empireType set to ACTIVE or NPC
**Validates: Requirements 5.1**

### Property 2: Auto-transition on capacity
*For any* session in WAITING_FOR_PLAYERS status, when the number of ACTIVE empires equals the session's numPlayers capacity, the session status should automatically transition to READY_TO_START
**Validates: Requirements 1.2**

### Property 3: Backend session initialization
*For any* session that transitions to READY_TO_START status, the backend startSession API should be called before snapshot generation
**Validates: Requirements 1.3**

### Property 4: Snapshot generation trigger
*For any* session where startSession has been called successfully, snapshot generation should be triggered for turn 0
**Validates: Requirements 1.4**

### Property 5: Snapshot availability
*For any* session where snapshot generation has completed, the snapshots should be retrievable for all empires
**Validates: Requirements 1.5**

### Property 6: Status preservation when not full
*For any* session in WAITING_FOR_PLAYERS status where the number of ACTIVE empires is less than the session capacity, the session status should remain WAITING_FOR_PLAYERS
**Validates: Requirements 1.6**

### Property 7: GM map access in READY_TO_START
*For any* GM player and any session in READY_TO_START status, the access control should return canAccessMap=true
**Validates: Requirements 2.1, 2.2**

### Property 8: Non-GM waiting message in READY_TO_START
*For any* non-GM player and any session in READY_TO_START status, the access control should return showWaitingMessage=true and canAccessMap=false
**Validates: Requirements 3.1**

### Property 9: Non-GM map access in IN_PROGRESS
*For any* non-GM player and any session in IN_PROGRESS status, the access control should return canAccessMap=true
**Validates: Requirements 3.3**

### Property 10: No navigation with waiting message
*For any* player viewing a session where showWaitingMessage=true, no empire map navigation links should be rendered
**Validates: Requirements 3.4**

### Property 11: GM start action availability
*For any* GM player and any session in READY_TO_START status, a "Start Session" action should be available
**Validates: Requirements 4.1**

### Property 12: Manual start transition
*For any* session in READY_TO_START status, when the GM triggers the start action, the session status should transition to IN_PROGRESS
**Validates: Requirements 4.2**

### Property 13: Universal access after start
*For any* session in IN_PROGRESS status, all players (GM and non-GM) should have canAccessMap=true for their empires
**Validates: Requirements 4.3**

### Property 14: No status regression
*For any* session in IN_PROGRESS status, attempting to set the status to READY_TO_START should fail or be ignored
**Validates: Requirements 4.4**

### Property 15: Capacity field usage
*For any* session capacity check, the comparison should use the Session.numPlayers field as the capacity value
**Validates: Requirements 5.5**

### Property 16: Error handling preserves state
*For any* auto-start attempt where snapshot generation fails, the session status should remain in WAITING_FOR_PLAYERS
**Validates: Requirements 6.1**

### Property 17: Status update failure prevents snapshots
*For any* auto-start attempt where session status update fails, snapshot generation should not be triggered
**Validates: Requirements 6.2**

### Property 18: Error reporting
*For any* auto-start attempt that encounters an error, the result should include an error message
**Validates: Requirements 6.3**

### Property 19: System recovery after errors
*For any* auto-start attempt that fails, the system should remain in a valid state allowing retry
**Validates: Requirements 6.4**

### Property 20: Duplicate snapshot prevention
*For any* session, concurrent snapshot generation requests should be handled such that only one generation process executes
**Validates: Requirements 6.5**

### Property 21: Capacity display in WAITING_FOR_PLAYERS
*For any* session in WAITING_FOR_PLAYERS status, the UI should display both the current number of registered ACTIVE empires and the total capacity
**Validates: Requirements 7.1**

### Property 22: Turn and deadline display in IN_PROGRESS
*For any* session in IN_PROGRESS status, the UI should display the current turn number and deadline
**Validates: Requirements 7.3**

### Property 23: Link and message mutual exclusivity
*For any* empire display, either an accessible map link or a waiting message should be shown, but never both
**Validates: Requirements 7.4**

### Property 24: GM sees all empires
*For any* GM viewing a session in READY_TO_START status, all registered empires should be displayed including their empire types
**Validates: Requirements 8.1**

### Property 25: Player name visibility
*For any* empire displayed to a GM, the associated player name should be included
**Validates: Requirements 8.2**

### Property 26: Empire sorting order
*For any* list of empires displayed, empires should be sorted with GM empire first, then alphabetically by empire name
**Validates: Requirements 8.3, 8.4**

### Property 27: Capacity check timing
*For any* empire registration, the session capacity check should only occur after the empire registration successfully completes
**Validates: Requirements 9.1**

### Property 28: Fresh data for capacity check
*For any* session capacity check, the empire count should be queried from the database rather than using cached data
**Validates: Requirements 9.2**

### Property 29: Auto-start guard condition
*For any* session not in WAITING_FOR_PLAYERS status, the auto-start process should not execute
**Validates: Requirements 9.3**

### Property 30: Backend initialization before snapshots
*For any* auto-start process, the startSession API call should complete before snapshot generation begins
**Validates: Requirements 1.3, 1.4**

## Error Handling

### Auto-Start Errors

**Error Types**:
1. `START_SESSION_FAILED`: Backend startSession API failed
2. `SNAPSHOT_GENERATION_FAILED`: Backend snapshot generation API failed
3. `STATUS_UPDATE_FAILED`: Database update for session status failed
4. `CAPACITY_CHECK_FAILED`: Unable to query empire count or session data
5. `INVALID_SESSION_STATUS`: Session is not in WAITING_FOR_PLAYERS status
6. `CONCURRENT_MODIFICATION`: Another process is modifying the session

**Error Handling Strategy**:
- All errors should leave the session in a consistent state (typically WAITING_FOR_PLAYERS)
- If startSession fails, do not proceed to snapshot generation
- If snapshot generation fails after startSession succeeds, log the error but session remains in READY_TO_START
- Errors should be logged with full context for debugging
- User-facing error messages should be clear and actionable
- Failed auto-start attempts should be retryable
- Implement optimistic locking or version checks to prevent concurrent modifications

### Network Errors

- Database query failures during capacity check should fail safely (don't auto-start)
- Snapshot generation API failures should be retried once before failing
- Status update failures should be logged and reported to the user
- Implement exponential backoff for transient failures



## Testing Strategy

### Test Organization

All test files are organized in the `tests/` directory, mirroring the source code structure:
- `tests/components/common/` - Tests for ClientFunctions (e.g., `ClientFunctions.test.ts`)
- `tests/hooks/` - Tests for React hooks (e.g., `useSessionAccess.test.ts`)
- `tests/pages/` - Tests for React components (e.g., `SessionTableRow.test.tsx`)
- `tests/setupTests.js` - Global test configuration and Amplify mock setup

### Test Runner Configuration

The project uses **Vitest** as the test runner, configured in `vite.config.js`:
- Test environment: jsdom (for React component testing)
- Global test utilities available
- Setup file: `tests/setupTests.js` (configures Amplify mocks)

### Unit Testing

**ClientFunctions Tests** (`tests/components/common/ClientFunctions.test.ts`):
- Test `checkSessionCapacity()` with various empire configurations
- Test `countActiveEmpires()` excludes non-ACTIVE empires
- Test capacity calculation with different session sizes
- Test error handling for missing sessions
- Test `attemptAutoStart()` with full and partial sessions
- Test status transition from WAITING_FOR_PLAYERS to READY_TO_START
- Test snapshot generation is triggered
- Test error handling for snapshot failures
- Test error handling for status update failures
- Test that auto-start skips non-WAITING_FOR_PLAYERS sessions
- Test `startSessionManually()` transitions READY_TO_START to IN_PROGRESS
- Test that IN_PROGRESS sessions cannot revert to READY_TO_START
- Test error handling for invalid status transitions

**Session Access Hook Tests** (`tests/hooks/useSessionAccess.test.ts`):
- Test GM access in all session statuses
- Test non-GM access based on session status
- Test waiting message display logic
- Test access control for different player roles

**Component Tests**:
- Test `SessionWaitingTableRow` triggers auto-start after registration
- Test `SessionTableRow` displays appropriate links/messages based on status
- Test "Start Session" button appears for GM in READY_TO_START sessions

### Property-Based Testing

Property-based tests will use **fast-check** library for TypeScript/React applications.

Each property test should:
- Run a minimum of 100 iterations
- Generate random sessions, empires, and player configurations
- Verify the correctness property holds across all generated inputs
- Be tagged with the property number from this design document
- Be located in the same test file as related unit tests

**Test Data Generators**:
```typescript
// Generator for empire types
const empireTypeArb = fc.constantFrom(
  'ACTIVE', 'GM', 'OBSERVER', 'INACTIVE', 'ABANDONED', 'NPC', 'HOMELESS'
);

// Generator for session statuses
const sessionStatusArb = fc.constantFrom(
  'WAITING_FOR_PLAYERS', 'READY_TO_START', 'IN_PROGRESS'
);

// Generator for session with empires
const sessionWithEmpiresArb = fc.record({
  sessionName: fc.string({ minLength: 3, maxLength: 20 }),
  numPlayers: fc.integer({ min: 2, max: 10 }),
  status: sessionStatusArb,
  empires: fc.array(
    fc.record({
      name: fc.string({ minLength: 3, maxLength: 20 }),
      playerName: fc.string({ minLength: 3, maxLength: 20 }),
      empireType: empireTypeArb,
    }),
    { minLength: 0, maxLength: 15 }
  ),
});

// Generator for player with role
const playerArb = fc.record({
  username: fc.string({ minLength: 3, maxLength: 20 }),
  isGM: fc.boolean(),
});
```

**Property Test Structure**:
```typescript
// Example property test
it('Property 1: Active empire counting accuracy', () => {
  fc.assert(
    fc.property(sessionWithEmpiresArb, (session) => {
      // Setup: Create session with mixed empire types
      // Act: Call countActiveEmpires()
      // Assert: Count matches number of ACTIVE empires
    }),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Auto-Start Flow**:
- Test complete flow from empire registration to READY_TO_START
- Test GM starting session and transition to IN_PROGRESS
- Test access control changes through status transitions
- Test error recovery scenarios

**Database Integration**:
- Test with actual Amplify DataStore queries (mocked)
- Test concurrent registration scenarios
- Test transaction handling and optimistic locking

### Manual Testing Checklist

1. Register empires until session is full ✓ (auto-transition to READY_TO_START)
2. Verify GM sees active map links in READY_TO_START ✓
3. Verify non-GM sees waiting message in READY_TO_START ✓
4. GM clicks "Start Session" ✓ (transition to IN_PROGRESS)
5. Verify all players see active map links in IN_PROGRESS ✓
6. Register empire when session is not full ✗ (no auto-transition)
7. Test snapshot generation failure handling ✗ (session stays in WAITING_FOR_PLAYERS)
8. Test concurrent empire registrations ✓ (no duplicate transitions)
9. Verify empire count excludes GM, OBSERVER, etc. ✓
10. Verify UI updates reflect status changes ✓

## Implementation Notes

### Performance Considerations

1. **Capacity Checking**: Cache session capacity during registration flow to avoid multiple queries
2. **Snapshot Generation**: This is a potentially long-running operation - consider:
   - Showing progress indicator to user
   - Implementing timeout handling
   - Using background job queue if available
3. **UI Updates**: Use React state management to ensure UI reflects status changes without full page reload

### Security Considerations

1. **Authorization**: Verify player can register for session before allowing registration
2. **GM Verification**: Ensure only actual GM can trigger "Start Session" action
3. **Status Transitions**: Validate all status transitions server-side (if backend API exists)
4. **Snapshot Access**: Ensure non-GM players cannot access snapshots in READY_TO_START status

### Concurrency Considerations

1. **Optimistic Locking**: Use version field or timestamp to detect concurrent modifications
2. **Idempotency**: Ensure auto-start can be safely retried without side effects
3. **Atomic Operations**: Group status update and snapshot generation as atomic operation where possible
4. **Race Condition Prevention**: Use database transactions or conditional updates

### Future Enhancements

1. **Notification System**: Notify all players when session becomes READY_TO_START
2. **Email Alerts**: Send email to GM when session is ready to start
3. **Scheduled Start**: Allow GM to schedule automatic start at a specific time
4. **Partial Start**: Allow GM to start session even if not all slots are filled
5. **Waitlist**: Allow additional players to join a waitlist if session is full

## Dependencies

### External Libraries
- `aws-amplify`: Already in use for data access and authentication
- `fast-check`: Already installed for property-based testing
- `react-router-dom`: Already in use for navigation

### Internal Dependencies
- Existing Amplify DataStore schema (Session, Empire models)
- Existing SessionAPI functions (`generateSnapshots`, `startSession`)
- Existing ClientFunctions (`getEmpiresForSession`, `getSession`, `updateSessionStatus`)

### Backend API Dependencies
- `generateSnapshots(sessionName, turnNumber)`: Generates empire snapshots
- `startSession(sessionName)`: Optional backend call when starting session
- Both APIs must be idempotent and handle errors gracefully

## Migration Strategy

### Phase 1: Add Capacity Checking Functions
1. Add `checkSessionCapacity()` and `countActiveEmpires()` to ClientFunctions
2. Add unit tests for capacity checking
3. No user-facing changes yet

### Phase 2: Implement Auto-Start Orchestrator
1. Add `attemptAutoStart()` to ClientFunctions
2. Add property-based tests for auto-start scenarios
3. Integrate with `SessionWaitingTableRow` component
4. Test with existing sessions

### Phase 3: Implement Access Control
1. Create `useSessionAccess` hook
2. Update `SessionTableRow` to use access control
3. Add tests for access control logic
4. Verify GM and non-GM access patterns

### Phase 4: Add Manual Start
1. Add `startSessionManually()` to ClientFunctions
2. Add "Start Session" button for GM
3. Test status transition to IN_PROGRESS
4. Verify access control changes

### Phase 5: Testing and Refinement
1. Add comprehensive property-based tests
2. Perform manual testing with real sessions
3. Monitor for auto-start failures
4. Refine error messages and UI feedback

### Rollback Plan
- Auto-start can be disabled via feature flag
- If issues arise, GM can manually transition status using backend tools
- System can revert to manual session start workflow
- No data loss or corruption risk
