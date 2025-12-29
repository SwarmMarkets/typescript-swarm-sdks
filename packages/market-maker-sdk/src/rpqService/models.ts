/**
 * Data models for Market Maker RPQ Service API responses.
 */

/**
 * Offer type enumeration.
 */
export enum OfferType {
  PARTIAL_OFFER = "PartialOffer",
  BLOCK_OFFER = "BlockOffer",
}

/**
 * Offer status enumeration.
 */
export enum OfferStatus {
  NOT_TAKEN = "NotTaken",
  PARTIALLY_TAKEN = "PartiallyTaken",
  TAKEN = "Taken",
}

/**
 * Pricing type enumeration.
 */
export enum PricingType {
  FIXED_PRICING = "FixedPricing",
  DYNAMIC_PRICING = "DynamicPricing",
}

/**
 * Percentage type enumeration.
 */
export enum PercentageType {
  PLUS = "Plus",
  MINUS = "Minus",
}

/**
 * Asset type enumeration.
 */
export enum AssetType {
  SECURITY = "Security",
  NO_TYPE = "NoType",
  GOLD = "Gold",
}

/**
 * Represents offer pricing information.
 */
export interface OfferPrice {
  id: string;
  pricingType: PricingType;
  percentage?: number;
  percentageType?: PercentageType;
  unitPrice?: string;
  depositAssetPrice?: Record<string, string>;
  withdrawalAssetPrice?: Record<string, string>;
}

/**
 * Represents an asset in an offer.
 */
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  address: string;
  tokenStandard: string;
  tradedVolume: string;
  assetType: AssetType;
  decimals?: number;
  tokenId?: number;
  kya?: string;
}

/**
 * Represents a Market Maker offer from RPQ API.
 */
export interface Offer {
  id: string;
  maker: string;
  amountIn: string;
  amountOut: string;
  availableAmount: string;
  depositAsset: Asset;
  withdrawalAsset: Asset;
  offerType: OfferType;
  offerStatus: OfferStatus;
  offerPrice: OfferPrice;
  isAuth: boolean;
  timelockPeriod: string;
  expiryTimestamp: string;
  terms?: unknown;
  commsLink?: string;
  authorizationAddresses?: string[];
  depositToWithdrawalRate?: string;
}

/**
 * Represents a selected offer in best offers response.
 */
export interface SelectedOffer {
  /** Offer ID */
  id: string;
  /** Amount paid in withdrawal asset (what taker pays) in smallest units (wei) */
  withdrawalAmountPaid: string;
  /** Number of decimals for the withdrawal token (e.g., 6 for USDC, 18 for ETH) */
  withdrawalAmountPaidDecimals: string;
  /** PartialOffer or BlockOffer */
  offerType: OfferType;
  /** Maker address */
  maker: string;
  /** Price per unit (deposit tokens per withdrawal token, in wei) */
  pricePerUnit: string;
  /** Fixed or Dynamic pricing */
  pricingType: PricingType;
  /** Exchange rate for dynamic offers (optional, in withdrawal token decimals) */
  depositToWithdrawalRate?: string;
}

/**
 * Result from best offers endpoint.
 */
export interface BestOffersResult {
  success: boolean;
  targetAmount: string;
  totalWithdrawalAmountPaid: string;
  selectedOffers: SelectedOffer[];
  mode: string; // "buy" or "sell"
}

/**
 * Response from best offers endpoint.
 */
export interface BestOffersResponse {
  success: boolean;
  result: BestOffersResult;
}

/**
 * Represents a price feed for dynamic offers.
 */
export interface PriceFeed {
  contractAddress: string;
  priceFeedAddress: string;
}

/**
 * Response from price feeds endpoint.
 */
export interface PriceFeedsResponse {
  success: boolean;
  priceFeeds: Record<string, string>;
}

/**
 * Request parameters for getting a quote.
 */
export interface QuoteRequest {
  buyAssetAddress: string;
  sellAssetAddress: string;
  network: string;
  targetSellAmount?: string;
  targetBuyAmount?: string;
}

/**
 * Response from quote endpoint.
 */
export interface QuoteResponse {
  success: boolean;
  buyAssetAddress: string;
  sellAssetAddress: string;
  averagePrice: string;
  sellAmount?: string;
  buyAmount?: string;
}
