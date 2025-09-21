/**
 * Data normalization utilities for API responses.
 */

type BackendRouteStats = {
  distance_meters?: number | null;
  duration_seconds?: number | null;
  territory_area_sqm?: number | null;
  total_points?: number;
  is_closed?: boolean;
};

type BackendCoordinate = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  bearing?: number | null;
  timestamp: string | number | Date;
};

function toIsoTimestamp(ts: string | number | Date): string {
  if (typeof ts === "string") return ts;
  if (typeof ts === "number") return new Date(ts).toISOString();
  return ts.toISOString();
}

function normalizeStats(stats: BackendRouteStats | undefined) {
  const km2 = (sqm?: number | null) => (typeof sqm === "number" ? (sqm / 1_000_000) : null);
  return {
    distance_meters: stats?.distance_meters ?? null,
    duration_seconds: stats?.duration_seconds ?? null,
    coordinate_count: stats?.total_points ?? 0,
    is_closed_loop: Boolean(stats?.is_closed),
    territory_area_km2: km2(stats?.territory_area_sqm),
  };
}

export function normalizeRouteSummary(route: any) {
  return {
    id: route.id,
    user_id: route.user_id,
    name: route.name,
    description: route.description,
    status: route.status,
    created_at: route.created_at,
    updated_at: route.updated_at,
    completed_at: route.end_time ?? null,
    stats: normalizeStats(route.stats),
  };
}

export function normalizeRouteDetail(route: any) {
  const base = normalizeRouteSummary(route);
  const coords: BackendCoordinate[] = Array.isArray(route.coordinates) ? route.coordinates : [];
  const normalizedCoords = coords.map((c) => ({
    latitude: c.latitude,
    longitude: c.longitude,
    altitude: c.altitude ?? null,
    accuracy: c.accuracy ?? null,
    speed: c.speed ?? null,
    bearing: c.bearing ?? null,
    timestamp: toIsoTimestamp(c.timestamp),
  }));
  normalizedCoords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    ...base,
    coordinates: normalizedCoords,
    // Provide both for compatibility with existing UI
    territory_polygon: route.territory_geometry ?? route.territory_polygon ?? null,
  };
}