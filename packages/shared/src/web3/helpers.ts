/**
 * Web3 helper for blockchain transactions using viem.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, polygon, base, bsc } from "viem/chains";

import { Network, getNetworkName } from "../models.js";
import {
  ERC20_ABI,
  RPC_ENDPOINTS,
  GAS_BUFFER_MULTIPLIER,
  DEFAULT_GAS_LIMIT,
  TX_TIMEOUT_MS,
} from "../constants.js";
import {
  InsufficientBalanceException,
  TransactionFailedException,
  NetworkNotSupportedException,
} from "./exceptions.js";

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
      throw new NetworkNotSupportedException(String(network));
  }
}

/**
 * Gas estimation result.
 */
export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  gasCost: number;
}

/**
 * Async helper for Web3 blockchain interactions using viem.
 *
 * Provides methods for:
 * - ERC20 token operations (transfer, approve, balance, allowance)
 * - Gas estimation
 * - Transaction signing and submission
 * - Native token balance checks
 */
export class Web3Helper {
  readonly network: Network;
  readonly chainId: number;
  readonly address: Address;

  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly account: Account;
  private readonly chain: Chain;

  // Cache for token decimals
  private readonly decimalsCache: Map<string, number> = new Map();

  constructor(privateKey: string, network: Network, rpcUrl?: string) {
    this.network = network;
    this.chainId = network;
    this.chain = getChainConfig(network);

    const url = rpcUrl ?? RPC_ENDPOINTS[network];
    if (!url) {
      throw new NetworkNotSupportedException(getNetworkName(network));
    }

    // Normalize private key to ensure 0x prefix
    const normalizedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`);

    this.account = privateKeyToAccount(normalizedKey);
    this.address = this.account.address;

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(url),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(url),
    });

    console.log(
      `Initialized Web3Helper for ${getNetworkName(network)} (chain_id: ${
        this.chainId
      })`
    );
    console.log(`Wallet address: ${this.address}`);
    console.log(`RPC: ${url}`);
  }

  /**
   * Get ERC20 token balance.
   *
   * @param tokenAddress - Token contract address
   * @returns Token balance in normalized decimal units
   */
  async getBalance(tokenAddress: Address): Promise<number> {
    const balance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [this.address],
    });

    const decimals = await this.getTokenDecimals(tokenAddress);
    return parseFloat(formatUnits(balance as bigint, decimals));
  }

  /**
   * Get token allowance for a spender.
   *
   * @param tokenAddress - Token contract address
   * @param spender - Spender address
   * @returns Allowance in normalized decimal units
   */
  async getAllowance(tokenAddress: Address, spender: Address): Promise<number> {
    const allowance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [this.address, spender],
    });

    const decimals = await this.getTokenDecimals(tokenAddress);
    return parseFloat(formatUnits(allowance as bigint, decimals));
  }

  /**
   * Approve token spending.
   *
   * @param tokenAddress - Token contract address
   * @param spender - Spender address
   * @param amount - Amount to approve (normalized)
   * @param waitForReceipt - Wait for transaction confirmation
   * @returns Transaction hash
   */
  async approveToken(
    tokenAddress: Address,
    spender: Address,
    amount: number,
    waitForReceipt: boolean = true
  ): Promise<Hash> {
    const decimals = await this.getTokenDecimals(tokenAddress);
    const amountWei = parseUnits(String(amount), decimals);

    console.log(`Approving ${amount} tokens for ${spender}`);

    const hash = await this.walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amountWei],
      chain: this.chain,
      account: this.account,
    });

    if (waitForReceipt) {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: TX_TIMEOUT_MS,
      });

      if (receipt.status === "reverted") {
        throw new TransactionFailedException(
          "Approval transaction reverted",
          hash
        );
      }

      console.log(`Approval confirmed in block ${receipt.blockNumber}`);
    }

    return hash;
  }

  /**
   * Transfer ERC20 tokens.
   *
   * @param toAddress - Recipient address
   * @param tokenAddress - Token contract address
   * @param amount - Amount to transfer (normalized)
   * @param waitForReceipt - Wait for transaction confirmation
   * @returns Transaction hash
   */
  async transferToken(
    toAddress: Address,
    tokenAddress: Address,
    amount: number,
    waitForReceipt: boolean = true
  ): Promise<Hash> {
    // Check balance
    const balance = await this.getBalance(tokenAddress);
    if (balance < amount) {
      throw new InsufficientBalanceException(amount, balance, tokenAddress);
    }

    const decimals = await this.getTokenDecimals(tokenAddress);
    const amountWei = parseUnits(String(amount), decimals);

    console.log(`Transferring ${amount} tokens to ${toAddress}`);
    console.log(`Amount in smallest units: ${amountWei}`);

    // Estimate gas
    let gasLimit: bigint;
    try {
      const estimate = await this.publicClient.estimateContractGas({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress, amountWei],
        account: this.account,
      });
      gasLimit = BigInt(Math.ceil(Number(estimate) * GAS_BUFFER_MULTIPLIER));
    } catch (error) {
      console.warn("Gas estimation failed, using default:", error);
      gasLimit = DEFAULT_GAS_LIMIT;
    }

    const hash = await this.walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [toAddress, amountWei],
      gas: gasLimit,
      chain: this.chain,
      account: this.account,
    });

    console.log(`Transaction sent: ${hash}`);

    if (waitForReceipt) {
      console.log("Waiting for transaction confirmation...");
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: TX_TIMEOUT_MS,
      });

      if (receipt.status === "reverted") {
        throw new TransactionFailedException("Transaction reverted", hash);
      }

      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    }

    return hash;
  }

  /**
   * Estimate gas for token transfer.
   *
   * @param toAddress - Recipient address
   * @param tokenAddress - Token contract address
   * @param amount - Amount to transfer (normalized)
   * @returns Gas estimation details
   */
  async estimateGas(
    toAddress: Address,
    tokenAddress: Address,
    amount: number
  ): Promise<GasEstimate> {
    const decimals = await this.getTokenDecimals(tokenAddress);
    const amountWei = parseUnits(String(amount), decimals);

    let gasLimit: bigint;
    try {
      const estimate = await this.publicClient.estimateContractGas({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress, amountWei],
        account: this.account,
      });
      gasLimit = BigInt(Math.ceil(Number(estimate) * GAS_BUFFER_MULTIPLIER));
    } catch (error) {
      console.warn("Gas estimation failed, using default:", error);
      gasLimit = DEFAULT_GAS_LIMIT;
    }

    const gasPrice = await this.publicClient.getGasPrice();
    const gasCost = parseFloat(formatUnits(gasLimit * gasPrice, 18));

    return {
      gasLimit,
      gasPrice,
      gasCost,
    };
  }

  /**
   * Get native token balance (ETH, MATIC, etc.).
   *
   * @returns Native token balance
   */
  async getNativeBalance(): Promise<number> {
    const balance = await this.publicClient.getBalance({
      address: this.address,
    });
    return parseFloat(formatUnits(balance, 18));
  }

  /**
   * Check if connected to RPC.
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.publicClient.getChainId();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get token decimals with caching.
   *
   * @param tokenAddress - Token contract address
   * @returns Number of decimals (default 18 if call fails)
   */
  async getTokenDecimals(tokenAddress: Address): Promise<number> {
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
        `Failed to get decimals for ${tokenAddress}, using default 18:`,
        error
      );
      return 18;
    }
  }

  /**
   * Get the public client for direct access.
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * Get the wallet client for direct access.
   */
  getWalletClient(): WalletClient {
    return this.walletClient;
  }
}
