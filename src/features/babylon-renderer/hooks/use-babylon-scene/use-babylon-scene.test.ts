/**
 * @file Babylon Scene Hook Tests
 * 
 * TDD tests for refactored Babylon.js scene hook
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { useBabylonScene } from './use-babylon-scene';
import type { BabylonSceneConfig } from '../../types/babylon-types';

describe('useBabylonScene', () => {
  let engine: BABYLON.NullEngine;

  beforeEach(() => {
    console.log('[INIT] Setting up scene hook tests');
    
    // Create NullEngine for testing
    engine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
  });

  afterEach(() => {
    console.log('[END] Cleaning up scene hook tests');
    
    if (engine && !engine.isDisposed) {
      engine.dispose();
    }
  });

  describe('scene creation and lifecycle', () => {
    it('should create scene with default configuration', () => {
      console.log('[DEBUG] Testing scene hook with defaults');
      
      const { result } = renderHook(() => useBabylonScene(engine));
      
      expect(result.current.scene).toBeInstanceOf(BABYLON.Scene);
      expect(result.current.isReady).toBe(true);
      expect(result.current.render).toBeInstanceOf(Function);
      expect(typeof result.current.dispose).toBe('function');
    });

    it('should create scene with custom configuration', () => {
      console.log('[DEBUG] Testing scene hook with custom config');
      
      const config: BabylonSceneConfig = {
        enableCamera: true,
        enableLighting: true,
        backgroundColor: '#ff0000',
        cameraPosition: [5, 5, 5]
      };
      
      const { result } = renderHook(() => useBabylonScene(engine, config));
      
      expect(result.current.scene).toBeInstanceOf(BABYLON.Scene);
      expect(result.current.isReady).toBe(true);
      
      // Check background color
      const scene = result.current.scene!;
      const expectedColor = BABYLON.Color3.FromHexString('#ff0000');
      expect(scene.clearColor.r).toBeCloseTo(expectedColor.r, 2);
      expect(scene.clearColor.g).toBeCloseTo(expectedColor.g, 2);
      expect(scene.clearColor.b).toBeCloseTo(expectedColor.b, 2);
    });

    it('should handle null engine gracefully', () => {
      console.log('[DEBUG] Testing scene hook with null engine');
      
      const { result } = renderHook(() => useBabylonScene(null));
      
      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.render).toBeInstanceOf(Function);
    });

    it('should handle disposed engine gracefully', () => {
      console.log('[DEBUG] Testing scene hook with disposed engine');
      
      engine.dispose();
      const { result } = renderHook(() => useBabylonScene(engine));
      
      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.render).toBeInstanceOf(Function);
    });

    it('should handle engine changes', () => {
      console.log('[DEBUG] Testing scene hook with engine changes');
      
      const { result, rerender } = renderHook(
        ({ engine }) => useBabylonScene(engine),
        { initialProps: { engine } }
      );
      
      const firstScene = result.current.scene;
      expect(firstScene).toBeInstanceOf(BABYLON.Scene);
      
      // Change engine
      const newEngine = new BABYLON.NullEngine({
        renderWidth: 400,
        renderHeight: 300,
        textureSize: 256,
        deterministicLockstep: false,
        lockstepMaxSteps: 1
      });
      
      rerender({ engine: newEngine });
      
      // Should create new scene
      expect(result.current.scene).toBeInstanceOf(BABYLON.Scene);
      expect(result.current.scene).not.toBe(firstScene);
      expect(firstScene?.isDisposed).toBe(true);
      
      // Cleanup
      newEngine.dispose();
    });
  });

  describe('render functionality', () => {
    it('should provide working render function', () => {
      console.log('[DEBUG] Testing render function');
      
      const { result } = renderHook(() => useBabylonScene(engine));
      
      expect(result.current.render).toBeInstanceOf(Function);
      
      // Should not throw when called
      expect(() => result.current.render()).not.toThrow();
    });

    it('should handle render with null scene', () => {
      console.log('[DEBUG] Testing render with null scene');
      
      const { result } = renderHook(() => useBabylonScene(null));
      
      expect(result.current.scene).toBeNull();
      expect(() => result.current.render()).not.toThrow();
    });

    it('should handle render with disposed scene', () => {
      console.log('[DEBUG] Testing render with disposed scene');
      
      const { result } = renderHook(() => useBabylonScene(engine));
      
      act(() => {
        result.current.dispose();
      });
      
      expect(result.current.scene).toBeNull();
      expect(() => result.current.render()).not.toThrow();
    });
  });

  describe('dispose functionality', () => {
    it('should dispose scene when dispose is called', () => {
      console.log('[DEBUG] Testing scene disposal');
      
      const { result } = renderHook(() => useBabylonScene(engine));
      
      const scene = result.current.scene;
      expect(scene?.isDisposed).toBeFalsy();
      
      act(() => {
        result.current.dispose();
      });
      
      expect(scene?.isDisposed).toBe(true);
      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
    });

    it('should dispose scene on unmount', () => {
      console.log('[DEBUG] Testing scene disposal on unmount');
      
      const { result, unmount } = renderHook(() => useBabylonScene(engine));
      
      const scene = result.current.scene;
      expect(scene?.isDisposed).toBeFalsy();
      
      unmount();
      
      expect(scene?.isDisposed).toBe(true);
    });

    it('should handle multiple dispose calls safely', () => {
      console.log('[DEBUG] Testing multiple dispose calls');
      
      const { result } = renderHook(() => useBabylonScene(engine));
      
      act(() => {
        result.current.dispose();
        result.current.dispose(); // Should not throw
      });
      
      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
    });
  });

  describe('configuration changes', () => {
    it('should recreate scene when configuration changes', () => {
      console.log('[DEBUG] Testing configuration changes');
      
      const initialConfig: BabylonSceneConfig = { backgroundColor: '#ff0000' };
      
      const { result, rerender } = renderHook(
        ({ config }) => useBabylonScene(engine, config),
        { initialProps: { config: initialConfig } }
      );
      
      const firstScene = result.current.scene;
      expect(firstScene).toBeInstanceOf(BABYLON.Scene);
      
      // Change configuration
      const newConfig: BabylonSceneConfig = { backgroundColor: '#00ff00' };
      rerender({ config: newConfig });
      
      // Should create new scene with new config
      expect(result.current.scene).toBeInstanceOf(BABYLON.Scene);
      expect(result.current.scene).not.toBe(firstScene);
      expect(firstScene?.isDisposed).toBe(true);
      
      // Check new background color
      const scene = result.current.scene!;
      const expectedColor = BABYLON.Color3.FromHexString('#00ff00');
      expect(scene.clearColor.r).toBeCloseTo(expectedColor.r, 2);
      expect(scene.clearColor.g).toBeCloseTo(expectedColor.g, 2);
      expect(scene.clearColor.b).toBeCloseTo(expectedColor.b, 2);
    });

    it('should not recreate scene for same configuration', () => {
      console.log('[DEBUG] Testing same configuration stability');
      
      const config: BabylonSceneConfig = { backgroundColor: '#ff0000' };
      
      const { result, rerender } = renderHook(
        ({ config }) => useBabylonScene(engine, config),
        { initialProps: { config } }
      );
      
      const firstScene = result.current.scene;
      
      // Rerender with same config
      rerender({ config });
      
      // Should keep same scene
      expect(result.current.scene).toBe(firstScene);
      expect(result.current.scene?.isDisposed).toBeFalsy();
    });
  });

  describe('camera and lighting setup', () => {
    it('should setup camera when enabled', () => {
      console.log('[DEBUG] Testing camera setup');
      
      const config: BabylonSceneConfig = {
        enableCamera: true,
        cameraPosition: [10, 15, 20]
      };
      
      const { result } = renderHook(() => useBabylonScene(engine, config));
      
      const scene = result.current.scene!;
      expect(scene.cameras.length).toBeGreaterThan(0);
      
      const camera = scene.cameras[0] as BABYLON.ArcRotateCamera;
      expect(camera).toBeInstanceOf(BABYLON.ArcRotateCamera);
      expect(camera.name).toBe('camera');
    });

    it('should setup lighting when enabled', () => {
      console.log('[DEBUG] Testing lighting setup');
      
      const config: BabylonSceneConfig = {
        enableLighting: true
      };
      
      const { result } = renderHook(() => useBabylonScene(engine, config));
      
      const scene = result.current.scene!;
      expect(scene.lights.length).toBeGreaterThan(0);
      
      // Check for specific light types
      const hasHemisphericLight = scene.lights.some(light => light instanceof BABYLON.HemisphericLight);
      const hasDirectionalLight = scene.lights.some(light => light instanceof BABYLON.DirectionalLight);
      const hasPointLight = scene.lights.some(light => light instanceof BABYLON.PointLight);
      
      expect(hasHemisphericLight).toBe(true);
      expect(hasDirectionalLight).toBe(true);
      expect(hasPointLight).toBe(true);
    });

    it('should skip camera setup when disabled', () => {
      console.log('[DEBUG] Testing disabled camera setup');
      
      const config: BabylonSceneConfig = {
        enableCamera: false
      };
      
      const { result } = renderHook(() => useBabylonScene(engine, config));
      
      const scene = result.current.scene!;
      expect(scene.cameras.length).toBe(0);
    });

    it('should skip lighting setup when disabled', () => {
      console.log('[DEBUG] Testing disabled lighting setup');
      
      const config: BabylonSceneConfig = {
        enableLighting: false
      };
      
      const { result } = renderHook(() => useBabylonScene(engine, config));
      
      const scene = result.current.scene!;
      expect(scene.lights.length).toBe(0);
    });
  });

  describe('error handling and edge cases', () => {
    it('should maintain consistent state during errors', () => {
      console.log('[DEBUG] Testing state consistency during errors');
      
      const { result } = renderHook(() => useBabylonScene(engine));
      
      // Initial state should be consistent
      expect(result.current.scene).toBeInstanceOf(BABYLON.Scene);
      expect(result.current.isReady).toBe(true);
      expect(result.current.render).toBeInstanceOf(Function);
      
      // Dispose and check state
      act(() => {
        result.current.dispose();
      });
      
      expect(result.current.scene).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.render).toBeInstanceOf(Function);
    });

    it('should handle rapid engine changes', () => {
      console.log('[DEBUG] Testing rapid engine changes');
      
      const { result, rerender } = renderHook(
        ({ engine }) => useBabylonScene(engine),
        { initialProps: { engine } }
      );
      
      const firstScene = result.current.scene;
      
      // Rapid engine changes
      const engine2 = new BABYLON.NullEngine({
        renderWidth: 400,
        renderHeight: 300,
        textureSize: 512,
        deterministicLockstep: false,
        lockstepMaxSteps: 1
      });
      const engine3 = new BABYLON.NullEngine({
        renderWidth: 600,
        renderHeight: 400,
        textureSize: 512,
        deterministicLockstep: false,
        lockstepMaxSteps: 1
      });
      
      rerender({ engine: engine2 });
      rerender({ engine: engine3 });
      
      // Should handle changes gracefully
      expect(result.current.scene).toBeInstanceOf(BABYLON.Scene);
      expect(result.current.isReady).toBe(true);
      expect(firstScene?.isDisposed).toBe(true);
      
      // Cleanup
      engine2.dispose();
      engine3.dispose();
    });
  });
});
