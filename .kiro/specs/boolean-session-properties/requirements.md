# Requirements Document

## Introduction

This feature adds support for boolean session properties to the CreateSession page, extending the existing integer session properties system. The first boolean property to be implemented is `localizeFramesOfReference`, which will be displayed as a toggle switch alongside the existing integer property controls. Boolean properties will be included in the `overrideProperties` parameter when calling the `createSession` API, maintaining consistency with the existing integer properties architecture.

## Glossary

- **Session Properties**: Configuration parameters that define game behavior and rules for a specific session
- **Integer Session Properties**: Numeric configuration values with min/max constraints (e.g., radius, worldDensity)
- **Boolean Session Properties**: True/false configuration values displayed as toggle switches, defined with key, name, and default value
- **LocalizeFramesOfReference**: A boolean property that controls whether frame of reference calculations are localized in the game engine
- **Override Properties**: A key-value map passed to the createSession API containing all session configuration values
- **CreateSession Page**: The UI page where Game Masters configure and create new game sessions
- **Toggle Switch**: A UI control that allows users to switch between true/false values
- **Session Configuration**: The collection of all session properties (both integer and boolean) that define session behavior

## Requirements

### Requirement 1

**User Story:** As a Game Master creating a new session, I want to configure boolean session properties using toggle switches, so that I can control true/false game settings alongside existing numeric properties.

#### Acceptance Criteria

1. WHEN a GM views the CreateSession page THEN the System SHALL display a section for boolean session properties with toggle switches
2. WHEN a GM clicks a boolean property toggle THEN the System SHALL update the property value between true and false
3. WHEN a GM submits the session creation form THEN the System SHALL include boolean property values in the overrideProperties parameter
4. WHEN boolean properties are included in overrideProperties THEN the System SHALL convert boolean values to string format ("true"/"false")
5. WHEN the CreateSession page loads THEN the System SHALL initialize boolean properties with their default values

### Requirement 2

**User Story:** As a Game Master, I want to configure the localizeFramesOfReference property, so that I can control whether frame of reference calculations are localized for the session.

#### Acceptance Criteria

1. WHEN a GM views the boolean properties section THEN the System SHALL display a toggle for "Localize Frames of Reference"
2. WHEN the localizeFramesOfReference toggle is enabled THEN the System SHALL set the property value to true
3. WHEN the localizeFramesOfReference toggle is disabled THEN the System SHALL set the property value to false
4. WHEN the CreateSession page loads THEN the System SHALL initialize localizeFramesOfReference to true by default
5. WHEN the session is created THEN the System SHALL include localizeFramesOfReference in overrideProperties with the selected value

### Requirement 3

**User Story:** As a developer, I want boolean session properties to follow the same architectural patterns as integer properties, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. WHEN boolean properties are defined THEN the System SHALL use a centralized configuration structure with key, name, and defaultValue fields similar to INT_SESSION_PROPERTIES
2. WHEN boolean property values are managed THEN the System SHALL use React state management consistent with existing integer properties
3. WHEN boolean properties are processed for API calls THEN the System SHALL follow the same overrideProperties pattern as integer properties
4. WHEN new boolean properties are added THEN the System SHALL require only updates to the centralized BOOLEAN_SESSION_PROPERTIES configuration
5. WHEN boolean properties are rendered THEN the System SHALL use a consistent UI layout within the Session Parameters section

### Requirement 4

**User Story:** As a Game Master, I want boolean properties to be visually distinct from integer properties, so that I can easily identify and configure different types of session settings.

#### Acceptance Criteria

1. WHEN boolean properties are displayed THEN the System SHALL use toggle switches instead of text input fields
2. WHEN boolean properties are grouped THEN the System SHALL display them in a separate subsection from integer properties
3. WHEN a boolean property is toggled THEN the System SHALL provide immediate visual feedback showing the current state
4. WHEN boolean properties are labeled THEN the System SHALL use clear, descriptive names that indicate their purpose
5. WHEN the boolean properties section is rendered THEN the System SHALL maintain consistent spacing and alignment with integer properties

### Requirement 5

**User Story:** As a developer, I want the boolean properties system to be extensible, so that additional boolean properties can be easily added in the future.

#### Acceptance Criteria

1. WHEN the boolean properties system is implemented THEN the System SHALL support adding new properties through BOOLEAN_SESSION_PROPERTIES configuration updates only
2. WHEN boolean property definitions are stored THEN the System SHALL use a typed BooleanSessionPropertyDef interface with key, name, and defaultValue fields
3. WHEN boolean properties are processed THEN the System SHALL handle an arbitrary number of boolean properties defined in the configuration
4. WHEN boolean property state is managed THEN the System SHALL initialize values from the defaultValue field in property definitions
5. WHEN boolean properties are validated THEN the System SHALL ensure all defined properties have valid boolean values

### Requirement 6

**User Story:** As a Game Master, I want the session creation process to remain unchanged except for the addition of boolean properties, so that existing workflows continue to work seamlessly.

#### Acceptance Criteria

1. WHEN a GM creates a session with boolean properties THEN the System SHALL maintain all existing session creation functionality
2. WHEN the createSession API is called THEN the System SHALL include both integer and boolean properties in overrideProperties
3. WHEN session creation succeeds THEN the System SHALL navigate to the home page as before
4. WHEN session creation fails THEN the System SHALL display error messages using the existing error handling system
5. WHEN the session creation form is validated THEN the System SHALL apply existing validation rules plus boolean property validation