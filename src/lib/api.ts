export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: unknown;
};

function getAccessToken(): string | null {
  try {
    return localStorage.getItem("access_token");
  } catch {
    return null;
  }
}

function joinUrl(base: string | undefined, path: string): string {
  if (!base) return path;
  const b = base.replace(/\/+$|\/$/g, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

const API_ORIGIN = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
const API_BASE = joinUrl(API_ORIGIN, "/api/v1"); // Uses VITE_API_URL when provided; falls back to relative path

export async function apiFetch<T>(
  path: string,
  options: { method?: HttpMethod; headers?: Record<string, string>; body?: unknown } = {}
): Promise<ApiResult<T>> {
  const { method = "GET", headers = {}, body } = options;

  const token = getAccessToken();

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: requestHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const payload = isJson ? await response.json() : (await response.text());

    if (!response.ok) {
      return { ok: false, status: response.status, error: payload };
    }

    return { ok: true, status: response.status, data: payload as T };
  } catch (error) {
    return { ok: false, status: 0, error };
  }
}

// Convenience helpers for specific services through the gateway
export const GatewayAPI = {
  // Auth (no token required for login/register)
  login: (email: string, password: string) =>
    apiFetch<{ user: unknown; tokens: { access_token: string; refresh_token: string } }>(
      "/auth/login",
      { method: "POST", body: { email, password } }
    ),
  register: (email: string, username: string, password: string) =>
    apiFetch<{ user: unknown }>("/auth/register", { method: "POST", body: { email, username, password, confirm_password: password } }),

  // Users
  me: (userId: string) => apiFetch<unknown>(`/users/profile?user_id=${encodeURIComponent(userId)}`),

  // Routes
  routesForUser: (userId: string, limit = 20) =>
    apiFetch<unknown>(`/routes/user/${encodeURIComponent(userId)}?limit=${limit}`),

  // Territories
  territoriesMap: (params?: Record<string, string | number | boolean>) => {
    const qs = params
      ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`
      : "";
    return apiFetch<unknown>(`/territories/map${qs}`);
  },

  // Leaderboard
  leaderboard: (category: string = "territory", period: string = "ALL_TIME", start = 0, limit = 50) =>
    apiFetch<unknown>(`/leaderboard/${category}?period=${period}&start=${start}&limit=${limit}`),
};

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


