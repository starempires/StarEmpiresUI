import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Slide from '@mui/material/Slide';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { OverlayContent, OverlayItem } from '../../services/OverlayContentGenerator';

// Performance optimization: Define keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  TOGGLE_OVERLAY: 'F1', // F1 to toggle overlay visibility
  FOCUS_OVERLAY: 'F2',  // F2 to focus overlay for keyboard navigation
  ESCAPE: 'Escape'      // Escape to close overlay
} as const;

interface SyntaxOverlayProps {
  visible: boolean;
  content: OverlayContent | null;
  position: { top: number; left: number; width: number; height: number };
  onToggleVisibility: () => void;
  onContentScroll?: (scrollTop: number) => void;
  showToggleFeedback?: boolean;
  scrollPosition?: number;
  // Accessibility and keyboard navigation props
  onKeyboardShortcut?: (shortcut: string) => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Performance optimization: Memoized overlay item component
const OverlayItemComponent = React.memo<{
  item: OverlayItem;
  sectionIndex: number;
  itemIndex: number;
  contentTransition: boolean;
  getItemColor: (type: OverlayItem['type'], highlight?: boolean) => string;
  getItemBackground: (type: OverlayItem['type'], highlight?: boolean) => string;
  visualTheme: any;
}>(({ item, sectionIndex, itemIndex, contentTransition, getItemColor, getItemBackground, visualTheme }) => (
  <Grow
    key={`item-${sectionIndex}-${itemIndex}`}
    in={!contentTransition}
    timeout={{ enter: 200, exit: 150 }}
    style={{ 
      transitionDelay: `${(sectionIndex * 50) + (itemIndex * 25)}ms`,
      transformOrigin: 'left center'
    }}
  >
    <Box
      sx={{
        marginLeft: item.indent ? `${item.indent * visualTheme.spacing.sm}px` : 0,
        marginBottom: 1,
        padding: item.highlight ? `${visualTheme.spacing.xs}px` : 0,
        borderRadius: item.highlight ? 1 : 0,
        backgroundColor: getItemBackground(item.type, item.highlight),
        border: item.highlight ? `1px solid ${getItemColor(item.type, false)}20` : 'none',
        transition: `all ${visualTheme.transitions.medium}`,
        '&:hover': {
          backgroundColor: item.highlight 
            ? getItemBackground(item.type, true)
            : 'rgba(0, 0, 0, 0.02)',
          transform: item.highlight ? 'translateX(2px)' : 'none'
        }
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: getItemColor(item.type, item.highlight),
          fontWeight: item.highlight ? 'bold' : 'normal',
          fontFamily: item.type === 'syntax' || item.type === 'example' 
            ? visualTheme.typography.monospace.fontFamily 
            : 'inherit',
          fontSize: item.type === 'syntax' || item.type === 'example'
            ? visualTheme.typography.monospace.fontSize
            : visualTheme.typography.content.fontSize,
          lineHeight: item.type === 'syntax' || item.type === 'example'
            ? visualTheme.typography.monospace.lineHeight
            : visualTheme.typography.content.lineHeight,
          display: 'block',
          whiteSpace: item.type === 'syntax' || item.type === 'example' ? 'pre-wrap' : 'normal',
          transition: `color ${visualTheme.transitions.fast}`,
          '&:hover': {
            color: item.highlight 
              ? getItemColor(item.type, true)
              : getItemColor(item.type, false)
          }
        }}
      >
        {item.content}
      </Typography>
    </Box>
  </Grow>
));

OverlayItemComponent.displayName = 'OverlayItemComponent';

/**
 * SyntaxOverlay Component with Enhanced Performance, Accessibility, and Keyboard Support
 * 
 * A semi-translucent overlay that displays command syntax information
 * positioned within the OrdersPane. The overlay provides contextual help
 * without interfering with text editing functionality.
 * 
 * Enhanced features:
 * - Performance optimizations with React.memo and memoized components
 * - Full accessibility support with ARIA labels and keyboard navigation
 * - Keyboard shortcuts for overlay control (F1 to toggle, F2 to focus, Escape to close)
 * - Comprehensive error logging and debugging support
 * - Smooth animations for state changes with optimized rendering
 * - Consistent visual hierarchy across all content types
 * - Advanced scroll containment and pointer event management
 */
const SyntaxOverlay: React.FC<SyntaxOverlayProps> = React.memo(({
  visible,
  content,
  position,
  onToggleVisibility,
  onContentScroll,
  showToggleFeedback = false,
  scrollPosition = 0,
  onKeyboardShortcut,
  ariaLabel = 'Syntax overlay for command help',
  ariaDescribedBy
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [contentTransition, setContentTransition] = useState<boolean>(false);
  const [previousContentKey, setPreviousContentKey] = useState<string>('');
  const [keyboardFocused, setKeyboardFocused] = useState<boolean>(false);

  // Performance optimization: Memoize keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    try {
      // Handle keyboard shortcuts
      switch (event.key) {
        case KEYBOARD_SHORTCUTS.TOGGLE_OVERLAY:
          if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            onToggleVisibility();
            onKeyboardShortcut?.(KEYBOARD_SHORTCUTS.TOGGLE_OVERLAY);
            
            // Log keyboard shortcut usage for analytics
            console.debug('Syntax overlay toggled via F1 keyboard shortcut');
          }
          break;
          
        case KEYBOARD_SHORTCUTS.FOCUS_OVERLAY:
          if (visible && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            
            // Focus the overlay content for keyboard navigation
            if (overlayRef.current) {
              overlayRef.current.focus();
              setKeyboardFocused(true);
              onKeyboardShortcut?.(KEYBOARD_SHORTCUTS.FOCUS_OVERLAY);
              
              console.debug('Syntax overlay focused via F2 keyboard shortcut');
            }
          }
          break;
          
        case KEYBOARD_SHORTCUTS.ESCAPE:
          if (visible && keyboardFocused) {
            event.preventDefault();
            event.stopPropagation();
            
            // Close overlay or remove focus
            if (keyboardFocused) {
              setKeyboardFocused(false);
              // Return focus to text area
              const textArea = document.querySelector('textarea[placeholder*="orders"]') as HTMLTextAreaElement;
              if (textArea) {
                textArea.focus();
              }
            }
            onKeyboardShortcut?.(KEYBOARD_SHORTCUTS.ESCAPE);
            
            console.debug('Syntax overlay focus removed via Escape keyboard shortcut');
          }
          break;
      }
    } catch (error) {
      console.error('Error handling keyboard shortcut in SyntaxOverlay:', error);
    }
  }, [visible, keyboardFocused, onToggleVisibility, onKeyboardShortcut]);

  // Performance optimization: Add and remove keyboard event listeners
  useEffect(() => {
    try {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } catch (error) {
      console.error('Error setting up keyboard event listeners in SyntaxOverlay:', error);
    }
  }, [handleKeyDown]);
  // Performance optimization: Memoize visual theme to prevent unnecessary recalculations
  const visualTheme = useMemo(() => ({
    spacing: {
      xs: 1,    // Further reduced from 2 to minimize scrolling
      sm: 2,    // Further reduced from 4 to minimize scrolling
      md: 3,    // Further reduced from 6 to minimize scrolling
      lg: 4,    // Further reduced from 8 to minimize scrolling
      xl: 6     // Further reduced from 10 to minimize scrolling
    },
    typography: {
      title: {
        fontSize: '0.75rem',
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
        lineHeight: 1.0    // Further reduced from 1.1 to minimize scrolling
      },
      sectionHeader: {
        fontSize: '0.7rem',
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase' as const,
        lineHeight: 1.1    // Further reduced from 1.2 to minimize scrolling
      },
      content: {
        fontSize: '0.75rem',
        lineHeight: 1.2,   // Further reduced from 1.3 to minimize scrolling
        fontWeight: 'normal'
      },
      monospace: {
        fontSize: '0.75rem',
        lineHeight: 1.1,   // Further reduced from 1.2 to minimize scrolling
        fontFamily: 'monospace'
      }
    },
    transitions: {
      fast: '0.15s ease-out',
      medium: '0.25s ease-in-out',
      slow: '0.35s ease-in-out',
      content: '0.2s ease-in-out'
    },
    shadows: {
      subtle: '0 1px 3px rgba(0, 0, 0, 0.12)',
      medium: '0 2px 8px rgba(0, 0, 0, 0.15)',
      strong: '0 4px 12px rgba(0, 0, 0, 0.2)'
    }
  }), []);

  // Performance optimization: Memoize color mapping to prevent recalculation
  const colorMap = useMemo(() => ({
    command: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      highlight: '#1976d2'
    },
    syntax: {
      primary: '#2e7d32',
      secondary: '#4caf50',
      background: 'rgba(46, 125, 50, 0.08)'
    },
    parameter: {
      primary: '#0288d1',
      secondary: '#03a9f4',
      background: 'rgba(2, 136, 209, 0.08)'
    },
    example: {
      primary: '#ed6c02',
      secondary: '#ff9800',
      background: 'rgba(237, 108, 2, 0.08)'
    },
    description: {
      primary: 'rgba(0, 0, 0, 0.6)',
      secondary: 'rgba(0, 0, 0, 0.4)'
    },
    section: {
      primary: '#1976d2',
      secondary: '#1565c0',
      background: 'rgba(25, 118, 210, 0.04)'
    }
  }), []);

  /**
   * Performance optimization: Memoized color function with consistent visual hierarchy
   */
  const getItemColor = useCallback((type: OverlayItem['type'], highlight?: boolean): string => {
    try {
      if (highlight) return colorMap.command.highlight;
      
      switch (type) {
        case 'command': return colorMap.command.primary;
        case 'syntax': return colorMap.syntax.primary;
        case 'parameter': return colorMap.parameter.primary;
        case 'example': return colorMap.example.primary;
        case 'description': return colorMap.description.primary;
        default: return colorMap.command.primary;
      }
    } catch (error) {
      console.error('Error in getItemColor:', error);
      return colorMap.command.primary; // Safe fallback
    }
  }, [colorMap]);

  /**
   * Performance optimization: Memoized background color function for content items
   */
  const getItemBackground = useCallback((type: OverlayItem['type'], highlight?: boolean): string => {
    try {
      if (!highlight) return 'transparent';
      
      switch (type) {
        case 'syntax': return colorMap.syntax.background;
        case 'parameter': return colorMap.parameter.background;
        case 'example': return colorMap.example.background;
        default: return 'transparent';
      }
    } catch (error) {
      console.error('Error in getItemBackground:', error);
      return 'transparent'; // Safe fallback
    }
  }, [colorMap]);

  // Performance optimization: Memoized content change detection for smooth transitions
  useEffect(() => {
    try {
      if (content) {
        const contentKey = `${content.type}-${content.title}-${content.sections.length}`;
        if (contentKey !== previousContentKey && previousContentKey !== '') {
          setContentTransition(true);
          const timer = setTimeout(() => setContentTransition(false), 200);
          return () => clearTimeout(timer);
        }
        setPreviousContentKey(contentKey);
      }
    } catch (error) {
      console.error('Error in content change detection:', error);
    }
  }, [content, previousContentKey]);

  // Performance optimization: Restore scroll position with error handling
  React.useEffect(() => {
    try {
      if (contentRef.current && scrollPosition > 0 && visible) {
        const currentScroll = contentRef.current.scrollTop;
        // Only restore if there's a significant difference (more than 10px)
        if (Math.abs(currentScroll - scrollPosition) > 10) {
          requestAnimationFrame(() => {
            if (contentRef.current) {
              contentRef.current.scrollTop = scrollPosition;
            }
          });
        }
      }
    } catch (error) {
      console.error('Error restoring scroll position:', error);
    }
  }, [visible, content]); // Restore on visibility change or content change, not on every scroll position update

  // Performance optimization: Memoized scroll handler with error handling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    try {
      const scrollTop = event.currentTarget.scrollTop;
      onContentScroll?.(scrollTop);
    } catch (error) {
      console.error('Error in scroll handler:', error);
    }
  }, [onContentScroll]);

  // Performance optimization: Memoized content rendering with error handling and accessibility
  const renderedContent = useMemo(() => {
    try {
      if (!content) return null;

      return content.sections.map((section, sectionIndex) => (
        <Fade
          key={`section-${sectionIndex}`}
          in={!contentTransition}
          timeout={{ enter: 300, exit: 200 }}
          style={{ transitionDelay: `${sectionIndex * 50}ms` }}
        >
          <Box 
            role="region"
            aria-labelledby={section.title ? `section-title-${sectionIndex}` : undefined}
            sx={{ 
              marginBottom: visualTheme.spacing.sm,
              padding: visualTheme.spacing.xs,
              borderRadius: 1,
              backgroundColor: section.title ? colorMap.section.background : 'transparent',
              transition: `all ${visualTheme.transitions.medium}`,
              '&:hover': {
                backgroundColor: section.title ? 'rgba(25, 118, 210, 0.06)' : 'transparent'
              }
            }}
          >
            {section.title && (
              <Typography
                id={`section-title-${sectionIndex}`}
                variant="caption"
                component="h3"
                sx={{
                  ...visualTheme.typography.sectionHeader,
                  color: colorMap.section.primary,
                  display: 'block',
                  marginBottom: 1,
                  paddingBottom: 1,
                  borderBottom: `1px solid ${colorMap.section.background}`,
                  transition: `color ${visualTheme.transitions.fast}`
                }}
              >
                {section.title}
              </Typography>
            )}
            
            {section.content.map((item, itemIndex) => (
              <OverlayItemComponent
                key={`item-${sectionIndex}-${itemIndex}`}
                item={item}
                sectionIndex={sectionIndex}
                itemIndex={itemIndex}
                contentTransition={contentTransition}
                getItemColor={getItemColor}
                getItemBackground={getItemBackground}
                visualTheme={visualTheme}
              />
            ))}
          </Box>
        </Fade>
      ));
    } catch (error) {
      console.error('Error rendering overlay content:', error);
      return (
        <Box sx={{ padding: 2 }}>
          <Typography color="error" variant="caption">
            Error rendering content. Please refresh the page.
          </Typography>
        </Box>
      );
    }
  }, [content, contentTransition, getItemColor, getItemBackground, colorMap, visualTheme]);

  // Performance optimization: Memoized toggle button styles with accessibility
  const toggleButtonStyles = useMemo(() => ({
    visible: {
      padding: visualTheme.spacing.xs,
      color: colorMap.command.secondary,
      backgroundColor: showToggleFeedback 
        ? colorMap.section.background
        : 'transparent',
      transition: `all ${visualTheme.transitions.medium}`,
      borderRadius: 1,
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        transform: 'scale(1.05)',
        boxShadow: visualTheme.shadows.subtle
      },
      '&:active': {
        transform: 'scale(0.95)',
        transition: `all ${visualTheme.transitions.fast}`
      },
      '&:focus': {
        outline: '2px solid #1976d2',
        outlineOffset: '2px'
      }
    },
    hidden: {
      backgroundColor: showToggleFeedback 
        ? colorMap.section.background
        : 'rgba(255, 255, 255, 0.95)',
      border: `1px solid ${colorMap.section.background}`,
      borderRadius: 1,
      padding: visualTheme.spacing.xs,
      color: colorMap.command.secondary,
      boxShadow: visualTheme.shadows.medium,
      transition: `all ${visualTheme.transitions.medium}`,
      '&:hover': {
        backgroundColor: colorMap.section.background,
        transform: 'scale(1.05)',
        boxShadow: visualTheme.shadows.strong
      },
      '&:active': {
        transform: 'scale(0.95)',
        transition: `all ${visualTheme.transitions.fast}`
      },
      '&:focus': {
        outline: '2px solid #1976d2',
        outlineOffset: '2px'
      }
    }
  }), [showToggleFeedback, colorMap, visualTheme]);

  // Performance optimization: Early return with enhanced accessibility for hidden state
  if (!visible || !content) {
    if (!visible) {
      return (
        <Slide
          direction="left"
          in={!visible}
          timeout={{ enter: 300, exit: 200 }}
          mountOnEnter
          unmountOnExit
        >
          <Box
            sx={{
              position: 'absolute',
              top: position.top,
              right: visualTheme.spacing.md,
              zIndex: 100,
              transition: `all ${visualTheme.transitions.medium}`,
            }}
          >
            <Grow
              in={!visible}
              timeout={{ enter: 400, exit: 200 }}
            >
              <IconButton
                size="small"
                onClick={onToggleVisibility}
                sx={toggleButtonStyles.hidden}
                aria-label="Show syntax overlay (F1)"
                title="Show syntax overlay (F1)"
                tabIndex={0}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Grow>
            
            {showToggleFeedback && (
              <Fade
                in={showToggleFeedback}
                timeout={{ enter: 200, exit: 300 }}
              >
                <Box
                  role="status"
                  aria-live="polite"
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    mt: visualTheme.spacing.xs,
                    px: visualTheme.spacing.sm,
                    py: visualTheme.spacing.xs,
                    backgroundColor: colorMap.section.primary,
                    color: 'white',
                    borderRadius: 1,
                    fontSize: visualTheme.typography.content.fontSize,
                    whiteSpace: 'nowrap',
                    boxShadow: visualTheme.shadows.medium,
                    animation: 'slideUpFade 1.2s ease-in-out',
                    '@keyframes slideUpFade': {
                      '0%': { opacity: 0, transform: 'translateY(10px) scale(0.9)' },
                      '20%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                      '80%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                      '100%': { opacity: 0, transform: 'translateY(-5px) scale(0.95)' },
                    }
                  }}
                >
                  Overlay Hidden
                </Box>
              </Fade>
            )}
          </Box>
        </Slide>
      );
    }
    return null;
  }

  return (
    <Fade
      in={visible && !!content}
      timeout={{ enter: 350, exit: 250 }}
      mountOnEnter
      unmountOnExit
    >
      <Box
        ref={overlayRef}
        role="complementary"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={keyboardFocused ? 0 : -1}
        onFocus={() => setKeyboardFocused(true)}
        onBlur={() => setKeyboardFocused(false)}
        onClick={(e) => {
          try {
            // Prevent clicks on the overlay background from interfering with text area
            // Only stop propagation if the click is on interactive elements (header, scrollbar)
            const target = e.target as HTMLElement;
            const isInteractiveElement = target.closest('button') || 
                                       target.closest('[role="button"]') ||
                                       target.closest('.MuiIconButton-root') ||
                                       target === contentRef.current;
            
            if (!isInteractiveElement) {
              // Allow clicks to pass through to text area for non-interactive areas
              e.stopPropagation();
            }
          } catch (error) {
            console.error('Error handling overlay click:', error);
          }
        }}
        sx={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
          backgroundColor: 'rgba(248, 249, 250, 0.94)',
          backdropFilter: 'blur(3px)',
          border: `1px solid ${colorMap.section.background}`,
          borderRadius: 2,
          overflow: 'hidden',
          pointerEvents: 'auto', // CRITICAL: Allow pointer events for scrolling
          zIndex: 100, // Lower than autocomplete and validation overlays
          transition: `all ${visualTheme.transitions.slow}`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: visualTheme.typography.content.fontSize,
          boxShadow: visualTheme.shadows.strong,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
            transform: 'scale(1.002)'
          },
          // Enhanced focus styles for accessibility
          '&:focus': {
            outline: '3px solid #1976d2',
            outlineOffset: '2px'
          }
        }}
      >
        {/* Enhanced header with accessibility and keyboard support */}
        <Slide
          direction="down"
          in={visible && !!content}
          timeout={{ enter: 300, exit: 200 }}
        >
          <Box
            role="banner"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `${visualTheme.spacing.sm}px ${visualTheme.spacing.md}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderBottom: `1px solid ${colorMap.section.background}`,
              pointerEvents: 'auto', // Allow interaction with header
              backdropFilter: 'blur(2px)',
              transition: `all ${visualTheme.transitions.medium}`,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }
            }}
          >
            <Typography
              variant="caption"
              component="h2"
              sx={{
                ...visualTheme.typography.title,
                color: colorMap.command.primary,
                transition: `color ${visualTheme.transitions.fast}`
              }}
            >
              {content?.title}
            </Typography>
            
            <IconButton
              size="small"
              onClick={onToggleVisibility}
              sx={toggleButtonStyles.visible}
              aria-label="Hide syntax overlay (F1 or Escape)"
              title="Hide syntax overlay (F1 or Escape)"
              tabIndex={0}
            >
              <VisibilityOffIcon fontSize="small" />
            </IconButton>
          </Box>
        </Slide>

        {/* Enhanced visual feedback with accessibility */}
        {showToggleFeedback && (
          <Grow
            in={showToggleFeedback}
            timeout={{ enter: 250, exit: 200 }}
          >
            <Box
              role="status"
              aria-live="polite"
              sx={{
                position: 'absolute',
                top: '100%',
                right: visualTheme.spacing.sm,
                mt: visualTheme.spacing.xs,
                px: visualTheme.spacing.sm,
                py: visualTheme.spacing.xs,
                backgroundColor: colorMap.section.primary,
                color: 'white',
                borderRadius: 1,
                fontSize: visualTheme.typography.content.fontSize,
                whiteSpace: 'nowrap',
                zIndex: 101,
                boxShadow: visualTheme.shadows.medium,
                animation: 'slideUpFade 1.5s ease-in-out',
                '@keyframes slideUpFade': {
                  '0%': { opacity: 0, transform: 'translateY(10px) scale(0.9)' },
                  '15%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                  '85%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                  '100%': { opacity: 0, transform: 'translateY(-5px) scale(0.95)' },
                }
              }}
            >
              Overlay Visible
            </Box>
          </Grow>
        )}

        {/* Enhanced scrollable content area with accessibility and error handling */}
        <Fade
          in={visible && !!content}
          timeout={{ enter: 400, exit: 200 }}
          style={{ transitionDelay: '100ms' }}
        >
          <Box
            ref={contentRef}
            role="main"
            aria-label="Command syntax information"
            tabIndex={keyboardFocused ? 0 : -1}
            onScroll={handleScroll}
            onWheel={(e) => {
              try {
                // Allow normal scrolling within the overlay
                const element = e.currentTarget;
                const { scrollTop, scrollHeight, clientHeight } = element;
                
                // Only prevent propagation and default at scroll boundaries to prevent browser window scrolling
                if (
                  (e.deltaY < 0 && scrollTop === 0) ||
                  (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)
                ) {
                  // At boundaries: prevent both propagation and default to stop browser scrolling
                  e.stopPropagation();
                  e.preventDefault();
                }
                // For normal scrolling within bounds: let the event proceed normally
                // This allows smooth scrolling within the overlay content
              } catch (error) {
                console.error('Error handling wheel event in overlay:', error);
              }
            }}
            data-testid="syntax-overlay-content"
            sx={{
              height: 'calc(100% - 48px)', // Subtract enhanced header height
              overflowY: content?.scrollable ? 'auto' : 'hidden',
              padding: `${visualTheme.spacing.sm}px ${visualTheme.spacing.md}px`,
              pointerEvents: 'auto', // Allow scrolling
              transition: `all ${visualTheme.transitions.medium}`,
              // CRITICAL: Add scroll containment properties
              overscrollBehavior: 'contain',
              overscrollBehaviorY: 'contain',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                transition: `background-color ${visualTheme.transitions.fast}`,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                }
              },
              // Enhanced scrollbar for Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.04)',
              // Enhanced focus styles for keyboard navigation
              '&:focus': {
                outline: '2px solid #1976d2',
                outlineOffset: '-2px'
              }
            }}
          >
            {renderedContent}
          </Box>
        </Fade>
      </Box>
    </Fade>
  );
});

// Set display name for debugging
SyntaxOverlay.displayName = 'SyntaxOverlay';

export default SyntaxOverlay;