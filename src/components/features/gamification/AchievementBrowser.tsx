/**
 * Comprehensive achievement browser with category filtering and tier visualization
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Grid,
    List,
    Trophy,
    Star,
    Target,
    Zap,
    Map,
    Users,
    Clock,
    Eye,
    EyeOff,
    SortAsc,
    SortDesc,
    CheckCircle,
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AchievementCard } from './AchievementCard';
import type { Achievement, UserAchievement } from '@/lib/api/types/gamification';

interface AchievementBrowserProps {
    achievements: Achievement[];
    userAchievements: UserAchievement[];
    className?: string;
    onAchievementClick?: (achievement: Achievement) => void;
}

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'earned' | 'in_progress' | 'locked';
type SortBy = 'name' | 'tier' | 'category' | 'rarity' | 'xp_reward' | 'earned_date';
type SortOrder = 'asc' | 'desc';

const CATEGORIES = [
    { id: 'all', name: 'All Categories', icon: Trophy },
    { id: 'distance', name: 'Distance', icon: Target },
    { id: 'speed', name: 'Speed', icon: Zap },
    { id: 'territory', name: 'Territory', icon: Map },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'consistency', name: 'Consistency', icon: Clock },
    { id: 'exploration', name: 'Exploration', icon: Target },
    { id: 'special', name: 'Special', icon: Star },
    { id: 'hidden', name: 'Hidden', icon: EyeOff },
];

const TIERS = [
    { id: 'all', name: 'All Tiers', color: 'text-muted-foreground' },
    { id: 'bronze', name: 'Bronze', color: 'text-amber-600' },
    { id: 'silver', name: 'Silver', color: 'text-gray-500' },
    { id: 'gold', name: 'Gold', color: 'text-yellow-500' },
    { id: 'platinum', name: 'Platinum', color: 'text-purple-500' },
    { id: 'diamond', name: 'Diamond', color: 'text-cyan-500' },
    { id: 'special', name: 'Special', color: 'text-pink-500' },
];

export const AchievementBrowser: React.FC<AchievementBrowserProps> = ({
    achievements,
    userAchievements,
    className,
    onAchievementClick
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTier, setSelectedTier] = useState('all');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [showFilters, setShowFilters] = useState(false);

    // Create lookup map for user achievements
    const userAchievementMap = useMemo(() => {
        const map: Record<string, UserAchievement> = {};
        userAchievements.forEach(ua => {
            map[ua.achievement_id] = ua;
        });
        return map;
    }, [userAchievements]);

    // Filter and sort achievements
    const filteredAchievements = useMemo(() => {
        let filtered = achievements.filter(achievement => {
            const userAchievement = userAchievementMap[achievement.id];
            const isEarned = !!userAchievement?.earned_at;
            const progress = userAchievement?.completion_percentage || 0;
            const isInProgress = progress > 0 && progress < 100;
            const isHidden = achievement.is_hidden && !isEarned;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = achievement.name.toLowerCase().includes(query);
                const matchesDescription = achievement.description.toLowerCase().includes(query);
                const matchesCategory = achievement.category.toLowerCase().includes(query);

                if (!matchesName && !matchesDescription && !matchesCategory) {
                    return false;
                }
            }

            // Category filter
            if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
                return false;
            }

            // Tier filter
            if (selectedTier !== 'all' && achievement.tier !== selectedTier) {
                return false;
            }

            // Status filter
            switch (filterStatus) {
                case 'earned':
                    return isEarned;
                case 'in_progress':
                    return isInProgress;
                case 'locked':
                    return !isEarned && !isInProgress;
                default:
                    return true;
            }
        });

        // Sort achievements
        filtered.sort((a, b) => {
            const userAchievementA = userAchievementMap[a.id];
            const userAchievementB = userAchievementMap[b.id];

            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'tier':
                    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'special'];
                    comparison = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
                case 'rarity':
                    comparison = a.rarity - b.rarity;
                    break;
                case 'xp_reward':
                    comparison = a.xp_reward - b.xp_reward;
                    break;
                case 'earned_date':
                    const dateA = userAchievementA?.earned_at ? new Date(userAchievementA.earned_at).getTime() : 0;
                    const dateB = userAchievementB?.earned_at ? new Date(userAchievementB.earned_at).getTime() : 0;
                    comparison = dateA - dateB;
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [
        achievements,
        userAchievementMap,
        searchQuery,
        selectedCategory,
        selectedTier,
        filterStatus,
        sortBy,
        sortOrder
    ]);

    // Statistics
    const stats = useMemo(() => {
        const total = achievements.length;
        const earned = userAchievements.filter(ua => ua.earned_at).length;
        const inProgress = userAchievements.filter(ua =>
            !ua.earned_at && (ua.completion_percentage || 0) > 0
        ).length;
        const locked = total - earned - inProgress;

        return { total, earned, inProgress, locked };
    }, [achievements, userAchievements]);

    const handleSort = (newSortBy: SortBy) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with stats */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Achievements</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="p-2 rounded-lg border hover:bg-muted transition-colors"
                        >
                            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                'p-2 rounded-lg border transition-colors',
                                showFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold text-primary">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.earned}</div>
                        <div className="text-sm text-muted-foreground">Earned</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-2xl font-bold text-muted-foreground">{stats.locked}</div>
                        <div className="text-sm text-muted-foreground">Locked</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search achievements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 p-4 rounded-lg border bg-muted/20"
                    >
                        {/* Categories */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Category</h3>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(category => {
                                    const Icon = category.icon;
                                    return (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors',
                                                selectedCategory === category.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-muted-foreground/10'
                                            )}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {category.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tiers */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Tier</h3>
                            <div className="flex flex-wrap gap-2">
                                {TIERS.map(tier => (
                                    <button
                                        key={tier.id}
                                        onClick={() => setSelectedTier(tier.id)}
                                        className={cn(
                                            'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                                            selectedTier === tier.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted-foreground/10',
                                            tier.color
                                        )}
                                    >
                                        {tier.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', name: 'All', icon: Trophy },
                                    { id: 'earned', name: 'Earned', icon: CheckCircle },
                                    { id: 'in_progress', name: 'In Progress', icon: Clock },
                                    { id: 'locked', name: 'Locked', icon: Lock },
                                ].map(status => {
                                    const Icon = status.icon;
                                    return (
                                        <button
                                            key={status.id}
                                            onClick={() => setFilterStatus(status.id as FilterStatus)}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors',
                                                filterStatus === status.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted hover:bg-muted-foreground/10'
                                            )}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {status.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                            <h3 className="text-sm font-medium mb-2">Sort By</h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'name', name: 'Name' },
                                    { id: 'tier', name: 'Tier' },
                                    { id: 'category', name: 'Category' },
                                    { id: 'rarity', name: 'Rarity' },
                                    { id: 'xp_reward', name: 'XP Reward' },
                                    { id: 'earned_date', name: 'Earned Date' },
                                ].map(sort => (
                                    <button
                                        key={sort.id}
                                        onClick={() => handleSort(sort.id as SortBy)}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors',
                                            sortBy === sort.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted-foreground/10'
                                        )}
                                    >
                                        {sort.name}
                                        {sortBy === sort.id && (
                                            sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Showing {filteredAchievements.length} of {achievements.length} achievements
                </span>
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-primary hover:underline"
                    >
                        Clear search
                    </button>
                )}
            </div>

            {/* Achievement grid/list */}
            <div className={cn(
                viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-3'
            )}>
                <AnimatePresence>
                    {filteredAchievements.map((achievement, index) => (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <AchievementCard
                                achievement={achievement}
                                userAchievement={userAchievementMap[achievement.id]}
                                variant={viewMode}
                                onClick={() => onAchievementClick?.(achievement)}
                                showProgress={true}
                                showRarity={true}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
                    <p className="text-muted-foreground mb-4">
                        Try adjusting your filters or search query
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setSelectedTier('all');
                            setFilterStatus('all');
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
};