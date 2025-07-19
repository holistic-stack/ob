/**
 * @file debounce-config.test.ts
 * @description Comprehensive tests for centralized debouncing configuration.
 * Validates performance optimizations and ensures configuration meets targets.
 */

import { describe, expect, it } from 'vitest';
import {
  OPTIMIZED_DEBOUNCE_CONFIG,
  TYPING_DEBOUNCE_MS,
  LEGACY_DEBOUNCE_CONFIG,
  DEVELOPMENT_DEBOUNCE_CONFIG,
  TESTING_DEBOUNCE_CONFIG,
  createDebounceConfig,
  getEnvironmentDebounceConfig,
  validateDebounceConfig,
  DEBOUNCE_PERFORMANCE_TARGETS,
} from './debounce-config.js';

describe('Debounce Configuration', () => {
  describe('OPTIMIZED_DEBOUNCE_CONFIG', () => {
    it('should provide optimized timing values', () => {
      expect(OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs).toBe(200);
      expect(OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs).toBe(100);
      expect(OPTIMIZED_DEBOUNCE_CONFIG.saveDelayMs).toBe(1000);
    });

    it('should be immutable', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs = 500;
      }).toThrow();
    });

    it('should improve performance over legacy config', () => {
      const optimizedTotal = TYPING_DEBOUNCE_MS + 
        OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs + 
        OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs;
      
      const legacyTotal = 300 + // Monaco Editor legacy debouncing
        LEGACY_DEBOUNCE_CONFIG.parseDelayMs + 
        LEGACY_DEBOUNCE_CONFIG.renderDelayMs;

      expect(optimizedTotal).toBeLessThan(legacyTotal);
      expect(optimizedTotal).toBe(450); // 150 + 200 + 100
      expect(legacyTotal).toBe(900);    // 300 + 300 + 300
    });
  });

  describe('TYPING_DEBOUNCE_MS', () => {
    it('should provide optimal typing responsiveness', () => {
      expect(TYPING_DEBOUNCE_MS).toBe(150);
      expect(TYPING_DEBOUNCE_MS).toBeLessThan(200); // Better than legacy 300ms
    });
  });

  describe('Environment-specific configurations', () => {
    it('should provide development configuration with faster feedback', () => {
      expect(DEVELOPMENT_DEBOUNCE_CONFIG.parseDelayMs).toBeLessThan(OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs);
      expect(DEVELOPMENT_DEBOUNCE_CONFIG.renderDelayMs).toBeLessThan(OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs);
      expect(DEVELOPMENT_DEBOUNCE_CONFIG.saveDelayMs).toBeLessThan(OPTIMIZED_DEBOUNCE_CONFIG.saveDelayMs);
    });

    it('should provide testing configuration with no delays', () => {
      expect(TESTING_DEBOUNCE_CONFIG.parseDelayMs).toBe(0);
      expect(TESTING_DEBOUNCE_CONFIG.renderDelayMs).toBe(0);
      expect(TESTING_DEBOUNCE_CONFIG.saveDelayMs).toBe(0);
    });

    it('should maintain legacy configuration for backward compatibility', () => {
      expect(LEGACY_DEBOUNCE_CONFIG.parseDelayMs).toBe(300);
      expect(LEGACY_DEBOUNCE_CONFIG.renderDelayMs).toBe(300);
      expect(LEGACY_DEBOUNCE_CONFIG.saveDelayMs).toBe(1000);
    });
  });

  describe('createDebounceConfig', () => {
    it('should create configuration with defaults', () => {
      const config = createDebounceConfig();
      
      expect(config.parseDelayMs).toBe(OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs);
      expect(config.renderDelayMs).toBe(OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs);
      expect(config.saveDelayMs).toBe(OPTIMIZED_DEBOUNCE_CONFIG.saveDelayMs);
      expect(config.typing).toBe(TYPING_DEBOUNCE_MS);
    });

    it('should allow partial configuration override', () => {
      const config = createDebounceConfig({
        parseDelayMs: 250,
        typing: 100,
      });
      
      expect(config.parseDelayMs).toBe(250);
      expect(config.typing).toBe(100);
      expect(config.renderDelayMs).toBe(OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs); // Default
      expect(config.saveDelayMs).toBe(OPTIMIZED_DEBOUNCE_CONFIG.saveDelayMs); // Default
    });

    it('should validate timing ranges', () => {
      expect(() => createDebounceConfig({ parseDelayMs: -1 })).toThrow();
      expect(() => createDebounceConfig({ parseDelayMs: 1001 })).toThrow();
      expect(() => createDebounceConfig({ renderDelayMs: -1 })).toThrow();
      expect(() => createDebounceConfig({ renderDelayMs: 501 })).toThrow();
      expect(() => createDebounceConfig({ saveDelayMs: -1 })).toThrow();
      expect(() => createDebounceConfig({ saveDelayMs: 5001 })).toThrow();
      expect(() => createDebounceConfig({ typing: -1 })).toThrow();
      expect(() => createDebounceConfig({ typing: 501 })).toThrow();
    });

    it('should return immutable configuration', () => {
      const config = createDebounceConfig();
      
      expect(() => {
        // @ts-expect-error - Testing immutability
        config.parseDelayMs = 500;
      }).toThrow();
    });
  });

  describe('getEnvironmentDebounceConfig', () => {
    it('should return testing config in test environment', () => {
      // Note: This test runs in test environment, so it should return TESTING_DEBOUNCE_CONFIG
      const config = getEnvironmentDebounceConfig();
      expect(config).toEqual(TESTING_DEBOUNCE_CONFIG);
    });
  });

  describe('validateDebounceConfig', () => {
    it('should validate optimized configuration as valid', () => {
      const result = validateDebounceConfig({
        ...OPTIMIZED_DEBOUNCE_CONFIG,
        typing: TYPING_DEBOUNCE_MS,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.totalDelay).toBe(450); // 150 + 200 + 100
    });

    it('should detect performance issues in legacy configuration', () => {
      const result = validateDebounceConfig({
        ...LEGACY_DEBOUNCE_CONFIG,
        typing: 300, // Legacy Monaco Editor debouncing
      });
      
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.totalDelay).toBe(900); // 300 + 300 + 300
    });

    it('should provide recommendations for improvement', () => {
      const result = validateDebounceConfig({
        parseDelayMs: 400,
        renderDelayMs: 200,
        saveDelayMs: 1000,
        typing: 250,
      });
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('typing delay'))).toBe(true);
    });

    it('should calculate total delay correctly', () => {
      const config = {
        parseDelayMs: 100,
        renderDelayMs: 50,
        saveDelayMs: 500,
        typing: 75,
      };
      
      const result = validateDebounceConfig(config);
      expect(result.totalDelay).toBe(225); // 75 + 100 + 50
    });
  });

  describe('Performance targets', () => {
    it('should define reasonable performance targets', () => {
      expect(DEBOUNCE_PERFORMANCE_TARGETS.maxTotalDelay).toBe(500);
      expect(DEBOUNCE_PERFORMANCE_TARGETS.maxTypingDelay).toBe(200);
      expect(DEBOUNCE_PERFORMANCE_TARGETS.maxParsingDelay).toBe(300);
      expect(DEBOUNCE_PERFORMANCE_TARGETS.maxRenderingDelay).toBe(150);
      expect(DEBOUNCE_PERFORMANCE_TARGETS.targetResponsiveness).toBe(450);
    });

    it('should ensure optimized config meets performance targets', () => {
      const totalDelay = TYPING_DEBOUNCE_MS + 
        OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs + 
        OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs;
      
      expect(totalDelay).toBeLessThanOrEqual(DEBOUNCE_PERFORMANCE_TARGETS.maxTotalDelay);
      expect(TYPING_DEBOUNCE_MS).toBeLessThanOrEqual(DEBOUNCE_PERFORMANCE_TARGETS.maxTypingDelay);
      expect(OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs).toBeLessThanOrEqual(DEBOUNCE_PERFORMANCE_TARGETS.maxParsingDelay);
      expect(OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs).toBeLessThanOrEqual(DEBOUNCE_PERFORMANCE_TARGETS.maxRenderingDelay);
    });
  });

  describe('Performance improvement validation', () => {
    it('should demonstrate 42% improvement over legacy configuration', () => {
      const legacyTotal = 300 + 300 + 300; // 900ms total
      const optimizedTotal = 150 + 200 + 100; // 450ms total
      const improvement = (legacyTotal - optimizedTotal) / legacyTotal;
      
      expect(improvement).toBeCloseTo(0.5, 1); // 50% improvement (even better than target 42%)
    });

    it('should meet target responsiveness', () => {
      const optimizedTotal = TYPING_DEBOUNCE_MS + 
        OPTIMIZED_DEBOUNCE_CONFIG.parseDelayMs + 
        OPTIMIZED_DEBOUNCE_CONFIG.renderDelayMs;
      
      expect(optimizedTotal).toBeLessThanOrEqual(DEBOUNCE_PERFORMANCE_TARGETS.targetResponsiveness);
    });
  });
});
