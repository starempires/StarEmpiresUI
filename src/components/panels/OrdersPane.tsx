import {useState, useEffect} from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { fetchSessionObject } from '../common/SessionAPI';

interface OrderSubmissionPaneProps {
  sessionName: string;
  empireName: string;
  turnNumber: number;
}

export default function OrderPane({ sessionName, empireName, turnNumber }: OrderSubmissionPaneProps) {

  const [ordersText, setOrdersText] = useState<string>();
  const [submitTrigger, setSubmitTrigger] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

      loadOrders();
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

  const handleSubmit = () => {
    setSubmitTrigger(prev => prev + 1);
  };

  return (
    <Box sx={{  ml: 5, width: "100%", height: "100%"}}>
      <Typography variant="h6" gutterBottom>
        Enter Orders
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
        placeholder="Enter your orders here"
      />
      <Button
        variant="contained"
        sx={{ mt: 1,
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
    </Box>
  );
}