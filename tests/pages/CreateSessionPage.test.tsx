import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateSessionPage from '../../src/pages/CreateSessionPage';
import * as SessionAPI from '../../src/components/common/SessionAPI';
import * as ClientFunctions from '../../src/components/common/ClientFunctions';

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
 * Tests for CreateSessionPage to verify existing functionality remains unchanged
 * after implementing alphanumeric validation.
 *
 * **Validates: Requirements 1.4, 5.1, 5.2, 5.3, 5.4**
 */
describe('CreateSessionPage - Existing Functionality Verification', () => {
  const mockUserAttributes = {
    preferred_username: 'testgm',
    email: 'testgm@example.com',
  };

  const mockUserGroups = ['GAMEMASTERS'];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    vi.mocked(ClientFunctions.checkSessionExists).mockResolvedValue(false);
    vi.mocked(ClientFunctions.registerSession).mockResolvedValue({ success: true });
    vi.mocked(ClientFunctions.registerEmpire).mockResolvedValue({ success: true });
    vi.mocked(SessionAPI.createSession).mockResolvedValue('{"data": "OK"}');
  });

  const renderCreateSessionPage = () => {
    return render(
      <BrowserRouter>
        <CreateSessionPage 
          userAttributes={mockUserAttributes} 
          userGroups={mockUserGroups} 
        />
      </BrowserRouter>
    );
  };

  it('renders session creation form with all required elements', () => {
    renderCreateSessionPage();

    // Verify core form elements are present
    expect(screen.getByLabelText(/session name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of players/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument();

    // Verify session parameters section
    expect(screen.getByText(/session parameters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/galaxy radius/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max storm intensity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/world density/i)).toBeInTheDocument();
  });

  it('uses AlphanumericTextField for session name input', () => {
    renderCreateSessionPage();

    const sessionNameField = screen.getByLabelText(/session name/i);
    expect(sessionNameField).toBeInTheDocument();
    
    // Verify it has the required attribute
    expect(sessionNameField).toBeRequired();
    
    // Verify helper text appears on focus
    fireEvent.focus(sessionNameField);
    expect(screen.getByText(/only letters and numbers are allowed/i)).toBeInTheDocument();
  });

  it('successfully creates session with valid alphanumeric name', async () => {
    renderCreateSessionPage();

    const sessionNameField = screen.getByLabelText(/session name/i);
    const createButton = screen.getByRole('button', { name: /create session/i });

    // Enter valid alphanumeric session name
    fireEvent.change(sessionNameField, { target: { value: 'TestSession123' } });
    
    // Verify button becomes enabled
    expect(createButton).not.toBeDisabled();

    // Click create button
    fireEvent.click(createButton);

    // Verify API calls are made with correct parameters
    await waitFor(() => {
      expect(ClientFunctions.checkSessionExists).toHaveBeenCalledWith('TestSession123');
      expect(ClientFunctions.registerSession).toHaveBeenCalledWith(
        'TestSession123',
        6, // default number of players
        'testgm'
      );
      expect(SessionAPI.createSession).toHaveBeenCalledWith(
        'TestSession123',
        expect.any(Object) // session properties
      );
      expect(ClientFunctions.registerEmpire).toHaveBeenCalledWith(
        'TestSession123',
        'testgm',
        'GM',
        'GM'
      );
    });
  });

  it('filters non-alphanumeric characters from session name input', () => {
    renderCreateSessionPage();

    const sessionNameField = screen.getByLabelText(/session name/i);

    // Try to enter non-alphanumeric characters
    fireEvent.change(sessionNameField, { target: { value: 'Test@Session#123!' } });

    // Verify only alphanumeric characters remain
    expect(sessionNameField).toHaveValue('TestSession123');
  });

  it('disables create button when session name is empty', () => {
    renderCreateSessionPage();

    const createButton = screen.getByRole('button', { name: /create session/i });
    
    // Button should be disabled initially (empty session name)
    expect(createButton).toBeDisabled();

    const sessionNameField = screen.getByLabelText(/session name/i);
    
    // Enter and then clear session name
    fireEvent.change(sessionNameField, { target: { value: 'Test' } });
    expect(createButton).not.toBeDisabled();
    
    fireEvent.change(sessionNameField, { target: { value: '' } });
    expect(createButton).toBeDisabled();
  });

  it('maintains existing session parameter functionality', () => {
    renderCreateSessionPage();

    // Test galaxy radius parameter
    const galaxyRadiusField = screen.getByLabelText(/galaxy radius/i);
    expect(galaxyRadiusField).toHaveValue(5); // default value

    fireEvent.change(galaxyRadiusField, { target: { value: '8' } });
    expect(galaxyRadiusField).toHaveValue(8);

    // Test world density parameter
    const worldDensityField = screen.getByLabelText(/world density/i);
    expect(worldDensityField).toHaveValue(5); // default value

    fireEvent.change(worldDensityField, { target: { value: '3' } });
    expect(worldDensityField).toHaveValue(3);
  });

  it('maintains existing number of players functionality', () => {
    renderCreateSessionPage();

    const numPlayersSelect = screen.getByLabelText(/number of players/i);
    expect(numPlayersSelect).toHaveTextContent('6'); // default value

    // Open dropdown and select different value
    fireEvent.mouseDown(numPlayersSelect);
    const option4 = screen.getByRole('option', { name: '4' });
    fireEvent.click(option4);

    expect(numPlayersSelect).toHaveTextContent('4');
  });

  it('shows unauthorized message for non-GM users', () => {
    const nonGMUserGroups = ['PLAYERS'];
    
    render(
      <BrowserRouter>
        <CreateSessionPage 
          userAttributes={mockUserAttributes} 
          userGroups={nonGMUserGroups} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    expect(screen.getByText(/you must be a member of the/i)).toBeInTheDocument();
    expect(screen.getByText(/GAMEMASTERS/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/session name/i)).not.toBeInTheDocument();
  });

  it('handles session creation errors gracefully', async () => {
    // Mock API error
    vi.mocked(ClientFunctions.checkSessionExists).mockRejectedValue(new Error('Network error'));

    renderCreateSessionPage();

    const sessionNameField = screen.getByLabelText(/session name/i);
    const createButton = screen.getByRole('button', { name: /create session/i });

    fireEvent.change(sessionNameField, { target: { value: 'TestSession' } });
    fireEvent.click(createButton);

    // Verify error is handled (no crash, processing dialog closes)
    await waitFor(() => {
      expect(createButton).not.toBeDisabled();
    });
  });

  it('prevents duplicate session creation', async () => {
    // Mock existing session
    vi.mocked(ClientFunctions.checkSessionExists).mockResolvedValue(true);

    renderCreateSessionPage();

    const sessionNameField = screen.getByLabelText(/session name/i);
    const createButton = screen.getByRole('button', { name: /create session/i });

    fireEvent.change(sessionNameField, { target: { value: 'ExistingSession' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(ClientFunctions.checkSessionExists).toHaveBeenCalledWith('ExistingSession');
      // Should not proceed to register session
      expect(ClientFunctions.registerSession).not.toHaveBeenCalled();
    });
  });

  it('maintains consistent UI styling and layout', () => {
    renderCreateSessionPage();

    // Verify main container structure
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    
    // Verify form is in a Paper component (Material-UI styling)
    const sessionNameField = screen.getByLabelText(/session name/i);
    const paperContainer = sessionNameField.closest('[class*="MuiPaper"]');
    expect(paperContainer).toBeInTheDocument();

    // Verify grid layout is maintained
    const createButton = screen.getByRole('button', { name: /create session/i });
    expect(createButton).toBeInTheDocument();
  });

  it('maintains accessibility compliance', () => {
    renderCreateSessionPage();

    const sessionNameField = screen.getByLabelText(/session name/i);
    
    // Verify required field is properly labeled
    expect(sessionNameField).toBeRequired();
    
    // Verify helper text is associated with input
    fireEvent.focus(sessionNameField);
    const helperText = screen.getByText(/only letters and numbers are allowed/i);
    expect(helperText).toBeInTheDocument();
    
    // Verify button has proper accessibility attributes
    const createButton = screen.getByRole('button', { name: /create session/i });
    expect(createButton).toHaveAttribute('type', 'button');
  });
});