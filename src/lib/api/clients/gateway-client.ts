/**
 * Gateway API client that combines all service clients.
 */

import { AuthApiClient } from './auth-client';
import { RouteApiClient } from './route-client';
import { TerritoryApiClient } from './territory-client';
import { UserApiClient } from './user-client';
import { LeaderboardApiClient } from './leaderboard-client';
import { NotificationApiClient } from './notification-client';
import { GamificationApiClient } from './gamification-client';
import { AchievementsApiClient } from './achievements-client';

/**
 * Combined Gateway API client that provides backward compatibility
 * with the original GatewayAPI interface while using organized clients.
 */
class GatewayApiClient {
    public auth = new AuthApiClient();
    public routes = new RouteApiClient();
    public territories = new TerritoryApiClient();
    public users = new UserApiClient();
    public leaderboard = new LeaderboardApiClient();
    public notifications = new NotificationApiClient();
    public gamification = new GamificationApiClient();
    public achievements = new AchievementsApiClient();

    // Auth convenience methods
    async login(email: string, password: string) {
        return this.auth.login({ email, password });
    }

    async register(email: string, username: string, password: string) {
        return this.auth.register({ email, username, password, confirm_password: password });
    }

    async logout() {
        return this.auth.logout();
    }

    async logoutAll() {
        return this.auth.logoutAll();
    }

    async verifyToken() {
        return this.auth.verifyToken();
    }

    async me() {
        return this.auth.me();
    }

    async forgotPassword(email: string) {
        return this.auth.forgotPassword({ email });
    }

    async resetPassword(token: string, newPassword: string, confirmPassword: string) {
        return this.auth.resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword });
    }

    async verifyEmail(token: string) {
        return this.auth.verifyEmail({ token });
    }

    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
        return this.auth.changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
    }

    // User convenience methods
    async userProfile(userId: string) {
        return this.users.getUserProfile(userId);
    }

    async userStatistics(userId: string) {
        return this.users.getUserStatistics(userId);
    }

    async userStatisticsComparison(userId: string) {
        return this.users.getUserStatisticsComparison(userId);
    }

    async userStatisticsHistory(userId: string, period: string = "30d") {
        return this.users.getUserStatisticsHistory(userId, period);
    }

    async userAchievements(userId: string) {
        return this.achievements.getUserAchievements(userId, false);
    }

    async achievementProgress(userId: string, achievementId: string) {
        return this.users.getAchievementProgress(userId, achievementId);
    }

    async updateUserProfile(userId: string, profile: { username: string; email: string }) {
        return this.users.updateUserProfile(userId, profile);
    }

    // Route convenience methods
    async routesForUser(userId: string, limit = 20, status = "all") {
        return this.routes.getRoutesForUser(userId, limit, status);
    }

    async startRoute(userId: string, body: { name?: string; description?: string; start_coordinate?: any }) {
        return this.routes.startRoute(userId, body);
    }

    async addCoordinates(routeId: string, userId: string, coordinates: any[]) {
        return this.routes.addCoordinates(routeId, userId, { coordinates });
    }

    async completeRoute(routeId: string, userId:string, payload: any) {
        return this.routes.completeRoute(routeId, userId, payload);
    }

    async getActiveRoute(userId: string) {
        return this.routes.getActiveRoute(userId);
    }

    async getRoute(routeId: string, userId: string) {
        return this.routes.getRoute(routeId, userId);
    }

    async getRouteDetail(routeId: string, userId: string) {
        return this.routes.getRouteDetail(routeId, userId);
    }

    async getRouteStatistics(routeId: string, userId: string) {
        return this.routes.getRouteStatistics(routeId, userId);
    }

    async getTerritoryPreview(routeId: string, userId: string) {
        return this.routes.getTerritoryPreview(routeId, userId);
    }

    async deleteRoute(routeId: string, userId: string) {
        return this.routes.deleteRoute(routeId, userId);
    }

    async addCoordinateToRoute(routeId: string, userId: string, coordinate: { latitude: number; longitude: number; accuracy?: number; timestamp: string }) {
        return this.routes.addCoordinateToRoute(routeId, userId, coordinate);
    }

  async cleanupStuckRoutes(userId: string, maxAgeMinutes: number = 30) {
    return this.routes.cleanupStuckRoutes(userId, maxAgeMinutes);
  }

    // Territory convenience methods
    async claimTerritoryFromRoute(ownerId: string, body: { route_id: string; boundary_coordinates: Array<{ longitude: number; latitude: number }>; name?: string; description?: string }) {
        return this.territories.claimTerritoryFromRoute(ownerId, body);
    }

    async territoriesMap(params?: Record<string, string | number | boolean>) {
        return this.territories.getTerritoriesMap(params);
    }

    async getUserTerritories(userId: string) {
        return this.territories.getUserTerritories(userId);
    }

    async getTerritory(territoryId: string) {
        return this.territories.getTerritory(territoryId);
    }

    // contested removed

    async getRouteCreatedTerritories(params?: {
        claiming_method?: string;
        auto_claimed?: boolean;
        source_route_id?: string;
        owner_id?: string;
        limit?: number;
    }) {
        return this.territories.getRouteCreatedTerritories(params);
    }

    async getNearbyTerritories(latitude: number, longitude: number, radius: number = 5000) {
        return this.territories.getNearbyTerritories(latitude, longitude, radius);
    }

    async getRealTimeTerritoryPreview(coordinates: Array<{ longitude: number; latitude: number }>) {
        return this.territories.getRealTimeTerritoryPreview(coordinates);
    }

    // Territory Statistics convenience methods
    async getUserTerritoryStatistics(userId: string) {
        return this.territories.getUserTerritoryStatistics(userId);
    }

    async getGlobalTerritoryStatistics() {
        return this.territories.getGlobalTerritoryStatistics();
    }

    async getTerritoryStatistics(userId: string) {
        return this.territories.getTerritoryStatistics(userId);
    }





    // Territory Preview convenience methods
    async calculateTerritoryPreview(coordinates: Array<{ longitude: number; latitude: number }>) {
        return this.territories.calculateTerritoryPreview(coordinates);
    }

    async getTerritoryPreviewWithValidation(coordinates: Array<{ longitude: number; latitude: number }>) {
        return this.territories.getTerritoryPreviewWithValidation(coordinates);
    }

    // Territory Validation convenience methods
    async validateTerritoryClaimFromRoute(routeId: string, boundaryCoordinates: Array<{ longitude: number; latitude: number }>) {
        return this.territories.validateTerritoryClaimFromRoute(routeId, boundaryCoordinates);
    }

    async validateRouteTerritoryEligibility(routeId: string) {
        return this.territories.validateRouteTerritoryEligibility(routeId);
    }

    // Leaderboard convenience methods
    async getLeaderboard(category: string = "territory", period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getLeaderboard(category, period, start, limit);
    }

    async leaderboardRoutes(period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getLeaderboardRoutes(period, start, limit);
    }



    async leaderboardStats(category: string) {
        return this.leaderboard.getLeaderboardStats(category);
    }

    async getRoutesForAllUsers() {
        return this.routes.getRoutesForAllUsers();
    }

    async getTotalPlayers() {
        return this.leaderboard.getTotalPlayers();
    }

    // Gamification leaderboard methods
    async leaderboardXP(period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getXPLeaderboard(period, start, limit);
    }

    async leaderboardLevel(period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getLevelLeaderboard(period, start, limit);
    }

    async leaderboardAchievements(period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getAchievementsLeaderboard(period, start, limit);
    }

    async leaderboardStreak(period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getStreakLeaderboard(period, start, limit);
    }

    async leaderboardDistance(period: string = "ALL_TIME", start = 0, limit = 50) {
        return this.leaderboard.getDistanceLeaderboard(period, start, limit);
    }

    // Notification convenience methods
    async getUserNotifications(userId: string) {
        return this.notifications.getUserNotifications(userId);
    }

    async markNotificationRead(userId: string, notificationId: string) {
        return this.notifications.markNotificationRead(userId, notificationId);
    }

    async markAllNotificationsRead(userId: string) {
        return this.notifications.markAllNotificationsRead(userId);
    }

    async deleteNotification(userId: string, notificationId: string) {
        return this.notifications.deleteNotification(userId, notificationId);
    }

    async getNotificationPreferences(userId: string) {
        return this.notifications.getNotificationPreferences(userId);
    }

    async updateNotificationPreferences(userId: string, preferences: any) {
        return this.notifications.updateNotificationPreferences(userId, preferences);
    }
}

export const GatewayAPI = new GatewayApiClient();
export { GatewayApiClient };