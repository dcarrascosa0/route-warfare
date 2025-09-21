import { useEffect, useRef, useCallback } from 'react';

interface TouchGestureOptions {
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  threshold?: {
    pinch: number;
    pan: number;
    longPress: number;
  };
}

interface TouchPoint {
  x: number;
  y: number;
  id: number;
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: TouchGestureOptions = {}
) {
  const {
    onPinch,
    onPan,
    onTap,
    onDoubleTap,
    onLongPress,
    threshold = {
      pinch: 0.1,
      pan: 10,
      longPress: 500,
    },
  } = options;

  const gestureState = useRef({
    touches: new Map<number, TouchPoint>(),
    initialDistance: 0,
    initialCenter: { x: 0, y: 0 },
    lastTapTime: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    isPanning: false,
    isPinching: false,
    lastPanPosition: { x: 0, y: 0 },
  });

  const getDistance = useCallback((touch1: TouchPoint, touch2: TouchPoint): number => {
    const dx = touch1.x - touch2.x;
    const dy = touch1.y - touch2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1: TouchPoint, touch2: TouchPoint): { x: number; y: number } => {
    return {
      x: (touch1.x + touch2.x) / 2,
      y: (touch1.y + touch2.y) / 2,
    };
  }, []);

  const getTouchPoint = useCallback((touch: Touch): TouchPoint => {
    const rect = elementRef.current?.getBoundingClientRect();
    return {
      x: touch.clientX - (rect?.left || 0),
      y: touch.clientY - (rect?.top || 0),
      id: touch.identifier,
    };
  }, [elementRef]);

  const clearLongPressTimer = useCallback(() => {
    if (gestureState.current.longPressTimer) {
      clearTimeout(gestureState.current.longPressTimer);
      gestureState.current.longPressTimer = null;
    }
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    const touches = Array.from(event.touches).map(getTouchPoint);
    
    // Clear existing touches and add new ones
    gestureState.current.touches.clear();
    touches.forEach(touch => {
      gestureState.current.touches.set(touch.id, touch);
    });

    if (touches.length === 1) {
      // Single touch - potential tap or pan
      const touch = touches[0];
      gestureState.current.lastPanPosition = { x: touch.x, y: touch.y };
      
      // Start long press timer
      if (onLongPress) {
        gestureState.current.longPressTimer = setTimeout(() => {
          onLongPress(touch.x, touch.y);
        }, threshold.longPress);
      }
    } else if (touches.length === 2) {
      // Two touches - potential pinch
      clearLongPressTimer();
      const [touch1, touch2] = touches;
      gestureState.current.initialDistance = getDistance(touch1, touch2);
      gestureState.current.initialCenter = getCenter(touch1, touch2);
      gestureState.current.isPinching = true;
    }
  }, [getTouchPoint, onLongPress, threshold.longPress, getDistance, getCenter, clearLongPressTimer]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    const touches = Array.from(event.touches).map(getTouchPoint);
    
    if (touches.length === 1 && !gestureState.current.isPinching) {
      // Single touch movement - panning
      const touch = touches[0];
      const lastPos = gestureState.current.lastPanPosition;
      
      const deltaX = touch.x - lastPos.x;
      const deltaY = touch.y - lastPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > threshold.pan) {
        clearLongPressTimer();
        gestureState.current.isPanning = true;
        
        if (onPan) {
          onPan(deltaX, deltaY);
        }
        
        gestureState.current.lastPanPosition = { x: touch.x, y: touch.y };
      }
    } else if (touches.length === 2 && gestureState.current.isPinching) {
      // Two touch movement - pinching
      const [touch1, touch2] = touches;
      const currentDistance = getDistance(touch1, touch2);
      const currentCenter = getCenter(touch1, touch2);
      
      const scale = currentDistance / gestureState.current.initialDistance;
      
      if (Math.abs(scale - 1) > threshold.pinch && onPinch) {
        onPinch(scale, currentCenter);
      }
    }
  }, [getTouchPoint, threshold.pan, threshold.pinch, onPan, onPinch, getDistance, getCenter, clearLongPressTimer]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    clearLongPressTimer();
    
    const remainingTouches = Array.from(event.touches).map(getTouchPoint);
    
    // If no touches remain and we weren't panning/pinching, it might be a tap
    if (remainingTouches.length === 0 && !gestureState.current.isPanning && !gestureState.current.isPinching) {
      const touch = Array.from(gestureState.current.touches.values())[0];
      if (touch) {
        const now = Date.now();
        const timeSinceLastTap = now - gestureState.current.lastTapTime;
        
        if (timeSinceLastTap < 300 && onDoubleTap) {
          // Double tap
          onDoubleTap(touch.x, touch.y);
        } else if (onTap) {
          // Single tap
          onTap(touch.x, touch.y);
        }
        
        gestureState.current.lastTapTime = now;
      }
    }
    
    // Reset gesture state
    gestureState.current.touches.clear();
    gestureState.current.isPanning = false;
    gestureState.current.isPinching = false;
  }, [getTouchPoint, onTap, onDoubleTap, clearLongPressTimer]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, clearLongPressTimer]);

  return {
    isGesturing: gestureState.current.isPanning || gestureState.current.isPinching,
  };
}