/**
 * Environment configuration for Swarm SDK Collection.
 *
 * This module provides environment-aware configuration for the SDK.
 * By default, all operations run in production mode.
 *
 * To switch to development mode, set environment variable:
 *   SWARM_COLLECTION_MODE=dev
 *
 * All addresses and URLs are centralized here to avoid hardcoding across the codebase.
 *
 * Dynamic addresses (topup addresses, Market Maker manager contracts) are fetched from remote
 * JSON files with auto-refresh every 5 minutes.
 */

import { RemoteConfigFetcher, getConfigFetcher } from "./remoteConfig.js";

/**
 * Check if running in development mode.
 *
 * @returns True if SWARM_COLLECTION_MODE=dev, False otherwise (prod is default)
 */
export function getIsDev(): boolean {
  const mode = process.env["SWARM_COLLECTION_MODE"] ?? "prod";
  return mode === "dev";
}

/**
 * Get Cross-Chain Access Stock Trading API URL based on environment.
 *
 * @returns Dev or Prod API URL
 */
export function getCrossChainAccessApiUrl(): string {
  if (getIsDev()) {
    return "https://stock-trading-api.dev.swarm.com/stock-trading";
  }
  return "https://stock-trading-api.app.swarm.com/stock-trading";
}

/**
 * Get Swarm Auth API URL.
 *
 * Note: Currently same for dev and prod.
 *
 * @returns Swarm Auth API URL
 */
export function getSwarmAuthUrl(): string {
  return "https://api.app.swarm.com";
}

/**
 * Get RFQ Service API URL.
 *
 * Note: Currently same for dev and prod.
 *
 * @returns RFQ Service API URL
 */
export function getRpqServiceUrl(): string {
  return "https://rfq.swarm.com/v1/client";
}

/**
 * Get Cross-Chain Access topup/escrow address from remote configuration.
 *
 * Fetches address from remote JSON file (or local fallback) with auto-refresh.
 *
 * @returns Topup address for current environment
 * @throws Error if configuration cannot be loaded
 */
export async function getTopupAddress(): Promise<string> {
  const fetcher = await getConfigFetcher(getIsDev());
  return fetcher.getTopupAddress();
}

/**
 * Get Market Maker Manager contract address from remote configuration.
 *
 * Fetches address from remote JSON file (or local fallback) with auto-refresh.
 *
 * @param chainId - Blockchain network ID (e.g., 1 for Ethereum, 137 for Polygon)
 * @returns Market Maker Manager contract address
 * @throws Error if configuration cannot be loaded or address not found
 */
export async function getDotcManagerAddress(chainId: number): Promise<string> {
  const fetcher = await getConfigFetcher(getIsDev());
  return fetcher.getMarketMakerManagerAddress(chainId);
}

/**
 * Environment info for debugging/logging.
 */
export interface EnvironmentInfo {
  mode: "dev" | "prod";
  crossChainAccessApiUrl: string;
  swarmAuthUrl: string;
  rpqServiceUrl: string;
  topupAddress: string;
}

/**
 * Get current environment configuration.
 *
 * @returns Object with environment settings
 */
export async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  const isDev = getIsDev();
  const topupAddress = await getTopupAddress();

  return {
    mode: isDev ? "dev" : "prod",
    crossChainAccessApiUrl: getCrossChainAccessApiUrl(),
    swarmAuthUrl: getSwarmAuthUrl(),
    rpqServiceUrl: getRpqServiceUrl(),
    topupAddress,
  };
}
