/**
 * Example: Trading SDK - Unified multi-platform trading with smart routing.
 *
 * This example demonstrates how to use the Trading SDK to automatically
 * choose the best platform (Market Maker or Cross-Chain Access) for your trades.
 *
 * Features shown:
 * - Get quotes from all platforms
 * - Compare prices across platforms
 * - Execute trades with smart routing
 * - Use different routing strategies
 * - Handle fallback scenarios
 *
 * Usage:
 *   PRIVATE_KEY=0x... RPQ_API_KEY=... USER_EMAIL=... npx ts-node example_trading.ts
 */

import "dotenv/config";
import { TradingClient, RoutingStrategy, Network } from "@swarm/trading-sdk";

async function main() {
  // Configuration from environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
  const RPQ_API_KEY = process.env.RPQ_API_KEY;
  const USER_EMAIL = process.env.USER_EMAIL;

  // Token addresses (Polygon example)
  const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // USDC on Polygon
  const RWA_TOKEN_ADDRESS = "0x267fc8b95345916c9740cbc007ed65c71b052395"; // Replace with actual RWA token address
  const RWA_SYMBOL = "NVDA";

  if (!PRIVATE_KEY || !RPQ_API_KEY || !USER_EMAIL) {
    console.log(
      "❌ Please set PRIVATE_KEY, RPQ_API_KEY, and USER_EMAIL environment variables"
    );
    return;
  }

  console.log("=".repeat(60));
  console.log("Trading SDK Example - Unified Multi-Platform Trading");
  console.log("=".repeat(60));
  console.log();

  // Example 1: BEST_PRICE strategy (default)
  // console.log("🎯 Example 1: BEST_PRICE Strategy (Default)");
  // console.log("-".repeat(60));
  // console.log("Automatically selects platform with best price");
  // console.log();

  // Environment (dev/prod) is set via SWARM_COLLECTION_MODE env variable
  const client1 = new TradingClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY,
    rpqApiKey: RPQ_API_KEY,
    userEmail: USER_EMAIL,
    routingStrategy: RoutingStrategy.BEST_PRICE,
  });

  try {
    await client1.initialize();
    // console.log(`✅ Connected to Trading SDK on POLYGON`);
    // console.log();

    // Get quotes from all platforms
    // console.log("📊 Getting quotes from all platforms...");
    // try {
    //   const quotes = await client1.getQuotes({
    //     fromToken: USDC_ADDRESS,
    //     toToken: RWA_TOKEN_ADDRESS,
    //     toTokenSymbol: RWA_SYMBOL,
    //     fromAmount: 1,
    //   });

    //   console.log();
    //   console.log("Quote Comparison:");
    //   console.log("-".repeat(40));

    //   if (quotes.market_maker) {
    //     const marketMakerRate = quotes.market_maker.rate;
    //     console.log(`Market Maker:       $${marketMakerRate} per token`);
    //   } else {
    //     console.log(`Market Maker:       ❌ Not available`);
    //   }

    //   if (quotes.cross_chain_access) {
    //     const crossChainAccessRate = quotes.cross_chain_access.rate;
    //     console.log(`Cross-Chain Access: $${crossChainAccessRate} per token`);
    //   } else {
    //     console.log(`Cross-Chain Access: ❌ Not available`);
    //   }

    //   console.log();

    //   // Determine which is better
    //   if (quotes.market_maker && quotes.cross_chain_access) {
    //     if (quotes.market_maker.rate < quotes.cross_chain_access.rate) {
    //       console.log("🏆 Best price: Market Maker (lower cost per token)");
    //     } else {
    //       console.log(
    //         "🏆 Best price: Cross-Chain Access (lower cost per token)"
    //       );
    //     }
    //   } else if (quotes.market_maker) {
    //     console.log("🏆 Only Market Maker available");
    //   } else if (quotes.cross_chain_access) {
    //     console.log("🏆 Only Cross-Chain Access available");
    //   } else {
    //     console.log("❌ No platforms available");
    //   }

    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Error getting quotes: ${e}`);
    //   console.log();
    // }

    // Execute trade with smart routing (commented out for safety)
    // console.log("🔄 Execute Trade with Smart Routing");
    // console.log("-".repeat(60));
    // console.log("⚠️  Trade execution commented out for safety");
    // console.log("    SDK will automatically:");
    // console.log("    1. Get quotes from both platforms");
    // console.log("    2. Select platform with best price");
    // console.log("    3. Execute trade on selected platform");
    // console.log("    4. Fallback to alternative if primary fails");
    // console.log();

    try {
      const result = await client1.trade({
        fromToken: USDC_ADDRESS,
        toToken: RWA_TOKEN_ADDRESS,
        fromAmount: 1,
        toTokenSymbol: RWA_SYMBOL,
        userEmail: USER_EMAIL,
      });

      console.log(`✅ Trade successful!`);
      console.log(`   Platform: Automatically selected`);
      console.log(`   TX Hash: ${result.txHash}`);
      console.log(`   From: ${result.sellAmount} USDC`);
      console.log(`   To: ${result.buyAmount} ${RWA_SYMBOL}`);
      console.log(`   Rate: $${result.rate}`);
      console.log();
    } catch (e) {
      console.log(`❌ Trade failed: ${e}`);
    }
  } finally {
    await client1.close();
  }

  // console.log();

  // // Example 2: CROSS_CHAIN_ACCESS_FIRST strategy
  // console.log("🏦 Example 2: CROSS_CHAIN_ACCESS_FIRST Strategy");
  // console.log("-".repeat(60));
  // console.log(
  //   "Try Cross-Chain Access first, fallback to Market Maker if unavailable"
  // );
  // console.log();

  // const client2 = new TradingClient({
  //   network: Network.POLYGON,
  //   privateKey: PRIVATE_KEY,
  //   rpqApiKey: RPQ_API_KEY,
  //   userEmail: USER_EMAIL,
  //   routingStrategy: RoutingStrategy.CROSS_CHAIN_ACCESS_FIRST,
  // });

  // try {
  //   await client2.initialize();
  //   console.log("✅ Routing: CROSS_CHAIN_ACCESS_FIRST");
  //   console.log("   - Primary: Cross-Chain Access");
  //   console.log("   - Fallback: Market Maker");
  //   console.log();
  //   console.log("⚠️  Trade execution commented out for safety");
  //   console.log();

  //   /*
  //   try {
  //     const result = await client2.trade({
  //       fromToken: USDC_ADDRESS,
  //       toToken: RWA_TOKEN_ADDRESS,
  //       fromAmount: 1,
  //       toTokenSymbol: RWA_SYMBOL,
  //       userEmail: USER_EMAIL,
  //     });
  //     console.log(`✅ Trade executed`);
  //   } catch (e) {
  //     console.log(`❌ Trade failed: ${e}`);
  //   }
  //   */
  // } finally {
  //   await client2.close();
  // }

  // console.log();

  // // Example 3: MARKET_MAKER_FIRST strategy
  // console.log("🔗 Example 3: MARKET_MAKER_FIRST Strategy");
  // console.log("-".repeat(60));
  // console.log(
  //   "Try Market Maker first, fallback to Cross-Chain Access if unavailable"
  // );
  // console.log();

  // const client3 = new TradingClient({
  //   network: Network.POLYGON,
  //   privateKey: PRIVATE_KEY,
  //   rpqApiKey: RPQ_API_KEY,
  //   userEmail: USER_EMAIL,
  //   routingStrategy: RoutingStrategy.MARKET_MAKER_FIRST,
  // });

  // try {
  //   await client3.initialize();
  //   console.log("✅ Routing: MARKET_MAKER_FIRST");
  //   console.log("   - Primary: Market Maker");
  //   console.log("   - Fallback: Cross-Chain Access");
  //   console.log();
  // } finally {
  //   await client3.close();
  // }

  // console.log();

  // // Example 4: CROSS_CHAIN_ACCESS_ONLY strategy
  // console.log("🏦 Example 4: CROSS_CHAIN_ACCESS_ONLY Strategy");
  // console.log("-".repeat(60));
  // console.log("Only use Cross-Chain Access, fail if unavailable");
  // console.log();

  // const client4 = new TradingClient({
  //   network: Network.POLYGON,
  //   privateKey: PRIVATE_KEY,
  //   rpqApiKey: RPQ_API_KEY,
  //   userEmail: USER_EMAIL,
  //   routingStrategy: RoutingStrategy.CROSS_CHAIN_ACCESS_ONLY,
  // });

  // try {
  //   await client4.initialize();
  //   console.log("✅ Routing: CROSS_CHAIN_ACCESS_ONLY");
  //   console.log("   - No fallback");
  //   console.log("   - Requires market hours");
  //   console.log();
  // } finally {
  //   await client4.close();
  // }

  // console.log();

  // // Example 5: MARKET_MAKER_ONLY strategy
  // console.log("🔗 Example 5: MARKET_MAKER_ONLY Strategy");
  // console.log("-".repeat(60));
  // console.log("Only use Market Maker, fail if unavailable");
  // console.log();

  // const client5 = new TradingClient({
  //   network: Network.POLYGON,
  //   privateKey: PRIVATE_KEY,
  //   rpqApiKey: RPQ_API_KEY,
  //   userEmail: USER_EMAIL,
  //   routingStrategy: RoutingStrategy.MARKET_MAKER_ONLY,
  // });

  // try {
  //   await client5.initialize();
  //   console.log("✅ Routing: MARKET_MAKER_ONLY");
  //   console.log("   - No fallback");
  //   console.log("   - 24/7 availability");
  //   console.log();
  // } finally {
  //   await client5.close();
  // }

  // console.log();
  // console.log("=".repeat(60));
  // console.log("Example completed!");
  // console.log("=".repeat(60));
  // console.log();
  // console.log("Summary of Routing Strategies:");
  // console.log("-".repeat(60));
  // console.log(
  //   "BEST_PRICE                   - Automatic price comparison (recommended)"
  // );
  // console.log(
  //   "CROSS_CHAIN_ACCESS_FIRST     - Prefer Cross-Chain Access, fallback to Market Maker"
  // );
  // console.log(
  //   "MARKET_MAKER_FIRST           - Prefer Market Maker, fallback to Cross-Chain Access"
  // );
  // console.log(
  //   "CROSS_CHAIN_ACCESS_ONLY      - Only Cross-Chain Access (market hours required)"
  // );
  // console.log(
  //   "MARKET_MAKER_ONLY            - Only Market Maker (24/7 availability)"
  // );
  // console.log("=".repeat(60));
}

main().catch(console.error);
