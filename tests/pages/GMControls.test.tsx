import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import GMControls from '../../src/pages/GMControls';
import * as SessionAPI from '../../src/components/common/SessionAPI';
import * as ClientFunctions from '../../src/components/common/ClientFunctions';

/**
 * Property-Based Tests for GMControls
 *
 * These tests use fast-check to generate random test data and verify
 * that correctness properties hold across all valid inputs.
 */

// Mock the SessionAPI module
vi.mock('../../src/components/common/SessionAPI', () => ({
  updateTurn: vi.fn(),
  generateSnapshots: vi.fn(),
  startSession: vi.fn(),
}));

// Mock the ClientFunctions module
vi.mock('../../src/components/common/ClientFunctions', () => ({
  getCurrentTurnNumber: vi.fn(),
  updateSessionStatus: vi.fn(),
  updateSessionTurnNumber: vi.fn(),
}));

// Mock the ProcessingDialog component
vi.mock('../../src/components/common/ProcessingDialog', () => ({
  default: ({ open, message }: { open: boolean; message: string }) => (
    open ? <div data-testid="processing-dialog">{message}</div> : null
  ),
}));

describe('GMControls - Property-Based Tests', () => {
  const mockOnTurnNumberChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: admin-order-processing, Property 9: Normal turn processing unchanged**
   *
   * For any call to handleUpdateTurn, the updateTurn function should be called
   * without the processAdminOnly parameter
   *
   * **Validates: Requirements 5.1**
   */
  it('Property 9: Normal turn processing unchanged', async () => {
    // Generator for session names
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 20 });

    // Generator for session IDs
    const sessionIdArb = fc.uuid();

    // Generator for turn numbers (positive integers)
    const turnNumberArb = fc.integer({ min: 1, max: 100 });

    // Generator for number of players
    const numPlayersArb = fc.integer({ min: 2, max: 10 });

    // Generator for empires (array of objects)
    const empiresArb = fc.array(fc.record({}), { minLength: 1, maxLength: 10 });

    await fc.assert(
      fc.asyncProperty(
        sessionNameArb,
        sessionIdArb,
        turnNumberArb,
        numPlayersArb,
        empiresArb,
        async (sessionName, sessionId, turnNumber, numPlayers, empires) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();

          // Setup: Create a session in IN_PROGRESS status
          const mockSession = {
            sessionId,
            sessionName,
            status: 'IN_PROGRESS',
            currentTurnNumber: turnNumber,
            numPlayers,
            empires,
          };

          // Mock the API responses
          (ClientFunctions.getCurrentTurnNumber as any).mockResolvedValue(turnNumber);
          (SessionAPI.updateTurn as any).mockResolvedValue(JSON.stringify({ message: 'Turn updated' }));
          (SessionAPI.generateSnapshots as any).mockResolvedValue(JSON.stringify({ message: 'Snapshots generated' }));
          (ClientFunctions.updateSessionTurnNumber as any).mockResolvedValue(undefined);

          // Act: Render the component
          const { unmount } = render(
            <BrowserRouter>
              <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
            </BrowserRouter>
          );

          // Act: Click the "Update Turn" button
          const updateTurnButton = screen.getByText('Update Turn');
          fireEvent.click(updateTurnButton);

          // Assert: Wait for the async operations to complete
          await waitFor(() => {
            expect(SessionAPI.updateTurn).toHaveBeenCalledTimes(1);
          }, { timeout: 3000 });

          // Assert: Verify updateTurn was called with only 2 parameters (no processAdminOnly)
          const updateTurnCall = (SessionAPI.updateTurn as any).mock.calls[0];
          
          // Property check 1: updateTurn should be called with exactly 2 arguments
          expect(updateTurnCall).toHaveLength(2);
          
          // Property check 2: First argument should be the session name
          expect(updateTurnCall[0]).toBe(sessionName);
          
          // Property check 3: Second argument should be the current turn number
          expect(updateTurnCall[1]).toBe(turnNumber);
          
          // Property check 4: Third argument should be undefined (not passed)
          expect(updateTurnCall[2]).toBeUndefined();

          // Property check 5: Verify the complete workflow executed correctly
          // getCurrentTurnNumber should be called first
          expect(ClientFunctions.getCurrentTurnNumber).toHaveBeenCalledWith(sessionId);
          
          // updateTurn should be called with sessionName and turnNumber only
          expect(SessionAPI.updateTurn).toHaveBeenCalledWith(sessionName, turnNumber);
          
          // generateSnapshots should be called with the NEXT turn
          expect(SessionAPI.generateSnapshots).toHaveBeenCalledWith(sessionName, turnNumber + 1);
          
          // updateSessionTurnNumber should be called with the NEXT turn
          expect(ClientFunctions.updateSessionTurnNumber).toHaveBeenCalledWith(sessionId, turnNumber + 1);

          // Cleanup
          unmount();
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 120000); // Increase timeout for property-based test with 100 runs
});

describe('GMControls - Backward Compatibility Tests', () => {
  const mockOnTurnNumberChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test handleUpdateTurn calls updateTurn without processAdminOnly parameter
   * Requirements: 5.1
   */
  it('should call updateTurn without processAdminOnly parameter when Update Turn is clicked', async () => {
    // Setup: Create a session in IN_PROGRESS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}], // 3 empires
    };

    // Mock the API responses
    (ClientFunctions.getCurrentTurnNumber as any).mockResolvedValue(5);
    (SessionAPI.updateTurn as any).mockResolvedValue(JSON.stringify({ message: 'Turn updated' }));
    (SessionAPI.generateSnapshots as any).mockResolvedValue(JSON.stringify({ message: 'Snapshots generated' }));
    (ClientFunctions.updateSessionTurnNumber as any).mockResolvedValue(undefined);

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Act: Click the "Update Turn" button
    const updateTurnButton = screen.getByText('Update Turn');
    fireEvent.click(updateTurnButton);

    // Assert: Wait for the async operations to complete
    await waitFor(() => {
      expect(SessionAPI.updateTurn).toHaveBeenCalledTimes(1);
    });

    // Assert: Verify updateTurn was called with only 2 parameters (no processAdminOnly)
    expect(SessionAPI.updateTurn).toHaveBeenCalledWith('test-session', 5);

    // Assert: Verify the call did NOT include a third parameter
    const updateTurnCall = (SessionAPI.updateTurn as any).mock.calls[0];
    expect(updateTurnCall).toHaveLength(2);
    expect(updateTurnCall[0]).toBe('test-session');
    expect(updateTurnCall[1]).toBe(5);
    expect(updateTurnCall[2]).toBeUndefined();
  });

  /**
   * Test normal turn processing workflow is unaffected
   * Requirements: 5.2, 5.3
   */
  it('should execute normal turn processing workflow correctly', async () => {
    // Setup: Create a session in IN_PROGRESS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}],
    };

    // Mock the API responses
    (ClientFunctions.getCurrentTurnNumber as any).mockResolvedValue(5);
    (SessionAPI.updateTurn as any).mockResolvedValue(JSON.stringify({ message: 'Turn updated' }));
    (SessionAPI.generateSnapshots as any).mockResolvedValue(JSON.stringify({ message: 'Snapshots generated' }));
    (ClientFunctions.updateSessionTurnNumber as any).mockResolvedValue(undefined);

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Act: Click the "Update Turn" button
    const updateTurnButton = screen.getByText('Update Turn');
    fireEvent.click(updateTurnButton);

    // Assert: Wait for all async operations to complete
    await waitFor(() => {
      expect(ClientFunctions.updateSessionTurnNumber).toHaveBeenCalled();
    });

    // Assert: Verify the complete workflow executed in the correct order
    // 1. getCurrentTurnNumber was called
    expect(ClientFunctions.getCurrentTurnNumber).toHaveBeenCalledWith('test-session-id');

    // 2. updateTurn was called with the current turn (without processAdminOnly)
    expect(SessionAPI.updateTurn).toHaveBeenCalledWith('test-session', 5);

    // 3. generateSnapshots was called with the NEXT turn (currentTurn + 1)
    expect(SessionAPI.generateSnapshots).toHaveBeenCalledWith('test-session', 6);

    // 4. updateSessionTurnNumber was called with the NEXT turn
    expect(ClientFunctions.updateSessionTurnNumber).toHaveBeenCalledWith('test-session-id', 6);

    // 5. onTurnNumberChange callback was called with the NEXT turn
    expect(mockOnTurnNumberChange).toHaveBeenCalledWith(6);

    // Assert: Verify the order of operations
    const callOrder = [
      (ClientFunctions.getCurrentTurnNumber as any).mock.invocationCallOrder[0],
      (SessionAPI.updateTurn as any).mock.invocationCallOrder[0],
      (SessionAPI.generateSnapshots as any).mock.invocationCallOrder[0],
      (ClientFunctions.updateSessionTurnNumber as any).mock.invocationCallOrder[0],
    ];

    // Verify calls happened in ascending order
    expect(callOrder[0]).toBeLessThan(callOrder[1]);
    expect(callOrder[1]).toBeLessThan(callOrder[2]);
    expect(callOrder[2]).toBeLessThan(callOrder[3]);
  });

  /**
   * Test other GM buttons work correctly
   * Requirements: 5.4
   */
  it('should render and enable Generate Snapshots button in IN_PROGRESS status', async () => {
    // Setup: Create a session in IN_PROGRESS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}],
    };

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Assert: Verify Generate Snapshots button is present
    const generateSnapshotsButton = screen.getByText('Generate Snapshots');
    expect(generateSnapshotsButton).toBeDefined();
    expect(generateSnapshotsButton).not.toBeDisabled();
  });

  it('should render and enable Rollback Turn button in IN_PROGRESS status', async () => {
    // Setup: Create a session in IN_PROGRESS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}],
    };

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Assert: Verify Rollback Turn button is present
    const rollbackButton = screen.getByText('Rollback Turn');
    expect(rollbackButton).toBeDefined();
    expect(rollbackButton).not.toBeDisabled();
  });

  it('should call generateSnapshots when Generate Snapshots button is clicked', async () => {
    // Setup: Create a session in IN_PROGRESS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}],
    };

    // Mock the API responses
    (ClientFunctions.getCurrentTurnNumber as any).mockResolvedValue(5);
    (SessionAPI.generateSnapshots as any).mockResolvedValue(JSON.stringify({ message: 'Snapshots generated' }));

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Act: Click the "Generate Snapshots" button
    const generateSnapshotsButton = screen.getByText('Generate Snapshots');
    fireEvent.click(generateSnapshotsButton);

    // Assert: Wait for the async operations to complete
    await waitFor(() => {
      expect(SessionAPI.generateSnapshots).toHaveBeenCalledTimes(1);
    });

    // Assert: Verify generateSnapshots was called with correct parameters
    expect(SessionAPI.generateSnapshots).toHaveBeenCalledWith('test-session', 5);
  });

  /**
   * Test backward compatibility with existing code
   * Requirements: 5.4
   */
  it('should maintain status dropdown functionality', async () => {
    // Setup: Create a session
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}],
    };

    // Mock the API responses
    (ClientFunctions.updateSessionStatus as any).mockResolvedValue(undefined);

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Assert: Verify status dropdown is present
    const statusDropdown = screen.getByLabelText('Status');
    expect(statusDropdown).toBeDefined();

    // Assert: Verify current status is selected
    expect((statusDropdown as HTMLSelectElement).value).toBe('IN_PROGRESS');
  });

  it('should not show Process Admin Orders button in IN_PROGRESS status', async () => {
    // Setup: Create a session in IN_PROGRESS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'IN_PROGRESS',
      currentTurnNumber: 5,
      numPlayers: 4,
      empires: [{}, {}, {}],
    };

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Assert: Verify Process Admin Orders button is NOT present
    const processAdminOrdersButton = screen.queryByText('Process Admin Orders');
    expect(processAdminOrdersButton).toBeNull();
  });

  it('should not show Process Admin Orders button in WAITING_FOR_PLAYERS status', async () => {
    // Setup: Create a session in WAITING_FOR_PLAYERS status
    const mockSession = {
      sessionId: 'test-session-id',
      sessionName: 'test-session',
      status: 'WAITING_FOR_PLAYERS',
      currentTurnNumber: 0,
      numPlayers: 4,
      empires: [{}, {}, {}, {}], // All players present
    };

    // Act: Render the component
    render(
      <BrowserRouter>
        <GMControls session={mockSession as any} onTurnNumberChange={mockOnTurnNumberChange} />
      </BrowserRouter>
    );

    // Assert: Verify Process Admin Orders button is NOT present
    const processAdminOrdersButton = screen.queryByText('Process Admin Orders');
    expect(processAdminOrdersButton).toBeNull();
  });
});
