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
  DetailedTerritoryConflict,
  TerritoryConflictResolution,
  EnhancedTerritoryPreview,
  TerritoryStatisticsResponse,
  TerritoryPreviewResponse
} from './territories';
export type { LeaderboardEntry as TerritoryLeaderboardEntry } from './territories';
export * from './territory-preview';
export * from './users';
export * from './notifications';
export * from './leaderboard';