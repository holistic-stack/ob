/**
 * @file BabylonJS Material Service Tests
 *
 * Tests for BabylonJS advanced material service functionality.
 * Following TDD principles with real implementations where possible.
 */

// Real BabylonJS components for testing (no mocks)
import * as BABYLON from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NodeMaterialConfig, PBRMaterialConfig } from './babylon-material-service';
import {
  BabylonMaterialService,
  DEFAULT_PBR_CONFIG,
  MaterialType,
} from './babylon-material-service';

const createMockMesh = (id: string) =>
  ({
    id,
    material: null,
    dispose: vi.fn(),
  }) as any;

const createMockPBRMaterial = (name: string) =>
  ({
    name,
    baseColor: null,
    metallicFactor: 0,
    roughnessFactor: 1,
    emissiveColor: null,
    emissiveIntensity: 1,
    indexOfRefraction: 1.5,
    alphaCutOff: 0.5,
    transparencyMode: 0,
    clearCoat: {
      isEnabled: false,
      intensity: 0,
      roughness: 0,
      indexOfRefraction: 1.5,
      tintColor: null,
    },
    sheen: {
      isEnabled: false,
      intensity: 0,
      color: null,
      roughness: 0,
    },
    anisotropy: {
      isEnabled: false,
      intensity: 0,
      direction: null,
    },
    baseTexture: null,
    metallicRoughnessTexture: null,
    bumpTexture: null,
    emissiveTexture: null,
    ambientTexture: null,
    isReady: vi.fn(() => true),
    dispose: vi.fn(),
  }) as any;

const createMockNodeMaterial = (name: string) =>
  ({
    name,
    loadFromSerialization: vi.fn().mockResolvedValue(undefined),
    getInputBlockByPredicate: vi.fn(() => ({
      name: 'test-input',
      value: null,
    })),
    build: vi.fn(),
    isReady: vi.fn(() => true),
    dispose: vi.fn(),
  }) as any;

const createMockTexture = (url: string) =>
  ({
    url,
    isReady: vi.fn(() => true),
    onLoadObservable: {
      addOnce: vi.fn((callback: () => void) => callback()),
    },
    onErrorObservable: {
      addOnce: vi.fn(),
    },
    dispose: vi.fn(),
  }) as any;

// Mock BabylonJS core
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');

  // Mock Vector3 constructor
  const Vector3Mock = vi
    .fn()
    .mockImplementation((x: number, y: number, z: number) => ({ x, y, z }));
  (Vector3Mock as any).Zero = vi.fn(() => ({ x: 0, y: 0, z: 0 }));

  // Mock Color3 constructor
  const Color3Mock = vi.fn().mockImplementation((r: number, g: number, b: number) => ({ r, g, b }));

  return {
    ...actual,
    PBRMaterial: vi.fn().mockImplementation((name: string) => createMockPBRMaterial(name)),
    NodeMaterial: vi.fn().mockImplementation((name: string) => createMockNodeMaterial(name)),
    Texture: vi.fn().mockImplementation((url: string) => createMockTexture(url)),
    Vector3: Vector3Mock,
    Color3: Color3Mock,
  };
});

describe('BabylonMaterialService', () => {
  let materialService: BabylonMaterialService;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    // Create real BabylonJS instances for testing (no mocks)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    materialService = new BabylonMaterialService();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up resources
    materialService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('constructor', () => {
    it('should initialize service', () => {
      const service = new BabylonMaterialService();

      // Service should be created without errors
      expect(service).toBeDefined();
    });
  });

  describe('init', () => {
    it('should initialize with valid scene', () => {
      const result = materialService.init(scene);

      expect(result.success).toBe(true);
    });

    it('should handle null scene gracefully', () => {
      const result = materialService.init(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene is required');
      }
    });
  });

  describe('createPBRMaterial', () => {
    beforeEach(() => {
      materialService.init(scene);
    });

    it('should create PBR material successfully', async () => {
      const config: PBRMaterialConfig = {
        ...DEFAULT_PBR_CONFIG,
        name: 'test-pbr-material',
      };

      const result = await materialService.createPBRMaterial(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('test-pbr-material');
      }

      // Verify PBR material was created
      const { PBRMaterial } = await import('@babylonjs/core');
      expect(PBRMaterial).toHaveBeenCalledWith('test-pbr-material', scene);

      // Verify material is stored
      const material = materialService.getMaterial('test-pbr-material');
      expect(material).toBeDefined();

      // Verify state was created
      const state = materialService.getMaterialState('test-pbr-material');
      expect(state).toBeDefined();
      expect(state?.type).toBe(MaterialType.PBR);
    });

    it('should handle creation without scene initialization', async () => {
      const uninitializedService = new BabylonMaterialService();
      const config: PBRMaterialConfig = {
        ...DEFAULT_PBR_CONFIG,
        name: 'test-material',
      };

      const result = await uninitializedService.createPBRMaterial(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene must be initialized');
      }
    });

    it('should configure PBR material properties', async () => {
      const config: PBRMaterialConfig = {
        ...DEFAULT_PBR_CONFIG,
        name: 'custom-pbr',
        metallicFactor: 0.8,
        roughnessFactor: 0.2,
        clearCoat: {
          ...DEFAULT_PBR_CONFIG.clearCoat,
          enabled: true,
          intensity: 1.0,
        },
      };

      const result = await materialService.createPBRMaterial(config);

      expect(result.success).toBe(true);
      if (result.success) {
        // BabylonJS PBRMaterial uses 'metallic' and 'roughness' properties, not 'metallicFactor'/'roughnessFactor'
        expect((result.data as any).metallic).toBe(0.8);
        expect((result.data as any).roughness).toBe(0.2);
        expect((result.data as any).clearCoat.isEnabled).toBe(true);
        expect((result.data as any).clearCoat.intensity).toBe(1.0);
      }
    });
  });

  describe('createNodeMaterial', () => {
    beforeEach(() => {
      materialService.init(scene);
    });

    it('should create node material successfully', async () => {
      const config: NodeMaterialConfig = {
        name: 'test-node-material',
        nodeDefinition: JSON.stringify({ nodes: [], connections: [] }),
        inputs: { 'test-input': 1.0 },
        outputs: {},
      };

      const result = await materialService.createNodeMaterial(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('test-node-material');
      }

      // Verify NodeMaterial was created
      const { NodeMaterial } = await import('@babylonjs/core');
      expect(NodeMaterial).toHaveBeenCalledWith('test-node-material', scene);

      // Verify state was created
      const state = materialService.getMaterialState('test-node-material');
      expect(state?.type).toBe(MaterialType.NODE);
    });

    it('should handle invalid node definition', async () => {
      const config: NodeMaterialConfig = {
        name: 'invalid-node-material',
        nodeDefinition: 'invalid-json',
        inputs: {},
        outputs: {},
      };

      const result = await materialService.createNodeMaterial(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NODE_COMPILATION_FAILED');
      }
    });
  });

  describe('applyToMesh', () => {
    beforeEach(async () => {
      materialService.init(scene);
      await materialService.createPBRMaterial({
        ...DEFAULT_PBR_CONFIG,
        name: 'test-material',
      });
    });

    it('should apply material to mesh successfully', () => {
      const mockMesh = createMockMesh('test-mesh');
      const result = materialService.applyToMesh('test-material', mockMesh);

      expect(result.success).toBe(true);

      // Verify material was applied
      expect(mockMesh.material).toBeDefined();

      // Verify mesh is tracked in material state
      const state = materialService.getMaterialState('test-material');
      expect(state?.appliedMeshes).toContain('test-mesh');
    });

    it('should handle applying non-existent material', () => {
      const mockMesh = createMockMesh('test-mesh');
      const result = materialService.applyToMesh('non-existent', mockMesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MATERIAL_NOT_FOUND');
        expect(result.error.message).toContain('Material not found');
      }
    });
  });

  describe('getMaterial', () => {
    beforeEach(async () => {
      materialService.init(scene);
      await materialService.createPBRMaterial({
        ...DEFAULT_PBR_CONFIG,
        name: 'test-material',
      });
    });

    it('should return existing material', () => {
      const material = materialService.getMaterial('test-material');
      expect(material).toBeDefined();
      expect(material?.name).toBe('test-material');
    });

    it('should return undefined for non-existent material', () => {
      const material = materialService.getMaterial('non-existent');
      expect(material).toBeUndefined();
    });
  });

  describe('getAllMaterialStates', () => {
    beforeEach(() => {
      materialService.init(scene);
    });

    it('should return empty array when no materials exist', () => {
      const states = materialService.getAllMaterialStates();
      expect(states).toEqual([]);
    });

    it('should return all material states', async () => {
      await materialService.createPBRMaterial({
        ...DEFAULT_PBR_CONFIG,
        name: 'material-1',
      });
      await materialService.createPBRMaterial({
        ...DEFAULT_PBR_CONFIG,
        name: 'material-2',
      });

      const states = materialService.getAllMaterialStates();
      expect(states).toHaveLength(2);
      expect(states.map((s) => s.name)).toContain('material-1');
      expect(states.map((s) => s.name)).toContain('material-2');
    });
  });

  describe('removeMaterial', () => {
    beforeEach(async () => {
      materialService.init(scene);
      await materialService.createPBRMaterial({
        ...DEFAULT_PBR_CONFIG,
        name: 'test-material',
      });
    });

    it('should remove material successfully', () => {
      const result = materialService.removeMaterial('test-material');

      expect(result.success).toBe(true);

      // Verify material was removed
      const material = materialService.getMaterial('test-material');
      expect(material).toBeUndefined();

      // Verify state was removed
      const state = materialService.getMaterialState('test-material');
      expect(state).toBeUndefined();
    });

    it('should handle removing non-existent material', () => {
      const result = materialService.removeMaterial('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('MATERIAL_NOT_FOUND');
        expect(result.error.message).toContain('Material not found');
      }
    });
  });

  describe('dispose', () => {
    it('should dispose service cleanly', async () => {
      materialService.init(scene);
      await materialService.createPBRMaterial({
        ...DEFAULT_PBR_CONFIG,
        name: 'test-material',
      });

      materialService.dispose();

      // Verify all materials were disposed
      const states = materialService.getAllMaterialStates();
      expect(states).toEqual([]);
    });

    it('should handle disposal when not initialized', () => {
      // Should not throw
      expect(() => materialService.dispose()).not.toThrow();
    });
  });
});
