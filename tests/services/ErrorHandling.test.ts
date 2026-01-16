import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrammarService } from '../../src/services/GrammarService';
import { OverlayContentGenerator } from '../../src/services/OverlayContentGenerator';
import { OverlayContextAnalyzer } from '../../src/services/OverlayContextAnalyzer';

/**
 * Unit Tests for Error Handling and Fallback Mechanisms
 * 
 * These tests verify that the overlay system handles errors gracefully
 * and provides appropriate fallback content when services are unavailable.
 */
describe('Error Handling and Fallback Mechanisms - Unit Tests', () => {
  let grammarService: GrammarService;
  let contentGenerator: OverlayContentGenerator;
  let contextAnalyzer: OverlayContextAnalyzer;

  beforeEach(() => {
    grammarService = new GrammarService();
    contentGenerator = new OverlayContentGenerator(grammarService);
    contextAnalyzer = new OverlayContextAnalyzer(grammarService);
  });

  describe('GrammarService Error Handling', () => {
    it('should provide service status information', () => {
      // Act
      const status = grammarService.getServiceStatus();

      // Assert
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('hasError');
      expect(status).toHaveProperty('errorMessage');
      expect(status).toHaveProperty('commandCount');
      expect(typeof status.initialized).toBe('boolean');
      expect(typeof status.hasError).toBe('boolean');
      expect(typeof status.commandCount).toBe('number');
    });

    it('should report healthy status when functioning properly', () => {
      // Act
      const isHealthy = grammarService.isHealthy();

      // Assert
      expect(isHealthy).toBe(true);
    });

    it('should handle invalid command names gracefully', () => {
      // Act & Assert - should not throw
      expect(() => grammarService.getCommandDefinition('')).not.toThrow();
      expect(() => grammarService.getCommandDefinition(null as any)).not.toThrow();
      expect(() => grammarService.getCommandDefinition(undefined as any)).not.toThrow();
      expect(() => grammarService.getCommandDefinition(123 as any)).not.toThrow();

      // Should return null for invalid inputs
      expect(grammarService.getCommandDefinition('')).toBeNull();
      expect(grammarService.getCommandDefinition(null as any)).toBeNull();
      expect(grammarService.getCommandDefinition(undefined as any)).toBeNull();
      expect(grammarService.getCommandDefinition(123 as any)).toBeNull();
    });

    it('should provide fallback commands when service has issues', () => {
      // Act
      const commands = grammarService.getAllCommandDefinitions();

      // Assert - should always return some commands, even if minimal
      expect(commands).toBeInstanceOf(Map);
      expect(commands.size).toBeGreaterThan(0);
      
      // Should have at least basic commands
      const commandNames = Array.from(commands.keys());
      expect(commandNames.length).toBeGreaterThan(0);
    });

    it('should handle recovery attempts', () => {
      // Act
      const recoveryResult = grammarService.attemptRecovery();

      // Assert
      expect(typeof recoveryResult).toBe('boolean');
      
      // Service should still be functional after recovery attempt
      const isHealthy = grammarService.isHealthy();
      expect(isHealthy).toBe(true);
    });
  });

  describe('OverlayContentGenerator Error Handling', () => {
    it('should generate error content when provided with error message', () => {
      // Arrange
      const errorMessage = 'Test error message';

      // Act
      const content = contentGenerator.generateErrorContent(errorMessage);

      // Assert
      expect(content.type).toBe('all-commands');
      expect(content.title).toContain('Error');
      expect(content.sections.length).toBeGreaterThan(0);
      expect(content.sections[0].content[0].content).toContain(errorMessage);
    });

    it('should handle invalid command names gracefully', () => {
      // Act & Assert - should not throw
      expect(() => contentGenerator.generateCommandContent('')).not.toThrow();
      expect(() => contentGenerator.generateCommandContent(null as any)).not.toThrow();
      expect(() => contentGenerator.generateCommandContent(undefined as any)).not.toThrow();

      // Should fallback to all commands for invalid inputs
      const emptyResult = contentGenerator.generateCommandContent('');
      const nullResult = contentGenerator.generateCommandContent(null as any);
      const undefinedResult = contentGenerator.generateCommandContent(undefined as any);

      expect(emptyResult.type).toBe('all-commands');
      expect(nullResult.type).toBe('all-commands');
      expect(undefinedResult.type).toBe('all-commands');
    });

    it('should validate content structure correctly', () => {
      // Arrange
      const validContent = contentGenerator.generateAllCommandsContent();
      const invalidContent = {
        type: 'all-commands' as const,
        title: '',
        sections: [],
        scrollable: false
      };

      // Act & Assert
      expect(contentGenerator.validateContent(validContent)).toBe(true);
      expect(contentGenerator.validateContent(invalidContent)).toBe(false);
    });

    it('should handle content generation errors gracefully', () => {
      // Arrange - Create a mock grammar service that throws errors
      const errorGrammarService = {
        isHealthy: () => false,
        getCommandsByCategory: () => { throw new Error('Test error'); },
        getCommandDefinition: () => { throw new Error('Test error'); },
        getAllCommandDefinitions: () => { throw new Error('Test error'); }
      } as any;

      const errorContentGenerator = new OverlayContentGenerator(errorGrammarService);

      // Act & Assert - should not throw, should return degraded content
      expect(() => errorContentGenerator.generateAllCommandsContent()).not.toThrow();
      expect(() => errorContentGenerator.generateCommandContent('BUILD')).not.toThrow();

      const allCommandsResult = errorContentGenerator.generateAllCommandsContent();
      const commandResult = errorContentGenerator.generateCommandContent('BUILD');

      // Should return degraded content, not error content since service is unhealthy
      expect(allCommandsResult.title).toContain('Limited');
      expect(commandResult.title).toContain('Limited');
    });

    it('should provide content summary for debugging', () => {
      // Arrange
      const content = contentGenerator.generateAllCommandsContent();

      // Act
      const summary = contentGenerator.getContentSummary(content);

      // Assert
      expect(typeof summary).toBe('string');
      expect(summary).toContain('content');
      expect(summary).toContain('sections');
      expect(summary).toContain('items');
    });

    it('should detect empty content correctly', () => {
      // Arrange
      const emptyContent = contentGenerator.generateEmptyContent();
      const normalContent = contentGenerator.generateAllCommandsContent();

      // Act & Assert
      expect(contentGenerator.isContentEmpty(emptyContent)).toBe(true);
      expect(contentGenerator.isContentEmpty(normalContent)).toBe(false);
    });
  });

  describe('OverlayContextAnalyzer Error Handling', () => {
    it('should handle invalid text input gracefully', () => {
      // Act & Assert - should not throw
      expect(() => contextAnalyzer.analyzeContext(null as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext(undefined as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext(123 as any, 0)).not.toThrow();

      // Should return safe fallback context
      const nullResult = contextAnalyzer.analyzeContext(null as any, 0);
      const undefinedResult = contextAnalyzer.analyzeContext(undefined as any, 0);
      const numberResult = contextAnalyzer.analyzeContext(123 as any, 0);

      expect(nullResult.type).toBe('all-commands');
      expect(undefinedResult.type).toBe('all-commands');
      expect(numberResult.type).toBe('all-commands');
    });

    it('should handle invalid cursor positions gracefully', () => {
      // Arrange
      const text = 'BUILD Homeworld 5 Destroyer';

      // Act & Assert - should not throw
      expect(() => contextAnalyzer.analyzeContext(text, -1)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext(text, 1000)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext(text, null as any)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext(text, undefined as any)).not.toThrow();

      // Should handle out-of-bounds positions
      const negativeResult = contextAnalyzer.analyzeContext(text, -1);
      const largeResult = contextAnalyzer.analyzeContext(text, 1000);
      const nullResult = contextAnalyzer.analyzeContext(text, null as any);

      expect(negativeResult.type).toBe('specific-command');
      expect(largeResult.type).toBe('specific-command');
      expect(nullResult.type).toBe('specific-command');
    });

    it('should provide cache statistics for monitoring', () => {
      // Arrange - Analyze some contexts to populate cache
      contextAnalyzer.analyzeContext('BUILD Homeworld 5 Destroyer', 0);
      contextAnalyzer.analyzeContext('MOVE Ship1 TO (1,2)', 0);

      // Act
      const stats = contextAnalyzer.getCacheStats();

      // Assert
      expect(stats).toHaveProperty('lineCache');
      expect(stats).toHaveProperty('commandCache');
      expect(typeof stats.lineCache).toBe('number');
      expect(typeof stats.commandCache).toBe('number');
    });

    it('should clear caches without errors', () => {
      // Arrange - Populate caches
      contextAnalyzer.analyzeContext('BUILD Homeworld 5 Destroyer', 0);

      // Act & Assert - should not throw
      expect(() => contextAnalyzer.clearCaches()).not.toThrow();

      // Caches should be empty after clearing
      const stats = contextAnalyzer.getCacheStats();
      expect(stats.lineCache).toBe(0);
      expect(stats.commandCache).toBe(0);
    });

    it('should handle utility methods with invalid input', () => {
      // Act & Assert - should not throw
      expect(() => contextAnalyzer.getCurrentLineNumber(null as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.getCurrentLineContent(null as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.getCursorPositionInLine(null as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.isCursorAtLineStart(null as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.isCursorAtLineEnd(null as any, 0)).not.toThrow();

      // Should return safe defaults
      expect(contextAnalyzer.getCurrentLineNumber('', -1)).toBe(0);
      expect(contextAnalyzer.getCurrentLineContent('', -1)).toBe('');
      expect(contextAnalyzer.getCursorPositionInLine('', -1)).toBe(0);
    });
  });

  describe('Service Integration Error Handling', () => {
    it('should handle grammar service unavailability in content generator', () => {
      // Arrange - Create unhealthy grammar service
      const unhealthyGrammarService = {
        isHealthy: () => false,
        getCommandsByCategory: () => new Map(),
        getCommandDefinition: () => null,
        getAllCommandDefinitions: () => new Map()
      } as any;

      const contentGeneratorWithUnhealthyService = new OverlayContentGenerator(unhealthyGrammarService);

      // Act
      const allCommandsContent = contentGeneratorWithUnhealthyService.generateAllCommandsContent();
      const commandContent = contentGeneratorWithUnhealthyService.generateCommandContent('BUILD');

      // Assert - should provide degraded but functional content
      expect(allCommandsContent.type).toBe('all-commands');
      expect(allCommandsContent.title).toContain('Limited');
      expect(allCommandsContent.sections.length).toBeGreaterThan(0);

      expect(commandContent.type).toBe('specific-command');
      expect(commandContent.title).toContain('Limited');
      expect(commandContent.sections.length).toBeGreaterThan(0);
    });

    it('should handle grammar service errors in context analyzer', () => {
      // Arrange - Create grammar service that throws errors
      const errorGrammarService = {
        getCommandDefinition: () => { throw new Error('Test error'); }
      } as any;

      const contextAnalyzerWithErrorService = new OverlayContextAnalyzer(errorGrammarService);

      // Act & Assert - should not throw, should handle gracefully
      expect(() => contextAnalyzerWithErrorService.analyzeContext('BUILD Homeworld', 0)).not.toThrow();

      const result = contextAnalyzerWithErrorService.analyzeContext('BUILD Homeworld', 0);
      expect(result.type).toBe('all-commands'); // Should fallback to all-commands when command check fails
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clear caches to free memory', () => {
      // Act & Assert - should not throw
      expect(() => contentGenerator.clearCaches()).not.toThrow();
      expect(() => contextAnalyzer.clearCaches()).not.toThrow();
    });

    it('should handle large content gracefully', () => {
      // Arrange - Generate content that might be large
      const content = contentGenerator.generateAllCommandsContent();

      // Act
      const metrics = contentGenerator.getPerformanceMetrics(content);
      const isLarge = contentGenerator.isContentTooLarge(content);

      // Assert
      expect(metrics).toHaveProperty('totalSections');
      expect(metrics).toHaveProperty('totalItems');
      expect(metrics).toHaveProperty('totalLength');
      expect(metrics).toHaveProperty('estimatedRenderTime');
      expect(typeof isLarge).toBe('boolean');
    });

    it('should optimize content when too large', () => {
      // Arrange
      const content = contentGenerator.generateAllCommandsContent();

      // Act
      const optimizedContent = contentGenerator.optimizeContent(content);

      // Assert
      expect(optimizedContent.type).toBe(content.type);
      expect(optimizedContent.sections).toBeDefined();
      expect(Array.isArray(optimizedContent.sections)).toBe(true);
    });
  });
});