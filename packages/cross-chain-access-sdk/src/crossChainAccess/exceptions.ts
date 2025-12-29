/**
 * Exceptions for Cross-Chain Access API client.
 */

/**
 * Base exception for Cross-Chain Access API errors.
 */
export class CrossChainAccessException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrossChainAccessException";
  }
}

/**
 * Quote unavailable exception.
 */
export class QuoteUnavailableException extends CrossChainAccessException {
  constructor(message: string = "Quote unavailable") {
    super(message);
    this.name = "QuoteUnavailableException";
  }
}

/**
 * Invalid symbol exception.
 */
export class InvalidSymbolException extends CrossChainAccessException {
  constructor(message: string = "Invalid symbol") {
    super(message);
    this.name = "InvalidSymbolException";
  }
}

/**
 * Order failed exception.
 */
export class OrderFailedException extends CrossChainAccessException {
  constructor(message: string = "Order failed") {
    super(message);
    this.name = "OrderFailedException";
  }
}

/**
 * Market closed exception.
 */
export class MarketClosedException extends CrossChainAccessException {
  constructor(message: string = "Market is closed") {
    super(message);
    this.name = "MarketClosedException";
  }
}

/**
 * Account blocked exception.
 */
export class AccountBlockedException extends CrossChainAccessException {
  constructor(message: string = "Account is blocked") {
    super(message);
    this.name = "AccountBlockedException";
  }
}

/**
 * Insufficient funds exception.
 */
export class InsufficientFundsException extends CrossChainAccessException {
  constructor(message: string = "Insufficient funds") {
    super(message);
    this.name = "InsufficientFundsException";
  }
}
