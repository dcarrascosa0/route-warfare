import React from 'react';
import { Trophy, Star, Zap, TrendingUp, Award, Sparkles } from 'lucide-react';
import { GamificationResults } from '@/lib/api/types/routes';

interface RouteCompletionRewardsProps {
  gamificationResults: GamificationResults;
  className?: string;
}

export const RouteCompletionRewards: React.FC<RouteCompletionRewardsProps> = ({
  gamificationResults,
  className = ''
}) => {
  const { route_completion, personal_bests, user_profile } = gamificationResults;
  
  if (!route_completion) return null;
  
  const totalXP = route_completion.xp_gained + 
    (personal_bests?.reduce((sum, pb) => sum + pb.xp_result.xp_gained, 0) || 0);
  
  const hasLevelUp = route_completion.level_up || 
    personal_bests?.some(pb => pb.xp_result.level_up);
  
  const allAchievements = [
    ...(route_completion.achievements_unlocked || []),
    ...(personal_bests?.flatMap(pb => pb.xp_result.achievements_unlocked || []) || [])
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">Route Completed!</h3>
        </div>
        <p className="text-sm text-gray-600">
          Great job! Here are your rewards:
        </p>
      </div>

      {/* XP Gain Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-gray-900">Total XP Gained</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            +{totalXP}
          </div>
        </div>
        
        {/* XP Breakdown */}
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Route completion</span>
            <span>+{route_completion.xp_gained}</span>
          </div>
          
          {route_completion.streak_bonus && (
            <div className="flex justify-between text-orange-600">
              <span>Streak bonus</span>
              <span>+{route_completion.streak_bonus}</span>
            </div>
          )}
          
          {personal_bests?.map((pb, index) => (
            <div key={index} className="flex justify-between text-green-600">
              <span>Personal best ({pb.type})</span>
              <span>+{pb.xp_result.xp_gained}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Level Up Celebration */}
      {hasLevelUp && (
        <div className="space-y-2">
          {route_completion.level_up && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <span className="font-bold text-purple-900">LEVEL UP!</span>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  Level {route_completion.level_up.old_level} → {route_completion.level_up.new_level}
                </div>
                {route_completion.level_up.rewards && route_completion.level_up.rewards.length > 0 && (
                  <div className="mt-2 text-sm text-purple-700">
                    New rewards unlocked!
                  </div>
                )}
              </div>
            </div>
          )}
          
          {personal_bests?.map((pb, index) => 
            pb.xp_result.level_up && (
              <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-green-500" />
                  <span className="font-bold text-green-900">LEVEL UP!</span>
                  <span className="text-sm text-green-700">({pb.type} personal best)</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    Level {pb.xp_result.level_up.old_level} → {pb.xp_result.level_up.new_level}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Personal Bests */}
      {personal_bests && personal_bests.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-900">Personal Bests!</span>
          </div>
          
          <div className="space-y-2">
            {personal_bests.map((pb, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-gray-700 capitalize">{pb.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-medium">
                    {pb.improvement_data.improvement_percentage.toFixed(1)}% improvement
                  </div>
                  <div className="text-xs text-gray-500">
                    {pb.improvement_data.previous_value.toFixed(2)} → {pb.improvement_data.new_value.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Unlocks */}
      {allAchievements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-purple-500" />
            <span className="font-medium text-gray-900">Achievements Unlocked!</span>
          </div>
          
          {allAchievements.map((achievement, index) => (
            <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{achievement.name}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                  {achievement.tier && (
                    <div className="text-xs text-yellow-600 font-medium mt-1">
                      {achievement.tier.toUpperCase()} TIER
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Progress */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Current Level</span>
            <span className="font-medium">{user_profile.level_info?.current_level || 1}</span>
          </div>
          <div className="flex justify-between">
            <span>Total XP</span>
            <span className="font-medium">{user_profile.level_info?.total_xp || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Streak</span>
            <span className="font-medium">{user_profile.streak_info?.current_streak || 0} days</span>
          </div>
        </div>
      </div>
    </div>
  );
};