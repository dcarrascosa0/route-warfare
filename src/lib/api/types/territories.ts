/**
 * Territory API types.
 */

import { GeoPoint } from './common';

// Territory Statistics Types
export interface UserTerritoryStatistics {
  territory_count: number;
  total_area_square_meters: number;
  total_area_km2: number;
  average_area_square_meters: number;
  average_area_km2: number;
  first_claim_date?: string;
  latest_claim_date?: string;
  contested_territories: number;
  auto_claimed_territories: number;
  manual_claimed_territories: number;
  area_ranking: number;
  count_ranking: number;
  total_users: number;
  percentile_area: number;
  percentile_count: number;
}

export interface GlobalTerritoryStatistics {
  total_territories: number;
  total_users: number;
  total_area_square_meters: number;
  total_area_km2: number;
  average_territory_area_square_meters: number;
  average_territory_area_km2: number;
  contested_territories: number;
  auto_claimed_territories: number;
  first_territory_date?: string;
  latest_territory_date?: string;
  average_territories_per_user: number;
  max_territories_per_user: number;
  average_area_per_user_km2: number;
  territories_claimed_last_24h: number;
}

// Territory Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  owner_id: string;
  territory_count: number;
  total_area_square_meters: number;
  total_area_km2: number;
  average_area_square_meters: number;
  average_area_km2: number;
  latest_claim_date?: string;
  first_claim_date?: string;
  contested_territories: number;
}

export interface LeaderboardPageInfo {
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface TerritoryLeaderboard {
  leaderboard: LeaderboardEntry[];
  metric: string;
  total_participants: number;
  page_info: LeaderboardPageInfo;
}

// Territory Preview Types
export interface TerritoryPreview {
  boundary_geojson?: Record<string, any>;
  area_square_meters: number;
  is_valid: boolean;
  preview_type: string; // 'valid', 'insufficient_data', 'error', 'no_coordinates'
  conflicts: TerritoryConflict[];
  eligible_for_claiming: boolean;
  coordinate_count?: number;
  conflict_count?: number;
  major_conflicts?: TerritoryConflict[];
  error?: string;
  is_real_time?: boolean;
}

// Territory Validation Types
export interface TerritoryEligibilityValidation {
  eligible: boolean;
  reason: string;
  details: Record<string, any>;
}

export interface TerritoryValidationDetails {
  route_id?: string;
  user_id?: string;
  coordinate_count?: number;
  route_length_meters?: number;
  minimum_required?: number;
  completed_at?: string;
  territory_claimed?: boolean;
  status?: string;
  conflict_count?: number;
  conflicts?: DetailedTerritoryConflict[];
  minor_conflicts?: number;
  existing_territory_id?: string;
  error?: string;
}

export interface EnhancedTerritoryEligibilityValidation extends TerritoryEligibilityValidation {
  validation_score?: number; // 0-100 score
  improvement_suggestions: string[];
  estimated_area?: number;
  potential_conflicts?: number;
}

// Enhanced Territory Conflict Types
export interface DetailedTerritoryConflict {
  territory_id: string;
  owner_id: string;
  owner_name?: string;
  overlap_percentage: number;
  overlap_area_square_meters: number;
  territory_area_square_meters: number;
  conflict_type: string; // 'minor', 'major', 'complete'
  conflict_severity: string; // 'low', 'medium', 'high', 'critical'
  resolution_suggestion: string;
  can_auto_resolve: boolean;
}

export interface TerritoryConflictResolution {
  has_conflicts: boolean;
  conflict_count: number;
  major_conflicts: number;
  minor_conflicts: number;
  conflicts: DetailedTerritoryConflict[];
  resolution_strategy: string; // 'none', 'negotiate', 'split', 'reject'
  auto_resolvable: boolean;
  requires_user_action: boolean;
}

export interface EnhancedTerritoryPreview extends TerritoryPreview {
  conflict_resolution?: TerritoryConflictResolution;
  territory_quality_score?: number; // 0-100 score
  optimization_suggestions: string[];
  estimated_claim_success_rate?: number; // 0-100 percentage
}

// Territory Response Wrappers
export interface TerritoryStatisticsResponse {
  user_statistics: UserTerritoryStatistics;
  global_context: GlobalTerritoryStatistics;
  user_percentile_summary: string;
  achievement_level: string; // 'beginner', 'intermediate', 'advanced', 'expert'
}

export interface TerritoryPreviewResponse {
  preview: EnhancedTerritoryPreview;
  validation: EnhancedTerritoryEligibilityValidation;
  recommendations: string[];
  next_steps: string[];
}

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