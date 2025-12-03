import { useState, useEffect } from 'react';
import { getGMEmpireForPlayer } from '../components/common/ClientFunctions';

/**
 * Result returned by the useSessionAccess hook
 */
export interface SessionAccessResult {
  canAccessMap: boolean;
  showWaitingMessage: boolean;
  waitingMessageText?: string;
  isGM: boolean;
}

/**
 * Custom React hook for session access control
 * 
 * This hook determines what access a player has to empire maps based on:
 * - Player role (GM vs non-GM)
 * - Session status (WAITING_FOR_PLAYERS, READY_TO_START, IN_PROGRESS)
 * 
 * Access rules:
 * - GM always has access to maps in all statuses
 * - Non-GM players have access only when session is IN_PROGRESS
 * - Non-GM players see waiting message when session is READY_TO_START
 * 
 * @param sessionName - The session name
 * @param empireName - The empire name
 * @param sessionStatus - The current session status
 * @param playerName - The player's username
 * @returns Access control information with canAccessMap, showWaitingMessage, waitingMessageText, and isGM
 * 
 * @example
 * ```tsx
 * function SessionTableRow({ session, playerName }) {
 *   const { canAccessMap, showWaitingMessage, waitingMessageText, isGM } = 
 *     useSessionAccess(session.name, empireName, session.status, playerName);
 *   
 *   if (showWaitingMessage) {
 *     return <div>{waitingMessageText}</div>;
 *   }
 *   
 *   if (canAccessMap) {
 *     return <Link to={`/map/${session.name}/${empireName}`}>View Map</Link>;
 *   }
 *   
 *   return null;
 * }
 * ```
 */
export function useSessionAccess(
  sessionName: string | undefined,
  empireName: string | undefined,
  sessionStatus: string | undefined,
  playerName: string | undefined
): SessionAccessResult {
  const [isGM, setIsGM] = useState<boolean>(false);
  const [canAccessMap, setCanAccessMap] = useState<boolean>(false);
  const [showWaitingMessage, setShowWaitingMessage] = useState<boolean>(false);
  const [waitingMessageText, setWaitingMessageText] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      // Reset state
      setIsGM(false);
      setCanAccessMap(false);
      setShowWaitingMessage(false);
      setWaitingMessageText(undefined);

      // Validate required parameters
      if (!sessionName || !empireName || !sessionStatus || !playerName) {
        return;
      }

      try {
        // Check if player is GM for this session
        const gmEmpire = await getGMEmpireForPlayer(sessionName, playerName);
        const playerIsGM = !!gmEmpire;

        if (!isMounted) return;

        setIsGM(playerIsGM);

        // Determine access based on role and session status
        if (playerIsGM) {
          // GM always has access
          setCanAccessMap(true);
          setShowWaitingMessage(false);
        } else if (sessionStatus === 'IN_PROGRESS') {
          // Non-GM has access when session is in progress
          setCanAccessMap(true);
          setShowWaitingMessage(false);
        } else if (sessionStatus === 'READY_TO_START') {
          // Non-GM sees waiting message when session is ready but not started
          setCanAccessMap(false);
          setShowWaitingMessage(true);
          setWaitingMessageText('Waiting for GM to start session');
        } else {
          // All other cases: no access, no message
          setCanAccessMap(false);
          setShowWaitingMessage(false);
        }
      } catch (error) {
        console.error('Error checking session access:', error);
        if (isMounted) {
          // On error, deny access
          setIsGM(false);
          setCanAccessMap(false);
          setShowWaitingMessage(false);
        }
      }
    }

    checkAccess();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [sessionName, empireName, sessionStatus, playerName]);

  return {
    canAccessMap,
    showWaitingMessage,
    waitingMessageText,
    isGM
  };
}
