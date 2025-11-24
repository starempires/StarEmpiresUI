import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuthorization } from '../../hooks/useAuthorization';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

/**
 * Props for the ProtectedRoute component
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  requiresEmpireAccess?: boolean;
  staticPage?: boolean;
}

/**
 * ProtectedRoute component
 * 
 * Wrapper component for routes requiring authentication and/or empire authorization.
 * 
 * Behavior:
 * - If staticPage=true: Only checks authentication, allows access if authenticated
 * - If requiresEmpireAccess=true: Performs full empire authorization check
 * - Shows loading state during authorization check
 * - Redirects to UnauthorizedPage if authorization fails
 * - Redirects to login if not authenticated (handled by Amplify Authenticator)
 * 
 * Requirements:
 * - 1.1: Verify player controls empire
 * - 1.2: Deny access to non-owned empires
 * - 3.1: Perform authorization on every page load
 * - 7.1, 7.2, 7.4: Redirect unauthenticated users
 * - 8.1, 8.2, 8.3: Handle static pages vs empire pages
 * 
 * @example
 * ```tsx
 * // Empire-specific route
 * <Route path="/session/:sessionName/:empireName/:turnNumber" element={
 *   <ProtectedRoute requiresEmpireAccess={true}>
 *     <MapPage />
 *   </ProtectedRoute>
 * } />
 * 
 * // Static page route
 * <Route path="/ship-design" element={
 *   <ProtectedRoute staticPage={true}>
 *     <ShipDesignPage />
 *   </ProtectedRoute>
 * } />
 * 
 * // Authentication-only route
 * <Route path="/" element={
 *   <ProtectedRoute>
 *     <HomePage />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export function ProtectedRoute({
  children,
  requiresEmpireAccess = false,
  staticPage = false
}: ProtectedRouteProps) {
  const params = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState<boolean>(false);

  // Extract sessionName and empireName from URL params for empire pages
  const sessionName = params.sessionName;
  const empireName = params.empireName;

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const attributes = await fetchUserAttributes();
        setIsAuthenticated(!!attributes.preferred_username);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthCheckComplete(true);
      }
    }

    checkAuth();
  }, []);

  // Use authorization hook for empire access validation
  // Only pass session/empire names if this is an empire page (not static, requires empire access)
  const { isAuthorized, isLoading, authResult } = useAuthorization(
    requiresEmpireAccess && !staticPage ? sessionName : undefined,
    requiresEmpireAccess && !staticPage ? empireName : undefined
  );

  // Show loading state while checking authentication
  if (!authCheckComplete) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, the Amplify Authenticator will handle the redirect
  // But we still check here for completeness
  if (!isAuthenticated) {
    // The Authenticator wrapper should prevent this, but just in case
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          gap: 2
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Please log in to continue
        </Typography>
      </Box>
    );
  }

  // For static pages, only authentication is required
  if (staticPage) {
    return <>{children}</>;
  }

  // For pages that don't require empire access, just render children
  if (!requiresEmpireAccess) {
    return <>{children}</>;
  }

  // Show loading state during authorization check
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verifying access...
        </Typography>
      </Box>
    );
  }

  // If authorization failed, redirect to unauthorized page with reason
  if (!isAuthorized) {
    const reason = authResult?.reason || 'not_owner';
    return <Navigate to={`/unauthorized?reason=${reason}`} replace />;
  }

  // Authorization successful, render protected content
  return <>{children}</>;
}
