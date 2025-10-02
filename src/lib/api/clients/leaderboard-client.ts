/**
 * Leaderboard API client.
 */

import { BaseApiClient } from './base-client';
import type { 
  LeaderboardResponse, 
  LeaderboardStats, 
  LeaderboardEntry
} from '../types/leaderboard';

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
      'routes': 'routes_completed'
    };
    
    const backendCategory = categoryMap[category] || category;
    return this.request<LeaderboardResponse>(
      `/leaderboard/${backendCategory}?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`
    );
  }

  async getLeaderboardRoutes(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/routes_completed?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
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
      'routes': 'routes_completed'
    };

    const backendCategory = categoryMap[category] || category;
    return this.request<LeaderboardStats>(`/leaderboard/stats/${backendCategory}`);
  }

  async getTotalPlayers() {
    return this.request<{ total_players: number }>(`/leaderboard/players/total`);
  }

  // Territory-specific leaderboard methods (backward compatibility)
  async getTerritoryLeaderboard(category: string, period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.getLeaderboard(category, period, start, limit);
  }



  async getTerritoryLeaderboardWithAchievements(category: string, period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<{
      entries: LeaderboardEntry[];
      total_count: number;
      period: string;
      category: string;
    }>(`/leaderboard/${category}/with-achievements?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  // Gamification leaderboard methods
  async getXPLeaderboard(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/xp?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getLevelLeaderboard(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/level?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getAchievementsLeaderboard(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/achievements?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getStreakLeaderboard(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/streak?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getDistanceLeaderboard(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/distance?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }

  async getPrestigeLeaderboard(period: string = "ALL_TIME", start = 0, limit = 50) {
    return this.request<LeaderboardResponse>(`/leaderboard/prestige?period=${String(period).toLowerCase()}&start=${start}&limit=${limit}`);
  }
}

export const leaderboardClient = new LeaderboardApiClient();