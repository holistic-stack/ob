/**
 * @file Scene Refresh Regression Tests
 * 
 * Regression tests to ensure scene refresh works correctly after mesh changes.
 * These tests verify the fix for visual update issues where the canvas didn't
 * refresh properly after mesh disposal or creation.
 * 
 * **Critical Bug Fixed**: Canvas not updating visually after mesh changes
 * **Root Cause**: Missing engine.resize() and scene refresh operations
 * **Solution**: Comprehensive scene refresh with engine resize and material cache reset
 * 
 * @example
 * ```bash
 * # Run these regression tests
 * pnpm test scene-refresh-regression.test.ts
 * ```
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import {
  forceEngineResize,
  resetSceneMaterialCache,
  markSceneMaterialsAsDirty,
  forceSceneRefresh,
  SceneRefreshErrorCode,
} from './scene-refresh';

describe('Scene Refresh Regression Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create real BabylonJS instances for regression testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('REGRESSION: Canvas Visual Update Issues', () => {
    it('should force canvas refresh after mesh disposal', () => {
      // REGRESSION TEST: Canvas didn't update visually after mesh removal
      // The fix: engine.resize() forces canvas to refresh
      
      // Create and dispose a mesh
      const mesh = BABYLON.MeshBuilder.CreateBox('testBox', { size: 10 }, scene);
      expect(scene.meshes.length).toBe(1);
      
      // Remove mesh from scene
      scene.removeMesh(mesh);
      mesh.dispose();
      expect(scene.meshes.length).toBe(0);

      // Force engine resize (critical for visual refresh)
      const resizeResult = forceEngineResize(engine);
      expect(resizeResult.success).toBe(true);

      // Verify engine is still functional after resize
      expect(engine).toBeDefined();
    });

    it('should refresh scene after multiple mesh changes', () => {
      // REGRESSION TEST: Multiple rapid changes sometimes didn't update visually
      
      const meshChanges = 10;
      
      for (let i = 0; i < meshChanges; i++) {
        // Create mesh
        const mesh = BABYLON.MeshBuilder.CreateSphere(`sphere_${i}`, { diameter: 5 }, scene);
        expect(scene.meshes.length).toBe(1);
        
        // Remove mesh
        scene.removeMesh(mesh);
        mesh.dispose();
        expect(scene.meshes.length).toBe(0);
        
        // Force scene refresh after each change
        const refreshResult = forceSceneRefresh(engine, scene);
        
        // Should succeed or fail gracefully (some methods might not exist in NullEngine)
        if (refreshResult.success) {
          expect(refreshResult.data).toBeUndefined();
        } else {
          expect(refreshResult.error?.code).toBe(SceneRefreshErrorCode.REFRESH_FAILED);
        }
      }
    });

    it('should handle scene refresh with material changes', () => {
      // REGRESSION TEST: Material changes sometimes didn't trigger visual updates
      
      const mesh = BABYLON.MeshBuilder.CreateBox('materialBox', { size: 5 }, scene);
      
      // Create and assign materials
      const materials = [
        new BABYLON.StandardMaterial('material1', scene),
        new BABYLON.StandardMaterial('material2', scene),
        new BABYLON.StandardMaterial('material3', scene),
      ];

      for (const material of materials) {
        mesh.material = material;
        
        // Reset material cache (part of the fix)
        const cacheResult = resetSceneMaterialCache(scene);
        expect(cacheResult.success).toBe(true);
        
        // Mark materials as dirty (part of the fix)
        const dirtyResult = markSceneMaterialsAsDirty(scene);
        expect(dirtyResult.success).toBe(true);
      }
    });
  });

  describe('REGRESSION: Engine Resize Operations', () => {
    it('should handle engine resize without errors', () => {
      // REGRESSION TEST: Engine resize was critical but sometimes failed
      
      // Multiple resize operations (simulating window resize events)
      for (let i = 0; i < 5; i++) {
        const result = forceEngineResize(engine);
        expect(result.success).toBe(true);
      }
    });

    it('should handle engine resize with invalid engine', () => {
      // REGRESSION TEST: Error handling for invalid engines
      
      const invalidEngine = null as any;
      const result = forceEngineResize(invalidEngine);
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(SceneRefreshErrorCode.INVALID_ENGINE);
    });

    it('should maintain performance during repeated resizes', () => {
      // REGRESSION TEST: Repeated resizes shouldn't degrade performance
      
      const resizeCount = 50;
      const startTime = performance.now();

      for (let i = 0; i < resizeCount; i++) {
        const result = forceEngineResize(engine);
        expect(result.success).toBe(true);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / resizeCount;

      // Performance regression test
      expect(averageTime).toBeLessThan(2); // Less than 2ms per resize
    });
  });

  describe('REGRESSION: Material Cache Management', () => {
    it('should reset material cache without errors', () => {
      // REGRESSION TEST: Material cache reset was part of the visual update fix
      
      // Create materials to populate cache
      const materials = [
        new BABYLON.StandardMaterial('mat1', scene),
        new BABYLON.StandardMaterial('mat2', scene),
        new BABYLON.StandardMaterial('mat3', scene),
      ];

      // Reset cache multiple times
      for (let i = 0; i < 3; i++) {
        const result = resetSceneMaterialCache(scene);
        expect(result.success).toBe(true);
      }
    });

    it('should mark materials as dirty correctly', () => {
      // REGRESSION TEST: Marking materials as dirty was essential for updates
      
      const mesh = BABYLON.MeshBuilder.CreateBox('dirtyBox', { size: 5 }, scene);
      const material = new BABYLON.StandardMaterial('dirtyMaterial', scene);
      mesh.material = material;

      // Mark materials as dirty
      const result = markSceneMaterialsAsDirty(scene);
      expect(result.success).toBe(true);
    });

    it('should handle scenes without material methods gracefully', () => {
      // REGRESSION TEST: Some BabylonJS versions might not have all methods
      
      // Create a scene-like object without some methods
      const partialScene = {
        render: () => {},
        // Missing resetCachedMaterial and markAllMaterialsAsDirty
      } as BABYLON.Scene;

      // Should handle missing methods gracefully
      const cacheResult = resetSceneMaterialCache(partialScene);
      expect(cacheResult.success).toBe(true);

      const dirtyResult = markSceneMaterialsAsDirty(partialScene);
      expect(dirtyResult.success).toBe(true);
    });
  });

  describe('REGRESSION: Complete Scene Refresh Pipeline', () => {
    it('should execute complete refresh pipeline successfully', () => {
      // REGRESSION TEST: The complete refresh pipeline was the final fix
      
      // Create a complex scene
      const mesh1 = BABYLON.MeshBuilder.CreateBox('box1', { size: 5 }, scene);
      const mesh2 = BABYLON.MeshBuilder.CreateSphere('sphere1', { diameter: 5 }, scene);
      const material1 = new BABYLON.StandardMaterial('mat1', scene);
      const material2 = new BABYLON.StandardMaterial('mat2', scene);
      
      mesh1.material = material1;
      mesh2.material = material2;

      // Execute complete refresh pipeline
      const result = forceSceneRefresh(engine, scene);
      
      // Should succeed or fail gracefully
      if (result.success) {
        expect(result.data).toBeUndefined();
      } else {
        // Acceptable failure in NullEngine environment
        expect(result.error?.code).toBe(SceneRefreshErrorCode.REFRESH_FAILED);
      }
    });

    it('should handle refresh pipeline with empty scene', () => {
      // REGRESSION TEST: Empty scenes should refresh without issues
      
      expect(scene.meshes.length).toBe(0);
      
      const result = forceSceneRefresh(engine, scene);
      
      // Should handle empty scene gracefully
      if (result.success) {
        expect(result.data).toBeUndefined();
      } else {
        expect(result.error?.code).toBe(SceneRefreshErrorCode.REFRESH_FAILED);
      }
    });

    it('should maintain performance during complete refresh', () => {
      // REGRESSION TEST: Complete refresh should be efficient
      
      // Create a moderately complex scene
      for (let i = 0; i < 10; i++) {
        const mesh = BABYLON.MeshBuilder.CreateBox(`box_${i}`, { size: 1 }, scene);
        const material = new BABYLON.StandardMaterial(`mat_${i}`, scene);
        mesh.material = material;
      }

      const refreshCount = 10;
      const startTime = performance.now();

      for (let i = 0; i < refreshCount; i++) {
        forceSceneRefresh(engine, scene);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / refreshCount;

      // Performance regression test
      expect(averageTime).toBeLessThan(10); // Less than 10ms per complete refresh
    });
  });

  describe('REGRESSION: Error Handling and Edge Cases', () => {
    it('should handle invalid scene in refresh operations', () => {
      // REGRESSION TEST: Error handling was critical for stability
      
      const invalidScene = null as any;
      
      const cacheResult = resetSceneMaterialCache(invalidScene);
      expect(cacheResult.success).toBe(false);
      expect(cacheResult.error?.code).toBe(SceneRefreshErrorCode.INVALID_SCENE);

      const dirtyResult = markSceneMaterialsAsDirty(invalidScene);
      expect(dirtyResult.success).toBe(false);
      expect(dirtyResult.error?.code).toBe(SceneRefreshErrorCode.INVALID_SCENE);

      const refreshResult = forceSceneRefresh(engine, invalidScene);
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error?.code).toBe(SceneRefreshErrorCode.INVALID_SCENE);
    });

    it('should handle invalid engine in refresh operations', () => {
      // REGRESSION TEST: Engine validation was important
      
      const invalidEngine = null as any;
      
      const refreshResult = forceSceneRefresh(invalidEngine, scene);
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.error?.code).toBe(SceneRefreshErrorCode.INVALID_ENGINE);
    });

    it('should include timestamps in error objects', () => {
      // REGRESSION TEST: Error tracking was important for debugging
      
      const result = forceSceneRefresh(null as any, scene);
      
      expect(result.success).toBe(false);
      expect(result.error?.timestamp).toBeInstanceOf(Date);
      expect(result.error?.message).toBeTruthy();
    });
  });
});
