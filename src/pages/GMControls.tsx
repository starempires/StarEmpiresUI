import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import type { Schema } from '../../amplify/data/resource';
import type { SessionEmpires } from '../components/common/Interfaces';
import { updateTurn, generateSnapshots } from '../components/common/SessionAPI';

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

export default function GMControls({
  session,
  onTurnNumberChange,
}: {
  session: SessionEmpires;
  onTurnNumberChange: (n: number) => void;
}) {
    type SessionStatus = NonNullable<Schema["Session"]["type"]["status"]>;
    const [selectedStatus, setSelectedStatus] = useState<SessionStatus>(session.status as SessionStatus);
    const [processing, setProcessing] = useState<boolean>(false);

    async function updateSessionStatus(
        sessionId: string,
        newStatus: NonNullable<Schema["Session"]["type"]["status"]>
      ): Promise<any> {
        try {
           const updated = await client.models.Session.update({
             id: sessionId,
             status: newStatus,
           });

    //       console.log("Session updated:", updated.data);
          return updated.data;
        } catch (error) {
          console.error("Error updating session:", error);
          throw error;
        }
    }

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
         onTurnNumberChange(currentTurn + 1);
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
             onTurnNumberChange(currentTurn - 1);
         }
       } catch (error) {
         console.error("Failed to update turn:", error);
       } finally {
         setProcessing(false);
       }
     }

     async function handleGenerateSnapshots(sessionId: string) {
       console.log("Generate Snapshots for session:", sessionId);
       setProcessing(true);

       try {
         // fetch current turn
         const result = await client.models.Session.get({ id: sessionId });
         const currentTurn = result.data?.currentTurnNumber || 0;
         // update turn info
         const apiData = await generateSnapshots(session.sessionName, currentTurn);
         const json = JSON.parse(apiData);
         console.log(JSON.stringify(json));
       } catch (error) {
         console.error("Failed to generate snapshots:", error);
       } finally {
         setProcessing(false);
       }
     }

     async function handleStartSession(sessionId: string) {
       console.log("Starting session:", sessionId);
       setProcessing(true);
       try {
//          const apiData = await generateSnapshots(session.sessionName, currentTurn);
//          const json = JSON.parse(apiData);
//          console.log(JSON.stringify(json));
       } catch (error) {
         console.error("Failed to generate snapshots:", error);
       } finally {
         setProcessing(false);
       }
     }

    const numMissingPlayers = session.numPlayers - session.empires.length + 1;

    return (
      <React.Fragment>
             <Dialog open={processing}>
                <DialogTitle>
                  Processing...
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                     <CircularProgress />
                  </div>
                </DialogTitle>
             </Dialog>
         <br />
         <div
            style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
         >
            <label htmlFor={`status-${session.sessionId}`} style={{ fontSize: 12 }}>Status</label>
            <select
               id={`status-${session.sessionId}`}
               value={selectedStatus || ''}
               onChange={(e) => handleStatusChange(session.sessionId, e.target.value as SessionStatus)}
               onMouseDown={(e) => e.stopPropagation()}
               style={{ minWidth: 200, padding: '2px 2px', borderRadius: 4 }}
            >
               {sessionStatuses.map((status) => (
                  <option key={status} value={status}>
                      {status.toLowerCase()
                             .split('_')
                             .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                             .join(' ')}
                  </option>
               ))}
            </select>
         </div>
         <br />
         <div style={{ marginTop: '8px', display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            {session.status === 'WAITING_FOR_PLAYERS' ? (
              <React.Fragment>
                 <button onClick={() => handleStartSession(session.sessionId)} disabled={processing || numMissingPlayers > 0} style={{ backgroundColor: 'lightgreen' }} >
                    Start Session
                 </button>
              </React.Fragment>
            ) :
            (
              <React.Fragment>
                <button onClick={() => handleUpdateTurn(session.sessionId)} disabled={processing} style={{ backgroundColor: 'lightblue' }} >
                   Update Turn
                </button>
                <button onClick={() => handleGenerateSnapshots(session.sessionId)} disabled={processing} style={{ backgroundColor: 'lightblue' }} >
                   Generate Snapshots
                </button>
                <button onClick={() => handleRollbackTurn(session.sessionId)} disabled={processing} style={{ backgroundColor: 'orange' }} >
                   Rollback Turn
                </button>
              </React.Fragment>
            )}
         </div>
      </React.Fragment>
    );
}