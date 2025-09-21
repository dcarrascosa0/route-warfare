import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
        screenWidth: 1920,
        screenHeight: 1080,
        orientation: 'landscape',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait',
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait',
      });
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
}

// Utility function to get responsive class names
export function getResponsiveClasses(
  mobile: string = '',
  tablet: string = '',
  desktop: string = ''
): string {
  const classes = [];
  
  if (mobile) classes.push(mobile);
  if (tablet) classes.push(`md:${tablet}`);
  if (desktop) classes.push(`lg:${desktop}`);
  
  return classes.join(' ');
}

// Utility function for touch-friendly spacing
export function getTouchFriendlySpacing(base: string): string {
  // Convert base spacing to touch-friendly on mobile
  const spacingMap: Record<string, string> = {
    'p-1': 'p-2 sm:p-1',
    'p-2': 'p-3 sm:p-2',
    'p-3': 'p-4 sm:p-3',
    'p-4': 'p-6 sm:p-4',
    'm-1': 'm-2 sm:m-1',
    'm-2': 'm-3 sm:m-2',
    'm-3': 'm-4 sm:m-3',
    'm-4': 'm-6 sm:m-4',
    'gap-1': 'gap-2 sm:gap-1',
    'gap-2': 'gap-3 sm:gap-2',
    'gap-3': 'gap-4 sm:gap-3',
    'gap-4': 'gap-6 sm:gap-4',
  };
  
  return spacingMap[base] || base;
}