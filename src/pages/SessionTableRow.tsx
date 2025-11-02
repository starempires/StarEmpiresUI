import React, { useState } from 'react';
import { TableRow, TableCell, Typography } from '@mui/material';
import type { Empire, SessionEmpires } from '../components/common/Interfaces';
import GMControls from './GMControls';

export default function SessionControlCell({ session }: { session: SessionEmpires }) {
  const [turnNumber, setTurnNumber] = useState<number>(session.currentTurnNumber);

  const hasWaitingStatus = session.status === "WAITING_FOR_PLAYERS";

  const numMissingPlayers = session.numPlayers - session.empires.length + (session.currentPlayerIsGM ? 1: 0);
  let waitingText = "";
  let numPlayersText = "";
  if (session.currentPlayerIsGM) {
      waitingText = numMissingPlayers > 0 ? (numMissingPlayers == 1 ? "Waiting for 1 player to join" : `Waiting for ${numMissingPlayers} players to join`) : 'Ready to start';
      numPlayersText = session.currentPlayerIsGM ? ` (${session.numPlayers} players)` : "";
  }
  else {
      waitingText = numMissingPlayers > 0 ? "Waiting for players to join" : "Waiting for game start";
  }

    return (
     <React.Fragment>
       {session.empires.map((empire: Empire, index: number) => (
         <TableRow key={`${session.sessionName}-${index}`}>
           {index === 0 && (
             <React.Fragment>
                <TableCell rowSpan={session.empires.length}>
                   <Typography variant="subtitle1"><strong>{session.sessionName}</strong>{numPlayersText}</Typography>
                   {session.empires[0].empireType === 'GM' ? (
                      <GMControls session={session} onTurnNumberChange={setTurnNumber} />
                   ) : (<Typography variant="subtitle1">GM: {session.gmPlayerName}</Typography>)}
                </TableCell>
                <TableCell rowSpan={session.empires.length}>{turnNumber}</TableCell>
                <TableCell rowSpan={session.empires.length}>{hasWaitingStatus ? (<>{waitingText}</>) :session.deadline}</TableCell>
             </React.Fragment>
            )}
           <TableCell>
              {hasWaitingStatus ?
                (<>{empire.name}</>) :
               (<a href={`https://${window.location.host}/session/${session.sessionName}/${empire.name}/${turnNumber}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-blue-500 hover:underline"
                 >
                {empire.name}
                </a>
               )
               }
                {session.currentPlayerIsGM && (
                  <> ({empire.playerName})</>
                )}
           </TableCell>
           <TableCell>{empire.empireType}</TableCell>
           <TableCell>{empire.empireType === "ACTIVE" ? empire.orderStatus : ""}</TableCell>
         </TableRow>
       ))}
      </React.Fragment>
  );
}