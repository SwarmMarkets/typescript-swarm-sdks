/**
 * Example: Market Maker SDK - Decentralized OTC trading.
 *
 * This example demonstrates how to use the Market Maker SDK for peer-to-peer
 * RWA trading through smart contracts and the RPQ API.
 *
 * Features shown:
 * - Get available offers
 * - Get best offers for a token pair
 * - Get quotes
 * - Execute trades
 * - Make your own offers
 * - Cancel offers
 */

import "dotenv/config";
import { MarketMakerClient } from "@swarm/market-maker-sdk";
import { Network } from "@swarm/shared";

async function main(): Promise<void> {
  // Configuration
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPQ_API_KEY = process.env.RPQ_API_KEY;
  const USER_EMAIL = process.env.USER_EMAIL ?? "user@example.com";

  // Token addresses (Polygon example)
  const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // USDC on Polygon
  const RWA_TOKEN_ADDRESS = "0x267fc8b95345916c9740cbc007ed65c71b052395"; // Replace with actual RWA token address

  if (!PRIVATE_KEY || !RPQ_API_KEY) {
    console.log(
      "❌ Please set PRIVATE_KEY and RPQ_API_KEY environment variables"
    );
    return;
  }

  console.log("=".repeat(60));
  console.log("Market Maker SDK Example - Decentralized OTC Trading");
  console.log("=".repeat(60));
  console.log();

  // Initialize Market Maker client
  // Environment (dev/prod) is set via SWARM_COLLECTION_MODE env variable
  const client = new MarketMakerClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY as `0x${string}`,
    rpqApiKey: RPQ_API_KEY,
    userEmail: USER_EMAIL,
  });

  try {
    // Initialize the client (authenticates with Swarm platform)
    await client.initialize();

    console.log(`✅ Connected to Market Maker on ${Network[Network.POLYGON]}`);
    console.log(`   Wallet: ${client.web3Client.address}`);
    console.log();

    /*
    // Example 1: Get all available offers
    console.log("📋 Example 1: Get Available Offers");
    console.log("-".repeat(60));
    try {
      const offers = await client.rpqClient.getOffers(
        RWA_TOKEN_ADDRESS, // buyAssetAddress
        USDC_ADDRESS, // sellAssetAddress
        0, // page
        5 // limit
      );

      console.log(`Found ${offers.length} offers:`);
      offers.forEach((offer, i) => {
        console.log(`  ${i + 1}. Offer ID: ${offer.id}`);
        console.log(
          `     Deposit: ${offer.amountIn} ${offer.depositAsset.symbol}`
        );
        console.log(
          `     Receive: ${offer.amountOut} ${offer.withdrawalAsset.symbol}`
        );
        console.log(`     Type: ${offer.offerType}`);
        console.log(`     Status: ${offer.offerStatus}`);
        console.log(`     Available: ${offer.availableAmount}`);
        console.log();
      });
    } catch (e) {
      console.log(`❌ Error getting offers: ${e}`);
    }
    console.log();

    // Example 2: Get best offers
    console.log("🎯 Example 2: Get Best Offers");
    console.log("-".repeat(60));
    try {
      const bestOffers = await client.rpqClient.getBestOffers(
        RWA_TOKEN_ADDRESS, // buyAssetAddress
        USDC_ADDRESS, // sellAssetAddress
        "1" // targetSellAmount - Want to sell 1 USDC
      );

      console.log("Best offers to buy RWA with 1 USDC:");
      console.log(`  Success: ${bestOffers.result.success}`);
      console.log(`  Target amount: ${bestOffers.result.targetAmount}`);
      console.log(
        `  Total taken: ${bestOffers.result.totalWithdrawalAmountPaid}`
      );
      console.log(`  Mode: ${bestOffers.result.mode}`);
      console.log(
        `  Selected offers: ${bestOffers.result.selectedOffers.length}`
      );

      bestOffers.result.selectedOffers.forEach((offer, i) => {
        console.log(`\n  Offer ${i + 1}:`);
        console.log(`    ID: ${offer.id}`);
        console.log(`    Taken amount: ${offer.withdrawalAmountPaid}`);
        console.log(`    Price per unit: ${offer.pricePerUnit}`);
        console.log(`    Type: ${offer.offerType}`);
      });
      console.log();
    } catch (e) {
      console.log(`❌ Error getting best offers: ${e}`);
    }
    console.log();

    // Example 3: Get a quote
    console.log("💰 Example 3: Get Quote");
    console.log("-".repeat(60));
    try {
      const quote = await client.getQuote(USDC_ADDRESS, RWA_TOKEN_ADDRESS, 1); // Spend 1 USDC

      console.log("Quote for 1 USDC:");
      console.log(`  You will receive: ${quote.buyAmount} RWA tokens`);
      console.log(`  Rate: ${quote.rate}`);
      console.log(`  Source: ${quote.source}`);
      console.log();
    } catch (e) {
      console.log(`❌ Error getting quote: ${e}`);
    }
    console.log();
    */

    // Example 4: Execute a trade
    console.log("🔄 Example 4: Execute Trade");
    console.log("-".repeat(60));
    try {
      const result = await client.trade({
        fromToken: USDC_ADDRESS,
        toToken: RWA_TOKEN_ADDRESS,
        fromAmount: 0.01, // Spend 0.01 USDC
      });

      console.log("✅ Trade successful!");
      console.log(`   TX Hash: ${result.txHash}`);
      console.log(`   Order ID: ${result.orderId}`);
      console.log(`   Sold: ${result.sellAmount} USDC`);
      console.log(`   Bought: ${result.buyAmount} RWA`);
      console.log();
    } catch (e) {
      console.log(`❌ Trade failed: ${e}`);
    }

    /*
    // Example 5: Make your own offer (commented out for safety)
    console.log("📝 Example 5: Make Your Own Offer");
    console.log("-".repeat(60));
    console.log("⚠️  Offer creation commented out for safety");
    console.log("    Uncomment the code below to create a real offer");
    console.log();
    try {
      const result = await client.makeOffer({
        sellToken: RWA_TOKEN_ADDRESS,
        sellAmount: 10,
        buyToken: USDC_ADDRESS,
        buyAmount: 1000,
        isDynamic: false,
      });

      console.log('✅ Offer created!');
      console.log(`   TX Hash: ${result.txHash}`);
      console.log(`   Offer ID: ${result.orderId}`);
      console.log(`   Selling: ${result.sellAmount} RWA`);
      console.log(`   For: ${result.buyAmount} USDC`);
      console.log(`   Rate: ${result.rate}`);
      console.log();
    } catch (e) {
      console.log(`❌ Offer creation failed: ${e}`);
    }

    // Example 6: Get price feeds for dynamic offers
    console.log("📊 Example 6: Get Price Feeds");
    console.log("-".repeat(60));
    try {
      const feeds = await client.rpqClient.getPriceFeeds();

      console.log(`Found ${Object.keys(feeds.priceFeeds).length} price feeds:`);
      // Show first 5 feeds
      const entries = Object.entries(feeds.priceFeeds).slice(0, 5);
      entries.forEach(([contractAddr, feedAddr], i) => {
        console.log(`  ${i + 1}. Contract: ${contractAddr.slice(0, 10)}...`);
        console.log(`     Feed: ${(feedAddr as string).slice(0, 10)}...`);
      });
      console.log();
    } catch (e) {
      console.log(`❌ Error getting price feeds: ${e}`);
    }
    console.log();
    */

    console.log("=".repeat(60));
    console.log("Example completed!");
    console.log("=".repeat(60));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
