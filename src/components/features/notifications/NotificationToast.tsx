import React, { useEffect, useState } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info, Trophy, MapPin, Route } from 'lucide-react';
import { Notification } from '@/contexts/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'TERRITORY_CLAIMED':
    case 'TERRITORY_ATTACKED':
      return MapPin;
    case 'ROUTE_COMPLETED':
      return Route;
    case 'ACHIEVEMENT_UNLOCKED':
      return Trophy;
    case 'SYSTEM_ANNOUNCEMENT':
      return Bell;
    default:
      return Info;
  }
};

const getNotificationColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'URGENT':
      return 'border-red-500 bg-red-50 text-red-900';
    case 'HIGH':
      return 'border-orange-500 bg-orange-50 text-orange-900';
    case 'NORMAL':
      return 'border-blue-500 bg-blue-50 text-blue-900';
    case 'LOW':
      return 'border-gray-500 bg-gray-50 text-gray-900';
    default:
      return 'border-blue-500 bg-blue-50 text-blue-900';
  }
};

const getProgressBarColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-500';
    case 'HIGH':
      return 'bg-orange-500';
    case 'NORMAL':
      return 'bg-blue-500';
    case 'LOW':
      return 'bg-gray-500';
    default:
      return 'bg-blue-500';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onMarkAsRead,
  autoClose = true,
  autoCloseDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = getNotificationIcon(notification.type);
  const colorClasses = getNotificationColor(notification.priority);
  const progressColor = getProgressBarColor(notification.priority);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!autoClose) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, autoCloseDelay - elapsed);
      const newProgress = (remaining / autoCloseDelay) * 100;

      setProgress(newProgress);

      if (remaining <= 0) {
        handleClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      if (notification.status !== 'READ') {
        onMarkAsRead?.(notification.id);
      }
    }, 300);
  };

  const handleClick = () => {
    if (notification.status !== 'READ') {
      onMarkAsRead?.(notification.id);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 w-96 max-w-sm
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          relative border-l-4 rounded-lg shadow-lg p-4 cursor-pointer
          ${colorClasses}
          hover:shadow-xl transition-shadow duration-200
        `}
        onClick={handleClick}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight">
              {notification.title}
            </h4>
            <p className="text-xs opacity-75 mt-0.5">
              {formatTimeAgo(notification.created_at)}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="ml-8">
          <p className="text-sm leading-relaxed">
            {notification.message}
          </p>

          {/* Additional data */}
          {notification.data && (
            <div className="mt-2 text-xs opacity-75">
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

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ease-linear ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Priority indicator */}
        {notification.priority === 'URGENT' && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationToast;