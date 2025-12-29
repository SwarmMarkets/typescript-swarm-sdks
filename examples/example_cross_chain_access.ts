/**
 * Example: Cross-Chain Access SDK - Stock market RWA trading.
 *
 * This example demonstrates how to use the Cross-Chain Access SDK for trading
 * Real World Assets through the stock market API.
 *
 * Features shown:
 * - Check market hours and trading availability
 * - Get real-time quotes
 * - Check account status and funds
 * - Execute buy/sell trades
 */

import "dotenv/config";
import {
  CrossChainAccessClient,
  MarketHours,
} from "@swarm/cross-chain-access-sdk";
import { Network } from "@swarm/shared";

async function main(): Promise<void> {
  // Configuration
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const USER_EMAIL = process.env.USER_EMAIL;

  // Token addresses (Polygon example)
  const RWA_TOKEN_ADDRESS = "0x267fc8b95345916c9740cbc007ed65c71b052395"; // Replace with actual RWA token address
  const RWA_SYMBOL = "NVDA"; // Trading symbol

  if (!PRIVATE_KEY || !USER_EMAIL) {
    console.log(
      "❌ Please set PRIVATE_KEY and USER_EMAIL environment variables"
    );
    return;
  }

  console.log("=".repeat(60));
  console.log("Cross-Chain Access SDK Example - Stock Market RWA Trading");
  console.log("=".repeat(60));
  console.log();

  // Initialize Cross-Chain Access client
  // Environment (dev/prod) is set via SWARM_COLLECTION_MODE env variable
  const client = new CrossChainAccessClient({
    network: Network.POLYGON,
    privateKey: PRIVATE_KEY,
    userEmail: USER_EMAIL,
  });

  try {
    console.log(
      `✅ Connected to Cross-Chain Access on ${Network[Network.POLYGON]}`
    );
    console.log(`   Wallet: ${client.web3Helper.address}`);
    console.log();

    // // Example 1: Check market hours
    // console.log("🕐 Example 1: Check Market Hours");
    // console.log("-".repeat(60));
    // const { isOpen, message: statusMessage } = MarketHours.getMarketStatus();
    // console.log(`Status: ${statusMessage}`);
    // console.log(`Market is ${isOpen ? "OPEN ✅" : "CLOSED ❌"}`);
    // console.log();

    // // Example 2: Check trading availability
    // console.log("🔍 Example 2: Check Trading Availability");
    // console.log("-".repeat(60));
    // try {
    //   const { isAvailable, message } = await client.checkTradingAvailability();
    //   console.log(
    //     `Trading: ${isAvailable ? "AVAILABLE ✅" : "UNAVAILABLE ❌"}`
    //   );
    //   console.log(`Message: ${message}`);
    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Error checking availability: ${e}`);
    //   console.log();
    // }

    // // Example 3: Get account status
    // console.log("👤 Example 3: Get Account Status");
    // console.log("-".repeat(60));
    // try {
    //   const status = await client.crossChainAccessApi.getAccountStatus();
    //   console.log(`Account Status: ${status.accountStatus}`);
    //   console.log(`  Account Blocked: ${status.accountBlocked}`);
    //   console.log(`  Trading Blocked: ${status.tradingBlocked}`);
    //   console.log(`  Transfers Blocked: ${status.transfersBlocked}`);
    //   console.log(`  Market Open: ${status.marketOpen}`);
    //   // Use standalone function to check if trading is allowed
    //   const tradingAllowed =
    //     !status.accountBlocked && !status.tradingBlocked && status.marketOpen;
    //   console.log(`  Trading Allowed: ${tradingAllowed}`);
    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Error getting account status: ${e}`);
    //   console.log();
    // }

    // // Example 4: Get account funds
    // console.log("💵 Example 4: Get Account Funds");
    // console.log("-".repeat(60));
    // try {
    //   const funds = await client.crossChainAccessApi.getAccountFunds();
    //   console.log(`Cash: $${funds.cash}`);
    //   console.log(`Buying Power: $${funds.buyingPower}`);
    //   console.log(`Day Trading Buying Power: $${funds.dayTradingBuyingPower}`);
    //   console.log(`Effective Buying Power: $${funds.effectiveBuyingPower}`);
    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Error getting funds: ${e}`);
    //   console.log();
    // }

    // // Example 5: Get real-time quote
    // console.log("💰 Example 5: Get Real-Time Quote");
    // console.log("-".repeat(60));
    // try {
    //   const quote = await client.getQuote(RWA_SYMBOL);
    //   console.log(`Quote for ${RWA_SYMBOL}:`);
    //   console.log(`  Bid: $${quote.rate} (to sell)`);
    //   console.log(`  Ask: $${quote.rate} (to buy)`);
    //   console.log(`  Source: ${quote.source}`);
    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Error getting quote: ${e}`);
    //   console.log();
    // }

    // Example 6: Buy RWA tokens on the same chain
    // console.log("🛒 Example 6: Buy RWA Tokens (Same Chain)");
    // console.log("-".repeat(60));
    // console.log("⚠️  Trade execution commented out for safety");
    // console.log("    Uncomment the code below to execute a real trade");
    // console.log();

    try {
      const result = await client.buy({
        rwaTokenAddress: RWA_TOKEN_ADDRESS,
        rwaSymbol: RWA_SYMBOL,
        usdcAmount: 1, // Spend 1 USDC
        userEmail: USER_EMAIL,
      });

      console.log("✅ Buy order successful!");
      console.log(`   TX Hash: ${result.txHash}`);
      console.log(`   Order ID: ${result.orderId}`);
      console.log(`   Bought: ${result.buyAmount} ${RWA_SYMBOL}`);
      console.log(`   Spent: ${result.sellAmount} USDC`);
      console.log(`   Price: $${result.rate}`);
      console.log();
    } catch (e) {
      console.log(`❌ Buy order failed: ${e}`);
    }

    // // Example 7: Buy RWA tokens cross-chain
    // console.log("🌉 Example 7: Buy RWA Tokens (Cross-Chain)");
    // console.log("-".repeat(60));
    // console.log("Buy tokens on a different chain than your current network");
    // console.log(
    //   "For example: Pay with USDC on Polygon, receive tokens on Ethereum"
    // );
    // console.log();
    // console.log("⚠️  Trade execution commented out for safety");
    // console.log("    Uncomment the code below to execute a real trade");
    // console.log();
    // /*
    // try {
    //   // Example: Buy RWA on Ethereum (chain ID 1) while connected to Polygon
    //   const result = await client.buy({
    //     rwaTokenAddress: RWA_TOKEN_ADDRESS,
    //     rwaSymbol: RWA_SYMBOL,
    //     usdcAmount: 10, // Spend 10 USDC on Polygon
    //     userEmail: USER_EMAIL,
    //     targetChainId: 1, // Receive tokens on Ethereum mainnet
    //   });

    //   console.log('✅ Cross-chain buy order successful!');
    //   console.log(`   TX Hash: ${result.txHash}`);
    //   console.log(`   Order ID: ${result.orderId}`);
    //   console.log(`   Bought: ${result.buyAmount} ${RWA_SYMBOL} (on Ethereum)`);
    //   console.log(`   Spent: ${result.sellAmount} USDC (from Polygon)`);
    //   console.log(`   Price: $${result.rate}`);
    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Cross-chain buy order failed: ${e}`);
    // }
    // */

    // // Example 8: Sell RWA tokens
    // console.log("💸 Example 8: Sell RWA Tokens");
    // console.log("-".repeat(60));
    // console.log("⚠️  Trade execution commented out for safety");
    // console.log("    Uncomment the code below to execute a real trade");
    // console.log();
    // /*
    // try {
    //   const result = await client.sell({
    //     rwaTokenAddress: RWA_TOKEN_ADDRESS,
    //     rwaSymbol: RWA_SYMBOL,
    //     rwaAmount: 10, // Sell 10 tokens
    //     userEmail: USER_EMAIL,
    //   });

    //   console.log('✅ Sell order successful!');
    //   console.log(`   TX Hash: ${result.txHash}`);
    //   console.log(`   Order ID: ${result.orderId}`);
    //   console.log(`   Sold: ${result.sellAmount} ${RWA_SYMBOL}`);
    //   console.log(`   Received: ${result.buyAmount} USDC`);
    //   console.log(`   Price: $${result.rate}`);
    //   console.log();
    // } catch (e) {
    //   console.log(`❌ Sell order failed: ${e}`);
    // }
    // */

    // console.log("=".repeat(60));
    // console.log("Example completed!");
    // console.log("=".repeat(60));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
