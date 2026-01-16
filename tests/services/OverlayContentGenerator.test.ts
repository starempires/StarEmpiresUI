import { describe, it, expect, beforeEach } from 'vitest';
import { OverlayContentGenerator, OverlayContent, OverlaySection, OverlayItem } from '../../src/services/OverlayContentGenerator';
import { GrammarService } from '../../src/services/GrammarService';

/**
 * Unit Tests for OverlayContentGenerator
 * 
 * These tests verify the overlay content generator can create properly formatted
 * content for both all-commands and specific-command display modes.
 */
describe('OverlayContentGenerator - Unit Tests', () => {
  let contentGenerator: OverlayContentGenerator;
  let grammarService: GrammarService;

  beforeEach(() => {
    grammarService = new GrammarService();
    contentGenerator = new OverlayContentGenerator(grammarService);
  });

  describe('generateAllCommandsContent', () => {
    it('should generate content with all available commands', () => {
      // Act
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      expect(content.type).toBe('all-commands');
      expect(content.title).toMatch(/^Available Commands \(\d+\)$/); // Match "Available Commands (N)"
      expect(content.sections.length).toBeGreaterThan(0);
      expect(content.scrollable).toBe(true);
    });

    it('should organize commands by category', () => {
      // Act
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      const categoryTitles = content.sections.map(section => section.title);
      expect(categoryTitles).toContain('Combat Commands');
      expect(categoryTitles).toContain('Construction Commands');
      expect(categoryTitles).toContain('Movement Commands');
    });

    it('should include command names and syntax for each command', () => {
      // Act
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      const combatSection = content.sections.find(section => 
        section.title === 'Combat Commands'
      );
      expect(combatSection).toBeDefined();
      
      const fireCommandItem = combatSection!.content.find(item => 
        item.type === 'command' && item.content.includes('FIRE')
      );
      expect(fireCommandItem).toBeDefined();
      
      const fireSyntaxItem = combatSection!.content.find(item => 
        item.type === 'syntax' && item.content.includes('FIRE')
      );
      expect(fireSyntaxItem).toBeDefined();
      expect(fireSyntaxItem!.indent).toBe(1);
    });

    it('should mark all sections as collapsible and expanded', () => {
      // Act
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      content.sections.forEach(section => {
        expect(section.collapsible).toBe(true);
        expect(section.expanded).toBe(true);
      });
    });
  });

  describe('generateCommandContent', () => {
    it('should generate content for valid command', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      expect(content.type).toBe('specific-command');
      expect(content.title).toBe('BUILD Command');
      expect(content.sections.length).toBeGreaterThan(0);
    });

    it('should include syntax section as first section', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      const syntaxSection = content.sections[0];
      expect(syntaxSection.title).toBe('Syntax');
      expect(syntaxSection.content.length).toBe(1);
      expect(syntaxSection.content[0].type).toBe('syntax');
      expect(syntaxSection.content[0].highlight).toBe(true);
    });

    it('should include description section', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      const descriptionSection = content.sections.find(section => 
        section.title === 'Description'
      );
      expect(descriptionSection).toBeDefined();
      expect(descriptionSection!.content[0].type).toBe('description');
    });

    it('should include parameters section for commands with parameters', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      const parametersSection = content.sections.find(section => 
        section.title === 'Parameters'
      );
      expect(parametersSection).toBeDefined();
      expect(parametersSection!.content.length).toBeGreaterThan(0);
    });

    it('should highlight required parameters', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      const parametersSection = content.sections.find(section => 
        section.title === 'Parameters'
      );
      expect(parametersSection).toBeDefined();
      
      const requiredParam = parametersSection!.content.find(item => 
        item.type === 'parameter' && item.highlight === true
      );
      expect(requiredParam).toBeDefined();
    });

    it('should include examples section when available', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      const examplesSection = content.sections.find(section => 
        section.title === 'Examples'
      );
      expect(examplesSection).toBeDefined();
      expect(examplesSection!.content.length).toBeGreaterThan(0);
      expect(examplesSection!.content[0].type).toBe('example');
    });

    it('should fallback to all commands for invalid command', () => {
      // Act
      const content = contentGenerator.generateCommandContent('INVALID');

      // Assert
      expect(content.type).toBe('all-commands');
      expect(content.title).toMatch(/^Available Commands \(\d+\)$/); // Match "Available Commands (N)"
    });

    it('should determine scrollable based on content size', () => {
      // Act
      const buildContent = contentGenerator.generateCommandContent('BUILD');
      
      // Assert - BUILD has many parameters and examples, should be scrollable
      expect(buildContent.scrollable).toBe(true);
    });
  });

  describe('generateEmptyContent', () => {
    it('should generate empty content structure', () => {
      // Act
      const content = contentGenerator.generateEmptyContent();

      // Assert
      expect(content.type).toBe('all-commands');
      expect(content.title).toBe('Syntax Help');
      expect(content.sections.length).toBe(0);
      expect(content.scrollable).toBe(false);
    });
  });

  describe('generateErrorContent', () => {
    it('should generate error content with message', () => {
      // Arrange
      const errorMessage = 'Grammar file not found';

      // Act
      const content = contentGenerator.generateErrorContent(errorMessage);

      // Assert
      expect(content.type).toBe('all-commands');
      expect(content.title).toBe('Syntax Help - Error');
      expect(content.sections.length).toBe(1);
      expect(content.sections[0].title).toBe('Error');
      expect(content.sections[0].content[0].content).toContain(errorMessage);
    });
  });

  describe('generatePartialCommandsContent', () => {
    it('should generate content for multiple partial matches', () => {
      // Act
      const content = contentGenerator.generatePartialCommandsContent('B', ['BUILD', 'BOMBARD']);

      // Assert
      expect(content.type).toBe('partial-commands');
      expect(content.title).toBe('Commands matching "B" (2)');
      expect(content.sections.length).toBeGreaterThan(0);
    });

    it('should show single command content when only one match', () => {
      // Act
      const content = contentGenerator.generatePartialCommandsContent('BUILD', ['BUILD']);

      // Assert
      expect(content.type).toBe('specific-command');
      expect(content.title).toBe('BUILD Command');
    });

    it('should organize partial matches by category', () => {
      // Act
      const content = contentGenerator.generatePartialCommandsContent('F', ['FIRE', 'FLEET']);

      // Assert
      const categoryTitles = content.sections.map(section => section.title);
      expect(categoryTitles).toContain('Combat Commands');
    });

    it('should highlight matching portion of command names', () => {
      // Act
      const content = contentGenerator.generatePartialCommandsContent('BU', ['BUILD', 'BOMBARD']);

      // Assert
      const buildSection = content.sections.find(section => 
        section.content.some(item => item.content.includes('BU'))
      );
      expect(buildSection).toBeDefined();
    });

    it('should include completion tip for multiple matches', () => {
      // Act
      const content = contentGenerator.generatePartialCommandsContent('F', ['FIRE', 'FLEET']);

      // Assert
      const tipSection = content.sections.find(section => section.title === 'Tip');
      expect(tipSection).toBeDefined();
      expect(tipSection!.content[0].content).toContain('Continue typing');
    });

    it('should fallback to all commands for invalid parameters', () => {
      // Act
      const content1 = contentGenerator.generatePartialCommandsContent('', []);
      const content2 = contentGenerator.generatePartialCommandsContent('X', []);

      // Assert
      expect(content1.type).toBe('all-commands');
      expect(content2.type).toBe('all-commands');
    });

    it('should handle single character partial matches', () => {
      // Act
      const content = contentGenerator.generatePartialCommandsContent('B', ['BUILD', 'BOMBARD']);

      // Assert
      expect(content.type).toBe('partial-commands');
      expect(content.title).toContain('Commands matching "B"');
      expect(content.sections.length).toBeGreaterThan(1); // Should have matching commands section
    });

    it('should set scrollable based on number of matches', () => {
      // Act
      const fewMatches = contentGenerator.generatePartialCommandsContent('BUILD', ['BUILD']);
      const manyMatches = contentGenerator.generatePartialCommandsContent('F', ['FIRE', 'FLEET', 'FORM', 'FORTIFY', 'FUEL', 'FOLLOW']);

      // Assert
      expect(fewMatches.scrollable).toBe(true); // Single match shows specific command (BUILD is scrollable due to many parameters)
      expect(manyMatches.scrollable).toBe(true); // Many matches should be scrollable
    });
  });

  describe('utility methods', () => {
    it('should correctly identify empty content', () => {
      // Arrange
      const emptyContent = contentGenerator.generateEmptyContent();
      const normalContent = contentGenerator.generateAllCommandsContent();

      // Act & Assert
      expect(contentGenerator.isContentEmpty(emptyContent)).toBe(true);
      expect(contentGenerator.isContentEmpty(normalContent)).toBe(false);
    });

    it('should generate content summary', () => {
      // Arrange
      const content = contentGenerator.generateCommandContent('BUILD');

      // Act
      const summary = contentGenerator.getContentSummary(content);

      // Assert
      expect(summary).toContain('specific-command content');
      expect(summary).toContain('sections');
      expect(summary).toContain('items');
      expect(summary).toContain('scrollable');
    });

    it('should validate content structure', () => {
      // Arrange
      const validContent = contentGenerator.generateAllCommandsContent();
      const invalidContent: OverlayContent = {
        type: 'all-commands',
        title: '',
        sections: [],
        scrollable: false
      };

      // Act & Assert
      expect(contentGenerator.validateContent(validContent)).toBe(true);
      expect(contentGenerator.validateContent(invalidContent)).toBe(false);
    });

    it('should calculate content length', () => {
      // Arrange
      const content = contentGenerator.generateCommandContent('BUILD');

      // Act
      const length = contentGenerator.getContentLength(content);

      // Assert
      expect(length).toBeGreaterThan(0);
      expect(typeof length).toBe('number');
    });

    it('should filter content by search term', () => {
      // Arrange
      const content = contentGenerator.generateAllCommandsContent();

      // Act
      const filteredContent = contentGenerator.filterContent(content, 'BUILD');

      // Assert
      expect(filteredContent.title).toContain('filtered');
      expect(filteredContent.sections.length).toBeGreaterThan(0);
      
      const hasBuiltContent = filteredContent.sections.some(section =>
        section.content.some(item => 
          item.content.toLowerCase().includes('build')
        )
      );
      expect(hasBuiltContent).toBe(true);
    });

    it('should return original content when search term is empty', () => {
      // Arrange
      const content = contentGenerator.generateAllCommandsContent();

      // Act
      const filteredContent = contentGenerator.filterContent(content, '');

      // Assert
      expect(filteredContent).toEqual(content);
    });
  });

  describe('content structure validation', () => {
    it('should generate consistent item types', () => {
      // Act
      const content = contentGenerator.generateAllCommandsContent();

      // Assert
      const validTypes = ['command', 'syntax', 'parameter', 'example', 'description'];
      content.sections.forEach(section => {
        section.content.forEach(item => {
          expect(validTypes).toContain(item.type);
        });
      });
    });

    it('should use proper indentation for nested content', () => {
      // Act
      const content = contentGenerator.generateCommandContent('BUILD');

      // Assert
      const parametersSection = content.sections.find(section => 
        section.title === 'Parameters'
      );
      expect(parametersSection).toBeDefined();
      
      const indentedItems = parametersSection!.content.filter(item => 
        item.indent && item.indent > 0
      );
      expect(indentedItems.length).toBeGreaterThan(0);
    });

    it('should maintain consistent section structure', () => {
      // Act
      const content = contentGenerator.generateCommandContent('FIRE');

      // Assert
      content.sections.forEach(section => {
        expect(section.content).toBeInstanceOf(Array);
        expect(section.content.length).toBeGreaterThan(0);
        
        section.content.forEach(item => {
          expect(item.type).toBeTruthy();
          expect(item.content).toBeDefined();
        });
      });
    });
  });
});