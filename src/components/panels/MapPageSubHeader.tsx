import { Grid, Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface MapPageSubHeaderProps {
    empireName: string;
    sessionName: string;
    turnNumber: number;
}

export default function MapPageSubHeader({ empireName, sessionName, turnNumber }: MapPageSubHeaderProps) {
  return (
   <Grid container spacing={2}>
         <Grid item xs={12}>
           <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
             <Typography variant="h6" sx={{ color: "white" }}>
               {empireName} galactic map for session {sessionName}, turn {turnNumber}
             </Typography>
             <Box sx={{ display: 'flex', ml: 2 }}>
               <Button
                 variant="outlined"
                 size="small"
                 component={RouterLink}
                 to={`/messages/${sessionName}/${empireName}`}
                 disabled={true}
                 sx={{
                   mr: 1,
                   '&.Mui-disabled': {
                     color: '#aaaaaa',
                     borderColor: '#aaaaaa',
                   },
                 }}
               >
                 Messages
               </Button>
               <Button
                 variant="outlined"
                 size="small"
                 component={RouterLink}
                 disabled={turnNumber==0}
                 sx={{
                    mr: 1,
                    '&.Mui-disabled': {
                        color: '#aaaaaa',
                        borderColor: '#aaaaaa',
                    },
                 }}
                 to={`/news/${sessionName}/${empireName}/${turnNumber}`}
               >
                 News
               </Button>
             </Box>
           </Box>
         </Grid>
       </Grid>
  );
}