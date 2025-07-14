/**
 * @file BabylonJS CSG2 Service Tests
 * 
 * Tests for BabylonJS CSG2 service with Manifold 3.1.1 integration.
 * Following TDD principles with real implementations where possible.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BabylonCSG2Service } from './babylon-csg2-service';
import { CSGOperationType, DEFAULT_CSG_CONFIG } from '../../types/babylon-csg.types';
import type { CSGOperationConfig } from '../../types/babylon-csg.types';

// Mock BabylonJS components for testing
const createMockScene = () => ({
  dispose: vi.fn(),
  render: vi.fn(),
  registerBeforeRender: vi.fn(),
  unregisterBeforeRender: vi.fn(),
}) as any;

const createMockMesh = (id: string) => ({
  id,
  geometry: {
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices: new Uint32Array([0, 1, 2]),
  },
  material: null,
  getVerticesData: vi.fn((kind: string) => {
    if (kind === 'position') return new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    if (kind === 'normal') return new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    if (kind === 'uv') return new Float32Array([0, 0, 1, 0, 0, 1]);
    return null;
  }),
  getIndices: vi.fn(() => new Uint32Array([0, 1, 2])),
  createNormals: vi.fn(),
  optimizeIndices: vi.fn(),
}) as any;

// Mock BabylonJS core
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');

  // Create mock CSG instance
  const mockCSGInstance = {
    union: vi.fn().mockReturnThis(),
    subtract: vi.fn().mockReturnThis(),
    intersect: vi.fn().mockReturnThis(),
    toMesh: vi.fn(),
  };

  return {
    ...actual,
    CSG2: {
      FromMesh: vi.fn().mockReturnValue(mockCSGInstance),
    },
  };
});

describe('BabylonCSG2Service', () => {
  let csgService: BabylonCSG2Service;
  let mockScene: any;
  let mockMeshA: any;
  let mockMeshB: any;

  beforeEach(async () => {
    // Create fresh instances for each test
    csgService = new BabylonCSG2Service();
    mockScene = createMockScene();
    mockMeshA = createMockMesh('meshA');
    mockMeshB = createMockMesh('meshB');

    // Reset mocks
    vi.clearAllMocks();

    // Setup mock CSG2 behavior
    const { CSG2 } = await import('@babylonjs/core');
    const mockInstance = CSG2.FromMesh(mockMeshA);
    mockInstance.toMesh.mockReturnValue(createMockMesh('result'));
  });

  afterEach(() => {
    // Clean up after each test
    csgService.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new BabylonCSG2Service();
      const config = service.getConfig();
      
      expect(config.operation).toBe(DEFAULT_CSG_CONFIG.operation);
      expect(config.preserveMaterials).toBe(DEFAULT_CSG_CONFIG.preserveMaterials);
      expect(config.optimizeResult).toBe(DEFAULT_CSG_CONFIG.optimizeResult);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: CSGOperationConfig = {
        ...DEFAULT_CSG_CONFIG,
        operation: CSGOperationType.DIFFERENCE,
        preserveMaterials: false,
      };
      
      const service = new BabylonCSG2Service(customConfig);
      const config = service.getConfig();
      
      expect(config.operation).toBe(CSGOperationType.DIFFERENCE);
      expect(config.preserveMaterials).toBe(false);
    });
  });

  describe('init', () => {
    it('should initialize with valid scene', () => {
      const result = csgService.init(mockScene);

      expect(result.success).toBe(true);
    });

    it('should handle null scene gracefully', () => {
      const result = csgService.init(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH');
        expect(result.error.message).toContain('Scene is required');
      }
    });
  });

  describe('union', () => {
    beforeEach(() => {
      csgService.init(mockScene);
    });

    it('should perform union operation successfully', async () => {
      const result = await csgService.union(mockMeshA, mockMeshB);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe(CSGOperationType.UNION);
        expect(result.data.resultMesh).toBeDefined();
        expect(result.data.metadata.operationId).toMatch(/^csg_op_\d+_\d+$/);
      }

      // Verify CSG2 methods were called
      const { CSG2 } = await import('@babylonjs/core');
      expect(CSG2.FromMesh).toHaveBeenCalledWith(mockMeshA);
      expect(CSG2.FromMesh).toHaveBeenCalledWith(mockMeshB);
    });

    it('should handle invalid meshes gracefully', async () => {
      const result = await csgService.union(null as any, mockMeshB);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_MESH');
      }
    });

    it('should apply custom configuration', async () => {
      const customConfig = {
        preserveMaterials: false,
        optimizeResult: false,
      };

      const result = await csgService.union(mockMeshA, mockMeshB, customConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isOptimized).toBe(false);
      }
    });
  });

  describe('difference', () => {
    beforeEach(() => {
      csgService.init(mockScene);
    });

    it('should perform difference operation successfully', async () => {
      const result = await csgService.difference(mockMeshA, mockMeshB);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe(CSGOperationType.DIFFERENCE);
        expect(result.data.resultMesh).toBeDefined();
      }

      // Verify CSG2 methods were called
      const { CSG2 } = await import('@babylonjs/core');
      expect(CSG2.FromMesh).toHaveBeenCalled();
    });
  });

  describe('intersection', () => {
    beforeEach(() => {
      csgService.init(mockScene);
    });

    it('should perform intersection operation successfully', async () => {
      const result = await csgService.intersection(mockMeshA, mockMeshB);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.operationType).toBe(CSGOperationType.INTERSECTION);
        expect(result.data.resultMesh).toBeDefined();
      }

      // Verify CSG2 methods were called
      const { CSG2 } = await import('@babylonjs/core');
      expect(CSG2.FromMesh).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = csgService.getConfig();
      
      expect(config).toEqual(DEFAULT_CSG_CONFIG);
    });

    it('should return updated configuration', () => {
      const newConfig = {
        preserveMaterials: false,
        optimizeResult: false,
      };

      csgService.updateConfig(newConfig);
      const config = csgService.getConfig();
      
      expect(config.preserveMaterials).toBe(false);
      expect(config.optimizeResult).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration partially', () => {
      const originalConfig = csgService.getConfig();
      
      csgService.updateConfig({ preserveMaterials: false });
      const updatedConfig = csgService.getConfig();
      
      expect(updatedConfig.preserveMaterials).toBe(false);
      expect(updatedConfig.optimizeResult).toBe(originalConfig.optimizeResult);
    });
  });

  describe('dispose', () => {
    it('should dispose service cleanly', () => {
      csgService.init(mockScene);
      
      // Should not throw
      expect(() => csgService.dispose()).not.toThrow();
    });

    it('should handle disposal when not initialized', () => {
      // Should not throw
      expect(() => csgService.dispose()).not.toThrow();
    });
  });

  describe('performance metrics', () => {
    beforeEach(() => {
      csgService.init(mockScene);
    });

    it('should include performance metrics in operation result', async () => {
      const result = await csgService.union(mockMeshA, mockMeshB);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.performance).toBeDefined();
        expect(result.data.metadata.performance.preparationTime).toBeGreaterThanOrEqual(0);
        expect(result.data.metadata.performance.operationTime).toBeGreaterThanOrEqual(0);
        expect(result.data.metadata.performance.conversionTime).toBeGreaterThanOrEqual(0);
        expect(result.data.metadata.performance.totalTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track triangle and vertex counts', async () => {
      const result = await csgService.union(mockMeshA, mockMeshB);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.triangleCount).toBe('number');
        expect(typeof result.data.vertexCount).toBe('number');
        expect(result.data.triangleCount).toBeGreaterThanOrEqual(0);
        expect(result.data.vertexCount).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
