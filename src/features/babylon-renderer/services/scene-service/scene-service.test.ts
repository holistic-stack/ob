/**
 * @file Scene Service Tests
 * 
 * TDD tests for Babylon.js scene service
 * Following functional programming and SRP principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { createSceneService } from './scene-service';
import type { BabylonSceneConfig } from '../../types/babylon-types';

describe('SceneService', () => {
  let engine: BABYLON.NullEngine;
  let sceneService: ReturnType<typeof createSceneService>;

  beforeEach(() => {
    console.log('[INIT] Setting up scene service tests');
    
    // Create NullEngine for testing
    engine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    sceneService = createSceneService();
  });

  afterEach(() => {
    console.log('[END] Cleaning up scene service tests');
    
    if (engine && !engine.isDisposed) {
      engine.dispose();
    }
  });

  describe('createScene', () => {
    it('should create scene with default configuration', () => {
      console.log('[DEBUG] Testing scene creation with defaults');
      
      const result = sceneService.createScene(engine);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const scene = result.data;
        expect(scene).toBeInstanceOf(BABYLON.Scene);
        expect(scene.isDisposed).toBe(false);
        expect(scene.getEngine()).toBe(engine);
        
        // Cleanup
        scene.dispose();
      }
    });

    it('should create scene with custom configuration', () => {
      console.log('[DEBUG] Testing scene creation with custom config');
      
      const config: BabylonSceneConfig = {
        enableCamera: true,
        enableLighting: true,
        backgroundColor: '#ff0000',
        cameraPosition: [5, 5, 5]
      };
      
      const result = sceneService.createScene(engine, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const scene = result.data;
        expect(scene).toBeInstanceOf(BABYLON.Scene);
        expect(scene.isDisposed).toBe(false);
        
        // Check background color
        const expectedColor = BABYLON.Color3.FromHexString('#ff0000');
        expect(scene.clearColor.r).toBeCloseTo(expectedColor.r, 2);
        expect(scene.clearColor.g).toBeCloseTo(expectedColor.g, 2);
        expect(scene.clearColor.b).toBeCloseTo(expectedColor.b, 2);
        
        // Cleanup
        scene.dispose();
      }
    });

    it('should handle scene creation with disposed engine', () => {
      console.log('[DEBUG] Testing scene creation with disposed engine');
      
      engine.dispose();
      const result = sceneService.createScene(engine);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Engine is disposed');
      }
    });

    it('should handle scene creation with null engine', () => {
      console.log('[DEBUG] Testing scene creation with null engine');
      
      const result = sceneService.createScene(null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid engine');
      }
    });
  });

  describe('setupCamera', () => {
    let scene: BABYLON.Scene;

    beforeEach(() => {
      scene = new BABYLON.Scene(engine);
    });

    afterEach(() => {
      if (scene && !scene.isDisposed) {
        scene.dispose();
      }
    });

    it('should setup camera with default configuration', () => {
      console.log('[DEBUG] Testing camera setup with defaults');
      
      const config: BabylonSceneConfig = { enableCamera: true };
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const camera = result.data;
        expect(camera).toBeInstanceOf(BABYLON.ArcRotateCamera);
        expect(camera.name).toBe('camera');
        expect(scene.cameras).toContain(camera);
      }
    });

    it('should setup camera with custom position', () => {
      console.log('[DEBUG] Testing camera setup with custom position');
      
      const config: BabylonSceneConfig = {
        enableCamera: true,
        cameraPosition: [15, 20, 25]
      };
      
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const camera = result.data;
        expect(camera.position.x).toBeCloseTo(15, 1);
        expect(camera.position.y).toBeCloseTo(20, 1);
        expect(camera.position.z).toBeCloseTo(25, 1);
      }
    });

    it('should handle camera setup with disposed scene', () => {
      console.log('[DEBUG] Testing camera setup with disposed scene');
      
      scene.dispose();
      const config: BabylonSceneConfig = { enableCamera: true };
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Scene is disposed');
      }
    });

    it('should skip camera setup when disabled', () => {
      console.log('[DEBUG] Testing camera setup when disabled');
      
      const config: BabylonSceneConfig = { enableCamera: false };
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Camera setup disabled');
      }
    });
  });

  describe('setupLighting', () => {
    let scene: BABYLON.Scene;

    beforeEach(() => {
      scene = new BABYLON.Scene(engine);
    });

    afterEach(() => {
      if (scene && !scene.isDisposed) {
        scene.dispose();
      }
    });

    it('should setup lighting successfully', () => {
      console.log('[DEBUG] Testing lighting setup');
      
      const result = sceneService.setupLighting(scene);
      
      expect(result.success).toBe(true);
      expect(scene.lights.length).toBeGreaterThan(0);
      
      // Check for specific light types
      const hasHemisphericLight = scene.lights.some(light => light instanceof BABYLON.HemisphericLight);
      const hasDirectionalLight = scene.lights.some(light => light instanceof BABYLON.DirectionalLight);
      const hasPointLight = scene.lights.some(light => light instanceof BABYLON.PointLight);
      
      expect(hasHemisphericLight).toBe(true);
      expect(hasDirectionalLight).toBe(true);
      expect(hasPointLight).toBe(true);
    });

    it('should handle lighting setup with disposed scene', () => {
      console.log('[DEBUG] Testing lighting setup with disposed scene');
      
      scene.dispose();
      const result = sceneService.setupLighting(scene);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Scene is disposed');
      }
    });

    it('should handle lighting setup with null scene', () => {
      console.log('[DEBUG] Testing lighting setup with null scene');
      
      const result = sceneService.setupLighting(null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid scene');
      }
    });
  });

  describe('disposeScene', () => {
    it('should dispose scene safely', () => {
      console.log('[DEBUG] Testing scene disposal');
      
      const scene = new BABYLON.Scene(engine);
      expect(scene.isDisposed).toBe(false);
      
      sceneService.disposeScene(scene);
      expect(scene.isDisposed).toBe(true);
    });

    it('should handle disposal of already disposed scene', () => {
      console.log('[DEBUG] Testing disposal of already disposed scene');
      
      const scene = new BABYLON.Scene(engine);
      scene.dispose();
      expect(scene.isDisposed).toBe(true);
      
      // Should not throw error
      expect(() => sceneService.disposeScene(scene)).not.toThrow();
    });

    it('should handle disposal of null scene', () => {
      console.log('[DEBUG] Testing disposal of null scene');
      
      // Should not throw error
      expect(() => sceneService.disposeScene(null as any)).not.toThrow();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle scene creation errors gracefully', () => {
      console.log('[DEBUG] Testing scene creation error handling');
      
      // Create a scene first, then dispose the engine
      const scene = new BABYLON.Scene(engine);
      scene.dispose();
      engine.dispose();
      
      const result = sceneService.createScene(engine);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Engine is disposed');
      }
    });

    it('should maintain scene state consistency', () => {
      console.log('[DEBUG] Testing scene state consistency');
      
      const result = sceneService.createScene(engine);
      expect(result.success).toBe(true);
      
      if (result.success) {
        const scene = result.data;
        
        // Check initial state
        expect(scene.isDisposed).toBe(false);
        expect(scene.getEngine()).toBe(engine);
        expect(scene.isReady()).toBe(true);
        
        // Cleanup
        sceneService.disposeScene(scene);
        expect(scene.isDisposed).toBe(true);
      }
    });
  });
});
