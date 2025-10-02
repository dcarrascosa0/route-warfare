import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, useMap } from 'react-leaflet';
import { LatLngBounds, LatLng } from 'leaflet';
import { Coordinate } from '@/lib/api/types/common';
import { CompleteRouteResponse } from '@/lib/api/types/routes';
import MapResizeFix from './components/MapResizeFix';
import 'leaflet/dist/leaflet.css';
import '../territory/TerritoryMap.css';

interface RouteCompletionMapProps {
  coordinates: Coordinate[];
  completionResult?: CompleteRouteResponse | null;
  className?: string;
}

// Component to fit map bounds to route
const FitBounds = ({ coordinates }: { coordinates: Coordinate[] }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length === 0) return;

    const bounds = new LatLngBounds([]);
    coordinates.forEach(coord => {
      bounds.extend(new LatLng(coord.latitude, coord.longitude));
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [coordinates, map]);

  return null;
};

export const RouteCompletionMap: React.FC<RouteCompletionMapProps> = ({
  coordinates,
  completionResult,
  className = ''
}) => {
  // Convert coordinates to polyline format
  const routePolyline = coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);

  // Territory polygon if available (for future enhancement)
  // Note: Territory polygon might be available in a different format or require separate API call
  const territoryCoordinates: [number, number][] | null = null;

  // Default center (will be overridden by FitBounds if coordinates exist)
  const defaultCenter: [number, number] = coordinates.length > 0 
    ? [coordinates[0].latitude, coordinates[0].longitude]
    : [40.7128, -74.0060];
  const defaultZoom = coordinates.length > 0 ? 15 : 13;

  // Route styling - using territory map colors
  const routeStyle = {
    color: '#f97316', // Orange like owned territories
    weight: 4,
    opacity: 0.8,
    dashArray: undefined,
    className: 'route-completion-line'
  };

  // Territory styling if claimed
  const territoryStyle = {
    color: '#f97316',
    fillColor: '#f97316',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.2,
    className: 'territory-polygon territory-owned'
  };

  // Show empty state if no coordinates
  if (coordinates.length === 0) {
    return (
      <div className={`relative h-full w-full territory-map-container ${className} flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <div className="text-sm">No route data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full territory-map-container ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full rounded-lg rw-map"
        zoomControl={false} // Remove zoom controls
        scrollWheelZoom={true}
        attributionControl={false} // Remove attribution
      >
        {/* Use same dark tile layer as TerritoryMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          className="tw-road-tint"
        />
        <MapResizeFix />

        {/* Fit bounds to route */}
        <FitBounds coordinates={coordinates} />

        {/* Territory polygon (if claimed) */}
        {territoryCoordinates && territoryCoordinates.length > 2 && (
          <Polygon
            positions={territoryCoordinates}
            pathOptions={territoryStyle}
          />
        )}

        {/* Route polyline */}
        {routePolyline.length > 1 && (
          <Polyline
            positions={routePolyline}
            pathOptions={routeStyle}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default RouteCompletionMap;