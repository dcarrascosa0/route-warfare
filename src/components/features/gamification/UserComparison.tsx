/**
 * User comparison interface and rivalry tracking
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Trophy,
    Target,
    Map,
    Zap,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Crown,
    Star,
    Flame,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserComparison as UserComparisonData, GamificationProfile } from '@/lib/api/types/gamification';

interface UserComparisonProps {
    comparison: UserComparisonData;
    className?: string;
}

interface ComparisonMetric {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    format: (value: number) => string;
    color: string;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
    {
        key: 'level',
        label: 'Level',
        icon: Crown,
        format: (value) => value.toString(),
        color: 'text-purple-500'
    },
    {
        key: 'total_xp',
        label: 'Total XP',
        icon: Zap,
        format: (value) => value.toLocaleString(),
        color: 'text-blue-500'
    },
    {
        key: 'routes_completed',
        label: 'Routes Completed',
        icon: Target,
        format: (value) => value.toString(),
        color: 'text-green-500'
    },
    {
        key: 'territories_claimed',
        label: 'Territories Claimed',
        icon: Map,
        format: (value) => value.toString(),
        color: 'text-orange-500'
    },
    {
        key: 'total_achievements',
        label: 'Achievements',
        icon: Trophy,
        format: (value) => value.toString(),
        color: 'text-yellow-500'
    },
    {
        key: 'current_streak',
        label: 'Current Streak',
        icon: Flame,
        format: (value) => `${value} days`,
        color: 'text-red-500'
    },
    {
        key: 'longest_streak',
        label: 'Longest Streak',
        icon: Award,
        format: (value) => `${value} days`,
        color: 'text-pink-500'
    }
];

export const UserComparison: React.FC<UserComparisonProps> = ({
    comparison,
    className
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('overview');

    const { user1, user2, comparison_metrics } = comparison;

    const getComparisonResult = (value1: number, value2: number) => {
        if (value1 > value2) return 'higher';
        if (value1 < value2) return 'lower';
        return 'equal';
    };

    const getComparisonIcon = (result: string) => {
        switch (result) {
            case 'higher':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'lower':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            default:
                return <Minus className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getComparisonColor = (result: string) => {
        switch (result) {
            case 'higher':
                return 'text-green-500';
            case 'lower':
                return 'text-red-500';
            default:
                return 'text-muted-foreground';
        }
    };

    const getUserValue = (user: GamificationProfile, key: string): number => {
        switch (key) {
            case 'level':
                return user.level;
            case 'total_xp':
                return user.total_xp;
            case 'routes_completed':
            case 'territories_claimed':
            case 'total_achievements':
            case 'current_streak':
            case 'longest_streak':
                return comparison_metrics[key]?.[user.user_id] || 0;
            default:
                return 0;
        }
    };

    const categories = [
        { id: 'overview', name: 'Overview', icon: Users },
        { id: 'progression', name: 'Progression', icon: TrendingUp },
        { id: 'achievements', name: 'Achievements', icon: Trophy },
        { id: 'activity', name: 'Activity', icon: Clock },
    ];

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Player Comparison</h2>
                <p className="text-muted-foreground">
                    Compare stats and achievements between players
                </p>
            </div>

            {/* User cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User 1 */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
                >
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                            {user1.username.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-lg font-semibold">{user1.username}</h3>
                        <p className="text-sm text-muted-foreground">{user1.title}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Level</span>
                            <span className="font-semibold">{user1.level}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Total XP</span>
                            <span className="font-semibold">{user1.total_xp.toLocaleString()}</span>
                        </div>
                        {user1.prestige_level > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Prestige</span>
                                <span className="font-semibold text-purple-500">{user1.prestige_level}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* User 2 */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-xl border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
                >
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-purple-500 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">
                            {user2.username.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-lg font-semibold">{user2.username}</h3>
                        <p className="text-sm text-muted-foreground">{user2.title}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Level</span>
                            <span className="font-semibold">{user2.level}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Total XP</span>
                            <span className="font-semibold">{user2.total_xp.toLocaleString()}</span>
                        </div>
                        {user2.prestige_level > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Prestige</span>
                                <span className="font-semibold text-purple-500">{user2.prestige_level}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Category tabs */}
            <div className="border-b">
                <div className="flex space-x-8">
                    {categories.map(category => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                                    selectedCategory === category.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {category.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Comparison content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedCategory}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {selectedCategory === 'overview' && (
                        <div className="space-y-4">
                            {COMPARISON_METRICS.map(metric => {
                                const Icon = metric.icon;
                                const value1 = getUserValue(user1, metric.key);
                                const value2 = getUserValue(user2, metric.key);
                                const result1 = getComparisonResult(value1, value2);
                                const result2 = getComparisonResult(value2, value1);

                                return (
                                    <motion.div
                                        key={metric.key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 rounded-lg border bg-muted/20"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Icon className={cn('w-5 h-5', metric.color)} />
                                            <h4 className="font-medium">{metric.label}</h4>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 items-center">
                                            {/* User 1 */}
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <span className="font-semibold">{metric.format(value1)}</span>
                                                    {getComparisonIcon(result1)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{user1.username}</div>
                                            </div>

                                            {/* VS */}
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-muted-foreground">VS</div>
                                            </div>

                                            {/* User 2 */}
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <span className="font-semibold">{metric.format(value2)}</span>
                                                    {getComparisonIcon(result2)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{user2.username}</div>
                                            </div>
                                        </div>

                                        {/* Difference */}
                                        {value1 !== value2 && (
                                            <div className="mt-3 pt-3 border-t text-center">
                                                <div className="text-sm text-muted-foreground">
                                                    Difference: {Math.abs(value1 - value2).toLocaleString()}
                                                    {metric.key.includes('streak') && ' days'}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {selectedCategory === 'progression' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Level comparison */}
                            <div className="p-6 rounded-xl border bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Crown className="w-6 h-6 text-purple-500" />
                                    <h3 className="font-semibold">Level Progression</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>{user1.username}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">Level {user1.level}</span>
                                            {user1.level > user2.level && <Crown className="w-4 h-4 text-yellow-500" />}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span>{user2.username}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">Level {user2.level}</span>
                                            {user2.level > user1.level && <Crown className="w-4 h-4 text-yellow-500" />}
                                        </div>
                                    </div>

                                    {user1.level !== user2.level && (
                                        <div className="pt-3 border-t text-center text-sm text-muted-foreground">
                                            Level difference: {Math.abs(user1.level - user2.level)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* XP comparison */}
                            <div className="p-6 rounded-xl border bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="w-6 h-6 text-blue-500" />
                                    <h3 className="font-semibold">Experience Points</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>{user1.username}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{user1.total_xp.toLocaleString()}</span>
                                            {user1.total_xp > user2.total_xp && <Star className="w-4 h-4 text-yellow-500" />}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span>{user2.username}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{user2.total_xp.toLocaleString()}</span>
                                            {user2.total_xp > user1.total_xp && <Star className="w-4 h-4 text-yellow-500" />}
                                        </div>
                                    </div>

                                    {user1.total_xp !== user2.total_xp && (
                                        <div className="pt-3 border-t text-center text-sm text-muted-foreground">
                                            XP difference: {Math.abs(user1.total_xp - user2.total_xp).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedCategory === 'achievements' && (
                        <div className="text-center py-12">
                            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Achievement Comparison</h3>
                            <p className="text-muted-foreground">
                                Detailed achievement comparison coming soon!
                            </p>
                        </div>
                    )}

                    {selectedCategory === 'activity' && (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Activity Comparison</h3>
                            <p className="text-muted-foreground">
                                Activity timeline comparison coming soon!
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Summary */}
            <div className="p-6 rounded-xl border bg-gradient-to-r from-muted/50 to-muted/20">
                <h3 className="font-semibold mb-3 text-center">Comparison Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-blue-500">
                            {user1.level > user2.level ? user1.username :
                                user2.level > user1.level ? user2.username : 'Tie'}
                        </div>
                        <div className="text-sm text-muted-foreground">Higher Level</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-500">
                            {user1.total_xp > user2.total_xp ? user1.username :
                                user2.total_xp > user1.total_xp ? user2.username : 'Tie'}
                        </div>
                        <div className="text-sm text-muted-foreground">More XP</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-purple-500">
                            {(comparison_metrics.total_achievements?.[user1.user_id] || 0) >
                                (comparison_metrics.total_achievements?.[user2.user_id] || 0) ? user1.username :
                                (comparison_metrics.total_achievements?.[user2.user_id] || 0) >
                                    (comparison_metrics.total_achievements?.[user1.user_id] || 0) ? user2.username : 'Tie'}
                        </div>
                        <div className="text-sm text-muted-foreground">More Achievements</div>
                    </div>
                </div>
            </div>
        </div>
    );
};