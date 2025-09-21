import React from "react";
import { Polyline } from "react-leaflet";

interface RoutePathOverlayProps {
  coordinates: Array<{ latitude: number; longitude: number; timestamp?: string }>;
  color?: string;
  opacity?: number;
  weight?: number;
  dashArray?: string;
  className?: string;
}

const RoutePathOverlay: React.FC<RoutePathOverlayProps> = ({
  coordinates,
  color = "#3b82f6",
  opacity = 0.7,
  weight = 3,
  dashArray,
  className = ""
}) => {
  // Convert coordinates to Leaflet format
  const pathPositions = coordinates.map(coord => [coord.latitude, coord.longitude] as [number, number]);

  if (pathPositions.length < 2) {
    return null;
  }

  return (
    <Polyline
      positions={pathPositions}
      pathOptions={{
        color,
        opacity,
        weight,
        dashArray,
      }}
      className={className}
    />
  );
};

export default RoutePathOverlay;