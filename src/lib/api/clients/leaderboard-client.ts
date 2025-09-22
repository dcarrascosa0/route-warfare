/**
 * Leaderboard API client.
 */

import { BaseApiClient } from './base-client';
import type { 
  LeaderboardResponse, 
  LeaderboardStats, 
  TerritoryLeaderboardCategory,
  TerritoryLeaderboardEntry,
  TerritoryAchievement
} from '../types';

export class LeaderboardApiClient extends BaseApiClient {
  async getLeaderboard(category: string = "territory", period: string = "ALL_TIME", start = 0, limit = 50) {
    // Map frontend category names to backend enum values
    const categoryMap: Record<string, string> = {
      'territory': 'territory_area',
      'territory_area': 'territory_area',
      'territory_count': 'territory_count',
      'territory_recent': 'territory_recent',
      'territory_avg_size': 'territory_avg_size',
      'territory_efficiency': 'territory_efficiency',
      'routes': 'routes_completed',
      'winrate': 'win_rate'
    };
    
    const backendCategory = categoryMap[category] || category;
    return this.request<LeaderboardResponse>(
      `/leaderboard/${backendCategory}?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`
    );
  }

  async getLeaderboardRoutes(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/routes_completed?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getLeaderboardWinRate(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/win_rate?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getLeaderboardStats(category: string) {
    // Map frontend category names to backend enum values
    const categoryMap: Record<string, string> = {
      'territory': 'territory_area',
      'territory_area': 'territory_area',
      'territory_count': 'territory_count',
      'territory_recent': 'territory_recent',
      'territory_avg_size': 'territory_avg_size',
      'territory_efficiency': 'territory_efficiency',
      'routes': 'routes_completed',
      'winrate': 'win_rate'
    };
    
    const backendCategory = categoryMap[category] || category;
    return this.request<LeaderboardStats>(`/leaderboard/stats/${backendCategory}`);
  }

  // Territory-specific leaderboard methods
  async getTerritoryLeaderboard(category: TerritoryLeaderboardCategory, period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<{ entries: TerritoryLeaderboardEntry[]; total_count: number; period: string; category: string }>(
      `/leaderboard/${category}?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`
    );
  }

  async getTerritoryAchievements(userId: string) {
    return this.request<{ achievements: TerritoryAchievement[] }>(`/users/${userId}/achievements`);
  }

  async getTerritoryLeaderboardWithAchievements(category: TerritoryLeaderboardCategory, period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<{
      entries: TerritoryLeaderboardEntry[];
      total_count: number;
      period: string;
      category: string;
      top_achievements: TerritoryAchievement[];
    }>(`/leaderboard/${category}/with-achievements?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }
}

export const leaderboardClient = new LeaderboardApiClient();