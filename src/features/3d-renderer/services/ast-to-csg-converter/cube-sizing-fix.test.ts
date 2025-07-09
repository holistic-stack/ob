/**
 * Cube Sizing Fix Test
 * 
 * Tests the fix for the issue where:
 * `cube(5, center=true);translate([0,0,0])cube(5, center=true);`
 * was generating 2 cubes with different sizes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import { convertASTNodeToCSG } from './ast-to-csg-converter.js';
import type { CubeNode, TranslateNode, ModuleInstantiationNode } from '../../../openscad-parser/core/ast-types.js';

const logger = createLogger('CubeSizingFixTest');

describe('Cube Sizing Fix', () => {
  beforeEach(() => {
    logger.init('Starting cube sizing fix test');
  });

  describe('Direct CubeNode vs ModuleInstantiationNode Conversion', () => {
    it('should produce identical meshes for identical cube parameters', async () => {
      // Create a direct CubeNode (like the first cube in the problematic code)
      const directCubeNode: CubeNode = {
        type: 'cube',
        size: 5,
        center: true,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 23, offset: 22 }
        }
      };

      // Create a ModuleInstantiationNode that represents a cube (like the second cube)
      const moduleInstantiationCubeNode: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'cube',
        args: [
          { value: 5 }, // First positional parameter: size
          { name: 'center', value: true } // Named parameter: center
        ],
        children: [],
        location: {
          start: { line: 1, column: 40, offset: 39 },
          end: { line: 1, column: 62, offset: 61 }
        }
      };

      // Convert both to meshes
      const directResult = await convertASTNodeToCSG(directCubeNode, 1);
      const moduleResult = await convertASTNodeToCSG(moduleInstantiationCubeNode, 1);

      // Both conversions should succeed
      expect(directResult.success).toBe(true);
      expect(moduleResult.success).toBe(true);

      if (directResult.success && moduleResult.success) {
        const directMesh = directResult.data.mesh;
        const moduleMesh = moduleResult.data.mesh;

        // Both should be BoxGeometry
        expect(directMesh.geometry.type).toBe('BoxGeometry');
        expect(moduleMesh.geometry.type).toBe('BoxGeometry');

        // Both should have identical dimensions
        const directParams = directMesh.geometry.parameters;
        const moduleParams = moduleMesh.geometry.parameters;

        expect(directParams.width).toBe(moduleParams.width);
        expect(directParams.height).toBe(moduleParams.height);
        expect(directParams.depth).toBe(moduleParams.depth);

        // Both should be 5x5x5 cubes
        expect(directParams.width).toBe(5);
        expect(directParams.height).toBe(5);
        expect(directParams.depth).toBe(5);

        logger.debug('✅ Direct and module instantiation cubes have identical dimensions');
      }
    });

    it('should handle the exact problematic case', async () => {
      // Simulate the exact AST structure from: cube(5, center=true);translate([0,0,0])cube(5, center=true);
      
      // First cube: direct CubeNode
      const firstCube: CubeNode = {
        type: 'cube',
        size: 5,
        center: true,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 23, offset: 22 }
        }
      };

      // Second cube: inside a translate transform (ModuleInstantiationNode)
      const translateWithCube: TranslateNode = {
        type: 'translate',
        v: [0, 0, 0],
        children: [
          {
            type: 'module_instantiation',
            name: 'cube',
            args: [
              { value: 5 }, // size parameter
              { name: 'center', value: true } // center parameter
            ],
            children: [],
            location: {
              start: { line: 1, column: 40, offset: 39 },
              end: { line: 1, column: 62, offset: 61 }
            }
          } as ModuleInstantiationNode
        ],
        location: {
          start: { line: 1, column: 24, offset: 23 },
          end: { line: 1, column: 62, offset: 61 }
        }
      };

      // Convert both
      const firstResult = await convertASTNodeToCSG(firstCube, 1);
      const translateResult = await convertASTNodeToCSG(translateWithCube, 1);

      expect(firstResult.success).toBe(true);
      expect(translateResult.success).toBe(true);

      if (firstResult.success && translateResult.success) {
        const firstMesh = firstResult.data.mesh;
        const translateMesh = translateResult.data.mesh;

        logger.debug('First cube mesh:', {
          type: firstMesh.geometry.type,
          params: firstMesh.geometry.parameters
        });

        logger.debug('Translate mesh:', {
          type: translateMesh.geometry.type,
          params: translateMesh.geometry.parameters
        });

        // Both should have the same geometry type
        expect(firstMesh.geometry.type).toBe('BoxGeometry');
        expect(translateMesh.geometry.type).toBe('BoxGeometry');

        // Both should have identical dimensions
        const firstParams = firstMesh.geometry.parameters;
        const translateParams = translateMesh.geometry.parameters;

        expect(firstParams.width).toBe(translateParams.width);
        expect(firstParams.height).toBe(translateParams.height);
        expect(firstParams.depth).toBe(translateParams.depth);

        // Both should be 5x5x5 cubes
        expect(firstParams.width).toBe(5);
        expect(firstParams.height).toBe(5);
        expect(firstParams.depth).toBe(5);

        logger.debug('✅ Problematic case fixed: both cubes have identical 5x5x5 dimensions');
      }
    });
  });

  describe('Parameter Extraction Edge Cases', () => {
    it('should handle various cube parameter formats', async () => {
      const testCases = [
        {
          description: 'Positional parameters only',
          node: {
            type: 'module_instantiation',
            name: 'cube',
            args: [
              { value: 10 }, // size
              { value: true } // center
            ],
            children: [],
            location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 19 } }
          } as ModuleInstantiationNode,
          expectedSize: 10,
          expectedCenter: true
        },
        {
          description: 'Named parameters only',
          node: {
            type: 'module_instantiation',
            name: 'cube',
            args: [
              { name: 'size', value: 7 },
              { name: 'center', value: false }
            ],
            children: [],
            location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 30, offset: 29 } }
          } as ModuleInstantiationNode,
          expectedSize: 7,
          expectedCenter: false
        },
        {
          description: 'Mixed parameters',
          node: {
            type: 'module_instantiation',
            name: 'cube',
            args: [
              { value: 3 }, // positional size
              { name: 'center', value: true } // named center
            ],
            children: [],
            location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 25, offset: 24 } }
          } as ModuleInstantiationNode,
          expectedSize: 3,
          expectedCenter: true
        }
      ];

      for (const testCase of testCases) {
        logger.debug(`Testing: ${testCase.description}`);
        
        const result = await convertASTNodeToCSG(testCase.node, 1);
        expect(result.success).toBe(true);

        if (result.success) {
          const mesh = result.data.mesh;
          const params = mesh.geometry.parameters;

          expect(params.width).toBe(testCase.expectedSize);
          expect(params.height).toBe(testCase.expectedSize);
          expect(params.depth).toBe(testCase.expectedSize);

          logger.debug(`✅ ${testCase.description}: ${testCase.expectedSize}x${testCase.expectedSize}x${testCase.expectedSize} cube created`);
        }
      }
    });

    it('should handle default values correctly', async () => {
      // Test cube with no parameters (should default to size=1, center=false)
      const defaultCubeNode: ModuleInstantiationNode = {
        type: 'module_instantiation',
        name: 'cube',
        args: [],
        children: [],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 7, offset: 6 } }
      };

      const result = await convertASTNodeToCSG(defaultCubeNode, 1);
      expect(result.success).toBe(true);

      if (result.success) {
        const mesh = result.data.mesh;
        const params = mesh.geometry.parameters;

        // Should default to 1x1x1 cube
        expect(params.width).toBe(1);
        expect(params.height).toBe(1);
        expect(params.depth).toBe(1);

        logger.debug('✅ Default cube parameters work correctly');
      }
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain consistency across multiple identical cubes', async () => {
      // Test multiple cubes with identical parameters
      const cubeNodes = [
        {
          type: 'cube',
          size: 8,
          center: true,
          location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 19 } }
        } as CubeNode,
        {
          type: 'module_instantiation',
          name: 'cube',
          args: [{ value: 8 }, { name: 'center', value: true }],
          children: [],
          location: { start: { line: 2, column: 1, offset: 21 }, end: { line: 2, column: 25, offset: 45 } }
        } as ModuleInstantiationNode,
        {
          type: 'module_instantiation',
          name: 'cube',
          args: [{ name: 'size', value: 8 }, { name: 'center', value: true }],
          children: [],
          location: { start: { line: 3, column: 1, offset: 47 }, end: { line: 3, column: 35, offset: 81 } }
        } as ModuleInstantiationNode
      ];

      const results = await Promise.all(
        cubeNodes.map(node => convertASTNodeToCSG(node, 1))
      );

      // All conversions should succeed
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        logger.debug(`Cube ${i + 1} conversion successful`);
      });

      // All cubes should have identical dimensions
      const meshes = results.map(r => r.success ? r.data.mesh : null).filter(Boolean);
      expect(meshes).toHaveLength(3);

      const firstParams = meshes[0]!.geometry.parameters;
      meshes.forEach((mesh, i) => {
        const params = mesh!.geometry.parameters;
        expect(params.width).toBe(firstParams.width);
        expect(params.height).toBe(firstParams.height);
        expect(params.depth).toBe(firstParams.depth);
        
        // All should be 8x8x8 cubes
        expect(params.width).toBe(8);
        expect(params.height).toBe(8);
        expect(params.depth).toBe(8);

        logger.debug(`✅ Cube ${i + 1}: 8x8x8 dimensions confirmed`);
      });

      logger.debug('✅ All identical cubes have consistent dimensions');
    });
  });
});
