import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import '../index.css';

const client = generateClient<Schema>({ authMode: 'userPool' });

interface Empire {
  empireName: string;
  empireType: string;
  sessionId: string;
  ordersLocked: boolean;
}

interface SessionWithEmpires {
  sessionName: string;
  sessionId: string;
  currentTurnNumber: number;
  deadline: string;
  empires: Empire[];
}
interface HomePageProps {
  signOut: () => void;
  user: any;
  userGroups: any;
  userAttributes: any;
}

export default function HomePage({ signOut, user, userGroups, userAttributes }: HomePageProps) {
  const [sessions, setSessions] = useState<SessionWithEmpires[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchSession(sessionId: string): Promise<any> {
    const result = await client.models.Session.list({
      filter: { id: { eq: sessionId } },
    });
    return result.data || [];
  }

  async function fetchEmpiresForSession(sessionId: string): Promise<any> {
    const result = await client.models.SessionEmpire.list({
      filter: { sessionId: { eq: sessionId } },
    });
    return result.data || []; // for now
  }

  async function fetchEmpiresForUser(userId: string): Promise<any> {
    const result = await client.models.SessionEmpire.list({
      filter: { userId: { eq: userId } }
    });
    return result.data || [];
  }

  useEffect(() => {
    const loadSessions = async () => {
      try {
          // get all empires for user
          // separate them into GM and non-GM empires
          // for GM empires, fetch all empires in that session
          // fetch all unique sessions
          // join session w/empire data
        const empires = await fetchEmpiresForUser(user.userId);

        const gmEmpires = empires.filter((empire: Empire) => empire.empireType === "GM");
        const nonGMEmpires = empires.filter((empire: Empire) => empire.empireType !== "GM");

        const gmSessionIds: string[] = Array.from(new Set(gmEmpires.map((empire: Empire) => empire.sessionId)));
        const gmEmpiresPromises = gmSessionIds.map((sessionId: string) => fetchEmpiresForSession(sessionId));
        const results = await Promise.all(gmEmpiresPromises);
        const gmOtherEmpires = results.flat();

        const combinedEmpires = Array.from(
          new Map(
            [...nonGMEmpires, ...gmOtherEmpires].map(empire => [empire.empireName, empire])
          ).values()
        );

        // all sessionIds, whether GM or not
        const allSessionIds: string[] = Array.from(new Set(empires.map((empire: Empire) => empire.sessionId)));
        const allSessionPromises = allSessionIds.map((sessionId: string) => fetchSession(sessionId));
        const allSessionResults = await Promise.all(allSessionPromises);
        const allSessions = allSessionResults.flat();

        const sessionsWithEmpires: SessionWithEmpires[] = allSessions.map(session => {
          const sessionEmpires = combinedEmpires.filter((empire: Empire) => empire.sessionId === session.id);
          return {
            sessionName: session.name,
            sessionId: session.id,
            currentTurnNumber: session.currentTurnNumber,
            deadline: session.nextDeadline,
            empires: sessionEmpires.map((empire: Empire) => ({
              empireName: empire.empireName,
              empireType: empire.empireType,
              ordersLocked: empire.ordersLocked,
              sessionId:  empire.sessionId,
            }))
          };
        });

        // Sort sessions alphabetically by sessionName.
        sessionsWithEmpires.sort((a, b) => a.sessionName.localeCompare(b.sessionName));

        // For each session, sort the empires so that the GM empire is first,
        // and the rest are sorted alphabetically by empireName.
        sessionsWithEmpires.forEach(session => {
          session.empires.sort((a, b) => {
            if (a.empireType === "GM" && b.empireType !== "GM") return -1;
            if (b.empireType === "GM" && a.empireType !== "GM") return 1;
            return a.empireName.localeCompare(b.empireName);
          });
        });

        setSessions(sessionsWithEmpires);
      } catch (error) {
          console.error("Error loading session data " + error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      loadSessions();
    }
  }, [user]);

  if (loading) {
      return <Typography variant="h6" sx={{ ml: 5 }}>Loading...</Typography>;
  }

 return (
     <div className="p-6">
       <Typography variant="h4" gutterBottom>
         Welcome, {userAttributes?.preferred_username}
       </Typography>
       <Typography variant="h6" gutterBottom>
         Your Sessions
       </Typography>
       <TableContainer component={Paper}>
         <Table>
           <TableHead>
             <TableRow>
               <TableCell sx={{ fontWeight: 'bold' }}>Session Name</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Current Turn</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Empire Name</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Empire Type</TableCell>
               <TableCell sx={{ fontWeight: 'bold' }}>Orders Locked</TableCell>
             </TableRow>
           </TableHead>
           <TableBody>
             {sessions.map((session) =>
               session.empires.map((empire: Empire, index: number) => (
                 <TableRow key={`${session.sessionId}-${index}`}>
                   {index === 0 && (
                     <>
                       <TableCell rowSpan={session.empires.length}>{session.sessionName}</TableCell>
                       <TableCell rowSpan={session.empires.length}>{session.currentTurnNumber}</TableCell>
                       <TableCell rowSpan={session.empires.length}>{session.deadline}</TableCell>
                     </>
                   )}
                   <TableCell>
                     <Link to={`/session/${session.sessionName}/${empire.empireName}/${session.currentTurnNumber}`} className="text-blue-500 hover:underline">
                       {empire.empireName}
                     </Link>
                   </TableCell>
                   <TableCell>{empire.empireType}</TableCell>
                   <TableCell>{empire.empireType === "ACTIVE" ? (empire.ordersLocked ? "locked" : "not locked") : ""}</TableCell>
                 </TableRow>
               ))
             )}
           </TableBody>
         </Table>
       </TableContainer>
       <Button onClick={signOut} variant="contained" color="error" sx={{ mt: 2 }}>
         Sign out
       </Button>
       {userGroups && userGroups.includes("GAMEMASTERS") && (
             <Button onClick={() => console.log("Create Session clicked")} variant="contained" color="primary" sx={{ mt: 2, ml: 2 }}>
                Create Session
               </Button>
             )}
     </div>
   );
}