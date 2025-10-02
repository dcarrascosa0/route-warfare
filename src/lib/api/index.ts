/**
 * API client modules with consistent interfaces.
 */

export * from './clients';
export * from './types';
export * from './utils';
export * from './config';

// Re-export the main GatewayAPI for backward compatibility
export { GatewayAPI } from './clients/gateway-client';

// Re-export individual clients for direct access
export { authClient } from './clients/auth-client';
export { routeClient } from './clients/route-client';
export { territoryClient } from './clients/territory-client';
export { userClient } from './clients/user-client';
export { leaderboardClient } from './clients/leaderboard-client';
export { notificationClient } from './clients/notification-client';
export { gamificationClient } from './clients/gamification-client';
export { achievementsClient } from './clients/achievements-client';

// Re-export utility functions for backward compatibility
export { 
  getNotificationsWsUrl, 
  getTerritoryWsUrl, 
  getGlobalTerritoryWsUrl,
  getGamificationWsUrl,
  getGlobalGamificationWsUrl 
} from './utils/websocket-utils';
export { normalizeRouteSummary, normalizeRouteDetail } from './utils/data-normalizers';