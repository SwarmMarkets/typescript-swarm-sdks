# Market Maker SDK API Documentation

## Table of Contents

### Core Classes

- [MarketMakerClient](#marketmakerclient) - Main SDK entry point
  - [Constructor](#constructor)
  - [initialize()](#initialize)
  - [getQuote()](#getquote)
  - [trade()](#trade)
  - [makeOffer()](#makeoffer)
  - [cancelOffer()](#canceloffer)
  - [close()](#close)
- [RPQClient](#rpqclient) - RPQ Service API client
  - [Constructor](#constructor-1)
  - [getOffers()](#getoffers)
  - [getBestOffers()](#getbestoffers)
  - [getQuote()](#getquote-1)
  - [getPriceFeeds()](#getpricefeeds)
- [MarketMakerWeb3Client](#marketmakerweb3client) - Smart contract client
  - [Constructor](#constructor-2)
  - [takeOfferFixed()](#takeofferfixed)
  - [takeOfferDynamic()](#takeofferdynamic)
  - [makeOffer()](#makeoffer-1)
  - [cancelOffer()](#canceloffer-1)
  - [getOfferDetails()](#getofferdetails)

### Data Models

- [Offer](#offer)
- [SelectedOffer](#selectedoffer)
- [BestOffersResponse](#bestoffersresponse)
- [Quote](#quote)
- [QuoteResponse](#quoteresponse)
- [TradeResult](#traderesult)
- [Asset](#asset)
- [OfferPrice](#offerprice)
- [PriceFeedsResponse](#pricefeedsresponse)

### Enumerations

- [OfferType](#offertype)
- [OfferStatus](#offerstatus)
- [PricingType](#pricingtype)
- [PercentageType](#percentagetype)
- [AssetType](#assettype)

### Exceptions

- [Exception Hierarchy](#exception-hierarchy)
- [RPQServiceException](#rpqserviceexception)
- [NoOffersAvailableException](#nooffersavailableexception)
- [QuoteUnavailableException](#quoteunavailableexception)
- [InvalidTokenPairException](#invalidtokenpairexception)
- [PriceFeedNotFoundException](#pricefeednotfoundexception)
- [MarketMakerWeb3Exception](#marketmakerweb3exception)
- [OfferNotFoundError](#offernotfounderror)
- [OfferInactiveError](#offerinactiveerror)
- [InsufficientOfferBalanceError](#insufficientofferbalanceerror)
- [OfferExpiredError](#offerexpirederror)
- [UnauthorizedError](#unauthorizederror)

### Additional Resources

- [Supported Networks](#supported-networks)
- [Contract Addresses](#contract-addresses)

---

## MarketMakerClient

**Location**: `packages/market-maker-sdk/src/sdk/client.ts`

The main entry point for Market Maker trading operations. Orchestrates authentication, quote discovery via RPQ Service, and on-chain execution via smart contracts.

### Constructor

```typescript
constructor(config: {
  network: Network;
  privateKey: string;
  rpqApiKey: string;
  userEmail?: string;
  rpcUrl?: string;
})
```

**Parameters**:

| Parameter     | Type      | Required | Description                                        |
| ------------- | --------- | -------- | -------------------------------------------------- |
| `network`     | `Network` | ✅       | Blockchain network (e.g., `Network.POLYGON`)       |
| `privateKey`  | `string`  | ✅       | Wallet private key (with `0x` prefix)              |
| `rpqApiKey`   | `string`  | ✅       | API key for RPQ Service                            |
| `userEmail`   | `string`  | ❌       | User email for authentication (optional)           |
| `rpcUrl`      | `string`  | ❌       | Custom RPC endpoint (uses default if not provided) |

**Attributes**:

- `network`: Active blockchain network
- `rpqClient`: Instance of `RPQClient` for offer discovery
- `web3Client`: Instance of `MarketMakerWeb3Client` for on-chain operations
- `auth`: Instance of `SwarmAuth` for authentication
- `userEmail`: User email for authentication

**Example**:

```typescript
import { MarketMakerClient } from "@swarm/market-maker-sdk";
import { Network } from "@swarm/shared";

// Using try-finally pattern (recommended)
const client = new MarketMakerClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your_key",
  userEmail: "user@example.com"
});

await client.initialize();

try {
  const result = await client.trade({
    fromToken: "0xUSDC...",
    toToken: "0xRWA...",
    fromAmount: 100
  });
  console.log(`Trade complete: ${result.txHash}`);
} finally {
  await client.close();
}
```

---

### initialize()

Initialize and authenticate with the Swarm platform using wallet signature.

```typescript
async initialize(): Promise<void>
```

**Returns**: `Promise<void>`

**Throws**:

- `AuthenticationError`: If authentication fails

**Description**:

Uses the wallet's private key to sign an authentication message and obtains an access token. Must be called after creating the client instance.

**Example**:

```typescript
const client = new MarketMakerClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "key"
});
await client.initialize();
// Now ready to make authenticated API calls
```

---

### getQuote()

Get a quote for trading tokens via Market Maker.

```typescript
async getQuote(params: {
  fromToken: string;
  toToken: string;
  fromAmount?: number;
  toAmount?: number;
}): Promise<Quote>
```

**Parameters**:

| Parameter    | Type     | Required | Description                                  |
| ------------ | -------- | -------- | -------------------------------------------- |
| `fromToken`  | `string` | ✅       | Token address to sell                        |
| `toToken`    | `string` | ✅       | Token address to buy                         |
| `fromAmount` | `number` | ⚠️       | Amount to sell (either this or `toAmount`)   |
| `toAmount`   | `number` | ⚠️       | Amount to buy (either this or `fromAmount`)  |

**⚠️ Important**: Provide **either** `fromAmount` **OR** `toAmount`, not both.

**Returns**: `Promise<Quote>`

Returns a normalized `Quote` object with:

- `sellTokenAddress`: Token being sold
- `sellAmount`: Amount being sold (normalized)
- `buyTokenAddress`: Token being bought
- `buyAmount`: Amount being bought (normalized)
- `rate`: Exchange rate (buyAmount / sellAmount)
- `source`: `"Market Maker RPQ"`
- `timestamp`: Current time

**Throws**:

- `NoOffersAvailableException`: If no offers available
- `QuoteUnavailableException`: If quote cannot be calculated
- `Error`: If both or neither amounts provided

**Example**:

```typescript
// Get quote for spending 100 USDC
const quote = await client.getQuote({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100
});
console.log(`You'll receive ${quote.buyAmount} RWA tokens`);

// Or get quote for buying 10 RWA tokens
const quote = await client.getQuote({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  toAmount: 10
});
console.log(`You'll pay ${quote.sellAmount} USDC`);
```

---

### trade()

Execute a Market Maker trade by taking offers.

```typescript
async trade(params: {
  fromToken: string;
  toToken: string;
  fromAmount?: number;
  toAmount?: number;
  affiliate?: string;
}): Promise<TradeResult>
```

**Parameters**:

| Parameter    | Type     | Required | Description                                  |
| ------------ | -------- | -------- | -------------------------------------------- |
| `fromToken`  | `string` | ✅       | Token to sell (withdrawal asset)             |
| `toToken`    | `string` | ✅       | Token to buy (deposit asset)                 |
| `fromAmount` | `number` | ⚠️       | Amount to sell (either this or `toAmount`)   |
| `toAmount`   | `number` | ⚠️       | Amount to buy (either this or `fromAmount`)  |
| `affiliate`  | `string` | ❌       | Optional affiliate address for fee sharing   |

**⚠️ Important**: Provide **either** `fromAmount` **OR** `toAmount`, not both.

**Returns**: `Promise<TradeResult>`

Contains:

- `txHash`: Blockchain transaction hash
- `orderId`: Offer ID that was taken
- `sellTokenAddress`: Token sold
- `sellAmount`: Amount sold (normalized)
- `buyTokenAddress`: Token bought
- `buyAmount`: Amount bought (normalized)
- `rate`: Exchange rate
- `source`: `"market_maker"`
- `timestamp`: Trade execution time
- `network`: Network used

**Trade Flow**:

1. 🔍 **Get best offers** - Queries RPQ Service
2. ✅ **Approve tokens** - Allows contract to spend withdrawal tokens
3. 📊 **Detect pricing type** - Fixed or dynamic
4. 🔗 **Execute on-chain** - Calls appropriate contract function
5. ⏳ **Wait for confirmation** - Returns after transaction is mined

**Throws**:

| Exception                       | Condition                        |
| ------------------------------- | -------------------------------- |
| `Error`                         | Both or neither amounts provided |
| `NoOffersAvailableException`    | No offers available              |
| `OfferNotFoundError`            | Offer doesn't exist              |
| `OfferInactiveError`            | Offer is not active              |
| `InsufficientOfferBalanceError` | Maker has insufficient balance   |
| `OfferExpiredError`             | Offer has expired                |
| `MarketMakerWeb3Exception`      | On-chain execution failed        |

**Example**:

```typescript
// Buy RWA by selling 100 USDC
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100
});
console.log(`Bought ${result.buyAmount} RWA for ${result.sellAmount} USDC`);
console.log(`TX Hash: ${result.txHash}`);
console.log(`Offer ID: ${result.orderId}`);

// Or buy 10 RWA tokens (spend whatever needed)
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  toAmount: 10
});

// With affiliate
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100,
  affiliate: "0xAffiliate..."
});
```

---

### makeOffer()

Create a new Market Maker offer.

```typescript
async makeOffer(params: {
  sellToken: string;
  sellAmount: number;
  buyToken: string;
  buyAmount: number;
  isDynamic?: boolean;
  expiresAt?: number;
}): Promise<TradeResult>
```

**Parameters**:

| Parameter    | Type      | Required | Description                                               |
| ------------ | --------- | -------- | --------------------------------------------------------- |
| `sellToken`  | `string`  | ✅       | Token you're offering to sell (deposit asset)             |
| `sellAmount` | `number`  | ✅       | Amount you're selling (normalized)                        |
| `buyToken`   | `string`  | ✅       | Token you want to buy (withdrawal asset)                  |
| `buyAmount`  | `number`  | ✅       | Amount you want to receive (normalized)                   |
| `isDynamic`  | `boolean` | ❌       | Create dynamic offer using price feeds (default: `false`) |
| `expiresAt`  | `number`  | ❌       | Optional expiration timestamp (0 = no expiry)             |

**Returns**: `Promise<TradeResult>`

Contains:

- `txHash`: Blockchain transaction hash
- `orderId`: Created offer ID
- `sellTokenAddress`: Token deposited
- `sellAmount`: Amount deposited
- `buyTokenAddress`: Token requested
- `buyAmount`: Amount requested
- `rate`: Exchange rate (buyAmount / sellAmount)
- `source`: `"market_maker"`
- `timestamp`: Offer creation time
- `network`: Network used

**Throws**:

- `MarketMakerWeb3Exception`: If offer creation fails
- `Web3Exception`: If blockchain operation fails

**Example**:

```typescript
// Create fixed-price offer
const result = await client.makeOffer({
  sellToken: "0xRWA...",      // Offering 10 RWA
  sellAmount: 10,
  buyToken: "0xUSDC...",      // Want 1000 USDC
  buyAmount: 1000
});
console.log(`Offer created! ID: ${result.orderId}, TX: ${result.txHash}`);

// Create dynamic offer
const result = await client.makeOffer({
  sellToken: "0xRWA...",
  sellAmount: 10,
  buyToken: "0xUSDC...",
  buyAmount: 1000,
  isDynamic: true  // Use price feeds
});

// With expiration (7 days)
const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
const result = await client.makeOffer({
  sellToken: "0xRWA...",
  sellAmount: 10,
  buyToken: "0xUSDC...",
  buyAmount: 1000,
  expiresAt: expiresAt
});
```

---

### cancelOffer()

Cancel an existing offer.

```typescript
async cancelOffer(offerId: string): Promise<string>
```

**Parameters**:

| Parameter | Type     | Required | Description        |
| --------- | -------- | -------- | ------------------ |
| `offerId` | `string` | ✅       | Offer ID to cancel |

**Returns**: `Promise<string>`

Transaction hash of the cancellation transaction.

**Throws**:

- `OfferNotFoundError`: If offer doesn't exist
- `UnauthorizedError`: If caller is not the offer creator
- `MarketMakerWeb3Exception`: If cancellation fails

**Example**:

```typescript
const txHash = await client.cancelOffer("12345");
console.log(`Offer cancelled! TX: ${txHash}`);
```

---

### close()

Close all clients and cleanup resources.

```typescript
async close(): Promise<void>
```

**Returns**: `Promise<void>`

**Description**:

Properly closes HTTP clients and cleans up resources. Should always be called when done using the client.

**Example**:

```typescript
const client = new MarketMakerClient({...});
await client.initialize();
try {
  const result = await client.trade({...});
} finally {
  await client.close();  // Always cleanup
}
```

---

## RPQClient

**Location**: `packages/market-maker-sdk/src/rpq-service/client.ts`

Client for interacting with Market Maker RPQ (Request for Quote) Service API. Provides market data and offer discovery.

### Constructor

```typescript
constructor(config?: {
  network?: string;
  apiKey?: string;
})
```

**Parameters**:

| Parameter | Type     | Required | Description                                                            |
| --------- | -------- | -------- | ---------------------------------------------------------------------- |
| `network` | `string` | ❌       | Network name: "polygon", "ethereum", "base", etc. (default: "polygon") |
| `apiKey`  | `string` | ⚠️       | API key for authentication (required for most endpoints)               |

**Base URL**: `https://rfq.swarm.com/v1/client`

**Example**:

```typescript
import { RPQClient } from "@swarm/market-maker-sdk/rpq-service";

const client = new RPQClient({
  network: "polygon",
  apiKey: "your-api-key"
});

const offers = await client.getOffers({
  buyAssetAddress: "0x...",
  sellAssetAddress: "0x..."
});
```

---

### getOffers()

Get all available offers filtered by network and optionally by assets.

```typescript
async getOffers(params?: {
  buyAssetAddress?: string;
  sellAssetAddress?: string;
  page?: number;
  limit?: number;
}): Promise<Offer[]>
```

**Parameters**:

| Parameter          | Type     | Required | Description                                        |
| ------------------ | -------- | -------- | -------------------------------------------------- |
| `buyAssetAddress`  | `string` | ❌       | Filter by asset to buy (optional)                  |
| `sellAssetAddress` | `string` | ❌       | Filter by asset to sell (optional)                 |
| `page`             | `number` | ❌       | Page number (default: 0)                           |
| `limit`            | `number` | ❌       | Number of offers per page (default: 100, max: 100) |

**Returns**: `Promise<Offer[]>`

List of matching offers with full details including pricing, availability, and assets.

**Throws**:

| Exception                    | Status Code | Condition                  |
| ---------------------------- | ----------- | -------------------------- |
| `NoOffersAvailableException` | N/A         | No offers found            |
| `RPQServiceException`        | 401         | Invalid or missing API key |
| `RPQServiceException`        | 429         | Monthly rate limit reached |
| `APIException`               | Other       | Request failed             |

**Example**:

```typescript
// Get all offers for token pair
const offers = await client.getOffers({
  buyAssetAddress: "0x7ceB23fd6bc0add59E62ac25578270cFf1b9f619",  // WETH
  sellAssetAddress: "0x3c499c542cef5E3811e1192ce70d8cC03d5c3359",  // USDC
  limit: 10
});

for (const offer of offers) {
  console.log(`Offer ${offer.id}: ${offer.amountIn} -> ${offer.amountOut}`);
  console.log(`  Type: ${offer.offerType}`);
  console.log(`  Status: ${offer.offerStatus}`);
  console.log(`  Available: ${offer.availableAmount}`);
}
```

---

### getBestOffers()

Get the best sequence of offers to reach a target amount.

```typescript
async getBestOffers(params: {
  buyAssetAddress: string;
  sellAssetAddress: string;
  targetSellAmount?: string;
  targetBuyAmount?: string;
}): Promise<BestOffersResponse>
```

**Parameters**:

| Parameter          | Type     | Required | Description                                                                        |
| ------------------ | -------- | -------- | ---------------------------------------------------------------------------------- |
| `buyAssetAddress`  | `string` | ✅       | Address of asset to buy (receive)                                                  |
| `sellAssetAddress` | `string` | ✅       | Address of asset to sell (give up)                                                 |
| `targetSellAmount` | `string` | ⚠️       | Target amount to sell in normal decimal units (either this or `targetBuyAmount`)   |
| `targetBuyAmount`  | `string` | ⚠️       | Target amount to buy in normal decimal units (either this or `targetSellAmount`)   |

**⚠️ Important**: Provide **either** `targetSellAmount` **OR** `targetBuyAmount`, not both.

**Returns**: `Promise<BestOffersResponse>`

Contains:

- `success`: Whether operation succeeded
- `result`: `BestOffersResult` with:
  - `success`: Whether sufficient liquidity found
  - `targetAmount`: Target amount requested
  - `totalWithdrawalAmountPaid`: Total amount that will be paid
  - `selectedOffers`: List of `SelectedOffer` objects
  - `mode`: `"buy"` or `"sell"`

**Throws**:

- `NoOffersAvailableException`: If no offers available
- `Error`: If both or neither target amounts specified
- `RPQServiceException`: If API request fails

**Example**:

```typescript
// Find best offers to spend 100 USDC
const best = await client.getBestOffers({
  buyAssetAddress: "0x7ceB23fd6bc0add59E62ac25578270cFf1b9f619",
  sellAssetAddress: "0x3c499c542cef5E3811e1192ce70d8cC03d5c3359",
  targetSellAmount: "100"
});

console.log(`Success: ${best.result.success}`);
console.log(`Total to pay: ${best.result.totalWithdrawalAmountPaid}`);
console.log(`Selected ${best.result.selectedOffers.length} offer(s)`);

for (const offer of best.result.selectedOffers) {
  console.log(`\nOffer ${offer.id}:`);
  console.log(`  Amount: ${offer.withdrawalAmountPaid}`);
  console.log(`  Price: ${offer.pricePerUnit}`);
  console.log(`  Type: ${offer.pricingType}`);
}
```

---

### getQuote()

Get a quote for trading tokens.

```typescript
async getQuote(params: {
  buyAssetAddress: string;
  sellAssetAddress: string;
  targetSellAmount?: string;
  targetBuyAmount?: string;
}): Promise<Quote>
```

**Parameters**:

| Parameter          | Type     | Required | Description                                                                 |
| ------------------ | -------- | -------- | --------------------------------------------------------------------------- |
| `buyAssetAddress`  | `string` | ✅       | Address of asset to buy                                                     |
| `sellAssetAddress` | `string` | ✅       | Address of asset to sell                                                    |
| `targetSellAmount` | `string` | ⚠️       | Amount to sell in normal decimal units (either this or `targetBuyAmount`)   |
| `targetBuyAmount`  | `string` | ⚠️       | Amount to buy in normal decimal units (either this or `targetSellAmount`)   |

**⚠️ Important**: Provide **either** `targetSellAmount` **OR** `targetBuyAmount`, not both.

**Returns**: `Promise<Quote>`

Returns a normalized `Quote` object in SDK format with:

- `sellTokenAddress`: Token being sold
- `sellAmount`: Amount being sold (number, normalized)
- `buyTokenAddress`: Token being bought
- `buyAmount`: Amount being bought (number, normalized)
- `rate`: Exchange rate (buyAmount / sellAmount)
- `source`: `"Market Maker RPQ"`
- `timestamp`: Current time

**Throws**:

- `QuoteUnavailableException`: If quote cannot be generated
- `Error`: If both or neither amounts specified
- `RPQServiceException`: If API request fails (401, 429, etc.)

**Example**:

```typescript
// Get quote for spending 50 USDC
const quote = await client.getQuote({
  buyAssetAddress: "0x7ceB23fd6bc0add59E62ac25578270cFf1b9f619",
  sellAssetAddress: "0x3c499c542cef5E3811e1192ce70d8cC03d5c3359",
  targetSellAmount: "50"
});

console.log(`You'll receive: ${quote.buyAmount} tokens`);
console.log(`Rate: ${quote.rate}`);
```

---

### getPriceFeeds()

Get all available price feeds for the network.

```typescript
async getPriceFeeds(): Promise<PriceFeedsResponse>
```

**Returns**: `Promise<PriceFeedsResponse>`

Contains:

- `success`: Whether operation succeeded
- `priceFeeds`: Object mapping contract addresses to price feed addresses

**Throws**:

- `PriceFeedNotFoundException`: If no feeds found
- `RPQServiceException`: If API request fails

**Example**:

```typescript
const feeds = await client.getPriceFeeds();
console.log(`Found ${Object.keys(feeds.priceFeeds).length} price feeds`);

// Get price feed for specific token
const usdcAddress = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
const usdcFeed = feeds.priceFeeds[usdcAddress.toLowerCase()];
console.log(`USDC price feed: ${usdcFeed}`);
```

---

## MarketMakerWeb3Client

**Location**: `packages/market-maker-sdk/src/market-maker-web3/client.ts`

Client for interacting with Market Maker smart contracts. Handles on-chain offer execution, creation, and cancellation.

### Constructor

```typescript
constructor(config: {
  network: Network;
  privateKey: string;
  rpcUrl?: string;
})
```

**Parameters**:

| Parameter    | Type      | Required | Description                                        |
| ------------ | --------- | -------- | -------------------------------------------------- |
| `network`    | `Network` | ✅       | Blockchain network                                 |
| `privateKey` | `string`  | ✅       | Wallet private key (with `0x` prefix)              |
| `rpcUrl`     | `string`  | ❌       | Custom RPC endpoint (uses default if not provided) |

**Attributes**:

- `network`: Network for this client instance
- `web3Helper`: `Web3Helper` for blockchain operations
- `contract`: Market Maker Manager contract instance
- `account`: User's wallet account (LocalAccount)

**Example**:

```typescript
import { MarketMakerWeb3Client } from "@swarm/market-maker-sdk/market-maker-web3";
import { Network } from "@swarm/shared";

const client = new MarketMakerWeb3Client({
  network: Network.POLYGON,
  privateKey: "0x..."
});

const txHash = await client.takeOfferFixed({
  offerId: "12345",
  withdrawalToken: "0xUSDC...",
  withdrawalAmountPaid: 100500000,  // 100.5 USDC in wei
  affiliate: undefined
});
```

---

### takeOfferFixed()

Take a fixed-price offer.

```typescript
async takeOfferFixed(params: {
  offerId: string;
  withdrawalToken: string;
  withdrawalAmountPaid: number;
  affiliate?: string;
}): Promise<string>
```

**Parameters**:

| Parameter              | Type     | Required | Description                                         |
| ---------------------- | -------- | -------- | --------------------------------------------------- |
| `offerId`              | `string` | ✅       | Unique offer identifier (hex or decimal string)     |
| `withdrawalToken`      | `string` | ✅       | Token address to pay (maker's withdrawal asset)     |
| `withdrawalAmountPaid` | `number` | ✅       | Amount to pay in smallest units (wei, from RPQ API) |
| `affiliate`            | `string` | ❌       | Optional affiliate address (undefined = zero address) |

**Returns**: `Promise<string>`

Transaction hash (0x...)

**Throws**:

- `OfferNotFoundError`: If offer doesn't exist
- `OfferInactiveError`: If offer is not active
- `InsufficientOfferBalanceError`: If maker has insufficient balance
- `Web3Exception`: If blockchain operation fails

**Example**:

```typescript
// Take a fixed offer - pay 100.5 USDC (in wei)
const txHash = await client.takeOfferFixed({
  offerId: "12345",
  withdrawalToken: "0x3c499c542cef5E3811e1192ce70d8cC03d5c3359",
  withdrawalAmountPaid: 100500000,  // 100.5 USDC (6 decimals)
  affiliate: undefined
});
console.log(`Transaction: ${txHash}`);
```

---

### takeOfferDynamic()

Take a dynamic-price offer with slippage protection.

```typescript
async takeOfferDynamic(params: {
  offerId: string;
  withdrawalToken: string;
  withdrawalAmountPaid: number;
  maximumDepositToWithdrawalRate: number;
  affiliate?: string;
}): Promise<string>
```

**Parameters**:

| Parameter                        | Type     | Required | Description                                               |
| -------------------------------- | -------- | -------- | --------------------------------------------------------- |
| `offerId`                        | `string` | ✅       | Unique offer identifier (hex or decimal string)           |
| `withdrawalToken`                | `string` | ✅       | Token address to pay (maker's withdrawal asset)           |
| `withdrawalAmountPaid`           | `number` | ✅       | Amount to pay in smallest units (wei, from RPQ API)       |
| `maximumDepositToWithdrawalRate` | `number` | ✅       | Max on-chain rate to accept (from RPQ API, set 0 to skip) |
| `affiliate`                      | `string` | ❌       | Optional affiliate address (undefined = zero address)     |

**Returns**: `Promise<string>`

Transaction hash (0x...)

**Throws**:

- `OfferNotFoundError`: If offer doesn't exist
- `OfferInactiveError`: If offer is not active
- `Web3Exception`: If blockchain operation fails or price exceeds max rate

**Example**:

```typescript
// Take a dynamic offer with slippage protection
const txHash = await client.takeOfferDynamic({
  offerId: "67890",
  withdrawalToken: "0x3c499c542cef5E3811e1192ce70d8cC03d5c3359",
  withdrawalAmountPaid: 50250000,  // 50.25 USDC
  maximumDepositToWithdrawalRate: 1050000,  // From API
  affiliate: undefined
});
console.log(`Transaction: ${txHash}`);
```

---

### makeOffer()

Create a new Market Maker offer on-chain.

```typescript
async makeOffer(params: {
  depositToken: string;
  depositAmount: number;
  withdrawToken: string;
  withdrawAmount: number;
  isDynamic?: boolean;
  expiresAt?: number;
}): Promise<{ txHash: string; offerId: string }>
```

**Parameters**:

| Parameter        | Type      | Required | Description                                        |
| ---------------- | --------- | -------- | -------------------------------------------------- |
| `depositToken`   | `string`  | ✅       | Token to deposit                                   |
| `depositAmount`  | `number`  | ✅       | Amount to deposit (normalized)                     |
| `withdrawToken`  | `string`  | ✅       | Token to withdraw                                  |
| `withdrawAmount` | `number`  | ✅       | Amount to withdraw (normalized)                    |
| `isDynamic`      | `boolean` | ❌       | Whether to create dynamic offer (default: `false`) |
| `expiresAt`      | `number`  | ❌       | Optional expiration timestamp (0 = no expiry)      |

**Returns**: `Promise<{ txHash: string; offerId: string }>`

Object with transaction hash and offer ID

**Throws**:

- `MarketMakerWeb3Exception`: If offer creation fails
- `Web3Exception`: If blockchain operation fails

**Example**:

```typescript
// Create fixed offer
const { txHash, offerId } = await client.makeOffer({
  depositToken: "0xRWA...",
  depositAmount: 10,
  withdrawToken: "0xUSDC...",
  withdrawAmount: 1000,
  isDynamic: false
});
console.log(`Offer ${offerId} created: ${txHash}`);

// Create dynamic offer with expiration
const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

const result = await client.makeOffer({
  depositToken: "0xRWA...",
  depositAmount: 10,
  withdrawToken: "0xUSDC...",
  withdrawAmount: 1000,
  isDynamic: true,
  expiresAt: expiresAt
});
```

---

### cancelOffer()

Cancel an existing offer on-chain.

```typescript
async cancelOffer(offerId: string): Promise<string>
```

**Parameters**:

| Parameter | Type     | Required | Description                                |
| --------- | -------- | -------- | ------------------------------------------ |
| `offerId` | `string` | ✅       | Offer ID to cancel (hex or decimal string) |

**Returns**: `Promise<string>`

Transaction hash (0x...)

**Throws**:

- `OfferNotFoundError`: If offer doesn't exist
- `UnauthorizedError`: If caller is not the maker
- `Web3Exception`: If blockchain operation fails

**Example**:

```typescript
const txHash = await client.cancelOffer("12345");
console.log(`Offer cancelled: ${txHash}`);
```

---

### getOfferDetails()

Get on-chain details for an offer.

```typescript
async getOfferDetails(offerId: string): Promise<{
  maker: string;
  depositToken: string;
  depositAmount: bigint;
  withdrawToken: string;
  withdrawAmount: bigint;
  isActive: boolean;
  isDynamic: boolean;
  expiresAt: number;
}>
```

**Parameters**:

| Parameter | Type     | Required | Description                               |
| --------- | -------- | -------- | ----------------------------------------- |
| `offerId` | `string` | ✅       | Offer ID to query (hex or decimal string) |

**Returns**: `Promise<object>`

Object with offer details:

- `maker`: Maker address
- `depositToken`: Deposit token address
- `depositAmount`: Deposit amount (in wei)
- `withdrawToken`: Withdrawal token address
- `withdrawAmount`: Withdrawal amount (in wei)
- `isActive`: Whether offer is active
- `isDynamic`: Whether offer uses dynamic pricing
- `expiresAt`: Expiration timestamp

**Throws**:

- `OfferNotFoundError`: If offer doesn't exist
- `MarketMakerWeb3Exception`: If query fails

**Example**:

```typescript
const details = await client.getOfferDetails("12345");
console.log(`Maker: ${details.maker}`);
console.log(`Active: ${details.isActive}`);
console.log(`Dynamic: ${details.isDynamic}`);
```

---

## Data Models

### Offer

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Represents a complete Market Maker offer from RPQ API.

**Fields**:

| Field                      | Type          | Description                                 |
| -------------------------- | ------------- | ------------------------------------------- |
| `id`                       | `string`      | Unique offer identifier                     |
| `maker`                    | `string`      | Wallet address of offer creator             |
| `amountIn`                 | `string`      | Amount of deposit asset (smallest units)    |
| `amountOut`                | `string`      | Amount of withdrawal asset (smallest units) |
| `availableAmount`          | `string`      | Available amount for partial fills          |
| `depositAsset`             | `Asset`       | Asset being deposited                       |
| `withdrawalAsset`          | `Asset`       | Asset being withdrawn                       |
| `offerType`                | `OfferType`   | `PartialOffer` or `BlockOffer`              |
| `offerStatus`              | `OfferStatus` | Current status                              |
| `offerPrice`               | `OfferPrice`  | Pricing information                         |
| `isAuth`                   | `boolean`     | Whether requires authorization              |
| `timelockPeriod`           | `string`      | Timelock period in seconds                  |
| `expiryTimestamp`          | `string`      | Expiration timestamp                        |
| `terms`                    | `any`         | Offer terms (optional)                      |
| `commsLink`                | `string`      | Communication link (optional)               |
| `authorizationAddresses`   | `string[]`    | Authorized addresses (optional)             |
| `depositToWithdrawalRate`  | `string`      | Exchange rate (optional)                    |

---

### SelectedOffer

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Represents a selected offer in best offers response.

**Fields**:

| Field                           | Type          | Description                                 |
| ------------------------------- | ------------- | ------------------------------------------- |
| `id`                            | `string`      | Offer ID                                    |
| `withdrawalAmountPaid`          | `string`      | Amount paid in withdrawal asset (wei)       |
| `withdrawalAmountPaidDecimals`  | `string`      | Decimals for withdrawal token               |
| `offerType`                     | `OfferType`   | `PartialOffer` or `BlockOffer`              |
| `maker`                         | `string`      | Maker address                               |
| `pricePerUnit`                  | `string`      | Price per unit (wei)                        |
| `pricingType`                   | `PricingType` | `FixedPricing` or `DynamicPricing`          |
| `depositToWithdrawalRate`       | `string`      | Exchange rate for dynamic offers (optional) |

---

### BestOffersResponse

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Response from best offers endpoint.

**Fields**:

| Field     | Type               | Description                |
| --------- | ------------------ | -------------------------- |
| `success` | `boolean`          | Whether API call succeeded |
| `result`  | `BestOffersResult` | Best offers result         |

**BestOffersResult Fields**:

| Field                        | Type              | Description                        |
| ---------------------------- | ----------------- | ---------------------------------- |
| `success`                    | `boolean`         | Whether sufficient liquidity found |
| `targetAmount`               | `string`          | Target amount requested            |
| `totalWithdrawalAmountPaid`  | `string`          | Total amount to be paid            |
| `selectedOffers`             | `SelectedOffer[]` | Selected offers                    |
| `mode`                       | `string`          | `"buy"` or `"sell"`                |

---

### Quote

**Location**: `packages/shared/src/models.ts`

Normalized quote format used across all SDKs.

**Fields**:

| Field              | Type     | Description         |
| ------------------ | -------- | ------------------- |
| `sellTokenAddress` | `string` | Token being sold    |
| `sellAmount`       | `number` | Amount being sold   |
| `buyTokenAddress`  | `string` | Token being bought  |
| `buyAmount`        | `number` | Amount being bought |
| `rate`             | `number` | Exchange rate       |
| `source`           | `string` | Platform source     |
| `timestamp`        | `Date`   | Quote timestamp     |

---

### QuoteResponse

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Raw response from RPQ quote endpoint.

**Fields**:

| Field              | Type      | Description                            |
| ------------------ | --------- | -------------------------------------- |
| `success`          | `boolean` | Whether sufficient liquidity available |
| `buyAssetAddress`  | `string`  | Address of asset to buy                |
| `sellAssetAddress` | `string`  | Address of asset to sell               |
| `averagePrice`     | `string`  | Average price per unit                 |
| `sellAmount`       | `string`  | Amount to sell (optional)              |
| `buyAmount`        | `string`  | Amount to buy (optional)               |

---

### TradeResult

**Location**: `packages/shared/src/models.ts`

Normalized trade result format used across all SDKs.

**Fields**:

| Field              | Type      | Description                 |
| ------------------ | --------- | --------------------------- |
| `txHash`           | `string`  | Blockchain transaction hash |
| `orderId`          | `string`  | Platform order/offer ID     |
| `sellTokenAddress` | `string`  | Token sold                  |
| `sellAmount`       | `number`  | Amount sold                 |
| `buyTokenAddress`  | `string`  | Token bought                |
| `buyAmount`        | `number`  | Amount bought               |
| `rate`             | `number`  | Exchange rate               |
| `source`           | `string`  | Platform (`"market_maker"`) |
| `timestamp`        | `Date`    | Trade timestamp             |
| `network`          | `Network` | Blockchain network          |

---

### Asset

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Represents an asset in an offer.

**Fields**:

| Field           | Type        | Description                    |
| --------------- | ----------- | ------------------------------ |
| `id`            | `string`    | Asset ID                       |
| `name`          | `string`    | Asset name                     |
| `symbol`        | `string`    | Asset symbol                   |
| `address`       | `string`    | Contract address               |
| `decimals`      | `number`    | Token decimals (optional)      |
| `tokenId`       | `number`    | Token ID for NFTs (optional)   |
| `assetType`     | `AssetType` | Type of asset                  |
| `kya`           | `string`    | KYA identifier (optional)      |
| `tokenStandard` | `string`    | Token standard (e.g., "ERC20") |
| `tradedVolume`  | `string`    | Total traded volume            |

---

### OfferPrice

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Represents offer pricing information.

**Fields**:

| Field                    | Type             | Description                            |
| ------------------------ | ---------------- | -------------------------------------- |
| `id`                     | `string`         | Price ID                               |
| `pricingType`            | `PricingType`    | `FixedPricing` or `DynamicPricing`     |
| `percentage`             | `number`         | Percentage adjustment (optional)       |
| `percentageType`         | `PercentageType` | `Plus` or `Minus` (optional)           |
| `unitPrice`              | `string`         | Fixed unit price (optional)            |
| `depositAssetPrice`      | `object`         | Deposit asset price feed (optional)    |
| `withdrawalAssetPrice`   | `object`         | Withdrawal asset price feed (optional) |

---

### PriceFeedsResponse

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

Response from price feeds endpoint.

**Fields**:

| Field        | Type                       | Description                                           |
| ------------ | -------------------------- | ----------------------------------------------------- |
| `success`    | `boolean`                  | Whether API call succeeded                            |
| `priceFeeds` | `Record<string, string>`   | Mapping of contract addresses to price feed addresses |

---

## Enumerations

### OfferType

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

```typescript
enum OfferType {
  PARTIAL_OFFER = "PartialOffer",  // Can be taken in parts
  BLOCK_OFFER = "BlockOffer"       // Must be taken all at once
}
```

---

### OfferStatus

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

```typescript
enum OfferStatus {
  NOT_TAKEN = "NotTaken",              // Not taken yet
  PARTIALLY_TAKEN = "PartiallyTaken",  // Partially filled
  TAKEN = "Taken"                      // Fully taken
}
```

---

### PricingType

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

```typescript
enum PricingType {
  FIXED_PRICING = "FixedPricing",      // Fixed price
  DYNAMIC_PRICING = "DynamicPricing"   // Uses price feeds
}
```

---

### PercentageType

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

```typescript
enum PercentageType {
  PLUS = "Plus",    // Add percentage
  MINUS = "Minus"   // Subtract percentage
}
```

---

### AssetType

**Location**: `packages/market-maker-sdk/src/rpq-service/models.ts`

```typescript
enum AssetType {
  SECURITY = "Security",
  NO_TYPE = "NoType",
  GOLD = "Gold"
}
```

---

## Exceptions

### Exception Hierarchy

```
RPQServiceException (base)
├── NoOffersAvailableException
├── InvalidTokenPairException
├── QuoteUnavailableException
└── PriceFeedNotFoundException

MarketMakerWeb3Exception (base)
├── OfferNotFoundError
├── OfferInactiveError
├── InsufficientOfferBalanceError
├── OfferExpiredError
└── UnauthorizedError
```

---

### RPQServiceException

**Location**: `packages/market-maker-sdk/src/rpq-service/exceptions.ts`

Base exception for all RPQ Service-related errors.

---

### NoOffersAvailableException

Raised when no offers are available for the requested token pair.

**Example**:

```typescript
try {
  const offers = await client.rpqClient.getOffers({
    buyAssetAddress: "0x...",
    sellAssetAddress: "0x..."
  });
} catch (error) {
  if (error instanceof NoOffersAvailableException) {
    console.log(`No offers available: ${error.message}`);
    // Try creating your own offer
  }
}
```

---

### QuoteUnavailableException

Raised when quote cannot be generated (insufficient liquidity, invalid parameters, etc.).

---

### InvalidTokenPairException

Raised when token pair is not supported.

---

### PriceFeedNotFoundException

Raised when price feed is not found for a token.

---

### MarketMakerWeb3Exception

**Location**: `packages/market-maker-sdk/src/market-maker-web3/exceptions.ts`

Base exception for all Market Maker Web3-related errors.

---

### OfferNotFoundError

Raised when offer doesn't exist on-chain.

**Possible Causes**:

- Invalid offer ID
- Offer was already taken
- Offer was cancelled

---

### OfferInactiveError

Raised when trying to take an inactive offer.

**Possible Causes**:

- Offer was cancelled
- Offer was fully taken
- Offer is paused

---

### InsufficientOfferBalanceError

Raised when offer maker has insufficient token balance.

---

### OfferExpiredError

Raised when offer has expired.

---

### UnauthorizedError

Raised when caller is not authorized for the operation.

**Possible Causes**:

- Trying to cancel someone else's offer
- Trying to take an authorized-only offer without permission

---

## Supported Networks

Market Maker SDK works on networks with deployed contracts:

| Network  | Chain ID | Supported | Contract Loaded Dynamically |
| -------- | -------- | --------- | --------------------------- |
| Polygon  | 137      | ✅        | Yes                         |
| Ethereum | 1        | ✅        | Yes                         |
| Arbitrum | 42161    | ✅        | Yes                         |
| Base     | 8453     | ✅        | Yes                         |
| Optimism | 10       | ✅        | Yes                         |

---

## Contract Addresses

Market Maker Manager contract addresses are loaded dynamically from remote config based on environment (dev/prod) and network.

**Environment Control**:

```bash
# Development mode (default)
export SWARM_COLLECTION_MODE=dev

# Production mode
export SWARM_COLLECTION_MODE=prod
```

Contract addresses are fetched automatically when the `MarketMakerWeb3Client` is first used. If a contract is not deployed on the specified network, a `MarketMakerWeb3Exception` will be thrown.

---

**Happy Trading! 🚀**

_Last Updated: December 29, 2024_
