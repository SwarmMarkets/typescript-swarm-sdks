/**
 * Market Maker SDK - Decentralized OTC trading for Swarm RWAs.
 *
 * This SDK provides a unified interface for trading Real World Assets (RWAs)
 * through Swarm's decentralized Market Maker platform, combining:
 * - RPQ Service API for offer discovery and quotes
 * - Web3 smart contract interactions for on-chain execution
 *
 * @example
 * ```typescript
 * import { MarketMakerClient, Network } from '@swarm-markets/market-maker-sdk';
 *
 * const client = new MarketMakerClient({
 *   network: Network.POLYGON,
 *   privateKey: '0x...',
 *   rpqApiKey: 'your-key',
 *   userEmail: 'user@example.com'
 * });
 *
 * await client.initialize();
 *
 * // Get a quote
 * const quote = await client.getQuote('0xUSDC...', '0xRWA...', 100);
 *
 * // Execute trade
 * const result = await client.trade({
 *   fromToken: '0xUSDC...',
 *   toToken: '0xRWA...',
 *   fromAmount: 100
 * });
 *
 * console.log(`Trade successful! TX: ${result.txHash}`);
 *
 * await client.close();
 * ```
 */

// Re-export shared types
export { Network, type Quote, type TradeResult } from "@swarm-markets/shared";

// Main client
export {
  MarketMakerClient,
  type MarketMakerClientOptions,
} from "./sdk/index.js";

// RPQ Service
export {
  RPQClient,
  OfferType,
  OfferStatus,
  PricingType,
  PercentageType,
  AssetType,
  type Offer,
  type SelectedOffer,
  type BestOffersResult,
  type BestOffersResponse,
  type PriceFeed,
  type PriceFeedsResponse,
  type QuoteRequest,
  type QuoteResponse,
  type Asset,
  type OfferPrice,
  RPQServiceException,
  NoOffersAvailableException,
  InvalidTokenPairException,
  QuoteUnavailableException,
  PriceFeedNotFoundException,
} from "./rpqService/index.js";

// Web3 Client
export {
  MarketMakerWeb3Client,
  MARKET_MAKER_MANAGER_ABI,
  getMarketMakerManagerAddress,
  MarketMakerWeb3Exception,
  OfferNotFoundError,
  OfferInactiveError,
  InsufficientOfferBalanceError,
  OfferExpiredError,
  UnauthorizedError,
} from "./marketMakerWeb3/index.js";
