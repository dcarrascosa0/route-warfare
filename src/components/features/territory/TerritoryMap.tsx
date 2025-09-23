import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, User, Calendar, Ruler, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
import MapResizeFix from "@/components/features/route-tracking/components/MapResizeFix";
import "leaflet/dist/leaflet.css";
import "./TerritoryMap.css";

// Mock territory data structure - will be replaced with real API data
interface Territory {
    id: string;
    name: string;
    owner_id: string;
    owner_name: string;
    boundary_coordinates: Array<{ latitude: number; longitude: number }>;
    area_square_meters: number;
    claimed_at: string;
    contested: boolean;
    contest_count: number;
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

    if (territory.contested) {
        // Contested territories - pulsing red with warning pattern
        return {
            ...baseStyle,
            color: "#ff6b35", // Orange-red for contested
            fillColor: "#ff6b35",
            fillOpacity: isSelected ? 0.5 : isHovered ? 0.4 : 0.3,
            dashArray: "8, 4", // Dashed border for contested
            className: 'territory-polygon territory-contested animate-territory-pulse'
        };
    }
    
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
    const formatArea = (areaSquareMeters: number) => {
        if (areaSquareMeters >= 1000000) {
            return `${(areaSquareMeters / 1000000).toFixed(2)} km²`;
        }
        return `${areaSquareMeters.toLocaleString()} m²`;
    };

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
                            className={cn(
                                territory.contested && "bg-red-500 hover:bg-red-600"
                            )}
                        >
                            {territory.contested ? "Contested" : territory.is_mine ? "Your Territory" : "Claimed"}
                        </Badge>
                        {territory.contested && (
                            <Badge variant="outline" className="text-red-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {territory.contest_count} conflicts
                            </Badge>
                        )}
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
                        {territory.contested && (
                            <Button variant="destructive" size="sm" className="flex-1">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Resolve Conflict
                            </Button>
                        )}
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
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [realtimeTerritories, setRealtimeTerritories] = useState<Territory[]>(territories);
    const [mapRefreshKey, setMapRefreshKey] = useState(0);
    const [hoveredTerritoryId, setHoveredTerritoryId] = useState<string | null>(null);



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
                return territory.contested;
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
                    const positions = (territory.boundary_coordinates || []).map(coord =>
                        [coord.latitude, coord.longitude] as [number, number]
                    );

                    // Skip territories with invalid coordinates
                    if (positions.length < 3) {
                        console.warn(`Territory ${territory.id} (${territory.name}) has insufficient coordinates:`, {
                            positionsLength: positions.length,
                            boundaryCoordinatesLength: territory.boundary_coordinates?.length || 0,
                            sampleCoordinates: territory.boundary_coordinates?.slice(0, 2)
                        });
                        return null;
                    }

                    const territoryStyle = getTerritoryStyle(territory, isSelected, isHovered);

                    return (
                        <Polygon
                            key={territory.id}
                            positions={positions}
                            pathOptions={territoryStyle}
                            eventHandlers={{
                                click: () => handleTerritoryClick(territory),
                                dblclick: () => handleTerritoryDoubleClick(territory),
                                mouseover: () => setHoveredTerritoryId(territory.id),
                                mouseout: () => setHoveredTerritoryId(null)
                            }}
                        >
                            <Popup className="territory-popup">
                                <div className="min-w-48 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg p-4 shadow-glow">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                            territory.contested ? 'bg-orange-500 animate-pulse' :
                                            territory.is_mine ? 'bg-primary shadow-glow' :
                                            'bg-cyan-500'
                                        }`} />
                                        <div className="font-semibold text-foreground">
                                            {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Owner:</span>
                                            <span className="font-medium text-foreground">{territory.owner_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Area:</span>
                                            <span className="font-medium text-foreground">
                                                {territory.area_square_meters >= 1000000
                                                    ? `${(territory.area_square_meters / 1000000).toFixed(2)} km²`
                                                    : `${territory.area_square_meters.toLocaleString()} m²`
                                                }
                                            </span>
                                        </div>
                                        {territory.contested && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Status:</span>
                                                <span className="font-medium text-orange-500 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Contested ({territory.contest_count})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Button
                                        size="sm"
                                        className="w-full mt-3 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary hover:text-primary-foreground transition-all duration-200"
                                        onClick={() => handleTerritoryDoubleClick(territory)}
                                    >
                                        <Eye className="h-3 w-3 mr-2" />
                                        View Details
                                    </Button>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>

            {/* Enhanced Territory Legend */}
            {showOwnershipIndicators && !showEmptyState && (
                <Card className="absolute top-4 right-4 z-[1000] bg-card/80 backdrop-blur-md border border-border/50 shadow-glow">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Territory Legend
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-3 bg-primary/30 border-2 border-primary rounded-sm shadow-glow animate-territory-glow"></div>
                                    <span className="text-foreground font-medium">Your Territories</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-3 bg-cyan-500/20 border-2 border-cyan-500 rounded-sm"></div>
                                    <span className="text-muted-foreground">Other Territories</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-3 bg-orange-500/30 border-2 border-orange-500 rounded-sm animate-pulse" style={{borderStyle: 'dashed'}}></div>
                                    <span className="text-orange-500 font-medium flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Contested
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Enhanced empty state overlay */}
            {showEmptyState && (
                <div className="absolute inset-0 flex items-center justify-center z-[500]">
                    <div className="text-center space-y-6 p-8 territory-empty-state max-w-md mx-4">
                        <div className="relative">
                            <MapPin className="h-20 w-20 text-primary mx-auto animate-pulse" />
                            <div className="absolute inset-0 h-20 w-20 mx-auto rounded-full bg-primary/20 animate-ping"></div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-foreground">
                                {activeTerritories.length === 0
                                    ? "No Territories Claimed"
                                    : "No Matching Territories"
                                }
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {activeTerritories.length === 0
                                    ? "Start tracking routes and complete them to claim your first territory. Each completed route can become a valuable piece of your empire."
                                    : "Adjust your search terms or filters to discover territories that match your criteria."
                                }
                            </p>
                        </div>
                        {activeTerritories.length === 0 && (
                            <div className="flex items-center justify-center gap-2 text-sm text-primary">
                                <Target className="h-4 w-4" />
                                <span>Ready to conquer new territories?</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Territory Detail Modal */}
            {selectedTerritory && (
                <TerritoryDetailModal
                    territory={selectedTerritory}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}
        </div>
    );
};

export default TerritoryMap;