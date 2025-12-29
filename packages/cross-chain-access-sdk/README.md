# @swarm/cross-chain-access-sdk

Swarm Cross-Chain Access SDK for trading stock market RWAs (Real World Assets).

## Installation

```bash
pnpm add @swarm/cross-chain-access-sdk
```

## Features

- **Stock Market Trading**: Buy and sell tokenized stocks (AAPL, MSFT, etc.)
- **Market Hours Checking**: Automatic market hours validation
- **Account Management**: Check account status and buying power
- **Cross-Chain Support**: Trade on multiple blockchain networks

## Quick Start

```typescript
import { CrossChainAccessClient, Network } from "@swarm/cross-chain-access-sdk";

const client = new CrossChainAccessClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  userEmail: "user@example.com",
});

await client.initialize();

// Check if market is open
const [isAvailable, message] = await client.checkTradingAvailability();
console.log(message);

// Buy stock RWA with USDC
const result = await client.buy({
  rwaTokenAddress: "0xRWA...",
  rwaSymbol: "AAPL",
  usdcAmount: 1000,
  userEmail: "user@example.com",
});

console.log(`Trade executed: ${result.txHash}`);

await client.close();
```

## API

### CrossChainAccessClient

Main client for Cross-Chain Access trading.

```typescript
const client = new CrossChainAccessClient({
  network: Network.POLYGON, // Required: Network to trade on
  privateKey: "0x...", // Required: Private key for signing
  userEmail: "user@example.com", // Optional: User email
  rpcUrl: "https://...", // Optional: Custom RPC URL
});
```

#### Methods

- `initialize()` - Initialize and authenticate
- `close()` - Close and cleanup resources
- `checkTradingAvailability()` - Check if trading is available
- `getQuote(rwaSymbol)` - Get a quote for a stock symbol
- `buy(params)` - Buy RWA tokens with USDC
- `sell(params)` - Sell RWA tokens for USDC

### Market Hours

Check market hours (US stock market: 9:30 AM - 4:00 PM EST).

```typescript
import {
  MarketHours,
  isMarketOpen,
  getMarketStatus,
} from "@swarm/cross-chain-access-sdk";

// Check if market is open
if (isMarketOpen()) {
  console.log("Market is open!");
}

// Get detailed status
const status = getMarketStatus();
console.log(status.message); // "Market is open. Closes in 3h 45m"
```

### CrossChainAccessAPIClient

Low-level client for Cross-Chain Access API.

```typescript
import { CrossChainAccessAPIClient } from "@swarm/cross-chain-access-sdk";

const api = new CrossChainAccessAPIClient();
api.setAuthToken("...");

const quote = await api.getAssetQuote("AAPL");
console.log(`Ask: $${quote.askPrice}, Bid: $${quote.bidPrice}`);
```

## Supported Stock Symbols

The SDK supports trading tokenized versions of major US stocks, including:

- AAPL (Apple)
- MSFT (Microsoft)
- GOOGL (Alphabet)
- And many more...

## Market Hours

Trading is only available during US stock market hours:

- **Open**: 9:30 AM EST (14:30 UTC)
- **Close**: 4:00 PM EST (21:00 UTC)
- **Days**: Monday - Friday

## Supported Networks

- Polygon (Chain ID: 137) - Primary network
- Other networks may be available

## License

MIT
