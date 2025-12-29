# @swarm/market-maker-sdk

Swarm Market Maker SDK for peer-to-peer OTC trading on blockchain.

## Installation

```bash
pnpm add @swarm/market-maker-sdk
```

## Features

- **RPQ Service**: Request-for-Quote service for discovering offers
- **Smart Contract Integration**: Direct interaction with Market Maker contracts
- **Token Operations**: ERC20 approvals and transfers
- **Offer Management**: Make, take, and cancel offers

## Quick Start

```typescript
import { MarketMakerClient, Network } from "@swarm/market-maker-sdk";

const client = new MarketMakerClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your-api-key",
});

await client.initialize();

// Get a quote
const quote = await client.getQuote(
  "0xFromToken...",
  "0xToToken...",
  100 // fromAmount
);

// Execute a trade
const result = await client.trade(
  "0xFromToken...",
  "0xToToken...",
  100 // fromAmount
);

console.log(`Trade executed: ${result.txHash}`);

await client.close();
```

## API

### MarketMakerClient

Main client for Market Maker operations.

```typescript
const client = new MarketMakerClient({
  network: Network.POLYGON, // Required: Network to trade on
  privateKey: "0x...", // Required: Private key for signing
  rpqApiKey: "your-api-key", // Required: RPQ Service API key
  userEmail: "user@example.com", // Optional: User email
  rpcUrl: "https://...", // Optional: Custom RPC URL
});
```

#### Methods

- `initialize()` - Initialize the client
- `close()` - Close and cleanup resources
- `getQuote(fromToken, toToken, fromAmount?, toAmount?)` - Get a quote
- `trade(fromToken, toToken, fromAmount?, toAmount?, affiliate?)` - Execute a trade
- `makeOffer(params)` - Create a new offer
- `cancelOffer(offerId)` - Cancel an existing offer

### RPQClient

Low-level client for RPQ Service API.

```typescript
import { RPQClient } from "@swarm/market-maker-sdk";

const rpq = new RPQClient("polygon", "api-key");
const offers = await rpq.getOffers("0xBuyAsset", "0xSellAsset");
```

### MarketMakerWeb3Client

Low-level client for smart contract interactions.

```typescript
import { MarketMakerWeb3Client, Network } from "@swarm/market-maker-sdk";

const web3Client = new MarketMakerWeb3Client(
  Network.POLYGON,
  "0xPrivateKey..."
);

const txHash = await web3Client.takeFixedOffer(
  123, // offerId
  "0xWithdrawToken", // withdrawal token address
  1000000000n // amount in wei
);
```

## Supported Networks

- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Base (Chain ID: 8453)
- BSC (Chain ID: 56)

## License

MIT
