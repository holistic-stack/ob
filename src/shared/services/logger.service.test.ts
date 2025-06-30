/**
 * @file Tests for centralized logging service
 *
 * Tests the tslog integration and component logger functionality while maintaining
 * existing logging patterns and ensuring performance optimization.
 */

import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';
import { createLogger, logger } from './logger.service';

describe('Logger Service', () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    // Spy on console methods to capture tslog output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      // Intentionally empty - we just want to capture calls
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a component logger with correct patterns', () => {
      const testLogger = createLogger('TestComponent');

      expect(testLogger).toHaveProperty('init');
      expect(testLogger).toHaveProperty('debug');
      expect(testLogger).toHaveProperty('info');
      expect(testLogger).toHaveProperty('warn');
      expect(testLogger).toHaveProperty('error');
      expect(testLogger).toHaveProperty('end');
    });

    it('should maintain [INIT][ComponentName] pattern', () => {
      const testLogger = createLogger('TestComponent');
      testLogger.init('Test initialization message');

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[INIT][TestComponent]');
      expect(logCall?.[0]).toContain('Test initialization message');
    });

    it('should maintain [DEBUG][ComponentName] pattern', () => {
      const testLogger = createLogger('TestComponent');
      testLogger.debug('Test debug message');

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[DEBUG][TestComponent]');
      expect(logCall?.[0]).toContain('Test debug message');
    });

    it('should maintain [ERROR][ComponentName] pattern', () => {
      const testLogger = createLogger('TestComponent');
      testLogger.error('Test error message');

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[ERROR][TestComponent]');
      expect(logCall?.[0]).toContain('Test error message');
    });

    it('should maintain [WARN][ComponentName] pattern', () => {
      const testLogger = createLogger('TestComponent');
      testLogger.warn('Test warning message');

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[WARN][TestComponent]');
      expect(logCall?.[0]).toContain('Test warning message');
    });

    it('should maintain [END][ComponentName] pattern', () => {
      const testLogger = createLogger('TestComponent');
      testLogger.end('Test completion message');

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[END][TestComponent]');
      expect(logCall?.[0]).toContain('Test completion message');
    });

    it('should handle additional arguments', () => {
      const testLogger = createLogger('TestComponent');
      const testObject = { foo: 'bar', count: 42 };

      testLogger.info('Test message with object', testObject);

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[INFO][TestComponent]');
      expect(logCall?.[0]).toContain('Test message with object');
      // tslog includes additional arguments in the formatted output as a single string
      expect(logCall?.[0]).toContain('foo:');
      expect(logCall?.[0]).toContain('bar');
      expect(logCall?.[0]).toContain('42');
    });
  });

  describe('default logger', () => {
    it('should be available as default export', () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('init');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('end');
    });

    it('should use OpenSCAD as default component name', () => {
      logger.info('Default logger test');

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall?.[0]).toContain('[INFO][OpenSCAD]');
      expect(logCall?.[0]).toContain('Default logger test');
    });
  });

  describe('performance considerations', () => {
    it('should create logger instances efficiently', () => {
      const startTime = performance.now();

      // Create multiple loggers to test performance
      for (let i = 0; i < 100; i++) {
        createLogger(`TestComponent${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should create 100 loggers in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
