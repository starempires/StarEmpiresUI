# Implementation Plan: Amplify Gen 2 Migration Audit

- [x] 1. Audit Amplify package dependencies
  - Parse both `package.json` and `amplify/package.json` files
  - Extract all `aws-amplify` and `@aws-amplify/*` package versions
  - Verify all packages are Gen 2 compatible (v6+ or v1+ for backend packages)
  - Identify any deprecated Gen 1-only packages
  - Document current versions and flag any issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Scan file system for Gen 1 configuration artifacts
  - Check for existence of `aws-exports.js` and `aws-exports.ts` files
  - Check for `amplify/.config/` directory
  - Check for `amplify/backend/` directory with JSON configuration files
  - Check for `amplify/team-provider-info.json` file
  - Check for `.amplifyrc` file
  - Verify `amplify_outputs.json` exists in project root
  - Verify TypeScript resource files exist in `amplify/` directory
  - Document all findings with file paths
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Analyze source code for Gen 1 API patterns
- [x] 3.1 Search for Gen 1 Data/API patterns
  - Search all `.ts`, `.tsx`, `.js`, `.jsx` files for `API.graphql` usage
  - Search for imports from `@aws-amplify/api-graphql`
  - Search for `import { API } from 'aws-amplify'` or `'@aws-amplify/api'`
  - Verify usage of `generateClient` from `aws-amplify/data`
  - Verify usage of typed client patterns like `client.models.ModelName.operation()`
  - Document file paths and line numbers for any Gen 1 patterns found
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Search for Gen 1 Auth patterns
  - Search for `Auth.signIn()`, `Auth.signOut()`, `Auth.signUp()` class-based patterns
  - Search for `import { Auth } from 'aws-amplify'` or `'@aws-amplify/auth'`
  - Verify imports from `aws-amplify/auth` path (Gen 2 pattern)
  - Verify usage of function-based auth like `signIn()`, `fetchAuthSession()`, `fetchUserAttributes()`
  - Check `Amplify.configure()` usage with `amplify_outputs.json`
  - Document file paths and line numbers for any Gen 1 patterns found
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.3 Search for Gen 1 Storage patterns (if applicable)
  - Search for `Storage.put()`, `Storage.get()`, `Storage.remove()` class-based patterns
  - Search for `import { Storage } from 'aws-amplify'` or `'@aws-amplify/storage'`
  - If storage is used, verify imports from `aws-amplify/storage` path
  - If storage is used, verify usage of `uploadData()`, `downloadData()`, `list()`, `remove()`
  - Check for storage resource definition in `amplify/storage/resource.ts` if storage is used
  - Document file paths and line numbers for any Gen 1 patterns found
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Verify data model backward compatibility
  - Review `amplify/data/resource.ts` schema definitions
  - Document all model names, field names, and field types
  - Document all secondary indexes
  - Document all authorization rules
  - Verify no changes that would break existing data (field renames, type changes, model renames)
  - Flag any potential breaking changes with explicit warnings
  - Confirm schema is Gen 2 compliant using `defineData` and `a.schema()`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Audit build and deployment configuration
  - Review `package.json` scripts for Gen 1 CLI commands
  - Check for `amplify push`, `amplify pull`, `amplify status`, `amplify mock` commands
  - Review `amplify.yml` for deployment configuration
  - Verify usage of Gen 2 commands like `npx ampx sandbox` or `npx ampx deploy`
  - Document any Gen 1 CLI references found
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Generate comprehensive audit report
  - Compile all findings from previous tasks
  - Categorize findings by severity (critical, warning, info)
  - Create executive summary with overall status
  - List all findings with file paths, line numbers, and recommendations
  - Create prioritized action items list
  - Generate verification checklist
  - Save report as markdown file in `.kiro/specs/amplify-v2-migration/audit-report.md`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. Apply fixes for identified Gen 1 patterns (if any found)
  - Update any Gen 1 API patterns to Gen 2 equivalents
  - Update any Gen 1 Auth patterns to Gen 2 equivalents
  - Update any Gen 1 Storage patterns to Gen 2 equivalents (if applicable)
  - Remove any Gen 1 configuration files found
  - Update build scripts to use Gen 2 commands
  - Run `npm run build` after each file change to verify no build errors
  - If build fails, fix errors immediately before proceeding
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3_

- [-] 7.1 Commit migration fixes to git
  - Review all changes with `git status` and `git diff`
  - Stage changes with `git add`
  - Commit changes to main branch with clear message describing the Gen 2 migration fixes
  - _Requirements: N/A (optional workflow step)_

- [x] 8. Verify migration completeness
  - Re-run all audit checks to confirm fixes
  - Run `npm run build` to ensure clean build
  - Verify no build errors or warnings related to Amplify
  - Update audit report with final status
  - Confirm all requirements are met
  - _Requirements: All requirements_

- [x] 9. Document Gen 2 development commands
  - Create or update README/developer documentation with Gen 2 commands
  - Document local development: `npx ampx sandbox` and `npm run dev`
  - Document manual deployment: `npx ampx deploy --branch <branch-name>`
  - Document CI/CD deployment (already configured in `amplify.yml`)
  - Include examples and common workflows
  - _Requirements: 5.3, 5.4_
