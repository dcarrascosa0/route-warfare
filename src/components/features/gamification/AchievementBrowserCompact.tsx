/**
 * Compact Achievement Browser for Profile page achievements tab
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Trophy,
    Star,
    Target,
    Map,
    Users,
    Calendar,
    Zap,
    Globe,
    Route,
    Ruler,
    Search,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AchievementCard } from './AchievementCard';
import { achievementsClient } from '@/lib/api';
import type { Achievement, UserAchievement } from '@/lib/api/types/gamification';

interface AchievementBrowserCompactProps {
    userAchievements?: UserAchievement[];
    className?: string;
}

const CATEGORY_CONFIG = {
    all: {
        name: 'All',
        icon: Trophy,
        color: 'from-purple-500 to-pink-500'
    },
    distance: {
        name: 'Distance',
        icon: Target,
        color: 'from-blue-500 to-cyan-500'
    },
    speed: {
        name: 'Speed',
        icon: Zap,
        color: 'from-yellow-500 to-orange-500'
    },
    territory: {
        name: 'Territory',
        icon: Map,
        color: 'from-green-500 to-emerald-500'
    },
    territory_area: {
        name: 'Area',
        icon: Ruler,
        color: 'from-teal-500 to-green-500'
    },
    routes: {
        name: 'Routes',
        icon: Route,
        color: 'from-indigo-500 to-purple-500'
    },
    social: {
        name: 'Social',
        icon: Users,
        color: 'from-pink-500 to-rose-500'
    },
    consistency: {
        name: 'Streaks',
        icon: Calendar,
        color: 'from-orange-500 to-red-500'
    },
    exploration: {
        name: 'Explore',
        icon: Globe,
        color: 'from-cyan-500 to-blue-500'
    },
    special: {
        name: 'Special',
        icon: Star,
        color: 'from-violet-500 to-purple-500'
    }
};

export const AchievementBrowserCompact: React.FC<AchievementBrowserCompactProps> = ({
    userAchievements = [],
    className
}) => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all achievements
    const { data: allAchievements, isLoading } = useQuery({
        queryKey: ['achievements', 'all'],
        queryFn: async () => {
            const result = await achievementsClient.getAllAchievements(false);
            if (result.ok) {
                return result.data as Achievement[];
            }
            throw new Error('Failed to fetch achievements');
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Create user achievement map for quick lookup
    const userAchievementMap = useMemo(() => {
        const map: Record<string, UserAchievement> = {};
        userAchievements.forEach(ua => {
            map[ua.achievement_id] = ua;
        });
        return map;
    }, [userAchievements]);

    // Filter achievements
    const { filteredAchievements, categoryStats } = useMemo(() => {
        if (!allAchievements || !Array.isArray(allAchievements)) {
            return { filteredAchievements: [], categoryStats: {} };
        }

        let filtered = allAchievements;

        // Filter by category
        if (activeCategory !== 'all') {
            filtered = filtered.filter(achievement =>
                achievement.category.toLowerCase() === activeCategory.toLowerCase()
            );
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(achievement =>
                achievement.name.toLowerCase().includes(query) ||
                achievement.description.toLowerCase().includes(query)
            );
        }

        // Calculate category statistics
        const stats: Record<string, any> = {};
        Object.keys(CATEGORY_CONFIG).forEach(category => {
            if (category === 'all') {
                stats[category] = {
                    total: allAchievements.length,
                    earned: userAchievements.filter(ua => ua.earned_at).length
                };
            } else {
                const categoryAchievements = allAchievements.filter(a =>
                    a.category.toLowerCase() === category.toLowerCase()
                );
                const earnedInCategory = userAchievements.filter(ua =>
                    ua.earned_at && ua.achievement &&
                    ua.achievement.category.toLowerCase() === category.toLowerCase()
                ).length;

                stats[category] = {
                    total: categoryAchievements.length,
                    earned: earnedInCategory
                };
            }
        });

        return { filteredAchievements: filtered, categoryStats: stats };
    }, [allAchievements, activeCategory, searchQuery, userAchievements]);

    if (isLoading) {
        return (
            <div className={cn('space-y-6', className)}>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading achievements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with Search */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">All Achievements</h3>
                        <p className="text-sm text-muted-foreground">
                            {categoryStats.all?.earned || 0} of {categoryStats.all?.total || 0} achievements earned
                        </p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                        {allAchievements?.length || 0} total
                    </Badge>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search achievements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full h-auto">
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        const stats = categoryStats[key];

                        return (
                            <TabsTrigger
                                key={key}
                                value={key}
                                className="flex flex-col items-center gap-1 p-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                <Icon className="w-3 h-3" />
                                <span className="font-medium">{config.name}</span>
                                {stats && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                        {stats.earned}/{stats.total}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {/* Achievement Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeCategory}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TabsContent value={activeCategory} className="space-y-4">
                            {/* Achievement Grid */}
                            {filteredAchievements.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredAchievements.map((achievement) => {
                                        const userAchievement = userAchievementMap[achievement.id];

                                        return (
                                            <motion.div
                                                key={achievement.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.1 }}
                                            >
                                                <AchievementCard
                                                    achievement={achievement}
                                                    userAchievement={userAchievement}
                                                    variant="grid"
                                                    showProgress={true}
                                                    showRarity={true}
                                                    className="h-full"
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery
                                            ? 'Try adjusting your search criteria.'
                                            : 'No achievements available in this category.'}
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="text-center">
                    <div className="text-xl font-bold text-green-500">
                        {categoryStats.all?.earned || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Earned</div>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-blue-500">
                        {userAchievements.filter(ua => !ua.earned_at && ua.completion_percentage > 0).length}
                    </div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-orange-500">
                        {(allAchievements?.length || 0) - userAchievements.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Not Started</div>
                </div>
                <div className="text-center">
                    <div className="text-xl font-bold text-purple-500">
                        {allAchievements?.length > 0
                            ? Math.round(((categoryStats.all?.earned || 0) / allAchievements.length) * 100)
                            : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                </div>
            </div>
        </div>
    );
};