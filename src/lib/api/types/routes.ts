/**
 * Route API types.
 */

import { Coordinate } from './common';

export interface Route {
  id: string;
  user_id: string;
  name?: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  stats: RouteStats;
}

export interface RouteDetail extends Route {
  coordinates: Coordinate[];
  territory_polygon?: any;
}

export interface RouteStats {
  distance_meters: number | null;
  duration_seconds: number | null;
  coordinate_count: number;
  is_closed_loop: boolean;
  territory_area_km2: number | null;
}

export interface StartRouteRequest {
  name?: string;
  description?: string;
  start_coordinate?: Coordinate;
}

export interface AddCoordinatesRequest {
  coordinates: Coordinate[];
}

export interface CompleteRouteRequest {
  end_coordinate?: Coordinate;
  force_completion?: boolean;
}

export interface TerritoryClaimResult {
  territory_id: string;
  area_square_meters: number;
  area_km2: number;
  is_closed_loop: boolean;
}

export interface TerritoryConflictInfo {
  territory_id: string;
  owner_id: string;
  territory_name: string;
  overlap_percentage: number;
  overlap_area_sqm: number;
}

export interface ConflictResolution {
  should_proceed: boolean;
  reason: string;
  conflict_level: 'none' | 'minor' | 'significant' | 'major';
  major_conflicts: number;
  significant_conflicts: number;
  minor_conflicts: number;
  total_conflicts: number;
}

export interface CompleteRouteResponse extends Route {
  // Territory claiming results
  territory_claim_status?: 'success' | 'blocked' | 'failed' | 'ineligible' | 'error';
  territory_claim_reason?: string;
  territory_claim?: TerritoryClaimResult;
  territory_conflicts?: TerritoryConflictInfo[];
  conflict_resolution?: ConflictResolution;
  territory_eligibility?: {
    eligible: boolean;
    reason: string;
    details: Record<string, any>;
  };
}

export interface RouteStatistics {
  total_distance_km: number;
  total_duration_hours: number;
  average_speed_kmh: number;
  total_routes: number;
  completed_routes: number;
  active_routes: number;
}