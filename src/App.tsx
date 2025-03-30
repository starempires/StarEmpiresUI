import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchUserAttributes } from '@aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';

export default function App({user, signOut}: {user: any; signOut: () => void;}) {
   const [userAttributes, setUserAttributes] = useState<any>(null);
   const [userGroups, setUserGroups] = useState<string[]>([]);

  useEffect(() => {
  }, []);

  useEffect(() => {
       fetchUserAttributes()
          .then(attributes => { setUserAttributes(attributes); })
          .catch(error => console.error("Error fetching user attributes:", error));

      fetchAuthSession()
          .then(session => {
                 const groups = session?.tokens?.accessToken?.payload['cognito:groups'];
                 setUserGroups(Array.isArray(groups) ? groups.map(g => String(g)) : []);
          })
          .catch(error => console.error("Error fetching user groups:", error));
      }, [user]);

    return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage user={user} signOut={ signOut} userGroups={userGroups} userAttributes={userAttributes}/>} />
            <Route path="/session/:sessionName/:empireName/:turnNumber" element={<MapPage signOut={signOut}  userAttributes={userAttributes} />} />
          </Routes>
        </BrowserRouter>
      );
}