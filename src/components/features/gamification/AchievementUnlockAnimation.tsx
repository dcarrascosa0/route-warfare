/**
 * Achievement unlock animations and celebration effects
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, Crown, Zap, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/lib/api/types/gamification';

interface AchievementUnlockAnimationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onComplete?: () => void;
  className?: string;
}

export const AchievementUnlockAnimation: React.FC<AchievementUnlockAnimationProps> = ({
  achievement,
  isVisible,
  onComplete,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (isVisible && achievement) {
      // Show details after initial animation
      const detailsTimer = setTimeout(() => {
        setShowDetails(true);
      }, 1500);

      // Show rewards after details
      const rewardsTimer = setTimeout(() => {
        setShowRewards(true);
      }, 2500);

      // Auto-complete after all animations
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 5000);

      return () => {
        clearTimeout(detailsTimer);
        clearTimeout(rewardsTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, achievement, onComplete]);

  if (!achievement) return null;

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
        return <Trophy className="w-12 h-12" />;
      case 'platinum':
        return <Star className="w-12 h-12" />;
      case 'diamond':
        return <Zap className="w-12 h-12" />;
      case 'special':
        return <Crown className="w-12 h-12" />;
      default:
        return <Trophy className="w-12 h-12" />;
    }
  };

  const getRarityLabel = (rarity: number) => {
    if (rarity >= 90) return 'Common';
    if (rarity >= 70) return 'Uncommon';
    if (rarity >= 50) return 'Rare';
    if (rarity >= 30) return 'Epic';
    if (rarity >= 10) return 'Legendary';
    return 'Mythic';
  };

  const getRarityColor = (rarity: number) => {
    if (rarity >= 90) return 'text-gray-500';
    if (rarity >= 70) return 'text-green-500';
    if (rarity >= 50) return 'text-blue-500';
    if (rarity >= 30) return 'text-purple-500';
    if (rarity >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm',
            className
          )}
          onClick={onComplete}
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  'absolute w-2 h-2 rounded-full',
                  achievement.tier === 'diamond' ? 'bg-cyan-400' :
                  achievement.tier === 'platinum' ? 'bg-purple-400' :
                  achievement.tier === 'gold' ? 'bg-yellow-400' :
                  achievement.tier === 'silver' ? 'bg-gray-400' :
                  'bg-amber-400'
                )}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 4,
                  delay: Math.random() * 3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Main achievement card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 1.2
            }}
            className="relative bg-gradient-to-br from-background via-background to-muted rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4 border-2 border-primary/20"
          >
            {/* Glow effect */}
            <div className={cn(
              'absolute inset-0 rounded-2xl blur-xl opacity-30',
              'bg-gradient-to-br',
              getTierColor(achievement.tier)
            )} />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Achievement unlocked text */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold text-primary mb-2">
                  Achievement Unlocked!
                </h2>
                <div className={cn(
                  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white',
                  'bg-gradient-to-r',
                  getTierColor(achievement.tier)
                )}>
                  <Sparkles className="w-4 h-4" />
                  {achievement.tier.toUpperCase()}
                </div>
              </motion.div>

              {/* Achievement icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                className="flex justify-center mb-6"
              >
                <div className={cn(
                  'flex items-center justify-center w-24 h-24 rounded-full text-white shadow-2xl',
                  'bg-gradient-to-br',
                  getTierColor(achievement.tier)
                )}>
                  {getTierIcon(achievement.tier)}
                </div>
              </motion.div>

              {/* Achievement details */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {achievement.description}
                      </p>
                    </div>

                    {/* Rarity */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-muted-foreground">Rarity:</span>
                      <span className={cn(
                        'font-semibold text-sm',
                        getRarityColor(achievement.rarity)
                      )}>
                        {getRarityLabel(achievement.rarity)} ({achievement.rarity.toFixed(1)}%)
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rewards */}
              <AnimatePresence>
                {showRewards && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-muted/50 rounded-lg"
                  >
                    <h4 className="font-semibold mb-3 flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4" />
                      Rewards
                    </h4>
                    
                    <div className="space-y-2">
                      {/* XP Reward */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Experience Points</span>
                        <span className="font-semibold text-primary">
                          +{achievement.xp_reward} XP
                        </span>
                      </div>

                      {/* Additional rewards */}
                      {achievement.unlock_reward && (
                        <div className="space-y-1">
                          {Object.entries(achievement.unlock_reward).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
                onClick={onComplete}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </motion.button>
            </div>

            {/* Floating sparkles around the card */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  'absolute w-1 h-1 rounded-full',
                  achievement.tier === 'diamond' ? 'bg-cyan-400' :
                  achievement.tier === 'platinum' ? 'bg-purple-400' :
                  achievement.tier === 'gold' ? 'bg-yellow-400' :
                  achievement.tier === 'silver' ? 'bg-gray-400' :
                  'bg-amber-400'
                )}
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 300}%`,
                  y: `${50 + (Math.random() - 0.5) * 300}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  delay: 1.5 + Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: 4
                }}
              />
            ))}

            {/* Pulsing ring effect */}
            <motion.div
              className={cn(
                'absolute inset-0 rounded-2xl border-2',
                'border-gradient-to-r',
                getTierColor(achievement.tier).replace('from-', 'border-').replace('to-', '')
              )}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.8, 0.3, 0.8]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};