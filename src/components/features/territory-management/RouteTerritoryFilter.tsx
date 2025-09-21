import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Calendar,
  Route,
  BarChart3,
  MapPin,
  Clock,
  Target,
  X,
  Shield,
  Swords,
  RefreshCw
} from "lucide-react";
import { Territory } from "@/types/territory";

export interface RouteFilterOptions {
  searchTerm: string;
  routeType: "all" | "route-created" | "other";
  dateRange: "all" | "today" | "week" | "month";
  groupBy: "none" | "date" | "route" | "status";
  claimingMethod: "all" | "route_completion" | "manual" | "auto";
  autoClaimedOnly: boolean;
  specificRouteId?: string;
}

interface RouteFilterStats {
  totalFiltered: number;
  routeCreated: number;
  manualClaimed: number;
  autoClaimedCount: number;
  uniqueRoutes: number;
}

interface RouteTerritoryFilterProps {
  territories: Territory[];
  onFilterChange: (filteredTerritories: Territory[], filterOptions: RouteFilterOptions) => void;
  initialFilters?: Partial<RouteFilterOptions>;
  className?: string;
}

const RouteTerritoryFilter: React.FC<RouteTerritoryFilterProps> = ({
  territories,
  onFilterChange,
  initialFilters = {},
  className = ""
}) => {
  const [filters, setFilters] = useState<RouteFilterOptions>({
    searchTerm: "",
    routeType: "all",
    dateRange: "all",
    groupBy: "none",
    claimingMethod: "all",
    autoClaimedOnly: false,
    ...initialFilters
  });

  // Filter territories based on current filters
  const filteredTerritories = useMemo(() => {
    let filtered = [...territories];

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(territory =>
        territory.name?.toLowerCase().includes(searchLower) ||
        territory.owner_username?.toLowerCase().includes(searchLower) ||
        territory.id.toLowerCase().includes(searchLower)
      );
    }

    // Route type filter
    if (filters.routeType !== "all") {
      filtered = filtered.filter(territory => {
        if (filters.routeType === "route-created") {
          return territory.source_route_id !== null;
        } else {
          return territory.source_route_id === null;
        }
      });
    }

    // Date range filter
    if (filters.dateRange !== "all" && territories.length > 0) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(territory => {
        if (!territory.claimed_at) return false;
        return new Date(territory.claimed_at) >= filterDate;
      });
    }

    // Claiming method filter
    if (filters.claimingMethod !== "all") {
      filtered = filtered.filter(territory => {
        // This would depend on how claiming method is stored in territory data
        // For now, assume route_completion if source_route_id exists
        const method = territory.source_route_id ? "route_completion" : "manual";
        return method === filters.claimingMethod;
      });
    }

    // Auto-claimed only filter
    if (filters.autoClaimedOnly) {
      filtered = filtered.filter(territory => territory.auto_claimed === true);
    }

    // Specific route filter
    if (filters.specificRouteId) {
      filtered = filtered.filter(territory => territory.source_route_id === filters.specificRouteId);
    }

    return filtered;
  }, [territories, filters]);

  // Calculate filter stats
  const filterStats = useMemo((): RouteFilterStats => {
    const routeCreated = filteredTerritories.filter(t => t.source_route_id !== null).length;
    const autoClaimedCount = filteredTerritories.filter(t => t.auto_claimed === true).length;
    const uniqueRoutes = new Set(
      filteredTerritories
        .filter(t => t.source_route_id)
        .map(t => t.source_route_id)
    ).size;

    return {
      totalFiltered: filteredTerritories.length,
      routeCreated,
      manualClaimed: filteredTerritories.length - routeCreated,
      autoClaimedCount,
      uniqueRoutes
    };
  }, [filteredTerritories]);

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<RouteFilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(filteredTerritories, updatedFilters);
  };

  // Reset all filters
  const resetFilters = () => {
    const defaultFilters: RouteFilterOptions = {
      searchTerm: "",
      routeType: "all",
      dateRange: "all",
      groupBy: "none",
      claimingMethod: "all",
      autoClaimedOnly: false
    };
    setFilters(defaultFilters);
    onFilterChange(territories, defaultFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm !== "" ||
           filters.routeType !== "all" ||
           filters.dateRange !== "all" ||
           filters.claimingMethod !== "all" ||
           filters.autoClaimedOnly ||
           filters.specificRouteId;
  }, [filters]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Territory Filters
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filterStats.totalFiltered} / {territories.length}
            </Badge>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 px-2"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search territories, owners, or IDs..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-10"
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => updateFilters({ searchTerm: "" })}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Route type filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Select value={filters.routeType} onValueChange={(value) => updateFilters({ routeType: value as any })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="route-created">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Route Created
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Other Methods
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <Select value={filters.dateRange} onValueChange={(value) => updateFilters({ dateRange: value as any })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Today
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    This Week
                  </div>
                </SelectItem>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    This Month
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Claiming method filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Method</label>
            <Select value={filters.claimingMethod} onValueChange={(value) => updateFilters({ claimingMethod: value as any })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="route_completion">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Route Completion
                  </div>
                </SelectItem>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Manual Claim
                  </div>
                </SelectItem>
                <SelectItem value="auto">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Auto Claim
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group by filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Group By</label>
            <Select value={filters.groupBy} onValueChange={(value) => updateFilters({ groupBy: value as any })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    By Date
                  </div>
                </SelectItem>
                <SelectItem value="route">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    By Route
                  </div>
                </SelectItem>
                <SelectItem value="status">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    By Status
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggle filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.autoClaimedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ autoClaimedOnly: !filters.autoClaimedOnly })}
            className="h-7 text-xs"
          >
            <Shield className="w-3 h-3 mr-1" />
            Auto-claimed Only
          </Button>
        </div>

        {/* Filter stats */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-primary">
                {filterStats.totalFiltered}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {filterStats.routeCreated}
              </div>
              <div className="text-xs text-muted-foreground">Route Created</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {filterStats.autoClaimedCount}
              </div>
              <div className="text-xs text-muted-foreground">Auto-claimed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {filterStats.uniqueRoutes}
              </div>
              <div className="text-xs text-muted-foreground">Unique Routes</div>
            </div>
          </div>
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {filters.searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {filters.searchTerm}
                </Badge>
              )}
              {filters.routeType !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Source: {filters.routeType}
                </Badge>
              )}
              {filters.dateRange !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Date: {filters.dateRange}
                </Badge>
              )}
              {filters.claimingMethod !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Method: {filters.claimingMethod}
                </Badge>
              )}
              {filters.autoClaimedOnly && (
                <Badge variant="secondary" className="text-xs">
                  Auto-claimed Only
                </Badge>
              )}
              {filters.specificRouteId && (
                <Badge variant="secondary" className="text-xs">
                  Route: {filters.specificRouteId.slice(0, 8)}...
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteTerritoryFilter;