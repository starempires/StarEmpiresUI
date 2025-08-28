import {useState, useEffect, useRef} from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { fetchSessionObject, loadOrdersStatus } from '../common/SessionAPI';

interface OrderSubmissionPaneProps {
  sessionName: string;
  empireName: string;
  turnNumber: number;
}

export default function OrderPane({ sessionName, empireName, turnNumber }: OrderSubmissionPaneProps) {

  const [ordersText, setOrdersText] = useState<string>('');
  const [submitTrigger, setSubmitTrigger] = useState<number>(0);
  const [lockedTrigger, setLockedTrigger] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locked, setLocked] = useState<boolean>(false);
  const lockedTriggerInitialized = useRef(false);

  // --- Wrapper-level event handlers to redirect scroll to the textarea and block page scroll ---
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperTouchStartY = useRef<number>(0);

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

      loadOrders();
      initializeStatus();
    }, [sessionName, empireName, turnNumber]);

    useEffect(() => {
        if (submitTrigger === 0) {
            return;
        }
        setIsSubmitting(true);

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
             setIsSubmitting(false);
           }
      };

      submitOrders();
    }, [submitTrigger]);

    useEffect(() => {
      if (!lockedTriggerInitialized.current) {
        return;
      }

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
  }, [lockedTrigger]);

  const handleSubmit = () => {
    setSubmitTrigger(prev => prev + 1);
  };

  const handleLocked = (value:boolean) => {
    setLockedTrigger(value);
  };

  return (
    <Box sx={{ ml: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography sx={{m1: 0}} variant="h6" gutterBottom>
        Enter Turn {turnNumber} Orders
      </Typography>

      {/* Resizable split between orders text and controls */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <PanelGroup direction="vertical" style={{ height: '100%' }}>
          {/* Top panel: Text field fills available space */}
          <Panel defaultSize={75} minSize={30}>
            <Box
              sx={{ height: '100%', overflow: 'hidden', ml: 0, overscrollBehavior: 'contain' }}
              onWheelCapture={handleWrapperWheel}
              onTouchStartCapture={handleWrapperTouchStart}
              onTouchMoveCapture={handleWrapperTouchMove}
            >
              <TextField
                fullWidth
                multiline
                variant="outlined"
                value={ordersText}
                onChange={(e) => setOrdersText(e.target.value)}
                placeholder={`Enter your turn ${turnNumber} orders here`}
                inputRef={textAreaRef}
                inputProps={{
                  onWheel: handleWheelOnTextarea,
                  onTouchStart: handleTouchStart,
                  onTouchMove: handleTouchMove,
                  style: { height: '100%', overflowY: 'auto' }
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
            </Box>
          </Panel>

          <PanelResizeHandle className="h-3 bg-blue-800 hover:bg-blue-600" style={{ cursor: 'row-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
              width: '30px',
              height: '4px',
              backgroundColor: 'white',
              borderRadius: '2px',
            }} />
          </PanelResizeHandle>

          {/* Bottom panel: Buttons/checkbox row */}
          <Panel defaultSize={25} minSize={10}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mt: 1, mr: 1 }}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: isSubmitting ? '#265100' : '#1976d2',
                  '&:hover': {
                    backgroundColor: isSubmitting ? '#265100' : '#115293'
                  },
                }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving Orders...' : 'Save Orders'}
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
          </Panel>
        </PanelGroup>
      </Box>
    </Box>
  );
}