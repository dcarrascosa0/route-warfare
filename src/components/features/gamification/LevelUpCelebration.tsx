/**
 * Level-up celebration animations and notifications
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, Gift, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpCelebrationProps {
  isVisible: boolean;
  newLevel: number;
  previousLevel: number;
  xpGained: number;
  newTitle?: string;
  rewards?: Array<{
    type: 'xp_bonus' | 'title' | 'theme' | 'feature';
    name: string;
    description?: string;
  }>;
  onComplete?: () => void;
  className?: string;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  isVisible,
  newLevel,
  previousLevel,
  xpGained,
  newTitle,
  rewards = [],
  onComplete,
  className
}) => {
  const [showRewards, setShowRewards] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Show rewards after main animation
      const timer = setTimeout(() => {
        setShowRewards(true);
      }, 2000);

      // Auto-complete after all animations
      const completeTimer = setTimeout(() => {
        onComplete?.();
      }, 5000 + (rewards.length * 800));

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, rewards.length, onComplete]);

  useEffect(() => {
    if (showRewards && rewards.length > 0) {
      const timer = setInterval(() => {
        setCurrentRewardIndex(prev => {
          if (prev < rewards.length - 1) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, 800);

      return () => clearInterval(timer);
    }
  }, [showRewards, rewards.length]);

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'xp_bonus':
        return <Sparkles className="w-5 h-5" />;
      case 'title':
        return <Crown className="w-5 h-5" />;
      case 'theme':
        return <Star className="w-5 h-5" />;
      case 'feature':
        return <Gift className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const isMilestone = newLevel % 10 === 0 || newLevel % 25 === 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm',
            className
          )}
          onClick={onComplete}
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
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
                  duration: 3,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              duration: 1
            }}
            className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-2xl max-w-md mx-4"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-indigo-400/20 rounded-2xl blur-xl" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Level up icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                className="flex justify-center mb-4"
              >
                {isMilestone ? (
                  <Crown className="w-16 h-16 text-yellow-400" />
                ) : (
                  <Trophy className="w-16 h-16 text-yellow-400" />
                )}
              </motion.div>

              {/* Level up text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className="text-3xl font-bold mb-2">
                  {isMilestone ? 'MILESTONE!' : 'LEVEL UP!'}
                </h2>
                <div className="text-6xl font-black mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {newLevel}
                </div>
                <p className="text-lg opacity-90">
                  Level {previousLevel} → {newLevel}
                </p>
                {xpGained > 0 && (
                  <p className="text-sm opacity-75 mt-1">
                    +{xpGained.toLocaleString()} XP
                  </p>
                )}
              </motion.div>

              {/* New title */}
              {newTitle && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold">New Title Unlocked!</span>
                  </div>
                  <div className="text-yellow-400 font-bold mt-1">
                    {newTitle}
                  </div>
                </motion.div>
              )}

              {/* Rewards */}
              <AnimatePresence>
                {showRewards && rewards.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-2"
                  >
                    <h3 className="text-lg font-semibold mb-3">Rewards Unlocked!</h3>
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ 
                          opacity: index <= currentRewardIndex ? 1 : 0.3,
                          x: 0,
                          scale: index <= currentRewardIndex ? 1 : 0.8
                        }}
                        transition={{ delay: index * 0.2 }}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg transition-all',
                          index <= currentRewardIndex 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/5 text-white/50'
                        )}
                      >
                        <div className="flex-shrink-0">
                          {getRewardIcon(reward.type)}
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{reward.name}</div>
                          {reward.description && (
                            <div className="text-xs opacity-75">{reward.description}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                onClick={onComplete}
                className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors backdrop-blur-sm"
              >
                Continue
              </motion.button>
            </div>

            {/* Floating sparkles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: 1 + Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};