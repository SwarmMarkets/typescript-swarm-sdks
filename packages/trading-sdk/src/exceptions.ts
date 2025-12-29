/**
 * Exceptions for Trading SDK.
 */

/**
 * Base exception for Trading SDK errors.
 */
export class TradingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TradingException";
  }
}

/**
 * Raised when no liquidity available on any platform.
 */
export class NoLiquidityException extends TradingException {
  constructor(message: string = "No liquidity available") {
    super(message);
    this.name = "NoLiquidityException";
  }
}

/**
 * Raised when all trading platforms fail.
 */
export class AllPlatformsFailedException extends TradingException {
  constructor(message: string = "All platforms failed") {
    super(message);
    this.name = "AllPlatformsFailedException";
  }
}

/**
 * Raised when routing strategy is invalid.
 */
export class InvalidRoutingStrategyException extends TradingException {
  constructor(message: string = "Invalid routing strategy") {
    super(message);
    this.name = "InvalidRoutingStrategyException";
  }
}
