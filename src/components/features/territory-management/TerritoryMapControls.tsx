import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Swords,
  MapPin,
  Globe,
  User,
  Users,
  Filter,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  Target,
  Activity,
} from "lucide-react";
import { TerritoryFilter } from "@/types/territory";

interface TerritoryMapControlsProps {
  filter: TerritoryFilter;
  onFilterChange: (filter: TerritoryFilter) => void;
  territoryCount: number;
  totalTerritories: number;
  className?: string;
  showConflictAreas?: boolean;
  onToggleConflictAreas?: () => void;
  showRouteOverlays?: boolean;
  onToggleRouteOverlays?: () => void;
  animateUpdates?: boolean;
  onToggleAnimations?: () => void;
}

const TerritoryMapControls: React.FC<TerritoryMapControlsProps> = ({
  filter,
  onFilterChange,
  territoryCount,
  totalTerritories,
  className = "",
  showConflictAreas = true,
  onToggleConflictAreas,
  showRouteOverlays = false,
  onToggleRouteOverlays,
  animateUpdates = true,
  onToggleAnimations,
}) => {
  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...filter,
      status: status as TerritoryFilter["status"],
    });
  };

  const handleOwnerChange = (owner: string) => {
    onFilterChange({
      ...filter,
      owner: owner as TerritoryFilter["owner"],
    });
  };

  const handleAreaChange = (areaRange: string) => {
    const ranges = {
      all: { minArea: undefined, maxArea: undefined },
      small: { minArea: undefined, maxArea: 50000 }, // < 50k sqm
      medium: { minArea: 50000, maxArea: 200000 }, // 50k - 200k sqm
      large: { minArea: 200000, maxArea: undefined }, // > 200k sqm
    };

    const range = ranges[areaRange as keyof typeof ranges] || ranges.all;
    onFilterChange({
      ...filter,
      ...range,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      status: 'all',
      owner: 'all',
      minArea: undefined,
      maxArea: undefined,
    });
  };

  const getAreaRange = () => {
    if (!filter.minArea && !filter.maxArea) return 'all';
    if (!filter.minArea && filter.maxArea === 50000) return 'small';
    if (filter.minArea === 50000 && filter.maxArea === 200000) return 'medium';
    if (filter.minArea === 200000 && !filter.maxArea) return 'large';
    return 'custom';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'owned': return <Shield className="w-4 h-4" />;
      case 'contested': return <Swords className="w-4 h-4" />;
      case 'available': return <MapPin className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getOwnerIcon = (owner: string) => {
    switch (owner) {
      case 'me': return <User className="w-4 h-4" />;
      case 'others': return <Users className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header with territory count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Territory Filters</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {territoryCount} / {totalTerritories}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 px-2"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filter.status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(filter.status || 'all')}
                    <span className="capitalize">{filter.status || 'all'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    All Territories
                  </div>
                </SelectItem>
                <SelectItem value="owned">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Owned
                  </div>
                </SelectItem>
                <SelectItem value="contested">
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4 text-orange-600" />
                    Contested
                  </div>
                </SelectItem>
                <SelectItem value="available">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    Available
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Owner filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Owner</label>
            <Select value={filter.owner || 'all'} onValueChange={handleOwnerChange}>
              <SelectTrigger className="h-8">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getOwnerIcon(filter.owner || 'all')}
                    <span className="capitalize">{filter.owner === 'me' ? 'Mine' : filter.owner || 'all'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    All Owners
                  </div>
                </SelectItem>
                <SelectItem value="me">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    My Territories
                  </div>
                </SelectItem>
                <SelectItem value="others">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Others
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Size</label>
            <Select value={getAreaRange()} onValueChange={handleAreaChange}>
              <SelectTrigger className="h-8">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="capitalize">{getAreaRange()}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    All Sizes
                  </div>
                </SelectItem>
                <SelectItem value="small">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600" />
                    Small (&lt; 0.05 km²)
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    Medium (0.05 - 0.2 km²)
                  </div>
                </SelectItem>
                <SelectItem value="large">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    Large (&gt; 0.2 km²)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Display options */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Display Options</span>
            <Layers className="w-3 h-3 text-muted-foreground" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Conflict areas toggle */}
            {onToggleConflictAreas && (
              <Button
                variant={showConflictAreas ? "default" : "outline"}
                size="sm"
                onClick={onToggleConflictAreas}
                className="h-7 text-xs"
              >
                {showConflictAreas ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                Conflicts
              </Button>
            )}

            {/* Route overlays toggle */}
            {onToggleRouteOverlays && (
              <Button
                variant={showRouteOverlays ? "default" : "outline"}
                size="sm"
                onClick={onToggleRouteOverlays}
                className="h-7 text-xs"
              >
                {showRouteOverlays ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                Routes
              </Button>
            )}

            {/* Animations toggle */}
            {onToggleAnimations && (
              <Button
                variant={animateUpdates ? "default" : "outline"}
                size="sm"
                onClick={onToggleAnimations}
                className="h-7 text-xs"
              >
                <Activity className="w-3 h-3 mr-1" />
                Animations
              </Button>
            )}
          </div>
        </div>

        {/* Active filters summary */}
        {(filter.status !== 'all' || filter.owner !== 'all' || filter.minArea || filter.maxArea) && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {filter.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Status: {filter.status}
                </Badge>
              )}
              {filter.owner !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Owner: {filter.owner === 'me' ? 'Mine' : filter.owner}
                </Badge>
              )}
              {(filter.minArea || filter.maxArea) && (
                <Badge variant="secondary" className="text-xs">
                  Size: {getAreaRange()}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TerritoryMapControls;