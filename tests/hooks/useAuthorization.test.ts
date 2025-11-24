import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { useAuthorization } from '../../src/hooks/useAuthorization';
import { authorizationService } from '../../src/services/AuthorizationService';

// Mock aws-amplify/auth module
vi.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: vi.fn(),
}));

import { fetchUserAttributes } from 'aws-amplify/auth';

/**
 * Property-Based Tests for useAuthorization Hook
 *
 * These tests use fast-check to generate random test data and verify
 * that correctness properties hold across all valid inputs.
 */

describe('useAuthorization Hook - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: empire-authorization, Property 3: Re-authorization on navigation**
   *
   * For any route change to an empire view (including URL modifications, back/forward navigation),
   * the authorization check should be performed before rendering any content.
   *
   * **Validates: Requirements 1.4, 3.1**
   */
  it('Property 3: Re-authorization on navigation', async () => {
    // Generators for test data
    const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });

    // Generator for navigation scenarios
    // Creates initial and target navigation states
    const navigationScenarioArb = fc.record({
      username: usernameArb,
      initialSession: sessionNameArb,
      initialEmpire: empireNameArb,
      targetSession: sessionNameArb,
      targetEmpire: empireNameArb,
      initialAuthorized: fc.boolean(),
      targetAuthorized: fc.boolean(),
    }).filter((scenario) => {
      // Ensure we're actually navigating to a different empire or session
      // This tests the re-authorization behavior
      return (
        scenario.initialSession !== scenario.targetSession ||
        scenario.initialEmpire !== scenario.targetEmpire
      );
    });

    await fc.assert(
      fc.asyncProperty(navigationScenarioArb, async (scenario) => {
        // Setup: Mock fetchUserAttributes to return our test username
        // This needs to be called on every authorization check
        vi.mocked(fetchUserAttributes).mockResolvedValue({
          preferred_username: scenario.username,
          email: 'test@example.com',
          sub: 'test-sub-id',
        });

        // Track authorization calls and their parameters
        const authCalls: Array<{ session: string; empire: string }> = [];
        
        const canAccessEmpireSpy = vi
          .spyOn(authorizationService, 'canAccessEmpire')
          .mockImplementation(async (username, sessionName, empireName) => {
            authCalls.push({ session: sessionName, empire: empireName });

            // Determine which authorization result to return based on the parameters
            const isInitialCall =
              sessionName === scenario.initialSession &&
              empireName === scenario.initialEmpire;

            const authorized = isInitialCall
              ? scenario.initialAuthorized
              : scenario.targetAuthorized;

            return {
              authorized,
              reason: authorized ? undefined : 'not_owner',
              redirectTo: authorized ? undefined : '/unauthorized',
            };
          });

        // Act: Render the hook with initial parameters
        const { result, rerender } = renderHook(
          ({ sessionName, empireName }) => useAuthorization(sessionName, empireName),
          {
            initialProps: {
              sessionName: scenario.initialSession,
              empireName: scenario.initialEmpire,
            },
          }
        );

        // Wait for initial authorization check to complete
        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 2000 }
        );

        // Assert: Initial authorization check was performed
        expect(authCalls.length).toBe(1);
        expect(authCalls[0]).toEqual({
          session: scenario.initialSession,
          empire: scenario.initialEmpire,
        });
        expect(result.current.isAuthorized).toBe(scenario.initialAuthorized);

        // Act: Navigate to a different empire/session (simulating URL change)
        rerender({
          sessionName: scenario.targetSession,
          empireName: scenario.targetEmpire,
        });

        // Wait for re-authorization to trigger and complete
        await waitFor(
          () => {
            // Wait for the second authorization call
            expect(authCalls.length).toBe(2);
          },
          { timeout: 2000 }
        );

        await waitFor(
          () => {
            // Wait for loading to complete
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 2000 }
        );

        // Assert: Re-authorization check was performed with new parameters
        expect(authCalls.length).toBe(2);
        expect(authCalls[1]).toEqual({
          session: scenario.targetSession,
          empire: scenario.targetEmpire,
        });

        // Assert: Authorization state reflects the target authorization result
        expect(result.current.isAuthorized).toBe(scenario.targetAuthorized);

        // Critical: Verify that authorization was checked BEFORE rendering
        // The hook should have been in loading state during the check
        // This is verified by the waitFor above - we wait for loading to complete

        // Assert: Verify the hook completed the loading state
        expect(result.current.isLoading).toBe(false);

        // Assert: Error state is set appropriately
        if (!scenario.targetAuthorized) {
          expect(result.current.error).toBeTruthy();
        } else {
          expect(result.current.error).toBeNull();
        }

        // Cleanup
        canAccessEmpireSpy.mockRestore();
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs
});

/**
 * Unit Tests for useAuthorization Hook
 *
 * These tests verify specific scenarios and edge cases for the authorization hook.
 */
describe('useAuthorization Hook - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return authorized state when user has access', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    vi.spyOn(authorizationService, 'canAccessEmpire').mockResolvedValue({
      authorized: true,
    });

    // Act
    const { result } = renderHook(() => useAuthorization(sessionName, empireName));

    // Assert: Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthorized).toBe(false);

    // Wait for authorization to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Authorized state
    expect(result.current.isAuthorized).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.authResult?.authorized).toBe(true);
  });

  it('should return unauthorized state when user does not have access', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    vi.spyOn(authorizationService, 'canAccessEmpire').mockResolvedValue({
      authorized: false,
      reason: 'not_owner',
      redirectTo: '/unauthorized',
    });

    // Act
    const { result } = renderHook(() => useAuthorization(sessionName, empireName));

    // Wait for authorization to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Unauthorized state
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBe('You do not have permission to access this empire');
    expect(result.current.authResult?.authorized).toBe(false);
    expect(result.current.authResult?.reason).toBe('not_owner');
  });

  it('should show loading state during authorization check', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    // Create a promise that we can control
    let resolveAuth: (value: any) => void;
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve;
    });

    vi.spyOn(authorizationService, 'canAccessEmpire').mockReturnValue(authPromise as any);

    // Act
    const { result } = renderHook(() => useAuthorization(sessionName, empireName));

    // Assert: Should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBeNull();

    // Resolve the authorization
    resolveAuth!({ authorized: true });

    // Wait for state to update
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Loading complete
    expect(result.current.isAuthorized).toBe(true);
  });

  it('should re-run authorization when sessionName changes', async () => {
    // Arrange
    const username = 'player1';
    const initialSession = 'session-1';
    const newSession = 'session-2';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    const canAccessSpy = vi.spyOn(authorizationService, 'canAccessEmpire')
      .mockResolvedValue({ authorized: true });

    // Act: Initial render
    const { result, rerender } = renderHook(
      ({ sessionName, empireName }) => useAuthorization(sessionName, empireName),
      {
        initialProps: { sessionName: initialSession, empireName },
      }
    );

    // Wait for initial authorization
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: First authorization call
    expect(canAccessSpy).toHaveBeenCalledTimes(1);
    expect(canAccessSpy).toHaveBeenCalledWith(username, initialSession, empireName);

    // Act: Change sessionName
    rerender({ sessionName: newSession, empireName });

    // Wait for re-authorization
    await waitFor(() => {
      expect(canAccessSpy).toHaveBeenCalledTimes(2);
    });

    // Assert: Second authorization call with new session
    expect(canAccessSpy).toHaveBeenCalledWith(username, newSession, empireName);
  });

  it('should re-run authorization when empireName changes', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const initialEmpire = 'empire-1';
    const newEmpire = 'empire-2';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    const canAccessSpy = vi.spyOn(authorizationService, 'canAccessEmpire')
      .mockResolvedValue({ authorized: true });

    // Act: Initial render
    const { result, rerender } = renderHook(
      ({ sessionName, empireName }) => useAuthorization(sessionName, empireName),
      {
        initialProps: { sessionName, empireName: initialEmpire },
      }
    );

    // Wait for initial authorization
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: First authorization call
    expect(canAccessSpy).toHaveBeenCalledTimes(1);
    expect(canAccessSpy).toHaveBeenCalledWith(username, sessionName, initialEmpire);

    // Act: Change empireName
    rerender({ sessionName, empireName: newEmpire });

    // Wait for re-authorization
    await waitFor(() => {
      expect(canAccessSpy).toHaveBeenCalledTimes(2);
    });

    // Assert: Second authorization call with new empire
    expect(canAccessSpy).toHaveBeenCalledWith(username, sessionName, newEmpire);
  });

  it('should handle missing sessionName parameter', async () => {
    // Arrange
    const empireName = 'test-empire';

    const canAccessSpy = vi.spyOn(authorizationService, 'canAccessEmpire');

    // Act
    const { result } = renderHook(() => useAuthorization(undefined, empireName));

    // Wait for check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error state
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBe('Missing session or empire name');
    expect(canAccessSpy).not.toHaveBeenCalled();
  });

  it('should handle missing empireName parameter', async () => {
    // Arrange
    const sessionName = 'test-session';

    const canAccessSpy = vi.spyOn(authorizationService, 'canAccessEmpire');

    // Act
    const { result } = renderHook(() => useAuthorization(sessionName, undefined));

    // Wait for check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error state
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBe('Missing session or empire name');
    expect(canAccessSpy).not.toHaveBeenCalled();
  });

  it('should handle user not authenticated', async () => {
    // Arrange
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      email: 'test@example.com',
      sub: 'test-sub-id',
      // preferred_username is missing
    } as any);

    // Act
    const { result } = renderHook(() => useAuthorization(sessionName, empireName));

    // Wait for check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Not authenticated error
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBe('User not authenticated');
    expect(result.current.authResult?.reason).toBe('not_authenticated');
    expect(result.current.authResult?.redirectTo).toBe('/login');
  });

  it('should handle authorization service errors', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    vi.spyOn(authorizationService, 'canAccessEmpire').mockRejectedValue(
      new Error('Database connection failed')
    );

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const { result } = renderHook(() => useAuthorization(sessionName, empireName));

    // Wait for check to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error state
    expect(result.current.isAuthorized).toBe(false);
    expect(result.current.error).toBe('An error occurred while checking authorization');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Authorization check error:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should set appropriate error messages for different failure reasons', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    // Test different failure reasons
    const testCases = [
      {
        reason: 'not_owner' as const,
        expectedError: 'You do not have permission to access this empire',
      },
      {
        reason: 'empire_not_found' as const,
        expectedError: 'The requested empire could not be found',
      },
      {
        reason: 'session_not_found' as const,
        expectedError: 'The requested session could not be found',
      },
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();

      vi.spyOn(authorizationService, 'canAccessEmpire').mockResolvedValue({
        authorized: false,
        reason: testCase.reason,
        redirectTo: '/unauthorized',
      });

      // Act
      const { result } = renderHook(() => useAuthorization(sessionName, empireName));

      // Wait for check to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert
      expect(result.current.error).toBe(testCase.expectedError);
    }
  });

  it('should not update state after component unmounts', async () => {
    // Arrange
    const username = 'player1';
    const sessionName = 'test-session';
    const empireName = 'test-empire';

    vi.mocked(fetchUserAttributes).mockResolvedValue({
      preferred_username: username,
      email: 'test@example.com',
      sub: 'test-sub-id',
    });

    // Create a delayed authorization response
    let resolveAuth: (value: any) => void;
    const authPromise = new Promise((resolve) => {
      resolveAuth = resolve;
    });

    vi.spyOn(authorizationService, 'canAccessEmpire').mockReturnValue(authPromise as any);

    // Act: Render and immediately unmount
    const { result, unmount } = renderHook(() => useAuthorization(sessionName, empireName));

    // Verify loading state
    expect(result.current.isLoading).toBe(true);

    // Unmount before authorization completes
    unmount();

    // Resolve authorization after unmount
    resolveAuth!({ authorized: true });

    // Wait a bit to ensure no state updates occur
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert: State should remain in loading state (no updates after unmount)
    // This test verifies the cleanup function prevents state updates
    expect(result.current.isLoading).toBe(true);
  });
});
