import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import MessagesPage from './pages/MessagesPage';
import ShipDesignPage from './pages/ShipDesignPage';
import NewsPage from './pages/NewsPage';
import ShipClassesPage from './pages/ShipClassesPage';
import CreateSessionPage from './pages/CreateSessionPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NavBanner from './components/common/NavBanner';
import { SnapshotContext } from './components/common/SnapshotContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
            {/* HomePage - Authentication only (session view) */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage user={user} userAttributes={userAttributes} />
              </ProtectedRoute>
            } />
            
            {/* Empire-specific routes - Require empire access */}
            <Route path="/session/:sessionName/:empireName/:turnNumber" element={
              <ProtectedRoute requiresEmpireAccess={true}>
                <MapPage/>
              </ProtectedRoute>
            } />
            <Route path="/news/:sessionName/:empireName/:turnNumber" element={
              <ProtectedRoute requiresEmpireAccess={true}>
                <NewsPage />
              </ProtectedRoute>
            } />
            <Route path="/messages/:sessionName/:empireName" element={
              <ProtectedRoute requiresEmpireAccess={true}>
                <MessagesPage />
              </ProtectedRoute>
            } />
            <Route path="/ship-classes/:sessionName/:empireName/:turnNumber" element={
              <ProtectedRoute requiresEmpireAccess={true}>
                <ShipClassesPage />
              </ProtectedRoute>
            } />
            
            {/* Static routes - Authentication only, no empire access required */}
            <Route path="/ship-design/" element={
              <ProtectedRoute staticPage={true}>
                <ShipDesignPage />
              </ProtectedRoute>
            } />
            <Route path="/create-session/" element={
              <ProtectedRoute staticPage={true}>
                <CreateSessionPage userAttributes={userAttributes} userGroups={userGroups} />
              </ProtectedRoute>
            } />
            
            {/* Unauthorized page - No protection needed */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </BrowserRouter>
       </SnapshotContext.Provider>
      );
}