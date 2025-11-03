import React, { useState } from 'react';
import ProcessingDialog from '../components/common/ProcessingDialog';
import type { Schema } from '../../amplify/data/resource';
import type { SessionEmpires } from '../components/common/Interfaces';
import { updateTurn, generateSnapshots, startSession } from '../components/common/SessionAPI';
import { getCurrentTurnNumber, updateSessionStatus, updateSessionTurnNumber } from '../components/common/ClientFunctions';
import { useNavigate } from 'react-router-dom';

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
    const [processingMessage, setProcessingMessage] = useState<string>("");

    const navigate = useNavigate();


    async function handleStatusChange(sessionId: string, status: SessionStatus) {
    //       console.log("Status Changed for session:", sessionId);
          setProcessing(true);
          setProcessingMessage("Updating Status ...");

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

   async function handleUpdateTurn(sessionId: string) {
 //       console.log("Update Turn clicked for session:", sessionId);
       setProcessing(true);
       setProcessingMessage("Updating Turn ...");

       try {
         // fetch current turn
         const currentTurn = await getCurrentTurnNumber(sessionId);
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
       setProcessingMessage("Rolling Back Turn ...");

       try {
         const currentTurn = await getCurrentTurnNumber(sessionId);
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
       setProcessingMessage("Generating Snapshots ...");

       try {
         // fetch current turn
         const currentTurn = await getCurrentTurnNumber(sessionId);
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

     async function handleStartSession(session: SessionEmpires) {
       setProcessing(true);
       setProcessingMessage("Starting Session ...");
       try {
          const apiData = await startSession(session.sessionName);
          const json = JSON.parse(apiData);
          console.log(JSON.stringify(json));
           // set status to In Progress
          await updateSessionStatus(session.sessionId, "IN_PROGRESS");
          navigate('/');
       } catch (error) {
         console.error("Failed to start session:", error);
       } finally {
         setProcessing(false);
       }
     }

    const numMissingPlayers = session.numPlayers - session.empires.length + 1;

    return (
      <React.Fragment>
         <ProcessingDialog open={processing} message={processingMessage} />
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
                 <button onClick={() => handleStartSession(session)} disabled={processing || numMissingPlayers > 0} style={{ backgroundColor: 'lightgreen' }} >
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