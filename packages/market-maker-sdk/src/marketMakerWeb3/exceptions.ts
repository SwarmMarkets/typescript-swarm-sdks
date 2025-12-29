/**
 * Exceptions for Market Maker Web3 operations.
 */

/**
 * Base exception for Market Maker Web3 errors.
 */
export class MarketMakerWeb3Exception extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketMakerWeb3Exception";
  }
}

/**
 * Raised when offer doesn't exist on-chain.
 */
export class OfferNotFoundError extends MarketMakerWeb3Exception {
  constructor(message: string = "Offer not found") {
    super(message);
    this.name = "OfferNotFoundError";
  }
}

/**
 * Raised when trying to take an inactive offer.
 */
export class OfferInactiveError extends MarketMakerWeb3Exception {
  constructor(message: string = "Offer is inactive") {
    super(message);
    this.name = "OfferInactiveError";
  }
}

/**
 * Raised when offer maker has insufficient balance.
 */
export class InsufficientOfferBalanceError extends MarketMakerWeb3Exception {
  constructor(message: string = "Insufficient offer balance") {
    super(message);
    this.name = "InsufficientOfferBalanceError";
  }
}

/**
 * Raised when offer has expired.
 */
export class OfferExpiredError extends MarketMakerWeb3Exception {
  constructor(message: string = "Offer has expired") {
    super(message);
    this.name = "OfferExpiredError";
  }
}

/**
 * Raised when caller is not authorized for operation.
 */
export class UnauthorizedError extends MarketMakerWeb3Exception {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
