import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertCircle,
    Award,
    BarChart,
    CheckCircle, Clock, Star, Crown
} from 'lucide-react';
import {
    useTerritoryLeaderboard,
    useTerritoryLeaderboardStats,
    useUserAchievements,
} from '@/hooks/useTerritoryLeaderboard';
import type { UserAchievement } from '@/lib/api/types';

interface TerritoryAchievementsProps {
    userId: string;
    className?: string;
    compact?: boolean;
    showProgress?: boolean;
}

export const TerritoryAchievements: React.FC<TerritoryAchievementsProps> = ({
    userId,
    className = '',
    compact = false,
    showProgress = true
}) => {
    const { data: achievementsData, isLoading, error } = useUserAchievements(userId);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'area':
                return <BarChart className="h-4 w-4" />;
            case 'count':
                return <CheckCircle className="h-4 w-4" />;
            case 'efficiency':
                return <Award className="h-4 w-4" />;
            case 'special':
                return <Star className="h-4 w-4" />;
            default:
                return <Award className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'area':
                return 'text-blue-500';
            case 'count':
                return 'text-green-500';
            case 'efficiency':
                return 'text-purple-500';
            case 'special':
                return 'text-yellow-500';
            default:
                return 'text-gray-500';
        }
    };

    // Helper function to extract numeric values from progress fields
    const getProgressValue = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && value !== null) {
            return value.current || value.target || 0;
        }
        return 0;
    };

    const getProgressPercentage = (achievement: UserAchievement) => {
        if (achievement.is_earned) return 100;

        const currentProgress = getProgressValue(achievement.progress);
        const maxProgress = getProgressValue(achievement.max_progress) || 1;

        if (maxProgress === 0) return 0;
        return Math.min((currentProgress / maxProgress) * 100, 100);
    };

    if (isLoading) {
        return (
            <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'} gap-4 ${className}`}>
                {[...Array(compact ? 4 : 10)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className={className}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load achievements: {(error as Error).message}
                </AlertDescription>
            </Alert>
        );
    }

    const achievements = achievementsData || [];
    const completedAchievements = achievements.filter(a => a.is_earned);
    const inProgressAchievements = achievements.filter(a => !a.is_earned);

    if (compact) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <Award className="mr-2 h-5 w-5" />
                        Achievements
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{completedAchievements.length}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{inProgressAchievements.length}</div>
                            <div className="text-sm text-muted-foreground">In Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{achievements.length}</div>
                            <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                    </div>
                    {showProgress && achievements.length > 0 && (
                        <div className="mt-4">
                            <Progress value={(completedAchievements.length / achievements.length) * 100} />
                            <div className="text-center text-sm text-muted-foreground mt-1">
                                {Math.round((completedAchievements.length / achievements.length) * 100)}% Complete
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Territory Achievements
            </h3>
            <TooltipProvider>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {achievements.map((achievement) => (
                        <Tooltip key={achievement.id} delayDuration={100}>
                            <TooltipTrigger asChild>
                                <Card className={`overflow-hidden transition-transform hover:scale-105 ${achievement.is_earned ? 'border-green-500 border-2' : ''}`}>
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <div className={`mb-2 ${getCategoryColor(achievement.category)}`}>
                                            {getCategoryIcon(achievement.category)}
                                        </div>
                                        <div className="font-semibold text-sm">{achievement.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{achievement.description}</div>
                                        {showProgress && !achievement.is_earned && (
                                            <div className="w-full mt-2">
                                                <Progress value={getProgressPercentage(achievement)} className="h-2" />
                                                <div className="text-xs mt-1 text-muted-foreground">
                                                    {getProgressValue(achievement.progress)} / {getProgressValue(achievement.max_progress) || 1}
                                                </div>
                                            </div>
                                        )}
                                        {achievement.is_earned && (
                                            <div className="text-xs text-green-500 mt-2 font-semibold flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Completed
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold">{achievement.name}</p>
                                <p>{achievement.description}</p>
                                <p><span className="font-semibold">Category:</span> {achievement.category}</p>
                                {achievement.earned_at && <p><span className="font-semibold">Completed on:</span> {new Date(achievement.earned_at).toLocaleDateString()}</p>}
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </TooltipProvider>
        </div>
    );
};

export default TerritoryAchievements;