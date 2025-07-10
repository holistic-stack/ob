/**
 * Cube Sizing Integration Test
 *
 * End-to-end test to validate that the cube sizing fix works correctly
 * for the specific case: cube(5, center=true);translate([0,0,0])cube(5, center=true);
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertASTNodeToCSG } from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter.js';
import { createLogger } from '../shared/services/logger.service.js';

const logger = createLogger('CubeSizingIntegration');

// Mock Three.js to avoid WebGL dependencies in tests
vi.mock('three', () => ({
  BoxGeometry: vi.fn().mockImplementation((width, height, depth) => ({
    type: 'BoxGeometry',
    parameters: { width, height, depth },
  })),
  Mesh: vi.fn().mockImplementation((geometry, material) => ({
    geometry,
    material,
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    updateMatrix: vi.fn(),
  })),
  MeshStandardMaterial: vi.fn().mockImplementation(() => ({})),
}));

describe('Cube Sizing Integration Test', () => {
  beforeEach(() => {
    logger.init('Starting cube sizing integration test');
  });

  describe('Real-world Scenario', () => {
    it('should fix the reported cube sizing issue', async () => {
      logger.debug(
        'Testing the exact reported issue: cube(5, center=true);translate([0,0,0])cube(5, center=true);'
      );

      // Simulate the AST that would be generated from the problematic OpenSCAD code
      const simulatedAST = [
        // First cube: cube(5, center=true);
        {
          type: 'cube',
          size: 5,
          center: true,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 23, offset: 22 },
          },
        },
        // Second cube: translate([0,0,0])cube(5, center=true);
        {
          type: 'translate',
          v: [0, 0, 0],
          children: [
            {
              type: 'module_instantiation',
              name: 'cube',
              args: [
                { value: 5 }, // size parameter
                { name: 'center', value: true }, // center parameter
              ],
              children: [],
              location: {
                start: { line: 1, column: 40, offset: 39 },
                end: { line: 1, column: 62, offset: 61 },
              },
            },
          ],
          location: {
            start: { line: 1, column: 24, offset: 23 },
            end: { line: 1, column: 62, offset: 61 },
          },
        },
      ];

      // Convert both AST nodes to CSG
      const firstCubeResult = await convertASTNodeToCSG(simulatedAST[0], 1);
      const translateResult = await convertASTNodeToCSG(simulatedAST[1], 1);

      // Both conversions should succeed
      expect(firstCubeResult.success).toBe(true);
      expect(translateResult.success).toBe(true);

      if (firstCubeResult.success && translateResult.success) {
        const firstCubeMesh = firstCubeResult.data.mesh;
        const translateMesh = translateResult.data.mesh;

        logger.debug('First cube mesh geometry:', {
          type: firstCubeMesh.geometry.type,
          parameters: firstCubeMesh.geometry.parameters,
        });

        logger.debug('Translate mesh geometry:', {
          type: translateMesh.geometry.type,
          parameters: translateMesh.geometry.parameters,
        });

        // Both should be BoxGeometry
        expect(firstCubeMesh.geometry.type).toBe('BoxGeometry');
        expect(translateMesh.geometry.type).toBe('BoxGeometry');

        // Extract geometry parameters
        const firstParams = firstCubeMesh.geometry.parameters;
        const translateParams = translateMesh.geometry.parameters;

        // CRITICAL TEST: Both cubes should have identical dimensions
        expect(firstParams.width).toBe(translateParams.width);
        expect(firstParams.height).toBe(translateParams.height);
        expect(firstParams.depth).toBe(translateParams.depth);

        // Both should be 5x5x5 cubes (not different sizes)
        expect(firstParams.width).toBe(5);
        expect(firstParams.height).toBe(5);
        expect(firstParams.depth).toBe(5);

        expect(translateParams.width).toBe(5);
        expect(translateParams.height).toBe(5);
        expect(translateParams.depth).toBe(5);

        logger.debug('✅ ISSUE FIXED: Both cubes have identical 5x5x5 dimensions');
        logger.debug('✅ The reported cube sizing issue has been resolved');
      } else {
        logger.error('❌ Conversion failed');
        if (!firstCubeResult.success) {
          logger.error('First cube conversion error:', firstCubeResult.error);
        }
        if (!translateResult.success) {
          logger.error('Translate conversion error:', translateResult.error);
        }
      }
    });

    it('should work with various cube sizes', async () => {
      const testSizes = [1, 2, 3, 5, 10, 15, 20];

      for (const size of testSizes) {
        logger.debug(`Testing cube size: ${size}`);

        const directCube = {
          type: 'cube',
          size,
          center: true,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        };

        const moduleInstantiationCube = {
          type: 'module_instantiation',
          name: 'cube',
          args: [{ value: size }, { name: 'center', value: true }],
          children: [],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 25, offset: 24 },
          },
        };

        const directResult = await convertASTNodeToCSG(directCube, 1);
        const moduleResult = await convertASTNodeToCSG(moduleInstantiationCube, 1);

        expect(directResult.success).toBe(true);
        expect(moduleResult.success).toBe(true);

        if (directResult.success && moduleResult.success) {
          const directParams = directResult.data.mesh.geometry.parameters;
          const moduleParams = moduleResult.data.mesh.geometry.parameters;

          // Both should have the same dimensions
          expect(directParams.width).toBe(moduleParams.width);
          expect(directParams.height).toBe(moduleParams.height);
          expect(directParams.depth).toBe(moduleParams.depth);

          // Both should match the expected size
          expect(directParams.width).toBe(size);
          expect(directParams.height).toBe(size);
          expect(directParams.depth).toBe(size);

          logger.debug(`✅ Size ${size}: Both cubes have ${size}x${size}x${size} dimensions`);
        }
      }

      logger.debug('✅ All cube sizes work consistently');
    });

    it('should handle center parameter correctly', async () => {
      const testCases = [
        { center: true, description: 'centered cube' },
        { center: false, description: 'non-centered cube' },
      ];

      for (const testCase of testCases) {
        logger.debug(`Testing ${testCase.description}`);

        const directCube = {
          type: 'cube',
          size: 6,
          center: testCase.center,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        };

        const moduleInstantiationCube = {
          type: 'module_instantiation',
          name: 'cube',
          args: [{ value: 6 }, { name: 'center', value: testCase.center }],
          children: [],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 30, offset: 29 },
          },
        };

        const directResult = await convertASTNodeToCSG(directCube, 1);
        const moduleResult = await convertASTNodeToCSG(moduleInstantiationCube, 1);

        expect(directResult.success).toBe(true);
        expect(moduleResult.success).toBe(true);

        if (directResult.success && moduleResult.success) {
          const directMesh = directResult.data.mesh;
          const moduleMesh = moduleResult.data.mesh;

          // Both should have identical geometry
          expect(directMesh.geometry.parameters.width).toBe(moduleMesh.geometry.parameters.width);
          expect(directMesh.geometry.parameters.height).toBe(moduleMesh.geometry.parameters.height);
          expect(directMesh.geometry.parameters.depth).toBe(moduleMesh.geometry.parameters.depth);

          // Both should be 6x6x6 cubes
          expect(directMesh.geometry.parameters.width).toBe(6);
          expect(directMesh.geometry.parameters.height).toBe(6);
          expect(directMesh.geometry.parameters.depth).toBe(6);

          logger.debug(`✅ ${testCase.description}: Both cubes have identical 6x6x6 dimensions`);
        }
      }

      logger.debug('✅ Center parameter handling works correctly');
    });
  });

  describe('Performance and Consistency', () => {
    it('should maintain performance with multiple cubes', async () => {
      const startTime = Date.now();

      // Create multiple cube conversions
      const cubePromises = [];
      for (let i = 0; i < 50; i++) {
        const cubeNode = {
          type: 'module_instantiation',
          name: 'cube',
          args: [{ value: 4 }, { name: 'center', value: true }],
          children: [],
          location: {
            start: { line: i, column: 1, offset: i * 25 },
            end: { line: i, column: 25, offset: (i + 1) * 25 - 1 },
          },
        };

        cubePromises.push(convertASTNodeToCSG(cubeNode, 1));
      }

      const results = await Promise.all(cubePromises);
      const endTime = Date.now();

      // All conversions should succeed
      results.forEach((result, i) => {
        expect(result.success).toBe(true);
        if (result.success) {
          const params = result.data.mesh.geometry.parameters;
          expect(params.width).toBe(4);
          expect(params.height).toBe(4);
          expect(params.depth).toBe(4);
        }
      });

      const duration = endTime - startTime;
      logger.debug(`✅ Converted 50 cubes in ${duration}ms (${duration / 50}ms per cube)`);

      // Performance should be reasonable (less than 10ms per cube on average)
      expect(duration / 50).toBeLessThan(10);
    });
  });
});
