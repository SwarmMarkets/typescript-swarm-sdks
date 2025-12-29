/**
 * Shared constants for Swarm SDK Collection.
 *
 * This module contains static addresses and configuration that do NOT vary by environment.
 * For environment-dependent values (dev/prod), see config.ts instead.
 */

import { Network } from "./models.js";

/**
 * USDC token addresses for different networks (static, not environment-dependent).
 */
export const USDC_ADDRESSES: Record<Network, string> = {
  [Network.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [Network.POLYGON]: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  [Network.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [Network.BSC]: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
};

/**
 * Common token decimals (static).
 */
export const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  DAI: 18,
  WETH: 18,
  WMATIC: 18,
};

/**
 * RPC endpoints for different networks (public RPCs).
 */
export const RPC_ENDPOINTS: Record<Network, string> = {
  [Network.ETHEREUM]: "https://eth.llamarpc.com",
  [Network.POLYGON]: "https://polygon-rpc.com",
  [Network.BASE]: "https://mainnet.base.org",
  [Network.BSC]: "https://bsc-dataseed.binance.org",
};

/**
 * Gas buffer multiplier (adds 20% to gas estimates for safety).
 */
export const GAS_BUFFER_MULTIPLIER = 1.2;

/**
 * Default gas limit for ERC20 transfers (fallback if estimation fails).
 */
export const DEFAULT_GAS_LIMIT = 100000n;

/**
 * Transaction timeout in milliseconds.
 */
export const TX_TIMEOUT_MS = 300000;

/**
 * ERC20 ABI (minimal for common operations).
 */
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "remaining", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;
