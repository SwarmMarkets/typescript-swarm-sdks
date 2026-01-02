# Trading SDK API Documentation

## Table of Contents

### Core Classes

- [TradingClient](#tradingclient) - Main unified trading client
  - [Constructor](#constructor)
  - [initialize()](#initialize)
  - [getQuotes()](#getquotes)
  - [trade()](#trade)
  - [close()](#close)
- [Router](#router) - Smart routing engine
  - [selectPlatform()](#selectplatform)

### Data Models

- [PlatformOption](#platformoption)
- [Quote](#quote)
- [TradeResult](#traderesult)

### Enumerations

- [RoutingStrategy](#routingstrategy)

### Exceptions

- [Exception Hierarchy](#exception-hierarchy)
- [TradingException](#tradingexception)
- [NoLiquidityException](#noliquidityexception)
- [AllPlatformsFailedException](#allplatformsfailedexception)
- [InvalidRoutingStrategyException](#invalidroutingstrategyexception)

### Additional Resources

- [Supported Networks](#supported-networks)
- [Platform Selection Logic](#platform-selection-logic)
- [Performance Considerations](#performance-considerations)

---

## TradingClient

**Location**: `packages/trading-sdk/src/sdk/client.ts`

The main entry point for unified multi-platform trading. Orchestrates quote aggregation, smart routing, and trade execution across Market Maker and Cross-Chain Access platforms.

### Constructor

```typescript
new TradingClient(config: TradingClientConfig)
```

**Parameters**:

| Parameter          | Type              | Required | Description                                      |
| ------------------ | ----------------- | -------- | ------------------------------------------------ |
| `network`          | `Network`         | ✅       | Blockchain network (e.g., `Network.POLYGON`)     |
| `privateKey`       | `string`          | ✅       | Wallet private key (with `0x` prefix)            |
| `rpqApiKey`        | `string`          | ✅       | API key for Market Maker RPQ Service             |
| `userEmail`        | `string`          | ❌       | Email for Cross-Chain Access (optional but recommended) |
| `rpcUrl`           | `string`          | ❌       | Custom RPC endpoint (uses default if not provided) |
| `routingStrategy`  | `RoutingStrategy` | ❌       | Default routing strategy (default: `BEST_PRICE`) |

**Attributes**:

- `network`: Active blockchain network
- `routingStrategy`: Default routing strategy for trades
- `marketMakerClient`: Instance of `MarketMakerClient`
- `crossChainAccessClient`: Instance of `CrossChainAccessClient`

**Example**:

```typescript
import { TradingClient, RoutingStrategy } from "@swarm/trading-sdk";
import { Network } from "@swarm/shared";

// Initialize client
const client = new TradingClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your_key",
  userEmail: "user@example.com",
  routingStrategy: RoutingStrategy.BEST_PRICE
});

await client.initialize();
try {
  const result = await client.trade({
    fromToken: "0xUSDC...",
    toToken: "0xRWA...",
    fromAmount: 100,
    toTokenSymbol: "AAPL",
    userEmail: "user@example.com"
  });
  console.log(`Traded via ${result.source}! TX: ${result.txHash}`);
} finally {
  await client.close();
}
```

**Throws**:

- `Error`: If invalid parameters provided

---

### initialize()

Initialize the client and underlying platform clients.

```typescript
async initialize(): Promise<void>
```

**Returns**: `Promise<void>`

**Description**:

Initializes both Market Maker and Cross-Chain Access clients, including authentication. Must be called before using any trading methods.

**Example**:

```typescript
const client = new TradingClient({ ... });
await client.initialize();
// Now ready to trade
```

---

### getQuotes()

Get quotes from all available platforms.

```typescript
async getQuotes(params: GetQuotesParams): Promise<QuotesResponse>
```

**Parameters**:

| Parameter      | Type     | Required | Description                                          |
| -------------- | -------- | -------- | ---------------------------------------------------- |
| `fromToken`    | `string` | ✅       | Token address to sell                                |
| `toToken`      | `string` | ✅       | Token address to buy                                 |
| `fromAmount`   | `number` | ⚠️       | Amount to sell (either this or `toAmount`)           |
| `toAmount`     | `number` | ⚠️       | Amount to buy (either this or `fromAmount`)          |
| `toTokenSymbol`| `string` | ❌       | Token symbol for Cross-Chain Access (e.g., `"AAPL"`) |

**⚠️ Important**: Provide **either** `fromAmount` **OR** `toAmount`, not both.

**Returns**: `Promise<QuotesResponse>`

Object with platform names as keys:

```typescript
{
  marketMaker?: Quote,
  crossChainAccess?: Quote
}
```

**Description**:

Fetches quotes from both platforms in parallel. If a platform is unavailable or fails to provide a quote, its value will be `undefined`. This method never throws exceptions - it returns `undefined` for unavailable platforms.

**Example**:

```typescript
// Get quotes from all platforms
const quotes = await client.getQuotes({
  fromToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",  // USDC
  toToken: "0xRWA...",
  fromAmount: 100,
  toTokenSymbol: "AAPL"  // Required for Cross-Chain Access
});

// Check availability and compare
if (quotes.marketMaker) {
  console.log(`Market Maker: $${quotes.marketMaker.rate}`);
  console.log(`  You'll get: ${quotes.marketMaker.buyAmount} tokens`);
} else {
  console.log("Market Maker: Not available");
}

if (quotes.crossChainAccess) {
  console.log(`Cross-Chain Access: $${quotes.crossChainAccess.rate}`);
  console.log(`  You'll get: ${quotes.crossChainAccess.buyAmount} tokens`);
} else {
  console.log("Cross-Chain Access: Not available");
}

// Calculate potential savings
if (quotes.marketMaker && quotes.crossChainAccess) {
  const mmRate = quotes.marketMaker.rate;
  const ccRate = quotes.crossChainAccess.rate;

  if (mmRate < ccRate) {
    const savings = (ccRate - mmRate) * 100;  // For 100 USDC
    console.log(`Market Maker saves $${savings}`);
  } else {
    const savings = (mmRate - ccRate) * 100;
    console.log(`Cross-Chain Access saves $${savings}`);
  }
}
```

---

### trade()

Execute a trade with smart routing between platforms.

```typescript
async trade(params: TradeParams): Promise<TradeResult>
```

**Parameters**:

| Parameter         | Type              | Required | Description                                                                                        |
| ----------------- | ----------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `fromToken`       | `string`          | ✅       | Token address to sell                                                                              |
| `toToken`         | `string`          | ✅       | Token address to buy                                                                               |
| `userEmail`       | `string`          | ✅       | User email for notifications                                                                       |
| `fromAmount`      | `number`          | ⚠️       | Amount to sell (either this or `toAmount`)                                                         |
| `toAmount`        | `number`          | ⚠️       | Amount to buy (either this or `fromAmount`)                                                        |
| `toTokenSymbol`   | `string`          | ❌       | Token symbol for Cross-Chain Access (required if Cross-Chain Access might be used, e.g., `"AAPL"`) |
| `routingStrategy` | `RoutingStrategy` | ❌       | Override default routing strategy for this trade                                                   |

**⚠️ Important**: Provide **either** `fromAmount` **OR** `toAmount`, not both.

**Returns**: `Promise<TradeResult>`

Contains:

- `txHash`: Blockchain transaction hash
- `orderId`: Platform-specific order/offer ID
- `sellTokenAddress`: Token sold
- `sellAmount`: Amount sold (normalized)
- `buyTokenAddress`: Token bought
- `buyAmount`: Amount bought (normalized)
- `rate`: Exchange rate
- `source`: Platform used (`"market_maker"` or `"cross_chain_access"`)
- `timestamp`: Trade execution time
- `network`: Network used

**Trade Flow**:

1. **Get platform options** - Fetches quotes from both platforms in parallel
2. **Check availability** - Validates which platforms are accessible
3. **Apply routing strategy** - Selects optimal platform based on strategy
4. **Execute trade** - Runs trade on selected platform
5. **Fallback (if applicable)** - If primary fails and strategy allows, tries alternative
6. **Return result** - Returns `TradeResult` or throws exception

**Throws**:

| Exception                     | Condition                        |
| ----------------------------- | -------------------------------- |
| `Error`                       | Both or neither amounts provided |
| `NoLiquidityException`        | No platforms available           |
| `AllPlatformsFailedException` | Both primary and fallback failed |
| `TradingException`            | Generic trading error            |

**Example**:

```typescript
// Basic trade with BEST_PRICE (default)
const result = await client.trade({
  fromToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",  // USDC
  toToken: "0xRWA...",
  fromAmount: 100,
  toTokenSymbol: "AAPL",
  userEmail: "user@example.com"
});

console.log(`Trade successful!`);
console.log(`Platform used: ${result.source}`);
console.log(`TX Hash: ${result.txHash}`);
console.log(`Spent: ${result.sellAmount} USDC`);
console.log(`Received: ${result.buyAmount} AAPL`);
console.log(`Rate: $${result.rate}`);

// Override routing strategy for this trade
const result2 = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100,
  toTokenSymbol: "AAPL",
  userEmail: "user@example.com",
  routingStrategy: RoutingStrategy.MARKET_MAKER_ONLY  // Force Market Maker
});

// Specify buy amount instead of sell amount
const result3 = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  toAmount: 10,  // Buy exactly 10 tokens
  toTokenSymbol: "AAPL",
  userEmail: "user@example.com"
});
```

**Fallback Behavior**:

Fallback is attempted only for strategies that allow it:

| Strategy                   | Primary Fails? | Tries Fallback? |
| -------------------------- | -------------- | --------------- |
| `BEST_PRICE`               | Yes            | ✅ Yes          |
| `CROSS_CHAIN_ACCESS_FIRST` | Yes            | ✅ Yes          |
| `MARKET_MAKER_FIRST`       | Yes            | ✅ Yes          |
| `CROSS_CHAIN_ACCESS_ONLY`  | Yes            | ❌ No           |
| `MARKET_MAKER_ONLY`        | Yes            | ❌ No           |

**Quote Failures vs Trade Failures**:

- **Quote failure**: Platform is not included in routing (no gas cost)
- **Trade failure**: Transaction reverted on-chain (gas is spent)

The SDK tries to avoid on-chain failures by validating availability first.

---

### close()

Close all clients and cleanup resources.

```typescript
async close(): Promise<void>
```

**Returns**: `Promise<void>`

**Description**:

Properly closes both Market Maker and Cross-Chain Access clients, including HTTP clients and remote config fetchers. Should be called when done using the client.

**Example**:

```typescript
const client = new TradingClient({ ... });
await client.initialize();
try {
  const result = await client.trade({ ... });
} finally {
  await client.close();  // Cleanup
}
```

---

## Router

**Location**: `packages/trading-sdk/src/routing.ts`

Smart router for choosing optimal trading platform based on availability, pricing, and user preferences.

### selectPlatform()

Select optimal platform based on routing strategy.

```typescript
static selectPlatform(
  crossChainAccessOption: PlatformOption,
  marketMakerOption: PlatformOption,
  strategy: RoutingStrategy,
  isBuy: boolean
): PlatformOption
```

**Parameters**:

| Parameter                | Type              | Required | Description                                            |
| ------------------------ | ----------------- | -------- | ------------------------------------------------------ |
| `crossChainAccessOption` | `PlatformOption`  | ✅       | Cross-Chain Access platform option with quote          |
| `marketMakerOption`      | `PlatformOption`  | ✅       | Market Maker platform option with quote                |
| `strategy`               | `RoutingStrategy` | ✅       | Routing strategy to apply                              |
| `isBuy`                  | `boolean`         | ✅       | Whether this is a buy order (affects price comparison) |

**Returns**: `PlatformOption`

Selected platform option.

**Throws**:

- `NoLiquidityException`: If no platforms available based on strategy

**Description**:

Core routing logic that implements all routing strategies. Makes intelligent decisions based on:

1. **Platform availability** - Checks if platforms have valid quotes
2. **User strategy** - Applies the specified routing preference
3. **Price comparison** - For `BEST_PRICE`, compares rates intelligently
4. **Buy vs Sell** - Uses correct comparison logic for order direction

**Price Comparison Logic**:

```typescript
// For BUY orders (spending USDC to get tokens)
// Lower rate = better (less USDC per token)
if (isBuy) {
  better = rateA < rateB;
}

// For SELL orders (selling tokens for USDC)
// Higher rate = better (more USDC per token)
else {
  better = rateA > rateB;
}
```

**Example**:

```typescript
import { Router, PlatformOption, RoutingStrategy } from "@swarm/trading-sdk";

// Create platform options
const marketMakerOption: PlatformOption = {
  platform: "market_maker",
  quote: marketMakerQuote,
  available: true
};

const crossChainAccessOption: PlatformOption = {
  platform: "cross_chain_access",
  quote: crossChainAccessQuote,
  available: true
};

// Select platform
const selected = Router.selectPlatform(
  crossChainAccessOption,
  marketMakerOption,
  RoutingStrategy.BEST_PRICE,
  true  // This is a buy order
);

console.log(`Selected: ${selected.platform}`);
console.log(`Rate: ${selected.quote?.rate}`);
```

**Strategy Implementation**:

```typescript
// BEST_PRICE: Compare rates, select cheaper (for buys) or better (for sells)
if (strategy === RoutingStrategy.BEST_PRICE) {
  if (isBuy) {
    return min(options, o => o.getEffectiveRate());
  } else {
    return max(options, o => o.getEffectiveRate());
  }
}

// CROSS_CHAIN_ACCESS_FIRST: Try Cross-Chain Access, fallback to Market Maker
if (strategy === RoutingStrategy.CROSS_CHAIN_ACCESS_FIRST) {
  return crossChainAccessOption.available ? crossChainAccessOption : marketMakerOption;
}

// MARKET_MAKER_FIRST: Try Market Maker, fallback to Cross-Chain Access
if (strategy === RoutingStrategy.MARKET_MAKER_FIRST) {
  return marketMakerOption.available ? marketMakerOption : crossChainAccessOption;
}

// CROSS_CHAIN_ACCESS_ONLY: Only Cross-Chain Access, fail if unavailable
if (strategy === RoutingStrategy.CROSS_CHAIN_ACCESS_ONLY) {
  if (!crossChainAccessOption.available) {
    throw new NoLiquidityException("Cross-Chain Access not available");
  }
  return crossChainAccessOption;
}

// MARKET_MAKER_ONLY: Only Market Maker, fail if unavailable
if (strategy === RoutingStrategy.MARKET_MAKER_ONLY) {
  if (!marketMakerOption.available) {
    throw new NoLiquidityException("Market Maker not available");
  }
  return marketMakerOption;
}
```

---

## Data Models

### PlatformOption

**Location**: `packages/trading-sdk/src/routing.ts`

Represents a trading platform option with quote and availability status.

**Fields**:

| Field       | Type    | Description                                                |
| ----------- | ------- | ---------------------------------------------------------- |
| `platform`  | `string`| Platform name (`"cross_chain_access"` or `"market_maker"`) |
| `quote`     | `Quote` | Quote from this platform (optional)                        |
| `available` | `boolean`| Whether platform is available (default: `true`)           |
| `error`     | `string`| Error message if unavailable (optional)                    |

**Methods**:

```typescript
getEffectiveRate(): number
```

Get effective rate for comparison. Returns rate (buyAmount / sellAmount).

**Example**:

```typescript
// Create platform option
const option: PlatformOption = {
  platform: "market_maker",
  quote: quote,
  available: true
};

// Get rate for comparison
const rate = option.getEffectiveRate();
console.log(`Rate: ${rate}`);

// Unavailable platform
const unavailableOption: PlatformOption = {
  platform: "cross_chain_access",
  available: false,
  error: "Market is closed"
};
```

---

### Quote

**Location**: `packages/shared/src/models.ts`

Normalized quote format used across all SDKs.

**Fields**:

| Field              | Type     | Description                                                  |
| ------------------ | -------- | ------------------------------------------------------------ |
| `sellTokenAddress` | `string` | Token being sold                                             |
| `sellAmount`       | `number` | Amount being sold (normalized)                               |
| `buyTokenAddress`  | `string` | Token being bought                                           |
| `buyAmount`        | `number` | Amount being bought (normalized)                             |
| `rate`             | `number` | Exchange rate (buyAmount / sellAmount)                       |
| `source`           | `string` | Platform source (`"market_maker"` or `"cross_chain_access"`) |
| `timestamp`        | `Date`   | Quote timestamp                                              |

---

### TradeResult

**Location**: `packages/shared/src/models.ts`

Normalized trade result format used across all SDKs.

**Fields**:

| Field              | Type     | Description                                                |
| ------------------ | -------- | ---------------------------------------------------------- |
| `txHash`           | `string` | Blockchain transaction hash                                |
| `orderId`          | `string` | Platform-specific order/offer ID                           |
| `sellTokenAddress` | `string` | Token sold                                                 |
| `sellAmount`       | `number` | Amount sold (normalized)                                   |
| `buyTokenAddress`  | `string` | Token bought                                               |
| `buyAmount`        | `number` | Amount bought (normalized)                                 |
| `rate`             | `number` | Exchange rate                                              |
| `source`           | `string` | Platform used (`"market_maker"` or `"cross_chain_access"`) |
| `timestamp`        | `Date`   | Trade execution time                                       |
| `network`          | `Network`| Blockchain network                                         |

---

## Enumerations

### RoutingStrategy

**Location**: `packages/trading-sdk/src/routing.ts`

Defines how the router selects between platforms.

```typescript
enum RoutingStrategy {
  BEST_PRICE = "best_price",
  // Compares prices and selects platform with best rate
  // Falls back if primary fails

  CROSS_CHAIN_ACCESS_FIRST = "cross_chain_access_first",
  // Tries Cross-Chain Access first
  // Falls back to Market Maker if unavailable

  MARKET_MAKER_FIRST = "market_maker_first",
  // Tries Market Maker first
  // Falls back to Cross-Chain Access if unavailable

  CROSS_CHAIN_ACCESS_ONLY = "cross_chain_access_only",
  // Only uses Cross-Chain Access
  // Fails if unavailable (no fallback)

  MARKET_MAKER_ONLY = "market_maker_only"
  // Only uses Market Maker
  // Fails if unavailable (no fallback)
}
```

**Strategy Comparison**:

| Strategy                   | Compares Prices? | Has Fallback? | Best For                      |
| -------------------------- | ---------------- | ------------- | ----------------------------- |
| `BEST_PRICE`               | ✅ Yes           | ✅ Yes        | Optimal pricing (recommended) |
| `CROSS_CHAIN_ACCESS_FIRST` | ❌ No            | ✅ Yes        | Stock market preference       |
| `MARKET_MAKER_FIRST`       | ❌ No            | ✅ Yes        | P2P preference                |
| `CROSS_CHAIN_ACCESS_ONLY`  | ❌ No            | ❌ No         | Stock market only             |
| `MARKET_MAKER_ONLY`        | ❌ No            | ❌ No         | P2P only                      |

---

## Exceptions

### Exception Hierarchy

```
TradingException (base)
├── NoLiquidityException
├── AllPlatformsFailedException
└── InvalidRoutingStrategyException
```

---

### TradingException

**Location**: `packages/trading-sdk/src/exceptions.ts`

Base exception for all Trading SDK-related errors.

---

### NoLiquidityException

Raised when no liquidity available on any platform based on routing strategy.

**Possible Causes**:

- No platforms have quotes
- Selected platform(s) unavailable
- Market closed (Cross-Chain Access)
- No offers (Market Maker)

**Example**:

```typescript
try {
  const result = await client.trade({ ... });
} catch (error) {
  if (error instanceof NoLiquidityException) {
    console.log(`No liquidity: ${error.message}`);
    // Error message includes platform-specific details
    // e.g., "No platforms available. Cross-Chain Access: Market closed; Market Maker: No offers"
  }
}
```

---

### AllPlatformsFailedException

Raised when all trading platforms fail to execute trade.

This occurs when:

1. Primary platform fails to execute
2. Fallback platform also fails
3. Strategy allows fallback (BEST_PRICE, CROSS_CHAIN_ACCESS_FIRST, MARKET_MAKER_FIRST)

**Error Message Format**:

```
Primary (market_maker): [error details]. Fallback (cross_chain_access): [error details]
```

**Example**:

```typescript
try {
  const result = await client.trade({ ... });
} catch (error) {
  if (error instanceof AllPlatformsFailedException) {
    console.log(`All platforms failed: ${error.message}`);
    // Both primary and fallback attempts failed
    // Check error details for both platforms
  }
}
```

---

### InvalidRoutingStrategyException

Raised when routing strategy is invalid or not recognized.

This is typically a programming error rather than a runtime error.

---

## Supported Networks

Trading SDK works on networks supported by both underlying platforms:

| Network  | Chain ID | Market Maker | Cross-Chain Access | Trading SDK |
| -------- | -------- | ------------ | ------------------ | ----------- |
| Polygon  | 137      | ✅           | ✅                 | ✅ Both     |
| Ethereum | 1        | ✅           | ✅                 | ✅ Both     |
| Arbitrum | 42161    | ✅           | ❌                 | ✅ MM only  |
| Base     | 8453     | ✅           | ✅                 | ✅ Both     |
| Optimism | 10       | ✅           | ❌                 | ✅ MM only  |

On networks where only one platform is available, the SDK automatically uses that platform regardless of routing strategy.

---

## Platform Selection Logic

### Decision Flow

```
1. Check Cross-Chain Access availability
   ├─ Market hours? (14:30-21:00 UTC, weekdays)
   ├─ Symbol provided?
   ├─ Quote available?
   └─ Result: Available or Unavailable

2. Check Market Maker availability
   ├─ Offers exist?
   ├─ Quote available?
   └─ Result: Available or Unavailable

3. Apply routing strategy
   ├─ BEST_PRICE → Compare rates
   ├─ CROSS_CHAIN_ACCESS_FIRST → Try Cross-Chain Access, fallback Market Maker
   ├─ MARKET_MAKER_FIRST → Try Market Maker, fallback Cross-Chain Access
   ├─ CROSS_CHAIN_ACCESS_ONLY → Only Cross-Chain Access
   └─ MARKET_MAKER_ONLY → Only Market Maker

4. Execute on selected platform

5. If primary fails and strategy allows:
   ├─ Log primary error
   ├─ Select fallback platform
   └─ Execute on fallback

6. Return result or throw exception
```

### Rate Comparison Details

For `BEST_PRICE` strategy:

**BUY Orders** (spending USDC to get tokens):

```typescript
rate = buyAmount / sellAmount  // tokens per USDC
betterPlatform = min(platforms, rate)  // Lower is better
```

**Example**:

- Market Maker: 1 USDC → 0.010 RWA (rate: 0.010)
- Cross-Chain Access: 1 USDC → 0.012 RWA (rate: 0.012)
- **Winner**: Cross-Chain Access (more tokens per USDC) ✅

**SELL Orders** (selling tokens for USDC):

```typescript
rate = buyAmount / sellAmount  // USDC per token
betterPlatform = max(platforms, rate)  // Higher is better
```

**Example**:

- Market Maker: 1 RWA → 100 USDC (rate: 100)
- Cross-Chain Access: 1 RWA → 98 USDC (rate: 98)
- **Winner**: Market Maker (more USDC per token) ✅

---

## Performance Considerations

### Quote Fetching

Quotes are fetched in **parallel** from both platforms:

```typescript
// Parallel execution (fast)
const [marketMakerQuote, crossChainAccessQuote] = await Promise.all([
  getMarketMakerQuote(),
  getCrossChainAccessQuote()
]);

// Total time ≈ max(marketMakerTime, crossChainAccessTime)
// Not: marketMakerTime + crossChainAccessTime
```

**Typical quote times**:

- Market Maker: 100-300ms (RPQ API)
- Cross-Chain Access: 50-150ms (Stock API)
- **Total**: ~300ms (parallel execution)

### Trade Execution

Trade execution time depends on selected platform:

**Market Maker**:

- Blockchain transaction only
- Time: 2-30 seconds (depends on network)
- Gas: Variable by network

**Cross-Chain Access**:

- On-chain transfer + API order submission
- Time: 2-30 seconds (blockchain) + 1-2 seconds (API)
- Gas: Variable by network

### Fallback Overhead

If primary platform fails:

**Quote failure** (no gas cost):

- Time: +0ms (already fetched in parallel)
- Cost: $0 (no transaction)

**Trade failure** (after on-chain submission):

- Time: +2-30 seconds (new transaction)
- Cost: Gas for failed transaction + gas for successful fallback

### Optimization Tips

1. **Reuse client instances** - Don't create new clients for each trade
2. **Use BEST_PRICE** - Gets quotes from both platforms anyway
3. **Provide toTokenSymbol** - Enables Cross-Chain Access quotes
4. **Monitor errors** - Adjust strategy if one platform consistently fails

---

**Happy Trading! 🚀**

_Last Updated: December 29, 2024_
