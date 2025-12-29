/**
 * Market Maker Web3 client for smart contract interactions.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  getAddress,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
  getContract,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, polygon, base, bsc } from "viem/chains";

import {
  Network,
  getNetworkName,
  RPC_ENDPOINTS,
  ERC20_ABI,
  TX_TIMEOUT_MS,
  GAS_BUFFER_MULTIPLIER,
} from "@swarm/shared";

import {
  MARKET_MAKER_MANAGER_ABI,
  getMarketMakerManagerAddress,
} from "./constants.js";
import {
  MarketMakerWeb3Exception,
  OfferNotFoundError,
  OfferInactiveError,
  InsufficientOfferBalanceError,
  OfferExpiredError,
  UnauthorizedError,
} from "./exceptions.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Get viem chain configuration from Network enum.
 */
function getChainConfig(network: Network): Chain {
  switch (network) {
    case Network.ETHEREUM:
      return mainnet;
    case Network.POLYGON:
      return polygon;
    case Network.BASE:
      return base;
    case Network.BSC:
      return bsc;
    default:
      throw new MarketMakerWeb3Exception(`Unsupported network: ${network}`);
  }
}

/**
 * Client for interacting with Market Maker smart contracts.
 *
 * Provides methods to:
 * - Take fixed and dynamic offers
 * - Make new offers
 * - Cancel existing offers
 * - Approve tokens for trading
 */
export class MarketMakerWeb3Client {
  readonly network: Network;
  readonly address: Address;

  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly chain: Chain;
  private readonly account: Account;
  private contractAddress: Address | null = null;

  // Cache for token decimals
  private readonly decimalsCache: Map<string, number> = new Map();

  constructor(network: Network, privateKey: string, rpcUrl?: string) {
    this.network = network;
    this.chain = getChainConfig(network);

    const url = rpcUrl ?? RPC_ENDPOINTS[network];
    if (!url) {
      throw new MarketMakerWeb3Exception(
        `No RPC URL for network: ${getNetworkName(network)}`
      );
    }

    // Normalize private key to ensure 0x prefix
    const normalizedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`);

    const account = privateKeyToAccount(normalizedKey);
    this.account = account;
    this.address = account.address;

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(url),
    });

    this.walletClient = createWalletClient({
      account,
      chain: this.chain,
      transport: http(url),
    });

    console.log(
      `Initialized Market Maker Web3 client for ${getNetworkName(
        network
      )} with account ${this.address}`
    );
  }

  /**
   * Ensure Market Maker Manager contract address is loaded.
   */
  private async ensureContractLoaded(): Promise<Address> {
    if (this.contractAddress) {
      return this.contractAddress;
    }

    const address = await getMarketMakerManagerAddress(this.network);

    if (!address || address === ZERO_ADDRESS) {
      throw new MarketMakerWeb3Exception(
        `Market Maker Manager contract not deployed on network ${getNetworkName(
          this.network
        )}`
      );
    }

    // Use getAddress to ensure proper checksum
    this.contractAddress = getAddress(address) as Address;
    console.log(
      `Market Maker Manager contract loaded: ${this.contractAddress}`
    );

    return this.contractAddress;
  }

  /**
   * Take a fixed-price offer.
   *
   * When taking an offer:
   * - Taker PAYS the withdrawal asset (what maker wants to receive)
   * - Taker RECEIVES the deposit asset (what maker deposited)
   *
   * @param offerId - Unique offer identifier
   * @param withdrawalToken - Token address to pay (maker's withdrawalAsset)
   * @param withdrawalAmountPaid - Amount to pay in smallest units (from RPQ API amountIn)
   * @param affiliate - Optional affiliate address for fee sharing
   * @returns Transaction hash
   */
  async takeOfferFixed(
    offerId: string,
    withdrawalToken: Address,
    withdrawalAmountPaid: bigint,
    affiliate?: Address
  ): Promise<Hash> {
    try {
      const contractAddress = await this.ensureContractLoaded();

      console.log(
        `Taking fixed offer ${offerId} with ${withdrawalAmountPaid} tokens`
      );

      // Convert offer_id to bigint
      const offerIdBigInt = offerId.startsWith("0x")
        ? BigInt(offerId)
        : BigInt(offerId);

      const affiliateAddress = affiliate ?? ZERO_ADDRESS;

      // Approve tokens if needed
      await this.approveTokenIfNeeded(
        withdrawalToken,
        contractAddress,
        withdrawalAmountPaid
      );

      // Take offer on-chain
      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: MARKET_MAKER_MANAGER_ABI,
        functionName: "takeOfferFixed",
        args: [offerIdBigInt, withdrawalAmountPaid, affiliateAddress],
        chain: this.chain,
        account: this.account,
      });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: TX_TIMEOUT_MS,
      });

      if (receipt.status === "reverted") {
        throw new MarketMakerWeb3Exception("Transaction reverted");
      }

      console.log(`Successfully took fixed offer ${offerId}: ${hash}`);
      return hash;
    } catch (error) {
      if (error instanceof MarketMakerWeb3Exception) {
        throw error;
      }
      this.handleContractError(error, "take fixed offer");
      throw error; // TypeScript needs this
    }
  }

  /**
   * Take a dynamic-price offer.
   *
   * Dynamic offers use real-time price feeds to determine exchange rates.
   *
   * @param offerId - Unique offer identifier
   * @param withdrawalToken - Token address to pay
   * @param withdrawalAmountPaid - Amount to pay in smallest units
   * @param maximumDepositToWithdrawalRate - Max on-chain rate to accept
   * @param affiliate - Optional affiliate address
   * @returns Transaction hash
   */
  async takeOfferDynamic(
    offerId: string,
    withdrawalToken: Address,
    withdrawalAmountPaid: bigint,
    maximumDepositToWithdrawalRate: bigint,
    affiliate?: Address
  ): Promise<Hash> {
    try {
      const contractAddress = await this.ensureContractLoaded();

      console.log(
        `Taking dynamic offer ${offerId} with ${withdrawalAmountPaid} tokens ` +
          `(max rate: ${maximumDepositToWithdrawalRate})`
      );

      const offerIdBigInt = offerId.startsWith("0x")
        ? BigInt(offerId)
        : BigInt(offerId);

      const affiliateAddress = affiliate ?? ZERO_ADDRESS;

      // Approve tokens if needed
      await this.approveTokenIfNeeded(
        withdrawalToken,
        contractAddress,
        withdrawalAmountPaid
      );

      // Take offer on-chain
      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: MARKET_MAKER_MANAGER_ABI,
        functionName: "takeOfferDynamic",
        args: [
          offerIdBigInt,
          withdrawalAmountPaid,
          maximumDepositToWithdrawalRate,
          affiliateAddress,
        ],
        chain: this.chain,
        account: this.account,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: TX_TIMEOUT_MS,
      });

      if (receipt.status === "reverted") {
        throw new MarketMakerWeb3Exception("Transaction reverted");
      }

      console.log(`Successfully took dynamic offer ${offerId}: ${hash}`);
      return hash;
    } catch (error) {
      if (error instanceof MarketMakerWeb3Exception) {
        throw error;
      }
      this.handleContractError(error, "take dynamic offer");
      throw error;
    }
  }

  /**
   * Create a new Market Maker offer.
   *
   * @param depositToken - Token to deposit
   * @param depositAmount - Amount to deposit (normalized)
   * @param withdrawToken - Token to withdraw
   * @param withdrawAmount - Amount to withdraw (normalized)
   * @param isDynamic - Whether to create dynamic offer
   * @param expiresAt - Optional expiration timestamp (0 = no expiry)
   * @returns Tuple of (transaction_hash, offer_id)
   */
  async makeOffer(
    depositToken: Address,
    depositAmount: number,
    withdrawToken: Address,
    withdrawAmount: number,
    isDynamic: boolean = false,
    expiresAt?: number
  ): Promise<[Hash, string]> {
    try {
      const contractAddress = await this.ensureContractLoaded();

      console.log(
        `Creating ${isDynamic ? "dynamic" : "fixed"} offer: ` +
          `${depositAmount} -> ${withdrawAmount}`
      );

      // Get decimals
      const depositDecimals = await this.getTokenDecimals(depositToken);
      const withdrawDecimals = await this.getTokenDecimals(withdrawToken);

      const depositWei = parseUnits(String(depositAmount), depositDecimals);
      const withdrawWei = parseUnits(String(withdrawAmount), withdrawDecimals);

      // Approve deposit tokens
      await this.approveTokenIfNeeded(
        depositToken,
        contractAddress,
        depositWei
      );

      const expiresTimestamp = BigInt(expiresAt ?? 0);

      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: MARKET_MAKER_MANAGER_ABI,
        functionName: "makeOffer",
        args: [
          depositToken,
          depositWei,
          withdrawToken,
          withdrawWei,
          isDynamic,
          expiresTimestamp,
        ],
        chain: this.chain,
        account: this.account,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: TX_TIMEOUT_MS,
      });

      if (receipt.status === "reverted") {
        throw new MarketMakerWeb3Exception("Transaction reverted");
      }

      // TODO: Parse offer ID from logs
      const offerId = "0";

      console.log(`Successfully created offer ${offerId}: ${hash}`);
      return [hash, offerId];
    } catch (error) {
      if (error instanceof MarketMakerWeb3Exception) {
        throw error;
      }
      throw new MarketMakerWeb3Exception(`Failed to make offer: ${error}`);
    }
  }

  /**
   * Cancel an existing offer.
   *
   * @param offerId - Offer ID to cancel
   * @returns Transaction hash
   */
  async cancelOffer(offerId: string): Promise<Hash> {
    try {
      const contractAddress = await this.ensureContractLoaded();

      console.log(`Cancelling offer ${offerId}`);

      const offerIdBigInt = offerId.startsWith("0x")
        ? BigInt(offerId)
        : BigInt(offerId);

      const hash = await this.walletClient.writeContract({
        address: contractAddress,
        abi: MARKET_MAKER_MANAGER_ABI,
        functionName: "cancelOffer",
        args: [offerIdBigInt],
        chain: this.chain,
        account: this.account,
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: TX_TIMEOUT_MS,
      });

      if (receipt.status === "reverted") {
        throw new MarketMakerWeb3Exception("Transaction reverted");
      }

      console.log(`Successfully cancelled offer ${offerId}: ${hash}`);
      return hash;
    } catch (error) {
      if (error instanceof MarketMakerWeb3Exception) {
        throw error;
      }
      throw new MarketMakerWeb3Exception(`Failed to cancel offer: ${error}`);
    }
  }

  /**
   * Approve token spending if allowance is insufficient.
   */
  private async approveTokenIfNeeded(
    tokenAddress: Address,
    spender: Address,
    amount: bigint
  ): Promise<void> {
    const allowance = (await this.publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [this.address, spender],
    })) as bigint;

    if (allowance >= amount) {
      console.log("Sufficient allowance, skipping approval");
      return;
    }

    console.log(`Approving ${amount} tokens for ${spender}`);

    const hash = await this.walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amount],
      chain: this.chain,
      account: this.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash,
      timeout: TX_TIMEOUT_MS,
    });

    if (receipt.status === "reverted") {
      throw new MarketMakerWeb3Exception("Approval transaction reverted");
    }

    console.log(`Approval confirmed: ${hash}`);
  }

  /**
   * Get token decimals with caching.
   */
  private async getTokenDecimals(tokenAddress: Address): Promise<number> {
    const cacheKey = tokenAddress;
    const cached = this.decimalsCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const decimals = await this.publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      });
      const value = Number(decimals);
      this.decimalsCache.set(cacheKey, value);
      return value;
    } catch (error) {
      console.warn(
        `Failed to get decimals for ${tokenAddress}, using default 18`
      );
      return 18;
    }
  }

  /**
   * Handle contract errors and convert to appropriate exception types.
   */
  private handleContractError(error: unknown, operation: string): never {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes("OfferNotFound") ||
      message.includes("offer does not exist")
    ) {
      throw new OfferNotFoundError(`Offer not found during ${operation}`);
    }
    if (
      message.includes("OfferInactive") ||
      message.includes("offer is not active")
    ) {
      throw new OfferInactiveError(`Offer is inactive during ${operation}`);
    }
    if (
      message.includes("InsufficientBalance") ||
      message.includes("insufficient balance")
    ) {
      throw new InsufficientOfferBalanceError(
        `Insufficient balance during ${operation}`
      );
    }
    if (
      message.includes("OfferExpired") ||
      message.includes("offer has expired")
    ) {
      throw new OfferExpiredError(`Offer expired during ${operation}`);
    }
    if (
      message.includes("Unauthorized") ||
      message.includes("not authorized")
    ) {
      throw new UnauthorizedError(`Unauthorized for ${operation}`);
    }

    throw new MarketMakerWeb3Exception(`Failed to ${operation}: ${message}`);
  }
}
