/**
 * API type definitions.
 */

export * from './common';
export * from './auth';
export * from './routes';
export type {
  Territory,
  TerritoryMapResponse,
  UserTerritoryStatistics,
  GlobalTerritoryStatistics,
  TerritoryLeaderboard,
  LeaderboardPageInfo,
  TerritoryPreview,
  TerritoryEligibilityValidation,
  EnhancedTerritoryEligibilityValidation,
  TerritoryValidationDetails,
  EnhancedTerritoryPreview,
  TerritoryStatisticsResponse,
  TerritoryPreviewResponse
} from './territories';
export type { LeaderboardEntry as TerritoryLeaderboardEntry } from './territories';
export * from './territory-preview';
export * from './users';
export * from './notifications';

// Export leaderboard types explicitly to control LeaderboardEntry export
export type {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardStats,
  TerritoryLeaderboardCategory
} from './leaderboard';

// Export gamification types with LeaderboardEntry aliased to avoid conflict
export type {
  GamificationProfile,
  UserStatistics,
  UserProgress,
  UserComparison,
  UserRanking,
  StreakInformation,
  LevelInfo,
  XPSummary,
  LevelMilestone,
  ProgressionCurve,
  Achievement,
  UserAchievement,
  AchievementRarity,
  AchievementNotification,
  ChallengeNotification,
  GamificationNotification,
  UserComparisonRequest,
  ProgressHistoryRequest,
  GamificationProfileResponse,
  UserStatisticsResponse,
  UserProgressResponse,
  UserComparisonResponse,
  UserRankingResponse,
  StreakInformationResponse,
  ProgressSummaryResponse,
  LeaderboardResponse as GamificationLeaderboardResponse,
  StreakMilestone,
  StreakStatistics,
  LeaderboardEntry as GamificationLeaderboardEntry
} from './gamification';