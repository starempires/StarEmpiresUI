# Design Document: Amplify Gen 2 Migration Audit

## Overview

This design outlines a systematic approach to audit and migrate the Star Empires UI application from any remaining Amplify Gen 1 patterns to full Amplify Gen 2 (v6+) compliance. The migration is primarily an audit and cleanup task since the project already uses Gen 2 packages, but we need to ensure no legacy patterns, configurations, or code artifacts remain.

The approach prioritizes backward compatibility with existing data models and will explicitly flag any changes that could impact existing data resources.

## Architecture

### Migration Audit Strategy

The migration follows a layered audit approach:

1. **Dependency Layer**: Verify package.json files contain only Gen 2 packages
2. **Configuration Layer**: Check for Gen 1 config files and ensure Gen 2 config is used
3. **Code Layer**: Audit all source code for Gen 1 API patterns
4. **Build/Deploy Layer**: Verify build scripts and deployment configurations use Gen 2 tooling
5. **Data Model Layer**: Ensure data models maintain backward compatibility

### Audit Execution Flow

```
Start
  ↓
Scan Dependencies (package.json files)
  ↓
Scan File System (config files, directories)
  ↓
Scan Source Code (import patterns, API usage)
  ↓
Analyze Data Models (schema compatibility)
  ↓
Review Build Configuration (scripts, CI/CD)
  ↓
Generate Audit Report
  ↓
Apply Fixes (if needed)
  ↓
Verify Fixes
  ↓
End
```

## Components and Interfaces

### 1. Dependency Auditor

**Purpose**: Verify all Amplify-related packages are Gen 2 compatible

**Inputs**:
- `package.json` (root)
- `amplify/package.json`

**Outputs**:
- List of current Amplify packages and versions
- Identification of any Gen 1 packages
- Recommendations for package updates

**Logic**:
- Parse package.json files
- Check each `@aws-amplify/*` and `aws-amplify` package version
- Flag any packages < v6.0.0
- Flag deprecated Gen 1-only packages (`@aws-amplify/api-graphql`, `aws-amplify-react`, etc.)

### 2. Configuration File Scanner

**Purpose**: Identify Gen 1 configuration files and verify Gen 2 configuration

**Inputs**:
- File system structure
- Known Gen 1 artifact paths

**Outputs**:
- List of Gen 1 config files found (if any)
- Verification of Gen 2 config files
- Recommendations for cleanup

**Scan Targets**:
- `aws-exports.js` / `aws-exports.ts`
- `amplify/.config/`
- `amplify/backend/` (JSON-based configs)
- `amplify/team-provider-info.json`
- `.amplifyrc`
- `amplify_outputs.json` (should exist)
- `amplify/*.ts` resource files (should exist)

### 3. Source Code Pattern Analyzer

**Purpose**: Identify Gen 1 API usage patterns in source code

**Inputs**:
- All `.ts`, `.tsx`, `.js`, `.jsx` files in `src/` and `amplify/`

**Outputs**:
- List of files with Gen 1 patterns
- Specific line numbers and code snippets
- Suggested Gen 2 replacements

**Pattern Detection**:

| Gen 1 Pattern | Gen 2 Pattern | Detection Method |
|---------------|---------------|------------------|
| `import { API } from 'aws-amplify'` | `import { generateClient } from 'aws-amplify/data'` | Regex search |
| `API.graphql(...)` | `client.models.Model.operation()` | Regex search |
| `import from '@aws-amplify/api-graphql'` | `import from 'aws-amplify/data'` | Regex search |
| `Auth.signIn()` | `signIn()` from `aws-amplify/auth` | Regex search |
| `Storage.put()` | `uploadData()` from `aws-amplify/storage` | Regex search |
| `aws-exports` imports | `amplify_outputs.json` imports | Regex search |

### 4. Data Model Compatibility Checker

**Purpose**: Ensure data model changes maintain backward compatibility

**Inputs**:
- `amplify/data/resource.ts`
- Existing schema definitions

**Outputs**:
- Confirmation of schema compatibility
- List of any breaking changes (if found)
- Migration strategies for breaking changes

**Checks**:
- Model names unchanged
- Field names and types unchanged
- Index definitions preserved
- Authorization rules functionally equivalent
- Relationship definitions compatible

**Backward Compatibility Rules**:
- ✅ Adding new optional fields: Safe
- ✅ Adding new models: Safe
- ✅ Adding new indexes: Safe
- ⚠️ Renaming fields: Breaking (requires data migration)
- ⚠️ Changing field types: Breaking (requires data migration)
- ⚠️ Removing fields: Breaking (data loss risk)
- ⚠️ Changing model names: Breaking (requires table migration)

### 5. Build Configuration Auditor

**Purpose**: Verify build and deployment scripts use Gen 2 tooling

**Inputs**:
- `package.json` scripts
- `amplify.yml`
- CI/CD configuration files

**Outputs**:
- List of build commands
- Identification of Gen 1 CLI commands
- Recommended Gen 2 command replacements

**Command Mapping**:
- `amplify push` → `npx ampx deploy`
- `amplify pull` → Not needed in Gen 2 (code-first)
- `amplify status` → `npx ampx sandbox`
- `amplify mock` → `npx ampx sandbox`

### 6. Audit Report Generator

**Purpose**: Compile all audit findings into a comprehensive report

**Inputs**:
- Results from all auditor components

**Outputs**:
- Markdown report with findings
- Categorized issues (Critical, Warning, Info)
- Action items with priorities
- Verification checklist

**Report Structure**:
```markdown
# Amplify Gen 2 Migration Audit Report

## Executive Summary
- Overall Status: [Compliant / Needs Attention]
- Critical Issues: [count]
- Warnings: [count]
- Info Items: [count]

## Dependency Audit
[findings]

## Configuration Audit
[findings]

## Code Pattern Audit
[findings]

## Data Model Compatibility
[findings]

## Build Configuration Audit
[findings]

## Action Items
[prioritized list]

## Verification Checklist
- [ ] Item 1
- [ ] Item 2
```

## Data Models

### Audit Finding

```typescript
interface AuditFinding {
  category: 'dependency' | 'configuration' | 'code' | 'data-model' | 'build';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  location?: {
    file: string;
    line?: number;
  };
  recommendation: string;
  requirementRef: string; // e.g., "1.2", "3.4"
}
```

### Audit Report

```typescript
interface AuditReport {
  timestamp: string;
  overallStatus: 'compliant' | 'needs-attention';
  findings: AuditFinding[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  actionItems: ActionItem[];
}
```

### Action Item

```typescript
interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  relatedFindings: string[]; // Finding titles
  estimatedEffort: 'small' | 'medium' | 'large';
}
```

## Error Handling

### File System Errors

- **Issue**: Cannot read package.json or other files
- **Handling**: Log warning, continue with other audits, note in report
- **User Impact**: Incomplete audit results

### Parse Errors

- **Issue**: Cannot parse JSON or TypeScript files
- **Handling**: Log error with file path, continue with other files
- **User Impact**: Specific file not audited

### Pattern Detection Ambiguity

- **Issue**: Code pattern could be Gen 1 or Gen 2
- **Handling**: Flag as "warning" for manual review
- **User Impact**: Requires developer verification

### Data Model Analysis Limitations

- **Issue**: Cannot determine if schema change is breaking without runtime data
- **Handling**: Flag potential breaking changes conservatively
- **User Impact**: May require manual verification of data compatibility

## Testing Strategy

### Unit Testing

Not applicable for this audit/migration task. The focus is on static analysis and verification.

### Manual Verification Steps

1. **Dependency Verification**:
   - Run `npm list aws-amplify @aws-amplify/backend @aws-amplify/ui-react`
   - Verify versions are v6+ or v1+ (for backend)

2. **Configuration Verification**:
   - Manually inspect file system for Gen 1 artifacts
   - Verify `amplify_outputs.json` exists and is used

3. **Code Pattern Verification**:
   - Search codebase for flagged patterns
   - After any code changes, run `npm run build` immediately
   - Do not proceed if build fails - fix errors first

4. **Data Model Verification**:
   - Compare current schema with deployed schema
   - Verify no breaking changes in field definitions

5. **Build Verification** (Critical):
   - Run build process: `npm run build`
   - Verify no errors related to Amplify configuration
   - Build must succeed before proceeding to next task
   - Test sandbox: `npx ampx sandbox` (if applicable)

### Integration Testing

1. **Authentication Flow**:
   - Test sign up, sign in, sign out
   - Verify user attributes are accessible
   - Confirm session management works

2. **Data Operations**:
   - Test CRUD operations on each model
   - Verify authorization rules work correctly
   - Confirm relationships function properly

3. **End-to-End Verification**:
   - Run application locally
   - Test all major user flows
   - Verify no console errors related to Amplify

## Migration Execution Plan

### Phase 1: Audit (Non-Destructive)

1. Run all auditor components
2. Generate comprehensive report
3. Review findings with team
4. Prioritize action items

### Phase 2: Remediation (If Needed)

1. Address critical issues first
2. Update code patterns to Gen 2
3. Remove Gen 1 configuration files
4. Update documentation

### Phase 3: Verification

1. Run `npm run build` to ensure project builds cleanly
2. Fix any build errors before proceeding (do not continue to next task if build fails)
3. Run audit again to confirm fixes
4. Execute manual verification steps
5. Run integration tests
6. Deploy to test environment

**Critical Rule**: After any code changes, `npm run build` must succeed before moving to the next task. Build errors must be resolved immediately or escalated for help.

### Phase 4: Documentation

1. Update README with Gen 2 patterns
2. Document any breaking changes
3. Create migration notes for team
4. Archive audit report

## Rollback Strategy

Since this is primarily an audit with potential code cleanup:

1. **Before Changes**: Create git branch for migration work
2. **During Changes**: Commit incrementally with clear messages
3. **If Issues**: Revert specific commits or entire branch
4. **Data Safety**: No data model changes that break compatibility

## Success Criteria

The migration audit is successful when:

1. ✅ All Amplify packages are v6+ (or v1+ for backend)
2. ✅ No Gen 1 configuration files exist
3. ✅ All code uses Gen 2 API patterns
4. ✅ Data models maintain backward compatibility
5. ✅ Build process uses Gen 2 tooling
6. ✅ Application functions correctly with Gen 2 setup
7. ✅ Audit report shows "compliant" status
8. ✅ All tests pass
