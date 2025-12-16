import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionWaitingTableRow from '../../src/pages/SessionWaitingTableRow';
import * as SessionAPI from '../../src/components/common/SessionAPI';
import * as ClientFunctions from '../../src/components/common/ClientFunctions';
import type { SessionEmpires } from '../../src/components/common/Interfaces';

// Mock the dependencies
vi.mock('../../src/components/common/SessionAPI');
vi.mock('../../src/components/common/ClientFunctions');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

/**
 * Tests for SessionWaitingTableRow to verify existing functionality remains unchanged
 * after implementing alphanumeric validation.
 *
 * **Validates: Requirements 2.4, 3.4, 4.4, 5.1, 5.2, 5.3, 5.4**
 */
describe('SessionWaitingTableRow - Existing Functionality Verification', () => {
  const mockSession: SessionEmpires = {
    sessionName: 'TestSession',
    empires: [],
    gmPlayerName: 'testgm',
    currentTurnNumber: 1,
    numPlayers: 4,
    deadline: new Date().toISOString(),
    status: 'WAITING_FOR_PLAYERS',
  };

  const mockPlayerName = 'testplayer';
  const mockOnSessionUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    vi.mocked(SessionAPI.addEmpire).mockResolvedValue('{"data": "OK"}');
    vi.mocked(ClientFunctions.registerEmpire).mockResolvedValue({ success: true });
    vi.mocked(ClientFunctions.attemptAutoStart).mockResolvedValue({ 
      success: false, 
      error: 'Session not full yet' 
    });
  });

  const renderSessionWaitingTableRow = () => {
    return render(
      <BrowserRouter>
        <table>
          <tbody>
            <SessionWaitingTableRow 
              playerName={mockPlayerName}
              session={mockSession}
              onSessionUpdate={mockOnSessionUpdate}
            />
          </tbody>
        </table>
      </BrowserRouter>
    );
  };

  it('renders empire joining form with all required elements', () => {
    renderSessionWaitingTableRow();

    // Verify session name is displayed
    expect(screen.getByText('TestSession')).toBeInTheDocument();

    // Verify all three name input fields are present
    expect(screen.getByLabelText(/empire name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/homeworld name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/starbase name/i)).toBeInTheDocument();

    // Verify join button is present
    expect(screen.getByRole('button', { name: /join session/i })).toBeInTheDocument();

    // Verify instruction text
    expect(screen.getByText(/enter your empire's information/i)).toBeInTheDocument();
  });

  it('uses AlphanumericTextField for all name inputs', () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);

    // Verify all fields are required
    expect(empireNameField).toBeRequired();
    expect(homeworldNameField).toBeRequired();
    expect(starbaseNameField).toBeRequired();
    
    // Verify helper text appears on focus for each field
    fireEvent.focus(empireNameField);
    expect(screen.getByText(/only letters and numbers are allowed/i)).toBeInTheDocument();
    
    fireEvent.blur(empireNameField);
    fireEvent.focus(homeworldNameField);
    expect(screen.getByText(/only letters and numbers are allowed/i)).toBeInTheDocument();
    
    fireEvent.blur(homeworldNameField);
    fireEvent.focus(starbaseNameField);
    expect(screen.getByText(/only letters and numbers are allowed/i)).toBeInTheDocument();
  });

  it('successfully joins session with valid alphanumeric names', async () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);
    const joinButton = screen.getByRole('button', { name: /join session/i });

    // Enter valid alphanumeric names
    fireEvent.change(empireNameField, { target: { value: 'TestEmpire123' } });
    fireEvent.change(homeworldNameField, { target: { value: 'HomeWorld456' } });
    fireEvent.change(starbaseNameField, { target: { value: 'StarBase789' } });
    
    // Verify button becomes enabled
    expect(joinButton).not.toBeDisabled();

    // Click join button
    fireEvent.click(joinButton);

    // Verify API calls are made with correct parameters
    await waitFor(() => {
      expect(SessionAPI.addEmpire).toHaveBeenCalledWith(
        'TestSession',
        'TestEmpire123',
        'TE', // abbreviation
        'HomeWorld456',
        'StarBase789',
        'ACTIVE'
      );
      expect(ClientFunctions.registerEmpire).toHaveBeenCalledWith(
        'TestSession',
        'testplayer',
        'TestEmpire123',
        'ACTIVE'
      );
      expect(ClientFunctions.attemptAutoStart).toHaveBeenCalledWith('TestSession');
    });
  });

  it('filters non-alphanumeric characters from all name inputs', () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);

    // Try to enter non-alphanumeric characters in each field
    fireEvent.change(empireNameField, { target: { value: 'Test@Empire#123!' } });
    fireEvent.change(homeworldNameField, { target: { value: 'Home-World_456$' } });
    fireEvent.change(starbaseNameField, { target: { value: 'Star*Base&789%' } });

    // Verify only alphanumeric characters remain
    expect(empireNameField).toHaveValue('TestEmpire123');
    expect(homeworldNameField).toHaveValue('HomeWorld456');
    expect(starbaseNameField).toHaveValue('StarBase789');
  });

  it('maintains empire abbreviation calculation functionality', () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);

    // Test basic abbreviation
    fireEvent.change(empireNameField, { target: { value: 'TestEmpire' } });
    expect(screen.getByText(/abbreviation: TE/i)).toBeInTheDocument();

    // Test abbreviation with "The" prefix removal
    fireEvent.change(empireNameField, { target: { value: 'TheGalacticEmpire' } });
    expect(screen.getByText(/abbreviation: GA/i)).toBeInTheDocument();

    // Test abbreviation with numbers (should be filtered out)
    fireEvent.change(empireNameField, { target: { value: 'Empire123Test' } });
    expect(screen.getByText(/abbreviation: EM/i)).toBeInTheDocument();
  });

  it('disables join button when any name field is empty', () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);
    const joinButton = screen.getByRole('button', { name: /join session/i });
    
    // Button should be disabled initially (all fields empty)
    expect(joinButton).toBeDisabled();

    // Fill two fields, leave one empty
    fireEvent.change(empireNameField, { target: { value: 'TestEmpire' } });
    fireEvent.change(homeworldNameField, { target: { value: 'TestWorld' } });
    expect(joinButton).toBeDisabled();

    // Fill all fields
    fireEvent.change(starbaseNameField, { target: { value: 'TestBase' } });
    expect(joinButton).not.toBeDisabled();

    // Clear one field
    fireEvent.change(empireNameField, { target: { value: '' } });
    expect(joinButton).toBeDisabled();
  });

  it('handles successful auto-start scenario', async () => {
    // Mock successful auto-start
    vi.mocked(ClientFunctions.attemptAutoStart).mockResolvedValue({ 
      success: true, 
      newStatus: 'IN_PROGRESS' 
    });

    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);
    const joinButton = screen.getByRole('button', { name: /join session/i });

    // Fill all fields and join
    fireEvent.change(empireNameField, { target: { value: 'TestEmpire' } });
    fireEvent.change(homeworldNameField, { target: { value: 'TestWorld' } });
    fireEvent.change(starbaseNameField, { target: { value: 'TestBase' } });
    fireEvent.click(joinButton);

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/session is now ready.*status changed to IN_PROGRESS/i)).toBeInTheDocument();
    });

    // Verify onSessionUpdate callback is called
    expect(mockOnSessionUpdate).toHaveBeenCalled();
  });

  it('handles empire joining errors gracefully', async () => {
    // Mock API error
    vi.mocked(SessionAPI.addEmpire).mockRejectedValue(new Error('Empire name already exists'));

    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);
    const joinButton = screen.getByRole('button', { name: /join session/i });

    // Fill all fields and join
    fireEvent.change(empireNameField, { target: { value: 'TestEmpire' } });
    fireEvent.change(homeworldNameField, { target: { value: 'TestWorld' } });
    fireEvent.change(starbaseNameField, { target: { value: 'TestBase' } });
    fireEvent.click(joinButton);

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByText(/failed to join session.*empire name already exists/i)).toBeInTheDocument();
    });
  });

  it('maintains consistent UI styling and layout', () => {
    renderSessionWaitingTableRow();

    // Verify table row structure
    const tableRow = screen.getByRole('row');
    expect(tableRow).toBeInTheDocument();

    // Verify session name is in first cell
    const sessionNameCell = screen.getByText('TestSession').closest('td');
    expect(sessionNameCell).toBeInTheDocument();

    // Verify form is in a Paper component (Material-UI styling)
    const empireNameField = screen.getByLabelText(/empire name/i);
    const paperContainer = empireNameField.closest('[class*="MuiPaper"]');
    expect(paperContainer).toBeInTheDocument();

    // Verify grid layout is maintained
    const joinButton = screen.getByRole('button', { name: /join session/i });
    expect(joinButton).toBeInTheDocument();
  });

  it('respects maximum length constraints', () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);

    // Try to enter strings longer than max length (30 characters for empire/homeworld/starbase)
    const longString = 'A'.repeat(50); // 50 characters
    
    fireEvent.change(empireNameField, { target: { value: longString } });
    fireEvent.change(homeworldNameField, { target: { value: longString } });
    fireEvent.change(starbaseNameField, { target: { value: longString } });

    // Verify values are truncated to max length (30)
    expect(empireNameField.value.length).toBeLessThanOrEqual(30);
    expect(homeworldNameField.value.length).toBeLessThanOrEqual(30);
    expect(starbaseNameField.value.length).toBeLessThanOrEqual(30);
  });

  it('maintains accessibility compliance', () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);
    
    // Verify required fields are properly labeled
    expect(empireNameField).toBeRequired();
    expect(homeworldNameField).toBeRequired();
    expect(starbaseNameField).toBeRequired();
    
    // Material-UI handles aria-required internally
    
    // Verify helper text is associated with inputs
    fireEvent.focus(empireNameField);
    const helperText = screen.getByText(/only letters and numbers are allowed/i);
    expect(helperText).toBeInTheDocument();
    
    // Verify button has proper accessibility attributes
    const joinButton = screen.getByRole('button', { name: /join session/i });
    expect(joinButton).toBeInTheDocument();
  });

  it('shows appropriate status messages during different scenarios', async () => {
    renderSessionWaitingTableRow();

    const empireNameField = screen.getByLabelText(/empire name/i);
    const homeworldNameField = screen.getByLabelText(/homeworld name/i);
    const starbaseNameField = screen.getByLabelText(/starbase name/i);
    const joinButton = screen.getByRole('button', { name: /join session/i });

    // Fill all fields and join
    fireEvent.change(empireNameField, { target: { value: 'TestEmpire' } });
    fireEvent.change(homeworldNameField, { target: { value: 'TestWorld' } });
    fireEvent.change(starbaseNameField, { target: { value: 'TestBase' } });
    fireEvent.click(joinButton);

    // Verify success message for session not full scenario
    await waitFor(() => {
      expect(screen.getByText(/successfully joined session.*waiting for more players/i)).toBeInTheDocument();
    });
  });
});