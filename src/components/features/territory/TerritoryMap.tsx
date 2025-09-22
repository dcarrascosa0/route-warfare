import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, User, Calendar, Ruler, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalTerritoryWebSocket } from "@/hooks/useTerritoryWebSocket";
import "leaflet/dist/leaflet.css";

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

// Territory colors based on ownership and status
const getTerritoryColor = (territory: Territory) => {
    if (territory.contested) {
        return "#ef4444"; // Red for contested territories
    }
    if (territory.is_mine) {
        return "#22c55e"; // Green for user's territories
    }
    return "#3b82f6"; // Blue for other territories
};

const getTerritoryOpacity = (territory: Territory, isSelected: boolean) => {
    if (isSelected) return 0.8;
    if (territory.contested) return 0.7;
    return 0.5;
};

// Component to fit map bounds to territories
const FitBounds = ({ territories }: { territories: Territory[] }) => {
    const map = useMap();

    useEffect(() => {
        if (territories.length === 0) return;

        const bounds = new LatLngBounds([]);
        territories.forEach(territory => {
            territory.boundary_coordinates.forEach(coord => {
                bounds.extend(new LatLng(coord.latitude, coord.longitude));
            });
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

    const { isConnected } = useGlobalTerritoryWebSocket({
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

    return (
        <div className={cn("relative", className)}>
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                className="h-full w-full rounded-lg"
                zoomControl={true}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Fit bounds to territories */}
                {filteredTerritories.length > 0 && (
                    <FitBounds territories={filteredTerritories} />
                )}

                {/* Render territory polygons */}
                {filteredTerritories.map(territory => {
                    const isSelected = territory.id === selectedTerritoryId || territory.id === selectedTerritory?.id;
                    const positions = territory.boundary_coordinates.map(coord =>
                        [coord.latitude, coord.longitude] as [number, number]
                    );

                    return (
                        <Polygon
                            key={territory.id}
                            positions={positions}
                            pathOptions={{
                                color: getTerritoryColor(territory),
                                fillColor: getTerritoryColor(territory),
                                fillOpacity: getTerritoryOpacity(territory, isSelected),
                                weight: isSelected ? 3 : 2,
                                opacity: 0.8
                            }}
                            eventHandlers={{
                                click: () => handleTerritoryClick(territory),
                                dblclick: () => handleTerritoryDoubleClick(territory)
                            }}
                        >
                            <Popup>
                                <div className="min-w-48">
                                    <div className="font-semibold mb-2">
                                        {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Owner:</span>
                                            <span>{territory.owner_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Area:</span>
                                            <span>
                                                {territory.area_square_meters >= 1000000
                                                    ? `${(territory.area_square_meters / 1000000).toFixed(2)} km²`
                                                    : `${territory.area_square_meters.toLocaleString()} m²`
                                                }
                                            </span>
                                        </div>
                                        {territory.contested && (
                                            <div className="flex justify-between text-red-600">
                                                <span>Status:</span>
                                                <span>Contested ({territory.contest_count})</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => handleTerritoryDoubleClick(territory)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>

            {/* Territory Legend */}
            {showOwnershipIndicators && (
                <Card className="absolute top-4 right-4 z-[1000]">
                    <CardContent className="p-3">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Territory Legend</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                    <span>Your Territories</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                    <span>Other Territories</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                    <span>Contested</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {filteredTerritories.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center space-y-2">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">
                            {activeTerritories.length === 0
                                ? "No territories claimed yet"
                                : "No territories match your filters"
                            }
                        </p>
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