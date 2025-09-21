/**
 * Leaderboard API types.
 */

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  change?: number; // Position change from previous period
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
}