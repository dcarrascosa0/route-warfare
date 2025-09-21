import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import {
  MapPin,
  Clock,
  Ruler,
  Target,
  CheckCircle,
  XCircle,
  Circle,
  Eye,
  Filter,
  Search,
  ChevronRight,
  Play,
  Square
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useResponsive } from '@/hooks/useResponsive';
import { useTouchGestures } from '@/hooks/useTouchGestures';

export interface Route {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  distance: number;
  duration?: number;
  status: 'active' | 'completed' | 'abandoned';
  is_closed: boolean;
  territory_area?: number;
  coordinate_count: number;
  created_at: string;
  updated_at: string;
  territory_claim_result?: {
    success: boolean;
    territory_id?: string;
    area_sqm: number;
    conflicts_resolved: number;
    ownership_transfers: string[];
    error_message?: string;
  };
}

interface MobileRouteManagementProps {
  routes: Route[];
  loading?: boolean;
  onRouteClick?: (route: Route) => void;
  onViewRoute?: (route: Route) => void;
  className?: string;
}

type FilterType = 'all' | 'active' | 'completed' | 'abandoned';
type SortType = 'newest' | 'oldest' | 'distance' | 'duration';

export default function MobileRouteManagement({
  routes,
  loading = false,
  onRouteClick,
  onViewRoute,
  className = ""
}: MobileRouteManagementProps) {
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Format utilities
  const formatDuration = useCallback((seconds?: number): string => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters.toFixed(0)} m`;
  }, []);

  // Filter and sort routes
  const filteredAndSortedRoutes = useMemo(() => {
    let filtered = routes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(route =>
        (route.name?.toLowerCase().includes(query)) ||
        route.id.toLowerCase().includes(query) ||
        route.status.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(route => route.status === filter);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });
  }, [routes, searchQuery, filter, sort]);

  // Status badge component
  const StatusBadge = ({ route }: { route: Route }) => {
    const getStatusConfig = () => {
      switch (route.status) {
        case 'active':
          return {
            icon: Circle,
            label: 'Active',
            className: 'bg-blue-500 text-white border-blue-600'
          };
        case 'completed':
          if (route.territory_claim_result?.success) {
            return {
              icon: CheckCircle,
              label: 'Territory Claimed',
              className: 'bg-green-500 text-white border-green-600'
            };
          }
          return {
            icon: CheckCircle,
            label: 'Completed',
            className: 'bg-gray-500 text-white border-gray-600'
          };
        case 'abandoned':
          return {
            icon: XCircle,
            label: 'Abandoned',
            className: 'bg-red-500 text-white border-red-600'
          };
        default:
          return {
            icon: Circle,
            label: 'Unknown',
            className: 'bg-gray-400 text-white border-gray-500'
          };
      }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} text-xs font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Route card component
  const RouteCard = ({ route }: { route: Route }) => {
    const handleCardClick = () => {
      if (onRouteClick) {
        onRouteClick(route);
      }
    };

    return (
      <Card
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">
                {route.name || `Route ${route.id.slice(0, 8)}`}
              </h3>
              <StatusBadge route={route} />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Route Stats */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Ruler className="w-4 h-4 text-primary" />
              </div>
              <div className="text-sm font-medium">{formatDistance(route.distance)}</div>
              <div className="text-xs text-muted-foreground">Distance</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{formatDuration(route.duration)}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{route.coordinate_count}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>

          {/* Territory Info */}
          {route.territory_claim_result && (
            <div className="flex items-center gap-2 text-xs">
              {route.territory_claim_result.success ? (
                <>
                  <Target className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">
                    Territory: {(route.territory_claim_result.area_sqm / 1000000).toFixed(3)} km²
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-600">Territory claim failed</span>
                </>
              )}
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-muted-foreground mt-2">
            {format(new Date(route.created_at), 'MMM d, yyyy HH:mm')}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search and Filter Header */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'completed', 'abandoned'] as FilterType[]).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="text-xs"
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {filteredAndSortedRoutes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No routes match your search' : 'No routes found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))
        )}
      </div>

      {/* Summary */}
      {filteredAndSortedRoutes.length > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing {filteredAndSortedRoutes.length} of {routes.length} routes
        </div>
      )}
    </div>
  );
}