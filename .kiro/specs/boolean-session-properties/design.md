# Design Document: Boolean Session Properties

## Overview

This design extends the CreateSession page to support boolean session properties alongside the existing integer properties system. The implementation introduces a new `BOOLEAN_SESSION_PROPERTIES` configuration structure that mirrors the existing `INT_SESSION_PROPERTIES` pattern, with the first property being `localizeFramesOfReference`. Boolean properties will be displayed as Material-UI Switch components in a dedicated subsection within the Session Parameters area, and their values will be included in the `overrideProperties` parameter when calling the `createSession` API.

The design maintains architectural consistency with the existing integer properties system while providing a distinct user experience for boolean toggles. This approach ensures that adding new boolean properties in the future requires only configuration updates without code changes.

## Architecture

### High-Level Architecture

The boolean session properties system follows the same architectural patterns as the existing integer properties:

1. **Centralized Configuration**: `BOOLEAN_SESSION_PROPERTIES` object defining all boolean properties
2. **State Management**: React state for tracking boolean property values
3. **UI Rendering**: Material-UI Switch components in a dedicated subsection
4. **API Integration**: Boolean values converted to strings and included in `overrideProperties`

### Component Interaction Flow

```
User Toggles Switch
    ↓
React State Update (boolean value)
    ↓
UI Re-render (Switch reflects new state)
    ↓
Form Submission
    ↓
Convert boolean to string ("true"/"false")
    ↓
Include in overrideProperties
    ↓
Call createSession API
```

## Components and Interfaces

### 1. Boolean Property Definition Interface

**New Interface**: `BooleanSessionPropertyDef`

```typescript
interface BooleanSessionPropertyDef {
  key: string;
  name: string;
  defaultValue: boolean;
}
```

**Purpose**: Define the structure for boolean session properties, mirroring the `IntSessionPropertyDef` interface

### 2. Boolean Properties Configuration

**New Constant**: `BOOLEAN_SESSION_PROPERTIES`

```typescript
const BOOLEAN_SESSION_PROPERTIES: Record<string, BooleanSessionPropertyDef> = {
  localizeFramesOfReference: {
    key: 'localizeFramesOfReference',
    name: 'Localize Frames of Reference',
    defaultValue: false,
  },
};

const BOOLEAN_SESSION_PROPERTIES_LIST: BooleanSessionPropertyDef[] = Object.values(BOOLEAN_SESSION_PROPERTIES);
```

**Purpose**: Centralized configuration for all boolean session properties, allowing easy addition of new properties

### 3. Updated CreateSessionPage State Management

**New State Variable**: `booleanConfigValues`

```typescript
const [booleanConfigValues, setBooleanConfigValues] = useState<Record<string, boolean>>(
  () => Object.fromEntries(BOOLEAN_SESSION_PROPERTIES_LIST.map(def => [def.key, def.defaultValue]))
);
```

**Purpose**: Manage boolean property values separately from integer properties while following the same pattern

### 4. Updated handleSubmit Function

**Modified Logic**: Include boolean properties in `overrideProperties`

```typescript
const handleSubmit = async () => {
  // ... existing logic ...
  
  const intOverrideProperties: Record<string, string> =
    Object.fromEntries(Object.entries(configValues).map(([k, v]) => [k, String(v)]));
  
  const booleanOverrideProperties: Record<string, string> =
    Object.fromEntries(Object.entries(booleanConfigValues).map(([k, v]) => [k, String(v)]));
  
  const overrideProperties: Record<string, string> = {
    ...intOverrideProperties,
    ...booleanOverrideProperties,
  };
  
  const createResult = await createSession(sessionName, overrideProperties);
  
  // ... rest of existing logic ...
};
```

**Purpose**: Combine integer and boolean properties into a single `overrideProperties` object for the API call

### 5. Boolean Properties UI Section

**New UI Component**: Boolean Properties Subsection

```tsx
{/* Boolean Session Properties */}
<Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Boolean Properties</Typography>

<Grid container spacing={2}>
  {BOOLEAN_SESSION_PROPERTIES_LIST.map((def) => (
    <Grid key={def.key} size={{ xs: 12, sm: 6, md: 4 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={booleanConfigValues[def.key]}
              onChange={(e) => {
                setBooleanConfigValues(prev => ({ 
                  ...prev, 
                  [def.key]: e.target.checked 
                }));
              }}
              color="primary"
            />
          }
          label={def.name}
          labelPlacement="start"
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            width: '100%',
            margin: 0 
          }}
        />
      </Paper>
    </Grid>
  ))}
</Grid>
```

**Purpose**: Render boolean properties as toggle switches in a consistent layout with integer properties

## Data Models

### Existing Models (No Changes Required)

The boolean properties feature does not require any changes to existing data models or database schemas. The `createSession` API already accepts an `overrideProperties` parameter as a `Record<string, string>`, which will now include both integer and boolean properties.

**API Payload Example**:
```typescript
{
  sessionName: "TestSession",
  overrideProps: {
    // Integer properties (existing)
    "radius": "5",
    "worldDensity": "7",
    "maxStormIntensity": "3",
    
    // Boolean properties (new)
    "localizeFramesOfReference": "false"
  }
}
```

### State Management Models

**Integer Properties State** (existing):
```typescript
configValues: Record<string, number>
// Example: { radius: 5, worldDensity: 7, maxStormIntensity: 3 }
```

**Boolean Properties State** (new):
```typescript
booleanConfigValues: Record<string, boolean>
// Example: { localizeFramesOfReference: false }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Boolean toggle state synchronization
*For any* boolean session property, when the toggle switch is clicked, the corresponding state value should be updated to reflect the toggle's new position
**Validates: Requirements 1.2, 2.2, 2.3**

### Property 2: Boolean to string conversion
*For any* boolean property value, when included in overrideProperties, true should become "true" and false should become "false"
**Validates: Requirements 1.4**

### Property 3: Default value initialization
*For any* boolean session property defined in BOOLEAN_SESSION_PROPERTIES, when the CreateSession page loads, the property should be initialized with its defined defaultValue
**Validates: Requirements 1.5, 5.4**

### Property 4: Complete property inclusion in API calls
*For any* set of boolean properties, when the session creation form is submitted, all boolean properties should be included in the overrideProperties parameter
**Validates: Requirements 1.3, 2.5**

### Property 5: Visual state reflection
*For any* boolean property, the Switch component should visually reflect the current boolean state value
**Validates: Requirements 4.3**

### Property 6: Scalable property handling
*For any* number of boolean properties defined in BOOLEAN_SESSION_PROPERTIES, the system should handle rendering, state management, and API submission correctly
**Validates: Requirements 5.3**

### Property 7: Boolean value validation
*For any* boolean property state, the value should always be a valid boolean (true or false)
**Validates: Requirements 5.5**

### Property 8: Combined properties in API
*For any* session creation request, both integer and boolean properties should be included together in the overrideProperties parameter
**Validates: Requirements 6.2**

### Property 9: Existing functionality preservation
*For any* session creation workflow, adding boolean properties should not break existing integer property handling or form submission
**Validates: Requirements 6.1, 6.5**

## Error Handling

### Input Validation Errors

**Error Types**:
1. `INVALID_BOOLEAN_VALUE`: Boolean property has non-boolean value in state
2. `MISSING_BOOLEAN_PROPERTY`: Required boolean property missing from configuration
3. `API_SUBMISSION_ERROR`: Error including boolean properties in createSession call

**Error Handling Strategy**:
- Boolean properties use controlled Switch components that only allow boolean values
- TypeScript interfaces ensure compile-time validation of property definitions
- Runtime validation ensures all boolean properties have valid values before API submission
- Existing error handling system used for API failures

### Visual Error States

**Error Indicators**:
- Switch components inherit Material-UI error states if needed
- Form validation errors displayed using existing error message system
- Processing dialog shows during session creation as before

### Validation Logic

**Boolean Property Validation**:
```typescript
const validateBooleanProperties = (values: Record<string, boolean>): boolean => {
  return BOOLEAN_SESSION_PROPERTIES_LIST.every(def => 
    typeof values[def.key] === 'boolean'
  );
};
```

## Testing Strategy

### Test Organization

All test files will be organized in the `tests/` directory:
- `tests/pages/CreateSessionPage.test.tsx` - Integration tests for boolean properties
- Property-based tests will be added to existing test files

### Test Runner Configuration

The project uses **Vitest** as the test runner with **fast-check** for property-based testing:
- Test environment: jsdom (for React component testing)
- Property tests run minimum 100 iterations
- Mock Material-UI components for consistent testing

### Unit Testing

**CreateSessionPage Tests**:
- Test boolean properties section renders correctly
- Test Switch components are present for each boolean property
- Test toggle interactions update state correctly
- Test form submission includes boolean properties
- Test default value initialization
- Test boolean to string conversion
- Test integration with existing integer properties

**Component Integration Tests**:
- Test boolean properties don't interfere with integer properties
- Test session creation workflow with boolean properties
- Test error handling with boolean properties
- Test navigation after successful session creation

### Property-Based Testing

Property-based tests will use **fast-check** library with custom generators:

**Test Data Generators**:
```typescript
// Generator for boolean property configurations
const booleanPropertyConfigArb = fc.record({
  key: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  defaultValue: fc.boolean(),
});

// Generator for boolean property state
const booleanStateArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.boolean()
);

// Generator for mixed override properties
const overridePropertiesArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 50 }),
  fc.string()
);
```

**Property Test Structure**:
```typescript
// Example property test
it('Property 1: Boolean toggle state synchronization', () => {
  fc.assert(
    fc.property(booleanStateArb, (initialState) => {
      // Setup: Render CreateSessionPage with initial boolean state
      // Act: Toggle each boolean property
      // Assert: State updates correctly for each toggle
    }),
    { numRuns: 100 }
  );
});
```

### Manual Testing Checklist

1. Boolean properties section appears on CreateSession page ✓
2. localizeFramesOfReference toggle works correctly ✓
3. Toggle switches reflect current state visually ✓
4. Form submission includes boolean properties in API call ✓
5. Boolean values converted to strings correctly ✓
6. Default values initialize correctly on page load ✓
7. Existing integer properties continue to work ✓
8. Session creation workflow unchanged ✓
9. Error handling works with boolean properties ✓
10. New boolean properties can be added via configuration ✓

## Implementation Notes

### Performance Considerations

1. **State Management**: Boolean properties use separate state to avoid re-rendering integer property components
2. **Component Rendering**: Switch components are lightweight and don't impact performance
3. **API Calls**: Boolean properties add minimal overhead to existing API payload
4. **Memory Usage**: Boolean values have minimal memory footprint

### Accessibility Considerations

1. **Switch Components**: Material-UI Switch components have built-in accessibility support
2. **Labels**: Clear, descriptive labels for each boolean property
3. **Keyboard Navigation**: Switch components support keyboard interaction
4. **Screen Readers**: Proper ARIA attributes for assistive technology
5. **Focus Management**: Logical tab order maintained

### Browser Compatibility

1. **Switch Components**: Material-UI Switch components work in all modern browsers
2. **Boolean Values**: Native JavaScript boolean support across all browsers
3. **State Management**: React state management compatible with all supported browsers
4. **API Integration**: Existing fetch API patterns maintained

### Future Enhancements

1. **Property Groups**: Support for organizing boolean properties into logical groups
2. **Conditional Properties**: Boolean properties that enable/disable other properties
3. **Property Descriptions**: Tooltip or help text for complex boolean properties
4. **Import/Export**: Save and load boolean property configurations
5. **Property Validation**: Advanced validation rules for boolean property combinations

## Dependencies

### External Libraries
- `@mui/material`: Switch and FormControlLabel components (already in use)
- `react`: State management and component rendering (already in use)
- `fast-check`: Property-based testing (already in use)

### Internal Dependencies
- Existing CreateSessionPage component structure
- Existing SessionAPI.createSession function
- Existing Material-UI theme and styling
- Existing test infrastructure and setup

### No New Dependencies Required
- All boolean property functionality uses existing libraries
- No additional npm packages needed
- Builds on existing Material-UI patterns

## Migration Strategy

### Phase 1: Add Boolean Properties Infrastructure
1. Add BooleanSessionPropertyDef interface
2. Add BOOLEAN_SESSION_PROPERTIES configuration
3. Add boolean state management to CreateSessionPage
4. Verify TypeScript compilation

### Phase 2: Implement UI Components
1. Add boolean properties section to CreateSession page
2. Implement Switch components for boolean properties
3. Add toggle event handlers
4. Verify UI rendering and interaction

### Phase 3: Integrate with API
1. Update handleSubmit to include boolean properties
2. Test boolean to string conversion
3. Verify API payload includes both property types
4. Test session creation with boolean properties

### Phase 4: Testing and Validation
1. Add unit tests for boolean property functionality
2. Add property-based tests for correctness properties
3. Perform manual testing across all workflows
4. Verify accessibility compliance

### Rollback Plan
- Boolean properties are additive and don't modify existing functionality
- Can be disabled by removing boolean properties from configuration
- Existing integer properties and session creation remain unchanged
- No database or API changes required for rollback

## Code Changes Summary

### Files to Modify

1. **src/pages/CreateSessionPage.tsx**
   - Add BooleanSessionPropertyDef interface
   - Add BOOLEAN_SESSION_PROPERTIES configuration
   - Add booleanConfigValues state management
   - Add boolean properties UI section
   - Update handleSubmit to include boolean properties
   - Add Material-UI Switch and FormControlLabel imports

### Files to Create for Testing

1. **Additional tests in tests/pages/CreateSessionPage.test.tsx**
   - Unit tests for boolean property functionality
   - Property-based tests for correctness properties
   - Integration tests with existing functionality

### No Changes Required

- SessionAPI.createSession function (already accepts overrideProperties)
- Database schemas or data models
- Other UI components or pages
- Amplify configuration or authentication
- Existing integer properties functionality