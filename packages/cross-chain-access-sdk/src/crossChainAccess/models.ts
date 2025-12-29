/**
 * Data models for Cross-Chain Access Stock Trading API.
 */

/**
 * Trading order side.
 */
export enum OrderSide {
  BUY = "buy",
  SELL = "sell",
}

/**
 * Real-time market quote from Cross-Chain Access API.
 */
export interface CrossChainAccessQuote {
  /** Best bid price */
  bidPrice: number;
  /** Best ask price */
  askPrice: number;
  /** Size at bid */
  bidSize: number;
  /** Size at ask */
  askSize: number;
  /** Quote timestamp */
  timestamp: Date;
  /** Exchange for bid */
  bidExchange?: string;
  /** Exchange for ask */
  askExchange?: string;
}

/**
 * Get the appropriate price for the order side.
 */
export function getPriceForSide(
  quote: CrossChainAccessQuote,
  side: OrderSide
): number {
  return side === OrderSide.BUY ? quote.askPrice : quote.bidPrice;
}

/**
 * Trading account status from Cross-Chain Access API.
 */
export interface AccountStatus {
  /** Whether account is blocked */
  accountBlocked: boolean;
  /** Whether trading is blocked */
  tradingBlocked: boolean;
  /** Whether transfers are blocked */
  transfersBlocked: boolean;
  /** Whether user suspended trading */
  tradeSuspendedByUser: boolean;
  /** Whether market is currently open */
  marketOpen: boolean;
  /** Status string (e.g., "ACTIVE") */
  accountStatus: string;
}

/**
 * Check if trading is currently allowed.
 */
export function isTradingAllowed(status: AccountStatus): boolean {
  return (
    !status.accountBlocked &&
    !status.tradingBlocked &&
    !status.transfersBlocked &&
    !status.tradeSuspendedByUser &&
    status.marketOpen
  );
}

/**
 * Trading account funds from Cross-Chain Access API.
 */
export interface AccountFunds {
  /** Available cash */
  cash: number;
  /** Total buying power */
  buyingPower: number;
  /** Day trading buying power */
  dayTradingBuyingPower: number;
  /** Effective buying power */
  effectiveBuyingPower: number;
  /** Non-margin buying power */
  nonMarginBuyingPower: number;
  /** Regulation T buying power */
  regTBuyingPower: number;
}

/**
 * Check if account has sufficient buying power.
 */
export function hasSufficientFunds(
  funds: AccountFunds,
  requiredAmount: number
): boolean {
  return funds.buyingPower >= requiredAmount;
}

/**
 * Calculated trade amounts with slippage protection.
 */
export interface CalculatedAmounts {
  /** Amount of RWA tokens */
  rwaAmount: number;
  /** Amount of USDC */
  usdcAmount: number;
  /** Locked price per unit */
  price: number;
  /** Order side (BUY/SELL) */
  side: OrderSide;
}

/**
 * Parameters for executing a Cross-Chain Access trade.
 */
export interface CrossChainAccessTradeParams {
  /** RWA token contract address */
  rwaTokenAddress: string;
  /** Trading symbol (e.g., "AAPL") */
  rwaSymbol: string;
  /** BUY or SELL */
  orderSide: OrderSide;
  /** Amount of RWA tokens */
  rwaAmount: number;
  /** Amount of USDC */
  usdcAmount: number;
  /** Price locked for this trade */
  lockedPrice: number;
  /** User's email address */
  userEmail: string;
}

/**
 * Response from Cross-Chain Access order creation.
 */
export interface CrossChainAccessOrderResponse {
  /** Unique order identifier */
  orderId: string;
  /** Trading symbol */
  symbol: string;
  /** Order side */
  side: string;
  /** Order quantity */
  quantity: number;
  /** Filled quantity */
  filledQty: number;
  /** Order status */
  status: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Fill timestamp (if filled) */
  filledAt?: Date;
}

/**
 * Convert order response to dictionary.
 */
export function orderResponseToDict(
  order: CrossChainAccessOrderResponse
): Record<string, unknown> {
  return {
    orderId: order.orderId,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity.toString(),
    filledQty: order.filledQty.toString(),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    filledAt: order.filledAt?.toISOString() ?? null,
  };
}
