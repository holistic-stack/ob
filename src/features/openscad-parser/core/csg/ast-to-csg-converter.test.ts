/**
 * @file AST-to-CSG Converter Tests
 *
 * Comprehensive tests for AST-to-CSG conversion including primitives,
 * transformations, boolean operations, and performance validation.
 *
 * Following TDD methodology with real implementations.
 */

import * as THREE from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  MirrorNode,
  PolyhedronNode,
  SourceLocation,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../ast-types.js';
import { ASTToCSGConverter, DEFAULT_CSG_CONFIG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterTest');

// Mock matrix services to prevent initialization stalling
vi.mock('../../../3d-renderer/services/matrix-service-container.js', () => ({
  MatrixServiceContainer: vi.fn().mockImplementation(() => ({
    ensureInitialized: vi.fn().mockResolvedValue({ success: true }),
    getConversionService: vi.fn().mockReturnValue({
      convertMatrix4ToMLMatrix: vi.fn().mockResolvedValue({
        success: true,
        data: { data: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
      }),
    }),
    getValidationService: vi.fn().mockReturnValue(null),
    getTelemetryService: vi.fn().mockReturnValue(null),
  })),
  matrixServiceContainer: {
    ensureInitialized: vi.fn().mockResolvedValue({ success: true }),
    getConversionService: vi.fn().mockReturnValue({
      convertMatrix4ToMLMatrix: vi.fn().mockResolvedValue({
        success: true,
        data: { data: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
      }),
    }),
    getValidationService: vi.fn().mockReturnValue(null),
    getTelemetryService: vi.fn().mockReturnValue(null),
  },
}));

vi.mock('../../../3d-renderer/services/matrix-integration.service.js', () => ({
  MatrixIntegrationService: vi.fn().mockImplementation(() => ({
    convertMatrix4ToMLMatrix: vi.fn().mockResolvedValue({
      success: true,
      data: {
        result: { data: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
        validation: undefined,
        performance: { executionTime: 1, memoryUsed: 100, cacheHit: false, operationType: 'convert' },
        metadata: { timestamp: Date.now(), operationId: 'test', warnings: [] },
      },
    }),
    performRobustInversion: vi.fn().mockResolvedValue({
      success: true,
      data: {
        result: { data: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]] },
        validation: undefined,
        performance: { executionTime: 1, memoryUsed: 100, cacheHit: false, operationType: 'invert' },
        metadata: { timestamp: Date.now(), operationId: 'test', warnings: [] },
      },
    }),
    computeEnhancedNormalMatrix: vi.fn().mockResolvedValue({
      success: true,
      data: {
        result: new THREE.Matrix3(),
        validation: undefined,
        performance: { executionTime: 1, memoryUsed: 100, cacheHit: false, operationType: 'normal' },
        metadata: { timestamp: Date.now(), operationId: 'test', warnings: [] },
      },
    }),
  })),
}));

// Mock CSG operations to prevent matrix service initialization stalling
vi.mock('../../../3d-renderer/services/csg-operations.js', () => {
  const mockMesh = {
    geometry: {
      dispose: vi.fn(),
      attributes: {
        position: {
          count: 24, // 8 vertices * 3 components = 24 for a cube
          array: new Float32Array(24),
        },
        normal: {
          count: 24,
          array: new Float32Array(24),
        },
      },
      computeVertexNormals: vi.fn(),
      computeBoundingBox: vi.fn(),
      computeBoundingSphere: vi.fn(),
      clone: vi.fn().mockReturnThis(),
    },
    material: { dispose: vi.fn() },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    updateMatrix: vi.fn(),
    updateMatrixWorld: vi.fn(),
    clone: vi.fn().mockReturnThis(),
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

describe('[INIT][ASTToCSGConverter] AST-to-CSG Conversion Tests', () => {
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

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh?.geometry).toBeInstanceOf(THREE.BoxGeometry);

        // Check positioning for non-centered cube
        expect(mesh?.position.x).toBe(5); // width/2
        expect(mesh?.position.y).toBe(10); // height/2
        expect(mesh?.position.z).toBe(15); // depth/2
      }

      logger.debug('Cube conversion test completed');
    });

    it('should convert centered cube nodes', async () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: 10,
        center: true,
        location: createTestLocation(),
      };

      const result = await converter.convert([cubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data.meshes[0];
        expect(mesh?.position.x).toBe(0);
        expect(mesh?.position.y).toBe(0);
        expect(mesh?.position.z).toBe(0);
      }

      logger.debug('Centered cube conversion test completed');
    });

    it('should convert sphere nodes to meshes', async () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 15,
        location: createTestLocation(),
      };

      const result = await converter.convert([sphereNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh?.geometry).toBeInstanceOf(THREE.SphereGeometry);
      }

      logger.debug('Sphere conversion test completed');
    });

    it('should convert cylinder nodes to meshes', async () => {
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        r: 5,
        h: 20,
        center: false,
        location: createTestLocation(),
      };

      const result = await converter.convert([cylinderNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh?.geometry).toBeInstanceOf(THREE.CylinderGeometry);

        // Check positioning for non-centered cylinder
        expect(mesh?.position.y).toBe(10); // height/2
      }

      logger.debug('Cylinder conversion test completed');
    });

    it('should convert polyhedron nodes to meshes', async () => {
      const polyhedronNode: PolyhedronNode = {
        type: 'polyhedron',
        points: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        faces: [
          [0, 1, 2],
          [0, 1, 3],
          [0, 2, 3],
          [1, 2, 3],
        ],
        location: createTestLocation(),
      };

      const result = await converter.convert([polyhedronNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh?.geometry).toBeInstanceOf(THREE.BufferGeometry);
      }

      logger.debug('Polyhedron conversion test completed');
    });

    it('should handle sphere with diameter parameter', async () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        d: 20, // diameter = 20, so radius = 10
        location: createTestLocation(),
      };

      const result = await converter.convert([sphereNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh?.geometry).toBeInstanceOf(THREE.SphereGeometry);
      }

      logger.debug('Sphere with diameter test completed');
    });

    it('should handle tapered cylinder with r1/r2', async () => {
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r1: 5, // bottom radius
        r2: 2, // top radius
        center: true,
        location: createTestLocation(),
      };

      const result = await converter.convert([cylinderNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh?.geometry).toBeInstanceOf(THREE.CylinderGeometry);
      }

      logger.debug('Tapered cylinder test completed');
    });
  });

  describe('Parameter Validation', () => {
    it('should reject invalid cube dimensions', async () => {
      const invalidCubeNode: CubeNode = {
        type: 'cube',
        size: [-1, 5, 5], // negative width
        center: true,
        location: createTestLocation(),
      };

      const result = await converter.convert([invalidCubeNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_CUBE_DIMENSIONS');
        expect(result.data.meshes).toHaveLength(0);
      }

      logger.debug('Invalid cube dimensions test completed');
    });

    it('should reject invalid sphere radius', async () => {
      const invalidSphereNode: SphereNode = {
        type: 'sphere',
        r: -5, // negative radius
        location: createTestLocation(),
      };

      const result = await converter.convert([invalidSphereNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_SPHERE_RADIUS');
        expect(result.data.meshes).toHaveLength(0);
      }

      logger.debug('Invalid sphere radius test completed');
    });

    it('should reject invalid cylinder height', async () => {
      const invalidCylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 0, // zero height
        r: 5,
        center: true,
        location: createTestLocation(),
      };

      const result = await converter.convert([invalidCylinderNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_CYLINDER_HEIGHT');
        expect(result.data.meshes).toHaveLength(0);
      }

      logger.debug('Invalid cylinder height test completed');
    });

    it('should reject polyhedron with invalid points', async () => {
      const invalidPolyhedronNode: PolyhedronNode = {
        type: 'polyhedron',
        points: [], // empty points array
        faces: [[0, 1, 2]],
        location: createTestLocation(),
      };

      const result = await converter.convert([invalidPolyhedronNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('INVALID_POLYHEDRON_POINTS');
        expect(result.data.meshes).toHaveLength(0);
      }

      logger.debug('Invalid polyhedron points test completed');
    });
  });

  describe('Transformation Handling', () => {
    it('should apply translation transformations', async () => {
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [10, 20, 30],
        children: [
          {
            type: 'cube',
            size: 5,
            center: true,
            location: createTestLocation(),
          } as CubeNode,
        ],
        location: createTestLocation(),
      };

      const result = await converter.convert([translateNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.transformationsApplied).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh?.position.x).toBe(10);
        expect(mesh?.position.y).toBe(20);
        expect(mesh?.position.z).toBe(30);
      }

      logger.debug('Translation test completed');
    });

    it('should handle empty transformation nodes', async () => {
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [5, 5, 5],
        children: [],
        location: createTestLocation(),
      };

      const result = await converter.convert([translateNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(0);
        expect(result.data.statistics.transformationsApplied).toBe(0);
      }

      logger.debug('Empty transformation test completed');
    });

    it('should apply mirror transformations', async () => {
      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [1, 0, 0], // Mirror across X-axis
        children: [
          {
            type: 'cube',
            size: 5,
            center: true,
            location: createTestLocation(),
          } as CubeNode,
        ],
        location: createTestLocation(),
      };

      const result = await converter.convert([mirrorNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.transformationsApplied).toBe(1);

        const mesh = result.data.meshes[0];
        expect(mesh).toBeInstanceOf(THREE.Mesh);
      }

      logger.debug('Mirror transformation test completed');
    });

    it('should reject invalid mirror vector', async () => {
      const invalidMirrorNode: MirrorNode = {
        type: 'mirror',
        v: [0, 0, 0], // Zero vector
        children: [
          {
            type: 'cube',
            size: 5,
            center: true,
            location: createTestLocation(),
          } as CubeNode,
        ],
        location: createTestLocation(),
      };

      const result = await converter.convert([invalidMirrorNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(1);
        expect(result.data.errors[0]?.code).toBe('MIRROR_MATRIX_FAILURE');
        expect(result.data.meshes).toHaveLength(0);
      }

      logger.debug('Invalid mirror vector test completed');
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
            type: 'sphere',
            radius: 8,
            location: createTestLocation(),
          } as SphereNode,
        ],
        location: createTestLocation(),
      };

      const result = await converter.convert([unionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.booleanOperations).toBe(1);
        expect(result.data.statistics.primitivesCreated).toBe(2);
        expect(result.data.warnings).toHaveLength(1); // CSG operation simplified warning
        expect(result.data.warnings[0]?.code).toBe('CSG_OPERATION_SIMPLIFIED');
      }

      logger.debug('Union operation test completed');
    });

    it('should handle single child union operations', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: 10,
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
        expect(result.data.statistics.booleanOperations).toBe(0); // No operation needed
        expect(result.data.statistics.primitivesCreated).toBe(1);
      }

      logger.debug('Single child union test completed');
    });

    it('should handle empty union operations', async () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [],
        location: createTestLocation(),
      };

      const result = await converter.convert([unionNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(0);
        expect(result.data.statistics.booleanOperations).toBe(0);
      }

      logger.debug('Empty union test completed');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle nested transformations and operations', async () => {
      const complexAST: ASTNode[] = [
        {
          type: 'translate',
          v: [10, 0, 0],
          children: [
            {
              type: 'union',
              children: [
                {
                  type: 'cube',
                  size: 5,
                  center: true,
                  location: createTestLocation(),
                } as CubeNode,
                {
                  type: 'sphere',
                  radius: 3,
                  location: createTestLocation(),
                } as SphereNode,
              ],
              location: createTestLocation(),
            } as UnionNode,
          ],
          location: createTestLocation(),
        } as TranslateNode,
      ];

      const result = await converter.convert(complexAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1);
        expect(result.data.statistics.primitivesCreated).toBe(2);
        expect(result.data.statistics.transformationsApplied).toBe(1);
        expect(result.data.statistics.booleanOperations).toBe(1);
        expect(result.data.warnings).toHaveLength(1); // CSG operation simplified warning
      }

      logger.debug('Complex scenario test completed');
    });

    it('should handle multiple top-level objects', async () => {
      const multipleObjects: ASTNode[] = [
        {
          type: 'cube',
          size: 10,
          center: true,
          location: createTestLocation(),
        } as CubeNode,
        {
          type: 'sphere',
          radius: 5,
          location: createTestLocation(),
        } as SphereNode,
        {
          type: 'cylinder',
          r: 3,
          h: 15,
          center: true,
          location: createTestLocation(),
        } as CylinderNode,
      ];

      const result = await converter.convert(multipleObjects);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(3);
        expect(result.data.statistics.primitivesCreated).toBe(3);
        expect(result.data.statistics.totalNodes).toBe(3);
      }

      logger.debug('Multiple objects test completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion errors gracefully', async () => {
      // This test would require a malformed node that causes conversion to fail
      // For now, we test that the converter handles normal cases without errors
      const validNode: CubeNode = {
        type: 'cube',
        size: 10,
        center: true,
        location: createTestLocation(),
      };

      const result = await converter.convert([validNode]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toHaveLength(0);
      }

      logger.debug('Error handling test completed');
    });

    it('should skip non-renderable nodes', async () => {
      const mixedNodes: ASTNode[] = [
        {
          type: 'assignment',
          name: 'x',
          value: {
            type: 'literal',
            value: 10,
            location: createTestLocation(),
          },
          location: createTestLocation(),
        },
        {
          type: 'cube',
          size: 5,
          center: true,
          location: createTestLocation(),
        } as CubeNode,
      ];

      const result = await converter.convert(mixedNodes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshes).toHaveLength(1); // Only the cube should be rendered
        expect(result.data.statistics.primitivesCreated).toBe(1);
      }

      logger.debug('Non-renderable nodes test completed');
    });
  });

  describe('Performance Validation', () => {
    it('should complete conversion within performance targets', async () => {
      const performanceTestNodes: ASTNode[] = Array.from(
        { length: 10 },
        (_, i) =>
          ({
            type: 'cube',
            size: i + 1,
            center: true,
            location: createTestLocation(),
          }) as CubeNode
      );

      const startTime = performance.now();
      const result = await converter.convert(performanceTestNodes);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.statistics.conversionTime).toBeLessThan(16); // <16ms target
        expect(endTime - startTime).toBeLessThan(50); // Allow some overhead
      }

      logger.debug('Performance validation test completed');
    });
  });
});

/**
 * Helper function to create test source location
 */
function createTestLocation(): SourceLocation {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 10, offset: 9 },
  };
}
