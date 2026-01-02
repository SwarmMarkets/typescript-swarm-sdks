# Market Maker SDK User Guide

Welcome to the **Market Maker SDK**! This guide will help you start trading Real World Assets (RWAs) through decentralized, peer-to-peer offers on-chain. Trade 24/7 with no market hours restrictions using smart contracts.

## Table of Contents

1. [What is Market Maker?](#what-is-market-maker)
2. [Prerequisites](#prerequisites)
3. [Supported Networks](#supported-networks)
4. [Installation](#installation)
5. [Initializing the SDK](#initializing-the-sdk)
6. [Understanding Offers](#understanding-offers)
7. [Getting Offers and Quotes](#getting-offers-and-quotes)
   - [Browse Available Offers](#browse-available-offers)
   - [Get Best Offers](#get-best-offers)
   - [Get Quotes](#get-quotes)
8. [Trading (Taking Offers)](#trading-taking-offers)
   - [Taking Fixed-Price Offers](#taking-fixed-price-offers)
   - [Taking Dynamic-Price Offers](#taking-dynamic-price-offers)
9. [Creating Your Own Offers](#creating-your-own-offers)
10. [Canceling Offers](#canceling-offers)
11. [Error Handling](#error-handling)
12. [Complete Example](#complete-example)
13. [API Reference](#api-reference)

---

## What is Market Maker?

Market Maker is a **decentralized Over-The-Counter (OTC) trading protocol** that allows you to:

- ✅ **Trade 24/7** - No market hours restrictions
- ✅ **Peer-to-peer** - Direct trades via smart contracts
- ✅ **On-chain execution** - Fully decentralized and transparent
- ✅ **Become a liquidity provider** - Create your own offers
- ✅ **Fixed or dynamic pricing** - Use static prices or live price feeds

Unlike Cross-Chain Access (centralized stock trading), Market Maker operates entirely through blockchain smart contracts.

---

## Prerequisites

Before you can use the Market Maker SDK:

### 1. Required Items

You'll need:

- **Node.js 18+** installed on your system
- A **wallet with a private key**
- **Tokens to trade** (e.g., USDC, RWA tokens)
- **Gas tokens** (MATIC, ETH, etc.) for transaction fees
- **RPQ API Key** - Required for accessing offer data

### 2. Get Your RPQ API Key

The RPQ (Request for Quote) Service provides market data for Market Maker offers:

1. Contact support or visit the platform to request an API key
2. Set your API key in environment variables: `RPQ_API_KEY=your_key_here`

> ⚠️ **Important**: The RPQ API Key is required for getting offers, best offers, and quotes. Without it, you can only execute trades if you already know the offer ID.

### 3. Environment Setup

Optionally set the environment mode:

```bash
# Development mode (default)
export SWARM_COLLECTION_MODE=dev

# Production mode
export SWARM_COLLECTION_MODE=prod
```

---

## Supported Networks

The Market Maker SDK works on multiple blockchain networks:

### Available Networks

| Network  | Chain ID | Gas Token | Contract Available |
| -------- | -------- | --------- | ------------------ |
| Polygon  | 137      | MATIC     | ✅                 |
| Ethereum | 1        | ETH       | ✅                 |
| Arbitrum | 42161    | ETH       | ✅                 |
| Base     | 8453     | ETH       | ✅                 |
| Optimism | 10       | ETH       | ✅                 |

### Important Notes

- **No KYC Required**: Unlike Cross-Chain Access, Market Maker is permissionless
- **24/7 Trading**: Trade anytime, any day
- **Gas Fees**: You'll need native tokens for gas (MATIC, ETH, etc.)
- **Contract Addresses**: Automatically loaded from remote config

---

## Installation

Install the Swarm Market Maker SDK package:

```bash
npm install @swarm/market-maker-sdk
# or
yarn add @swarm/market-maker-sdk
# or
pnpm add @swarm/market-maker-sdk
```

---

## Initializing the SDK

Setting up the Market Maker SDK is simple:

### Basic Setup

```typescript
import { MarketMakerClient } from "@swarm/market-maker-sdk";
import { Network } from "@swarm/shared";

// Initialize the client
const client = new MarketMakerClient({
  network: Network.POLYGON,           // Choose your network
  privateKey: "0x...",                // Your wallet private key
  rpqApiKey: "your_rpq_key",          // RPQ Service API key
  userEmail: "you@example.com"        // Optional: for authentication
});

await client.initialize();

try {
  // Start trading!
} finally {
  await client.close();
}
```

### Configuration Options

| Parameter     | Type      | Required | Description                                   |
| ------------- | --------- | -------- | --------------------------------------------- |
| `network`     | `Network` | ✅       | Blockchain network (e.g., `Network.POLYGON`)  |
| `privateKey`  | `string`  | ✅       | Wallet private key (with `0x` prefix)         |
| `rpqApiKey`   | `string`  | ✅       | API key for RPQ Service                       |
| `userEmail`   | `string`  | ❌       | Email for Swarm authentication (optional)     |
| `rpcUrl`      | `string`  | ❌       | Custom RPC endpoint (uses default if omitted) |

### Using Try-Finally Pattern (Recommended)

Always use the try-finally pattern for automatic cleanup:

```typescript
// ✅ Good - Automatic cleanup
const client = new MarketMakerClient({...});
await client.initialize();

try {
  const result = await client.trade({...});
} finally {
  await client.close();
}

// ❌ Bad - No cleanup
const client = new MarketMakerClient({...});
await client.initialize();
const result = await client.trade({...});
// Don't forget to close!
```

---

## Understanding Offers

Before trading, it's important to understand how Market Maker offers work:

### Offer Terminology

- **Deposit Asset**: What the **maker deposited** (what **takers receive**)
- **Withdrawal Asset**: What the **maker wants** (what **takers pay**)
- **Maker**: The person who created the offer
- **Taker**: The person who accepts (takes) the offer

### Example: Buying RWA Tokens

```
Maker's Offer:
  - Deposit: 10 RWA tokens
  - Withdrawal: 1000 USDC
  - Rate: 100 USDC per RWA

When you TAKE this offer:
  - You PAY: 1000 USDC (withdrawal asset)
  - You RECEIVE: 10 RWA (deposit asset)
```

### Offer Types

**Partial Offers**:

- Can be taken in parts
- Multiple takers can fill
- Useful for large amounts

**Block Offers**:

- Must be taken all at once
- One taker only
- Useful for specific amounts

### Pricing Types

**Fixed Pricing**:

- Price set when offer created
- Won't change during trade
- Simple and predictable

**Dynamic Pricing**:

- Uses live price feeds
- Updates in real-time
- Includes slippage protection

---

## Getting Offers and Quotes

Before trading, you'll want to explore available offers:

### Browse Available Offers

Get a list of all available offers for a token pair:

```typescript
const client = new MarketMakerClient({...});
await client.initialize();

try {
  // Get all offers where you buy RWA by selling USDC
  const offers = await client.rpqClient.getOffers({
    buyAssetAddress: "0xRWA...",   // Token you want to receive
    sellAssetAddress: "0xUSDC...", // Token you want to pay with
    page: 0,
    limit: 10
  });

  console.log(`Found ${offers.length} offers`);

  for (const offer of offers) {
    console.log(`Offer ID: ${offer.id}`);
    console.log(`  Deposit: ${offer.amountIn} ${offer.depositAsset.symbol}`);
    console.log(`  Withdraw: ${offer.amountOut} ${offer.withdrawalAsset.symbol}`);
    console.log(`  Available: ${offer.availableAmount}`);
    console.log(`  Type: ${offer.offerType}`);
    console.log(`  Status: ${offer.offerStatus}`);
    console.log();
  }
} finally {
  await client.close();
}
```

> 💡 **Tip**: Use pagination with `page` and `limit` parameters for large result sets.

### Get Best Offers

Find the optimal combination of offers to reach your target amount:

```typescript
const client = new MarketMakerClient({...});
await client.initialize();

try {
  // Find best offers to spend 100 USDC
  const bestOffers = await client.rpqClient.getBestOffers({
    buyAssetAddress: "0xRWA...",   // What you want to receive
    sellAssetAddress: "0xUSDC...", // What you want to pay
    targetSellAmount: "100"        // How much USDC to spend
  });

  console.log(`To spend ${bestOffers.result.targetAmount}:`);
  console.log(`  Will pay: ${bestOffers.result.totalWithdrawalAmountPaid}`);
  console.log(`  Using ${bestOffers.result.selectedOffers.length} offer(s)`);

  for (const offer of bestOffers.result.selectedOffers) {
    console.log(`\n  Offer ${offer.id}:`);
    console.log(`    Amount: ${offer.withdrawalAmountPaid}`);
    console.log(`    Price: ${offer.pricePerUnit}`);
    console.log(`    Type: ${offer.pricingType}`);
  }
} finally {
  await client.close();
}
```

**Two Ways to Specify Amount**:

```typescript
// Option 1: Specify how much to SELL
const bestOffers = await client.rpqClient.getBestOffers({
  buyAssetAddress: "0xRWA...",
  sellAssetAddress: "0xUSDC...",
  targetSellAmount: "100"  // Spend 100 USDC
});

// Option 2: Specify how much to BUY
const bestOffers = await client.rpqClient.getBestOffers({
  buyAssetAddress: "0xRWA...",
  sellAssetAddress: "0xUSDC...",
  targetBuyAmount: "10"  // Receive 10 RWA tokens
});
```

> ⚠️ **Important**: Provide **either** `targetSellAmount` **OR** `targetBuyAmount`, not both!

### Get Quotes

Get a quick price quote without offer details:

```typescript
const client = new MarketMakerClient({...});
await client.initialize();

try {
  // Get quote for spending 50 USDC
  const quote = await client.getQuote({
    fromToken: "0xUSDC...",
    toToken: "0xRWA...",
    fromAmount: 50
  });

  console.log(`💰 Quote for 50 USDC:`);
  console.log(`   You'll receive: ${quote.buyAmount} RWA`);
  console.log(`   Rate: ${quote.rate}`);
  console.log(`   Source: ${quote.source}`);
} finally {
  await client.close();
}
```

---

## Trading (Taking Offers)

Once you've found good offers, you can take them to execute trades:

### Taking Fixed-Price Offers

The `trade()` method automatically handles everything:

```typescript
const client = new MarketMakerClient({...});
await client.initialize();

try {
  // Buy RWA tokens by spending USDC
  const result = await client.trade({
    fromToken: "0xUSDC...",  // What you're paying
    toToken: "0xRWA...",     // What you're receiving
    fromAmount: 100,
    affiliate: undefined     // Optional affiliate address
  });

  console.log(`✅ Trade successful!`);
  console.log(`   TX Hash: ${result.txHash}`);
  console.log(`   Offer ID: ${result.orderId}`);
  console.log(`   Paid: ${result.sellAmount} USDC`);
  console.log(`   Received: ${result.buyAmount} RWA`);
  console.log(`   Rate: ${result.rate}`);
} finally {
  await client.close();
}
```

### What Happens When You Trade?

The SDK automatically:

1. 🔍 **Finds best offers** - Queries RPQ Service
2. ✅ **Approves tokens** - Allows contract to spend your tokens
3. 💰 **Checks balance** - Verifies you have enough tokens
4. 📊 **Handles pricing** - Works with both fixed and dynamic offers
5. 🔗 **Executes on-chain** - Submits transaction to blockchain
6. ⏳ **Waits for confirmation** - Returns after transaction is mined

### Taking Dynamic-Price Offers

Dynamic offers are handled automatically by the `trade()` method. The SDK:

- Uses `depositToWithdrawalRate` for slippage protection
- Protects against price changes during transaction
- Automatically calls the correct smart contract function

```typescript
// Same syntax - SDK handles fixed vs dynamic automatically
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 50
});
// Works with both fixed AND dynamic offers!
```

### Two Ways to Specify Amount

Just like quotes, you can specify either the amount to sell OR the amount to buy:

**Option 1: Specify Amount to Sell**

```typescript
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100  // Spend 100 USDC
});
```

**Option 2: Specify Amount to Buy**

```typescript
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  toAmount: 10  // Receive 10 RWA tokens
});
```

> ⚠️ **Important**: Provide **either** `fromAmount` **OR** `toAmount`, not both!

---

## Creating Your Own Offers

Want to become a liquidity provider? Create your own offers!

### Making an Offer

```typescript
const client = new MarketMakerClient({...});
await client.initialize();

try {
  // Offer to sell 10 RWA for 1000 USDC
  const result = await client.makeOffer({
    sellToken: "0xRWA...",           // Token you're offering
    sellAmount: 10,                  // Amount you're selling
    buyToken: "0xUSDC...",           // Token you want
    buyAmount: 1000,                 // Amount you want to receive
    isDynamic: false,                // Fixed price offer
    expiresAt: undefined             // No expiration
  });

  console.log(`✅ Offer created!`);
  console.log(`   TX Hash: ${result.txHash}`);
  console.log(`   Offer ID: ${result.orderId}`);
  console.log(`   Selling: ${result.sellAmount} RWA`);
  console.log(`   For: ${result.buyAmount} USDC`);
  console.log(`   Rate: ${result.rate}`);
} finally {
  await client.close();
}
```

### Creating Dynamic Offers

Dynamic offers use price feeds to adjust pricing in real-time:

```typescript
// Get available price feeds
const feeds = await client.rpqClient.getPriceFeeds();
console.log(`Available price feeds: ${Object.keys(feeds.priceFeeds).length}`);

// Create dynamic offer
const result = await client.makeOffer({
  sellToken: "0xRWA...",
  sellAmount: 10,
  buyToken: "0xUSDC...",
  buyAmount: 1000,
  isDynamic: true,  // Use price feeds!
  expiresAt: undefined
});
```

### Setting Expiration

You can set an expiration timestamp for your offer:

```typescript
// Expire in 7 days
const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

const result = await client.makeOffer({
  sellToken: "0xRWA...",
  sellAmount: 10,
  buyToken: "0xUSDC...",
  buyAmount: 1000,
  expiresAt: expiresAt  // Unix timestamp
});
```

### What Happens When You Make an Offer?

The SDK automatically:

1. ✅ **Approves tokens** - Allows contract to hold your tokens
2. 🔗 **Creates offer on-chain** - Deposits tokens into smart contract
3. ⏳ **Waits for confirmation** - Returns after transaction is mined
4. 📋 **Returns offer ID** - You can track or cancel later

> 💡 **Tip**: Your tokens are locked in the contract until the offer is taken or you cancel it.

---

## Canceling Offers

Changed your mind? Cancel your own offers anytime:

```typescript
const client = new MarketMakerClient({...});
await client.initialize();

try {
  // Cancel an offer you created
  const txHash = await client.cancelOffer("12345");

  console.log(`✅ Offer cancelled!`);
  console.log(`   TX Hash: ${txHash}`);
} finally {
  await client.close();
}
```

### Important Notes

- ✅ Only the **offer creator** can cancel
- ✅ Your tokens are **returned immediately**
- ❌ You **cannot cancel** if partially taken (partial offers)
- ❌ You **pay gas fees** for cancellation

---

## Error Handling

The SDK provides clear error messages for troubleshooting:

### Common Exceptions

```typescript
import { MarketMakerClient } from "@swarm/market-maker-sdk";
import { Network } from "@swarm/shared";
import {
  NoOffersAvailableException,
  QuoteUnavailableException,
  RPQServiceException,
} from "@swarm/market-maker-sdk/rpq-service";
import {
  OfferNotFoundError,
  OfferInactiveError,
  InsufficientOfferBalanceError,
  OfferExpiredError,
  UnauthorizedError,
  MarketMakerWeb3Exception,
} from "@swarm/market-maker-sdk/market-maker-web3";

const client = new MarketMakerClient({...});
await client.initialize();

try {
  const result = await client.trade({
    fromToken: "0xUSDC...",
    toToken: "0xRWA...",
    fromAmount: 100
  });
  console.log(`✅ Trade successful!`);

} catch (error) {
  if (error instanceof NoOffersAvailableException) {
    console.log(`❌ No offers available: ${error.message}`);
    // Try a different token pair or amount

  } else if (error instanceof OfferNotFoundError) {
    console.log(`❌ Offer doesn't exist: ${error.message}`);
    // Offer was likely already taken

  } else if (error instanceof OfferInactiveError) {
    console.log(`❌ Offer is inactive: ${error.message}`);
    // Offer was cancelled or fully taken

  } else if (error instanceof InsufficientOfferBalanceError) {
    console.log(`❌ Maker has insufficient balance: ${error.message}`);
    // Try a different offer

  } else if (error instanceof OfferExpiredError) {
    console.log(`❌ Offer has expired: ${error.message}`);
    // Find a newer offer

  } else if (error instanceof UnauthorizedError) {
    console.log(`❌ Not authorized: ${error.message}`);
    // You're not the offer creator

  } else if (error instanceof MarketMakerWeb3Exception) {
    console.log(`❌ Blockchain error: ${error.message}`);
    // Check gas, balance, approvals

  } else {
    console.log(`❌ Unexpected error: ${error}`);
    // Contact support if persists
  }
} finally {
  await client.close();
}
```

### Error Reference

| Exception                       | When It Happens              | How to Handle                     |
| ------------------------------- | ---------------------------- | --------------------------------- |
| `NoOffersAvailableException`    | No offers for token pair     | Try different pair or create one  |
| `QuoteUnavailableException`     | Cannot calculate quote       | Check token addresses             |
| `OfferNotFoundError`            | Offer doesn't exist on-chain | Offer was taken or invalid        |
| `OfferInactiveError`            | Offer is not active          | Find a different offer            |
| `InsufficientOfferBalanceError` | Maker lacks tokens           | Try smaller amount or other offer |
| `OfferExpiredError`             | Offer past expiration        | Find newer offers                 |
| `UnauthorizedError`             | Not the offer creator        | Only cancel your own offers       |
| `RPQServiceException`           | RPQ API error                | Check API key, network connection |
| `MarketMakerWeb3Exception`      | Smart contract error         | Check gas, balance, approvals     |
| `Web3Exception`                 | Blockchain connection issue  | Check RPC endpoint, network       |

---

## Complete Example

Here's a comprehensive example showing best practices:

```typescript
import { MarketMakerClient } from "@swarm/market-maker-sdk";
import { Network } from "@swarm/shared";
import {
  NoOffersAvailableException,
  QuoteUnavailableException,
} from "@swarm/market-maker-sdk/rpq-service";
import {
  MarketMakerWeb3Exception,
} from "@swarm/market-maker-sdk/market-maker-web3";

/**
 * Complete example: Trade RWA tokens via Market Maker
 */
async function main() {
  // Configuration
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPQ_API_KEY = process.env.RPQ_API_KEY;
  const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";  // Polygon
  const RWA_ADDRESS = "0x...";  // Replace with actual RWA token

  if (!PRIVATE_KEY || !RPQ_API_KEY) {
    console.log("❌ Missing required environment variables");
    return;
  }

  // Initialize client
  const client = new MarketMakerClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY,
    rpqApiKey: RPQ_API_KEY,
  });

  await client.initialize();

  try {
    console.log(`✅ Connected to Market Maker`);
    console.log(`   Network: ${Network.POLYGON}`);
    console.log(`   Wallet: ${client.web3Client.account.address}`);
    console.log();

    // Step 1: Browse available offers
    console.log("📋 Step 1: Browse Available Offers");
    const offers = await client.rpqClient.getOffers({
      buyAssetAddress: RWA_ADDRESS,
      sellAssetAddress: USDC_ADDRESS,
      limit: 5
    });
    console.log(`Found ${offers.length} offers`);
    console.log();

    // Step 2: Get best offers
    console.log("🎯 Step 2: Get Best Offers");
    const bestOffers = await client.rpqClient.getBestOffers({
      buyAssetAddress: RWA_ADDRESS,
      sellAssetAddress: USDC_ADDRESS,
      targetSellAmount: "100"  // Spend 100 USDC
    });
    console.log(`Best combination uses ${bestOffers.result.selectedOffers.length} offer(s)`);
    console.log();

    // Step 3: Get a quote
    console.log("💰 Step 3: Get Quote");
    const quote = await client.getQuote({
      fromToken: USDC_ADDRESS,
      toToken: RWA_ADDRESS,
      fromAmount: 100
    });
    console.log(`Rate: ${quote.rate}`);
    console.log(`You'll receive: ${quote.buyAmount} RWA tokens`);
    console.log();

    // Step 4: Execute trade
    console.log("🔄 Step 4: Execute Trade");
    console.log("⚠️  Trade execution commented out for safety");
    // Uncomment below to execute real trade:
    /*
    const result = await client.trade({
      fromToken: USDC_ADDRESS,
      toToken: RWA_ADDRESS,
      fromAmount: 100
    });

    console.log(`✅ Trade successful!`);
    console.log(`   TX Hash: ${result.txHash}`);
    console.log(`   Offer ID: ${result.orderId}`);
    console.log(`   Paid: ${result.sellAmount} USDC`);
    console.log(`   Received: ${result.buyAmount} RWA`);
    */

  } catch (error) {
    if (error instanceof NoOffersAvailableException) {
      console.log(`❌ No offers available: ${error.message}`);
      console.log("💡 Try creating your own offer!");

    } else if (error instanceof QuoteUnavailableException) {
      console.log(`❌ Quote unavailable: ${error.message}`);
      console.log("💡 Check token addresses");

    } else if (error instanceof MarketMakerWeb3Exception) {
      console.log(`❌ Blockchain error: ${error.message}`);
      console.log("💡 Check balance, gas, and approvals");

    } else {
      console.log(`❌ Unexpected error: ${error}`);
      console.log("💡 Contact support if this persists");
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
```

---

## API Reference

For detailed technical documentation of all methods, parameters, and return types, see:

📚 **[Market Maker SDK API Reference](./market_maker_sdk_references.md)**

The API reference includes:

- Complete method signatures
- Parameter descriptions
- Return type details
- Exception specifications
- Advanced usage examples

---

## Need Help?

### Resources

- 📖 **API Reference**: [market_maker_sdk_references.md](./market_maker_sdk_references.md)
- 🔧 **Migration Guide**: See `rpq_service/MIGRATION_GUIDE.md` for API changes
- 💬 **Support**: Contact us through the platform
- 🐛 **Issues**: Report bugs on GitHub

### Common Questions

**Q: What's the difference between Market Maker and Cross-Chain Access?**  
A:

- **Market Maker**: Decentralized P2P trading, 24/7, no KYC, on-chain only
- **Cross-Chain Access**: Centralized stock trading, market hours only, KYC required

**Q: Can I trade any token pair?**  
A: Only pairs with existing offers. Check `getOffers()` or create your own offer!

**Q: What fees are charged?**  
A:

- Blockchain gas fees (varies by network)
- Optional affiliate fees (if you specify an affiliate address)
- No SDK fees

**Q: Is my private key safe?**  
A: Your private key is used only locally to sign transactions. It's never sent to our servers. Always keep it secure!

**Q: How do I get an RPQ API key?**  
A: Contact support or visit the platform to request access.

**Q: Can offers be partially filled?**  
A: Yes, if it's a `PartialOffer`. `BlockOffer` must be filled completely.

---

## Quick Reference

### Import Statements

```typescript
import { MarketMakerClient } from "@swarm/market-maker-sdk";
import { Network } from "@swarm/shared";
import {
  NoOffersAvailableException,
  QuoteUnavailableException,
} from "@swarm/market-maker-sdk/rpq-service";
import {
  MarketMakerWeb3Exception,
} from "@swarm/market-maker-sdk/market-maker-web3";
```

### Initialize Client

```typescript
const client = new MarketMakerClient({
  network: Network.POLYGON,
  privateKey: "0x...",
  rpqApiKey: "your_key",
});
await client.initialize();

try {
  // Your code here
} finally {
  await client.close();
}
```

### Get Quote

```typescript
const quote = await client.getQuote({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100
});
```

### Execute Trade

```typescript
const result = await client.trade({
  fromToken: "0xUSDC...",
  toToken: "0xRWA...",
  fromAmount: 100
});
```

### Create Offer

```typescript
const result = await client.makeOffer({
  sellToken: "0xRWA...",
  sellAmount: 10,
  buyToken: "0xUSDC...",
  buyAmount: 1000
});
```

---

**Happy Trading! 🚀**

_Last Updated: December 29, 2024_
