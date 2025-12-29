/**
 * Core Market Maker SDK combining RPQ Service and Web3 operations.
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
  closeConfigFetchers,
} from "@swarm/shared";

import {
  RPQClient,
  PricingType,
  NoOffersAvailableException,
} from "../rpqService/index.js";
import {
  MarketMakerWeb3Client,
  MarketMakerWeb3Exception,
} from "../marketMakerWeb3/index.js";

/**
 * Options for MarketMakerClient initialization.
 */
export interface MarketMakerClientOptions {
  /** Network to trade on */
  network: Network;
  /** Private key for signing transactions */
  privateKey: `0x${string}`;
  /** API key for RPQ Service */
  rpqApiKey: string;
  /** Optional email for authentication */
  userEmail?: string;
  /** Optional custom RPC URL */
  rpcUrl?: string;
}

/**
 * Unified Market Maker trading client combining RPQ API and Web3 operations.
 *
 * This is the main entry point for Market Maker trading. It orchestrates:
 * 1. Authentication via SwarmAuth
 * 2. Quote discovery via RPQClient
 * 3. On-chain execution via MarketMakerWeb3Client
 *
 * Environment (dev/prod) is controlled via SWARM_COLLECTION_MODE env variable.
 *
 * @example
 * ```typescript
 * const client = new MarketMakerClient({
 *   network: Network.POLYGON,
 *   privateKey: '0x...',
 *   rpqApiKey: 'key123',
 *   userEmail: 'user@example.com'
 * });
 *
 * await client.initialize();
 *
 * const result = await client.trade({
 *   fromToken: '0xUSDC...',
 *   toToken: '0xRWA...',
 *   fromAmount: 100
 * });
 *
 * await client.close();
 * ```
 */
export class MarketMakerClient {
  readonly network: Network;
  readonly rpqClient: RPQClient;
  readonly web3Client: MarketMakerWeb3Client;

  private readonly auth: SwarmAuth;
  private readonly privateKey: `0x${string}`;
  private readonly userEmail?: string;
  private initialized: boolean = false;

  constructor(options: MarketMakerClientOptions) {
    this.network = options.network;
    this.privateKey = options.privateKey;
    this.userEmail = options.userEmail;

    // Convert Network enum to string for RPQ client
    const networkName = getNetworkName(options.network);

    // Initialize RPQ client
    this.rpqClient = new RPQClient(networkName, options.rpqApiKey);

    // Initialize Web3 client
    this.web3Client = new MarketMakerWeb3Client(
      options.network,
      options.privateKey,
      options.rpcUrl
    );

    // Initialize auth
    this.auth = new SwarmAuth();

    console.log(
      `Initialized Market Maker client for network ${getNetworkName(
        options.network
      )} ` +
        `(${getIsDev() ? "dev" : "prod"} mode) ` +
        `with account ${this.web3Client.address}`
    );
  }

  /**
   * Initialize the client by authenticating with Swarm platform.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("Authenticating with Swarm platform");
    await this.auth.verify(this.privateKey);
    this.initialized = true;
    console.log("Successfully authenticated with Swarm platform");
  }

  /**
   * Close all clients and cleanup resources.
   */
  async close(): Promise<void> {
    await this.rpqClient.close();
    await closeConfigFetchers();
    console.log("Market Maker client closed");
  }

  /**
   * Get a quote for trading tokens via Market Maker.
   *
   * Provide either fromAmount OR toAmount, not both.
   *
   * @param fromToken - Token to sell
   * @param toToken - Token to buy
   * @param fromAmount - Amount to sell (optional)
   * @param toAmount - Amount to buy (optional)
   * @returns Quote with calculated amounts and rate
   */
  async getQuote(
    fromToken: string,
    toToken: string,
    fromAmount?: number,
    toAmount?: number
  ): Promise<Quote> {
    return await this.rpqClient.getQuote(
      toToken,
      fromToken,
      fromAmount ? String(fromAmount) : undefined,
      toAmount ? String(toAmount) : undefined
    );
  }

  /**
   * Execute a Market Maker trade.
   *
   * This orchestrates the full trading flow:
   * 1. Get best offers from RPQ Service
   * 2. Use the selected offer with all necessary details
   * 3. Approve tokens if needed
   * 4. Execute trade on-chain with correct parameters
   *
   * @param options - Trade options
   * @returns TradeResult with transaction details
   */
  async trade(options: {
    fromToken: string;
    toToken: string;
    fromAmount?: number;
    toAmount?: number;
    affiliate?: string;
  }): Promise<TradeResult> {
    const { fromToken, toToken, fromAmount, toAmount, affiliate } = options;

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`Starting Market Maker trade: ${fromToken} -> ${toToken}`);

      // Step 1: Get best offers
      const bestOffersResponse = await this.rpqClient.getBestOffers(
        toToken, // depositAsset - what we want to receive
        fromToken, // withdrawalAsset - what we'll pay
        fromAmount ? String(fromAmount) : undefined,
        toAmount ? String(toAmount) : undefined
      );

      if (!bestOffersResponse.result.selectedOffers.length) {
        throw new NoOffersAvailableException(
          "No suitable offers found for this trade"
        );
      }

      // Use the first selected offer (best one)
      const selectedOffer = bestOffersResponse.result.selectedOffers[0]!;

      console.log(
        `Found best offer ${selectedOffer.id}: ` +
          `Paying ${selectedOffer.withdrawalAmountPaid} at price ${selectedOffer.pricePerUnit}`
      );

      // Get token decimals for normalization
      const withdrawalDecimals = parseInt(
        selectedOffer.withdrawalAmountPaidDecimals,
        10
      );

      // Amount to pay in smallest units (wei)
      const withdrawalAmountPaidWei = BigInt(
        selectedOffer.withdrawalAmountPaid
      );

      // Normalize withdrawal amount for display
      const withdrawalAmountPaidNormalized =
        Number(withdrawalAmountPaidWei) / Math.pow(10, withdrawalDecimals);

      // Step 2: Execute trade on-chain based on pricing type
      let txHash: Hash;

      if (selectedOffer.pricingType === PricingType.DYNAMIC_PRICING) {
        if (!selectedOffer.depositToWithdrawalRate) {
          throw new MarketMakerWeb3Exception(
            `Dynamic offer ${selectedOffer.id} missing depositToWithdrawalRate`
          );
        }

        const maxRate = BigInt(selectedOffer.depositToWithdrawalRate);

        txHash = await this.web3Client.takeOfferDynamic(
          selectedOffer.id,
          fromToken as Address,
          withdrawalAmountPaidWei,
          maxRate,
          affiliate as Address | undefined
        );
      } else {
        // Fixed pricing
        txHash = await this.web3Client.takeOfferFixed(
          selectedOffer.id,
          fromToken as Address,
          withdrawalAmountPaidWei,
          affiliate as Address | undefined
        );
      }

      // Calculate amount received
      const pricePerUnit = parseFloat(selectedOffer.pricePerUnit);
      const depositAmountReceivedNormalized =
        pricePerUnit > 0 ? withdrawalAmountPaidNormalized / pricePerUnit : 0;

      // Step 3: Create result
      const result = createTradeResult({
        txHash,
        orderId: selectedOffer.id,
        sellTokenAddress: fromToken,
        sellAmount: withdrawalAmountPaidNormalized,
        buyTokenAddress: toToken,
        buyAmount: depositAmountReceivedNormalized,
        rate: pricePerUnit,
        source: "market_maker",
        timestamp: new Date(),
        network: this.network,
      });

      console.log(`Market Maker trade completed successfully! TX: ${txHash}`);

      return result;
    } catch (error) {
      if (
        error instanceof NoOffersAvailableException ||
        error instanceof MarketMakerWeb3Exception
      ) {
        throw error;
      }
      throw new MarketMakerWeb3Exception(`Trade execution failed: ${error}`);
    }
  }

  /**
   * Create a new Market Maker offer.
   *
   * @param sellToken - Token you're offering to sell
   * @param sellAmount - Amount you're selling
   * @param buyToken - Token you want to buy
   * @param buyAmount - Amount you want to receive
   * @param isDynamic - Create dynamic offer (uses price feeds)
   * @param expiresAt - Optional expiration timestamp
   * @returns TradeResult with offer creation details
   */
  async makeOffer(
    sellToken: string,
    sellAmount: number,
    buyToken: string,
    buyAmount: number,
    isDynamic: boolean = false,
    expiresAt?: number
  ): Promise<TradeResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(
      `Creating Market Maker offer: ${sellAmount} ${sellToken} -> ${buyAmount} ${buyToken}`
    );

    const [txHash, offerId] = await this.web3Client.makeOffer(
      sellToken as Address,
      sellAmount,
      buyToken as Address,
      buyAmount,
      isDynamic,
      expiresAt
    );

    const rate = sellAmount > 0 ? buyAmount / sellAmount : 0;

    const result = createTradeResult({
      txHash,
      orderId: offerId,
      sellTokenAddress: sellToken,
      sellAmount,
      buyTokenAddress: buyToken,
      buyAmount,
      rate,
      source: "market_maker",
      timestamp: new Date(),
      network: this.network,
    });

    console.log(`Offer created successfully! ID: ${offerId}, TX: ${txHash}`);

    return result;
  }

  /**
   * Cancel an existing offer.
   *
   * Only the offer creator can cancel their own offers.
   *
   * @param offerId - Offer ID to cancel
   * @returns Transaction hash
   */
  async cancelOffer(offerId: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`Cancelling offer ${offerId}`);

    const txHash = await this.web3Client.cancelOffer(offerId);

    console.log(`Offer cancelled successfully! TX: ${txHash}`);

    return txHash;
  }
}
