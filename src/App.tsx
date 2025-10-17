import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchUserAttributes } from '@aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import MessagesPage from './pages/MessagesPage';
import ShipDesignPage from './pages/ShipDesignPage';
import NewsPage from './pages/NewsPage';
import ShipClassesPage from './pages/ShipClassesPage';
import CreateSessionPage from './pages/CreateSessionPage';
import NavBanner from './components/common/NavBanner';
import { SnapshotContext } from './components/common/SnapshotContext';
import { ensurePlayerExists } from '../amplify/players';

export default function App({user, signOut}: {user: any; signOut: () => void;}) {
   const [userAttributes, setUserAttributes] = useState<any>(null);
   const [userGroups, setUserGroups] = useState<string[]>([]);
   const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
     async function loadUser() {
       fetchUserAttributes()
          .then(attributes => { setUserAttributes(attributes); })
          .catch(error => console.error("Error fetching user attributes:", error));

       fetchAuthSession()
          .then(session => {
                 const groups = session?.tokens?.accessToken?.payload['cognito:groups'];
                 setUserGroups(Array.isArray(groups) ? groups.map(g => String(g)) : []);
                 ensurePlayerExists(session);
          })
          .catch(error => console.error("Error fetching user groups:", error));
     }
     if (user) {
         loadUser();
     }
  }, [user]);

    return (
      <SnapshotContext.Provider value={{ snapshot, setSnapshot }}>
       <BrowserRouter>
          <NavBanner signOut={signOut} userAttributes={userAttributes} userGroups={userGroups} />
          <Routes>
            <Route path="/" element={<HomePage user={user} userAttributes={userAttributes} />} />
            <Route path="/session/:sessionName/:empireName/:turnNumber" element={<MapPage/>} />
            <Route path="/news/:sessionName/:empireName/:turnNumber" element={<NewsPage />} />
            <Route path="/messages/:sessionName/:empireName" element={<MessagesPage />} />
            <Route path="/ship-design/" element={<ShipDesignPage />} />
            <Route path="/ship-classes/:sessionName/:empireName/:turnNumber" element={<ShipClassesPage />} />
            <Route path="/create-session/" element={<CreateSessionPage userAttributes={userAttributes} userGroups={userGroups} />} />
          </Routes>
        </BrowserRouter>
       </SnapshotContext.Provider>
      );
}