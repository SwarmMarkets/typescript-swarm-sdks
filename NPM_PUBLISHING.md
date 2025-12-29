# NPM Publishing Setup

This repository is configured for automated npm publishing of all TypeScript packages under the `@swarm-markets` scope.

## Published Packages

- `@swarm-markets/shared` - Shared utilities and types
- `@swarm-markets/market-maker-sdk` - Market Maker SDK
- `@swarm-markets/cross-chain-access-sdk` - Cross-Chain Access SDK
- `@swarm-markets/trading-sdk` - Trading SDK with smart routing

## Setup Instructions

### 1. Create NPM Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to your account settings → Access Tokens
3. Click "Generate New Token" → "Classic Token"
4. Select "Automation" token type (recommended for CI/CD)
5. Copy the generated token

### 2. Add NPM Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

### 3. Ensure NPM Organization Access

Make sure you have permission to publish packages under the `@swarm-markets` scope:

1. The npm organization `@swarm-markets` must exist
2. Your npm account must be a member with publish permissions
3. If the organization doesn't exist, create it at [npmjs.com/org/create](https://www.npmjs.com/org/create)

## How to Publish

The workflow is triggered automatically when you:

### Option 1: Create a GitHub Release (Recommended)

```bash
# 1. Update version in all package.json files
cd typescript/packages/shared && npm version patch  # or minor/major
cd ../market-maker-sdk && npm version patch
cd ../cross-chain-access-sdk && npm version patch
cd ../trading-sdk && npm version patch

# 2. Commit and push changes
git add .
git commit -m "chore: bump version to X.Y.Z"
git push

# 3. Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# 4. Create a GitHub Release from the tag
# Go to GitHub → Releases → Create new release → Select the tag → Publish
```

### Option 2: Push a Version Tag

```bash
# Tag the commit
git tag v1.0.0

# Push the tag
git push origin v1.0.0
```

The GitHub Action will:
1. ✅ Install dependencies
2. ✅ Build all packages
3. ✅ Publish to npm with provenance
4. ✅ Create a summary of published packages

## Version Management

### Synchronized Versioning (Recommended)

Keep all packages at the same version:

```bash
# From the typescript directory
pnpm -r exec npm version patch
git add .
git commit -m "chore: bump all packages to X.Y.Z"
git tag vX.Y.Z
git push && git push --tags
```

### Independent Versioning

Update packages individually:

```bash
cd packages/shared
npm version patch
cd ../market-maker-sdk
npm version minor
# etc...
```

## Manual Publishing (Local)

If you need to publish manually:

```bash
cd typescript

# Build all packages
pnpm build

# Login to npm
npm login

# Publish each package
cd packages/shared && npm publish --access public
cd ../market-maker-sdk && npm publish --access public
cd ../cross-chain-access-sdk && npm publish --access public
cd ../trading-sdk && npm publish --access public
```

## Troubleshooting

### "Package already exists" error
- The version you're trying to publish already exists on npm
- Bump the version number in package.json and try again

### "403 Forbidden" error
- Check that your NPM_TOKEN is valid and not expired
- Ensure you have publish permissions for @swarm-markets organization
- Verify the token is correctly set in GitHub Secrets

### "Cannot publish over existing version"
- You need to increment the version number
- Use `npm version patch|minor|major` to bump versions

### Packages not publishing in correct order
- The workflow publishes in dependency order: shared → market-maker-sdk & cross-chain-access-sdk → trading-sdk
- If you see errors about missing dependencies, check that workspace references are correct

## Package Installation

After publishing, users can install packages:

```bash
npm install @swarm-markets/trading-sdk
npm install @swarm-markets/market-maker-sdk
npm install @swarm-markets/cross-chain-access-sdk
npm install @swarm-markets/shared
```

## CI/CD Pipeline

The workflow includes:
- ✅ Automated builds
- ✅ Dependency caching for faster builds
- ✅ npm provenance for supply chain security
- ✅ Public access configuration
- ✅ Error handling with graceful fallbacks
