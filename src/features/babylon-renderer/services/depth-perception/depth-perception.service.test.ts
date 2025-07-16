/**
 * @file Depth Perception Service Tests
 *
 * Tests for the DepthPerceptionService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene, CreateBox, FreeCamera, Vector3 } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DepthPerceptionService,
  type DepthPerceptionConfig,
  type DepthPerceptionQuality,
} from './depth-perception.service';
import { LightingService } from '../lighting/lighting.service';

describe('DepthPerceptionService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let camera: FreeCamera;
  let lightingService: LightingService;
  let depthService: DepthPerceptionService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    
    // Create camera
    camera = new FreeCamera('camera', new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());
    scene.activeCamera = camera;
    
    // Create lighting service
    lightingService = new LightingService(scene);
    
    // Create depth perception service
    depthService = new DepthPerceptionService(scene, lightingService);
    
    // Create a test mesh
    CreateBox('testBox', { size: 1 }, scene);
  });

  afterEach(() => {
    // Clean up resources
    depthService.dispose();
    lightingService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize depth perception service', () => {
      expect(depthService).toBeDefined();
      expect(depthService.getDepthPerceptionSetup()).toBeNull();
    });

    it('should initialize without lighting service', () => {
      const standaloneService = new DepthPerceptionService(scene);
      expect(standaloneService).toBeDefined();
      standaloneService.dispose();
    });
  });

  describe('Depth Perception Setup', () => {
    it('should setup depth perception with default configuration', async () => {
      const result = await depthService.setupDepthPerception();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.shadowsEnabled).toBeDefined();
        expect(setup.ssaoEnabled).toBeDefined();
        expect(setup.edgeDetectionEnabled).toBeDefined();
        expect(setup.depthCueingEnabled).toBeDefined();
        expect(setup.qualityLevel).toBe('medium');
        expect(depthService.getDepthPerceptionSetup()).toBe(setup);
      }
    });

    it('should setup with custom configuration', async () => {
      const config: DepthPerceptionConfig = {
        enableShadows: true,
        enableSSAO: true,
        enableEdgeDetection: true,
        enableDepthCueing: true,
        shadowQuality: 'high',
        ssaoQuality: 'high',
        ssaoIntensity: 0.8,
        ssaoRadius: 0.7,
        edgeIntensity: 1.2,
        depthCueingDistance: 50,
        depthCueingIntensity: 0.5,
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.qualityLevel).toBe('high');
      }
    });

    it('should setup with shadows only', async () => {
      const config: DepthPerceptionConfig = {
        enableShadows: true,
        enableSSAO: false,
        enableEdgeDetection: false,
        enableDepthCueing: false,
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.ssaoEnabled).toBe(false);
        expect(setup.edgeDetectionEnabled).toBe(false);
        expect(setup.depthCueingEnabled).toBe(false);
      }
    });

    it('should setup with SSAO only', async () => {
      const config: DepthPerceptionConfig = {
        enableShadows: false,
        enableSSAO: true,
        enableEdgeDetection: false,
        enableDepthCueing: false,
        ssaoQuality: 'ultra',
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.shadowsEnabled).toBe(false);
        expect(setup.qualityLevel).toBe('ultra');
      }
    });

    it('should fail without active camera', async () => {
      scene.activeCamera = null;
      
      const result = await depthService.setupDepthPerception();
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
      }
    });
  });

  describe('Quality Levels', () => {
    const qualityLevels: DepthPerceptionQuality[] = ['low', 'medium', 'high', 'ultra'];

    qualityLevels.forEach(quality => {
      it(`should setup with ${quality} quality`, async () => {
        const config: DepthPerceptionConfig = {
          shadowQuality: quality,
          ssaoQuality: quality,
        };

        const result = await depthService.setupDepthPerception(config);
        expect(result.success).toBe(true);
        
        if (result.success) {
          const setup = result.data;
          expect(setup.qualityLevel).toBe(quality);
        }
      });
    });
  });

  describe('SSAO Configuration', () => {
    it('should setup SSAO with custom intensity', async () => {
      const config: DepthPerceptionConfig = {
        enableSSAO: true,
        ssaoIntensity: 0.9,
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.ssaoEnabled).toBe(true);
      }
    });

    it('should setup SSAO with custom radius', async () => {
      const config: DepthPerceptionConfig = {
        enableSSAO: true,
        ssaoRadius: 1.0,
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.ssaoEnabled).toBe(true);
      }
    });
  });

  describe('Edge Detection', () => {
    it('should setup edge detection', async () => {
      const config: DepthPerceptionConfig = {
        enableEdgeDetection: true,
        edgeIntensity: 1.5,
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.edgeDetectionEnabled).toBe(true);
      }
    });
  });

  describe('Depth Cueing', () => {
    it('should setup depth cueing with fog', async () => {
      const config: DepthPerceptionConfig = {
        enableDepthCueing: true,
        depthCueingDistance: 75,
        depthCueingIntensity: 0.4,
      };

      const result = await depthService.setupDepthPerception(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.depthCueingEnabled).toBe(true);
        expect(scene.fogEnabled).toBe(true);
        expect(scene.fogEnd).toBe(75);
        expect(scene.fogDensity).toBe(0.4);
      }
    });
  });

  describe('Settings Updates', () => {
    beforeEach(async () => {
      await depthService.setupDepthPerception({
        enableSSAO: true,
        enableDepthCueing: true,
      });
    });

    it('should update SSAO intensity', async () => {
      const result = await depthService.updateDepthPerception({
        ssaoIntensity: 0.7,
      });
      expect(result.success).toBe(true);
    });

    it('should update SSAO radius', async () => {
      const result = await depthService.updateDepthPerception({
        ssaoRadius: 0.8,
      });
      expect(result.success).toBe(true);
    });

    it('should update depth cueing distance', async () => {
      const result = await depthService.updateDepthPerception({
        depthCueingDistance: 120,
      });
      expect(result.success).toBe(true);
      expect(scene.fogEnd).toBe(120);
    });

    it('should update depth cueing intensity', async () => {
      const result = await depthService.updateDepthPerception({
        depthCueingIntensity: 0.6,
      });
      expect(result.success).toBe(true);
      expect(scene.fogDensity).toBe(0.6);
    });

    it('should fail to update without initialization', async () => {
      depthService.dispose();
      
      const result = await depthService.updateDepthPerception({
        ssaoIntensity: 0.5,
      });
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
      }
    });
  });

  describe('Multiple Setup Calls', () => {
    it('should clear previous setup when setting up again', async () => {
      // First setup
      await depthService.setupDepthPerception({
        enableSSAO: true,
        enableDepthCueing: true,
      });
      expect(scene.fogEnabled).toBe(true);
      
      // Second setup with different configuration
      await depthService.setupDepthPerception({
        enableSSAO: false,
        enableDepthCueing: false,
      });
      
      const setup = depthService.getDepthPerceptionSetup();
      expect(setup?.ssaoEnabled).toBe(false);
      expect(setup?.depthCueingEnabled).toBe(false);
    });
  });

  describe('Integration with Lighting Service', () => {
    it('should work without lighting service', async () => {
      const standaloneService = new DepthPerceptionService(scene);
      
      const result = await standaloneService.setupDepthPerception({
        enableShadows: true,
      });
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        // Shadows should be disabled when no lighting service is available
        expect(setup.shadowsEnabled).toBe(false);
      }
      
      standaloneService.dispose();
    });

    it('should enhance shadows when lighting service is available', async () => {
      // Setup lighting first
      await lightingService.setupTechnicalLighting({ enableShadows: true });
      
      const result = await depthService.setupDepthPerception({
        enableShadows: true,
        shadowQuality: 'high',
      });
      expect(result.success).toBe(true);
      
      if (result.success) {
        const setup = result.data;
        expect(setup.shadowsEnabled).toBe(true);
      }
    });
  });

  describe('Disposal', () => {
    it('should dispose all resources and clear state', async () => {
      await depthService.setupDepthPerception({
        enableSSAO: true,
        enableDepthCueing: true,
      });
      expect(depthService.getDepthPerceptionSetup()).not.toBeNull();
      expect(scene.fogEnabled).toBe(true);
      
      depthService.dispose();
      expect(depthService.getDepthPerceptionSetup()).toBeNull();
      expect(scene.fogEnabled).toBe(false);
    });

    it('should handle multiple dispose calls', () => {
      depthService.dispose();
      depthService.dispose(); // Should not throw
      expect(depthService.getDepthPerceptionSetup()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle setup errors gracefully', async () => {
      // Force an error by disposing the scene
      scene.dispose();
      
      const result = await depthService.setupDepthPerception();
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
        expect(result.error.message).toBeDefined();
        expect(result.error.timestamp).toBeDefined();
      }
    });
  });
});
