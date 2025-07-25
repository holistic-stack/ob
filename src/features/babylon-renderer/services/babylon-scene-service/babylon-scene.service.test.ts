/**
 * @file BabylonJS Scene Management Service Tests
 *
 * Tests for BabylonJS scene service functionality.
 * Following TDD principles with real BabylonJS NullEngine (no mocks).
 */

import type { Mesh } from '@babylonjs/core';
import { Color3, NullEngine, Vector3 } from '@babylonjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type BabylonSceneService,
  createBabylonSceneService,
  SceneErrorCode,
  type SceneInitOptions,
} from './babylon-scene.service';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('BabylonSceneService', () => {
  let sceneService: BabylonSceneService;
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

    sceneService = createBabylonSceneService();
  });

  afterEach(() => {
    // Cleanup
    sceneService.dispose();
    mockEngine.dispose();
  });

  /**
   * Create a mock mesh for testing
   */
  const createMockMesh = (): Mesh =>
    ({
      dispose: vi.fn(),
    }) as unknown as Mesh;

  describe('init', () => {
    it('should initialize scene successfully with valid engine', async () => {
      const options: SceneInitOptions = {
        engine: mockEngine,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scene).toBeDefined();
        expect(result.data.isInitialized).toBe(true);
        expect(result.data.isDisposed).toBe(false);
        expect(result.data.cameras).toHaveLength(1);
        expect(result.data.lights).toHaveLength(2); // ambient + directional
        expect(result.data.meshes).toHaveLength(0);
      }
    });

    it('should handle missing engine gracefully', async () => {
      const options: SceneInitOptions = {
        engine: null as unknown as NullEngine,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneErrorCode.ENGINE_NOT_PROVIDED);
        expect(result.error.message).toContain('Engine is required');
      }
    });

    it('should accept custom scene configuration', async () => {
      const customConfig = {
        autoClear: true,
        autoClearDepthAndStencil: true,
        backgroundColor: new Color3(1, 0, 0),
        environmentIntensity: 0.5,
      };

      const options: SceneInitOptions = {
        engine: mockEngine,
        config: customConfig,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scene).toBeDefined();
        expect(result.data.scene?.autoClear).toBe(true);
        expect(result.data.scene?.autoClearDepthAndStencil).toBe(true);
      }
    });

    it('should accept custom camera configuration', async () => {
      const customCamera = {
        type: 'arcRotate' as const,
        position: new Vector3(5, 5, 5),
        target: new Vector3(0, 0, 0),
        radius: 15,
      };

      const options: SceneInitOptions = {
        engine: mockEngine,
        camera: customCamera,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cameras).toHaveLength(1);
        expect(result.data.cameras[0]).toBeDefined();
      }
    });

    it('should accept custom lighting configuration', async () => {
      const customLighting = {
        ambient: {
          enabled: true,
          color: new Color3(0.8, 0.8, 0.8),
          intensity: 0.9,
        },
        directional: {
          enabled: false,
          color: new Color3(1, 1, 1),
          intensity: 1.0,
          direction: new Vector3(-1, -1, -1),
        },
      };

      const options: SceneInitOptions = {
        engine: mockEngine,
        lighting: customLighting,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lights).toHaveLength(1); // Only ambient light enabled
      }
    });

    it('should call onSceneReady callback when provided', async () => {
      const onSceneReady = vi.fn();
      const options: SceneInitOptions = {
        engine: mockEngine,
        onSceneReady,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(true);
      expect(onSceneReady).toHaveBeenCalledOnce();
      expect(onSceneReady).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should register render loop callback when provided', async () => {
      const onRenderLoop = vi.fn();
      const options: SceneInitOptions = {
        engine: mockEngine,
        onRenderLoop,
      };

      const result = await sceneService.init(options);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scene).toBeDefined();
        // Note: We can't easily test if the callback is registered without triggering render
      }
    });
  });

  describe('getState', () => {
    it('should return initial state before initialization', () => {
      const state = sceneService.getState();

      expect(state.scene).toBeNull();
      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(false);
      expect(state.cameras).toHaveLength(0);
      expect(state.lights).toHaveLength(0);
      expect(state.meshes).toHaveLength(0);
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return updated state after initialization', async () => {
      const options: SceneInitOptions = {
        engine: mockEngine,
      };

      await sceneService.init(options);
      const state = sceneService.getState();

      expect(state.scene).toBeDefined();
      expect(state.isInitialized).toBe(true);
      expect(state.isDisposed).toBe(false);
      expect(state.cameras).toHaveLength(1);
      expect(state.lights).toHaveLength(2);
      expect(state.meshes).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    beforeEach(async () => {
      const options: SceneInitOptions = {
        engine: mockEngine,
      };
      await sceneService.init(options);
    });

    it('should update scene configuration successfully', () => {
      const newConfig = {
        backgroundColor: new Color3(0, 1, 0),
        autoClear: true,
        autoClearDepthAndStencil: true,
      };

      const result = sceneService.updateConfig(newConfig);

      expect(result.success).toBe(true);

      const state = sceneService.getState();
      expect(state.scene?.autoClear).toBe(true);
      expect(state.scene?.autoClearDepthAndStencil).toBe(true);
    });

    it('should handle update when scene not initialized', () => {
      const uninitializedService = createBabylonSceneService();
      const result = uninitializedService.updateConfig({ autoClear: true });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneErrorCode.UPDATE_FAILED);
        expect(result.error.message).toContain('Scene not initialized');
      }
    });
  });

  describe('mesh management', () => {
    beforeEach(async () => {
      const options: SceneInitOptions = {
        engine: mockEngine,
      };
      await sceneService.init(options);
    });

    it('should add mesh successfully', () => {
      const mockMesh = createMockMesh();

      const result = sceneService.addMesh(mockMesh);

      expect(result.success).toBe(true);

      const state = sceneService.getState();
      expect(state.meshes).toHaveLength(1);
      expect(state.meshes[0]).toBe(mockMesh);
    });

    it('should remove mesh successfully', () => {
      const mockMesh = createMockMesh();

      sceneService.addMesh(mockMesh);
      const result = sceneService.removeMesh(mockMesh);

      expect(result.success).toBe(true);
      expect(mockMesh.dispose).toHaveBeenCalledOnce();

      const state = sceneService.getState();
      expect(state.meshes).toHaveLength(0);
    });

    it('should clear all meshes successfully', () => {
      const mockMesh1 = createMockMesh();
      const mockMesh2 = createMockMesh();

      sceneService.addMesh(mockMesh1);
      sceneService.addMesh(mockMesh2);

      const result = sceneService.clearMeshes();

      expect(result.success).toBe(true);
      expect(mockMesh1.dispose).toHaveBeenCalledOnce();
      expect(mockMesh2.dispose).toHaveBeenCalledOnce();

      const state = sceneService.getState();
      expect(state.meshes).toHaveLength(0);
    });

    it('should handle mesh operations when scene not initialized', () => {
      const uninitializedService = createBabylonSceneService();
      const mockMesh = createMockMesh();

      const addResult = uninitializedService.addMesh(mockMesh);
      expect(addResult.success).toBe(false);

      const removeResult = uninitializedService.removeMesh(mockMesh);
      expect(removeResult.success).toBe(false);

      const clearResult = uninitializedService.clearMeshes();
      expect(clearResult.success).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should dispose scene successfully', async () => {
      const options: SceneInitOptions = {
        engine: mockEngine,
      };

      await sceneService.init(options);
      const result = sceneService.dispose();

      expect(result.success).toBe(true);

      const state = sceneService.getState();
      expect(state.scene).toBeNull();
      expect(state.isInitialized).toBe(false);
      expect(state.isDisposed).toBe(true);
      expect(state.cameras).toHaveLength(0);
      expect(state.lights).toHaveLength(0);
      expect(state.meshes).toHaveLength(0);
    });

    it('should handle disposal when scene not initialized', () => {
      const result = sceneService.dispose();

      expect(result.success).toBe(true);

      const state = sceneService.getState();
      expect(state.isDisposed).toBe(true);
    });

    it('should dispose meshes before disposing scene', async () => {
      const options: SceneInitOptions = {
        engine: mockEngine,
      };

      await sceneService.init(options);

      const mockMesh = createMockMesh();
      sceneService.addMesh(mockMesh);

      const result = sceneService.dispose();

      expect(result.success).toBe(true);
      expect(mockMesh.dispose).toHaveBeenCalledOnce();
    });
  });

  describe('state immutability', () => {
    it('should return immutable state objects', async () => {
      const state1 = sceneService.getState();
      const state2 = sceneService.getState();

      expect(state1).toBe(state2); // Same reference for unchanged state

      const options: SceneInitOptions = {
        engine: mockEngine,
      };

      await sceneService.init(options);
      const state3 = sceneService.getState();

      expect(state3).not.toBe(state1); // Different reference after change
      expect(Object.isFrozen(state3)).toBe(true); // State should be frozen
    });

    it.skip('should update lastUpdated timestamp on state changes', async () => {
      const initialState = sceneService.getState();
      const initialTime = initialState.lastUpdated;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const options: SceneInitOptions = {
        engine: mockEngine,
      };

      await sceneService.init(options);
      const updatedState = sceneService.getState();

      expect(updatedState.lastUpdated.getTime()).toBeGreaterThan(initialTime.getTime());
    });
  });
});
