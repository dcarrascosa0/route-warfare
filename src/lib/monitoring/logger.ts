/**
 * Logger utility with structured logging and correlation ID tracking
 * Provides consistent logging across the application with performance monitoring
 */

export interface LogContext {
  correlationId?: string;
  userId?: string;
  component?: string;
  action?: string;
  duration?: number;
  error?: Error | string;
  metadata?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  environment: string;
  version: string;
}

class Logger {
  private correlationId: string | null = null;
  private userId: string | null = null;
  private environment: string;
  private version: string;
  private isDevelopment: boolean;

  constructor() {
    this.environment = import.meta.env.MODE || 'development';
    this.version = import.meta.env.VITE_APP_VERSION || '1.0.0';
    this.isDevelopment = this.environment === 'development';
  }

  /**
   * Set correlation ID for request tracking
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Set user ID for user-specific logging
   */
  setUserId(id: string): void {
    this.userId = id;
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.setCorrelationId(id);
    return id;
  }

  /**
   * Clear correlation and user context
   */
  clearContext(): void {
    this.correlationId = null;
    this.userId = null;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        correlationId: context.correlationId || this.correlationId || undefined,
        userId: context.userId || this.userId || undefined,
        ...context,
      },
      environment: this.environment,
      version: this.version,
    };
  }

  /**
   * Output log entry to console and external services
   */
  private output(entry: LogEntry): void {
    // Console output for development
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(entry.level);
      console.log(
        `%c[${entry.level.toUpperCase()}] ${entry.message}`,
        style,
        entry.context
      );
    }

    // Send to external logging service in production
    if (!this.isDevelopment && entry.level !== 'debug') {
      this.sendToExternalService(entry);
    }

    // Store in local storage for debugging (limited entries)
    this.storeLocally(entry);
  }

  /**
   * Get console styling for log levels
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };
    return styles[level];
  }

  /**
   * Send log entry to external monitoring service
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to services like:
      // - Sentry for error tracking
      // - LogRocket for session replay
      // - DataDog for application monitoring
      
      if (entry.level === 'error') {
        // Send errors to error tracking service
        console.error('Error logged:', entry);
      }
    } catch (error) {
      // Fail silently to avoid logging loops
      console.warn('Failed to send log to external service:', error);
    }
  }

  /**
   * Store log entries locally for debugging
   */
  private storeLocally(entry: LogEntry): void {
    try {
      const key = 'route-wars-logs';
      const stored = localStorage.getItem(key);
      const logs = stored ? JSON.parse(stored) : [];
      
      // Keep only last 100 entries
      logs.push(entry);
      if (logs.length > 100) {
        logs.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (error) {
      // Ignore storage errors
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('debug', message, context);
    this.output(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    this.output(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    this.output(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context);
    this.output(entry);
  }

  /**
   * Log API request start
   */
  apiRequestStart(method: string, url: string, correlationId?: string): string {
    const id = correlationId || this.generateCorrelationId();
    this.info(`API Request: ${method} ${url}`, {
      correlationId: id,
      component: 'api-client',
      action: 'request-start',
      metadata: { method, url },
    });
    return id;
  }

  /**
   * Log API request completion
   */
  apiRequestEnd(
    method: string,
    url: string,
    status: number,
    duration: number,
    correlationId?: string
  ): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${url} - ${status}`, {
      correlationId: correlationId || this.correlationId || undefined,
      component: 'api-client',
      action: 'request-end',
      duration,
      metadata: { method, url, status },
    });
  }

  /**
   * Log component render performance
   */
  componentRender(componentName: string, duration: number): void {
    if (duration > 16) { // Log slow renders (>16ms)
      this.warn(`Slow component render: ${componentName}`, {
        component: componentName,
        action: 'render',
        duration,
      });
    } else {
      this.debug(`Component render: ${componentName}`, {
        component: componentName,
        action: 'render',
        duration,
      });
    }
  }

  /**
   * Log user action
   */
  userAction(action: string, component: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      component,
      action: 'user-interaction',
      metadata,
    });
  }

  /**
   * Get stored logs for debugging
   */
  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('route-wars-logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    try {
      localStorage.removeItem('route-wars-logs');
    } catch {
      // Ignore errors
    }
  }
}

// Export singleton instance
export const logger = new Logger();