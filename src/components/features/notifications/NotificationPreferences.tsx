import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Volume2, VolumeX, Smartphone, Mail, MessageSquare } from 'lucide-react';

interface NotificationPreferences {
  notifications_enabled: boolean;
  websocket_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  type_preferences: {
    territory_claimed: boolean;
    territory_attacked: boolean;
    route_completed: boolean;
    achievement_unlocked: boolean;
    system_announcement: boolean;
  };
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  initialPreferences?: Partial<NotificationPreferences>;
}

const defaultPreferences: NotificationPreferences = {
  notifications_enabled: true,
  websocket_enabled: true,
  push_enabled: true,
  email_enabled: false,
  sms_enabled: false,
  type_preferences: {
    territory_claimed: true,
    territory_attacked: true,
    route_completed: true,
    achievement_unlocked: true,
    system_announcement: true,
  },
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  sound_enabled: true,
  vibration_enabled: true,
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPreferences = {},
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    setPreferences({
      ...defaultPreferences,
      ...initialPreferences,
    });
  }, [initialPreferences]);
  
  const handleChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };
  
  const handleTypePreferenceChange = (type: keyof NotificationPreferences['type_preferences'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      type_preferences: {
        ...prev.type_preferences,
        [type]: enabled,
      },
    }));
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(preferences);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = () => {
    setPreferences({
      ...defaultPreferences,
      ...initialPreferences,
    });
    setHasChanges(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* General Settings */}
              <div>
                <h3 className="text-md font-medium mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preferences.notifications_enabled ? (
                        <Bell className="w-5 h-5 text-blue-500" />
                      ) : (
                        <BellOff className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <label className="font-medium">Enable Notifications</label>
                        <p className="text-sm text-gray-600">Receive all game notifications</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifications_enabled}
                      onChange={(e) => handleChange('notifications_enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preferences.sound_enabled ? (
                        <Volume2 className="w-5 h-5 text-blue-500" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <label className="font-medium">Sound Effects</label>
                        <p className="text-sm text-gray-600">Play sounds for notifications</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.sound_enabled}
                      onChange={(e) => handleChange('sound_enabled', e.target.checked)}
                      disabled={!preferences.notifications_enabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              
              {/* Delivery Channels */}
              <div>
                <h3 className="text-md font-medium mb-4">Delivery Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <div>
                        <label className="font-medium">Real-time Notifications</label>
                        <p className="text-sm text-gray-600">Instant notifications via WebSocket</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.websocket_enabled}
                      onChange={(e) => handleChange('websocket_enabled', e.target.checked)}
                      disabled={!preferences.notifications_enabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-blue-500" />
                      <div>
                        <label className="font-medium">Push Notifications</label>
                        <p className="text-sm text-gray-600">Browser push notifications</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.push_enabled}
                      onChange={(e) => handleChange('push_enabled', e.target.checked)}
                      disabled={!preferences.notifications_enabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <label className="font-medium">Email Notifications</label>
                        <p className="text-sm text-gray-600">Important updates via email</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.email_enabled}
                      onChange={(e) => handleChange('email_enabled', e.target.checked)}
                      disabled={!preferences.notifications_enabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              
              {/* Notification Types */}
              <div>
                <h3 className="text-md font-medium mb-4">Notification Types</h3>
                <div className="space-y-4">
                  {Object.entries(preferences.type_preferences).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div>
                        <label className="font-medium capitalize">
                          {type.replace(/_/g, ' ')}
                        </label>
                        <p className="text-sm text-gray-600">
                          {type === 'territory_claimed' && 'When you claim a new territory'}
                          {type === 'territory_attacked' && 'When your territory is under attack'}
                          {type === 'route_completed' && 'When you complete a route'}
                          {type === 'achievement_unlocked' && 'When you unlock achievements'}
                          {type === 'system_announcement' && 'Important system messages'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleTypePreferenceChange(type as keyof NotificationPreferences['type_preferences'], e.target.checked)}
                        disabled={!preferences.notifications_enabled}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quiet Hours */}
              <div>
                <h3 className="text-md font-medium mb-4">Quiet Hours</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Enable Quiet Hours</label>
                      <p className="text-sm text-gray-600">Reduce notifications during specified hours</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.quiet_hours_enabled}
                      onChange={(e) => handleChange('quiet_hours_enabled', e.target.checked)}
                      disabled={!preferences.notifications_enabled}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  
                  {preferences.quiet_hours_enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Time</label>
                        <input
                          type="time"
                          value={preferences.quiet_hours_start}
                          onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Time</label>
                        <input
                          type="time"
                          value={preferences.quiet_hours_end}
                          onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset to Defaults
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPreferences;