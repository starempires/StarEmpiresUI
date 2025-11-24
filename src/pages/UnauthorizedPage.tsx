import { useNavigate, useSearchParams } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import LockIcon from '@mui/icons-material/Lock';

/**
 * UnauthorizedPage component
 * 
 * Displays a user-friendly error message when a user attempts to access
 * an empire they don't have permission to view.
 * 
 * Requirements:
 * - 4.1: Display user-friendly error message
 * - 4.2: Don't expose sensitive information
 * - 4.3: Provide link to return to session view
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get the reason from URL params (if provided)
  const reason = searchParams.get('reason') as 'not_owner' | 'empire_not_found' | 'session_not_found' | null;

  /**
   * Get user-friendly error message based on failure reason
   * Messages are intentionally generic to avoid exposing sensitive information
   */
  const getErrorMessage = (): string => {
    switch (reason) {
      case 'not_owner':
        return 'You do not have permission to access this empire.';
      case 'empire_not_found':
        return 'The requested empire could not be found.';
      case 'session_not_found':
        return 'The requested session could not be found.';
      default:
        return 'You do not have permission to access this page.';
    }
  };

  const handleReturnToSessions = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        p: 3
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          textAlign: 'center'
        }}
      >
        <LockIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2
          }}
        />
        
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {getErrorMessage()}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleReturnToSessions}
          size="large"
        >
          Return to Sessions
        </Button>
      </Paper>
    </Box>
  );
}
