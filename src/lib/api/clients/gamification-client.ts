/**
 * Gamification API client for level progression, XP tracking, and achievements.
 */

import { BaseApiClient } from './base-client';
import type { ApiResult } from '../types';
import type {
  GamificationProfile,
  GamificationProfileResponse,
  UserStatistics,
  UserStatisticsResponse,
  UserProgress,
  UserProgressResponse,
  UserComparison,
  UserComparisonResponse,
  UserRanking,
  UserRankingResponse,
  StreakInformation,
  StreakInformationResponse,
  ProgressSummaryResponse,
  UserComparisonRequest,
  LevelInfo,
  XPSummary,
  LevelMilestone,
  ProgressionCurve,
  AchievementNotification,
  ChallengeNotification,
  GamificationNotification,
  AchievementRarity,
  LeaderboardResponse,
  StreakMilestone,
  StreakStatistics
} from '../types/gamification';

export class GamificationApiClient extends BaseApiClient {
  
  // Level and XP Methods
  
  /**
   * Get comprehensive level information for a user
   */
  async getUserLevelInfo(userId: string): Promise<ApiResult<{ success: boolean; data: LevelInfo }>> {
    return this.request<{ success: boolean; data: LevelInfo }>(`/gamification/level/${userId}`);
  }

  /**
   * Calculate XP requirement for a specific level
   */
  async calculateLevelRequirements(level: number): Promise<ApiResult<{ 
    success: boolean; 
    data: {
      level: number;
      total_xp_required: number;
      xp_for_this_level: number;
      previous_level_total: number;
    }
  }>> {
    return this.request(`/gamification/level/calculate?level=${level}`);
  }

  /**
   * Determine level from total XP amount
   */
  async getLevelFromXP(xp: number): Promise<ApiResult<{
    success: boolean;
    data: {
      total_xp: number;
      level: number;
      progress: any;
    }
  }>> {
    return this.request(`/gamification/level/from-xp?xp=${xp}`);
  }

  /**
   * Get XP summary for a user over the specified period
   */
  async getUserXPSummary(userId: string, days: number = 30): Promise<ApiResult<{ success: boolean; data: XPSummary }>> {
    return this.request<{ success: boolean; data: XPSummary }>(`/gamification/xp/summary/${userId}?days=${days}`);
  }

  /**
   * Recalculate user statistics from XP events
   */
  async recalculateUserStats(userId: string): Promise<ApiResult<{
    success: boolean;
    message: string;
    data: any;
  }>> {
    return this.request(`/gamification/xp/recalculate/${userId}`, {
      method: 'POST'
    });
  }

  /**
   * Get information about level milestones and rewards
   */
  async getLevelMilestones(): Promise<ApiResult<{
    success: boolean;
    data: {
      milestones: LevelMilestone[];
      total_milestone_levels: number;
      max_level_with_title: number;
      progression_formula: string;
    }
  }>> {
    return this.request('/gamification/progression/milestones');
  }

  /**
   * Get level progression curve data for visualization
   */
  async getProgressionCurve(maxLevel: number = 50): Promise<ApiResult<{
    success: boolean;
    data: ProgressionCurve;
  }>> {
    return this.request(`/gamification/progression/curve?max_level=${maxLevel}`);
  }

  // User Profile and Statistics Methods

  /**
   * Get complete gamification profile for a user
   */
  async getUserGamificationProfile(userId: string): Promise<ApiResult<GamificationProfile>> {
    const result = await this.request<GamificationProfileResponse>(`/gamification/profile/${userId}`);
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return { ...result, data: undefined as any };
  }

  /**
   * Get comprehensive user statistics
   */
  async getUserStatistics(userId: string): Promise<ApiResult<UserStatistics>> {
    const result = await this.request<UserStatisticsResponse>(`/gamification/profile/${userId}/statistics`);
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return { ...result, data: undefined as any };
  }

  /**
   * Get user progress history over time
   */
  async getUserProgressHistory(
    userId: string,
    period: string = 'monthly',
    startDate?: string,
    endDate?: string,
    metrics: string = 'xp,level,achievements,activity'
  ): Promise<ApiResult<UserProgress>> {
    const params = new URLSearchParams({
      period,
      metrics
    });
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const result = await this.request<UserProgressResponse>(`/gamification/profile/${userId}/progress?${params}`);
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return { ...result, data: undefined as any };
  }

  /**
   * Compare two users across various metrics
   */
  async compareUsers(request: UserComparisonRequest): Promise<ApiResult<UserComparison>> {
    const result = await this.request<UserComparisonResponse>('/gamification/profile/compare', {
      method: 'POST',
      body: request
    });
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return { ...result, data: undefined as any };
  }

  /**
   * Get user rankings across different categories
   */
  async getUserRankings(userId: string, categories: string = 'level,xp'): Promise<ApiResult<UserRanking[]>> {
    const result = await this.request<UserRankingResponse>(`/gamification/profile/${userId}/ranking?categories=${categories}`);
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return { ...result, data: undefined as any };
  }

  /**
   * Get detailed streak information for a user
   */
  async getUserStreakInformation(userId: string): Promise<ApiResult<StreakInformation>> {
    const result = await this.request<StreakInformationResponse>(`/gamification/profile/${userId}/streak`);
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return { ...result, data: undefined as any };
  }

  /**
   * Get a comprehensive summary of user progress across all areas
   */
  async getComprehensiveProgressSummary(userId: string): Promise<ApiResult<Record<string, any>>> {
    const result = await this.request<ProgressSummaryResponse>(`/gamification/profile/${userId}/summary`);
    if (result.ok) {
      return { ...result, data: result.data.data };
    }
    return result as ApiResult<Record<string, any>>;
  }

  // Notification Methods

  /**
   * Get recent achievement unlock notifications for current user
   */
  async getAchievementNotifications(
    limit: number = 10,
    since?: string
  ): Promise<ApiResult<AchievementNotification[]>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (since) params.append('since', since);
    
    return this.request<AchievementNotification[]>(`/gamification/notifications/achievements?${params}`);
  }

  /**
   * Get recent challenge-related notifications for current user
   */
  async getChallengeNotifications(
    limit: number = 10,
    notificationType?: string
  ): Promise<ApiResult<ChallengeNotification[]>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (notificationType) params.append('notification_type', notificationType);
    
    return this.request<ChallengeNotification[]>(`/gamification/notifications/challenges?${params}`);
  }

  /**
   * Get all gamification-related notifications
   */
  async getAllGamificationNotifications(
    limit: number = 20,
    since?: string
  ): Promise<ApiResult<{
    notifications: GamificationNotification[];
    total_count: number;
    achievement_count: number;
    challenge_count: number;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (since) params.append('since', since);
    
    return this.request(`/gamification/notifications/all?${params}`);
  }

  // Achievement Rarity Methods

  /**
   * Get rarity percentage for a specific achievement
   */
  async getAchievementRarity(achievementId: string): Promise<ApiResult<{ success: boolean; data: AchievementRarity }>> {
    return this.request<{ success: boolean; data: AchievementRarity }>(`/gamification/achievements/rarity/${achievementId}`);
  }

  /**
   * Get rarity statistics for all achievements in a category
   */
  async getCategoryRarityStats(category: string): Promise<ApiResult<{ success: boolean; data: any }>> {
    return this.request<{ success: boolean; data: any }>(`/gamification/achievements/rarity/category/${category}`);
  }

  /**
   * Get rarity data for all achievements with filtering and sorting
   */
  async getAllAchievementRarities(
    sortBy: string = 'rarity',
    order: string = 'asc',
    tier?: string,
    category?: string
  ): Promise<ApiResult<{ success: boolean; data: AchievementRarity[] }>> {
    const params = new URLSearchParams({
      sort_by: sortBy,
      order
    });
    
    if (tier) params.append('tier', tier);
    if (category) params.append('category', category);
    
    return this.request<{ success: boolean; data: AchievementRarity[] }>(`/gamification/achievements/rarity/all?${params}`);
  }

  // Streak Methods

  /**
   * Get streak leaderboard
   */
  async getStreakLeaderboard(
    streakType: string = 'current',
    limit: number = 50
  ): Promise<ApiResult<LeaderboardResponse>> {
    const params = new URLSearchParams({
      streak_type: streakType,
      limit: limit.toString()
    });
    
    return this.request<LeaderboardResponse>(`/gamification/streaks/leaderboard?${params}`);
  }

  /**
   * Get global streak statistics
   */
  async getGlobalStreakStatistics(): Promise<ApiResult<{ success: boolean; data: StreakStatistics }>> {
    return this.request<{ success: boolean; data: StreakStatistics }>('/gamification/streaks/statistics');
  }

  /**
   * Get streak milestone information and rewards
   */
  async getStreakMilestones(): Promise<ApiResult<{ success: boolean; data: StreakMilestone[] }>> {
    return this.request<{ success: boolean; data: StreakMilestone[] }>('/gamification/streaks/milestones');
  }

  // Utility Methods

  /**
   * Batch update multiple gamification queries
   */
  async batchUpdateQueries(userId: string, queries: string[]): Promise<ApiResult<Record<string, any>>> {
    try {
      const results: Record<string, any> = {};
      
      // Execute queries in parallel
      const promises = queries.map(async (query): Promise<[string, any]> => {
        switch (query) {
          case 'profile':
            return ['profile', await this.getUserGamificationProfile(userId)];
          case 'statistics':
            return ['statistics', await this.getUserStatistics(userId)];
          case 'levelInfo':
            return ['levelInfo', await this.getUserLevelInfo(userId)];
          case 'streakInfo':
            return ['streakInfo', await this.getUserStreakInformation(userId)];
          case 'progressSummary':
            return ['progressSummary', await this.getComprehensiveProgressSummary(userId)];
          default:
            return [query, { ok: false, error: { message: `Unknown query: ${query}` }, status: 400 }];
        }
      });

      const queryResults = await Promise.all(promises);
      
      for (const [key, result] of queryResults) {
        results[key] = result;
      }

      return {
        ok: true,
        data: results,
        status: 200
      };
    } catch (error) {
      return {
        ok: false,
        error: { message: error instanceof Error ? error.message : 'Batch update failed' },
        status: 500
      };
    }
  }

  /**
   * Health check for gamification services
   */
  async healthCheck(): Promise<ApiResult<{ status: string; timestamp: string }>> {
    try {
      // Simple health check by trying to get milestones (doesn't require auth)
      const result = await this.getLevelMilestones();
      if (result.ok) {
        return {
          ok: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString()
          },
          status: 200
        };
      }
      throw new Error('Health check failed');
    } catch (error) {
      return {
        ok: false,
        error: { message: 'Gamification service unavailable' },
        status: 503
      };
    }
  }

  /**
   * Get gamification configuration and settings
   */
  async getGamificationConfig(): Promise<ApiResult<{
    xp_formulas: Record<string, number>;
    level_formula: string;
    milestone_levels: number[];
    achievement_categories: string[];
    streak_milestones: number[];
  }>> {
    try {
      // Get configuration data from multiple endpoints
      const [milestones, streakMilestones] = await Promise.all([
        this.getLevelMilestones(),
        this.getStreakMilestones()
      ]);

      if (!milestones.ok || !streakMilestones.ok) {
        throw new Error('Failed to fetch configuration');
      }

      return {
        ok: true,
        data: {
          xp_formulas: {
            route_complete: 50,
            territory_claim: 100,
            achievement_unlock: 25,
            daily_challenge: 75,
            personal_best: 100,
            social_interaction: 10,
            streak_bonus: 20
          },
          level_formula: 'Level N requires N^2 * 100 total XP',
          milestone_levels: milestones.data.data.milestones
            .filter((m: any) => m.is_milestone)
            .map((m: any) => m.level),
          achievement_categories: [
            'distance', 'speed', 'territory', 'social', 
            'consistency', 'exploration', 'special', 'hidden'
          ],
          streak_milestones: streakMilestones.data.data.map((m: any) => m.days)
        },
        status: 200
      };
    } catch (error) {
      return {
        ok: false,
        error: { message: error instanceof Error ? error.message : 'Failed to get config' },
        status: 500
      };
    }
  }
}

// Export singleton instance
export const gamificationClient = new GamificationApiClient();