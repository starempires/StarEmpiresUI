import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';

// Configure Amplify **before** importing any code that uses it
Amplify.configure(outputs);

const root = ReactDOM.createRoot(document.getElementById('root'));

// Dynamically import App after Amplify is configured to avoid config warnings
import('./App').then(({ default: App }) => {
  root.render(
    <React.StrictMode>
      <Authenticator signUpAttributes={['preferred_username', 'email']}>
        {({ signOut, user }) => (
          <App user={user} signOut={signOut} />
        )}
      </Authenticator>
    </React.StrictMode>
  );
});