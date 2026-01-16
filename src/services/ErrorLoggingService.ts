/**
 * Comprehensive Error Logging and Debugging Service
 * 
 * This service provides structured error logging, performance monitoring,
 * and debugging support for the syntax overlay system. It includes
 * session tracking, performance metrics, and integration points for
 * external monitoring services.
 */

export interface LogContext {
  service: string;
  sessionId: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  performanceMetrics?: any;
  additionalData?: any;
}

export interface ErrorLogEntry extends LogContext {
  message: string;
  error?: string;
  stack?: string;
  level: 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Centralized error logging and debugging service
 */
export class ErrorLoggingService {
  private static instance: ErrorLoggingService | null = null;
  private sessionId: string;
  private logBuffer: ErrorLogEntry[] = [];
  private maxBufferSize = 100;
  private isProduction: boolean;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    
    // Set up periodic log flushing in production
    if (this.isProduction) {
      setInterval(() => this.flushLogs(), 30000); // Flush every 30 seconds
    }
    
    // Set up error event listeners
    this.setupGlobalErrorHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  /**
   * Log error with comprehensive context
   */
  public logError(service: string, message: string, error?: unknown, additionalData?: any): void {
    const logEntry: ErrorLogEntry = {
      level: 'error',
      service,
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      performanceMetrics: this.getPerformanceSnapshot(),
      additionalData
    };

    console.error(`${service} Error:`, logEntry);
    this.addToBuffer(logEntry);

    // Send critical errors immediately in production
    if (this.isProduction && this.isCriticalError(error)) {
      this.sendToErrorMonitoring(logEntry);
    }
  }

  /**
   * Log warning with context
   */
  public logWarning(service: string, message: string, error?: unknown, additionalData?: any): void {
    const logEntry: ErrorLogEntry = {
      level: 'warning',
      service,
      message,
      error: error instanceof Error ? error.message : String(error),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      performanceMetrics: this.getPerformanceSnapshot(),
      additionalData
    };

    console.warn(`${service} Warning:`, logEntry);
    this.addToBuffer(logEntry);
  }

  /**
   * Log info with context
   */
  public logInfo(service: string, message: string, additionalData?: any): void {
    const logEntry: ErrorLogEntry = {
      level: 'info',
      service,
      message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      additionalData
    };

    console.log(`${service} Info:`, logEntry);
    this.addToBuffer(logEntry);
  }

  /**
   * Log debug information with performance metrics
   */
  public logDebug(service: string, message: string, additionalData?: any): void {
    const logEntry: ErrorLogEntry = {
      level: 'debug',
      service,
      message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      performanceMetrics: this.getPerformanceSnapshot(),
      additionalData
    };

    console.debug(`${service} Debug:`, logEntry);
    
    // Only buffer debug logs in development
    if (!this.isProduction) {
      this.addToBuffer(logEntry);
    }
  }

  /**
   * Log performance metrics
   */
  public logPerformance(service: string, operation: string, duration: number, additionalData?: any): void {
    const logEntry: ErrorLogEntry = {
      level: 'info',
      service,
      message: `Performance: ${operation} took ${duration.toFixed(2)}ms`,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      performanceMetrics: {
        operation,
        duration,
        ...this.getPerformanceSnapshot()
      },
      additionalData
    };

    // Log performance warnings for slow operations
    if (duration > 100) {
      console.warn(`${service} Performance Warning:`, logEntry);
    } else {
      console.debug(`${service} Performance:`, logEntry);
    }

    this.addToBuffer(logEntry);
  }

  /**
   * Get current session logs
   */
  public getSessionLogs(): ErrorLogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Get logs filtered by service
   */
  public getServiceLogs(service: string): ErrorLogEntry[] {
    return this.logBuffer.filter(entry => entry.service === service);
  }

  /**
   * Get logs filtered by level
   */
  public getLogsByLevel(level: 'error' | 'warning' | 'info' | 'debug'): ErrorLogEntry[] {
    return this.logBuffer.filter(entry => entry.level === level);
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      logs: this.logBuffer
    }, null, 2);
  }

  /**
   * Clear log buffer
   */
  public clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): {
    sessionId: string;
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    debugCount: number;
    sessionDuration: number;
  } {
    const errorCount = this.logBuffer.filter(log => log.level === 'error').length;
    const warningCount = this.logBuffer.filter(log => log.level === 'warning').length;
    const infoCount = this.logBuffer.filter(log => log.level === 'info').length;
    const debugCount = this.logBuffer.filter(log => log.level === 'debug').length;

    const sessionStart = this.logBuffer.length > 0 ? new Date(this.logBuffer[0].timestamp).getTime() : Date.now();
    const sessionDuration = Date.now() - sessionStart;

    return {
      sessionId: this.sessionId,
      totalLogs: this.logBuffer.length,
      errorCount,
      warningCount,
      infoCount,
      debugCount,
      sessionDuration
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('overlay_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('overlay_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get performance snapshot
   */
  private getPerformanceSnapshot(): any {
    try {
      const snapshot: any = {
        timestamp: performance.now(),
        timeOrigin: performance.timeOrigin
      };

      // Add memory information if available
      if ((performance as any).memory) {
        snapshot.memory = {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }

      // Add navigation timing if available
      if (performance.getEntriesByType) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          snapshot.navigation = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            domInteractive: navigation.domInteractive - navigation.startTime
          };
        }
      }

      return snapshot;
    } catch (error) {
      return { error: 'Performance metrics unavailable' };
    }
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(logEntry: ErrorLogEntry): void {
    this.logBuffer.push(logEntry);

    // Maintain buffer size limit
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Check if error is critical and needs immediate attention
   */
  private isCriticalError(error: unknown): boolean {
    if (error instanceof Error) {
      const criticalPatterns = [
        /memory/i,
        /network/i,
        /security/i,
        /authentication/i,
        /authorization/i
      ];
      
      return criticalPatterns.some(pattern => 
        pattern.test(error.message) || (error.stack && pattern.test(error.stack))
      );
    }
    return false;
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    try {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logError('Global', 'Unhandled promise rejection', event.reason, {
          promise: event.promise,
          type: 'unhandledrejection'
        });
      });

      // Handle global JavaScript errors
      window.addEventListener('error', (event) => {
        this.logError('Global', 'Global JavaScript error', event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'error'
        });
      });
    } catch (error) {
      console.error('Failed to set up global error handlers:', error);
    }
  }

  /**
   * Flush logs to external service
   */
  private flushLogs(): void {
    if (this.logBuffer.length === 0) return;

    try {
      // In production, send logs to monitoring service
      if (this.isProduction) {
        this.sendLogsToService([...this.logBuffer]);
      }

      // Clear buffer after successful flush
      this.clearLogs();
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Send error to monitoring service (placeholder)
   */
  private sendToErrorMonitoring(logEntry: ErrorLogEntry): void {
    try {
      // In a real implementation, this would send to a service like Sentry, LogRocket, etc.
      // Example: Sentry.captureException(new Error(logEntry.message), { extra: logEntry });
      console.log('Would send to error monitoring:', logEntry);
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  /**
   * Send logs to external service (placeholder)
   */
  private sendLogsToService(logs: ErrorLogEntry[]): void {
    try {
      // In a real implementation, this would send to a logging service
      // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(logs) });
      console.log('Would send logs to service:', { count: logs.length, sessionId: this.sessionId });
    } catch (error) {
      console.error('Failed to send logs to service:', error);
    }
  }
}

// Export singleton instance
export const errorLoggingService = ErrorLoggingService.getInstance();

// Export convenience functions
export const logError = (service: string, message: string, error?: unknown, additionalData?: any) => 
  errorLoggingService.logError(service, message, error, additionalData);

export const logWarning = (service: string, message: string, error?: unknown, additionalData?: any) => 
  errorLoggingService.logWarning(service, message, error, additionalData);

export const logInfo = (service: string, message: string, additionalData?: any) => 
  errorLoggingService.logInfo(service, message, additionalData);

export const logDebug = (service: string, message: string, additionalData?: any) => 
  errorLoggingService.logDebug(service, message, additionalData);

export const logPerformance = (service: string, operation: string, duration: number, additionalData?: any) => 
  errorLoggingService.logPerformance(service, operation, duration, additionalData);