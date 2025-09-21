import React, { useEffect, useState, useMemo } from "react";
import { Polygon, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Swords, MapPin, Eye, Zap, AlertTriangle, Route, Crown } from "lucide-react";
import { Territory } from "@/types/territory";
import RoutePathOverlay from "./RoutePathOverlay";
import TerritoryConflictVisualization from "./TerritoryConflictVisualization";

interface TerritoryPolygonProps {
    territory: Territory;
    isOwned: boolean;
    onClick?: (territory: Territory) => void;
    isAnimating?: boolean;
    showUpdateIndicator?: boolean;
    updateType?: 'claimed' | 'attacked' | 'contested' | 'lost';
    animationDuration?: number;
    showConflictAreas?: boolean;
    onViewCompetingRoute?: (routeId: string) => void;
    showSourceRoute?: boolean;
    sourceRouteCoordinates?: Array<{ latitude: number; longitude: number; timestamp?: string }>;
}

const TerritoryPolygon: React.FC<TerritoryPolygonProps> = ({
    territory,
    isOwned,
    onClick,
    isAnimating = false,
    showUpdateIndicator = false,
    updateType,
    animationDuration = 3000,
    showConflictAreas = true,
    onViewCompetingRoute,
    showSourceRoute = false,
    sourceRouteCoordinates = [],
}) => {
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [pulseAnimation, setPulseAnimation] = useState(false);
    const [glowAnimation, setGlowAnimation] = useState(false);
    const [shakeAnimation, setShakeAnimation] = useState(false);

    // Calculate conflict areas for visualization
    const conflictAreas = useMemo(() => {
        if (!showConflictAreas || !territory.conflicts || territory.conflicts.length === 0) {
            return [];
        }

        return territory.conflicts.filter(conflict => !conflict.is_resolved).map(conflict => ({
            id: conflict.id,
            area: conflict.overlap_area_sqm,
            center: [conflict.center_lat, conflict.center_lng] as [number, number],
            competing_route_id: conflict.competing_route_id,
            severity: conflict.overlap_area_sqm > 100000 ? 'high' : 
                     conflict.overlap_area_sqm > 50000 ? 'medium' : 'low'
        }));
    }, [territory.conflicts, showConflictAreas]);

    // Handle animations based on update type
    useEffect(() => {
        if (!isAnimating || !updateType) return;

        const startAnimation = () => {
            switch (updateType) {
                case 'claimed':
                    setGlowAnimation(true);
                    setPulseAnimation(true);
                    break;
                case 'attacked':
                case 'contested':
                    setShakeAnimation(true);
                    setPulseAnimation(true);
                    break;
                case 'lost':
                    setShakeAnimation(true);
                    break;
            }
        };

        const stopAnimation = () => {
            setPulseAnimation(false);
            setGlowAnimation(false);
            setShakeAnimation(false);
        };

        startAnimation();
        const timer = setTimeout(stopAnimation, animationDuration);

        return () => {
            clearTimeout(timer);
            stopAnimation();
        };
    }, [isAnimating, updateType, animationDuration]);

    // Get polygon style based on territory status and animations
    const getPolygonStyle = () => {
        let baseColor = '#6b7280'; // Default gray
        let fillOpacity = 0.3;
        let weight = 2;

        // Base colors by status
        if (isOwned) {
            baseColor = '#22c55e'; // Green
            fillOpacity = 0.4;
        } else if (territory.is_contested) {
            baseColor = '#f59e0b'; // Orange
            fillOpacity = 0.35;
        }

        // Animation modifications
        if (pulseAnimation) {
            fillOpacity = Math.min(fillOpacity + 0.2, 0.8);
            weight = 3;
        }

        if (glowAnimation) {
            baseColor = '#10b981'; // Bright green for claiming
            fillOpacity = 0.6;
        }

        if (isHighlighted) {
            weight = 4;
            fillOpacity = Math.min(fillOpacity + 0.1, 0.7);
        }

        return {
            color: baseColor,
            fillColor: baseColor,
            fillOpacity,
            weight,
            opacity: 0.8,
            dashArray: territory.is_contested ? '5, 5' : undefined,
            className: `territory-polygon ${pulseAnimation ? 'pulse' : ''} ${glowAnimation ? 'glow' : ''} ${shakeAnimation ? 'shake' : ''}`
        };
    };

    // Convert territory boundary to Leaflet polygon format
    const polygonPositions = useMemo(() => {
        return territory.boundary_coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
    }, [territory.boundary_coordinates]);

    // Handle polygon click
    const handleClick = () => {
        if (onClick) {
            onClick(territory);
        }
    };

    // Handle mouse events
    const handleMouseOver = () => {
        setIsHighlighted(true);
    };

    const handleMouseOut = () => {
        setIsHighlighted(false);
    };

    // Format area for display
    const formatArea = (areaSqm: number) => {
        if (areaSqm >= 1000000) {
            return `${(areaSqm / 1000000).toFixed(2)} km²`;
        }
        return `${(areaSqm / 1000).toFixed(0)} m²`;
    };

    // Get status icon
    const getStatusIcon = () => {
        if (isOwned) return <Shield className="w-4 h-4 text-green-600" />;
        if (territory.is_contested) return <Swords className="w-4 h-4 text-orange-600" />;
        return <MapPin className="w-4 h-4 text-gray-600" />;
    };

    // Get status badge
    const getStatusBadge = () => {
        if (isOwned) return <Badge className="bg-green-100 text-green-800">Owned</Badge>;
        if (territory.is_contested) return <Badge className="bg-orange-100 text-orange-800">Contested</Badge>;
        return <Badge variant="outline">Available</Badge>;
    };

    return (
        <>
            <Polygon
                positions={polygonPositions}
                pathOptions={getPolygonStyle()}
                eventHandlers={{
                    click: handleClick,
                    mouseover: handleMouseOver,
                    mouseout: handleMouseOut,
                }}
            >
                <Popup>
                    <div className="min-w-[200px] space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {getStatusIcon()}
                                <h3 className="font-semibold text-sm">
                                    {territory.name || `Territory ${territory.id.slice(0, 8)}`}
                                </h3>
                            </div>
                            {getStatusBadge()}
                        </div>

                        {/* Territory info */}
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Area:</span>
                                <span className="font-medium">{formatArea(territory.area_sqm)}</span>
                            </div>
                            
                            {territory.owner_username && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Owner:</span>
                                    <span className="font-medium">{territory.owner_username}</span>
                                </div>
                            )}

                            {territory.claimed_at && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Claimed:</span>
                                    <span className="font-medium">
                                        {new Date(territory.claimed_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}

                            {territory.is_contested && territory.conflicts && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Conflicts:</span>
                                    <span className="font-medium text-orange-600">
                                        {territory.conflicts.filter(c => !c.is_resolved).length}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            {!isOwned && !territory.is_contested && (
                                <Button size="sm" className="flex-1">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Claim
                                </Button>
                            )}
                            
                            {territory.is_contested && (
                                <Button size="sm" variant="outline" className="flex-1">
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Conflict
                                </Button>
                            )}

                            <Button size="sm" variant="outline">
                                <MapPin className="w-3 h-3 mr-1" />
                                Details
                            </Button>
                        </div>

                        {/* Conflict info */}
                        {territory.is_contested && conflictAreas.length > 0 && (
                            <div className="border-t pt-2">
                                <div className="flex items-center gap-1 mb-2">
                                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-700">Active Conflicts</span>
                                </div>
                                {conflictAreas.slice(0, 2).map(conflict => (
                                    <div key={conflict.id} className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Overlap:</span>
                                            <span>{formatArea(conflict.area)}</span>
                                        </div>
                                        {onViewCompetingRoute && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs"
                                                onClick={() => onViewCompetingRoute(conflict.competing_route_id)}
                                            >
                                                <Route className="w-3 h-3 mr-1" />
                                                View Route
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Update indicator */}
                        {showUpdateIndicator && updateType && (
                            <div className="border-t pt-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-blue-500" />
                                    <span className="text-xs font-medium capitalize">
                                        {updateType === 'claimed' && 'Territory Claimed!'}
                                        {updateType === 'attacked' && 'Under Attack!'}
                                        {updateType === 'contested' && 'Now Contested!'}
                                        {updateType === 'lost' && 'Territory Lost!'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </Popup>
            </Polygon>

            {/* Source route overlay */}
            {showSourceRoute && sourceRouteCoordinates.length > 0 && (
                <RoutePathOverlay
                    coordinates={sourceRouteCoordinates}
                    color="#3b82f6"
                    opacity={0.7}
                    weight={3}
                />
            )}

            {/* Conflict visualization */}
            {showConflictAreas && conflictAreas.length > 0 && (
                <TerritoryConflictVisualization
                    conflicts={conflictAreas}
                    territoryId={territory.id}
                />
            )}
        </>
    );
};

export default TerritoryPolygon;