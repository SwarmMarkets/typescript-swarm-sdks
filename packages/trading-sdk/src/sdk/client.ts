/**
 * Unified Trading SDK combining Market Maker and Cross-Chain Access platforms.
 */

import {
  Network,
  getIsDev,
  type Quote,
  type TradeResult,
  closeConfigFetchers,
} from "@swarm/shared";

import {
  MarketMakerClient,
  type MarketMakerClientOptions,
} from "@swarm/market-maker-sdk";

import {
  CrossChainAccessClient,
  MarketClosedException as CrossChainAccessMarketClosedException,
  type CrossChainAccessClientOptions,
} from "@swarm/cross-chain-access-sdk";

import {
  Router,
  RoutingStrategy,
  createPlatformOption,
  type PlatformOption,
} from "../routing.js";

import {
  TradingException,
  NoLiquidityException,
  AllPlatformsFailedException,
} from "../exceptions.js";

/**
 * Options for TradingClient initialization.
 */
export interface TradingClientOptions {
  /** Network to trade on */
  network: Network;
  /** Private key for signing transactions */
  privateKey: `0x${string}`;
  /** API key for Market Maker RPQ service */
  rpqApiKey: string;
  /** Optional email for authentication */
  userEmail?: string;
  /** Optional custom RPC URL */
  rpcUrl?: string;
  /** Default routing strategy */
  routingStrategy?: RoutingStrategy;
}

/**
 * Trade options.
 */
export interface TradeOptions {
  /** Token to sell */
  fromToken: string;
  /** Token to buy */
  toToken: string;
  /** User email for notifications */
  userEmail: string;
  /** Amount to sell (optional) */
  fromAmount?: number;
  /** Amount to buy (optional) */
  toAmount?: number;
  /** Token symbol for Cross-Chain Access (e.g., "AAPL") */
  toTokenSymbol?: string;
  /** Override default routing strategy */
  routingStrategy?: RoutingStrategy;
}

/**
 * Unified trading client with smart routing between Market Maker and Cross-Chain Access.
 *
 * This is the highest-level SDK that provides:
 * 1. Unified trade() method that works across platforms
 * 2. Smart routing based on price, liquidity, and availability
 * 3. Automatic fallback between platforms
 * 4. Quote comparison and aggregation
 *
 * @example
 * ```typescript
 * const client = new TradingClient({
 *   network: Network.POLYGON,
 *   privateKey: '0x...',
 *   rpqApiKey: 'key123',
 *   userEmail: 'user@example.com',
 * });
 *
 * await client.initialize();
 *
 * const result = await client.trade({
 *   fromToken: '0xUSDC...',
 *   toToken: '0xRWA...',
 *   fromAmount: 100,
 *   toTokenSymbol: 'AAPL',
 *   userEmail: 'user@example.com',
 * });
 *
 * await client.close();
 * ```
 */
export class TradingClient {
  readonly network: Network;
  readonly routingStrategy: RoutingStrategy;
  readonly marketMakerClient: MarketMakerClient;
  readonly crossChainAccessClient: CrossChainAccessClient;

  private initialized: boolean = false;

  constructor(options: TradingClientOptions) {
    this.network = options.network;
    this.routingStrategy =
      options.routingStrategy ?? RoutingStrategy.BEST_PRICE;

    // Initialize Market Maker client
    this.marketMakerClient = new MarketMakerClient({
      network: options.network,
      privateKey: options.privateKey,
      rpqApiKey: options.rpqApiKey,
      userEmail: options.userEmail,
      rpcUrl: options.rpcUrl,
    });

    // Initialize Cross-Chain Access client
    this.crossChainAccessClient = new CrossChainAccessClient({
      network: options.network,
      privateKey: options.privateKey,
      userEmail: options.userEmail,
      rpcUrl: options.rpcUrl,
    });

    console.log(
      `Initialized Trading SDK for ${options.network} ` +
        `(${getIsDev() ? "dev" : "prod"} mode) ` +
        `with routing strategy: ${this.routingStrategy}`
    );
  }

  /**
   * Initialize both clients.
   * Note: Clients are initialized sequentially to avoid nonce conflicts.
   * Each client requests a nonce from the server during authentication,
   * and concurrent requests would invalidate each other's nonces.
   */
  async initialize(): Promise<void> {
    if (!this.initialized) {
      // Initialize sequentially to avoid nonce conflicts during authentication
      await this.marketMakerClient.initialize();
      await this.crossChainAccessClient.initialize();
      this.initialized = true;
    }
  }

  /**
   * Close all clients and cleanup resources.
   */
  async close(): Promise<void> {
    await Promise.all([
      this.marketMakerClient.close(),
      this.crossChainAccessClient.close(),
    ]);

    await closeConfigFetchers();
    console.log("Trading SDK closed");
  }

  /**
   * Get quotes from all available platforms.
   */
  async getQuotes(params: {
    fromToken: string;
    toToken: string;
    fromAmount?: number;
    toAmount?: number;
    toTokenSymbol?: string;
  }): Promise<Record<string, Quote | null>> {
    // Get quotes in parallel
    const [marketMakerQuote, crossChainAccessQuote] = await Promise.all([
      this.getMarketMakerQuote(
        params.fromToken,
        params.toToken,
        params.fromAmount,
        params.toAmount
      ),
      params.toTokenSymbol
        ? this.getCrossChainAccessQuote(params.toTokenSymbol)
        : Promise.resolve(null),
    ]);

    return {
      market_maker: marketMakerQuote,
      cross_chain_access: crossChainAccessQuote,
    };
  }

  /**
   * Execute a trade with smart routing between platforms.
   */
  async trade(options: TradeOptions): Promise<TradeResult> {
    // Validate amounts
    if (
      (options.fromAmount !== undefined && options.toAmount !== undefined) ||
      (options.fromAmount === undefined && options.toAmount === undefined)
    ) {
      throw new Error("Must provide either fromAmount OR toAmount, not both");
    }

    const strategy = options.routingStrategy ?? this.routingStrategy;
    const isBuy = options.fromAmount !== undefined;

    console.log(
      `Starting trade: ${options.fromToken} -> ${options.toToken} (strategy: ${strategy})`
    );

    // Ensure initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Step 1: Get quotes from all platforms
    const marketMakerOption = await this.getMarketMakerOption(
      options.fromToken,
      options.toToken,
      options.fromAmount,
      options.toAmount
    );

    const crossChainAccessOption = options.toTokenSymbol
      ? await this.getCrossChainAccessOption(
          options.toTokenSymbol,
          options.fromAmount,
          options.toAmount
        )
      : createPlatformOption("cross_chain_access", {
          available: false,
          error: "Symbol not provided",
        });

    console.log(
      `Platform availability - Market Maker: ${marketMakerOption.available}, ` +
        `Cross-Chain Access: ${crossChainAccessOption.available}`
    );

    // Step 2: Select platform based on strategy
    let selected: PlatformOption;
    try {
      selected = Router.selectPlatform(
        crossChainAccessOption,
        marketMakerOption,
        strategy,
        isBuy
      );

      console.log(`Selected platform: ${selected.platform}`);
    } catch (error) {
      if (error instanceof NoLiquidityException) {
        console.error(`No liquidity available: ${error}`);
        throw error;
      }
      throw error;
    }

    // Step 3: Execute trade on selected platform
    try {
      let result: TradeResult;

      if (selected.platform === "cross_chain_access") {
        result = await this.executeCrossChainAccessTrade({
          rwaTokenAddress: options.toToken,
          rwaSymbol: options.toTokenSymbol!,
          rwaAmount: options.toAmount,
          usdcAmount: options.fromAmount,
          userEmail: options.userEmail,
        });
      } else {
        result = await this.executeMarketMakerTrade({
          fromToken: options.fromToken,
          toToken: options.toToken,
          fromAmount: options.fromAmount,
          toAmount: options.toAmount,
        });
      }

      console.log(`Trade successful on ${selected.platform}: ${result.txHash}`);
      return result;
    } catch (error) {
      console.error(`Trade failed on ${selected.platform}:`, error);

      // Try fallback if strategy allows
      if (
        strategy === RoutingStrategy.BEST_PRICE ||
        strategy === RoutingStrategy.CROSS_CHAIN_ACCESS_FIRST ||
        strategy === RoutingStrategy.MARKET_MAKER_FIRST
      ) {
        const fallbackPlatform =
          selected.platform === "cross_chain_access"
            ? "market_maker"
            : "cross_chain_access";

        const fallbackOption =
          selected.platform === "cross_chain_access"
            ? marketMakerOption
            : crossChainAccessOption;

        if (fallbackOption.available) {
          console.log(`Attempting fallback to ${fallbackPlatform}`);

          try {
            let result: TradeResult;

            if (fallbackPlatform === "cross_chain_access") {
              result = await this.executeCrossChainAccessTrade({
                rwaTokenAddress: options.toToken,
                rwaSymbol: options.toTokenSymbol!,
                rwaAmount: options.toAmount,
                usdcAmount: options.fromAmount,
                userEmail: options.userEmail,
              });
            } else {
              result = await this.executeMarketMakerTrade({
                fromToken: options.fromToken,
                toToken: options.toToken,
                fromAmount: options.fromAmount,
                toAmount: options.toAmount,
              });
            }

            console.log(
              `Fallback successful on ${fallbackPlatform}: ${result.txHash}`
            );
            return result;
          } catch (fallbackError) {
            console.error("Fallback failed:", fallbackError);
            throw new AllPlatformsFailedException(
              `Primary (${selected.platform}): ${error}. Fallback (${fallbackPlatform}): ${fallbackError}`
            );
          }
        }
      }

      // No fallback available or allowed
      throw new TradingException(`Trade failed: ${error}`);
    }
  }

  // Private helper methods

  private async getMarketMakerOption(
    fromToken: string,
    toToken: string,
    fromAmount?: number,
    toAmount?: number
  ): Promise<PlatformOption> {
    try {
      const quote = await this.marketMakerClient.getQuote(
        fromToken,
        toToken,
        fromAmount,
        toAmount
      );
      return createPlatformOption("market_maker", { quote });
    } catch (error) {
      console.warn("Market Maker quote failed:", error);
      return createPlatformOption("market_maker", {
        available: false,
        error: String(error),
      });
    }
  }

  private async getCrossChainAccessOption(
    symbol: string | undefined,
    fromAmount?: number,
    toAmount?: number
  ): Promise<PlatformOption> {
    if (!symbol) {
      return createPlatformOption("cross_chain_access", {
        available: false,
        error: "Symbol not provided",
      });
    }

    try {
      const quote = await this.crossChainAccessClient.getQuote(symbol);
      return createPlatformOption("cross_chain_access", { quote });
    } catch (error) {
      if (error instanceof CrossChainAccessMarketClosedException) {
        console.warn("Cross-Chain Access market closed:", error);
        return createPlatformOption("cross_chain_access", {
          available: false,
          error: "Market closed",
        });
      }
      console.warn("Cross-Chain Access quote failed:", error);
      return createPlatformOption("cross_chain_access", {
        available: false,
        error: String(error),
      });
    }
  }

  private async getMarketMakerQuote(
    fromToken: string,
    toToken: string,
    fromAmount?: number,
    toAmount?: number
  ): Promise<Quote | null> {
    try {
      return await this.marketMakerClient.getQuote(
        fromToken,
        toToken,
        fromAmount,
        toAmount
      );
    } catch (error) {
      console.warn("Market Maker quote failed:", error);
      return null;
    }
  }

  private async getCrossChainAccessQuote(
    symbol: string
  ): Promise<Quote | null> {
    try {
      return await this.crossChainAccessClient.getQuote(symbol);
    } catch (error) {
      console.warn("Cross-Chain Access quote failed:", error);
      return null;
    }
  }

  private async executeMarketMakerTrade(params: {
    fromToken: string;
    toToken: string;
    fromAmount?: number;
    toAmount?: number;
  }): Promise<TradeResult> {
    return this.marketMakerClient.trade(params);
  }

  private async executeCrossChainAccessTrade(params: {
    rwaTokenAddress: string;
    rwaSymbol: string;
    rwaAmount?: number;
    usdcAmount?: number;
    userEmail: string;
  }): Promise<TradeResult> {
    if (params.usdcAmount !== undefined) {
      return this.crossChainAccessClient.buy({
        rwaTokenAddress: params.rwaTokenAddress,
        rwaSymbol: params.rwaSymbol,
        usdcAmount: params.usdcAmount,
        userEmail: params.userEmail,
      });
    } else {
      return this.crossChainAccessClient.sell({
        rwaTokenAddress: params.rwaTokenAddress,
        rwaSymbol: params.rwaSymbol,
        rwaAmount: params.rwaAmount,
        userEmail: params.userEmail,
      });
    }
  }
}
