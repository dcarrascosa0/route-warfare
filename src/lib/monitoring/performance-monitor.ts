/**
 * Performance monitoring utility for API response times and component render performance
 * Tracks metrics and provides insights for optimization
 */

import React from 'react';
import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'api' | 'render' | 'navigation' | 'custom';
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  apiResponse: number; // ms
  componentRender: number; // ms
  navigation: number; // ms
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThresholds = {
    apiResponse: 1000, // 1 second
    componentRender: 16, // 16ms for 60fps
    navigation: 2000, // 2 seconds
  };
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    this.checkThresholds(metric);
  }

  /**
   * Check if metric exceeds thresholds and log warnings
   */
  private checkThresholds(metric: PerformanceMetric): void {
    let threshold: number | undefined;
    
    switch (metric.type) {
      case 'api':
        threshold = this.thresholds.apiResponse;
        break;
      case 'render':
        threshold = this.thresholds.componentRender;
        break;
      case 'navigation':
        threshold = this.thresholds.navigation;
        break;
    }

    if (threshold && metric.value > threshold) {
      logger.warn(`Performance threshold exceeded: ${metric.name}`, {
        component: 'performance-monitor',
        action: 'threshold-exceeded',
        duration: metric.value,
        metadata: {
          threshold,
          type: metric.type,
          ...metric.metadata,
        },
      });
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      return duration;
    };
  }

  /**
   * Measure API request performance
   */
  measureApiRequest(
    operationName: string,
    method: string,
    url: string,
    startTime: number
  ): number {
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      name: `API: ${operationName}`,
      value: duration,
      timestamp: Date.now(),
      type: 'api',
      metadata: { method, url },
    });

    return duration;
  }

  /**
   * Measure component render performance
   */
  measureComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric({
      name: `Render: ${componentName}`,
      value: renderTime,
      timestamp: Date.now(),
      type: 'render',
      metadata: { component: componentName },
    });

    logger.componentRender(componentName, renderTime);
  }

  /**
   * Measure navigation performance
   */
  measureNavigation(from: string, to: string, duration: number): void {
    this.recordMetric({
      name: `Navigation: ${from} -> ${to}`,
      value: duration,
      timestamp: Date.now(),
      type: 'navigation',
      metadata: { from, to },
    });
  }

  /**
   * Record custom performance metric
   */
  recordCustomMetric(
    metricName: string,
    value: number,
    metadata?: Record<string, any>
  ): void {
    this.recordMetric({
      name: metricName,
      value,
      timestamp: Date.now(),
      type: 'custom',
      metadata,
    });
  }

  /**
   * Get performance statistics
   */
  getStatistics(type?: PerformanceMetric['type']): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    recent: PerformanceMetric[];
  } {
    const filteredMetrics = type 
      ? this.metrics.filter(m => m.type === type)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        recent: [],
      };
    }

    const values = filteredMetrics.map(m => m.value).sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(count * 0.95);

    return {
      count,
      average: sum / count,
      min: values[0],
      max: values[count - 1],
      p95: values[p95Index] || 0,
      recent: filteredMetrics.slice(-10), // Last 10 metrics
    };
  }

  /**
   * Get slow operations above threshold
   */
  getSlowOperations(type?: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => {
      if (type && metric.type !== type) return false;
      
      let threshold: number;
      switch (metric.type) {
        case 'api':
          threshold = this.thresholds.apiResponse;
          break;
        case 'render':
          threshold = this.thresholds.componentRender;
          break;
        case 'navigation':
          threshold = this.thresholds.navigation;
          break;
        default:
          return false;
      }
      
      return metric.value > threshold;
    });
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get performance summary report
   */
  getPerformanceReport(): {
    api: ReturnType<typeof this.getStatistics>;
    render: ReturnType<typeof this.getStatistics>;
    navigation: ReturnType<typeof this.getStatistics>;
    slowOperations: PerformanceMetric[];
    thresholds: PerformanceThresholds;
  } {
    return {
      api: this.getStatistics('api'),
      render: this.getStatistics('render'),
      navigation: this.getStatistics('navigation'),
      slowOperations: this.getSlowOperations(),
      thresholds: this.thresholds,
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const startTime = performance.now();
  
  React.useEffect(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.measureComponentRender(componentName, renderTime);
  });
}

// Higher-order component for automatic render performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;
  
  const TrackedComponent = (props: P) => {
    useRenderPerformance(displayName);
    return React.createElement(WrappedComponent, props);
  };
  
  TrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  return TrackedComponent;
}