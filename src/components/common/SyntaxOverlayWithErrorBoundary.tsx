import React, { useCallback } from 'react';
import SyntaxOverlay from './SyntaxOverlay';
import SyntaxOverlayErrorBoundary from './SyntaxOverlayErrorBoundary';
import { OverlayContent } from '../../services/OverlayContentGenerator';

interface SyntaxOverlayWithErrorBoundaryProps {
  visible: boolean;
  content: OverlayContent | null;
  position: { top: number; left: number; width: number; height: number };
  onToggleVisibility: () => void;
  onContentScroll?: (scrollTop: number) => void;
  showToggleFeedback?: boolean;
  scrollPosition?: number;
}

/**
 * SyntaxOverlay wrapped with Error Boundary
 * 
 * This component wraps the SyntaxOverlay with an error boundary to provide
 * graceful error handling and recovery. It ensures that overlay errors don't
 * crash the entire OrdersPane component.
 */
const SyntaxOverlayWithErrorBoundary: React.FC<SyntaxOverlayWithErrorBoundaryProps> = (props) => {
  const handleRetry = useCallback(() => {
    // Force re-render by triggering a state change in parent
    // This could be enhanced to clear caches or reset services
    console.log('Retrying SyntaxOverlay after error');
  }, []);

  return (
    <SyntaxOverlayErrorBoundary onRetry={handleRetry}>
      <SyntaxOverlay {...props} />
    </SyntaxOverlayErrorBoundary>
  );
};

export default SyntaxOverlayWithErrorBoundary;