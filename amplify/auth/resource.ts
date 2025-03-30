import { defineAuth } from '@aws-amplify/backend';
import * as cdk from 'aws-cdk-lib';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
 loginWith: {
    email: true, // Users log in with email
  },
  userAttributes: {
    email: { required: true }, // Require email during signup
    preferredUsername: { required: true }, // Require a username
  },
  groups: ["ADMINS", "GAMEMASTERS"],
  //senders: {
  //   email: {
  //      fromName: "Star Empires",
  //      fromEmail: "noreply@starempires.com",
  //      replyTo: "noreply@starempires.com"
  //   },
  // },
});