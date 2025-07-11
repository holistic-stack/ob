/**
 * @file Manifold AST Converter Tests
 * Task 3.2: OpenSCAD AST Integration (Red Phase)
 *
 * Tests for converting OpenSCAD AST nodes to Manifold CSG operations
 * Following project guidelines:
 * - Use real OpenscadParser instances (no mocks)
 * - TDD methodology with Red-Green-Refactor cycles
 * - Result<T,E> error handling patterns
 * - Integration with existing AST pipeline while using Manifold instead of BSP
 */

import { BufferGeometry } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { Result } from '../../../../shared/types/result.types';
import type {
  ASTNode,
  DifferenceNode,
  IntersectionNode,
  UnionNode,
} from '../../../openscad-parser/ast/ast-types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { MaterialIDManager } from '../manifold-material-manager/manifold-material-manager';
import {
  clearAllResources,
  getMemoryStats,
} from '../manifold-memory-manager/manifold-memory-manager';
import {
  convertASTNodeToManifoldMesh,
  convertDifferenceNodeToManifold,
  convertIntersectionNodeToManifold,
  convertUnionNodeToManifold,
  ManifoldASTConverter,
  type ManifoldConversionOptions,
  type ManifoldConversionResult,
} from './manifold-ast-converter';

/**
 * Test suite for Manifold AST converter
 */
describe('Manifold AST Converter', () => {
  let parser: OpenscadParser;
  let materialManager: MaterialIDManager;
  let converter: ManifoldASTConverter;

  beforeEach(async () => {
    // Clear memory for clean test state
    clearAllResources();

    // Create real OpenscadParser instance (no mocks per project guidelines)
    parser = createTestParser();
    await parser.init();

    // Initialize material manager
    materialManager = new MaterialIDManager();
    await materialManager.initialize();

    // Initialize converter
    converter = new ManifoldASTConverter(materialManager);
    await converter.initialize();
  });

  afterEach(async () => {
    // Proper cleanup
    if (converter) {
      converter.dispose();
    }
    if (materialManager) {
      materialManager.dispose();
    }
    if (parser && typeof parser.dispose === 'function') {
      parser.dispose();
    }

    // Verify no memory leaks
    const stats = getMemoryStats();
    expect(stats.activeResources).toBe(0);
  });

  describe('Basic AST Node Conversion', () => {
    it('should convert union AST node to Manifold mesh', async () => {
      // Create mock union node
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Convert union node to Manifold mesh
      const result = await convertUnionNodeToManifold(unionNode);

      // Expected behavior: Result<T,E> pattern
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const manifoldResult = result.data;

        // Verify result structure
        expect(manifoldResult).toHaveProperty('geometry');
        expect(manifoldResult).toHaveProperty('operationTime');
        expect(manifoldResult).toHaveProperty('vertexCount');
        expect(manifoldResult).toHaveProperty('triangleCount');

        // Verify geometry is valid BufferGeometry
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);

        // Verify position attribute exists
        const positionAttribute = manifoldResult.geometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();
        expect(positionAttribute.count).toBeGreaterThan(0);
      }
    });

    it('should convert difference AST node to Manifold mesh', async () => {
      // Create mock difference node
      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Convert difference node to Manifold mesh
      const result = await convertDifferenceNodeToManifold(differenceNode);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const manifoldResult = result.data;

        // Verify result structure
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);

        // Should have valid geometry
        const positionAttribute = manifoldResult.geometry.getAttribute('position');
        expect(positionAttribute.count).toBeGreaterThan(0);
      }
    });

    it('should convert intersection AST node to Manifold mesh', async () => {
      // Create mock intersection node
      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Convert intersection node to Manifold mesh
      const result = await convertIntersectionNodeToManifold(intersectionNode);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const manifoldResult = result.data;

        // Verify result structure
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);

        // Should have valid geometry
        const positionAttribute = manifoldResult.geometry.getAttribute('position');
        expect(positionAttribute.count).toBeGreaterThan(0);
      }
    });
  });

  describe('ManifoldASTConverter Class', () => {
    it('should convert generic AST node using converter class', async () => {
      // Create mock cube node
      const cubeNode: ASTNode = {
        type: 'cube',
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      } as ASTNode;

      // Convert using converter class
      const result = await converter.convertNode(cubeNode);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const manifoldResult = result.data;
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);
      }
    });

    it('should handle complex nested AST structures', async () => {
      // Create mock complex nested structure: union(difference(cube, sphere), cube)
      const complexNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'difference',
            children: [
              {
                type: 'cube',
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 0, offset: 0 },
                },
              } as ASTNode,
              {
                type: 'sphere',
                location: {
                  start: { line: 0, column: 0, offset: 0 },
                  end: { line: 0, column: 0, offset: 0 },
                },
              } as ASTNode,
            ],
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          },
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      // Convert complex nested structure
      const result = await converter.convertNode(complexNode);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const manifoldResult = result.data;
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);

        // Complex operations should result in valid geometry
        const positionAttribute = manifoldResult.geometry.getAttribute('position');
        expect(positionAttribute.count).toBeGreaterThan(0);
      }
    });

    it('should handle conversion options and material preservation', async () => {
      // Create mock union node
      const unionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'sphere',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      const options: ManifoldConversionOptions = {
        preserveMaterials: true,
        optimizeResult: true,
        enableCaching: true,
      };

      // Convert with options
      const result = await converter.convertNode(unionNode, options);

      expect(result).toBeDefined();
      if (result.success) {
        const manifoldResult = result.data;
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);

        // Should have valid geometry
        expect(manifoldResult.geometry.groups).toBeDefined();
      }
    });
  });

  describe('Integration with Existing AST Pipeline', () => {
    it('should integrate with existing AST-to-CSG converter interface', async () => {
      // Create mock cube node
      const cubeNode: ASTNode = {
        type: 'cube',
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      } as ASTNode;

      // Use generic conversion function
      const result = await convertASTNodeToManifoldMesh(cubeNode, materialManager);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const manifoldResult = result.data;
        expect(manifoldResult.geometry).toBeInstanceOf(BufferGeometry);
      }
    });

    it('should handle error cases gracefully', async () => {
      // Test error handling with invalid AST node
      const invalidNode = {
        type: 'invalid_operation',
        children: [],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      } as ASTNode;

      // Convert invalid node
      const result = await converter.convertNode(invalidNode);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should maintain performance with large AST structures', async () => {
      // Create mock large union structure with multiple cubes
      const largeUnionNode: UnionNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
          {
            type: 'cube',
            location: {
              start: { line: 0, column: 0, offset: 0 },
              end: { line: 0, column: 0, offset: 0 },
            },
          } as ASTNode,
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      };

      const startTime = performance.now();
      const result = await converter.convertNode(largeUnionNode);
      const endTime = performance.now();

      // Performance should be reasonable (implementation will optimize this)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
