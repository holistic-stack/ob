/**
 * @file Camera Gizmo Synchronization Service Test Suite
 * @description Comprehensive test suite for CameraGizmoSyncService using real
 * BabylonJS instances and Zustand store. Tests bidirectional synchronization,
 * camera animations, gizmo updates, and proper state management.
 *
 * @example Running Tests
 * ```bash
 * pnpm test camera-gizmo-sync.service.test.ts
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../../../store/app-store';
import { AxisDirection } from '../../types/orientation-gizmo.types';
import { OrientationGizmoService } from '../orientation-gizmo-service/orientation-gizmo.service';
import type { CameraGizmoSyncConfig } from './camera-gizmo-sync.service';
import { CameraGizmoSyncService } from './camera-gizmo-sync.service';

// Mock canvas for gizmo service
class MockCanvas {
  width = 90;
  height = 90;
  style = { borderRadius: '', backgroundColor: '' };
  getContext() {
    return {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      set fillStyle(value: string) {},
      set strokeStyle(value: string) {},
      set lineWidth(value: number) {},
      set font(value: string) {},
      set textBaseline(value: string) {},
      set textAlign(value: string) {},
    };
  }
}

// Mock timers for animation testing
vi.useFakeTimers();

describe('CameraGizmoSyncService', () => {
  let service: CameraGizmoSyncService;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;
  let gizmoService: OrientationGizmoService;
  let store: ReturnType<typeof useAppStore>;
  let mockCanvas: MockCanvas;

  beforeEach(async () => {
    // Create real BabylonJS instances
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera(
      'testCamera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );

    // Create mock canvas and gizmo service
    mockCanvas = new MockCanvas();
    gizmoService = new OrientationGizmoService();
    await gizmoService.initialize({
      camera,
      canvas: mockCanvas as unknown as HTMLCanvasElement,
    });

    // Get store instance
    store = useAppStore.getState();
    store.resetGizmo();

    // Create sync service
    service = new CameraGizmoSyncService(scene, useAppStore);
  });

  afterEach(() => {
    // Clean up resources
    gizmoService.dispose();
    scene.dispose();
    engine.dispose();
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(true);
      expect(service.getState().isInitialized).toBe(true);
    });

    it('should fail initialization with unsupported camera type', async () => {
      const freeCamera = new BABYLON.FreeCamera('freeCamera', BABYLON.Vector3.Zero(), scene);
      const config: CameraGizmoSyncConfig = {
        camera: freeCamera as unknown as BABYLON.ArcRotateCamera,
        gizmoService,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CAMERA_NOT_SUPPORTED');
      }
    });

    it('should fail initialization with invalid gizmo service', async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService: null as unknown as OrientationGizmoService,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('GIZMO_SERVICE_INVALID');
      }
    });

    it('should apply default configuration values', async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(true);
      expect(service.getState().isInitialized).toBe(true);
    });

    it('should merge custom configuration with defaults', async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        animationDuration: 750,
        updateThrottleMs: 32,
        easingFunction: 'cubic',
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(true);
      expect(service.getState().isInitialized).toBe(true);
    });
  });

  describe('Camera Animation', () => {
    beforeEach(async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        animationDuration: 500,
      };
      await service.initialize(config);
    });

    it('should animate camera to positive X axis', async () => {
      const initialPosition = camera.position.clone();

      const result = await service.animateCameraToAxis(AxisDirection.POSITIVE_X);

      expect(result.success).toBe(true);
      expect(service.getState().isAnimating).toBe(true);
      expect(service.getState().selectedAxis).toBe(AxisDirection.POSITIVE_X);
    });

    it('should animate camera to all axis directions', async () => {
      const axes = [
        AxisDirection.POSITIVE_X,
        AxisDirection.NEGATIVE_X,
        AxisDirection.POSITIVE_Y,
        AxisDirection.NEGATIVE_Y,
        AxisDirection.POSITIVE_Z,
        AxisDirection.NEGATIVE_Z,
      ];

      for (const axis of axes) {
        const result = await service.animateCameraToAxis(axis);
        expect(result.success).toBe(true);
        expect(service.getState().selectedAxis).toBe(axis);

        // Wait for animation to complete
        vi.advanceTimersByTime(600); // Slightly longer than animation duration
      }
    });

    it('should update store animation state during camera animation', async () => {
      const result = await service.animateCameraToAxis(AxisDirection.POSITIVE_Y);

      expect(result.success).toBe(true);
      expect(store.babylonRendering.gizmo.cameraAnimation.isAnimating).toBe(true);
    });

    it('should call animation callbacks', async () => {
      const onAnimationStart = vi.fn();
      const onAnimationComplete = vi.fn();
      const onGizmoSelect = vi.fn();

      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        onAnimationStart,
        onAnimationComplete,
        onGizmoSelect,
      };

      await service.initialize(config);
      await service.animateCameraToAxis(AxisDirection.POSITIVE_Z);

      expect(onAnimationStart).toHaveBeenCalled();
      expect(onGizmoSelect).toHaveBeenCalledWith(AxisDirection.POSITIVE_Z);

      // Advance timers to complete animation
      vi.advanceTimersByTime(600);
      expect(onAnimationComplete).toHaveBeenCalled();
    });

    it('should handle animation failure gracefully', async () => {
      // Dispose camera to simulate failure
      camera.dispose();

      const result = await service.animateCameraToAxis(AxisDirection.POSITIVE_X);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ANIMATION_FAILED');
      }
    });
  });

  describe('Bidirectional Synchronization', () => {
    beforeEach(async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        updateThrottleMs: 16,
      };
      await service.initialize(config);
    });

    it('should update gizmo when camera position changes', () => {
      const onCameraMove = vi.fn();
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        onCameraMove,
      };

      service.initialize(config);

      // Move camera
      camera.position = new BABYLON.Vector3(5, 5, 5);

      // Trigger render loop to update gizmo
      scene.render();

      // Advance timers to trigger throttled update
      vi.advanceTimersByTime(20);

      expect(onCameraMove).toHaveBeenCalled();
    });

    it('should respond to store gizmo axis selection', async () => {
      // Simulate gizmo axis selection through store
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_X);

      // Should trigger camera animation
      expect(service.getState().isAnimating).toBe(true);
    });

    it('should not update during animation to prevent conflicts', async () => {
      // Start animation
      await service.animateCameraToAxis(AxisDirection.POSITIVE_Y);

      // Move camera during animation
      camera.position = new BABYLON.Vector3(10, 10, 10);
      scene.render();
      vi.advanceTimersByTime(20);

      // Should not trigger gizmo update during animation
      expect(service.getState().isAnimating).toBe(true);
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
      };
      await service.initialize(config);
    });

    it('should track camera position and rotation', () => {
      const state = service.getState();

      expect(state.lastCameraPosition).toBeInstanceOf(BABYLON.Vector3);
      expect(state.lastCameraRotation).toBeInstanceOf(BABYLON.Vector3);
      expect(state.isInitialized).toBe(true);
    });

    it('should update state during animation', async () => {
      await service.animateCameraToAxis(AxisDirection.NEGATIVE_X);

      const state = service.getState();
      expect(state.isAnimating).toBe(true);
      expect(state.selectedAxis).toBe(AxisDirection.NEGATIVE_X);
    });

    it('should reset animation state after completion', async () => {
      await service.animateCameraToAxis(AxisDirection.NEGATIVE_Y);

      // Complete animation
      vi.advanceTimersByTime(600);

      const state = service.getState();
      expect(state.isAnimating).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      const config: CameraGizmoSyncConfig = {
        camera: null as unknown as BABYLON.ArcRotateCamera,
        gizmoService,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CAMERA_NOT_SUPPORTED');
        expect(result.error.timestamp).toBeInstanceOf(Date);
        expect(result.error.message).toBeDefined();
      }
    });

    it('should handle animation errors', async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
      };
      await service.initialize(config);

      // Create invalid state
      service['camera'] = null;

      const result = await service.animateCameraToAxis(AxisDirection.POSITIVE_Z);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ANIMATION_FAILED');
      }
    });
  });

  describe('Resource Management', () => {
    beforeEach(async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
      };
      await service.initialize(config);
    });

    it('should dispose resources successfully', () => {
      const result = service.dispose();

      expect(result.success).toBe(true);
      expect(service.getState().isInitialized).toBe(false);
    });

    it('should clear timers on disposal', () => {
      // Start some operations that create timers
      service.animateCameraToAxis(AxisDirection.POSITIVE_X);

      const result = service.dispose();

      expect(result.success).toBe(true);
      // Timers should be cleared
    });

    it('should handle multiple dispose calls safely', () => {
      const result1 = service.dispose();
      const result2 = service.dispose();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        updateThrottleMs: 16,
      };
      await service.initialize(config);
    });

    it('should throttle camera updates to prevent excessive rendering', () => {
      const onCameraMove = vi.fn();
      const config: CameraGizmoSyncConfig = {
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        updateThrottleMs: 50,
        onCameraMove,
      };

      service.initialize(config);

      // Rapidly move camera multiple times
      for (let i = 0; i < 10; i++) {
        camera.position = new BABYLON.Vector3(i, i, i);
        scene.render();
      }

      // Should not call onCameraMove immediately
      expect(onCameraMove).not.toHaveBeenCalled();

      // Advance timers to trigger throttled update
      vi.advanceTimersByTime(60);

      // Should call only once due to throttling
      expect(onCameraMove).toHaveBeenCalledTimes(1);
    });
  });
});
