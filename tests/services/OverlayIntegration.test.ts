import { describe, it, expect, beforeEach } from 'vitest';
import { OverlayContentGenerator } from '../../src/services/OverlayContentGenerator';
import { OverlayContextAnalyzer } from '../../src/services/OverlayContextAnalyzer';
import { GrammarService } from '../../src/services/GrammarService';

/**
 * Integration Tests for Overlay Services
 * 
 * These tests verify that the OverlayContextAnalyzer and OverlayContentGenerator
 * work together correctly to provide context-aware syntax help.
 */
describe('Overlay Services Integration Tests', () => {
  let grammarService: GrammarService;
  let contextAnalyzer: OverlayContextAnalyzer;
  let contentGenerator: OverlayContentGenerator;

  beforeEach(() => {
    grammarService = new GrammarService();
    contextAnalyzer = new OverlayContextAnalyzer(grammarService);
    contentGenerator = new OverlayContentGenerator(grammarService);
  });

  describe('context-aware content generation', () => {
    it('should generate all-commands content for blank line', () => {
      // Arrange
      const text = 'BUILD Homeworld 5 Destroyer\n\nFIRE (1,2) AT Empire1';
      const cursorPosition = 28; // Position on blank line (after first \n)

      // Act
      const context = contextAnalyzer.analyzeContext(text, cursorPosition);
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      expect(context.type).toBe('all-commands');
      expect(content.type).toBe('all-commands');
      expect(content.title).toMatch(/^Available Commands \(\d+\)$/); // Match "Available Commands (N)"
      expect(content.sections.length).toBeGreaterThan(0);
    });

    it('should generate specific command content for command line', () => {
      // Arrange
      const text = 'BUILD Homeworld 5 Destroyer\nFIRE (1,2) AT Empire1';
      const cursorPosition = 5; // Position on BUILD line

      // Act
      const context = contextAnalyzer.analyzeContext(text, cursorPosition);
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      expect(context.type).toBe('specific-command');
      expect(context.commandName).toBe('BUILD');
      expect(content.type).toBe('specific-command');
      expect(content.title).toBe('BUILD Command');
    });

    it('should handle comment lines correctly', () => {
      // Arrange
      const text = '# This is a comment\nBUILD Homeworld 5 Destroyer';
      const cursorPosition = 10; // Position on comment line

      // Act
      const context = contextAnalyzer.analyzeContext(text, cursorPosition);
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      expect(context.type).toBe('all-commands');
      expect(content.type).toBe('all-commands');
    });

    it('should provide appropriate content for different command types', () => {
      // Test different command types
      const commands = ['BUILD', 'FIRE', 'MOVE', 'DESIGN', 'TRANSFER'];
      
      commands.forEach(commandName => {
        // Act
        const content = contentGenerator.generateCommandContent(commandName);

        // Assert
        expect(content.type).toBe('specific-command');
        expect(content.title).toBe(`${commandName} Command`);
        expect(content.sections.length).toBeGreaterThan(0);
        
        // Should have syntax section
        const syntaxSection = content.sections.find(s => s.title === 'Syntax');
        expect(syntaxSection).toBeDefined();
        expect(syntaxSection!.content[0].content).toContain(commandName);
      });
    });

    it('should handle cursor at different positions within command line', () => {
      // Arrange
      const text = 'BUILD Homeworld 5 Destroyer';
      const positions = [0, 5, 10, 15, 20, 27]; // Different positions in the line

      positions.forEach(position => {
        // Act
        const context = contextAnalyzer.analyzeContext(text, position);

        // Assert
        expect(context.type).toBe('specific-command');
        expect(context.commandName).toBe('BUILD');
        expect(context.lineContent).toBe('BUILD Homeworld 5 Destroyer');
      });
    });

    it('should provide consistent content structure across all commands', () => {
      // Arrange
      const allCommands = grammarService.getAllCommandDefinitions();

      // Act & Assert
      allCommands.forEach((commandDef, commandName) => {
        const content = contentGenerator.generateCommandContent(commandName);
        
        // Should have consistent structure
        expect(content.type).toBe('specific-command');
        expect(content.title).toBe(`${commandName} Command`);
        expect(content.sections.length).toBeGreaterThan(0);
        
        // Should validate properly
        expect(contentGenerator.validateContent(content)).toBe(true);
        
        // Should have measurable length
        expect(contentGenerator.getContentLength(content)).toBeGreaterThan(0);
      });
    });

    it('should handle edge cases gracefully', () => {
      // Test empty text
      const emptyContext = contextAnalyzer.analyzeContext('', 0);
      expect(emptyContext.type).toBe('all-commands');
      
      // Test invalid command
      const invalidContent = contentGenerator.generateCommandContent('INVALID');
      expect(invalidContent.type).toBe('all-commands');
      
      // Test error content
      const errorContent = contentGenerator.generateErrorContent('Test error');
      expect(errorContent.type).toBe('all-commands');
      expect(errorContent.title).toContain('Error');
    });

    it('should handle case-insensitive command matching', () => {
      // Test different case variations of commands
      const testCases = [
        { text: 'BUILD Homeworld 5 Destroyer', expectedCommand: 'BUILD' },
        { text: 'build Homeworld 5 Destroyer', expectedCommand: 'BUILD' },
        { text: 'Build Homeworld 5 Destroyer', expectedCommand: 'BUILD' },
        { text: 'FIRE (1,2) AT Empire1', expectedCommand: 'FIRE' },
        { text: 'fire (1,2) AT Empire1', expectedCommand: 'FIRE' },
        { text: 'Fire (1,2) AT Empire1', expectedCommand: 'FIRE' },
        { text: 'move Ship1 TO (5,5)', expectedCommand: 'MOVE' },
        { text: 'MOVE Ship1 TO (5,5)', expectedCommand: 'MOVE' }
      ];

      testCases.forEach(({ text, expectedCommand }) => {
        // Act
        const context = contextAnalyzer.analyzeContext(text, 5); // Position within command
        const content = contentGenerator.generateCommandContent(expectedCommand);

        // Assert
        expect(context.type).toBe('specific-command');
        expect(context.commandName).toBe(expectedCommand);
        expect(content.type).toBe('specific-command');
        expect(content.title).toBe(`${expectedCommand} Command`);
      });
    });

    it('should provide searchable content', () => {
      // Arrange
      const allCommandsContent = contentGenerator.generateAllCommandsContent();

      // Act
      const filteredContent = contentGenerator.filterContent(allCommandsContent, 'BUILD');

      // Assert
      expect(filteredContent.title).toContain('filtered');
      expect(filteredContent.sections.length).toBeGreaterThan(0);
      
      // Should contain BUILD-related content
      const hasBuildContent = filteredContent.sections.some(section =>
        section.content.some(item => 
          item.content.toLowerCase().includes('build')
        )
      );
      expect(hasBuildContent).toBe(true);
    });
  });

  describe('performance and validation', () => {
    it('should generate content efficiently for large text', () => {
      // Arrange
      const largeText = Array(100).fill('BUILD Homeworld 5 Destroyer\n').join('');
      const startTime = Date.now();

      // Act
      const context = contextAnalyzer.analyzeContext(largeText, 50);
      const content = contentGenerator.generateCommandContent(context.commandName || 'BUILD');

      // Assert
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(content.type).toBe('specific-command');
    });

    it('should maintain content validity across operations', () => {
      // Arrange
      const content = contentGenerator.generateAllCommandsContent();

      // Act & Assert
      expect(contentGenerator.validateContent(content)).toBe(true);
      expect(contentGenerator.isContentEmpty(content)).toBe(false);
      expect(contentGenerator.getContentLength(content)).toBeGreaterThan(0);
      
      const summary = contentGenerator.getContentSummary(content);
      expect(summary).toContain('all-commands content');
    });
  });
});