# @swarm/trading-sdk

Unified Swarm Trading SDK with smart routing between Market Maker and Cross-Chain Access platforms.

## Installation

```bash
pnpm add @swarm/trading-sdk
```

## Features

- **Smart Routing**: Automatically selects the best platform based on price, availability, and strategy
- **Platform Aggregation**: Compare quotes from multiple platforms
- **Automatic Fallback**: Falls back to alternative platform if primary fails
- **Unified Interface**: Single API for all trading operations

## Quick Start

```typescript
import { TradingClient, Network, RoutingStrategy } from "@swarm/trading-sdk";

const client = new TradingClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your-api-key",
  userEmail: "user@example.com",
  routingStrategy: RoutingStrategy.BEST_PRICE,
});

await client.initialize();

// Execute trade with smart routing
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100,
  toTokenSymbol: "AAPL",
  userEmail: "user@example.com",
});

console.log(`Trade executed via: ${result.source}`);
console.log(`Transaction: ${result.txHash}`);

await client.close();
```

## Routing Strategies

| Strategy                   | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `BEST_PRICE`               | Select platform with best price (default)              |
| `CROSS_CHAIN_ACCESS_FIRST` | Try Cross-Chain Access first, fallback to Market Maker |
| `MARKET_MAKER_FIRST`       | Try Market Maker first, fallback to Cross-Chain Access |
| `CROSS_CHAIN_ACCESS_ONLY`  | Only use Cross-Chain Access                            |
| `MARKET_MAKER_ONLY`        | Only use Market Maker                                  |

## API

### TradingClient

Main client with smart routing.

```typescript
const client = new TradingClient({
  network: Network.POLYGON, // Required: Network to trade on
  privateKey: "0x...", // Required: Private key for signing
  rpqApiKey: "your-api-key", // Required: RPQ Service API key
  userEmail: "user@example.com", // Optional: User email
  rpcUrl: "https://...", // Optional: Custom RPC URL
  routingStrategy: RoutingStrategy.BEST_PRICE, // Optional: Default strategy
});
```

#### Methods

- `initialize()` - Initialize both underlying clients
- `close()` - Close and cleanup resources
- `getQuotes(params)` - Get quotes from all platforms
- `trade(options)` - Execute trade with smart routing

### Getting Quotes

```typescript
const quotes = await client.getQuotes({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100,
  toTokenSymbol: "AAPL",
});

console.log("Market Maker:", quotes.market_maker?.rate);
console.log("Cross-Chain Access:", quotes.cross_chain_access?.rate);
```

### Trade Options

```typescript
const result = await client.trade({
  fromToken: "0xUSDC...", // Token to sell
  toToken: "0xRWA...", // Token to buy
  userEmail: "user@email.com", // User email for notifications
  fromAmount: 100, // Amount to sell (or use toAmount)
  toTokenSymbol: "AAPL", // Stock symbol (required for Cross-Chain Access)
  routingStrategy: RoutingStrategy.BEST_PRICE, // Override default strategy
});
```

### Direct Platform Access

You can also access underlying clients directly:

```typescript
// Market Maker operations
const mmQuote = await client.marketMakerClient.getQuote(
  "0xFromToken",
  "0xToToken",
  100
);

// Cross-Chain Access operations
const ccaQuote = await client.crossChainAccessClient.getQuote("AAPL");
```

## Error Handling

```typescript
import {
  TradingException,
  NoLiquidityException,
  AllPlatformsFailedException,
} from '@swarm/trading-sdk';

try {
  await client.trade({...});
} catch (error) {
  if (error instanceof NoLiquidityException) {
    console.log('No liquidity available on any platform');
  } else if (error instanceof AllPlatformsFailedException) {
    console.log('All platforms failed:', error.message);
  }
}
```

## Supported Networks

- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Base (Chain ID: 8453)
- BSC (Chain ID: 56)

## License

MIT
