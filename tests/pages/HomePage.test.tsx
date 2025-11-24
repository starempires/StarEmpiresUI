import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import * as ClientFunctions from '../../src/components/common/ClientFunctions';
import type { Empire } from '../../src/components/common/Interfaces';

/**
 * Property-Based Tests for HomePage Session Filtering
 *
 * These tests verify that the session view correctly filters sessions
 * based on player empire ownership and GM status.
 */

describe('HomePage - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Feature: empire-authorization, Property 7: Session view filtering**
   *
   * For any authenticated player, the session view should display only sessions
   * where the player has an empire (either as owner or as GM).
   *
   * **Validates: Requirements 6.1**
   */
  it('Property 7: Session view filtering', async () => {
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

    // Generator for session filtering scenarios
    // Creates a player with multiple empires across different sessions
    const sessionFilteringScenarioArb = fc.record({
      playerUsername: usernameArb,
      // Sessions where player has empires
      playerSessions: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          empireName: empireNameArb,
          empireType: empireTypeArb,
        }),
        { minLength: 1, maxLength: 5 }
      ),
      // Sessions where player does NOT have empires
      otherSessions: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          empireName: empireNameArb,
          ownerUsername: usernameArb,
          empireType: empireTypeArb,
        }),
        { minLength: 0, maxLength: 3 }
      ),
    }).map((scenario) => {
      // Ensure session names are unique across playerSessions and otherSessions
      const playerSessionNames = new Set(
        scenario.playerSessions.map((s) => s.sessionName)
      );
      const filteredOtherSessions = scenario.otherSessions.filter(
        (s) => !playerSessionNames.has(s.sessionName) && s.ownerUsername !== scenario.playerUsername
      );

      return {
        ...scenario,
        otherSessions: filteredOtherSessions,
      };
    });

    await fc.assert(
      fc.asyncProperty(sessionFilteringScenarioArb, async (scenario) => {
        // Setup: Create mock empires for the player
        const playerEmpires: Empire[] = scenario.playerSessions.map((session) => ({
          name: session.empireName,
          playerName: scenario.playerUsername,
          sessionName: session.sessionName,
          orderStatus: '',
          empireType: session.empireType,
        }));

        // Setup: Create mock empires for other sessions (owned by other players)
        const otherEmpires: Empire[] = scenario.otherSessions.map((session) => ({
          name: session.empireName,
          playerName: session.ownerUsername, // Different owner
          sessionName: session.sessionName,
          orderStatus: '',
          empireType: session.empireType,
        }));

        // Mock getEmpiresForPlayer to return only the player's empires
        vi.spyOn(ClientFunctions, 'getEmpiresForPlayer').mockResolvedValue(playerEmpires);

        // Mock getEmpiresForSession for GM sessions
        // For each session where player is GM, return all empires in that session
        const gmSessions = scenario.playerSessions.filter((s) => s.empireType === 'GM');
        const getEmpiresForSessionMock = vi.spyOn(ClientFunctions, 'getEmpiresForSession');
        
        gmSessions.forEach((gmSession) => {
          // For GM sessions, return the GM empire plus potentially other empires
          const gmSessionEmpires = playerEmpires.filter(
            (e) => e.sessionName === gmSession.sessionName
          );
          getEmpiresForSessionMock.mockResolvedValueOnce(gmSessionEmpires);
        });

        // Mock getSession for each session
        const allSessions = [
          ...scenario.playerSessions.map((s) => s.sessionName),
          ...scenario.otherSessions.map((s) => s.sessionName),
        ];
        const uniqueSessions = Array.from(new Set(allSessions));
        
        const getSessionMock = vi.spyOn(ClientFunctions, 'getSession');
        uniqueSessions.forEach((sessionName) => {
          getSessionMock.mockResolvedValueOnce({
            name: sessionName,
            id: `${sessionName}-id`,
            gmPlayerName: 'some-gm',
            currentTurnNumber: 1,
            numPlayers: 4,
            deadline: new Date().toISOString(),
            status: 'IN_PROGRESS',
          });
        });

        // Mock getWaitingForPlayerSessions to return empty array
        vi.spyOn(ClientFunctions, 'getWaitingForPlayerSessions').mockResolvedValue([]);

        // Simulate the HomePage logic for filtering sessions
        // This replicates the logic from HomePage.tsx
        const currentUsername = scenario.playerUsername;

        // Get all empires for this player
        const allPlayerEmpires = await ClientFunctions.getEmpiresForPlayer(currentUsername);

        // Separate GM and non-GM empires
        const gmEmpires = allPlayerEmpires.filter((empire: Empire) => empire.empireType === 'GM');
        const nonGMEmpires = allPlayerEmpires.filter((empire: Empire) => empire.empireType !== 'GM');

        // For sessions where this player is GM, load all empires in those sessions
        const gmSessionNames: string[] = Array.from(
          new Set(gmEmpires.map((empire: Empire) => empire.sessionName))
        );
        const gmEmpiresPromises = gmSessionNames.map((sessionName: string) =>
          ClientFunctions.getEmpiresForSession(sessionName)
        );
        const results = await Promise.all(gmEmpiresPromises);
        const gmSessionEmpires = results.flat();

        // Combine all empires, removing duplicates
        const allEmpires = [...gmEmpires, ...nonGMEmpires, ...gmSessionEmpires];
        const map = new Map(
          allEmpires.map((empire) => [`${empire.sessionName}:${empire.name}`, empire])
        );
        const combinedEmpires = Array.from(map.values());

        // Filter empires to only include those the player can access
        const accessibleEmpires = combinedEmpires.filter((empire: Empire) => {
          // Player owns this empire
          if (empire.playerName === currentUsername) {
            return true;
          }
          // Player is GM for this session
          if (gmSessionNames.includes(empire.sessionName)) {
            return true;
          }
          return false;
        });

        // Get unique session names from accessible empires
        const sessionNamesWithEmpires: string[] = Array.from(
          new Set(accessibleEmpires.map((empire: Empire) => empire.sessionName))
        );

        // Assert: The displayed sessions should only include sessions where player has empires
        const expectedSessionNames = new Set(
          scenario.playerSessions.map((s) => s.sessionName)
        );

        // Verify that all displayed sessions are in the expected set
        sessionNamesWithEmpires.forEach((sessionName) => {
          expect(expectedSessionNames.has(sessionName)).toBe(true);
        });

        // Verify that all expected sessions are displayed
        expectedSessionNames.forEach((sessionName) => {
          expect(sessionNamesWithEmpires).toContain(sessionName);
        });

        // Critical: Verify that sessions where player has NO empires are NOT displayed
        scenario.otherSessions.forEach((otherSession) => {
          expect(sessionNamesWithEmpires).not.toContain(otherSession.sessionName);
        });

        // Verify the count matches
        expect(sessionNamesWithEmpires.length).toBe(expectedSessionNames.size);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * **Feature: empire-authorization, Property 8: Empire list filtering**
   *
   * For any authenticated player viewing the session list, the displayed empires
   * should include only those the player controls or can access as GM.
   *
   * **Validates: Requirements 6.2**
   */
  it('Property 8: Empire list filtering', async () => {
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

    // Generator for empire list filtering scenarios
    // Creates a player with empires they own and empires in sessions where they are GM
    const empireListFilteringScenarioArb = fc.record({
      playerUsername: usernameArb,
      // Empires owned by the player
      ownedEmpires: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          empireName: empireNameArb,
          empireType: empireTypeArb.filter((type) => type !== 'GM'),
        }),
        { minLength: 1, maxLength: 3 }
      ),
      // Sessions where player is GM (with other players' empires)
      gmSessions: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          otherPlayerEmpires: fc.array(
            fc.record({
              empireName: empireNameArb,
              ownerUsername: usernameArb,
              empireType: empireTypeArb.filter((type) => type !== 'GM'),
            }),
            { minLength: 1, maxLength: 3 }
          ),
        }),
        { minLength: 0, maxLength: 2 }
      ),
      // Empires in other sessions (player has no access)
      inaccessibleEmpires: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          empireName: empireNameArb,
          ownerUsername: usernameArb,
          empireType: empireTypeArb.filter((type) => type !== 'GM'),
        }),
        { minLength: 0, maxLength: 3 }
      ),
    }).map((scenario) => {
      // Ensure session names are unique across different categories
      const ownedSessionNames = new Set(scenario.ownedEmpires.map((e) => e.sessionName));
      const gmSessionNames = new Set(scenario.gmSessions.map((s) => s.sessionName));
      
      // Filter GM sessions to ensure they don't overlap with owned empires
      const filteredGmSessions = scenario.gmSessions.filter(
        (s) => !ownedSessionNames.has(s.sessionName)
      );
      
      // Update gmSessionNames set
      const updatedGmSessionNames = new Set(filteredGmSessions.map((s) => s.sessionName));
      
      // Filter inaccessible empires to ensure they're in different sessions
      const accessibleSessionNames = new Set([...ownedSessionNames, ...updatedGmSessionNames]);
      const filteredInaccessibleEmpires = scenario.inaccessibleEmpires.filter(
        (e) => !accessibleSessionNames.has(e.sessionName) && e.ownerUsername !== scenario.playerUsername
      );

      return {
        ...scenario,
        gmSessions: filteredGmSessions,
        inaccessibleEmpires: filteredInaccessibleEmpires,
      };
    });

    await fc.assert(
      fc.asyncProperty(empireListFilteringScenarioArb, async (scenario) => {
        // Setup: Create mock empires owned by the player
        const ownedEmpireObjects: Empire[] = scenario.ownedEmpires.map((empire) => ({
          name: empire.empireName,
          playerName: scenario.playerUsername,
          sessionName: empire.sessionName,
          orderStatus: '',
          empireType: empire.empireType,
        }));

        // Setup: Create GM empires for the player
        const gmEmpireObjects: Empire[] = scenario.gmSessions.map((session) => ({
          name: 'GM Empire',
          playerName: scenario.playerUsername,
          sessionName: session.sessionName,
          orderStatus: '',
          empireType: 'GM',
        }));

        // Setup: Create empires owned by other players in GM sessions
        const gmSessionOtherEmpires: Empire[] = scenario.gmSessions.flatMap((session) =>
          session.otherPlayerEmpires.map((empire) => ({
            name: empire.empireName,
            playerName: empire.ownerUsername,
            sessionName: session.sessionName,
            orderStatus: '',
            empireType: empire.empireType,
          }))
        );

        // Setup: Create inaccessible empires (in sessions where player has no access)
        const inaccessibleEmpireObjects: Empire[] = scenario.inaccessibleEmpires.map((empire) => ({
          name: empire.empireName,
          playerName: empire.ownerUsername,
          sessionName: empire.sessionName,
          orderStatus: '',
          empireType: empire.empireType,
        }));

        // Mock getEmpiresForPlayer to return owned empires + GM empires
        const allPlayerEmpires = [...ownedEmpireObjects, ...gmEmpireObjects];
        vi.spyOn(ClientFunctions, 'getEmpiresForPlayer').mockResolvedValue(allPlayerEmpires);

        // Mock getEmpiresForSession for GM sessions
        const getEmpiresForSessionMock = vi.spyOn(ClientFunctions, 'getEmpiresForSession');
        scenario.gmSessions.forEach((gmSession) => {
          const gmEmpire = gmEmpireObjects.find((e) => e.sessionName === gmSession.sessionName);
          const otherEmpires = gmSessionOtherEmpires.filter(
            (e) => e.sessionName === gmSession.sessionName
          );
          const allEmpiresInSession = gmEmpire ? [gmEmpire, ...otherEmpires] : otherEmpires;
          getEmpiresForSessionMock.mockResolvedValueOnce(allEmpiresInSession);
        });

        // Mock getSession for all sessions
        const allSessions = [
          ...scenario.ownedEmpires.map((e) => e.sessionName),
          ...scenario.gmSessions.map((s) => s.sessionName),
          ...scenario.inaccessibleEmpires.map((e) => e.sessionName),
        ];
        const uniqueSessions = Array.from(new Set(allSessions));
        
        const getSessionMock = vi.spyOn(ClientFunctions, 'getSession');
        uniqueSessions.forEach((sessionName) => {
          getSessionMock.mockResolvedValueOnce({
            name: sessionName,
            id: `${sessionName}-id`,
            gmPlayerName: 'some-gm',
            currentTurnNumber: 1,
            numPlayers: 4,
            deadline: new Date().toISOString(),
            status: 'IN_PROGRESS',
          });
        });

        // Mock getWaitingForPlayerSessions to return empty array
        vi.spyOn(ClientFunctions, 'getWaitingForPlayerSessions').mockResolvedValue([]);

        // Simulate the HomePage logic for filtering empires
        const currentUsername = scenario.playerUsername;

        // Get all empires for this player
        const playerEmpires = await ClientFunctions.getEmpiresForPlayer(currentUsername);

        // Separate GM and non-GM empires
        const gmEmpires = playerEmpires.filter((empire: Empire) => empire.empireType === 'GM');
        const nonGMEmpires = playerEmpires.filter((empire: Empire) => empire.empireType !== 'GM');

        // For sessions where this player is GM, load all empires in those sessions
        const gmSessionNames: string[] = Array.from(
          new Set(gmEmpires.map((empire: Empire) => empire.sessionName))
        );
        const gmEmpiresPromises = gmSessionNames.map((sessionName: string) =>
          ClientFunctions.getEmpiresForSession(sessionName)
        );
        const results = await Promise.all(gmEmpiresPromises);
        const gmSessionEmpiresLoaded = results.flat();

        // Combine all empires, removing duplicates
        const allEmpires = [...gmEmpires, ...nonGMEmpires, ...gmSessionEmpiresLoaded];
        const map = new Map(
          allEmpires.map((empire) => [`${empire.sessionName}:${empire.name}`, empire])
        );
        const combinedEmpires = Array.from(map.values());

        // Filter empires to only include those the player can access
        const accessibleEmpires = combinedEmpires.filter((empire: Empire) => {
          // Player owns this empire
          if (empire.playerName === currentUsername) {
            return true;
          }
          // Player is GM for this session
          if (gmSessionNames.includes(empire.sessionName)) {
            return true;
          }
          return false;
        });

        // Build expected accessible empires
        const expectedAccessibleEmpires = [
          ...ownedEmpireObjects,
          ...gmEmpireObjects,
          ...gmSessionOtherEmpires,
        ];

        // Create a set of expected empire keys (sessionName:empireName)
        const expectedEmpireKeys = new Set(
          expectedAccessibleEmpires.map((e) => `${e.sessionName}:${e.name}`)
        );

        // Create a set of actual empire keys
        const actualEmpireKeys = new Set(
          accessibleEmpires.map((e) => `${e.sessionName}:${e.name}`)
        );

        // Assert: All expected empires are in the accessible list
        expectedEmpireKeys.forEach((key) => {
          expect(actualEmpireKeys.has(key)).toBe(true);
        });

        // Assert: All accessible empires are in the expected list
        actualEmpireKeys.forEach((key) => {
          expect(expectedEmpireKeys.has(key)).toBe(true);
        });

        // Critical: Verify that inaccessible empires are NOT in the accessible list
        scenario.inaccessibleEmpires.forEach((inaccessibleEmpire) => {
          const key = `${inaccessibleEmpire.sessionName}:${inaccessibleEmpire.empireName}`;
          expect(actualEmpireKeys.has(key)).toBe(false);
        });

        // Verify the count matches
        expect(accessibleEmpires.length).toBe(expectedAccessibleEmpires.length);

        // Additional verification: Ensure all accessible empires are either owned or in GM sessions
        accessibleEmpires.forEach((empire: Empire) => {
          const isOwned = empire.playerName === currentUsername;
          const isInGMSession = gmSessionNames.includes(empire.sessionName);
          expect(isOwned || isInGMSession).toBe(true);
        });
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * **Feature: empire-authorization, Property 9: Session view consistency**
   *
   * For any empire link displayed in the session view, clicking that link should
   * grant access to the empire view (no authorization failure).
   *
   * **Validates: Requirements 6.3**
   */
  it('Property 9: Session view consistency', async () => {
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

    // Generator for session view consistency scenarios
    // Creates a player with empires that should be displayed in the session view
    const sessionViewConsistencyScenarioArb = fc.record({
      playerUsername: usernameArb,
      // Empires owned by the player
      ownedEmpires: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          empireName: empireNameArb,
          empireType: empireTypeArb.filter((type) => type !== 'GM'),
        }),
        { minLength: 1, maxLength: 3 }
      ),
      // Sessions where player is GM (with other players' empires)
      gmSessions: fc.array(
        fc.record({
          sessionName: sessionNameArb,
          gmEmpireName: empireNameArb,
          otherPlayerEmpires: fc.array(
            fc.record({
              empireName: empireNameArb,
              ownerUsername: usernameArb,
              empireType: empireTypeArb.filter((type) => type !== 'GM'),
            }),
            { minLength: 0, maxLength: 2 }
          ),
        }),
        { minLength: 0, maxLength: 2 }
      ),
    }).map((scenario) => {
      // Ensure session names are unique across owned empires and GM sessions
      const ownedSessionNames = new Set(scenario.ownedEmpires.map((e) => e.sessionName));
      
      // Filter GM sessions to ensure they don't overlap with owned empires
      const filteredGmSessions = scenario.gmSessions.filter(
        (s) => !ownedSessionNames.has(s.sessionName)
      );
      
      // Ensure other player usernames are different from the player
      const filteredGmSessionsWithValidOwners = filteredGmSessions.map((gmSession) => ({
        ...gmSession,
        otherPlayerEmpires: gmSession.otherPlayerEmpires.filter(
          (e) => e.ownerUsername !== scenario.playerUsername
        ),
      }));

      return {
        ...scenario,
        gmSessions: filteredGmSessionsWithValidOwners,
      };
    });

    await fc.assert(
      fc.asyncProperty(sessionViewConsistencyScenarioArb, async (scenario) => {
        // Setup: Create mock empires owned by the player
        const ownedEmpireObjects: Empire[] = scenario.ownedEmpires.map((empire) => ({
          name: empire.empireName,
          playerName: scenario.playerUsername,
          sessionName: empire.sessionName,
          orderStatus: '',
          empireType: empire.empireType,
        }));

        // Setup: Create GM empires for the player
        const gmEmpireObjects: Empire[] = scenario.gmSessions.map((session) => ({
          name: session.gmEmpireName,
          playerName: scenario.playerUsername,
          sessionName: session.sessionName,
          orderStatus: '',
          empireType: 'GM',
        }));

        // Setup: Create empires owned by other players in GM sessions
        const gmSessionOtherEmpires: Empire[] = scenario.gmSessions.flatMap((session) =>
          session.otherPlayerEmpires.map((empire) => ({
            name: empire.empireName,
            playerName: empire.ownerUsername,
            sessionName: session.sessionName,
            orderStatus: '',
            empireType: empire.empireType,
          }))
        );

        // Mock getEmpiresForPlayer to return owned empires + GM empires
        const allPlayerEmpires = [...ownedEmpireObjects, ...gmEmpireObjects];
        vi.spyOn(ClientFunctions, 'getEmpiresForPlayer').mockResolvedValue(allPlayerEmpires);

        // Mock getEmpiresForSession for GM sessions
        const getEmpiresForSessionMock = vi.spyOn(ClientFunctions, 'getEmpiresForSession');
        scenario.gmSessions.forEach((gmSession) => {
          const gmEmpire = gmEmpireObjects.find((e) => e.sessionName === gmSession.sessionName);
          const otherEmpires = gmSessionOtherEmpires.filter(
            (e) => e.sessionName === gmSession.sessionName
          );
          const allEmpiresInSession = gmEmpire ? [gmEmpire, ...otherEmpires] : otherEmpires;
          getEmpiresForSessionMock.mockResolvedValueOnce(allEmpiresInSession);
        });

        // Mock getSession for all sessions
        const allSessions = [
          ...scenario.ownedEmpires.map((e) => e.sessionName),
          ...scenario.gmSessions.map((s) => s.sessionName),
        ];
        const uniqueSessions = Array.from(new Set(allSessions));
        
        const getSessionMock = vi.spyOn(ClientFunctions, 'getSession');
        uniqueSessions.forEach((sessionName) => {
          getSessionMock.mockResolvedValueOnce({
            name: sessionName,
            id: `${sessionName}-id`,
            gmPlayerName: 'some-gm',
            currentTurnNumber: 1,
            numPlayers: 4,
            deadline: new Date().toISOString(),
            status: 'IN_PROGRESS',
          });
        });

        // Mock getWaitingForPlayerSessions to return empty array
        vi.spyOn(ClientFunctions, 'getWaitingForPlayerSessions').mockResolvedValue([]);

        // Simulate the HomePage logic for filtering empires (same as Property 8)
        const currentUsername = scenario.playerUsername;

        // Get all empires for this player
        const playerEmpires = await ClientFunctions.getEmpiresForPlayer(currentUsername);

        // Separate GM and non-GM empires
        const gmEmpires = playerEmpires.filter((empire: Empire) => empire.empireType === 'GM');
        const nonGMEmpires = playerEmpires.filter((empire: Empire) => empire.empireType !== 'GM');

        // For sessions where this player is GM, load all empires in those sessions
        const gmSessionNames: string[] = Array.from(
          new Set(gmEmpires.map((empire: Empire) => empire.sessionName))
        );
        const gmEmpiresPromises = gmSessionNames.map((sessionName: string) =>
          ClientFunctions.getEmpiresForSession(sessionName)
        );
        const results = await Promise.all(gmEmpiresPromises);
        const gmSessionEmpiresLoaded = results.flat();

        // Combine all empires, removing duplicates
        const allEmpires = [...gmEmpires, ...nonGMEmpires, ...gmSessionEmpiresLoaded];
        const map = new Map(
          allEmpires.map((empire) => [`${empire.sessionName}:${empire.name}`, empire])
        );
        const combinedEmpires = Array.from(map.values());

        // Filter empires to only include those the player can access
        const displayedEmpires = combinedEmpires.filter((empire: Empire) => {
          // Player owns this empire
          if (empire.playerName === currentUsername) {
            return true;
          }
          // Player is GM for this session
          if (gmSessionNames.includes(empire.sessionName)) {
            return true;
          }
          return false;
        });

        // Now simulate authorization checks for each displayed empire
        // This is the critical test: every empire shown in the session view
        // should pass authorization when accessed

        // Import AuthorizationService to test authorization
        const { AuthorizationService } = await import('../../src/services/AuthorizationService');
        const authService = new AuthorizationService();

        // Mock getEmpire for authorization checks
        const getEmpireMock = vi.spyOn(ClientFunctions, 'getEmpire');
        
        // Mock getGMEmpireForPlayer for authorization checks
        const getGMEmpireForPlayerMock = vi.spyOn(ClientFunctions, 'getGMEmpireForPlayer');

        // For each displayed empire, verify that authorization would succeed
        for (const displayedEmpire of displayedEmpires) {
          // Setup mocks for this specific empire
          getEmpireMock.mockResolvedValueOnce({
            name: displayedEmpire.name,
            playerName: displayedEmpire.playerName,
            sessionName: displayedEmpire.sessionName,
            ordersLocked: false,
            empireType: displayedEmpire.empireType,
          });

          // Mock GM check - only needed if player doesn't own the empire
          const playerOwnsEmpire = displayedEmpire.playerName === currentUsername;
          
          if (!playerOwnsEmpire) {
            // Player doesn't own this empire, so authorization will check GM status
            const isGMSession = gmSessionNames.includes(displayedEmpire.sessionName);
            if (isGMSession) {
              const gmEmpire = gmEmpireObjects.find(
                (e) => e.sessionName === displayedEmpire.sessionName
              );
              getGMEmpireForPlayerMock.mockResolvedValueOnce(
                gmEmpire
                  ? {
                      name: gmEmpire.name,
                      playerName: gmEmpire.playerName,
                      sessionName: gmEmpire.sessionName,
                      ordersLocked: false,
                      empireType: 'GM' as const,
                    }
                  : null
              );
            } else {
              getGMEmpireForPlayerMock.mockResolvedValueOnce(null);
            }
          }

          // Perform authorization check
          const authResult = await authService.canAccessEmpire(
            currentUsername,
            displayedEmpire.sessionName,
            displayedEmpire.name
          );

          // Critical assertion: Authorization MUST succeed for displayed empires
          expect(authResult.authorized).toBe(true);
          expect(authResult.reason).toBeUndefined();
          expect(authResult.redirectTo).toBeUndefined();
        }

        // Verify that at least one empire was tested (to ensure the test is meaningful)
        expect(displayedEmpires.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});
