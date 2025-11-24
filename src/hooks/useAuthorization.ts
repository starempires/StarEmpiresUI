import { useState, useEffect } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { authorizationService, AuthorizationResult } from '../services/AuthorizationService';

/**
 * Result returned by the useAuthorization hook
 */
export interface UseAuthorizationResult {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  authResult?: AuthorizationResult;
}

/**
 * Custom React hook for authorization checks in components
 * 
 * This hook:
 * - Fetches the current user's username from Cognito
 * - Calls AuthorizationService to validate empire access
 * - Manages loading, authorized, and error states
 * - Re-runs authorization when sessionName or empireName changes
 * 
 * @param sessionName - The session name from URL parameters
 * @param empireName - The empire name from URL parameters
 * @returns Authorization state with loading, authorized, and error information
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sessionName, empireName } = useParams();
 *   const { isAuthorized, isLoading, error } = useAuthorization(sessionName, empireName);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthorized) return <div>Unauthorized</div>;
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useAuthorization(
  sessionName: string | undefined,
  empireName: string | undefined
): UseAuthorizationResult {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<AuthorizationResult | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthorization() {
      // Reset state at the start of each check
      setIsLoading(true);
      setError(null);
      setIsAuthorized(false);
      setAuthResult(undefined);

      // Validate required parameters
      if (!sessionName || !empireName) {
        if (isMounted) {
          setError('Missing session or empire name');
          setIsLoading(false);
        }
        return;
      }

      try {
        // Fetch current user's attributes
        const attributes = await fetchUserAttributes();
        const username = attributes.preferred_username;

        if (!username) {
          if (isMounted) {
            setError('User not authenticated');
            setIsLoading(false);
            setAuthResult({
              authorized: false,
              reason: 'not_authenticated',
              redirectTo: '/login'
            });
          }
          return;
        }

        // Perform authorization check
        const result = await authorizationService.canAccessEmpire(
          username,
          sessionName,
          empireName
        );

        if (isMounted) {
          setAuthResult(result);
          setIsAuthorized(result.authorized);
          
          if (!result.authorized) {
            // Set user-friendly error message based on reason
            switch (result.reason) {
              case 'not_authenticated':
                setError('You must be logged in to access this page');
                break;
              case 'not_owner':
                setError('You do not have permission to access this empire');
                break;
              case 'empire_not_found':
                setError('The requested empire could not be found');
                break;
              case 'session_not_found':
                setError('The requested session could not be found');
                break;
              default:
                setError('Authorization check failed');
            }
          }
          
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Authorization check error:', err);
        if (isMounted) {
          setError('An error occurred while checking authorization');
          setIsAuthorized(false);
          setIsLoading(false);
        }
      }
    }

    checkAuthorization();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [sessionName, empireName]); // Re-run when sessionName or empireName changes

  return {
    isAuthorized,
    isLoading,
    error,
    authResult
  };
}
