import React from 'react';
import { Trophy, Star, Zap, MapPin, Crown, Sparkles } from 'lucide-react';
import { GamificationResults } from '@/lib/api/types/routes';

interface TerritoryGamificationRewardsProps {
  gamificationResults: GamificationResults;
  territoryArea?: number;
  className?: string;
}

export const TerritoryGamificationRewards: React.FC<TerritoryGamificationRewardsProps> = ({
  gamificationResults,
  territoryArea = 0,
  className = ''
}) => {
  const { territory_claim, user_profile } = gamificationResults;
  
  if (!territory_claim) return null;

  const hasLevelUp = territory_claim.level_up;
  const hasAchievements = territory_claim.achievements_unlocked && territory_claim.achievements_unlocked.length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium text-gray-900">Territory Rewards</span>
      </div>

      {/* XP Gain */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-900">Territory XP</span>
          </div>
          <div className="text-lg font-bold text-purple-600">
            +{territory_claim.xp_gained}
          </div>
        </div>
        
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
          <MapPin className="h-3 w-3" />
          <span>{territoryArea.toFixed(2)} km² claimed</span>
          {territory_claim.streak_bonus && (
            <>
              <span>•</span>
              <span className="text-orange-600">+{territory_claim.streak_bonus} streak bonus</span>
            </>
          )}
        </div>
      </div>

      {/* Level Up */}
      {hasLevelUp && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-yellow-900">LEVEL UP!</span>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">
              Level {territory_claim.level_up.old_level} → {territory_claim.level_up.new_level}
            </div>
            {territory_claim.level_up.rewards && territory_claim.level_up.rewards.length > 0 && (
              <div className="mt-1 text-xs text-yellow-700">
                New rewards unlocked!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievements */}
      {hasAchievements && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-900">Achievements Unlocked!</span>
          </div>
          
          {territory_claim.achievements_unlocked.map((achievement, index) => (
            <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Trophy className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{achievement.name}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                  {achievement.tier && (
                    <div className="text-xs text-orange-600 font-medium mt-1">
                      {achievement.tier.toUpperCase()} TIER
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Current Level</span>
            <span className="font-medium">{user_profile.level_info?.current_level || 1}</span>
          </div>
          <div className="flex justify-between">
            <span>Total XP</span>
            <span className="font-medium">{user_profile.level_info?.total_xp || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Territory Streak</span>
            <span className="font-medium">{user_profile.streak_info?.current_streak || 0} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};