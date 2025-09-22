/**
 * User API types.
 */

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  is_verified?: boolean;
  avatar_url?: string;
  bio?: string;
}

export interface UserStatistics {
  total_routes: number;
  total_distance_km: number;
  total_duration_hours: number;
  total_territories: number;
  total_territory_area_km2: number;
  average_speed_kmh: number;
  completion_rate: number;
  rank: number;
  level: number;
  experience: number;
  total_territory_area: number;
  total_zones: number;
  routes_completed: number;
  win_rate: number;
  current_rank: number;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string;
  progress: { current: number; target: number; percentage: number; };
  max_progress: number;
  is_earned: boolean;
  points: number;
}

export interface UserStatisticsHistory {
  date: string;
  routes_completed: number;
  distance_km: number;
  territories_claimed: number;
  territory_area_km2: number;
}

export interface UserStatisticsComparison {
  user_stats: UserStatistics;
  global_average: UserStatistics;
  percentile_rank: number;
}