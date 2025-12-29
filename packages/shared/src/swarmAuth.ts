/**
 * Swarm authentication module - consolidates wallet-based authentication.
 */

import { type Address, type Hash } from "viem";
import { privateKeyToAccount, signMessage } from "viem/accounts";

import { BaseAPIClient, APIException } from "./baseClient.js";
import { getSwarmAuthUrl } from "./config.js";

// ============================================================================
// Exceptions
// ============================================================================

/**
 * Raised when message signing takes too long.
 */
export class SigningTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SigningTimeoutError";
  }
}

/**
 * Raised when authentication fails.
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// ============================================================================
// Data Models
// ============================================================================

export interface NonceResponse {
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface UserAttributes {
  id: number;
  email: string;
  role: string;
  nftRole: string;
  smtClaims: number;
  affiliateId: string;
  affiliateLocked: boolean;
  affiliate: number;
  affiliateUpdatedAt: string | null;
  affiliateCampaign: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  address: string;
  user: UserAttributes;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  address: string;
}

/**
 * Check if access token is expired.
 */
export function isTokenExpired(tokens: AuthTokens): boolean {
  return new Date() >= tokens.expiresAt;
}

/**
 * Check if refresh token is expired.
 */
export function isRefreshTokenExpired(tokens: AuthTokens): boolean {
  return new Date() >= tokens.refreshExpiresAt;
}

// ============================================================================
// Token Storage
// ============================================================================

export interface TokenStorageInterface {
  save(address: string, tokens: AuthTokens): void;
  load(address: string): AuthTokens | null;
  clear(address: string): void;
}

/**
 * Simple in-memory token storage (not persistent).
 */
export class InMemoryStorage implements TokenStorageInterface {
  private store: Map<string, AuthTokens> = new Map();

  save(address: string, tokens: AuthTokens): void {
    this.store.set(address, tokens);
  }

  load(address: string): AuthTokens | null {
    return this.store.get(address) ?? null;
  }

  clear(address: string): void {
    this.store.delete(address);
  }
}

// ============================================================================
// Authentication Client
// ============================================================================

interface AuthResponse {
  data?: {
    attributes?: Record<string, unknown>;
  };
}

interface RegisterAPIResponse {
  data?: {
    attributes?: {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      refresh_expires_in?: number;
      address?: string;
      user?: {
        attributes?: Record<string, unknown>;
      };
    };
  };
}

/**
 * Swarm authentication client using wallet signatures.
 *
 * Provides wallet-based authentication for Swarm services:
 * 1. Checks if wallet is registered
 * 2. Requests nonce message
 * 3. Signs message with private key
 * 4. Logs in or registers based on existence
 * 5. Returns authentication tokens
 *
 * Both Cross-Chain Access and Market Maker SDKs use this for authentication.
 * Environment (dev/prod) is controlled via SWARM_COLLECTION_MODE env variable.
 */
export class SwarmAuth extends BaseAPIClient {
  private storage: TokenStorageInterface;

  constructor(storage?: TokenStorageInterface) {
    super(getSwarmAuthUrl());
    this.storage = storage ?? new InMemoryStorage();
  }

  /**
   * Check if wallet address is registered.
   *
   * @param address - Wallet address
   * @returns True if address exists, False otherwise
   */
  async checkExistence(address: string): Promise<boolean> {
    const normalizedAddress = address;
    const endpoint = `/addresses/${normalizedAddress}`;

    try {
      await this.makeRequest("GET", endpoint);
      return true;
    } catch (error) {
      if (error instanceof APIException) {
        if (
          error.statusCode === 404 ||
          error.message.includes("404") ||
          error.message.includes("Not Found")
        ) {
          return false;
        }
      }
      throw error;
    }
  }

  /**
   * Request nonce message for signing.
   *
   * @param address - Wallet address
   * @param terms - Optional terms hash (used for registration)
   * @returns NonceResponse with message to sign
   */
  async getNonce(address: string, terms?: string): Promise<NonceResponse> {
    const endpoint = "/nonce";
    const payload: Record<string, unknown> = {
      data: {
        type: "auth_nonce_request",
        attributes: {
          address: address,
          ...(terms && { terms_hash: terms }),
        },
      },
    };

    const response = await this.makeRequest<AuthResponse>(
      "POST",
      endpoint,
      payload
    );
    const attrs = response.data?.attributes ?? {};
    const message = (attrs["message"] as string) ?? "";

    return { message };
  }

  /**
   * Login with signed message.
   *
   * @param address - Wallet address
   * @param signedMessage - Signed nonce message
   * @returns LoginResponse with tokens
   */
  async login(address: string, signedMessage: string): Promise<LoginResponse> {
    const endpoint = "/login";
    const payload = {
      data: {
        type: "login_request",
        attributes: {
          auth_pair: {
            address: address,
            signed_message: signedMessage,
          },
        },
      },
    };

    const response = await this.makeRequest<AuthResponse>(
      "POST",
      endpoint,
      payload
    );
    const attrs = response.data?.attributes ?? {};

    return {
      accessToken: attrs["access_token"] as string,
      refreshToken: attrs["refresh_token"] as string,
      tokenType: attrs["token_type"] as string,
      expiresIn: Number(attrs["expires_in"] ?? 0),
      refreshExpiresIn: Number(attrs["refresh_expires_in"] ?? 0),
    };
  }

  /**
   * Register new user with signed message.
   *
   * @param address - Wallet address
   * @param signedMessage - Signed nonce message
   * @param safeAddresses - Optional Gnosis Safe addresses by network
   * @returns RegisterResponse with tokens and user info
   */
  async register(
    address: string,
    signedMessage: string,
    safeAddresses?: Record<string, string[]>
  ): Promise<RegisterResponse> {
    const endpoint = "/register";
    const payload: Record<string, unknown> = {
      data: {
        type: "register",
        attributes: {
          auth_pair: {
            address: address,
            signed_message: signedMessage,
          },
          ...(safeAddresses && { safe_addresses: safeAddresses }),
        },
      },
    };

    const response = await this.makeRequest<RegisterAPIResponse>(
      "POST",
      endpoint,
      payload
    );
    const attrs = response.data?.attributes ?? {};
    const userAttrs = attrs.user?.attributes ?? {};

    const user: UserAttributes = {
      id: Number(userAttrs["id"] ?? 0),
      email: (userAttrs["email"] as string) ?? "",
      role: (userAttrs["role"] as string) ?? "user",
      nftRole: (userAttrs["nft_role"] as string) ?? "",
      smtClaims: Number(userAttrs["smt_claims"] ?? 0),
      affiliateId: (userAttrs["affiliate_id"] as string) ?? "",
      affiliateLocked: Boolean(userAttrs["affiliate_locked"]),
      affiliate: Number(userAttrs["affiliate"] ?? 0),
      affiliateUpdatedAt: (userAttrs["affiliate_updated_at"] as string) ?? null,
      affiliateCampaign: (userAttrs["affiliate_campaign"] as string) ?? "",
    };

    return {
      accessToken: attrs.access_token ?? "",
      refreshToken: attrs.refresh_token ?? "",
      tokenType: attrs.token_type ?? "",
      expiresIn: Number(attrs.expires_in ?? 0),
      refreshExpiresIn: Number(attrs.refresh_expires_in ?? 0),
      address: attrs.address ?? "",
      user,
    };
  }

  /**
   * Complete authentication flow: check existence, sign message, login/register.
   *
   * This is the main method to use for authentication.
   *
   * @param privateKey - Private key for signing
   * @param safeAddresses - Optional Gnosis Safe addresses
   * @param signingTimeoutMs - Timeout for message signing (milliseconds)
   * @returns AuthTokens with access and refresh tokens
   */
  async verify(
    privateKey: string,
    safeAddresses?: Record<string, string[]>,
    signingTimeoutMs: number = 60000
  ): Promise<AuthTokens> {
    // Normalize private key to ensure 0x prefix
    const normalizedKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`);

    const account = privateKeyToAccount(normalizedKey);
    const address = account.address;

    console.log(`Authenticating wallet: ${address}`);

    // Step 1: Check if wallet is registered
    const exists = await this.checkExistence(address);
    console.log(`Wallet exists: ${exists}`);

    // Step 2: Get nonce message
    let nonce: NonceResponse;
    if (exists) {
      nonce = await this.getNonce(address);
    } else {
      nonce = await this.getNonce(address, "Terms and Conditions");
    }
    console.log("nonce", address, nonce);

    // Step 3: Sign message with timeout
    let signature: Hash;
    try {
      signature = await Promise.race([
        signMessage({
          privateKey: normalizedKey,
          message: nonce.message,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new SigningTimeoutError(
                  `Signing took longer than ${signingTimeoutMs}ms`
                )
              ),
            signingTimeoutMs
          )
        ),
      ]);
    } catch (error) {
      if (error instanceof SigningTimeoutError) {
        throw error;
      }
      throw new AuthenticationError(`Failed to sign message: ${error}`);
    }

    // Ensure signature starts with 0x
    const signatureHex = signature.startsWith("0x")
      ? signature
      : `0x${signature}`;

    // Step 4: Login or register
    let tokens: AuthTokens;
    const now = new Date();

    if (exists) {
      const resp = await this.login(address, signatureHex);
      tokens = {
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken,
        expiresAt: new Date(now.getTime() + resp.expiresIn * 1000),
        refreshExpiresAt: new Date(
          now.getTime() + resp.refreshExpiresIn * 1000
        ),
        address,
      };
    } else {
      const resp = await this.register(address, signatureHex, safeAddresses);
      tokens = {
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken,
        expiresAt: new Date(now.getTime() + resp.expiresIn * 1000),
        refreshExpiresAt: new Date(
          now.getTime() + resp.refreshExpiresIn * 1000
        ),
        address: resp.address || address,
      };
    }

    // Step 5: Store tokens
    this.storage.save(address, tokens);
    console.log(
      `Authentication successful. Token expires at: ${tokens.expiresAt}`
    );

    return tokens;
  }

  /**
   * Load stored tokens for an address.
   */
  loadTokens(address: string): AuthTokens | null {
    return this.storage.load(address);
  }

  /**
   * Clear stored tokens for an address.
   */
  clearTokens(address: string): void {
    this.storage.clear(address);
  }
}
