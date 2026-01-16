import { describe, it, expect, beforeEach } from 'vitest';
import { OverlayContextAnalyzer, OverlayContext } from '../../src/services/OverlayContextAnalyzer';
import { GrammarService } from '../../src/services/GrammarService';

/**
 * Unit Tests for OverlayContextAnalyzer
 * 
 * These tests verify the overlay context analyzer can correctly identify
 * different line types and extract appropriate context information.
 */
describe('OverlayContextAnalyzer - Unit Tests', () => {
  let contextAnalyzer: OverlayContextAnalyzer;
  let grammarService: GrammarService;

  beforeEach(() => {
    grammarService = new GrammarService();
    contextAnalyzer = new OverlayContextAnalyzer(grammarService);
  });

  describe('analyzeContext', () => {
    it('should return all-commands for empty text', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('', 0);

      // Assert
      expect(context.type).toBe('all-commands');
      expect(context.lineContent).toBe('');
      expect(context.cursorPosition).toBe(0);
      expect(context.lineNumber).toBe(0);
    });

    it('should return all-commands for blank lines', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('   \n\n  \n', 5);

      // Assert
      expect(context.type).toBe('all-commands');
    });

    it('should return all-commands for comment lines', () => {
      // Arrange
      const text = '# This is a comment\n// Another comment\n; Yet another comment';

      // Act
      const context1 = contextAnalyzer.analyzeContext(text, 5);
      const context2 = contextAnalyzer.analyzeContext(text, 25);
      const context3 = contextAnalyzer.analyzeContext(text, 45);

      // Assert
      expect(context1.type).toBe('all-commands');
      expect(context2.type).toBe('all-commands');
      expect(context3.type).toBe('all-commands');
    });

    it('should return specific-command for valid command lines', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('BUILD Homeworld 5 Destroyer', 10);

      // Assert
      expect(context.type).toBe('specific-command');
      expect(context.commandName).toBe('BUILD');
      expect(context.lineContent).toBe('BUILD Homeworld 5 Destroyer');
    });

    it('should return partial-commands for partial command matches', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('BU', 2);

      // Assert
      expect(context.type).toBe('partial-commands');
      expect(context.partialCommand).toBe('BU');
      expect(context.matchingCommands).toContain('BUILD');
    });

    it('should handle cursor position correctly', () => {
      // Arrange
      const text = 'BUILD Homeworld 5 Destroyer\nMOVE Ship1 TO (1,2)';

      // Act - cursor on BUILD line
      const context1 = contextAnalyzer.analyzeContext(text, 10);
      // Act - cursor on MOVE line
      const context2 = contextAnalyzer.analyzeContext(text, 35);

      // Assert
      expect(context1.commandName).toBe('BUILD');
      expect(context2.commandName).toBe('MOVE');
    });

    it('should handle invalid cursor positions gracefully', () => {
      // Act
      const context1 = contextAnalyzer.analyzeContext('BUILD', -1);
      const context2 = contextAnalyzer.analyzeContext('BUILD', 100);

      // Assert
      expect(context1.type).toBe('specific-command'); // Cursor gets clamped to 0, so BUILD is recognized
      expect(context1.commandName).toBe('BUILD');
      expect(context2.type).toBe('specific-command'); // Cursor gets clamped to text length, BUILD is still recognized
      expect(context2.commandName).toBe('BUILD');
    });
  });

  describe('partial command analysis', () => {
    it('should identify single character partial matches', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('B', 1);

      // Assert
      expect(context.type).toBe('partial-commands');
      expect(context.partialCommand).toBe('B');
      expect(context.matchingCommands).toContain('BUILD');
      // Note: Only testing for BUILD since BOMBARD may not exist in the grammar service
      expect(context.matchingCommands!.length).toBeGreaterThan(0);
    });

    it('should identify multi-character partial matches', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('BUI', 3);

      // Assert
      expect(context.type).toBe('partial-commands');
      expect(context.partialCommand).toBe('BUI');
      expect(context.matchingCommands).toContain('BUILD');
      expect(context.matchingCommands).not.toContain('BOMBARD');
    });

    it('should be case insensitive for partial matches', () => {
      // Act
      const context1 = contextAnalyzer.analyzeContext('bu', 2);
      const context2 = contextAnalyzer.analyzeContext('BU', 2);

      // Assert
      expect(context1.type).toBe('partial-commands');
      expect(context2.type).toBe('partial-commands');
      expect(context1.matchingCommands).toEqual(context2.matchingCommands);
    });

    it('should not match non-alphabetic partial text', () => {
      // Act
      const context1 = contextAnalyzer.analyzeContext('123', 3);
      const context2 = contextAnalyzer.analyzeContext('!@#', 3);

      // Assert
      expect(context1.type).toBe('all-commands');
      expect(context2.type).toBe('all-commands');
    });

    it('should handle partial matches with additional text', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('BU some parameters', 2);

      // Assert
      expect(context.type).toBe('partial-commands');
      expect(context.partialCommand).toBe('BU');
      expect(context.matchingCommands).toContain('BUILD');
    });

    it('should return sorted matching commands', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('F', 1);

      // Assert
      expect(context.type).toBe('partial-commands');
      expect(context.matchingCommands).toBeDefined();
      
      // Check that commands are sorted
      const commands = context.matchingCommands!;
      const sortedCommands = [...commands].sort();
      expect(commands).toEqual(sortedCommands);
    });

    it('should not return exact matches as partial matches', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('BUILD', 5);

      // Assert
      expect(context.type).toBe('specific-command');
      expect(context.commandName).toBe('BUILD');
    });

    it('should handle empty partial matches', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('XYZ', 3);

      // Assert
      expect(context.type).toBe('all-commands');
    });
  });

  describe('line analysis utilities', () => {
    it('should get current line number correctly', () => {
      // Arrange
      const text = 'Line 1\nLine 2\nLine 3';

      // Act & Assert
      expect(contextAnalyzer.getCurrentLineNumber(text, 0)).toBe(0);
      expect(contextAnalyzer.getCurrentLineNumber(text, 7)).toBe(1);
      expect(contextAnalyzer.getCurrentLineNumber(text, 14)).toBe(2);
    });

    it('should get current line content correctly', () => {
      // Arrange
      const text = 'BUILD Homeworld\nMOVE Ship1\nFIRE Target';

      // Act & Assert
      expect(contextAnalyzer.getCurrentLineContent(text, 5)).toBe('BUILD Homeworld');
      expect(contextAnalyzer.getCurrentLineContent(text, 20)).toBe('MOVE Ship1');
      expect(contextAnalyzer.getCurrentLineContent(text, 30)).toBe('FIRE Target');
    });

    it('should get cursor position in line correctly', () => {
      // Arrange
      const text = 'BUILD Homeworld\nMOVE Ship1';

      // Act & Assert
      expect(contextAnalyzer.getCursorPositionInLine(text, 5)).toBe(5);
      expect(contextAnalyzer.getCursorPositionInLine(text, 20)).toBe(4); // 4 chars into "MOVE Ship1"
    });

    it('should detect cursor at line start', () => {
      // Arrange
      const text = 'BUILD Homeworld\nMOVE Ship1';

      // Act & Assert
      expect(contextAnalyzer.isCursorAtLineStart(text, 0)).toBe(true);
      expect(contextAnalyzer.isCursorAtLineStart(text, 16)).toBe(true); // Start of second line
      expect(contextAnalyzer.isCursorAtLineStart(text, 5)).toBe(false);
    });

    it('should detect cursor at line end', () => {
      // Arrange
      const text = 'BUILD Homeworld\nMOVE Ship1';

      // Act & Assert
      expect(contextAnalyzer.isCursorAtLineEnd(text, 15)).toBe(true); // End of first line
      expect(contextAnalyzer.isCursorAtLineEnd(text, 26)).toBe(true); // End of second line
      expect(contextAnalyzer.isCursorAtLineEnd(text, 5)).toBe(false);
    });
  });

  describe('performance and caching', () => {
    it('should handle large text efficiently', () => {
      // Arrange
      const largeText = Array(1000).fill('BUILD Homeworld 5 Destroyer').join('\n');
      const startTime = performance.now();

      // Act
      const context = contextAnalyzer.analyzeContext(largeText, 500);

      // Assert
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(context.type).toBe('specific-command');
      expect(context.commandName).toBe('BUILD');
    });

    it('should provide cache statistics', () => {
      // Act
      const stats = contextAnalyzer.getCacheStats();

      // Assert
      expect(stats).toHaveProperty('lineCache');
      expect(stats).toHaveProperty('commandCache');
      expect(typeof stats.lineCache).toBe('number');
      expect(typeof stats.commandCache).toBe('number');
    });

    it('should clear caches', () => {
      // Arrange - populate caches
      contextAnalyzer.analyzeContext('BUILD Homeworld', 5);
      contextAnalyzer.analyzeContext('MOVE Ship1', 5);

      // Act
      contextAnalyzer.clearCaches();

      // Assert
      const stats = contextAnalyzer.getCacheStats();
      expect(stats.lineCache).toBe(0);
      expect(stats.commandCache).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid input gracefully', () => {
      // Act & Assert - should not throw errors
      expect(() => contextAnalyzer.analyzeContext(null as any, 0)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext('test', null as any)).not.toThrow();
      expect(() => contextAnalyzer.analyzeContext(undefined as any, undefined as any)).not.toThrow();
    });

    it('should return safe fallback for invalid input', () => {
      // Act
      const context1 = contextAnalyzer.analyzeContext(null as any, 0);
      const context2 = contextAnalyzer.analyzeContext('test', null as any);

      // Assert
      expect(context1.type).toBe('all-commands');
      expect(context2.type).toBe('all-commands');
    });

    it('should handle grammar service errors gracefully', () => {
      // Arrange - create analyzer with potentially problematic grammar service
      const mockGrammarService = {
        getCommandDefinition: () => { throw new Error('Test error'); },
        getAllCommandDefinitions: () => new Map(),
        getCommandsByCategory: () => new Map(),
        isHealthy: () => false
      } as any;
      
      const errorAnalyzer = new OverlayContextAnalyzer(mockGrammarService);

      // Act & Assert - should not throw
      expect(() => errorAnalyzer.analyzeContext('BUILD', 5)).not.toThrow();
      
      const context = errorAnalyzer.analyzeContext('BUILD', 5);
      expect(context.type).toBe('all-commands'); // Should fallback gracefully
    });
  });

  describe('edge cases', () => {
    it('should handle text with only whitespace', () => {
      // Act
      const context = contextAnalyzer.analyzeContext('   \t  \n  \t  ', 5);

      // Assert
      expect(context.type).toBe('all-commands');
    });

    it('should handle text with mixed line endings', () => {
      // Arrange
      const text = 'BUILD Homeworld\r\nMOVE Ship1\rFIRE Target\n';

      // Act
      const context = contextAnalyzer.analyzeContext(text, 20);

      // Assert
      expect(context.type).toBe('specific-command');
      expect(context.commandName).toBe('MOVE');
    });

    it('should handle very long lines', () => {
      // Arrange
      const longLine = 'BUILD ' + 'A'.repeat(10000);

      // Act
      const context = contextAnalyzer.analyzeContext(longLine, 5);

      // Assert
      expect(context.type).toBe('specific-command');
      expect(context.commandName).toBe('BUILD');
    });

    it('should handle cursor at exact line boundaries', () => {
      // Arrange
      const text = 'BUILD\nMOVE';

      // Act
      const context1 = contextAnalyzer.analyzeContext(text, 5); // At newline
      const context2 = contextAnalyzer.analyzeContext(text, 6); // Start of second line

      // Assert
      expect(context1.type).toBe('specific-command');
      expect(context1.commandName).toBe('BUILD');
      expect(context2.type).toBe('specific-command');
      expect(context2.commandName).toBe('MOVE');
    });
  });
});