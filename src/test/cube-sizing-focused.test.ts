/**
 * @file Focused Cube Sizing Tests
 *
 * This test file focuses on the specific cube sizing issue that was reported:
 * "cube(5, center=true);translate([10,10,0])cube(5, center=true);" rendering two cubes of different sizes.
 *
 * These tests verify that our fix works correctly for the specific scenarios that were problematic.
 */

import fc from 'fast-check';
import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSourceCodeForExtraction,
  convertASTNodeToCSG,
  setSourceCodeForExtraction,
} from '../features/3d-renderer/services/ast-to-csg-converter/ast-to-csg-converter';
import type { ASTNode } from '../features/openscad-parser/core/ast-types';
import { OpenscadParser } from '../features/openscad-parser/openscad-parser';
import { createLogger } from '../shared/services/logger.service';

const logger = createLogger('CubeSizingFocusedTest');

describe('Focused Cube Sizing Tests', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up focused cube sizing tests');
    parserService = new OpenscadParser();
    await parserService.init();
  });

  describe('Original Issue Reproduction', () => {
    it('should render identical cubes for the original problematic code', async () => {
      const code = 'cube(5, center=true);translate([10,10,0])cube(5, center=true);';

      setSourceCodeForExtraction(code);
      const ast = parserService.parseAST(code);
      expect(ast).toBeDefined();
      expect(ast.length).toBe(2);

      const firstNode = ast[0] as ASTNode;
      const secondNode = ast[1] as ASTNode;

      // Convert both nodes
      const result1 = await convertASTNodeToCSG(firstNode, 0);
      const result2 = await convertASTNodeToCSG(secondNode, 1);
      clearSourceCodeForExtraction();

      // Both conversions should succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      if (!result1.success || !result2.success) return;

      const mesh1 = result1.data.mesh as THREE.Mesh;
      const mesh2 = result2.data.mesh as THREE.Mesh;

      // Both should be BoxGeometry
      expect(mesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(mesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);

      const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;
      const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;

      // Geometry dimensions should be identical (this was the bug)
      expect(params1.width).toBe(5);
      expect(params1.height).toBe(5);
      expect(params1.depth).toBe(5);
      expect(params2.width).toBe(5);
      expect(params2.height).toBe(5);
      expect(params2.depth).toBe(5);

      // Translation should only affect position, not geometry
      expect(mesh2.position.x).toBe(10);
      expect(mesh2.position.y).toBe(10);
      expect(mesh2.position.z).toBe(0);

      logger.debug('✅ Original issue fixed: Both cubes have identical size 5x5x5');
    });

    it('should handle simple cube size variations correctly', async () => {
      const testCases = [
        { size: 1, center: false },
        { size: 2, center: true },
        { size: 10, center: false },
        { size: 0.5, center: true },
      ];

      for (const { size, center } of testCases) {
        const code1 = `cube(${size}, center=${center});`;
        const code2 = `translate([5,5,5])cube(${size}, center=${center});`;

        // Parse first cube (no translation)
        setSourceCodeForExtraction(code1);
        const ast1 = parserService.parseAST(code1);
        expect(ast1).toBeDefined();
        expect(ast1.length).toBeGreaterThan(0);

        const result1 = await convertASTNodeToCSG(ast1[0] as ASTNode, 0);
        clearSourceCodeForExtraction();

        // Parse second cube (with translation)
        setSourceCodeForExtraction(code2);
        const ast2 = parserService.parseAST(code2);
        expect(ast2).toBeDefined();
        expect(ast2.length).toBeGreaterThan(0);

        const result2 = await convertASTNodeToCSG(ast2[0] as ASTNode, 1);
        clearSourceCodeForExtraction();

        // Both conversions should succeed
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        if (!result1.success || !result2.success) continue;

        const mesh1 = result1.data.mesh as THREE.Mesh;
        const mesh2 = result2.data.mesh as THREE.Mesh;

        // Both should be BoxGeometry
        expect(mesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(mesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);

        const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;
        const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;

        // Geometry dimensions should be identical
        expect(params1.width).toBe(size);
        expect(params1.height).toBe(size);
        expect(params1.depth).toBe(size);
        expect(params2.width).toBe(size);
        expect(params2.height).toBe(size);
        expect(params2.depth).toBe(size);

        logger.debug(`✅ Cube(${size}, center=${center}) maintains size consistency`);
      }
    });

    it('should handle different translation vectors correctly', async () => {
      const translationVectors = [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [10, 20, 30],
        [-5, -10, -15],
      ];

      for (const [tx, ty, tz] of translationVectors) {
        const code1 = `cube(3, center=true);`;
        const code2 = `translate([${tx},${ty},${tz}])cube(3, center=true);`;

        // Parse first cube (no translation)
        setSourceCodeForExtraction(code1);
        const ast1 = parserService.parseAST(code1);
        expect(ast1).toBeDefined();
        expect(ast1.length).toBeGreaterThan(0);

        const result1 = await convertASTNodeToCSG(ast1[0] as ASTNode, 0);
        clearSourceCodeForExtraction();

        // Parse second cube (with translation)
        setSourceCodeForExtraction(code2);
        const ast2 = parserService.parseAST(code2);
        expect(ast2).toBeDefined();
        expect(ast2.length).toBeGreaterThan(0);

        const result2 = await convertASTNodeToCSG(ast2[0] as ASTNode, 1);
        clearSourceCodeForExtraction();

        // Both conversions should succeed
        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);

        if (!result1.success || !result2.success) continue;

        const mesh1 = result1.data.mesh as THREE.Mesh;
        const mesh2 = result2.data.mesh as THREE.Mesh;

        // Both should be BoxGeometry
        expect(mesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(mesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);

        const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;
        const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;

        // Geometry dimensions should be identical
        expect(params1.width).toBe(3);
        expect(params1.height).toBe(3);
        expect(params1.depth).toBe(3);
        expect(params2.width).toBe(3);
        expect(params2.height).toBe(3);
        expect(params2.depth).toBe(3);

        // Translation should only affect position
        if (ast2[0]?.type === 'translate') {
          expect(mesh2.position.x).toBe(tx);
          expect(mesh2.position.y).toBe(ty);
          expect(mesh2.position.z).toBe(tz);
        }

        logger.debug(`✅ Translation [${tx},${ty},${tz}] maintains cube size consistency`);
      }
    });
  });

  describe('Property-Based Testing (Simple)', () => {
    it('should maintain cube size consistency across random parameters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }), // cube size (integer to avoid parser issues)
          fc.boolean(), // center parameter
          fc.integer({ min: -50, max: 50 }), // tx
          fc.integer({ min: -50, max: 50 }), // ty
          fc.integer({ min: -50, max: 50 }), // tz
          async (size, center, tx, ty, tz) => {
            const code1 = `cube(${size}, center=${center});`;
            const code2 = `translate([${tx},${ty},${tz}])cube(${size}, center=${center});`;

            try {
              // Parse first cube (no translation)
              setSourceCodeForExtraction(code1);
              const ast1 = parserService.parseAST(code1);
              expect(ast1).toBeDefined();
              expect(ast1.length).toBeGreaterThan(0);

              const result1 = await convertASTNodeToCSG(ast1[0] as ASTNode, 0);
              clearSourceCodeForExtraction();

              // Parse second cube (with translation)
              setSourceCodeForExtraction(code2);
              const ast2 = parserService.parseAST(code2);
              expect(ast2).toBeDefined();
              expect(ast2.length).toBeGreaterThan(0);

              const result2 = await convertASTNodeToCSG(ast2[0] as ASTNode, 1);
              clearSourceCodeForExtraction();

              // Both conversions should succeed
              expect(result1.success).toBe(true);
              expect(result2.success).toBe(true);

              if (!result1.success || !result2.success) return;

              const mesh1 = result1.data.mesh as THREE.Mesh;
              const mesh2 = result2.data.mesh as THREE.Mesh;

              // Both should be BoxGeometry
              expect(mesh1.geometry).toBeInstanceOf(THREE.BoxGeometry);
              expect(mesh2.geometry).toBeInstanceOf(THREE.BoxGeometry);

              const params1 = (mesh1.geometry as THREE.BoxGeometry).parameters;
              const params2 = (mesh2.geometry as THREE.BoxGeometry).parameters;

              // Geometry dimensions should be identical
              expect(params1.width).toBe(size);
              expect(params1.height).toBe(size);
              expect(params1.depth).toBe(size);
              expect(params2.width).toBe(size);
              expect(params2.height).toBe(size);
              expect(params2.depth).toBe(size);

              logger.debug(
                `✅ Property test passed: cube(${size}, center=${center}) with translate([${tx},${ty},${tz}])`
              );
            } catch (error) {
              logger.error(
                `❌ Property test failed for cube(${size}, center=${center}) with translate([${tx},${ty},${tz}]):`,
                error
              );
              throw error;
            }
          }
        ),
        { numRuns: 25, timeout: 60000 }
      );
    });
  });
});
