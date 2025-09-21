import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Crown, 
  Swords, 
  RefreshCw,
  GitBranch,
  Clock,
  User,
  Route,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  Eye,
  Calendar,
  MapPin
} from "lucide-react";
import { Territory, TerritoryClaimHistory, TerritoryConflict } from "@/types/territory";

interface OwnershipResolutionHistoryProps {
  territory: Territory;
  onViewRoute?: (routeId: string) => void;
  onViewConflictDetails?: (conflictId: string) => void;
  className?: string;
}

interface ResolutionEvent {
  id: string;
  type: 'claim_attempt' | 'conflict_detected' | 'conflict_resolved' | 'ownership_transfer';
  timestamp: string;
  success?: boolean;
  description: string;
  details: Record<string, any>;
  route_id?: string;
  conflict_id?: string;
  user_id?: string;
  username?: string;
}

const OwnershipResolutionHistory: React.FC<OwnershipResolutionHistoryProps> = ({
  territory,
  onViewRoute,
  onViewConflictDetails,
  className = "",
}) => {
  // Generate resolution events from territory data
  const resolutionEvents = useMemo(() => {
    const events: ResolutionEvent[] = [];

    // Add initial claim event
    if (territory.claimed_at && territory.owner_username) {
      events.push({
        id: `claim-${territory.id}`,
        type: 'claim_attempt',
        timestamp: territory.claimed_at,
        success: true,
        description: `Territory claimed by ${territory.owner_username}`,
        details: {
          area_sqm: territory.area_sqm,
          route_id: territory.source_route_id
        },
        route_id: territory.source_route_id,
        username: territory.owner_username
      });
    }

    // Add conflict events
    if (territory.conflicts) {
      territory.conflicts.forEach(conflict => {
        // Conflict detected event
        events.push({
          id: `conflict-detected-${conflict.id}`,
          type: 'conflict_detected',
          timestamp: conflict.detected_at,
          description: `Conflict detected with ${conflict.challenger_username}'s route`,
          details: {
            overlap_area_sqm: conflict.overlap_area_sqm,
            route_quality_score: conflict.route_quality_score,
            challenger_username: conflict.challenger_username
          },
          conflict_id: conflict.id,
          route_id: conflict.competing_route_id,
          username: conflict.challenger_username
        });

        // Conflict resolved event (if resolved)
        if (conflict.is_resolved && conflict.resolved_at) {
          events.push({
            id: `conflict-resolved-${conflict.id}`,
            type: 'conflict_resolved',
            timestamp: conflict.resolved_at,
            success: conflict.resolution_method === 'accepted',
            description: `Conflict ${conflict.resolution_method} - ${conflict.resolution_method === 'accepted' ? 'Ownership transferred' : 'Ownership maintained'}`,
            details: {
              resolution_method: conflict.resolution_method,
              resolved_by: conflict.resolved_by_username,
              final_owner: conflict.resolution_method === 'accepted' ? conflict.challenger_username : territory.owner_username
            },
            conflict_id: conflict.id,
            username: conflict.resolved_by_username
          });
        }
      });
    }

    // Add claim history events
    if (territory.claim_history) {
      territory.claim_history.forEach(claim => {
        events.push({
          id: `claim-history-${claim.id}`,
          type: claim.success ? 'claim_attempt' : 'claim_attempt',
          timestamp: claim.attempted_at,
          success: claim.success,
          description: claim.success 
            ? `Territory successfully claimed by ${claim.username}`
            : `Failed claim attempt by ${claim.username}: ${claim.failure_reason}`,
          details: {
            route_id: claim.route_id,
            failure_reason: claim.failure_reason,
            area_claimed_sqm: claim.area_claimed_sqm
          },
          route_id: claim.route_id,
          username: claim.username
        });
      });
    }

    // Sort by timestamp (newest first)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [territory]);

  // Get event icon
  const getEventIcon = (event: ResolutionEvent) => {
    switch (event.type) {
      case 'claim_attempt':
        return event.success ? 
          <CheckCircle className="w-4 h-4 text-green-600" /> :
          <XCircle className="w-4 h-4 text-red-600" />;
      case 'conflict_detected':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'conflict_resolved':
        return event.success ?
          <Crown className="w-4 h-4 text-purple-600" /> :
          <Shield className="w-4 h-4 text-blue-600" />;
      case 'ownership_transfer':
        return <GitBranch className="w-4 h-4 text-indigo-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get event color
  const getEventColor = (event: ResolutionEvent) => {
    switch (event.type) {
      case 'claim_attempt':
        return event.success ? 'border-l-green-500' : 'border-l-red-500';
      case 'conflict_detected':
        return 'border-l-orange-500';
      case 'conflict_resolved':
        return event.success ? 'border-l-purple-500' : 'border-l-blue-500';
      case 'ownership_transfer':
        return 'border-l-indigo-500';
      default:
        return 'border-l-gray-500';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relative: getRelativeTime(date)
    };
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  // Format area
  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 1000000) {
      return `${(areaSqm / 1000000).toFixed(2)} km²`;
    }
    return `${(areaSqm / 1000).toFixed(0)} m²`;
  };

  if (resolutionEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Ownership History
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No ownership history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Ownership History
          <Badge variant="outline" className="ml-auto">
            {resolutionEvents.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {resolutionEvents.map((event, index) => {
              const timestamp = formatTimestamp(event.timestamp);
              
              return (
                <div
                  key={event.id}
                  className={`relative pl-6 pb-4 border-l-2 ${getEventColor(event)} ${
                    index === resolutionEvents.length - 1 ? '' : 'border-b border-border/50'
                  }`}
                >
                  {/* Event icon */}
                  <div className="absolute -left-2 top-0 bg-background p-1 rounded-full border">
                    {getEventIcon(event)}
                  </div>

                  {/* Event content */}
                  <div className="space-y-2">
                    {/* Event header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{event.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{timestamp.date} at {timestamp.time}</span>
                          <span>•</span>
                          <span>{timestamp.relative}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Event details */}
                    <div className="text-xs space-y-1">
                      {event.username && (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span className="text-muted-foreground">User:</span>
                          <span className="font-medium">{event.username}</span>
                        </div>
                      )}

                      {event.details.area_sqm && (
                        <div className="flex items-center gap-2">
                          <Target className="w-3 h-3" />
                          <span className="text-muted-foreground">Area:</span>
                          <span className="font-medium">{formatArea(event.details.area_sqm)}</span>
                        </div>
                      )}

                      {event.details.overlap_area_sqm && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          <span className="text-muted-foreground">Overlap:</span>
                          <span className="font-medium">{formatArea(event.details.overlap_area_sqm)}</span>
                        </div>
                      )}

                      {event.details.route_quality_score && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-muted-foreground">Route Quality:</span>
                          <span className="font-medium">{event.details.route_quality_score}/100</span>
                        </div>
                      )}

                      {event.details.failure_reason && (
                        <div className="flex items-center gap-2">
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="font-medium text-red-600">{event.details.failure_reason}</span>
                        </div>
                      )}

                      {event.details.resolution_method && (
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-3 h-3" />
                          <span className="text-muted-foreground">Resolution:</span>
                          <span className="font-medium capitalize">{event.details.resolution_method}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      {event.route_id && onViewRoute && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => onViewRoute(event.route_id!)}
                        >
                          <Route className="w-3 h-3 mr-1" />
                          View Route
                        </Button>
                      )}

                      {event.conflict_id && onViewConflictDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => onViewConflictDetails(event.conflict_id!)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Conflict Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary stats */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">
                {resolutionEvents.filter(e => e.type === 'claim_attempt' && e.success).length}
              </div>
              <div className="text-xs text-muted-foreground">Successful Claims</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-orange-600">
                {resolutionEvents.filter(e => e.type === 'conflict_detected').length}
              </div>
              <div className="text-xs text-muted-foreground">Conflicts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {resolutionEvents.filter(e => e.type === 'conflict_resolved').length}
              </div>
              <div className="text-xs text-muted-foreground">Resolutions</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnershipResolutionHistory;