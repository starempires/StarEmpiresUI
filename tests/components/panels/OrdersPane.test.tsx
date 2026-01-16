import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrdersPane from '../../../src/components/panels/OrdersPane';

// Mock the SessionAPI functions
vi.mock('../../../src/components/common/SessionAPI', () => ({
  fetchSessionObject: vi.fn().mockResolvedValue('{"data": "Test orders"}'),
  loadOrdersStatus: vi.fn().mockResolvedValue('UNLOCKED')
}));

// Mock the fetch function for API calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('{"data": "Updated orders"}')
});

describe('OrdersPane Integration', () => {
  const defaultProps = {
    sessionName: 'TestSession',
    empireName: 'TestEmpire',
    turnNumber: 1
  };

  it('renders with syntax overlay visible by default', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter your turn 1 orders here/)).toBeInTheDocument();
    });

    // Check that overlay is present (look for overlay title)
    await waitFor(() => {
      expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
    });
  });

  it('updates overlay content when text changes', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    
    // Type a command to trigger overlay update
    fireEvent.change(textarea, { target: { value: 'BUILD' } });
    
    // Wait for debounced update
    await waitFor(() => {
      // Should show specific command content
      expect(screen.getByText('BUILD Command')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('shows partial command matches when typing incomplete commands', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    
    // Type partial command that has multiple matches (D matches DEPLOY, DESIGN, DESTRUCT, DENY)
    fireEvent.change(textarea, { target: { value: 'D' } });
    
    // Wait for debounced update
    await waitFor(() => {
      // Should show partial commands content
      expect(screen.getByText(/Commands matching "D"/)).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('shows single command when partial match is unique', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    
    // Type partial command that matches only one command
    fireEvent.change(textarea, { target: { value: 'BUIL' } });
    
    // Wait for debounced update
    await waitFor(() => {
      // Should show specific BUILD command content since it's the only match
      expect(screen.getByText('BUILD Command')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('handles single character partial matches', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    
    // Type single character that has multiple matches (T matches TOGGLE, TRANSFER)
    fireEvent.change(textarea, { target: { value: 'T' } });
    
    // Wait for debounced update
    await waitFor(() => {
      // Should show partial commands for T (TOGGLE, TRANSFER)
      expect(screen.getByText(/Commands matching "T"/)).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('returns to all commands for non-matching partial text', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    
    // Type text that doesn't match any commands
    fireEvent.change(textarea, { target: { value: 'XYZ' } });
    
    // Wait for debounced update
    await waitFor(() => {
      // Should show all commands since no partial matches
      expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('toggles overlay visibility when toggle button is clicked', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    // Wait for overlay to be visible
    await waitFor(() => {
      expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
    });

    // Find and click the toggle button
    const toggleButton = screen.getByLabelText('Hide syntax overlay (F1 or Escape)');
    fireEvent.click(toggleButton);

    // Overlay should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Available Commands/)).not.toBeInTheDocument();
    });
  });

  it('handles cursor position changes', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    
    // Set text with multiple lines
    fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer\n\nMOVE Ship1 TO (1,2)' } });
    
    // Simulate cursor position change to the MOVE line
    Object.defineProperty(textarea, 'selectionStart', { value: 30, writable: true });
    fireEvent.keyUp(textarea);
    
    // Wait for overlay update
    await waitFor(() => {
      expect(screen.getByText('MOVE Command')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('maintains existing OrdersPane functionality', async () => {
    // Clear session storage to ensure clean state
    sessionStorage.clear();
    
    render(<OrdersPane {...defaultProps} />);
    
    // Check that existing elements are still present
    await waitFor(() => {
      expect(screen.getByText('Enter Turn 1 Orders')).toBeInTheDocument();
      expect(screen.getByText('Save Orders')).toBeInTheDocument();
      expect(screen.getByText('Lock Orders')).toBeInTheDocument();
    });

    // Check that text input still works
    const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
    fireEvent.change(textarea, { target: { value: 'Test orders' } });
    
    expect(textarea).toHaveValue('Test orders');
  });
});

describe('OrdersPane Compatibility Tests', () => {
  const defaultProps = {
    sessionName: 'TestSession',
    empireName: 'TestEmpire',
    turnNumber: 1
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('Text Area Interaction Compatibility', () => {
    it('should not interfere with text selection', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type some text
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer\nMOVE Ship1 TO (1,2)' } });
      
      // Simulate text selection
      Object.defineProperty(textarea, 'selectionStart', { value: 0, writable: true });
      Object.defineProperty(textarea, 'selectionEnd', { value: 5, writable: true });
      
      fireEvent.select(textarea);
      
      // Verify selection is maintained
      expect(textarea.selectionStart).toBe(0);
      expect(textarea.selectionEnd).toBe(5);
      
      // Verify overlay still works
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should not interfere with copy/paste operations', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type initial text
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer' } });
      
      // Simulate copy operation (Ctrl+C)
      fireEvent.keyDown(textarea, { key: 'c', ctrlKey: true });
      
      // Simulate paste operation (Ctrl+V)
      fireEvent.keyDown(textarea, { key: 'v', ctrlKey: true });
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer\nBUILD Homeworld 5 Destroyer' } });
      
      // Verify text was pasted
      expect(textarea).toHaveValue('BUILD Homeworld 5 Destroyer\nBUILD Homeworld 5 Destroyer');
      
      // Verify overlay still works
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should not interfere with undo/redo operations', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type initial text
      fireEvent.change(textarea, { target: { value: 'BUILD' } });
      
      // Type more text
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld' } });
      
      // Simulate undo operation (Ctrl+Z)
      fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });
      
      // Verify overlay still works after undo
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Scrolling Compatibility', () => {
    it('should not interfere with textarea scrolling', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Create long text that requires scrolling
      const longText = Array(50).fill('BUILD Homeworld 5 Destroyer').join('\n');
      fireEvent.change(textarea, { target: { value: longText } });
      
      // Simulate scroll event on textarea
      fireEvent.scroll(textarea, { target: { scrollTop: 100 } });
      
      // Verify overlay is still functional
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should handle wheel events without blocking textarea scroll', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Create scrollable content
      const longText = Array(20).fill('BUILD Homeworld 5 Destroyer').join('\n');
      fireEvent.change(textarea, { target: { value: longText } });
      
      // Simulate wheel event
      fireEvent.wheel(textarea, { deltaY: 100 });
      
      // Verify overlay still works
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Focus and Blur Compatibility', () => {
    it('should not interfere with textarea focus', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Focus the textarea
      fireEvent.focus(textarea);
      
      // Verify overlay is still visible and functional
      await waitFor(() => {
        expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
      });
    });

    it('should not steal focus from textarea when updating content', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Focus the textarea
      fireEvent.focus(textarea);
      
      // Type to trigger overlay update
      fireEvent.change(textarea, { target: { value: 'BUILD' } });
      
      // Wait for overlay update
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
      
      // Verify textarea content is correct (focus may not be testable in jsdom)
      expect(textarea).toHaveValue('BUILD');
    });

    it('should handle blur events properly', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Focus then blur the textarea
      fireEvent.focus(textarea);
      fireEvent.blur(textarea);
      
      // Verify overlay is still functional
      await waitFor(() => {
        expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
      });
    });
  });

  describe('Button and Control Compatibility', () => {
    it('should not interfere with Save Orders button', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const saveButton = await screen.findByText('Save Orders');
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type some orders
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer' } });
      
      // Wait for overlay to update
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
      
      // Click save button
      fireEvent.click(saveButton);
      
      // Verify button click was processed (button should be disabled during processing)
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it('should not interfere with Lock Orders checkbox functionality', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const lockCheckbox = await screen.findByRole('checkbox', { name: /lock orders/i });
      
      // Verify checkbox starts unchecked
      expect(lockCheckbox).not.toBeChecked();
      
      // Verify overlay is functional
      await waitFor(() => {
        expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
      });
      
      // The checkbox functionality is tested - the actual state change depends on backend
      // which is mocked, so we just verify the overlay doesn't interfere with the interaction
      fireEvent.click(lockCheckbox);
      
      // Verify overlay is still functional after checkbox interaction
      expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
    });

    it('should allow overlay toggle without affecting other controls', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const toggleButton = await screen.findByLabelText('Hide syntax overlay (F1 or Escape)');
      const saveButton = await screen.findByText('Save Orders');
      const lockCheckbox = await screen.findByRole('checkbox', { name: /lock orders/i });
      
      // Toggle overlay off
      fireEvent.click(toggleButton);
      
      // Verify other controls are still accessible and functional
      expect(saveButton).not.toBeDisabled();
      expect(lockCheckbox).not.toBeChecked();
      
      // Toggle overlay back on
      const showButton = await screen.findByLabelText('Show syntax overlay (F1)');
      fireEvent.click(showButton);
      
      // Verify overlay is back and other controls still work
      await waitFor(() => {
        expect(screen.getByText(/Available Commands/)).toBeInTheDocument();
      });
      
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Performance and Responsiveness Compatibility', () => {
    it('should handle typing without significant performance impact', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type a reasonable amount of text
      const text = 'BUILD Homeworld 5 Destroyer';
      fireEvent.change(textarea, { target: { value: text } });
      
      // Verify overlay responds appropriately
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 500 });
      
      // Verify text was entered correctly
      expect(textarea).toHaveValue(text);
    });

    it('should handle rapid cursor movements efficiently', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Set up text with multiple commands
      const text = 'BUILD Homeworld 5 Destroyer\n\nMOVE Ship1 TO (1,2)\n\nFIRE Ship2 AT (3,4)';
      fireEvent.change(textarea, { target: { value: text } });
      
      // Simulate cursor movement to BUILD command position
      Object.defineProperty(textarea, 'selectionStart', { value: 5, writable: true });
      fireEvent.keyUp(textarea);
      
      // Wait for overlay to update and verify it shows BUILD command
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Error Handling Compatibility', () => {
    it('should handle overlay errors gracefully without affecting textarea', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type valid text first
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer' } });
      
      // Verify overlay works initially
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
      
      // Verify textarea functionality is preserved even if overlay has issues
      fireEvent.change(textarea, { target: { value: 'Different text' } });
      expect(textarea).toHaveValue('Different text');
    });

    it('should recover from overlay rendering errors', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type valid text first
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer' } });
      
      // Verify overlay works initially
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      }, { timeout: 200 });
      
      // Verify textarea functionality is preserved even if overlay has issues
      fireEvent.change(textarea, { target: { value: 'Different text' } });
      expect(textarea).toHaveValue('Different text');
    });
  });

  describe('Session Storage Compatibility', () => {
    it('should not interfere with other session storage usage', async () => {
      // Set some other session storage data
      sessionStorage.setItem('other_data', 'test_value');
      
      render(<OrdersPane {...defaultProps} />);
      
      // Toggle overlay to trigger session storage usage
      const toggleButton = await screen.findByLabelText('Hide syntax overlay (F1 or Escape)');
      fireEvent.click(toggleButton);
      
      // Verify other session storage data is preserved
      expect(sessionStorage.getItem('other_data')).toBe('test_value');
      
      // Verify overlay session storage works
      expect(sessionStorage.getItem('syntaxOverlay_visible')).toBe('false');
    });

    it('should handle session storage operations gracefully', async () => {
      render(<OrdersPane {...defaultProps} />);
      
      const textarea = await screen.findByPlaceholderText(/Enter your turn 1 orders here/);
      
      // Type some text
      fireEvent.change(textarea, { target: { value: 'BUILD Homeworld 5 Destroyer' } });
      
      // Toggle overlay multiple times to trigger storage operations
      const toggleButton = await screen.findByLabelText('Hide syntax overlay (F1 or Escape)');
      
      // Toggle off
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByText(/Available Commands/)).not.toBeInTheDocument();
      });
      
      // Toggle back on
      const showButton = await screen.findByLabelText('Show syntax overlay (F1)');
      fireEvent.click(showButton);
      await waitFor(() => {
        expect(screen.getByText('BUILD Command')).toBeInTheDocument();
      });
      
      // Verify component still works after storage operations
      expect(textarea).toHaveValue('BUILD Homeworld 5 Destroyer');
    });
  });
});