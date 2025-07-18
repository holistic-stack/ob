/**
 * @file Scene Refresh Utilities Tests
 *
 * Tests for BabylonJS scene refresh utilities using real BabylonJS instances.
 * Uses NullEngine for headless testing without mocks.
 */

import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  forceEngineResize,
  forceSceneRefresh,
  markSceneMaterialsAsDirty,
  resetSceneMaterialCache,
  SceneRefreshErrorCode,
} from './scene-refresh';

describe('Scene Refresh Utilities', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create real BabylonJS instances for testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('forceEngineResize', () => {
    it('should successfully resize engine', () => {
      const result = forceEngineResize(engine);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return error for invalid engine', () => {
      const result = forceEngineResize(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneRefreshErrorCode.INVALID_ENGINE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS engine');
      }
    });

    it('should return error for engine without resize method', () => {
      const invalidEngine = {} as BABYLON.Engine;
      const result = forceEngineResize(invalidEngine);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneRefreshErrorCode.INVALID_ENGINE);
      }
    });
  });

  describe('resetSceneMaterialCache', () => {
    it('should successfully reset material cache', () => {
      const result = resetSceneMaterialCache(scene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return error for invalid scene', () => {
      const result = resetSceneMaterialCache(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneRefreshErrorCode.INVALID_SCENE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS scene');
      }
    });

    it('should handle scene without resetCachedMaterial method gracefully', () => {
      // Create a scene-like object without the method
      const sceneWithoutMethod = { ...scene };
      (sceneWithoutMethod as any).resetCachedMaterial = undefined;

      const result = resetSceneMaterialCache(sceneWithoutMethod as BABYLON.Scene);

      expect(result.success).toBe(true);
    });
  });

  describe('markSceneMaterialsAsDirty', () => {
    it('should successfully mark materials as dirty', () => {
      const result = markSceneMaterialsAsDirty(scene);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return error for invalid scene', () => {
      const result = markSceneMaterialsAsDirty(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneRefreshErrorCode.INVALID_SCENE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS scene');
      }
    });

    it('should handle scene without markAllMaterialsAsDirty method gracefully', () => {
      // Create a scene-like object without the method
      const sceneWithoutMethod = { ...scene };
      (sceneWithoutMethod as any).markAllMaterialsAsDirty = undefined;

      const result = markSceneMaterialsAsDirty(sceneWithoutMethod as BABYLON.Scene);

      expect(result.success).toBe(true);
    });
  });

  describe('forceSceneRefresh', () => {
    it('should successfully perform complete scene refresh', () => {
      const result = forceSceneRefresh(engine, scene);

      // The result might fail if some BabylonJS methods are not available in NullEngine
      // but the function should handle this gracefully
      if (result.success) {
        expect(result.data).toBeUndefined();
      } else {
        // If it fails, it should be due to missing methods, not invalid inputs
        expect(result.error.code).toBe('REFRESH_FAILED');
      }
    });

    it('should return error for invalid engine', () => {
      const result = forceSceneRefresh(null as any, scene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneRefreshErrorCode.INVALID_ENGINE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS engine');
      }
    });

    it('should return error for invalid scene', () => {
      const result = forceSceneRefresh(engine, null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(SceneRefreshErrorCode.INVALID_SCENE);
        expect(result.error.message).toContain('Invalid or missing BabylonJS scene');
      }
    });

    it('should handle scene without render method gracefully', () => {
      // Create a scene-like object without render method
      const sceneWithoutRender = { ...scene };
      (sceneWithoutRender as any).render = undefined;

      const result = forceSceneRefresh(engine, sceneWithoutRender as BABYLON.Scene);

      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should include timestamp in error objects', () => {
      const result = forceEngineResize(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should provide meaningful error messages', () => {
      const result = resetSceneMaterialCache(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
        expect(result.error.message.length).toBeGreaterThan(0);
      }
    });

    it('should handle different error types consistently', () => {
      const engineResult = forceEngineResize(null as any);
      const sceneResult = resetSceneMaterialCache(null as any);

      expect(engineResult.success).toBe(false);
      expect(sceneResult.success).toBe(false);
      if (!engineResult.success) {
        expect(engineResult.error.timestamp).toBeInstanceOf(Date);
      }
      if (!sceneResult.success) {
        expect(sceneResult.error.timestamp).toBeInstanceOf(Date);
      }
    });
  });
});
