import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Route, 
  Calendar, 
  Shield,
  Swords,
  Target,
  Eye,
  Navigation,
  User,
  Clock,
  Ruler
} from "lucide-react";
import { Territory } from "@/types/territory";

export interface GroupedTerritories {
  [key: string]: {
    territories: Territory[];
    count: number;
    totalArea: number;
    metadata?: Record<string, any>;
  };
}

interface GroupedTerritoryDisplayProps {
  groupedTerritories: GroupedTerritories;
  onTerritoryClick: (territory: Territory) => void;
  onViewRoute?: (routeId: string) => void;
  currentUserId?: string;
  className?: string;
  maxHeight?: string;
}

function getTerritoryIcon(territory: Territory) {
  if (territory.is_owned) return Shield;
  if (territory.is_contested) return Swords;
  return Target;
}

function getTerritoryColor(territory: Territory, isOwned: boolean = false): string {
  if (isOwned || territory.is_owned) {
    if (territory.is_contested) return "text-orange-500";
    return "text-green-500";
  }
  
  if (territory.is_contested) return "text-orange-500";
  return "text-gray-500";
}

function getTerritoryStatusBadge(territory: Territory) {
  if (territory.is_owned) {
    return (
      <Badge className="bg-green-100 text-green-800" variant="secondary">
        Owned
      </Badge>
    );
  }
  if (territory.is_contested) {
    return (
      <Badge className="bg-orange-100 text-orange-800" variant="secondary">
        Contested
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      Available
    </Badge>
  );
}

const GroupedTerritoryDisplay: React.FC<GroupedTerritoryDisplayProps> = ({
  groupedTerritories,
  onTerritoryClick,
  onViewRoute,
  currentUserId,
  className = "",
  maxHeight = "600px"
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatArea = (areaSqm: number) => {
    if (areaSqm >= 1000000) {
      return `${(areaSqm / 1000000).toFixed(2)} km²`;
    }
    return `${(areaSqm / 1000).toFixed(0)} m²`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getGroupIcon = (groupKey: string) => {
    // Determine icon based on group key pattern
    if (groupKey.includes('route')) return Route;
    if (groupKey.includes('date') || groupKey.match(/\d{4}-\d{2}-\d{2}/)) return Calendar;
    if (groupKey.includes('status') || ['owned', 'contested', 'available'].includes(groupKey.toLowerCase())) {
      if (groupKey.toLowerCase().includes('owned')) return Shield;
      if (groupKey.toLowerCase().includes('contested')) return Swords;
      return Target;
    }
    return MapPin;
  };

  const getGroupColor = (groupKey: string) => {
    if (groupKey.toLowerCase().includes('owned')) return 'text-green-600';
    if (groupKey.toLowerCase().includes('contested')) return 'text-orange-600';
    if (groupKey.toLowerCase().includes('available')) return 'text-gray-600';
    return 'text-blue-600';
  };

  const groupKeys = Object.keys(groupedTerritories).sort();

  if (groupKeys.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No territories to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Grouped Territories
          <Badge variant="outline" className="ml-auto">
            {groupKeys.length} groups
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-3">
            {groupKeys.map((groupKey) => {
              const group = groupedTerritories[groupKey];
              const isExpanded = expandedGroups.has(groupKey);
              const GroupIcon = getGroupIcon(groupKey);
              const groupColor = getGroupColor(groupKey);

              return (
                <div key={groupKey} className="border rounded-lg">
                  {/* Group header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <GroupIcon className={`w-4 h-4 ${groupColor}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{groupKey}</h3>
                        <p className="text-xs text-muted-foreground">
                          {group.count} territories • {formatArea(group.totalArea)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {group.count}
                      </Badge>
                      {group.metadata?.routeId && onViewRoute && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRoute(group.metadata.routeId);
                          }}
                        >
                          <Route className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Group content */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20">
                      <div className="p-3 space-y-2">
                        {group.territories.map((territory) => {
                          const TerritoryIcon = getTerritoryIcon(territory);
                          const territoryColor = getTerritoryColor(
                            territory, 
                            territory.owner_user_id === currentUserId
                          );
                          const isOwned = territory.owner_user_id === currentUserId;

                          return (
                            <div
                              key={territory.id}
                              className="flex items-center justify-between p-2 bg-background rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => onTerritoryClick(territory)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <TerritoryIcon className={`w-4 h-4 ${territoryColor}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm truncate">
                                      {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                                    </h4>
                                    {getTerritoryStatusBadge(territory)}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <div className="flex items-center gap-1">
                                      <Ruler className="w-3 h-3" />
                                      {formatArea(territory.area_sqm)}
                                    </div>
                                    {territory.owner_username && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {territory.owner_username}
                                      </div>
                                    )}
                                    {territory.claimed_at && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(territory.claimed_at)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {territory.source_route_id && onViewRoute && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewRoute(territory.source_route_id!);
                                    }}
                                  >
                                    <Route className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTerritoryClick(territory);
                                  }}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Group summary */}
                      <div className="border-t p-3 bg-muted/10">
                        <div className="grid grid-cols-3 gap-4 text-center text-xs">
                          <div>
                            <div className="font-semibold text-green-600">
                              {group.territories.filter(t => t.is_owned).length}
                            </div>
                            <div className="text-muted-foreground">Owned</div>
                          </div>
                          <div>
                            <div className="font-semibold text-orange-600">
                              {group.territories.filter(t => t.is_contested).length}
                            </div>
                            <div className="text-muted-foreground">Contested</div>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-600">
                              {group.territories.filter(t => !t.is_owned && !t.is_contested).length}
                            </div>
                            <div className="text-muted-foreground">Available</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Overall summary */}
        <div className="border-t pt-3 mt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-primary">
                {groupKeys.length}
              </div>
              <div className="text-xs text-muted-foreground">Groups</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {Object.values(groupedTerritories).reduce((sum, group) => sum + group.count, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Territories</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {formatArea(Object.values(groupedTerritories).reduce((sum, group) => sum + group.totalArea, 0))}
              </div>
              <div className="text-xs text-muted-foreground">Total Area</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {new Set(
                  Object.values(groupedTerritories)
                    .flatMap(group => group.territories)
                    .filter(t => t.source_route_id)
                    .map(t => t.source_route_id)
                ).size}
              </div>
              <div className="text-xs text-muted-foreground">Unique Routes</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupedTerritoryDisplay;