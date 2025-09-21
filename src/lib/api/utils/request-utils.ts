/**
 * Request utility functions.
 */

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)]);
  
  return filteredParams.length > 0 
    ? `?${new URLSearchParams(filteredParams).toString()}`
    : '';
}

export function encodePathParam(param: string): string {
  return encodeURIComponent(param);
}

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createRequestHeaders(
  additionalHeaders: Record<string, string> = {},
  correlationId?: string
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId || generateCorrelationId(),
    ...additionalHeaders,
  };
}