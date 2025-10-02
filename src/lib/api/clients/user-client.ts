/**
 * User API client.
 */

import { BaseApiClient } from './base-client';
import type { UserProfile, UserStatistics, UserAchievement, UserStatisticsHistory, UserStatisticsComparison } from '../types';

export class UserApiClient extends BaseApiClient {
  async getUserProfile(userId: string) {
    return this.request<UserProfile>(`/users/${encodeURIComponent(userId)}`);
  }

  async getUserStatistics(userId: string) {
    return this.request<UserStatistics>(`/users/${encodeURIComponent(userId)}/stats`);
  }

  async getUserStatisticsComparison(userId: string) {
    return this.request<UserStatisticsComparison>(`/users/${encodeURIComponent(userId)}/stats/comparison`);
  }

  async getUserStatisticsHistory(userId: string, period: string = "30d") {
    return this.request<UserStatisticsHistory>(`/users/${encodeURIComponent(userId)}/stats/history?period=${period}`);
  }

  async getUserAchievements(userId: string) {
    return this.request<UserAchievement[]>(`/users/${encodeURIComponent(userId)}/achievements`);
  }

  async getAchievementProgress(userId: string, achievementId: string) {
    return this.request<unknown>(`/users/${encodeURIComponent(userId)}/achievements/${encodeURIComponent(achievementId)}/progress`);
  }

  async updateUserProfile(userId: string, profile: { username: string; email: string; bio?: string }) {
    return this.request(`/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
  }
}

export const userClient = new UserApiClient();