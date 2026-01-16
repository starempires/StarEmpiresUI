/**
 * Overlay Context Analyzer Service
 * 
 * This service analyzes the current cursor position and text content to determine
 * what information should be displayed in the syntax overlay. It detects different
 * line types (blank, comment, command) and extracts relevant context information.
 * 
 * Performance optimizations:
 * - Efficient line parsing with minimal string operations
 * - Caching of frequently accessed line information
 * - Early exit conditions for common cases
 */

import { GrammarService } from './GrammarService';

export interface OverlayContext {
  type: 'all-commands' | 'specific-command' | 'partial-commands' | 'hidden';
  commandName?: string;
  partialCommand?: string;
  matchingCommands?: string[];
  lineContent: string;
  cursorPosition: number;
  lineNumber: number;
}

/**
 * Service for analyzing cursor context to determine overlay content with performance optimizations
 */
export class OverlayContextAnalyzer {
  private grammarService: GrammarService;
  
  // Performance optimization caches
  private lineCache = new Map<string, { lineNumber: number; content: string; type: 'blank' | 'comment' | 'command' | 'other' }>();
  private commandCache = new Map<string, string | null>();
  
  // Performance constants
  private static readonly MAX_CACHE_SIZE = 100;
  private static readonly MAX_LINE_LENGTH_TO_CACHE = 200;

  constructor(grammarService: GrammarService) {
    this.grammarService = grammarService;
  }

  /**
   * Analyze current context to determine overlay content with performance optimizations
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position in the text
   * @returns OverlayContext describing what should be displayed
   */
  public analyzeContext(text: string, cursorPosition: number): OverlayContext {
    try {
      // Input validation
      if (typeof text !== 'string') {
        this.logWarning(`Invalid text input: ${typeof text}`);
        text = '';
      }
      
      if (typeof cursorPosition !== 'number' || cursorPosition < 0) {
        this.logWarning(`Invalid cursor position: ${cursorPosition}`);
        cursorPosition = 0;
      }

      // Fast path: if cursor position is 0 and text is empty, show all commands
      if (cursorPosition === 0 && text.length === 0) {
        return {
          type: 'all-commands',
          lineContent: '',
          cursorPosition: 0,
          lineNumber: 0
        };
      }

      // Clamp cursor position to text length
      if (cursorPosition > text.length) {
        cursorPosition = text.length;
      }

      // Efficient line extraction without splitting entire text
      const { lineNumber, lineContent } = this.getLineInfoAtCursor(text, cursorPosition);
      
      // Check cache for this line content
      const cacheKey = `${lineContent.trim()}_${lineNumber}`;
      const cachedInfo = this.lineCache.get(cacheKey);
      
      let lineType: 'blank' | 'comment' | 'command' | 'other';
      let commandName: string | null = null;
      
      if (cachedInfo && cachedInfo.content === lineContent) {
        // Use cached analysis
        lineType = cachedInfo.type;
        if (lineType === 'command') {
          commandName = this.getCachedCommandName(lineContent);
        }
      } else {
        // Perform analysis and cache result
        lineType = this.analyzeLineType(lineContent);
        
        if (lineType === 'command') {
          commandName = this.extractCommandName(lineContent);
        }
        
        // Cache the result if line is not too long
        if (lineContent.length <= OverlayContextAnalyzer.MAX_LINE_LENGTH_TO_CACHE) {
          this.cacheLineInfo(cacheKey, lineNumber, lineContent, lineType);
        }
      }
      
      // Determine context type based on line analysis
      if (lineType === 'blank' || lineType === 'comment') {
        return {
          type: 'all-commands',
          lineContent,
          cursorPosition,
          lineNumber
        };
      }
      
      if (lineType === 'command' && commandName) {
        // Verify command exists in grammar service
        try {
          const commandExists = this.grammarService.getCommandDefinition(commandName) !== null;
          if (commandExists) {
            return {
              type: 'specific-command',
              commandName,
              lineContent,
              cursorPosition,
              lineNumber
            };
          }
        } catch (grammarError) {
          this.logWarning(`Error checking command definition for ${commandName}`, grammarError);
        }
      }
      
      // Check for partial command matches
      const partialMatch = this.analyzePartialCommand(lineContent);
      if (partialMatch) {
        return {
          type: 'partial-commands',
          partialCommand: partialMatch.partial,
          matchingCommands: partialMatch.matches,
          lineContent,
          cursorPosition,
          lineNumber
        };
      }
      
      // Default to all commands for unrecognized content
      return {
        type: 'all-commands',
        lineContent,
        cursorPosition,
        lineNumber
      };
    } catch (error) {
      this.logError('Error in analyzeContext', error);
      // Return safe fallback context
      return {
        type: 'all-commands',
        lineContent: '',
        cursorPosition: 0,
        lineNumber: 0
      };
    }
  }

  /**
   * Efficiently get line information at cursor position without splitting entire text
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position
   * @returns Line number and content
   */
  private getLineInfoAtCursor(text: string, cursorPosition: number): { lineNumber: number; lineContent: string } {
    try {
      // Find line boundaries efficiently
      let lineStart = 0;
      let lineNumber = 0;
      
      // Find the start of the current line
      for (let i = 0; i < cursorPosition && i < text.length; i++) {
        if (text[i] === '\n') {
          lineStart = i + 1;
          lineNumber++;
        }
      }
      
      // Find the end of the current line
      let lineEnd = text.indexOf('\n', lineStart);
      if (lineEnd === -1) {
        lineEnd = text.length;
      }
      
      const lineContent = text.substring(lineStart, lineEnd);
      
      return { lineNumber, lineContent };
    } catch (error) {
      this.logError('Error in getLineInfoAtCursor', error);
      return { lineNumber: 0, lineContent: '' };
    }
  }

  /**
   * Analyze line type efficiently
   * 
   * @param line - The line content to analyze
   * @returns Line type classification
   */
  private analyzeLineType(line: string): 'blank' | 'comment' | 'command' | 'other' {
    try {
      if (!line || typeof line !== 'string') {
        return 'blank';
      }

      const trimmed = line.trim();
      
      // Fast checks for common cases
      if (trimmed.length === 0) {
        return 'blank';
      }
      
      // Check for comment markers at the start
      const firstChar = trimmed[0];
      if (firstChar === '#' || firstChar === ';') {
        return 'comment';
      }
      
      // Check for '//' comment
      if (trimmed.startsWith('//')) {
        return 'comment';
      }
      
      // Check if first word is a valid command (case-insensitive)
      const spaceIndex = trimmed.indexOf(' ');
      const firstWord = spaceIndex === -1 ? trimmed : trimmed.substring(0, spaceIndex);
      
      // Use grammar service to validate if it's a real command (case-insensitive)
      if (firstWord.length > 0 && /^[A-Za-z][A-Za-z_]*$/.test(firstWord)) {
        const isValidCommand = this.grammarService.getCommandDefinition(firstWord) !== null;
        return isValidCommand ? 'command' : 'other';
      }
      
      return 'other';
    } catch (error) {
      this.logError('Error in analyzeLineType', error);
      return 'other';
    }
  }

  /**
   * Get cached command name or extract and cache it
   * 
   * @param line - The line content
   * @returns Command name if found, null otherwise
   */
  private getCachedCommandName(line: string): string | null {
    try {
      const cacheKey = line.trim();
      const cached = this.commandCache.get(cacheKey);
      
      if (cached !== undefined) {
        return cached;
      }
      
      const commandName = this.extractCommandName(line);
      
      // Cache the result
      if (this.commandCache.size < OverlayContextAnalyzer.MAX_CACHE_SIZE) {
        this.commandCache.set(cacheKey, commandName);
      }
      
      return commandName;
    } catch (error) {
      this.logError('Error in getCachedCommandName', error);
      return null;
    }
  }

  /**
   * Cache line information for performance
   * 
   * @param cacheKey - The cache key
   * @param lineNumber - Line number
   * @param content - Line content
   * @param type - Line type
   */
  private cacheLineInfo(cacheKey: string, lineNumber: number, content: string, type: 'blank' | 'comment' | 'command' | 'other'): void {
    try {
      // Implement simple LRU by removing oldest entries when cache is full
      if (this.lineCache.size >= OverlayContextAnalyzer.MAX_CACHE_SIZE) {
        const firstKey = this.lineCache.keys().next().value;
        if (firstKey) {
          this.lineCache.delete(firstKey);
        }
      }
      
      this.lineCache.set(cacheKey, { lineNumber, content, type });
    } catch (error) {
      this.logError('Error in cacheLineInfo', error);
    }
  }

  /**
   * Check if a line is blank (contains no text or only whitespace)
   * 
   * @param line - The line content to check
   * @returns true if the line is blank
   */
  // private isBlankLine(line: string): boolean {
  //   return line.trim().length === 0;
  // }

  /**
   * Check if a line is a comment line
   * 
   * @param line - The line content to check
   * @returns true if the line is a comment
   */
  // private isCommentLine(line: string): boolean {
  //   const trimmed = line.trim();
  //   return trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith(';');
  // }

  /**
   * Analyze line for partial command matches
   * 
   * @param line - The line content to analyze
   * @returns Partial match information or null if no matches
   */
  private analyzePartialCommand(line: string): { partial: string; matches: string[] } | null {
    try {
      if (!line || typeof line !== 'string') {
        return null;
      }

      const trimmed = line.trim();
      if (trimmed.length === 0) {
        return null;
      }

      // Extract the first word (potential partial command)
      const spaceIndex = trimmed.indexOf(' ');
      const firstWord = spaceIndex === -1 ? trimmed : trimmed.substring(0, spaceIndex);
      
      // Only consider alphabetic words as potential commands
      if (!/^[A-Za-z][A-Za-z_]*$/.test(firstWord)) {
        return null;
      }

      // Get all available commands
      const allCommands = this.grammarService.getAllCommandDefinitions();
      if (!allCommands || allCommands.size === 0) {
        return null;
      }

      // Find commands that start with the partial text (case-insensitive)
      const partialLower = firstWord.toLowerCase();
      const matchingCommands: string[] = [];
      
      for (const [commandName] of allCommands) {
        if (commandName.toLowerCase().startsWith(partialLower)) {
          matchingCommands.push(commandName);
        }
      }

      // Return matches if we found any, but exclude exact matches (those are handled as complete commands)
      if (matchingCommands.length > 0 && !matchingCommands.some(cmd => cmd.toLowerCase() === partialLower)) {
        return {
          partial: firstWord,
          matches: matchingCommands.sort() // Sort for consistent display
        };
      }

      return null;
    } catch (error) {
      this.logError('Error in analyzePartialCommand', error);
      return null;
    }
  }

  /**
   * Extract command name from a line of text
   * 
   * @param line - The line content to analyze
   * @returns The command name if found, null otherwise
   */
  private extractCommandName(line: string): string | null {
    const words = line.trim().split(/\s+/);
    const firstWord = words[0];
    
    if (!firstWord) return null;
    
    // Check if first word is a valid command (case-insensitive)
    const commandDefinition = this.grammarService.getCommandDefinition(firstWord);
    return commandDefinition ? commandDefinition.name : null;
  }

  /**
   * Get the current line number from cursor position efficiently
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position
   * @returns The line number (0-based)
   */
  public getCurrentLineNumber(text: string, cursorPosition: number): number {
    try {
      // Input validation
      if (!text || typeof text !== 'string') {
        return 0;
      }
      
      if (typeof cursorPosition !== 'number' || cursorPosition < 0) {
        return 0;
      }

      let lineNumber = 0;
      
      for (let i = 0; i < cursorPosition && i < text.length; i++) {
        if (text[i] === '\n') {
          lineNumber++;
        }
      }
      
      return lineNumber;
    } catch (error) {
      this.logError('Error in getCurrentLineNumber', error);
      return 0;
    }
  }

  /**
   * Get the current line content from cursor position efficiently
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position
   * @returns The content of the current line
   */
  public getCurrentLineContent(text: string, cursorPosition: number): string {
    try {
      // Input validation
      if (!text || typeof text !== 'string') {
        return '';
      }
      
      if (typeof cursorPosition !== 'number' || cursorPosition < 0) {
        return '';
      }

      const { lineContent } = this.getLineInfoAtCursor(text, cursorPosition);
      return lineContent;
    } catch (error) {
      this.logError('Error in getCurrentLineContent', error);
      return '';
    }
  }

  /**
   * Get cursor position within the current line efficiently
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position
   * @returns The cursor position within the current line (0-based)
   */
  public getCursorPositionInLine(text: string, cursorPosition: number): number {
    try {
      // Input validation
      if (!text || typeof text !== 'string') {
        return 0;
      }
      
      if (typeof cursorPosition !== 'number' || cursorPosition < 0) {
        return 0;
      }

      // Find the start of the current line
      let lineStart = 0;
      
      for (let i = 0; i < cursorPosition && i < text.length; i++) {
        if (text[i] === '\n') {
          lineStart = i + 1;
        }
      }
      
      return Math.max(0, cursorPosition - lineStart);
    } catch (error) {
      this.logError('Error in getCursorPositionInLine', error);
      return 0;
    }
  }

  /**
   * Clear performance caches to free memory
   */
  public clearCaches(): void {
    this.lineCache.clear();
    this.commandCache.clear();
  }

  /**
   * Get cache statistics for performance monitoring
   * 
   * @returns Cache statistics
   */
  public getCacheStats(): { lineCache: number; commandCache: number } {
    return {
      lineCache: this.lineCache.size,
      commandCache: this.commandCache.size
    };
  }

  /**
   * Check if cursor is at the beginning of a line
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position
   * @returns true if cursor is at line start
   */
  public isCursorAtLineStart(text: string, cursorPosition: number): boolean {
    try {
      return this.getCursorPositionInLine(text, cursorPosition) === 0;
    } catch (error) {
      this.logError('Error in isCursorAtLineStart', error);
      return false;
    }
  }

  /**
   * Check if cursor is at the end of a line
   * 
   * @param text - The complete text content
   * @param cursorPosition - Current cursor position
   * @returns true if cursor is at line end
   */
  public isCursorAtLineEnd(text: string, cursorPosition: number): boolean {
    try {
      const currentLineContent = this.getCurrentLineContent(text, cursorPosition);
      const cursorInLine = this.getCursorPositionInLine(text, cursorPosition);
      return cursorInLine === currentLineContent.length;
    } catch (error) {
      this.logError('Error in isCursorAtLineEnd', error);
      return false;
    }
  }

  /**
   * Enhanced error logging with structured logging and debugging support
   */
  private logError(message: string, error?: unknown): void {
    const errorInfo = {
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      service: 'OverlayContextAnalyzer',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      sessionId: this.getSessionId(),
      performanceMetrics: this.getPerformanceSnapshot()
    };
    
    console.error('OverlayContextAnalyzer Error:', errorInfo);
    
    // In production, this could be sent to an error monitoring service
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.sendToErrorMonitoring('OverlayContextAnalyzer', errorInfo);
    }
  }

  /**
   * Enhanced warning logging with context
   */
  private logWarning(message: string, error?: unknown): void {
    const warningInfo = {
      message,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      service: 'OverlayContextAnalyzer',
      sessionId: this.getSessionId(),
      cacheStats: this.getCacheStats()
    };
    
    console.warn('OverlayContextAnalyzer Warning:', warningInfo);
    
    // Track warnings for analytics
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.sendToAnalytics('warning', warningInfo);
    }
  }

  /**
   * Get session ID for tracking user sessions
   */
  private getSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('overlay_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('overlay_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return `fallback_${Date.now()}`;
    }
  }

  /**
   * Get performance snapshot for debugging
   */
  private getPerformanceSnapshot(): object {
    try {
      return {
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null,
        timing: performance.now(),
        cacheStats: this.getCacheStats()
      };
    } catch (error) {
      return { error: 'Performance metrics unavailable' };
    }
  }

  /**
   * Send error information to monitoring service (placeholder)
   */
  private sendToErrorMonitoring(service: string, errorInfo: any): void {
    try {
      // In a real implementation, this would send to a service like Sentry, LogRocket, etc.
      console.log('Would send to error monitoring:', { service, errorInfo });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  /**
   * Send analytics information (placeholder)
   */
  private sendToAnalytics(eventType: string, data: any): void {
    try {
      // In a real implementation, this would send to analytics service
      console.log('Would send to analytics:', { eventType, data });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
}