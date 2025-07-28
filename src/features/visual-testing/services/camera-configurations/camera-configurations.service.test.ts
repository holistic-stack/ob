/**
 * @file Camera Configuration Service Tests
 *
 * Unit tests for camera configuration service using real BabylonJS instances.
 * Tests camera configuration retrieval, application, and creation with proper
 * resource management and error handling.
 *
 * @example
 * Tests validate:
 * - Camera configuration retrieval for all angles
 * - Proper camera parameter application
 * - Error handling for invalid configurations
 * - Resource cleanup and disposal
 */

import { ArcRotateCamera, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '@/shared/services/logger.service';
import type { CameraAngle } from '../../types/visual-testing.types';
import {
  applyCameraConfiguration,
  createConfiguredCamera,
  getAvailableCameraAngles,
  getCameraConfiguration,
  isValidCameraAngle,
} from './camera-configurations.service';

const logger = createLogger('CameraConfigurationServiceTest');

describe('Camera Configuration Service', () => {
  let engine: NullEngine;
  let scene: Scene;

  beforeEach(() => {
    logger.debug('[SETUP] Initializing camera configuration test environment');

    // Create BabylonJS test environment
    engine = new NullEngine();
    scene = new Scene(engine);
  });

  afterEach(() => {
    // Clean up BabylonJS resources
    if (scene) {
      scene.dispose();
    }
    if (engine) {
      engine.dispose();
    }

    logger.debug('[CLEANUP] Camera configuration test environment cleaned up');
  });

  describe('getCameraConfiguration', () => {
    const validAngles: CameraAngle[] = ['front', 'top', 'isometric', 'side'];

    validAngles.forEach((angle) => {
      it(`should return valid configuration for ${angle} angle`, () => {
        const result = getCameraConfiguration(angle);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.angle).toBe(angle);
          expect(result.data.position).toHaveLength(3);
          expect(result.data.target).toHaveLength(3);
          expect(typeof result.data.alpha).toBe('number');
          expect(typeof result.data.beta).toBe('number');
          expect(typeof result.data.radius).toBe('number');
        }
      });
    });

    it('should return error for invalid angle', () => {
      const result = getCameraConfiguration('invalid' as CameraAngle);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('INVALID_ANGLE');
      }
    });
  });

  describe('applyCameraConfiguration', () => {
    let camera: ArcRotateCamera;

    beforeEach(() => {
      camera = new ArcRotateCamera('testCamera', 0, 0, 10, Vector3.Zero(), scene);
    });

    it('should apply front view configuration correctly', async () => {
      const configResult = getCameraConfiguration('front');
      expect(configResult.success).toBe(true);

      if (configResult.success) {
        const result = await applyCameraConfiguration(camera, configResult.data);

        expect(result.success).toBe(true);
        expect(camera.alpha).toBe(0);
        expect(camera.beta).toBe(Math.PI / 2);
        expect(camera.radius).toBe(20);
      }
    });

    it('should apply isometric view configuration correctly', async () => {
      const configResult = getCameraConfiguration('isometric');
      expect(configResult.success).toBe(true);

      if (configResult.success) {
        const result = await applyCameraConfiguration(camera, configResult.data);

        expect(result.success).toBe(true);
        expect(camera.alpha).toBe(Math.PI / 4);
        expect(camera.beta).toBe(Math.PI / 3);
        expect(camera.radius).toBeCloseTo(25.98, 2);
      }
    });

    it('should apply top view configuration correctly', async () => {
      const configResult = getCameraConfiguration('top');
      expect(configResult.success).toBe(true);

      if (configResult.success) {
        const result = await applyCameraConfiguration(camera, configResult.data);

        expect(result.success).toBe(true);
        expect(camera.alpha).toBe(0);
        expect(camera.beta).toBe(0);
        expect(camera.radius).toBe(20);
      }
    });

    it('should apply side view configuration correctly', async () => {
      const configResult = getCameraConfiguration('side');
      expect(configResult.success).toBe(true);

      if (configResult.success) {
        const result = await applyCameraConfiguration(camera, configResult.data);

        expect(result.success).toBe(true);
        expect(camera.alpha).toBe(Math.PI / 2);
        expect(camera.beta).toBe(Math.PI / 2);
        expect(camera.radius).toBe(20);
      }
    });
  });

  describe('createConfiguredCamera', () => {
    it('should create camera with front view configuration', async () => {
      const result = await createConfiguredCamera(scene, 'front');

      expect(result.success).toBe(true);
      if (result.success) {
        const camera = result.data;
        expect(camera.name).toBe('visualTestCamera');
        expect(camera.alpha).toBe(0);
        expect(camera.beta).toBe(Math.PI / 2);
        expect(camera.radius).toBe(20);
      }
    });

    it('should create camera with custom name', async () => {
      const customName = 'customTestCamera';
      const result = await createConfiguredCamera(scene, 'isometric', customName);

      expect(result.success).toBe(true);
      if (result.success) {
        const camera = result.data;
        expect(camera.name).toBe(customName);
      }
    });

    it('should handle invalid angle gracefully', async () => {
      const result = await createConfiguredCamera(scene, 'invalid' as CameraAngle);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('CONFIGURATION_FAILED');
      }
    });
  });

  describe('getAvailableCameraAngles', () => {
    it('should return all available camera angles', () => {
      const angles = getAvailableCameraAngles();

      expect(angles).toHaveLength(4);
      expect(angles).toContain('front');
      expect(angles).toContain('top');
      expect(angles).toContain('isometric');
      expect(angles).toContain('side');
    });
  });

  describe('isValidCameraAngle', () => {
    it('should validate correct camera angles', () => {
      expect(isValidCameraAngle('front')).toBe(true);
      expect(isValidCameraAngle('top')).toBe(true);
      expect(isValidCameraAngle('isometric')).toBe(true);
      expect(isValidCameraAngle('side')).toBe(true);
    });

    it('should reject invalid camera angles', () => {
      expect(isValidCameraAngle('invalid')).toBe(false);
      expect(isValidCameraAngle('bottom')).toBe(false);
      expect(isValidCameraAngle('')).toBe(false);
    });
  });
});
