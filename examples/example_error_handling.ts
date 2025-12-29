/**
 * Example: Error handling patterns across all SDKs.
 *
 * This example demonstrates proper error handling for common scenarios
 * when using the Swarm Trading SDKs.
 */

import "dotenv/config";
import {
  TradingClient,
  RoutingStrategy,
  NoLiquidityError,
  AllPlatformsFailedError,
} from "@swarm/trading-sdk";
import {
  CrossChainAccessClient,
  MarketClosedError,
  AccountBlockedError,
  InsufficientFundsError,
} from "@swarm/cross-chain-access-sdk";
import {
  MarketMakerClient,
  NoOffersAvailableError,
} from "@swarm/market-maker-sdk";
import { Network, InsufficientBalanceError } from "@swarm/shared";

async function exampleCrossChainAccessErrors(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Cross-Chain Access SDK - Error Handling");
  console.log("=".repeat(60));
  console.log();

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const USER_EMAIL = process.env.USER_EMAIL;

  if (!PRIVATE_KEY || !USER_EMAIL) {
    console.log("❌ Skipping - missing credentials");
    return;
  }

  // Environment (dev/prod) is set via SWARM_COLLECTION_MODE env variable
  const client = new CrossChainAccessClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY,
    userEmail: USER_EMAIL,
  });

  try {
    // Error 1: Market Closed
    console.log("📍 Error 1: Market Closed");
    console.log("-".repeat(60));
    try {
      const result = await client.buy({
        rwaTokenAddress: "0x...",
        rwaSymbol: "AAPL",
        rwaAmount: 10,
        userEmail: USER_EMAIL,
      });
    } catch (e) {
      if (e instanceof MarketClosedError) {
        console.log(`✅ Caught MarketClosedError: ${e.message}`);
        console.log("   Solution: Trade during market hours (14:30-21:00 UTC)");
      } else {
        console.log(`⚠️  Other error: ${e}`);
      }
    }
    console.log();

    // Error 2: Account Blocked
    console.log("📍 Error 2: Account Blocked");
    console.log("-".repeat(60));
    try {
      const status = await client.crossChainAccessApi.getAccountStatus();
      if (status.accountBlocked) {
        throw new AccountBlockedError("Account is blocked");
      }
      console.log("✅ Account not blocked");
    } catch (e) {
      if (e instanceof AccountBlockedError) {
        console.log(`✅ Caught AccountBlockedError: ${e.message}`);
        console.log("   Solution: Contact support to unblock account");
      }
    }
    console.log();

    // Error 3: Insufficient Funds
    console.log("📍 Error 3: Insufficient Funds");
    console.log("-".repeat(60));
    try {
      const result = await client.buy({
        rwaTokenAddress: "0x...",
        rwaSymbol: "AAPL",
        usdcAmount: 1000000, // Very large amount
        userEmail: USER_EMAIL,
      });
    } catch (e) {
      if (e instanceof InsufficientFundsError) {
        console.log(`✅ Caught InsufficientFundsError: ${e.message}`);
        console.log("   Solution: Reduce trade amount or add more funds");
      } else {
        console.log(`⚠️  Other error: ${(e as Error).constructor.name}: ${e}`);
      }
    }
    console.log();
  } finally {
    await client.close();
  }
}

async function exampleMarketMakerErrors(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Market Maker SDK - Error Handling");
  console.log("=".repeat(60));
  console.log();

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPQ_API_KEY = process.env.RPQ_API_KEY;

  if (!PRIVATE_KEY || !RPQ_API_KEY) {
    console.log("❌ Skipping - missing credentials");
    return;
  }

  // Environment (dev/prod) is set via SWARM_COLLECTION_MODE env variable
  const client = new MarketMakerClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY,
    rpqApiKey: RPQ_API_KEY,
  });

  try {
    // Error 1: No Offers Available
    console.log("📍 Error 1: No Offers Available");
    console.log("-".repeat(60));
    try {
      const offers = await client.rpqClient.getOffers({
        depositToken: "0xInvalidToken",
        withdrawToken: "0xAnotherInvalid",
      });
    } catch (e) {
      if (e instanceof NoOffersAvailableError) {
        console.log(`✅ Caught NoOffersAvailableError: ${e.message}`);
        console.log(
          "   Solution: Try different token pair or create your own offer"
        );
      } else {
        console.log(`⚠️  Other error: ${(e as Error).constructor.name}: ${e}`);
      }
    }
    console.log();

    // Error 2: Insufficient Balance
    console.log("📍 Error 2: Insufficient Token Balance");
    console.log("-".repeat(60));
    try {
      // This would fail if you don't have enough tokens
      const result = await client.trade({
        fromToken: "0x...",
        toToken: "0x...",
        fromAmount: 1000000, // Very large amount
      });
    } catch (e) {
      if (e instanceof InsufficientBalanceError) {
        console.log(`✅ Caught InsufficientBalanceError: ${e.message}`);
        console.log("   Solution: Reduce trade amount or acquire more tokens");
      } else {
        console.log(`⚠️  Other error: ${(e as Error).constructor.name}: ${e}`);
      }
    }
    console.log();
  } finally {
    await client.close();
  }
}

async function exampleTradingSdkErrors(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Trading SDK - Error Handling with Fallback");
  console.log("=".repeat(60));
  console.log();

  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPQ_API_KEY = process.env.RPQ_API_KEY;
  const USER_EMAIL = process.env.USER_EMAIL;

  if (!PRIVATE_KEY || !RPQ_API_KEY || !USER_EMAIL) {
    console.log("❌ Skipping - missing credentials");
    return;
  }

  // Error 1: No Liquidity on Any Platform
  console.log("📍 Error 1: No Liquidity Exception");
  console.log("-".repeat(60));

  // Environment (dev/prod) is set via SWARM_COLLECTION_MODE env variable
  const client = new TradingClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY,
    rpqApiKey: RPQ_API_KEY,
    userEmail: USER_EMAIL,
    routingStrategy: RoutingStrategy.BEST_PRICE,
  });

  try {
    try {
      const result = await client.trade({
        fromToken: "0xInvalidToken",
        toToken: "0xAnotherInvalid",
        fromAmount: 100,
        userEmail: USER_EMAIL,
      });
    } catch (e) {
      if (e instanceof NoLiquidityError) {
        console.log(`✅ Caught NoLiquidityError: ${e.message}`);
        console.log("   Solution: Check token addresses or try later");
      } else {
        console.log(`⚠️  Other error: ${(e as Error).constructor.name}: ${e}`);
      }
    }
    console.log();

    // Error 2: All Platforms Failed
    console.log("📍 Error 2: All Platforms Failed");
    console.log("-".repeat(60));
    console.log(
      "This happens when primary platform fails and fallback also fails"
    );
    console.log();
    /*
    try {
      const result = await client.trade(...);
    } catch (e) {
      if (e instanceof AllPlatformsFailedError) {
        console.log(`✅ Caught AllPlatformsFailedError: ${e.message}`);
        console.log('   Solution: Check network connectivity or try later');
      }
    }
    */

    // Error 3: Successful Fallback
    console.log("📍 Error 3: Successful Fallback Scenario");
    console.log("-".repeat(60));
    console.log(
      "When primary platform fails, SDK automatically tries fallback:"
    );
    console.log();
    console.log("Scenario: Market closed on Cross-Chain Access");
    console.log("  1. Try Cross-Chain Access → MarketClosedException");
    console.log("  2. Automatic fallback to Market Maker");
    console.log("  3. ✅ Trade succeeds on Market Maker");
    console.log();
    console.log(
      "This happens automatically with BEST_PRICE, CROSS_CHAIN_ACCESS_FIRST,"
    );
    console.log("or MARKET_MAKER_FIRST routing strategies");
    console.log();
    console.log("⚠️  Example trade commented out for safety");
    console.log();
    /*
    const tradingClient = new TradingClient({
      network: Network.POLYGON,
      privateKey: PRIVATE_KEY,
      rpqApiKey: RPQ_API_KEY,
      userEmail: USER_EMAIL,
      routingStrategy: RoutingStrategy.BEST_PRICE,
    });
    try {
      const result = await tradingClient.trade({
        fromToken: USDC_ADDRESS,
        toToken: RWA_TOKEN_ADDRESS,
        fromAmount: 100,
        toTokenSymbol: RWA_SYMBOL,
        userEmail: USER_EMAIL,
      });
      console.log(`✅ Trade succeeded on: ${result.source}`);
    } catch (e) {
      console.log(`❌ All platforms failed: ${e}`);
    } finally {
      await tradingClient.close();
    }
    */
  } finally {
    await client.close();
  }
}

function exampleWeb3Errors(): void {
  console.log("=".repeat(60));
  console.log("Web3 - Blockchain Error Handling");
  console.log("=".repeat(60));
  console.log();

  // Error types:
  console.log("Common Web3 errors and solutions:");
  console.log("-".repeat(60));
  console.log();

  console.log("1. InsufficientBalanceError");
  console.log("   - Cause: Not enough tokens in wallet");
  console.log("   - Solution: Acquire more tokens or reduce amount");
  console.log();

  console.log("2. TransactionFailedError");
  console.log("   - Cause: Transaction reverted on-chain");
  console.log("   - Solution: Check gas, allowances, or contract state");
  console.log();

  console.log("3. InsufficientAllowanceError");
  console.log("   - Cause: Contract not approved to spend tokens");
  console.log("   - Solution: SDK auto-approves, but check approval status");
  console.log();

  console.log("4. NetworkNotSupportedError");
  console.log("   - Cause: Trying to use unsupported network");
  console.log(
    "   - Solution: Use supported networks (Ethereum, Polygon, etc.)"
  );
  console.log();
}

async function main(): Promise<void> {
  console.log();
  console.log("🔧 Swarm Trading SDKs - Error Handling Guide");
  console.log("=".repeat(60));
  console.log();

  await exampleCrossChainAccessErrors();
  console.log();

  await exampleMarketMakerErrors();
  console.log();

  await exampleTradingSdkErrors();
  console.log();

  exampleWeb3Errors();
  console.log();

  console.log("=".repeat(60));
  console.log("Error Handling Guide Complete!");
  console.log("=".repeat(60));
  console.log();
  console.log("Best Practices:");
  console.log("-".repeat(60));
  console.log("1. Always use try-catch blocks for trades");
  console.log("2. Catch specific exceptions before generic ones");
  console.log("3. Use Trading SDK for automatic fallback handling");
  console.log("4. Check market hours before Cross-Chain Access trades");
  console.log("5. Validate balances before large trades");
  console.log("6. Always call close() to clean up resources");
  console.log("=".repeat(60));
}

main().catch(console.error);
