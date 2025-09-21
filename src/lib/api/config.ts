/**
 * API configuration and constants.
 */

export const API_CONFIG = {
  // Base URLs - will be set at runtime or build time
  API_ORIGIN: (import.meta as any)?.env?.VITE_API_URL as string | undefined || "http://localhost:8000",
  WS_ORIGIN: (import.meta as any)?.env?.VITE_WS_URL as string | undefined || "ws://localhost:8000",
  
  // Timeouts
  DEFAULT_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  
  // Circuit breaker settings
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 5,
    RECOVERY_TIMEOUT: 30000, // 30 seconds
    SUCCESS_THRESHOLD: 2,
  },
  
  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    BURST_LIMIT: 10,
  },
} as const;

export function joinUrl(base: string | undefined, path: string): string {
  if (!base) return path;
  const b = base.replace(/\/+$|\/$/g, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export const API_BASE = joinUrl(API_CONFIG.API_ORIGIN, "/api/v1");