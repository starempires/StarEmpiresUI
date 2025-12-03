import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { generateSnapshots, startSession } from './SessionAPI';

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

export async function getEmpire(sessionName: string, empireName: string): Promise<any> {
    const result = await client.models.Empire.list({
      filter: {
        and: [
          { sessionName: { eq: sessionName } },
          { name: { eq: empireName } }
        ]
      }
    });
    return result.data?.[0] || null;
}

export async function getGMEmpireForPlayer(sessionName: string, playerName: string): Promise<any> {
    const result = await client.models.Empire.list({
      filter: {
        and: [
          { sessionName: { eq: sessionName } },
          { playerName: { eq: playerName } },
          { empireType: { eq: 'GM' } }
        ]
      }
    });
    return result.data?.[0] || null;
}

/**
 * Counts active empires in a session (excludes GM, OBSERVER, INACTIVE, ABANDONED, HOMELESS)
 * @param sessionName - The session name
 * @returns Count of active empires (ACTIVE and NPC types)
 */
export async function countActiveEmpires(sessionName: string): Promise<number> {
    try {
        const empires = await getEmpiresForSession(sessionName);
        const activeEmpires = empires.filter((empire: any) => 
            empire.empireType === 'ACTIVE' || empire.empireType === 'NPC'
        );
        return activeEmpires.length;
    } catch (error) {
        console.error("Error counting active empires:", error);
        throw error;
    }
}

/**
 * Checks if a session has reached full capacity
 * @param sessionName - The session name
 * @returns Object with isFull, activeEmpireCount, and capacity
 */
export async function checkSessionCapacity(sessionName: string): Promise<{
    isFull: boolean;
    activeEmpireCount: number;
    capacity: number;
}> {
    try {
        const sessions = await getSession(sessionName);
        if (!sessions || sessions.length === 0) {
            throw new Error(`Session not found: ${sessionName}`);
        }
        
        const session = sessions[0];
        const capacity = session.numPlayers || 0;
        const activeEmpireCount = await countActiveEmpires(sessionName);
        const isFull = activeEmpireCount >= capacity;
        
        return {
            isFull,
            activeEmpireCount,
            capacity
        };
    } catch (error) {
        console.error("Error checking session capacity:", error);
        throw error;
    }
}

/**
 * Attempts to auto-start a session if it's full
 * @param sessionName - The session name
 * @returns Result object with success, newStatus, and optional error
 */
export async function attemptAutoStart(sessionName: string): Promise<{
    success: boolean;
    newStatus?: string;
    error?: string;
}> {
    try {
        // Get the session to check current status
        const sessions = await getSession(sessionName);
        if (!sessions || sessions.length === 0) {
            return {
                success: false,
                error: `Session not found: ${sessionName}`
            };
        }
        
        const session = sessions[0];
        
        // Guard condition: Only auto-start if session is in WAITING_FOR_PLAYERS status
        if (session.status !== 'WAITING_FOR_PLAYERS') {
            return {
                success: false,
                error: `Session is not in WAITING_FOR_PLAYERS status (current: ${session.status})`
            };
        }
        
        // Check if session is at full capacity
        const capacityCheck = await checkSessionCapacity(sessionName);
        
        if (!capacityCheck.isFull) {
            return {
                success: false,
                error: `Session is not full (${capacityCheck.activeEmpireCount}/${capacityCheck.capacity} players)`
            };
        }
        
        // Update session status to READY_TO_START (note: schema uses READY_TO_START, not READY_TO_RUN)
        try {
            await updateSessionStatus(session.id, 'READY_TO_START');
        } catch (statusError) {
            console.error("Error updating session status:", statusError);
            return {
                success: false,
                error: `Failed to update session status: ${statusError instanceof Error ? statusError.message : String(statusError)}`
            };
        }
        
        // Call backend startSession API to initialize backend session state
        try {
            await startSession(sessionName);
        } catch (startSessionError) {
            console.error("Error calling backend startSession:", startSessionError);
            // Revert status back to WAITING_FOR_PLAYERS on startSession failure
            try {
                await updateSessionStatus(session.id, 'WAITING_FOR_PLAYERS');
            } catch (revertError) {
                console.error("Error reverting session status:", revertError);
            }
            return {
                success: false,
                error: `Failed to start session: ${startSessionError instanceof Error ? startSessionError.message : String(startSessionError)}`
            };
        }
        
        // Generate snapshots for turn 0
        try {
            await generateSnapshots(sessionName, 0);
        } catch (snapshotError) {
            console.error("Error generating snapshots:", snapshotError);
            // Note: We keep the session in READY_TO_START status even if snapshot generation fails
            // This allows the GM to retry or manually fix the issue
            console.warn("Snapshot generation failed, but session remains in READY_TO_START status");
            return {
                success: false,
                error: `Failed to generate snapshots: ${snapshotError instanceof Error ? snapshotError.message : String(snapshotError)}`
            };
        }
        
        return {
            success: true,
            newStatus: 'READY_TO_START'
        };
        
    } catch (error) {
        console.error("Error in attemptAutoStart:", error);
        return {
            success: false,
            error: `Auto-start failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Starts a session manually (transitions from READY_TO_START to IN_PROGRESS)
 * @param sessionId - The session ID
 * @param sessionName - The session name
 * @returns Result object with success and optional error
 */
export async function startSessionManually(sessionId: string, sessionName: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Get the session to verify current status
        const sessions = await getSession(sessionName);
        if (!sessions || sessions.length === 0) {
            return {
                success: false,
                error: `Session not found: ${sessionName}`
            };
        }
        
        const session = sessions[0];
        
        // Verify session is in READY_TO_START status
        if (session.status !== 'READY_TO_START') {
            return {
                success: false,
                error: `Session is not in READY_TO_START status (current: ${session.status})`
            };
        }
        
        // Update session status to IN_PROGRESS
        try {
            await updateSessionStatus(sessionId, 'IN_PROGRESS');
        } catch (statusError) {
            console.error("Error updating session status to IN_PROGRESS:", statusError);
            return {
                success: false,
                error: `Failed to update session status: ${statusError instanceof Error ? statusError.message : String(statusError)}`
            };
        }
        
        // Call backend startSession API
        try {
            await startSession(sessionName);
        } catch (apiError) {
            console.error("Error calling backend startSession API:", apiError);
            // Note: We don't revert the status here as the database update succeeded
            // The backend API call is supplementary
            console.warn("Backend startSession API failed, but database status was updated successfully");
        }
        
        return {
            success: true
        };
        
    } catch (error) {
        console.error("Error in startSessionManually:", error);
        return {
            success: false,
            error: `Manual start failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}