import React from 'react';
import { Loader2, MapPin, Zap, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'themed';
  className?: string;
  message?: string;
  theme?: 'gps' | 'territory' | 'leaderboard' | 'general';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  message,
  theme = 'general',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const getThemedIcon = () => {
    switch (theme) {
      case 'gps':
        return <MapPin className={cn(sizeClasses[size], 'animate-pulse')} />;
      case 'territory':
        return <Zap className={cn(sizeClasses[size], 'animate-spin')} />;
      case 'leaderboard':
        return <Trophy className={cn(sizeClasses[size], 'animate-bounce')} />;
      default:
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />;
    }
  };

  const getThemedMessage = () => {
    if (message) return message;
    
    switch (theme) {
      case 'gps':
        return 'Getting your location...';
      case 'territory':
        return 'Loading territories...';
      case 'leaderboard':
        return 'Loading rankings...';
      default:
        return 'Loading...';
    }
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-1', className)}>
        <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} />
        <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} style={{ animationDelay: '0.2s' }} />
        <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} style={{ animationDelay: '0.4s' }} />
        {message && <span className="ml-2 text-sm text-muted-foreground">{message}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className={cn('rounded-full bg-current animate-pulse', sizeClasses[size])} />
        {message && <span className="ml-2 text-sm text-muted-foreground">{message}</span>}
      </div>
    );
  }

  if (variant === 'themed') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
        {getThemedIcon()}
        <span className="text-sm text-muted-foreground">{getThemedMessage()}</span>
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
      {message && <span className="ml-2 text-sm text-muted-foreground">{message}</span>}
    </div>
  );
};

// Specialized loading components for common use cases
export const LoadingButton: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ isLoading, children, className, disabled, onClick }) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, message, children, className }) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export const LoadingPage: React.FC<{
  message?: string;
  theme?: 'gps' | 'territory' | 'leaderboard' | 'general';
}> = ({ message, theme = 'general' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner variant="themed" size="xl" theme={theme} message={message} />
    </div>
  );
};

export default LoadingSpinner;