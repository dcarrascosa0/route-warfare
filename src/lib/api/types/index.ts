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
  LeaderboardEntry,
  LeaderboardPageInfo,
  TerritoryPreview,
  TerritoryEligibilityValidation,
  EnhancedTerritoryEligibilityValidation,
  TerritoryValidationDetails,
  DetailedTerritoryConflict,
  TerritoryConflictResolution,
  EnhancedTerritoryPreview,
  TerritoryStatisticsResponse,
  TerritoryPreviewResponse
} from './territories';
export * from './territory-preview';
export * from './users';
export * from './notifications';
export * from './leaderboard';