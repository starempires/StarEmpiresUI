// src/amplify/players.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './data/resource';

const client = generateClient<Schema>({ authMode: 'userPool' });

export async function ensurePlayerExists(session: any) {
  if (!session) {
     console.error("session is undefined");
     return;
  }

  const id = session.tokens.idToken.payload.sub;
  const username = session.tokens.idToken.payload.preferred_username;

//   console.log("Searching for player with id " + id + ", username " + username);
  try {
    // Check if player already exists
    const existing = await client.models.Player.get({id});
//     console.log("Existing data = " + JSON.stringify(existing.data));

    if (existing.data) {
//         console.log(`Player ${id} ${username} already exists`);
        return;
    }

    await client.models.Player.create({
        id: id,
        name: username,
        dedicationRating: 0,
    });
  } catch (error) {
    console.error("Error in ensurePlayerExists for username" + username, error);
  }
}