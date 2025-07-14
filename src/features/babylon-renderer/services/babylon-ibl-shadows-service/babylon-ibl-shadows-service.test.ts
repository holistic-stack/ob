/**
 * @file BabylonJS IBL Shadows Service Tests
 *
 * Tests for BabylonJS IBL shadows service functionality.
 * Following TDD principles with real implementations where possible.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IBLShadowConfig } from './babylon-ibl-shadows-service';
import { BabylonIBLShadowsService, DEFAULT_IBL_SHADOW_CONFIG } from './babylon-ibl-shadows-service';

// Mock BabylonJS components for testing
const createMockScene = () =>
  ({
    dispose: vi.fn(),
    render: vi.fn(),
    getEngine: vi.fn(() => ({
      webGLVersion: 2,
      isWebGPU: false,
    })),
    getMeshById: vi.fn(),
    environmentTexture: null,
    environmentIntensity: 1.0,
    environmentRotationY: 0,
    imageProcessingConfiguration: {
      toneMappingEnabled: false,
      toneMappingType: 0,
      exposure: 1.0,
    },
  }) as any;

const createMockMesh = (id: string) =>
  ({
    id,
    material: null,
    dispose: vi.fn(),
  }) as any;

const createMockPBRMaterial = (name: string) =>
  ({
    name,
    environmentTexture: null,
    environmentIntensity: 1.0,
    dispose: vi.fn(),
  }) as any;

const createMockHDRTexture = (url: string) =>
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
  Vector3Mock.Zero = vi.fn(() => ({ x: 0, y: 0, z: 0 }));

  // Mock Color3 constructor
  const Color3Mock = vi.fn().mockImplementation((r: number, g: number, b: number) => ({ r, g, b }));

  return {
    ...actual,
    HDRCubeTexture: vi.fn().mockImplementation((url: string) => createMockHDRTexture(url)),
    CubeTexture: vi.fn().mockImplementation((url: string) => createMockHDRTexture(url)),
    PBRMaterial: vi.fn().mockImplementation((name: string) => createMockPBRMaterial(name)),
    Vector3: Vector3Mock,
    Color3: Color3Mock,
    ImageProcessingConfiguration: {
      TONEMAPPING_ACES: 1,
    },
  };
});

describe('BabylonIBLShadowsService', () => {
  let iblService: BabylonIBLShadowsService;
  let mockScene: any;

  beforeEach(() => {
    // Create fresh instances for each test
    iblService = new BabylonIBLShadowsService();
    mockScene = createMockScene();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    iblService.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new BabylonIBLShadowsService();
      const config = service.getConfig();

      expect(config.enabled).toBe(DEFAULT_IBL_SHADOW_CONFIG.enabled);
      expect(config.shadowIntensity).toBe(DEFAULT_IBL_SHADOW_CONFIG.shadowIntensity);
      expect(config.environmentIntensity).toBe(DEFAULT_IBL_SHADOW_CONFIG.environmentIntensity);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: IBLShadowConfig = {
        ...DEFAULT_IBL_SHADOW_CONFIG,
        shadowIntensity: 0.5,
        environmentIntensity: 2.0,
      };

      const service = new BabylonIBLShadowsService(customConfig);
      const config = service.getConfig();

      expect(config.shadowIntensity).toBe(0.5);
      expect(config.environmentIntensity).toBe(2.0);
    });
  });

  describe('init', () => {
    it('should initialize with valid scene', async () => {
      const result = await iblService.init(mockScene);

      expect(result.success).toBe(true);
    });

    it('should handle null scene gracefully', async () => {
      const result = await iblService.init(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene is required');
      }
    });

    it('should handle unsupported environment', async () => {
      const unsupportedScene = {
        ...mockScene,
        getEngine: vi.fn(() => ({
          webGLVersion: 1,
          isWebGPU: false,
        })),
      };

      const result = await iblService.init(unsupportedScene);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('IBL_NOT_SUPPORTED');
        expect(result.error.message).toContain('not supported');
      }
    });

    it('should initialize with custom configuration', async () => {
      const customConfig = {
        shadowIntensity: 0.8,
        environmentIntensity: 1.5,
      };

      const result = await iblService.init(mockScene, customConfig);

      expect(result.success).toBe(true);

      const config = iblService.getConfig();
      expect(config.shadowIntensity).toBe(0.8);
      expect(config.environmentIntensity).toBe(1.5);
    });
  });

  describe('loadEnvironmentTexture', () => {
    beforeEach(async () => {
      await iblService.init(mockScene);
    });

    it('should load HDR environment texture successfully', async () => {
      const textureUrl = 'test-environment.hdr';
      const result = await iblService.loadEnvironmentTexture(textureUrl);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
      }

      // Verify HDRCubeTexture was created
      const { HDRCubeTexture } = await import('@babylonjs/core');
      expect(HDRCubeTexture).toHaveBeenCalledWith(textureUrl, mockScene, 512, false, true, false);
    });

    it('should handle texture loading without scene initialization', async () => {
      const uninitializedService = new BabylonIBLShadowsService();
      const result = await uninitializedService.loadEnvironmentTexture('test.hdr');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene must be initialized');
      }
    });
  });

  describe('applyToMesh', () => {
    beforeEach(async () => {
      await iblService.init(mockScene);
      await iblService.loadEnvironmentTexture('test-environment.hdr');
    });

    it('should apply IBL shadows to mesh successfully', async () => {
      const mockMesh = createMockMesh('test-mesh');
      const result = iblService.applyToMesh(mockMesh);

      expect(result.success).toBe(true);

      // Verify PBR material was created
      const { PBRMaterial } = await import('@babylonjs/core');
      expect(PBRMaterial).toHaveBeenCalledWith('test-mesh_pbr_material', mockScene);

      // Verify mesh is tracked
      const state = iblService.getState();
      expect(state.affectedMeshes).toContain('test-mesh');
    });

    it('should handle mesh with existing PBR material', () => {
      const mockMesh = createMockMesh('test-mesh');
      mockMesh.material = createMockPBRMaterial('existing-material');

      const result = iblService.applyToMesh(mockMesh);

      expect(result.success).toBe(true);

      // Verify existing material was used
      expect(mockMesh.material.environmentTexture).toBeDefined();
    });

    it('should handle application without initialization', () => {
      const uninitializedService = new BabylonIBLShadowsService();
      const mockMesh = createMockMesh('test-mesh');

      const result = uninitializedService.applyToMesh(mockMesh);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('must be initialized');
      }
    });
  });

  describe('applyToMeshes', () => {
    beforeEach(async () => {
      await iblService.init(mockScene);
      await iblService.loadEnvironmentTexture('test-environment.hdr');
    });

    it('should apply IBL shadows to multiple meshes successfully', () => {
      const meshes = [createMockMesh('mesh-1'), createMockMesh('mesh-2'), createMockMesh('mesh-3')];

      const result = iblService.applyToMeshes(meshes);

      expect(result.success).toBe(true);

      // Verify all meshes are tracked
      const state = iblService.getState();
      expect(state.affectedMeshes).toContain('mesh-1');
      expect(state.affectedMeshes).toContain('mesh-2');
      expect(state.affectedMeshes).toContain('mesh-3');
    });

    it('should handle empty mesh array', () => {
      const result = iblService.applyToMeshes([]);

      expect(result.success).toBe(true);
    });
  });

  describe('updateConfig', () => {
    beforeEach(async () => {
      await iblService.init(mockScene);
    });

    it('should update configuration successfully', () => {
      const newConfig = {
        shadowIntensity: 0.7,
        environmentIntensity: 1.8,
      };

      const result = iblService.updateConfig(newConfig);

      expect(result.success).toBe(true);

      const config = iblService.getConfig();
      expect(config.shadowIntensity).toBe(0.7);
      expect(config.environmentIntensity).toBe(1.8);
    });

    it('should update scene properties when relevant config changes', () => {
      const newConfig = {
        environmentIntensity: 2.5,
      };

      const result = iblService.updateConfig(newConfig);

      expect(result.success).toBe(true);
      expect(mockScene.environmentIntensity).toBe(2.5);
    });
  });

  describe('getState', () => {
    beforeEach(async () => {
      await iblService.init(mockScene);
    });

    it('should return correct initial state', () => {
      const state = iblService.getState();

      expect(state.isEnabled).toBe(true);
      expect(state.affectedMeshes).toEqual([]);
      expect(state.shadowIntensity).toBe(DEFAULT_IBL_SHADOW_CONFIG.shadowIntensity);
      expect(state.environmentIntensity).toBe(DEFAULT_IBL_SHADOW_CONFIG.environmentIntensity);
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return correct state after applying to meshes', async () => {
      await iblService.loadEnvironmentTexture('test-environment.hdr');
      const mockMesh = createMockMesh('test-mesh');
      iblService.applyToMesh(mockMesh);

      const state = iblService.getState();

      expect(state.affectedMeshes).toContain('test-mesh');
      expect(state.environmentTexture).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = iblService.getConfig();

      expect(config).toEqual(DEFAULT_IBL_SHADOW_CONFIG);
    });

    it('should return updated configuration', () => {
      const newConfig = {
        shadowIntensity: 0.6,
      };

      iblService.updateConfig(newConfig);
      const config = iblService.getConfig();

      expect(config.shadowIntensity).toBe(0.6);
    });
  });

  describe('dispose', () => {
    it('should dispose service cleanly', async () => {
      await iblService.init(mockScene);
      await iblService.loadEnvironmentTexture('test-environment.hdr');

      iblService.dispose();

      // Verify state is cleared
      const state = iblService.getState();
      expect(state.affectedMeshes).toEqual([]);
      expect(state.environmentTexture).toBeNull();
    });

    it('should handle disposal when not initialized', () => {
      // Should not throw
      expect(() => iblService.dispose()).not.toThrow();
    });
  });
});
