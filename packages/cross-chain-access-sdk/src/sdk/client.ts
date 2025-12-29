/**
 * Core Cross-Chain Access SDK for stock market trading.
 */

import type { Address, Hash } from "viem";

import {
  Network,
  getNetworkName,
  getIsDev,
  type Quote,
  type TradeResult,
  createTradeResult,
  SwarmAuth,
  Web3Helper,
  USDC_ADDRESSES,
  getConfigFetcher,
  closeConfigFetchers,
} from "@swarm/shared";

import {
  CrossChainAccessAPIClient,
  OrderSide,
  getPriceForSide,
  isTradingAllowed,
  hasSufficientFunds,
  MarketClosedException,
  AccountBlockedException,
  InsufficientFundsException,
  type CrossChainAccessQuote,
  type AccountStatus,
  type AccountFunds,
} from "../crossChainAccess/index.js";

import { MarketHours, getMarketStatus } from "../marketHours/index.js";

/** Token decimals for rounding */
const RWA_DECIMALS = 9;
const USDC_DECIMALS = 2;

/**
 * Options for CrossChainAccessClient initialization.
 */
export interface CrossChainAccessClientOptions {
  /** Network to trade on */
  network: Network;
  /** Private key for signing transactions */
  privateKey: `0x${string}`;
  /** Optional email for authentication */
  userEmail?: string;
  /** Optional custom RPC URL */
  rpcUrl?: string;
}

/**
 * Unified Cross-Chain Access trading client for stock market RWAs.
 *
 * This is the main entry point for Cross-Chain Access stock trading. It orchestrates:
 * 1. Authentication via SwarmAuth
 * 2. Market hours and account status validation
 * 3. Quote retrieval and amount calculation with slippage
 * 4. On-chain token transfers via Web3Helper
 * 5. Off-chain order submission via CrossChainAccessAPIClient
 *
 * Environment (dev/prod) is controlled via SWARM_COLLECTION_MODE env variable.
 *
 * @example
 * ```typescript
 * const client = new CrossChainAccessClient({
 *   network: Network.POLYGON,
 *   privateKey: '0x...',
 *   userEmail: 'user@example.com',
 * });
 *
 * await client.authenticate();
 *
 * const result = await client.buy({
 *   rwaTokenAddress: '0xRWA...',
 *   rwaSymbol: 'AAPL',
 *   rwaAmount: 10,
 *   userEmail: 'user@example.com',
 * });
 *
 * await client.close();
 * ```
 */
export class CrossChainAccessClient {
  /** Slippage protection (1%) */
  static readonly SLIPPAGE_PERCENTAGE = 0.01;

  readonly network: Network;
  readonly crossChainAccessApi: CrossChainAccessAPIClient;
  readonly web3Helper: Web3Helper;
  readonly auth: SwarmAuth;
  readonly usdcAddress: Address;
  readonly userEmail?: string;

  private readonly privateKey: `0x${string}`;
  private topupAddress?: Address;
  private initialized: boolean = false;

  constructor(options: CrossChainAccessClientOptions) {
    this.network = options.network;
    this.userEmail = options.userEmail;
    this.privateKey = options.privateKey;

    // Initialize API client
    this.crossChainAccessApi = new CrossChainAccessAPIClient();

    // Initialize Web3 helper
    this.web3Helper = new Web3Helper(
      options.privateKey,
      options.network,
      options.rpcUrl
    );

    // Initialize auth
    this.auth = new SwarmAuth();

    // Get USDC address for this network
    const usdcAddress = USDC_ADDRESSES[options.network];
    if (!usdcAddress) {
      throw new Error(
        `USDC not available on ${getNetworkName(options.network)}`
      );
    }
    this.usdcAddress = usdcAddress as Address;

    console.log(
      `Initialized Cross-Chain Access client for ${getNetworkName(
        options.network
      )} ` +
        `(${getIsDev() ? "dev" : "prod"} mode) ` +
        `with account ${this.web3Helper.address}`
    );
    console.log(`USDC address: ${this.usdcAddress}`);
  }

  /**
   * Authenticate with Swarm platform.
   *
   * Uses the wallet's private key to sign authentication message.
   * Sets the auth token for subsequent API calls.
   */
  async authenticate(): Promise<void> {
    console.log("Authenticating with Swarm platform");

    const tokens = await this.auth.verify(this.privateKey);
    this.crossChainAccessApi.setAuthToken(tokens.accessToken);

    console.log("Successfully authenticated with Swarm platform");
  }

  /**
   * Load topup address from remote configuration.
   */
  private async loadTopupAddress(): Promise<void> {
    if (!this.topupAddress) {
      const fetcher = await getConfigFetcher(getIsDev());
      this.topupAddress = fetcher.getTopupAddress() as Address;
      console.log(`Topup address loaded: ${this.topupAddress}`);
    }
  }

  /**
   * Initialize the client (authenticate and load configuration).
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.authenticate();
      await this.loadTopupAddress();
      this.initialized = true;
    }
  }

  /**
   * Close all clients and cleanup resources.
   */
  async close(): Promise<void> {
    await this.crossChainAccessApi.close();
    await closeConfigFetchers();
    console.log("Cross-Chain Access client closed");
  }

  /**
   * Check if trading is currently available.
   *
   * Checks:
   * - Market hours (14:30-21:00 UTC, weekdays)
   * - Account status (not blocked)
   * - Market status (open)
   *
   * @returns Tuple of [isAvailable, message]
   */
  async checkTradingAvailability(): Promise<[boolean, string]> {
    // Ensure authentication
    if (!this.initialized) {
      await this.initialize();
    }

    // Check market hours
    const marketStatus = getMarketStatus();
    if (!marketStatus.isOpen) {
      return [false, marketStatus.message];
    }

    // Check account status
    try {
      const status = await this.crossChainAccessApi.getAccountStatus();

      if (!isTradingAllowed(status)) {
        const reasons: string[] = [];
        if (status.accountBlocked) reasons.push("account blocked");
        if (status.tradingBlocked) reasons.push("trading blocked");
        if (status.transfersBlocked) reasons.push("transfers blocked");
        if (status.tradeSuspendedByUser) reasons.push("suspended by user");
        if (!status.marketOpen) reasons.push("market closed");

        return [false, `Trading not available: ${reasons.join(", ")}`];
      }

      return [true, "Trading is available"];
    } catch (error) {
      console.error("Failed to check account status:", error);
      return [false, `Failed to check account status: ${error}`];
    }
  }

  /**
   * Get real-time quote for a symbol.
   *
   * Returns quote in unified SDK format for compatibility with other SDKs.
   *
   * @param rwaSymbol - Trading symbol (e.g., "AAPL")
   */
  async getQuote(rwaSymbol: string): Promise<Quote> {
    const crossChainAccessQuote = await this.crossChainAccessApi.getAssetQuote(
      rwaSymbol
    );

    // Convert to SDK Quote format
    return {
      sellTokenAddress: this.usdcAddress,
      sellAmount: 1,
      buyTokenAddress: rwaSymbol, // Symbol as placeholder
      buyAmount: 1 / crossChainAccessQuote.askPrice,
      rate: crossChainAccessQuote.askPrice,
      source: "cross_chain_access",
      timestamp: new Date(),
    };
  }

  /**
   * Buy RWA tokens with USDC via Cross-Chain Access stock market.
   *
   * Provide either rwaAmount OR usdcAmount, not both.
   */
  async buy(params: {
    rwaTokenAddress: string;
    rwaSymbol: string;
    userEmail: string;
    rwaAmount?: number;
    usdcAmount?: number;
    targetChainId?: number;
  }): Promise<TradeResult> {
    // Validate amounts
    if (
      (params.rwaAmount !== undefined && params.usdcAmount !== undefined) ||
      (params.rwaAmount === undefined && params.usdcAmount === undefined)
    ) {
      throw new Error("Must provide either rwaAmount OR usdcAmount, not both");
    }

    return this.executeTrade({
      rwaTokenAddress: params.rwaTokenAddress,
      rwaSymbol: params.rwaSymbol,
      rwaAmount: params.rwaAmount,
      usdcAmount: params.usdcAmount,
      orderSide: OrderSide.BUY,
      userEmail: params.userEmail,
      targetChainId: params.targetChainId,
    });
  }

  /**
   * Sell RWA tokens for USDC via Cross-Chain Access stock market.
   *
   * Provide either rwaAmount OR usdcAmount, not both.
   */
  async sell(params: {
    rwaTokenAddress: string;
    rwaSymbol: string;
    userEmail: string;
    rwaAmount?: number;
    usdcAmount?: number;
    targetChainId?: number;
  }): Promise<TradeResult> {
    // Validate amounts
    if (
      (params.rwaAmount !== undefined && params.usdcAmount !== undefined) ||
      (params.rwaAmount === undefined && params.usdcAmount === undefined)
    ) {
      throw new Error("Must provide either rwaAmount OR usdcAmount, not both");
    }

    return this.executeTrade({
      rwaTokenAddress: params.rwaTokenAddress,
      rwaSymbol: params.rwaSymbol,
      rwaAmount: params.rwaAmount,
      usdcAmount: params.usdcAmount,
      orderSide: OrderSide.SELL,
      userEmail: params.userEmail,
      targetChainId: params.targetChainId,
    });
  }

  /**
   * Execute a trade (internal method).
   */
  private async executeTrade(params: {
    rwaTokenAddress: string;
    rwaSymbol: string;
    rwaAmount?: number;
    usdcAmount?: number;
    orderSide: OrderSide;
    userEmail: string;
    targetChainId?: number;
  }): Promise<TradeResult> {
    console.log(`Starting ${params.orderSide} trade for ${params.rwaSymbol}`);

    // Step 0: Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }

    // Step 1: Check trading availability
    const [isAvailable, message] = await this.checkTradingAvailability();
    if (!isAvailable) {
      if (
        message.toLowerCase().includes("market") ||
        message.toLowerCase().includes("closed")
      ) {
        throw new MarketClosedException(message);
      } else {
        throw new AccountBlockedException(message);
      }
    }

    // Step 2: Get real-time quote
    console.log(`Getting quote for ${params.rwaSymbol}`);
    const crossChainAccessQuote = await this.crossChainAccessApi.getAssetQuote(
      params.rwaSymbol
    );
    const price = getPriceForSide(crossChainAccessQuote, params.orderSide);
    console.log(`Quote price: $${price}`);

    // Step 3: Calculate amounts
    let finalRwa: number;
    let finalUsdc: number;

    if (params.orderSide === OrderSide.BUY) {
      if (params.rwaAmount !== undefined) {
        finalUsdc = params.rwaAmount * price;
        finalRwa = params.rwaAmount;
      } else {
        finalRwa = params.usdcAmount! / price;
        finalUsdc = params.usdcAmount!;
      }
    } else {
      if (params.rwaAmount !== undefined) {
        finalUsdc = params.rwaAmount * price;
        finalRwa = params.rwaAmount;
      } else {
        finalRwa = params.usdcAmount! / price;
        finalUsdc = params.usdcAmount!;
      }
    }

    // Round amounts to proper decimal places
    finalRwa = Number(finalRwa.toFixed(RWA_DECIMALS));
    finalUsdc = Number(finalUsdc.toFixed(USDC_DECIMALS));

    console.log(`Calculated amounts - RWA: ${finalRwa}, USDC: ${finalUsdc}`);

    // Step 4: Check funds/balance
    let transferToken: Address;
    let transferAmount: number;

    if (params.orderSide === OrderSide.BUY) {
      // Check buying power
      const funds = await this.crossChainAccessApi.getAccountFunds();
      if (!hasSufficientFunds(funds, finalUsdc)) {
        throw new InsufficientFundsException(
          `Insufficient buying power: need $${finalUsdc}, have $${funds.buyingPower}`
        );
      }
      console.log(`Buying power check passed: $${funds.buyingPower}`);

      transferToken = this.usdcAddress;
      transferAmount = finalUsdc;
    } else {
      // Check RWA balance
      const rwaBalance = await this.web3Helper.getBalance(
        params.rwaTokenAddress as Address
      );
      if (rwaBalance < finalRwa) {
        throw new InsufficientFundsException(
          `Insufficient RWA balance: need ${finalRwa}, have ${rwaBalance}`
        );
      }
      console.log(`RWA balance check passed: ${rwaBalance}`);

      transferToken = params.rwaTokenAddress as Address;
      transferAmount = finalRwa;
    }

    // Step 5: Ensure topup address is loaded
    if (!this.topupAddress) {
      await this.loadTopupAddress();
    }

    // Step 6: Transfer tokens to topup address
    console.log(
      `Transferring ${transferAmount} tokens to ${this.topupAddress}`
    );
    const txHash = await this.web3Helper.transferToken(
      this.topupAddress!,
      transferToken,
      transferAmount
    );
    console.log(`Transfer successful: ${txHash}`);

    // Step 7: Create trading order
    console.log("Creating trading order");
    const orderResponse = await this.crossChainAccessApi.createOrder({
      wallet: this.web3Helper.address,
      txHash,
      assetAddress: params.rwaTokenAddress,
      assetSymbol: params.rwaSymbol,
      side: params.orderSide,
      price,
      qty: finalRwa,
      notional: finalUsdc,
      chainId: this.network,
      userEmail: params.userEmail,
      targetChainId: params.targetChainId,
    });

    console.log(`Order created: ${orderResponse.orderId}`);

    // Step 8: Return result
    return createTradeResult({
      txHash,
      orderId: orderResponse.orderId,
      sellTokenAddress: transferToken,
      sellAmount: transferAmount,
      buyTokenAddress:
        params.orderSide === OrderSide.BUY
          ? params.rwaTokenAddress
          : this.usdcAddress,
      buyAmount: params.orderSide === OrderSide.BUY ? finalRwa : finalUsdc,
      rate: price,
      source: "cross_chain_access",
      timestamp: new Date(),
      network: this.network,
    });
  }
}
