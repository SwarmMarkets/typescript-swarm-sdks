/**
 * RPQ Service API client for Market Maker offers and quotes.
 */

import {
  BaseAPIClient,
  APIException,
  type Quote,
  getRpqServiceUrl,
} from "@swarm/shared";

import {
  type Offer,
  type BestOffersResponse,
  type BestOffersResult,
  type SelectedOffer,
  type PriceFeedsResponse,
  type QuoteRequest,
  type QuoteResponse,
  type Asset,
  type OfferPrice,
  OfferType,
  OfferStatus,
  PricingType,
  PercentageType,
  AssetType,
} from "./models.js";

import {
  RPQServiceException,
  NoOffersAvailableException,
  QuoteUnavailableException,
  PriceFeedNotFoundException,
} from "./exceptions.js";

/**
 * Client for interacting with Market Maker RPQ Service API.
 *
 * Provides methods to:
 * - Get all offers for a token pair
 * - Get best offers (optimal buy/sell)
 * - Get quotes for trading
 * - Get price feeds for dynamic offers
 */
export class RPQClient extends BaseAPIClient {
  private readonly network: string;
  private readonly apiKey?: string;

  constructor(network: string = "polygon", apiKey?: string) {
    super(getRpqServiceUrl());
    this.network = network;
    this.apiKey = apiKey;

    if (apiKey) {
      this.headers["X-API-Key"] = apiKey;
    }
  }

  /**
   * Get all available offers filtered by network and optionally by assets.
   *
   * @param buyAssetAddress - Filter by asset to buy (optional)
   * @param sellAssetAddress - Filter by asset to sell (optional)
   * @param page - Page number (default: 0)
   * @param limit - Number of offers per page (default: 100)
   * @returns List of matching offers
   */
  async getOffers(
    buyAssetAddress?: string,
    sellAssetAddress?: string,
    page: number = 0,
    limit: number = 100
  ): Promise<Offer[]> {
    if (!this.apiKey) {
      throw new RPQServiceException(
        "API key is required for get_offers endpoint"
      );
    }

    try {
      const params: Record<string, string | number> = {
        network: this.network,
        page,
        limit,
      };

      if (buyAssetAddress) {
        params["buyAssetAddress"] = buyAssetAddress;
      }
      if (sellAssetAddress) {
        params["sellAssetAddress"] = sellAssetAddress;
      }

      const response = await this.makeRequest<{ offers?: unknown[] }>(
        "GET",
        "/dotc_offers",
        undefined,
        params
      );

      const offersData = response.offers ?? [];

      if (offersData.length === 0) {
        throw new NoOffersAvailableException(
          `No offers available for the given parameters on network ${this.network}`
        );
      }

      const offers: Offer[] = offersData.map((offerDict) =>
        this.parseOffer(offerDict as Record<string, unknown>)
      );

      console.log(`Retrieved ${offers.length} offers on ${this.network}`);

      return offers;
    } catch (error) {
      if (error instanceof APIException) {
        if (error.statusCode === 401) {
          throw new RPQServiceException("Invalid or missing API key");
        }
        if (error.statusCode === 429) {
          throw new RPQServiceException("Monthly rate limit reached");
        }
      }
      if (error instanceof NoOffersAvailableException) {
        throw error;
      }
      throw new RPQServiceException(`Failed to get offers: ${error}`);
    }
  }

  /**
   * Get the best sequence of offers to reach a target amount.
   *
   * Given a pair of tokens and a target amount, finds the optimal combination
   * of offers that covers the target amount while maximizing efficiency.
   *
   * @param buyAssetAddress - Address of asset to buy (receive)
   * @param sellAssetAddress - Address of asset to sell (give up)
   * @param targetSellAmount - Target amount to sell in normal decimal units (optional)
   * @param targetBuyAmount - Target amount to buy in normal decimal units (optional)
   * @returns BestOffersResponse with selected offers and amounts
   */
  async getBestOffers(
    buyAssetAddress: string,
    sellAssetAddress: string,
    targetSellAmount?: string,
    targetBuyAmount?: string
  ): Promise<BestOffersResponse> {
    if (targetSellAmount && targetBuyAmount) {
      throw new Error(
        "Specify either targetSellAmount OR targetBuyAmount, not both"
      );
    }

    if (!targetSellAmount && !targetBuyAmount) {
      throw new Error(
        "Must specify either targetSellAmount OR targetBuyAmount"
      );
    }

    try {
      const params: Record<string, string | number> = {
        network: this.network,
        buyAssetAddress: buyAssetAddress,
        sellAssetAddress: sellAssetAddress,
      };

      if (targetSellAmount) {
        params["targetSellAmount"] = targetSellAmount;
      }
      if (targetBuyAmount) {
        params["targetBuyAmount"] = targetBuyAmount;
      }

      interface BestOffersAPIResponse {
        success: boolean;
        result?: {
          success: boolean;
          targetAmount: string;
          totalWithdrawalAmountPaid: string;
          selectedOffers?: Array<{
            id: string;
            withdrawalAmountPaid: string;
            withdrawalAmountPaidDecimals: string;
            offerType: string;
            maker: string;
            pricePerUnit: string;
            pricingType: string;
            depositToWithdrawalRate?: string;
          }>;
          mode: string;
        };
      }

      const response = await this.makeRequest<BestOffersAPIResponse>(
        "GET",
        "/dotc_offers/best",
        undefined,
        params
      );

      const resultData = response.result;

      if (!resultData) {
        throw new NoOffersAvailableException(
          `No offers available for ${sellAssetAddress} -> ${buyAssetAddress}`
        );
      }

      const selectedOffers: SelectedOffer[] = (
        resultData.selectedOffers ?? []
      ).map((offerDict) => ({
        id: offerDict.id,
        withdrawalAmountPaid: offerDict.withdrawalAmountPaid,
        withdrawalAmountPaidDecimals: offerDict.withdrawalAmountPaidDecimals,
        offerType: offerDict.offerType as OfferType,
        maker: offerDict.maker,
        pricePerUnit: offerDict.pricePerUnit,
        pricingType: offerDict.pricingType as PricingType,
        depositToWithdrawalRate: offerDict.depositToWithdrawalRate,
      }));

      const result: BestOffersResult = {
        success: resultData.success,
        targetAmount: resultData.targetAmount,
        totalWithdrawalAmountPaid: resultData.totalWithdrawalAmountPaid,
        selectedOffers,
        mode: resultData.mode,
      };

      const bestOffersResponse: BestOffersResponse = {
        success: response.success,
        result,
      };

      console.log(
        `Retrieved best offers for ${sellAssetAddress} -> ${buyAssetAddress}: ` +
          `${result.totalWithdrawalAmountPaid}/${result.targetAmount}`
      );

      return bestOffersResponse;
    } catch (error) {
      if (error instanceof APIException) {
        if (error.statusCode === 400) {
          throw new RPQServiceException(
            `Invalid request parameters: ${error.message}`
          );
        }
      }
      if (error instanceof NoOffersAvailableException) {
        throw error;
      }
      throw new RPQServiceException(`Failed to get best offers: ${error}`);
    }
  }

  /**
   * Get a quote for trading tokens.
   *
   * Returns a quote in the SDK's unified Quote format.
   * Provide either targetSellAmount OR targetBuyAmount, not both.
   *
   * @param buyAssetAddress - Address of asset to buy
   * @param sellAssetAddress - Address of asset to sell
   * @param targetSellAmount - Amount to sell (optional, human-readable)
   * @param targetBuyAmount - Amount to buy (optional, human-readable)
   * @returns Quote in SDK format with calculated amounts and rate
   */
  async getQuote(
    buyAssetAddress: string,
    sellAssetAddress: string,
    targetSellAmount?: string,
    targetBuyAmount?: string
  ): Promise<Quote> {
    const request: QuoteRequest = {
      buyAssetAddress,
      sellAssetAddress,
      targetSellAmount,
      targetBuyAmount,
      network: this.network,
    };

    const rpqQuote = await this.requestQuote(request);

    const sellAmount = rpqQuote.sellAmount
      ? parseFloat(rpqQuote.sellAmount)
      : 0;
    const buyAmount = rpqQuote.buyAmount ? parseFloat(rpqQuote.buyAmount) : 0;
    const rate = sellAmount > 0 ? buyAmount / sellAmount : 0;

    return {
      sellTokenAddress: rpqQuote.sellAssetAddress,
      sellAmount,
      buyTokenAddress: rpqQuote.buyAssetAddress,
      buyAmount,
      rate,
      source: "Market Maker RPQ",
      timestamp: new Date(),
    };
  }

  /**
   * Get a raw quote from RPQ API.
   *
   * Private method that returns the raw RPQ API response.
   */
  private async requestQuote(
    quoteRequest: QuoteRequest
  ): Promise<QuoteResponse> {
    if (!this.apiKey) {
      throw new RPQServiceException(
        "API key is required for get_quote endpoint"
      );
    }

    try {
      if (quoteRequest.targetSellAmount && quoteRequest.targetBuyAmount) {
        throw new Error(
          "Provide either targetSellAmount OR targetBuyAmount, not both"
        );
      }

      const params: Record<string, string | number> = {
        buyAssetAddress: quoteRequest.buyAssetAddress,
        sellAssetAddress: quoteRequest.sellAssetAddress,
        network: quoteRequest.network,
      };

      if (quoteRequest.targetSellAmount) {
        params["targetSellAmount"] = quoteRequest.targetSellAmount;
      }
      if (quoteRequest.targetBuyAmount) {
        params["targetBuyAmount"] = quoteRequest.targetBuyAmount;
      }

      interface QuoteAPIResponse {
        success: boolean;
        buyAssetAddress: string;
        sellAssetAddress: string;
        averagePrice: string;
        sellAmount?: string;
        buyAmount?: string;
      }

      const response = await this.makeRequest<QuoteAPIResponse>(
        "GET",
        "/dotc_offers/quote",
        undefined,
        params
      );

      return {
        success: response.success,
        buyAssetAddress: response.buyAssetAddress,
        sellAssetAddress: response.sellAssetAddress,
        averagePrice: response.averagePrice,
        sellAmount: response.sellAmount,
        buyAmount: response.buyAmount,
      };
    } catch (error) {
      if (error instanceof APIException) {
        if (error.statusCode === 400) {
          throw new QuoteUnavailableException(
            `Quote unavailable: ${error.message}`
          );
        }
        if (error.statusCode === 401) {
          throw new RPQServiceException("Invalid or missing API key");
        }
        if (error.statusCode === 429) {
          throw new RPQServiceException("Monthly rate limit reached");
        }
      }
      throw new RPQServiceException(`Failed to get quote: ${error}`);
    }
  }

  /**
   * Get all available price feeds for the network.
   *
   * Price feeds are used to create dynamic offers.
   *
   * @returns PriceFeedsResponse with mapping of contract addresses to price feed addresses
   */
  async getPriceFeeds(): Promise<PriceFeedsResponse> {
    try {
      const params: Record<string, string> = {
        network: this.network,
      };

      interface PriceFeedsAPIResponse {
        success: boolean;
        priceFeeds?: Record<string, string>;
      }

      const response = await this.makeRequest<PriceFeedsAPIResponse>(
        "GET",
        "/all_price_feeds",
        undefined,
        params
      );

      const priceFeeds = response.priceFeeds ?? {};

      if (Object.keys(priceFeeds).length === 0) {
        throw new PriceFeedNotFoundException(
          `No price feeds found for network ${this.network}`
        );
      }

      console.log(
        `Retrieved ${Object.keys(priceFeeds).length} price feeds for ${
          this.network
        }`
      );

      return {
        success: response.success,
        priceFeeds,
      };
    } catch (error) {
      if (error instanceof PriceFeedNotFoundException) {
        throw error;
      }
      throw new RPQServiceException(`Failed to get price feeds: ${error}`);
    }
  }

  /**
   * Parse offer dictionary into Offer object.
   */
  private parseOffer(offerDict: Record<string, unknown>): Offer {
    const depositAssetData = offerDict["depositAsset"] as Record<
      string,
      unknown
    >;
    const depositAsset: Asset = {
      id: depositAssetData["id"] as string,
      name: depositAssetData["name"] as string,
      symbol: depositAssetData["symbol"] as string,
      address: depositAssetData["address"] as string,
      tokenStandard: depositAssetData["tokenStandard"] as string,
      tradedVolume: depositAssetData["tradedVolume"] as string,
      assetType:
        (depositAssetData["assetType"] as AssetType) ?? AssetType.NO_TYPE,
      decimals: depositAssetData["decimals"] as number | undefined,
      tokenId: depositAssetData["tokenId"] as number | undefined,
      kya: depositAssetData["kya"] as string | undefined,
    };

    const withdrawalAssetData = offerDict["withdrawalAsset"] as Record<
      string,
      unknown
    >;
    const withdrawalAsset: Asset = {
      id: withdrawalAssetData["id"] as string,
      name: withdrawalAssetData["name"] as string,
      symbol: withdrawalAssetData["symbol"] as string,
      address: withdrawalAssetData["address"] as string,
      tokenStandard: withdrawalAssetData["tokenStandard"] as string,
      tradedVolume: withdrawalAssetData["tradedVolume"] as string,
      assetType:
        (withdrawalAssetData["assetType"] as AssetType) ?? AssetType.NO_TYPE,
      decimals: withdrawalAssetData["decimals"] as number | undefined,
      tokenId: withdrawalAssetData["tokenId"] as number | undefined,
      kya: withdrawalAssetData["kya"] as string | undefined,
    };

    const offerPriceData = offerDict["offerPrice"] as Record<string, unknown>;
    const offerPrice: OfferPrice = {
      id: offerPriceData["id"] as string,
      pricingType: offerPriceData["pricingType"] as PricingType,
      percentage: offerPriceData["percentage"] as number | undefined,
      percentageType: offerPriceData["percentageType"] as
        | PercentageType
        | undefined,
      unitPrice: offerPriceData["unitPrice"] as string | undefined,
      depositAssetPrice: offerPriceData["depositAssetPrice"] as
        | Record<string, string>
        | undefined,
      withdrawalAssetPrice: offerPriceData["withdrawalAssetPrice"] as
        | Record<string, string>
        | undefined,
    };

    return {
      id: offerDict["id"] as string,
      maker: offerDict["maker"] as string,
      amountIn: offerDict["amountIn"] as string,
      amountOut: offerDict["amountOut"] as string,
      availableAmount: offerDict["availableAmount"] as string,
      depositAsset,
      withdrawalAsset,
      offerType: offerDict["offerType"] as OfferType,
      offerStatus: offerDict["offerStatus"] as OfferStatus,
      offerPrice,
      isAuth: offerDict["isAuth"] as boolean,
      timelockPeriod: offerDict["timelockPeriod"] as string,
      expiryTimestamp: offerDict["expiryTimestamp"] as string,
      terms: offerDict["terms"],
      commsLink: offerDict["commsLink"] as string | undefined,
      authorizationAddresses: offerDict["authorizationAddresses"] as
        | string[]
        | undefined,
      depositToWithdrawalRate: offerDict["depositToWithdrawalRate"] as
        | string
        | undefined,
    };
  }

  /**
   * Close the RPQ client and release resources.
   */
  override async close(): Promise<void> {
    // Currently no persistent resources to close
    // Method exists for API compatibility
  }
}
