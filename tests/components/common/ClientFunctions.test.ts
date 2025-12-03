import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Mock the Amplify client before importing ClientFunctions
// We need to create the mocks inside the factory to avoid hoisting issues
vi.mock('aws-amplify/data', () => {
  const mockEmpireList = vi.fn();
  const mockSessionList = vi.fn();
  
  const mockClient = {
    models: {
      Empire: {
        list: mockEmpireList,
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      },
      Session: {
        list: mockSessionList,
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        get: vi.fn(),
      },
      Message: {
        list: vi.fn(),
      },
      MessageRecipient: {
        list: vi.fn(),
      },
    },
  };
  
  return {
    generateClient: () => mockClient,
  };
});

// Mock SessionAPI functions
vi.mock('../../../src/components/common/ClientFunctions.test.ts', () => ({
  generateSnapshots: vi.fn(),
  startSession: vi.fn(),
}));

// Import after mocking
import * as ClientFunctions from '../../../src/components/common/ClientFunctions';
import { generateClient } from 'aws-amplify/data';

// Get reference to the mocked client so we can configure it in tests
const mockClient = generateClient() as any;

/**
 * Property-Based Tests for ClientFunctions
 *
 * These tests use fast-check to generate random test data and verify
 * that correctness properties hold across all valid inputs.
 */

describe('ClientFunctions - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: session-auto-start, Property 1: Active empire counting accuracy**
   *
   * For any session with a mix of empire types, counting active empires should return
   * only the count of empires with empireType set to ACTIVE or NPC
   *
   * **Validates: Requirements 5.1**
   */
  it('Property 1: Active empire counting accuracy', async () => {
    // Generator for empire types
    const empireTypeArb = fc.constantFrom(
      'ACTIVE', 'GM', 'OBSERVER', 'INACTIVE', 'ABANDONED', 'NPC', 'HOMELESS'
    );

    // Generator for a single empire
    const empireArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 20 }),
      playerName: fc.string({ minLength: 3, maxLength: 20 }),
      sessionName: fc.constant('test-session'),
      empireType: empireTypeArb,
      ordersLocked: fc.boolean(),
    });

    // Generator for an array of empires
    const empiresArb = fc.array(empireArb, { minLength: 0, maxLength: 20 });

    await fc.assert(
      fc.asyncProperty(empiresArb, async (empires) => {
        // Setup: Mock Empire.list to return our generated empires
        mockClient.models.Empire.list.mockResolvedValue({
          data: empires,
          errors: [],
        });

        // Act: Call countActiveEmpires
        const count = await ClientFunctions.countActiveEmpires('test-session');

        // Assert: Count should match the number of ACTIVE and NPC empires
        const expectedCount = empires.filter(
          (empire) => empire.empireType === 'ACTIVE' || empire.empireType === 'NPC'
        ).length;

        expect(count).toBe(expectedCount);

        // Additional assertions to verify the property:
        // 1. GM empires should not be counted
        const gmCount = empires.filter((e) => e.empireType === 'GM').length;
        if (gmCount > 0) {
          expect(count).toBeLessThanOrEqual(empires.length - gmCount);
        }

        // 2. OBSERVER empires should not be counted
        const observerCount = empires.filter((e) => e.empireType === 'OBSERVER').length;
        if (observerCount > 0) {
          expect(count).toBeLessThanOrEqual(empires.length - observerCount);
        }

        // 3. INACTIVE empires should not be counted
        const inactiveCount = empires.filter((e) => e.empireType === 'INACTIVE').length;
        if (inactiveCount > 0) {
          expect(count).toBeLessThanOrEqual(empires.length - inactiveCount);
        }

        // 4. ABANDONED empires should not be counted
        const abandonedCount = empires.filter((e) => e.empireType === 'ABANDONED').length;
        if (abandonedCount > 0) {
          expect(count).toBeLessThanOrEqual(empires.length - abandonedCount);
        }

        // 5. HOMELESS empires should not be counted
        const homelessCount = empires.filter((e) => e.empireType === 'HOMELESS').length;
        if (homelessCount > 0) {
          expect(count).toBeLessThanOrEqual(empires.length - homelessCount);
        }

        // 6. Count should never exceed total empires
        expect(count).toBeLessThanOrEqual(empires.length);

        // 7. Count should never be negative
        expect(count).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs

  /**
   * **Feature: session-auto-start, Property 14: Capacity field usage**
   *
   * For any session capacity check, the comparison should use the Session.numPlayers
   * field as the capacity value
   *
   * **Validates: Requirements 5.5**
   */
  it('Property 14: Capacity field usage', async () => {
    // Generator for empire types
    const empireTypeArb = fc.constantFrom(
      'ACTIVE', 'GM', 'OBSERVER', 'INACTIVE', 'ABANDONED', 'NPC', 'HOMELESS'
    );

    // Generator for a single empire
    const empireArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 3, maxLength: 20 }),
      playerName: fc.string({ minLength: 3, maxLength: 20 }),
      sessionName: fc.constant('test-session'),
      empireType: empireTypeArb,
      ordersLocked: fc.boolean(),
    });

    // Generator for session with capacity and empires
    const sessionWithCapacityArb = fc.record({
      sessionName: fc.constant('test-session'),
      numPlayers: fc.integer({ min: 1, max: 20 }), // Session capacity
      empires: fc.array(empireArb, { minLength: 0, maxLength: 25 }), // May have more or fewer than capacity
    });

    await fc.assert(
      fc.asyncProperty(sessionWithCapacityArb, async ({ sessionName, numPlayers, empires }) => {
        // Setup: Mock Session.list to return a session with numPlayers capacity
        mockClient.models.Session.list.mockResolvedValue({
          data: [{
            id: fc.sample(fc.uuid(), 1)[0],
            name: sessionName,
            numPlayers: numPlayers,
            gmPlayerName: 'test-gm',
            currentTurnNumber: 0,
            status: 'WAITING_FOR_PLAYERS',
            sessionType: 'STANDARD',
            updateHours: 168,
          }],
          errors: [],
        });

        // Setup: Mock Empire.list to return our generated empires
        mockClient.models.Empire.list.mockResolvedValue({
          data: empires,
          errors: [],
        });

        // Act: Call checkSessionCapacity
        const result = await ClientFunctions.checkSessionCapacity(sessionName);

        // Assert: The capacity field should be the Session.numPlayers value
        expect(result.capacity).toBe(numPlayers);

        // Assert: The activeEmpireCount should match ACTIVE and NPC empires
        const expectedActiveCount = empires.filter(
          (empire) => empire.empireType === 'ACTIVE' || empire.empireType === 'NPC'
        ).length;
        expect(result.activeEmpireCount).toBe(expectedActiveCount);

        // Assert: isFull should be true when activeEmpireCount >= capacity
        const expectedIsFull = expectedActiveCount >= numPlayers;
        expect(result.isFull).toBe(expectedIsFull);

        // Additional property checks:
        // 1. Capacity should always be positive
        expect(result.capacity).toBeGreaterThan(0);

        // 2. Active empire count should never be negative
        expect(result.activeEmpireCount).toBeGreaterThanOrEqual(0);

        // 3. isFull should be consistent with the comparison
        if (result.activeEmpireCount >= result.capacity) {
          expect(result.isFull).toBe(true);
        } else {
          expect(result.isFull).toBe(false);
        }

        // 4. The capacity value should come from numPlayers, not from counting empires
        // This is the key property: capacity is independent of actual empire count
        expect(result.capacity).toBe(numPlayers);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs
});

/**
 * Unit Tests for Capacity Functions
 *
 * These tests verify specific scenarios and edge cases for the capacity checking functions.
 */
describe('ClientFunctions - Unit Tests for Capacity Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('countActiveEmpires()', () => {
    it('should count only ACTIVE empires', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
        { id: '3', name: 'Empire3', empireType: 'GM', sessionName: 'test-session', playerName: 'gm', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(2);
    });

    it('should count only NPC empires', async () => {
      const empires = [
        { id: '1', name: 'NPC1', empireType: 'NPC', sessionName: 'test-session', playerName: 'npc1', ordersLocked: false },
        { id: '2', name: 'NPC2', empireType: 'NPC', sessionName: 'test-session', playerName: 'npc2', ordersLocked: false },
        { id: '3', name: 'Observer', empireType: 'OBSERVER', sessionName: 'test-session', playerName: 'observer', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(2);
    });

    it('should count both ACTIVE and NPC empires', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'NPC1', empireType: 'NPC', sessionName: 'test-session', playerName: 'npc1', ordersLocked: false },
        { id: '3', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(3);
    });

    it('should exclude GM empires from count', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'GMEmpire', empireType: 'GM', sessionName: 'test-session', playerName: 'gm', ordersLocked: false },
        { id: '3', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(2);
    });

    it('should exclude OBSERVER empires from count', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Observer', empireType: 'OBSERVER', sessionName: 'test-session', playerName: 'observer', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(1);
    });

    it('should exclude INACTIVE empires from count', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Inactive', empireType: 'INACTIVE', sessionName: 'test-session', playerName: 'inactive', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(1);
    });

    it('should exclude ABANDONED empires from count', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Abandoned', empireType: 'ABANDONED', sessionName: 'test-session', playerName: 'abandoned', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(1);
    });

    it('should exclude HOMELESS empires from count', async () => {
      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Homeless', empireType: 'HOMELESS', sessionName: 'test-session', playerName: 'homeless', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(1);
    });

    it('should return 0 when no empires exist', async () => {
      mockClient.models.Empire.list.mockResolvedValue({
        data: [],
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(0);
    });

    it('should return 0 when only non-ACTIVE/NPC empires exist', async () => {
      const empires = [
        { id: '1', name: 'GMEmpire', empireType: 'GM', sessionName: 'test-session', playerName: 'gm', ordersLocked: false },
        { id: '2', name: 'Observer', empireType: 'OBSERVER', sessionName: 'test-session', playerName: 'observer', ordersLocked: false },
        { id: '3', name: 'Inactive', empireType: 'INACTIVE', sessionName: 'test-session', playerName: 'inactive', ordersLocked: false },
      ];

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const count = await ClientFunctions.countActiveEmpires('test-session');
      expect(count).toBe(0);
    });
  });

  describe('checkSessionCapacity()', () => {
    it('should return isFull=true when session is at full capacity', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 3,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
        { id: '3', name: 'Empire3', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player3', ordersLocked: false },
      ];

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.isFull).toBe(true);
      expect(result.activeEmpireCount).toBe(3);
      expect(result.capacity).toBe(3);
    });

    it('should return isFull=true when active empires exceed capacity', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 2,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
        { id: '3', name: 'Empire3', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player3', ordersLocked: false },
      ];

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.isFull).toBe(true);
      expect(result.activeEmpireCount).toBe(3);
      expect(result.capacity).toBe(2);
    });

    it('should return isFull=false when session is partially filled', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 5,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
      ];

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.isFull).toBe(false);
      expect(result.activeEmpireCount).toBe(2);
      expect(result.capacity).toBe(5);
    });

    it('should return isFull=false when session is empty', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 4,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: [],
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.isFull).toBe(false);
      expect(result.activeEmpireCount).toBe(0);
      expect(result.capacity).toBe(4);
    });

    it('should not count GM empires toward capacity', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 2,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'Empire2', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player2', ordersLocked: false },
        { id: '3', name: 'GMEmpire', empireType: 'GM', sessionName: 'test-session', playerName: 'gm', ordersLocked: false },
      ];

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.isFull).toBe(true);
      expect(result.activeEmpireCount).toBe(2);
      expect(result.capacity).toBe(2);
    });

    it('should count NPC empires toward capacity', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 3,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      const empires = [
        { id: '1', name: 'Empire1', empireType: 'ACTIVE', sessionName: 'test-session', playerName: 'player1', ordersLocked: false },
        { id: '2', name: 'NPC1', empireType: 'NPC', sessionName: 'test-session', playerName: 'npc1', ordersLocked: false },
        { id: '3', name: 'NPC2', empireType: 'NPC', sessionName: 'test-session', playerName: 'npc2', ordersLocked: false },
      ];

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: empires,
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.isFull).toBe(true);
      expect(result.activeEmpireCount).toBe(3);
      expect(result.capacity).toBe(3);
    });

    it('should throw error when session is not found', async () => {
      mockClient.models.Session.list.mockResolvedValue({
        data: [],
        errors: [],
      });

      await expect(ClientFunctions.checkSessionCapacity('nonexistent-session'))
        .rejects
        .toThrow('Session not found: nonexistent-session');
    });

    it('should throw error when session list returns null', async () => {
      mockClient.models.Session.list.mockResolvedValue({
        data: null,
        errors: [],
      });

      await expect(ClientFunctions.checkSessionCapacity('test-session'))
        .rejects
        .toThrow('Session not found: test-session');
    });

    it('should handle session with numPlayers=0', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: 0,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: [],
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      // When capacity is 0 and activeEmpireCount is 0, the session is technically "full"
      // because 0 >= 0 is true
      expect(result.isFull).toBe(true);
      expect(result.activeEmpireCount).toBe(0);
      expect(result.capacity).toBe(0);
    });

    it('should handle session with undefined numPlayers', async () => {
      const session = {
        id: 'session-1',
        name: 'test-session',
        numPlayers: undefined,
        gmPlayerName: 'gm',
        currentTurnNumber: 0,
        status: 'WAITING_FOR_PLAYERS',
        sessionType: 'STANDARD',
        updateHours: 168,
      };

      mockClient.models.Session.list.mockResolvedValue({
        data: [session],
        errors: [],
      });

      mockClient.models.Empire.list.mockResolvedValue({
        data: [],
        errors: [],
      });

      const result = await ClientFunctions.checkSessionCapacity('test-session');
      
      expect(result.capacity).toBe(0);
    });
  });
});
