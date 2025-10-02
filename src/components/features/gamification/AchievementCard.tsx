/**
 * Achievement card component with progress tracking and tier visualization
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Lock, 
  CheckCircle, 
  Clock, 
  Users, 
  Zap,
  Target,
  Map,
  Heart,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement, UserAchievement } from '@/lib/api/types/gamification';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  showProgress?: boolean;
  showRarity?: boolean;
  variant?: 'grid' | 'list' | 'detailed';
  onClick?: () => void;
  className?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  userAchievement,
  showProgress = true,
  showRarity = true,
  variant = 'grid',
  onClick,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Safety check for undefined achievement
  if (!achievement) {
    return (
      <div className={cn('p-4 border border-gray-200 rounded-lg bg-gray-50', className)}>
        <div className="text-center text-gray-500">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Achievement data unavailable</p>
        </div>
      </div>
    );
  }

  const isEarned = !!userAchievement?.earned_at;
  const isHidden = achievement.is_hidden && !isEarned;
  const progress = userAchievement?.completion_percentage || 0;
  const isInProgress = progress > 0 && progress < 100;

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'from-amber-600 to-amber-800';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-400 to-yellow-600';
      case 'platinum':
        return 'from-blue-400 to-purple-500';
      case 'diamond':
        return 'from-cyan-400 to-blue-500';
      case 'mystery':
      case 'special':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
      case 'silver':
      case 'gold':
        return <Trophy className="w-5 h-5" />;
      case 'platinum':
        return <Star className="w-5 h-5" />;
      case 'diamond':
        return <Zap className="w-5 h-5" />;
      case 'mystery':
      case 'special':
        return <Eye className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'distance':
        return <Target className="w-4 h-4" />;
      case 'speed':
        return <Zap className="w-4 h-4" />;
      case 'territory':
        return <Map className="w-4 h-4" />;
      case 'social':
        return <Users className="w-4 h-4" />;
      case 'consistency':
        return <Clock className="w-4 h-4" />;
      case 'exploration':
        return <Target className="w-4 h-4" />;
      case 'special':
        return <Star className="w-4 h-4" />;
      case 'hidden':
        return <EyeOff className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity: number) => {
    if (rarity >= 90) return 'text-gray-500';
    if (rarity >= 70) return 'text-green-500';
    if (rarity >= 50) return 'text-blue-500';
    if (rarity >= 30) return 'text-purple-500';
    if (rarity >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRarityLabel = (rarity: number) => {
    if (rarity >= 90) return 'Common';
    if (rarity >= 70) return 'Uncommon';
    if (rarity >= 50) return 'Rare';
    if (rarity >= 30) return 'Epic';
    if (rarity >= 10) return 'Legendary';
    return 'Mythic';
  };

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer',
          isEarned 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800' 
            : isInProgress
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800'
            : 'bg-muted/50 border-muted hover:bg-muted',
          isHidden && 'opacity-60',
          className
        )}
      >
        {/* Achievement icon */}
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg',
          'bg-gradient-to-br',
          getTierColor(achievement.tier),
          isEarned && 'ring-2 ring-green-400 ring-offset-2',
          !isEarned && isInProgress && 'ring-2 ring-blue-400 ring-offset-2'
        )}>
          {isHidden ? <Lock className="w-6 h-6" /> : getTierIcon(achievement.tier)}
        </div>

        {/* Achievement info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold truncate',
              isHidden && 'text-muted-foreground'
            )}>
              {isHidden ? '???' : achievement.name}
            </h3>
            <div className="flex items-center gap-1">
              {getCategoryIcon(achievement.category)}
              <span className="text-xs text-muted-foreground capitalize">
                {achievement.category}
              </span>
            </div>
          </div>
          
          <p className={cn(
            'text-sm text-muted-foreground line-clamp-2',
            isHidden && 'text-muted-foreground/60'
          )}>
            {isHidden ? 'Hidden achievement - complete to reveal' : achievement.description}
          </p>

          {/* Progress bar */}
          {showProgress && !isHidden && progress > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className={cn(
                    'h-2 rounded-full',
                    isEarned ? 'bg-green-500' : 'bg-blue-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status and rewards */}
        <div className="flex flex-col items-end gap-2">
          {/* Status icon */}
          <div className="flex items-center gap-2">
            {isEarned ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : isInProgress ? (
              <Clock className="w-5 h-5 text-blue-500" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          {/* XP reward */}
          <div className="text-right">
            <div className="text-sm font-medium text-primary">
              +{achievement.xp_reward} XP
            </div>
            {showRarity && (
              <div className={cn(
                'text-xs font-medium',
                getRarityColor(achievement.rarity)
              )}>
                {getRarityLabel(achievement.rarity)}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border transition-all cursor-pointer group',
        isEarned 
          ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-700' 
          : isInProgress
          ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-md dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-700'
          : 'bg-gradient-to-br from-background to-muted/50 border-muted hover:border-muted-foreground/20 hover:shadow-md',
        isHidden && 'opacity-70',
        className
      )}
    >
      {/* Tier indicator */}
      <div className="absolute top-2 right-2">
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium text-white',
          'bg-gradient-to-r shadow-sm',
          getTierColor(achievement.tier)
        )}>
          {achievement.tier.toUpperCase()}
        </div>
      </div>

      {/* Achievement icon */}
      <div className="flex justify-center mb-3">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
          className={cn(
            'flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg',
            'bg-gradient-to-br',
            getTierColor(achievement.tier),
            isEarned && 'ring-4 ring-green-400/30',
            !isEarned && isInProgress && 'ring-4 ring-blue-400/30'
          )}
        >
          {isHidden ? (
            <Lock className="w-8 h-8" />
          ) : (
            getTierIcon(achievement.tier)
          )}
        </motion.div>
      </div>

      {/* Achievement info */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-1 mb-1">
          {getCategoryIcon(achievement.category)}
          <span className="text-xs text-muted-foreground capitalize">
            {achievement.category}
          </span>
        </div>

        <h3 className={cn(
          'font-semibold text-sm line-clamp-2',
          isHidden && 'text-muted-foreground'
        )}>
          {isHidden ? 'Hidden Achievement' : achievement.name}
        </h3>
        
        <p className={cn(
          'text-xs text-muted-foreground line-clamp-3',
          isHidden && 'text-muted-foreground/60'
        )}>
          {isHidden ? 'Complete to reveal this achievement' : achievement.description}
        </p>

        {/* Progress */}
        {showProgress && !isHidden && progress > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className={cn(
                  'h-2 rounded-full',
                  isEarned ? 'bg-green-500' : 'bg-blue-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Rewards and status */}
        <div className="flex items-center justify-between pt-2 border-t border-muted">
          <div className="text-xs">
            <div className="font-medium text-primary">
              +{achievement.xp_reward} XP
            </div>
            {showRarity && (
              <div className={cn(
                'font-medium',
                getRarityColor(achievement.rarity)
              )}>
                {achievement.rarity.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isEarned ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : isInProgress ? (
              <Clock className="w-4 h-4 text-blue-500" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Earned date */}
      {isEarned && userAchievement?.earned_at && (
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
          {new Date(userAchievement.earned_at).toLocaleDateString()}
        </div>
      )}

      {/* Hover details */}
      <AnimatePresence>
        {showDetails && variant === 'detailed' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-xl p-4 border"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{achievement.name}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {achievement.description}
              </p>

              {achievement.unlock_reward && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium">Rewards:</h5>
                  <div className="text-xs text-muted-foreground">
                    {JSON.stringify(achievement.unlock_reward)}
                  </div>
                </div>
              )}

              {userAchievement?.progress_data && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium">Progress Details:</h5>
                  <div className="text-xs text-muted-foreground">
                    {JSON.stringify(userAchievement.progress_data)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};