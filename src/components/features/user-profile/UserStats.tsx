import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  MapPin, 
  Route, 
  Trophy, 
  TrendingUp, 
  Target,
  Award
} from 'lucide-react';
import { UnitsFormatter } from '@/lib/format/units';

interface Statistics {
  total_routes: number;
  total_distance_km: number;
  total_duration_hours: number;
  total_territories: number;
  total_territory_area_km2: number;
  average_speed_kmh: number;
  completion_rate: number;
  // Optional fields that might not be in backend response
  rank?: number;
  level?: number;
  experience?: number;
  total_territory_area?: number;
  total_zones?: number;
  routes_completed?: number;
  win_rate?: number;
  current_rank?: number;
}

interface UserStatsProps {
  statistics: Statistics;
}

const UserStats = ({ statistics }: UserStatsProps) => {
  // Mock data for charts (in a real app, this would come from the API)
  const weeklyActivity = [
    { day: 'Mon', routes: 2, territory: 0.5 },
    { day: 'Tue', routes: 1, territory: 0.3 },
    { day: 'Wed', routes: 3, territory: 0.8 },
    { day: 'Thu', routes: 0, territory: 0 },
    { day: 'Fri', routes: 2, territory: 0.6 },
    { day: 'Sat', routes: 4, territory: 1.2 },
    { day: 'Sun', routes: 1, territory: 0.4 },
  ];

  const totalZones = statistics.total_zones || statistics.total_territories || 0;
  const territoryBreakdown = [
    { name: 'Claimed', value: totalZones, color: '#22c55e' },
    { name: 'Contested', value: Math.floor(totalZones * 0.2), color: '#ef4444' },
    { name: 'Available', value: Math.floor(totalZones * 0.1), color: '#6b7280' },
  ];

  // Calculate level progress with fallbacks
  const level = statistics.level || 1;
  const experience = statistics.experience || 0;
  const currentLevelXP = (level - 1) * 1000;
  const nextLevelXP = level * 1000;
  const progressInLevel = experience - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const levelProgress = xpNeededForNextLevel > 0 ? (progressInLevel / xpNeededForNextLevel) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Territory Area</p>
                <p className="text-xl font-bold">{UnitsFormatter.areaKm2(statistics.total_territory_area || statistics.total_territory_area_km2 || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Route className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-xl font-bold">{((statistics.win_rate || statistics.completion_rate || 0) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Global Rank</p>
                <p className="text-xl font-bold">#{statistics.current_rank || statistics.rank || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Level Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">Level {level}</p>
                <p className="text-sm text-muted-foreground">
                  {progressInLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} XP
                </p>
              </div>
              <Badge variant="secondary">
                {Math.round(levelProgress)}% to next level
              </Badge>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="routes" fill="#3b82f6" name="Routes" />
                <Bar dataKey="territory" fill="#10b981" name="Territory (km²)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Territory Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Territory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={territoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {territoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {territoryBreakdown.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{statistics.routes_completed || statistics.total_routes || 0}</p>
            <p className="text-sm text-muted-foreground">Routes Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalZones}</p>
            <p className="text-sm text-muted-foreground">Zones Claimed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{experience.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">#{statistics.current_rank || statistics.rank || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Global Rank</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserStats;