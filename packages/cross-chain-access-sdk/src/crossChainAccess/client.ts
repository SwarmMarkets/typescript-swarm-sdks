/**
 * Cross-Chain Access Stock Trading API client.
 */

import {
  BaseAPIClient,
  APIException,
  getCrossChainAccessApiUrl,
  getIsDev,
} from "@swarm-markets/shared";

import type {
  CrossChainAccessQuote,
  AccountStatus,
  AccountFunds,
  CrossChainAccessOrderResponse,
} from "./models.js";

import { OrderSide } from "./models.js";

import {
  QuoteUnavailableException,
  OrderFailedException,
  InvalidSymbolException,
} from "./exceptions.js";

/**
 * Client for interacting with Cross-Chain Access Stock Trading API.
 *
 * This client handles all HTTP interactions with the Cross-Chain Access API endpoints
 * for stock market trading, including quotes, account status, and order creation.
 * Environment (dev/prod) is controlled via SWARM_COLLECTION_MODE env variable.
 *
 * @example
 * ```typescript
 * const client = new CrossChainAccessAPIClient();
 * client.setAuthToken(token);
 * const quote = await client.getAssetQuote('AAPL');
 * ```
 */
export class CrossChainAccessAPIClient extends BaseAPIClient {
  constructor() {
    super(getCrossChainAccessApiUrl());
    console.log(
      `Initialized Cross-Chain Access API client (${
        getIsDev() ? "dev" : "prod"
      } mode)`
    );
  }

  /**
   * Get trading account status.
   * @returns AccountStatus with trading permissions
   * @throws APIException if request fails or authentication missing
   */
  async getAccountStatus(): Promise<AccountStatus> {
    if (!this.authToken) {
      throw new APIException(
        "Authentication token required for getting account status",
        401
      );
    }

    try {
      const response = await this.makeRequest<{
        data?: { attributes?: Record<string, unknown> };
      }>("GET", "/status");

      const attrs = response.data?.attributes ?? {};

      const status: AccountStatus = {
        accountBlocked: (attrs["account_blocked"] as boolean) ?? false,
        tradingBlocked: (attrs["trading_blocked"] as boolean) ?? false,
        transfersBlocked: (attrs["transfers_blocked"] as boolean) ?? false,
        tradeSuspendedByUser:
          (attrs["trade_suspended_by_user"] as boolean) ?? false,
        marketOpen: (attrs["market_open"] as boolean) ?? false,
        accountStatus: (attrs["account_status"] as string) ?? "UNKNOWN",
      };

      return status;
    } catch (error) {
      console.error("Failed to get account status:", error);
      throw error;
    }
  }

  /**
   * Get trading account funds and buying power.
   * @returns AccountFunds with buying power details
   * @throws APIException if request fails or authentication missing
   */
  async getAccountFunds(): Promise<AccountFunds> {
    if (!this.authToken) {
      throw new APIException(
        "Authentication token required for getting account funds",
        401
      );
    }

    try {
      const response = await this.makeRequest<{
        data?: { attributes?: Record<string, unknown> };
      }>("GET", "/funds");

      const attrs = response.data?.attributes ?? {};

      const funds: AccountFunds = {
        cash: Number(attrs["cash"] ?? 0),
        buyingPower: Number(attrs["buying_power"] ?? 0),
        dayTradingBuyingPower: Number(attrs["day_trading_buying_power"] ?? 0),
        effectiveBuyingPower: Number(attrs["effective_buying_power"] ?? 0),
        nonMarginBuyingPower: Number(attrs["non_margin_buying_power"] ?? 0),
        regTBuyingPower: Number(attrs["reg_t_buying_power"] ?? 0),
      };

      return funds;
    } catch (error) {
      console.error("Failed to get account funds:", error);
      throw error;
    }
  }

  /**
   * Get real-time quote for a trading symbol.
   * @param symbol - Trading symbol (e.g., "AAPL")
   * @returns CrossChainAccessQuote with bid/ask prices
   * @throws QuoteUnavailableException if quote cannot be retrieved
   * @throws InvalidSymbolException if symbol is invalid
   */
  async getAssetQuote(symbol: string): Promise<CrossChainAccessQuote> {
    try {
      const params = {
        symbol: symbol.toUpperCase(),
        currency: "usd",
      };

      const response = await this.makeRequest<{
        data?: { attributes?: Record<string, unknown> };
      }>("GET", "/asset-quote", undefined, params);

      const attrs = response.data?.attributes ?? {};

      // Parse timestamp
      const timestampStr = attrs["timestamp"] as string | undefined;
      let timestamp: Date;
      try {
        timestamp = timestampStr
          ? new Date(timestampStr.replace("Z", "+00:00"))
          : new Date();
      } catch {
        timestamp = new Date();
      }

      const quote: CrossChainAccessQuote = {
        bidPrice: Number(attrs["bidPrice"] ?? 0),
        askPrice: Number(attrs["askPrice"] ?? 0),
        bidSize: Number(attrs["bidSize"] ?? 0),
        askSize: Number(attrs["askSize"] ?? 0),
        timestamp,
        bidExchange: attrs["bidExchange"] as string | undefined,
        askExchange: attrs["askExchange"] as string | undefined,
      };

      console.log(
        `Retrieved quote for ${symbol}: bid=$${quote.bidPrice}, ask=$${quote.askPrice}`
      );

      return quote;
    } catch (error) {
      if (error instanceof APIException) {
        if (error.statusCode === 404) {
          throw new InvalidSymbolException(`Invalid trading symbol: ${symbol}`);
        } else if (error.statusCode === 400) {
          throw new QuoteUnavailableException(
            `Quote unavailable for ${symbol}: ${error.message}`
          );
        }
      }
      throw new QuoteUnavailableException(
        `Failed to get quote for ${symbol}: ${error}`
      );
    }
  }

  /**
   * Create a trading order on Cross-Chain Access.
   *
   * This submits an order after the on-chain token transfer has been completed.
   * The txHash from the blockchain transfer is required.
   */
  async createOrder(params: {
    wallet: string;
    txHash: string;
    assetAddress: string;
    assetSymbol: string;
    side: OrderSide;
    price: number;
    qty: number;
    notional: number;
    chainId: number;
    userEmail: string;
    targetChainId?: number;
  }): Promise<CrossChainAccessOrderResponse> {
    if (!this.authToken) {
      throw new APIException(
        "Authentication token required for creating orders",
        401
      );
    }

    try {
      const data = {
        data: {
          attributes: {
            wallet: params.wallet.toLowerCase(),
            tx_hash: params.txHash,
            asset: params.assetAddress,
            asset_symbol: params.assetSymbol.toUpperCase(),
            side: params.side,
            price: params.price,
            qty: params.qty,
            notional: params.notional,
            chain_id: params.chainId,
            target_chain_id: params.targetChainId ?? params.chainId,
            user_email: params.userEmail,
          },
        },
      };

      console.log(
        `Creating ${params.side} order for ${params.qty} ${params.assetSymbol} ` +
          `at $${params.price} (tx: ${params.txHash.slice(0, 10)}...)`
      );

      const response = await this.makeRequest<{
        data?: { id?: string; attributes?: Record<string, unknown> };
      }>("POST", "/orders", data);

      const orderData = response.data ?? {};
      const orderAttrs = orderData.attributes ?? {};

      // Parse timestamps
      const createdAtStr = orderAttrs["created_at"] as string | undefined;
      const filledAtStr = orderAttrs["filled_at"] as string | undefined;

      let createdAt: Date;
      try {
        createdAt = createdAtStr
          ? new Date(createdAtStr.replace("Z", "+00:00"))
          : new Date();
      } catch {
        createdAt = new Date();
      }

      let filledAt: Date | undefined;
      if (filledAtStr) {
        try {
          filledAt = new Date(filledAtStr.replace("Z", "+00:00"));
        } catch {
          filledAt = undefined;
        }
      }

      const order: CrossChainAccessOrderResponse = {
        orderId: orderData.id ?? "unknown",
        symbol: (orderAttrs["symbol"] as string) ?? params.assetSymbol,
        side: (orderAttrs["side"] as string) ?? params.side,
        quantity: Number(orderAttrs["qty"] ?? params.qty),
        filledQty: Number(orderAttrs["filled_qty"] ?? 0),
        status: (orderAttrs["status"] as string) ?? "pending",
        createdAt,
        filledAt,
      };

      console.log(
        `Order created successfully: ${order.orderId} (status: ${order.status})`
      );

      return order;
    } catch (error) {
      console.error("Failed to create order:", error);
      if (error instanceof APIException) {
        throw new OrderFailedException(
          `Order creation failed: ${error.message}`
        );
      }
      throw new OrderFailedException(`Order creation failed: ${error}`);
    }
  }

  /**
   * Close the client and release resources.
   */
  override async close(): Promise<void> {
    // Currently no persistent resources to close
  }
}
