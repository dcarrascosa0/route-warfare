import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Route, 
  Shield, 
  Clock,
  TrendingUp,
  Target,
  Award,
  MapPin
} from "lucide-react";
import { UserStatisticsProps, UserStats } from "./types";

export default function UserStatistics({ 
  stats, 
  showDetails = true,
  className 
}: UserStatisticsProps) {
  // Format distance
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(2)} km`;
  };

  // Format time
  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hrs`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Statistics
          <Badge variant="outline" className="ml-auto">
            Rank #{stats.rank}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Route className="h-3 w-3" />
              Total Routes
            </div>
            <div className="text-2xl font-bold">
              {stats.total_routes}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Shield className="h-3 w-3" />
              Territories
            </div>
            <div className="text-2xl font-bold">
              {stats.total_territories}
            </div>
          </div>
        </div>

        {/* Distance and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Total Distance
            </div>
            <div className="text-lg font-semibold">
              {formatDistance(stats.total_distance_km)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Total Time
            </div>
            <div className="text-lg font-semibold">
              {formatTime(stats.total_time_hours)}
            </div>
          </div>
        </div>

        {/* Points and Achievements */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Target className="h-3 w-3" />
              Points
            </div>
            <div className="text-lg font-semibold">
              {stats.points.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Award className="h-3 w-3" />
              Achievements
            </div>
            <div className="text-lg font-semibold">
              {stats.achievements_unlocked}
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="font-medium text-sm">Route Details</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">Active Routes</div>
                <div className="font-medium">{stats.active_routes}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Completed Routes</div>
                <div className="font-medium">{stats.completed_routes}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">Average Distance</div>
                <div className="font-medium">
                  {formatDistance(stats.average_route_distance)}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground">Longest Route</div>
                <div className="font-medium">
                  {formatDistance(stats.longest_route_distance)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicators */}
        {showDetails && (
          <div className="space-y-2 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Route Completion Rate</span>
              <span className="font-medium">
                {stats.total_routes > 0 
                  ? Math.round((stats.completed_routes / stats.total_routes) * 100)
                  : 0}%
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.total_routes > 0 
                    ? (stats.completed_routes / stats.total_routes) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}