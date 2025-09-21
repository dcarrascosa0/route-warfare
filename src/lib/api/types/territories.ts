/**
 * Territory API types.
 */

import { GeoPoint } from './common';

export interface Territory {
  id: string;
  name?: string;
  description?: string;
  owner_id: string;
  owner_username?: string;
  route_id: string;
  status: "claimed" | "contested" | "neutral";
  area_km2: number;
  claimed_at: string;
  last_activity: string;
  boundary_coordinates: GeoPoint[];
  contested_by?: string[];
  
  // Route integration fields
  source_route_id?: string;
  claiming_method?: string;
  auto_claimed?: boolean;
  source_route?: RouteInfo;
  
  // Claim history and conflicts
  claim_history?: TerritoryClaimHistory[];
  conflicts?: TerritoryConflict[];
  
  // Additional metrics
  perimeter_m?: number;
  shape_complexity?: number;
  contest_count?: number;
  last_contested_at?: string;
}

export interface RouteInfo {
  id: string;
  name?: string;
  user_id: string;
  username?: string;
  completed_at: string;
  distance_meters: number;
  duration_seconds?: number;
  coordinate_count: number;
  is_closed: boolean;
  gps_quality_score?: number;
  territory_eligibility_score?: number;
  
  // Territory integration fields
  territory_id?: string;
  territory_claim_status?: "pending" | "success" | "failed" | "conflict";
  territory_claim_error?: string;
  auto_claim_attempted?: boolean;
}

export interface TerritoryClaimHistory {
  id: string;
  route_id: string;
  claim_attempt_at: string;
  success: boolean;
  conflicts_detected: number;
  resolution_method?: string;
  error_details?: Record<string, any>;
}

export interface TerritoryConflict {
  id: string;
  territory_id: string;
  overlapping_territory_id: string;
  overlap_area_sqm: number;
  overlap_percentage: number;
  is_resolved: boolean;
  resolved_at?: string;
  resolution_method?: string;
  detected_at: string;
  competing_route?: RouteInfo;
}

export interface TerritoryMapResponse {
  territories: Territory[];
  total_count?: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface ClaimTerritoryRequest {
  route_id: string;
  boundary_coordinates: GeoPoint[];
  name?: string;
  description?: string;
  owner_id: string;
  auto_resolve_conflicts?: boolean;
  conflict_resolution_strategy?: string;
}

export interface TerritoryFilter {
  status?: "claimed" | "contested" | "neutral" | "all";
  owner?: "user" | "others" | "all";
}

export interface MapBounds {
  min_longitude: number;
  min_latitude: number;
  max_longitude: number;
  max_latitude: number;
  limit?: number;
}

export interface TerritoryEvent {
  type: "territory_claimed" | "territory_attacked" | "territory_lost" | "territory_contested";
  territory_id: string;
  territory: Territory;
  timestamp: string;
  user_id?: string;
  username?: string;
}