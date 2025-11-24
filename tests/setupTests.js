// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { Amplify } from 'aws-amplify';

// Mock Amplify configuration for tests
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'test-pool-id',
      userPoolClientId: 'test-client-id',
    }
  },
  API: {
    GraphQL: {
      endpoint: 'https://test-api.example.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'userPool'
    }
  }
});
