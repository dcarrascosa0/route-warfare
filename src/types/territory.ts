// Territory-related type definitions

export interface Territory {
  id: string;
  user_id: string;
  owner_id?: string;
  route_id: string;
  name?: string;
  description?: string;
  status: 'claimed' | 'neutral';
  created_at: string;
  updated_at: string;
  boundary_coordinates: Array<{ latitude: number; longitude: number }>;
  area_sqm: number;
  area_km2?: number;
  center_lat: number;
  center_lng: number;
  metadata?: Record<string, any>;
  // Additional properties used by components
  is_owned?: boolean;
  // contested removed in exclusive model
  owner_user_id?: string;
  owner_username?: string;
  claimed_at?: string;
  source_route_id?: string;
  auto_claimed?: boolean;
  conflicts?: any[];
  claim_history?: any[];
  last_activity?: string;
  // contest_count removed in exclusive model
}

export interface TerritoryConflict {
  id: string;
  territory_id: string;
  conflicting_territory_id: string;
  route_id: string;
  type: 'overlap' | 'boundary_dispute' | 'claim_priority';
  status: 'pending' | 'resolved' | 'escalated';
  created_at: string;
  resolved_at?: string;
  resolution_method?: string;
  metadata?: Record<string, any>;
  // Additional properties used by components
  overlap_area_sqm?: number;
  detected_at?: string;
  competing_route_id?: string;
  challenger_username?: string;
  route_quality_score?: number;
}

export interface TerritoryFilter {
  status?: string[];
  userId?: string;
  owner?: string;
  minArea?: number;
  maxArea?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  areaRange?: {
    min: number;
    max: number;
  };
}

export interface TerritoryClaimHistory {
  id: string;
  territory_id: string;
  user_id: string;
  route_id: string;
  action: 'claimed' | 'updated' | 'abandoned' | 'transferred';
  timestamp: string;
  details?: Record<string, any>;
}

export interface TerritoryEvent {
  id: string;
  type: 'claim' | 'conflict' | 'resolution' | 'transfer' | 'territory_claimed' | 'territory_attacked' | 'territory_lost' | 'territory_ownership_changed' | 'territory_conflict_resolved';
  territory_id: string;
  user_id: string;
  timestamp: string;
  data: Record<string, any>;
  territory?: Territory;
  username?: string;
}

export interface RouteInfo {
  id: string;
  name?: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  coordinates_count: number;
  distance_meters?: number;
  territory_eligible: boolean;
}

export interface UserTerritoryStats {
  total_territories: number;
  total_area_km2: number;
  claimed_territories: number;
  contested_territories: number;
  neutral_territories: number;
}