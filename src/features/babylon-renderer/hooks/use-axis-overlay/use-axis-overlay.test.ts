/**
 * @file use-axis-overlay.test.ts
 * @description Test suite for useAxisOverlay hook using real BabylonJS NullEngine
 * and Zustand store integration following TDD methodology.
 */

import * as BABYLON from '@babylonjs/core';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAxisOverlay } from './use-axis-overlay';

// Mock ResizeObserver for testing environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('useAxisOverlay', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let camera: BABYLON.ArcRotateCamera;

  beforeEach(async () => {
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();

    // Create a real scene
    scene = new BABYLON.Scene(engine);

    // Create camera
    camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
  });

  afterEach(() => {
    // Clean up
    scene.dispose();
    engine.dispose();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAxisOverlay());

      expect(result.current.service).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isVisible).toBe(false);
      expect(result.current.config).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useAxisOverlay());

      expect(typeof result.current.initialize).toBe('function');
      expect(typeof result.current.setVisibility).toBe('function');
      expect(typeof result.current.updateConfig).toBe('function');
      expect(typeof result.current.updateDynamicTicks).toBe('function');
      expect(typeof result.current.dispose).toBe('function');
    });
  });

  describe('Service Initialization', () => {
    it('should initialize service successfully', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        const initResult = await result.current.initialize(scene, camera);
        expect(initResult.success).toBe(true);
      });

      expect(result.current.service).not.toBeNull();
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle initialization failure gracefully', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        const initResult = await result.current.initialize(null as any, camera);
        expect(initResult.success).toBe(false);
      });

      expect(result.current.service).not.toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('INITIALIZATION_FAILED');
    });

    it('should not reinitialize if service already exists', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      const firstService = result.current.service;

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      expect(result.current.service).toBe(firstService);
    });
  });

  describe('Visibility Management', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAxisOverlay());
      await act(async () => {
        await result.current.initialize(scene, camera);
      });
    });

    it('should set visibility to true', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      act(() => {
        const visibilityResult = result.current.setVisibility(true);
        expect(visibilityResult.success).toBe(true);
        if (!visibilityResult.success) {
          expect(visibilityResult.error).toBeDefined();
        }
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('should set visibility to false', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      act(() => {
        result.current.setVisibility(true);
        const visibilityResult = result.current.setVisibility(false);
        expect(visibilityResult.success).toBe(true);
        if (!visibilityResult.success) {
          expect(visibilityResult.error).toBeDefined();
        }
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('should handle visibility change without initialized service', () => {
      const { result } = renderHook(() => useAxisOverlay());

      act(() => {
        const visibilityResult = result.current.setVisibility(true);
        expect(visibilityResult.success).toBe(false);
        if (!visibilityResult.success) {
          expect(visibilityResult.error.type).toBe('INITIALIZATION_FAILED');
        }
      });
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAxisOverlay());
      await act(async () => {
        await result.current.initialize(scene, camera);
      });
    });

    it('should update configuration successfully', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      const newConfig = {
        tickInterval: 5.0,
        fontSize: 20,
        showTicks: false,
      };

      act(() => {
        const configResult = result.current.updateConfig(newConfig);
        expect(configResult.success).toBe(true);
        if (!configResult.success) {
          expect(configResult.error).toBeDefined();
        }
      });

      expect(result.current.config.tickInterval).toBe(5.0);
      expect(result.current.config.fontSize).toBe(20);
      expect(result.current.config.showTicks).toBe(false);
    });

    it('should handle configuration update without initialized service', () => {
      const { result } = renderHook(() => useAxisOverlay());

      act(() => {
        const configResult = result.current.updateConfig({ tickInterval: 2.0 });
        expect(configResult.success).toBe(false);
        if (!configResult.success) {
          expect(configResult.error.type).toBe('INITIALIZATION_FAILED');
        }
      });
    });
  });

  describe('Dynamic Tick Updates', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAxisOverlay());
      await act(async () => {
        await result.current.initialize(scene, camera);
      });
    });

    it('should update dynamic ticks based on camera distance', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      const cameraDistance = 50.0;

      act(() => {
        const ticksResult = result.current.updateDynamicTicks(cameraDistance);
        expect(ticksResult.success).toBe(true);
      });

      // Note: The exact dynamic tick interval calculation is tested in the service tests
      expect(result.current.error).toBeNull();
    });

    it('should handle dynamic tick update without initialized service', () => {
      const { result } = renderHook(() => useAxisOverlay());

      act(() => {
        const ticksResult = result.current.updateDynamicTicks(25.0);
        expect(ticksResult.success).toBe(false);
        if (!ticksResult.success) {
          expect(ticksResult.error.type).toBe('INITIALIZATION_FAILED');
        }
      });
    });
  });

  describe('Resource Disposal', () => {
    it('should dispose service successfully', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      expect(result.current.service).not.toBeNull();
      expect(result.current.isInitialized).toBe(true);

      act(() => {
        const disposeResult = result.current.dispose();
        expect(disposeResult.success).toBe(true);
      });

      expect(result.current.service).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });

    it('should handle multiple dispose calls gracefully', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      act(() => {
        result.current.dispose();
        const secondDisposeResult = result.current.dispose();
        expect(secondDisposeResult.success).toBe(true);
      });
    });

    it('should automatically dispose on unmount', async () => {
      const { result, unmount } = renderHook(() => useAxisOverlay());

      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      expect(result.current.service).not.toBeNull();

      unmount();

      // Service should be disposed automatically
      // Note: We can't directly test the disposal since the component is unmounted,
      // but the useEffect cleanup should handle it
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors and update store state', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      await act(async () => {
        const initResult = await result.current.initialize(null as any, camera);
        expect(initResult.success).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('INITIALIZATION_FAILED');
    });

    it('should clear errors on successful operations', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      // Force an error first
      await act(async () => {
        await result.current.initialize(null as any, camera);
      });

      expect(result.current.error).not.toBeNull();

      // Successful operation should clear error
      await act(async () => {
        await result.current.initialize(scene, camera);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should work with complete initialization and operation flow', async () => {
      const { result } = renderHook(() => useAxisOverlay());

      // Initialize
      await act(async () => {
        const initResult = await result.current.initialize(scene, camera);
        expect(initResult.success).toBe(true);
      });

      // Configure
      act(() => {
        const configResult = result.current.updateConfig({
          tickInterval: 2.0,
          showLabels: true,
          fontSize: 14,
        });
        expect(configResult.success).toBe(true);
      });

      // Set visibility
      act(() => {
        const visibilityResult = result.current.setVisibility(true);
        expect(visibilityResult.success).toBe(true);
      });

      // Update dynamic ticks
      act(() => {
        const ticksResult = result.current.updateDynamicTicks(25.0);
        expect(ticksResult.success).toBe(true);
      });

      // Verify final state
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.isVisible).toBe(true);
      expect(result.current.config.tickInterval).toBe(2.0);
      expect(result.current.error).toBeNull();

      // Dispose
      act(() => {
        const disposeResult = result.current.dispose();
        expect(disposeResult.success).toBe(true);
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.service).toBeNull();
    });
  });
});
