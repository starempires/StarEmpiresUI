import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

interface OrderSubmissionPaneProps {
  entryText: string;
  onEntryChange: (newText: string) => void;
  onSubmit: () => void;
}

export default function OrderSubmissionPane({ entryText, onEntryChange, onSubmit }: OrderSubmissionPaneProps) {
  return (
    <Box sx={{  ml: 5, width: "100%", height: "100%"}}>
      <Typography variant="h6" gutterBottom>
        Enter Orders
      </Typography>
      <TextField
        fullWidth
        multiline={true}
        variant="outlined"
        value={entryText}
        minRows={8}
        maxRows={8}
        onChange={(e) => onEntryChange(e.target.value)}
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
        color="primary"
        sx={{ mt: 1 }}
        onClick={onSubmit}
      >
        Submit Orders
      </Button>
    </Box>
  );
}