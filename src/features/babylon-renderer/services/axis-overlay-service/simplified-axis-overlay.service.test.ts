/**
 * @file simplified-axis-overlay.service.test.ts
 * @description Tests for simplified axis overlay service
 */

import { NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AxisResultUtils } from './axis-errors/axis-errors';
import {
  createSimplifiedAxisOverlayService,
  DEFAULT_SKETCHUP_CONFIG,
  defaultSimplifiedAxisOverlayService,
  SimplifiedAxisOverlayService,
  type ISimplifiedAxisOverlayService,
  type SimplifiedAxisConfig,
} from './simplified-axis-overlay.service';

describe('SimplifiedAxisOverlayService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let service: ISimplifiedAxisOverlayService;

  beforeEach(() => {
    engine = new NullEngine();
    scene = new Scene(engine);
    service = new SimplifiedAxisOverlayService();
  });

  afterEach(() => {
    service.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully with default configuration', () => {
      const result = service.initialize(scene);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.initialized).toBe(true);
      expect(state.axisCount).toBe(3); // X, Y, Z axes
      expect(state.lastError).toBeUndefined();
    });

    it('should initialize with custom configuration', () => {
      const config: SimplifiedAxisConfig = {
        visible: false,
        pixelWidth: 3.0,
        length: 500,
        opacity: 0.8,
        colorScheme: 'MUTED',
      };

      const result = service.initialize(scene, config);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.initialized).toBe(true);
      expect(state.config).toEqual(config);
      expect(state.visible).toBe(false);
    });

    it('should fail with invalid scene', () => {
      const result = service.initialize(null as any);
      expect(AxisResultUtils.isFailure(result)).toBe(true);

      const state = service.getState();
      expect(state.initialized).toBe(false);
      expect(state.lastError).toBeDefined();
    });

    it('should fail with invalid configuration', () => {
      const config: SimplifiedAxisConfig = {
        pixelWidth: -1, // Invalid
      };

      const result = service.initialize(scene, config);
      expect(AxisResultUtils.isFailure(result)).toBe(true);

      const state = service.getState();
      expect(state.initialized).toBe(false);
      expect(state.lastError).toBeDefined();
    });

    it('should dispose previous axes when reinitializing', () => {
      // First initialization
      service.initialize(scene);
      const firstState = service.getState();
      expect(firstState.initialized).toBe(true);

      // Second initialization should dispose previous axes
      const result = service.initialize(scene, { pixelWidth: 3.0 });
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const secondState = service.getState();
      expect(secondState.initialized).toBe(true);
      expect(secondState.config.pixelWidth).toBe(3.0);
    });
  });

  describe('configuration updates', () => {
    beforeEach(() => {
      service.initialize(scene);
    });

    it('should update configuration successfully', () => {
      const newConfig: SimplifiedAxisConfig = {
        pixelWidth: 4.0,
        opacity: 0.5,
        colorScheme: 'HIGH_CONTRAST',
      };

      const result = service.updateConfig(newConfig);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.config.pixelWidth).toBe(4.0);
      expect(state.config.opacity).toBe(0.5);
      expect(state.config.colorScheme).toBe('HIGH_CONTRAST');
      expect(state.lastError).toBeUndefined();
    });

    it('should merge configuration with existing config', () => {
      // Initial config
      const initialConfig: SimplifiedAxisConfig = {
        pixelWidth: 2.0,
        length: 1000,
        visible: true,
      };
      service.updateConfig(initialConfig);

      // Partial update
      const updateConfig: SimplifiedAxisConfig = {
        pixelWidth: 3.0,
        opacity: 0.8,
      };
      const result = service.updateConfig(updateConfig);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.config.pixelWidth).toBe(3.0); // Updated
      expect(state.config.length).toBe(1000); // Preserved
      expect(state.config.visible).toBe(true); // Preserved
      expect(state.config.opacity).toBe(0.8); // Added
    });

    it('should fail with invalid configuration', () => {
      const invalidConfig: SimplifiedAxisConfig = {
        opacity: 2.0, // Invalid: > 1
      };

      const result = service.updateConfig(invalidConfig);
      expect(AxisResultUtils.isFailure(result)).toBe(true);

      const state = service.getState();
      expect(state.lastError).toBeDefined();
    });

    it('should fail if not initialized', () => {
      const uninitializedService = new SimplifiedAxisOverlayService();
      const result = uninitializedService.updateConfig({ pixelWidth: 3.0 });
      expect(AxisResultUtils.isFailure(result)).toBe(true);
    });

    it('should update visibility when specified in config', () => {
      const result = service.updateConfig({ visible: false });
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.visible).toBe(false);
      expect(state.config.visible).toBe(false);
    });
  });

  describe('visibility management', () => {
    beforeEach(() => {
      service.initialize(scene);
    });

    it('should set visibility successfully', () => {
      const result = service.setVisibility(false);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.visible).toBe(false);
      expect(state.config.visible).toBe(false);
    });

    it('should toggle visibility successfully', () => {
      // Initial state should be visible
      let state = service.getState();
      const initialVisibility = state.visible;

      const result = service.toggleVisibility();
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      if (AxisResultUtils.isSuccess(result)) {
        expect(result.data).toBe(!initialVisibility);
      }

      state = service.getState();
      expect(state.visible).toBe(!initialVisibility);
      expect(state.config.visible).toBe(!initialVisibility);
    });

    it('should toggle visibility multiple times', () => {
      const initialState = service.getState();
      const initialVisibility = initialState.visible;

      // First toggle
      service.toggleVisibility();
      let state = service.getState();
      expect(state.visible).toBe(!initialVisibility);

      // Second toggle (back to original)
      service.toggleVisibility();
      state = service.getState();
      expect(state.visible).toBe(initialVisibility);
    });
  });

  describe('state management', () => {
    it('should return correct initial state', () => {
      const state = service.getState();
      expect(state.initialized).toBe(false);
      expect(state.visible).toBe(true); // Default visibility
      expect(state.axisCount).toBe(0);
      expect(state.config).toEqual({});
      expect(state.lastError).toBeUndefined();
    });

    it('should return correct state after initialization', () => {
      const config: SimplifiedAxisConfig = {
        pixelWidth: 2.5,
        visible: false,
      };

      service.initialize(scene, config);
      const state = service.getState();

      expect(state.initialized).toBe(true);
      expect(state.visible).toBe(false);
      expect(state.axisCount).toBe(3);
      expect(state.config).toEqual(config);
      expect(state.lastError).toBeUndefined();
    });

    it('should track errors in state', () => {
      // Cause an error
      service.initialize(null as any);
      const state = service.getState();

      expect(state.initialized).toBe(false);
      expect(state.lastError).toBeDefined();
      expect(state.lastError?.code).toBe('AXIS_VALIDATION_ERROR');
    });

    it('should clear errors on successful operations', () => {
      // Cause an error first
      service.initialize(null as any);
      let state = service.getState();
      expect(state.lastError).toBeDefined();

      // Successful operation should clear error
      service.initialize(scene);
      state = service.getState();
      expect(state.lastError).toBeUndefined();
    });
  });

  describe('disposal', () => {
    it('should dispose resources properly', () => {
      service.initialize(scene);
      let state = service.getState();
      expect(state.initialized).toBe(true);
      expect(state.axisCount).toBe(3);

      service.dispose();
      state = service.getState();
      expect(state.initialized).toBe(false);
      expect(state.axisCount).toBe(0);
      expect(state.config).toEqual({});
      expect(state.lastError).toBeUndefined();
    });

    it('should be safe to call dispose multiple times', () => {
      service.initialize(scene);
      service.dispose();
      service.dispose(); // Should not throw

      const state = service.getState();
      expect(state.initialized).toBe(false);
    });

    it('should be safe to call dispose without initialization', () => {
      service.dispose(); // Should not throw

      const state = service.getState();
      expect(state.initialized).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle operations on disposed service', () => {
      service.initialize(scene);
      service.dispose();

      // Operations after disposal should fail gracefully
      const updateResult = service.updateConfig({ pixelWidth: 3.0 });
      expect(AxisResultUtils.isFailure(updateResult)).toBe(true);

      const visibilityResult = service.setVisibility(false);
      expect(AxisResultUtils.isFailure(visibilityResult)).toBe(true);
    });

    it('should handle empty configuration updates', () => {
      service.initialize(scene);
      const result = service.updateConfig({});
      expect(AxisResultUtils.isSuccess(result)).toBe(true);
    });

    it('should handle configuration with all properties', () => {
      const fullConfig: SimplifiedAxisConfig = {
        visible: true,
        pixelWidth: 2.5,
        length: 800,
        opacity: 0.9,
        colorScheme: 'PASTEL',
        origin: new Vector3(10, 20, 30),
        resolution: [2560, 1440],
      };

      const result = service.initialize(scene, fullConfig);
      expect(AxisResultUtils.isSuccess(result)).toBe(true);

      const state = service.getState();
      expect(state.config).toEqual(fullConfig);
    });
  });
});

describe('Factory functions and defaults', () => {
  describe('createSimplifiedAxisOverlayService', () => {
    it('should create a new service instance', () => {
      const service = createSimplifiedAxisOverlayService();
      expect(service).toBeInstanceOf(SimplifiedAxisOverlayService);
    });

    it('should create independent instances', () => {
      const service1 = createSimplifiedAxisOverlayService();
      const service2 = createSimplifiedAxisOverlayService();
      expect(service1).not.toBe(service2);
    });
  });

  describe('defaultSimplifiedAxisOverlayService', () => {
    it('should be an instance of SimplifiedAxisOverlayService', () => {
      expect(defaultSimplifiedAxisOverlayService).toBeInstanceOf(SimplifiedAxisOverlayService);
    });

    it('should be usable', () => {
      const state = defaultSimplifiedAxisOverlayService.getState();
      expect(state).toBeDefined();
      expect(state.initialized).toBe(false);
    });
  });

  describe('DEFAULT_SKETCHUP_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SKETCHUP_CONFIG.visible).toBe(true);
      expect(DEFAULT_SKETCHUP_CONFIG.pixelWidth).toBe(2.0);
      expect(DEFAULT_SKETCHUP_CONFIG.length).toBe(1000);
      expect(DEFAULT_SKETCHUP_CONFIG.opacity).toBe(1.0);
      expect(DEFAULT_SKETCHUP_CONFIG.colorScheme).toBe('STANDARD');
      expect(DEFAULT_SKETCHUP_CONFIG.origin).toEqual(Vector3.Zero());
      expect(DEFAULT_SKETCHUP_CONFIG.resolution).toEqual([1920, 1080]);
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly behavior
        DEFAULT_SKETCHUP_CONFIG.visible = false;
      }).toThrow();
    });
  });
});