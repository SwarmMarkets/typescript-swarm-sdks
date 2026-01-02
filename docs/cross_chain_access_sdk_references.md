# Cross-Chain Access SDK API Documentation

## Table of Contents

### Core Classes

- [CrossChainAccessClient](#crosschainaccessclient) - Main SDK entry point
  - [Constructor](#constructor)
  - [initialize()](#initialize)
  - [authenticate()](#authenticate)
  - [checkTradingAvailability()](#checktradingavailability)
  - [getQuote()](#getquote)
  - [buy()](#buy)
  - [sell()](#sell)
  - [close()](#close)
- [CrossChainAccessAPIClient](#crosschainaccessapiclient) - HTTP API client
  - [Constructor](#constructor-1)
  - [getAccountStatus()](#getaccountstatus)
  - [getAccountFunds()](#getaccountfunds)
  - [getAssetQuote()](#getassetquote)
  - [createOrder()](#createorder)
- [MarketHours](#markethours) - Market timing utilities
  - [Market Schedule](#market-schedule)
  - [isMarketOpen()](#ismarketopen)
  - [timeUntilOpen()](#timeuntilopen)
  - [timeUntilClose()](#timeuntilclose)
  - [getMarketStatus()](#getmarketstatus)

### Data Models

- [Quote](#quote)
- [TradeResult](#traderesult)
- [OrderSide](#orderside)
- [AccountStatus](#accountstatus)
- [AccountFunds](#accountfunds)
- [CrossChainAccessQuote](#crosschainaccessquote)
- [CrossChainAccessOrderResponse](#crosschainaccessorderresponse)

### Exceptions

- [Exception Hierarchy](#exception-hierarchy)
- [CrossChainAccessException](#crosschainaccessexception)
- [MarketClosedException](#marketclosedexception)
- [AccountBlockedException](#accountblockedexception)
- [InsufficientFundsException](#insufficientfundsexception)
- [QuoteUnavailableException](#quoteunavailableexception)
- [OrderFailedException](#orderfailedexception)
- [InvalidSymbolException](#invalidsymbolexception)

### Additional Resources

- [Supported Networks](#supported-networks)
- [Rate Limits & Performance](#rate-limits--performance)

---

## CrossChainAccessClient

**Location**: `@swarm/cross-chain-access-sdk`

The main entry point for Cross-Chain Access stock trading operations. Orchestrates authentication, market validation, on-chain transfers, and order submission.

### Constructor

```typescript
new CrossChainAccessClient(config: {
  network: Network;
  privateKey: string;
  userEmail?: string;
  rpcUrl?: string;
  isDev?: boolean;
})
```

**Parameters**:

| Parameter    | Type      | Required | Description                                        |
| ------------ | --------- | -------- | -------------------------------------------------- |
| `network`    | `Network` | ✅       | Blockchain network (e.g., `Network.POLYGON`)       |
| `privateKey` | `string`  | ✅       | Wallet private key (with `0x` prefix)              |
| `userEmail`  | `string`  | ❌       | User email for notifications                       |
| `rpcUrl`     | `string`  | ❌       | Custom RPC endpoint (uses default if not provided) |
| `isDev`      | `boolean` | ❌       | Use development endpoints (default: `false`)       |

**Properties**:

- `network`: Active blockchain network
- `isDev`: Whether using dev environment
- `crossChainAccessApi`: Instance of `CrossChainAccessAPIClient`
- `web3Helper`: Instance of `Web3Helper` for blockchain operations
- `auth`: Instance of `SwarmAuth` for authentication
- `usdcAddress`: USDC token address for the network
- `topupAddress`: Escrow address for token transfers

**Example**:

```typescript
import { CrossChainAccessClient, Network } from "@swarm/cross-chain-access-sdk";

// Initialize client
const client = new CrossChainAccessClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  userEmail: "user@example.com"
});

await client.initialize();

try {
  const result = await client.buy({
    rwaTokenAddress: "0xRWA...",
    rwaSymbol: "AAPL",
    rwaAmount: 10,
    userEmail: "user@example.com"
  });
  console.log(`Trade complete: ${result.txHash}`);
} finally {
  await client.close();
}
```

**Throws**:

- `Error`: If USDC not available on specified network

---

### initialize()

Initialize the client by authenticating with the Swarm platform.

```typescript
async initialize(): Promise<void>
```

**Returns**: `Promise<void>`

**Throws**:

- `AuthenticationError`: If authentication fails

**Description**:

Uses the wallet's private key to sign an authentication message and obtains an access token. The token is automatically set for subsequent API calls. Must be called before using any other methods.

**Example**:

```typescript
const client = new CrossChainAccessClient({
  network: Network.POLYGON,
  privateKey: "0x..."
});

await client.initialize();
// Now ready to make authenticated API calls
```

---

### authenticate()

Authenticate with the Swarm platform using wallet signature (called automatically by initialize()).

```typescript
async authenticate(): Promise<void>
```

**Returns**: `Promise<void>`

**Throws**:

- `AuthenticationError`: If authentication fails

**Description**:

Uses the wallet's private key to sign an authentication message and obtains an access token. The token is automatically set for subsequent API calls.

**Example**:

```typescript
const client = new CrossChainAccessClient({
  network: Network.POLYGON,
  privateKey: "0x..."
});

await client.authenticate();
// Now ready to make authenticated API calls
```

---

### checkTradingAvailability()

Check if trading is currently available by validating market hours and account status.

```typescript
async checkTradingAvailability(): Promise<{ isAvailable: boolean; message: string }>
```

**Returns**: `Promise<{ isAvailable: boolean; message: string }>`

- `isAvailable`: Whether trading is available
- `message`: Human-readable status message

**Checks**:

1. Market hours (14:30-21:00 UTC, Monday-Friday)
2. Account not blocked
3. Trading not suspended
4. Transfers not blocked
5. Market is open

**Example**:

```typescript
const { isAvailable, message } = await client.checkTradingAvailability();
if (!isAvailable) {
  console.log(`Cannot trade: ${message}`);
} else {
  console.log(`Ready to trade: ${message}`);
}
```

**Possible Messages**:

- `"Trading is available"` - All checks passed
- `"Market is closed. Opens in 5h 30m"` - Outside market hours
- `"Trading not available: account blocked"` - Account issues
- `"Trading not available: trading blocked, transfers blocked"` - Multiple issues

---

### getQuote()

Get real-time quote for a trading symbol.

```typescript
async getQuote(rwaSymbol: string): Promise<Quote>
```

**Parameters**:

| Parameter   | Type     | Required | Description                     |
| ----------- | -------- | -------- | ------------------------------- |
| `rwaSymbol` | `string` | ✅       | Trading symbol (e.g., `"AAPL"`) |

**Returns**: `Promise<Quote>`

Returns a normalized `Quote` object with the following fields:

- `sellTokenAddress`: USDC address
- `sellAmount`: 1
- `buyTokenAddress`: Symbol as placeholder
- `buyAmount`: Calculated from ask price
- `rate`: Ask price per unit
- `source`: `"cross_chain_access"`
- `timestamp`: Current time

**Throws**:

- `QuoteUnavailableException`: If quote cannot be retrieved
- `InvalidSymbolException`: If symbol is invalid

**Example**:

```typescript
const quote = await client.getQuote("AAPL");
console.log(`Price: $${quote.rate}`);
console.log(`1 USDC buys: ${quote.buyAmount} shares`);
```

---

### buy()

Buy RWA tokens with USDC via Cross-Chain Access stock market.

```typescript
async buy(params: {
  rwaTokenAddress: string;
  rwaSymbol: string;
  userEmail: string;
  rwaAmount?: number;
  usdcAmount?: number;
  targetChainId?: number;
}): Promise<TradeResult>
```

**Parameters**:

| Parameter         | Type     | Required | Description                                                                                           |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `rwaTokenAddress` | `string` | ✅       | RWA token contract address                                                                            |
| `rwaSymbol`       | `string` | ✅       | Trading symbol (e.g., `"AAPL"`)                                                                       |
| `userEmail`       | `string` | ✅       | User email for notifications                                                                          |
| `rwaAmount`       | `number` | ⚠️       | Amount of RWA tokens to buy (either this or `usdcAmount`)                                             |
| `usdcAmount`      | `number` | ⚠️       | Amount of USDC to spend (either this or `rwaAmount`)                                                  |
| `targetChainId`   | `number` | ❌       | Target network ID where assets will be received (defaults to source network). Can be **ANY network**. |

**⚠️ Important**: Provide **either** `rwaAmount` **OR** `usdcAmount`, not both.

**🌐 Cross-Chain Trading**: Use `targetChainId` to receive assets on **any blockchain network**, not just the 4 source networks (Polygon, Ethereum, BSC, Base). For example, send USDC from Polygon and receive AAPL tokens on Arbitrum.

**Returns**: `Promise<TradeResult>`

Contains:

- `txHash`: Blockchain transaction hash
- `orderId`: Cross-Chain Access order ID
- `sellTokenAddress`: USDC address
- `sellAmount`: USDC spent
- `buyTokenAddress`: RWA token address
- `buyAmount`: RWA tokens received
- `rate`: Locked price
- `source`: `"cross_chain_access"`
- `timestamp`: Trade execution time
- `network`: Network used

**Trade Flow**:

1. ✅ Check market hours and account status
2. 📈 Get real-time quote
3. 🧮 Calculate amounts with 1% slippage protection
4. 💰 Validate buying power
5. 🔗 Transfer USDC to escrow address
6. 📋 Submit order to Cross-Chain Access API

**Throws**:

| Exception                    | Condition                        |
| ---------------------------- | -------------------------------- |
| `Error`                      | Both or neither amounts provided |
| `MarketClosedException`      | Market is closed                 |
| `AccountBlockedException`    | Account is blocked               |
| `InsufficientFundsException` | Insufficient buying power        |
| `OrderFailedException`       | Order submission failed          |

**Example**:

```typescript
// Buy 10 AAPL shares (same network)
const result = await client.buy({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 10,
  userEmail: "user@example.com"
});
console.log(`Bought ${result.buyAmount} AAPL for $${result.sellAmount} USDC`);
console.log(`TX Hash: ${result.txHash}`);
console.log(`Order ID: ${result.orderId}`);

// Alternatively, specify USDC amount
const result2 = await client.buy({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  usdcAmount: 1000,  // Spend $1000 USDC
  userEmail: "user@example.com"
});

// Cross-chain: Send USDC from Polygon, receive AAPL on Arbitrum
const result3 = await client.buy({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 10,
  userEmail: "user@example.com",
  targetChainId: 42161  // Receive on Arbitrum
});
```

---

### sell()

Sell RWA tokens for USDC via Cross-Chain Access stock market.

```typescript
async sell(params: {
  rwaTokenAddress: string;
  rwaSymbol: string;
  userEmail: string;
  rwaAmount?: number;
  usdcAmount?: number;
  targetChainId?: number;
}): Promise<TradeResult>
```

**Parameters**:

| Parameter         | Type     | Required | Description                                                                                         |
| ----------------- | -------- | -------- | --------------------------------------------------------------------------------------------------- |
| `rwaTokenAddress` | `string` | ✅       | RWA token contract address                                                                          |
| `rwaSymbol`       | `string` | ✅       | Trading symbol (e.g., `"AAPL"`)                                                                     |
| `userEmail`       | `string` | ✅       | User email for notifications                                                                        |
| `rwaAmount`       | `number` | ⚠️       | Amount of RWA tokens to sell (either this or `usdcAmount`)                                          |
| `usdcAmount`      | `number` | ⚠️       | Amount of USDC to receive (either this or `rwaAmount`)                                              |
| `targetChainId`   | `number` | ❌       | Target network ID where USDC will be received (defaults to source network). Can be **ANY network**. |

**⚠️ Important**: Provide **either** `rwaAmount` **OR** `usdcAmount`, not both.

**🌐 Cross-Chain Trading**: Use `targetChainId` to receive USDC on **any blockchain network**, not just the 4 source networks (Polygon, Ethereum, BSC, Base). For example, sell AAPL tokens from Polygon and receive USDC on Optimism.

**Returns**: `Promise<TradeResult>`

Contains:

- `txHash`: Blockchain transaction hash
- `orderId`: Cross-Chain Access order ID
- `sellTokenAddress`: RWA token address
- `sellAmount`: RWA tokens sold
- `buyTokenAddress`: USDC address
- `buyAmount`: USDC received
- `rate`: Locked price
- `source`: `"cross_chain_access"`
- `timestamp`: Trade execution time
- `network`: Network used

**Trade Flow**:

1. ✅ Check market hours and account status
2. 📈 Get real-time quote
3. 🧮 Calculate amounts with 1% slippage protection
4. 🏦 Validate RWA token balance
5. 🔗 Transfer RWA tokens to escrow address
6. 📋 Submit order to Cross-Chain Access API

**Throws**:

| Exception                    | Condition                        |
| ---------------------------- | -------------------------------- |
| `Error`                      | Both or neither amounts provided |
| `MarketClosedException`      | Market is closed                 |
| `AccountBlockedException`    | Account is blocked               |
| `InsufficientFundsException` | Insufficient RWA balance         |
| `OrderFailedException`       | Order submission failed          |

**Example**:

```typescript
// Sell 5 AAPL shares (same network)
const result = await client.sell({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 5,
  userEmail: "user@example.com"
});
console.log(`Sold ${result.sellAmount} AAPL for $${result.buyAmount} USDC`);
console.log(`TX Hash: ${result.txHash}`);
console.log(`Order ID: ${result.orderId}`);

// Alternatively, target USDC amount
const result2 = await client.sell({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  usdcAmount: 500,  // Receive $500 USDC
  userEmail: "user@example.com"
});

// Cross-chain: Sell AAPL from Polygon, receive USDC on Optimism
const result3 = await client.sell({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 5,
  userEmail: "user@example.com",
  targetChainId: 10  // Receive USDC on Optimism
});
```

---

### close()

Close all clients and cleanup resources.

```typescript
async close(): Promise<void>
```

**Returns**: `Promise<void>`

**Description**:

Properly closes the HTTP client and cleans up resources. Should always be called when done using the client.

**Example**:

```typescript
const client = new CrossChainAccessClient({...});
await client.initialize();

try {
  const result = await client.buy({...});
} finally {
  await client.close();  // Always cleanup
}
```

---

## CrossChainAccessAPIClient

**Location**: `@swarm/cross-chain-access-sdk`

Low-level HTTP client for interacting with Cross-Chain Access Stock Trading API endpoints.

> ⚠️ **Note**: This is a lower-level API client. Most users should use `CrossChainAccessClient.buy()` and `CrossChainAccessClient.sell()` methods instead, which provide a simpler interface with automatic cross-chain support.

### Constructor

```typescript
new CrossChainAccessAPIClient(isDev?: boolean)
```

**Parameters**:

| Parameter | Type      | Required | Description                                     |
| --------- | --------- | -------- | ----------------------------------------------- |
| `isDev`   | `boolean` | ❌       | Use development API endpoint (default: `false`) |

**Endpoints**:

- **Development**: `https://stock-trading-api.dev.swarm.com/stock-trading`
- **Production**: `https://stock-trading-api.app.swarm.com/stock-trading`

**Example**:

```typescript
import { CrossChainAccessAPIClient } from "@swarm/cross-chain-access-sdk";

const client = new CrossChainAccessAPIClient(true);
client.setAuthToken("your_token");
const quote = await client.getAssetQuote("AAPL");
```

---

### getAccountStatus()

Get trading account status and permissions.

```typescript
async getAccountStatus(): Promise<AccountStatus>
```

**Returns**: `Promise<AccountStatus>`

Fields:

- `accountBlocked`: Whether account is blocked
- `tradingBlocked`: Whether trading is blocked
- `transfersBlocked`: Whether transfers are blocked
- `tradeSuspendedByUser`: Whether user suspended trading
- `marketOpen`: Whether market is currently open
- `accountStatus`: Status string (e.g., `"ACTIVE"`)

**Throws**:

- `APIException(401)`: If authentication token missing

**Example**:

```typescript
const status = await client.getAccountStatus();
if (status.isTradingAllowed()) {
  console.log("All systems go!");
} else {
  console.log(`Status: ${status.accountStatus}`);
}
```

---

### getAccountFunds()

Get trading account funds and buying power.

```typescript
async getAccountFunds(): Promise<AccountFunds>
```

**Returns**: `Promise<AccountFunds>`

Fields:

- `cash`: Available cash
- `buyingPower`: Total buying power
- `dayTradingBuyingPower`: Day trading buying power
- `effectiveBuyingPower`: Effective buying power
- `nonMarginBuyingPower`: Non-margin buying power
- `regTBuyingPower`: Regulation T buying power

**Throws**:

- `APIException(401)`: If authentication token missing

**Example**:

```typescript
const funds = await client.getAccountFunds();
console.log(`Buying power: $${funds.buyingPower}`);
if (funds.hasSufficientFunds(1000)) {
  console.log("Can afford $1000 trade");
}
```

---

### getAssetQuote()

Get real-time quote for a trading symbol.

```typescript
async getAssetQuote(symbol: string): Promise<CrossChainAccessQuote>
```

**Parameters**:

| Parameter | Type     | Required | Description                     |
| --------- | -------- | -------- | ------------------------------- |
| `symbol`  | `string` | ✅       | Trading symbol (e.g., `"AAPL"`) |

**Returns**: `Promise<CrossChainAccessQuote>`

Fields:

- `bidPrice`: Best bid price
- `askPrice`: Best ask price
- `bidSize`: Size at bid
- `askSize`: Size at ask
- `timestamp`: Quote timestamp
- `bidExchange`: Exchange for bid
- `askExchange`: Exchange for ask

**Throws**:

| Exception                   | Status Code | Condition              |
| --------------------------- | ----------- | ---------------------- |
| `InvalidSymbolException`    | 404         | Invalid trading symbol |
| `QuoteUnavailableException` | 400         | Quote unavailable      |
| `APIException`              | Other       | Request failed         |

**Example**:

```typescript
const quote = await client.getAssetQuote("AAPL");
console.log(`Bid: $${quote.bidPrice}, Ask: $${quote.askPrice}`);
console.log(`Spread: $${quote.askPrice - quote.bidPrice}`);

// Get price for specific side
const buyPrice = quote.getPriceForSide(OrderSide.BUY);  // Returns ask
const sellPrice = quote.getPriceForSide(OrderSide.SELL);  // Returns bid
```

---

### createOrder()

Create a trading order on Cross-Chain Access after on-chain transfer.

> ⚠️ **Note**: This is an internal method used by `CrossChainAccessClient`. Most users should use `CrossChainAccessClient.buy()` or `CrossChainAccessClient.sell()` instead, which handle the entire trade flow including transfers and order creation.

```typescript
async createOrder(params: {
  wallet: string;
  txHash: string;
  assetAddress: string;
  assetSymbol: string;
  side: OrderSide;
  price: number;
  qty: number;
  notional: number;
  chainId: number;
  userEmail: string;
  targetChainId?: number;
}): Promise<CrossChainAccessOrderResponse>
```

**Parameters**:

| Parameter       | Type        | Required | Description                                                                   |
| --------------- | ----------- | -------- | ----------------------------------------------------------------------------- |
| `wallet`        | `string`    | ✅       | User wallet address                                                           |
| `txHash`        | `string`    | ✅       | Blockchain transaction hash                                                   |
| `assetAddress`  | `string`    | ✅       | RWA token contract address                                                    |
| `assetSymbol`   | `string`    | ✅       | Trading symbol (e.g., `"AAPL"`)                                               |
| `side`          | `OrderSide` | ✅       | `OrderSide.BUY` or `OrderSide.SELL`                                           |
| `price`         | `number`    | ✅       | Locked price per unit                                                         |
| `qty`           | `number`    | ✅       | RWA quantity                                                                  |
| `notional`      | `number`    | ✅       | USDC amount                                                                   |
| `chainId`       | `number`    | ✅       | Source blockchain network ID (must be: 137, 1, 56, or 8453)                   |
| `userEmail`     | `string`    | ✅       | User email for notifications                                                  |
| `targetChainId` | `number`    | ❌       | Target blockchain network ID - can be **ANY network** (defaults to chainId). |

**Returns**: `Promise<CrossChainAccessOrderResponse>`

Fields:

- `orderId`: Unique order identifier
- `symbol`: Trading symbol
- `side`: Order side (`"buy"` or `"sell"`)
- `quantity`: Order quantity
- `filledQty`: Filled quantity
- `status`: Order status (e.g., `"pending"`, `"filled"`)
- `createdAt`: Creation timestamp
- `filledAt`: Fill timestamp (if filled)

**Throws**:

| Exception              | Condition                    |
| ---------------------- | ---------------------------- |
| `APIException(401)`    | Authentication token missing |
| `OrderFailedException` | Order creation failed        |

**Example**:

```typescript
// With explicit targetChainId (cross-chain)
const order = await client.createOrder({
  wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  txHash: "0xabc123...",
  assetAddress: "0x1234...",
  assetSymbol: "AAPL",
  side: OrderSide.BUY,
  price: 150.50,
  qty: 10,
  notional: 1505,
  chainId: 137,
  userEmail: "user@example.com",
  targetChainId: 56  // Optional: receive assets on different chain
});

// Without targetChainId (same chain)
const order2 = await client.createOrder({
  wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  txHash: "0xabc123...",
  assetAddress: "0x1234...",
  assetSymbol: "AAPL",
  side: OrderSide.BUY,
  price: 150.50,
  qty: 10,
  notional: 1505,
  chainId: 137,
  userEmail: "user@example.com"  // targetChainId defaults to 137
});

console.log(`Order ${order.orderId} created with status: ${order.status}`);
```

---

## MarketHours

**Location**: `@swarm/cross-chain-access-sdk`

Static utility class for checking US stock market hours.

### Market Schedule

- **Open**: 14:30 UTC (9:30 AM EST)
- **Close**: 21:00 UTC (4:00 PM EST)
- **Days**: Monday - Friday (weekdays only)

---

### isMarketOpen()

Check if market is currently open.

```typescript
static isMarketOpen(dt?: Date): boolean
```

**Parameters**:

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `dt`      | `Date` | ❌       | Datetime to check (defaults to current UTC time) |

**Returns**: `boolean`

`true` if market is open (weekday between 14:30-21:00 UTC), `false` otherwise.

**Example**:

```typescript
import { MarketHours } from "@swarm/cross-chain-access-sdk";

// Check current time
if (MarketHours.isMarketOpen()) {
  console.log("Market is open now!");
}

// Check specific time
const dt = new Date("2025-11-03T15:00:00Z");  // Monday 15:00 UTC
if (MarketHours.isMarketOpen(dt)) {
  console.log("Market was open at that time");
}
```

---

### timeUntilOpen()

Calculate time until market opens.

```typescript
static timeUntilOpen(dt?: Date): number
```

**Parameters**:

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `dt`      | `Date` | ❌       | Datetime to check (defaults to current UTC time) |

**Returns**: `number`

Time until market opens in milliseconds. Returns `0` if market is already open.

**Example**:

```typescript
const timeLeft = MarketHours.timeUntilOpen();
const hours = timeLeft / (1000 * 60 * 60);
console.log(`Market opens in ${hours.toFixed(1)} hours`);
```

---

### timeUntilClose()

Calculate time until market closes.

```typescript
static timeUntilClose(dt?: Date): number
```

**Parameters**:

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `dt`      | `Date` | ❌       | Datetime to check (defaults to current UTC time) |

**Returns**: `number`

Time until market closes in milliseconds. Returns `0` if market is closed.

**Example**:

```typescript
const timeLeft = MarketHours.timeUntilClose();
const hours = timeLeft / (1000 * 60 * 60);
console.log(`Market closes in ${hours.toFixed(1)} hours`);
```

---

### getMarketStatus()

Get market status with human-readable message.

```typescript
static getMarketStatus(dt?: Date): { isOpen: boolean; message: string }
```

**Parameters**:

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `dt`      | `Date` | ❌       | Datetime to check (defaults to current UTC time) |

**Returns**: `{ isOpen: boolean; message: string }`

- `isOpen`: Whether market is open
- `message`: Human-readable status message

**Example**:

```typescript
const { isOpen, message } = MarketHours.getMarketStatus();
console.log(message);
// Output: "Market is open. Closes in 3h 45m"
// Or: "Market is closed. Opens in 12h 30m"
```

---

## Data Models

### Quote

**Location**: `@swarm/shared`

Normalized quote format used across all SDKs.

**Fields**:

| Field              | Type     | Description                       |
| ------------------ | -------- | --------------------------------- |
| `sellTokenAddress` | `string` | Token being sold                  |
| `sellAmount`       | `number` | Amount being sold                 |
| `buyTokenAddress`  | `string` | Token being bought                |
| `buyAmount`        | `number` | Amount being bought               |
| `rate`             | `number` | Exchange rate                     |
| `source`           | `string` | Platform (`"cross_chain_access"`) |
| `timestamp`        | `Date`   | Quote timestamp                   |

---

### TradeResult

**Location**: `@swarm/shared`

Normalized trade result format used across all SDKs.

**Fields**:

| Field              | Type      | Description                       |
| ------------------ | --------- | --------------------------------- |
| `txHash`           | `string`  | Blockchain transaction hash       |
| `orderId`          | `string`  | Platform order ID                 |
| `sellTokenAddress` | `string`  | Token sold                        |
| `sellAmount`       | `number`  | Amount sold                       |
| `buyTokenAddress`  | `string`  | Token bought                      |
| `buyAmount`        | `number`  | Amount bought                     |
| `rate`             | `number`  | Exchange rate                     |
| `source`           | `string`  | Platform (`"cross_chain_access"`) |
| `timestamp`        | `Date`    | Trade timestamp                   |
| `network`          | `Network` | Blockchain network                |

---

### OrderSide

**Location**: `@swarm/cross-chain-access-sdk`

Enum for trade direction.

```typescript
enum OrderSide {
  BUY = "buy",
  SELL = "sell"
}
```

---

### AccountStatus

**Location**: `@swarm/cross-chain-access-sdk`

**Fields**:

| Field                  | Type      | Description                      |
| ---------------------- | --------- | -------------------------------- |
| `accountBlocked`       | `boolean` | Account is blocked               |
| `tradingBlocked`       | `boolean` | Trading is blocked               |
| `transfersBlocked`     | `boolean` | Transfers are blocked            |
| `tradeSuspendedByUser` | `boolean` | User suspended trading           |
| `marketOpen`           | `boolean` | Market is open                   |
| `accountStatus`        | `string`  | Status string (e.g., `"ACTIVE"`) |

**Methods**:

- `isTradingAllowed(): boolean`: Returns `true` if all checks pass

---

### AccountFunds

**Location**: `@swarm/cross-chain-access-sdk`

**Fields**:

| Field                   | Type     | Description               |
| ----------------------- | -------- | ------------------------- |
| `cash`                  | `number` | Available cash            |
| `buyingPower`           | `number` | Total buying power        |
| `dayTradingBuyingPower` | `number` | Day trading buying power  |
| `effectiveBuyingPower`  | `number` | Effective buying power    |
| `nonMarginBuyingPower`  | `number` | Non-margin buying power   |
| `regTBuyingPower`       | `number` | Regulation T buying power |

**Methods**:

- `hasSufficientFunds(requiredAmount: number): boolean`: Check if buying power is sufficient

---

### CrossChainAccessQuote

**Location**: `@swarm/cross-chain-access-sdk`

**Fields**:

| Field         | Type     | Description      |
| ------------- | -------- | ---------------- |
| `bidPrice`    | `number` | Best bid price   |
| `askPrice`    | `number` | Best ask price   |
| `bidSize`     | `number` | Size at bid      |
| `askSize`     | `number` | Size at ask      |
| `timestamp`   | `Date`   | Quote timestamp  |
| `bidExchange` | `string` | Exchange for bid |
| `askExchange` | `string` | Exchange for ask |

**Methods**:

- `getPriceForSide(side: OrderSide): number`: Returns ask for BUY, bid for SELL

---

### CrossChainAccessOrderResponse

**Location**: `@swarm/cross-chain-access-sdk`

**Fields**:

| Field       | Type             | Description                      |
| ----------- | ---------------- | -------------------------------- |
| `orderId`   | `string`         | Unique order identifier          |
| `symbol`    | `string`         | Trading symbol                   |
| `side`      | `string`         | Order side (`"buy"` or `"sell"`) |
| `quantity`  | `number`         | Order quantity                   |
| `filledQty` | `number`         | Filled quantity                  |
| `status`    | `string`         | Order status                     |
| `createdAt` | `Date`           | Creation timestamp               |
| `filledAt`  | `Date | undefined` | Fill timestamp                   |

**Methods**:

- `toDict(): Record<string, any>`: Convert to dictionary

---

## Exceptions

### Exception Hierarchy

```
CrossChainAccessException (base)
├── MarketClosedException
├── AccountBlockedException
├── InsufficientFundsException
├── QuoteUnavailableException
├── OrderFailedException
└── InvalidSymbolException
```

---

### CrossChainAccessException

**Location**: `@swarm/cross-chain-access-sdk`

Base exception for all Cross-Chain Access-related errors.

---

### MarketClosedException

Raised when attempting to trade outside market hours (14:30-21:00 UTC, weekdays).

**Example**:

```typescript
try {
  const result = await client.buy({...});
} catch (error) {
  if (error instanceof MarketClosedException) {
    console.log(`Market is closed: ${error.message}`);
    const { message } = MarketHours.getMarketStatus();
    console.log(message);
  }
}
```

---

### AccountBlockedException

Raised when account is blocked from trading due to restrictions.

**Possible Causes**:

- Account blocked
- Trading blocked
- Transfers blocked
- Trade suspended by user

---

### InsufficientFundsException

Raised when account lacks sufficient funds for a trade.

**Cases**:

- **BUY**: Insufficient buying power for USDC required
- **SELL**: Insufficient RWA token balance

**Example**:

```typescript
try {
  const result = await client.buy({
    rwaSymbol: "AAPL",
    usdcAmount: 10000,  // $10,000
    ...
  });
} catch (error) {
  if (error instanceof InsufficientFundsException) {
    console.log(`Not enough funds: ${error.message}`);
    const funds = await client.crossChainAccessApi.getAccountFunds();
    console.log(`Available: $${funds.buyingPower}`);
  }
}
```

---

### QuoteUnavailableException

Raised when real-time quote cannot be retrieved.

**Possible Causes**:

- Symbol temporarily unavailable
- API error
- Network issues

---

### OrderFailedException

Raised when order submission to Cross-Chain Access API fails.

**Possible Causes**:

- API error
- Invalid order parameters
- Backend rejection

---

### InvalidSymbolException

Raised when trading symbol is invalid or not supported.

**Example**:

```typescript
try {
  const quote = await client.getQuote("INVALID");
} catch (error) {
  if (error instanceof InvalidSymbolException) {
    console.log(`Invalid symbol: ${error.message}`);
  }
}
```

---

## Supported Networks

Cross-Chain Access SDK works on networks with USDC support:

- ✅ Polygon (137)
- ✅ Ethereum (1)
- ✅ BSC (56)
- ✅ Base (8453)

USDC addresses are automatically configured per network.

### Cross-Chain Trading

🌐 **Cross-Chain Support**: You can send USDC from any of the **4 networks listed above** (Polygon, Ethereum, BSC, Base), but receive assets on **ANY other network** using the `targetChainId` parameter in `buy()` or `sell()` methods. This gives you flexibility in choosing where your assets are delivered.

**Example with buy()**:

```typescript
// Initialize client on Polygon
const client = new CrossChainAccessClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  userEmail: "user@example.com"
});

await client.initialize();

try {
  // Send USDC from Polygon, receive AAPL on Arbitrum
  const result = await client.buy({
    rwaTokenAddress: "0x1234...",
    rwaSymbol: "AAPL",
    rwaAmount: 10,
    userEmail: "user@example.com",
    targetChainId: 42161  // Receive on Arbitrum
  });
  console.log(`Bought on Arbitrum! TX: ${result.txHash}`);
} finally {
  await client.close();
}
```

**Example with sell()**:

```typescript
// Sell AAPL from Polygon, receive USDC on Optimism
const result = await client.sell({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 5,
  userEmail: "user@example.com",
  targetChainId: 10  // Receive USDC on Optimism
});
```

---

## Rate Limits & Performance

- **Market Hours**: 14:30-21:00 UTC only
- **Order Processing**: Near real-time (depends on blockchain)
- **Quote Refresh**: Real-time via API
- **Retry Logic**: 3 attempts with exponential backoff (via `BaseAPIClient`)
