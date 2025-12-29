/**
 * Trading platform routing strategies.
 */

import type { Quote } from "@swarm-markets/shared";
import { NoLiquidityException } from "./exceptions.js";

/**
 * Platform routing strategy.
 */
export enum RoutingStrategy {
  /** Choose platform with best price */
  BEST_PRICE = "best_price",
  /** Try Cross-Chain Access first, fallback to Market Maker */
  CROSS_CHAIN_ACCESS_FIRST = "cross_chain_access_first",
  /** Try Market Maker first, fallback to Cross-Chain Access */
  MARKET_MAKER_FIRST = "market_maker_first",
  /** Only use Cross-Chain Access */
  CROSS_CHAIN_ACCESS_ONLY = "cross_chain_access_only",
  /** Only use Market Maker */
  MARKET_MAKER_ONLY = "market_maker_only",
}

/**
 * Represents a trading platform option with quote.
 */
export interface PlatformOption {
  /** Platform name ("cross_chain_access" or "market_maker") */
  platform: "cross_chain_access" | "market_maker";
  /** Quote from this platform */
  quote?: Quote;
  /** Whether platform is available */
  available: boolean;
  /** Error message if unavailable */
  error?: string;
}

/**
 * Create a platform option.
 */
export function createPlatformOption(
  platform: "cross_chain_access" | "market_maker",
  options: {
    quote?: Quote;
    available?: boolean;
    error?: string;
  } = {}
): PlatformOption {
  return {
    platform,
    quote: options.quote,
    available: options.available ?? true,
    error: options.error,
  };
}

/**
 * Get effective rate for comparison.
 * @returns Rate (buyAmount / sellAmount)
 */
export function getEffectiveRate(option: PlatformOption): number {
  if (!option.quote) {
    return 0;
  }

  if (option.quote.sellAmount === 0) {
    return 0;
  }

  return option.quote.buyAmount / option.quote.sellAmount;
}

/**
 * Smart router for choosing optimal trading platform.
 *
 * Implements various routing strategies to select between Market Maker and Cross-Chain Access
 * based on price, availability, and user preferences.
 */
export const Router = {
  /**
   * Select optimal platform based on strategy.
   *
   * @param crossChainAccessOption - Cross-Chain Access platform option with quote
   * @param marketMakerOption - Market Maker platform option with quote
   * @param strategy - Routing strategy to use
   * @param isBuy - Whether this is a buy order (affects price comparison)
   * @returns Selected PlatformOption
   * @throws NoLiquidityException if no platforms available
   */
  selectPlatform(
    crossChainAccessOption: PlatformOption,
    marketMakerOption: PlatformOption,
    strategy: RoutingStrategy,
    isBuy: boolean
  ): PlatformOption {
    console.log(`Routing with strategy: ${strategy}`);

    // Check availability
    const crossChainAccessAvailable =
      crossChainAccessOption.available && crossChainAccessOption.quote != null;
    const marketMakerAvailable =
      marketMakerOption.available && marketMakerOption.quote != null;

    if (!crossChainAccessAvailable && !marketMakerAvailable) {
      const errors: string[] = [];
      if (crossChainAccessOption.error) {
        errors.push(`Cross-Chain Access: ${crossChainAccessOption.error}`);
      }
      if (marketMakerOption.error) {
        errors.push(`Market Maker: ${marketMakerOption.error}`);
      }

      throw new NoLiquidityException(
        `No platforms available. ${errors.join("; ")}`
      );
    }

    // Strategy: CROSS_CHAIN_ACCESS_ONLY
    if (strategy === RoutingStrategy.CROSS_CHAIN_ACCESS_ONLY) {
      if (!crossChainAccessAvailable) {
        throw new NoLiquidityException(
          `Cross-Chain Access not available: ${crossChainAccessOption.error}`
        );
      }
      console.log(
        "Selected: Cross-Chain Access (CROSS_CHAIN_ACCESS_ONLY strategy)"
      );
      return crossChainAccessOption;
    }

    // Strategy: MARKET_MAKER_ONLY
    if (strategy === RoutingStrategy.MARKET_MAKER_ONLY) {
      if (!marketMakerAvailable) {
        throw new NoLiquidityException(
          `Market Maker not available: ${marketMakerOption.error}`
        );
      }
      console.log("Selected: Market Maker (MARKET_MAKER_ONLY strategy)");
      return marketMakerOption;
    }

    // Strategy: CROSS_CHAIN_ACCESS_FIRST
    if (strategy === RoutingStrategy.CROSS_CHAIN_ACCESS_FIRST) {
      if (crossChainAccessAvailable) {
        console.log(
          "Selected: Cross-Chain Access (CROSS_CHAIN_ACCESS_FIRST strategy)"
        );
        return crossChainAccessOption;
      } else if (marketMakerAvailable) {
        console.log(
          "Selected: Market Maker (fallback from Cross-Chain Access)"
        );
        return marketMakerOption;
      }
    }

    // Strategy: MARKET_MAKER_FIRST
    if (strategy === RoutingStrategy.MARKET_MAKER_FIRST) {
      if (marketMakerAvailable) {
        console.log("Selected: Market Maker (MARKET_MAKER_FIRST strategy)");
        return marketMakerOption;
      } else if (crossChainAccessAvailable) {
        console.log(
          "Selected: Cross-Chain Access (fallback from Market Maker)"
        );
        return crossChainAccessOption;
      }
    }

    // Strategy: BEST_PRICE (default)
    if (strategy === RoutingStrategy.BEST_PRICE) {
      if (crossChainAccessAvailable && !marketMakerAvailable) {
        console.log("Selected: Cross-Chain Access (only available)");
        return crossChainAccessOption;
      } else if (marketMakerAvailable && !crossChainAccessAvailable) {
        console.log("Selected: Market Maker (only available)");
        return marketMakerOption;
      }

      // Both available - compare prices
      const crossChainAccessRate = getEffectiveRate(crossChainAccessOption);
      const marketMakerRate = getEffectiveRate(marketMakerOption);

      console.log(
        `Comparing rates - Cross-Chain Access: ${crossChainAccessRate}, Market Maker: ${marketMakerRate}`
      );

      // For BUY orders: lower rate is better (less cost per token)
      // For SELL orders: higher rate is better (more return per token)
      if (isBuy) {
        if (crossChainAccessRate <= marketMakerRate) {
          console.log(
            `Selected: Cross-Chain Access (better buy rate: ${crossChainAccessRate})`
          );
          return crossChainAccessOption;
        } else {
          console.log(
            `Selected: Market Maker (better buy rate: ${marketMakerRate})`
          );
          return marketMakerOption;
        }
      } else {
        if (crossChainAccessRate >= marketMakerRate) {
          console.log(
            `Selected: Cross-Chain Access (better sell rate: ${crossChainAccessRate})`
          );
          return crossChainAccessOption;
        } else {
          console.log(
            `Selected: Market Maker (better sell rate: ${marketMakerRate})`
          );
          return marketMakerOption;
        }
      }
    }

    // Fallback (shouldn't reach here)
    console.warn("Routing fallback - selecting first available");
    return crossChainAccessAvailable
      ? crossChainAccessOption
      : marketMakerOption;
  },
} as const;
