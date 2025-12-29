/**
 * Remote configuration fetcher with auto-refresh.
 *
 * This module fetches configuration from remote JSON files and caches them
 * with automatic refresh every 5 minutes.
 *
 * Configuration includes:
 * - Topup/escrow addresses for Cross-Chain Access
 * - Market Maker Manager contract addresses
 */

/**
 * Remote configuration structure.
 */
interface RemoteConfig {
  version?: string;
  topup_addresses?: {
    cross_chain_access_escrow?: string;
  };
  dotc_manager_addresses?: Record<string, string>;
}

/**
 * Remote config fetcher with auto-refresh and caching.
 */
export class RemoteConfigFetcher {
  /** Refresh interval: 5 minutes */
  static readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000;

  private readonly isDev: boolean;
  private readonly configUrl: string;
  private cache: RemoteConfig | null = null;
  private lastFetch: Date | null = null;
  private fetchPromise: Promise<boolean> | null = null;

  constructor(isDev: boolean = false) {
    this.isDev = isDev;

    const devUrl =
      "https://swarm-sdk-configurations.s3.eu-central-1.amazonaws.com/config.dev.json";
    const prodUrl =
      "https://swarm-sdk-configurations.s3.eu-central-1.amazonaws.com/config.prod.json";

    this.configUrl = isDev ? devUrl : prodUrl;
  }

  /**
   * Initialize the config fetcher and load initial configuration.
   *
   * @throws Error if configuration cannot be loaded from remote
   */
  async initialize(): Promise<void> {
    await this.fetchConfig();

    if (!this.cache) {
      throw new Error(
        `Failed to load configuration from remote: ${this.configUrl}`
      );
    }
  }

  /**
   * Fetch configuration from remote URL.
   */
  private async fetchConfig(): Promise<boolean> {
    // Prevent concurrent fetches
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = this.doFetch();
    try {
      return await this.fetchPromise;
    } finally {
      this.fetchPromise = null;
    }
  }

  private async doFetch(): Promise<boolean> {
    try {
      const response = await fetch(this.configUrl, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Remote config returned status ${response.status}`);
        return false;
      }

      const config = (await response.json()) as RemoteConfig;
      this.cache = config;
      this.lastFetch = new Date();
      return true;
    } catch (error) {
      console.error("Failed to fetch remote config:", error);
      return false;
    }
  }

  /**
   * Refresh configuration if cache is stale.
   */
  private async maybeRefresh(): Promise<void> {
    if (!this.lastFetch) {
      await this.fetchConfig();
      return;
    }

    const timeSinceFetch = Date.now() - this.lastFetch.getTime();
    if (timeSinceFetch >= RemoteConfigFetcher.REFRESH_INTERVAL_MS) {
      await this.fetchConfig();
    }
  }

  /**
   * Get Cross-Chain Access escrow/topup address.
   *
   * @throws Error if configuration not loaded or address not found
   */
  getTopupAddress(): string {
    if (!this.cache) {
      throw new Error("Configuration not loaded. Call initialize() first.");
    }

    const address = this.cache.topup_addresses?.cross_chain_access_escrow;
    if (!address) {
      throw new Error("Topup address not found in configuration");
    }

    return address;
  }

  /**
   * Get Market Maker Manager contract address for a specific chain.
   *
   * @param chainId - Blockchain network ID (e.g., 1 for Ethereum, 137 for Polygon)
   * @throws Error if configuration not loaded or address not found for chain
   */
  getMarketMakerManagerAddress(chainId: number): string {
    if (!this.cache) {
      throw new Error("Configuration not loaded. Call initialize() first.");
    }

    const address = this.cache.dotc_manager_addresses?.[String(chainId)];
    if (!address) {
      throw new Error(
        `Market Maker Manager address not found for chain ID ${chainId}`
      );
    }

    return address;
  }

  /**
   * Get configuration version.
   */
  getConfigVersion(): string {
    return this.cache?.version ?? "unknown";
  }

  /**
   * Get entire configuration dictionary.
   */
  getAllConfig(): RemoteConfig {
    if (!this.cache) {
      throw new Error("Configuration not loaded. Call initialize() first.");
    }
    return { ...this.cache };
  }
}

// Global singleton instances
let prodFetcher: RemoteConfigFetcher | null = null;
let devFetcher: RemoteConfigFetcher | null = null;

/**
 * Get or create the global config fetcher singleton.
 *
 * @param isDev - Whether to use development configuration
 */
export async function getConfigFetcher(
  isDev: boolean = false
): Promise<RemoteConfigFetcher> {
  if (isDev) {
    if (!devFetcher) {
      devFetcher = new RemoteConfigFetcher(true);
      await devFetcher.initialize();
    }
    return devFetcher;
  } else {
    if (!prodFetcher) {
      prodFetcher = new RemoteConfigFetcher(false);
      await prodFetcher.initialize();
    }
    return prodFetcher;
  }
}

/**
 * Close all config fetcher instances.
 * Should be called during application shutdown.
 */
export function closeConfigFetchers(): void {
  prodFetcher = null;
  devFetcher = null;
}
