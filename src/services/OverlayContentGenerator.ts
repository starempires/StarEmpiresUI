/**
 * Overlay Content Generator Service
 * 
 * This service generates formatted content for the syntax overlay based on the current
 * context. It creates structured content for both all-commands display and specific
 * command syntax display, organizing information in a user-friendly format.
 * 
 * Performance optimizations:
 * - Lazy loading of command categories
 * - Content size limits for large command sets
 * - Efficient content generation with minimal allocations
 */

import { GrammarService, CommandCategory } from './GrammarService';

export interface OverlayContent {
  type: 'all-commands' | 'specific-command' | 'partial-commands';
  title: string;
  sections: OverlaySection[];
  scrollable: boolean;
}

export interface OverlaySection {
  title?: string;
  content: OverlayItem[];
  collapsible?: boolean;
  expanded?: boolean;
}

export interface OverlayItem {
  type: 'command' | 'syntax' | 'parameter' | 'example' | 'description';
  content: string;
  highlight?: boolean;
  indent?: number;
}

/**
 * Service for generating formatted overlay content with performance optimizations
 */
export class OverlayContentGenerator {
  private grammarService: GrammarService;
  
  // Performance optimization constants
  private static readonly MAX_COMMANDS_PER_CATEGORY = 20;
  private static readonly MAX_TOTAL_COMMANDS = 100;
  private static readonly MAX_CONTENT_LENGTH = 10000; // characters
  
  // Cache for expensive operations
  private categoryTitleCache = new Map<CommandCategory, string>();
  private commandCountCache = new Map<CommandCategory, number>();

  constructor(grammarService: GrammarService) {
    this.grammarService = grammarService;
  }

  /**
   * Generate content for all commands display with performance optimizations
   * 
   * This method creates a comprehensive overview of all available commands,
   * organized by category with brief descriptions and syntax hints.
   * Optimized for large command sets by limiting content size and using lazy loading.
   * Enhanced with error handling and graceful degradation.
   * 
   * @returns OverlayContent for all commands display
   */
  public generateAllCommandsContent(): OverlayContent {
    const startTime = performance.now();
    
    try {
      // Check if grammar service is healthy
      if (!this.grammarService.isHealthy()) {
        this.logWarning('Grammar service is not healthy, generating degraded content');
        return this.generateDegradedAllCommandsContent();
      }

      const commandsByCategory = this.grammarService.getCommandsByCategory();
      const sections: OverlaySection[] = [];
      let totalCommands = 0;
      let totalContentLength = 0;

      // Sort categories for consistent display order
      const categoryOrder: CommandCategory[] = [
        'combat',
        'movement', 
        'construction',
        'design',
        'resource',
        'administration'
      ];

      // Pre-calculate command counts for performance monitoring
      const totalAvailableCommands = Array.from(commandsByCategory.values())
        .reduce((sum, commands) => sum + commands.length, 0);

      categoryOrder.forEach(category => {
        try {
          const commands = commandsByCategory.get(category);
          if (!commands || commands.length === 0) return;

          // Limit commands per category for performance
          const limitedCommands = commands.slice(0, OverlayContentGenerator.MAX_COMMANDS_PER_CATEGORY);
          const isLimited = limitedCommands.length < commands.length;

          const categorySection: OverlaySection = {
            title: this.getCachedCategoryTitle(category),
            content: [],
            collapsible: true,
            expanded: true
          };

          limitedCommands.forEach((command, index) => {
            try {
              // Check content length limits
              const commandContent = `${command.name} - ${command.description}`;
              const syntaxContent = command.syntax;
              
              if (totalContentLength + commandContent.length + syntaxContent.length > OverlayContentGenerator.MAX_CONTENT_LENGTH) {
                // Add truncation notice and stop
                categorySection.content.push({
                  type: 'description',
                  content: `... and ${commands.length - index} more commands (content truncated for performance)`,
                  highlight: true
                });
                return; // Exit this iteration, but continue with other categories
              }

              // Add command name and description
              categorySection.content.push({
                type: 'command',
                content: commandContent,
                highlight: false
              });
              
              // Add syntax with indentation
              categorySection.content.push({
                type: 'syntax',
                content: syntaxContent,
                indent: 1
              });

              totalContentLength += commandContent.length + syntaxContent.length;
              totalCommands++;

              // Add spacing between commands for readability (except for last command)
              if (index < limitedCommands.length - 1) {
                categorySection.content.push({
                  type: 'description',
                  content: '',
                  indent: 0
                });
              }

              // Stop if we've reached the total command limit
              if (totalCommands >= OverlayContentGenerator.MAX_TOTAL_COMMANDS) {
                return; // Exit this iteration
              }
            } catch (commandError) {
              this.logWarning(`Error processing command ${command.name}`, commandError);
              // Continue with next command
            }
          });

          // Add notice if commands were limited
          if (isLimited) {
            categorySection.content.push({
              type: 'description',
              content: `... and ${commands.length - limitedCommands.length} more ${category} commands`,
              highlight: false,
              indent: 0
            });
          }

          if (categorySection.content.length > 0) {
            sections.push(categorySection);
          }

          // Stop processing if we've reached limits
          if (totalCommands >= OverlayContentGenerator.MAX_TOTAL_COMMANDS) {
            sections.push({
              title: 'Performance Notice',
              content: [{
                type: 'description',
                content: `Showing ${totalCommands} of ${totalAvailableCommands} available commands for optimal performance.`,
                highlight: true
              }]
            });
            return;
          }
        } catch (categoryError) {
          this.logWarning(`Error processing category ${category}`, categoryError);
          // Continue with next category
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log performance metrics for monitoring
      if (duration > 50) { // Log if generation takes more than 50ms
        console.warn(`All commands content generation took ${duration.toFixed(2)}ms for ${totalCommands} commands`);
      }

      return {
        type: 'all-commands',
        title: `Available Commands (${totalCommands}${totalCommands < totalAvailableCommands ? `/${totalAvailableCommands}` : ''})`,
        sections,
        scrollable: true
      };
    } catch (error) {
      this.logError('Error generating all commands content', error);
      return this.generateErrorContent('Failed to load command information');
    }
  }

  /**
   * Generate content for specific command display with performance optimizations
   * 
   * This method creates detailed syntax information for a specific command,
   * including parameters, descriptions, and examples. Optimized to limit
   * content size for commands with many parameters.
   * Enhanced with error handling and graceful degradation.
   * 
   * @param commandName - The name of the command to display
   * @returns OverlayContent for specific command display
   */
  public generateCommandContent(commandName: string): OverlayContent {
    const startTime = performance.now();
    
    try {
      if (!commandName || typeof commandName !== 'string') {
        this.logWarning(`Invalid command name provided: ${commandName}`);
        return this.generateAllCommandsContent();
      }

      // Check if grammar service is healthy
      if (!this.grammarService.isHealthy()) {
        this.logWarning('Grammar service is not healthy, generating degraded content');
        return this.generateDegradedCommandContent(commandName);
      }

      const command = this.grammarService.getCommandDefinition(commandName);
      
      if (!command) {
        this.logDebug(`Command definition not found for: ${commandName}`);
        // Fallback to all commands if command not found
        return this.generateAllCommandsContent();
      }

      const sections: OverlaySection[] = [];
      let contentLength = 0;

      // Syntax section - always first and highlighted
      try {
        const syntaxContent = command.syntax || `${commandName} <parameters>`;
        sections.push({
          title: 'Syntax',
          content: [
            {
              type: 'syntax',
              content: syntaxContent,
              highlight: true
            }
          ]
        });
        contentLength += syntaxContent.length;
      } catch (syntaxError) {
        this.logWarning(`Error processing syntax for ${commandName}`, syntaxError);
        sections.push({
          title: 'Syntax',
          content: [
            {
              type: 'syntax',
              content: `${commandName} (syntax unavailable)`,
              highlight: true
            }
          ]
        });
      }

      // Description section
      try {
        const descriptionContent = command.description || 'No description available';
        sections.push({
          title: 'Description',
          content: [
            {
              type: 'description',
              content: descriptionContent
            }
          ]
        });
        contentLength += descriptionContent.length;
      } catch (descriptionError) {
        this.logWarning(`Error processing description for ${commandName}`, descriptionError);
      }

      // Parameters section - only if command has parameters, with limits for performance
      if (command.parameters && command.parameters.length > 0) {
        try {
          const parameterSection: OverlaySection = {
            title: 'Parameters',
            content: []
          };

          // Limit parameters shown for performance (show most important first)
          const maxParameters = 10;
          const parametersToShow = command.parameters
            .sort((a, b) => {
              // Sort required parameters first
              if (a.required && !b.required) return -1;
              if (!a.required && b.required) return 1;
              return 0;
            })
            .slice(0, maxParameters);

          parametersToShow.forEach((param, index) => {
            try {
              const requiredText = param.required ? 'Required' : 'Optional';
              const typeText = param.type ? param.type.charAt(0).toUpperCase() + param.type.slice(1) : 'Unknown';
              
              // Parameter name and type
              const paramContent = `${param.name || 'unnamed'} (${typeText}) - ${requiredText}`;
              parameterSection.content.push({
                type: 'parameter',
                content: paramContent,
                highlight: param.required
              });
              contentLength += paramContent.length;
              
              // Parameter description with indentation (truncate if too long)
              const maxDescLength = 200;
              const description = param.description || 'No description available';
              const truncatedDescription = description.length > maxDescLength 
                ? description.substring(0, maxDescLength) + '...'
                : description;
                
              parameterSection.content.push({
                type: 'description',
                content: truncatedDescription,
                indent: 1
              });
              contentLength += truncatedDescription.length;

              // Add valid values if specified (limit to first 5 for performance)
              if (param.validValues && param.validValues.length > 0) {
                const maxValues = 5;
                const valuesToShow = param.validValues.slice(0, maxValues);
                const valuesText = valuesToShow.join(', ') + 
                  (param.validValues.length > maxValues ? `, ... and ${param.validValues.length - maxValues} more` : '');
                
                parameterSection.content.push({
                  type: 'description',
                  content: `Valid values: ${valuesText}`,
                  indent: 1
                });
                contentLength += valuesText.length;
              }

              // Add format information if specified
              if (param.format) {
                parameterSection.content.push({
                  type: 'description',
                  content: `Format: ${param.format}`,
                  indent: 1
                });
                contentLength += param.format.length;
              }

              // Add spacing between parameters (except for the last one)
              if (index < parametersToShow.length - 1) {
                parameterSection.content.push({
                  type: 'description',
                  content: '',
                  indent: 0
                });
              }

              // Stop if content is getting too large
              if (contentLength > OverlayContentGenerator.MAX_CONTENT_LENGTH) {
                parameterSection.content.push({
                  type: 'description',
                  content: '... (content truncated for performance)',
                  highlight: true,
                  indent: 0
                });
                return; // Exit this iteration
              }
            } catch (paramError) {
              this.logWarning(`Error processing parameter ${param.name} for ${commandName}`, paramError);
              // Continue with next parameter
            }
          });

          // Add notice if parameters were limited
          if (command.parameters.length > maxParameters) {
            parameterSection.content.push({
              type: 'description',
              content: `... and ${command.parameters.length - maxParameters} more parameters`,
              highlight: false,
              indent: 0
            });
          }

          if (parameterSection.content.length > 0) {
            sections.push(parameterSection);
          }
        } catch (parametersError) {
          this.logWarning(`Error processing parameters for ${commandName}`, parametersError);
        }
      }

      // Examples section - only if examples are available and content isn't too large
      if (command.examples && command.examples.length > 0 && contentLength < OverlayContentGenerator.MAX_CONTENT_LENGTH) {
        try {
          // Limit examples for performance
          const maxExamples = 3;
          const examplesToShow = command.examples.slice(0, maxExamples);
          
          const exampleSection: OverlaySection = {
            title: 'Examples',
            content: examplesToShow.map((example) => ({
              type: 'example',
              content: example && example.length > 100 ? example.substring(0, 100) + '...' : example || 'No example available',
              indent: 0
            }))
          };

          // Add notice if examples were limited
          if (command.examples.length > maxExamples) {
            exampleSection.content.push({
              type: 'description',
              content: `... and ${command.examples.length - maxExamples} more examples`,
              highlight: false,
              indent: 0
            });
          }

          sections.push(exampleSection);
        } catch (examplesError) {
          this.logWarning(`Error processing examples for ${commandName}`, examplesError);
        }
      }

      // Determine if content should be scrollable based on size
      const shouldScroll = sections.length > 2 || 
                          (command.parameters && command.parameters.length > 3) || 
                          (command.examples && command.examples.length > 2) ||
                          contentLength > 2000;

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log performance metrics
      if (duration > 25) { // Log if generation takes more than 25ms
        console.warn(`Command content generation for '${commandName}' took ${duration.toFixed(2)}ms`);
      }

      return {
        type: 'specific-command',
        title: `${command.name} Command`,
        sections,
        scrollable: shouldScroll
      };
    } catch (error) {
      this.logError(`Error generating command content for ${commandName}`, error);
      return this.generateErrorContent(`Failed to load information for command: ${commandName}`);
    }
  }

  /**
   * Generate content for partial command matches
   * 
   * This method creates content showing commands that match a partial input,
   * helping users discover available commands as they type.
   * 
   * @param partialCommand - The partial command text typed by the user
   * @param matchingCommands - Array of command names that match the partial input
   * @returns OverlayContent for partial command matches
   */
  public generatePartialCommandsContent(partialCommand: string, matchingCommands: string[]): OverlayContent {
    const startTime = performance.now();
    
    try {
      if (!partialCommand || !matchingCommands || matchingCommands.length === 0) {
        this.logWarning('Invalid parameters for partial commands content generation');
        return this.generateAllCommandsContent();
      }

      // Check if grammar service is healthy
      if (!this.grammarService.isHealthy()) {
        this.logWarning('Grammar service is not healthy, generating degraded content');
        return this.generateDegradedPartialCommandsContent(partialCommand, matchingCommands);
      }

      // If only one match, show that command's specific content
      if (matchingCommands.length === 1) {
        return this.generateCommandContent(matchingCommands[0]);
      }

      const sections: OverlaySection[] = [];
      let totalContentLength = 0;

      // Add header section explaining the partial match
      sections.push({
        title: 'Matching Commands',
        content: [
          {
            type: 'description',
            content: `Commands starting with "${partialCommand}":`,
            highlight: true
          }
        ]
      });

      // Group commands by category for better organization
      const commandsByCategory = new Map<CommandCategory, string[]>();
      
      matchingCommands.forEach(commandName => {
        try {
          const commandDef = this.grammarService.getCommandDefinition(commandName);
          if (commandDef) {
            const category = commandDef.category;
            if (!commandsByCategory.has(category)) {
              commandsByCategory.set(category, []);
            }
            commandsByCategory.get(category)!.push(commandName);
          }
        } catch (error) {
          this.logWarning(`Error getting command definition for ${commandName}`, error);
          // Add to a default category
          if (!commandsByCategory.has('administration')) {
            commandsByCategory.set('administration', []);
          }
          commandsByCategory.get('administration')!.push(commandName);
        }
      });

      // Sort categories for consistent display
      const categoryOrder: CommandCategory[] = [
        'combat',
        'movement', 
        'construction',
        'design',
        'resource',
        'administration'
      ];

      categoryOrder.forEach(category => {
        const commands = commandsByCategory.get(category);
        if (!commands || commands.length === 0) return;

        try {
          const categorySection: OverlaySection = {
            title: this.getCachedCategoryTitle(category),
            content: [],
            collapsible: false,
            expanded: true
          };

          commands.forEach((commandName, index) => {
            try {
              const commandDef = this.grammarService.getCommandDefinition(commandName);
              if (!commandDef) return;

              // Highlight the matching portion of the command name
              const highlightedName = this.highlightPartialMatch(commandName, partialCommand);
              const commandContent = `${highlightedName} - ${commandDef.description}`;
              
              // Add command name and description
              categorySection.content.push({
                type: 'command',
                content: commandContent,
                highlight: false
              });
              
              // Add syntax with indentation
              categorySection.content.push({
                type: 'syntax',
                content: commandDef.syntax,
                indent: 1
              });

              totalContentLength += commandContent.length + commandDef.syntax.length;

              // Add spacing between commands for readability (except for last command)
              if (index < commands.length - 1) {
                categorySection.content.push({
                  type: 'description',
                  content: '',
                  indent: 0
                });
              }

              // Stop if content is getting too large
              if (totalContentLength > OverlayContentGenerator.MAX_CONTENT_LENGTH) {
                categorySection.content.push({
                  type: 'description',
                  content: '... (content truncated for performance)',
                  highlight: true,
                  indent: 0
                });
                return; // Exit this iteration
              }
            } catch (commandError) {
              this.logWarning(`Error processing command ${commandName}`, commandError);
            }
          });

          if (categorySection.content.length > 0) {
            sections.push(categorySection);
          }
        } catch (categoryError) {
          this.logWarning(`Error processing category ${category}`, categoryError);
        }
      });

      // Add completion hint
      if (matchingCommands.length > 1) {
        sections.push({
          title: 'Tip',
          content: [
            {
              type: 'description',
              content: 'Continue typing to narrow down the matches, or press Tab to complete.',
              highlight: false
            }
          ]
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log performance metrics
      if (duration > 25) {
        console.warn(`Partial commands content generation took ${duration.toFixed(2)}ms for ${matchingCommands.length} matches`);
      }

      return {
        type: 'partial-commands',
        title: `Commands matching "${partialCommand}" (${matchingCommands.length})`,
        sections,
        scrollable: true // Always allow scrolling for consistency with all-commands display
      };
    } catch (error) {
      this.logError(`Error generating partial commands content for "${partialCommand}"`, error);
      return this.generateErrorContent(`Failed to load matching commands for: ${partialCommand}`);
    }
  }

  /**
   * Highlight the matching portion of a command name
   * 
   * @param commandName - The full command name
   * @param partialCommand - The partial text that matches
   * @returns Command name with highlighted matching portion
   */
  private highlightPartialMatch(commandName: string, partialCommand: string): string {
    if (!partialCommand || partialCommand.length === 0) {
      return commandName;
    }

    const partialLower = partialCommand.toLowerCase();
    const commandLower = commandName.toLowerCase();
    
    if (commandLower.startsWith(partialLower)) {
      // Return the command with the matching portion in uppercase for emphasis
      return partialCommand.toUpperCase() + commandName.substring(partialCommand.length);
    }
    
    return commandName;
  }

  /**
   * Generate degraded partial commands content when grammar service is unhealthy
   */
  private generateDegradedPartialCommandsContent(partialCommand: string, matchingCommands: string[]): OverlayContent {
    try {
      return {
        type: 'partial-commands',
        title: `Commands matching "${partialCommand}" (Limited)`,
        sections: [
          {
            title: 'Service Notice',
            content: [
              {
                type: 'description',
                content: 'Grammar service is experiencing issues. Command details may be incomplete.',
                highlight: true
              }
            ]
          },
          {
            title: 'Matching Commands',
            content: matchingCommands.slice(0, 10).map(cmd => ({
              type: 'command' as const,
              content: `${this.highlightPartialMatch(cmd, partialCommand)} - Command details unavailable`,
              highlight: false
            }))
          }
        ],
        scrollable: true // Always allow scrolling for consistency
      };
    } catch (error) {
      this.logError(`Error generating degraded partial commands content for ${partialCommand}`, error);
      return this.generateMinimalContent();
    }
  }

  /**
   * Generate empty content for hidden overlay state
   * 
   * @returns Empty OverlayContent
   */
  public generateEmptyContent(): OverlayContent {
    return {
      type: 'all-commands',
      title: 'Syntax Help',
      sections: [],
      scrollable: false
    };
  }

  /**
   * Generate error content when command parsing fails
   * 
   * @param error - The error message to display
   * @returns OverlayContent with error information
   */
  public generateErrorContent(error: string): OverlayContent {
    return {
      type: 'all-commands',
      title: 'Syntax Help - Error',
      sections: [
        {
          title: 'Error',
          content: [
            {
              type: 'description',
              content: `Unable to load command syntax: ${error}`,
              highlight: true
            },
            {
              type: 'description',
              content: 'Please check the grammar file or contact support.',
              indent: 0
            }
          ]
        }
      ],
      scrollable: false
    };
  }

  /**
   * Check if content is empty or has no meaningful sections
   * 
   * @param content - The overlay content to check
   * @returns true if content is effectively empty
   */
  public isContentEmpty(content: OverlayContent): boolean {
    return content.sections.length === 0 || 
           content.sections.every(section => section.content.length === 0);
  }

  /**
   * Get content summary for debugging or logging
   * 
   * @param content - The overlay content to summarize
   * @returns Summary string
   */
  public getContentSummary(content: OverlayContent): string {
    const sectionCount = content.sections.length;
    const itemCount = content.sections.reduce((total, section) => 
      total + section.content.length, 0);
    
    return `${content.type} content: ${sectionCount} sections, ${itemCount} items, scrollable: ${content.scrollable}`;
  }

  /**
   * Format category title for display with caching for performance
   * 
   * @param category - The command category
   * @returns Formatted title string
   */
  private getCachedCategoryTitle(category: CommandCategory): string {
    // Check cache first
    const cached = this.categoryTitleCache.get(category);
    if (cached) {
      return cached;
    }
    
    // Generate and cache the title
    const title = this.formatCategoryTitle(category);
    this.categoryTitleCache.set(category, title);
    return title;
  }

  /**
   * Format category title for display
   * 
   * @param category - The command category
   * @returns Formatted title string
   */
  private formatCategoryTitle(category: CommandCategory): string {
    const titles: Record<CommandCategory, string> = {
      'combat': 'Combat Commands',
      'construction': 'Construction Commands', 
      'movement': 'Movement Commands',
      'administration': 'Administration Commands',
      'design': 'Design Commands',
      'resource': 'Resource Commands'
    };
    
    return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Validate overlay content structure
   * 
   * @param content - The content to validate
   * @returns true if content structure is valid
   */
  public validateContent(content: OverlayContent): boolean {
    if (!content.title || !content.sections) {
      return false;
    }

    // Check that all sections have valid structure
    return content.sections.every(section => {
      return section.content && Array.isArray(section.content) &&
             section.content.every(item => 
               item.type && item.content !== undefined
             );
    });
  }

  /**
   * Get total content length for performance monitoring
   * 
   * @param content - The content to measure
   * @returns Total character count in content
   */
  public getContentLength(content: OverlayContent): number {
    let totalLength = content.title.length;
    
    content.sections.forEach(section => {
      if (section.title) {
        totalLength += section.title.length;
      }
      
      section.content.forEach(item => {
        totalLength += item.content.length;
      });
    });
    
    return totalLength;
  }

  /**
   * Get performance metrics for content generation
   * 
   * @param content - The content to analyze
   * @returns Performance metrics object
   */
  public getPerformanceMetrics(content: OverlayContent): {
    totalSections: number;
    totalItems: number;
    totalLength: number;
    estimatedRenderTime: number;
  } {
    const totalSections = content.sections.length;
    const totalItems = content.sections.reduce((sum, section) => sum + section.content.length, 0);
    const totalLength = this.getContentLength(content);
    
    // Estimate render time based on content size (rough heuristic)
    const estimatedRenderTime = Math.max(1, totalLength / 1000 + totalItems * 0.5);
    
    return {
      totalSections,
      totalItems,
      totalLength,
      estimatedRenderTime
    };
  }

  /**
   * Check if content exceeds performance thresholds
   * 
   * @param content - The content to check
   * @returns true if content is too large for optimal performance
   */
  public isContentTooLarge(content: OverlayContent): boolean {
    const metrics = this.getPerformanceMetrics(content);
    
    return metrics.totalLength > OverlayContentGenerator.MAX_CONTENT_LENGTH ||
           metrics.totalItems > 200 ||
           metrics.estimatedRenderTime > 100; // 100ms threshold
  }

  /**
   * Optimize content for performance by reducing size if needed
   * 
   * @param content - The content to optimize
   * @returns Optimized content
   */
  public optimizeContent(content: OverlayContent): OverlayContent {
    if (!this.isContentTooLarge(content)) {
      return content;
    }

    // Create optimized version with reduced content
    const optimizedSections = content.sections.map(section => {
      // Limit items per section
      const maxItemsPerSection = 20;
      const limitedContent = section.content.slice(0, maxItemsPerSection);
      
      // Add truncation notice if content was reduced
      if (section.content.length > maxItemsPerSection) {
        limitedContent.push({
          type: 'description',
          content: `... and ${section.content.length - maxItemsPerSection} more items (truncated for performance)`,
          highlight: true
        });
      }
      
      return {
        ...section,
        content: limitedContent
      };
    });

    return {
      ...content,
      sections: optimizedSections,
      title: `${content.title} (Optimized)`,
      scrollable: true
    };
  }

  /**
   * Clear performance caches to free memory
   */
  public clearCaches(): void {
    this.categoryTitleCache.clear();
    this.commandCountCache.clear();
  }

  /**
   * Generate degraded all commands content when grammar service is unhealthy
   */
  private generateDegradedAllCommandsContent(): OverlayContent {
    try {
      return {
        type: 'all-commands',
        title: 'Available Commands (Limited)',
        sections: [
          {
            title: 'Service Notice',
            content: [
              {
                type: 'description',
                content: 'Grammar service is experiencing issues. Showing basic command information.',
                highlight: true
              }
            ]
          },
          {
            title: 'Basic Commands',
            content: [
              {
                type: 'command',
                content: 'BUILD - Construct ships'
              },
              {
                type: 'syntax',
                content: 'BUILD <world> <count> <shipclass>',
                indent: 1
              },
              {
                type: 'command',
                content: 'MOVE - Move ships'
              },
              {
                type: 'syntax',
                content: 'MOVE <source> TO <destination>',
                indent: 1
              },
              {
                type: 'command',
                content: 'FIRE - Attack targets'
              },
              {
                type: 'syntax',
                content: 'FIRE <target> AT <empire>',
                indent: 1
              }
            ]
          }
        ],
        scrollable: false
      };
    } catch (error) {
      this.logError('Error generating degraded all commands content', error);
      return this.generateMinimalContent();
    }
  }

  /**
   * Generate degraded command content when grammar service is unhealthy
   */
  private generateDegradedCommandContent(commandName: string): OverlayContent {
    try {
      return {
        type: 'specific-command',
        title: `${commandName.toUpperCase()} Command (Limited)`,
        sections: [
          {
            title: 'Service Notice',
            content: [
              {
                type: 'description',
                content: 'Grammar service is experiencing issues. Command details may be incomplete.',
                highlight: true
              }
            ]
          },
          {
            title: 'Basic Syntax',
            content: [
              {
                type: 'syntax',
                content: `${commandName.toUpperCase()} <parameters>`,
                highlight: true
              },
              {
                type: 'description',
                content: 'Please refer to documentation for complete syntax information.'
              }
            ]
          }
        ],
        scrollable: false
      };
    } catch (error) {
      this.logError(`Error generating degraded command content for ${commandName}`, error);
      return this.generateMinimalContent();
    }
  }

  /**
   * Generate minimal content as last resort
   */
  private generateMinimalContent(): OverlayContent {
    return {
      type: 'all-commands',
      title: 'Syntax Help - Service Unavailable',
      sections: [
        {
          title: 'Error',
          content: [
            {
              type: 'description',
              content: 'Syntax overlay service is temporarily unavailable. Please try refreshing the page.',
              highlight: true
            }
          ]
        }
      ],
      scrollable: false
    };
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
      service: 'OverlayContentGenerator',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      sessionId: this.getSessionId(),
      performanceMetrics: this.getPerformanceSnapshot()
    };
    
    console.error('OverlayContentGenerator Error:', errorInfo);
    
    // In production, this could be sent to an error monitoring service
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.sendToErrorMonitoring('OverlayContentGenerator', errorInfo);
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
      service: 'OverlayContentGenerator',
      sessionId: this.getSessionId(),
      performanceMetrics: this.getPerformanceSnapshot()
    };
    
    console.warn('OverlayContentGenerator Warning:', warningInfo);
    
    // Track warnings for analytics
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.sendToAnalytics('warning', warningInfo);
    }
  }

  /**
   * Enhanced debug logging with performance metrics
   */
  private logDebug(message: string): void {
    const debugInfo = {
      message,
      timestamp: new Date().toISOString(),
      service: 'OverlayContentGenerator',
      sessionId: this.getSessionId(),
      performanceMetrics: this.getPerformanceSnapshot()
    };
    
    console.debug('OverlayContentGenerator Debug:', debugInfo);
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
        cacheSize: {
          categoryTitleCache: this.categoryTitleCache.size,
          commandCountCache: this.commandCountCache.size
        }
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
      // Example: Sentry.captureException(new Error(errorInfo.message), { extra: errorInfo });
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
      // Example: analytics.track(eventType, data);
      console.log('Would send to analytics:', { eventType, data });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  /**
   * Filter content based on search term (for future enhancement)
   * 
   * @param content - The content to filter
   * @param searchTerm - The term to search for
   * @returns Filtered content
   */
  public filterContent(content: OverlayContent, searchTerm: string): OverlayContent {
    if (!searchTerm.trim()) {
      return content;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filteredSections: OverlaySection[] = [];

    content.sections.forEach(section => {
      const filteredItems = section.content.filter(item =>
        item.content.toLowerCase().includes(lowerSearchTerm) ||
        (section.title && section.title.toLowerCase().includes(lowerSearchTerm))
      );

      if (filteredItems.length > 0) {
        filteredSections.push({
          ...section,
          content: filteredItems
        });
      }
    });

    return {
      ...content,
      sections: filteredSections,
      title: `${content.title} (filtered)`
    };
  }
}