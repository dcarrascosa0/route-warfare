import React from 'react';
import { Trophy, Zap, Star } from 'lucide-react';
import { useGamificationProfile } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface GamificationNavStatusProps {
  compact?: boolean;
  className?: string;
}

export const GamificationNavStatus: React.FC<GamificationNavStatusProps> = ({
  compact = false,
  className = ''
}) => {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useGamificationProfile(user?.id || '', !!user?.id);

  // Don't show anything if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show anything if there's an error (fail silently)
  if (error) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 animate-pulse ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="w-8 h-3 bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Don't show anything if no profile data
  if (!profile) {
    return null;
  }

  const levelInfo = {
    current_level: profile?.level || 1,
    total_xp: profile?.total_xp || 0,
    xp_to_next_level: profile?.xp_to_next_level || 100,
    current_level_xp: profile?.xp || 0,
    xp_required_for_next_level: (profile?.xp_to_next_level || 100) + (profile?.xp || 0)
  };
  
  // For now, we'll use placeholder data since streak info isn't in the profile
  const streakInfo = {
    current_streak: 0, // This would need to come from a separate endpoint
    longest_streak: 0
  };

  if (compact) {
    return (
      <Link 
        to="/profile" 
        className={`flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:from-purple-100 hover:to-blue-100 transition-colors ${className}`}
        title={`Level ${levelInfo?.current_level || 1} • ${levelInfo?.total_xp || 0} XP • ${streakInfo?.current_streak || 0} day streak`}
      >
        <div className="flex items-center gap-1">
          <Trophy className="h-3 w-3 text-purple-600" />
          <span className="text-xs font-medium text-purple-700">
            {levelInfo?.current_level || 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">
            {levelInfo?.total_xp || 0}
          </span>
        </div>
        {(streakInfo?.current_streak || 0) > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">
              {streakInfo.current_streak}
            </span>
          </div>
        )}
      </Link>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-900">Level {levelInfo?.current_level || 1}</span>
        </div>
        <Link 
          to="/profile" 
          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          View Profile
        </Link>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">XP</span>
          <span className="font-medium">{levelInfo?.total_xp || 0}</span>
        </div>
        
        {(streakInfo?.current_streak || 0) > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Streak</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-orange-500" />
              <span className="font-medium">{streakInfo.current_streak} days</span>
            </div>
          </div>
        )}
        
        {levelInfo?.xp_to_next_level !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Next Level</span>
              <span className="font-medium">{levelInfo.xp_to_next_level} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((levelInfo.current_level_xp || 0) / (levelInfo.xp_required_for_next_level || 1)) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};