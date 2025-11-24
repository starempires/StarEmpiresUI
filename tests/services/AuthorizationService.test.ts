import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AuthorizationService } from '../../src/services/AuthorizationService';
import * as ClientFunctions from '../../src/components/common/ClientFunctions';

/**
 * Property-Based Tests for AuthorizationService
 *
 * These tests use fast-check to generate random test data and verify
 * that correctness properties hold across all valid inputs.
 */

describe('AuthorizationService - Property-Based Tests', () => {
  let authService: AuthorizationService;

  beforeEach(() => {
    authService = new AuthorizationService();
    vi.clearAllMocks();
  });

  /**
   * **Feature: empire-authorization, Property 1: Owner access validation**
   *
   * For any authenticated user, session, and empire, when the user attempts
   * to access an empire view, authorization should be granted if and only if
   * the user owns that empire in that session.
   *
   * **Validates: Requirements 1.1**
   */
  it('Property 1: Owner access validation', async () => {
    // Generators for test data
    const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireTypeArb = fc.constantFrom(
      'ABANDONED',
      'ACTIVE',
      'GM',
      'HOMELESS',
      'INACTIVE',
      'NPC',
      'OBSERVER'
    );

    // Generator for empire ownership scenarios
    const ownershipScenarioArb = fc
      .record({
        username: usernameArb,
        sessionName: sessionNameArb,
        empireName: empireNameArb,
        empireOwner: usernameArb,
        empireType: empireTypeArb,
        isOwner: fc.boolean(),
        isGM: fc.boolean(),
      })
      .map((scenario) => {
        // Ensure isOwner matches whether username equals empireOwner
        const actualIsOwner = scenario.username === scenario.empireOwner;
        return {
          ...scenario,
          empireOwner: actualIsOwner ? scenario.username : scenario.empireOwner,
          isOwner: actualIsOwner,
        };
      });

    await fc.assert(
      fc.asyncProperty(ownershipScenarioArb, async (scenario) => {
        // Setup: Mock the ClientFunctions to return our test empire
        const mockEmpire = {
          name: scenario.empireName,
          playerName: scenario.empireOwner,
          sessionName: scenario.sessionName,
          ordersLocked: false,
          empireType: scenario.empireType,
        };

        vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);

        // Mock GM status
        const mockGMEmpire = scenario.isGM
          ? {
              name: 'GM Empire',
              playerName: scenario.username,
              sessionName: scenario.sessionName,
              ordersLocked: false,
              empireType: 'GM' as const,
            }
          : null;

        vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(
          mockGMEmpire
        );

        // Act: Call canAccessEmpire
        const result = await authService.canAccessEmpire(
          scenario.username,
          scenario.sessionName,
          scenario.empireName
        );

        // Assert: Authorization should be granted if and only if user owns empire OR is GM
        const shouldBeAuthorized = scenario.isOwner || scenario.isGM;

        expect(result.authorized).toBe(shouldBeAuthorized);

        // Additional assertions for denied access
        if (!shouldBeAuthorized) {
          expect(result.reason).toBe('not_owner');
          expect(result.redirectTo).toBe('/unauthorized');
        }

        // Verify that getEmpire was called with correct parameters
        expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(
          scenario.sessionName,
          scenario.empireName
        );

        // If not owner, verify GM check was performed
        if (!scenario.isOwner) {
          expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(
            scenario.sessionName,
            scenario.username
          );
        }
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * **Feature: empire-authorization, Property 2: Unauthorized access denial**
   *
   * For any authenticated user and empire they do not own, attempting to access
   * that empire's view should result in access denial and no empire data being returned.
   *
   * **Validates: Requirements 1.2, 3.2**
   */
  it('Property 2: Unauthorized access denial', async () => {
    // Generators for test data
    const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireTypeArb = fc.constantFrom(
      'ABANDONED',
      'ACTIVE',
      'HOMELESS',
      'INACTIVE',
      'NPC',
      'OBSERVER'
    );

    // Generator for unauthorized access scenarios
    // Ensures the user does NOT own the empire and is NOT a GM
    const unauthorizedScenarioArb = fc.record({
      username: usernameArb,
      sessionName: sessionNameArb,
      empireName: empireNameArb,
      empireOwner: usernameArb,
      empireType: empireTypeArb,
    }).filter((scenario) => {
      // Filter to ensure username is different from empireOwner
      // This guarantees the user does not own the empire
      return scenario.username !== scenario.empireOwner;
    });

    await fc.assert(
      fc.asyncProperty(unauthorizedScenarioArb, async (scenario) => {
        // Setup: Mock the ClientFunctions to return an empire owned by someone else
        const mockEmpire = {
          name: scenario.empireName,
          playerName: scenario.empireOwner, // Different from scenario.username
          sessionName: scenario.sessionName,
          ordersLocked: false,
          empireType: scenario.empireType,
        };

        vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);

        // Mock that user is NOT a GM (no GM empire for this user)
        vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(null);

        // Act: Call canAccessEmpire
        const result = await authService.canAccessEmpire(
          scenario.username,
          scenario.sessionName,
          scenario.empireName
        );

        // Assert: Access should be denied
        expect(result.authorized).toBe(false);
        
        // Assert: Should have a reason for denial
        expect(result.reason).toBe('not_owner');
        
        // Assert: Should redirect to unauthorized page
        expect(result.redirectTo).toBe('/unauthorized');

        // Verify that getEmpire was called (attempting to fetch empire data)
        expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(
          scenario.sessionName,
          scenario.empireName
        );

        // Verify that GM check was performed (since user doesn't own the empire)
        expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(
          scenario.sessionName,
          scenario.username
        );

        // Critical: Verify no empire data is returned in the result
        // The result should not contain any empire information
        expect(result).not.toHaveProperty('empireData');
        expect(result).not.toHaveProperty('empire');
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * **Feature: empire-authorization, Property 4: GM universal access within session**
   *
   * For any Game Master and any empire within their managed session, the GM should
   * be granted access to that empire's view.
   *
   * **Validates: Requirements 2.1**
   */
  it('Property 4: GM universal access within session', async () => {
    // Generators for test data
    const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireTypeArb = fc.constantFrom(
      'ABANDONED',
      'ACTIVE',
      'HOMELESS',
      'INACTIVE',
      'NPC',
      'OBSERVER'
    );

    // Generator for GM access scenarios
    // GM user accessing any empire in their managed session
    const gmAccessScenarioArb = fc.record({
      gmUsername: usernameArb,
      sessionName: sessionNameArb,
      empireName: empireNameArb,
      empireOwner: usernameArb, // Different player owns the empire
      empireType: empireTypeArb,
    }).filter((scenario) => {
      // Ensure GM is not the owner of the empire being accessed
      // This tests that GM access works even when they don't own the empire
      return scenario.gmUsername !== scenario.empireOwner;
    });

    await fc.assert(
      fc.asyncProperty(gmAccessScenarioArb, async (scenario) => {
        // Setup: Mock the ClientFunctions to return an empire owned by someone else
        const mockEmpire = {
          name: scenario.empireName,
          playerName: scenario.empireOwner, // Owned by a different player
          sessionName: scenario.sessionName,
          ordersLocked: false,
          empireType: scenario.empireType,
        };

        vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);

        // Mock that the user IS a GM for this session
        const mockGMEmpire = {
          name: 'GM Empire',
          playerName: scenario.gmUsername,
          sessionName: scenario.sessionName,
          ordersLocked: false,
          empireType: 'GM' as const,
        };

        vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(
          mockGMEmpire
        );

        // Act: Call canAccessEmpire as a GM
        const result = await authService.canAccessEmpire(
          scenario.gmUsername,
          scenario.sessionName,
          scenario.empireName
        );

        // Assert: GM should be granted access to any empire in their session
        expect(result.authorized).toBe(true);
        
        // Assert: No reason or redirect should be present for authorized access
        expect(result.reason).toBeUndefined();
        expect(result.redirectTo).toBeUndefined();

        // Verify that getEmpire was called with correct parameters
        expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(
          scenario.sessionName,
          scenario.empireName
        );

        // Verify that GM check was performed (since GM doesn't own the empire)
        expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(
          scenario.sessionName,
          scenario.gmUsername
        );
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * **Feature: empire-authorization, Property 5: GM session boundary**
   *
   * For any Game Master and any session they do not manage, attempting to access
   * empires in that session should result in access denial.
   *
   * **Validates: Requirements 2.2**
   */
  it('Property 5: GM session boundary', async () => {
    // Generators for test data
    const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireTypeArb = fc.constantFrom(
      'ABANDONED',
      'ACTIVE',
      'HOMELESS',
      'INACTIVE',
      'NPC',
      'OBSERVER'
    );

    // Generator for GM cross-session access scenarios
    // GM user attempting to access an empire in a different session
    const gmCrossSessionScenarioArb = fc.record({
      gmUsername: usernameArb,
      managedSessionName: sessionNameArb,
      targetSessionName: sessionNameArb,
      empireName: empireNameArb,
      empireOwner: usernameArb,
      empireType: empireTypeArb,
    }).filter((scenario) => {
      // Ensure the target session is different from the GM's managed session
      // AND ensure the GM doesn't own the empire (to test pure GM boundary)
      return (
        scenario.managedSessionName !== scenario.targetSessionName &&
        scenario.gmUsername !== scenario.empireOwner
      );
    });

    await fc.assert(
      fc.asyncProperty(gmCrossSessionScenarioArb, async (scenario) => {
        // Setup: Mock the ClientFunctions to return an empire in a different session
        const mockEmpire = {
          name: scenario.empireName,
          playerName: scenario.empireOwner, // Owned by a different player
          sessionName: scenario.targetSessionName, // In a different session
          ordersLocked: false,
          empireType: scenario.empireType,
        };

        vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);

        // Mock that the user IS a GM, but for a DIFFERENT session
        // The GM empire is in managedSessionName, not targetSessionName
        vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(null);

        // Act: Call canAccessEmpire as a GM trying to access a different session
        const result = await authService.canAccessEmpire(
          scenario.gmUsername,
          scenario.targetSessionName,
          scenario.empireName
        );

        // Assert: GM should be DENIED access to empires in other sessions
        expect(result.authorized).toBe(false);
        
        // Assert: Should have a reason for denial
        expect(result.reason).toBe('not_owner');
        
        // Assert: Should redirect to unauthorized page
        expect(result.redirectTo).toBe('/unauthorized');

        // Verify that getEmpire was called with the target session
        expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(
          scenario.targetSessionName,
          scenario.empireName
        );

        // Verify that GM check was performed for the target session
        // This should return null because GM manages a different session
        expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(
          scenario.targetSessionName,
          scenario.gmUsername
        );

        // Critical: Verify no empire data is returned in the result
        expect(result).not.toHaveProperty('empireData');
        expect(result).not.toHaveProperty('empire');
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * **Feature: empire-authorization, Property 6: Error message security**
   *
   * For any authorization failure, the error message should not contain sensitive
   * information such as other player names, empire details, or session data.
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 6: Error message security', async () => {
    // Generators for test data
    const usernameArb = fc.string({ minLength: 3, maxLength: 20 });
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireNameArb = fc.string({ minLength: 3, maxLength: 30 });
    const empireTypeArb = fc.constantFrom(
      'ABANDONED',
      'ACTIVE',
      'HOMELESS',
      'INACTIVE',
      'NPC',
      'OBSERVER'
    );

    // Generator for various authorization failure scenarios
    const authFailureScenarioArb = fc.record({
      username: usernameArb,
      sessionName: sessionNameArb,
      empireName: empireNameArb,
      empireOwner: usernameArb,
      empireType: empireTypeArb,
      empireExists: fc.boolean(),
      isGM: fc.boolean(),
    }).filter((scenario) => {
      // Filter to ensure this is an authorization failure scenario
      // User doesn't own the empire and is not GM
      return scenario.username !== scenario.empireOwner && !scenario.isGM;
    });

    await fc.assert(
      fc.asyncProperty(authFailureScenarioArb, async (scenario) => {
        // Setup: Mock the ClientFunctions based on whether empire exists
        const mockEmpire = scenario.empireExists
          ? {
              name: scenario.empireName,
              playerName: scenario.empireOwner,
              sessionName: scenario.sessionName,
              ordersLocked: false,
              empireType: scenario.empireType,
            }
          : null;

        vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);

        // Mock that user is NOT a GM
        vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(null);

        // Act: Call canAccessEmpire
        const result = await authService.canAccessEmpire(
          scenario.username,
          scenario.sessionName,
          scenario.empireName
        );

        // Assert: Access should be denied
        expect(result.authorized).toBe(false);

        // Critical security checks: Verify the result does not contain sensitive information
        const resultString = JSON.stringify(result);

        // The result should NOT contain the empire owner's name (other player's name)
        if (scenario.empireExists) {
          expect(resultString).not.toContain(scenario.empireOwner);
        }

        // The result should NOT contain the empire name
        expect(resultString).not.toContain(scenario.empireName);

        // The result should NOT contain the session name
        expect(resultString).not.toContain(scenario.sessionName);

        // The result should NOT contain the requesting username
        expect(resultString).not.toContain(scenario.username);

        // The result should NOT contain empire type information
        expect(resultString).not.toContain(scenario.empireType);

        // Verify the result only contains safe, generic information
        expect(result).toHaveProperty('authorized');
        expect(result).toHaveProperty('reason');
        expect(result).toHaveProperty('redirectTo');

        // Verify the reason is a generic code, not a descriptive message
        const validReasons = ['not_authenticated', 'not_owner', 'session_not_found', 'empire_not_found'];
        expect(validReasons).toContain(result.reason);

        // Verify the redirect path is generic
        expect(result.redirectTo).toMatch(/^\/(unauthorized|login)$/);

        // Verify no additional properties that might leak information
        const allowedKeys = ['authorized', 'reason', 'redirectTo'];
        const resultKeys = Object.keys(result);
        resultKeys.forEach((key) => {
          expect(allowedKeys).toContain(key);
        });
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

/**
 * Unit Tests for AuthorizationService
 *
 * These tests verify specific scenarios and edge cases for the authorization service.
 */
describe('AuthorizationService - Unit Tests', () => {
  let authService: AuthorizationService;

  beforeEach(() => {
    authService = new AuthorizationService();
    vi.clearAllMocks();
  });

  describe('canAccessEmpire', () => {
    it('should grant access when user owns the empire', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';
      const empireName = 'test-empire';

      const mockEmpire = {
        name: empireName,
        playerName: username,
        sessionName: sessionName,
        ordersLocked: false,
        empireType: 'ACTIVE' as const,
      };

      vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.redirectTo).toBeUndefined();
      expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(sessionName, empireName);
    });

    it('should deny access when user does not own the empire and is not GM', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';
      const empireName = 'test-empire';

      const mockEmpire = {
        name: empireName,
        playerName: 'player2', // Different owner
        sessionName: sessionName,
        ordersLocked: false,
        empireType: 'ACTIVE' as const,
      };

      vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);
      vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(null);

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('not_owner');
      expect(result.redirectTo).toBe('/unauthorized');
      expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(sessionName, empireName);
      expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(sessionName, username);
    });

    it('should grant access when user is GM for the session', async () => {
      // Arrange
      const username = 'gm-player';
      const sessionName = 'test-session';
      const empireName = 'test-empire';

      const mockEmpire = {
        name: empireName,
        playerName: 'player2', // Different owner
        sessionName: sessionName,
        ordersLocked: false,
        empireType: 'ACTIVE' as const,
      };

      const mockGMEmpire = {
        name: 'GM Empire',
        playerName: username,
        sessionName: sessionName,
        ordersLocked: false,
        empireType: 'GM' as const,
      };

      vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);
      vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(mockGMEmpire);

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(result.redirectTo).toBeUndefined();
      expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(sessionName, empireName);
      expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(sessionName, username);
    });

    it('should deny access when empire does not exist', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';
      const empireName = 'nonexistent-empire';

      vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(null);

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('empire_not_found');
      expect(result.redirectTo).toBe('/unauthorized');
      expect(ClientFunctions.getEmpire).toHaveBeenCalledWith(sessionName, empireName);
    });

    it('should deny access when username is empty', async () => {
      // Arrange
      const username = '';
      const sessionName = 'test-session';
      const empireName = 'test-empire';

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('not_authenticated');
      expect(result.redirectTo).toBe('/login');
      expect(ClientFunctions.getEmpire).not.toHaveBeenCalled();
    });

    it('should deny access when database query fails', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';
      const empireName = 'test-empire';

      vi.spyOn(ClientFunctions, 'getEmpire').mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('not_owner');
      expect(result.redirectTo).toBe('/unauthorized');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Authorization check failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should not check GM status if user owns the empire', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';
      const empireName = 'test-empire';

      const mockEmpire = {
        name: empireName,
        playerName: username,
        sessionName: sessionName,
        ordersLocked: false,
        empireType: 'ACTIVE' as const,
      };

      vi.spyOn(ClientFunctions, 'getEmpire').mockResolvedValue(mockEmpire);
      const gmCheckSpy = vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer');

      // Act
      const result = await authService.canAccessEmpire(username, sessionName, empireName);

      // Assert
      expect(result.authorized).toBe(true);
      expect(gmCheckSpy).not.toHaveBeenCalled();
    });
  });

  describe('isGameMaster', () => {
    it('should return true when user has a GM empire in the session', async () => {
      // Arrange
      const username = 'gm-player';
      const sessionName = 'test-session';

      const mockGMEmpire = {
        name: 'GM Empire',
        playerName: username,
        sessionName: sessionName,
        ordersLocked: false,
        empireType: 'GM' as const,
      };

      vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(mockGMEmpire);

      // Act
      const result = await authService.isGameMaster(username, sessionName);

      // Assert
      expect(result).toBe(true);
      expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(sessionName, username);
    });

    it('should return false when user does not have a GM empire in the session', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';

      vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(null);

      // Act
      const result = await authService.isGameMaster(username, sessionName);

      // Assert
      expect(result).toBe(false);
      expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(sessionName, username);
    });

    it('should return false when database query fails', async () => {
      // Arrange
      const username = 'player1';
      const sessionName = 'test-session';

      vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await authService.isGameMaster(username, sessionName);

      // Assert
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error checking GM status:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should return false when GM empire exists but for a different session', async () => {
      // Arrange
      const username = 'gm-player';
      const sessionName = 'test-session';

      // GM has an empire in a different session
      vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer').mockResolvedValue(null);

      // Act
      const result = await authService.isGameMaster(username, sessionName);

      // Assert
      expect(result).toBe(false);
      expect(ClientFunctions.getGMEmpireForPlayer).toHaveBeenCalledWith(sessionName, username);
    });
  });
});
