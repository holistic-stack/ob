/**
 * @file AST-to-CSG Converter Tests (Fixed)
 *
 * Fixed version of AST-to-CSG converter tests with proper mocking to prevent stalling.
 * This test file isolates the matrix service dependencies to prevent initialization loops.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all matrix services BEFORE any imports
vi.mock('../../../3d-renderer/services/matrix-service-container.js', () => ({
  MatrixServiceContainer: vi.fn().mockImplementation(() => ({
    ensureInitialized: vi.fn().mockResolvedValue({ success: true }),
    getConversionService: vi.fn().mockReturnValue(null),
    getValidationService: vi.fn().mockReturnValue(null),
    getTelemetryService: vi.fn().mockReturnValue(null),
  })),
  matrixServiceContainer: {
    ensureInitialized: vi.fn().mockResolvedValue({ success: true }),
    getConversionService: vi.fn().mockReturnValue(null),
    getValidationService: vi.fn().mockReturnValue(null),
    getTelemetryService: vi.fn().mockReturnValue(null),
  },
}));

vi.mock('../../../3d-renderer/services/matrix-integration.service.js', () => ({
  MatrixIntegrationService: vi.fn().mockImplementation(() => ({
    convertMatrix4ToMLMatrix: vi.fn().mockResolvedValue({
      success: true,
      data: {
        result: {
          data: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
          ],
        },
        performance: {
          executionTime: 1,
          memoryUsed: 100,
          cacheHit: false,
          operationType: 'convert',
        },
        metadata: { timestamp: Date.now(), operationId: 'test', warnings: [] },
      },
    }),
    computeEnhancedNormalMatrix: vi.fn().mockResolvedValue({
      success: true,
      data: {
        result: { elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        performance: {
          executionTime: 1,
          memoryUsed: 100,
          cacheHit: false,
          operationType: 'normal',
        },
        metadata: { timestamp: Date.now(), operationId: 'test', warnings: [] },
      },
    }),
  })),
}));

// Mock CSG operations
vi.mock('../../../3d-renderer/services/csg-operations.js', () => {
  const mockMesh = {
    geometry: {
      dispose: vi.fn(),
      attributes: {},
      index: null,
    },
    material: {
      dispose: vi.fn(),
      color: { r: 1, g: 1, b: 1 },
    },
    position: {
      x: 0,
      y: 0,
      z: 0,
      set: vi.fn(),
      copy: vi.fn(),
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
      set: vi.fn(),
      copy: vi.fn(),
    },
    scale: {
      x: 1,
      y: 1,
      z: 1,
      set: vi.fn(),
      copy: vi.fn(),
    },
    matrix: {
      elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      copy: vi.fn(),
      multiply: vi.fn(),
    },
    updateMatrix: vi.fn(),
    clone: vi.fn().mockReturnThis(),
    type: 'Mesh',
    uuid: 'mock-uuid',
  };

  return {
    performCSGOperation: vi.fn().mockResolvedValue({
      success: true,
      data: mockMesh,
    }),
    createCSGConfig: vi.fn().mockReturnValue({
      operation: 'union',
      meshes: [],
      enableOptimization: true,
      maxComplexity: 10000,
    }),
  };
});

// Now import the modules after mocking
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { CubeNode, SourceLocation, UnionNode } from '../ast-types.js';
import { ASTToCSGConverter, DEFAULT_CSG_CONFIG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterFixedTest');

/**
 * Helper function to create test source location
 */
function createTestLocation(): SourceLocation {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 10, offset: 9 },
  };
}

describe('[FIXED] AST-to-CSG Converter Tests', () => {
  let converter: ASTToCSGConverter;

  beforeEach(() => {
    logger.debug('Setting up AST-to-CSG converter test');
    converter = new ASTToCSGConverter(DEFAULT_CSG_CONFIG);
  });

  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      expect(converter).toBeDefined();
      logger.debug('Initialization test completed');
    });

    it('should handle empty AST', async () => {
      const result = await converter.convert([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(0);
        expect(result.data.errors).toHaveLength(0);
        expect(result.data.statistics.totalNodes).toBe(0);
      }

      logger.debug('Empty AST test completed');
    });
  });

  describe('Primitive Shape Conversion', () => {
    it('should convert cube nodes to meshes', async () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 20, 30],
        center: false,
        location: createTestLocation(),
      };

      const result = await converter.convert([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(1);
      }

      logger.debug('Cube conversion test completed');
    });
  });

  describe('Boolean Operations', () => {
    it('should perform union operations', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: 10,
            center: true,
            location: createTestLocation(),
          } as CubeNode,
          {
            type: 'cube',
            size: 5,
            center: true,
            location: createTestLocation(),
          } as CubeNode,
        ],
        location: createTestLocation(),
      };

      const result = await converter.convert([unionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(2);
        expect(result.data.statistics.booleanOperations).toBe(1);
      }

      logger.debug('Union operation test completed');
    });
  });
});
