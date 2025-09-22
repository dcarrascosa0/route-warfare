import { GeoCoordinate } from "@/types";

/**
 * Calculates the Haversine distance between two coordinates.
 * @param coord1 - The first coordinate.
 * @param coord2 - The second coordinate.
 * @returns The distance in meters.
 */
export function calculateDistance(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const R = 6371e3; // metres
  const φ1 = (coord1.latitude * Math.PI) / 180; // φ, λ in radians
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}

/**
 * Calculates the total distance of a polyline.
 * @param coordinates - An array of coordinates.
 * @returns The total distance in meters.
 */
export function calculatePolylineDistance(coordinates: GeoCoordinate[]): number {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }
  return totalDistance;
}
