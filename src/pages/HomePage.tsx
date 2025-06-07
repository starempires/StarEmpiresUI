import { useEffect, useState } from 'react';
import { loadOrdersStatus } from '../components/common/SessionAPI';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
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
import type { Empire, SessionEmpires } from '../components/common/Interfaces';

const client = generateClient<Schema>({ authMode: 'userPool' });

interface HomePageProps {
  user: any;
  userAttributes: any;
}

export default function HomePage({ user, userAttributes }: HomePageProps) {
  const [sessionEmpires, setSessionEmpires] = useState<SessionEmpires[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchSession(name: string): Promise<any> {
    const result = await client.models.Session.list({
      filter: { name: { eq: name } },
    });
    return result.data || [];
  }

  async function fetchEmpiresForSession(sessionName: string): Promise<any> {
    const result = await client.models.Empire.list({
      filter: { sessionName: { eq: sessionName } },
    });
    return result.data || []; // for now
  }

  async function fetchEmpiresForPlayer(playerName: string): Promise<any> {
    const result = await client.models.Empire.list({
      filter: { playerName: { eq: playerName } }
    });
// console.log("result = " + JSON.stringify(result));
    return result.data || [];
  }

  useEffect(() => {
    const loadSessionEmpires = async () => {
      try {
          // get all empires for player
          // separate them into GM and non-GM empires
          // for GM empires, fetch all empires in that session
          // fetch all unique sessions
          // join session w/empire data
        const playerEmpires = await fetchEmpiresForPlayer(userAttributes?.preferred_username);
//         console.log("playerEmpires = " + JSON.stringify(playerEmpires));
        if (playerEmpires.length == 0) {
            return {};
        }

        const gmEmpires = playerEmpires.filter((empire: Empire) => empire.empireType === "GM");
//         console.log("gmEmpries = " + JSON.stringify(gmEmpires));
        const nonGMEmpires = playerEmpires.filter((empire: Empire) => empire.empireType !== "GM");
//         console.log("nongmEmpries = " + JSON.stringify(nonGMEmpires));

        const gmSessionNames: string[] = Array.from(new Set(gmEmpires.map((empire: Empire) => empire.sessionName)));
        const gmEmpiresPromises = gmSessionNames.map((sessionName: string) => fetchEmpiresForSession(sessionName));
        const results = await Promise.all(gmEmpiresPromises);
        const gmOtherEmpires = results.flat();
//         console.log("gmotherEmpries = " + JSON.stringify(gmOtherEmpires));

        // get unique empires
        const allPlayerEmpires = [...gmEmpires, ...nonGMEmpires, ...gmOtherEmpires];
//         console.log("allPlayerEmpires = " + JSON.stringify(allPlayerEmpires));
        const map = new Map(
            allPlayerEmpires.map(empire => [`${empire.sessionName}:${empire.name}`, empire])
          );
        const combinedEmpires = Array.from(map.values());
//         console.log("combined = " + JSON.stringify(combinedEmpires));

        // all sessions, whether GM or not
        const allSessionNames: string[] = Array.from(new Set(combinedEmpires.map((empire: Empire) => empire.sessionName)));
//         console.log("all session Names = " + JSON.stringify(allSessionNames));
        const allSessionPromises = allSessionNames.map((sessionName: string) => fetchSession(sessionName));
        const allSessionResults = await Promise.all(allSessionPromises);
        const allSessions = allSessionResults.flat();
//         console.log("all sessions = " + JSON.stringify(allSessions));

        const sessionEmpires: SessionEmpires[] = await Promise.all(
          allSessions.map(async session => {
            const empiresForThisSession = combinedEmpires.filter((empire: Empire) => empire.sessionName === session.name);
            return {
              sessionName: session.name,
              sessionId: session.id,
              currentTurnNumber: session.currentTurnNumber,
              deadline: session.deadline,
              status: session.status,
              empires: await Promise.all(
                empiresForThisSession.map(async (empire: Empire) => ({
                  name: empire.name,
                  empireType: empire.empireType,
                  sessionName: session.name,
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

 return (
     <div className="p-6">
       <Typography variant="h6" gutterBottom>
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
             {sessionEmpires.map((session) => {
                return <SessionTableRow key={session.sessionId} session={session} />
             })}
           </TableBody>
         </Table>
       </TableContainer>
     </div>
   );
}