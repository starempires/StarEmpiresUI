import { useEffect, useState } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import '../index.css';

const client = generateClient<Schema>({ authMode: 'userPool' });

export default function HomePage({ signOut, user, userAttributes }: { signOut: () => void; user: any; userAttributes: any }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      filter: { userId: { eq: user.userId } }
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

        const gmEmpires = empires.filter(empire => empire.empireType === "GM");
        const nonGMEmpires = empires.filter(empire => empire.empireType !== "GM");

        const gmSessionIds = Array.from(new Set(gmEmpires.map(empire => empire.sessionId)));
        const gmEmpiresPromises = gmSessionIds.map(sessionId => fetchEmpiresForSession(sessionId));
        const results = await Promise.all(gmEmpiresPromises);
        const gmOtherEmpires = results.flat();

        const combinedEmpires = [...nonGMEmpires, ...gmOtherEmpires];

        // all sessionIds, whether GM or not
        const allSessionIds = Array.from(new Set(empires.map(empire => empire.sessionId)));
        const allSessionPromises = allSessionIds.map(sessionId => fetchSession(sessionId));
        const allSessionResults = await Promise.all(allSessionPromises);
        const allSessions = allSessionResults.flat();

        const sessionsWithEmpires = allSessions.map(session => {
          const sessionEmpires = combinedEmpires.filter(empire => empire.sessionId === session.id);
          return {
            sessionName: session.name,
            sessionId: session.id,
            currentTurnNumber: session.currentTurnNumber,
            deadline: session.nextDeadline,
            empires: sessionEmpires.map(empire => ({
              empireName: empire.empireName,
              empireType: empire.empireType,
              ordersLocked: empire.ordersLocked,
            }))
          };
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
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {userAttributes?.preferred_username}
      </h1>
      <p>Your sessions</p>
      <ul>
        {sessions.map((session) => (
          <li key={session.sessionId} className="mb-4">
            <h2 className="text-blue-500 hover:underline text-xl">Session {session.sessionName}</h2>
            <p>Current Turn {session.currentTurnNumber}, Deadline {session.deadline}</p>
            <ul className="ml-4 mt-2">
              {session.empires.map((empire, index) => (
                <li key={index} className="mb-1">
                  <Link
                    to={`/session/${session.sessionName}/${empire.empireName}/${session.currentTurnNumber}`}
                    className="text-blue-500 hover:underline"
                  >
                    Empire {empire.empireName} ({empire.empireType})
                  </Link>
                  {empire.empireType === "ACTIVE" && (
                    <span> - Orders {empire.ordersLocked ? "locked" : "not locked"}</span>
                  )}
                 </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button onClick={signOut} className="mt-6 text-sm text-red-500">Sign out</button>
    </div>
  );
}