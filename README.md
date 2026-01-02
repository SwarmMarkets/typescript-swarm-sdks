# Swarm Collection - TypeScript SDK Suite

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8%2B-orange.svg)](https://pnpm.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Package Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://www.npmjs.com/org/swarm-markets)

> **Unified TypeScript SDK collection for trading Real World Assets (RWAs) across multiple platforms with smart routing, automatic fallback, and price optimization.**

---

## 📋 Table of Contents

- [See Real Examples](#-see-real-examples)
- [Overview](#-overview)
- [SDK Architecture](#-sdk-architecture)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Installation & Setup](#-installation--setup)
- [SDK Descriptions](#-sdk-descriptions)
- [Project Structure](#-project-structure)
- [Development Setup](#-development-setup)
- [Publishing & CI/CD](#-publishing--cicd)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 See Real Examples

**Ready-to-run code examples** are available in the [`examples/`](examples/) directory with complete setup instructions and usage demonstrations for all SDKs.

The examples include:

- **Trading SDK Examples** - Smart routing, price comparison, and multi-platform trading
- **Market Maker SDK Examples** - P2P trading, offer creation, and liquidity provision
- **Cross-Chain Access SDK Examples** - Stock market integration and trading
- **Error Handling Examples** - Best practices for exception handling

📖 [View Examples Documentation](examples/README.md)

---

## 🌟 Overview

**Swarm Collection** is a comprehensive TypeScript SDK suite that enables seamless trading of Real World Assets (RWAs) through multiple platforms. The collection provides three distinct SDKs, each optimized for different trading scenarios:

1. **Trading SDK** - Unified client with smart routing and automatic price optimization
2. **Market Maker SDK** - Decentralized peer-to-peer OTC trading (24/7 availability)
3. **Cross-Chain Access SDK** - Centralized stock market trading (market hours only)

All SDKs share common infrastructure including Web3 helpers, authentication, and data models, ensuring consistent behavior and ease of use.

### Why Use Swarm Collection?

- ✅ **Smart Routing** - Automatically selects optimal trading platform
- ✅ **Best Price Guarantee** - Real-time price comparison across platforms
- ✅ **Auto Fallback** - Seamless switching if primary platform fails
- ✅ **24/7 Trading** - Access to P2P markets outside traditional hours
- ✅ **Unified API** - Consistent interface across all SDKs
- ✅ **Production Ready** - Comprehensive error handling and retry logic
- ✅ **Type Safe** - Full TypeScript support with strict typing
- ✅ **Modern Stack** - Built with Viem for Web3 interactions

---

## 🏗️ SDK Architecture

The Swarm Collection implements a **multi-layer hierarchical architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                      Trading SDK                            │
│  (Smart routing, price comparison, auto-fallback)           │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
      ┌─────────▼──────────┐      ┌────────▼─────────────┐
      │  Market Maker SDK  │      │ Cross-Chain Access   │
      │  (P2P, 24/7)       │      │ SDK (Stock market)   │
      └─────────┬──────────┘      └────────┬─────────────┘
                │                           │
                └────────────┬──────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Shared Module  │
                    │ (Web3, Auth, etc)│
                    └──────────────────┘
```

### Layer Responsibilities

| Layer                      | Purpose                              | Key Components                                         |
| -------------------------- | ------------------------------------ | ------------------------------------------------------ |
| **Trading SDK**            | Unified interface with smart routing | `TradingClient`, `Router`, routing strategies          |
| **Market Maker SDK**       | P2P on-chain trading                 | `RPQClient`, `MarketMakerWeb3Client`, offer management |
| **Cross-Chain Access SDK** | Stock market integration             | `CrossChainAccessAPIClient`, market hours validation   |
| **Shared Module**          | Common infrastructure                | `Web3Helper`, `SwarmAuth`, `BaseClient`, models        |

---

## 🎯 Key Features

### Trading SDK (Highest Level)

- **5 Routing Strategies**: BEST_PRICE, CROSS_CHAIN_ACCESS_FIRST, MARKET_MAKER_FIRST, CROSS_CHAIN_ACCESS_ONLY, MARKET_MAKER_ONLY
- **Automatic Price Comparison**: Real-time quote aggregation from both platforms
- **Smart Fallback**: Automatic retry on alternative platform if primary fails
- **Unified Interface**: Single `trade()` method works across all platforms
- **Platform-Aware**: Handles market hours, liquidity checks, and platform-specific requirements

### Market Maker SDK

- **24/7 Availability**: Trade anytime, no market hour restrictions
- **P2P On-Chain**: Fully decentralized execution via smart contracts
- **Offer Discovery**: RPQ API integration for finding available liquidity
- **Create Offers**: Become a liquidity provider with custom pricing
- **Dynamic Pricing**: Support for price feed-based offers
- **Quote Calculation**: Best offer selection with amount optimization

### Cross-Chain Access SDK

- **Stock Market Pricing**: Real US stock exchange rates
- **Deep Liquidity**: Traditional market maker liquidity
- **Market Hours Validation**: 14:30-21:00 UTC, weekdays only
- **Account Management**: Funds tracking and status checks
- **Email Notifications**: Trade confirmation emails
- **KYC Compliant**: Regulatory requirements handled

### Shared Infrastructure

- **Web3 Operations**: Token approvals, balance checks, transaction signing
- **Wallet Authentication**: EIP-191 signature-based auth (no passwords)
- **Multi-Network**: Polygon, Ethereum, Base, BSC support
- **HTTP Client**: Automatic retries with exponential backoff
- **Error Handling**: Comprehensive exception hierarchy
- **Remote Config**: Dynamic configuration loading from remote URLs

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run examples
cd examples
pnpm trading
```

```typescript
import { TradingClient, Network, RoutingStrategy } from "@swarm-markets/trading-sdk";

const client = new TradingClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your_rpq_key",
  userEmail: "you@example.com"
});

await client.initialize();

const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: "100",
  toTokenSymbol: "AAPL",
  userEmail: "you@example.com",
  routingStrategy: RoutingStrategy.BEST_PRICE
});
```

For detailed usage examples and code samples, see the [Examples Directory](examples/).

For SDK documentation, see:

- [Trading SDK Documentation](docs/trading_sdk_doc.md)
- [Market Maker SDK Documentation](docs/market_maker_sdk_doc.md)
- [Cross-Chain Access SDK Documentation](docs/cross_chain_access_sdk_doc.md)

---

## 📦 Installation & Setup

### Prerequisites

- **Node.js 18 or higher**
- **pnpm 8 or higher** (package manager)
- **Wallet with private key** (for transaction signing)
- **Gas tokens** (MATIC, ETH, etc. for transaction fees)
- **RPQ API Key** (for Market Maker SDK access)
- **User Email** (for Cross-Chain Access authentication)

### Method 1: Install Published Packages (Production)

```bash
# Install individual packages
npm install @swarm-markets/trading-sdk
npm install @swarm-markets/market-maker-sdk
npm install @swarm-markets/cross-chain-access-sdk
npm install @swarm-markets/shared

# Or with pnpm
pnpm add @swarm-markets/trading-sdk
pnpm add @swarm-markets/market-maker-sdk
pnpm add @swarm-markets/cross-chain-access-sdk
```

### Method 2: Clone and Build from Source (Development)

```bash
# Clone the repository
git clone https://github.com/SwarmMarkets/typescript-swarm-sdks.git
cd typescript-swarm-sdks

# Install pnpm globally (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Environment Configuration

⚠️ **Important**: The SDKs do not require a `.env` file. When integrating the SDKs into your application, pass credentials directly to the client constructors.

#### SDK Integration in Your Projects

When using the SDKs in your own code, pass credentials directly to the client:

```typescript
import { TradingClient, Network } from "@swarm-markets/trading-sdk";

// Pass credentials directly - no .env file needed
const client = new TradingClient({
  network: Network.POLYGON,
  privateKey: "0x...",           // Your private key
  rpqApiKey: "your_rpq_key",     // Your RPQ API key
  userEmail: "you@example.com"   // Your email
});

await client.initialize();
```

For working code examples with full setup instructions, see the [Examples Directory](examples/).

⚠️ **Security Note**: Never commit your private keys to version control!

---

## 📚 SDK Descriptions

### 1. Trading SDK - Unified Smart Routing

**Highest-level interface** that intelligently combines both Market Maker and Cross-Chain Access platforms with automatic routing, price comparison, and fallback protection.

**Best for**: Production applications, traders seeking optimal prices and reliability

**Key Features**: 5 routing strategies, real-time price comparison, automatic fallback, unified API

📖 [User Guide](docs/trading_sdk_doc.md) | [API Reference](docs/trading_sdk_references.md)

---

### 2. Market Maker SDK - Decentralized P2P Trading

**Decentralized on-chain trading** through smart contract-based offers with 24/7 availability and permissionless access.

**Best for**: Market makers, liquidity providers, 24/7 trading, DeFi applications

**Key Features**: P2P execution, create/manage offers, fixed & dynamic pricing, no KYC required

📖 [User Guide](docs/market_maker_sdk_doc.md) | [API Reference](docs/market_maker_sdk_references.md)

---

### 3. Cross-Chain Access SDK - Stock Market Integration

**Centralized stock market trading** with real US stock exchange rates and traditional market liquidity.

**Best for**: Stock trading apps, regulated services, traditional finance integration

**Key Features**: Stock market pricing, deep liquidity, market hours (14:30-21:00 UTC), KYC compliant

⚠️ **Requires**: KYC verification at [https://dotc.eth.limo/](https://dotc.eth.limo/)

📖 [User Guide](docs/cross_chain_access_sdk_doc.md) | [API Reference](docs/cross_chain_access_sdk_references.md)

---

## 📂 Project Structure

```
typescript-swarm-sdks/
├── packages/                      # Monorepo packages
│   ├── shared/                   # Shared infrastructure (Layer 3)
│   │   ├── src/
│   │   │   ├── baseClient.ts     # HTTP client with retries
│   │   │   ├── swarmAuth.ts      # Wallet-based authentication
│   │   │   ├── models.ts         # Common data models
│   │   │   ├── constants.ts      # Token addresses, RPC URLs
│   │   │   ├── config.ts         # Environment configuration
│   │   │   ├── remoteConfig.ts   # Remote config loader
│   │   │   └── web3/
│   │   │       ├── helpers.ts    # Web3 operations
│   │   │       ├── exceptions.ts # Web3 exceptions
│   │   │       └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── trading-sdk/              # Trading SDK (Layer 1)
│   │   ├── src/
│   │   │   ├── sdk/
│   │   │   │   └── client.ts     # TradingClient - unified interface
│   │   │   ├── routing.ts        # Smart routing logic & strategies
│   │   │   ├── exceptions.ts     # Trading-specific exceptions
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── market-maker-sdk/         # Market Maker SDK (Layer 2a)
│   │   ├── src/
│   │   │   ├── sdk/
│   │   │   │   └── client.ts     # MarketMakerClient - main interface
│   │   │   ├── rpqService/       # RPQ API integration
│   │   │   │   ├── client.ts     # Offer discovery & quotes
│   │   │   │   ├── models.ts     # Offer data models
│   │   │   │   ├── exceptions.ts # RPQ-specific exceptions
│   │   │   │   └── index.ts
│   │   │   ├── marketMakerWeb3/  # On-chain execution
│   │   │   │   ├── client.ts     # Smart contract interactions
│   │   │   │   ├── constants.ts  # Contract addresses & ABIs
│   │   │   │   ├── exceptions.ts # Web3-specific exceptions
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── cross-chain-access-sdk/   # Cross-Chain Access SDK (Layer 2b)
│       ├── src/
│       │   ├── sdk/
│       │   │   └── client.ts     # CrossChainAccessClient - main interface
│       │   ├── crossChainAccess/ # API integration
│       │   │   ├── client.ts     # HTTP API client
│       │   │   ├── models.ts     # Quote & order models
│       │   │   ├── exceptions.ts # API-specific exceptions
│       │   │   └── index.ts
│       │   ├── marketHours/      # Market hours validation
│       │   │   ├── marketHours.ts # Trading hours logic
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── examples/                      # Usage examples
│   ├── example_trading.ts        # Trading SDK examples
│   ├── example_market_maker.ts   # Market Maker SDK examples
│   ├── example_cross_chain_access.ts  # Cross-Chain Access examples
│   ├── example_error_handling.ts # Error handling patterns
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/                          # Documentation
│   ├── trading_sdk_doc.md         # Trading SDK user guide
│   ├── trading_sdk_references.md  # Trading SDK API reference
│   ├── market_maker_sdk_doc.md    # Market Maker SDK user guide
│   ├── market_maker_sdk_references.md  # Market Maker SDK API reference
│   ├── cross_chain_access_sdk_doc.md   # Cross-Chain Access user guide
│   └── cross_chain_access_sdk_references.md  # Cross-Chain Access API reference
│
├── .github/                       # GitHub configuration
│   └── workflows/
│       └── publish.yml           # CI/CD pipeline for npm publishing
│
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── package.json                  # Root package.json (monorepo)
├── tsconfig.base.json            # Base TypeScript configuration
├── NPM_PUBLISHING.md             # Publishing guide
├── LICENSE                       # MIT license
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

### Key Directories

| Directory                  | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `packages/trading-sdk/`    | Smart routing and unified trading interface |
| `packages/market-maker-sdk/` | P2P on-chain trading implementation       |
| `packages/cross-chain-access-sdk/` | Stock market API integration        |
| `packages/shared/`         | Common utilities used by all SDKs           |
| `examples/`                | Working code examples                       |
| `docs/`                    | User guides and API references              |

---

## 🛠️ Development Setup

### Setting Up the Monorepo

The project uses **pnpm workspaces** for monorepo management. Follow these steps:

#### Prerequisites

Ensure you have the required versions:

```bash
# Check Node.js version (18+ required)
node --version

# Install pnpm globally (if not installed)
npm install -g pnpm

# Check pnpm version (8+ required)
pnpm --version
```

#### Setup Steps

```bash
# Clone the repository
git clone https://github.com/SwarmMarkets/typescript-swarm-sdks.git
cd typescript-swarm-sdks

# Install all dependencies (automatically installs workspace dependencies)
pnpm install

# Build all packages
pnpm build

# Verify the setup
pnpm typecheck
```

### Development Commands

The project includes comprehensive npm scripts for development:

#### Root Level Commands

```bash
# Build all packages
pnpm build

# Clean all build artifacts
pnpm clean

# Run linting on all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Run tests on all packages
pnpm test
```

#### Working with Individual Packages

```bash
# Build a specific package
pnpm --filter @swarm-markets/trading-sdk build

# Watch mode for development
pnpm --filter @swarm-markets/trading-sdk dev

# Clean a specific package
pnpm --filter @swarm-markets/shared clean
```

#### Running Examples

```bash
# Navigate to examples directory
cd examples

# Run specific examples
pnpm trading                # Trading SDK example
pnpm market-maker           # Market Maker SDK example
pnpm cross-chain-access     # Cross-Chain Access example
pnpm error-handling         # Error handling patterns
```

### pnpm Workspace Features

The monorepo uses pnpm workspaces for efficient dependency management:

#### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "examples"
```

#### Key Benefits

- ✅ **Shared dependencies** - Common packages installed once
- ✅ **Workspace protocol** - Link local packages with `workspace:*`
- ✅ **Fast installs** - pnpm's content-addressable store
- ✅ **Atomic operations** - Operations across all packages
- ✅ **Strict mode** - Prevents phantom dependencies

#### Workspace Dependencies

Packages reference each other using the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@swarm-markets/shared": "workspace:*",
    "@swarm-markets/market-maker-sdk": "workspace:*",
    "@swarm-markets/cross-chain-access-sdk": "workspace:*"
  }
}
```

### Code Style & Quality

The project enforces consistent code style with TypeScript:

- **TypeScript 5.3+**: Latest TypeScript features
- **Strict Mode**: All strict TypeScript checks enabled
- **ESM Only**: Modern ES modules throughout
- **Type Safety**: Full type coverage with no `any` types

#### TypeScript Configuration

```bash
# Type check all packages
pnpm typecheck

# Watch mode for type checking
pnpm --filter @swarm-markets/trading-sdk typecheck --watch
```

### Configuration Files

| File                  | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `pnpm-workspace.yaml` | Workspace configuration                      |
| `package.json`        | Root package metadata and scripts            |
| `tsconfig.base.json`  | Base TypeScript configuration                |
| `packages/*/tsconfig.json` | Package-specific TypeScript configs     |

---

## 🚀 Publishing & CI/CD

### Publishing to npm

The project uses automated publishing to npm via GitHub Actions. You can also publish manually.

#### Automated Publishing (Recommended)

The workflow is defined in `.github/workflows/publish.yml`:

**Trigger**: Push to specific branches

| Branch | Action | Destination |
| ------ | ------ | ----------- |
| `main` | Push   | **npm** (production) |
| `test` | Push   | **npm with --tag next** (testing) |

**Workflow Steps**:
1. Checkout code
2. Setup Node.js 18
3. Install pnpm
4. Install dependencies
5. Build all packages
6. Publish to npm

#### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

| Secret | Purpose |
| ------ | ------- |
| `NPM_TOKEN` | npm authentication token for publishing |

To get an npm token:
1. Login to npm: `npm login`
2. Generate token: https://www.npmjs.com/settings/[username]/tokens
3. Use "Automation" token type

#### Manual Publishing

You can publish manually using pnpm:

```bash
# Build all packages
pnpm build

# Publish all packages (requires npm login)
pnpm publish -r

# Publish a specific package
pnpm --filter @swarm-markets/trading-sdk publish

# Publish with a tag (e.g., beta)
pnpm publish -r --tag beta
```

### Version Management

Each package has its own version in its `package.json`:

```json
{
  "name": "@swarm-markets/trading-sdk",
  "version": "1.0.0"
}
```

**Version Numbering**:
- `1.0.0` - Stable release
- `1.1.0` - Minor version (new features)
- `1.1.1` - Patch version (bug fixes)
- `1.0.0-beta.1` - Pre-release

#### Updating Versions

```bash
# Update version for a specific package
cd packages/trading-sdk
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Or update manually in package.json
```

### Release Checklist

Before creating a new release:

- [ ] Update version in package(s) `package.json`
- [ ] Update `CHANGELOG.md` (if exists)
- [ ] Run `pnpm build` to ensure build succeeds
- [ ] Run `pnpm typecheck` to check for type errors
- [ ] Update documentation if needed
- [ ] Commit changes: `git commit -m "Release vX.Y.Z"`
- [ ] Create git tag: `git tag vX.Y.Z`
- [ ] Push to test branch first: `git push origin test`
- [ ] Verify test deployment
- [ ] Push to main: `git push origin main`
- [ ] Push tags: `git push --tags`

### Package Distribution

When published, packages are distributed with:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

This ensures only compiled JavaScript and TypeScript declarations are published.

For detailed publishing instructions, see [NPM_PUBLISHING.md](NPM_PUBLISHING.md).

---

## 📖 Documentation

### Available Documentation

The project includes comprehensive documentation in the `docs/` directory:

#### SDK User Guides (Beginner-Friendly)

- [**Trading SDK User Guide**](docs/trading_sdk_doc.md) - Complete guide to smart routing and unified trading
- [**Market Maker SDK User Guide**](docs/market_maker_sdk_doc.md) - P2P trading and offer creation
- [**Cross-Chain Access SDK User Guide**](docs/cross_chain_access_sdk_doc.md) - Stock market integration

#### API References (Technical)

- [**Trading SDK API Reference**](docs/trading_sdk_references.md) - Detailed method specifications
- [**Market Maker SDK API Reference**](docs/market_maker_sdk_references.md) - RPQ and Web3 client APIs
- [**Cross-Chain Access SDK API Reference**](docs/cross_chain_access_sdk_references.md) - API client specifications

#### Examples

- [**Examples Directory**](examples/) - Working code examples for all SDKs
- [**Examples README**](examples/README.md) - Setup guide for running examples

### Documentation Structure

Each SDK has two documentation files:

| Type              | Purpose                                             | Audience   |
| ----------------- | --------------------------------------------------- | ---------- |
| **User Guide**    | Setup, concepts, tutorials, troubleshooting         | All users  |
| **API Reference** | Class methods, parameters, return types, exceptions | Developers |

### Quick Links

- **Getting Started**: Start with [Trading SDK User Guide](docs/trading_sdk_doc.md)
- **Advanced Features**: Check individual SDK user guides
- **Technical Details**: Refer to API reference documents
- **Code Examples**: See the [Examples Directory](examples/)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/typescript-swarm-sdks.git
   cd typescript-swarm-sdks
   ```

3. **Set up development environment**

   ```bash
   pnpm install
   pnpm build
   ```

4. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes**

   - Write code following project style
   - Add tests for new features
   - Update documentation if needed

6. **Run quality checks**

   ```bash
   pnpm typecheck  # Type checking
   pnpm build      # Build packages
   pnpm test       # Run tests (if available)
   ```

7. **Commit your changes**

   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

8. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

### Code Standards

- **Node.js Version**: 18+
- **pnpm Version**: 8+
- **TypeScript**: Strict mode enabled
- **Module System**: ESM (ES modules)
- **Code Style**: TypeScript best practices

### Commit Message Convention

Use descriptive commit messages:

```
Add: New feature description
Fix: Bug fix description
Update: Changes to existing features
Docs: Documentation updates
Test: Test additions or modifications
Refactor: Code refactoring
Style: Code style changes
Build: Build system changes
```

### Areas for Contribution

- 🐛 **Bug Fixes** - Fix issues reported in GitHub Issues
- ✨ **New Features** - Add new functionality to SDKs
- 📚 **Documentation** - Improve guides and API docs
- 🧪 **Tests** - Increase test coverage
- 🎨 **Examples** - Add more usage examples
- 🔧 **Tooling** - Improve development workflow

### Before Submitting PR

- [ ] Code follows project style
- [ ] All type checks pass (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] New tests added for new features
- [ ] Documentation updated if needed
- [ ] Commit messages are clear and descriptive

---

## 🌐 Supported Networks

All SDKs support the following networks:

| Network      | Chain ID | Native Token |
| ------------ | -------- | ------------ |
| **Polygon**  | 137      | MATIC        |
| **Ethereum** | 1        | ETH          |
| **Base**     | 8453     | ETH          |
| **BSC**      | 56       | BNB          |

### Network Configuration

Networks are defined in `packages/shared/src/models.ts`:

```typescript
import { Network } from "@swarm-markets/shared";

Network.POLYGON    // 137
Network.ETHEREUM   // 1
Network.BASE       // 8453
Network.BSC        // 56
```

RPC endpoints are configured in `packages/shared/src/constants.ts` and can be overridden with the `rpcUrl` parameter when initializing clients.

---

## 🔐 Security

### Best Practices

- ✅ Never commit private keys - use environment variables
- ✅ Verify token addresses before trading
- ✅ Test with small amounts first
- ✅ Use proper async/await patterns for cleanup

### Reporting Security Issues

Email: developers@swarm.com (do NOT create public GitHub issues for vulnerabilities)

---

## ⚠️ Important Caveats

### String Usage for Amounts (CRITICAL)

- ✅ **Always use strings** for token amounts - never plain numbers
- ❌ Numbers can cause precision loss: Use `"100"` not `100`
- ✅ SDKs handle wei conversion automatically

```typescript
// ✅ Correct
await client.trade({
  fromAmount: "100",  // String
  // ...
});

// ❌ Wrong
await client.trade({
  fromAmount: 100,  // Number - may lose precision
  // ...
});
```

### Async/Await Required

All SDK operations are asynchronous:

```typescript
// Initialize client
await client.initialize();

// Execute trades
const result = await client.trade({...});

// Get quotes
const quotes = await client.getQuotes({...});
```

### Platform-Specific Requirements

- **Market Maker**: Requires RPQ API key for offer discovery
- **Cross-Chain Access**: Requires KYC verification + operates only during market hours (14:30-21:00 UTC, weekdays)
- **Trading SDK**: Benefits from both credentials but can work with just one platform

### Security Warnings

- 🔐 Never commit private keys or `.env` files to version control
- 🔐 Always verify token addresses before trading
- 🔐 Test with small amounts first
- 🔐 Private keys are used locally only - never sent to servers

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Swarm Markets

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links & Resources

- **GitHub**: https://github.com/SwarmMarkets/typescript-swarm-sdks
- **npm Organization**: https://www.npmjs.com/org/swarm-markets
- **Documentation**: [docs/](docs/)
- **Examples**: [examples/](examples/)
- **Swarm Website**: https://swarm.com

---

## 💬 Support

- 📚 **Documentation**: [docs/](docs/)
- 💡 **Examples**: [examples/](examples/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/SwarmMarkets/typescript-swarm-sdks/issues)
- 📧 **Email**: developers@swarm.com

---

## 🎉 Acknowledgments

Built by the Swarm Markets team using TypeScript, Viem, and modern Web3 tools.

---

**Made with ❤️ by Swarm Markets**
