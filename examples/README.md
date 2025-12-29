# Swarm SDK Examples

This folder contains example scripts demonstrating how to use the Swarm TypeScript SDKs.

## Prerequisites

1. Set up environment variables in a `.env` file:

```bash
# Required for all examples
PRIVATE_KEY=your_ethereum_private_key

# Required for Market Maker SDK
RPQ_API_KEY=your_rpq_api_key

# Required for Cross-Chain Access SDK
USER_EMAIL=your@email.com

# Optional: Set environment mode (dev/prod)
SWARM_COLLECTION_MODE=prod
```

2. Install dependencies:

```bash
cd typescript
pnpm install
```

3. Build all packages:

```bash
pnpm build
```

## Running Examples

From the `typescript/examples` directory:

```bash
# Trading SDK example - demonstrates all routing strategies
pnpm trading

# Market Maker SDK example - decentralized OTC trading
pnpm market-maker

# Cross-Chain Access SDK example - stock market RWA trading
pnpm cross-chain-access

# Error handling patterns across all SDKs
pnpm error-handling
```

Or run directly with tsx:

```bash
npx tsx example_trading.ts
npx tsx example_market_maker.ts
npx tsx example_cross_chain_access.ts
npx tsx example_error_handling.ts
```

## Examples Overview

### Trading SDK (`example_trading.ts`)

Demonstrates the unified Trading SDK that automatically routes trades through the best available platform:

- **BEST_PRICE**: Compare prices from all platforms and use the best one
- **CROSS_CHAIN_ACCESS_FIRST**: Try stock market first, fallback to Market Maker
- **MARKET_MAKER_FIRST**: Try Market Maker first, fallback to stock market
- **CROSS_CHAIN_ACCESS_ONLY**: Use only stock market API
- **MARKET_MAKER_ONLY**: Use only decentralized Market Maker

### Market Maker SDK (`example_market_maker.ts`)

Demonstrates peer-to-peer RWA trading through smart contracts:

- Get available offers
- Get best offers for a token pair
- Get quotes
- Execute trades
- Create your own offers
- Get price feeds for dynamic offers

### Cross-Chain Access SDK (`example_cross_chain_access.ts`)

Demonstrates stock market RWA trading:

- Check market hours
- Check trading availability
- Get account status and funds
- Get real-time quotes
- Buy/sell RWA tokens (same chain)
- Cross-chain trades

### Error Handling (`example_error_handling.ts`)

Demonstrates proper error handling patterns:

- Cross-Chain Access errors (market closed, account blocked, insufficient funds)
- Market Maker errors (no offers available, insufficient balance)
- Trading SDK errors with automatic fallback
- Web3/blockchain errors

## Notes

- Trade executions are **commented out for safety** in all examples
- Uncomment the trade sections to execute real trades
- Always use test networks or small amounts when testing
- Check token addresses match your network (Polygon, Ethereum, etc.)
