import React, { Component, useEffect, useState } from 'react';
import { Stage } from 'react-konva';
import Galaxy from './components/galaxy/Galaxy.jsx';
import * as Constants from './Constants';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchUserAttributes } from '@aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from "aws-amplify";
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';

export default function App() {
   const [user, setUser] = useState(null);
   const [userAttributes, setUserAttributes] = useState(null);

  useEffect(() => {
       fetchUserAttributes()
          .then(attributes => { setUserAttributes(attributes); })
          .catch(error => console.error("Error fetching preferred_username:", error));
      }, [user]);

    return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage user={user} signOut={signOut} userAttributes={userAttributes}/>} />
            <Route path="/session/:sessionName/:empireName/:turnNumber" element={<MapPage user={user} signOut={signOut} userAttributes={userAttributes} />} />
          </Routes>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}