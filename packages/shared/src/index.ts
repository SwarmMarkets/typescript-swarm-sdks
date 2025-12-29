/**
 * Swarm Shared SDK - Shared utilities and types for Swarm SDKs.
 *
 * This package provides a comprehensive suite of shared utilities:
 * - Models: Network enum, Quote, TradeResult
 * - Constants: USDC addresses, token decimals, RPC endpoints
 * - Config: Environment-aware configuration
 * - BaseClient: HTTP client with retry logic
 * - SwarmAuth: Wallet-based authentication
 * - Web3Helper: Blockchain interaction utilities using viem
 */

// Models
export {
  Network,
  getNetworkName,
  type Quote,
  getQuotePricePerUnit,
  getQuoteInverseRate,
  type TradeResult,
  createTradeResult,
  formatTradeResult,
} from "./models.js";

// Constants
export {
  USDC_ADDRESSES,
  TOKEN_DECIMALS,
  RPC_ENDPOINTS,
  GAS_BUFFER_MULTIPLIER,
  DEFAULT_GAS_LIMIT,
  TX_TIMEOUT_MS,
  ERC20_ABI,
} from "./constants.js";

// Config
export {
  getIsDev,
  getCrossChainAccessApiUrl,
  getSwarmAuthUrl,
  getRpqServiceUrl,
  getTopupAddress,
  getDotcManagerAddress,
  getEnvironmentInfo,
  type EnvironmentInfo,
} from "./config.js";

// Remote Config
export {
  RemoteConfigFetcher,
  getConfigFetcher,
  closeConfigFetchers,
} from "./remoteConfig.js";

// Base Client
export {
  BaseAPIClient,
  APIException,
  type RetryOptions,
} from "./baseClient.js";

// Swarm Auth
export {
  SwarmAuth,
  SigningTimeoutError,
  AuthenticationError,
  InMemoryStorage,
  type TokenStorageInterface,
  type NonceResponse,
  type LoginResponse,
  type UserAttributes,
  type RegisterResponse,
  type AuthTokens,
  isTokenExpired,
  isRefreshTokenExpired,
} from "./swarmAuth.js";

// Web3
export {
  Web3Helper,
  type GasEstimate,
  Web3Exception,
  InsufficientBalanceException,
  TransactionFailedException,
  InsufficientAllowanceException,
  NetworkNotSupportedException,
} from "./web3/index.js";
