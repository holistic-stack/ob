/**
 * @file Tests for Telemetry Service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEnhancedError } from '../../utils/error';
import { type TelemetryConfig, TelemetryService } from './telemetry.service';

// Mock global objects
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    platform: 'Win32',
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    location: { href: 'https://example.com/test' },
    innerWidth: 1920,
    innerHeight: 1080,
  },
  writable: true,
});

Object.defineProperty(global, 'fetch', {
  value: vi.fn(),
  writable: true,
});

describe('TelemetryService', () => {
  let service: TelemetryService;
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    service?.dispose();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      service = new TelemetryService();

      const stats = service.getStats();
      expect(stats.isEnabled).toBe(false); // Disabled in test environment
      expect(stats.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(stats.queueSize).toBe(0);
    });

    it('should initialize with custom config', () => {
      const config: TelemetryConfig = {
        endpoint: 'https://api.example.com/telemetry',
        apiKey: 'test-key',
        enableInDevelopment: true,
        batchSize: 10,
        flushInterval: 5000,
      };

      service = new TelemetryService(config);

      const stats = service.getStats();
      expect(stats.isEnabled).toBe(true);
      expect(stats.config.endpoint).toBe('https://api.example.com/telemetry');
      expect(stats.config.batchSize).toBe(10);
    });

    it('should be disabled in development by default', () => {
      // NODE_ENV is 'test' in vitest, which is treated as development
      service = new TelemetryService();

      const stats = service.getStats();
      expect(stats.isEnabled).toBe(false);
    });

    it('should be enabled in development when configured', () => {
      service = new TelemetryService({ enableInDevelopment: true });

      const stats = service.getStats();
      expect(stats.isEnabled).toBe(true);
    });
  });

  describe('error tracking', () => {
    beforeEach(() => {
      service = new TelemetryService({ enableInDevelopment: true });
    });

    it('should track basic errors', () => {
      const error = new Error('Test error');

      service.trackError(error, { component: 'test-component' });

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should track enhanced errors with additional context', () => {
      const enhancedError = createEnhancedError({
        message: 'Enhanced test error',
        code: 'TEST_ERROR',
        severity: 'high',
      });

      service.trackError(enhancedError, {
        component: 'parser',
        operation: 'parsing',
        userId: 'user123',
      });

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should handle unknown error types', () => {
      service.trackError('String error', { component: 'test' });
      service.trackError({ message: 'Object error' }, { component: 'test' });
      service.trackError(null, { component: 'test' });

      const stats = service.getStats();
      expect(stats.queueSize).toBe(3);
    });

    it('should not track errors when disabled', () => {
      service = new TelemetryService({ enableErrorTracking: false, enableInDevelopment: true });

      service.trackError(new Error('Test error'));

      const stats = service.getStats();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('performance tracking', () => {
    beforeEach(() => {
      service = new TelemetryService({ enableInDevelopment: true });
    });

    it('should track performance metrics', () => {
      service.trackPerformance('render_time', 16.5, {
        unit: 'ms',
        category: 'render',
        operation: 'cube_rendering',
        modelComplexity: 100,
      });

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should use default values for optional parameters', () => {
      service.trackPerformance('parse_time', 5.2);

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should not track performance when disabled', () => {
      service = new TelemetryService({
        enablePerformanceTracking: false,
        enableInDevelopment: true,
      });

      service.trackPerformance('test_metric', 100);

      const stats = service.getStats();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('user event tracking', () => {
    beforeEach(() => {
      service = new TelemetryService({ enableInDevelopment: true });
    });

    it('should track user interactions', () => {
      service.trackEvent('code_edited', {
        category: 'edit',
        target: 'monaco-editor',
        value: 50,
        feature: 'syntax-highlighting',
        duration: 1000,
        userId: 'user123',
      });

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should use default values for optional parameters', () => {
      service.trackEvent('button_clicked');

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should not track user events when disabled', () => {
      service = new TelemetryService({ enableUserTracking: false, enableInDevelopment: true });

      service.trackEvent('test_event');

      const stats = service.getStats();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('system health tracking', () => {
    beforeEach(() => {
      service = new TelemetryService({ enableInDevelopment: true });
    });

    it('should track system health', () => {
      service.trackSystemHealth(
        'renderer',
        'healthy',
        {
          fps: 60,
          memory_usage: 50,
          cpu_usage: 25,
        },
        {
          version: '1.0.0',
          environment: 'production',
          deployment: 'v1.0.0-abc123',
        }
      );

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should use default values for optional parameters', () => {
      service.trackSystemHealth('parser', 'warning', { errors: 1 });

      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should not track system health when disabled', () => {
      service = new TelemetryService({ enableSystemTracking: false, enableInDevelopment: true });

      service.trackSystemHealth('test_component', 'healthy', {});

      const stats = service.getStats();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('event batching and flushing', () => {
    beforeEach(() => {
      service = new TelemetryService({
        enableInDevelopment: true,
        batchSize: 3,
        endpoint: 'https://api.example.com/telemetry',
        apiKey: 'test-key',
      });
    });

    it('should auto-flush when batch size is reached', () => {
      service.trackEvent('event1');
      service.trackEvent('event2');

      let stats = service.getStats();
      expect(stats.queueSize).toBe(2);

      service.trackEvent('event3'); // Should trigger flush

      stats = service.getStats();
      expect(stats.queueSize).toBe(0);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should flush manually', async () => {
      service.trackEvent('event1');
      service.trackEvent('event2');

      const result = await service.flush();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledOnce();

      const stats = service.getStats();
      expect(stats.queueSize).toBe(0);
    });

    it('should handle flush errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      service.trackEvent('event1');

      const result = await service.flush();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Network error');
      }

      // Events should be re-added to queue for retry
      const stats = service.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should log events to console when no endpoint configured', async () => {
      service = new TelemetryService({ enableInDevelopment: true });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      service.trackEvent('test_event');

      const result = await service.flush();

      expect(result.success).toBe(true);
      expect(consoleGroupSpy).toHaveBeenCalledWith('📊 Telemetry Events');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('should not flush when service is disabled', async () => {
      service = new TelemetryService({ enableInDevelopment: false });

      const result = await service.flush();

      expect(result.success).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not flush empty queue', async () => {
      const result = await service.flush();

      expect(result.success).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('session management', () => {
    beforeEach(() => {
      service = new TelemetryService({ enableInDevelopment: true });
    });

    it('should generate unique session IDs', () => {
      const service1 = new TelemetryService({ enableInDevelopment: true });
      const service2 = new TelemetryService({ enableInDevelopment: true });

      expect(service1.getSessionId()).not.toBe(service2.getSessionId());

      service1.dispose();
      service2.dispose();
    });

    it('should maintain session ID throughout service lifetime', () => {
      const sessionId1 = service.getSessionId();
      const sessionId2 = service.getSessionId();

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('disposal', () => {
    it('should dispose cleanly', async () => {
      service = new TelemetryService({
        enableInDevelopment: true,
        endpoint: 'https://api.example.com/telemetry',
        apiKey: 'test-key',
      });

      service.trackEvent('test_event');

      expect(() => service.dispose()).not.toThrow();

      // Should flush remaining events on disposal
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });
});
