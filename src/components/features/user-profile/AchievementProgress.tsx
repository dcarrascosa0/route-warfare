import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  MapPin,
  Route,
  Target,
  Zap,
  Star,
  Award,
  Lock,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement, AchievementProgressProps } from './types';

interface AchievementCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  achievements: Achievement[];
  completed: number;
  total: number;
}

// Icon mapping
const iconMap: { [key: string]: React.ElementType } = {
  award: Award,
  star: Star,
  trophy: Trophy,
  shield: Shield,
  zap: Zap,
  target: Target,
};

// Rarity colors and styles
const rarityStyles = {
  common: {
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-800',
    glow: '',
  },
  rare: {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    glow: 'shadow-blue-200/50',
  },
  epic: {
    border: 'border-purple-300',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-800',
    glow: 'shadow-purple-200/50',
  },
  legendary: {
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-800',
    glow: 'shadow-yellow-200/50 shadow-lg',
  },
};

const AchievementProgress: React.FC<AchievementProgressProps> = ({
  achievements,
  className,
}) => {

  // Sample achievements if none provided
  const sampleAchievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first route',
      icon: 'route',
      category: 'routes',
      points: 100,
      unlocked_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Territory Hunter',
      description: 'Claim your first territory',
      icon: 'map',
      category: 'territory',
      points: 150,
      unlocked_at: '2024-01-15T11:45:00Z',
    },
    {
      id: '3',
      name: 'Speed Demon',
      description: 'Complete 10 routes in a single day',
      icon: 'zap',
      category: 'routes',
      points: 500,
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
      points: 400,
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
      points: 1000,
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
      category: 'special',
      points: 2000,
    },
    {
      id: '7',
      name: 'Social Butterfly',
      description: 'Interact with 20 different players',
      icon: 'users',
      category: 'social',
      points: 300,
      progress: {
        current: 12,
        target: 20,
        percentage: 60
      },
    },
    {
      id: '8',
      name: 'Marathon Runner',
      description: 'Complete a route longer than 50km',
      icon: 'trending',
      category: 'routes',
      points: 800,
    },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : sampleAchievements;

  // Group achievements by category
  const categories: AchievementCategory[] = [
    {
      id: 'territory',
      name: 'Territory Master',
      icon: MapPin,
      description: 'Achievements related to claiming and controlling territories',
      achievements: displayAchievements.filter(a => a.category === 'territory'),
      completed: 0,
      total: 0,
    },
    {
      id: 'routes',
      name: 'Route Explorer',
      icon: Route,
      description: 'Achievements for completing routes and exploring',
      achievements: displayAchievements.filter(a => a.category === 'routes'),
      completed: 0,
      total: 0,
    },
    {
      id: 'social',
      name: 'Community Player',
      icon: Users,
      description: 'Social achievements and community interactions',
      achievements: displayAchievements.filter(a => a.category === 'social'),
      completed: 0,
      total: 0,
    },
    {
      id: 'special',
      name: 'Special Honors',
      icon: Star,
      description: 'Rare and legendary achievements for exceptional performance',
      achievements: displayAchievements.filter(a => a.category === 'special'),
      completed: 0,
      total: 0,
    },
  ];

  // Calculate completion stats for each category
  categories.forEach(category => {
    category.total = category.achievements.length;
    category.completed = category.achievements.filter(a => a.unlocked_at).length;
  });

  const totalAchievements = displayAchievements.length;
  const completedAchievements = displayAchievements.filter(a => a.unlocked_at).length;
  const overallProgress = totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0;

  const getRarityFromPoints = (points: number): keyof typeof rarityStyles => {
    if (points >= 1500) return 'legendary';
    if (points >= 500) return 'epic';
    if (points >= 200) return 'rare';
    return 'common';
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({
    achievement,
  }) => {
    const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Award;
    const isUnlocked = !!achievement.unlocked_at;
    const hasProgress = !!achievement.progress;
    const rarity = getRarityFromPoints(achievement.points);
    const style = rarityStyles[rarity];

    return (
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-200 hover:shadow-md',
          isUnlocked ? `${style.border} ${style.bg} ${style.glow}` : 'border-gray-200 bg-gray-50 opacity-75'
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
            isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-200'
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
                className={cn('text-xs px-2 py-0.5', style.badge)}
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
            {hasProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {achievement.progress.current} / {achievement.progress.target}
                  </span>
                </div>
                <Progress value={achievement.progress.percentage} className="h-2" />
              </div>
            )}

            {/* Unlock Date */}
            {isUnlocked && achievement.unlocked_at && (
              <p className="text-xs text-green-600 font-medium">
                Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={className}>
      {/* Overall Progress */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {completedAchievements} / {totalAchievements} Completed
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(overallProgress)}% of all achievements unlocked
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {Math.round(overallProgress)}%
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="territory">Territory</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const categoryProgress = category.total > 0 ? (category.completed / category.total) * 100 : 0;

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-5 h-5" />
                      {category.name}
                    </div>
                    <Badge variant="outline">
                      {category.completed}/{category.total}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                  <Progress value={categoryProgress} className="h-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.achievements.slice(0, 6).map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                  {category.achievements.length > 6 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" size="sm">
                        View All {category.achievements.length} Achievements
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AchievementProgress;