/**
 * @file R3F Scene Service Tests
 * 
 * TDD tests for the R3F scene service following React 19 best practices
 * and functional programming principles. Tests equivalent to Babylon scene service tests.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { createR3FSceneService } from './r3f-scene-service';
import type { R3FSceneConfig, R3FCameraConfig } from '../../types/r3f-types';

// Mock Three.js classes for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    Scene: vi.fn().mockImplementation(() => ({
      background: null,
      fog: null,
      add: vi.fn(),
      remove: vi.fn(),
      traverse: vi.fn(),
      clear: vi.fn(),
      children: []
    })),
    Color: vi.fn().mockImplementation((color) => ({ color })),
    Fog: vi.fn().mockImplementation((color, near, far) => ({ color, near, far })),
    AmbientLight: vi.fn().mockImplementation((color, intensity) => ({
      color,
      intensity,
      name: 'ambientLight'
    })),
    DirectionalLight: vi.fn().mockImplementation((color, intensity) => ({
      color,
      intensity,
      position: { set: vi.fn() },
      castShadow: false,
      shadow: {
        mapSize: { width: 0, height: 0 },
        camera: { near: 0, far: 0, left: 0, right: 0, top: 0, bottom: 0 }
      },
      name: 'directionalLight'
    })),
    PointLight: vi.fn().mockImplementation((color, intensity, distance) => ({
      color,
      intensity,
      distance,
      position: { set: vi.fn() },
      name: 'pointLight'
    })),
    GridHelper: vi.fn().mockImplementation((size, divisions) => ({
      size,
      divisions,
      name: 'gridHelper'
    })),
    AxesHelper: vi.fn().mockImplementation((size) => ({
      size,
      name: 'axesHelper'
    })),
    PerspectiveCamera: vi.fn().mockImplementation((fov, aspect, near, far) => ({
      fov,
      aspect,
      near,
      far,
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
      name: 'camera'
    })),
    OrthographicCamera: vi.fn().mockImplementation((left, right, top, bottom, near, far) => ({
      left,
      right,
      top,
      bottom,
      near,
      far,
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      updateProjectionMatrix: vi.fn(),
      name: 'camera'
    })),
    Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z }))
  };
});

describe('R3FSceneService', () => {
  let sceneService: ReturnType<typeof createR3FSceneService>;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F scene service test');
    sceneService = createR3FSceneService();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F scene service test');
    vi.clearAllMocks();
  });

  describe('createScene', () => {
    it('should create scene with default configuration', () => {
      console.log('[DEBUG] Testing scene creation with defaults');
      
      const result = sceneService.createScene();
      
      expect(result.success).toBe(true);
      if (result.success) {
        const scene = result.data;
        expect(scene).toBeInstanceOf(THREE.Scene);
        expect(THREE.Color).toHaveBeenCalledWith('#2c3e50');
      }
    });

    it('should create scene with custom configuration', () => {
      console.log('[DEBUG] Testing scene creation with custom config');
      
      const config: R3FSceneConfig = {
        enableCamera: true,
        enableLighting: true,
        backgroundColor: '#ff0000',
        enableGrid: true,
        enableAxes: true,
        ambientLightIntensity: 0.6,
        directionalLightIntensity: 1.2,
        gridSize: 30
      };
      
      const result = sceneService.createScene(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const scene = result.data;
        expect(scene).toBeInstanceOf(THREE.Scene);
        expect(THREE.Color).toHaveBeenCalledWith('#ff0000');
        expect(THREE.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.6);
        expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 1.2);
        expect(THREE.GridHelper).toHaveBeenCalledWith(30, 30);
        expect(THREE.AxesHelper).toHaveBeenCalledWith(5);
      }
    });

    it('should create scene with fog configuration', () => {
      console.log('[DEBUG] Testing scene creation with fog');
      
      const config: R3FSceneConfig = {
        fog: {
          color: '#cccccc',
          near: 10,
          far: 100
        }
      };
      
      const result = sceneService.createScene(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(THREE.Fog).toHaveBeenCalledWith('#cccccc', 10, 100);
      }
    });

    it('should handle scene creation errors gracefully', () => {
      console.log('[DEBUG] Testing scene creation error handling');
      
      // Mock Scene constructor to throw
      const originalScene = THREE.Scene;
      (THREE as any).Scene = vi.fn(() => {
        throw new Error('Scene creation failed');
      });
      
      const result = sceneService.createScene();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Failed to create scene');
      }
      
      // Restore original constructor
      (THREE as any).Scene = originalScene;
    });
  });

  describe('setupLighting', () => {
    let scene: THREE.Scene;

    beforeEach(() => {
      scene = new THREE.Scene();
    });

    it('should setup lighting with default configuration', () => {
      console.log('[DEBUG] Testing lighting setup with defaults');
      
      const config: R3FSceneConfig = {
        ambientLightIntensity: 0.4,
        directionalLightIntensity: 1,
        directionalLightPosition: [10, 10, 5]
      };
      
      const result = sceneService.setupLighting(scene, config);
      
      expect(result.success).toBe(true);
      expect(THREE.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.4);
      expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 1);
      expect(THREE.PointLight).toHaveBeenCalledWith(0xffffff, 0.5, 100);
      expect(scene.add).toHaveBeenCalledTimes(3); // ambient, directional, point lights
    });

    it('should handle lighting setup with null scene', () => {
      console.log('[DEBUG] Testing lighting setup with null scene');
      
      const config: R3FSceneConfig = {};
      const result = sceneService.setupLighting(null, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid scene provided');
      }
    });

    it('should handle lighting setup errors gracefully', () => {
      console.log('[DEBUG] Testing lighting setup error handling');
      
      // Mock AmbientLight constructor to throw
      const originalAmbientLight = THREE.AmbientLight;
      (THREE as any).AmbientLight = vi.fn(() => {
        throw new Error('Light creation failed');
      });
      
      const config: R3FSceneConfig = {};
      const result = sceneService.setupLighting(scene, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Lighting setup failed');
      }
      
      // Restore original constructor
      (THREE as any).AmbientLight = originalAmbientLight;
    });
  });

  describe('setupCamera', () => {
    let scene: THREE.Scene;

    beforeEach(() => {
      scene = new THREE.Scene();
    });

    it('should setup perspective camera with default configuration', () => {
      console.log('[DEBUG] Testing perspective camera setup with defaults');
      
      const config: R3FCameraConfig = {
        type: 'perspective',
        fov: 75,
        aspect: 1,
        near: 0.1,
        far: 1000,
        position: [10, 10, 10],
        target: [0, 0, 0]
      };
      
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const camera = result.data;
        expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
        expect(THREE.PerspectiveCamera).toHaveBeenCalledWith(75, 1, 0.1, 1000);
        expect(camera.position.set).toHaveBeenCalledWith(10, 10, 10);
        expect(camera.lookAt).toHaveBeenCalled();
      }
    });

    it('should setup orthographic camera', () => {
      console.log('[DEBUG] Testing orthographic camera setup');
      
      const config: R3FCameraConfig = {
        type: 'orthographic',
        aspect: 1,
        near: 0.1,
        far: 1000,
        position: [5, 5, 5],
        target: [0, 0, 0]
      };
      
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const camera = result.data;
        expect(camera).toBeInstanceOf(THREE.OrthographicCamera);
        expect(camera.position.set).toHaveBeenCalledWith(5, 5, 5);
        expect(camera.lookAt).toHaveBeenCalled();
      }
    });

    it('should handle camera setup with null scene', () => {
      console.log('[DEBUG] Testing camera setup with null scene');
      
      const config: R3FCameraConfig = {};
      const result = sceneService.setupCamera(null, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid scene provided');
      }
    });

    it('should handle camera setup errors gracefully', () => {
      console.log('[DEBUG] Testing camera setup error handling');
      
      // Mock PerspectiveCamera constructor to throw
      const originalPerspectiveCamera = THREE.PerspectiveCamera;
      (THREE as any).PerspectiveCamera = vi.fn(() => {
        throw new Error('Camera creation failed');
      });
      
      const config: R3FCameraConfig = { type: 'perspective' };
      const result = sceneService.setupCamera(scene, config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Camera setup failed');
      }
      
      // Restore original constructor
      (THREE as any).PerspectiveCamera = originalPerspectiveCamera;
    });
  });

  describe('disposeScene', () => {
    it('should dispose scene safely', () => {
      console.log('[DEBUG] Testing scene disposal');
      
      const scene = new THREE.Scene();
      
      expect(() => sceneService.disposeScene(scene)).not.toThrow();
      expect(scene.traverse).toHaveBeenCalled();
      expect(scene.clear).toHaveBeenCalled();
    });

    it('should handle disposal of null scene', () => {
      console.log('[DEBUG] Testing disposal of null scene');
      
      expect(() => sceneService.disposeScene(null)).not.toThrow();
    });

    it('should handle disposal errors gracefully', () => {
      console.log('[DEBUG] Testing disposal error handling');
      
      const scene = new THREE.Scene();
      
      // Mock traverse to throw error
      scene.traverse = vi.fn(() => {
        throw new Error('Disposal error');
      });
      
      expect(() => sceneService.disposeScene(scene)).not.toThrow();
    });
  });
});
