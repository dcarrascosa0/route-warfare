/**
 * Animated XP progress bar with level progression visualization
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface XPProgressBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
  nextLevel?: number;
  className?: string;
  showNumbers?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  xpToNextLevel,
  level,
  nextLevel,
  className,
  showNumbers = true,
  animated = true,
  size = 'md',
  variant = 'default'
}) => {
  const [displayXP, setDisplayXP] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalXPForLevel = currentXP + xpToNextLevel;
  const progressPercentage = totalXPForLevel > 0 ? (currentXP / totalXPForLevel) * 100 : 0;

  // Animate XP counter
  useEffect(() => {
    if (!animated) {
      setDisplayXP(currentXP);
      return;
    }

    setIsAnimating(true);
    const duration = 1000; // 1 second
    const steps = 60;
    const increment = currentXP / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(currentXP, increment * step);
      setDisplayXP(Math.floor(current));

      if (step >= steps || current >= currentXP) {
        clearInterval(timer);
        setDisplayXP(currentXP);
        setIsAnimating(false);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentXP, animated]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const containerClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', containerClasses[size], className)}>
        <span className="text-xs font-medium text-muted-foreground">
          Lv.{level}
        </span>
        <div className="flex-1 relative">
          <div className={cn(
            'w-full bg-muted rounded-full overflow-hidden',
            sizeClasses[size]
          )}>
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: animated ? 0.8 : 0, ease: "easeOut" }}
            />
          </div>
        </div>
        {showNumbers && (
          <span className="text-xs font-medium text-muted-foreground min-w-0">
            {displayXP.toLocaleString()}/{totalXPForLevel.toLocaleString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Level and XP Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className={cn('font-bold text-primary', containerClasses[size])}>
              Level {level}
            </span>
            {nextLevel && (
              <span className="text-muted-foreground text-xs">
                → {nextLevel}
              </span>
            )}
          </div>
        </div>
        
        {showNumbers && (
          <div className={cn('text-right', containerClasses[size])}>
            <div className="font-medium">
              <AnimatePresence mode="wait">
                <motion.span
                  key={displayXP}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={isAnimating ? 'text-primary' : ''}
                >
                  {displayXP.toLocaleString()}
                </motion.span>
              </AnimatePresence>
              <span className="text-muted-foreground">
                /{totalXPForLevel.toLocaleString()} XP
              </span>
            </div>
            {xpToNextLevel > 0 && (
              <div className="text-xs text-muted-foreground">
                {xpToNextLevel.toLocaleString()} to next level
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={cn(
          'w-full bg-muted rounded-full overflow-hidden',
          sizeClasses[size]
        )}>
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: animated ? 1.2 : 0, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            {animated && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Progress percentage indicator */}
        {variant === 'detailed' && (
          <motion.div
            className="absolute top-0 h-full flex items-center text-xs font-medium text-white mix-blend-difference"
            initial={{ left: 0 }}
            animate={{ left: `${Math.max(0, progressPercentage - 5)}%` }}
            transition={{ duration: animated ? 1.2 : 0, ease: "easeOut" }}
          >
            {Math.round(progressPercentage)}%
          </motion.div>
        )}
      </div>

      {/* Additional info for detailed variant */}
      {variant === 'detailed' && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress: {Math.round(progressPercentage)}%</span>
          <span>Next milestone at Level {Math.ceil(level / 5) * 5}</span>
        </div>
      )}
    </div>
  );
};