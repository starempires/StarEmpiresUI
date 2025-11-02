import React from 'react';
import { useEffect, useState } from 'react';
import { loadOrdersStatus } from '../components/common/SessionAPI';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import '../index.css';
import SessionTableRow from './SessionTableRow';
import SessionWaitingTableRow from './SessionWaitingTableRow';
import type { Empire, SessionEmpires } from '../components/common/Interfaces';
import { getSession, getEmpiresForPlayer, getEmpiresForSession, getWaitingForPlayerSessions } from '../components/common/ClientFunctions';

interface HomePageProps {
  user: any;
  userAttributes: any;
}

export default function HomePage({ user, userAttributes }: HomePageProps) {
  const [sessionEmpires, setSessionEmpires] = useState<SessionEmpires[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSessionEmpires = async () => {
      try {
          // get all empires for player
          // separate them into GM and non-GM empires
          // for GM empires, fetch all empires in that session
          // fetch all unique sessions
          // join session w/empire data
        if (!userAttributes) {
            return {};
        }

        const playerEmpires = await getEmpiresForPlayer(userAttributes?.preferred_username);

        // find empires where this player is the GM
        const gmEmpires = playerEmpires.filter((empire: Empire) => empire.empireType === "GM");
//         console.log("gmEmpries = " + JSON.stringify(gmEmpires));
        // find empires where this player is not the GM
        const nonGMEmpires = playerEmpires.filter((empire: Empire) => empire.empireType !== "GM");
//         console.log("nongmEmpries = " + JSON.stringify(nonGMEmpires));


        // load other empires for sessions where this player is the GM
        const gmSessionNames: string[] = Array.from(new Set(gmEmpires.map((empire: Empire) => empire.sessionName)));
        const gmEmpiresPromises = gmSessionNames.map((sessionName: string) => getEmpiresForSession(sessionName));
        const results = await Promise.all(gmEmpiresPromises);
        const gmOtherEmpires = results.flat();
//         console.log("gmOtherEmpries = " + JSON.stringify(gmOtherEmpires));

        // get unique empires
        const allPlayerEmpires = [...gmEmpires, ...nonGMEmpires, ...gmOtherEmpires];
//         console.log("allPlayerEmpires = " + JSON.stringify(allPlayerEmpires));
        const map = new Map(
            allPlayerEmpires.map(empire => [`${empire.sessionName}:${empire.name}`, empire])
          );
        const combinedEmpires = Array.from(map.values());
//         console.log("combined = " + JSON.stringify(combinedEmpires));


        // load sessions that are waiting for players
        const waitingSessions = await getWaitingForPlayerSessions();
//         console.log("waiting sessions = " + JSON.stringify(waitingSessions));

//         if (playerEmpires.length == 0) {
//             return {};
//         }


        // all sessions, whether GM or not
        const allSessionNames: string[] = Array.from(new Set(combinedEmpires.map((empire: Empire) => empire.sessionName)));
//         console.log("all session Names = " + JSON.stringify(allSessionNames));
        const allSessionPromises = allSessionNames.map((sessionName: string) => getSession(sessionName));
        const allSessionResults = await Promise.all(allSessionPromises);
        const allSessions = allSessionResults.flat();
        // add sessions that are WAITING_FOR_PLAYERS even if this player doesn't yet have an empire in them
        const existingSessionNames = new Set(allSessions.map((s: any) => s.name));
        waitingSessions.forEach((s: any) => {
           if (!existingSessionNames.has(s.name)) {
               allSessions.push(s);
           }
        });

//         console.log("all sessions = " + JSON.stringify(allSessions));

        const sessionEmpires: SessionEmpires[] = await Promise.all(
          allSessions.map(async session => {
            const empiresForThisSession = combinedEmpires.filter((empire: Empire) => empire.sessionName === session.name);
            return {
              sessionName: session.name,
              gmPlayerName: session.gmPlayerName,
              currentPlayerIsGM: session.gmPlayerName === userAttributes?.preferred_username,
              sessionId: session.id,
              currentTurnNumber: session.currentTurnNumber,
              numPlayers: session.numPlayers,
              deadline: session.deadline,
              status: session.status,
              empires: await Promise.all(
                empiresForThisSession.map(async (empire: Empire) => ({
                  name: empire.name,
                  empireType: empire.empireType,
                  sessionName: session.name,
                  playerName: empire.playerName,
                  orderStatus: empire.empireType === "GM" ? "" : await loadOrdersStatus(session.name, empire.name, session.currentTurnNumber),
                }))
              )
            };
          })
        );

        // Sort sessions alphabetically by sessionName.
        sessionEmpires.sort((a:SessionEmpires, b:SessionEmpires) => a.sessionName.localeCompare(b.sessionName));

        // For each session, sort the empires so that the GM empire is first,
        // and the rest are sorted alphabetically by empireName.
        sessionEmpires.forEach(session => {
          session.empires.sort((a:Empire, b:Empire) => {
            if (a.empireType === "GM" && b.empireType !== "GM") return -1;
            if (b.empireType === "GM" && a.empireType !== "GM") return 1;
            return a.name.localeCompare(b.name);
          });
        });
//     console.log("session Empires = " + JSON.stringify(sessionEmpires));

        setSessionEmpires(sessionEmpires);
      } catch (error) {
          console.error("Error loading session data " + error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
       loadSessionEmpires();
    }
  }, [user, userAttributes]);

  if (loading) {
      return <Typography variant="h6" sx={{ ml: 5 }}>Loading...</Typography>;
  }

//   if (sessionEmpires.length === 0) {
//       return <Typography variant="h6" sx={{ ml: 5 }}>No sessions found</Typography>;
//   }

 return (
     <div className="p-6">
       <Typography variant="h6" sx={{ml:1}} gutterBottom>
         Sessions for {userAttributes?.preferred_username}
       </Typography>
       <TableContainer component={Paper}>
         <Table>
           <TableHead>
             <TableRow key="header">
               <TableCell sx={{ fontWeight: 'bold' }}>Session Name</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Current Turn</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Empire Name</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Empire Type</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Orders Status</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {sessionEmpires.map((session) => (
               <React.Fragment key={session.sessionId}>
                 {(session.status === "WAITING_FOR_PLAYERS"
                   && !session.currentPlayerIsGM
                   && !session.empires.some(e => e.playerName === userAttributes?.preferred_username)
                 ) ? (
                   <SessionWaitingTableRow playerName={userAttributes?.preferred_username} session={session} />
                 ) : (
                   <SessionTableRow session={session} />
                 )}
                 <TableRow>
                   <TableCell colSpan={6} sx={{ borderBottom: 3, borderColor: 'divider', p: 0 }} />
                 </TableRow>
               </React.Fragment>
             ))}
           </TableBody>
         </Table>
       </TableContainer>
     </div>
   );
}