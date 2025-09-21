/**
 * Route API client.
 */

import { BaseApiClient } from './base-client';
import type { Route, RouteDetail, StartRouteRequest, AddCoordinatesRequest, CompleteRouteRequest, RouteStatistics } from '../types';
import { normalizeRouteSummary, normalizeRouteDetail } from '../utils/data-normalizers.ts';

export class RouteApiClient extends BaseApiClient {
  async getRoutesForUser(userId: string, limit = 20) {
    const res = await this.request<any[]>(`/routes/user/${encodeURIComponent(userId)}?limit=${limit}`);
    if (res.ok && Array.isArray(res.data)) {
      return { ...res, data: res.data.map(normalizeRouteSummary) };
    }
    return res;
  }

  async startRoute(userId: string, body: StartRouteRequest) {
    return this.request<unknown>(`/routes/start?user_id=${encodeURIComponent(userId)}`, { 
      method: "POST", 
      body 
    });
  }

  async addCoordinates(routeId: string, userId: string, coordinates: AddCoordinatesRequest['coordinates']) {
    return this.request<unknown>(`/routes/${encodeURIComponent(routeId)}/coordinates?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: { coordinates },
    });
  }

  async completeRoute(routeId: string, userId: string, completion: CompleteRouteRequest) {
    const res = await this.request<any>(`/routes/${encodeURIComponent(routeId)}/complete?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: completion,
    });
    if (res.ok && res.data) {
      return { ...res, data: normalizeRouteDetail(res.data) };
    }
    return res;
  }

  async getActiveRoute(userId: string) {
    const res = await this.request<any>(`/routes/active?user_id=${encodeURIComponent(userId)}`);
    if (res.ok && res.data) {
      return { ...res, data: normalizeRouteDetail(res.data) };
    }
    return res;
  }

  async getRoute(routeId: string, userId: string) {
    const res = await this.request<any>(`/routes/${encodeURIComponent(routeId)}?user_id=${encodeURIComponent(userId)}`);
    if (res.ok && res.data) {
      return { ...res, data: normalizeRouteSummary(res.data) };
    }
    return res;
  }

  async getRouteDetail(routeId: string, userId: string) {
    const res = await this.request<any>(`/routes/${encodeURIComponent(routeId)}/detail?user_id=${encodeURIComponent(userId)}`);
    if (res.ok && res.data) {
      return { ...res, data: normalizeRouteDetail(res.data) };
    }
    return res;
  }

  async getRouteStatistics(routeId: string, userId: string) {
    return this.request<RouteStatistics>(`/routes/${encodeURIComponent(routeId)}/stats?user_id=${encodeURIComponent(userId)}`);
  }

  async getTerritoryPreview(routeId: string, userId: string) {
    return this.request<unknown>(`/routes/${encodeURIComponent(routeId)}/territory-preview?user_id=${encodeURIComponent(userId)}`);
  }

  async deleteRoute(routeId: string, userId: string) {
    return this.request<unknown>(`/routes/${encodeURIComponent(routeId)}?user_id=${encodeURIComponent(userId)}`, { 
      method: "DELETE" 
    });
  }

  async addCoordinateToRoute(routeId: string, userId: string, coordinate: { 
    latitude: number; 
    longitude: number; 
    accuracy?: number; 
    timestamp: string 
  }) {
    return this.request<unknown>(`/routes/${encodeURIComponent(routeId)}/coordinate?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: coordinate
    });
  }
}

export const routeClient = new RouteApiClient();