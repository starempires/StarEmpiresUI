import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
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

/**
 * Property-Based Tests for Boolean Session Properties
 * 
 * These tests use fast-check to generate random test data and verify
 * that correctness properties hold across all valid inputs.
 */
describe('CreateSessionPage - Boolean Properties Property Tests', () => {
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

  /**
   * **Feature: boolean-session-properties, Property 3: Default value initialization**
   * **Validates: Requirements 1.5, 5.4**
   */
  it('Property 3: Default value initialization', () => {
    // Setup: Render CreateSessionPage
    renderCreateSessionPage();

    // Act: Check that boolean properties are initialized with their default values
    const localizeFramesSwitch = screen.getByRole('switch', { name: /localize frames of reference/i });

    // Assert: The switch should be checked (default value is true)
    expect(localizeFramesSwitch).toBeChecked();
  });

  /**
   * **Feature: boolean-session-properties, Property 1: Boolean toggle state synchronization**
   * **Validates: Requirements 1.2, 2.2, 2.3**
   */
  it('Property 1: Boolean toggle state synchronization', () => {
    fc.assert(
      fc.property(fc.boolean(), (initialValue) => {
        // Setup: Render CreateSessionPage
        const { unmount } = renderCreateSessionPage();

        try {
          // Act: Get the switch and verify initial state
          const localizeFramesSwitch = screen.getByRole('switch', { name: /localize frames of reference/i });
          
          // Set the switch to the initial value by toggling if needed
          if (localizeFramesSwitch.checked !== initialValue) {
            fireEvent.click(localizeFramesSwitch);
          }
          
          // Verify the switch is in the expected initial state
          expect(localizeFramesSwitch.checked).toBe(initialValue);
          
          // Act: Toggle the switch
          fireEvent.click(localizeFramesSwitch);
          
          // Assert: The switch state should be synchronized (opposite of initial value)
          expect(localizeFramesSwitch.checked).toBe(!initialValue);
          
          // Act: Toggle again
          fireEvent.click(localizeFramesSwitch);
          
          // Assert: The switch should return to the initial state
          expect(localizeFramesSwitch.checked).toBe(initialValue);
        } finally {
          // Cleanup: Unmount to avoid multiple elements in subsequent runs
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  }, 10000);

  /**
   * **Feature: boolean-session-properties, Property 5: Visual state reflection**
   * **Validates: Requirements 4.3**
   */
  it('Property 5: Visual state reflection', () => {
    fc.assert(
      fc.property(fc.boolean(), (targetState) => {
        // Setup: Render CreateSessionPage
        const { unmount } = renderCreateSessionPage();

        try {
          // Act: Get the switch element
          const localizeFramesSwitch = screen.getByRole('switch', { name: /localize frames of reference/i });
          
          // Set the switch to the target state by toggling if needed
          if (localizeFramesSwitch.checked !== targetState) {
            fireEvent.click(localizeFramesSwitch);
          }

          // Assert: The Switch component should visually reflect the current boolean state value
          expect(localizeFramesSwitch.checked).toBe(targetState);
          
          // Assert: The switch should have the correct aria attributes for accessibility
          expect(localizeFramesSwitch).toHaveAttribute('type', 'checkbox');
          expect(localizeFramesSwitch).toHaveAttribute('role', 'switch');
          
          // Assert: The visual state should be consistent with the checked property
          if (targetState) {
            expect(localizeFramesSwitch).toBeChecked();
          } else {
            expect(localizeFramesSwitch).not.toBeChecked();
          }
        } finally {
          // Cleanup: Unmount to avoid multiple elements in subsequent runs
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  }, 10000);

  /**
   * **Feature: boolean-session-properties, Property 7: Boolean value validation**
   * **Validates: Requirements 5.5**
   */
  it('Property 7: Boolean value validation', () => {
    fc.assert(
      fc.property(fc.boolean(), (targetValue) => {
        // Setup: Render CreateSessionPage
        const { unmount } = renderCreateSessionPage();

        try {
          // Act: Get the switch and set it to the target value
          const localizeFramesSwitch = screen.getByRole('switch', { name: /localize frames of reference/i });
          
          // Toggle the switch if needed to reach the target value
          if (localizeFramesSwitch.checked !== targetValue) {
            fireEvent.click(localizeFramesSwitch);
          }

          // Assert: The switch should reflect the boolean state correctly
          expect(localizeFramesSwitch.checked).toBe(targetValue);
          
          // Assert: The value should always be a valid boolean
          expect(typeof localizeFramesSwitch.checked).toBe('boolean');
        } finally {
          // Cleanup: Unmount to avoid multiple elements in subsequent runs
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  }, 10000);

  /**
   * **Feature: boolean-session-properties, Property 6: Scalable property handling**
   * **Validates: Requirements 5.3**
   */
  it('Property 6: Scalable property handling', () => {
    // This test verifies that the system can handle an arbitrary number of boolean properties
    // by testing the current implementation with the existing property configuration
    
    // Setup: Render CreateSessionPage
    renderCreateSessionPage();

    // Act: Verify that all boolean properties defined in BOOLEAN_SESSION_PROPERTIES are rendered
    const booleanPropertiesSection = screen.getByText(/boolean properties/i);
    expect(booleanPropertiesSection).toBeInTheDocument();

    // Get all switch elements in the boolean properties section
    const switches = screen.getAllByRole('switch');
    
    // Assert: The number of switches should match the number of defined boolean properties
    // Currently we have 1 boolean property (localizeFramesOfReference)
    expect(switches).toHaveLength(1);
    
    // Assert: Each switch should be properly labeled and functional
    switches.forEach((switchElement) => {
      // Each switch should have a proper label
      expect(switchElement).toHaveAccessibleName();
      
      // Each switch should be a valid boolean control
      expect(switchElement).toHaveAttribute('type', 'checkbox');
      expect(switchElement).toHaveAttribute('role', 'switch');
      
      // Each switch should have a boolean checked state
      expect(typeof switchElement.checked).toBe('boolean');
    });

    // Assert: The localizeFramesOfReference property should be present and functional
    const localizeFramesSwitch = screen.getByRole('switch', { name: /localize frames of reference/i });
    expect(localizeFramesSwitch).toBeInTheDocument();
    
    // Test that the switch can be toggled
    const initialState = localizeFramesSwitch.checked;
    fireEvent.click(localizeFramesSwitch);
    expect(localizeFramesSwitch.checked).toBe(!initialState);
    
    // Test that it can be toggled back
    fireEvent.click(localizeFramesSwitch);
    expect(localizeFramesSwitch.checked).toBe(initialState);
  });

  /**
   * **Feature: boolean-session-properties, Property 9: Existing functionality preservation**
   * **Validates: Requirements 6.1, 6.5**
   */
  it('Property 9: Existing functionality preservation', async () => {
    // This test verifies that adding boolean properties doesn't break existing functionality
    // We test with a specific set of values to ensure deterministic behavior
    
    const testCases = [
      { sessionName: 'TestSession1', numPlayers: 4, booleanValue: true },
      { sessionName: 'TestSession2', numPlayers: 6, booleanValue: false },
      { sessionName: 'TestSession3', numPlayers: 8, booleanValue: true }
    ];

    for (const testData of testCases) {
      // Setup: Render CreateSessionPage for each test case
      const { unmount } = renderCreateSessionPage();

      try {
        // Act: Fill in the form with test data
        const sessionNameField = screen.getByLabelText(/session name/i);
        const numPlayersSelect = screen.getByLabelText(/number of players/i);
        const localizeFramesSwitch = screen.getByRole('switch', { name: /localize frames of reference/i });
        const createButton = screen.getByRole('button', { name: /create session/i });

        // Set session name
        fireEvent.change(sessionNameField, { target: { value: testData.sessionName } });
        
        // Set number of players
        fireEvent.mouseDown(numPlayersSelect);
        const playerOption = screen.getByRole('option', { name: testData.numPlayers.toString() });
        fireEvent.click(playerOption);
        
        // Set boolean property value
        if (localizeFramesSwitch.checked !== testData.booleanValue) {
          fireEvent.click(localizeFramesSwitch);
        }

        // Assert: All existing integer properties should still be present and functional
        const galaxyRadiusField = screen.getByLabelText(/galaxy radius/i);
        const worldDensityField = screen.getByLabelText(/world density/i);
        const stormIntensityField = screen.getByLabelText(/max storm intensity/i);
        
        expect(galaxyRadiusField).toBeInTheDocument();
        expect(worldDensityField).toBeInTheDocument();
        expect(stormIntensityField).toBeInTheDocument();
        
        // Assert: Integer properties should have their default values
        expect(galaxyRadiusField).toHaveValue(5);
        expect(worldDensityField).toHaveValue(5);
        expect(stormIntensityField).toHaveValue(5);
        
        // Assert: Form should be submittable when session name is provided
        expect(createButton).not.toBeDisabled();
        
        // Assert: Session name field should contain the entered value
        expect(sessionNameField).toHaveValue(testData.sessionName);
        
        // Assert: Number of players should be set correctly
        expect(numPlayersSelect).toHaveTextContent(testData.numPlayers.toString());
        
        // Assert: Boolean property should be set correctly
        expect(localizeFramesSwitch.checked).toBe(testData.booleanValue);

        // Act: Test that integer properties can still be modified
        fireEvent.change(galaxyRadiusField, { target: { value: '7' } });
        expect(galaxyRadiusField).toHaveValue(7);
        
        // Act: Submit the form to verify the complete workflow still works
        fireEvent.click(createButton);

        // Assert: API calls should be made with both integer and boolean properties
        await waitFor(() => {
          expect(SessionAPI.createSession).toHaveBeenCalledWith(
            testData.sessionName,
            expect.objectContaining({
              // Should contain integer properties
              radius: '7', // modified value
              worldDensity: '5', // default value
              maxStormIntensity: '5', // default value
              // Should contain boolean properties
              localizeFramesOfReference: testData.booleanValue.toString()
            })
          );
        });

      } finally {
        // Cleanup: Unmount to avoid multiple elements in subsequent runs
        unmount();
      }
    }
  }, 30000);
});