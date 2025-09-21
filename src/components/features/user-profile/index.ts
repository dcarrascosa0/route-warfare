// User profile feature exports
export { default as UserStatistics } from './UserStatistics.tsx';
export { default as AchievementGrid } from './AchievementGrid';
export { default as AchievementProgress } from './AchievementProgress';
export { default as UserStats } from './UserStats';
export { default as LeaderboardEntry } from './LeaderboardEntry';

// Types
export type {
    UserStats as UserStatsType,
    Achievement,
    UserStatisticsProps,
    AchievementProgressProps,
    UserProfileProps
} from './types.ts';

// Leaderboard types
export type { LeaderboardPlayer } from './LeaderboardEntry';