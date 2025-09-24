export const UnitsFormatter = {
  // Distance in meters → 'm' or 'km'
  distance(meters?: number | null): string {
    if (meters == null) return '—';
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  },

  // Area in square meters → 'm²' under 0.01 km², otherwise 'km²'
  areaSquareMeters(sqm?: number | null): string {
    if (sqm == null) return '—';
    const km2 = sqm / 1_000_000;
    if (km2 < 0.01) return `${Math.round(sqm).toLocaleString()} m²`;
    return `${km2.toFixed(2)} km²`;
  },

  // Area in km² → 'm²' under 0.01, otherwise 'km²'
  areaKm2(km2?: number | null): string {
    if (km2 == null) return '—';
    if (km2 < 0.01) return `${Math.round(km2 * 1_000_000).toLocaleString()} m²`;
    return `${km2.toFixed(2)} km²`;
  },
};

export default UnitsFormatter;


