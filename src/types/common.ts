/**
 * Common type definitions used across the application.
 */

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface TimestampedEntity extends BaseEntity {
  created_at: string;
  updated_at: string;
}

export interface UserOwnedEntity extends BaseEntity {
  user_id: string;
  owner_id?: string;
}

export interface NamedEntity extends BaseEntity {
  name: string;
  description?: string;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  bearing?: number | null;
  timestamp?: string;
}

export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface Statistics {
  total_count: number;
  average_value: number;
  min_value: number;
  max_value: number;
  last_updated: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}