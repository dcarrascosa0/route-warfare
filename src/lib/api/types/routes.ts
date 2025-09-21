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

export interface RouteStatistics {
  total_distance_km: number;
  total_duration_hours: number;
  average_speed_kmh: number;
  total_routes: number;
  completed_routes: number;
  active_routes: number;
}