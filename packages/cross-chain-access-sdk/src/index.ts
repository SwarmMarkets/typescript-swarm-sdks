/**
 * Swarm Cross-Chain Access SDK
 *
 * Provides trading capabilities for stock market RWAs (Real World Assets).
 */

// Main SDK client
export {
  CrossChainAccessClient,
  type CrossChainAccessClientOptions,
} from "./sdk/index.js";

// Cross-Chain Access API client
export {
  CrossChainAccessAPIClient,
  CrossChainAccessException,
  QuoteUnavailableException,
  InvalidSymbolException,
  OrderFailedException,
  MarketClosedException,
  AccountBlockedException,
  InsufficientFundsException,
  OrderSide,
  getPriceForSide,
  isTradingAllowed,
  hasSufficientFunds,
  orderResponseToDict,
  type CrossChainAccessQuote,
  type AccountStatus,
  type AccountFunds,
  type CalculatedAmounts,
  type CrossChainAccessTradeParams,
  type CrossChainAccessOrderResponse,
} from "./crossChainAccess/index.js";

// Market Hours utilities
export {
  MarketHours,
  isMarketOpen,
  timeUntilOpen,
  timeUntilClose,
  getMarketStatus,
  type MarketStatus,
} from "./marketHours/index.js";

// Re-export shared types
export type { Network, Quote, TradeResult } from "@swarm/shared";
