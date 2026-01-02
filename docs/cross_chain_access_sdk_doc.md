# Cross-Chain Access SDK User Guide

Welcome to the **Cross-Chain Access SDK**! This guide will help you start trading Real World Assets (RWAs) like stocks through our decentralized platform. Trade Apple, Tesla, and other stocks 24/7 using cryptocurrency.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Trading Hours](#trading-hours)
3. [Supported Networks](#supported-networks)
4. [Installation](#installation)
5. [Initializing the SDK](#initializing-the-sdk)
6. [Trading Assets](#trading-assets)
   - [Buying Assets](#buying-assets)
   - [Selling Assets](#selling-assets)
   - [Cross-Chain Trading](#cross-chain-trading)
7. [Manually Getting Quotes](#manually-getting-quotes)
8. [Manually Checking Market Hours](#manually-checking-market-hours)
9. [Error Handling](#error-handling)
10. [Built-in Retry Logic](#built-in-retry-logic)
11. [Email Notifications](#email-notifications)
12. [Complete Example](#complete-example)
13. [API Reference](#api-reference)

---

## Prerequisites

Before you can use the Cross-Chain Access SDK, you **must** complete the KYC (Know Your Customer) process:

### 1. Register Your Wallet

Visit our platform at **[https://dotc.eth.limo/](https://dotc.eth.limo/)** and complete the following steps:

1. **Connect your wallet** to the platform
2. **Complete KYC verification** - This is required by regulations for stock trading
3. **Wait for approval** - Usually takes 1-2 business days
4. **Your wallet is now authorized** to trade stocks via the SDK

> ⚠️ **Important**: Without KYC approval, your trades will be rejected. Make sure to complete this step first!

### 2. Required Setup

You'll need:

- **Node.js 16+** installed on your system
- A **wallet with a private key** (the same wallet used for KYC)
- **USDC tokens** on one of our supported networks
- **Gas tokens** (MATIC, ETH, etc.) for transaction fees

---

## Trading Hours

The US stock market operates during specific hours. The Cross-Chain Access SDK automatically checks these hours for you:

### Market Schedule

- **Opening Time**: 14:30 UTC (9:30 AM EST)
- **Closing Time**: 21:00 UTC (4:00 PM EST)
- **Trading Days**: Monday - Friday (weekdays only)
- **Closed**: Weekends and US market holidays

### Automatic Validation

Don't worry about checking hours manually! The SDK automatically:

✅ Validates market hours before executing trades  
✅ Provides helpful messages like "Market opens in 5h 30m"  
✅ Throws `MarketClosedException` if you try trading when closed

**Example output when market is closed:**

```
Market is closed. Opens in 12h 45m
```

---

## Supported Networks

The Cross-Chain Access SDK works on multiple blockchain networks. All trading is done with **USDC stablecoin**.

### Available Networks

| Network  | Chain ID | Gas Token |
| -------- | -------- | --------- |
| Polygon  | 137      | MATIC     |
| Ethereum | 1        | ETH       |
| BSC      | 56       | BNB       |
| Base     | 8453     | ETH       |

> 🌐 **Cross-Chain Support**: You can send USDC from any of the **4 networks listed above**, but receive assets on **ANY other network** using the `targetChainId` parameter. This means you have flexibility in choosing where your purchased assets are delivered.

### Important Notes

- **USDC Only**: All trades must be in USDC. We automatically detect the correct USDC address for your network.
- **Cross-Chain**: You can receive assets on a different chain than where you send USDC (see [Cross-Chain Trading](#cross-chain-trading)). Cross-chain functionality is available on **all supported networks** - trade from any network to any network!
- **Gas Fees**: Make sure you have enough gas tokens (MATIC, ETH, etc.) for transactions

---

## Installation

Install the Cross-Chain Access SDK package:

```bash
npm install @swarm/cross-chain-access-sdk
# or
pnpm add @swarm/cross-chain-access-sdk
# or
yarn add @swarm/cross-chain-access-sdk
```

---

## Initializing the SDK

Setting up the SDK is simple. Here's how to get started:

### Basic Setup

```typescript
import { CrossChainAccessClient } from "@swarm/cross-chain-access-sdk";

// Initialize the client
const client = new CrossChainAccessClient({
  network: "polygon",              // Choose your network: "polygon", "ethereum", "bsc", "base"
  privateKey: "0x...",             // Your KYC-verified wallet
  userEmail: "you@example.com"     // For trade notifications
});

await client.initialize();

try {
  // Start trading!
} finally {
  await client.close();
}
```

### Configuration Options

| Parameter    | Type     | Required | Description                                                  |
| ------------ | -------- | -------- | ------------------------------------------------------------ |
| `network`    | `string` | ✅       | Network name: "polygon", "ethereum", "bsc", or "base"        |
| `privateKey` | `string` | ✅       | Private key (must be KYC-verified at https://dotc.eth.limo/) |
| `userEmail`  | `string` | ❌       | Email for trade confirmations                                |
| `rpcUrl`     | `string` | ❌       | Custom RPC endpoint (optional)                               |
| `isDev`      | `boolean`| ❌       | Use development environment (default: `false`)               |

### Using Try-Finally Pattern (Recommended)

Always use the try-finally pattern. This ensures proper cleanup:

```typescript
// ✅ Good - Automatic cleanup
const client = new CrossChainAccessClient({...});
await client.initialize();

try {
  const result = await client.buy({...});
} finally {
  await client.close();
}

// ❌ Bad - No cleanup
const client = new CrossChainAccessClient({...});
await client.initialize();
const result = await client.buy({...});
// Missing cleanup!
```

---

## Trading Assets

The SDK makes trading stocks simple. Buy or sell with just a few lines of code!

### Buying Assets

Purchase stock tokens using USDC:

```typescript
const client = new CrossChainAccessClient({
  network: "polygon",
  privateKey: "0x...",
  userEmail: "you@example.com"
});

await client.initialize();

try {
  // Buy 10 shares of Apple
  const result = await client.buy({
    rwaTokenAddress: "0x1234...",      // Apple token address
    rwaSymbol: "AAPL",                 // Stock symbol
    rwaAmount: 10,                     // Buy 10 shares (can use number)
    userEmail: "you@example.com"       // Get email confirmation
  });

  console.log(`✅ Success! Bought ${result.buyAmount} AAPL`);
  console.log(`💰 Spent: $${result.sellAmount} USDC`);
  console.log(`🔗 Transaction: ${result.txHash}`);
  console.log(`📋 Order ID: ${result.orderId}`);
} finally {
  await client.close();
}
```

#### Two Ways to Specify Amount

You can specify either the amount of shares OR the USDC to spend:

**Option 1: Specify Shares**

```typescript
// Buy exactly 10 shares of AAPL
const result = await client.buy({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 10,                         // Can use number
  userEmail: "you@example.com"
});
```

**Option 2: Specify USDC**

```typescript
// Spend exactly $1000 USDC
const result = await client.buy({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  usdcAmount: 1000,                      // Can use number
  userEmail: "you@example.com"
});
// You'll get as many shares as $1000 can buy at current price
```

> 💡 **Tip**: You can use regular numbers (10, 1000.5) - the SDK automatically handles conversion for precision!

#### What Happens When You Buy?

The SDK automatically handles everything:

1. ✅ **Checks market hours** - Ensures market is open
2. ✅ **Validates your account** - Checks if trading is allowed
3. 📈 **Gets real-time price** - Fetches current market quote
4. 🧮 **Calculates amounts** - Includes 1% slippage protection
5. 💰 **Checks balance** - Verifies you have enough USDC
6. 🔗 **Transfers USDC** - Sends USDC to escrow on-chain
7. 📋 **Places order** - Submits order to Cross-Chain Access
8. 📧 **Sends email** - Confirms trade (if email provided)

### Selling Assets

Sell your stock tokens back to USDC:

```typescript
const client = new CrossChainAccessClient({
  network: "polygon",
  privateKey: "0x...",
  userEmail: "you@example.com"
});

await client.initialize();

try {
  // Sell 5 shares of Apple
  const result = await client.sell({
    rwaTokenAddress: "0x1234...",      // Apple token address
    rwaSymbol: "AAPL",                 // Stock symbol
    rwaAmount: 5,                      // Sell 5 shares (can use number)
    userEmail: "you@example.com"       // Get email confirmation
  });

  console.log(`✅ Success! Sold ${result.sellAmount} AAPL`);
  console.log(`💰 Received: $${result.buyAmount} USDC`);
  console.log(`🔗 Transaction: ${result.txHash}`);
} finally {
  await client.close();
}
```

#### Two Ways to Specify Amount

Just like buying, you can specify shares OR target USDC:

**Option 1: Specify Shares**

```typescript
// Sell exactly 5 shares
const result = await client.sell({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 5,                          // Can use number
  userEmail: "you@example.com"
});
```

**Option 2: Target USDC**

```typescript
// Sell enough shares to get $500 USDC
const result = await client.sell({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  usdcAmount: 500,                       // Can use number
  userEmail: "you@example.com"
});
```

> 💡 **Tip**: The SDK automatically handles numeric precision for financial calculations!

#### What Happens When You Sell?

The process is similar to buying:

1. ✅ **Checks market hours** - Ensures market is open
2. ✅ **Validates your account** - Checks if trading is allowed
3. 📈 **Gets real-time price** - Fetches current market quote
4. 🧮 **Calculates amounts** - Includes 1% slippage protection
5. 🏦 **Checks balance** - Verifies you have enough shares
6. 🔗 **Transfers shares** - Sends tokens to escrow on-chain
7. 📋 **Places order** - Submits order to Cross-Chain Access
8. 📧 **Sends email** - Confirms trade (if email provided)

### Cross-Chain Trading

Want to send USDC from Polygon but receive shares on Base? We support that! Cross-chain functionality is **available on all supported networks** (Polygon, Ethereum, BSC, Base) - you can send from any network and receive on any other network.

#### How It Works

Use the `targetChainId` parameter when you need cross-chain functionality:

```typescript
const client = new CrossChainAccessClient({
  network: "polygon",                // Send USDC from Polygon
  privateKey: "0x...",
  userEmail: "you@example.com"
});

await client.initialize();

try {
  const result = await client.buy({
    rwaTokenAddress: "0x1234...",
    rwaSymbol: "AAPL",
    rwaAmount: 10,                    // Simple numeric value
    userEmail: "you@example.com",
    targetChainId: 8453               // Receive on Base!
  });

  // Works from ANY network to ANY network:
  // Polygon → Ethereum, Ethereum → BSC, BSC → Base, etc.
} finally {
  await client.close();
}
```

---

## Manually Getting Quotes

If you want to display current prices to users before they trade, you can manually fetch quotes:

```typescript
const client = new CrossChainAccessClient({...});
await client.initialize();

try {
  const quote = await client.getQuote("AAPL");

  console.log(`💵 Current AAPL Price: $${quote.rate}`);
  console.log(`⏰ Quote Time: ${quote.timestamp}`);
} finally {
  await client.close();
}
```

### Building a Price Display

```typescript
const client = new CrossChainAccessClient({...});
await client.initialize();

try {
  // Get quotes for multiple symbols
  const symbols = ["AAPL", "TSLA", "GOOGL"];

  for (const symbol of symbols) {
    const quote = await client.getQuote(symbol);
    console.log(`${symbol}: $${quote.rate.toFixed(2)}`);
  }
} finally {
  await client.close();
}

// Output:
// AAPL: $175.50
// TSLA: $242.30
// GOOGL: $138.75
```

> 💡 **Note**: You don't need to fetch quotes manually before trading - the `buy()` and `sell()` methods automatically get real-time prices for you!

---

## Manually Checking Market Hours

The SDK automatically validates market hours for every trade, but if you want to check manually:

```typescript
const client = new CrossChainAccessClient({...});
await client.initialize();

try {
  const { isAvailable, message } = await client.checkTradingAvailability();

  if (isAvailable) {
    console.log(`✅ ${message}`);
    // Example: "Trading is available"
  } else {
    console.log(`❌ ${message}`);
    // Example: "Market is closed. Opens in 8h 30m"
  }
} finally {
  await client.close();
}
```

### What Does It Check?

This method validates:

- ✅ Market hours (14:30-21:00 UTC, weekdays)
- ✅ Your account status (not blocked)
- ✅ Trading permissions (trading allowed)
- ✅ Transfer permissions (not restricted)
- ✅ Market status (currently open)

> 💡 **Note**: You don't need to call this before trading - the `buy()` and `sell()` methods automatically check everything for you!

---

## Error Handling

The SDK provides clear error messages to help you handle issues gracefully.

### Common Exceptions

```typescript
import {
  CrossChainAccessClient,
  MarketClosedException,
  AccountBlockedException,
  InsufficientFundsException,
  QuoteUnavailableException,
  InvalidSymbolException,
} from "@swarm/cross-chain-access-sdk";

const client = new CrossChainAccessClient({...});
await client.initialize();

try {
  const result = await client.buy({
    rwaTokenAddress: "0x1234...",
    rwaSymbol: "AAPL",
    rwaAmount: 10,
    userEmail: "you@example.com"
  });
  console.log("✅ Trade successful!");
} catch (error) {
  if (error instanceof MarketClosedException) {
    console.log(`❌ Market is closed: ${error.message}`);
    // Show user when market opens
  } else if (error instanceof InsufficientFundsException) {
    console.log(`❌ Not enough funds: ${error.message}`);
    // Prompt user to add more USDC
  } else if (error instanceof AccountBlockedException) {
    console.log(`❌ Account restricted: ${error.message}`);
    // Direct user to support
  } else if (error instanceof InvalidSymbolException) {
    console.log(`❌ Invalid symbol: ${error.message}`);
    // Show user available symbols
  } else if (error instanceof QuoteUnavailableException) {
    console.log(`❌ Can't get price: ${error.message}`);
    // Retry or try later
  } else {
    console.log(`❌ Unexpected error: ${error}`);
    // Log and report to support
  }
} finally {
  await client.close();
}
```

### Error Reference

| Exception                    | When It Happens                        | How to Handle                 |
| ---------------------------- | -------------------------------------- | ----------------------------- |
| `MarketClosedException`      | Trading outside market hours           | Wait until market opens       |
| `AccountBlockedException`    | Account is restricted                  | Contact support               |
| `InsufficientFundsException` | Not enough USDC or shares              | Add funds or reduce amount    |
| `QuoteUnavailableException`  | Can't fetch current price              | Retry after a moment          |
| `InvalidSymbolException`     | Stock symbol doesn't exist             | Check symbol spelling         |
| `Error`                      | Invalid parameters (e.g., both amounts)| Fix parameter combination     |
| `AuthenticationError`        | Wallet not KYC-verified                | Complete KYC at dotc.eth.limo |

---

## Built-in Retry Logic

The SDK automatically retries failed API requests, so you don't have to!

### How Retries Work

- **Number of Retries**: 3 attempts
- **Backoff Strategy**: Exponential (waits longer between each retry)
- **Retry Delays**: 1s, 2s, 4s
- **Automatic**: No configuration needed

### What Gets Retried?

✅ Network timeouts  
✅ Temporary API errors (5xx errors)  
✅ Rate limiting (429 errors)

❌ Invalid parameters (4xx errors) - No retry, fails immediately  
❌ Authentication failures - No retry, fails immediately

### Example Behavior

```typescript
// If API is temporarily down:
const result = await client.buy({...});
// Attempt 1: Failed (network timeout)
// Waiting 1 second...
// Attempt 2: Failed (still down)
// Waiting 2 seconds...
// Attempt 3: Success! ✅
```

You don't need to implement retry logic yourself - it's all handled automatically!

---

## Email Notifications

Get instant email confirmations for your trades!

### How to Enable

Simply provide your email address:

```typescript
const result = await client.buy({
  rwaTokenAddress: "0x1234...",
  rwaSymbol: "AAPL",
  rwaAmount: 10,
  userEmail: "you@example.com"  // ← Add your email here!
});
```

### What You'll Receive

When you provide an email, you'll get:

📧 **Order Confirmation Email** containing:

- ✅ Trade details (symbol, amount, price)
- ✅ Transaction hash (blockchain proof)
- ✅ Order ID (for tracking)
- ✅ Timestamp (when trade executed)
- ✅ Network information (which blockchain)

### Email Example

```
🎉 Your AAPL Trade is Complete!

You bought 10 shares of AAPL for $1,755.00 USDC

Order ID: abc-123-def
Transaction: 0x1234...5678
Network: Polygon
Time: Nov 13, 2025 15:30 UTC

View on blockchain: [Link]
```

> 💡 **Privacy**: Your email is only used for trade notifications. We don't send marketing emails.

---

## Complete Example

Here's a full example showing best practices:

```typescript
import {
  CrossChainAccessClient,
  MarketClosedException,
  InsufficientFundsException,
  CrossChainAccessException
} from "@swarm/cross-chain-access-sdk";

async function main() {
  /**
   * Complete example: Buy AAPL stock with error handling
   */

  // Initialize client
  const client = new CrossChainAccessClient({
    network: "polygon",
    privateKey: "0x...",  // Your KYC-verified wallet
    userEmail: "you@example.com"
  });

  await client.initialize();

  try {
    // Optional: Get current price to show user
    const quote = await client.getQuote("AAPL");
    console.log(`💰 Current AAPL Price: $${quote.rate}`);

    // Calculate estimated cost
    const shares = 10;
    const estimatedCost = shares * quote.rate;
    console.log(`📊 Estimated cost for ${shares} shares: $${estimatedCost}`);

    // In a real app, you'd confirm with the user here
    // const confirm = await getUserConfirmation();
    // if (!confirm) return;

    // Execute buy order (market hours are automatically checked)
    console.log("\n🔄 Executing buy order...");
    const result = await client.buy({
      rwaTokenAddress: "0x1234...",  // AAPL token address
      rwaSymbol: "AAPL",
      rwaAmount: shares,
      userEmail: "you@example.com"
    });

    // Show success
    console.log("\n✅ Trade Successful!");
    console.log(`📦 Bought: ${result.buyAmount} AAPL`);
    console.log(`💵 Spent: $${result.sellAmount} USDC`);
    console.log(`📈 Price: $${result.rate} per share`);
    console.log(`🔗 TX Hash: ${result.txHash}`);
    console.log(`📋 Order ID: ${result.orderId}`);
    console.log("\n📧 Check your email for confirmation!");

  } catch (error) {
    if (error instanceof MarketClosedException) {
      console.log(`❌ Market is closed: ${error.message}`);
      console.log("💡 Try again during market hours (14:30-21:00 UTC)");
    } else if (error instanceof InsufficientFundsException) {
      console.log(`❌ Insufficient funds: ${error.message}`);
      console.log("💡 Add more USDC to your wallet");
    } else if (error instanceof CrossChainAccessException) {
      console.log(`❌ Trading error: ${error.message}`);
      console.log("💡 Please try again or contact support");
    } else {
      console.log(`❌ Unexpected error: ${error}`);
      console.log("💡 Please contact support if this persists");
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
```

### Example Output

```
💰 Current AAPL Price: $175.50
📊 Estimated cost for 10 shares: $1755.00

🔄 Executing buy order...

✅ Trade Successful!
📦 Bought: 10.000000000 AAPL
💵 Spent: $1755.00 USDC
📈 Price: $175.50 per share
🔗 TX Hash: 0xabc123...def789
📋 Order ID: order_12345

📧 Check your email for confirmation!
```

---

## API Reference

For detailed technical documentation of all methods, parameters, and return types, see:

📚 **[Cross-Chain Access SDK API Reference](./cross_chain_access_sdk_references.md)**

The API reference includes:

- Complete method signatures
- Parameter descriptions
- Return type details
- Exception specifications
- Advanced usage examples

---

## Need Help?

### Resources

- 📖 **API Reference**: [cross_chain_access_sdk_references.md](./cross_chain_access_sdk_references.md)
- 🌐 **Platform**: [https://dotc.eth.limo/](https://dotc.eth.limo/)
- 💬 **Support**: Contact us through the platform
- 🐛 **Issues**: Report bugs on GitHub

### Common Questions

**Q: Why is my trade failing?**  
A: Most common reasons:

1. Market is closed (check hours)
2. Wallet not KYC-verified (complete KYC)
3. Insufficient USDC balance
4. Invalid stock symbol

**Q: Can I trade on weekends?**  
A: No, US stock market is closed on weekends. Trading hours are Monday-Friday, 14:30-21:00 UTC.

**Q: What fees are charged?**  
A: You pay:

- Blockchain gas fees (varies by network)
- Trading fees (included in the price)
- No additional SDK fees

**Q: Is my private key safe?**  
A: Your private key is used only locally to sign transactions. It's never sent to our servers. Always keep it secure!

---

## Quick Reference

### Import Statements

```typescript
import {
  CrossChainAccessClient,
  MarketClosedException,
  AccountBlockedException,
  InsufficientFundsException,
} from "@swarm/cross-chain-access-sdk";
```

### Basic Buy

```typescript
const client = new CrossChainAccessClient({
  network: "polygon",  // or "ethereum", "bsc", "base"
  privateKey: "0x...",
  userEmail: "you@example.com"
});

await client.initialize();

try {
  const result = await client.buy({
    rwaTokenAddress: "0x...",
    rwaSymbol: "AAPL",
    rwaAmount: 10,  // Simple numeric value
    userEmail: "you@example.com"
  });
} finally {
  await client.close();
}
```

### Basic Sell

```typescript
const client = new CrossChainAccessClient({
  network: "polygon",  // or "ethereum", "bsc", "base"
  privateKey: "0x...",
  userEmail: "you@example.com"
});

await client.initialize();

try {
  const result = await client.sell({
    rwaTokenAddress: "0x...",
    rwaSymbol: "AAPL",
    rwaAmount: 5,  // Simple numeric value
    userEmail: "you@example.com"
  });
} finally {
  await client.close();
}
```

---

**Happy Trading! 🚀**

_Last Updated: December 29, 2025_
