import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({

  Player: a
    .model({
       name: a.string().required(),
       dedicationRating: a.integer(),
    })
    .secondaryIndexes((index) => [index("name")])
    .authorization((allow) => [ allow.authenticated()]),
  Session: a
    .model({
      name: a.string().required(),
      gmPlayerName: a.string().required(),
      started: a.datetime(), // optional
      status: a.enum([
        'ABANDONED',
        'ARCHIVED',
        'CREATED',
        'GAME_OVER',
        'IN_PROGRESS',
        'REPLACEMENT_NEEDED',
        'TEMPORARILY_CLOSED',
        'UPDATE_BEING_RUN',
        'WAITING_FOR_PLAYERS',
      ]),
      sessionType: a.enum(['DEMO', 'STANDARD', 'TEST']),
      numPlayers: a.integer().required(),
      updateHours: a.integer().required(),
      currentTurnNumber: a.integer().required().default(0),
      deadline: a.datetime(), // optional
      maxTurns: a.integer(), // optional
    })
    .secondaryIndexes((index) => [index("name")])
    .authorization((allow) => [allow.authenticated()]),
  Empire: a
    .model({
      name: a.string().required(),
      playerName: a.string().required(),
      sessionName: a.string().required(),
      ordersLocked: a.boolean().required(),
      empireType: a.enum([
                  'ABANDONED',
                  'ACTIVE',
                  'GM',
                  'HOMELESS',
                  'INACTIVE',
                  'NPC',
                  'OBSERVER',
      ]),
    })
    .secondaryIndexes((index) => [index("sessionName"), index("playerName"), index("name")])
    .authorization((allow) => [ allow.authenticated()]),
  Message: a
    .model({
      id: a.id().required(),
      sessionName: a.string().required(),
      sender: a.string().required(),
      broadcast: a.boolean().required(),
      anonymous: a.boolean().required(),
      content: a.string().required(),
      sent: a.datetime().required(),
      recipients: a.hasMany('MessageRecipient', 'messageId'),
    })
    .secondaryIndexes((index) => [index("sessionName"), index("sender")])
    .authorization((allow) => [ allow.authenticated()]),
  MessageRecipient: a
    .model({
      sessionName: a.string().required(),
      recipient: a.string().required(),
      read: a.datetime(),
      messageId: a.id().required(),
      message: a.belongsTo('Message', 'messageId'),
    })
    .secondaryIndexes((index) => [index("sessionName"), index("recipient")])
    .authorization((allow) => [ allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>