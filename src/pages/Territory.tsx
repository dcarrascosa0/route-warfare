import React, { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  ZoomControl,
  Circle,
} from "react-leaflet";
// @ts-ignore
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TerritoryDetailsModal } from "@/components/features/territory-management";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  Target as TargetIcon,
  Crown,
  Activity,
  Users,
  Maximize2,
  RefreshCw,
  Shield,
  Swords,
  Calendar,
  BarChart3,
  Eye,
  AlertTriangle,
  Search,
  Route,
  Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { GatewayAPI } from "@/lib/api";
import RouteTerritoryFilter from "@/components/features/territory-management/RouteTerritoryFilter";
import GroupedTerritoryDisplay from "@/components/features/territory-management/GroupedTerritoryDisplay";
import { useRouteTerritoryFilter } from "@/hooks/useRouteTerritoryFilter";

// Fix default Leaflet marker icons for Vite bundling
const DefaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon as any;

// Types
type GeoPoint = { longitude: number; latitude: number };

interface RouteInfo {
  id: string;
  name: string;
  user_id: string;
  completed_at: string;
  distance_meters: number;
  duration_seconds: number;
  coordinate_count: number;
  is_closed: boolean;
}

interface Territory {
  id: string;
  name?: string;
  description?: string;
  owner_id: string;
  owner_username?: string;
  route_id: string;
  source_route_id?: string;
  claiming_method?: string;
  source_route?: RouteInfo;
  status: "claimed" | "contested" | "neutral";
  area_km2: number;
  claimed_at: string;
  last_activity: string;
  boundary_coordinates: GeoPoint[];
  contested_by?: string[];
}

interface UserTerritoryStats {
  total_territories: number;
  total_area_km2: number;
  claimed_territories: number;
  contested_territories: number;
  neutral_territories: number;
}

type TerritoryMapResponse = { territories: Territory[] };

function getTerritoryColor(status: string | undefined, isOwned: boolean = false): string {
  if (isOwned) {
    switch ((status || "").toLowerCase()) {
      case "claimed":
        return "#10b981"; // green for owned claimed
      case "contested":
        return "#f59e0b"; // amber for owned contested
      default:
        return "#10b981"; // default green for owned
    }
  }

  switch ((status || "").toLowerCase()) {
    case "claimed":
      return "#ef4444"; // red for enemy claimed
    case "contested":
      return "#f59e0b"; // amber for contested
    case "neutral":
      return "#6b7280"; // gray for neutral
    default:
      return "#3b82f6"; // blue default
  }
}

function getTerritoryIcon(status: string) {
  switch (status) {
    case "claimed":
      return Shield;
    case "contested":
      return Swords;
    case "neutral":
      return MapPin;
    default:
      return MapPin;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function Panes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("base")) {
      map.createPane("base");
      map.getPane("base")!.style.zIndex = "100";
    }
    if (!map.getPane("tint")) {
      map.createPane("tint");
      map.getPane("tint")!.style.zIndex = "110";
    }
    // Ensure default panes sit above tiles but below UI
    map.getPane("overlayPane")!.style.zIndex = "200";  // polygons
    map.getPane("markerPane")!.style.zIndex = "300";   // markers
    map.getPane("popupPane")!.style.zIndex = "400";    // popups
  }, [map]);
  return null;
}

const ResizeFix = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
  }, [map]);
  return null;
};

// Basemaps (CARTO)
const TILE_DARK_NO_LABELS =
  (import.meta as any)?.env?.VITE_MAP_TILE_URL ??
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
const TILE_DARK_WITH_LABELS =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function TerritoryPage() {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "owned" | "contested" | "route-based" | "neutral">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [routeFilter, setRouteFilter] = useState<"all" | "route-created" | "other">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [groupBy, setGroupBy] = useState<"none" | "date" | "route" | "status">("none");
  const [showRouteFilter, setShowRouteFilter] = useState(false);

  const userId = useMemo(() => localStorage.getItem("user_id"), []);

  // Page title
  useEffect(() => {
    document.title = "Territory Control — Route Wars";
  }, []);

  // Geolocation (with accuracy + follow toggle)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [followMe, setFollowMe] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    if (followMe) {
      // Live tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy || null);
        },
        () => { },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      return () => {
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      };
    } else {
      // One-shot fetch
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy || null);
        },
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }
  }, [followMe]);

  // Map center
  const center: [number, number] | null = coords ? [coords.latitude, coords.longitude] : null;

  // Fetch territories near the user (bbox around position; world until we have GPS)
  const { data: mapData, isFetching, refetch } = useQuery({
    queryKey: ["territories", "map", coords?.latitude, coords?.longitude, viewMode],
    queryFn: async () => {
      if (!coords) {
        return GatewayAPI.territoriesMap({});
      }
      const dLat = 0.2;
      const dLon = 0.2;
      return GatewayAPI.territoriesMap({
        min_latitude: coords.latitude - dLat,
        max_latitude: coords.latitude + dLat,
        min_longitude: coords.longitude - dLon,
        max_longitude: coords.longitude + dLon
      });
    },
  });

  // Fetch user's territories
  const { data: userTerritories } = useQuery({
    queryKey: ["userTerritories", userId],
    queryFn: () => (userId ? GatewayAPI.getUserTerritories(userId) : Promise.resolve({ ok: false } as any)),
    enabled: !!userId,
  });

  // Fetch contested territories
  const { data: contestedTerritories } = useQuery({
    queryKey: ["contestedTerritories"],
    queryFn: () => GatewayAPI.getContestedTerritories(),
  });

  const territoriesFromApi: Territory[] = useMemo(() => {
    return (mapData?.ok && mapData.data && (mapData.data as any).territories) ?
      (mapData.data as any).territories : [];
  }, [mapData]);

  // Route-based territory filtering
  const {
    filters: routeFilters,
    filteredTerritories: routeFilteredTerritories,
    groupedTerritories: routeGroupedTerritories,
    filterStats: routeFilterStats,
    availableRoutes,
    hasActiveFilters: hasActiveRouteFilters,
    isLoading: isLoadingRouteFilter,
    updateFilter: updateRouteFilter,
    clearAllFilters: clearAllRouteFilters
  } = useRouteTerritoryFilter(territoriesFromApi, {
    ownerFilter: viewMode === "owned" ? userId || undefined : undefined
  });

  const userTerritoriesData: Territory[] = useMemo(() => {
    return (userTerritories?.ok && userTerritories.data) ?
      (userTerritories.data as any).territories || [] : [];
  }, [userTerritories]);

  const contestedTerritoriesData: Territory[] = useMemo(() => {
    return (contestedTerritories?.ok && contestedTerritories.data) ?
      (contestedTerritories.data as any).territories || [] : [];
  }, [contestedTerritories]);

  // Calculate user territory stats
  const territoryStats: UserTerritoryStats = useMemo(() => {
    const userOwned = territoriesFromApi.filter(t => t.owner_id === userId);
    return {
      total_territories: userOwned.length,
      total_area_km2: userOwned.reduce((sum, t) => sum + t.area_km2, 0),
      claimed_territories: userOwned.filter(t => t.status === "claimed").length,
      contested_territories: userOwned.filter(t => t.status === "contested").length,
      neutral_territories: userOwned.filter(t => t.status === "neutral").length,
    };
  }, [territoriesFromApi, userId]);

  // Filter territories based on view mode and additional filters
  const filteredTerritories = useMemo(() => {
    // Use route-filtered territories if route filtering is active
    if (showRouteFilter || hasActiveRouteFilters) {
      return routeFilteredTerritories;
    }

    let filtered = territoriesFromApi;

    // Apply view mode filter
    switch (viewMode) {
      case "owned":
        filtered = filtered.filter(t => t.owner_id === userId);
        break;
      case "contested":
        filtered = filtered.filter(t => t.status === "contested");
        break;
      case "route-based":
        filtered = filtered.filter(t => t.source_route_id || t.claiming_method === 'route_completion');
        break;
      case "neutral":
        filtered = filtered.filter(t => t.status === "neutral");
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    // Apply route filter
    if (routeFilter !== "all") {
      if (routeFilter === "route-created") {
        filtered = filtered.filter(t => t.source_route_id || t.claiming_method === 'route_completion');
      } else if (routeFilter === "other") {
        filtered = filtered.filter(t => !t.source_route_id && t.claiming_method !== 'route_completion');
      }
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.name && t.name.toLowerCase().includes(search)) ||
        (t.owner_username && t.owner_username.toLowerCase().includes(search)) ||
        (t.source_route?.name && t.source_route.name.toLowerCase().includes(search)) ||
        t.id.toLowerCase().includes(search)
      );
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(t => {
        const claimedDate = new Date(t.claimed_at);
        switch (dateFilter) {
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
  }, [territoriesFromApi, viewMode, userId, routeFilter, searchTerm, dateFilter, showRouteFilter, hasActiveRouteFilters, routeFilteredTerritories]);

  // Transform simple grouped territories to the expected format
  const transformGroupedTerritories = (simpleGroups: Record<string, Territory[]>) => {
    const transformed: Record<string, { territories: Territory[]; count: number; totalArea: number; metadata?: Record<string, any> }> = {};
    
    Object.entries(simpleGroups).forEach(([key, territories]) => {
      const totalArea = territories.reduce((sum, t) => sum + (t.area_km2 || 0), 0);
      transformed[key] = {
        territories,
        count: territories.length,
        totalArea,
        metadata: {}
      };
    });
    
    return transformed;
  };

  // Group territories if grouping is enabled
  const groupedTerritories = useMemo(() => {
    // Use route-grouped territories if route filtering is active
    if (showRouteFilter || hasActiveRouteFilters) {
      return transformGroupedTerritories(routeGroupedTerritories);
    }

    if (groupBy === "none") {
      return transformGroupedTerritories({ "All Territories": filteredTerritories });
    }

    const groups: Record<string, Territory[]> = {};

    filteredTerritories.forEach(territory => {
      let groupKey = "";

      switch (groupBy) {
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
            groupKey = territory.source_route?.name || `Route ${territory.source_route_id?.slice(0, 8) || 'Unknown'}`;
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

    return transformGroupedTerritories(groups);
  }, [filteredTerritories, groupBy, showRouteFilter, hasActiveRouteFilters, routeGroupedTerritories]);



  // UI handlers
  const handleTerritoryClick = (territory: Territory) => {
    setSelectedTerritory(territory);
    setIsModalOpen(true);
  };

  const handlePlanRoute = () => {
    toast("Route planner opened", { description: "Select your starting point and destination" });
  };

  const handleViewRoute = (routeId: string) => {
    // Navigate to route details page or open route modal
    toast("Route details", { description: `Opening route ${routeId.slice(0, 8)}...` });
    // TODO: Implement route navigation
  };

  // ====== Small helper components that need the map instance ======
  const RecenterButton = () => {
    const map = useMap();
    if (!center) return null;
    return (
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-xl backdrop-blur-md border border-orange-400/30"
        onClick={() => map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.6 })}
        aria-label="Recenter on me"
        title="Recenter on me"
      >
        <TargetIcon className="h-3 w-3 sm:h-5 sm:w-5" />
      </Button>
    );
  };

  const FitToDataButton = () => {
    const map = useMap();
    const bounds = useMemo(() => {
      const b = new L.LatLngBounds([]);
      territoriesFromApi.forEach((t) => {
        const latlngs = (t.boundary_coordinates || []).map((p) => [p.latitude, p.longitude]) as [
          number,
          number
        ][];
        latlngs.forEach((ll) => b.extend(ll as any));
      });
      return b.isValid() ? b : null;
    }, [territoriesFromApi]);
    if (!bounds) return null;
    return (
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-xl backdrop-blur-md border border-orange-400/30"
        onClick={() => map.fitBounds(bounds, { padding: [24, 24] })}
        aria-label="Fit to territories"
        title="Fit to territories"
      >
        <Maximize2 className="h-3 w-3 sm:h-5 sm:w-5" />
      </Button>
    );
  };

  const RefreshButton = () => (
    <Button
      size="icon"
      variant="secondary"
      className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-xl backdrop-blur-md border border-orange-400/30"
      onClick={() => refetch()}
      aria-label="Refresh"
      title="Refresh"
    >
      <RefreshCw className={`h-3 w-3 sm:h-5 sm:w-5 ${isFetching ? "animate-spin" : ""}`} />
    </Button>
  );

  // Basemap toggle (labels vs. no-labels + orange tint)
  // Labels are always on; keep a dedicated no-label overlay for orange tint

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Territory Control</h1>
              <p className="text-xl text-muted-foreground">Monitor your zones, track enemy movements, and plan your next conquest.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Territories" },
                { key: "owned", label: "Owned" },
                { key: "contested", label: "Contested" },
                { key: "route-based", label: "Route-Based" },
                { key: "neutral", label: "Neutral" }
              ].map((mode) => (
                <Button
                  key={mode.key}
                  variant={viewMode === mode.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode.key as any)}
                  className="capitalize"
                >
                  {mode.label}
                </Button>
              ))}
              <Button
                variant={showRouteFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setShowRouteFilter(!showRouteFilter)}
                className="ml-2"
              >
                <Route className="w-4 h-4 mr-1" />
                Route Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search territories, owners, routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Route Filter */}
            <div className="flex gap-2">
              <Filter className="w-4 h-4 text-muted-foreground mt-2" />
              <div className="flex gap-1">
                {[
                  { key: "all", label: "All Types" },
                  { key: "route-created", label: "Route-Created" },
                  { key: "other", label: "Other" }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={routeFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRouteFilter(filter.key as any)}
                    className="text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-2" />
              <div className="flex gap-1">
                {[
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "week", label: "Week" },
                  { key: "month", label: "Month" }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={dateFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter(filter.key as any)}
                    className="text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grouping */}
            <div className="flex gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground mt-2" />
              <div className="flex gap-1">
                {[
                  { key: "none", label: "No Grouping" },
                  { key: "date", label: "By Date" },
                  { key: "route", label: "By Route" },
                  { key: "status", label: "By Status" }
                ].map((group) => (
                  <Button
                    key={group.key}
                    variant={groupBy === group.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGroupBy(group.key as any)}
                    className="text-xs"
                  >
                    {group.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Route-Based Territory Filtering */}
          {showRouteFilter && (
            <RouteTerritoryFilter
              territories={territoriesFromApi}
              onFilterChange={(filtered, filters) => {
                // The hook handles the filtering automatically
              }}
              initialFilters={{}}
            />
          )}

          {/* Filter Summary */}
          {(searchTerm || routeFilter !== "all" || dateFilter !== "all" || viewMode !== "all" || groupBy !== "none") && (
            <div className="mb-4 p-3 bg-card/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Active Filters:</span>
                  <div className="flex gap-2">
                    {viewMode !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        View: {viewMode}
                      </Badge>
                    )}
                    {routeFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {routeFilter}
                      </Badge>
                    )}
                    {dateFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Date: {dateFilter}
                      </Badge>
                    )}
                    {searchTerm && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {groupBy !== "none" && (
                      <Badge variant="secondary" className="text-xs">
                        Group: {groupBy}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredTerritories.length} result{filteredTerritories.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setRouteFilter("all");
                      setDateFilter("all");
                      setViewMode("all");
                      setGroupBy("none");
                    }}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Territory Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card/80 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-territory-claimed">{territoryStats.total_territories}</div>
                <div className="text-sm text-muted-foreground">Your Territories</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{territoryStats.total_area_km2.toFixed(1)} km²</div>
                <div className="text-sm text-muted-foreground">Total Area</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-territory-contested">{territoryStats.contested_territories}</div>
                <div className="text-sm text-muted-foreground">Contested</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{filteredTerritories.length}</div>
                <div className="text-sm text-muted-foreground">Visible</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Map column */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-map border-border/50 shadow-glow">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <MapPin className="w-5 h-5 text-primary" />
                    Live Territory Map
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className="bg-territory-claimed/20 text-territory-claimed border-territory-claimed/30 text-xs sm:text-sm">
                      Your Zones: {territoryStats.total_territories}
                    </Badge>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs sm:text-sm">
                      {territoryStats.total_area_km2.toFixed(1)} km²
                    </Badge>
                    <Badge variant="outline" className="border-muted/30 text-xs sm:text-sm">
                      {followMe ? "Live GPS" : "GPS Paused"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="aspect-[4/3] sm:aspect-[16/10] bg-background/20 relative overflow-hidden rounded-b-lg min-h-[300px] sm:min-h-[420px] isolate">
                  {center ? (
                    <MapContainer
                      center={center}
                      zoom={13}
                      className="absolute inset-0 rw-map z-0"
                      style={{ height: "100%", width: "100%" }}
                      attributionControl={false}
                      zoomControl={false}
                    >
                      <ResizeFix />
                      {/* Define custom panes for explicit stacking */}
                      <Panes />
                      <ZoomControl position="topleft" />

                      {/* Basemap with labels */}
                      <TileLayer url={TILE_DARK_WITH_LABELS} zIndex={100} pane="base" />
                      {/* Orange-tinted overlay to color streets */}
                      <TileLayer url={TILE_DARK_NO_LABELS} className="tw-road-tint" opacity={0.5} zIndex={110} pane="tint" />

                      {/* User marker & accuracy circle */}
                      <Marker position={center}>
                        <Popup>You are here</Popup>
                      </Marker>
                      {accuracy && accuracy < 1000 && (
                        <Circle center={center} radius={Math.max(accuracy, 20)} pathOptions={{ color: "#fb923c", fillColor: "#fb923c", fillOpacity: 0.08, weight: 1 }} />
                      )}

                      {/* Territories */}
                      {filteredTerritories.map((t) => {
                        const latlngs = (t.boundary_coordinates || []).map((p) => [p.latitude, p.longitude]) as [number, number][];
                        if (!latlngs.length) return null;
                        const isOwned = t.owner_id === userId;
                        const color = getTerritoryColor(t.status, isOwned);
                        const IconComponent = getTerritoryIcon(t.status);

                        return (
                          <Polygon
                            key={t.id}
                            positions={latlngs}
                            pathOptions={{
                              color,
                              weight: isOwned ? 3 : 2,
                              fillColor: color,
                              fillOpacity: isOwned ? 0.35 : 0.25,
                              dashArray: t.status === "contested" ? "5, 5" : undefined
                            }}
                            eventHandlers={{
                              click: () => handleTerritoryClick(t),
                              mouseover: (e) => (e.target as any).setStyle({ weight: isOwned ? 4 : 3, fillOpacity: isOwned ? 0.45 : 0.35 }),
                              mouseout: (e) => (e.target as any).setStyle({ weight: isOwned ? 3 : 2, fillOpacity: isOwned ? 0.35 : 0.25 }),
                            }}
                          >
                            <Popup>
                              <div className="text-sm min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                  <IconComponent className="w-4 h-4" style={{ color }} />
                                  <div className="font-semibold">{t.name || `Territory ${t.id.slice(0, 8)}`}</div>
                                </div>
                                <div className="space-y-1">
                                  <div>Owner: <span className="font-medium">{isOwned ? "You" : t.owner_username || "Unknown"}</span></div>
                                  <div>Status: <span className="font-medium capitalize" style={{ color }}>{t.status}</span></div>
                                  <div>Area: <span className="font-medium">{t.area_km2.toFixed(2)} km²</span></div>
                                  <div>Claimed: <span className="font-medium">{formatDate(t.claimed_at)}</span></div>
                                  {t.status === "contested" && t.contested_by && (
                                    <div>Contested by: <span className="font-medium">{t.contested_by.length} players</span></div>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTerritoryClick(t);
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </Popup>
                          </Polygon>
                        );
                      })}

                      {/* Floating control cluster */}
                      <div className="rw-map-controls absolute bottom-3 sm:bottom-6 left-3 sm:left-6 flex flex-col gap-2 sm:gap-3 z-[600] pointer-events-auto">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-500/90 to-primary/90 hover:from-orange-400 hover:to-primary shadow-xl backdrop-blur-md border border-orange-400/30 text-xs sm:text-sm px-2 sm:px-3"
                          onClick={handlePlanRoute}
                        >
                          <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Plan Route</span>
                          <span className="xs:hidden">Route</span>
                        </Button>
                        <div className="flex gap-1 sm:gap-2">
                          <RecenterButton />
                          <FitToDataButton />
                          <RefreshButton />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-background/95 border-orange-400/40 shadow-xl backdrop-blur-md hover:bg-orange-50/10 hover:border-orange-400/60 text-xs sm:text-sm px-2 sm:px-3"
                          onClick={() => setFollowMe((v) => !v)}
                        >
                          <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">{followMe ? "Pause Live" : "Live View"}</span>
                          <span className="xs:hidden">{followMe ? "Pause" : "Live"}</span>
                        </Button>
                      </div>

                      {/* Legend moved out to sit above overlays */}

                      {/* Status badges */}
                      <div className="rw-map-controls absolute top-3 sm:top-6 right-3 sm:right-6 z-[600] flex flex-col sm:flex-row items-end sm:items-center gap-2 pointer-events-auto">
                        <Badge className="bg-gradient-to-r from-territory-claimed/95 to-orange-500/80 text-white shadow-xl backdrop-blur-md border border-orange-400/50 text-xs sm:text-sm">
                          <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${coords ? "bg-orange-300 animate-pulse" : "bg-zinc-400"}`} />
                          <span className="hidden xs:inline">{coords ? "GPS ACTIVE" : "SEARCHING..."}</span>
                          <span className="xs:hidden">{coords ? "GPS" : "..."}</span>
                        </Badge>
                        {isFetching && (
                          <Badge variant="outline" className="border-orange-400/50 text-orange-300 animate-pulse text-xs sm:text-sm">
                            <span className="hidden sm:inline">Updating…</span>
                            <span className="sm:hidden">•••</span>
                          </Badge>
                        )}
                      </div>
                    </MapContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      Locating your position…
                    </div>
                  )}

                  {/* Empty state overlay when no territories */}
                  {center && filteredTerritories.length === 0 && !isFetching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[400]">
                      <div className="text-center p-6">
                        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="font-semibold mb-2">No Territories Found</h3>
                        <p className="text-sm text-muted-foreground">
                          Complete closed-loop routes to claim your first territory!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Softer cinematic overlays (dialed-back for clarity) */}
                  <div className="rw-map-ui absolute inset-0 pointer-events-none z-[500]">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/6 via-transparent to-primary/10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-300/4 via-transparent to-orange-500/8" />
                    <div
                      className="absolute inset-0 opacity-15"
                      style={{
                        backgroundImage: `linear-gradient(rgba(255,165,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,165,0,0.06) 1px, transparent 1px)`,
                        backgroundSize: "50px 50px",
                      }}
                    />
                    <div className="absolute inset-0 border border-orange-400/20 rounded-b-lg shadow-[inset_0_0_20px_rgba(255,165,0,0.08)]" />
                  </div>

                  {/* Legend above overlays */}
                  <div className="rw-map-controls absolute bottom-3 sm:bottom-6 right-3 sm:right-6 z-[600] pointer-events-auto rounded-lg border border-white/10 bg-black/40 backdrop-blur-md p-2 sm:p-3 text-xs text-foreground/90 shadow-lg">
                    <div className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">Legend</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#fb5a2c" }} />
                        <span className="text-xs">Claimed</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#fbbf24" }} />
                        <span className="text-xs">Contested</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#22d3ee" }} />
                        <span className="text-xs">Neutral</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Territory Details */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="w-5 h-5 text-territory-claimed" />
                  Your Empire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Zones</span>
                  <span className="text-2xl font-bold text-territory-claimed">{territoryStats.total_territories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Area</span>
                  <span className="text-2xl font-bold text-primary">{territoryStats.total_area_km2.toFixed(1)} km²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Claimed</span>
                  <span className="text-lg font-bold text-territory-claimed">{territoryStats.claimed_territories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Contested</span>
                  <span className="text-lg font-bold text-territory-contested">{territoryStats.contested_territories}</span>
                </div>
                <div className="pt-2">
                  <Button
                    className="w-full bg-gradient-hero hover:shadow-glow"
                    onClick={() => toast("Start a new route to expand your territory!", { description: "Complete closed-loop routes to claim new areas" })}
                  >
                    Expand Territory
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Route-Based Territory Display */}
            {(showRouteFilter || hasActiveRouteFilters) && (
              <Card className="bg-card/80 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Route className="w-5 h-5 text-primary" />
                    Filtered Territories
                    {isLoadingRouteFilter && (
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <GroupedTerritoryDisplay
                      groupedTerritories={transformGroupedTerritories(routeGroupedTerritories)}
                      onTerritoryClick={handleTerritoryClick}
                      onViewRoute={handleViewRoute}
                      currentUserId={userId || undefined}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Territories */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-territory-contested" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userTerritoriesData.slice(0, 3).map((territory) => (
                  <div key={territory.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {React.createElement(getTerritoryIcon(territory.status), {
                        className: "w-4 h-4",
                        style: { color: getTerritoryColor(territory.status, true) }
                      })}
                      <div>
                        <div className="text-sm font-medium">{territory.name || `Territory ${territory.id.slice(0, 8)}`}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(territory.claimed_at)}</div>
                      </div>
                    </div>
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: `${getTerritoryColor(territory.status, true)}20`,
                        color: getTerritoryColor(territory.status, true)
                      }}
                    >
                      {territory.area_km2.toFixed(1)} km²
                    </Badge>
                  </div>
                ))}
                {userTerritoriesData.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No territories yet. Complete a closed-loop route to claim your first territory!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nearby Territories */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-destructive" />
                  Nearby Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTerritories
                  .filter(t => t.owner_id !== userId)
                  .slice(0, 5)
                  .map((territory) => (
                    <div key={territory.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {React.createElement(getTerritoryIcon(territory.status), {
                          className: "w-4 h-4",
                          style: { color: getTerritoryColor(territory.status, false) }
                        })}
                        <div>
                          <div className="text-sm font-medium">{territory.owner_username || "Unknown Player"}</div>
                          <div className="text-xs text-muted-foreground capitalize">{territory.status}</div>
                        </div>
                      </div>
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: `${getTerritoryColor(territory.status, false)}20`,
                          color: getTerritoryColor(territory.status, false)
                        }}
                      >
                        {territory.area_km2.toFixed(1)} km²
                      </Badge>
                    </div>
                  ))}
                {filteredTerritories.filter(t => t.owner_id !== userId).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No nearby enemy territories found.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contested Territories Alert */}
            {territoryStats.contested_territories > 0 && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Territory Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-destructive mb-3">
                    You have {territoryStats.contested_territories} contested territories that need your attention!
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setViewMode("contested")}
                  >
                    View Contested Zones
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <TerritoryDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        territory={selectedTerritory}
        onNavigateToRoutes={() => {
          // Navigate to routes page - this would typically use React Router
          window.location.href = '/routes';
        }}
        onNavigateToRoute={(routeId: string) => {
          // Navigate to routes page with specific route selected
          // Store the route ID in localStorage for the Routes page to pick up
          localStorage.setItem('selectedRouteId', routeId);
          window.location.href = '/routes';
        }}
      />
    </div>
  );
}
