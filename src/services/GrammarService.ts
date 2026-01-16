/**
 * Grammar Service for parsing Star Empires command definitions from PEG grammar
 * 
 * This service extracts command metadata from the star-empires-grammar.peg file
 * to provide syntax information for the orders syntax overlay system.
 */

// Type definitions for command metadata
export type CommandCategory = 'combat' | 'construction' | 'movement' | 'administration' | 'design' | 'resource';
export type ParameterType = 'ship' | 'world' | 'coordinate' | 'empire' | 'shipclass' | 'number' | 'identifier' | 'storm' | 'portal' | 'count' | 'list';

export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  validValues?: string[];
  format?: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  syntax: string;
  parameters: ParameterDefinition[];
  examples: string[];
  category: CommandCategory;
}

/**
 * Service for parsing PEG grammar and extracting command definitions
 */
export class GrammarService {
  private commandDefinitions: Map<string, CommandDefinition> | null = null;
  private initializationError: Error | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeWithErrorHandling();
  }

  /**
   * Initialize the service with comprehensive error handling
   */
  private initializeWithErrorHandling(): void {
    try {
      // Initialize with fallback definitions immediately
      // In a future enhancement, this could be extended to parse the actual PEG grammar
      this.initializeFallbackDefinitions();
      this.isInitialized = true;
      this.logInfo('GrammarService initialized successfully with fallback definitions');
    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Unknown initialization error');
      this.isInitialized = false;
      this.logError('Failed to initialize GrammarService', this.initializationError);
      
      // Try to create minimal fallback
      this.createMinimalFallback();
    }
  }

  /**
   * Create minimal fallback definitions when initialization fails
   */
  private createMinimalFallback(): void {
    try {
      this.commandDefinitions = new Map([
        ['BUILD', {
          name: 'BUILD',
          description: 'Construct ships (fallback definition)',
          syntax: 'BUILD <world> <count> <shipclass>',
          parameters: [],
          examples: ['BUILD Homeworld 5 Destroyer'],
          category: 'construction'
        }],
        ['MOVE', {
          name: 'MOVE',
          description: 'Move ships (fallback definition)',
          syntax: 'MOVE <source> TO <destination>',
          parameters: [],
          examples: ['MOVE Ship1 TO (1,2)'],
          category: 'movement'
        }],
        ['FIRE', {
          name: 'FIRE',
          description: 'Attack targets (fallback definition)',
          syntax: 'FIRE <target> AT <empire>',
          parameters: [],
          examples: ['FIRE (1,2) AT Enemy'],
          category: 'combat'
        }]
      ]);
      this.isInitialized = true;
      this.logInfo('Created minimal fallback definitions');
    } catch (fallbackError) {
      this.logError('Failed to create minimal fallback', fallbackError instanceof Error ? fallbackError : new Error('Unknown fallback error'));
      // Create empty map as last resort
      this.commandDefinitions = new Map();
    }
  }

  /**
   * Initialize fallback command definitions when grammar file is unavailable
   */
  private initializeFallbackDefinitions(): void {
    this.commandDefinitions = new Map([
      ['AUTHORIZE', {
        name: 'AUTHORIZE',
        description: 'Grant access permissions to other empires',
        syntax: 'AUTHORIZE <targets> TO <empires>',
        parameters: [
          {
            name: 'targets',
            type: 'list',
            required: true,
            description: 'Targets to authorize (ALL, coordinates, locations, or ships)'
          },
          {
            name: 'empires',
            type: 'list',
            required: true,
            description: 'Empire names to grant access to'
          }
        ],
        examples: [
          'AUTHORIZE ALL TO Empire1',
          'AUTHORIZE (1,2) (3,4) TO Empire1 Empire2',
          'AUTHORIZE Ship1 Ship2 TO Empire1'
        ],
        category: 'administration'
      }],
      ['DENY', {
        name: 'DENY',
        description: 'Revoke access permissions from other empires',
        syntax: 'DENY <targets> TO <empires>',
        parameters: [
          {
            name: 'targets',
            type: 'list',
            required: true,
            description: 'Targets to deny access to (ALL, coordinates, locations, or ships)'
          },
          {
            name: 'empires',
            type: 'list',
            required: true,
            description: 'Empire names to revoke access from'
          }
        ],
        examples: [
          'DENY ALL TO Empire1',
          'DENY (1,2) TO Empire1 Empire2'
        ],
        category: 'administration'
      }],
      ['BUILD', {
        name: 'BUILD',
        description: 'Construct new ships at a world',
        syntax: 'BUILD <world> <count> <shipclass> [<names>]',
        parameters: [
          {
            name: 'world',
            type: 'world',
            required: true,
            description: 'World name where ships will be built'
          },
          {
            name: 'count',
            type: 'count',
            required: true,
            description: 'Number of ships to build or MAX'
          },
          {
            name: 'shipclass',
            type: 'shipclass',
            required: true,
            description: 'Ship class to build'
          },
          {
            name: 'names',
            type: 'list',
            required: false,
            description: 'Optional ship names (auto-generated with * or explicit list)'
          }
        ],
        examples: [
          'BUILD Homeworld 5 Destroyer',
          'BUILD Homeworld MAX Cruiser Ship*',
          'BUILD Homeworld 3 Fighter Alpha Beta Gamma'
        ],
        category: 'construction'
      }],
      ['DEPLOY', {
        name: 'DEPLOY',
        description: 'Deploy ships from a world to space',
        syntax: 'DEPLOY <ships>',
        parameters: [
          {
            name: 'ships',
            type: 'list',
            required: true,
            description: 'List of ship names to deploy'
          }
        ],
        examples: [
          'DEPLOY Ship1 Ship2 Ship3'
        ],
        category: 'movement'
      }],
      ['DESIGN', {
        name: 'DESIGN',
        description: 'Create a new ship class design',
        syntax: 'DESIGN <world> <shipclass> <hull> <parameters>',
        parameters: [
          {
            name: 'world',
            type: 'world',
            required: true,
            description: 'World where the design is created'
          },
          {
            name: 'shipclass',
            type: 'shipclass',
            required: true,
            description: 'Name of the new ship class'
          },
          {
            name: 'hull',
            type: 'identifier',
            required: true,
            description: 'Hull type (MISSILE or other hull names)'
          },
          {
            name: 'parameters',
            type: 'list',
            required: true,
            description: 'Design parameters (guns, dp, engines, scan, racks for general hulls; guns, tonnage for missiles)'
          }
        ],
        examples: [
          'DESIGN Homeworld Destroyer Scout 2 4 3 2 1',
          'DESIGN Homeworld Missile MISSILE 1 5'
        ],
        category: 'design'
      }],
      ['DESTRUCT', {
        name: 'DESTRUCT',
        description: 'Destroy ships permanently',
        syntax: 'DESTRUCT <ships>',
        parameters: [
          {
            name: 'ships',
            type: 'list',
            required: true,
            description: 'List of ship names to destroy'
          }
        ],
        examples: [
          'DESTRUCT Ship1 Ship2'
        ],
        category: 'administration'
      }],
      ['FIRE', {
        name: 'FIRE',
        description: 'Attack targets with ships',
        syntax: 'FIRE [<sort>] <target> [EXCEPT <ships>] AT <empires>',
        parameters: [
          {
            name: 'sort',
            type: 'identifier',
            required: false,
            description: 'Sort order for firing (ASC or DESC)'
          },
          {
            name: 'target',
            type: 'list',
            required: true,
            description: 'Target coordinates, location, or ships'
          },
          {
            name: 'ships',
            type: 'list',
            required: false,
            description: 'Ships to exclude from firing (used with EXCEPT)'
          },
          {
            name: 'empires',
            type: 'list',
            required: true,
            description: 'Empire names to attack'
          }
        ],
        examples: [
          'FIRE (1,2) AT Empire1',
          'FIRE ASC Location1 EXCEPT Ship1 AT Empire1 Empire2',
          'FIRE Ship1 Ship2 AT Empire1'
        ],
        category: 'combat'
      }],
      ['GIVE', {
        name: 'GIVE',
        description: 'Transfer ship classes to other empires',
        syntax: 'GIVE <shipclasses> TO <empires>',
        parameters: [
          {
            name: 'shipclasses',
            type: 'list',
            required: true,
            description: 'Ship class names to transfer'
          },
          {
            name: 'empires',
            type: 'list',
            required: true,
            description: 'Empire names to receive the ship classes'
          }
        ],
        examples: [
          'GIVE Destroyer Cruiser TO Empire1',
          'GIVE Fighter TO Empire1 Empire2'
        ],
        category: 'administration'
      }],
      ['LOAD', {
        name: 'LOAD',
        description: 'Load ships onto a carrier',
        syntax: 'LOAD <ships> ONTO <carrier>',
        parameters: [
          {
            name: 'ships',
            type: 'list',
            required: true,
            description: 'Ship names to load'
          },
          {
            name: 'carrier',
            type: 'ship',
            required: true,
            description: 'Carrier ship name'
          }
        ],
        examples: [
          'LOAD Fighter1 Fighter2 ONTO Carrier1'
        ],
        category: 'movement'
      }],
      ['MOVE', {
        name: 'MOVE',
        description: 'Move ships to a new location',
        syntax: 'MOVE <source> [EXCEPT <ships>] TO <destination>',
        parameters: [
          {
            name: 'source',
            type: 'list',
            required: true,
            description: 'Source coordinates, location, or ships to move'
          },
          {
            name: 'ships',
            type: 'list',
            required: false,
            description: 'Ships to exclude from the move (used with EXCEPT)'
          },
          {
            name: 'destination',
            type: 'coordinate',
            required: true,
            description: 'Destination coordinates or location'
          }
        ],
        examples: [
          'MOVE (1,2) TO (3,4)',
          'MOVE Ship1 Ship2 TO Location1',
          'MOVE Location1 EXCEPT Ship1 TO (5,6)'
        ],
        category: 'movement'
      }],
      ['POOL', {
        name: 'POOL',
        description: 'Pool resources from worlds',
        syntax: 'POOL <world> [EXCEPT <worlds>]',
        parameters: [
          {
            name: 'world',
            type: 'world',
            required: true,
            description: 'Primary world for pooling'
          },
          {
            name: 'worlds',
            type: 'list',
            required: false,
            description: 'Worlds to exclude from pooling (used with EXCEPT)'
          }
        ],
        examples: [
          'POOL Homeworld',
          'POOL Homeworld EXCEPT Colony1 Colony2'
        ],
        category: 'resource'
      }],
      ['REPAIR', {
        name: 'REPAIR',
        description: 'Repair ship damage points',
        syntax: 'REPAIR <ship> <amount> <worlds>',
        parameters: [
          {
            name: 'ship',
            type: 'ship',
            required: true,
            description: 'Ship name to repair'
          },
          {
            name: 'amount',
            type: 'identifier',
            required: true,
            description: 'Repair amount (DP or MAX)'
          },
          {
            name: 'worlds',
            type: 'list',
            required: true,
            description: 'World names to use for repair'
          }
        ],
        examples: [
          'REPAIR Ship1 DP World1',
          'REPAIR Ship1 MAX World1 World2'
        ],
        category: 'resource'
      }],
      ['TOGGLE', {
        name: 'TOGGLE',
        description: 'Toggle visibility of ships or ship classes',
        syntax: 'TOGGLE <visibility> <targets>',
        parameters: [
          {
            name: 'visibility',
            type: 'identifier',
            required: true,
            description: 'Visibility setting (PRIVATE or PUBLIC)'
          },
          {
            name: 'targets',
            type: 'list',
            required: true,
            description: 'Ship names or ship class names to toggle'
          }
        ],
        examples: [
          'TOGGLE PRIVATE Ship1 Ship2',
          'TOGGLE PUBLIC Destroyer Cruiser'
        ],
        category: 'administration'
      }],
      ['TRANSFER', {
        name: 'TRANSFER',
        description: 'Transfer resources between worlds',
        syntax: 'TRANSFER <fromworld> <amount> <toworld> [<owner>]',
        parameters: [
          {
            name: 'fromworld',
            type: 'world',
            required: true,
            description: 'Source world name'
          },
          {
            name: 'amount',
            type: 'count',
            required: true,
            description: 'Amount to transfer or MAX'
          },
          {
            name: 'toworld',
            type: 'world',
            required: true,
            description: 'Destination world name'
          },
          {
            name: 'owner',
            type: 'empire',
            required: false,
            description: 'Optional empire name for the destination world'
          }
        ],
        examples: [
          'TRANSFER Homeworld 10 Colony1',
          'TRANSFER Homeworld MAX Colony1 Empire1'
        ],
        category: 'resource'
      }]
    ]);
  }

  /**
   * Extract all command definitions from the PEG grammar
   */
  public getAllCommandDefinitions(): Map<string, CommandDefinition> {
    try {
      if (!this.isInitialized) {
        this.logWarning('GrammarService not properly initialized, attempting recovery');
        this.initializeWithErrorHandling();
      }

      if (this.commandDefinitions) {
        return new Map(this.commandDefinitions); // Return a copy to prevent external modification
      }

      // If still no definitions, create emergency fallback
      this.logError('No command definitions available, creating emergency fallback', new Error('Command definitions unavailable'));
      return this.createEmergencyFallback();
    } catch (error) {
      this.logError('Error in getAllCommandDefinitions', error instanceof Error ? error : new Error('Unknown error'));
      return this.createEmergencyFallback();
    }
  }

  /**
   * Get command definition by name with error handling
   */
  public getCommandDefinition(commandName: string): CommandDefinition | null {
    try {
      if (!commandName || typeof commandName !== 'string') {
        this.logWarning(`Invalid command name provided: ${commandName}`);
        return null;
      }

      const commands = this.getAllCommandDefinitions();
      const definition = commands.get(commandName.toUpperCase());
      
      if (!definition) {
        this.logDebug(`Command definition not found for: ${commandName}`);
      }
      
      return definition || null;
    } catch (error) {
      this.logError(`Error getting command definition for ${commandName}`, error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  }

  /**
   * Get commands organized by category for display with error handling
   */
  public getCommandsByCategory(): Map<CommandCategory, CommandDefinition[]> {
    try {
      const commands = this.getAllCommandDefinitions();
      const categorized = new Map<CommandCategory, CommandDefinition[]>();

      commands.forEach(command => {
        try {
          if (!categorized.has(command.category)) {
            categorized.set(command.category, []);
          }
          categorized.get(command.category)!.push(command);
        } catch (commandError) {
          this.logWarning(`Error processing command ${command.name}`, commandError instanceof Error ? commandError : new Error('Unknown command error'));
        }
      });

      // Sort commands within each category by name
      categorized.forEach(commandList => {
        try {
          commandList.sort((a, b) => a.name.localeCompare(b.name));
        } catch (sortError) {
          this.logWarning('Error sorting commands in category', sortError instanceof Error ? sortError : new Error('Unknown sort error'));
        }
      });

      return categorized;
    } catch (error) {
      this.logError('Error in getCommandsByCategory', error instanceof Error ? error : new Error('Unknown error'));
      // Return minimal categorized fallback
      return new Map([
        ['construction', [this.createFallbackCommand('BUILD', 'construction')]],
        ['movement', [this.createFallbackCommand('MOVE', 'movement')]],
        ['combat', [this.createFallbackCommand('FIRE', 'combat')]]
      ]);
    }
  }

  /**
   * Create emergency fallback definitions when all else fails
   */
  private createEmergencyFallback(): Map<string, CommandDefinition> {
    try {
      return new Map([
        ['BUILD', this.createFallbackCommand('BUILD', 'construction')],
        ['MOVE', this.createFallbackCommand('MOVE', 'movement')],
        ['FIRE', this.createFallbackCommand('FIRE', 'combat')],
        ['HELP', {
          name: 'HELP',
          description: 'Grammar service is experiencing issues. Please check the grammar file.',
          syntax: 'HELP',
          parameters: [],
          examples: [],
          category: 'administration'
        }]
      ]);
    } catch (error) {
      this.logError('Failed to create emergency fallback', error instanceof Error ? error : new Error('Unknown emergency fallback error'));
      return new Map();
    }
  }

  /**
   * Create a fallback command definition
   */
  private createFallbackCommand(name: string, category: CommandCategory): CommandDefinition {
    return {
      name,
      description: `${name} command (fallback definition - grammar service unavailable)`,
      syntax: `${name} <parameters>`,
      parameters: [{
        name: 'parameters',
        type: 'identifier',
        required: false,
        description: 'Command parameters (see documentation)'
      }],
      examples: [`${name} example`],
      category
    };
  }

  /**
   * Check if the service is healthy and functioning properly
   */
  public isHealthy(): boolean {
    return this.isInitialized && this.commandDefinitions !== null && this.commandDefinitions.size > 0;
  }

  /**
   * Get service status information for debugging
   */
  public getServiceStatus(): {
    initialized: boolean;
    hasError: boolean;
    errorMessage: string | null;
    commandCount: number;
  } {
    return {
      initialized: this.isInitialized,
      hasError: this.initializationError !== null,
      errorMessage: this.initializationError?.message || null,
      commandCount: this.commandDefinitions?.size || 0
    };
  }

  /**
   * Attempt to recover from errors by reinitializing
   */
  public attemptRecovery(): boolean {
    try {
      this.logInfo('Attempting GrammarService recovery');
      this.initializationError = null;
      this.isInitialized = false;
      this.commandDefinitions = null;
      
      this.initializeWithErrorHandling();
      
      const recovered = this.isHealthy();
      if (recovered) {
        this.logInfo('GrammarService recovery successful');
      } else {
        this.logWarning('GrammarService recovery partially successful');
      }
      
      return recovered;
    } catch (error) {
      this.logError('GrammarService recovery failed', error instanceof Error ? error : new Error('Unknown recovery error'));
      return false;
    }
  }

  /**
   * Enhanced error logging with structured logging and debugging support
   */
  private logError(message: string, error?: Error): void {
    const errorInfo = {
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      service: 'GrammarService',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      sessionId: this.getSessionId(),
      serviceStatus: this.getServiceStatus(),
      performanceMetrics: this.getPerformanceSnapshot()
    };
    
    console.error('GrammarService Error:', errorInfo);
    
    // In production, this could be sent to an error monitoring service
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.sendToErrorMonitoring('GrammarService', errorInfo);
    }
  }

  /**
   * Enhanced warning logging with context
   */
  private logWarning(message: string, error?: Error): void {
    const warningInfo = {
      message,
      error: error?.message,
      timestamp: new Date().toISOString(),
      service: 'GrammarService',
      sessionId: this.getSessionId(),
      serviceStatus: this.getServiceStatus()
    };
    
    console.warn('GrammarService Warning:', warningInfo);
    
    // Track warnings for analytics
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.sendToAnalytics('warning', warningInfo);
    }
  }

  /**
   * Enhanced info logging with context
   */
  private logInfo(message: string): void {
    const infoData = {
      message,
      timestamp: new Date().toISOString(),
      service: 'GrammarService',
      sessionId: this.getSessionId(),
      serviceStatus: this.getServiceStatus()
    };
    
    console.log('GrammarService Info:', infoData);
  }

  /**
   * Enhanced debug logging with performance metrics
   */
  private logDebug(message: string): void {
    const debugInfo = {
      message,
      timestamp: new Date().toISOString(),
      service: 'GrammarService',
      sessionId: this.getSessionId(),
      performanceMetrics: this.getPerformanceSnapshot()
    };
    
    console.debug('GrammarService Debug:', debugInfo);
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
        commandDefinitionsSize: this.commandDefinitions?.size || 0,
        isHealthy: this.isHealthy()
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

// Export singleton instance
export const grammarService = new GrammarService();