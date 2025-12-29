/**
 * Shared models for Swarm SDK Collection.
 */

/**
 * Supported blockchain networks.
 */
export enum Network {
  ETHEREUM = 1,
  POLYGON = 137,
  BASE = 8453,
  BSC = 56,
}

/**
 * Get network name from enum value.
 */
export function getNetworkName(network: Network): string {
  switch (network) {
    case Network.ETHEREUM:
      return "ethereum";
    case Network.POLYGON:
      return "polygon";
    case Network.BASE:
      return "base";
    case Network.BSC:
      return "bsc";
    default:
      return "unknown";
  }
}

/**
 * Unified quote model for trading services.
 *
 * This model is used by both Cross-Chain Access and Market Maker SDKs to provide
 * consistent pricing information.
 *
 * All amounts are in normalized decimal units (e.g., 1.5 for 1.5 USDC).
 */
export interface Quote {
  /** Token address being sold */
  sellTokenAddress: string;
  /** Token address being bought */
  buyTokenAddress: string;
  /** Amount to sell (normalized) */
  sellAmount: number;
  /** Amount to receive (normalized) */
  buyAmount: number;
  /** Exchange rate (buy_amount / sell_amount) */
  rate: number;
  /** Service that provided quote ("cross_chain_access" or "market_maker") */
  source: string;
  /** When quote was generated */
  timestamp: Date;
}

/**
 * Calculate price per unit from quote.
 * @returns buy_amount / sell_amount
 */
export function getQuotePricePerUnit(quote: Quote): number {
  if (quote.sellAmount === 0) {
    return 0;
  }
  return quote.buyAmount / quote.sellAmount;
}

/**
 * Calculate inverse rate from quote.
 * @returns sell_amount / buy_amount
 */
export function getQuoteInverseRate(quote: Quote): number {
  if (quote.buyAmount === 0) {
    return 0;
  }
  return quote.sellAmount / quote.buyAmount;
}

/**
 * Result of a completed trade.
 *
 * This model captures the outcome of a trade execution,
 * including on-chain transaction details and order information.
 */
export interface TradeResult {
  /** Blockchain transaction hash */
  txHash: string;
  /** Order ID (if applicable) */
  orderId?: string;
  /** Token address sold */
  sellTokenAddress: string;
  /** Token address bought */
  buyTokenAddress: string;
  /** Actual amount sold (normalized) */
  sellAmount: number;
  /** Actual amount received (normalized) */
  buyAmount: number;
  /** Execution rate */
  rate: number;
  /** Service used ("cross_chain_access" or "market_maker") */
  source: string;
  /** Execution timestamp */
  timestamp: Date;
  /** Blockchain network */
  network: Network;
  /** Trade status */
  status: string;
}

/**
 * Create a TradeResult with default status.
 */
export function createTradeResult(
  params: Omit<TradeResult, "status"> & { status?: string }
): TradeResult {
  return {
    ...params,
    status: params.status ?? "completed",
  };
}

/**
 * Format trade result as human-readable string.
 */
export function formatTradeResult(result: TradeResult): string {
  return (
    `Trade(${result.source}): ` +
    `Sold ${result.sellAmount} for ${result.buyAmount} ` +
    `on ${getNetworkName(result.network)} ` +
    `(tx: ${result.txHash.slice(0, 10)}...)`
  );
}
