/**
 * Data formatting utilities.
 */

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

export function formatArea(km2: number): string {
  if (km2 < 0.01) {
    const m2 = km2 * 1_000_000;
    return `${Math.round(m2)} m²`;
  } else if (km2 < 1) {
    const hectares = km2 * 100;
    return `${hectares.toFixed(1)} ha`;
  } else {
    return `${km2.toFixed(2)} km²`;
  }
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`;
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

export function formatCoordinate(coord: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat' 
    ? (coord >= 0 ? 'N' : 'S')
    : (coord >= 0 ? 'E' : 'W');
  
  return `${Math.abs(coord).toFixed(6)}° ${direction}`;
}