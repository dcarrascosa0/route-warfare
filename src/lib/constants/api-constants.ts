/**
 * API-related constants.
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_TOKEN: '/auth/verify-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  ROUTES: {
    BASE: '/routes',
    START: '/routes/start',
    ACTIVE: '/routes/active',
    USER: (userId: string) => `/routes/user/${userId}`,
    DETAIL: (routeId: string) => `/routes/${routeId}/detail`,
    COMPLETE: (routeId: string) => `/routes/${routeId}/complete`,
    COORDINATES: (routeId: string) => `/routes/${routeId}/coordinates`,
    STATISTICS: (routeId: string) => `/routes/${routeId}/stats`,
  },
  TERRITORIES: {
    BASE: '/territories',
    MAP: '/territories/map',
    CLAIM: '/territories/claim-from-route',
    USER: (userId: string) => `/territories/user/${userId}`,
    NEARBY: '/territories/nearby',
    CONTESTED: '/territories/contested',
  },
  USERS: {
    PROFILE: (userId: string) => `/users/${userId}`,
    STATISTICS: (userId: string) => `/users/${userId}/stats`,
    ACHIEVEMENTS: (userId: string) => `/users/${userId}/achievements`,
  },
  LEADERBOARD: {
    BASE: '/leaderboard',
    CATEGORY: (category: string) => `/leaderboard/${category}`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    USER: (userId: string) => `/notifications/user/${userId}`,
    WEBSOCKET: (userId: string) => `/notifications/ws/${userId}`,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const REQUEST_TIMEOUTS = {
  DEFAULT: 10000,
  UPLOAD: 30000,
  DOWNLOAD: 60000,
} as const;