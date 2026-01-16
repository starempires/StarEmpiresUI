# Requirements Document

## Introduction

This feature adds a semi-translucent syntax overlay to the OrdersPane that provides contextual help for Star Empires command syntax. The overlay displays available commands and their syntax based on the current cursor position and context, helping users learn and correctly format their orders without interrupting their typing workflow. The overlay is driven by the existing PEG grammar file and provides real-time, context-aware assistance.

## Glossary

- **Syntax Overlay**: A semi-translucent UI component that displays command syntax information over the orders text area
- **Context-Aware Display**: The overlay content changes based on the current cursor position and line content
- **Command Syntax**: The proper format and parameters required for each Star Empires command
- **PEG Grammar**: The existing grammar file (star-empires-grammar.peg) that defines valid command syntax
- **Orders Text Widget**: The multiline text field where users enter their empire orders
- **Command Keyword**: The first word of a command line (BUILD, FIRE, MOVE, etc.)
- **Blank Line**: A line containing no text or only whitespace
- **Comment Line**: A line that starts with a comment character or is treated as a comment
- **Non-Intrusive**: The overlay does not steal focus, block input, or interfere with typing
- **Scrollable Content**: The overlay can display more content than fits in the visible area and allows scrolling

## Requirements

### Requirement 1

**User Story:** As a player entering orders, I want to see a syntax overlay that shows me available commands and their syntax, so that I can learn the command format and reduce syntax errors.

#### Acceptance Criteria

1. WHEN the OrdersPane is displayed THEN the System SHALL show a semi-translucent syntax overlay by default
2. WHEN the overlay is visible THEN the System SHALL display command syntax information without blocking the underlying text area
3. WHEN a user types in the orders text area THEN the System SHALL maintain the overlay visibility and not steal focus from the text input
4. WHEN the overlay content exceeds the visible area THEN the System SHALL provide scrolling capability within the overlay
5. WHEN a user scrolls within the overlay THEN the System SHALL contain the scroll behavior to prevent the browser window from scrolling
6. WHEN the overlay is displayed THEN the System SHALL use semi-transparent styling that allows the underlying text to remain visible

### Requirement 2

**User Story:** As a player, I want to control the visibility of the syntax overlay, so that I can show or hide it based on my experience level and preference.

#### Acceptance Criteria

1. WHEN the OrdersPane loads THEN the System SHALL display the syntax overlay in a visible state by default
2. WHEN a user activates a show/hide control THEN the System SHALL toggle the overlay visibility immediately
3. WHEN the overlay is hidden THEN the System SHALL remember this preference for the current session
4. WHEN the overlay is shown after being hidden THEN the System SHALL restore the previous content and scroll position
5. WHEN the user toggles overlay visibility THEN the System SHALL provide clear visual feedback about the current state

### Requirement 3

**User Story:** As a player with my cursor on a blank or comment line, I want to see all available commands in the syntax overlay, so that I can choose which command to use next.

#### Acceptance Criteria

1. WHEN the cursor is positioned on a blank line THEN the System SHALL display all available Star Empires commands in the overlay
2. WHEN the cursor is positioned on a comment line THEN the System SHALL display all available Star Empires commands in the overlay
3. WHEN displaying all commands THEN the System SHALL organize them in a logical, easy-to-scan format
4. WHEN displaying all commands THEN the System SHALL include brief descriptions or syntax hints for each command
5. WHEN the command list exceeds the overlay height THEN the System SHALL make the content scrollable within the overlay

### Requirement 4

**User Story:** As a player with my cursor on a line that starts with a command keyword, I want to see the specific syntax for that command in the overlay, so that I can understand the required and optional parameters.

#### Acceptance Criteria

1. WHEN the cursor is on a line starting with a valid command keyword THEN the System SHALL display only the syntax for that specific command
2. WHEN displaying command-specific syntax THEN the System SHALL show required parameters, optional parameters, and parameter types
3. WHEN displaying command-specific syntax THEN the System SHALL provide examples or usage patterns for the command
4. WHEN the cursor moves to a line with a different command keyword THEN the System SHALL update the overlay to show the new command's syntax
5. WHEN the cursor moves from a command line to a blank line THEN the System SHALL switch from command-specific to all-commands display

### Requirement 5

**User Story:** As a player scrolling through my orders, I want the syntax overlay content to update based on my current cursor position, so that the displayed information is always relevant to where I'm working.

#### Acceptance Criteria

1. WHEN a user moves the cursor to a different line THEN the System SHALL update the overlay content to match the new context
2. WHEN a user scrolls the orders text area THEN the System SHALL maintain the overlay position relative to the text area
3. WHEN the cursor position changes THEN the System SHALL update the overlay content within 100ms for responsive feedback
4. WHEN the overlay content changes THEN the System SHALL use smooth transitions to avoid jarring visual updates
5. WHEN the user is actively typing THEN the System SHALL update the overlay content without interrupting the typing flow

### Requirement 6

**User Story:** As a developer, I want the syntax overlay to use the existing PEG grammar file as its source of truth, so that the displayed syntax information is always accurate and consistent with the actual parser.

#### Acceptance Criteria

1. WHEN the System initializes THEN the System SHALL load command definitions and syntax rules from the star-empires-grammar.peg file
2. WHEN displaying command syntax THEN the System SHALL derive all syntax information directly from the grammar rules
3. WHEN the grammar file is updated THEN the System SHALL reflect those changes in the overlay without code modifications
4. WHEN parsing command syntax THEN the System SHALL use the same grammar rules that validate the actual orders
5. WHEN extracting command information THEN the System SHALL handle all command types defined in the grammar file

### Requirement 7

**User Story:** As a player, I want the syntax overlay to be non-intrusive, so that it enhances my order entry experience without interfering with my normal workflow.

#### Acceptance Criteria

1. WHEN the overlay is visible THEN the System SHALL not capture mouse clicks or keyboard input intended for the text area
2. WHEN a user types in the orders text area THEN the System SHALL not interrupt or delay the typing experience
3. WHEN the overlay is displayed THEN the System SHALL not affect the existing autocomplete, validation, or helper text functionality
4. WHEN the overlay updates its content THEN the System SHALL not cause the text area to lose focus or cursor position
5. WHEN the overlay is visible THEN the System SHALL maintain all existing OrdersPane functionality including scrolling, selection, and editing

### Requirement 8

**User Story:** As a player, I want the syntax overlay to have appropriate visual design, so that it provides helpful information without being distracting or hard to read.

#### Acceptance Criteria

1. WHEN the overlay is displayed THEN the System SHALL use semi-transparent background that allows underlying text visibility
2. WHEN displaying syntax information THEN the System SHALL use clear, readable typography that contrasts well with the background
3. WHEN the overlay is visible THEN the System SHALL position it appropriately within the OrdersPane without obscuring critical UI elements
4. WHEN displaying different types of content THEN the System SHALL use consistent visual hierarchy and formatting
5. WHEN the overlay state changes THEN the System SHALL use smooth animations or transitions for a polished user experience

### Requirement 10

**User Story:** As a player scrolling within the syntax overlay, I want the scroll behavior to be contained within the overlay, so that I don't accidentally scroll the browser window when reviewing command syntax.

#### Acceptance Criteria

1. WHEN a user scrolls within the overlay content area THEN the System SHALL prevent scroll events from propagating to the browser window
2. WHEN the overlay has scrollable content THEN the System SHALL use scroll containment to isolate overlay scrolling from page scrolling
3. WHEN a user reaches the top or bottom of overlay content THEN the System SHALL not trigger browser window scrolling
4. WHEN the overlay is visible and has focus THEN the System SHALL capture all scroll events within the overlay boundaries
5. WHEN the overlay content is shorter than the available space THEN the System SHALL disable scrolling and prevent any scroll event handling

**User Story:** As a player, I want the syntax overlay to provide comprehensive command information, so that I can understand not just the syntax but also the purpose and usage of each command.

#### Acceptance Criteria

1. WHEN displaying command syntax THEN the System SHALL include parameter names, types, and whether they are required or optional
2. WHEN showing command information THEN the System SHALL provide brief descriptions of what each command does
3. WHEN displaying parameters THEN the System SHALL indicate valid value ranges or formats where applicable
4. WHEN showing command examples THEN the System SHALL use realistic, helpful examples that demonstrate proper usage
5. WHEN displaying all commands THEN the System SHALL group related commands together for easier navigation