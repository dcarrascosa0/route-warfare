import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RouteMapProps } from "./types";
import { calculateBounds, calculateCenter, createCustomIcon, TILE_DARK_WITH_LABELS } from "./utils/mapUtils";
import MapPanes from "./components/MapPanes";
import MapResizeFix from "./components/MapResizeFix";
import L from "leaflet";

export default function RouteMap({
    route,
    interactive = true,
    currentLocation,
    onCoordinateClick,
    className = ""
}: RouteMapProps) {
    // Calculate map center and bounds
    const { center, bounds } = useMemo(() => {
        const coordinates = route.coordinates;
        let c = calculateCenter(coordinates, route.status);
        let b = calculateBounds(coordinates);

        // Fallback to current location if there are no coordinates yet
        if ((!c || !b) && currentLocation) {
            const lat = currentLocation.coords.latitude;
            const lng = currentLocation.coords.longitude;
            c = [lat, lng];
            const pad = 0.005; // ~500m padding
            b = new L.LatLngBounds([
                [lat - pad, lng - pad],
                [lat + pad, lng + pad]
            ]);
        }
        return { center: c, bounds: b };
    }, [route.coordinates, route.status, currentLocation]);

    // Convert coordinates to Leaflet format
    const routePath = useMemo(() => {
        return route.coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);
    }, [route.coordinates]);

    if (!center || !bounds) {
        return (
            <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
                <p className="text-gray-500">No route data available</p>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <MapContainer
                center={center}
                bounds={bounds}
                className="w-full h-full rounded-lg"
                zoomControl={interactive}
                dragging={interactive}
                touchZoom={interactive}
                doubleClickZoom={interactive}
                scrollWheelZoom={interactive}
                boxZoom={interactive}
                keyboard={interactive}
            >
                <MapPanes />
                <MapResizeFix />
                
                <TileLayer
                    url={TILE_DARK_WITH_LABELS}
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    pane="base"
                />

                {/* Route path */}
                {routePath.length > 1 && (
                    <Polyline
                        positions={routePath}
                        color="#3b82f6"
                        weight={4}
                        opacity={0.8}
                        pane="routes"
                    />
                )}
                {/* If active route and we have a currentLocation but no coordinates yet, show heading dot */}
                {route.status === 'active' && routePath.length === 0 && currentLocation && (
                    <Marker
                        position={[currentLocation.coords.latitude, currentLocation.coords.longitude]}
                        icon={createCustomIcon('current', { color: '#3b82f6' })}
                        pane="routes"
                    />
                )}

                {/* Start marker */}
                {route.coordinates.length > 0 && (
                    <Marker
                        position={[route.coordinates[0].latitude, route.coordinates[0].longitude]}
                        icon={createCustomIcon('start', { color: '#10b981' })}
                        pane="markers"
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong>Route Start</strong>
                                <br />
                                {new Date(route.coordinates[0].timestamp).toLocaleString()}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* End marker (for completed routes) */}
                {route.status === 'completed' && route.coordinates.length > 1 && (
                    <Marker
                        position={[
                            route.coordinates[route.coordinates.length - 1].latitude,
                            route.coordinates[route.coordinates.length - 1].longitude
                        ]}
                        icon={createCustomIcon('end', { color: '#ef4444' })}
                        pane="markers"
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong>Route End</strong>
                                <br />
                                {new Date(route.coordinates[route.coordinates.length - 1].timestamp).toLocaleString()}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Current location marker */}
                {currentLocation && (
                    <Marker
                        position={[
                            currentLocation.coords.latitude,
                            currentLocation.coords.longitude
                        ]}
                        icon={createCustomIcon('current', { color: '#f59e0b' })}
                        pane="markers"
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong>Current Location</strong>
                                <br />
                                Accuracy: {currentLocation.coords.accuracy?.toFixed(1)}m
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}