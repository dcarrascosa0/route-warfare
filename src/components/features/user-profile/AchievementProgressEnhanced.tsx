import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  AlertCircle,
  RefreshCw,
  Crown,
  Shield,
  Activity,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserAchievements, Achievement } from '@/hooks/useUserStatistics';

interface AchievementCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  achievements: Achievement[];
  completed: number;
  total: number;
  points: number;
  completedPoints: number;
}

interface AchievementProgressEnhancedProps {
  userId: string;
  className?: string;
  showCategories?: boolean;
  showProgress?: boolean;
  showRewards?: boolean;
  showLeaderboard?: boolean;
  maxHeight?: string;
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
  clock: Clock,
  users: Users,
  trending: TrendingUp,
  calendar: Calendar,
  crown: Crown,
  shield: Shield,
  activity: Activity,
  compass: Compass,
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

const AchievementProgressEnhanced: React.FC<AchievementProgressEnhancedProps> = ({
  userId,
  className = "",
  showCategories = true,
  showProgress = true,
  showRewards = true,
  showLeaderboard = false,
  maxHeight = "600px"
}) => {
  const { 
    achievements, 
    categories, 
    leaderboard, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useUserAchievements(userId);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load achievements: {error?.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch?.()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <div className={className}>
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertDescription>No achievements available yet. Start completing routes and claiming territories!</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate overall progress
  const totalAchievements = achievements.length;
  const completedAchievements = achievements.filter(a => a.unlocked_at).length;
  const overallProgress = totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0;
  const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const earnedPoints = achievements.filter(a => a.unlocked_at).reduce((sum, a) => sum + a.points, 0);

  // Get rarity from points
  const getRarityFromPoints = (points: number): keyof typeof rarityStyles => {
    if (points >= 1000) return 'legendary';
    if (points >= 500) return 'epic';
    if (points >= 200) return 'rare';
    return 'common';
  };

  // Achievement card component
  const AchievementCard: React.FC<{ achievement: Achievement; showDetails?: boolean }> = ({ 
    achievement, 
    showDetails = false 
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
            {hasProgress && achievement.progress && showProgress && (
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

            {/* Rarity Badge */}
            <Badge variant="outline" className={cn('text-xs', style.badge)}>
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Category progress component
  const CategoryProgress: React.FC<{ category: AchievementCategory }> = ({ category }) => {
    const IconComponent = category.icon;
    const progress = category.total > 0 ? (category.completed / category.total) * 100 : 0;
    const pointsProgress = category.points > 0 ? (category.completedPoints / category.points) * 100 : 0;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4" />
              {category.name}
            </div>
            <Badge variant="outline">
              {category.completed}/{category.total}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Achievements</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Points</span>
              <span>{category.completedPoints}/{category.points}</span>
            </div>
            <Progress value={pointsProgress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {category.achievements.slice(0, 4).map((achievement) => (
              <div key={achievement.id} className="text-center p-2 bg-muted/50 rounded">
                <div className={cn(
                  'w-6 h-6 mx-auto mb-1 rounded-full flex items-center justify-center',
                  achievement.unlocked_at ? 'bg-green-100' : 'bg-gray-100'
                )}>
                  {achievement.unlocked_at ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <Lock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <p className="text-xs font-medium truncate">{achievement.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievement Progress
            <Badge variant="outline" className="ml-auto">
              {Math.round(overallProgress)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {completedAchievements}
                </div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {totalAchievements}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {earnedPoints}
                </div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{completedAchievements} / {totalAchievements}</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          {showLeaderboard && <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>}
        </TabsList>

        {/* All Achievements */}
        <TabsContent value="all">
          <ScrollArea style={{ maxHeight }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} showDetails />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          {showCategories && categories && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <CategoryProgress key={category.id} category={category} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recent Achievements */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recently Unlocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements
                  .filter(a => a.unlocked_at)
                  .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
                  .slice(0, 10)
                  .map((achievement) => {
                    const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Award;
                    const rarity = getRarityFromPoints(achievement.points);
                    const style = rarityStyles[rarity];
                    
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className={cn('p-2 rounded-full', style.bg)}>
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Unlocked {new Date(achievement.unlocked_at!).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={style.badge} variant="secondary">
                            {achievement.points}pts
                          </Badge>
                          <Badge variant="outline" className="text-xs mt-1 block">
                            {rarity}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                
                {achievements.filter(a => a.unlocked_at).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No achievements unlocked yet. Start completing routes and claiming territories!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        {showLeaderboard && (
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Achievement Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard?.map((player, index) => (
                    <div key={player.userId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{player.username}</h4>
                        <p className="text-xs text-muted-foreground">
                          {player.completedAchievements} achievements
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {player.totalPoints}
                        </div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Leaderboard data not available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AchievementProgressEnhanced;