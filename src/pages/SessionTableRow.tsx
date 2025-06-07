import React, { useState } from 'react';
import { TableRow, TableCell, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { generateClient } from 'aws-amplify/data';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import { Link } from 'react-router-dom';
import type { Schema } from '../../amplify/data/resource';
import type { Empire, SessionEmpires } from '../components/common/Interfaces';
import { updateTurn } from '../components/common/SessionAPI';

const sessionStatuses = [
  'ABANDONED',
  'ARCHIVED',
  'CREATED',
  'GAME_OVER',
  'IN_PROGRESS',
  'REPLACEMENT_NEEDED',
  'TEMPORARILY_CLOSED',
  'UPDATE_BEING_RUN',
  'WAITING_FOR_PLAYERS',
];

const client = generateClient<Schema>({ authMode: 'userPool' });

interface SessionControlCellProps {
  session: SessionEmpires;
}

export default function SessionControlCell({
  session,
}: SessionControlCellProps) {

   type SessionStatus = NonNullable<Schema["Session"]["type"]["status"]>;
   const [selectedStatus, setSelectedStatus] = useState<SessionStatus>(session.status as SessionStatus);
   const [turnNumber, setTurnNumber] = useState<number>(session.currentTurnNumber);
   const [processing, setProcessing] = useState<boolean>(false);

  async function handleStatusChange(sessionId: string, status: SessionStatus) {
//       console.log("Status Changed for session:", sessionId);
      setProcessing(true);

      try {
         await updateSessionStatus(sessionId, status);
//          console.log("Status successfully updated.");
         setSelectedStatus(status);
     } catch (error) {
//          console.error("Failed to update status:", error);
     } finally {
         setProcessing(false);
     }
 }

  async function updateSessionStatus(
    sessionId: string,
    newStatus: NonNullable<Schema["Session"]["type"]["status"]>
  ): Promise<any> {
    try {
       const updated = await client.models.Session.update({
         id: sessionId,
         status: newStatus,
       });

      console.log("Session updated:", updated.data);
      return updated.data;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  }

  async function updateSessionTurnNumber(sessionId: string, turnNumber: number): Promise<any> {
    try {
      const updated = await client.models.Session.update({
        id: sessionId,
        currentTurnNumber: turnNumber,
      });

//       console.log("Turn number updated:", updated.data);
      return updated.data;
    } catch (error) {
      console.error("Error updating session turn number:", error);
      throw error;
    }
  }
  async function handleUpdateTurn(sessionId: string) {
//       console.log("Update Turn clicked for session:", sessionId);
      setProcessing(true);

      try {
        // fetch current turn
        const result = await client.models.Session.get({ id: sessionId });
        const currentTurn = result.data?.currentTurnNumber || 0;
        // update turn info
        const apiData = await updateTurn(session.sessionName, currentTurn);
        const json = JSON.parse(apiData);
        console.log(JSON.stringify(json));
        // update turn number
        await updateSessionTurnNumber(sessionId, currentTurn + 1);
        setTurnNumber(currentTurn + 1);
//         console.log("Turn successfully updated to turn number " + (currentTurn + 1));
      } catch (error) {
        console.error("Failed to update turn:", error);
      } finally {
        setProcessing(false);
      }
    }

    async function handleRollbackTurn(sessionId: string) {
//       console.log("Rollback Turn clicked for session:", sessionId);
      setProcessing(true);

      try {
        const result = await client.models.Session.get({ id: sessionId });
        const currentTurn = result.data?.currentTurnNumber || 0;
        if (currentTurn > 0) {
            await updateSessionTurnNumber(sessionId, currentTurn - 1);
//             console.log("Turn successfully rolled back.");
            setTurnNumber(currentTurn - 1);
        }
      } catch (error) {
        console.error("Failed to update turn:", error);
      } finally {
        setProcessing(false);
      }
    }

    async function handleGenerateSnapshots(sessionId: string) {
      console.log("Generate Snapshots clicked for session:", sessionId);
      setProcessing(true);
      // Simulate async operation or add your snapshot logic here
      setTimeout(() => {
         setProcessing(false);
      }, 1000);
    }


    return (
      <>
       <Dialog open={processing}>
          <DialogTitle>
            Processing...
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
               <CircularProgress />
            </div>
          </DialogTitle>
       </Dialog>

       {session.empires.map((empire: Empire, index: number) => (
         <TableRow key={`${session.sessionName}-${index}`}>
           {index === 0 && (
             <React.Fragment>
                <TableCell rowSpan={session.empires.length}>
                   {session.sessionName}
                   {session.empires[0].empireType === 'GM' && (
                      <React.Fragment>
                        <br />
                        <br />
                        <FormControl size="small" style={{ minWidth: '200px', marginBottom: '8px' }}>
                           <InputLabel>Status</InputLabel>
                           <Select value={selectedStatus || ''}
                                   label="Status"
                                   onChange={(e) => handleStatusChange(session.sessionId, e.target.value as SessionStatus)}
                           >
                             {sessionStatuses.map((status) => (
                                <MenuItem key={status} value={status}>
                                   {status.toLowerCase()
                                          .split('_')
                                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                          .join(' ')}
                                </MenuItem>
                             ))}
                           </Select>
                         </FormControl>
                         <br />
                           <div style={{ marginTop: '8px', display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                             <button onClick={() => handleUpdateTurn(session.sessionId)} disabled={processing} style={{ backgroundColor: 'lightblue' }} >
                               Update Turn
                             </button>
                             <button onClick={() => handleGenerateSnapshots(session.sessionId)} disabled={processing} style={{ backgroundColor: 'lightblue' }} >
                               Generate Snapshots
                             </button>
                             <button onClick={() => handleRollbackTurn(session.sessionId)} disabled={processing} style={{ backgroundColor: 'orange' }} >
                               Rollback Turn
                             </button>
                         </div>
                      </React.Fragment>
                   )}
                </TableCell>
                <TableCell rowSpan={session.empires.length}>{turnNumber}</TableCell>
                <TableCell rowSpan={session.empires.length}>{session.deadline}</TableCell>
             </React.Fragment>
            )}
           <TableCell>
              <Link to={`/session/${session.sessionName}/${empire.name}/${session.currentTurnNumber}`} className="text-blue-500 hover:underline">
                 {empire.name}
              </Link>
           </TableCell>
           <TableCell>{empire.empireType}</TableCell>
           <TableCell>{empire.empireType === "ACTIVE" ? empire.orderStatus : ""}</TableCell>
         </TableRow>
       ))}
      </>
  );
}