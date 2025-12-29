/**
 * Web3 exceptions for Swarm SDK Collection.
 */

/**
 * Base exception for Web3 operations.
 */
export class Web3Exception extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Web3Exception";
  }
}

/**
 * Raised when wallet has insufficient token balance.
 */
export class InsufficientBalanceException extends Web3Exception {
  readonly required: number;
  readonly available: number;
  readonly token: string;

  constructor(required: number, available: number, token: string) {
    super(
      `Insufficient ${token} balance: required ${required}, available ${available}`
    );
    this.name = "InsufficientBalanceException";
    this.required = required;
    this.available = available;
    this.token = token;
  }
}

/**
 * Raised when blockchain transaction fails.
 */
export class TransactionFailedException extends Web3Exception {
  readonly txHash?: string;

  constructor(reason: string = "Transaction failed", txHash?: string) {
    const message = txHash ? `${reason} (tx: ${txHash})` : reason;
    super(message);
    this.name = "TransactionFailedException";
    this.txHash = txHash;
  }
}

/**
 * Raised when token allowance is insufficient.
 */
export class InsufficientAllowanceException extends Web3Exception {
  readonly required: number;
  readonly current: number;
  readonly token: string;
  readonly spender: string;

  constructor(
    required: number,
    current: number,
    token: string,
    spender: string
  ) {
    super(
      `Insufficient allowance for ${token}: ` +
        `required ${required}, current ${current} ` +
        `(spender: ${spender.slice(0, 10)}...)`
    );
    this.name = "InsufficientAllowanceException";
    this.required = required;
    this.current = current;
    this.token = token;
    this.spender = spender;
  }
}

/**
 * Raised when network is not supported.
 */
export class NetworkNotSupportedException extends Web3Exception {
  readonly network: string;

  constructor(network: string) {
    super(`Network not supported: ${network}`);
    this.name = "NetworkNotSupportedException";
    this.network = network;
  }
}
