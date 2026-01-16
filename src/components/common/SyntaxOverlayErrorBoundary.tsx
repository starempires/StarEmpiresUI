import { Component, ErrorInfo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallbackContent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary for SyntaxOverlay Component
 * 
 * This error boundary catches rendering errors in the syntax overlay and provides
 * graceful fallback UI with retry functionality. It prevents overlay errors from
 * crashing the entire OrdersPane component.
 * 
 * Features:
 * - Catches and logs rendering errors
 * - Provides fallback UI with error message
 * - Allows retry with exponential backoff
 * - Maintains overlay functionality even when errors occur
 * - Logs errors for debugging and monitoring
 */
class SyntaxOverlayErrorBoundary extends Component<Props, State> {
  private static readonly MAX_RETRY_COUNT = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second base delay

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging and monitoring
    this.logError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * Log error information for debugging and monitoring
   */
  private logError(error: Error, errorInfo: ErrorInfo): void {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent
    };

    // Log to console for development
    console.error('SyntaxOverlay Error Boundary caught an error:', errorDetails);

    // In production, this could be sent to an error monitoring service
    // if (import.meta.env?.PROD) {
      // Example: Send to error monitoring service
      // errorMonitoringService.logError('SyntaxOverlay', errorDetails);
    // }
  }

  /**
   * Handle retry attempt with exponential backoff
   */
  private handleRetry = (): void => {
    const { retryCount } = this.state;
    
    if (retryCount >= SyntaxOverlayErrorBoundary.MAX_RETRY_COUNT) {
      console.warn('Maximum retry attempts reached for SyntaxOverlay');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = SyntaxOverlayErrorBoundary.RETRY_DELAY_BASE * Math.pow(2, retryCount);
    
    console.log(`Retrying SyntaxOverlay in ${delay}ms (attempt ${retryCount + 1})`);
    
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });
      
      // Call parent retry handler if provided
      this.props.onRetry?.();
    }, delay);
  };

  /**
   * Reset error state (useful for testing or manual recovery)
   */
  public resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback content if provided
      if (this.props.fallbackContent) {
        return this.props.fallbackContent;
      }

      // Default fallback UI
      return (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 280,
            minHeight: 120,
            backgroundColor: 'rgba(255, 245, 245, 0.95)',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            borderRadius: 1,
            padding: 2,
            zIndex: 100,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Error header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              marginBottom: 1
            }}
          >
            <WarningIcon 
              sx={{ 
                color: 'error.main', 
                fontSize: '1.2rem' 
              }} 
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 'bold',
                color: 'error.main',
                fontSize: '0.75rem'
              }}
            >
              Syntax Overlay Error
            </Typography>
          </Box>

          {/* Error message */}
          <Typography
            variant="caption"
            sx={{
              color: 'error.dark',
              fontSize: '0.7rem',
              lineHeight: 1.3,
              marginBottom: 1
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred in the syntax overlay.'}
          </Typography>

          {/* Retry information */}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.65rem',
              marginBottom: 1
            }}
          >
            The overlay will continue to work with basic functionality.
            {this.state.retryCount < SyntaxOverlayErrorBoundary.MAX_RETRY_COUNT && (
              ' You can try to restore full functionality below.'
            )}
          </Typography>

          {/* Retry button */}
          {this.state.retryCount < SyntaxOverlayErrorBoundary.MAX_RETRY_COUNT && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 'auto'
              }}
            >
              <IconButton
                size="small"
                onClick={this.handleRetry}
                sx={{
                  backgroundColor: 'error.main',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  '&:hover': {
                    backgroundColor: 'error.dark'
                  }
                }}
                aria-label="Retry syntax overlay"
              >
                <RefreshIcon fontSize="small" sx={{ marginRight: 0.5 }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                  Retry ({this.state.retryCount + 1}/{SyntaxOverlayErrorBoundary.MAX_RETRY_COUNT})
                </Typography>
              </IconButton>
            </Box>
          )}

          {/* Max retries reached message */}
          {this.state.retryCount >= SyntaxOverlayErrorBoundary.MAX_RETRY_COUNT && (
            <Typography
              variant="caption"
              sx={{
                color: 'error.main',
                fontSize: '0.65rem',
                textAlign: 'center',
                fontWeight: 'bold',
                marginTop: 'auto'
              }}
            >
              Maximum retry attempts reached. Please refresh the page.
            </Typography>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default SyntaxOverlayErrorBoundary;