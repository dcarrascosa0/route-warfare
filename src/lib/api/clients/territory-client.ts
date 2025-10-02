/**
 * Territory API client.
 */

import { BaseApiClient } from './base-client';
import type {
  Territory,
  TerritoryMapResponse,
  TerritoryPreview,
  UserTerritoryStatistics,
  GlobalTerritoryStatistics,

  EnhancedTerritoryEligibilityValidation,
  TerritoryStatisticsResponse,
  TerritoryPreviewResponse,
  GeoPoint
} from '../types';

export class TerritoryApiClient extends BaseApiClient {
  // Territory Management
  async claimTerritoryFromRoute(ownerId: string, body: {
    route_id: string;
    boundary_coordinates: Array<{ longitude: number; latitude: number }>;
    name?: string;
    description?: string;
  }) {
    return this.request<unknown>(`/territories/claim-from-route`, {
      method: "POST",
      body: {
        ...body,
        owner_id: ownerId,
        auto_resolve_conflicts: true,
        conflict_resolution_strategy: "ownership_transfer"
      }
    });
  }

  async getTerritoriesMap(params?: Record<string, string | number | boolean>) {
    const qs = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : "";
    return this.request<TerritoryMapResponse>(`/territories/map${qs}`);
  }

  async getTerritoriesMapSummary(zoomLevel: number) {
    const qs = `?${new URLSearchParams({ zoom_level: String(zoomLevel) }).toString()}`;
    return this.request<TerritoryMapResponse>(`/territories/map/summary${qs}`);
  }

  async getUserTerritories(userId: string) {
    return this.request<Territory[]>(`/territories/user/${encodeURIComponent(userId)}`);
  }

  async getTerritory(territoryId: string) {
    return this.request<Territory>(`/territories/${encodeURIComponent(territoryId)}`);
  }

  // contested removed: territories are exclusively owned

  async getRouteCreatedTerritories(params?: {
    claiming_method?: string;
    auto_claimed?: boolean;
    source_route_id?: string;
    owner_id?: string;
    limit?: number;
  }) {
    const qs = params
      ? `?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()}`
      : "";
    return this.request<Territory[]>(`/territories/filter/route-created${qs}`);
  }

  async getNearbyTerritories(latitude: number, longitude: number, radius: number = 5000) {
    return this.request<Territory[]>(`/territories/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
  }

  // Territory Preview
  async getRealTimeTerritoryPreview(coordinates: Array<{ longitude: number; latitude: number }>) {
    return this.request<TerritoryPreview>(`/territories/preview`, {
      method: "POST",
      body: { coordinates }
    });
  }

  async calculateTerritoryPreview(coordinates: GeoPoint[]) {
    return this.request<TerritoryPreview>(`/territories/preview`, {
      method: "POST",
      body: { coordinates }
    });
  }

  // Territory Statistics
  async getUserTerritoryStatistics(userId: string) {
    return this.request<UserTerritoryStatistics>(`/territories/stats/user/${encodeURIComponent(userId)}`);
  }

  async getGlobalTerritoryStatistics() {
    return this.request<GlobalTerritoryStatistics>(`/territories/stats/global`);
  }

  async getTerritoryStatistics(userId: string) {
    return this.request<TerritoryStatisticsResponse>(`/territories/stats/user/${encodeURIComponent(userId)}`);
  }



  // Territory Validation
  async validateTerritoryClaimFromRoute(routeId: string, boundaryCoordinates: GeoPoint[]) {
    return this.request<EnhancedTerritoryEligibilityValidation>(`/territories/validate-claim`, {
      method: "POST",
      body: {
        route_id: routeId,
        boundary_coordinates: boundaryCoordinates
      }
    });
  }

  async validateRouteTerritoryEligibility(routeId: string) {
    return this.request<EnhancedTerritoryEligibilityValidation>(`/territories/validate-eligibility/${encodeURIComponent(routeId)}`);
  }

  // Combined Territory Operations
  async getTerritoryPreviewWithValidation(coordinates: GeoPoint[]) {
    return this.request<TerritoryPreviewResponse>(`/territories/preview`, {
      method: "POST",
      body: { coordinates }
    });
  }
}

export const territoryClient = new TerritoryApiClient();