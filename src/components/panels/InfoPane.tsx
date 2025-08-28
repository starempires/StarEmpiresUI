import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function InfoPane({infoText}: {infoText: string}) {
  return (
    <>
      <Typography sx={{ml:1}} variant="h6" gutterBottom>
        Sector Details
      </Typography>
      <Box
        sx={{
          ml: 1,
          backgroundColor: "#f5f5f5",
          padding: 1,
          height: "100%",
          width: "100%",
          overflow: "auto",
          border: "0px solid #ccc",
          color: "black"
        }}
      >
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {infoText ? infoText : "Click on a sector to view details."}
        </pre>
      </Box>
    </>
  );
}