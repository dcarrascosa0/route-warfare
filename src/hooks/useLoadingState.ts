import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  progress?: number;
}

export interface LoadingStateManager {
  isLoading: boolean;
  error: Error | null;
  progress?: number;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  setError: (error: Error | null, key?: string) => void;
  setProgress: (progress: number, key?: string) => void;
  reset: (key?: string) => void;
  isLoadingKey: (key: string) => boolean;
  getLoadingKeys: () => string[];
}

export const useLoadingState = (initialLoading = false): LoadingStateManager => {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(
    () => new Map([['default', { isLoading: initialLoading, error: null }]])
  );
  
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const startLoading = useCallback((key = 'default') => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(key) || { isLoading: false, error: null };
      newMap.set(key, { ...currentState, isLoading: true, error: null });
      return newMap;
    });

    // Clear any existing timeout for this key
    const existingTimeout = timeoutRefs.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set a timeout to automatically stop loading after 30 seconds (safety net)
    const timeout = setTimeout(() => {
      console.warn(`Loading state for key "${key}" has been active for 30 seconds. Auto-stopping.`);
      stopLoading(key);
    }, 30000);
    
    timeoutRefs.current.set(key, timeout);
  }, []);

  const stopLoading = useCallback((key = 'default') => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(key) || { isLoading: false, error: null };
      newMap.set(key, { ...currentState, isLoading: false });
      return newMap;
    });

    // Clear timeout for this key
    const timeout = timeoutRefs.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(key);
    }
  }, []);

  const setError = useCallback((error: Error | null, key = 'default') => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(key) || { isLoading: false, error: null };
      newMap.set(key, { ...currentState, error, isLoading: false });
      return newMap;
    });

    // Clear timeout when error is set
    const timeout = timeoutRefs.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(key);
    }
  }, []);

  const setProgress = useCallback((progress: number, key = 'default') => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(key) || { isLoading: false, error: null };
      newMap.set(key, { ...currentState, progress: Math.max(0, Math.min(100, progress)) });
      return newMap;
    });
  }, []);

  const reset = useCallback((key = 'default') => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      newMap.set(key, { isLoading: false, error: null, progress: undefined });
      return newMap;
    });

    // Clear timeout for this key
    const timeout = timeoutRefs.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(key);
    }
  }, []);

  const isLoadingKey = useCallback((key: string) => {
    return loadingStates.get(key)?.isLoading || false;
  }, [loadingStates]);

  const getLoadingKeys = useCallback(() => {
    return Array.from(loadingStates.keys()).filter(key => loadingStates.get(key)?.isLoading);
  }, [loadingStates]);

  // Compute overall loading state (any key is loading)
  const isLoading = Array.from(loadingStates.values()).some(state => state.isLoading);
  
  // Get the first error found
  const error = Array.from(loadingStates.values()).find(state => state.error)?.error || null;
  
  // Get average progress if any states have progress
  const progressStates = Array.from(loadingStates.values()).filter(state => state.progress !== undefined);
  const progress = progressStates.length > 0 
    ? progressStates.reduce((sum, state) => sum + (state.progress || 0), 0) / progressStates.length
    : undefined;

  return {
    isLoading,
    error,
    progress,
    startLoading,
    stopLoading,
    setError,
    setProgress,
    reset,
    isLoadingKey,
    getLoadingKeys,
  };
};

// Hook for coordinating multiple related loading states
export const useCoordinatedLoading = (keys: string[]) => {
  const loadingManager = useLoadingState();

  const startAll = useCallback(() => {
    keys.forEach(key => loadingManager.startLoading(key));
  }, [keys, loadingManager]);

  const stopAll = useCallback(() => {
    keys.forEach(key => loadingManager.stopLoading(key));
  }, [keys, loadingManager]);

  const resetAll = useCallback(() => {
    keys.forEach(key => loadingManager.reset(key));
  }, [keys, loadingManager]);

  const isAnyLoading = keys.some(key => loadingManager.isLoadingKey(key));
  const areAllLoading = keys.every(key => loadingManager.isLoadingKey(key));

  return {
    ...loadingManager,
    startAll,
    stopAll,
    resetAll,
    isAnyLoading,
    areAllLoading,
  };
};

// Hook for progressive loading with stages
export const useProgressiveLoading = (stages: string[]) => {
  const [currentStage, setCurrentStage] = useState(0);
  const loadingManager = useLoadingState();

  const nextStage = useCallback(() => {
    if (currentStage < stages.length - 1) {
      const currentKey = stages[currentStage];
      const nextKey = stages[currentStage + 1];
      
      loadingManager.stopLoading(currentKey);
      loadingManager.startLoading(nextKey);
      setCurrentStage(prev => prev + 1);
    }
  }, [currentStage, stages, loadingManager]);

  const startProgressive = useCallback(() => {
    setCurrentStage(0);
    loadingManager.reset();
    if (stages.length > 0) {
      loadingManager.startLoading(stages[0]);
    }
  }, [stages, loadingManager]);

  const completeProgressive = useCallback(() => {
    stages.forEach(stage => loadingManager.stopLoading(stage));
    setCurrentStage(stages.length);
  }, [stages, loadingManager]);

  const currentStageKey = stages[currentStage];
  const isComplete = currentStage >= stages.length;
  const progressPercentage = stages.length > 0 ? (currentStage / stages.length) * 100 : 0;

  return {
    ...loadingManager,
    currentStage,
    currentStageKey,
    isComplete,
    progressPercentage,
    nextStage,
    startProgressive,
    completeProgressive,
  };
};