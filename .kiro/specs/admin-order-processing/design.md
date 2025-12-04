# Design Document: Admin Order Processing

## Overview

This design adds admin-only order processing functionality to the Star Empires game system. When a session is in READY_TO_START status, the Game Master can process administrative orders separately from player orders. This is accomplished by adding an optional `processAdminOnly` boolean parameter to the `updateTurn` API function and adding a new "Process Admin Orders" button to the GM Controls UI that appears only in READY_TO_START status.

The feature maintains backward compatibility with existing code - all current calls to `updateTurn` will continue to work without modification, as the new parameter is optional and defaults to false.

## Architecture

### High-Level Architecture

The admin order processing system follows a simple request-response pattern:

1. **UI Layer (GMControls)**: Displays the "Process Admin Orders" button when session status is READY_TO_START
2. **API Layer (SessionAPI)**: Accepts the optional `processAdminOnly` parameter and includes it in the backend request
3. **Backend API**: Processes only admin orders when the flag is true, or all orders when false/omitted

### Component Interaction Flow

```
GM Clicks "Process Admin Orders"
    ↓
handleProcessAdminOrders() called
    ↓
Display Processing Dialog ("Processing Admin Orders...")
    ↓
Get Current Turn Number
    ↓
Call updateTurn(sessionName, turnNumber, true)
    ↓
Backend Processes Admin Orders Only
    ↓
Display Success Message
    ↓
Update Processing Message ("Generating Snapshots...")
    ↓
Call generateSnapshots(sessionName, turnNumber)
    ↓
Display Success Message
    ↓
Close Processing Dialog
```

## Components and Interfaces

### 1. Updated SessionAPI.updateTurn Function

**File**: `src/components/common/SessionAPI.tsx`

**Purpose**: Communicate with the backend API to process turn updates, with optional admin-only mode

**Updated Function Signature**:
```typescript
export async function updateTurn(
  sessionName: string,
  turnNumber: number,
  processAdminOnly?: boolean
): Promise<string>
```

**Implementation Details**:

- Add optional `processAdminOnly` parameter (defaults to `undefined`)
- When `processAdminOnly` is `true`, include it in the request payload
- When `processAdminOnly` is `false` or `undefined`, omit it from the payload (for backward compatibility)
- Maintain existing error handling and response parsing
- Return the response text as before

**Request Payload**:
```typescript
// When processAdminOnly is true
{
  sessionName: string,
  turnNumber: number,
  processAdminOnly: true
}

// When processAdminOnly is false or omitted
{
  sessionName: string,
  turnNumber: number
}
```

### 2. New handleProcessAdminOrders Function

**File**: `src/pages/GMControls.tsx`

**Purpose**: Handle the "Process Admin Orders" button click

**New Function**:
```typescript
async function handleProcessAdminOrders(sessionId: string): Promise<void>
```

**Implementation Details**:

- Set processing state to true
- Display "Processing Admin Orders..." message
- Get current turn number using `getCurrentTurnNumber()`
- Call `updateTurn(sessionName, currentTurn, true)` with processAdminOnly flag
- Parse the JSON response
- Update processing message with backend response
- Update processing message to "Generating Snapshots..."
- Call `generateSnapshots(sessionName, currentTurn)` to refresh snapshots
- Parse the JSON response
- Update processing message with backend response
- Handle errors by logging to console
- Set processing state to false in finally block
- Note: Does NOT increment turn number (unlike normal turn processing)

### 3. Updated GMControls UI

**File**: `src/pages/GMControls.tsx`

**Purpose**: Display the "Process Admin Orders" button in READY_TO_START status

**Changes**:

- Add new conditional rendering block for `session.status === 'READY_TO_START'`
- Display "Process Admin Orders" button
- Button should be styled consistently with other GM buttons (e.g., lightblue background)
- Button should be disabled when `processing` is true
- Button should call `handleProcessAdminOrders(session.sessionId)`

**UI Structure**:
```tsx
{session.status === 'READY_TO_START' && (
  <React.Fragment>
    <button 
      onClick={() => handleProcessAdminOrders(session.sessionId)} 
      disabled={processing} 
      style={{ backgroundColor: 'lightblue' }}
    >
      Process Admin Orders
    </button>
    <button 
      onClick={() => handleGenerateSnapshots(session.sessionId)} 
      disabled={processing} 
      style={{ backgroundColor: 'lightblue' }}
    >
      Generate Snapshots
    </button>
  </React.Fragment>
)}
```

### 4. Existing handleUpdateTurn Function

**File**: `src/pages/GMControls.tsx`

**Purpose**: Maintain existing behavior for normal turn processing

**Changes**: None required

**Verification**:
- Existing call to `updateTurn(session.sessionName, currentTurn)` remains unchanged
- The optional parameter is omitted, so backend processes all orders normally
- Backward compatibility is maintained

## Data Models

### Existing Models (No Schema Changes Required)

**Session Model** (DynamoDB via Amplify):
```typescript
{
  name: string;
  sessionId: string;
  status: 'WAITING_FOR_PLAYERS' | 'READY_TO_START' | 'IN_PROGRESS' | ...;
  currentTurnNumber: number;
  // ... other fields
}
```

**API Request Payload** (updateTurn):
```typescript
{
  sessionName: string;
  turnNumber: number;
  processAdminOnly?: boolean; // NEW: optional field
}
```

**API Response** (updateTurn):
```typescript
{
  message: string;
  // ... other fields returned by backend
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Button visibility in READY_TO_START
*For any* session in READY_TO_START status, the "Process Admin Orders" button should be visible in the GM Controls UI
**Validates: Requirements 3.1**

### Property 2: Button hidden in other statuses
*For any* session not in READY_TO_START status, the "Process Admin Orders" button should not be rendered
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 3: Admin flag inclusion
*For any* call to updateTurn with processAdminOnly set to true, the API request payload should include the processAdminOnly field set to true
**Validates: Requirements 2.3**

### Property 4: Admin flag omission
*For any* call to updateTurn with processAdminOnly set to false or undefined, the API request payload should either omit the processAdminOnly field or set it to false
**Validates: Requirements 2.4**

### Property 5: Backward compatibility
*For any* existing call to updateTurn without the processAdminOnly parameter, the function should behave identically to the previous implementation
**Validates: Requirements 2.5, 5.2, 5.3, 5.4**

### Property 6: Processing state during admin orders
*For any* admin order processing operation, the processing state should be true during execution and false after completion
**Validates: Requirements 4.2**

### Property 7: Button disabled during processing
*For any* session where processing is true, all GM control buttons including "Process Admin Orders" should be disabled
**Validates: Requirements 4.2**

### Property 8: Error handling preserves UI state
*For any* admin order processing operation that fails, the processing dialog should close and the UI should return to a usable state
**Validates: Requirements 6.3, 6.4**

### Property 9: Normal turn processing unchanged
*For any* call to handleUpdateTurn, the updateTurn function should be called without the processAdminOnly parameter
**Validates: Requirements 5.1**

### Property 10: Success message display
*For any* successful admin order processing operation, the processing message should be updated with the backend response message
**Validates: Requirements 1.5, 4.3**

### Property 11: Snapshot generation after admin orders
*For any* successful admin order processing operation, the generateSnapshots function should be called with the current turn number
**Validates: Requirements 6.1, 6.2**

### Property 12: Snapshot generation message display
*For any* admin order processing operation that reaches snapshot generation, the processing message should be updated to indicate snapshot generation is in progress
**Validates: Requirements 6.3**

### Property 13: Snapshot success message
*For any* successful snapshot generation after admin orders, the processing message should be updated with the snapshot generation response
**Validates: Requirements 6.4**

## Error Handling

### Admin Order Processing Errors

**Error Types**:
1. `NETWORK_ERROR`: Failed to connect to backend API
2. `BACKEND_ERROR`: Backend returned an error response
3. `PARSE_ERROR`: Failed to parse JSON response
4. `TURN_NUMBER_ERROR`: Failed to get current turn number

**Error Handling Strategy**:
- All errors should be logged to console with `console.error()`
- Processing dialog should close on error (processing state set to false)
- No user-facing error messages (consistent with existing error handling in GMControls)
- UI should remain in a usable state after error
- GM can retry the operation by clicking the button again

### Network Errors

- Fetch failures should be caught and logged
- Processing state should be reset in finally block
- No retry logic (GM manually retries if needed)

### Backend Errors

- Non-200 status codes should return empty string (consistent with existing SessionAPI pattern)
- Empty responses should be handled gracefully
- Malformed JSON should be caught during parsing

## Testing Strategy

### Test Organization

All test files are organized in the `tests/` directory, mirroring the source code structure:
- `tests/components/common/SessionAPI.test.ts` - Tests for SessionAPI functions
- `tests/pages/GMControls.test.tsx` - Tests for GMControls component

### Test Runner Configuration

The project uses **Vitest** as the test runner, configured in `vite.config.js`:
- Test environment: jsdom (for React component testing)
- Global test utilities available
- Setup file: `tests/setupTests.js` (configures Amplify mocks)

### Unit Testing

**SessionAPI Tests** (`tests/components/common/SessionAPI.test.ts`):
- Test `updateTurn()` with processAdminOnly=true includes flag in payload
- Test `updateTurn()` with processAdminOnly=false omits flag from payload
- Test `updateTurn()` with processAdminOnly=undefined omits flag from payload
- Test `updateTurn()` without processAdminOnly parameter omits flag from payload
- Test `updateTurn()` returns response text correctly
- Test `updateTurn()` handles network errors
- Test `updateTurn()` handles 404 responses
- Test `updateTurn()` handles non-200 status codes

**GMControls Tests** (`tests/pages/GMControls.test.tsx`):
- Test "Process Admin Orders" button appears in READY_TO_START status
- Test "Process Admin Orders" button does not appear in WAITING_FOR_PLAYERS status
- Test "Process Admin Orders" button does not appear in IN_PROGRESS status
- Test "Process Admin Orders" button is disabled when processing=true
- Test handleProcessAdminOrders calls updateTurn with processAdminOnly=true
- Test handleProcessAdminOrders displays processing message
- Test handleProcessAdminOrders handles errors gracefully
- Test handleUpdateTurn calls updateTurn without processAdminOnly parameter
- Test existing functionality remains unchanged

### Property-Based Testing

Property-based tests will use **fast-check** library for TypeScript/React applications.

Each property test should:
- Run a minimum of 100 iterations
- Generate random session states and parameters
- Verify the correctness property holds across all generated inputs
- Be tagged with the property number from this design document

**Test Data Generators**:
```typescript
// Generator for session statuses
const sessionStatusArb = fc.constantFrom(
  'WAITING_FOR_PLAYERS', 'READY_TO_START', 'IN_PROGRESS', 
  'ABANDONED', 'ARCHIVED', 'GAME_OVER'
);

// Generator for session with status
const sessionArb = fc.record({
  sessionId: fc.uuid(),
  sessionName: fc.string({ minLength: 3, maxLength: 20 }),
  status: sessionStatusArb,
  currentTurnNumber: fc.integer({ min: 0, max: 100 }),
});

// Generator for processAdminOnly parameter
const processAdminOnlyArb = fc.option(fc.boolean(), { nil: undefined });
```

**Property Test Structure**:
```typescript
// Example property test
it('Property 1: Button visibility in READY_TO_START', () => {
  fc.assert(
    fc.property(sessionArb, (session) => {
      // Setup: Render GMControls with session
      // Act: Check if button is rendered
      // Assert: Button visible if and only if status is READY_TO_START
    }),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Admin Order Processing Flow**:
- Test complete flow from button click to success message
- Test admin order processing with mocked backend response
- Test error recovery scenarios
- Test that normal turn processing is unaffected

### Manual Testing Checklist

1. Session in READY_TO_START status shows "Process Admin Orders" button ✓
2. Session in WAITING_FOR_PLAYERS status does not show button ✗
3. Session in IN_PROGRESS status does not show button ✗
4. Clicking "Process Admin Orders" displays processing dialog ✓
5. Processing dialog shows "Processing Admin Orders..." message ✓
6. Backend receives processAdminOnly=true in request ✓
7. Success message displays after completion ✓
8. Button is disabled during processing ✓
9. Existing "Update Turn" button still works normally ✓
10. Normal turn processing does not include processAdminOnly flag ✓

## Implementation Notes

### Performance Considerations

1. **No Performance Impact**: The feature adds a single optional parameter, no performance overhead
2. **UI Responsiveness**: Processing dialog provides immediate feedback
3. **Network Efficiency**: Single API call, no additional requests

### Security Considerations

1. **Authorization**: Backend should verify GM permissions before processing admin orders
2. **Input Validation**: Backend should validate sessionName and turnNumber
3. **Flag Validation**: Backend should validate processAdminOnly is boolean if present

### Backward Compatibility

1. **Existing Code**: All existing calls to `updateTurn()` work without modification
2. **API Contract**: Backend should handle requests with or without processAdminOnly field
3. **Default Behavior**: Omitting the parameter maintains current behavior

### Future Enhancements

1. **Progress Tracking**: Show detailed progress for admin order processing
2. **Confirmation Dialog**: Ask GM to confirm before processing admin orders
3. **Admin Order Preview**: Show what admin orders will be processed
4. **Undo Functionality**: Allow GM to undo admin order processing
5. **Batch Processing**: Process admin orders for multiple sessions at once

## Dependencies

### External Libraries
- `react`: Already in use for UI components
- `react-router-dom`: Already in use for navigation

### Internal Dependencies
- Existing SessionAPI functions (`updateTurn`, `generateSnapshots`)
- Existing ClientFunctions (`getCurrentTurnNumber`)
- Existing GMControls component structure
- Existing ProcessingDialog component

### Backend API Dependencies
- `updateTurn(sessionName, turnNumber, processAdminOnly?)`: Must accept optional processAdminOnly parameter
- Backend must handle processAdminOnly flag correctly
- Backend must return JSON response with message field

## Migration Strategy

### Phase 1: Update SessionAPI Function
1. Add optional `processAdminOnly` parameter to `updateTurn` function
2. Update request payload construction to conditionally include the flag
3. Add unit tests for new parameter handling
4. Verify backward compatibility with existing calls

### Phase 2: Add GM Controls UI
1. Add `handleProcessAdminOrders` function to GMControls
2. Add conditional rendering for READY_TO_START status
3. Add "Process Admin Orders" button
4. Test button visibility and functionality

### Phase 3: Testing and Refinement
1. Add property-based tests
2. Perform manual testing with real sessions
3. Verify existing functionality is unaffected
4. Refine error messages and UI feedback

### Rollback Plan
- Feature can be disabled by removing the button from UI
- Backend can ignore the processAdminOnly flag if needed
- No data changes, so rollback is safe
- Existing functionality is unaffected

## Code Changes Summary

### Files to Modify

1. **src/components/common/SessionAPI.tsx**
   - Add optional `processAdminOnly` parameter to `updateTurn` function
   - Update request payload construction

2. **src/pages/GMControls.tsx**
   - Add `handleProcessAdminOrders` function
   - Add conditional rendering for READY_TO_START status
   - Add "Process Admin Orders" button

### Files to Create

1. **tests/components/common/SessionAPI.test.ts** (if doesn't exist)
   - Unit tests for updateTurn with processAdminOnly parameter

2. **tests/pages/GMControls.test.tsx** (if doesn't exist)
   - Unit tests for GMControls component with new button

### No Changes Required

- Database schema
- Amplify configuration
- Other SessionAPI functions
- Other GMControls functions
- ProcessingDialog component
