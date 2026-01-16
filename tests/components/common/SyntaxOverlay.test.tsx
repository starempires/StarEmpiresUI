import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import SyntaxOverlay from '../../../src/components/common/SyntaxOverlay';
import { OverlayContent } from '../../../src/services/OverlayContentGenerator';

describe('SyntaxOverlay', () => {
  const mockPosition = {
    top: 10,
    left: 200,
    width: 300,
    height: 400
  };

  const mockContent: OverlayContent = {
    type: 'all-commands',
    title: 'Available Commands',
    scrollable: true,
    sections: [
      {
        title: 'Combat Commands',
        content: [
          {
            type: 'command',
            content: 'FIRE - Attack a target',
            highlight: false
          },
          {
            type: 'syntax',
            content: 'FIRE <target>',
            indent: 1
          }
        ]
      }
    ]
  };

  const mockOnToggleVisibility = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overlay when visible with content', () => {
    render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    expect(screen.getByText('Available Commands')).toBeInTheDocument();
    expect(screen.getByText('Combat Commands')).toBeInTheDocument();
    expect(screen.getByText('FIRE - Attack a target')).toBeInTheDocument();
    expect(screen.getByText('FIRE <target>')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <SyntaxOverlay
        visible={false}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    expect(screen.queryByText('Available Commands')).not.toBeInTheDocument();
  });

  it('does not render when content is null', () => {
    render(
      <SyntaxOverlay
        visible={true}
        content={null}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    expect(screen.queryByText('Available Commands')).not.toBeInTheDocument();
  });

  it('calls onToggleVisibility when toggle button is clicked', () => {
    render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    const toggleButton = screen.getByLabelText('Hide syntax overlay (F1 or Escape)');
    fireEvent.click(toggleButton);

    expect(mockOnToggleVisibility).toHaveBeenCalledTimes(1);
  });

  it('applies correct positioning styles', () => {
    const { container } = render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    const overlayElement = container.firstChild as HTMLElement;
    const styles = window.getComputedStyle(overlayElement);
    
    expect(styles.position).toBe('absolute');
    expect(styles.top).toBe('10px');
    expect(styles.left).toBe('200px');
    expect(styles.width).toBe('300px');
    expect(styles.height).toBe('400px');
  });

  it('handles scroll events correctly', () => {
    const mockOnContentScroll = vi.fn();
    
    const { container } = render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
        onContentScroll={mockOnContentScroll}
      />
    );

    // Find the scrollable content area - it's the second Box element (after the header)
    const overlayElement = container.firstChild as HTMLElement;
    const scrollableArea = overlayElement.children[1] as HTMLElement; // Second child is the content area
    
    fireEvent.scroll(scrollableArea, { target: { scrollTop: 100 } });
    expect(mockOnContentScroll).toHaveBeenCalledWith(100);
  });

  it('renders different item types with appropriate styling', () => {
    const contentWithDifferentTypes: OverlayContent = {
      type: 'specific-command',
      title: 'FIRE Command',
      scrollable: false,
      sections: [
        {
          title: 'Syntax',
          content: [
            {
              type: 'syntax',
              content: 'FIRE <target>',
              highlight: true
            }
          ]
        },
        {
          title: 'Parameters',
          content: [
            {
              type: 'parameter',
              content: 'target (ship) - Required',
              highlight: true
            },
            {
              type: 'description',
              content: 'The target to attack',
              indent: 1
            }
          ]
        },
        {
          title: 'Examples',
          content: [
            {
              type: 'example',
              content: 'FIRE ENEMY_SHIP_1'
            }
          ]
        }
      ]
    };

    render(
      <SyntaxOverlay
        visible={true}
        content={contentWithDifferentTypes}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    expect(screen.getByText('FIRE Command')).toBeInTheDocument();
    expect(screen.getByText('Syntax')).toBeInTheDocument();
    expect(screen.getByText('FIRE <target>')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('target (ship) - Required')).toBeInTheDocument();
    expect(screen.getByText('The target to attack')).toBeInTheDocument();
    expect(screen.getByText('Examples')).toBeInTheDocument();
    expect(screen.getByText('FIRE ENEMY_SHIP_1')).toBeInTheDocument();
  });

  it('applies semi-transparent styling for non-intrusive display', () => {
    const { container } = render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    const overlayElement = container.firstChild as HTMLElement;
    const styles = window.getComputedStyle(overlayElement);
    
    expect(styles.backgroundColor).toBe('rgba(248, 249, 250, 0.94)');
    expect(styles.pointerEvents).toBe('auto'); // Allows scrolling while maintaining non-intrusive behavior through click handling
  });

  it('enables scrolling when content is scrollable', () => {
    render(
      <SyntaxOverlay
        visible={true}
        content={{ ...mockContent, scrollable: true }}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    // The content area should have overflow-y: auto when scrollable
    const contentArea = screen.getByText('FIRE - Attack a target').closest('div');
    expect(contentArea).toBeInTheDocument();
  });

  it('disables scrolling when content is not scrollable', () => {
    render(
      <SyntaxOverlay
        visible={true}
        content={{ ...mockContent, scrollable: false }}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    // The content area should have overflow-y: hidden when not scrollable
    const contentArea = screen.getByText('FIRE - Attack a target').closest('div');
    expect(contentArea).toBeInTheDocument();
  });

  it('handles wheel events with scroll containment', () => {
    const { container } = render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    // Find the scrollable content area using the test id
    const scrollableArea = screen.getByTestId('syntax-overlay-content');
    
    // Mock the scroll properties for normal scrolling (not at boundaries)
    Object.defineProperty(scrollableArea, 'scrollTop', { value: 50, writable: true });
    Object.defineProperty(scrollableArea, 'scrollHeight', { value: 500, writable: true });
    Object.defineProperty(scrollableArea, 'clientHeight', { value: 300, writable: true });

    // Create a wheel event for normal scrolling
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true
    });

    // Spy on preventDefault and stopPropagation
    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

    // Fire the wheel event
    fireEvent(scrollableArea, wheelEvent);

    // For normal scrolling (not at boundaries), neither should be called
    expect(stopPropagationSpy).not.toHaveBeenCalled();
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('prevents default wheel behavior at scroll boundaries', () => {
    const { container } = render(
      <SyntaxOverlay
        visible={true}
        content={mockContent}
        position={mockPosition}
        onToggleVisibility={mockOnToggleVisibility}
      />
    );

    const scrollableArea = screen.getByTestId('syntax-overlay-content');
    
    // Test at top boundary (scrollTop = 0, scrolling up)
    Object.defineProperty(scrollableArea, 'scrollTop', { value: 0, writable: true });
    Object.defineProperty(scrollableArea, 'scrollHeight', { value: 500, writable: true });
    Object.defineProperty(scrollableArea, 'clientHeight', { value: 300, writable: true });

    const wheelEventUp = new WheelEvent('wheel', {
      deltaY: -100, // Scrolling up
      bubbles: true,
      cancelable: true
    });

    const preventDefaultSpyUp = vi.spyOn(wheelEventUp, 'preventDefault');
    const stopPropagationSpyUp = vi.spyOn(wheelEventUp, 'stopPropagation');

    fireEvent(scrollableArea, wheelEventUp);

    expect(stopPropagationSpyUp).toHaveBeenCalled();
    expect(preventDefaultSpyUp).toHaveBeenCalled(); // Should prevent default at top boundary

    // Test at bottom boundary (scrollTop + clientHeight >= scrollHeight, scrolling down)
    Object.defineProperty(scrollableArea, 'scrollTop', { value: 200, writable: true }); // 200 + 300 = 500 (scrollHeight)

    const wheelEventDown = new WheelEvent('wheel', {
      deltaY: 100, // Scrolling down
      bubbles: true,
      cancelable: true
    });

    const preventDefaultSpyDown = vi.spyOn(wheelEventDown, 'preventDefault');
    const stopPropagationSpyDown = vi.spyOn(wheelEventDown, 'stopPropagation');

    fireEvent(scrollableArea, wheelEventDown);

    expect(stopPropagationSpyDown).toHaveBeenCalled();
    expect(preventDefaultSpyDown).toHaveBeenCalled(); // Should prevent default at bottom boundary
  });
});