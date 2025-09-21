/**
 * API-related type definitions.
 */

// Re-export API types from lib for centralized access
export type {
  ApiResult,
  ApiError,
  HttpMethod,
  PaginationParams,
  PaginatedResponse,
} from '../lib/api/types/common';

export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  TokenRefreshRequest,
  TokenRefreshResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
  EmailVerificationRequest,
} from '../lib/api/types/auth';

export type {
  Route,
  RouteDetail,
  RouteStats,
  StartRouteRequest,
  AddCoordinatesRequest,
  CompleteRouteRequest,
  RouteStatistics,
} from '../lib/api/types/routes';

export type {
  Territory,
  RouteInfo,
  TerritoryClaimHistory,
  TerritoryConflict,
  TerritoryMapResponse,
  ClaimTerritoryRequest,
  TerritoryFilter,
  MapBounds,
  TerritoryEvent,
} from '../lib/api/types/territories';

export type {
  UserProfile,
  UserStatistics,
  UserAchievement,
  UserStatisticsHistory,
  UserStatisticsComparison,
} from '../lib/api/types/users';

export type {
  Notification,
  NotificationPreferences,
} from '../lib/api/types/notifications';

export type {
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardStats,
} from '../lib/api/types/leaderboard';