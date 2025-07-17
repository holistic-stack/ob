/**
 * @file Telemetry Service
 *
 * Provides comprehensive telemetry collection for production monitoring
 * including error tracking, performance metrics, user interactions, and
 * system health monitoring.
 *
 * @example
 * ```typescript
 * import { TelemetryService } from './telemetry.service';
 *
 * const telemetry = new TelemetryService({
 *   endpoint: 'https://api.example.com/telemetry',
 *   apiKey: 'your-api-key',
 *   enableInDevelopment: false,
 * });
 *
 * // Track errors
 * telemetry.trackError(error, { context: 'parsing' });
 *
 * // Track performance
 * telemetry.trackPerformance('render_time', 16.5, { model: 'cube' });
 *
 * // Track user interactions
 * telemetry.trackEvent('code_edited', { lines: 50 });
 * ```
 */

import type { Result } from '../../types/result.types';
import type { EnhancedError } from '../../utils/error';
import { createLogger } from '../logger.service';

const logger = createLogger('Telemetry');

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  readonly endpoint?: string;
  readonly apiKey?: string;
  readonly enableInDevelopment?: boolean;
  readonly batchSize?: number;
  readonly flushInterval?: number;
  readonly enablePerformanceTracking?: boolean;
  readonly enableErrorTracking?: boolean;
  readonly enableUserTracking?: boolean;
  readonly enableSystemTracking?: boolean;
}

/**
 * Base telemetry event
 */
export interface TelemetryEvent {
  readonly id: string;
  readonly timestamp: Date;
  readonly type: 'error' | 'performance' | 'user' | 'system';
  readonly sessionId: string;
  readonly userId?: string;
  readonly metadata: Record<string, unknown>;
}

/**
 * Error tracking event
 */
export interface ErrorEvent extends TelemetryEvent {
  readonly type: 'error';
  readonly error: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
    readonly code?: string;
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
  };
  readonly context: {
    readonly component?: string;
    readonly operation?: string;
    readonly userAgent: string;
    readonly url: string;
    readonly viewport: { width: number; height: number };
  };
}

/**
 * Performance tracking event
 */
export interface PerformanceEvent extends TelemetryEvent {
  readonly type: 'performance';
  readonly metric: {
    readonly name: string;
    readonly value: number;
    readonly unit: string;
    readonly category: 'render' | 'parse' | 'network' | 'memory' | 'cpu';
  };
  readonly context: {
    readonly operation?: string;
    readonly modelComplexity?: number;
    readonly browserInfo: {
      readonly name: string;
      readonly version: string;
      readonly platform: string;
    };
  };
}

/**
 * User interaction event
 */
export interface UserEvent extends TelemetryEvent {
  readonly type: 'user';
  readonly action: {
    readonly name: string;
    readonly category: 'edit' | 'view' | 'export' | 'settings' | 'help';
    readonly target?: string;
    readonly value?: number;
  };
  readonly context: {
    readonly feature?: string;
    readonly duration?: number;
  };
}

/**
 * System health event
 */
export interface SystemEvent extends TelemetryEvent {
  readonly type: 'system';
  readonly health: {
    readonly component: string;
    readonly status: 'healthy' | 'warning' | 'error' | 'critical';
    readonly metrics: Record<string, number>;
  };
  readonly context: {
    readonly version: string;
    readonly environment: 'development' | 'staging' | 'production';
    readonly deployment?: string;
  };
}

/**
 * Telemetry Service
 *
 * Comprehensive telemetry collection for production monitoring
 * with error tracking, performance metrics, and system health.
 */
export class TelemetryService {
  private readonly config: Required<TelemetryConfig>;
  private readonly sessionId: string;
  private readonly eventQueue: TelemetryEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isEnabled: boolean;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      endpoint: config.endpoint || '',
      apiKey: config.apiKey || '',
      enableInDevelopment: config.enableInDevelopment ?? false,
      batchSize: config.batchSize ?? 50,
      flushInterval: config.flushInterval ?? 30000, // 30 seconds
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      enableErrorTracking: config.enableErrorTracking ?? true,
      enableUserTracking: config.enableUserTracking ?? true,
      enableSystemTracking: config.enableSystemTracking ?? true,
    };

    this.sessionId = this.generateSessionId();
    this.isEnabled = this.shouldEnable();

    if (this.isEnabled) {
      this.startFlushTimer();
      logger.init('[INIT] Telemetry service initialized');
    } else {
      logger.debug('[INIT] Telemetry service disabled');
    }
  }

  /**
   * Track an error event
   */
  trackError(
    error: Error | EnhancedError | unknown,
    context: { component?: string; operation?: string; userId?: string } = {}
  ): void {
    if (!this.isEnabled || !this.config.enableErrorTracking) return;

    const errorEvent: ErrorEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'error',
      sessionId: this.sessionId,
      userId: context.userId,
      error: this.extractErrorInfo(error),
      context: {
        component: context.component,
        operation: context.operation,
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      metadata: {},
    };

    this.addEvent(errorEvent);
    logger.debug('[ERROR] Error tracked:', errorEvent.error.name);
  }

  /**
   * Track a performance metric
   */
  trackPerformance(
    name: string,
    value: number,
    context: {
      unit?: string;
      category?: PerformanceEvent['metric']['category'];
      operation?: string;
      modelComplexity?: number;
      userId?: string;
    } = {}
  ): void {
    if (!this.isEnabled || !this.config.enablePerformanceTracking) return;

    const performanceEvent: PerformanceEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'performance',
      sessionId: this.sessionId,
      userId: context.userId,
      metric: {
        name,
        value,
        unit: context.unit || 'ms',
        category: context.category || 'render',
      },
      context: {
        operation: context.operation,
        modelComplexity: context.modelComplexity,
        browserInfo: this.getBrowserInfo(),
      },
      metadata: {},
    };

    this.addEvent(performanceEvent);
    logger.debug(`[PERFORMANCE] Metric tracked: ${name} = ${value}${context.unit || 'ms'}`);
  }

  /**
   * Track a user interaction event
   */
  trackEvent(
    action: string,
    context: {
      category?: UserEvent['action']['category'];
      target?: string;
      value?: number;
      feature?: string;
      duration?: number;
      userId?: string;
    } = {}
  ): void {
    if (!this.isEnabled || !this.config.enableUserTracking) return;

    const userEvent: UserEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'user',
      sessionId: this.sessionId,
      userId: context.userId,
      action: {
        name: action,
        category: context.category || 'edit',
        target: context.target,
        value: context.value,
      },
      context: {
        feature: context.feature,
        duration: context.duration,
      },
      metadata: {},
    };

    this.addEvent(userEvent);
    logger.debug(`[USER] Event tracked: ${action}`);
  }

  /**
   * Track system health
   */
  trackSystemHealth(
    component: string,
    status: SystemEvent['health']['status'],
    metrics: Record<string, number>,
    context: {
      version?: string;
      environment?: SystemEvent['context']['environment'];
      deployment?: string;
    } = {}
  ): void {
    if (!this.isEnabled || !this.config.enableSystemTracking) return;

    const systemEvent: SystemEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'system',
      sessionId: this.sessionId,
      health: {
        component,
        status,
        metrics,
      },
      context: {
        version: context.version || '1.0.0',
        environment: context.environment || 'production',
        deployment: context.deployment,
      },
      metadata: {},
    };

    this.addEvent(systemEvent);
    logger.debug(`[SYSTEM] Health tracked: ${component} = ${status}`);
  }

  /**
   * Flush events immediately
   */
  async flush(): Promise<Result<void, Error>> {
    if (!this.isEnabled || this.eventQueue.length === 0) {
      return { success: true, data: undefined };
    }

    const events = [...this.eventQueue];
    this.eventQueue.length = 0;

    logger.debug(`[FLUSH] Sending ${events.length} events`);

    try {
      if (this.config.endpoint && this.config.apiKey) {
        await this.sendEvents(events);
      } else {
        // Log events to console in development
        console.group('📊 Telemetry Events');
        events.forEach((event) => {
          console.log(`[${event.type.toUpperCase()}]`, event);
        });
        console.groupEnd();
      }

      logger.debug('[FLUSH] Events sent successfully');
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('[FLUSH] Failed to send events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get telemetry statistics
   */
  getStats(): {
    queueSize: number;
    sessionId: string;
    isEnabled: boolean;
    config: TelemetryConfig;
  } {
    return {
      queueSize: this.eventQueue.length,
      sessionId: this.sessionId,
      isEnabled: this.isEnabled,
      config: this.config,
    };
  }

  /**
   * Add event to queue
   */
  private addEvent(event: TelemetryEvent): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Send events to telemetry endpoint
   */
  private async sendEvents(events: TelemetryEvent[]): Promise<void> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Telemetry request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Extract error information
   */
  private extractErrorInfo(error: unknown): ErrorEvent['error'] {
    if (error instanceof Error) {
      // Check if it's an enhanced error with additional properties
      const enhancedError = error as any;
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: enhancedError.code || undefined,
        severity: enhancedError.severity || 'medium',
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
      severity: 'medium',
    };
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): PerformanceEvent['context']['browserInfo'] {
    const userAgent = navigator.userAgent;

    // Simple browser detection
    let name = 'Unknown';
    let version = 'Unknown';

    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    return {
      name,
      version,
      platform: navigator.platform,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if telemetry should be enabled
   */
  private shouldEnable(): boolean {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction || this.config.enableInDevelopment;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Dispose the service
   */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush remaining events
    this.flush();

    logger.debug('[DISPOSE] Telemetry service disposed');
  }
}
