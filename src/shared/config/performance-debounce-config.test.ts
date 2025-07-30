/**
 * @file performance-debounce-config.test.ts
 * @description Tests for high-performance debouncing configuration.
 * Tests performance optimization settings and automatic configuration selection.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BALANCED_PERFORMANCE_DEBOUNCE_CONFIG,
  createPerformanceConfig,
  getOptimalPerformanceConfig,
  HIGH_PERFORMANCE_DEBOUNCE_CONFIG,
  LOW_END_PERFORMANCE_DEBOUNCE_CONFIG,
  PERFORMANCE_MONITORING,
  PERFORMANCE_TARGETS,
  ULTRA_PERFORMANCE_DEBOUNCE_CONFIG,
} from './performance-debounce-config';

describe('Performance Debounce Configuration', () => {
  describe('predefined configurations', () => {
    it('should provide high-performance configuration for 60 FPS', () => {
      expect(HIGH_PERFORMANCE_DEBOUNCE_CONFIG.renderDelayMs).toBe(16);
      expect(HIGH_PERFORMANCE_DEBOUNCE_CONFIG.parseDelayMs).toBe(50);
      expect(HIGH_PERFORMANCE_DEBOUNCE_CONFIG.saveDelayMs).toBe(500);
    });

    it('should provide ultra-performance configuration for 120 FPS', () => {
      expect(ULTRA_PERFORMANCE_DEBOUNCE_CONFIG.renderDelayMs).toBe(8);
      expect(ULTRA_PERFORMANCE_DEBOUNCE_CONFIG.parseDelayMs).toBe(25);
      expect(ULTRA_PERFORMANCE_DEBOUNCE_CONFIG.saveDelayMs).toBe(250);
    });

    it('should provide balanced configuration for 30 FPS', () => {
      expect(BALANCED_PERFORMANCE_DEBOUNCE_CONFIG.renderDelayMs).toBe(33);
      expect(BALANCED_PERFORMANCE_DEBOUNCE_CONFIG.parseDelayMs).toBe(100);
      expect(BALANCED_PERFORMANCE_DEBOUNCE_CONFIG.saveDelayMs).toBe(1000);
    });

    it('should provide low-end configuration for 15 FPS', () => {
      expect(LOW_END_PERFORMANCE_DEBOUNCE_CONFIG.renderDelayMs).toBe(66);
      expect(LOW_END_PERFORMANCE_DEBOUNCE_CONFIG.parseDelayMs).toBe(200);
      expect(LOW_END_PERFORMANCE_DEBOUNCE_CONFIG.saveDelayMs).toBe(2000);
    });

    it('should have immutable configurations', () => {
      expect(() => {
        // @ts-expect-error - Testing immutability
        HIGH_PERFORMANCE_DEBOUNCE_CONFIG.renderDelayMs = 100;
      }).toThrow();
    });
  });

  describe('PERFORMANCE_TARGETS', () => {
    it('should define correct performance targets', () => {
      expect(PERFORMANCE_TARGETS.ULTRA.targetFPS).toBe(120);
      expect(PERFORMANCE_TARGETS.ULTRA.maxFrameTime).toBeCloseTo(8.33, 2);

      expect(PERFORMANCE_TARGETS.HIGH.targetFPS).toBe(60);
      expect(PERFORMANCE_TARGETS.HIGH.maxFrameTime).toBeCloseTo(16.67, 2);

      expect(PERFORMANCE_TARGETS.BALANCED.targetFPS).toBe(30);
      expect(PERFORMANCE_TARGETS.BALANCED.maxFrameTime).toBeCloseTo(33.33, 2);

      expect(PERFORMANCE_TARGETS.LOW_END.targetFPS).toBe(15);
      expect(PERFORMANCE_TARGETS.LOW_END.maxFrameTime).toBeCloseTo(66.67, 2);
    });

    it('should provide descriptive information', () => {
      expect(PERFORMANCE_TARGETS.ULTRA.description).toContain('Ultra-high performance');
      expect(PERFORMANCE_TARGETS.HIGH.description).toContain('High performance');
      expect(PERFORMANCE_TARGETS.BALANCED.description).toContain('Balanced performance');
      expect(PERFORMANCE_TARGETS.LOW_END.description).toContain('Conservative performance');
    });
  });

  describe('getOptimalPerformanceConfig', () => {
    let originalWindow: typeof window;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should return balanced config when window is not available', () => {
      // @ts-expect-error - Testing undefined window
      global.window = undefined;

      const config = getOptimalPerformanceConfig();
      expect(config).toEqual(BALANCED_PERFORMANCE_DEBOUNCE_CONFIG);
    });

    it('should return ultra config for high-refresh displays', () => {
      global.window = {
        ...originalWindow,
        screen: {
          ...originalWindow?.screen,
          refreshRate: 144,
        } as any,
      } as any;

      const config = getOptimalPerformanceConfig();
      expect(config).toEqual(ULTRA_PERFORMANCE_DEBOUNCE_CONFIG);
    });

    it('should return high config for high-end devices', () => {
      global.window = {
        ...originalWindow,
        navigator: {
          ...originalWindow?.navigator,
          hardwareConcurrency: 8,
          deviceMemory: 16,
        } as any,
        screen: {
          ...originalWindow?.screen,
          refreshRate: 60,
        } as any,
      } as any;

      const config = getOptimalPerformanceConfig();
      expect(config).toEqual(HIGH_PERFORMANCE_DEBOUNCE_CONFIG);
    });

    it('should return low-end config for low-end devices', () => {
      global.window = {
        ...originalWindow,
        navigator: {
          ...originalWindow?.navigator,
          hardwareConcurrency: 2,
          deviceMemory: 1,
        } as any,
      } as any;

      const config = getOptimalPerformanceConfig();
      expect(config).toEqual(LOW_END_PERFORMANCE_DEBOUNCE_CONFIG);
    });

    it('should return balanced config for mid-range devices', () => {
      global.window = {
        ...originalWindow,
        navigator: {
          ...originalWindow?.navigator,
          hardwareConcurrency: 4,
          deviceMemory: 4,
        } as any,
      } as any;

      const config = getOptimalPerformanceConfig();
      expect(config).toEqual(BALANCED_PERFORMANCE_DEBOUNCE_CONFIG);
    });
  });

  describe('createPerformanceConfig', () => {
    it('should create config for 60 FPS target', () => {
      const config = createPerformanceConfig(60);

      expect(config.renderDelayMs).toBe(16); // 1000/60 = 16.67, floored to 16
      expect(config.parseDelayMs).toBe(32); // Max of renderDelayMs * 2 (32) and 25
      expect(config.saveDelayMs).toBe(500); // Max of renderDelayMs * 30 (480) and 500
    });

    it('should create config for 120 FPS target', () => {
      const config = createPerformanceConfig(120);

      expect(config.renderDelayMs).toBe(8); // 1000/120 = 8.33, floored to 8
      expect(config.parseDelayMs).toBe(25); // Max of 16 and 25
      expect(config.saveDelayMs).toBe(500); // Max of 240 and 500
    });

    it('should create config for 30 FPS target', () => {
      const config = createPerformanceConfig(30);

      expect(config.renderDelayMs).toBe(33); // 1000/30 = 33.33, floored to 33
      expect(config.parseDelayMs).toBe(66); // renderDelayMs * 2
      expect(config.saveDelayMs).toBe(990); // renderDelayMs * 30
    });

    it('should accept custom parse delay', () => {
      const config = createPerformanceConfig(60, 75);

      expect(config.renderDelayMs).toBe(16);
      expect(config.parseDelayMs).toBe(75);
      expect(config.saveDelayMs).toBe(500);
    });

    it('should throw error for invalid FPS values', () => {
      expect(() => createPerformanceConfig(0)).toThrow('Invalid target FPS');
      expect(() => createPerformanceConfig(-10)).toThrow('Invalid target FPS');
      expect(() => createPerformanceConfig(300)).toThrow('Invalid target FPS');
    });

    it('should be immutable', () => {
      const config = createPerformanceConfig(60);

      expect(() => {
        // @ts-expect-error - Testing immutability
        config.renderDelayMs = 100;
      }).toThrow();
    });
  });

  describe('PERFORMANCE_MONITORING', () => {
    describe('meetsPerformanceTarget', () => {
      it('should return true when frame time meets target', () => {
        const config = HIGH_PERFORMANCE_DEBOUNCE_CONFIG;

        expect(PERFORMANCE_MONITORING.meetsPerformanceTarget(10, config)).toBe(true);
        expect(PERFORMANCE_MONITORING.meetsPerformanceTarget(16, config)).toBe(true);
      });

      it('should return false when frame time exceeds target', () => {
        const config = HIGH_PERFORMANCE_DEBOUNCE_CONFIG;

        expect(PERFORMANCE_MONITORING.meetsPerformanceTarget(20, config)).toBe(false);
        expect(PERFORMANCE_MONITORING.meetsPerformanceTarget(50, config)).toBe(false);
      });
    });

    describe('calculatePerformanceScore', () => {
      it('should return 100 for perfect performance', () => {
        expect(PERFORMANCE_MONITORING.calculatePerformanceScore(10, 16)).toBe(100);
        expect(PERFORMANCE_MONITORING.calculatePerformanceScore(16, 16)).toBe(100);
      });

      it('should return proportional score for suboptimal performance', () => {
        expect(PERFORMANCE_MONITORING.calculatePerformanceScore(32, 16)).toBe(50);
        expect(PERFORMANCE_MONITORING.calculatePerformanceScore(24, 16)).toBeCloseTo(66.67, 1);
      });

      it('should return very low score for very poor performance', () => {
        const score = PERFORMANCE_MONITORING.calculatePerformanceScore(1000, 16);
        expect(score).toBeCloseTo(1.6, 1);
        expect(score).toBeLessThan(5);
      });
    });

    describe('getPerformanceRecommendation', () => {
      it('should recommend upgrade for excellent performance', () => {
        const config = HIGH_PERFORMANCE_DEBOUNCE_CONFIG;
        const recommendation = PERFORMANCE_MONITORING.getPerformanceRecommendation(5, config);

        expect(recommendation.recommendation).toBe('upgrade');
        expect(recommendation.suggestedConfig.renderDelayMs).toBeLessThan(config.renderDelayMs);
        expect(recommendation.reason).toContain('exceeds target');
      });

      it('should recommend downgrade for poor performance', () => {
        const config = HIGH_PERFORMANCE_DEBOUNCE_CONFIG;
        const recommendation = PERFORMANCE_MONITORING.getPerformanceRecommendation(30, config);

        expect(recommendation.recommendation).toBe('downgrade');
        expect(recommendation.suggestedConfig.renderDelayMs).toBeGreaterThan(config.renderDelayMs);
        expect(recommendation.reason).toContain('below target');
      });

      it('should recommend maintain for acceptable performance', () => {
        const config = HIGH_PERFORMANCE_DEBOUNCE_CONFIG;
        const recommendation = PERFORMANCE_MONITORING.getPerformanceRecommendation(18, config);

        expect(recommendation.recommendation).toBe('maintain');
        expect(recommendation.suggestedConfig).toEqual(config);
        expect(recommendation.reason).toContain('acceptable range');
      });
    });
  });
});
