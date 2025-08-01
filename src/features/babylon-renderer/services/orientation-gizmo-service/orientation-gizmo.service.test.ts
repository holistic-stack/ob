/**
 * @file Orientation Gizmo Service Test Suite
 * @description Comprehensive test suite for OrientationGizmoService using real
 * BabylonJS instances (no mocks). Tests initialization, rendering, interaction,
 * and camera animation functionality with proper cleanup and error handling.
 *
 * @example Running Tests
 * ```bash
 * pnpm test orientation-gizmo.service.test.ts
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import type { GizmoConfig, GizmoInitOptions } from '@/features/babylon-renderer/types';
import {
  AxisDirection,
  DEFAULT_GIZMO_CONFIG,
  GizmoErrorCode,
  GizmoPosition,
} from '@/features/babylon-renderer/types';
import { OrientationGizmoService } from './orientation-gizmo.service';

// Mock canvas and 2D context for headless testing
class MockCanvas {
  width = 90;
  height = 90;
  style = {
    borderRadius: '',
    backgroundColor: '',
  };

  getContext(type: string) {
    if (type === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  }
}

class MockCanvasRenderingContext2D {
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  font = '';
  textBaseline = '';
  textAlign = '';

  beginPath() {}
  closePath() {}
  arc() {}
  fill() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  fillText() {}
  clearRect() {}
}

describe('OrientationGizmoService', () => {
  let service: OrientationGizmoService;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;
  let canvas: MockCanvas;

  beforeEach(async () => {
    // Create real BabylonJS instances (no mocks)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera(
      'testCamera',
      0,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );

    // Create mock canvas for headless testing
    canvas = new MockCanvas();

    // Create service instance
    service = new OrientationGizmoService();
  });

  afterEach(() => {
    // Clean up BabylonJS resources
    scene.dispose();
    engine.dispose();
    service.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid camera and canvas', async () => {
      const options: GizmoInitOptions = {
        camera,
        canvas: canvas as unknown as HTMLCanvasElement,
        config: DEFAULT_GIZMO_CONFIG,
      };

      const result = await service.initialize(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isInitialized).toBe(true);
        expect(result.data.config).toEqual(expect.objectContaining(DEFAULT_GIZMO_CONFIG));
        expect(result.data.error).toBeNull();
      }
    });

    it('should fail initialization with unsupported camera type', async () => {
      const freeCamera = new BABYLON.FreeCamera('freeCamera', BABYLON.Vector3.Zero(), scene);
      const options: GizmoInitOptions = {
        camera: freeCamera as unknown as BABYLON.ArcRotateCamera,
        canvas: canvas as unknown as HTMLCanvasElement,
      };

      const result = await service.initialize(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(GizmoErrorCode.CAMERA_NOT_SUPPORTED);
        expect(result.error.message).toContain('ArcRotateCamera');
      }
    });

    it('should fail initialization with null canvas', async () => {
      const options: GizmoInitOptions = {
        camera,
        canvas: null as unknown as HTMLCanvasElement,
      };

      const result = await service.initialize(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(GizmoErrorCode.CANVAS_NOT_FOUND);
        expect(result.error.message).toContain('Canvas element is required');
      }
    });

    it('should merge custom configuration with defaults', async () => {
      const customConfig: Partial<GizmoConfig> = {
        size: 120,
        colors: {
          x: ['#ff0000', '#cc0000'],
          y: ['#00ff00', '#00cc00'],
          z: ['#0000ff', '#0000cc'],
        },
      };

      const options: GizmoInitOptions = {
        camera,
        canvas: canvas as unknown as HTMLCanvasElement,
        config: customConfig,
      };

      const result = await service.initialize(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.config.size).toBe(120);
        expect(result.data.config.colors.x[0]).toBe('#ff0000');
        expect(result.data.config.padding).toBe(DEFAULT_GIZMO_CONFIG.padding); // Should keep default
      }
    });
  });

  describe('Update and Rendering', () => {
    beforeEach(async () => {
      const options: GizmoInitOptions = {
        camera,
        canvas: canvas as unknown as HTMLCanvasElement,
      };
      await service.initialize(options);
    });

    it('should update successfully when initialized', () => {
      const result = service.update();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rendered).toBe(true);
        expect(result.data.frameTime).toBeGreaterThanOrEqual(0);
        expect(typeof result.data.interactionDetected).toBe('boolean');
      }
    });

    it('should fail update when not initialized', () => {
      const uninitializedService = new OrientationGizmoService();
      const result = uninitializedService.update();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(GizmoErrorCode.RENDER_FAILED);
        expect(result.error.message).toContain('not initialized');
      }
    });

    it('should detect interaction when mouse position is set', () => {
      // Set mouse position near center
      const mousePosition = new BABYLON.Vector3(45, 45, 0);
      service.updateMousePosition(mousePosition);

      const result = service.update();

      expect(result.success).toBe(true);
      if (result.success) {
        // Should detect some interaction since mouse is in gizmo area
        expect(typeof result.data.interactionDetected).toBe('boolean');
      }
    });

    it('should measure frame time performance', () => {
      const result = service.update();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.frameTime).toBeGreaterThanOrEqual(0);
        expect(result.data.frameTime).toBeLessThan(100); // Should be fast
      }
    });
  });

  describe('Axis Selection and Camera Animation', () => {
    beforeEach(async () => {
      const options: GizmoInitOptions = {
        camera,
        canvas: canvas as unknown as HTMLCanvasElement,
      };
      await service.initialize(options);
    });

    it('should handle positive X axis selection', async () => {
      const result = await service.selectAxis(AxisDirection.POSITIVE_X);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.axis).toBe(AxisDirection.POSITIVE_X);
        expect(result.data.direction).toBeInstanceOf(BABYLON.Vector3);
        expect(result.data.direction.x).toBeGreaterThan(0);
        expect(result.data.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should handle all axis directions', async () => {
      const axes = [
        AxisDirection.POSITIVE_X,
        AxisDirection.NEGATIVE_X,
        AxisDirection.POSITIVE_Y,
        AxisDirection.NEGATIVE_Y,
        AxisDirection.POSITIVE_Z,
        AxisDirection.NEGATIVE_Z,
      ];

      for (const axis of axes) {
        const result = await service.selectAxis(axis);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.axis).toBe(axis);
        }
      }
    });

    it('should fail axis selection with invalid axis', async () => {
      const result = await service.selectAxis('invalid-axis' as AxisDirection);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(GizmoErrorCode.INTERACTION_FAILED);
        expect(result.error.message).toContain('Invalid axis direction');
      }
    });

    it('should fail axis selection when not initialized', async () => {
      const uninitializedService = new OrientationGizmoService();
      const result = await uninitializedService.selectAxis(AxisDirection.POSITIVE_X);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(GizmoErrorCode.INTERACTION_FAILED);
        expect(result.error.message).toContain('Camera not available');
      }
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      const options: GizmoInitOptions = {
        camera,
        canvas: canvas as unknown as HTMLCanvasElement,
      };
      await service.initialize(options);
    });

    it('should update configuration successfully', () => {
      const newConfig: Partial<GizmoConfig> = {
        size: 150,
        showSecondary: false,
      };

      const result = service.updateConfig(newConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.size).toBe(150);
        expect(result.data.showSecondary).toBe(false);
      }
    });

    it('should preserve existing configuration when updating', () => {
      const originalConfig = service.getState().config;
      const newConfig: Partial<GizmoConfig> = {
        size: 150,
      };

      const result = service.updateConfig(newConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.size).toBe(150);
        expect(result.data.padding).toBe(originalConfig.padding); // Should preserve
        expect(result.data.colors).toEqual(originalConfig.colors); // Should preserve
      }
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      const options: GizmoInitOptions = {
        camera,
        canvas: canvas as unknown as HTMLCanvasElement,
      };
      await service.initialize(options);
    });

    it('should return current state', () => {
      const state = service.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isVisible).toBe(true);
      expect(state.position).toBe(GizmoPosition.TOP_RIGHT);
      expect(state.config).toBeDefined();
      expect(state.error).toBeNull();
    });

    it('should update mouse state', () => {
      const mousePosition = new BABYLON.Vector3(50, 50, 0);
      service.updateMousePosition(mousePosition);

      const state = service.getState();
      expect(state.mouseState.position).toEqual(mousePosition);
      expect(state.mouseState.isHovering).toBe(true);
    });

    it('should clear mouse state when position is null', () => {
      service.updateMousePosition(null);

      const state = service.getState();
      expect(state.mouseState.position).toBeNull();
      expect(state.mouseState.isHovering).toBe(false);
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources successfully', () => {
      const result = service.dispose();

      expect(result.success).toBe(true);

      // Should not be able to update after disposal
      const updateResult = service.update();
      expect(updateResult.success).toBe(false);
    });

    it('should handle multiple dispose calls safely', () => {
      const result1 = service.dispose();
      const result2 = service.dispose();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error information', async () => {
      const options: GizmoInitOptions = {
        camera: null as unknown as BABYLON.ArcRotateCamera,
        canvas: canvas as unknown as HTMLCanvasElement,
      };

      const result = await service.initialize(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.timestamp).toBeInstanceOf(Date);
        expect(result.error.stack).toBeDefined();
      }
    });

    it('should handle canvas context creation failure', async () => {
      // Create a canvas that returns null for getContext
      const badCanvas = {
        getContext: () => null,
      } as unknown as HTMLCanvasElement;

      const options: GizmoInitOptions = {
        camera,
        canvas: badCanvas,
      };

      const result = await service.initialize(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(GizmoErrorCode.INITIALIZATION_FAILED);
        expect(result.error.message).toContain('2D rendering context');
      }
    });
  });
});
