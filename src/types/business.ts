/**
 * Business logic type definitions.
 */

import {
  GeoPoint,
  GeoCoordinate,
} from './common';

// Route-related types
export interface RouteCoordinate extends GeoCoordinate {
  id?: string;
  route_id?: string;
  sequence_number?: number;
}

export interface RouteMetrics {
  total_distance_meters: number;
  total_duration_seconds: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
  elevation_gain_meters?: number;
  elevation_loss_meters?: number;
  calories_burned?: number;
}

export interface RouteQuality {
  gps_accuracy_score: number;
  coordinate_density_score: number;
  smoothness_score: number;
  completeness_score: number;
  overall_score: number;
}

export interface RouteAnalysis {
  is_closed_loop: boolean;
  has_intersections: boolean;
  territory_eligibility: boolean;
  quality_assessment: RouteQuality;
  recommendations: string[];
}

// Territory-related types
export interface TerritoryBoundary {
  coordinates: GeoPoint[];
  area_sqm: number;
  perimeter_meters: number;
  centroid: GeoPoint;
}

export interface TerritoryOwnership {
  owner_id: string;
  owner_username: string;
  claimed_at: string;
  claim_method: 'route_completion' | 'manual_claim' | 'contest_win';
  source_route_id?: string;
}

export interface TerritoryContest {
  challenger_id: string;
  challenger_username: string;
  challenge_route_id: string;
  contested_at: string;
  resolution_deadline: string;
  status: 'active' | 'resolved' | 'expired';
}

export interface TerritoryMetrics {
  area_km2: number;
  perimeter_km: number;
  shape_complexity: number;
  strategic_value: number;
  contest_frequency: number;
}

// User-related types

export interface UserPrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  route_visibility: 'public' | 'friends' | 'private';
  territory_visibility: 'public' | 'friends' | 'private';
  leaderboard_participation: boolean;
  activity_notifications: boolean;
}

export interface UserGameStats {
  level: number;
  experience_points: number;
  total_routes_completed: number;
  total_distance_km: number;
  total_territories_claimed: number;
  total_territory_area_km2: number;
  win_rate_percentage: number;
  current_streak: number;
  longest_streak: number;
  rank_position?: number;
}

export interface UserAchievementProgress {
  achievement_id: string;
  achievement_name: string;
  achievement_description: string;
  category: string;
  current_progress: number;
  required_progress: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  reward_points: number;
}

// Game mechanics types
export interface GameEvent {
  id: string;
  type: 'route_completed' | 'territory_claimed' | 'territory_lost' | 'achievement_unlocked' | 'level_up';
  user_id: string;
  timestamp: string;
  data: Record<string, any>;
  points_awarded: number;
}

export interface LeaderboardRanking {
  user_id: string;
  username: string;
  rank: number;
  score: number;
  category: string;
  period: string;
  change_from_previous: number;
  percentile: number;
}

export interface CompetitionSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  rules: Record<string, any>;
  prizes: CompetitionPrize[];
}

export interface CompetitionPrize {
  rank_range: [number, number];
  title: string;
  description: string;
  reward_type: 'points' | 'badge' | 'title' | 'physical';
  reward_value: any;
}

// Notification types
export interface GameNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
}

// Real-time update types
export interface RealTimeUpdate {
  type: 'route_update' | 'territory_update' | 'user_update' | 'leaderboard_update';
  entity_id: string;
  user_id: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  correlation_id?: string;
}