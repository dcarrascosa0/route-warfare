/**
 * Achievements API client.
 */

import { BaseApiClient } from './base-client';
import type { UserAchievement as GamificationUserAchievement } from '../types/gamification';

export class AchievementsApiClient extends BaseApiClient {
  /**
   * Get user achievements with proper nested structure
   */
  async getUserAchievements(userId: string, earnedOnly: boolean = false) {
    return this.request<GamificationUserAchievement[]>(`/achievements/user/${encodeURIComponent(userId)}?earned_only=${earnedOnly}`);
  }

  /**
   * Get current user's achievements
   */
  async getMyAchievements(includeHidden: boolean = false, earnedOnly: boolean = false, inProgressOnly: boolean = false) {
    const params = new URLSearchParams();
    if (includeHidden) params.append('include_hidden', 'true');
    if (earnedOnly) params.append('earned_only', 'true');
    if (inProgressOnly) params.append('in_progress_only', 'true');
    
    return this.request<GamificationUserAchievement[]>(`/achievements/user/me?${params}`);
  }

  /**
   * Get recent achievements for current user
   */
  async getMyRecentAchievements(limit: number = 5) {
    return this.request<GamificationUserAchievement[]>(`/achievements/user/me/recent?limit=${limit}`);
  }

  /**
   * Get achievement summary for current user
   */
  async getMyAchievementSummary() {
    return this.request(`/achievements/user/me/summary`);
  }

  /**
   * Get achievement showcase for current user
   */
  async getMyAchievementShowcase(limit: number = 10) {
    return this.request(`/achievements/user/me/showcase?limit=${limit}`);
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(includeHidden: boolean = false, tier?: string) {
    const params = new URLSearchParams();
    if (includeHidden) params.append('include_hidden', 'true');
    if (tier) params.append('tier', tier);
    
    return this.request(`/achievements?${params}`);
  }

  /**
   * Get achievements by category
   */
  async getAchievementsByCategory(categoryId: string, includeHidden: boolean = false) {
    const params = new URLSearchParams();
    if (includeHidden) params.append('include_hidden', 'true');
    
    return this.request(`/achievements/categories/${categoryId}/achievements?${params}`);
  }

  /**
   * Get all achievement categories
   */
  async getAchievementCategories() {
    return this.request(`/achievements/categories`);
  }
}

export const achievementsClient = new AchievementsApiClient();