import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Star, Award, TrendingUp, Target } from 'lucide-react';
import { useGamificationProfile } from '@/hooks/useGamification';
import { useUserAchievements } from '@/hooks/useAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface GamificationDashboardWidgetProps {
    className?: string;
}

export const GamificationDashboardWidget: React.FC<GamificationDashboardWidgetProps> = ({
    className = ''
}) => {
    const { user } = useAuth();
    const { data: profile, isLoading, error } = useGamificationProfile(user?.id || '', !!user?.id);
    const { data: achievements } = useUserAchievements(user?.id || '');

    if (!user) {
        return null;
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-500" />
                        Gamification Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !profile) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-500" />
                        Gamification Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">
                            Complete your first route to start earning XP and achievements!
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const levelInfo = {
        current_level: profile?.level || 1,
        total_xp: profile?.total_xp || 0,
        xp_to_next_level: profile?.xp_to_next_level || 100,
        current_level_xp: profile?.xp || 0,
        xp_required_for_next_level: (profile?.xp_to_next_level || 100) + (profile?.xp || 0)
    };

    // For now, we'll use placeholder data since streak info isn't in the profile
    const streakInfo = {
        current_streak: 0, // This would need to come from a separate endpoint
        longest_streak: 0
    };
    const recentAchievements = achievements?.slice(0, 3) || [];

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-500" />
                        Gamification Progress
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/profile" className="text-purple-600 hover:text-purple-700">
                            View All
                        </Link>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Level and XP */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-purple-600" />
                            <span className="font-semibold text-gray-900">Level {levelInfo?.current_level || 1}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Zap className="h-4 w-4 text-blue-500" />
                            <span>{levelInfo?.total_xp || 0} XP</span>
                        </div>
                    </div>

                    {levelInfo?.xp_to_next_level !== undefined && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress to Level {(levelInfo.current_level || 1) + 1}</span>
                                <span className="font-medium">{levelInfo.xp_to_next_level} XP needed</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.min(100, ((levelInfo.current_level_xp || 0) / (levelInfo.xp_required_for_next_level || 1)) * 100)}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Streak Information */}
                {(streakInfo?.current_streak || 0) > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-orange-500" />
                                <span className="font-semibold text-gray-900">Activity Streak</span>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-orange-600">{streakInfo.current_streak}</div>
                                <div className="text-xs text-gray-600">days</div>
                            </div>
                        </div>
                        {streakInfo.longest_streak && streakInfo.longest_streak > streakInfo.current_streak && (
                            <div className="mt-2 text-xs text-gray-600">
                                Personal best: {streakInfo.longest_streak} days
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Achievements */}
                {recentAchievements.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-900">Recent Achievements</span>
                        </div>

                        <div className="space-y-2">
                            {recentAchievements.map((achievement, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {achievement.achievement?.name || 'Achievement'}
                                        </div>
                                        {achievement.achievement?.category && (
                                            <div className="text-xs text-yellow-600 font-medium">
                                                {achievement.achievement.category.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to="/achievements" className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Achievements
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link to="/leaderboard" className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Leaderboard
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};