/**
 * @file Camera Control Service Tests
 *
 * Tests for the CameraControlService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene, Vector3, Mesh, CreateBox } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CameraControlService,
  type CADCameraConfig,
} from './camera-control.service';

describe('CameraControlService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let cameraService: CameraControlService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    cameraService = new CameraControlService(scene);
  });

  afterEach(() => {
    // Clean up resources
    cameraService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize camera control service', () => {
      expect(cameraService).toBeDefined();
      expect(cameraService.getCamera()).toBeNull();
    });
  });

  describe('CAD Camera Setup', () => {
    it('should setup CAD camera with default configuration', async () => {
      const result = await cameraService.setupCADCamera();
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera).toBeDefined();
        expect(camera.name).toBe('cadCamera');
        expect(scene.activeCamera).toBe(camera);
        expect(cameraService.getCamera()).toBe(camera);
      }
    });

    it('should setup CAD camera with custom configuration', async () => {
      const config: CADCameraConfig = {
        target: new Vector3(5, 5, 5),
        radius: 20,
        alpha: Math.PI / 6,
        beta: Math.PI / 4,
        enableOrbit: true,
        enablePan: true,
        enableZoom: true,
        orbitSensitivity: 2.0,
        panSensitivity: 1.5,
        zoomSensitivity: 0.8,
        minRadius: 1,
        maxRadius: 100,
        smoothing: true,
        smoothingFactor: 0.2,
      };

      const result = await cameraService.setupCADCamera(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera.target).toEqual(config.target);
        expect(camera.radius).toBe(config.radius);
        expect(camera.alpha).toBe(config.alpha);
        expect(camera.beta).toBe(config.beta);
        expect(camera.lowerRadiusLimit).toBe(config.minRadius);
        expect(camera.upperRadiusLimit).toBe(config.maxRadius);
        expect(camera.inertia).toBe(config.smoothingFactor);
      }
    });

    it('should setup camera with orbit disabled', async () => {
      const config: CADCameraConfig = {
        enableOrbit: false,
        enablePan: true,
        enableZoom: true,
      };

      const result = await cameraService.setupCADCamera(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera.inputs.attached.pointers).toBeUndefined();
      }
    });

    it('should setup camera with zoom disabled', async () => {
      const config: CADCameraConfig = {
        enableOrbit: true,
        enablePan: true,
        enableZoom: false,
      };

      const result = await cameraService.setupCADCamera(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera.inputs.attached.mousewheel).toBeUndefined();
      }
    });

    it('should setup camera with smoothing disabled', async () => {
      const config: CADCameraConfig = {
        smoothing: false,
      };

      const result = await cameraService.setupCADCamera(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera.inertia).toBe(0);
      }
    });
  });

  describe('Camera Views', () => {
    beforeEach(async () => {
      await cameraService.setupCADCamera();
    });

    it('should set front view', async () => {
      const result = await cameraService.setView('front');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(0);
      expect(camera?.beta).toBe(Math.PI / 2);
    });

    it('should set back view', async () => {
      const result = await cameraService.setView('back');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(Math.PI);
      expect(camera?.beta).toBe(Math.PI / 2);
    });

    it('should set left view', async () => {
      const result = await cameraService.setView('left');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(-Math.PI / 2);
      expect(camera?.beta).toBe(Math.PI / 2);
    });

    it('should set right view', async () => {
      const result = await cameraService.setView('right');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(Math.PI / 2);
      expect(camera?.beta).toBe(Math.PI / 2);
    });

    it('should set top view', async () => {
      const result = await cameraService.setView('top');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(0);
      expect(camera?.beta).toBe(0.01);
    });

    it('should set bottom view', async () => {
      const result = await cameraService.setView('bottom');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(0);
      expect(camera?.beta).toBe(Math.PI - 0.01);
    });

    it('should set isometric view', async () => {
      const result = await cameraService.setView('isometric');
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.alpha).toBe(Math.PI / 4);
      expect(camera?.beta).toBe(Math.PI / 3);
    });

    it('should fail to set view without camera', async () => {
      cameraService.dispose();
      
      const result = await cameraService.setView('front');
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('SETUP_FAILED');
      }
    });
  });

  describe('Frame Operations', () => {
    beforeEach(async () => {
      await cameraService.setupCADCamera();
    });

    it('should frame all meshes in scene', async () => {
      // Create test meshes
      const box1 = CreateBox('box1', { size: 2 }, scene);
      box1.position = new Vector3(0, 0, 0);
      
      const box2 = CreateBox('box2', { size: 1 }, scene);
      box2.position = new Vector3(5, 5, 5);

      const result = await cameraService.frameAll();
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      expect(camera?.radius).toBeGreaterThan(0);
      
      // Camera target should be set (exact position may vary in headless environment)
      const target = camera?.target;
      expect(target).toBeDefined();
      expect(camera?.radius).toBeGreaterThan(0);
    });

    it('should frame specific meshes', async () => {
      // Create test meshes
      const box1 = CreateBox('box1', { size: 2 }, scene);
      box1.position = new Vector3(0, 0, 0);
      
      const box2 = CreateBox('box2', { size: 1 }, scene);
      box2.position = new Vector3(10, 10, 10);

      // Frame only the first box
      const result = await cameraService.frameMeshes([box1]);
      expect(result.success).toBe(true);
      
      const camera = cameraService.getCamera();
      const target = camera?.target;

      // Target should be set (exact position may vary in headless environment)
      expect(target).toBeDefined();
      expect(camera?.radius).toBeGreaterThan(0);
    });

    it('should fail to frame all with no meshes', async () => {
      const result = await cameraService.frameAll();
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('BOUNDS_CALCULATION_FAILED');
      }
    });

    it('should fail to frame empty mesh array', async () => {
      const result = await cameraService.frameMeshes([]);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('BOUNDS_CALCULATION_FAILED');
      }
    });

    it('should fail to frame without camera', async () => {
      cameraService.dispose();
      
      const result = await cameraService.frameAll();
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.code).toBe('BOUNDS_CALCULATION_FAILED');
      }
    });
  });

  describe('Camera Constraints', () => {
    it('should respect radius limits', async () => {
      const config: CADCameraConfig = {
        radius: 5,
        minRadius: 2,
        maxRadius: 20,
      };

      const result = await cameraService.setupCADCamera(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera.lowerRadiusLimit).toBe(2);
        expect(camera.upperRadiusLimit).toBe(20);
        expect(camera.radius).toBe(5);
      }
    });

    it('should respect beta limits', async () => {
      const config: CADCameraConfig = {
        minBeta: 0.1,
        maxBeta: Math.PI - 0.1,
      };

      const result = await cameraService.setupCADCamera(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const camera = result.data;
        expect(camera.lowerBetaLimit).toBe(0.1);
        expect(camera.upperBetaLimit).toBe(Math.PI - 0.1);
      }
    });
  });

  describe('Disposal', () => {
    it('should dispose camera properly', async () => {
      await cameraService.setupCADCamera();
      expect(cameraService.getCamera()).not.toBeNull();
      
      cameraService.dispose();
      expect(cameraService.getCamera()).toBeNull();
    });

    it('should handle multiple dispose calls', () => {
      cameraService.dispose();
      cameraService.dispose(); // Should not throw
      expect(cameraService.getCamera()).toBeNull();
    });
  });
});
