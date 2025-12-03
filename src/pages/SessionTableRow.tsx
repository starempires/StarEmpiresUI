import React, { useState } from 'react';
import { TableRow, TableCell, Typography, Button, CircularProgress, Alert } from '@mui/material';
import type { Empire, SessionEmpires } from '../components/common/Interfaces';
import GMControls from './GMControls';
import { useSessionAccess } from '../hooks/useSessionAccess';
import { startSessionManually } from '../components/common/ClientFunctions';

/**
 * Component for rendering an empire cell with access control
 */
function EmpireCell({ 
  empire, 
  session, 
  turnNumber, 
  playerName,
  hasWaitingStatus
}: { 
  empire: Empire; 
  session: SessionEmpires; 
  turnNumber: number; 
  playerName: string;
  hasWaitingStatus: boolean;
}) {
  const { canAccessMap, showWaitingMessage } = useSessionAccess(
    session.sessionName,
    empire.name,
    session.status,
    playerName
  );

  return (
    <TableCell>
      {hasWaitingStatus || showWaitingMessage ? (
        // Session is WAITING_FOR_PLAYERS or READY_TO_START - just show empire name
        <>{empire.name}</>
      ) : canAccessMap ? (
        // Player can access map - show link
        <a 
          href={`https://${window.location.host}/session/${session.sessionName}/${empire.name}/${turnNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {empire.name}
        </a>
      ) : (
        // Fallback - just show empire name
        <>{empire.name}</>
      )}
      {session.currentPlayerIsGM && (
        <> ({empire.playerName})</>
      )}
    </TableCell>
  );
}

export default function SessionControlCell({ session, playerName, onSessionUpdate }: { 
  session: SessionEmpires; 
  playerName: string;
  onSessionUpdate?: () => void;
}) {
  const [turnNumber, setTurnNumber] = useState<number>(session.currentTurnNumber);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [startSuccess, setStartSuccess] = useState<boolean>(false);

  const hasWaitingStatus = session.status === "WAITING_FOR_PLAYERS";
  const isReadyToStart = session.status === "READY_TO_START";
  const isInProgress = session.status === "IN_PROGRESS";

  // Count active empires (ACTIVE and NPC types only)
  const activeEmpireCount = session.empires.filter(
    (empire) => empire.empireType === 'ACTIVE' || empire.empireType === 'NPC'
  ).length;

  const handleStartSession = async () => {
    setIsStarting(true);
    setStartError(null);
    setStartSuccess(false);

    try {
      const result = await startSessionManually(session.sessionId, session.sessionName);
      
      if (result.success) {
        setStartSuccess(true);
        // Refresh session list after successful start
        if (onSessionUpdate) {
          setTimeout(() => {
            onSessionUpdate();
          }, 500);
        }
      } else {
        setStartError(result.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setStartError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsStarting(false);
    }
  };

    return (
     <React.Fragment>
       {session.empires.map((empire: Empire, index: number) => (
         <TableRow key={`${session.sessionName}-${index}`}>
           {index === 0 && (
             <React.Fragment>
                <TableCell rowSpan={session.empires.length}>
                   <Typography variant="subtitle1">
                     <strong>{session.sessionName}</strong>
                   </Typography>
                   {session.empires[0].empireType === 'GM' ? (
                      <GMControls session={session} onTurnNumberChange={setTurnNumber} />
                   ) : (<Typography variant="subtitle1">GM: {session.gmPlayerName}</Typography>)}
                   
                   {/* Start Session button for GM when session is READY_TO_START */}
                   {session.currentPlayerIsGM && isReadyToStart && (
                     <div style={{ marginTop: '8px' }}>
                       <Button
                         variant="contained"
                         color="primary"
                         onClick={handleStartSession}
                         disabled={isStarting}
                         size="small"
                       >
                         {isStarting ? (
                           <>
                             <CircularProgress size={16} sx={{ mr: 1 }} />
                             Starting...
                           </>
                         ) : (
                           'Start Session'
                         )}
                       </Button>
                       
                       {startSuccess && (
                         <Alert severity="success" sx={{ mt: 1 }}>
                           Session started successfully!
                         </Alert>
                       )}
                       
                       {startError && (
                         <Alert severity="error" sx={{ mt: 1 }}>
                           {startError}
                         </Alert>
                       )}
                     </div>
                   )}
                </TableCell>
                <TableCell rowSpan={session.empires.length}>
                  {isInProgress ? turnNumber : '-'}
                </TableCell>
                {/* Deadline column - show once with rowSpan for most cases */}
                {/* GM in WAITING_FOR_PLAYERS */}
                {(session.currentPlayerIsGM && hasWaitingStatus) && (
                  <TableCell rowSpan={session.empires.length}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontStyle: 'italic',
                        color: 'text.primary'
                      }}
                    >
                      {`${activeEmpireCount} of ${session.numPlayers} players joined`}
                    </Typography>
                  </TableCell>
                )}
                {/* IN_PROGRESS - show deadline once */}
                {isInProgress && (
                  <TableCell rowSpan={session.empires.length}>
                    <Typography variant="body2">
                      {session.deadline}
                    </Typography>
                  </TableCell>
                )}
                {/* READY_TO_START - show status once */}
                {isReadyToStart && (
                  <TableCell rowSpan={session.empires.length}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'success.main',
                        fontStyle: !session.currentPlayerIsGM ? 'italic' : 'normal'
                      }}
                    >
                      {session.currentPlayerIsGM ? 'Ready to Start' : 'Waiting for GM to start session'}
                    </Typography>
                  </TableCell>
                )}
             </React.Fragment>
            )}
           {/* Deadline column - shown for each empire ONLY for non-GM in WAITING_FOR_PLAYERS */}
           {!session.currentPlayerIsGM && hasWaitingStatus && (
             <TableCell>
               <Typography 
                 variant="body2" 
                 sx={{ 
                   fontStyle: 'italic',
                   color: 'text.primary'
                 }}
               >
                 Waiting for all players to join
               </Typography>
             </TableCell>
           )}
           <EmpireCell 
             empire={empire}
             session={session}
             turnNumber={turnNumber}
             playerName={playerName}
             hasWaitingStatus={hasWaitingStatus}
           />
           <TableCell>{empire.empireType}</TableCell>
           <TableCell>{empire.empireType === "ACTIVE" ? empire.orderStatus : ""}</TableCell>
         </TableRow>
       ))}
      </React.Fragment>
  );
}