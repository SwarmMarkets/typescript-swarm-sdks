/**
 * Base API client with retry logic.
 */

/**
 * Base API exception.
 */
export class APIException extends Error {
  readonly statusCode: number;

  constructor(message: string = "API request failed", statusCode: number = 0) {
    const fullMessage = statusCode
      ? `${message} (status: ${statusCode})`
      : message;
    super(fullMessage);
    this.name = "APIException";
    this.statusCode = statusCode;
  }
}

/**
 * Options for retry behavior.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in ms */
  initialDelayMs: number;
  /** Maximum delay in ms */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  multiplier: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  multiplier: 2,
};

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff.
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.initialDelayMs * Math.pow(options.multiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Check if error is retryable.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof APIException) {
    // Retry on server errors and rate limiting
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  if (error instanceof TypeError) {
    // Network errors
    return true;
  }
  return false;
}

/**
 * Base client for making HTTP requests with retry logic.
 */
export class BaseAPIClient {
  protected baseUrl: string;
  protected authToken: string | null;
  protected headers: Record<string, string>;
  protected retryOptions: RetryOptions;

  constructor(
    baseUrl: string,
    authToken: string | null = null,
    retryOptions: Partial<RetryOptions> = {}
  ) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };

    this.headers = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      this.headers["Authorization"] = `Bearer ${authToken}`;
    }
  }

  /**
   * Set authentication token.
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.headers["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Make HTTP request with retry logic.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param params - Query parameters
   * @returns Response JSON data
   * @throws APIException when request fails
   */
  protected async makeRequest<T = Record<string, unknown>>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown>,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, "")}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryOptions.maxAttempts; attempt++) {
      try {
        const requestInit: RequestInit = {
          method,
          headers: this.headers,
        };

        if (data && method !== "GET") {
          requestInit.body = JSON.stringify(data);
        }

        // Log request details
        console.log(`[API Request] ${method} ${url.toString()}`);
        if (data) {
          console.log(`[API Request Body] ${JSON.stringify(data, null, 2)}`);
        }

        const response = await fetch(url.toString(), requestInit);

        // Log response status
        console.log(
          `[API Response] Status: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          let errorMessage = `Request failed with status ${response.status}`;
          let errorBody: unknown;
          try {
            errorBody = await response.json();
            const errorData = errorBody as {
              message?: string;
              errors?: unknown;
            };
            if (errorData.message) {
              errorMessage = errorData.message;
            }
            console.log(
              `[API Error Response] ${JSON.stringify(errorBody, null, 2)}`
            );
          } catch {
            // Ignore JSON parse errors
            console.log(`[API Error Response] Could not parse error body`);
          }
          throw new APIException(errorMessage, response.status);
        }

        const responseData = (await response.json()) as T;
        console.log(
          `[API Response Body] ${JSON.stringify(responseData, null, 2)}`
        );
        return responseData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          attempt < this.retryOptions.maxAttempts - 1 &&
          isRetryableError(error)
        ) {
          const delay = calculateDelay(attempt, this.retryOptions);
          console.log(`Request failed, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new APIException("Max retries exceeded");
  }

  /**
   * Close the client (no-op for fetch, but kept for interface compatibility).
   */
  async close(): Promise<void> {
    // No-op for native fetch
  }
}
