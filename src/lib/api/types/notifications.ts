/**
 * Notification API types.
 */

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  territory_updates: boolean;
  route_completions: boolean;
  achievement_unlocks: boolean;
  leaderboard_changes: boolean;
}