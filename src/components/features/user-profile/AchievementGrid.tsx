import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  MapPin, 
  Route, 
  Target, 
  Zap, 
  Star, 
  Award,
  Lock,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement } from './types';
import { Button } from '@/components/ui/button';

interface AchievementGridProps {
  achievements: Achievement[];
  className?: string;
}

// Icon mapping
const iconMap = {
  trophy: Trophy,
  map: MapPin,
  route: Route,
  target: Target,
  zap: Zap,
  star: Star,
  award: Award,
};

// Rarity colors
const rarityColors = {
  common: 'border-gray-300 bg-gray-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50',
};

const rarityBadgeColors = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-yellow-100 text-yellow-800',
};

const AchievementGrid = ({ achievements, className }: AchievementGridProps) => {
  // Sample achievements if none provided
  const sampleAchievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first route',
      icon: 'route',
      category: 'routes',
      points: 10,
      unlocked_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Territory Hunter',
      description: 'Claim your first territory',
      icon: 'map',
      category: 'territory',
      points: 25,
      unlocked_at: '2024-01-15T11:45:00Z',
    },
    {
      id: '3',
      name: 'Speed Demon',
      description: 'Complete 10 routes in a single day',
      icon: 'zap',
      category: 'routes',
      points: 50,
      progress: {
        current: 7,
        target: 10,
        percentage: 70
      },
    },
    {
      id: '4',
      name: 'Explorer',
      description: 'Claim territories in 5 different areas',
      icon: 'target',
      category: 'territory',
      points: 75,
      progress: {
        current: 3,
        target: 5,
        percentage: 60
      },
    },
    {
      id: '5',
      name: 'Conqueror',
      description: 'Control 100 km² of territory',
      icon: 'trophy',
      category: 'territory',
      points: 200,
      progress: {
        current: 45,
        target: 100,
        percentage: 45
      },
    },
    {
      id: '6',
      name: 'Legend',
      description: 'Reach the top 10 global leaderboard',
      icon: 'star',
      category: 'leaderboard',
      points: 500,
    },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : sampleAchievements;

  const getRarityFromPoints = (points: number): keyof typeof rarityColors => {
    if (points >= 500) return 'legendary';
    if (points >= 100) return 'epic';
    if (points >= 50) return 'rare';
    return 'common';
  };

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {displayAchievements.map((achievement) => {
        const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Award;
        const isUnlocked = !!achievement.unlocked_at;
        const hasProgress = !!achievement.progress;
        const rarity = getRarityFromPoints(achievement.points);

        return (
          <Card
            key={achievement.id}
            className={cn(
              'relative overflow-hidden transition-all duration-200 hover:shadow-md',
              isUnlocked 
                ? rarityColors[rarity]
                : 'border-gray-200 bg-gray-50 opacity-75'
            )}
          >
            <CardContent className="p-4">
              {/* Achievement Status Icon */}
              <div className="absolute top-2 right-2">
                {isUnlocked ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Achievement Icon */}
              <div className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center mb-3',
                isUnlocked 
                  ? 'bg-white shadow-sm' 
                  : 'bg-gray-200'
              )}>
                <IconComponent 
                  className={cn(
                    'w-6 h-6',
                    isUnlocked ? 'text-primary' : 'text-gray-400'
                  )} 
                />
              </div>

              {/* Achievement Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={cn(
                    'font-semibold text-sm',
                    isUnlocked ? 'text-foreground' : 'text-gray-500'
                  )}>
                    {achievement.name}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs px-2 py-0.5',
                      rarityBadgeColors[rarity]
                    )}
                  >
                    {achievement.points}pts
                  </Badge>
                </div>

                <p className={cn(
                  'text-xs leading-relaxed',
                  isUnlocked ? 'text-muted-foreground' : 'text-gray-400'
                )}>
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                {hasProgress && achievement.progress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {achievement.progress.current} / {achievement.progress.target}
                      </span>
                    </div>
                    <Progress 
                      value={achievement.progress.percentage} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Unlock Date */}
                {isUnlocked && achievement.unlocked_at && (
                  <p className="text-xs text-green-600 font-medium">
                    Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </p>
                )}

                {/* Track this goal */}
                {!isUnlocked && (
                  <div className="pt-1">
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => {
                      try {
                        const goals = JSON.parse(localStorage.getItem('tracked_goals') || '[]');
                        if (!goals.find((g: any) => g === achievement.id)) {
                          goals.push(achievement.id);
                          localStorage.setItem('tracked_goals', JSON.stringify(goals));
                        }
                      } catch {}
                    }}>
                      Track this goal
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AchievementGrid;