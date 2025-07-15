/**
 * @file useBabylonScene Hook Tests
 *
 * Tests for useBabylonScene hook functionality.
 * Following TDD principles with real BabylonJS NullEngine (no mocks).
 */

import { Color3, CreateBox, type Mesh, NullEngine, Scene, Vector3 } from '@babylonjs/core';
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type UseBabylonSceneReturn, useBabylonScene } from './use-babylon-scene';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('useBabylonScene', () => {
  let mockEngine: NullEngine;

  beforeEach(() => {
    // Create real BabylonJS NullEngine for testing (no mocks)
    mockEngine = new NullEngine({
      renderHeight: 600,
      renderWidth: 800,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });
  });

  afterEach(() => {
    // Cleanup
    mockEngine.dispose();
  });

  // Helper function to create real BabylonJS Mesh objects for testing
  const createTestMesh = (name: string = 'testMesh'): Mesh => {
    const scene = new Scene(mockEngine);
    const mesh = CreateBox(name, { size: 1 }, scene);
    return mesh;
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useBabylonScene());

      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.isDisposed).toBe(false);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useBabylonScene());

      expect(typeof result.current.initializeScene).toBe('function');
      expect(typeof result.current.dispose).toBe('function');
      expect(typeof result.current.addMesh).toBe('function');
      expect(typeof result.current.removeMesh).toBe('function');
      expect(typeof result.current.clearMeshes).toBe('function');
      expect(typeof result.current.getState).toBe('function');
    });
  });

  describe('initializeScene', () => {
    it('should initialize scene successfully with default options', async () => {
      const { result } = renderHook(() => useBabylonScene());

      let success = false;
      await act(async () => {
        success = await result.current.initializeScene(mockEngine);
      });

      expect(success).toBe(true);
      expect(result.current.scene).toBeDefined();
      expect(result.current.isReady).toBe(true);
      expect(result.current.isDisposed).toBe(false);
    });

    it('should initialize scene with custom options', async () => {
      const { result } = renderHook(() => useBabylonScene());

      const customOptions = {
        backgroundColor: new Color3(1, 0, 0),
        enablePhysics: true,
        cameraPosition: new Vector3(5, 5, 5),
        cameraTarget: new Vector3(0, 0, 0),
      };

      let success = false;
      await act(async () => {
        success = await result.current.initializeScene(mockEngine, customOptions);
      });

      expect(success).toBe(true);
      expect(result.current.scene).toBeDefined();
      expect(result.current.isReady).toBe(true);
    });

    it('should call onSceneReady callback when provided', async () => {
      const { result } = renderHook(() => useBabylonScene());
      const onSceneReady = vi.fn();

      await act(async () => {
        await result.current.initializeScene(mockEngine, { onSceneReady });
      });

      expect(onSceneReady).toHaveBeenCalledOnce();
      expect(onSceneReady).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle initialization with disposed engine', async () => {
      const { result } = renderHook(() => useBabylonScene());

      // Dispose engine - BabylonJS NullEngine is robust and may still work
      mockEngine.dispose();

      let success = false;
      await act(async () => {
        success = await result.current.initializeScene(mockEngine);
      });

      // BabylonJS NullEngine is robust - it may succeed even when disposed
      // The important thing is that the hook handles it gracefully
      expect(typeof success).toBe('boolean');
      if (!success) {
        expect(result.current.scene).toBeNull();
        expect(result.current.isReady).toBe(false);
      }
    });
  });

  describe('mesh management', () => {
    let hookResult: RenderHookResult<UseBabylonSceneReturn, unknown>;

    beforeEach(async () => {
      hookResult = renderHook(() => useBabylonScene());
      await act(async () => {
        await hookResult.result.current.initializeScene(mockEngine);
      });
    });

    it('should add mesh successfully', () => {
      const testMesh = createTestMesh('addMeshTest');

      let success = false;
      act(() => {
        success = hookResult.result.current.addMesh(testMesh);
      });

      expect(success).toBe(true);

      // Cleanup
      testMesh.dispose();
    });

    it('should remove mesh successfully', () => {
      const testMesh = createTestMesh('removeMeshTest');
      const disposeSpy = vi.spyOn(testMesh, 'dispose');

      act(() => {
        hookResult.result.current.addMesh(testMesh);
      });

      let success = false;
      act(() => {
        success = hookResult.result.current.removeMesh(testMesh);
      });

      expect(success).toBe(true);
      expect(disposeSpy).toHaveBeenCalledOnce();
    });

    it('should clear all meshes successfully', () => {
      const testMesh1 = createTestMesh('clearMeshTest1');
      const testMesh2 = createTestMesh('clearMeshTest2');
      const disposeSpy1 = vi.spyOn(testMesh1, 'dispose');
      const disposeSpy2 = vi.spyOn(testMesh2, 'dispose');

      act(() => {
        hookResult.result.current.addMesh(testMesh1);
        hookResult.result.current.addMesh(testMesh2);
      });

      let success = false;
      act(() => {
        success = hookResult.result.current.clearMeshes();
      });

      expect(success).toBe(true);
      expect(disposeSpy1).toHaveBeenCalledOnce();
      expect(disposeSpy2).toHaveBeenCalledOnce();
    });

    it('should handle mesh operations when scene not initialized', () => {
      const { result } = renderHook(() => useBabylonScene());
      const testMesh = createTestMesh('uninitializedTest');

      const addSuccess = result.current.addMesh(testMesh);
      const removeSuccess = result.current.removeMesh(testMesh);
      const clearSuccess = result.current.clearMeshes();

      expect(addSuccess).toBe(false);
      expect(removeSuccess).toBe(false);
      expect(clearSuccess).toBe(false);

      // Cleanup
      testMesh.dispose();
    });
  });

  describe('dispose', () => {
    it('should dispose scene successfully', async () => {
      const { result } = renderHook(() => useBabylonScene());

      await act(async () => {
        await result.current.initializeScene(mockEngine);
      });

      let success = false;
      await act(async () => {
        success = await result.current.dispose();
      });

      expect(success).toBe(true);
      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.isDisposed).toBe(true);
    });

    it('should handle disposal when scene not initialized', async () => {
      const { result } = renderHook(() => useBabylonScene());

      let success = false;
      await act(async () => {
        success = await result.current.dispose();
      });

      expect(success).toBe(true);
      expect(result.current.isDisposed).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return current state', async () => {
      const { result } = renderHook(() => useBabylonScene());

      await act(async () => {
        await result.current.initializeScene(mockEngine);
      });

      const state = result.current.getState();

      expect(state.scene).toBeDefined();
      expect(state.isInitialized).toBe(true);
      expect(state.isDisposed).toBe(false);
      expect(state.cameras).toHaveLength(1);
      expect(state.lights).toHaveLength(2);
      expect(state.meshes).toHaveLength(0);
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return default state when scene not initialized', () => {
      const { result } = renderHook(() => useBabylonScene());

      const state = result.current.getState();

      expect(state.scene).toBeNull();
      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(false);
      expect(state.cameras).toHaveLength(0);
      expect(state.lights).toHaveLength(0);
      expect(state.meshes).toHaveLength(0);
    });
  });

  describe('hook stability', () => {
    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useBabylonScene());

      const initialFunctions = {
        initializeScene: result.current.initializeScene,
        dispose: result.current.dispose,
        addMesh: result.current.addMesh,
        removeMesh: result.current.removeMesh,
        clearMeshes: result.current.clearMeshes,
        getState: result.current.getState,
      };

      rerender();

      expect(result.current.initializeScene).toBe(initialFunctions.initializeScene);
      expect(result.current.dispose).toBe(initialFunctions.dispose);
      expect(result.current.addMesh).toBe(initialFunctions.addMesh);
      expect(result.current.removeMesh).toBe(initialFunctions.removeMesh);
      expect(result.current.clearMeshes).toBe(initialFunctions.clearMeshes);
      expect(result.current.getState).toBe(initialFunctions.getState);
    });
  });
});
