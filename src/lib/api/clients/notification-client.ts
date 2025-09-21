/**
 * Notification API client.
 */

import { BaseApiClient } from './base-client';
import type { Notification, NotificationPreferences } from '../types';

export class NotificationApiClient extends BaseApiClient {
  async getUserNotifications(userId: string) {
    return this.request<Notification[]>(`/notifications/user/${encodeURIComponent(userId)}`);
  }

  async markNotificationRead(userId: string, notificationId: string) {
    return this.request<unknown>(`/notifications/user/${encodeURIComponent(userId)}/read/${encodeURIComponent(notificationId)}`, { 
      method: "PUT" 
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.request<unknown>(`/notifications/user/${encodeURIComponent(userId)}/read-all`, { 
      method: "PUT" 
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    return this.request<unknown>(`/notifications/user/${encodeURIComponent(userId)}/${encodeURIComponent(notificationId)}`, { 
      method: "DELETE" 
    });
  }

  async getNotificationPreferences(userId: string) {
    return this.request<NotificationPreferences>(`/notifications/user/${encodeURIComponent(userId)}/preferences`);
  }

  async updateNotificationPreferences(userId: string, preferences: NotificationPreferences) {
    return this.request<unknown>(`/notifications/user/${encodeURIComponent(userId)}/preferences`, { 
      method: "PUT", 
      body: preferences 
    });
  }
}

export const notificationClient = new NotificationApiClient();