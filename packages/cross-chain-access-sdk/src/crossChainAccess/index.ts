/**
 * Cross-Chain Access API module.
 */

export { CrossChainAccessAPIClient } from "./client.js";

export {
  CrossChainAccessException,
  QuoteUnavailableException,
  InvalidSymbolException,
  OrderFailedException,
  MarketClosedException,
  AccountBlockedException,
  InsufficientFundsException,
} from "./exceptions.js";

export {
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
} from "./models.js";
