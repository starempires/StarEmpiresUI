# Requirements Document

## Introduction

This document outlines the requirements for ensuring complete migration from AWS Amplify v1 (Gen 1) to AWS Amplify v2 (Gen 2). The project currently uses Amplify v6 packages which represent Gen 2, but there may be legacy patterns, configurations, or code artifacts from Gen 1 that need to be identified and removed. The goal is to ensure the codebase follows Gen 2 best practices exclusively and removes any Gen 1 remnants.

## Glossary

- **Amplify Gen 1**: The first generation of AWS Amplify, using CLI-based configuration with `amplify push` commands and `aws-exports.js` configuration files
- **Amplify Gen 2**: The second generation of AWS Amplify (v6+), using code-first configuration with TypeScript/JavaScript and `amplify_outputs.json`
- **Application**: The Star Empires UI React application being migrated
- **Backend Configuration**: The TypeScript-based backend definition files in the `amplify/` directory
- **Data Client**: The generated client for interacting with Amplify Data (GraphQL API)
- **Auth Module**: The authentication and authorization configuration and client code
- **Legacy Artifacts**: Files, configurations, or code patterns from Amplify Gen 1 that should be removed

## Requirements

### Requirement 1

**User Story:** As a developer, I want to audit all Amplify dependencies to ensure only Gen 2 packages are used, so that the project has no Gen 1 package dependencies.

#### Acceptance Criteria

1. WHEN the package.json files are examined, THE Application SHALL use only `aws-amplify` v6+ and `@aws-amplify/*` v6+ packages
2. THE Application SHALL NOT include any deprecated Gen 1 packages such as `@aws-amplify/api-graphql`, `@aws-amplify/pubsub`, or `aws-amplify-react`
3. THE Application SHALL use `@aws-amplify/backend` v1+ for backend configuration
4. THE Application SHALL use `@aws-amplify/ui-react` v6+ for UI components
5. WHEN dependencies are updated, THE Application SHALL document the current versions in the migration report

### Requirement 2

**User Story:** As a developer, I want to identify and remove any Gen 1 configuration files, so that only Gen 2 configuration patterns exist in the codebase.

#### Acceptance Criteria

1. THE Application SHALL NOT contain `aws-exports.js` or `aws-exports.ts` files
2. THE Application SHALL NOT contain an `amplify/.config/` directory
3. THE Application SHALL NOT contain `amplify/backend/` directory with JSON configuration files
4. THE Application SHALL use `amplify_outputs.json` as the sole configuration file for frontend
5. THE Application SHALL use TypeScript files in `amplify/` directory for backend resource definitions

### Requirement 3

**User Story:** As a developer, I want to ensure all API client code uses Gen 2 patterns, so that data access follows current best practices.

#### Acceptance Criteria

1. WHEN accessing the Data API, THE Application SHALL use `generateClient` from `aws-amplify/data`
2. THE Application SHALL NOT use `API.graphql()` from `@aws-amplify/api`
3. THE Application SHALL NOT import from `@aws-amplify/api-graphql`
4. WHEN making data queries, THE Application SHALL use the typed client with `client.models.ModelName.operation()`
5. THE Application SHALL specify `authMode` when creating clients if non-default authorization is needed

### Requirement 4

**User Story:** As a developer, I want to verify authentication code uses Gen 2 patterns, so that auth operations follow current best practices.

#### Acceptance Criteria

1. WHEN performing auth operations, THE Application SHALL import from `aws-amplify/auth` path
2. THE Application SHALL use functions like `signIn`, `signOut`, `signUp`, `fetchAuthSession`, `fetchUserAttributes` from the Gen 2 auth module
3. THE Application SHALL NOT use `Auth.signIn()` or other class-based Auth API patterns from Gen 1
4. THE Application SHALL configure Amplify using `Amplify.configure(outputs)` with `amplify_outputs.json`
5. WHEN using the Authenticator component, THE Application SHALL use `@aws-amplify/ui-react` v6+

### Requirement 5

**User Story:** As a developer, I want to identify any Gen 1 CLI artifacts or build configurations, so that the build process uses only Gen 2 tooling.

#### Acceptance Criteria

1. THE Application SHALL NOT contain `amplify/team-provider-info.json` file
2. THE Application SHALL NOT reference `amplify push` or `amplify pull` commands in documentation or scripts
3. THE Application SHALL use `npx ampx sandbox` or `npx ampx deploy` for Gen 2 deployments
4. THE Application SHALL NOT contain `.amplifyrc` file
5. WHEN building the backend, THE Application SHALL use CDK-based synthesis via `@aws-amplify/backend-cli`

### Requirement 6

**User Story:** As a developer, I want to ensure storage access patterns use Gen 2 APIs, so that file operations follow current best practices.

#### Acceptance Criteria

1. IF storage is used, THEN THE Application SHALL import from `aws-amplify/storage` path
2. IF storage is used, THEN THE Application SHALL use functions like `uploadData`, `downloadData`, `list`, `remove` from Gen 2 storage module
3. IF storage is used, THEN THE Application SHALL NOT use `Storage.put()` or other class-based Storage API patterns
4. WHERE storage configuration exists, THE Application SHALL define storage in `amplify/storage/resource.ts` using `defineStorage`
5. THE Application SHALL verify no legacy S3 bucket configurations exist outside Gen 2 patterns

### Requirement 7

**User Story:** As a developer, I want to ensure backward compatibility with existing data models during migration, so that existing data resources are not broken by the migration.

#### Acceptance Criteria

1. WHEN data model schemas are reviewed, THE Application SHALL maintain existing field names and types
2. WHEN data model schemas are reviewed, THE Application SHALL maintain existing table names and indexes
3. IF a migration change would break backward compatibility with existing data, THEN THE Application SHALL explicitly document the breaking change
4. IF a migration change would break backward compatibility with existing data, THEN THE Application SHALL provide a migration strategy or workaround
5. THE Application SHALL verify that authorization rules on data models remain functionally equivalent after migration

### Requirement 8

**User Story:** As a developer, I want to document the migration status and create a checklist, so that the team understands what has been verified and what remains.

#### Acceptance Criteria

1. THE Application SHALL produce a migration audit report listing all checked items
2. THE Application SHALL identify any Gen 1 patterns found during the audit
3. THE Application SHALL provide specific file paths and line numbers for any issues discovered
4. THE Application SHALL include recommendations for addressing each identified issue
5. THE Application SHALL confirm when the codebase is fully Gen 2 compliant
