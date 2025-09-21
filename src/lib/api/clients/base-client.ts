/**
 * Base API client with common functionality.
 */

import { TokenManager } from '@/contexts/AuthContext';
import { API_BASE, API_CONFIG } from '../config';
import type { ApiResult, HttpMethod } from '../types';

// Circuit breaker implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = API_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
    private recoveryTimeout = API_CONFIG.CIRCUIT_BREAKER.RECOVERY_TIMEOUT,
    private successThreshold = API_CONFIG.CIRCUIT_BREAKER.SUCCESS_THRESHOLD
  ) { }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Global circuit breaker instance
const circuitBreaker = new CircuitBreaker();

// Generate correlation ID for request tracking
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export class BaseApiClient {
  protected async request<T>(
    path: string,
    options: {
      method?: HttpMethod;
      headers?: Record<string, string>;
      body?: unknown;
      skipAuth?: boolean;
      retries?: number;
      timeout?: number;
      correlationId?: string;
    } = {}
  ): Promise<ApiResult<T>> {
    const {
      method = "GET",
      headers = {},
      body,
      skipAuth = false,
      retries = API_CONFIG.RETRY_ATTEMPTS,
      timeout = API_CONFIG.DEFAULT_TIMEOUT,
      correlationId = generateCorrelationId()
    } = options;

    const makeRequest = async (token?: string, attempt = 1): Promise<Response> => {
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId,
        "X-Request-Attempt": attempt.toString(),
        ...headers,
      };

      if (token && !skipAuth) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${API_BASE}${path}`, {
          method,
          headers: requestHeaders,
          body: body != null ? JSON.stringify(body) : undefined,
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    const executeWithRetry = async (): Promise<ApiResult<T>> => {
      let lastError: unknown;

      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
          let token = TokenManager.getAccessToken();
          let response = await makeRequest(token, attempt);

          // If we get a 401 and have a refresh token, try to refresh
          if (response.status === 401 && !skipAuth && TokenManager.getRefreshToken()) {
            const refreshSuccess = await this.refreshTokens();
            if (refreshSuccess) {
              token = TokenManager.getAccessToken();
              response = await makeRequest(token, attempt);
            }
          }

          const contentType = response.headers.get("content-type");
          const isJson = contentType && contentType.includes("application/json");
          const payload = isJson ? await response.json() : (await response.text());

          if (!response.ok) {
            // Don't retry on client errors (4xx) except 401, 408, 429
            if (response.status >= 400 && response.status < 500 &&
              ![401, 408, 429].includes(response.status)) {
              return {
                ok: false,
                status: response.status,
                error: payload,
                correlationId
              };
            }

            // For server errors or retryable client errors, throw to trigger retry
            if (attempt <= retries) {
              throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
            }

            return {
              ok: false,
              status: response.status,
              error: payload,
              correlationId
            };
          }

          return {
            ok: true,
            status: response.status,
            data: payload as T,
            correlationId
          };
        } catch (error) {
          lastError = error;

          // Don't retry on the last attempt
          if (attempt <= retries) {
            // Exponential backoff with jitter
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      return {
        ok: false,
        status: 0,
        error: lastError,
        correlationId
      };
    };

    try {
      return await circuitBreaker.execute(executeWithRetry);
    } catch (error) {
      // Circuit breaker is open
      return {
        ok: false,
        status: 503,
        error: { message: 'Service temporarily unavailable', details: error },
        correlationId
      };
    }
  }

  private async refreshTokens(): Promise<boolean> {
    const refreshToken = TokenManager.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        TokenManager.clearTokens();
        return false;
      }

      const data = await response.json();
      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      if (!newAccessToken || !newRefreshToken) {
        TokenManager.clearTokens();
        return false;
      }

      TokenManager.setTokens(newAccessToken, newRefreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      TokenManager.clearTokens();
      return false;
    }
  }
}