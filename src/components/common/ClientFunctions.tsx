import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>({ authMode: 'userPool' });

export async function updateSessionStatus(
        sessionId: string,
        newStatus: NonNullable<Schema["Session"]["type"]["status"]>
      ): Promise<any> {
        try {
           const updated = await client.models.Session.update({
             id: sessionId,
             status: newStatus,
           });

    //       console.log("Session updated:", updated.data);
          return updated.data;
        } catch (error) {
          console.error("Error updating session:", error);
          throw error;
        }
}

export async function updateSessionTurnNumber(sessionId: string, turnNumber: number): Promise<any> {
     try {
       const updated = await client.models.Session.update({
         id: sessionId,
         currentTurnNumber: turnNumber,
       });

 //       console.log("Turn number updated:", updated.data);
       return updated.data;
     } catch (error) {
       console.error("Error updating session turn number:", error);
       throw error;
     }
}

export async function getCurrentTurnNumber(sessionId: string): Promise<number> {
    try {
        const result = await client.models.Session.get({ id: sessionId });
        return result.data?.currentTurnNumber || 0;
    } catch (error) {
        console.error("Error fetching current turn number for session " + sessionId, error);
        throw error;
    }
}

export async function getSentMessages(sessionName: string, empireName: string): Promise<any> {
       console.log("loading send messages for for " + sessionName + ", " + empireName);

      const result = await client.models.Message.list({
          filter: {
            and: [
              { sessionName: { eq: sessionName } },
              { sender: { eq: empireName } },
            ]
          }
      });
//        console.log("result = " + JSON.stringify(result));
      return result.data || [];
 }

export async function getMessage(id: string): Promise<any> {
//       console.log("fetching message ID " + id);
      const result = await client.models.Message.list({
          filter: { id: { eq: id } },
      });
//       console.log("fetchMessage result = " + JSON.stringify(result.data));
      return result.data || [];
 }

export async function getReceivedMessages(sessionName: string, empireName: string): Promise<any> {
//       console.log("fetching received messages for " + sessionName + " " + empireName);
      var received = await client.models.MessageRecipient.list({
          filter: {
            and: [
              { sessionName: { eq: sessionName } },
              { recipient: { eq: empireName } },
            ]
          }
      });
      const receivedData = received?.data || [];
//       console.log("receivedData = " + JSON.stringify(receivedData));
      if (!receivedData) {
          return [];
      }
      const promises = receivedData.map((msg: any) => getMessage(msg.id));
      const data = await Promise.all(promises);
      const messages = data.flat();
//       console.log("messages = " + JSON.stringify(messages));
      return messages || [];
 }

export async function checkSessionExists(sessionName: string): Promise<boolean> {
  try {
    const existing = await client.models.Session.list({
      filter: { name: { eq: sessionName } }
    });

    return !!(existing.data && existing.data.length > 0);
  } catch (error) {
    console.error("Error checking session existence:", error);
    // being cautious — assume it exists if we hit an error
    return true;
  }
}

export async function registerEmpire(
    sessionName: string,
    playerName: string,
    empireName: string,
    empireType: 'ABANDONED' | 'ACTIVE' | 'GM' | 'HOMELESS' | 'INACTIVE' | 'NPC' | 'OBSERVER'
  ): Promise<any> {
    const result = await client.models.Empire.create({
              name: empireName,
              playerName: playerName,
              sessionName: sessionName,
              ordersLocked: false,
              empireType: empireType
    });
    return result.data;
}

export async function registerSession(name: string, numPlayers: number, gmPlayerName: string): Promise<any> {
     const result = await client.models.Session.create({
          name: name,
          gmPlayerName: gmPlayerName,
          currentTurnNumber: 0,
          status: 'WAITING_FOR_PLAYERS',
          sessionType: 'STANDARD',
          numPlayers: numPlayers,
          updateHours: 168,
        });
     return result.data;
}

export async function getEmpiresForPlayer(playerName: string): Promise<any> {
    const result = await client.models.Empire.list({
      filter: { playerName: { eq: playerName } }
    });
// console.log("result = " + JSON.stringify(result));
    return result.data || [];
}

export async function getSession(name: string): Promise<any> {
    const result = await client.models.Session.list({
      filter: { name: { eq: name } },
    });
    return result.data || [];
}

export async function getWaitingForPlayerSessions(): Promise<any> {
    const result = await client.models.Session.list({
      filter: { status: { eq: "WAITING_FOR_PLAYERS" } },
    });
    return result.data || [];
  }

export async function getEmpiresForSession(sessionName: string): Promise<any> {
    const result = await client.models.Empire.list({
      filter: { sessionName: { eq: sessionName } },
    });
    return result.data || []; // for now
}