import L from "leaflet";

// Fix default Leaflet marker icons for Vite bundling
export const DefaultIcon = L.icon({
    iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
    iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
    shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Apply default icon
L.Marker.prototype.options.icon = DefaultIcon as any;

// Basemaps configuration - Enhanced visibility options
export const TILE_DARK_NO_LABELS = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
export const TILE_DARK_WITH_LABELS = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// High contrast and colorful options for better visibility
export const TILE_LIGHT_WITH_LABELS = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const TILE_POSITRON = "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";

// Orange-themed tile for better visibility - using OpenStreetMap with custom styling
export const TILE_ORANGE_STREETS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

// Custom icons for different marker types
export const createCustomIcon = (
    type: 'start' | 'end' | 'waypoint' | 'current', 
    options?: { color?: string; size?: number }
) => {
    const size = options?.size || 30;
    const color = options?.color || '#3b82f6';
    
    const iconSvg = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
            ${type === 'start' ? '<path d="M8 12l4-4 4 4-4 4-4-4z" fill="white"/>' : ''}
            ${type === 'end' ? '<rect x="8" y="8" width="8" height="8" fill="white"/>' : ''}
            ${type === 'waypoint' ? '<circle cx="12" cy="12" r="3" fill="white"/>' : ''}
            ${type === 'current' ? '<path d="M12 2l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9l3-9z" fill="white"/>' : ''}
        </svg>
    `;
    
    return L.divIcon({
        html: iconSvg,
        className: 'custom-marker-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Calculate map bounds from coordinates
export const calculateBounds = (coordinates: Array<{ latitude: number; longitude: number }>): ReturnType<typeof L.latLngBounds> | null => {
    if (coordinates.length === 0) return null;
    
    const lats = coordinates.map(c => c.latitude);
    const lngs = coordinates.map(c => c.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Add padding (10% of range, minimum 0.001 degrees)
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    const latPadding = Math.max(latRange * 0.1, 0.001);
    const lngPadding = Math.max(lngRange * 0.1, 0.001);
    
    return new L.LatLngBounds([
        [minLat - latPadding, minLng - lngPadding],
        [maxLat + latPadding, maxLng + lngPadding]
    ]);
};

// Calculate map center
export const calculateCenter = (
    coordinates: Array<{ latitude: number; longitude: number }>,
    status?: string
): [number, number] | null => {
    if (coordinates.length === 0) return null;
    
    if (status === 'active' && coordinates.length > 1) {
        // For active routes, use the last coordinate as center
        const lastCoord = coordinates[coordinates.length - 1];
        return [lastCoord.latitude, lastCoord.longitude];
    } else {
        // For completed routes, use geometric center
        const avgLat = coordinates.reduce((sum, c) => sum + c.latitude, 0) / coordinates.length;
        const avgLng = coordinates.reduce((sum, c) => sum + c.longitude, 0) / coordinates.length;
        return [avgLat, avgLng];
    }
};