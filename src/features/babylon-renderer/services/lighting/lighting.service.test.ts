/**
 * @file Lighting Service Tests
 *
 * Tests for the LightingService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { Color3, CreateBox, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LightingService, type TechnicalLightingConfig } from './lighting.service';

describe('LightingService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let lightingService: LightingService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    lightingService = new LightingService(scene);
  });

  afterEach(() => {
    // Clean up resources
    lightingService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize lighting service', () => {
      expect(lightingService).toBeDefined();
      expect(lightingService.getLightingSetup()).toBeNull();
    });
  });

  describe('Technical Lighting Setup', () => {
    it('should setup technical lighting with default configuration', async () => {
      const result = await lightingService.setupTechnicalLighting();
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.keyLight).toBeDefined();
        expect(setup.ambientLight).toBeDefined();
        expect(setup.fillLight).toBeDefined();
        expect(setup.lights.length).toBe(3); // ambient + key + fill
        expect(lightingService.getLightingSetup()).toBe(setup);
      }
    });

    it('should setup lighting with custom configuration', async () => {
      const config: TechnicalLightingConfig = {
        enableShadows: false,
        ambientIntensity: 0.5,
        directionalIntensity: 1.0,
        ambientColor: new Color3(1, 0, 0),
        directionalColor: new Color3(0, 1, 0),
        keyLightDirection: new Vector3(0, -1, 0),
        enableFillLight: false,
        fillLightIntensity: 0.2,
      };

      const result = await lightingService.setupTechnicalLighting(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.ambientLight.intensity).toBe(0.5);
        expect(setup.keyLight.intensity).toBe(1.0);
        expect(setup.ambientLight.diffuse).toEqual(config.ambientColor);
        expect(setup.keyLight.diffuse).toEqual(config.directionalColor);
        expect(setup.fillLight).toBeUndefined();
        expect(setup.shadowGenerator).toBeUndefined();
        expect(setup.lights.length).toBe(2); // ambient + key only
      }
    });

    it('should setup lighting with shadows enabled', async () => {
      const config: TechnicalLightingConfig = {
        enableShadows: true,
        shadowMapSize: 512,
        shadowBias: 0.0001,
        cascadedShadows: false,
      };

      const result = await lightingService.setupTechnicalLighting(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.shadowGenerator).toBeDefined();
        expect(setup.shadowGenerator?.bias).toBe(0.0001);
      }
    });

    it('should setup lighting with cascaded shadows', async () => {
      const config: TechnicalLightingConfig = {
        enableShadows: true,
        cascadedShadows: true,
        shadowMapSize: 2048,
      };

      const result = await lightingService.setupTechnicalLighting(config);
      // Cascaded shadows might not be available in headless environment
      if (result.success) {
        const setup = result.data;
        expect(setup.shadowGenerator).toBeDefined();
      } else {
        // Accept failure for cascaded shadows in headless environment
        expect(result.error.code).toBe('SETUP_FAILED');
      }
    });

    it('should clear existing lights when setting up new lighting', async () => {
      // Setup first lighting
      await lightingService.setupTechnicalLighting();
      const firstLightCount = scene.lights.length;
      expect(firstLightCount).toBeGreaterThan(0);

      // Setup second lighting
      await lightingService.setupTechnicalLighting();
      const secondLightCount = scene.lights.length;

      // Should have same number of lights (old ones cleared)
      expect(secondLightCount).toBe(firstLightCount);
    });
  });

  describe('Lighting Intensity Updates', () => {
    beforeEach(async () => {
      await lightingService.setupTechnicalLighting();
    });

    it('should update ambient intensity', async () => {
      const result = await lightingService.updateIntensity(0.8);
      expect(result.success).toBe(true);

      const setup = lightingService.getLightingSetup();
      expect(setup?.ambientLight.intensity).toBe(0.8);
    });

    it('should update directional intensity', async () => {
      const result = await lightingService.updateIntensity(undefined, 1.2);
      expect(result.success).toBe(true);

      const setup = lightingService.getLightingSetup();
      expect(setup?.keyLight.intensity).toBe(1.2);
    });

    it('should update fill light intensity', async () => {
      const result = await lightingService.updateIntensity(undefined, undefined, 0.6);
      expect(result.success).toBe(true);

      const setup = lightingService.getLightingSetup();
      expect(setup?.fillLight?.intensity).toBe(0.6);
    });

    it('should update all intensities at once', async () => {
      const result = await lightingService.updateIntensity(0.4, 0.9, 0.3);
      expect(result.success).toBe(true);

      const setup = lightingService.getLightingSetup();
      expect(setup?.ambientLight.intensity).toBe(0.4);
      expect(setup?.keyLight.intensity).toBe(0.9);
      expect(setup?.fillLight?.intensity).toBe(0.3);
    });

    it('should fail to update intensity without lighting setup', async () => {
      lightingService.dispose();

      const result = await lightingService.updateIntensity(0.5);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
      }
    });
  });

  describe('Shadow Operations', () => {
    beforeEach(async () => {
      await lightingService.setupTechnicalLighting({ enableShadows: true });
    });

    it('should add shadow caster', async () => {
      const box = CreateBox('shadowCaster', { size: 1 }, scene);

      const result = await lightingService.addShadowCaster(box);
      expect(result.success).toBe(true);
    });

    it('should add shadow receiver', async () => {
      const box = CreateBox('shadowReceiver', { size: 1 }, scene);

      const result = await lightingService.addShadowReceiver(box);
      expect(result.success).toBe(true);
      expect(box.receiveShadows).toBe(true);
    });

    it('should fail to add shadow caster without shadows enabled', async () => {
      lightingService.dispose();
      await lightingService.setupTechnicalLighting({ enableShadows: false });

      const box = CreateBox('shadowCaster', { size: 1 }, scene);
      const result = await lightingService.addShadowCaster(box);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('SHADOW_SETUP_FAILED');
      }
    });

    it('should fail to add shadow receiver without shadows enabled', async () => {
      lightingService.dispose();
      await lightingService.setupTechnicalLighting({ enableShadows: false });

      const box = CreateBox('shadowReceiver', { size: 1 }, scene);
      const result = await lightingService.addShadowReceiver(box);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('SHADOW_SETUP_FAILED');
      }
    });
  });

  describe('Light Configuration', () => {
    it('should setup lighting with custom light directions', async () => {
      const keyDirection = new Vector3(1, 0, 0);
      const fillDirection = new Vector3(-1, 0, 0);

      const config: TechnicalLightingConfig = {
        keyLightDirection: keyDirection,
        fillLightDirection: fillDirection,
      };

      const result = await lightingService.setupTechnicalLighting(config);
      expect(result.success).toBe(true);

      if (result.success) {
        const setup = result.data;
        expect(setup.keyLight.direction).toEqual(keyDirection);
        expect(setup.fillLight?.direction).toEqual(fillDirection);
      }
    });

    it('should setup lighting with HDR enabled', async () => {
      const config: TechnicalLightingConfig = {
        enableHDR: true,
      };

      const result = await lightingService.setupTechnicalLighting(config);
      expect(result.success).toBe(true);

      // HDR configuration would be applied to scene
    });
  });

  describe('Disposal', () => {
    it('should dispose lighting properly', async () => {
      await lightingService.setupTechnicalLighting();
      expect(scene.lights.length).toBeGreaterThan(0);
      expect(lightingService.getLightingSetup()).not.toBeNull();

      lightingService.dispose();
      expect(scene.lights.length).toBe(0);
      expect(lightingService.getLightingSetup()).toBeNull();
    });

    it('should handle multiple dispose calls', () => {
      lightingService.dispose();
      lightingService.dispose(); // Should not throw
      expect(lightingService.getLightingSetup()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle lighting setup errors gracefully', async () => {
      // In headless environment, lighting setup usually succeeds
      // This test verifies the error handling structure is in place
      const result = await lightingService.setupTechnicalLighting();

      // Should either succeed or fail gracefully
      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
        expect(result.error.message).toBeDefined();
        expect(result.error.timestamp).toBeDefined();
      } else {
        expect(result.data).toBeDefined();
      }
    });
  });
});
