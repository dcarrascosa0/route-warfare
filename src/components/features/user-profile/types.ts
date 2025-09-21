// User profile types
export interface UserStats {
    total_routes: number;
    total_distance_km: number;
    total_territories: number;
    active_routes: number;
    completed_routes: number;
    average_route_distance: number;
    longest_route_distance: number;
    total_time_hours: number;
    achievements_unlocked: number;
    rank: number;
    points: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    unlocked_at?: string;
    progress?: {
        current: number;
        target: number;
        percentage: number;
    };
}

export interface UserStatisticsProps {
    stats: UserStats;
    showDetails?: boolean;
    className?: string;
}

export interface AchievementProgressProps {
    achievements: Achievement[];
    showUnlocked?: boolean;
    showProgress?: boolean;
    className?: string;
}

export interface UserProfileProps {
    userId: string;
    editable?: boolean;
    onUpdate?: (profile: any) => void;
}