// Route tracking types
export interface GPSCoordinate {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
}

export interface RouteDetail {
    id: string;
    name?: string;
    description?: string;
    status: "active" | "completed" | "abandoned";
    created_at: string;
    updated_at: string;
    completed_at?: string;
    coordinates: GPSCoordinate[];
    stats: {
        distance_meters: number | null;
        duration_seconds?: number | null;
        coordinate_count: number | null;
        is_closed_loop: boolean;
        territory_area_km2?: number | null;
        gps_quality_score?: number;
        territory_eligibility_score?: number;
    };
    territory_claim_result?: {
        success: boolean;
        territory_id?: string;
        area_sqm: number;
        conflicts_resolved: number;
        ownership_transfers: string[];
        error_message?: string;
    };
}

export interface RouteMapProps {
    route: RouteDetail;
    interactive?: boolean;
    currentLocation?: GeolocationPosition | null;
    onCoordinateClick?: (coordinate: GPSCoordinate, index: number) => void;
    className?: string;
}

export interface RouteTrackerProps {
    onRouteUpdate?: (coordinates: GPSCoordinate[]) => void;
    onRouteComplete?: (route: RouteDetail) => void;
    isActive?: boolean;
}

export interface RouteProgressProps {
    route: RouteDetail;
    showDetails?: boolean;
}

export interface GPSStatusProps {
    accuracy?: number;
    isTracking?: boolean;
    lastUpdate?: string;
}