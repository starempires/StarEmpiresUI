# Star Empires UI

Star Empires UI is a React application built with AWS Amplify Gen 2, providing a web interface for the Star Empires game.

## Prerequisites

- Node.js 18+ and npm
- AWS Account with appropriate permissions
- AWS Amplify CLI (`@aws-amplify/backend-cli`)

## Getting Started

### Installation

```bash
npm install
```

### Local Development

The project uses AWS Amplify Gen 2 for backend services. You have two options for local development:

#### Option 1: Development with Cloud Sandbox (Recommended)

Run a cloud-based sandbox environment that provisions real AWS resources in an isolated environment:

```bash
npx ampx sandbox
```

This command:
- Deploys backend resources to a personal cloud sandbox
- Watches for changes in the `amplify/` directory
- Automatically updates resources when you modify backend code
- Generates `amplify_outputs.json` for frontend configuration

In a separate terminal, start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in terminal).

#### Option 2: Development with Existing Backend

If you want to develop against an already deployed backend:

1. Ensure `amplify_outputs.json` exists in the project root
2. Start the frontend development server:

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

## Deployment

### Manual Deployment

To manually deploy the backend to a specific branch environment:

```bash
npx ampx deploy --branch <branch-name>
```

Examples:
```bash
# Deploy to main branch environment
npx ampx deploy --branch main

# Deploy to development branch environment
npx ampx deploy --branch dev

# Deploy to staging branch environment
npx ampx deploy --branch staging
```

Each branch creates an isolated environment with its own resources.

### CI/CD Deployment (Automated)

The project is configured for automatic deployment via AWS Amplify Hosting. The CI/CD pipeline is defined in `amplify.yml`:

**Backend Phase:**
- Installs dependencies with npm caching
- Runs `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`
- Automatically provisions/updates backend resources for the branch

**Frontend Phase:**
- Runs `npm run build`
- Deploys the `dist/` directory to Amplify Hosting

**Triggering Deployments:**
- Push to any connected branch in your Git repository
- Amplify automatically detects changes and triggers the build pipeline
- Each branch gets its own isolated environment

## Common Workflows

### Starting Fresh Development Session

```bash
# Terminal 1: Start cloud sandbox
npx ampx sandbox

# Terminal 2: Start frontend dev server
npm run dev
```

### Making Backend Changes

1. Edit files in the `amplify/` directory (e.g., `amplify/data/resource.ts`, `amplify/auth/resource.ts`)
2. Save your changes
3. The sandbox automatically detects changes and updates resources
4. Frontend automatically picks up the new `amplify_outputs.json`

### Testing Backend Changes Before Deployment

```bash
# Use sandbox to test changes
npx ampx sandbox

# Run your application against the sandbox
npm run dev

# When satisfied, commit and push to trigger CI/CD
git add .
git commit -m "Update backend resources"
git push
```

### Deploying to a New Environment

```bash
# Create and deploy a new branch environment
npx ampx deploy --branch feature-xyz

# The deployment creates isolated resources for this branch
```

### Cleaning Up Sandbox Resources

Sandbox resources are automatically cleaned up when you stop the sandbox process (Ctrl+C). To manually remove sandbox resources:

```bash
npx ampx sandbox delete
```

## Project Structure

```
.
├── amplify/                  # Amplify Gen 2 backend definitions
│   ├── auth/                # Authentication configuration
│   ├── data/                # Data models and GraphQL API
│   └── backend.ts           # Backend entry point
├── src/                     # React application source
├── public/                  # Static assets
├── amplify_outputs.json     # Generated Amplify configuration (do not commit)
├── amplify.yml              # CI/CD build configuration
└── package.json             # Project dependencies and scripts
```

## Amplify Gen 2 Key Concepts

### Code-First Configuration

Amplify Gen 2 uses TypeScript/JavaScript files to define your backend instead of CLI commands:

- **Data Models**: Defined in `amplify/data/resource.ts` using `a.schema()`
- **Authentication**: Configured in `amplify/auth/resource.ts` using `defineAuth()`
- **Backend**: Composed in `amplify/backend.ts` using `defineBackend()`

### Configuration File

The `amplify_outputs.json` file is automatically generated and contains all configuration needed by the frontend. This replaces the Gen 1 `aws-exports.js` file.

**Important**: Do not commit `amplify_outputs.json` to version control. It's generated during deployment and sandbox sessions.

### Branch Environments

Each Git branch can have its own isolated AWS environment:

- Resources are namespaced by branch name
- No conflicts between development, staging, and production
- Easy to test changes in isolation before merging

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npx ampx sandbox` - Start cloud sandbox for backend development
- `npx ampx deploy --branch <name>` - Deploy backend to specific branch environment

## Troubleshooting

### Sandbox Won't Start

- Ensure you have valid AWS credentials configured
- Check that you have permissions to create resources in your AWS account
- Try deleting and restarting: `npx ampx sandbox delete` then `npx ampx sandbox`

### Frontend Can't Connect to Backend

- Verify `amplify_outputs.json` exists in the project root
- Ensure the sandbox is running or you've deployed the backend
- Check browser console for authentication or API errors

### Build Failures in CI/CD

- Check the Amplify Console build logs
- Verify `amplify.yml` configuration is correct
- Ensure all dependencies are listed in `package.json`

## Additional Resources

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/)
- [Amplify Gen 2 Migration Guide](https://docs.amplify.aws/react/build-a-backend/upgrade-guide/)
- [Amplify Data (GraphQL) Documentation](https://docs.amplify.aws/react/build-a-backend/data/)
- [Amplify Authentication Documentation](https://docs.amplify.aws/react/build-a-backend/auth/)

## License

ISC
