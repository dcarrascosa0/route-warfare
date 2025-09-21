// Territory management types
export interface Territory {
    id: string;
    name?: string;
    description?: string;
    owner_id: string;
    owner_username?: string;
    route_id?: string;
    status: "claimed" | "contested" | "neutral";
    area_km2: number;
    claimed_at: string;
    last_activity: string;
    boundary_coordinates: Array<{ latitude: number; longitude: number }>;
    contested_by?: string[];
}

export interface TerritoryConflict {
    id: string;
    territory_id: string;
    conflicting_route_id: string;
    conflict_area_coordinates: Array<{ latitude: number; longitude: number }>;
    status: "pending" | "resolved" | "escalated";
    created_at: string;
}

export interface TerritoryMapProps {
    territories: Territory[];
    conflicts?: TerritoryConflict[];
    onTerritoryClick?: (territory: Territory) => void;
    onNavigateToTerritory?: (territoryId: string) => void;
    className?: string;
}

export interface TerritoryListProps {
    territories: Territory[];
    onTerritorySelect?: (territory: Territory) => void;
    showOwnership?: boolean;
}

export interface TerritoryDetailsProps {
    territory: Territory;
    onClose?: () => void;
    onEdit?: (territory: Territory) => void;
}

export interface TerritoryConflictsProps {
    conflicts: TerritoryConflict[];
    onResolveConflict?: (conflictId: string) => void;
}