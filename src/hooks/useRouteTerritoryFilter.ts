import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import { Territory } from "@/types/territory";

export interface RouteFilterOptions {
  searchTerm: string;
  routeType: "all" | "route-created" | "other";
  dateRange: "all" | "today" | "week" | "month";
  groupBy: "none" | "date" | "route" | "status";
  claimingMethod: "all" | "route_completion" | "manual" | "auto";
  autoClaimedOnly: boolean;
  specificRouteId?: string;
  ownerFilter?: string;
}

export interface RouteFilterStats {
  totalFiltered: number;
  routeCreated: number;
  manualClaimed: number;
  autoClaimedCount: number;
  uniqueRoutes: number;
  routesByDate: Record<string, number>;
}

export interface GroupedTerritories {
  [groupName: string]: Territory[];
}

export function useRouteTerritoryFilter(
  territories: Territory[],
  initialFilters: Partial<RouteFilterOptions> = {}
) {
  const [filters, setFilters] = useState<RouteFilterOptions>({
    searchTerm: "",
    routeType: "all",
    dateRange: "all",
    groupBy: "none",
    claimingMethod: "all",
    autoClaimedOnly: false,
    ...initialFilters
  });

  // Fetch route-created territories from backend when needed
  const { data: routeCreatedData, isLoading: isLoadingRouteCreated } = useQuery({
    queryKey: ["routeCreatedTerritories", filters.claimingMethod, filters.autoClaimedOnly, filters.specificRouteId, filters.ownerFilter],
    queryFn: () => GatewayAPI.getRouteCreatedTerritories({
      claiming_method: filters.claimingMethod !== "all" ? filters.claimingMethod : undefined,
      auto_claimed: filters.autoClaimedOnly || undefined,
      source_route_id: filters.specificRouteId,
      owner_id: filters.ownerFilter,
      limit: 1000
    }),
    enabled: filters.routeType === "route-created" || filters.claimingMethod !== "all" || filters.autoClaimedOnly || !!filters.specificRouteId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Get enhanced territories data (combine local and API data)
  const enhancedTerritories = useMemo(() => {
    if (filters.routeType === "route-created" && routeCreatedData?.ok) {
      // Use API data for route-created territories
      return (routeCreatedData.data as any)?.territories || [];
    }
    return territories;
  }, [territories, routeCreatedData, filters.routeType]);

  // Calculate filter statistics
  const filterStats = useMemo((): RouteFilterStats => {
    const routeCreated = enhancedTerritories.filter(t => 
      t.source_route_id || t.claiming_method === 'route_completion'
    ).length;
    
    const manualClaimed = enhancedTerritories.filter(t => 
      t.claiming_method === 'manual' || (!t.source_route_id && t.claiming_method !== 'route_completion')
    ).length;
    
    const autoClaimedCount = enhancedTerritories.filter(t => t.auto_claimed === true).length;
    
    const uniqueRoutes = new Set(
      enhancedTerritories
        .filter(t => t.source_route_id)
        .map(t => t.source_route_id)
    ).size;

    // Group by date for statistics
    const routesByDate: Record<string, number> = {};
    enhancedTerritories.forEach(t => {
      if (t.source_route_id || t.claiming_method === 'route_completion') {
        const date = new Date(t.claimed_at).toDateString();
        routesByDate[date] = (routesByDate[date] || 0) + 1;
      }
    });

    return {
      totalFiltered: enhancedTerritories.length,
      routeCreated,
      manualClaimed,
      autoClaimedCount,
      uniqueRoutes,
      routesByDate
    };
  }, [enhancedTerritories]);

  // Apply filters to territories
  const filteredTerritories = useMemo(() => {
    let filtered = [...enhancedTerritories];

    // Search filter
    if (filters.searchTerm.trim()) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (t.name && t.name.toLowerCase().includes(search)) ||
        (t.owner_username && t.owner_username.toLowerCase().includes(search)) ||
        (t.source_route?.name && t.source_route.name.toLowerCase().includes(search)) ||
        (t.source_route_id && t.source_route_id.toLowerCase().includes(search)) ||
        t.id.toLowerCase().includes(search)
      );
    }

    // Route type filter
    if (filters.routeType !== "all") {
      if (filters.routeType === "route-created") {
        filtered = filtered.filter(t => 
          t.source_route_id || t.claiming_method === 'route_completion'
        );
      } else if (filters.routeType === "other") {
        filtered = filtered.filter(t => 
          !t.source_route_id && t.claiming_method !== 'route_completion'
        );
      }
    }

    // Claiming method filter
    if (filters.claimingMethod !== "all") {
      filtered = filtered.filter(t => t.claiming_method === filters.claimingMethod);
    }

    // Auto-claimed filter
    if (filters.autoClaimedOnly) {
      filtered = filtered.filter(t => t.auto_claimed === true);
    }

    // Specific route filter
    if (filters.specificRouteId) {
      filtered = filtered.filter(t => t.source_route_id === filters.specificRouteId);
    }

    // Owner filter
    if (filters.ownerFilter) {
      filtered = filtered.filter(t => t.owner_id === filters.ownerFilter);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(t => {
        const claimedDate = new Date(t.claimed_at);
        switch (filters.dateRange) {
          case "today":
            return claimedDate >= today;
          case "week":
            return claimedDate >= weekAgo;
          case "month":
            return claimedDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [enhancedTerritories, filters]);

  // Group territories if grouping is enabled
  const groupedTerritories = useMemo((): GroupedTerritories => {
    if (filters.groupBy === "none") {
      return { "All Territories": filteredTerritories };
    }

    const groups: Record<string, Territory[]> = {};

    filteredTerritories.forEach(territory => {
      let groupKey = "";

      switch (filters.groupBy) {
        case "date":
          const claimedDate = new Date(territory.claimed_at);
          const today = new Date();
          const diffTime = today.getTime() - claimedDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) groupKey = "Today";
          else if (diffDays === 1) groupKey = "Yesterday";
          else if (diffDays <= 7) groupKey = "This Week";
          else if (diffDays <= 30) groupKey = "This Month";
          else groupKey = "Older";
          break;

        case "route":
          if (territory.source_route_id || territory.claiming_method === 'route_completion') {
            groupKey = territory.source_route?.name || 
                      `Route ${territory.source_route_id?.slice(0, 8) || 'Unknown'}`;
          } else {
            groupKey = "Non-Route Territories";
          }
          break;

        case "status":
          groupKey = territory.status.charAt(0).toUpperCase() + territory.status.slice(1);
          break;

        default:
          groupKey = "All Territories";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(territory);
    });

    // Sort groups by size (largest first)
    const sortedGroups: GroupedTerritories = {};
    Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([key, value]) => {
        sortedGroups[key] = value;
      });

    return sortedGroups;
  }, [filteredTerritories, filters.groupBy]);

  // Update filters
  const updateFilter = useCallback((key: keyof RouteFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters: Partial<RouteFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      routeType: "all",
      dateRange: "all",
      groupBy: "none",
      claimingMethod: "all",
      autoClaimedOnly: false,
      specificRouteId: undefined,
      ownerFilter: undefined
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm || 
      filters.routeType !== "all" || 
      filters.dateRange !== "all" || 
      filters.groupBy !== "none" ||
      filters.claimingMethod !== "all" ||
      filters.autoClaimedOnly ||
      filters.specificRouteId ||
      filters.ownerFilter;
  }, [filters]);

  // Get unique routes for filtering options
  const availableRoutes = useMemo(() => {
    const routeMap = new Map();
    enhancedTerritories.forEach(t => {
      if (t.source_route_id && t.source_route) {
        routeMap.set(t.source_route_id, t.source_route);
      }
    });
    return Array.from(routeMap.values());
  }, [enhancedTerritories]);

  return {
    filters,
    filteredTerritories,
    groupedTerritories,
    filterStats,
    availableRoutes,
    hasActiveFilters,
    isLoading: isLoadingRouteCreated,
    updateFilter,
    updateFilters,
    clearAllFilters
  };
}