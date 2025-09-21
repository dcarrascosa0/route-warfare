/**
 * Leaderboard API client.
 */

import { BaseApiClient } from './base-client';
import type { LeaderboardResponse, LeaderboardStats } from '../types';

export class LeaderboardApiClient extends BaseApiClient {
  async getLeaderboard(category: string = "territory", period: string = "ALL_TIME", start = 0, limit = 50) {
    // Map frontend category names to backend enum values
    const categoryMap: Record<string, string> = {
      'territory': 'territory_area',
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
      'routes': 'routes_completed',
      'winrate': 'win_rate'
    };
    
    const backendCategory = categoryMap[category] || category;
    return this.request<LeaderboardStats>(`/leaderboard/stats/${backendCategory}`);
  }
}

export const leaderboardClient = new LeaderboardApiClient();