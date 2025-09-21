/**
 * Common API types and interfaces.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: unknown;
  correlationId?: string;
}

export interface ApiError {
  status: number;
  message: string;
  correlationId?: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  bearing?: number | null;
  timestamp: string;
}