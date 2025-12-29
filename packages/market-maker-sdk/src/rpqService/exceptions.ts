/**
 * Exceptions for Market Maker RPQ Service.
 */

/**
 * Base exception for RPQ Service errors.
 */
export class RPQServiceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RPQServiceException";
  }
}

/**
 * Raised when no offers are available for the requested pair.
 */
export class NoOffersAvailableException extends RPQServiceException {
  constructor(message: string) {
    super(message);
    this.name = "NoOffersAvailableException";
  }
}

/**
 * Raised when token pair is not supported.
 */
export class InvalidTokenPairException extends RPQServiceException {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenPairException";
  }
}

/**
 * Raised when quote cannot be generated.
 */
export class QuoteUnavailableException extends RPQServiceException {
  constructor(message: string) {
    super(message);
    this.name = "QuoteUnavailableException";
  }
}

/**
 * Raised when price feed is not found.
 */
export class PriceFeedNotFoundException extends RPQServiceException {
  constructor(message: string) {
    super(message);
    this.name = "PriceFeedNotFoundException";
  }
}
