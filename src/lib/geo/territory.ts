export type LatLng = { latitude: number; longitude: number };

export function normalizeTerritoryRings(territory: any): LatLng[][] {
  if (!territory) return [];
  if (territory.boundary_rings && Array.isArray(territory.boundary_rings)) {
    return territory.boundary_rings
      .filter((ring: any) => Array.isArray(ring) && ring.length >= 3)
      .map((ring: any[]) => ring
        .filter((c: any) => c && isFinite(Number(c.latitude)) && isFinite(Number(c.longitude)))
        .map((c: any) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }))
      )
      .filter((ring: LatLng[]) => ring.length >= 3);
  }
  if (territory.boundary_coordinates && Array.isArray(territory.boundary_coordinates)) {
    const ring = territory.boundary_coordinates
      .filter((c: any) => c && isFinite(Number(c.latitude)) && isFinite(Number(c.longitude)))
      .map((c: any) => ({ latitude: Number(c.latitude), longitude: Number(c.longitude) }));
    return ring.length >= 3 ? [ring] : [];
  }
  return [];
}


