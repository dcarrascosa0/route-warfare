/**
 * Territory Preview API types.
 */

import { GeoPoint } from './common';

export interface TerritoryConflict {
  territory_id: string;
  owner_id: string;
  owner_name?: string;
  overlap_percentage: number;
  overlap_area_square_meters: number;
  conflict_type: 'minor' | 'major' | 'complete';
}

export interface TerritoryPreview {
  boundary_geojson?: Record<string, any>;
  area_square_meters: number;
  is_valid: boolean;
  preview_type: 'valid' | 'insufficient_data' | 'error' | 'no_coordinates';
  conflicts: TerritoryConflict[];
  eligible_for_claiming: boolean;
  coordinate_count?: number;
  conflict_count?: number;
  major_conflicts?: TerritoryConflict[];
  error?: string;
  is_real_time?: boolean;
}

export interface RealTimeTerritoryPreviewRequest {
  coordinates: GeoPoint[];
}

export interface TerritoryPreviewResponse {
  preview: TerritoryPreview;
  validation: {
    eligible: boolean;
    reason: string;
    details: Record<string, any>;
  };
  recommendations: string[];
  next_steps: string[];
}