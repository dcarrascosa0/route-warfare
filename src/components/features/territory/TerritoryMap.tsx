import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { MapControls } from "@/components/common/MapControls";
import { MapLegend } from "@/components/common/MapLegend";
import { TerritoryHoverCard } from "@/components/common/TerritoryHoverCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, User, Calendar, Ruler, AlertTriangle, Eye, Target } from "lucide-react";
import { UnitsFormatter } from "@/lib/format/units";
import ZoneDrawer, { ZoneData } from "@/components/common/ZoneDrawer";
import { cn } from "@/lib/utils";
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys, invalidateQueries } from "@/lib/query";
import MapResizeFix from "@/components/features/route-tracking/components/MapResizeFix";
import "leaflet/dist/leaflet.css";
import "./TerritoryMap.css";
import { EmptyState } from "@/components/common/EmptyState";

// Mock territory data structure - will be replaced with real API data
interface Territory {
    id: string;
    name: string;
    owner_id: string;
    owner_name: string;
    boundary_coordinates: Array<{ latitude: number; longitude: number }>;
    boundary_rings?: Array<Array<{ latitude: number; longitude: number }>>;
    area_square_meters: number;
    claimed_at: string;
    // no contested state
    is_mine: boolean;
}

interface TerritoryMapProps {
    territories?: Territory[];
    selectedTerritoryId?: string;
    onTerritorySelect?: (territory: Territory) => void;
    showOwnershipIndicators?: boolean;
    filterBy?: string;
    searchTerm?: string;
    className?: string;
}

// Enhanced territory styling with glass morphism and futuristic colors
const getTerritoryStyle = (territory: Territory, isSelected: boolean, isHovered: boolean = false) => {
    const baseStyle = {
        weight: isSelected ? 4 : isHovered ? 3 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.4 : isHovered ? 0.35 : 0.25,
        dashArray: undefined as string | undefined,
        className: 'territory-polygon'
    };

    // exclusive ownership only
    
    if (territory.is_mine) {
        // User's territories - glowing orange with glass effect
        return {
            ...baseStyle,
            color: "#f97316", // Primary orange
            fillColor: "#f97316",
            fillOpacity: isSelected ? 0.45 : isHovered ? 0.4 : 0.3,
            className: 'territory-polygon territory-owned animate-territory-glow'
        };
    }
    
    // Other territories - cyan/blue with subtle glow
    return {
        ...baseStyle,
        color: "#06b6d4", // Cyan for neutral territories
        fillColor: "#06b6d4",
        fillOpacity: isSelected ? 0.35 : isHovered ? 0.3 : 0.2,
        className: 'territory-polygon territory-neutral'
    };
};

// Component to fit map bounds to territories
const FitBounds = ({ territories }: { territories: Territory[] }) => {
    const map = useMap();

    useEffect(() => {
        if (territories.length === 0) return;

        const bounds = new LatLngBounds([]);
        territories.forEach(territory => {
            if (territory.boundary_coordinates) {
                territory.boundary_coordinates.forEach(coord => {
                    bounds.extend(new LatLng(coord.latitude, coord.longitude));
                });
            }
        });

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [territories, map]);

    return null;
};

// Territory detail modal component
const TerritoryDetailModal = ({ territory, isOpen, onClose }: {
    territory: Territory;
    isOpen: boolean;
    onClose: () => void;
}) => {
    const formatArea = (areaSquareMeters: number) => UnitsFormatter.areaSquareMeters(areaSquareMeters);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Territory Status */}
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={territory.is_mine ? "default" : "secondary"}
                            className={cn()}
                        >
                            {territory.is_mine ? "Your Territory" : "Claimed"}
                        </Badge>
                    </div>

                    {/* Territory Details */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Owner:</span>
                            <span className="font-medium">{territory.owner_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Area:</span>
                            <span className="font-medium">{formatArea(territory.area_square_meters)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Claimed:</span>
                            <span className="font-medium">{formatDate(territory.claimed_at)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export const TerritoryMap = ({
    territories = [],
    selectedTerritoryId,
    onTerritorySelect,
    showOwnershipIndicators = true,
    filterBy = "all",
    searchTerm = "",
    className
}: TerritoryMapProps) => {
    const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [realtimeTerritories, setRealtimeTerritories] = useState<Territory[]>(territories);
    const [mapRefreshKey, setMapRefreshKey] = useState(0);
    const [hoveredTerritoryId, setHoveredTerritoryId] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(false);



    // WebSocket integration for real-time territory map updates
    const handleTerritoryMapUpdate = useCallback((data: any) => {
        if (data.requires_refresh) {
            // Trigger map refresh by updating key
            setMapRefreshKey(prev => prev + 1);
        }
        if (data.affected_area) {
            // Could implement more granular updates based on affected area
            console.log('Territory map update in area:', data.affected_area);
        }
    }, []);

    useGlobalTerritoryWebSocket({
        onTerritoryMapUpdate: handleTerritoryMapUpdate,
    });

    // Also listen on notifications WS for territory_claimed to invalidate caches immediately
    const queryClient = useQueryClient();
    const { onMessage } = useWebSocketManager({ autoConnect: true });
    useEffect(() => {
        const off = onMessage('territory_claimed', (msg) => {
            const userId = (msg.data && msg.data.user_id) as string | undefined;
            invalidateQueries.territories(queryClient, userId);
        });
        return () => { off?.(); };
    }, [onMessage, queryClient]);

    // Update local territories when prop changes
    useEffect(() => {
        setRealtimeTerritories(territories);
    }, [territories]);

    // Use real-time territories
    const activeTerritories = realtimeTerritories;

    // Filter territories based on search and filter criteria
    const filteredTerritories = activeTerritories.filter(territory => {
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                territory.name?.toLowerCase().includes(searchLower) ||
                territory.owner_name.toLowerCase().includes(searchLower) ||
                territory.id.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Category filter
        switch (filterBy) {
            case "mine":
                return territory.is_mine;
            case "contested":
                return false;
            case "nearby":
                // TODO: Implement nearby logic based on user location
                return true;
            case "all":
            default:
                return true;
        }
    });



    const handleTerritoryClick = (territory: Territory) => {
        setSelectedTerritory(territory);
        onTerritorySelect?.(territory);
        setDrawerOpen(true);
    };

    const handleTerritoryDoubleClick = (territory: Territory) => {
        setSelectedTerritory(territory);
        setIsDetailModalOpen(true);
    };

    // Default center (will be overridden by FitBounds if territories exist)
    const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City
    const defaultZoom = 13;

    // Determine if we should show the empty state overlay
    const showEmptyState = filteredTerritories.length === 0;

    return (
        <div className={cn("relative h-full w-full territory-map-container", className)}>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                className="h-full w-full rounded-lg rw-map"
                zoomControl={true}
                scrollWheelZoom={true}
                key={mapRefreshKey} // Force re-render when needed
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    className="tw-road-tint"
                />
                <MapResizeFix />

                {/* Fit bounds to territories only if we have territories */}
                {filteredTerritories.length > 0 && (
                    <FitBounds territories={filteredTerritories} />
                )}

                {/* Render enhanced territory polygons */}
                {filteredTerritories.map(territory => {
                    const isSelected = territory.id === selectedTerritoryId || territory.id === selectedTerritory?.id;
                    const isHovered = hoveredTerritoryId === territory.id;
                    const positionsSingle = (territory.boundary_coordinates || []).map(coord => [coord.latitude, coord.longitude] as [number, number]);
                    const positionsWithHoles = (territory.boundary_rings || []).map(ring => ring.map(coord => [coord.latitude, coord.longitude] as [number, number]));

                    // Skip territories with invalid coordinates
                    const invalid = positionsWithHoles.length > 0
                        ? positionsWithHoles[0].length < 3
                        : positionsSingle.length < 3;
                    if (invalid) {
                        console.warn(`Territory ${territory.id} (${territory.name}) has insufficient coordinates:`, {
                            positionsLength: positionsSingle.length,
                            boundaryCoordinatesLength: territory.boundary_coordinates?.length || 0,
                            sampleCoordinates: territory.boundary_coordinates?.slice(0, 2)
                        });
                        return null;
                    }

                    const territoryStyle = getTerritoryStyle(territory, isSelected, isHovered);

                    return (
                        <Polygon
                            key={territory.id}
                            positions={(positionsWithHoles.length > 0 ? positionsWithHoles : positionsSingle) as any}
                            pathOptions={territoryStyle}
                            eventHandlers={{
                                click: () => handleTerritoryClick(territory),
                                dblclick: () => handleTerritoryDoubleClick(territory),
                                mouseover: () => setHoveredTerritoryId(territory.id),
                                mouseout: () => setHoveredTerritoryId(null)
                            }}
                        >
                            <Popup className="territory-popup"><TerritoryHoverCard territory={{
                                id: territory.id,
                                name: territory.name,
                                owner_name: territory.owner_name,
                                area_square_meters: territory.area_square_meters,
                                
                            }} onViewDetails={() => handleTerritoryDoubleClick(territory)} /></Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>

            {/* Enhanced Territory Legend */}
            {showOwnershipIndicators && !showEmptyState && (
                <div className="absolute top-4 right-4 z-[1000]"><MapLegend /></div>
            )}

            {/* Enhanced empty state overlay */}
            {showEmptyState && (
                <div className="absolute inset-0 flex items-center justify-center z-[500] p-6">
                    <EmptyState
                        Icon={MapPin}
                        title={activeTerritories.length === 0 ? "No Territories Claimed" : "No Matching Territories"}
                        message={activeTerritories.length === 0
                            ? "Start tracking routes and complete them to claim your first territory. Each completed route can become a valuable piece of your empire."
                            : "Adjust your search terms or filters to discover territories that match your criteria."}
                    />
                </div>
            )}

            {/* Shared Map Controls */}
            <MapControls onFit={() => setMapRefreshKey(prev => prev + 1)} onToggleGrid={() => setShowGrid(v => !v)} />

            {/* Zone Drawer (right-side) */}
            <ZoneDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                zone={selectedTerritory ? {
                    id: selectedTerritory.id,
                    name: selectedTerritory.name,
                    owner_name: selectedTerritory.owner_name,
                    area_square_meters: selectedTerritory.area_square_meters,
                    
                } as ZoneData : null}
                onViewDetails={() => setIsDetailModalOpen(true)}
                onShare={() => 
                    selectedTerritory && navigator.clipboard.writeText(`${window.location.origin}/territory/map?highlight=${selectedTerritory.id}`)
                }
            />

            {/* Territory Detail Modal */}
            {selectedTerritory && (
                <TerritoryDetailModal
                    territory={selectedTerritory}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}

            {/* Grid Overlay */}
            {showGrid && (
                <div className="pointer-events-none absolute inset-0 z-[500]" style={{ backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)' }} />
            )}
        </div>
    );
};

export default TerritoryMap;