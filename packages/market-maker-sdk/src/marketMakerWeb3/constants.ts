/**
 * Market Maker smart contract ABIs and addresses.
 *
 * Contract addresses are now fetched from remote configuration.
 * Use getMarketMakerManagerAddress() to retrieve addresses dynamically.
 */

import { getConfigFetcher, getIsDev } from "@swarm/shared";

/**
 * Market Maker Manager contract ABI (simplified - only methods we need).
 */
export const MARKET_MAKER_MANAGER_ABI = [
  // Take fixed offer
  {
    inputs: [
      { internalType: "uint256", name: "offerId", type: "uint256" },
      {
        internalType: "uint256",
        name: "withdrawalAmountPaid",
        type: "uint256",
      },
      { internalType: "address", name: "affiliate", type: "address" },
    ],
    name: "takeOfferFixed",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Take dynamic offer
  {
    inputs: [
      { internalType: "uint256", name: "offerId", type: "uint256" },
      {
        internalType: "uint256",
        name: "withdrawalAmountPaid",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximumDepositToWithdrawalRate",
        type: "uint256",
      },
      { internalType: "address", name: "affiliate", type: "address" },
    ],
    name: "takeOfferDynamic",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Make offer
  {
    inputs: [
      { internalType: "address", name: "depositToken", type: "address" },
      { internalType: "uint256", name: "depositAmount", type: "uint256" },
      { internalType: "address", name: "withdrawToken", type: "address" },
      { internalType: "uint256", name: "withdrawAmount", type: "uint256" },
      { internalType: "bool", name: "isDynamic", type: "bool" },
      { internalType: "uint256", name: "expiresAt", type: "uint256" },
    ],
    name: "makeOffer",
    outputs: [{ internalType: "uint256", name: "offerId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Cancel offer
  {
    inputs: [{ internalType: "uint256", name: "offerId", type: "uint256" }],
    name: "cancelOffer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Get offer details
  {
    inputs: [{ internalType: "uint256", name: "offerId", type: "uint256" }],
    name: "getOffer",
    outputs: [
      { internalType: "address", name: "maker", type: "address" },
      { internalType: "address", name: "depositToken", type: "address" },
      { internalType: "uint256", name: "depositAmount", type: "uint256" },
      { internalType: "address", name: "withdrawToken", type: "address" },
      { internalType: "uint256", name: "withdrawAmount", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "bool", name: "isDynamic", type: "bool" },
      { internalType: "uint256", name: "expiresAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Get Market Maker Manager contract address for a specific chain.
 *
 * Fetches from remote configuration.
 *
 * @param chainId - Blockchain network ID
 * @returns Market Maker Manager contract address
 */
export async function getMarketMakerManagerAddress(
  chainId: number
): Promise<string> {
  const isDev = getIsDev();
  const fetcher = await getConfigFetcher(isDev);
  return fetcher.getMarketMakerManagerAddress(chainId);
}
