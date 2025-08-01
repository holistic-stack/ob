/**
 * @file Orientation Gizmo Integration Test Suite
 * @description Comprehensive integration tests for the complete orientation gizmo
 * system including service, component, store integration, and camera synchronization.
 * Uses real BabylonJS instances and Zustand store for authentic testing.
 *
 * @example Running Tests
 * ```bash
 * pnpm test orientation-gizmo-integration.test.tsx
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AxisDirection,
  DEFAULT_GIZMO_CONFIG,
  GizmoPosition,
} from '@/features/babylon-renderer/types';
import type { AppStore } from '@/features/store';
import { appStoreInstance } from '@/features/store';
import { CameraGizmoSyncService } from '../../services/camera-gizmo-sync/camera-gizmo-sync.service';
import { OrientationGizmoService } from '../../services/orientation-gizmo-service/orientation-gizmo.service';
import { OrientationGizmo } from './orientation-gizmo';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame for controlled testing
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock canvas 2D context for headless testing
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textBaseline: 'alphabetic',
  textAlign: 'start',
};

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type: string) => {
  if (type === '2d') {
    return mockContext;
  }
  return null;
}) as any;

HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
  left: 0,
  top: 0,
  right: 90,
  bottom: 90,
  width: 90,
  height: 90,
  x: 0,
  y: 0,
  toJSON: () => {},
}));

describe.skip('OrientationGizmo Integration Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let camera: BABYLON.ArcRotateCamera;
  let gizmoService: OrientationGizmoService;
  let syncService: CameraGizmoSyncService;
  let store: AppStore;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create real BabylonJS instances (no mocks)
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

    // Reset store state
    store = appStoreInstance.getState();
    store.resetGizmo();
    store.setGizmoVisibility(true);

    // Create gizmo service
    gizmoService = new OrientationGizmoService();

    // Create sync service
    syncService = new CameraGizmoSyncService(scene, appStoreInstance);
  });

  afterEach(() => {
    // Clean up resources
    gizmoService.dispose();
    syncService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Complete Gizmo System Integration', () => {
    it('should initialize complete gizmo system successfully', async () => {
      // Initialize gizmo service
      const canvas = document.createElement('canvas');
      const initResult = await gizmoService.initialize({
        camera,
        canvas,
        config: DEFAULT_GIZMO_CONFIG,
      });

      expect(initResult.success).toBe(true);

      // Initialize sync service
      const syncResult = await syncService.initialize({
        camera,
        gizmoService,
        enableBidirectionalSync: true,
      });

      expect(syncResult.success).toBe(true);

      // Verify system state
      expect(gizmoService.getState().isInitialized).toBe(true);
      expect(syncService.getState().isInitialized).toBe(true);
    });

    it('should handle complete axis selection workflow', async () => {
      // Setup complete system
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });
      await syncService.initialize({
        camera,
        gizmoService,
        enableBidirectionalSync: true,
      });

      // Simulate axis selection through store
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_X);

      // Verify gizmo service responds
      const gizmoState = gizmoService.getState();
      expect(gizmoState.selectedAxis).toBe(AxisDirection.POSITIVE_X);

      // Verify sync service responds
      const syncState = syncService.getState();
      expect(syncState.selectedAxis).toBe(AxisDirection.POSITIVE_X);
    });

    it('should synchronize camera movements with gizmo updates', async () => {
      // Setup system
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });
      await syncService.initialize({
        camera,
        gizmoService,
        enableBidirectionalSync: true,
      });

      // Move camera
      const originalPosition = camera.position.clone();
      camera.position = new BABYLON.Vector3(5, 5, 5);

      // Trigger scene render to update sync
      scene.render();

      // Verify gizmo service can update
      const updateResult = gizmoService.update();
      expect(updateResult.success).toBe(true);

      // Verify sync service tracks camera changes
      const syncState = syncService.getState();
      expect(syncState.lastCameraPosition).not.toEqual(originalPosition);
    });
  });

  describe('React Component Integration', () => {
    it('should render gizmo component with full system integration', async () => {
      render(<OrientationGizmo camera={camera} />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
        expect(screen.getByTestId('gizmo-canvas')).toBeInTheDocument();
      });
    });

    it('should handle mouse interactions with complete system', async () => {
      const onAxisSelected = vi.fn();
      render(<OrientationGizmo camera={camera} onAxisSelected={onAxisSelected} />);

      await waitFor(() => {
        const canvas = screen.getByTestId('gizmo-canvas');
        expect(canvas).toBeInTheDocument();
      });

      const canvas = screen.getByTestId('gizmo-canvas');

      // Simulate mouse interaction
      fireEvent.mouseMove(canvas, { clientX: 45, clientY: 45 });

      // Simulate axis selection
      store.setGizmoSelectedAxis(AxisDirection.POSITIVE_Y);
      fireEvent.click(canvas);

      // Verify interaction handling
      await waitFor(() => {
        expect(store.babylonRendering.gizmo.cameraAnimation.isAnimating).toBe(true);
      });
    });

    it('should update component when store state changes', async () => {
      const { rerender } = render(<OrientationGizmo camera={camera} />);

      // Initially visible
      await waitFor(() => {
        expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
      });

      // Hide through store
      store.setGizmoVisibility(false);
      rerender(<OrientationGizmo camera={camera} />);

      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();

      // Show again
      store.setGizmoVisibility(true);
      rerender(<OrientationGizmo camera={camera} />);

      await waitFor(() => {
        expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service initialization failures gracefully', async () => {
      const onError = vi.fn();

      // Try to initialize with invalid camera
      const invalidCamera = null;

      render(<OrientationGizmo camera={invalidCamera} onError={onError} />);

      // Component should not render with null camera
      expect(screen.queryByTestId('orientation-gizmo')).not.toBeInTheDocument();
    });

    it('should handle sync service errors gracefully', async () => {
      // Initialize gizmo service successfully
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });

      // Try to initialize sync service with invalid configuration
      const result = await syncService.initialize({
        camera: null as unknown as BABYLON.ArcRotateCamera,
        gizmoService,
      });

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.code).toBe('CAMERA_NOT_SUPPORTED');
      }
    });

    it('should recover from animation errors', async () => {
      // Setup system
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });
      await syncService.initialize({
        camera,
        gizmoService,
        enableBidirectionalSync: true,
      });

      // Dispose camera to simulate error condition
      camera.dispose();

      // Try to animate - should fail gracefully
      const result = await syncService.animateCameraToAxis(AxisDirection.POSITIVE_Z);

      expect(result.success).toBe(false);
      if (!result.success && result.error) {
        expect(result.error.code).toBe('ANIMATION_FAILED');
      }
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance targets with complete system', async () => {
      // Setup complete system
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });
      await syncService.initialize({
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        updateThrottleMs: 16, // 60fps
      });

      // Measure update performance
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        const updateResult = gizmoService.update();
        expect(updateResult.success).toBe(true);

        if (updateResult.success) {
          // Should maintain <16ms target
          expect(updateResult.data.frameTime).toBeLessThan(16);
        }
      }

      const totalTime = performance.now() - startTime;
      const averageTime = totalTime / 10;

      // Average should be well under target
      expect(averageTime).toBeLessThan(10);
    });

    it('should handle rapid camera movements efficiently', async () => {
      // Setup system with throttling
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });

      const onCameraMove = vi.fn();
      await syncService.initialize({
        camera,
        gizmoService,
        enableBidirectionalSync: true,
        updateThrottleMs: 50, // Throttle to 20fps for testing
        onCameraMove,
      });

      // Rapidly move camera multiple times
      for (let i = 0; i < 10; i++) {
        camera.position = new BABYLON.Vector3(i, i, i);
        scene.render();
      }

      // Should throttle updates
      expect(onCameraMove).not.toHaveBeenCalled();

      // Wait for throttle to complete
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should have called only once due to throttling
      expect(onCameraMove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Integration', () => {
    it('should apply configuration changes across the system', async () => {
      // Setup system
      const canvas = document.createElement('canvas');
      await gizmoService.initialize({ camera, canvas });

      // Update configuration through store
      const newConfig = {
        size: 120,
        colors: {
          x: ['#ff0000', '#cc0000'] as const,
          y: ['#00ff00', '#00cc00'] as const,
          z: ['#0000ff', '#0000cc'] as const,
        },
      };

      store.updateGizmoConfig(newConfig);

      // Verify service reflects changes
      const serviceResult = gizmoService.updateConfig(newConfig);
      expect(serviceResult.success).toBe(true);

      if (serviceResult.success) {
        expect(serviceResult.data.size).toBe(120);
        expect(serviceResult.data.colors.x[0]).toBe('#ff0000');
      }
    });

    it('should handle position changes correctly', async () => {
      // Test different gizmo positions
      const positions = [
        GizmoPosition.TOP_LEFT,
        GizmoPosition.TOP_RIGHT,
        GizmoPosition.BOTTOM_LEFT,
        GizmoPosition.BOTTOM_RIGHT,
      ];

      for (const position of positions) {
        store.setGizmoPosition(position);

        render(<OrientationGizmo camera={camera} position={position} />);

        await waitFor(() => {
          expect(screen.getByTestId('orientation-gizmo')).toBeInTheDocument();
        });

        // Verify position is applied
        expect(store.babylonRendering.gizmo.position).toBe(position);
      }
    });
  });
});
