import { describe, it, expect, beforeEach } from 'vitest';
import { GrammarService, CommandDefinition, CommandCategory } from '../../src/services/GrammarService';

/**
 * Unit Tests for GrammarService
 * 
 * These tests verify the grammar service can extract command definitions
 * and provide accurate syntax information for the orders overlay system.
 */
describe('GrammarService - Unit Tests', () => {
  let grammarService: GrammarService;

  beforeEach(() => {
    grammarService = new GrammarService();
  });

  describe('getAllCommandDefinitions', () => {
    it('should return a map of command definitions', () => {
      // Act
      const commands = grammarService.getAllCommandDefinitions();

      // Assert
      expect(commands).toBeInstanceOf(Map);
      expect(commands.size).toBeGreaterThan(0);
    });

    it('should include all expected Star Empires commands', () => {
      // Arrange
      const expectedCommands = [
        'AUTHORIZE', 'DENY', 'BUILD', 'DEPLOY', 'DESIGN', 'DESTRUCT',
        'FIRE', 'GIVE', 'LOAD', 'MOVE', 'POOL', 'REPAIR', 'TOGGLE', 'TRANSFER'
      ];

      // Act
      const commands = grammarService.getAllCommandDefinitions();

      // Assert
      expectedCommands.forEach(commandName => {
        expect(commands.has(commandName)).toBe(true);
      });
    });

    it('should return command definitions with required properties', () => {
      // Act
      const commands = grammarService.getAllCommandDefinitions();
      const buildCommand = commands.get('BUILD');

      // Assert
      expect(buildCommand).toBeDefined();
      expect(buildCommand!.name).toBe('BUILD');
      expect(buildCommand!.description).toBeTruthy();
      expect(buildCommand!.syntax).toBeTruthy();
      expect(buildCommand!.parameters).toBeInstanceOf(Array);
      expect(buildCommand!.examples).toBeInstanceOf(Array);
      expect(buildCommand!.category).toBeTruthy();
    });
  });

  describe('getCommandDefinition', () => {
    it('should return command definition for valid command name', () => {
      // Act
      const command = grammarService.getCommandDefinition('BUILD');

      // Assert
      expect(command).toBeDefined();
      expect(command!.name).toBe('BUILD');
      expect(command!.category).toBe('construction');
    });

    it('should return command definition for lowercase command name', () => {
      // Act
      const command = grammarService.getCommandDefinition('build');

      // Assert
      expect(command).toBeDefined();
      expect(command!.name).toBe('BUILD');
    });

    it('should return null for invalid command name', () => {
      // Act
      const command = grammarService.getCommandDefinition('INVALID');

      // Assert
      expect(command).toBeNull();
    });

    it('should return null for empty command name', () => {
      // Act
      const command = grammarService.getCommandDefinition('');

      // Assert
      expect(command).toBeNull();
    });
  });

  describe('getCommandsByCategory', () => {
    it('should return commands organized by category', () => {
      // Act
      const commandsByCategory = grammarService.getCommandsByCategory();

      // Assert
      expect(commandsByCategory).toBeInstanceOf(Map);
      expect(commandsByCategory.size).toBeGreaterThan(0);
    });

    it('should include expected categories', () => {
      // Arrange
      const expectedCategories: CommandCategory[] = [
        'combat', 'construction', 'movement', 'administration', 'design', 'resource'
      ];

      // Act
      const commandsByCategory = grammarService.getCommandsByCategory();

      // Assert
      expectedCategories.forEach(category => {
        expect(commandsByCategory.has(category)).toBe(true);
      });
    });

    it('should place BUILD command in construction category', () => {
      // Act
      const commandsByCategory = grammarService.getCommandsByCategory();
      const constructionCommands = commandsByCategory.get('construction');

      // Assert
      expect(constructionCommands).toBeDefined();
      expect(constructionCommands!.some(cmd => cmd.name === 'BUILD')).toBe(true);
    });

    it('should place FIRE command in combat category', () => {
      // Act
      const commandsByCategory = grammarService.getCommandsByCategory();
      const combatCommands = commandsByCategory.get('combat');

      // Assert
      expect(combatCommands).toBeDefined();
      expect(combatCommands!.some(cmd => cmd.name === 'FIRE')).toBe(true);
    });

    it('should sort commands within categories alphabetically', () => {
      // Act
      const commandsByCategory = grammarService.getCommandsByCategory();

      // Assert
      commandsByCategory.forEach(commands => {
        const commandNames = commands.map(cmd => cmd.name);
        const sortedNames = [...commandNames].sort();
        expect(commandNames).toEqual(sortedNames);
      });
    });
  });

  describe('command definitions validation', () => {
    it('should have valid parameter definitions for BUILD command', () => {
      // Act
      const buildCommand = grammarService.getCommandDefinition('BUILD');

      // Assert
      expect(buildCommand).toBeDefined();
      expect(buildCommand!.parameters.length).toBeGreaterThan(0);
      
      const worldParam = buildCommand!.parameters.find(p => p.name === 'world');
      expect(worldParam).toBeDefined();
      expect(worldParam!.required).toBe(true);
      expect(worldParam!.type).toBe('world');
    });

    it('should have valid examples for FIRE command', () => {
      // Act
      const fireCommand = grammarService.getCommandDefinition('FIRE');

      // Assert
      expect(fireCommand).toBeDefined();
      expect(fireCommand!.examples.length).toBeGreaterThan(0);
      expect(fireCommand!.examples[0]).toContain('FIRE');
    });

    it('should have proper syntax format for all commands', () => {
      // Act
      const commands = grammarService.getAllCommandDefinitions();

      // Assert
      commands.forEach(command => {
        expect(command.syntax).toBeTruthy();
        expect(command.syntax).toContain(command.name);
      });
    });
  });
});