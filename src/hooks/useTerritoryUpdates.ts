import { useCallback, useEffect, useRef, useState } from 'react';
import { Territory, TerritoryEvent } from '@/types/territory';
import { useTerritoryContext } from '@/contexts/TerritoryContext';

interface TerritoryUpdate {
  territory: Territory;
  type: TerritoryEvent['type'];
  timestamp: Date;
  isNew: boolean;
}

interface UseTerritoryUpdatesOptions {
  animationDuration?: number;
  showNotifications?: boolean;
}

interface UseTerritoryUpdatesReturn {
  recentUpdates: TerritoryUpdate[];
  animatingTerritories: Set<string>;
  updates: TerritoryUpdate[];
  clearUpdate: (territoryId: string) => void;
  clearAllUpdates: () => void;
}

export const useTerritoryUpdates = (
  options: UseTerritoryUpdatesOptions = {}
): UseTerritoryUpdatesReturn => {
  const {
    animationDuration = 3000,
    showNotifications = true,
  } = options;

  const { territories, lastUpdate } = useTerritoryContext();
  const [recentUpdates, setRecentUpdates] = useState<TerritoryUpdate[]>([]);
  const [animatingTerritories, setAnimatingTerritories] = useState<Set<string>>(new Set());
  const previousTerritoriesRef = useRef<Territory[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Enhanced territory change detection with better update classification
  useEffect(() => {
    if (!lastUpdate) return;

    const previousTerritories = previousTerritoriesRef.current;
    const currentTerritories = territories;

    // Find new, updated, and removed territories
    const updates: TerritoryUpdate[] = [];

    // Check for new territories
    currentTerritories.forEach(territory => {
      const previous = previousTerritories.find(p => p.id === territory.id);
      
      if (!previous) {
        // New territory
        updates.push({
          territory,
          type: 'territory_claimed',
          timestamp: new Date(),
          isNew: true,
        });
      } else {
        // Check for various types of updates
        let updateType: TerritoryEvent['type'] | null = null;
        let hasSignificantChange = false;

        // Status changes
        if (previous.status !== territory.status) {
          hasSignificantChange = true;
          if (territory.status === 'contested') {
            updateType = 'territory_contested';
          } else if (territory.status === 'claimed' && previous.status === 'contested') {
            updateType = 'territory_claimed'; // Conflict resolved
          }
        }

        // Ownership changes
        if (previous.owner_id !== territory.owner_id) {
          hasSignificantChange = true;
          updateType = 'territory_claimed';
        }

        // Activity changes (less significant but still noteworthy)
        if (previous.last_activity !== territory.last_activity) {
          hasSignificantChange = true;
          // Don't override more specific update types
          if (!updateType) {
            updateType = 'territory_claimed'; // Generic update
          }
        }

        // Contest count changes (indicates new attacks)
        if (previous.contest_count !== territory.contest_count && 
            territory.contest_count && territory.contest_count > (previous.contest_count || 0)) {
          hasSignificantChange = true;
          updateType = 'territory_attacked';
        }

        // Area changes (rare but possible with conflict resolution)
        if (previous.area_km2 !== territory.area_km2) {
          hasSignificantChange = true;
          if (!updateType) {
            updateType = 'territory_claimed';
          }
        }

        if (hasSignificantChange && updateType) {
          updates.push({
            territory,
            type: updateType,
            timestamp: new Date(),
            isNew: false,
          });
        }
      }
    });

    // Check for removed territories (territory lost)
    previousTerritories.forEach(previous => {
      const current = currentTerritories.find(t => t.id === previous.id);
      if (!current) {
        // Territory was removed from our view (likely lost)
        updates.push({
          territory: previous,
          type: 'territory_lost',
          timestamp: new Date(),
          isNew: false,
        });
      }
    });

    if (updates.length > 0) {
      setRecentUpdates(prev => {
        // Remove old updates for the same territories, but keep recent ones
        const now = Date.now();
        const filtered = prev.filter(update => {
          const isOld = now - update.timestamp.getTime() > animationDuration;
          const isSameTerritory = updates.some(newUpdate => newUpdate.territory.id === update.territory.id);
          return !isOld && !isSameTerritory;
        });
        return [...filtered, ...updates];
      });

      // Add territories to animation set with priority handling
      const newAnimatingIds = new Set(updates.map(u => u.territory.id));
      setAnimatingTerritories(prev => new Set([...prev, ...newAnimatingIds]));

      // Set timeouts to remove animations and updates with staggered timing
      updates.forEach((update, index) => {
        const territoryId = update.territory.id;
        
        // Clear existing timeout if any
        const existingTimeout = timeoutsRef.current.get(territoryId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Stagger timeout based on update importance
        const baseDelay = animationDuration;
        const importanceMultiplier = update.type === 'territory_attacked' ? 1.5 :
                                   update.type === 'territory_lost' ? 1.8 :
                                   update.type === 'territory_contested' ? 1.3 : 1.0;
        const staggerDelay = index * 200; // 200ms stagger between updates
        const totalDelay = baseDelay * importanceMultiplier + staggerDelay;

        // Set new timeout
        const timeout = setTimeout(() => {
          setAnimatingTerritories(prev => {
            const newSet = new Set(prev);
            newSet.delete(territoryId);
            return newSet;
          });

          setRecentUpdates(prev => 
            prev.filter(u => u.territory.id !== territoryId || u.timestamp !== update.timestamp)
          );

          timeoutsRef.current.delete(territoryId);
        }, totalDelay);

        timeoutsRef.current.set(territoryId, timeout);
      });

      // Emit custom event for external components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('territory-updates-detected', {
          detail: { updates, count: updates.length }
        }));
      }
    }

    // Update previous territories reference
    previousTerritoriesRef.current = [...currentTerritories];
  }, [territories, lastUpdate, animationDuration]);

  const clearUpdate = useCallback((territoryId: string) => {
    // Clear timeout
    const timeout = timeoutsRef.current.get(territoryId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(territoryId);
    }

    // Remove from animations
    setAnimatingTerritories(prev => {
      const newSet = new Set(prev);
      newSet.delete(territoryId);
      return newSet;
    });

    // Remove from updates
    setRecentUpdates(prev => 
      prev.filter(update => update.territory.id !== territoryId)
    );
  }, []);

  const clearAllUpdates = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    // Clear all state
    setAnimatingTerritories(new Set());
    setRecentUpdates([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return {
    recentUpdates,
    animatingTerritories,
    updates: recentUpdates,
    clearUpdate,
    clearAllUpdates,
  };
};