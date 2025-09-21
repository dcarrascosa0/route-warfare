import React, { useState } from 'react';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { NotificationToast, NotificationCenter, NotificationPreferences } from '@/components/features/notifications';
import { Bell, Settings } from 'lucide-react';

/**
 * Example component demonstrating the notification system integration.
 * This shows how to use the NotificationProvider, hooks, and components together.
 */

const NotificationDemo: React.FC = () => {
    const {
        notifications,
        unreadCount,
        isConnected,
        connectionError,
        markAsRead,
        markAllAsRead,
        clearNotifications,
    } = useNotifications();

    const [showCenter, setShowCenter] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [toastNotifications, setToastNotifications] = useState<any[]>([]);

    // Handle new notifications for toast display
    React.useEffect(() => {
        if (notifications.length > toastNotifications.length) {
            const newNotifications = notifications.slice(0, notifications.length - toastNotifications.length);
            setToastNotifications(prev => [...newNotifications, ...prev]);
        }
    }, [notifications, toastNotifications.length]);

    const removeToast = (id: string) => {
        setToastNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleSavePreferences = async (preferences: any) => {
        // In a real app, this would save to the backend
        console.log('Saving preferences:', preferences);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Notification System Demo</h1>

            {/* Connection Status */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    {connectionError && (
                        <span className="text-red-600 text-sm">({connectionError})</span>
                    )}
                </div>
            </div>

            {/* Notification Stats */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Notification Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Total Notifications:</span>
                        <div className="text-2xl font-bold">{notifications.length}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Unread:</span>
                        <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mb-6 flex gap-4">
                <button
                    onClick={() => setShowCenter(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <Bell className="w-4 h-4" />
                    Open Notification Center
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setShowPreferences(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    Preferences
                </button>

                <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Mark All Read
                </button>

                <button
                    onClick={clearNotifications}
                    disabled={notifications.length === 0}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Clear All
                </button>
            </div>

            {/* Recent Notifications */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
                {notifications.length === 0 ? (
                    <p className="text-gray-500">No notifications yet. Connect to WebSocket to receive real-time notifications.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${notification.status === 'READ' ? 'opacity-75' : 'border-blue-500'
                                    }`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium">{notification.title}</h4>
                                        <p className="text-sm text-gray-600">{notification.message}</p>
                                        <span className="text-xs text-gray-400">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {notification.status !== 'READ' && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toast Notifications */}
            {toastNotifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={() => removeToast(notification.id)}
                    onMarkAsRead={markAsRead}
                    autoClose={true}
                    autoCloseDelay={5000}
                />
            ))}

            {/* Notification Center */}
            <NotificationCenter
                isOpen={showCenter}
                onClose={() => setShowCenter(false)}
            />

            {/* Notification Preferences */}
            <NotificationPreferences
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
                onSave={handleSavePreferences}
                initialPreferences={{
                    notifications_enabled: true,
                    websocket_enabled: true,
                    sound_enabled: true,
                }}
            />
        </div>
    );
};

/**
 * Main example component with NotificationProvider wrapper.
 * This demonstrates the complete setup needed to use the notification system.
 */
export const NotificationSystemExample: React.FC = () => {
    return (
        <NotificationProvider
            onNotification={(notification) => {
                console.log('New notification received:', notification);
            }}
            onTerritoryUpdate={(data) => {
                console.log('Territory update:', data);
            }}
            onRouteComplete={(data) => {
                console.log('Route completed:', data);
            }}
            onAchievementUnlocked={(data) => {
                console.log('Achievement unlocked:', data);
            }}
        >
            <NotificationDemo />
        </NotificationProvider>
    );
};

export default NotificationSystemExample;