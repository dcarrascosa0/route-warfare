/**
 * Territory API client.
 */

import { BaseApiClient } from './base-client';
import type { Territory, ClaimTerritoryRequest, TerritoryMapResponse, TerritoryFilter, MapBounds } from '../types';

export class TerritoryApiClient extends BaseApiClient {
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

  async getUserTerritories(userId: string) {
    return this.request<Territory[]>(`/territories/user/${encodeURIComponent(userId)}`);
  }

  async getTerritory(territoryId: string) {
    return this.request<Territory>(`/territories/${encodeURIComponent(territoryId)}`);
  }

  async getContestedTerritories() {
    return this.request<Territory[]>(`/territories/contested`);
  }

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
}

export const territoryClient = new TerritoryApiClient();