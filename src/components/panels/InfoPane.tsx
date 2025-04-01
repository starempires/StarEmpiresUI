import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function InfoPane({infoText}: {infoText: string}) {
  return (
    <Box
      sx={{
        ml: 5,
        backgroundColor: "#f5f5f5",
        padding: 1,
        height: "100%",
        width: "100%",
        overflow: "auto",
        border: "1px solid #ccc",
        color: "black"
      }}
    >
          <Typography variant="h6" gutterBottom>
            Sector Details
          </Typography>
      <pre style={{ whiteSpace: "pre-wrap" }}>
          {infoText ? infoText : "Click on a sector to view details."}
      </pre>
    </Box>
  );
}