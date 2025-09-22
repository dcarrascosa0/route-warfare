/**
 * Route API client.
 */

import { BaseApiClient } from './base-client';
import type { Route, RouteDetail, StartRouteRequest, AddCoordinatesRequest, CompleteRouteRequest, RouteStatistics } from '../types';
import { normalizeRouteSummary, normalizeRouteDetail } from '../utils/data-normalizers.ts';

export class RouteApiClient extends BaseApiClient {
  async getRoutesForUser(userId: string, limit = 20, status = "all") {
    const res = await this.request<any[]>(`/routes/user/${encodeURIComponent(userId)}?limit=${limit}&status=${status}`);
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

  async addCoordinates(routeId: string, userId: string, coordinates: any) {
    return this.request(`/routes/${routeId}/coordinates?user_id=${userId}`, { method: 'POST', body: coordinates });
  }

  async completeRoute(routeId: string, userId: string, payload: any) {
    return this.request(`/routes/${routeId}/complete?user_id=${userId}`, { method: 'POST', body: payload });
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

  async cleanupStuckRoutes(userId: string, maxAgeMinutes: number = 30) {
    return this.request<unknown>(`/routes/cleanup-stuck?user_id=${encodeURIComponent(userId)}&max_age_minutes=${encodeURIComponent(String(maxAgeMinutes))}`, {
      method: "POST",
    });
  }
}

export const routeClient = new RouteApiClient();