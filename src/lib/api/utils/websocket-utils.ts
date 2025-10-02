/**
 * WebSocket utilities for API connections.
 */

import { joinUrl } from '../config';

export function getNotificationsWsUrl(userId: string, token?: string): string {
  const WS_ORIGIN = (import.meta as any)?.env?.VITE_WS_URL as string | undefined;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const base = WS_ORIGIN || `${isSecure ? "wss" : "ws"}://${window.location.host}`;
  const url = new URL(joinUrl(base, `/api/v1/notifications/ws/${encodeURIComponent(userId)}`));
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function getTerritoryWsUrl(userId: string, token?: string): string {
  const WS_ORIGIN = (import.meta as any)?.env?.VITE_WS_URL as string | undefined;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const base = WS_ORIGIN || `${isSecure ? "wss" : "ws"}://${window.location.host}`;
  const url = new URL(joinUrl(base, `/api/v1/territories/ws/territory/${encodeURIComponent(userId)}`));
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function getGlobalTerritoryWsUrl(token?: string): string {
  const WS_ORIGIN = (import.meta as any)?.env?.VITE_WS_URL as string | undefined;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const base = WS_ORIGIN || `${isSecure ? "wss" : "ws"}://${window.location.host}`;
  const url = new URL(joinUrl(base, `/api/v1/territories/ws/global`));
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function getGamificationWsUrl(userId: string, token?: string): string {
  const WS_ORIGIN = (import.meta as any)?.env?.VITE_WS_URL as string | undefined;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const base = WS_ORIGIN || `${isSecure ? "wss" : "ws"}://${window.location.host}`;
  const url = new URL(joinUrl(base, `/api/v1/gamification/ws/${encodeURIComponent(userId)}`));
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function getGlobalGamificationWsUrl(token?: string): string {
  const WS_ORIGIN = (import.meta as any)?.env?.VITE_WS_URL as string | undefined;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const base = WS_ORIGIN || `${isSecure ? "wss" : "ws"}://${window.location.host}`;
  const url = new URL(joinUrl(base, `/api/v1/gamification/ws/global`));
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}