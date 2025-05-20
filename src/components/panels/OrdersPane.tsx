import {useState, useEffect, useRef} from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { fetchSessionObject } from '../common/SessionAPI';

interface OrderSubmissionPaneProps {
  sessionName: string;
  empireName: string;
  turnNumber: number;
}

export default function OrderPane({ sessionName, empireName, turnNumber }: OrderSubmissionPaneProps) {

  const [ordersText, setOrdersText] = useState<string>();
  const [submitTrigger, setSubmitTrigger] = useState<number>(0);
  const [lockedTrigger, setLockedTrigger] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locked, setLocked] = useState<boolean>(false);
  const lockedTriggerInitialized = useRef(false);

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

         async function loadOrderStatus() {
              try {
                 const apiData = await fetchSessionObject(
                       sessionName ?? "",
                       empireName ?? "",
                       Number(turnNumber),
                       "ORDERS_STATUS"
                 );
                 if (apiData) {
                     const processedText = apiData.replace(/(\r\n|\n|\r)/g, "\\n");
                     const json = JSON.parse(processedText);
                     if (json.data === "LOCKED") {
                         setLocked(true);
                         setLockedTrigger(true);
                     }
                 }
              } catch (error) {
                 console.error("Error loading orders:", error);
              }
              finally {
                 lockedTriggerInitialized.current = true
              }
            }

      loadOrders();
      loadOrderStatus();
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
    <Box sx={{ ml: 5, width: "100%", height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Enter Turn {turnNumber} Orders
      </Typography>
      <TextField
        fullWidth
        multiline={true}
        variant="outlined"
        value={ordersText}
        minRows={8}
        maxRows={8}
        onChange={(e) => setOrdersText(e.target.value)}
        sx={{
          backgroundColor: 'white',
          '& .MuiInputBase-input': {
            color: 'black'
          }
        }}
        placeholder={`Enter your turn ${turnNumber} orders here`}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mt: 1 }}>
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
          {isSubmitting ? "Saving Orders..." : "Save Orders"}
        </Button>
        <FormControlLabel
          control={
            <Checkbox
              checked={locked}
              color="success"
              onChange={(e) => handleLocked(e.target.checked)}
              sx={{
                ml: 2,
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
  );
}