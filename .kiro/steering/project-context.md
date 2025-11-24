# Star Empires Project Context

## Project Overview
Star Empires is a turn-based strategy game built with React, TypeScript, and AWS Amplify Gen 2.

## Architecture
- **Frontend**: React with TypeScript, Material-UI components
- **Backend**: AWS Amplify Gen 2 (AppSync GraphQL, DynamoDB, Cognito)
- **Authentication**: AWS Cognito with username-based login
- **Data Storage**: DynamoDB tables via Amplify DataStore

## Amplify Version Requirements
**CRITICAL: This project uses Amplify Gen 2 ONLY. Never use Amplify v1 syntax or patterns.**

### Amplify Gen 2 Patterns (CORRECT)
- Import from `aws-amplify/auth`: `import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth'`
- Import from `aws-amplify/data`: `import { generateClient } from 'aws-amplify/data'`
- Use `generateClient<Schema>()` for data operations
- Backend defined with `defineBackend()`, `defineAuth()`, `defineData()`
- Schema uses `a.schema()` and `a.model()` syntax
- Client methods: `client.models.ModelName.create()`, `.list()`, `.get()`, `.update()`, `.delete()`

### Amplify v1 Patterns (NEVER USE)
- ❌ `import { Auth } from 'aws-amplify'` or `import { Auth } from '@aws-amplify/auth'`
- ❌ `import { DataStore } from 'aws-amplify'` or `import { DataStore } from '@aws-amplify/datastore'`
- ❌ `Auth.currentAuthenticatedUser()`
- ❌ `DataStore.query()`, `DataStore.save()`
- ❌ `API.graphql()` for direct GraphQL calls
- ❌ GraphQL schema with `type` and `@model` directives
- ❌ `amplify-cli` commands (use `npx ampx` instead)

## Key Concepts
- **Session**: A game instance with multiple players
- **Empire**: A player's faction within a session
- **Game Master (GM)**: Special player role with administrative access to all empires in their session
- **Turn**: Game progresses in discrete turns with deadlines

## Data Model
- Empire.playerName matches Cognito username (userAttributes.preferred_username)
- Sessions have a gmPlayerName field
- Empire types: GM, ACTIVE, OBSERVER, INACTIVE, NPC, ABANDONED, HOMELESS

## Code Conventions
- Use TypeScript for all new code
- Follow existing patterns in src/components/ and src/pages/
- Use Material-UI components for consistency
- Amplify client uses userPool auth mode: `generateClient<Schema>({ authMode: 'userPool' })`
- Keep authorization logic centralized in services/

## Amplify Gen 2 Code Examples

### Authentication (Gen 2)
```typescript
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';

// Get user attributes
const attributes = await fetchUserAttributes();
const username = attributes.preferred_username;

// Get session and groups
const session = await fetchAuthSession();
const groups = session?.tokens?.accessToken?.payload['cognito:groups'];
```

### Data Operations (Gen 2)
```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>({ authMode: 'userPool' });

// Create
await client.models.Empire.create({
  name: 'MyEmpire',
  playerName: 'player1',
  sessionName: 'session1',
  ordersLocked: false,
  empireType: 'ACTIVE'
});

// List with filter
const result = await client.models.Empire.list({
  filter: { playerName: { eq: 'player1' } }
});

// Get by ID
const empire = await client.models.Empire.get({ id: 'empire-id' });

// Update
await client.models.Empire.update({
  id: 'empire-id',
  ordersLocked: true
});

// Delete
await client.models.Empire.delete({ id: 'empire-id' });
```

### Backend Definition (Gen 2)
```typescript
// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
});
```

## Testing
- Unit tests for services and utilities
- Property-based tests for correctness properties
- Manual testing checklist for user flows
