# Swarm TypeScript SDK

A TypeScript SDK for interacting with Swarm's trading platforms, including Market Maker and Cross-Chain Access for stock market RWAs.

## Packages

This monorepo contains the following packages:

| Package                         | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| `@swarm/shared`                 | Shared utilities, types, and clients used across all SDKs |
| `@swarm/market-maker-sdk`       | Market Maker SDK for peer-to-peer OTC trading             |
| `@swarm/cross-chain-access-sdk` | Cross-Chain Access SDK for stock market RWA trading       |
| `@swarm/trading-sdk`            | Unified trading SDK with smart routing between platforms  |

## Installation

```bash
# Install all packages
pnpm install

# Build all packages
pnpm build
```

## Quick Start

### Using the Unified Trading SDK

```typescript
import { TradingClient, Network, RoutingStrategy } from "@swarm/trading-sdk";

const client = new TradingClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your-api-key",
  userEmail: "user@example.com",
});

await client.initialize();

// Smart routing between Market Maker and Cross-Chain Access
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100,
  toTokenSymbol: "AAPL",
  userEmail: "user@example.com",
  routingStrategy: RoutingStrategy.BEST_PRICE,
});

console.log(`Trade executed: ${result.txHash}`);

await client.close();
```

### Using Market Maker SDK Directly

```typescript
import { MarketMakerClient, Network } from "@swarm/market-maker-sdk";

const client = new MarketMakerClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your-api-key",
});

await client.initialize();

const result = await client.trade(
  "0xFromToken...",
  "0xToToken...",
  100 // fromAmount
);

await client.close();
```

### Using Cross-Chain Access SDK Directly

```typescript
import { CrossChainAccessClient, Network } from "@swarm/cross-chain-access-sdk";

const client = new CrossChainAccessClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  userEmail: "user@example.com",
});

await client.initialize();

const result = await client.buy({
  rwaTokenAddress: "0xRWA...",
  rwaSymbol: "AAPL",
  usdcAmount: 1000,
  userEmail: "user@example.com",
});

await client.close();
```

## Environment Variables

| Variable                | Description                        | Default |
| ----------------------- | ---------------------------------- | ------- |
| `SWARM_COLLECTION_MODE` | Environment mode (`dev` or `prod`) | `prod`  |

## Supported Networks

- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Base (Chain ID: 8453)
- BSC (Chain ID: 56)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean
```

## License

MIT
