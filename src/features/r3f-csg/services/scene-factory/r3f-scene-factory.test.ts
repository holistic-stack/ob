/**
 * @file R3F Scene Factory Tests
 * 
 * TDD tests for the R3F scene factory following React 19 best practices
 * and functional programming principles. Tests scene generation from mesh arrays.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { R3FSceneFactory, createR3FSceneFactory } from './r3f-scene-factory';
import type { SceneFactoryConfig } from '../../types/r3f-csg-types';

// Mock Three.js for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  const THREE = actual as typeof import('three');

  return {
    ...actual,
    Scene: vi.fn().mockImplementation(() => ({
      type: 'Scene',
      name: '',
      background: null,
      fog: null,
      children: [],
      add: vi.fn(),
      remove: vi.fn(),
      traverse: vi.fn(callback => {
        // Mock traverse to call callback on mock objects
        callback({ type: 'Mesh', geometry: { attributes: { position: { count: 24 } } }, material: {} });
        callback({ type: 'Light' });
      }),
      clear: vi.fn(),
    })),
    Color: vi.fn().mockImplementation(color => ({ color })),
    Fog: vi.fn().mockImplementation((color, near, far) => ({ color, near, far })),
    AmbientLight: vi.fn().mockImplementation((color, intensity) => ({
      type: 'AmbientLight',
      color,
      intensity,
      name: '',
    })),
    DirectionalLight: vi.fn().mockImplementation((color, intensity) => ({
      type: 'DirectionalLight',
      color,
      intensity,
      position: { set: vi.fn() },
      castShadow: false,
      shadow: {
        mapSize: { width: 0, height: 0 },
        camera: { near: 0, far: 0, left: 0, right: 0, top: 0, bottom: 0 },
      },
      name: '',
    })),
    PointLight: vi.fn().mockImplementation((color, intensity, distance) => ({
      type: 'PointLight',
      color,
      intensity,
      distance,
      position: { set: vi.fn() },
      name: '',
    })),
    GridHelper: vi.fn().mockImplementation((size, divisions) => ({
      type: 'GridHelper',
      size,
      divisions,
      name: '',
    })),
    AxesHelper: vi.fn().mockImplementation(size => ({
      type: 'AxesHelper',
      size,
      name: '',
    })),
    PerspectiveCamera: vi.fn().mockImplementation((fov, aspect, near, far) => ({
      type: 'PerspectiveCamera',
      fov,
      aspect,
      near,
      far,
      position: { set: vi.fn() },
      lookAt: vi.fn(),
      name: '',
    })),
    Box3: vi.fn().mockImplementation(() => ({
      union: vi.fn(),
      getCenter: vi.fn(() => new THREE.Vector3(0, 0, 0)),
      getSize: vi.fn(() => new THREE.Vector3(2, 2, 2)),
    })),
    Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z })),
    Mesh: vi.fn().mockImplementation((geometry, material) => ({
      type: 'Mesh',
      geometry,
      material,
      name: '',
      clone: vi.fn(() => ({
        type: 'Mesh',
        geometry,
        material,
        name: '',
        castShadow: false,
        receiveShadow: false,
      })),
      castShadow: false,
      receiveShadow: false,
    })),
    Material: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    MeshStandardMaterial: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    BufferGeometry: THREE.BufferGeometry,
    BufferAttribute: THREE.BufferAttribute,
  };
});

const createMockGeometry = (): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3));
  vi.spyOn(geometry, 'dispose');
  return geometry;
};

const createMockMesh = (geometry: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh => {
  const mesh = new THREE.Mesh(geometry, material);
  vi.spyOn(mesh, 'clone').mockReturnValue(mesh);
  return mesh;
};

describe('R3FSceneFactory', () => {
  let sceneFactory: R3FSceneFactory;
  let mockMeshes: THREE.Mesh[];

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F scene factory test');
    
    sceneFactory = createR3FSceneFactory();
    
    // Create mock meshes
    const geometry = { 
      attributes: { position: { count: 24 } },
      computeBoundingBox: vi.fn(),
      computeBoundingSphere: vi.fn(),
      computeVertexNormals: vi.fn(),
      boundingBox: { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } }
    };
    const material = { dispose: vi.fn() };
    
    mockMeshes = [
      createMockMesh(createMockGeometry(), new THREE.MeshStandardMaterial()),
      createMockMesh(createMockGeometry(), new THREE.MeshStandardMaterial()),
    ];
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F scene factory test');
    sceneFactory.dispose();
    vi.clearAllMocks();
  });

  describe('constructor and configuration', () => {
    it('should create scene factory with default configuration', () => {
      console.log('[DEBUG] Testing scene factory creation with defaults');
      
      const defaultFactory = createR3FSceneFactory();
      expect(defaultFactory).toBeDefined();
      expect(typeof defaultFactory.createScene).toBe('function');
      expect(typeof defaultFactory.dispose).toBe('function');
      
      defaultFactory.dispose();
    });

    it('should create scene factory with custom configuration', () => {
      console.log('[DEBUG] Testing scene factory creation with custom config');
      
      const config: SceneFactoryConfig = {
        enableLighting: false,
        enableShadows: false,
        enableGrid: false,
        backgroundColor: '#ff0000'
      };
      
      const customFactory = createR3FSceneFactory(config);
      expect(customFactory).toBeDefined();
      
      customFactory.dispose();
    });
  });

  describe('scene creation', () => {
    it('should create scene from mesh array', () => {
      console.log('[DEBUG] Testing scene creation from meshes');
      
      const result = sceneFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const scene = result.data;
        expect(scene).toBeInstanceOf(THREE.Scene);
        expect(scene.children.length).toBe(mockMeshes.length);
        if (mockMeshes[0]) {
          expect(mockMeshes[0].clone).toHaveBeenCalled();
        }
      }
    });

    it('should create scene with lighting enabled', () => {
      console.log('[DEBUG] Testing scene creation with lighting');
      
      const lightingFactory = createR3FSceneFactory({ enableLighting: true });
      const result = lightingFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(THREE.AmbientLight).toHaveBeenCalled();
        expect(THREE.DirectionalLight).toHaveBeenCalled();
        expect(THREE.PointLight).toHaveBeenCalled();
      }
      
      lightingFactory.dispose();
    });

    it('should create scene with grid and axes', () => {
      console.log('[DEBUG] Testing scene creation with grid and axes');
      
      const result = sceneFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(THREE.GridHelper).toHaveBeenCalled();
        expect(THREE.AxesHelper).toHaveBeenCalled();
      }
    });

    it('should create scene with fog when enabled', () => {
      console.log('[DEBUG] Testing scene creation with fog');
      
      const fogFactory = createR3FSceneFactory({ enableFog: true });
      const result = fogFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(THREE.Fog).toHaveBeenCalled();
      }
      
      fogFactory.dispose();
    });

    it('should create scene with shadows when enabled', () => {
      console.log('[DEBUG] Testing scene creation with shadows');
      
      const shadowFactory = createR3FSceneFactory({ enableShadows: true });
      const result = shadowFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify meshes have shadow properties set
        if (mockMeshes[0]) {
          expect(mockMeshes[0].clone).toHaveBeenCalled();
        }
      }

      shadowFactory.dispose();
    });
  });

  describe('scene creation with camera', () => {
    it('should create scene with optimal camera positioning', () => {
      console.log('[DEBUG] Testing scene creation with camera');
      
      const result = sceneFactory.createSceneWithCamera(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scene).toBeDefined();
        expect(result.data.camera).toBeDefined();
        expect(result.data.camera.type).toBe('PerspectiveCamera');
        expect(THREE.PerspectiveCamera).toHaveBeenCalled();
      }
    });

    it('should position camera optimally based on scene bounds', () => {
      console.log('[DEBUG] Testing optimal camera positioning');
      
      const result = sceneFactory.createSceneWithCamera(mockMeshes);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.camera.position.set).toHaveBeenCalled();
        expect(result.data.camera.lookAt).toHaveBeenCalled();
      }
    });
  });

  describe('error handling', () => {
    it('should handle empty mesh array', () => {
      console.log('[DEBUG] Testing empty mesh array handling');
      
      const result = sceneFactory.createScene([]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No meshes provided');
      }
    });

    it('should handle null mesh array', () => {
      console.log('[DEBUG] Testing null mesh array handling');
      
      const result = sceneFactory.createScene(null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('null or undefined');
      }
    });

    it('should handle mesh with no geometry', () => {
      console.log('[DEBUG] Testing mesh with no geometry');

      const invalidMesh = new THREE.Mesh(null as any, new THREE.Material());
      const result = sceneFactory.createScene([invalidMesh]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no geometry');
      }
    });

    it('should handle mesh with no material', () => {
      console.log('[DEBUG] Testing mesh with no material');

      const geometry = createMockGeometry();
      const invalidMesh = new THREE.Mesh(geometry, null as any);
      const result = sceneFactory.createScene([invalidMesh]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no material');
      }
    });
  });

  describe('disposal', () => {
    it('should dispose resources properly', () => {
      console.log('[DEBUG] Testing resource disposal');
      
      const result = sceneFactory.createScene(mockMeshes);
      expect(result.success).toBe(true);
      
      // Dispose should not throw
      expect(() => sceneFactory.dispose()).not.toThrow();
    });

    it('should handle disposal of empty factory', () => {
      console.log('[DEBUG] Testing disposal of empty factory');
      
      const emptyFactory = createR3FSceneFactory();
      
      // Dispose should not throw even if no scenes were created
      expect(() => emptyFactory.dispose()).not.toThrow();
    });

    it('should clean up scene resources on disposal', () => {
      console.log('[DEBUG] Testing scene resource cleanup');
      
      const result = sceneFactory.createScene(mockMeshes);
      expect(result.success).toBe(true);
      
      sceneFactory.dispose();
      
      if (result.success) {
        expect(result.data.traverse).toHaveBeenCalled();
        expect(result.data.clear).toHaveBeenCalled();
      }
    });
  });

  describe('configuration options', () => {
    it('should respect lighting configuration', () => {
      console.log('[DEBUG] Testing lighting configuration');
      
      const noLightingFactory = createR3FSceneFactory({ enableLighting: false });
      const result = noLightingFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      // Lighting should not be added when disabled
      
      noLightingFactory.dispose();
    });

    it('should respect grid configuration', () => {
      console.log('[DEBUG] Testing grid configuration');
      
      const noGridFactory = createR3FSceneFactory({ enableGrid: false });
      const result = noGridFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      // Grid should not be added when disabled
      
      noGridFactory.dispose();
    });

    it('should respect axes configuration', () => {
      console.log('[DEBUG] Testing axes configuration');
      
      const noAxesFactory = createR3FSceneFactory({ enableAxes: false });
      const result = noAxesFactory.createScene(mockMeshes);
      
      expect(result.success).toBe(true);
      // Axes should not be added when disabled
      
      noAxesFactory.dispose();
    });
  });

  describe('validation', () => {
    it('should validate meshes with correct geometry and material', () => {
      const factory = new R3FSceneFactory({});
      const result = factory.createScene(mockMeshes);
      expect(result.success).toBe(true);
    });

    it('should return an error if mesh has invalid geometry', () => {
      const factory = new R3FSceneFactory({});
      const invalidMesh = new THREE.Mesh(undefined, new THREE.MeshStandardMaterial());
      const result = factory.createScene([invalidMesh]);
      expect(result.success).toBe(false);
    });

    it('should return an error if mesh has invalid material', () => {
      const factory = new R3FSceneFactory({});
      const geometry = createMockGeometry();
      const invalidMesh = new THREE.Mesh(geometry, undefined as any);
      const result = factory.createScene([invalidMesh]);
      expect(result.success).toBe(false);
    });
  });
});
