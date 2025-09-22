/**
 * Leaderboard API types.
 */

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  change?: number; // Position change from previous period
  // Territory-specific fields
  territory_count?: number;
  territory_area_km2?: number;
  recent_claims?: number;
  avg_territory_size?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total_count: number;
  user_rank?: number;
  period: string;
  category: string;
}

export interface LeaderboardStats {
  total_participants: number;
  average_score: number;
  top_score: number;
  category: string;
  period: string;
  // Territory-specific stats
  total_territory_area?: number;
  total_territories?: number;
  avg_territory_per_user?: number;
}

// Territory-specific leaderboard categories
export type TerritoryLeaderboardCategory = 
  | 'territory_area'      // Total area claimed
  | 'territory_count'     // Number of territories
  | 'territory_recent'    // Recent territory activity
  | 'territory_avg_size'  // Average territory size
  | 'territory_efficiency'; // Territory per route ratio

export interface TerritoryLeaderboardEntry extends LeaderboardEntry {
  territory_count: number;
  territory_area_km2: number;
  recent_claims: number;
  avg_territory_size: number;
  efficiency_ratio: number; // Territory area per completed route
}

export interface TerritoryAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'area' | 'count' | 'efficiency' | 'special';
  threshold: number;
  current_progress: number;
  completed: boolean;
  completed_at?: string;
}