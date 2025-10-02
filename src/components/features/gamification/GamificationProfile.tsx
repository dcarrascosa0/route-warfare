/**
 * Enhanced user profile with comprehensive gamification stats
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Trophy,
    Star,
    Target,
    Map,
    Clock,
    Zap,
    TrendingUp,
    Calendar,
    Award,
    Crown,
    Flame,
    Settings,
    Share2,
    Eye,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LevelDisplay } from './LevelDisplay';
import { XPProgressBar } from './XPProgressBar';
import { AchievementCard } from './AchievementCard';
import { AchievementBrowserCompact } from './AchievementBrowserCompact';
import type {
    GamificationProfile as ProfileType,
    UserStatistics,
    UserAchievement,
    Achievement,
    StreakInformation
} from '@/lib/api/types/gamification';

interface GamificationProfileProps {
    profile: ProfileType;
    statistics: UserStatistics;
    recentAchievements: UserAchievement[];
    streakInfo: StreakInformation;
    isOwnProfile?: boolean;
    onThemeChange?: (theme: string) => void;
    onTitleChange?: (title: string) => void;
    onPrivacyChange?: (level: string) => void;
    className?: string;
}

type TabType = 'overview' | 'achievements' | 'statistics' | 'activity';

const AVAILABLE_THEMES = [
    { id: 'default', name: 'Default', colors: 'from-blue-500 to-purple-500' },
    { id: 'fire', name: 'Fire', colors: 'from-red-500 to-orange-500' },
    { id: 'nature', name: 'Nature', colors: 'from-green-500 to-teal-500' },
    { id: 'ocean', name: 'Ocean', colors: 'from-cyan-500 to-blue-500' },
    { id: 'sunset', name: 'Sunset', colors: 'from-pink-500 to-yellow-500' },
    { id: 'galaxy', name: 'Galaxy', colors: 'from-purple-500 to-indigo-500' },
];

const AVAILABLE_TITLES = [
    'Rookie Explorer',
    'Seasoned Traveler',
    'Route Master',
    'Territory Lord',
    'Speed Demon',
    'Endurance Champion',
    'Achievement Hunter',
    'Legendary Explorer'
];

export const GamificationProfile: React.FC<GamificationProfileProps> = ({
    profile,
    statistics,
    recentAchievements,
    streakInfo,
    isOwnProfile = false,
    onThemeChange,
    onTitleChange,
    onPrivacyChange,
    className
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showSettings, setShowSettings] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(profile.profile_theme);
    const [selectedTitle, setSelectedTitle] = useState(profile.title);
    const [selectedPrivacy, setSelectedPrivacy] = useState(profile.privacy_level);

    const currentTheme = AVAILABLE_THEMES.find(t => t.id === profile.profile_theme) || AVAILABLE_THEMES[0];

    const handleThemeChange = (themeId: string) => {
        setSelectedTheme(themeId);
        onThemeChange?.(themeId);
    };

    const handleTitleChange = (title: string) => {
        setSelectedTitle(title);
        onTitleChange?.(title);
    };

    const handlePrivacyChange = (level: string) => {
        setSelectedPrivacy(level);
        onPrivacyChange?.(level);
    };

    const getStreakColor = (streak: number) => {
        if (streak >= 100) return 'text-purple-500';
        if (streak >= 50) return 'text-orange-500';
        if (streak >= 30) return 'text-red-500';
        if (streak >= 14) return 'text-yellow-500';
        if (streak >= 7) return 'text-green-500';
        return 'text-blue-500';
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const formatDistance = (meters: number) => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${meters.toFixed(0)} m`;
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: User },
        { id: 'achievements', name: 'Achievements', icon: Trophy },
        { id: 'statistics', name: 'Statistics', icon: TrendingUp },
        { id: 'activity', name: 'Activity', icon: Calendar },
    ];

    return (
        <div className={cn('space-y-6', className)}>
            {/* Profile Header */}
            <div className={cn(
                'relative p-6 rounded-2xl text-white overflow-hidden',
                'bg-gradient-to-br',
                currentTheme.colors
            )}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div 
                        className="absolute inset-0" 
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat'
                        }}
                    />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold"
                            >
                                {profile.username.charAt(0).toUpperCase()}
                            </motion.div>

                            {/* Basic info */}
                            <div>
                                <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="w-4 h-4" />
                                    <span className="text-sm opacity-90">{profile.title}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm opacity-75">
                                    <span>Level {profile.level}</span>
                                    {profile.prestige_level > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3" />
                                            Prestige {profile.prestige_level}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {isOwnProfile && (
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            )}
                            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Level progress */}
                    <div className="mb-4">
                        <XPProgressBar
                            currentXP={profile.xp}
                            xpToNextLevel={profile.xp_to_next_level}
                            level={profile.level}
                            nextLevel={profile.level + 1}
                            variant="compact"
                            size="md"
                            className="text-white"
                        />
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{profile.total_xp.toLocaleString()}</div>
                            <div className="text-xs opacity-75">Total XP</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{statistics.total_achievements}</div>
                            <div className="text-xs opacity-75">Achievements</div>
                        </div>
                        <div className="text-center">
                            <div className={cn('text-2xl font-bold', getStreakColor(statistics.current_streak))}>
                                {statistics.current_streak}
                            </div>
                            <div className="text-xs opacity-75">Day Streak</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{statistics.routes_completed}</div>
                            <div className="text-xs opacity-75">Routes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && isOwnProfile && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 rounded-xl border bg-muted/20 space-y-6"
                    >
                        <h3 className="text-lg font-semibold">Profile Settings</h3>

                        {/* Theme selection */}
                        <div>
                            <h4 className="text-sm font-medium mb-3">Profile Theme</h4>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {AVAILABLE_THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        onClick={() => handleThemeChange(theme.id)}
                                        className={cn(
                                            'p-3 rounded-lg border-2 transition-all',
                                            selectedTheme === theme.id
                                                ? 'border-primary'
                                                : 'border-muted hover:border-muted-foreground/20'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-full h-8 rounded mb-2 bg-gradient-to-r',
                                            theme.colors
                                        )} />
                                        <div className="text-xs font-medium">{theme.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title selection */}
                        <div>
                            <h4 className="text-sm font-medium mb-3">Title</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {AVAILABLE_TITLES.map(title => (
                                    <button
                                        key={title}
                                        onClick={() => handleTitleChange(title)}
                                        className={cn(
                                            'p-2 rounded-lg text-sm transition-colors',
                                            selectedTitle === title
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted-foreground/10'
                                        )}
                                    >
                                        {title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Privacy settings */}
                        <div>
                            <h4 className="text-sm font-medium mb-3">Privacy Level</h4>
                            <div className="flex gap-2">
                                {[
                                    { id: 'public', name: 'Public', icon: Users },
                                    { id: 'friends', name: 'Friends Only', icon: User },
                                    { id: 'private', name: 'Private', icon: Eye },
                                ].map(privacy => {
                                    const Icon = privacy.icon;
                                    return (
                                        <button
                                            key={privacy.id}
                                            onClick={() => handlePrivacyChange(privacy.id)}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                                                selectedPrivacy === privacy.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-muted-foreground/10'
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {privacy.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex space-x-8">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={cn(
                                    'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Recent achievements */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
                                {recentAchievements.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recentAchievements.slice(0, 6).map((userAchievement, index) => (
                                            <AchievementCard
                                                key={userAchievement.achievement_id || `achievement-${index}`}
                                                achievement={userAchievement.achievement}
                                                userAchievement={userAchievement}
                                                variant="grid"
                                                showProgress={false}
                                                showRarity={true}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No achievements yet. Start exploring to earn your first achievement!</p>
                                    </div>
                                )}
                            </div>

                            {/* Streak information */}
                            <div className="p-6 rounded-xl border bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Flame className={cn('w-6 h-6', getStreakColor(streakInfo.current_streak))} />
                                    <h3 className="text-lg font-semibold">Activity Streak</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className={cn('text-2xl font-bold', getStreakColor(streakInfo.current_streak))}>
                                            {streakInfo.current_streak}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Current Streak</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-purple-500">
                                            {streakInfo.longest_streak}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Longest Streak</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-500">
                                            {streakInfo.streak_multiplier.toFixed(1)}x
                                        </div>
                                        <div className="text-sm text-muted-foreground">XP Multiplier</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'statistics' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Route statistics */}
                            <div className="p-6 rounded-xl border bg-blue-50 dark:bg-blue-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Target className="w-6 h-6 text-blue-500" />
                                    <h3 className="font-semibold">Routes</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Completed</span>
                                        <span className="font-medium">{statistics.routes_completed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Distance</span>
                                        <span className="font-medium">{formatDistance(statistics.total_distance)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Time</span>
                                        <span className="font-medium">{formatDuration(statistics.total_time)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Avg Speed</span>
                                        <span className="font-medium">{statistics.average_speed_kmh.toFixed(1)} km/h</span>
                                    </div>
                                </div>
                            </div>

                            {/* Territory statistics */}
                            <div className="p-6 rounded-xl border bg-purple-50 dark:bg-purple-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Map className="w-6 h-6 text-purple-500" />
                                    <h3 className="font-semibold">Territory</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Claimed</span>
                                        <span className="font-medium">{statistics.territories_claimed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Area</span>
                                        <span className="font-medium">{(statistics.territory_area / 1000000).toFixed(2)} km²</span>
                                    </div>
                                </div>
                            </div>

                            {/* XP statistics */}
                            <div className="p-6 rounded-xl border bg-green-50 dark:bg-green-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Zap className="w-6 h-6 text-green-500" />
                                    <h3 className="font-semibold">Experience</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total XP</span>
                                        <span className="font-medium">{statistics.total_xp_earned.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">This Week</span>
                                        <span className="font-medium">{statistics.xp_this_week.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">This Month</span>
                                        <span className="font-medium">{statistics.xp_this_month.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Achievement statistics */}
                            <div className="p-6 rounded-xl border bg-yellow-50 dark:bg-yellow-950/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <Award className="w-6 h-6 text-yellow-500" />
                                    <h3 className="font-semibold">Achievements</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total</span>
                                        <span className="font-medium">{statistics.total_achievements}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                                        <span className="font-medium">{statistics.achievement_completion_rate.toFixed(1)}%</span>
                                    </div>
                                    {Object.entries(statistics.achievements_by_tier).map(([tier, count]) => (
                                        <div key={tier} className="flex justify-between">
                                            <span className="text-sm text-muted-foreground capitalize">{tier}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'achievements' && (
                        <AchievementBrowserCompact 
                            userAchievements={recentAchievements || []}
                        />
                    )}

                    {activeTab === 'activity' && (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Activity Timeline</h3>
                            <p className="text-muted-foreground">
                                Activity timeline feature coming soon!
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};