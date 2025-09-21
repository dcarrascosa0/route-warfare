import React, { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResponsive } from "@/hooks/useResponsive";
import {
  MapPin,
  Navigation,
  Target as TargetIcon,
  Maximize2,
  RefreshCw,
  Wifi,
  WifiOff,
  Shield,
  Swords,
  Crown,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Territory, TerritoryFilter } from "@/types/territory";
import TerritoryPolygon from "./TerritoryPolygon";
import { useTerritoryContext } from "@/contexts/TerritoryContext";
import { useTerritoryUpdates } from "@/hooks/useTerritoryUpdates";
import TerritoryUpdateIndicator from "./TerritoryUpdateIndicator";

// Fix default Leaflet marker icons for Vite bundling
const DefaultIcon = L.icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon as any;

interface TerritoryMapProps {
  territories?: Territory[];
  center?: [number, number];
  zoom?: number;
  filter?: TerritoryFilter;
  onTerritoryClick?: (territory: Territory) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showControls?: boolean;
  showUserLocation?: boolean;
  userLocation?: [number, number];
  className?: string;
  height?: string;
  isInteractive?: boolean;
  showConflictAreas?: boolean;
  showRouteOverlays?: boolean;
  animateUpdates?: boolean;
}

// Component to handle map events and updates
const MapEventHandler: React.FC<{
  onMapClick?: (lat: number, lng: number) => void;
  territories: Territory[];
  animateUpdates: boolean;
}> = ({ onMapClick, territories, animateUpdates }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapClick) {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      };
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }
  }, [map, onMapClick]);

  // Auto-fit bounds when territories change
  useEffect(() => {
    if (territories.length > 0) {
      const bounds = L.latLngBounds(
        territories.flatMap(t => 
          t.boundary_coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number])
        )
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, territories]);

  return null;
};

const TerritoryMap: React.FC<TerritoryMapProps> = ({
  territories = [],
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  filter,
  onTerritoryClick,
  onMapClick,
  showControls = true,
  showUserLocation = true,
  userLocation,
  className = "",
  height = "400px",
  isInteractive = true,
  showConflictAreas = true,
  showRouteOverlays = false,
  animateUpdates = true,
}) => {
  const { isMobile } = useResponsive();
  const mapRef = useRef<L.Map>(null);
  const { territories: contextTerritories, isLoading, error } = useTerritoryContext();
  const { updates, clearUpdate } = useTerritoryUpdates();

  // Use context territories if none provided
  const displayTerritories = territories.length > 0 ? territories : contextTerritories;

  // Filter territories based on filter criteria
  const filteredTerritories = useMemo(() => {
    if (!filter) return displayTerritories;

    return displayTerritories.filter(territory => {
      // Status filter
      if (filter.status && filter.status !== 'all') {
        if (filter.status === 'owned' && !territory.is_owned) return false;
        if (filter.status === 'contested' && !territory.is_contested) return false;
        if (filter.status === 'available' && (territory.is_owned || territory.is_contested)) return false;
      }

      // Owner filter
      if (filter.owner && filter.owner !== 'all') {
        if (filter.owner === 'me' && !territory.is_owned) return false;
        if (filter.owner === 'others' && territory.is_owned) return false;
      }

      // Area filter
      if (filter.minArea && territory.area_sqm < filter.minArea) return false;
      if (filter.maxArea && territory.area_sqm > filter.maxArea) return false;

      return true;
    });
  }, [displayTerritories, filter]);

  // Get territory color based on status
  const getTerritoryColor = (territory: Territory) => {
    if (territory.is_owned) return '#22c55e'; // Green for owned
    if (territory.is_contested) return '#f59e0b'; // Orange for contested
    return '#6b7280'; // Gray for available
  };

  // Get territory opacity based on status
  const getTerritoryOpacity = (territory: Territory) => {
    if (territory.is_owned) return 0.7;
    if (territory.is_contested) return 0.5;
    return 0.3;
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load territories</p>
          <Button variant="outline" size="sm" className="mt-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading territories...</p>
          </div>
        </div>
      )}

      {/* Territory updates indicator */}
      {updates.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000]">
          {updates.map(update => (
            <TerritoryUpdateIndicator
              key={update.id}
              update={update}
              onDismiss={() => clearUpdate(update.id)}
            />
          ))}
        </div>
      )}

      {/* Map controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] space-y-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {filteredTerritories.length} territories
              </Badge>
              {filteredTerritories.some(t => t.is_contested) && (
                <Badge variant="destructive" className="text-xs">
                  <Swords className="w-3 h-3 mr-1" />
                  Conflicts
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Network status indicator */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="rounded-lg"
        zoomControl={false}
        scrollWheelZoom={isInteractive}
        dragging={isInteractive}
        touchZoom={isInteractive}
        doubleClickZoom={isInteractive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zoom controls */}
        {showControls && <ZoomControl position="bottomleft" />}

        {/* Map event handler */}
        <MapEventHandler
          onMapClick={onMapClick}
          territories={filteredTerritories}
          animateUpdates={animateUpdates}
        />

        {/* User location marker */}
        {showUserLocation && userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center">
                <MapPin className="w-4 h-4 mx-auto mb-1" />
                <p className="text-sm font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Territory polygons */}
        {filteredTerritories.map((territory) => (
          <TerritoryPolygon
            key={territory.id}
            territory={territory}
            isOwned={territory.is_owned}
            onClick={onTerritoryClick}
            showConflictAreas={showConflictAreas}
            showSourceRoute={showRouteOverlays}
            isAnimating={animateUpdates && updates.some(u => u.territoryId === territory.id)}
            showUpdateIndicator={updates.some(u => u.territoryId === territory.id)}
            updateType={updates.find(u => u.territoryId === territory.id)?.type}
          />
        ))}

        {/* Conflict visualization circles */}
        {showConflictAreas && filteredTerritories
          .filter(t => t.is_contested && t.conflicts)
          .map(territory => 
            territory.conflicts?.map(conflict => (
              <Circle
                key={`conflict-${conflict.id}`}
                center={[conflict.center_lat, conflict.center_lng]}
                radius={Math.sqrt(conflict.overlap_area_sqm / Math.PI)}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div className="text-center">
                    <Swords className="w-4 h-4 mx-auto mb-1 text-destructive" />
                    <p className="text-sm font-medium">Territory Conflict</p>
                    <p className="text-xs text-muted-foreground">
                      {(conflict.overlap_area_sqm / 1000000).toFixed(2)} km²
                    </p>
                  </div>
                </Popup>
              </Circle>
            ))
          )
        }
      </MapContainer>
    </div>
  );
};

export default TerritoryMap;