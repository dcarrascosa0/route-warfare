import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import UserStatisticsEnhanced from '@/components/user-statistics-enhanced';
import AchievementProgressEnhanced from '@/components/achievement-progress-enhanced';
import { useAuth } from '@/hooks/useAuth';

const StatisticsDemo: React.FC = () => {
  const { user } = useAuth();
  
  // For demo purposes, use a test user ID if no user is logged in
  const userId = user?.id || 'demo-user';

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Statistics & Achievements Demo</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive user statistics and achievement tracking components
        </p>
        <Badge variant="secondary" className="text-sm">
          Enhanced with real-time API integration
        </Badge>
      </div>

      <Tabs defaultValue="statistics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="statistics">User Statistics</TabsTrigger>
          <TabsTrigger value="achievements">Achievement Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced User Statistics Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive performance metrics with real-time data fetching, 
                comparative analysis, historical trends, and interactive charts.
              </p>
            </CardHeader>
            <CardContent>
              <UserStatisticsEnhanced userId={userId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Overview Tab</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Key performance metrics cards</li>
                    <li>• Level progress with XP tracking</li>
                    <li>• Activity breakdown pie chart</li>
                    <li>• Comparison with community averages</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Performance Tab</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Detailed performance metrics</li>
                    <li>• Performance vs community bar chart</li>
                    <li>• Route completion statistics</li>
                    <li>• Best achievements display</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Trends Tab</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Territory growth area chart</li>
                    <li>• Rank progress line chart</li>
                    <li>• Historical data visualization</li>
                    <li>• Time-based trend analysis</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Comparison Tab</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Percentile ranking display</li>
                    <li>• Goal progress tracking</li>
                    <li>• Community comparison metrics</li>
                    <li>• Achievement milestones</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Achievement Progress Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comprehensive achievement tracking with category organization, 
                progress visualization, and reward information.
              </p>
            </CardHeader>
            <CardContent>
              <AchievementProgressEnhanced 
                userId={userId}
                showCategories={true}
                showProgress={true}
                showRewards={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features Implemented</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Achievement Categories</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Territory Master achievements</li>
                    <li>• Route Explorer achievements</li>
                    <li>• Community Player achievements</li>
                    <li>• Special Honors achievements</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Progress Tracking</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Real-time progress bars</li>
                    <li>• Completion percentage display</li>
                    <li>• Requirements breakdown</li>
                    <li>• Unlock date tracking</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Rarity System</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Common achievements (gray)</li>
                    <li>• Rare achievements (blue)</li>
                    <li>• Epic achievements (purple)</li>
                    <li>• Legendary achievements (gold)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Reward Information</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Experience point rewards</li>
                    <li>• Title unlocks</li>
                    <li>• Badge display</li>
                    <li>• Achievement icons</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Component Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Without Categories</h5>
                  <AchievementProgressEnhanced 
                    userId={userId}
                    showCategories={false}
                    className="max-h-64 overflow-y-auto"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Without Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementProgressEnhanced 
                  userId={userId}
                  showProgress={false}
                  showCategories={false}
                  className="max-h-64 overflow-y-auto"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Without Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <AchievementProgressEnhanced 
                  userId={userId}
                  showRewards={false}
                  showCategories={false}
                  className="max-h-64 overflow-y-auto"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>API Integration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Statistics Endpoints</h4>
              <div className="text-sm space-y-2 font-mono bg-muted p-3 rounded">
                <div>GET /users/{`{userId}`}/statistics</div>
                <div>GET /users/{`{userId}`}/statistics/comparison</div>
                <div>GET /users/{`{userId}`}/statistics/history</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Achievement Endpoints</h4>
              <div className="text-sm space-y-2 font-mono bg-muted p-3 rounded">
                <div>GET /users/{`{userId}`}/achievements</div>
                <div>GET /users/{`{userId}`}/achievements/{`{id}`}/progress</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Data Fetching Features</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Automatic caching with React Query</li>
              <li>• Error handling with retry mechanisms</li>
              <li>• Loading states with skeleton screens</li>
              <li>• Real-time data synchronization</li>
              <li>• Optimistic updates for better UX</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsDemo;