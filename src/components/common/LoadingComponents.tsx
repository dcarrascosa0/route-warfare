import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Skeleton component
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    />
  );
};

// Predefined skeleton patterns for common content types
export const LoadingSkeleton = {
  // Text content skeletons
  Text: ({ lines = 3, className }: { lines?: number; className?: string }) => (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full' // Last line is shorter
          )}
        />
      ))}
    </div>
  ),

  // Card content skeleton
  Card: ({ className }: { className?: string }) => (
    <div className={cn('rounded-lg border p-6 space-y-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" /> {/* Title */}
        <Skeleton className="h-4 w-2/3" /> {/* Subtitle */}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" /> {/* Button */}
        <Skeleton className="h-8 w-20" /> {/* Button */}
      </div>
    </div>
  ),

  // User profile skeleton
  UserProfile: ({ className }: { className?: string }) => (
    <div className={cn('flex items-center space-x-4', className)}>
      <Skeleton className="h-12 w-12 rounded-full" /> {/* Avatar */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Name */}
        <Skeleton className="h-3 w-24" /> {/* Email/subtitle */}
      </div>
    </div>
  ),

  // Statistics skeleton
  Stats: ({ className }: { className?: string }) => (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-8 w-16 mx-auto" /> {/* Number */}
          <Skeleton className="h-3 w-20 mx-auto" /> {/* Label */}
        </div>
      ))}
    </div>
  ),

  // List item skeleton
  ListItem: ({ className }: { className?: string }) => (
    <div className={cn('flex items-center justify-between p-4 border-b', className)}>
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded" /> {/* Icon */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" /> {/* Title */}
          <Skeleton className="h-3 w-24" /> {/* Subtitle */}
        </div>
      </div>
      <Skeleton className="h-6 w-16" /> {/* Action/status */}
    </div>
  ),

  // Table skeleton
  Table: ({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) => (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  ),

  // Map skeleton
  Map: ({ className }: { className?: string }) => (
    <div className={cn('relative rounded-lg overflow-hidden', className)}>
      <Skeleton className="w-full h-64 md:h-96" />
      {/* Map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      {/* Legend */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  ),

  // Dashboard skeleton
  Dashboard: ({ className }: { className?: string }) => (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" /> {/* Welcome message */}
        <Skeleton className="h-4 w-32" /> {/* Subtitle */}
      </div>
      
      {/* Stats grid */}
      <LoadingSkeleton.Stats />
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingSkeleton.Card />
        <LoadingSkeleton.Card />
      </div>
      
      {/* Recent activity */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" /> {/* Section title */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton.ListItem key={i} />
          ))}
        </div>
      </div>
    </div>
  ),

  // Leaderboard skeleton
  Leaderboard: ({ className }: { className?: string }) => (
    <div className={cn('space-y-4', className)}>
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" /> {/* Title */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" /> {/* Filter button */}
          <Skeleton className="h-8 w-20" /> {/* Filter button */}
        </div>
      </div>
      
      {/* Leaderboard entries */}
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-6 rounded" /> {/* Rank */}
              <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" /> {/* Name */}
                <Skeleton className="h-3 w-16" /> {/* Score */}
              </div>
            </div>
            <Skeleton className="h-4 w-12" /> {/* Points */}
          </div>
        ))}
      </div>
    </div>
  ),
};

// Progressive Loader component
interface ProgressiveLoaderProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialBatchSize?: number;
  batchSize?: number;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  threshold?: number; // Distance from bottom to trigger auto-load
  autoLoad?: boolean;
}

export function ProgressiveLoader<T>({
  items,
  renderItem,
  initialBatchSize = 10,
  batchSize = 5,
  loadingComponent,
  emptyComponent,
  className,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  threshold = 200,
  autoLoad = false,
}: ProgressiveLoaderProps<T>) {
  const [displayCount, setDisplayCount] = useState(initialBatchSize);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (displayCount < items.length) {
      setDisplayCount(prev => Math.min(prev + batchSize, items.length));
    } else if (hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [displayCount, items.length, batchSize, hasMore, onLoadMore, isLoading]);

  // Auto-load when scrolling near bottom
  useEffect(() => {
    if (!autoLoad) return;

    const handleScroll = () => {
      if (isLoading || isAutoLoading) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsAutoLoading(true);
        loadMore();
        setTimeout(() => setIsAutoLoading(false), 1000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoLoad, isLoading, isAutoLoading, threshold, loadMore]);

  // Reset display count when items change
  useEffect(() => {
    setDisplayCount(Math.min(initialBatchSize, items.length));
  }, [items, initialBatchSize]);

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        {emptyComponent || <p className="text-muted-foreground">No items to display</p>}
      </div>
    );
  }

  const displayedItems = items.slice(0, displayCount);
  const canLoadMore = displayCount < items.length || hasMore;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Rendered items */}
      <div className="space-y-2">
        {displayedItems.map((item, index) => renderItem(item, index))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-4">
          {loadingComponent || <LoadingSpinner />}
        </div>
      )}

      {/* Load more button */}
      {!autoLoad && canLoadMore && !isLoading && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            className="flex items-center gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Load More ({items.length - displayCount} remaining)
          </Button>
        </div>
      )}

      {/* Auto-loading indicator */}
      {autoLoad && isAutoLoading && (
        <div className="flex justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" />
            Loading more...
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!canLoadMore && items.length > initialBatchSize && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Showing all {items.length} items
          </p>
        </div>
      )}
    </div>
  );
}