/**
 * Comprehensive level display component with progression visualization
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { XPProgressBar } from './XPProgressBar';

interface LevelDisplayProps {
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  title?: string;
  nextTitle?: string;
  className?: string;
  variant?: 'compact' | 'detailed' | 'card';
  showProgress?: boolean;
  showTitle?: boolean;
  showNextLevel?: boolean;
  animated?: boolean;
}

export const LevelDisplay: React.FC<LevelDisplayProps> = ({
  level,
  currentXP,
  totalXP,
  xpToNextLevel,
  title,
  nextTitle,
  className,
  variant = 'detailed',
  showProgress = true,
  showTitle = true,
  showNextLevel = true,
  animated = true
}) => {
  const nextLevel = level + 1;
  const isMilestone = level % 10 === 0 || level % 25 === 0;
  const isHighLevel = level >= 50;

  const getLevelColor = () => {
    if (level >= 100) return 'from-purple-500 to-pink-500';
    if (level >= 75) return 'from-indigo-500 to-purple-500';
    if (level >= 50) return 'from-blue-500 to-indigo-500';
    if (level >= 25) return 'from-green-500 to-blue-500';
    if (level >= 10) return 'from-yellow-500 to-green-500';
    return 'from-gray-500 to-yellow-500';
  };

  const getLevelIcon = () => {
    if (isMilestone) return <Crown className="w-5 h-5" />;
    if (isHighLevel) return <Star className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        {/* Level badge */}
        <motion.div
          initial={animated ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full text-white font-semibold text-sm',
            'bg-gradient-to-r shadow-lg',
            getLevelColor()
          )}
        >
          {getLevelIcon()}
          <span>Lv. {level}</span>
        </motion.div>

        {/* Progress bar */}
        {showProgress && (
          <div className="flex-1">
            <XPProgressBar
              currentXP={currentXP}
              xpToNextLevel={xpToNextLevel}
              level={level}
              nextLevel={showNextLevel ? nextLevel : undefined}
              variant="compact"
              size="sm"
              animated={animated}
            />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={animated ? { opacity: 0, y: 20 } : false}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-gradient-to-br from-background to-muted/50 rounded-xl p-6 border shadow-lg',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={animated ? { rotate: -180, scale: 0 } : false}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full text-white',
                'bg-gradient-to-r shadow-lg',
                getLevelColor()
              )}
            >
              {getLevelIcon()}
            </motion.div>
            <div>
              <motion.h3
                initial={animated ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold"
              >
                Level {level}
              </motion.h3>
              {showTitle && title && (
                <motion.p
                  initial={animated ? { opacity: 0, x: -20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground"
                >
                  {title}
                </motion.p>
              )}
            </div>
          </div>

          {/* XP display */}
          <motion.div
            initial={animated ? { opacity: 0, scale: 0.8 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-right"
          >
            <div className="text-2xl font-bold text-primary">
              {totalXP.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </motion.div>
        </div>

        {/* Progress section */}
        {showProgress && (
          <motion.div
            initial={animated ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <XPProgressBar
              currentXP={currentXP}
              xpToNextLevel={xpToNextLevel}
              level={level}
              nextLevel={showNextLevel ? nextLevel : undefined}
              variant="detailed"
              size="lg"
              animated={animated}
            />

            {/* Next level info */}
            {showNextLevel && nextTitle && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Next level unlocks:</span>
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">{nextTitle}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Milestone indicator */}
        {isMilestone && (
          <motion.div
            initial={animated ? { opacity: 0, scale: 0.8 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Crown className="w-5 h-5" />
              <span className="font-semibold">Milestone Level!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              You've reached a special milestone. Great achievement!
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Default detailed variant
  return (
    <div className={cn('space-y-4', className)}>
      {/* Level header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={animated ? { rotate: -180, scale: 0 } : false}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full text-white',
              'bg-gradient-to-r shadow-lg',
              getLevelColor()
            )}
          >
            {getLevelIcon()}
          </motion.div>
          <div>
            <motion.h2
              initial={animated ? { opacity: 0, x: -20 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold flex items-center gap-2"
            >
              Level {level}
              {isMilestone && (
                <span className="text-yellow-500 text-sm">★ Milestone</span>
              )}
            </motion.h2>
            {showTitle && title && (
              <motion.p
                initial={animated ? { opacity: 0, x: -20 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground"
              >
                {title}
              </motion.p>
            )}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={animated ? { opacity: 0, scale: 0.8 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-right"
        >
          <div className="text-lg font-semibold text-primary">
            {totalXP.toLocaleString()} XP
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Total earned
          </div>
        </motion.div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <XPProgressBar
            currentXP={currentXP}
            xpToNextLevel={xpToNextLevel}
            level={level}
            nextLevel={showNextLevel ? nextLevel : undefined}
            variant="detailed"
            animated={animated}
          />
        </motion.div>
      )}

      {/* Next level preview */}
      {showNextLevel && nextTitle && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <span className="text-sm text-muted-foreground">
            Next level ({nextLevel}):
          </span>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>{nextTitle}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};