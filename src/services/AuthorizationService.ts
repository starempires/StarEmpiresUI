import { getEmpire, getGMEmpireForPlayer } from '../components/common/ClientFunctions';

/**
 * Authorization result returned by authorization checks
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: 'not_authenticated' | 'not_owner' | 'session_not_found' | 'empire_not_found';
  redirectTo?: string;
}

/**
 * Authorization Service for validating user access to empire data
 * 
 * This service implements client-side authorization checks to ensure:
 * - Players can only access empires they own
 * - Game Masters can access all empires in their sessions
 * - Unauthorized access is properly denied with clear feedback
 */
export class AuthorizationService {
  /**
   * Validates if the current user can access the specified empire
   * 
   * Authorization is granted if:
   * 1. The user owns the empire (empire.playerName matches username), OR
   * 2. The user is the Game Master for that session
   * 
   * @param username - The authenticated user's username (from Cognito)
   * @param sessionName - The session name from URL
   * @param empireName - The empire name from URL
   * @returns Authorization result with access decision and reason for denial
   */
  async canAccessEmpire(
    username: string,
    sessionName: string,
    empireName: string
  ): Promise<AuthorizationResult> {
    // Check if user is authenticated
    if (!username) {
      return {
        authorized: false,
        reason: 'not_authenticated',
        redirectTo: '/login'
      };
    }

    try {
      // Query for the specific empire using ClientFunctions
      const empire = await getEmpire(sessionName, empireName);

      // Check if empire exists
      if (!empire) {
        return {
          authorized: false,
          reason: 'empire_not_found',
          redirectTo: '/unauthorized'
        };
      }

      // Check if user owns this empire
      if (empire.playerName === username) {
        return {
          authorized: true
        };
      }

      // Check if user is GM for this session
      const isGM = await this.isGameMaster(username, sessionName);
      if (isGM) {
        return {
          authorized: true
        };
      }

      // User is neither owner nor GM
      return {
        authorized: false,
        reason: 'not_owner',
        redirectTo: '/unauthorized'
      };

    } catch (error) {
      console.error('Authorization check failed:', error);
      // Fail closed - deny access on error
      return {
        authorized: false,
        reason: 'not_owner',
        redirectTo: '/unauthorized'
      };
    }
  }

  /**
   * Checks if user is Game Master for a session
   * 
   * A user is considered GM if they have an empire with empireType='GM'
   * in the specified session.
   * 
   * @param username - The authenticated user's username
   * @param sessionName - The session name
   * @returns true if user is GM for this session, false otherwise
   */
  async isGameMaster(
    username: string,
    sessionName: string
  ): Promise<boolean> {
    try {
      // Query for GM empire using ClientFunctions
      const gmEmpire = await getGMEmpireForPlayer(sessionName, username);
      return !!gmEmpire;
    } catch (error) {
      console.error('Error checking GM status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService();
