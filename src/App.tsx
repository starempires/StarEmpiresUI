import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchUserAttributes } from '@aws-amplify/auth';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';

export default function App({user, signOut}: {user: any; signOut: () => void;}) {
   const [userAttributes, setUserAttributes] = useState<any>(null);

  useEffect(() => {
       fetchUserAttributes()
          .then(attributes => { setUserAttributes(attributes); })
          .catch(error => console.error("Error fetching preferred_username:", error));
      }, [user]);

    return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage user={user} signOut={ signOut} userAttributes={userAttributes}/>} />
            <Route path="/session/:sessionName/:empireName/:turnNumber" element={<MapPage signOut={signOut}  userAttributes={userAttributes} />} />
          </Routes>
        </BrowserRouter>
      );
}