# Design Document: Empire Authorization

## Overview

This design implements a client-side authorization layer for the Star Empires game application to ensure players can only access empire data they control. The system will validate user access on every protected route, checking that the authenticated user either owns the requested empire or is the Game Master for that session. The design leverages React Router's navigation guards and React hooks to provide seamless authorization checks without disrupting the user experience.

## Architecture

### High-Level Architecture

The authorization system follows a layered approach:

1. **Route Protection Layer**: Wraps protected routes with authorization checks
2. **Authorization Service**: Centralized logic for validating user access to empires
3. **Data Access Layer**: Existing Amplify DataStore queries for empire ownership
4. **UI Feedback Layer**: User-friendly error pages and redirects

### Component Interaction Flow

```
User Navigation Request
    ↓
Route Guard (ProtectedRoute component)
    ↓
Authorization Service
    ↓
Query Empire Ownership (Amplify DataStore)
    ↓
Decision: Grant or Deny Access
    ↓
Render Page or Show Error
```

## Components and Interfaces

### 1. Authorization Service

**File**: `src/services/AuthorizationService.ts`

**Purpose**: Centralized authorization logic for empire access validation

**Interface**:
```typescript
interface AuthorizationResult {
  authorized: boolean;
  reason?: 'not_authenticated' | 'not_owner' | 'session_not_found' | 'empire_not_found';
  redirectTo?: string;
}

class AuthorizationService {
  /**
   * Validates if the current user can access the specified empire
   * @param username - The authenticated user's username
   * @param sessionName - The session name from URL
   * @param empireName - The empire name from URL
   * @returns Authorization result with access decision
   */
  async canAccessEmpire(
    username: string,
    sessionName: string,
    empireName: string
  ): Promise<AuthorizationResult>;

  /**
   * Checks if user is GM for a session
   * @param username - The authenticated user's username
   * @param sessionName - The session name
   * @returns true if user is GM for this session
   */
  async isGameMaster(
    username: string,
    sessionName: string
  ): Promise<boolean>;
}
```

**Key Methods**:

- `canAccessEmpire()`: Main authorization check
  - Uses `getEmpire()` from ClientFunctions to query Empire table
  - Checks if empire.playerName matches current user
  - If not, checks if user is GM for that session
  - Returns authorization result with reason for denial

- `isGameMaster()`: Helper to check GM status
  - Uses `getGMEmpireForPlayer()` from ClientFunctions
  - Returns true if user has a GM empire in the session

**Data Access Functions** (added to `ClientFunctions.tsx`):

- `getEmpire(sessionName, empireName)`: Retrieves a specific empire by session and name
- `getGMEmpireForPlayer(sessionName, playerName)`: Checks if a player has a GM empire in a session

### 2. Protected Route Component

**File**: `src/components/auth/ProtectedRoute.tsx`

**Purpose**: Wrapper component for routes requiring empire authorization

**Interface**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresEmpireAccess?: boolean;
  staticPage?: boolean;
}

function ProtectedRoute({
  children,
  requiresEmpireAccess = false,
  staticPage = false
}: ProtectedRouteProps): JSX.Element;
```

**Behavior**:
- If `staticPage=true`: Only checks authentication, allows access
- If `requiresEmpireAccess=true`: Performs full empire authorization
- Shows loading state during authorization check
- Redirects to error page if authorization fails
- Redirects to login if not authenticated

### 3. Unauthorized Access Page

**File**: `src/pages/UnauthorizedPage.tsx`

**Purpose**: User-friendly error page for authorization failures

**Features**:
- Displays clear error message based on failure reason
- Provides "Return to Sessions" button
- Does not expose sensitive information about other empires/sessions

### 4. useAuthorization Hook

**File**: `src/hooks/useAuthorization.ts`

**Purpose**: React hook for authorization checks in components

**Interface**:
```typescript
interface UseAuthorizationResult {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
}

function useAuthorization(
  sessionName: string,
  empireName: string
): UseAuthorizationResult;
```

**Usage**: Can be used in components that need to conditionally render based on authorization

## Data Models

### Existing Models (No Changes Required)

The current Amplify DataStore schema already contains the necessary data stored in DynamoDB tables:

**Empire Model** (DynamoDB via Amplify):
```typescript
{
  name: string;           // Empire name
  playerName: string;     // Owner's username (matches Cognito username)
  sessionName: string;    // Session this empire belongs to
  empireType: 'GM' | 'ACTIVE' | 'OBSERVER' | ...;  // Empire type
  ordersLocked: boolean;
}
```

**Session Model** (DynamoDB via Amplify):
```typescript
{
  name: string;           // Session name
  gmPlayerName: string;   // GM's username (matches Cognito username)
  currentTurnNumber: number;
  status: string;
  // ... other fields
}
```

**Authentication** (AWS Cognito):
- User authentication is handled by AWS Cognito
- Cognito provides username via `userAttributes.preferred_username`
- This username is used as the `playerName` in Empire records
- Authorization queries match Cognito username against Empire.playerName

### Authorization Cache (Optional Enhancement)

To reduce database queries, implement a simple in-memory cache:

```typescript
interface AuthorizationCache {
  key: string;  // `${username}:${sessionName}:${empireName}`
  authorized: boolean;
  timestamp: number;
  ttl: number;  // Time to live in milliseconds (e.g., 5 minutes)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Owner access validation
*For any* authenticated user, session, and empire, when the user attempts to access an empire view, authorization should be granted if and only if the user owns that empire in that session
**Validates: Requirements 1.1**

### Property 2: Unauthorized access denial
*For any* authenticated user and empire they do not own, attempting to access that empire's view should result in access denial and no empire data being returned
**Validates: Requirements 1.2, 3.2**

### Property 3: Re-authorization on navigation
*For any* route change to an empire view (including URL modifications, back/forward navigation), the authorization check should be performed before rendering any content
**Validates: Requirements 1.4, 3.1**

### Property 4: GM universal access within session
*For any* Game Master and any empire within their managed session, the GM should be granted access to that empire's view
**Validates: Requirements 2.1**

### Property 5: GM session boundary
*For any* Game Master and any session they do not manage, attempting to access empires in that session should result in access denial
**Validates: Requirements 2.2**

### Property 6: Error message security
*For any* authorization failure, the error message should not contain sensitive information such as other player names, empire details, or session data
**Validates: Requirements 4.2**

### Property 7: Session view filtering
*For any* authenticated player, the session view should display only sessions where the player has an empire (either as owner or as GM)
**Validates: Requirements 6.1**

### Property 8: Empire list filtering
*For any* authenticated player viewing the session list, the displayed empires should include only those the player controls or can access as GM
**Validates: Requirements 6.2**

### Property 9: Session view consistency
*For any* empire link displayed in the session view, clicking that link should grant access to the empire view (no authorization failure)
**Validates: Requirements 6.3**

### Property 10: Unauthenticated redirect
*For any* unauthenticated user attempting to access an empire view or session view, the system should redirect to login without displaying any game data
**Validates: Requirements 7.1, 7.2, 7.4**

### Property 11: Static page access
*For any* authenticated player and any static page, access should be granted without requiring session or empire ownership validation
**Validates: Requirements 8.1, 8.2**

### Property 12: Page type distinction
*For any* page in the application, the authorization system should correctly identify whether it requires empire-specific authorization or is a static page
**Validates: Requirements 8.3**

## Error Handling

### Authorization Errors

**Error Types**:
1. `NOT_AUTHENTICATED`: User is not logged in
2. `NOT_OWNER`: User doesn't own the empire and is not GM
3. `SESSION_NOT_FOUND`: Session doesn't exist in database
4. `EMPIRE_NOT_FOUND`: Empire doesn't exist in database
5. `AUTHORIZATION_CHECK_FAILED`: Database query failed

**Error Handling Strategy**:
- All errors redirect to appropriate pages (login or unauthorized)
- Errors are logged for debugging but not exposed to users
- User-facing messages are generic and don't leak information
- Failed authorization attempts are logged for security monitoring

### Network Errors

- Database query failures during authorization checks should fail closed (deny access)
- Implement retry logic with exponential backoff for transient failures
- Show user-friendly "Unable to verify access" message
- Provide option to retry or return to session view

### Edge Cases

1. **Concurrent Session Changes**: If a player's empire is removed while they're viewing it
   - Next navigation will trigger re-authorization and deny access
   - Current page remains accessible until navigation

2. **Player Status Changes**: If any player (including GM) loses their empire or is removed from a session
   - Next navigation will trigger re-authorization
   - Access to previously accessible empires will be denied
   - User will be redirected to session view which will no longer show that session

3. **GM Status Changes**: If a player loses GM status
   - Next navigation will trigger re-authorization
   - Access to non-owned empires will be denied
   - User retains access only to empires they personally own

4. **Deleted Empires/Sessions**: If empire or session is deleted
   - Authorization check will return `NOT_FOUND` error
   - User redirected to session view with appropriate message

## Testing Strategy

### Test Organization

All test files are organized in the `tests/` directory, mirroring the source code structure:
- `tests/services/` - Tests for service layer (e.g., `AuthorizationService.test.ts`)
- `tests/hooks/` - Tests for React hooks (e.g., `useAuthorization.test.ts`)
- `tests/components/` - Tests for React components (e.g., `ProtectedRoute.test.tsx`)
- `tests/setupTests.js` - Global test configuration and Amplify mock setup

This organization:
- Keeps test files separate from production code
- Makes it easy to locate tests for specific modules
- Allows running all tests or specific test suites
- Maintains clear separation of concerns

### Test Runner Configuration

The project uses **Vitest** as the test runner, configured in `vite.config.js`:
- Test environment: jsdom (for React component testing)
- Global test utilities available
- Setup file: `tests/setupTests.js` (configures Amplify mocks)

### Unit Testing

**Authorization Service Tests** (`tests/services/AuthorizationService.test.ts`):
- Test `canAccessEmpire()` with various ownership scenarios
- Test `isGameMaster()` with GM and non-GM users
- Test error handling for missing sessions/empires
- Test caching behavior (if implemented)

**ProtectedRoute Component Tests** (`tests/components/auth/ProtectedRoute.test.tsx`):
- Test rendering with authorized access
- Test redirect on unauthorized access
- Test redirect on unauthenticated access
- Test loading state display
- Test static page bypass

**Hook Tests** (`tests/hooks/useAuthorization.test.ts`):
- Test `useAuthorization` hook with various scenarios
- Test loading and error states
- Test re-authorization on parameter changes

### Property-Based Testing

Property-based tests will use **fast-check** library for TypeScript/React applications.

Each property test should:
- Run a minimum of 100 iterations
- Generate random users, sessions, empires, and ownership relationships
- Verify the correctness property holds across all generated inputs
- Be tagged with the property number from this design document
- Be located in the same test file as related unit tests

**Test Data Generators**:
```typescript
// Generator for random usernames
const usernameArb = fc.string({ minLength: 3, maxLength: 20 });

// Generator for random session names
const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });

// Generator for random empire names
const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });

// Generator for empire ownership scenarios
const empireOwnershipArb = fc.record({
  username: usernameArb,
  sessionName: sessionNameArb,
  empireName: empireNameArb,
  isOwner: fc.boolean(),
  isGM: fc.boolean(),
});
```

**Property Test Structure**:
```typescript
// Example property test
it('Property 1: Owner access validation', () => {
  fc.assert(
    fc.property(empireOwnershipArb, async (scenario) => {
      // Setup: Create empire with ownership
      // Act: Call canAccessEmpire()
      // Assert: Result matches ownership rules
    }),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Authorization Flow**:
- Test complete user journey from login to empire access
- Test navigation between different empires
- Test GM accessing multiple empires
- Test unauthorized access attempts

**React Router Integration**:
- Test route protection with actual routing
- Test redirects work correctly
- Test browser back/forward button behavior

### Manual Testing Checklist

1. Login as regular player, access owned empire ✓
2. Login as regular player, attempt to access non-owned empire ✗
3. Login as GM, access any empire in managed session ✓
4. Login as GM, attempt to access empire in other session ✗
5. Access empire view without authentication ✗ (redirect to login)
6. Navigate using URL manipulation ✓ (re-authorization)
7. Use browser back button ✓ (re-authorization)
8. Access static pages while authenticated ✓
9. Session view shows only relevant sessions ✓
10. Session view shows only accessible empires ✓

## Implementation Notes

### Performance Considerations

1. **Authorization Caching**: Implement short-lived cache (5 minutes) to reduce database queries
2. **Batch Queries**: When loading session view, batch empire ownership queries
3. **Optimistic UI**: Show loading state immediately, don't block on authorization for better UX

### Security Considerations

1. **Client-Side Only**: This is client-side authorization for UX, not security
   - Backend API should also enforce authorization
   - Never trust client-side checks alone
2. **No Sensitive Data in Errors**: Error messages must not leak information
3. **Logging**: Log all authorization failures for security monitoring
4. **Session Validation**: Always validate session tokens are fresh

### Future Enhancements

1. **Role-Based Access**: Extend beyond owner/GM to support additional roles
   - **OBSERVER Role**: Players with OBSERVER empireType should have read-only access to all empires in their session
   - The authorization service is designed to support this by checking empireType
   - Implementation would add OBSERVER check alongside GM check in `canAccessEmpire()`
   - No changes to data model required (OBSERVER already exists in empireType enum)
2. **Temporary Access**: Support time-limited access grants
3. **Audit Trail**: Track all access attempts for compliance
4. **Permission Delegation**: Allow empire owners to grant temporary access to others

## Dependencies

### External Libraries
- `react-router-dom` (v6+): Already in use for routing
- `aws-amplify`: Already in use for authentication and data access
- `fast-check`: For property-based testing (to be added)

### Internal Dependencies
- Existing Amplify DataStore schema (Empire, Session models)
- Existing authentication system (Cognito via Amplify)
- Existing client functions (`getEmpiresForPlayer`, `getSession`, etc.)

### Data Access Pattern
**IMPORTANT**: All Amplify DataStore interactions MUST be centralized in `src/components/common/ClientFunctions.tsx`. 

- New components and services should NOT directly import or use `generateClient` from `aws-amplify/data`
- Instead, add new data access functions to `ClientFunctions.tsx` and import those functions
- This maintains consistency and makes the codebase more maintainable
- Example: `AuthorizationService` uses `getEmpire()` and `getGMEmpireForPlayer()` from ClientFunctions rather than directly querying the Amplify client

## Migration Strategy

### Phase 1: Add Authorization Service
1. Create `AuthorizationService.ts` with core logic
2. Add unit tests for authorization service
3. No user-facing changes yet

### Phase 2: Implement Route Protection
1. Create `ProtectedRoute` component
2. Create `UnauthorizedPage` component
3. Wrap existing routes with protection
4. Test with existing users

### Phase 3: Update Session View
1. Add filtering logic to HomePage
2. Ensure only accessible empires are shown
3. Test consistency between view and access

### Phase 4: Testing and Refinement
1. Add property-based tests
2. Perform manual testing
3. Monitor for authorization failures
4. Refine error messages based on feedback

### Rollback Plan
- Authorization checks can be disabled via feature flag
- If issues arise, remove `ProtectedRoute` wrappers
- System reverts to current open-access behavior
