/**
 * Gamification API type definitions.
 */

// Core Gamification Types
export interface GamificationProfile {
  user_id: string;
  username: string;
  level: number;
  xp: number;
  total_xp: number;
  prestige_level: number;
  title: string;
  profile_theme: string;
  privacy_level: string;
  
  // Progress to next level
  xp_to_next_level: number;
  level_progress_percentage: number;
  
  // Seasonal data
  current_season_xp: number;
  seasonal_rank: number;
  
  // Mastery tracks
  mastery_tracks?: Record<string, number>;
}

export interface UserStatistics {
  // Route statistics
  routes_completed: number;
  total_distance: number; // meters
  total_time: number; // seconds
  average_speed_kmh: number;
  
  // Territory statistics
  territories_claimed: number;
  territory_area: number; // square meters
  
  // Activity statistics
  current_streak: number;
  longest_streak: number;
  last_activity?: string;
  
  // Achievement statistics
  total_achievements: number;
  achievements_by_tier: Record<string, number>;
  achievement_completion_rate: number;
  
  // XP statistics
  total_xp_earned: number;
  xp_this_week: number;
  xp_this_month: number;
}

export interface UserProgress {
  user_id: string;
  period: string; // "daily", "weekly", "monthly"
  
  // XP progression
  xp_history: Array<{
    date: string;
    xp_gained: number;
    event_type: string;
    event_details?: Record<string, any>;
  }>;
  
  level_progression: Array<{
    date: string;
    level: number;
    xp_at_level_up: number;
    title_unlocked?: string;
    rewards_received?: Record<string, any>;
  }>;
  
  // Activity progression
  activity_streak_history: Array<{
    date: string;
    streak_length: number;
    streak_type: string;
  }>;
  
  achievement_unlock_history: Array<{
    date: string;
    achievement_id: string;
    achievement_name: string;
    tier: string;
  }>;
  
  // Performance metrics
  distance_progression: Array<{
    date: string;
    total_distance: number;
    daily_distance: number;
  }>;
  
  speed_progression: Array<{
    date: string;
    average_speed: number;
    max_speed: number;
  }>;
}

export interface UserComparison {
  user1: GamificationProfile;
  user2: GamificationProfile;
  comparison_metrics: Record<string, any>;
}

export interface UserRanking {
  user_id: string;
  username: string;
  rank: number;
  category: string; // "level", "xp", "achievements", etc.
  value: number;
  percentile: number;
  
  // Context information
  total_users: number;
  users_above: number;
  users_below: number;
}

export interface StreakInformation {
  current_streak: number;
  longest_streak: number;
  streak_type: string; // "daily", "weekly"
  
  // Streak history
  streak_start_date?: string;
  last_activity_date?: string;
  
  // Streak rewards and bonuses
  streak_multiplier: number;
  next_milestone?: number;
  milestone_reward?: Record<string, any>;
}

// Level and XP Types
export interface LevelInfo {
  level: number;
  xp: number;
  total_xp: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  title?: string;
  next_title?: string;
  next_milestone?: number;
}

export interface XPSummary {
  user_id: string;
  period_days: number;
  total_xp_gained: number;
  events_by_type: Record<string, number>;
  daily_breakdown: Array<{
    date: string;
    xp_gained: number;
    events: number;
  }>;
  top_xp_sources: Array<{
    event_type: string;
    xp_gained: number;
    event_count: number;
  }>;
}

export interface LevelMilestone {
  level: number;
  xp_required: number;
  title?: string;
  is_milestone: boolean;
  rewards: {
    xp_bonus?: number;
    special_recognition?: boolean;
    theme_unlock?: boolean;
    title_unlock?: boolean;
  };
}

export interface ProgressionCurve {
  curve: Array<{
    level: number;
    total_xp_required: number;
    xp_for_this_level: number;
    is_milestone: boolean;
    title?: string;
  }>;
  formula: string;
  max_level: number;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: string; // bronze, silver, gold, platinum, diamond
  xp_reward: number;
  unlock_reward?: Record<string, any>;
  rarity: number; // percentage
  prerequisites?: string[];
  is_hidden: boolean;
  is_seasonal: boolean;
  season_id?: string;
}

export interface UserAchievement {
  achievement_id: string;
  achievement: Achievement;
  progress_data?: Record<string, any>;
  completion_percentage: number;
  earned_at?: string;
  milestone_rewards_claimed?: Record<string, any>;
}

export interface AchievementRarity {
  achievement_id: string;
  achievement_name: string;
  tier: string;
  category: string;
  rarity_percentage: number;
  total_users: number;
  users_earned: number;
  average_completion_time?: number;
}

// Notification Types
export interface AchievementNotification {
  achievement_id: string;
  achievement_name: string;
  tier: string;
  xp_reward: number;
  unlock_reward?: Record<string, any>;
  rarity: number;
  earned_at: string;
}

export interface ChallengeNotification {
  notification_type: string;
  challenge_id: string;
  challenge_name: string;
  message: string;
  data: Record<string, any>;
  created_at: string;
}

export interface GamificationNotification {
  type: 'achievement' | 'challenge' | 'level_up' | 'streak';
  timestamp: string;
  data: AchievementNotification | ChallengeNotification | Record<string, any>;
}

// Request Types
export interface UserComparisonRequest {
  user1_id: string;
  user2_id: string;
  comparison_categories: string[];
}

export interface ProgressHistoryRequest {
  user_id: string;
  period: string;
  start_date?: string;
  end_date?: string;
  metrics: string[];
}

// Response Types
export interface GamificationProfileResponse {
  success: boolean;
  data: GamificationProfile;
  message?: string;
}

export interface UserStatisticsResponse {
  success: boolean;
  data: UserStatistics;
  message?: string;
}

export interface UserProgressResponse {
  success: boolean;
  data: UserProgress;
  message?: string;
}

export interface UserComparisonResponse {
  success: boolean;
  data: UserComparison;
  message?: string;
}

export interface UserRankingResponse {
  success: boolean;
  data: UserRanking[];
  message?: string;
}

export interface StreakInformationResponse {
  success: boolean;
  data: StreakInformation;
  message?: string;
}

export interface ProgressSummaryResponse {
  success: boolean;
  data: Record<string, any>;
  message?: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  level?: number;
  total_xp?: number;
  achievement_count?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  total_count: number;
  category: string;
  period?: string;
  user_rank?: number;
  user_score?: number;
}

// Streak Types
export interface StreakMilestone {
  days: number;
  name: string;
  description: string;
  xp_bonus: number;
  multiplier: number;
  badge: string;
  title?: string;
}

export interface StreakStatistics {
  total_users: number;
  average_current_streak: number;
  maximum_current_streak: number;
  average_longest_streak: number;
  maximum_longest_streak: number;
  active_streak_percentage: number;
  week_streak_percentage: number;
  month_streak_percentage: number;
  hundred_day_streak_percentage: number;
}