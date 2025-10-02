/**
 * Business logic constants.
 */

export const ROUTE_CONSTRAINTS = {
  MIN_COORDINATES: 2,
  MAX_COORDINATES: 10000,
  MIN_DISTANCE_METERS: 100,
  MAX_DISTANCE_METERS: 100000, // 100km
  MIN_DURATION_SECONDS: 60, // 1 minute
  MAX_DURATION_SECONDS: 86400, // 24 hours
} as const;

export const TERRITORY_CONSTRAINTS = {
  MIN_AREA_SQM: 1000, // 0.001 km²
  MAX_AREA_SQM: 10000000, // 10 km²
  MIN_BOUNDARY_POINTS: 3,
  MAX_BOUNDARY_POINTS: 1000,
} as const;

export const GPS_ACCURACY = {
  EXCELLENT: 5, // meters
  GOOD: 10,
  FAIR: 20,
  POOR: 50,
} as const;

export const LEADERBOARD_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time',
} as const;

export const LEADERBOARD_CATEGORIES = {
  TERRITORY: 'territory',
  ROUTES: 'routes',
  DISTANCE: 'distance',

} as const;

export const NOTIFICATION_TYPES = {
  TERRITORY_CLAIMED: 'territory_claimed',
  TERRITORY_LOST: 'territory_lost',
  ROUTE_COMPLETED: 'route_completed',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  LEADERBOARD_POSITION: 'leaderboard_position',
} as const;

export const ROUTE_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TERRITORY_STATUS = {
  CLAIMED: 'claimed',
  CONTESTED: 'contested',
  NEUTRAL: 'neutral',
} as const;