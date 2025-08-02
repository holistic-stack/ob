/**
 * @file Camera Store Synchronization Service Tests
 * @description Comprehensive tests for camera store synchronization service
 * using real BabylonJS components with NullEngine for headless testing.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@/features/store';
import { CameraStoreSyncService } from './camera-store-sync.service.js';
import type { CameraStoreSyncConfig } from './camera-store-sync.types.js';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('CameraStoreSyncService', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;
  let store: ReturnType<typeof createAppStore>;
  let service: CameraStoreSyncService;

  beforeEach(() => {
    // Create BabylonJS test environment with NullEngine
    engine = new BABYLON.NullEngine({
      renderHeight: 512,
      renderWidth: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    scene = new BABYLON.Scene(engine);

    // Create ArcRotateCamera for testing
    camera = new BABYLON.ArcRotateCamera(
      'testCamera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );

    // Create store instance
    store = createAppStore();

    // Create service instance
    service = new CameraStoreSyncService();

    // Use fake timers for debouncing tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    service.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
        enabled: true,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(true);
    });

    it('should restore camera position from store on initialization', async () => {
      // Set initial camera state in store
      const initialCameraState = {
        position: [10, 15, 20] as const,
        target: [5, 5, 5] as const,
        zoom: 0.5,
      };

      store.getState().updateCamera(initialCameraState);

      // Initialize service - should restore camera position
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
        enabled: true,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(true);

      // Verify camera position was restored
      expect(camera.position.x).toBeCloseTo(10, 5);
      expect(camera.position.y).toBeCloseTo(15, 5);
      expect(camera.position.z).toBeCloseTo(20, 5);

      // Verify camera target was restored
      expect(camera.target.x).toBeCloseTo(5, 5);
      expect(camera.target.y).toBeCloseTo(5, 5);
      expect(camera.target.z).toBeCloseTo(5, 5);

      // Verify camera radius was restored (zoom = 0.5 means radius = 2)
      expect(camera.radius).toBeCloseTo(2, 5);
    });

    it('should not restore camera position if store has default values', async () => {
      // Set default camera state in store (should not trigger restoration)
      const defaultCameraState = {
        position: [10, 10, 10] as const,
        target: [0, 0, 0] as const,
        zoom: 1,
      };

      store.getState().updateCamera(defaultCameraState);

      // Set camera to different position initially
      camera.position.x = 5;
      camera.position.y = 5;
      camera.position.z = 5;
      camera.target.x = 1;
      camera.target.y = 1;
      camera.target.z = 1;
      camera.radius = 10;

      // Initialize service - should NOT restore camera position (defaults)
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
        enabled: true,
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(true);

      // Verify camera position was NOT changed (still at initial values)
      expect(camera.position.x).toBeCloseTo(5, 5);
      expect(camera.position.y).toBeCloseTo(5, 5);
      expect(camera.position.z).toBeCloseTo(5, 5);
      expect(camera.target.x).toBeCloseTo(1, 5);
      expect(camera.target.y).toBeCloseTo(1, 5);
      expect(camera.target.z).toBeCloseTo(1, 5);
      expect(camera.radius).toBeCloseTo(10, 5);
    });

    it('should handle complete page refresh scenario', async () => {
      // Simulate user moving camera and state being saved
      const userCameraState = {
        position: [15, 20, 25] as const,
        target: [2, 3, 4] as const,
        zoom: 0.8,
      };

      // First session: user moves camera, state gets saved to store
      store.getState().updateCamera(userCameraState);

      // Initialize service (simulating first load)
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any,
        debounceMs: 100,
        enabled: true,
      };

      const result1 = await service.initialize(config);
      expect(result1.success).toBe(true);

      // Verify camera was restored to user's position
      expect(camera.position.x).toBeCloseTo(15, 5);
      expect(camera.position.y).toBeCloseTo(20, 5);
      expect(camera.position.z).toBeCloseTo(25, 5);
      expect(camera.target.x).toBeCloseTo(2, 5);
      expect(camera.target.y).toBeCloseTo(3, 5);
      expect(camera.target.z).toBeCloseTo(4, 5);
      expect(camera.radius).toBeCloseTo(1.25, 5); // 1/0.8

      // Simulate user making another camera change by changing target and radius
      camera.target.x = 5;
      camera.target.y = 6;
      camera.target.z = 7;
      camera.radius = 8; // zoom = 1/8 = 0.125

      // Trigger camera change and wait for store update
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);
      vi.advanceTimersByTime(150);

      // Get the actual camera state after BabylonJS calculations
      const actualPosition = [
        camera.position.x ?? 0,
        camera.position.y ?? 0,
        camera.position.z ?? 0,
      ];
      const actualTarget = [camera.target.x ?? 0, camera.target.y ?? 0, camera.target.z ?? 0];
      const actualZoom = 1 / (camera.radius ?? 1);

      // Verify store was updated with actual camera state
      const updatedState = store.getState().babylonRendering.camera;
      expect(updatedState.position?.[0] ?? 0).toBeCloseTo(actualPosition[0] ?? 0, 5);
      expect(updatedState.position?.[1] ?? 0).toBeCloseTo(actualPosition[1] ?? 0, 5);
      expect(updatedState.position?.[2] ?? 0).toBeCloseTo(actualPosition[2] ?? 0, 5);
      expect(updatedState.target?.[0] ?? 0).toBeCloseTo(actualTarget[0] ?? 0, 5);
      expect(updatedState.target?.[1] ?? 0).toBeCloseTo(actualTarget[1] ?? 0, 5);
      expect(updatedState.target?.[2] ?? 0).toBeCloseTo(actualTarget[2] ?? 0, 5);
      expect(updatedState.zoom).toBeCloseTo(actualZoom, 5);

      // Dispose current service (simulating page unload)
      service.dispose();

      // Create new service and camera (simulating page refresh)
      const newService = new CameraStoreSyncService();
      const newCamera = new BABYLON.ArcRotateCamera(
        'refreshedCamera',
        Math.PI / 4,
        Math.PI / 3,
        10,
        BABYLON.Vector3.Zero(),
        scene
      );

      // Initialize new service (simulating page reload)
      const newConfig: CameraStoreSyncConfig = {
        camera: newCamera,
        store: store as any,
        debounceMs: 100,
        enabled: true,
      };

      const result2 = await newService.initialize(newConfig);
      expect(result2.success).toBe(true);

      // Verify camera was restored to the last saved position
      expect(newCamera.position.x).toBeCloseTo(actualPosition[0] ?? 0, 5);
      expect(newCamera.position.y).toBeCloseTo(actualPosition[1] ?? 0, 5);
      expect(newCamera.position.z).toBeCloseTo(actualPosition[2] ?? 0, 5);
      expect(newCamera.target.x).toBeCloseTo(actualTarget[0] ?? 0, 5);
      expect(newCamera.target.y).toBeCloseTo(actualTarget[1] ?? 0, 5);
      expect(newCamera.target.z).toBeCloseTo(actualTarget[2] ?? 0, 5);
      expect(newCamera.radius).toBeCloseTo(8, 5);

      // Cleanup
      newService.dispose();
    });

    it('should fail initialization with invalid camera type', async () => {
      const freeCamera = new BABYLON.FreeCamera('freeCamera', BABYLON.Vector3.Zero(), scene);

      const config: CameraStoreSyncConfig = {
        camera: freeCamera as any, // Type assertion to test error handling
        store: store as any, // Type assertion for test compatibility
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CAMERA_NOT_SUPPORTED');
      }
    });

    it('should fail initialization without camera', async () => {
      const config: CameraStoreSyncConfig = {
        camera: null as any,
        store: store as any, // Type assertion for test compatibility
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CAMERA_NOT_SUPPORTED');
      }
    });

    it('should fail initialization without store', async () => {
      const config: CameraStoreSyncConfig = {
        camera,
        store: null as any, // Type assertion for test compatibility
      };

      const result = await service.initialize(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('STORE_NOT_AVAILABLE');
      }
    });
  });

  describe('Camera State Synchronization', () => {
    beforeEach(async () => {
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
        enabled: true,
      };

      await service.initialize(config);
    });

    it('should update store when camera position changes', async () => {
      const initialState = store.getState().babylonRendering.camera;

      // Change camera position
      camera.position = new BABYLON.Vector3(5, 5, 5);

      // Trigger view matrix change by forcing a recalculation
      camera.getViewMatrix(true);
      // Manually trigger the observable for testing
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Wait for debounced update
      vi.advanceTimersByTime(150);

      const updatedState = store.getState().babylonRendering.camera;

      // Position should be updated
      expect(updatedState.position).not.toEqual(initialState.position);
      expect(updatedState.position[0]).toBeCloseTo(5, 5);
      expect(updatedState.position[1]).toBeCloseTo(5, 5);
      expect(updatedState.position[2]).toBeCloseTo(5, 5);
    });

    it('should update store when camera target changes', async () => {
      const initialState = store.getState().babylonRendering.camera;

      // Change camera target
      camera.target = new BABYLON.Vector3(2, 2, 2);

      // Trigger view matrix change by forcing a recalculation
      camera.getViewMatrix(true);
      // Manually trigger the observable for testing
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Wait for debounced update
      vi.advanceTimersByTime(150);

      const updatedState = store.getState().babylonRendering.camera;

      // Target should be updated
      expect(updatedState.target).not.toEqual(initialState.target);
      expect(updatedState.target).toEqual([2, 2, 2]);
    });

    it('should debounce rapid camera changes', async () => {
      const updateSpy = vi.spyOn(store.getState(), 'updateCamera');

      // Make multiple rapid changes
      camera.position = new BABYLON.Vector3(1, 1, 1);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      camera.position = new BABYLON.Vector3(2, 2, 2);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      camera.position = new BABYLON.Vector3(3, 3, 3);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Should not update immediately
      expect(updateSpy).not.toHaveBeenCalled();

      // Wait for debounced update
      vi.advanceTimersByTime(150);

      // Should only update once with final position
      expect(updateSpy).toHaveBeenCalledTimes(1);
      const lastCall = updateSpy.mock.calls[0]?.[0];
      expect(lastCall).toBeDefined();
      expect(lastCall?.position).toBeDefined();
      if (lastCall?.position) {
        expect(lastCall.position[0]).toBeCloseTo(3, 5);
        expect(lastCall.position[1]).toBeCloseTo(3, 5);
        expect(lastCall.position[2]).toBeCloseTo(3, 5);
      }
    });

    it('should not update store when disabled', async () => {
      const updateSpy = vi.spyOn(store.getState(), 'updateCamera');

      // Disable synchronization
      service.disable();

      // Change camera position
      camera.position = new BABYLON.Vector3(5, 5, 5);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Wait for potential debounced update
      vi.advanceTimersByTime(150);

      // Should not update store
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should resume updates when re-enabled', async () => {
      const updateSpy = vi.spyOn(store.getState(), 'updateCamera');

      // Disable and re-enable
      service.disable();
      service.enable();

      // Change camera position
      camera.position = new BABYLON.Vector3(5, 5, 5);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Wait for debounced update
      vi.advanceTimersByTime(150);

      // Should update store
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks and Error Handling', () => {
    it('should call onCameraStateChange callback', async () => {
      const onCameraStateChange = vi.fn();

      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
        onCameraStateChange,
      };

      await service.initialize(config);

      // Change camera position
      camera.position = new BABYLON.Vector3(5, 5, 5);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Wait for debounced update
      vi.advanceTimersByTime(150);

      expect(onCameraStateChange).toHaveBeenCalledTimes(1);
      const callArgs = onCameraStateChange.mock.calls[0][0];
      expect(callArgs.position[0]).toBeCloseTo(5, 5);
      expect(callArgs.position[1]).toBeCloseTo(5, 5);
      expect(callArgs.position[2]).toBeCloseTo(5, 5);
    });

    it('should use custom state mapper when provided', async () => {
      const customStateMapper = vi.fn().mockReturnValue({
        position: [10, 10, 10],
        customProperty: 'test',
      });

      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
        stateMapper: customStateMapper,
      };

      await service.initialize(config);

      // Change camera position
      camera.position = new BABYLON.Vector3(5, 5, 5);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);

      // Wait for debounced update
      vi.advanceTimersByTime(150);

      expect(customStateMapper).toHaveBeenCalledWith(camera);

      const updatedState = store.getState().babylonRendering.camera;
      expect(updatedState.position).toEqual([10, 10, 10]);
    });
  });

  describe('Performance and Metrics', () => {
    beforeEach(async () => {
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
      };

      await service.initialize(config);
    });

    it('should track performance metrics', async () => {
      // Make some camera changes
      camera.position = new BABYLON.Vector3(1, 1, 1);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);
      vi.advanceTimersByTime(150);

      camera.position = new BABYLON.Vector3(2, 2, 2);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);
      vi.advanceTimersByTime(150);

      const metrics = service.getMetrics();

      expect(metrics.totalUpdates).toBe(2);
      expect(metrics.averageUpdateTime).toBeGreaterThan(0);
      expect(metrics.lastUpdateDuration).toBeGreaterThan(0);
    });

    it('should skip updates for identical camera states', async () => {
      // Get initial metrics
      const initialMetrics = service.getMetrics();
      const initialTotalUpdates = initialMetrics.totalUpdates;
      const initialSkippedUpdates = initialMetrics.skippedUpdates;

      // Set a unique position to ensure we get an update
      camera.position = new BABYLON.Vector3(7.123, 8.456, 9.789);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);
      vi.advanceTimersByTime(150);

      const afterFirstUpdate = service.getMetrics();
      const updatesAfterFirst = afterFirstUpdate.totalUpdates - initialTotalUpdates;

      // Set the exact same position again - this should be skipped
      camera.position = new BABYLON.Vector3(7.123, 8.456, 9.789);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);
      vi.advanceTimersByTime(150);

      const finalMetrics = service.getMetrics();
      const finalTotalUpdates = finalMetrics.totalUpdates - initialTotalUpdates;
      const finalSkippedUpdates = finalMetrics.skippedUpdates - initialSkippedUpdates;

      // Should have the same number of total updates (no new update for identical position)
      expect(finalTotalUpdates).toBe(updatesAfterFirst);
      // Should have at least one skipped update
      expect(finalSkippedUpdates).toBeGreaterThan(0);
    });
  });

  describe('Disposal and Cleanup', () => {
    it('should dispose cleanly', async () => {
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
        debounceMs: 100,
      };

      await service.initialize(config);

      // Should not throw
      expect(() => service.dispose()).not.toThrow();

      // Should not update store after disposal
      const updateSpy = vi.spyOn(store.getState(), 'updateCamera');

      camera.position = new BABYLON.Vector3(5, 5, 5);
      camera.getViewMatrix(true);
      camera.onViewMatrixChangedObservable.notifyObservers(camera);
      vi.advanceTimersByTime(150);

      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple dispose calls gracefully', async () => {
      const config: CameraStoreSyncConfig = {
        camera,
        store: store as any, // Type assertion for test compatibility
      };

      await service.initialize(config);

      // Multiple dispose calls should not throw
      expect(() => {
        service.dispose();
        service.dispose();
        service.dispose();
      }).not.toThrow();
    });
  });
});
