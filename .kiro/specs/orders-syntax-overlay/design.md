# Design Document: Orders Syntax Overlay

## Overview

This design implements a context-aware syntax overlay for the OrdersPane that provides real-time command syntax assistance. The overlay appears as a semi-translucent panel positioned within the OrdersPane, displaying either all available commands or specific command syntax based on the current cursor context. The system leverages the existing PEG grammar file to ensure accuracy and consistency with the actual command parser.

The design follows a non-intrusive approach where the overlay enhances the user experience without interfering with normal text editing workflows. The overlay updates dynamically as users navigate through their orders, providing contextual help that adapts to their current focus.

## Architecture

### High-Level Architecture

The syntax overlay system consists of several key components:

1. **Grammar Parser Integration**: Extends existing GrammarService to extract command definitions and syntax rules
2. **Context Analysis Engine**: Analyzes cursor position and line content to determine appropriate overlay content
3. **Overlay Content Generator**: Creates formatted syntax information based on context and grammar rules
4. **Overlay UI Component**: Renders the semi-translucent overlay with scrolling and visibility controls
5. **OrdersPane Integration**: Seamlessly integrates overlay into existing OrdersPane without disrupting functionality

### Component Interaction Flow

```
User Cursor Movement
    ↓
Context Analysis (line content, cursor position)
    ↓
Grammar Rule Lookup
    ↓
┌─────────────────────┬─────────────────────┐
│   All Commands      │    Specific Command │
│   Display           │    Syntax Display   │
└─────────────────────┴─────────────────────┘
    ↓                           ↓
Content Generation          Content Generation
    ↓                           ↓
Overlay Update with Smooth Transitions
```

## Components and Interfaces

### 1. Enhanced Grammar Service

**Extended Service**: `GrammarService`

The existing GrammarService will be extended to provide command metadata extraction capabilities for the syntax overlay.

```typescript
interface CommandDefinition {
  name: string;
  description: string;
  syntax: string;
  parameters: ParameterDefinition[];
  examples: string[];
  category: CommandCategory;
}

interface ParameterDefinition {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  validValues?: string[];
  format?: string;
}

type CommandCategory = 'combat' | 'construction' | 'movement' | 'administration' | 'design' | 'resource';
type ParameterType = 'ship' | 'world' | 'coordinate' | 'empire' | 'shipclass' | 'number' | 'identifier' | 'storm' | 'portal';

class GrammarService {
  // Existing methods...
  
  /**
   * Extract all command definitions from the PEG grammar
   */
  getAllCommandDefinitions(): Map<string, CommandDefinition> {
    // Parse PEG grammar to extract command rules and metadata
    const commands = new Map<string, CommandDefinition>();
    
    // Extract commands from grammar rules
    const grammarRules = this.parseGrammarRules();
    
    grammarRules.forEach(rule => {
      if (this.isCommandRule(rule)) {
        const commandDef = this.extractCommandDefinition(rule);
        commands.set(commandDef.name, commandDef);
      }
    });
    
    return commands;
  }

  /**
   * Get command definition by name
   */
  getCommandDefinition(commandName: string): CommandDefinition | null {
    const commands = this.getAllCommandDefinitions();
    return commands.get(commandName.toUpperCase()) || null;
  }

  /**
   * Get commands by category for organized display
   */
  getCommandsByCategory(): Map<CommandCategory, CommandDefinition[]> {
    const commands = this.getAllCommandDefinitions();
    const categorized = new Map<CommandCategory, CommandDefinition[]>();
    
    commands.forEach(command => {
      if (!categorized.has(command.category)) {
        categorized.set(command.category, []);
      }
      categorized.get(command.category)!.push(command);
    });
    
    return categorized;
  }

  private parseGrammarRules(): GrammarRule[] {
    // Parse the PEG grammar file to extract rule definitions
    // This will analyze the grammar structure to identify commands and their syntax
  }

  private extractCommandDefinition(rule: GrammarRule): CommandDefinition {
    // Extract command metadata from grammar rule
    // Parse parameter definitions, types, and requirements
    // Generate human-readable descriptions and examples
  }
}
```

### 2. Context Analysis Engine

**New Service**: `OverlayContextAnalyzer`

This service analyzes the current cursor position and text content to determine what information should be displayed in the overlay.

```typescript
interface OverlayContext {
  type: 'all-commands' | 'specific-command' | 'hidden';
  commandName?: string;
  lineContent: string;
  cursorPosition: number;
  lineNumber: number;
}

class OverlayContextAnalyzer {
  private grammarService: GrammarService;

  constructor(grammarService: GrammarService) {
    this.grammarService = grammarService;
  }

  /**
   * Analyze current context to determine overlay content
   */
  analyzeContext(
    text: string, 
    cursorPosition: number
  ): OverlayContext {
    const lines = text.split('\n');
    const beforeCursor = text.substring(0, cursorPosition);
    const currentLineIndex = beforeCursor.split('\n').length - 1;
    const currentLine = lines[currentLineIndex] || '';
    
    // Determine context type based on line content
    if (this.isBlankLine(currentLine) || this.isCommentLine(currentLine)) {
      return {
        type: 'all-commands',
        lineContent: currentLine,
        cursorPosition,
        lineNumber: currentLineIndex
      };
    }
    
    const commandName = this.extractCommandName(currentLine);
    if (commandName && this.grammarService.getCommandDefinition(commandName)) {
      return {
        type: 'specific-command',
        commandName,
        lineContent: currentLine,
        cursorPosition,
        lineNumber: currentLineIndex
      };
    }
    
    // Default to all commands for unrecognized content
    return {
      type: 'all-commands',
      lineContent: currentLine,
      cursorPosition,
      lineNumber: currentLineIndex
    };
  }

  private isBlankLine(line: string): boolean {
    return line.trim().length === 0;
  }

  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith(';');
  }

  private extractCommandName(line: string): string | null {
    const words = line.trim().split(/\s+/);
    const firstWord = words[0];
    
    if (!firstWord) return null;
    
    // Check if first word is a valid command
    return this.grammarService.getCommandDefinition(firstWord) ? firstWord : null;
  }
}
```

### 3. Overlay Content Generator

**New Service**: `OverlayContentGenerator`

This service generates formatted content for the overlay based on the current context.

```typescript
interface OverlayContent {
  type: 'all-commands' | 'specific-command';
  title: string;
  sections: OverlaySection[];
  scrollable: boolean;
}

interface OverlaySection {
  title?: string;
  content: OverlayItem[];
  collapsible?: boolean;
  expanded?: boolean;
}

interface OverlayItem {
  type: 'command' | 'syntax' | 'parameter' | 'example' | 'description';
  content: string;
  highlight?: boolean;
  indent?: number;
}

class OverlayContentGenerator {
  private grammarService: GrammarService;

  constructor(grammarService: GrammarService) {
    this.grammarService = grammarService;
  }

  /**
   * Generate content for all commands display
   */
  generateAllCommandsContent(): OverlayContent {
    const commandsByCategory = this.grammarService.getCommandsByCategory();
    const sections: OverlaySection[] = [];

    commandsByCategory.forEach((commands, category) => {
      const categorySection: OverlaySection = {
        title: this.formatCategoryTitle(category),
        content: [],
        collapsible: true,
        expanded: true
      };

      commands.forEach(command => {
        categorySection.content.push({
          type: 'command',
          content: `${command.name} - ${command.description}`,
          highlight: false
        });
        
        categorySection.content.push({
          type: 'syntax',
          content: command.syntax,
          indent: 1
        });
      });

      sections.push(categorySection);
    });

    return {
      type: 'all-commands',
      title: 'Available Commands',
      sections,
      scrollable: true
    };
  }

  /**
   * Generate content for specific command display
   */
  generateCommandContent(commandName: string): OverlayContent {
    const command = this.grammarService.getCommandDefinition(commandName);
    if (!command) {
      return this.generateAllCommandsContent();
    }

    const sections: OverlaySection[] = [
      {
        title: 'Syntax',
        content: [
          {
            type: 'syntax',
            content: command.syntax,
            highlight: true
          }
        ]
      },
      {
        title: 'Description',
        content: [
          {
            type: 'description',
            content: command.description
          }
        ]
      }
    ];

    // Add parameters section if command has parameters
    if (command.parameters.length > 0) {
      const parameterSection: OverlaySection = {
        title: 'Parameters',
        content: []
      };

      command.parameters.forEach(param => {
        const requiredText = param.required ? 'Required' : 'Optional';
        parameterSection.content.push({
          type: 'parameter',
          content: `${param.name} (${param.type}) - ${requiredText}`,
          highlight: param.required
        });
        
        parameterSection.content.push({
          type: 'description',
          content: param.description,
          indent: 1
        });
      });

      sections.push(parameterSection);
    }

    // Add examples section if available
    if (command.examples.length > 0) {
      const exampleSection: OverlaySection = {
        title: 'Examples',
        content: command.examples.map(example => ({
          type: 'example',
          content: example
        }))
      };

      sections.push(exampleSection);
    }

    return {
      type: 'specific-command',
      title: `${command.name} Command`,
      sections,
      scrollable: sections.length > 2 || command.parameters.length > 3
    };
  }

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
}
```

### 4. Syntax Overlay Component

**New Component**: `SyntaxOverlay`

This React component renders the semi-translucent overlay with the generated content.

```typescript
interface SyntaxOverlayProps {
  visible: boolean;
  content: OverlayContent | null;
  position: { top: number; left: number; width: number; height: number };
  onToggleVisibility: () => void;
  onContentScroll?: (scrollTop: number) => void;
}

const SyntaxOverlay: React.FC<SyntaxOverlayProps> = ({
  visible,
  content,
  position,
  onToggleVisibility,
  onContentScroll
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollPosition(scrollTop);
    onContentScroll?.(scrollTop);
  }, [onContentScroll]);

  if (!visible || !content) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        backgroundColor: 'rgba(248, 249, 250, 0.92)',
        backdropFilter: 'blur(2px)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        overflow: 'hidden',
        pointerEvents: 'none', // Allow clicks to pass through to text area
        zIndex: 100, // Lower than autocomplete and validation overlays
        transition: 'opacity 0.2s ease-in-out',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
      }}
    >
      {/* Header with title and toggle button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          pointerEvents: 'auto', // Allow interaction with header
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 'bold',
            color: 'text.primary',
            fontSize: '0.75rem'
          }}
        >
          {content.title}
        </Typography>
        
        <IconButton
          size="small"
          onClick={onToggleVisibility}
          sx={{
            padding: '2px',
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
          aria-label="Toggle syntax overlay"
        >
          <VisibilityOffIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Scrollable content area */}
      <Box
        ref={contentRef}
        onScroll={handleScroll}
        sx={{
          height: 'calc(100% - 40px)', // Subtract header height
          overflowY: content.scrollable ? 'auto' : 'hidden',
          padding: '8px 12px',
          pointerEvents: 'auto', // Allow scrolling
          scrollBehavior: 'smooth',
          // Critical scroll containment properties
          overscrollBehavior: 'contain',
          overscrollBehaviorY: 'contain',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '3px',
          },
        }}
        onWheel={(e) => {
          // Critical: Stop propagation to prevent browser window scrolling
          e.stopPropagation();
          
          // Prevent scroll events from bubbling to parent when at scroll boundaries
          const element = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = element;
          
          // Only prevent default at boundaries to maintain smooth scrolling within overlay
          if (
            (e.deltaY < 0 && scrollTop === 0) ||
            (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)
          ) {
            e.preventDefault();
          }
        }}
      >
        {content.sections.map((section, sectionIndex) => (
          <Box key={sectionIndex} sx={{ marginBottom: 2 }}>
            {section.title && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  display: 'block',
                  marginBottom: 0.5,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                {section.title}
              </Typography>
            )}
            
            {section.content.map((item, itemIndex) => (
              <Box
                key={itemIndex}
                sx={{
                  marginLeft: item.indent ? `${item.indent * 12}px` : 0,
                  marginBottom: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: this.getItemColor(item.type, item.highlight),
                    fontWeight: item.highlight ? 'bold' : 'normal',
                    fontFamily: item.type === 'syntax' || item.type === 'example' ? 'monospace' : 'inherit',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    display: 'block',
                    whiteSpace: item.type === 'syntax' || item.type === 'example' ? 'pre-wrap' : 'normal'
                  }}
                >
                  {item.content}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );

  private getItemColor(type: OverlayItem['type'], highlight?: boolean) {
    if (highlight) return 'primary.main';
    
    switch (type) {
      case 'command': return 'text.primary';
      case 'syntax': return 'success.main';
      case 'parameter': return 'info.main';
      case 'example': return 'warning.main';
      case 'description': return 'text.secondary';
      default: return 'text.primary';
    }
  }
};
```

### 5. OrdersPane Integration

**Enhanced Component**: `OrdersPane`

The existing OrdersPane will be enhanced to include the syntax overlay with minimal changes to existing functionality.

```typescript
// Additional state for syntax overlay
const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
const [overlayContent, setOverlayContent] = useState<OverlayContent | null>(null);
const [overlayContext, setOverlayContext] = useState<OverlayContext | null>(null);

// Initialize overlay services
const overlayServices = useMemo(() => {
  const contextAnalyzer = new OverlayContextAnalyzer(services.grammarService);
  const contentGenerator = new OverlayContentGenerator(services.grammarService);
  
  return {
    contextAnalyzer,
    contentGenerator
  };
}, [services.grammarService]);

// Update overlay content based on cursor position
const updateOverlayContent = useCallback((
  text: string, 
  cursorPosition: number
) => {
  if (!overlayVisible) return;
  
  const context = overlayServices.contextAnalyzer.analyzeContext(text, cursorPosition);
  setOverlayContext(context);
  
  let content: OverlayContent | null = null;
  
  switch (context.type) {
    case 'all-commands':
      content = overlayServices.contentGenerator.generateAllCommandsContent();
      break;
    case 'specific-command':
      if (context.commandName) {
        content = overlayServices.contentGenerator.generateCommandContent(context.commandName);
      }
      break;
    case 'hidden':
      content = null;
      break;
  }
  
  setOverlayContent(content);
}, [overlayVisible, overlayServices]);

// Enhanced text change handler
const handleTextChange = useCallback((newText: string) => {
  setOrdersText(newText);

  // Clear existing debounce timeout
  if (debounceTimeoutRef.current) {
    clearTimeout(debounceTimeoutRef.current);
  }

  // Set new debounced timeout for autocomplete, validation, and overlay
  debounceTimeoutRef.current = setTimeout(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const currentCursor = textarea.selectionStart || 0;

    // Existing autocomplete logic...
    
    // Update overlay content
    updateOverlayContent(newText, currentCursor);
    
    // Existing validation logic...
  }, DEBOUNCE_DELAY);
}, [/* existing dependencies */, updateOverlayContent]);

// Enhanced cursor change handler
const handleCursorChange = useCallback((event: React.SyntheticEvent<HTMLTextAreaElement>) => {
  const textarea = event.currentTarget;
  const newCursorPosition = textarea.selectionStart || 0;

  // Existing autocomplete logic...
  
  // Update overlay content for new cursor position
  updateOverlayContent(ordersText, newCursorPosition);
}, [ordersText, /* existing dependencies */, updateOverlayContent]);

// Calculate overlay position within the text area
const calculateOverlayPosition = useCallback(() => {
  if (!textAreaRef.current) {
    return { top: 0, left: 0, width: 0, height: 0 };
  }
  
  const textArea = textAreaRef.current;
  const textAreaRect = textArea.getBoundingClientRect();
  
  // Position overlay in the right portion of the text area
  const overlayWidth = Math.min(300, textAreaRect.width * 0.4);
  const overlayHeight = textAreaRect.height - 20; // Leave margin
  
  return {
    top: 10,
    left: textAreaRect.width - overlayWidth - 10,
    width: overlayWidth,
    height: overlayHeight
  };
}, []);

// Toggle overlay visibility
const toggleOverlayVisibility = useCallback(() => {
  setOverlayVisible(prev => !prev);
}, []);

// In the render method, add the overlay component
return (
  <React.Fragment>
    {/* Existing components... */}
    
    <Box sx={{ /* existing text area container styles */ }}>
      <TextField
        {/* existing TextField props */}
      />
      
      {/* Existing validation indicators */}
      <ValidationIndicators {/* existing props */} />
      
      {/* New syntax overlay */}
      <SyntaxOverlay
        visible={overlayVisible}
        content={overlayContent}
        position={calculateOverlayPosition()}
        onToggleVisibility={toggleOverlayVisibility}
      />
    </Box>
    
    {/* Existing components... */}
  </React.Fragment>
);
```

## Data Models

### Grammar Metadata Extraction

The system will parse the existing PEG grammar file to extract command definitions:

```typescript
interface GrammarRule {
  name: string;
  type: 'command' | 'parameter' | 'literal' | 'choice' | 'sequence';
  definition: string;
  children: GrammarRule[];
  metadata?: {
    description?: string;
    examples?: string[];
    category?: CommandCategory;
  };
}

interface ParsedGrammar {
  rules: Map<string, GrammarRule>;
  commands: Map<string, CommandDefinition>;
  metadata: {
    version?: string;
    lastModified?: Date;
  };
}
```

### Overlay State Management

```typescript
interface OverlayState {
  visible: boolean;
  content: OverlayContent | null;
  context: OverlayContext | null;
  position: OverlayPosition;
  scrollPosition: number;
  lastUpdate: number;
}

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Now I'll use the prework tool to analyze the acceptance criteria for testability:

<function_calls>
<invoke name="prework">
<parameter name="featureName">orders-syntax-overlay

After reviewing the prework analysis, I'll consolidate redundant properties and create comprehensive correctness properties:

### Property 1: Overlay visibility and non-intrusive behavior
*For any* OrdersPane instance, the syntax overlay should be visible by default, allow toggling visibility, and never interfere with text area interactions (clicks, typing, focus)
**Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 7.1, 7.2, 7.4, 7.5**

### Property 2: Context-aware content display
*For any* cursor position in the orders text, the overlay should display all commands when on blank/comment lines and specific command syntax when on command lines
**Validates: Requirements 3.1, 3.2, 4.1, 4.4, 4.5, 5.1**

### Property 3: Content organization and completeness
*For any* command display mode, the overlay should organize commands by category, include descriptions and syntax information, and show complete parameter details with required/optional indicators
**Validates: Requirements 3.3, 3.4, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 4: Scrolling and content management
*For any* overlay content that exceeds the visible area, the system should provide scrolling capability, maintain scroll position when toggling visibility, and contain scroll behavior to prevent browser window scrolling
**Validates: Requirements 1.4, 1.5, 2.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 5: Performance and responsiveness
*For any* cursor position change or content update, the overlay should update within 100ms without interrupting typing flow or affecting text area performance
**Validates: Requirements 5.3, 5.5, 7.2**

### Property 6: Grammar integration consistency
*For any* command syntax displayed in the overlay, the information should be derived directly from the PEG grammar file and match the validation rules used elsewhere in the system
**Validates: Requirements 6.1, 6.2, 6.4, 6.5**

### Property 7: Visual design and positioning
*For any* overlay display state, the system should use semi-transparent styling, appropriate positioning within OrdersPane, smooth transitions, and consistent visual hierarchy
**Validates: Requirements 1.5, 5.2, 5.4, 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 8: Session state persistence
*For any* overlay visibility toggle, the system should remember the preference for the current session and restore previous content and scroll position when re-shown
**Validates: Requirements 2.3, 2.4, 2.5**

### Property 9: Compatibility with existing features
*For any* overlay operation, the system should maintain full compatibility with existing autocomplete, validation, helper text, and all other OrdersPane functionality
**Validates: Requirements 7.3, 7.5**

## Error Handling

The syntax overlay system includes comprehensive error handling:

### Grammar Parsing Errors
- **Fallback Content**: If grammar parsing fails, display a basic command list from hardcoded definitions
- **Error Logging**: Log grammar parsing errors for debugging without affecting user experience
- **Graceful Degradation**: Continue operating with reduced functionality if grammar service is unavailable

### Content Generation Errors
- **Safe Defaults**: Use safe default content when command definitions are missing or malformed
- **Validation**: Validate generated content before display to prevent rendering errors
- **Recovery**: Automatically retry content generation on transient failures

### UI Rendering Errors
- **Error Boundaries**: Implement React error boundaries to prevent overlay errors from crashing the entire OrdersPane
- **Fallback UI**: Display minimal overlay with basic functionality if full rendering fails
- **State Recovery**: Preserve overlay state and attempt recovery on rendering errors

### Performance Safeguards
- **Debouncing**: Prevent excessive updates during rapid cursor movement or typing
- **Content Limits**: Limit overlay content size to prevent performance issues
- **Memory Management**: Clean up resources and prevent memory leaks during component lifecycle

## Testing Strategy

The syntax overlay system will use a comprehensive testing approach combining unit tests, property-based tests, and integration tests.

### Unit Testing
- **Component Rendering**: Test that overlay components render correctly with various content types
- **Service Logic**: Test grammar parsing, context analysis, and content generation services
- **Event Handling**: Test user interactions like toggling visibility and scrolling
- **Error Conditions**: Test error handling and fallback behaviors

### Property-Based Testing
Each correctness property will be implemented as property-based tests using fast-check:

- **Property 1**: Test overlay visibility and non-intrusive behavior across different OrdersPane states
- **Property 2**: Test context-aware content display with various cursor positions and text content
- **Property 3**: Test content organization and completeness with different command sets
- **Property 4**: Test scrolling behavior with various content sizes and scroll positions
- **Property 5**: Test performance requirements with rapid cursor movements and content changes
- **Property 6**: Test grammar integration consistency by comparing overlay content with grammar rules
- **Property 7**: Test visual design properties with different overlay states and content types
- **Property 8**: Test session state persistence across component mount/unmount cycles
- **Property 9**: Test compatibility by verifying existing features work with overlay active

### Integration Testing
- **OrdersPane Integration**: Test complete workflow of overlay within OrdersPane context
- **Grammar Service Integration**: Test integration with existing grammar parsing functionality
- **Performance Testing**: Test overlay performance impact on overall OrdersPane responsiveness
- **Cross-browser Testing**: Verify overlay behavior across different browsers and devices

### Testing Configuration
- **Minimum 100 iterations** per property test for thorough coverage
- **Test tags**: Each property test tagged with format: **Feature: orders-syntax-overlay, Property {number}: {property_text}**
- **Mock Strategy**: Use minimal mocking to test real integration behavior
- **Test Data**: Generate realistic command definitions and text content for comprehensive testing

The testing strategy ensures that the syntax overlay enhances the user experience while maintaining the reliability and performance of the existing OrdersPane functionality.