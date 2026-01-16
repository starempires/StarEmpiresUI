import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { fetchSessionObject, loadOrdersStatus } from '../common/SessionAPI';
import ProcessingDialog from '../common/ProcessingDialog';
import SyntaxOverlay from '../common/SyntaxOverlay';
import { OverlayContextAnalyzer, OverlayContext } from '../../services/OverlayContextAnalyzer';
import { OverlayContentGenerator, OverlayContent } from '../../services/OverlayContentGenerator';
import { grammarService } from '../../services/GrammarService';

interface OrderSubmissionPaneProps {
  sessionName: string;
  empireName: string;
  turnNumber: number;
}

export default function OrderPane({ sessionName, empireName, turnNumber }: OrderSubmissionPaneProps) {

  const [ordersText, setOrdersText] = useState<string>('');
  const [submitTrigger, setSubmitTrigger] = useState<number>(0);
  const [lockedTrigger, setLockedTrigger] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>("");
  const [locked, setLocked] = useState<boolean>(false);
  const lockedTriggerInitialized = useRef(false);

  // Overlay state management with session persistence
  const [overlayVisible, setOverlayVisible] = useState<boolean>(() => {
    // Load visibility preference from session storage, default to true
    const stored = sessionStorage.getItem('syntaxOverlay_visible');
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [overlayContent, setOverlayContent] = useState<OverlayContent | null>(null);
  // Overlay context state for tracking current analysis context
  // const [overlayContext, setOverlayContext] = useState<OverlayContext | null>(null);
  const [overlayScrollPosition, setOverlayScrollPosition] = useState<number>(() => {
    // Load scroll position from session storage, default to 0
    const stored = sessionStorage.getItem('syntaxOverlay_scrollPosition');
    return stored !== null ? JSON.parse(stored) : 0;
  });
  const [previousContent, setPreviousContent] = useState<OverlayContent | null>(null);
  const [showToggleFeedback, setShowToggleFeedback] = useState<boolean>(false);

  // Performance optimization refs and constants
  const debounceTimeoutRef = useRef<number | null>(null);
  // const performanceTimerRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const contentCacheRef = useRef<Map<string, OverlayContent>>(new Map());
  
  // Adaptive debouncing based on performance
  const [currentDebounceDelay, setCurrentDebounceDelay] = useState<number>(50); // Start with 50ms
  const MIN_DEBOUNCE_DELAY = 50;
  const MAX_DEBOUNCE_DELAY = 200;
  const TARGET_UPDATE_TIME = 100; // Target 100ms update time as per requirements

  // Initialize overlay services with performance optimizations
  const overlayServices = useMemo(() => {
    const contextAnalyzer = new OverlayContextAnalyzer(grammarService);
    const contentGenerator = new OverlayContentGenerator(grammarService);
    
    return {
      contextAnalyzer,
      contentGenerator
    };
  }, []);

  // Performance monitoring function
  const measureUpdatePerformance = useCallback((startTime: number, operation: string) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Track performance metrics
    updateCountRef.current += 1;
    lastUpdateTimeRef.current = duration;
    
    // Log performance warnings if updates are too slow
    if (duration > TARGET_UPDATE_TIME) {
      console.warn(`Overlay ${operation} took ${duration.toFixed(2)}ms (target: ${TARGET_UPDATE_TIME}ms)`);
      
      // Increase debounce delay if updates are consistently slow
      if (duration > TARGET_UPDATE_TIME * 1.5) {
        setCurrentDebounceDelay(prev => Math.min(prev + 10, MAX_DEBOUNCE_DELAY));
      }
    } else if (duration < TARGET_UPDATE_TIME * 0.5) {
      // Decrease debounce delay if updates are fast
      setCurrentDebounceDelay(prev => Math.max(prev - 5, MIN_DEBOUNCE_DELAY));
    }
    
    // Log performance stats every 50 updates
    if (updateCountRef.current % 50 === 0) {
      console.log(`Overlay performance: ${updateCountRef.current} updates, last: ${duration.toFixed(2)}ms, debounce: ${currentDebounceDelay}ms`);
    }
  }, [currentDebounceDelay]);

  // Generate cache key for content caching
  const generateCacheKey = useCallback((context: OverlayContext): string => {
    switch (context.type) {
      case 'partial-commands':
        return `${context.type}-${context.partialCommand || 'none'}-${context.matchingCommands?.join(',') || 'none'}`;
      case 'specific-command':
        return `${context.type}-${context.commandName || 'none'}-${context.lineContent.trim()}`;
      default:
        return `${context.type}-${context.commandName || 'all'}-${context.lineContent.trim()}`;
    }
  }, []);

  // Optimized content generation with caching
  const generateOptimizedContent = useCallback((context: OverlayContext): OverlayContent | null => {
    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = generateCacheKey(context);
    const cachedContent = contentCacheRef.current.get(cacheKey);
    
    if (cachedContent) {
      measureUpdatePerformance(startTime, 'cache-hit');
      return cachedContent;
    }
    
    // Generate new content
    let content: OverlayContent | null = null;
    
    try {
      switch (context.type) {
        case 'all-commands':
          content = overlayServices.contentGenerator.generateAllCommandsContent();
          break;
        case 'specific-command':
          if (context.commandName) {
            content = overlayServices.contentGenerator.generateCommandContent(context.commandName);
          }
          break;
        case 'partial-commands':
          if (context.partialCommand && context.matchingCommands) {
            content = overlayServices.contentGenerator.generatePartialCommandsContent(
              context.partialCommand, 
              context.matchingCommands
            );
          }
          break;
        case 'hidden':
          content = null;
          break;
      }
      
      // Cache the generated content
      if (content) {
        // Limit cache size to prevent memory issues
        if (contentCacheRef.current.size > 50) {
          // Remove oldest entries (simple LRU-like behavior)
          const firstKey = contentCacheRef.current.keys().next().value;
          if (firstKey !== undefined) {
            contentCacheRef.current.delete(firstKey);
          }
        }
        contentCacheRef.current.set(cacheKey, content);
      }
      
      measureUpdatePerformance(startTime, 'content-generation');
      return content;
      
    } catch (error) {
      console.error('Error generating overlay content:', error);
      const errorContent = overlayServices.contentGenerator.generateErrorContent(
        error instanceof Error ? error.message : 'Unknown error'
      );
      measureUpdatePerformance(startTime, 'error-generation');
      return errorContent;
    }
  }, [overlayServices, generateCacheKey, measureUpdatePerformance]);

  // --- Wrapper-level event handlers to redirect scroll to the textarea and block page scroll ---
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperTouchStartY = useRef<number>(0);

  // Optimized overlay content update with performance monitoring
  const updateOverlayContent = useCallback((
    text: string, 
    cursorPosition: number
  ) => {
    if (!overlayVisible) return;
    
    const startTime = performance.now();
    
    try {
      // Context analysis with performance tracking
      const context = overlayServices.contextAnalyzer.analyzeContext(text, cursorPosition);
      // setOverlayContext(context);
      
      // Generate content with caching and optimization
      const content = generateOptimizedContent(context);
      setOverlayContent(content);
      
      measureUpdatePerformance(startTime, 'full-update');
      
    } catch (error) {
      console.error('Error updating overlay content:', error);
      // Generate error content as fallback
      const errorContent = overlayServices.contentGenerator.generateErrorContent(
        error instanceof Error ? error.message : 'Unknown error'
      );
      setOverlayContent(errorContent);
      measureUpdatePerformance(startTime, 'error-update');
    }
  }, [overlayVisible, overlayServices, generateOptimizedContent, measureUpdatePerformance]);

  // Calculate overlay position within the text area
  const calculateOverlayPosition = useCallback(() => {
    if (!textAreaRef.current) {
      return { top: 0, left: 0, width: 0, height: 0 };
    }
    
    const textArea = textAreaRef.current;
    const textAreaRect = textArea.getBoundingClientRect();
    const parentRect = textArea.parentElement?.getBoundingClientRect();
    
    if (!parentRect) {
      return { top: 0, left: 0, width: 0, height: 0 };
    }
    
    // Position overlay in the right portion of the text area
    const overlayWidth = Math.min(300, textAreaRect.width * 0.4);
    const overlayHeight = textAreaRect.height - 20; // Leave margin
    
    // Calculate position relative to the parent container
    const top = textAreaRect.top - parentRect.top + 10;
    const left = textAreaRect.width - overlayWidth - 10;
    
    return {
      top,
      left,
      width: overlayWidth,
      height: Math.max(overlayHeight, 200) // Minimum height
    };
  }, []);

  // Toggle overlay visibility with session persistence and visual feedback
  const toggleOverlayVisibility = useCallback(() => {
    setOverlayVisible(prev => {
      const newVisible = !prev;
      
      // Save visibility preference to session storage
      sessionStorage.setItem('syntaxOverlay_visible', JSON.stringify(newVisible));
      
      // Show visual feedback for toggle action
      setShowToggleFeedback(true);
      window.setTimeout(() => setShowToggleFeedback(false), 1000); // Hide feedback after 1 second
      
      if (newVisible) {
        // If showing overlay, restore previous content and scroll position
        if (previousContent) {
          setOverlayContent(previousContent);
          // Restore scroll position after content is rendered
          window.setTimeout(() => {
            const overlayElement = document.querySelector('[data-testid="syntax-overlay-content"]') as HTMLElement;
            if (overlayElement) {
              overlayElement.scrollTop = overlayScrollPosition;
            }
          }, 0);
        } else if (textAreaRef.current) {
          // Generate new content if no previous content exists
          const cursorPosition = textAreaRef.current.selectionStart || 0;
          updateOverlayContent(ordersText, cursorPosition);
        }
      } else {
        // If hiding overlay, save current content and scroll position
        if (overlayContent) {
          setPreviousContent(overlayContent);
        }
        // Save current scroll position to session storage
        sessionStorage.setItem('syntaxOverlay_scrollPosition', JSON.stringify(overlayScrollPosition));
      }
      
      return newVisible;
    });
  }, [ordersText, updateOverlayContent, overlayContent, overlayScrollPosition, previousContent]);

  // Handle overlay content scroll with session persistence and state update debouncing
  const handleOverlayScroll = useCallback((scrollTop: number) => {
    // Save to session storage immediately for persistence
    sessionStorage.setItem('syntaxOverlay_scrollPosition', JSON.stringify(scrollTop));
    
    // Debounce state updates to prevent excessive re-renders during scrolling
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = window.setTimeout(() => {
      setOverlayScrollPosition(scrollTop);
    }, 50); // Only update React state after scrolling stops
  }, []);

  // Handle keyboard shortcuts from overlay
  const handleOverlayKeyboardShortcut = useCallback((shortcut: string) => {
    try {
      switch (shortcut) {
        case 'F1':
          console.log('Overlay toggled via F1 shortcut');
          break;
        case 'F2':
          console.log('Overlay focused via F2 shortcut');
          break;
        case 'Escape':
          console.log('Overlay focus removed via Escape shortcut');
          break;
        default:
          console.log(`Unknown keyboard shortcut: ${shortcut}`);
      }
    } catch (error) {
      console.error('Error handling overlay keyboard shortcut:', error);
    }
  }, []);

  // Enhanced text change handler with adaptive debouncing
  const handleTextChange = useCallback((newText: string) => {
    setOrdersText(newText);

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }

    // Use adaptive debounce delay based on performance
    debounceTimeoutRef.current = window.setTimeout(() => {
      const textarea = textAreaRef.current;
      if (!textarea) return;

      const currentCursor = textarea.selectionStart || 0;
      
      // Update overlay content with performance monitoring
      updateOverlayContent(newText, currentCursor);
    }, currentDebounceDelay);
  }, [updateOverlayContent, currentDebounceDelay]);

  // Enhanced cursor change handler - immediate updates for better responsiveness
  // const handleCursorChange = useCallback((event: React.SyntheticEvent<HTMLTextAreaElement>) => {
  //   const textarea = event.currentTarget;
  //   const newCursorPosition = textarea.selectionStart || 0;

  //   // Update overlay content immediately for cursor position changes
  //   updateOverlayContent(ordersText, newCursorPosition);
  // }, [ordersText, updateOverlayContent]);

  // Specific event handlers for different event types
  const handleSelect = useCallback((event: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    const newCursorPosition = textarea.selectionStart || 0;
    updateOverlayContent(ordersText, newCursorPosition);
  }, [ordersText, updateOverlayContent]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    const newCursorPosition = textarea.selectionStart || 0;
    updateOverlayContent(ordersText, newCursorPosition);
  }, [ordersText, updateOverlayContent]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    const newCursorPosition = textarea.selectionStart || 0;
    updateOverlayContent(ordersText, newCursorPosition);
  }, [ordersText, updateOverlayContent]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    const newCursorPosition = textarea.selectionStart || 0;
    updateOverlayContent(ordersText, newCursorPosition);
  }, [ordersText, updateOverlayContent]);

  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    const newCursorPosition = textarea.selectionStart || 0;
    updateOverlayContent(ordersText, newCursorPosition);
  }, [ordersText, updateOverlayContent]);

  // Initialize overlay content on component mount and restore state
  useEffect(() => {
    if (overlayVisible && ordersText && textAreaRef.current) {
      const cursorPosition = textAreaRef.current.selectionStart || 0;
      updateOverlayContent(ordersText, cursorPosition);
    }
    
    // Restore scroll position from session storage if overlay is visible
    if (overlayVisible && overlayScrollPosition > 0) {
      window.setTimeout(() => {
        const overlayElement = document.querySelector('[data-testid="syntax-overlay-content"]') as HTMLElement;
        if (overlayElement) {
          overlayElement.scrollTop = overlayScrollPosition;
        }
      }, 100); // Small delay to ensure content is rendered
    }
  }, [overlayVisible, ordersText, updateOverlayContent, overlayScrollPosition]);

  // Additional effect to ensure overlay updates immediately when text changes (not debounced)
  useEffect(() => {
    if (overlayVisible && textAreaRef.current) {
      const cursorPosition = textAreaRef.current.selectionStart || 0;
      updateOverlayContent(ordersText, cursorPosition);
    }
  }, [ordersText, overlayVisible, updateOverlayContent]);

  // Clean up performance monitoring and cache on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      
      // Clear content cache to prevent memory leaks
      contentCacheRef.current.clear();
      
      // Log final performance stats
      if (updateCountRef.current > 0) {
        console.log(`Overlay session stats: ${updateCountRef.current} updates, final debounce: ${currentDebounceDelay}ms`);
      }
    };
  }, [currentDebounceDelay]);

  const handleWrapperWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    const el = textAreaRef.current;
    if (!el) return;
    const delta = e.deltaY;
    const canScrollUp = el.scrollTop > 0;
    const canScrollDown = Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;
    // If the textarea can scroll in this direction, scroll it manually and stop the event.
    if ((delta < 0 && canScrollUp) || (delta > 0 && canScrollDown)) {
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += delta;
      return;
    }
    // Otherwise (at edge), still block the page from scrolling.
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWrapperTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches && e.touches.length > 0) {
      wrapperTouchStartY.current = e.touches[0].clientY;
    }
  };

  const handleWrapperTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const el = textAreaRef.current;
    if (!el) return;
    const currentY = e.touches[0].clientY;
    const deltaY = wrapperTouchStartY.current - currentY;
    const canScrollUp = el.scrollTop > 0;
    const canScrollDown = Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight;
    if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) {
      // Consume and apply the scroll to the textarea
      e.preventDefault();
      e.stopPropagation();
      el.scrollTop += deltaY;
      return;
    }
    // At edge: block page scroll/rubber-banding.
    e.preventDefault();
    e.stopPropagation();
  };

  // --- iOS/Safari scroll containment support ---
  const isWebKitSafari =
    typeof navigator !== 'undefined' &&
    /AppleWebKit/.test(navigator.userAgent) &&
    /Safari/.test(navigator.userAgent) &&
    !/Chrome|CriOS/.test(navigator.userAgent);
  const touchStartY = useRef<number>(0);
  const handleTouchStart: React.TouchEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };
  const handleTouchMove: React.TouchEventHandler<HTMLTextAreaElement> = (e) => {
    const el = e.currentTarget;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartY.current - currentY;
    const atTop = el.scrollTop <= 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    // If the textarea can scroll in the gesture direction, consume the gesture.
    if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
      e.stopPropagation();
      if (isWebKitSafari) e.preventDefault(); // prevent rubber-band scrolling to the page
      return;
    }
    // Otherwise, we're at a boundary: block page scroll/rubber-banding.
    e.stopPropagation();
    if (isWebKitSafari) e.preventDefault();
  };

  // Prevent the page from scrolling when the textarea can scroll
  const handleWheelOnTextarea: React.WheelEventHandler<HTMLTextAreaElement> = (e) => {
    const el = e.currentTarget;
    const delta = e.deltaY;
    const atTop = el.scrollTop <= 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    // If the textarea itself can scroll in the wheel direction, handle it here and stop bubbling.
    if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) {
      e.stopPropagation();
      return;
    }
    // If we're at a boundary, prevent page scroll.
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
     async function loadOrders() {
          try {
             const apiData = await fetchSessionObject(
                   sessionName ?? "",
                   empireName ?? "",
                   Number(turnNumber),
                   "ORDERS"
             );
             if (apiData) {
                 const processedText = apiData.replace(/(\r\n|\n|\r)/g, "\\n");
                 const json = JSON.parse(processedText);
                 setOrdersText(json.data);
             }
             else {
                 setOrdersText(`No turn ${turnNumber} orders found for empire ${empireName}, session ${sessionName}`);
             }
          } catch (error) {
             console.error("Error loading orders:", error);
          }
        }

        async function initializeStatus() {
           const orderStatus = await loadOrdersStatus(sessionName, empireName, turnNumber);
           if (orderStatus === 'LOCKED') {
             setLocked(true);
             setLockedTrigger(true);
           }
           lockedTriggerInitialized.current = true;
         }

      setProcessing(true);
      setProcessingMessage("Loading ...");
      loadOrders();
      initializeStatus();
      setProcessing(false);
    }, [sessionName, empireName, turnNumber]);

    useEffect(() => {
        if (submitTrigger === 0) {
            return;
        }
        setProcessing(true);
        setProcessingMessage("Submitting Orders ...");

        const submitOrders = async () => {
          try {
            const response = await fetch("https://api.starempires.com/submitOrders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer REAL_JWT_TOKEN",
              },
              body: JSON.stringify({
                 sessionName: sessionName,
                 empireName: empireName,
                 turnNumber: turnNumber,
                 ordersText: ordersText
               })
             });
             if (response.ok) {
                 const text = await response.text();
                 const processedText = text.replace(/(\r\n|\n|\r)/g, "\\n");
                 const json = JSON.parse(processedText);
                 setOrdersText(json.data || "");
             }
           } catch (error) {
              console.error("Error submitting orders:", error);
           } finally {
             setProcessing(false);
           }
      };

      submitOrders();
    }, [submitTrigger]);

    useEffect(() => {
      if (!lockedTriggerInitialized.current) {
        return;
      }
  console.log("locking orders")
      setProcessing(true);
      setProcessingMessage("Locking Orders ...");

      const setOrdersLockStatus = async () => {
        try {
          const response = await fetch("https://api.starempires.com/setOrdersLockStatus", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer REAL_JWT_TOKEN",
            },
            body: JSON.stringify({
               sessionName: sessionName,
               empireName: empireName,
               turnNumber: turnNumber,
               locked: lockedTrigger
             })
           });
           if (response.ok) {
               setLocked(lockedTrigger);
           }
         } catch (error) {
            console.error("Error setting orders lock status:", error);
         }
    };

    setOrdersLockStatus();
    setProcessing(false);
  }, [lockedTrigger]);

  const handleSubmit = () => {
    setSubmitTrigger(prev => prev + 1);
  };

  const handleLocked = (value:boolean) => {
    setLockedTrigger(value);
  };

  return (

   <React.Fragment>
    <ProcessingDialog open={processing} message={processingMessage} />
    <Box sx={{ ml: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{m1: 0}} variant="h6" gutterBottom>
        Enter Turn {turnNumber} Orders
      </Typography>

      {/* Resizable split between orders text and controls */}
      <Box
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        onWheelCapture={handleWrapperWheel}
        onTouchStartCapture={handleWrapperTouchStart}
        onTouchMoveCapture={handleWrapperTouchMove}
      >
        {/* Top area: Text field fills available space */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <TextField
            id="orders-text-field"
            fullWidth
            multiline
            variant="outlined"
            value={ordersText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Enter your turn ${turnNumber} orders here. Press F1 to toggle syntax help, F2 to focus help overlay.`}
            inputRef={textAreaRef}
            inputProps={{
              onSelect: handleSelect,
              onKeyUp: handleKeyUp,
              onKeyDown: handleKeyDown,
              onClick: handleClick,
              onFocus: handleFocus,
              onWheel: handleWheelOnTextarea,
              onTouchStart: handleTouchStart,
              onTouchMove: handleTouchMove,
              style: { height: '100%', overflowY: 'auto' },
              'aria-describedby': 'syntax-overlay-help',
            }}
            sx={{
              height: '100%',
              backgroundColor: 'white',
              '& .MuiInputBase-root': {
                height: '100%',
                alignItems: 'stretch',
                overflow: 'hidden',
              },
              '& .MuiOutlinedInput-root': {
                height: '100%',
                alignItems: 'stretch',
              },
              '& .MuiInputBase-input': {
                color: 'black',
                overflowY: 'auto',
              },
              '& .MuiOutlinedInput-input': {
                overflowY: 'auto',
              },
              '& .MuiInputBase-inputMultiline': {
                height: '100% !important',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                resize: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'manipulation',
              },
              '& .MuiOutlinedInput-inputMultiline': {
                height: '100% !important',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                resize: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'manipulation',
              },
              '& textarea': {
                height: '100% !important',
                boxSizing: 'border-box',
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                resize: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'manipulation',
              },
            }}
          />
          
          {/* Syntax Overlay with enhanced accessibility and keyboard support */}
          <SyntaxOverlay
            visible={overlayVisible}
            content={overlayContent}
            position={calculateOverlayPosition()}
            onToggleVisibility={toggleOverlayVisibility}
            onContentScroll={handleOverlayScroll}
            showToggleFeedback={showToggleFeedback}
            scrollPosition={overlayScrollPosition}
            onKeyboardShortcut={handleOverlayKeyboardShortcut}
            ariaLabel="Command syntax help overlay"
            ariaDescribedBy="orders-text-field"
          />
        </Box>

        {/* Bottom area: Buttons and checkbox */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mt: 1, mr: 1 }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: processing ? '#265100' : '#1976d2',
              '&:hover': {
                backgroundColor: processing ? '#265100' : '#115293',
              },
            }}
            onClick={handleSubmit}
            disabled={processing}
          >
            Save Orders
          </Button>
          <FormControlLabel
            control={
              <Checkbox
                checked={locked}
                color="success"
                onChange={(e) => handleLocked(e.target.checked)}
                sx={{
                  ml: 1,
                  color: 'white',
                  '&.Mui-checked': {
                    color: 'success',
                  },
                }}
              />
            }
            label="Lock Orders"
          />
        </Box>
      </Box>
    </Box>
    </React.Fragment>
  );
}