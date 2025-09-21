import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Filter, Search, Settings } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'unread' | 'territory' | 'route' | 'achievement' | 'system';
type SortType = 'newest' | 'oldest' | 'priority';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isConnected,
    connectionError,
  } = useNotifications();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      // Apply filter
      switch (filter) {
        case 'unread':
          return notification.status !== 'READ';
        case 'territory':
          return notification.type === 'TERRITORY_CLAIMED' || notification.type === 'TERRITORY_ATTACKED';
        case 'route':
          return notification.type === 'ROUTE_COMPLETED';
        case 'achievement':
          return notification.type === 'ACHIEVEMENT_UNLOCKED';
        case 'system':
          return notification.type === 'SYSTEM_ANNOUNCEMENT';
        default:
          return true;
      }
    })
    .filter(notification => {
      // Apply search
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Apply sort
      switch (sort) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority':
          const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'TERRITORY_CLAIMED':
      case 'TERRITORY_ATTACKED':
        return '🏰';
      case 'ROUTE_COMPLETED':
        return '🛣️';
      case 'ACHIEVEMENT_UNLOCKED':
        return '🏆';
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢';
      default:
        return '📝';
    }
  };
  
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-red-500 bg-red-50';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50';
      case 'NORMAL':
        return 'border-l-blue-500 bg-blue-50';
      case 'LOW':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Connection Status */}
        {!isConnected && (
          <div className="p-3 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              {connectionError ? 'Connection error' : 'Connecting...'}
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="p-4 border-b space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter and Sort */}
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="territory">Territory</option>
              <option value="route">Routes</option>
              <option value="achievement">Achievements</option>
              <option value="system">System</option>
            </select>
            
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            
            <button
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {notifications.length === 0 ? (
                <>
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">You'll see game events here</p>
                </>
              ) : (
                <>
                  <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications match your filter</p>
                  <p className="text-sm mt-1">Try adjusting your search or filter</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors
                    ${getPriorityColor(notification.priority)}
                    ${notification.status === 'READ' ? 'opacity-75' : ''}
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.status !== 'READ' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {/* Additional data */}
                      {notification.data && (
                        <div className="mt-2 text-xs text-gray-500">
                          {notification.type === 'TERRITORY_CLAIMED' && notification.data.territory_name && (
                            <span>Territory: {notification.data.territory_name}</span>
                          )}
                          {notification.type === 'ROUTE_COMPLETED' && notification.data.distance && (
                            <span>Distance: {notification.data.distance}m</span>
                          )}
                          {notification.type === 'ACHIEVEMENT_UNLOCKED' && notification.data.achievement_name && (
                            <span>Achievement: {notification.data.achievement_name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;