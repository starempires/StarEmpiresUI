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
import { useLocation } from 'react-router-dom';

interface HomePageProps {
  user: any;
  userAttributes: any;
}

export default function HomePage({ user, userAttributes }: HomePageProps) {
  const [sessionEmpires, setSessionEmpires] = useState<SessionEmpires[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const location = useLocation();

  const loadSessionEmpires = async () => {
      try {
        if (!userAttributes) {
            return {};
        }

        const currentUsername = userAttributes?.preferred_username;

        // Get all empires for this player
        const playerEmpires = await getEmpiresForPlayer(currentUsername);

        // Separate GM and non-GM empires
        const gmEmpires = playerEmpires.filter((empire: Empire) => empire.empireType === "GM");
        const nonGMEmpires = playerEmpires.filter((empire: Empire) => empire.empireType !== "GM");

        // For sessions where this player is GM, load all empires in those sessions
        const gmSessionNames: string[] = Array.from(new Set(gmEmpires.map((empire: Empire) => empire.sessionName)));
        const gmEmpiresPromises = gmSessionNames.map((sessionName: string) => getEmpiresForSession(sessionName));
        const results = await Promise.all(gmEmpiresPromises);
        const gmSessionEmpires = results.flat();

        // Combine all empires, removing duplicates
        const allPlayerEmpires = [...gmEmpires, ...nonGMEmpires, ...gmSessionEmpires];
        const map = new Map(
            allPlayerEmpires.map(empire => [`${empire.sessionName}:${empire.name}`, empire])
        );
        const combinedEmpires = Array.from(map.values());

        // Filter empires to only include those the player can access:
        // 1. Empires owned by the player (playerName matches)
        // 2. Empires in sessions where the player is GM
        const accessibleEmpires = combinedEmpires.filter((empire: Empire) => {
          // Player owns this empire
          if (empire.playerName === currentUsername) {
            return true;
          }
          // Player is GM for this session
          if (gmSessionNames.includes(empire.sessionName)) {
            return true;
          }
          return false;
        });

        // Get unique session names from accessible empires
        // Only show sessions where the player has at least one empire
        const sessionNamesWithEmpires: string[] = Array.from(
          new Set(accessibleEmpires.map((empire: Empire) => empire.sessionName))
        );

        // Load session data for sessions where player has empires
        const sessionPromises = sessionNamesWithEmpires.map((sessionName: string) => getSession(sessionName));
        const sessionResults = await Promise.all(sessionPromises);
        const sessions = sessionResults.flat();

        // Also load sessions that are WAITING_FOR_PLAYERS (for join functionality)
        const waitingSessions = await getWaitingForPlayerSessions();
        const existingSessionNames = new Set(sessions.map((s: any) => s.name));
        waitingSessions.forEach((s: any) => {
           if (!existingSessionNames.has(s.name)) {
               sessions.push(s);
           }
        });

        // Build SessionEmpires structure with filtered empires
        const sessionEmpires: SessionEmpires[] = await Promise.all(
          sessions.map(async session => {
            // Get empires for this session that the player can access
            const empiresForThisSession = accessibleEmpires.filter(
              (empire: Empire) => empire.sessionName === session.name
            );
            
            const currentPlayerIsGM = gmSessionNames.includes(session.name);

            return {
              sessionName: session.name,
              gmPlayerName: session.gmPlayerName,
              currentPlayerIsGM: currentPlayerIsGM,
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

        // Sort sessions alphabetically by sessionName
        sessionEmpires.sort((a: SessionEmpires, b: SessionEmpires) => 
          a.sessionName.localeCompare(b.sessionName)
        );

        // For each session, sort empires: GM first, then alphabetically
        sessionEmpires.forEach(session => {
          session.empires.sort((a: Empire, b: Empire) => {
            if (a.empireType === "GM" && b.empireType !== "GM") return -1;
            if (b.empireType === "GM" && a.empireType !== "GM") return 1;
            return a.name.localeCompare(b.name);
          });
        });

        setSessionEmpires(sessionEmpires);
      } catch (error) {
          console.error("Error loading session data " + error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (user?.userId) {
       loadSessionEmpires();
    }
  }, [user, userAttributes, location.key]);

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
                   <SessionWaitingTableRow 
                     playerName={userAttributes?.preferred_username} 
                     session={session}
                     onSessionUpdate={loadSessionEmpires}
                   />
                 ) : (
                   <SessionTableRow 
                     session={session} 
                     playerName={userAttributes?.preferred_username}
                     onSessionUpdate={loadSessionEmpires}
                   />
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