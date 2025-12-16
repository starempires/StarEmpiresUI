import React, { useState, useMemo } from 'react';
import { TableRow, TableCell, Typography, Box, Alert } from '@mui/material';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import type { SessionEmpires } from '../components/common/Interfaces';
import { addEmpire } from '../components/common/SessionAPI';
import { registerEmpire, attemptAutoStart } from '../components/common/ClientFunctions';
import { useNavigate } from 'react-router-dom';
import ProcessingDialog from '../components/common/ProcessingDialog';
import AlphanumericTextField from '../components/common/AlphanumericTextField';
import { NAME_MAX_LENGTHS } from '../components/common/ValidationUtils';

export default function SessionWaitingTableRow({ playerName, session, onSessionUpdate }: { 
    playerName: string, 
    session: SessionEmpires,
    onSessionUpdate?: () => void 
}) {
    const [processing, setProcessing] = useState<boolean>(false);
    const [processingMessage, setProcessingMessage] = useState<string>('Joining Session ...');
    const [empireName, setEmpireName] = useState<string>('');
    const [homeworldName, setHomeworldName] = useState<string>('');
    const [starbaseName, setStarbaseName] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
     setProcessingMessage('Joining Session ...');
     setStatusMessage(null);
     
     try {
        // Step 1: Add empire via backend API
        const addResult = await addEmpire(session.sessionName, empireName, abbreviation, homeworldName, starbaseName, "ACTIVE");
        try {
            const parsedResult = JSON.parse(addResult);
            if (!parsedResult || parsedResult.data !== "OK") {
               const msg = parsedResult?.message || "(no message)";
               throw new Error("Error adding empire: " + msg);
            }
        } catch {
            throw new Error("addEmpire returned non-JSON response: " + addResult);
        }
        
        // Step 2: Register empire in database
        await registerEmpire(session.sessionName, playerName, empireName, "ACTIVE");
        
        // Step 3: Attempt auto-start after successful registration
        setProcessingMessage('Checking if session is ready to start ...');
        const autoStartResult = await attemptAutoStart(session.sessionName);
        
        if (autoStartResult.success) {
            setStatusMessage({
                type: 'success',
                text: `Session is now ready! Status changed to ${autoStartResult.newStatus}. Snapshots have been generated.`
            });
            
            // Refresh session list after successful auto-start
            if (onSessionUpdate) {
                onSessionUpdate();
            }
            
            // Navigate after a brief delay to show success message
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            // Auto-start didn't trigger (session not full yet) or failed
            // This is not necessarily an error - just means more players needed
            if (autoStartResult.error?.includes('not full')) {
                setStatusMessage({
                    type: 'success',
                    text: 'Successfully joined session! Waiting for more players to join.'
                });
            } else if (autoStartResult.error?.includes('not in WAITING_FOR_PLAYERS')) {
                // Session already transitioned, just navigate
                setStatusMessage({
                    type: 'success',
                    text: 'Successfully joined session!'
                });
            } else {
                // Actual error during auto-start
                setStatusMessage({
                    type: 'error',
                    text: `Joined session, but auto-start failed: ${autoStartResult.error}`
                });
            }
            
            // Refresh session list
            if (onSessionUpdate) {
                onSessionUpdate();
            }
            
            // Navigate after a brief delay
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
     } catch (err) {
        console.error('Failed to create session/empires', err);
        setStatusMessage({
            type: 'error',
            text: `Failed to join session: ${err instanceof Error ? err.message : String(err)}`
        });
     } finally {
        setProcessing(false);
     }
   };



    return (
     <React.Fragment>
         <ProcessingDialog open={processing} message={processingMessage} />
         <TableRow key={`${session.sessionName}`}>
           <TableCell>
            <Typography variant="subtitle1">
              <strong>{session.sessionName}</strong>
            </Typography>
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
                   <Typography variant="subtitle1" sx={{ mb: 1 }}>Enter your empire's information.</Typography>
                   
                   {statusMessage && (
                     <Alert severity={statusMessage.type} sx={{ mb: 2 }}>
                       {statusMessage.text}
                     </Alert>
                   )}
                   
                         <Paper variant="outlined" sx={{ p: 1 }}>
                           <Grid container spacing={1} alignItems="flex-start">
                             <Grid size={{xs:12, md:2}}>
                               <AlphanumericTextField
                                 fullWidth
                                 required
                                 label="Empire Name"
                                 value={empireName}
                                 onChange={setEmpireName}
                                 size="small"
                                 margin="dense"
                                 sx={{ maxWidth: 200 }}
                                 maxLength={NAME_MAX_LENGTHS.EMPIRE_NAME}
                               />
                               <Box sx={{ mt: 0 }}>
                                 <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                   Abbreviation: {abbreviation}
                                 </Typography>
                               </Box>
                             </Grid>
                             <Grid size={{xs:12, md:2}}>
                               <AlphanumericTextField
                                 fullWidth
                                 required
                                 label="Homeworld Name"
                                 value={homeworldName}
                                 onChange={setHomeworldName}
                                 size="small"
                                 margin="dense"
                                 sx={{ maxWidth: 200 }}
                                 maxLength={NAME_MAX_LENGTHS.HOMEWORLD_NAME}
                               />
                             </Grid>
                             <Grid size={{xs:12, md:2}}>
                               <AlphanumericTextField
                                 fullWidth
                                 required
                                 label="Starbase Name"
                                 value={starbaseName}
                                 onChange={setStarbaseName}
                                 size="small"
                                 margin="dense"
                                 sx={{ maxWidth: 200 }}
                                 maxLength={NAME_MAX_LENGTHS.STARBASE_NAME}
                               />
                             </Grid>
                           </Grid>
                         </Paper>
           </TableCell>
         </TableRow>
      </React.Fragment>
  );
}