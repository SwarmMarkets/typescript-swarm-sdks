/**
 * Swarm Trading SDK
 *
 * Unified trading SDK with smart routing between Market Maker and Cross-Chain Access platforms.
 */

// Re-export common types from shared
export { Network, type Quote, type TradeResult } from "@swarm-markets/shared";

// Main SDK client
export {
  TradingClient,
  type TradingClientOptions,
  type TradeOptions,
} from "./sdk/index.js";

// Routing
export {
  Router,
  RoutingStrategy,
  createPlatformOption,
  getEffectiveRate,
  type PlatformOption,
} from "./routing.js";

// Exceptions
export {
  TradingException,
  NoLiquidityException,
  AllPlatformsFailedException,
  InvalidRoutingStrategyException,
} from "./exceptions.js";

// Re-export underlying SDK clients for direct access if needed
export { MarketMakerClient } from "@swarm-markets/market-maker-sdk";
export { CrossChainAccessClient } from "@swarm-markets/cross-chain-access-sdk";
