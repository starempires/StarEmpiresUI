import React, { useState, useMemo } from 'react';
import { TableRow, TableCell, TextField, Typography, Box } from '@mui/material';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import type { SessionEmpires } from '../components/common/Interfaces';
import { addEmpire } from '../components/common/SessionAPI';
import { registerEmpire } from '../components/common/ClientFunctions';
import { useNavigate } from 'react-router-dom';

export default function SessionWaitingTableRow({ playerName, session }: { playerName: string, session: SessionEmpires }) {
    const [processing, setProcessing] = useState<boolean>(false);
    const [empireName, setEmpireName] = useState<string>('');
    const [homeworldName, setHomeworldName] = useState<string>('');
    const [starbaseName, setStarbaseName] = useState<string>('');

    const navigate = useNavigate();

    const abbreviation = useMemo(() => {
      const cleaned = empireName.trim().replace(/^\s*the[\s_-]*/i, '');
      const letters = cleaned.replace(/[^A-Za-z]/g, '').toUpperCase();
      return letters.slice(0, 2);
    }, [empireName]);

  const canSubmit = useMemo(() => {
      return empireName.trim() && homeworldName.trim() && starbaseName.trim();
  }, [empireName, homeworldName, starbaseName]); // , rows]);

  const handleJoinSession = async () => {
     setProcessing(true);
     try {
        const addResult = await addEmpire(session.sessionName, empireName, abbreviation, homeworldName, starbaseName );
//         console.log("Addresult = " + JSON.stringify(addResult));
        try {
            const parsedResult = JSON.parse(addResult);
            if (!parsedResult || parsedResult.data !== "OK") {
               const msg = parsedResult?.message || "(no message)";
               throw new Error("Error adding empire: " + msg);
            }
        } catch {
            throw new Error("addEmpire returned non-JSON response: " + addResult);
        }
        await registerEmpire(session.sessionName, playerName, empireName)
        navigate('/');
     } catch (err) {
        console.error('Failed to create session/empires', err);
     } finally {
        setProcessing(false);
     }
   };

    const handleItemChange = (field: 'empireName' | 'homeworldName' | 'starbaseName', value: string) => {
        const sanitized = value.replace(/\s+/g, '_').trim();
        switch (field) {
          case 'empireName':
            setEmpireName(sanitized);
            break;
          case 'homeworldName':
            setHomeworldName(sanitized);
            break;
          case 'starbaseName':
            setStarbaseName(sanitized);
            break;
        }
    };

    return (
     <React.Fragment>
         <TableRow key={`${session.sessionName}`}>
           <TableCell>
            <strong>{session.sessionName}</strong> ({session.numPlayers} players)
            <Box sx={{ mt: 1 }}>
              <button
                onClick={() => handleJoinSession()}
                disabled={processing || !canSubmit}
                style={{ backgroundColor: 'lightgreen' }}
              >
                Join Session
              </button>
            </Box>
           </TableCell>
           <TableCell colSpan={5}>
                   <Typography variant="subtitle1" sx={{ mb: 1 }}>Enter your empire's information</Typography>
                         <Paper variant="outlined" sx={{ p: 1 }}>
                           <Grid container spacing={1} alignItems="flex-start">
                             <Grid size={{xs:12, md:2}}>
                               <TextField
                                 fullWidth
                                 required
                                 label="Empire Name"
                                 value={empireName}
                                 onChange={(e) => handleItemChange('empireName', e.target.value)}
                                 size="small"
                                 margin="dense"
                                 sx={{ maxWidth: 200 }}
                               />
                               <Box sx={{ mt: 0 }}>
                                 <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                   Abbreviation: {abbreviation}
                                 </Typography>
                               </Box>
                             </Grid>
                             <Grid size={{xs:12, md:2}}>
                               <TextField
                                 fullWidth
                                 required
                                 label="Homeworld Name"
                                 value={homeworldName}
                                 onChange={(e) => handleItemChange('homeworldName', e.target.value)}
                                 size="small"
                                 margin="dense"
                                 sx={{ maxWidth: 200 }}
                               />
                             </Grid>
                             <Grid size={{xs:12, md:2}}>
                               <TextField
                                 fullWidth
                                 required
                                 label="Starbase Name"
                                 value={starbaseName}
                                 onChange={(e) => handleItemChange('starbaseName', e.target.value)}
                                 size="small"
                                 margin="dense"
                                 sx={{ maxWidth: 200 }}
                               />
                             </Grid>
                           </Grid>
                         </Paper>
           </TableCell>
         </TableRow>
      </React.Fragment>
  );
}