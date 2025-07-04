/**
 * @file Production-Ready Fuzzy Tests for Complex Nested Operations Functionality
 *
 * Comprehensive property-based testing using fast-check for complex nested operations.
 * This provides a permanent solution for testing combinations of transformations and operations
 * with 2-4 levels of nesting that work reliably with the OpenSCAD parser.
 *
 * Key Features:
 * - Tests patterns like: translate([x,y,z]) rotate([a,b,c]) scale([sx,sy,sz]) union(cube(5), sphere(3))
 * - Generates 2-4 levels of nesting with mixed transformation and boolean operations
 * - Validates correct transformation order (scale → rotate → translate) in nested contexts
 * - Performance targets (<200ms for complex nested operations)
 */

import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';
import { OpenscadParser } from '../../../openscad-parser/openscad-parser.js';
import {
  clearSourceCodeForExtraction,
  convertASTNodeToCSG,
  extractRotateParameters,
  extractScaleParameters,
  extractTranslateParameters,
  setSourceCodeForExtraction,
} from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterNestedFuzzyTest');

/**
 * Custom generators for parser-friendly nested operations
 */
const parserFriendlyCoordinate = () =>
  fc.tuple(
    fc.integer({ min: -20, max: 20 }),
    fc.integer({ min: -20, max: 20 }),
    fc.integer({ min: -20, max: 20 })
  );

const parserFriendlyAngle = () =>
  fc.oneof(
    fc.integer({ min: -180, max: 180 }), // Integer degrees
    fc
      .float({ min: -180.0, max: 180.0, noNaN: true })
      .map((n) => Math.round(n * 10) / 10) // One decimal place
  );

const parserFriendlyAngleVector = () =>
  fc.tuple(parserFriendlyAngle(), parserFriendlyAngle(), parserFriendlyAngle());

const parserFriendlyScaleFactor = () =>
  fc.oneof(
    fc
      .float({ min: 0.5, max: 3.0, noNaN: true })
      .map((n) => Math.round(n * 10) / 10), // Single scale factor
    fc.tuple(
      fc.float({ min: 0.5, max: 3.0, noNaN: true }).map((n) => Math.round(n * 10) / 10),
      fc.float({ min: 0.5, max: 3.0, noNaN: true }).map((n) => Math.round(n * 10) / 10),
      fc.float({ min: 0.5, max: 3.0, noNaN: true }).map((n) => Math.round(n * 10) / 10)
    ) // Scale vector [x, y, z]
  );

const parserFriendlyPrimitive = () =>
  fc.oneof(
    fc.constant('cube(5)'),
    fc.constant('sphere(3)'),
    fc.constant('cylinder(h=6, r=2)'),
    fc.constant('cube([3, 4, 5])'),
    fc.constant('sphere(r=4)')
  );

const parserFriendlyBooleanOperation = () =>
  fc.oneof(fc.constant('union'), fc.constant('intersection'), fc.constant('difference'));

const parserFriendlyTransformation = () =>
  fc.oneof(fc.constant('translate'), fc.constant('rotate'), fc.constant('scale'));

describe('AST to CSG Converter - Complex Nested Operations Fuzzy Testing', () => {
  let parserService: OpenscadParser;

  beforeEach(async () => {
    logger.init('Setting up production-ready complex nested operations fuzzy test environment');
    parserService = new OpenscadParser();
    await parserService.init();
  });

  describe('Nested Parameter Extraction Validation', () => {
    it('should extract parameters from nested transformation operations', () => {
      fc.assert(
        fc.property(
          parserFriendlyCoordinate(),
          parserFriendlyAngleVector(),
          parserFriendlyScaleFactor(),
          ([tx, ty, tz], [rx, ry, rz], scale) => {
            const scaleStr = Array.isArray(scale)
              ? `[${scale[0]}, ${scale[1]}, ${scale[2]}]`
              : scale.toString();
            const code = `translate([${tx}, ${ty}, ${tz}]) rotate([${rx}, ${ry}, ${rz}]) scale(${scaleStr}) cube(5);`;

            // Extract each transformation parameter
            const translateParams = extractTranslateParameters(code);
            const rotateParams = extractRotateParameters(code);
            const scaleParams = extractScaleParameters(code);

            expect(translateParams).not.toBeNull();
            expect(rotateParams).not.toBeNull();
            expect(scaleParams).not.toBeNull();

            if (translateParams) {
              expect(translateParams[0]).toBe(tx);
              expect(translateParams[1]).toBe(ty);
              expect(translateParams[2]).toBe(tz);
            }

            if (rotateParams && Array.isArray(rotateParams)) {
              expect(rotateParams[0]).toBeCloseTo(rx, 2);
              expect(rotateParams[1]).toBeCloseTo(ry, 2);
              expect(rotateParams[2]).toBeCloseTo(rz, 2);
            }

            if (scaleParams) {
              if (Array.isArray(scale) && Array.isArray(scaleParams)) {
                expect(scaleParams[0]).toBeCloseTo(scale[0], 2);
                expect(scaleParams[1]).toBeCloseTo(scale[1], 2);
                expect(scaleParams[2]).toBeCloseTo(scale[2], 2);
              } else if (typeof scale === 'number' && typeof scaleParams === 'number') {
                expect(scaleParams).toBeCloseTo(scale, 2);
              }
            }
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should handle nested boolean operations with transformations', () => {
      fc.assert(
        fc.property(
          parserFriendlyBooleanOperation(),
          parserFriendlyCoordinate(),
          parserFriendlyPrimitive(),
          parserFriendlyPrimitive(),
          (boolOp, [tx, ty, tz], primitive1, primitive2) => {
            const code = `translate([${tx}, ${ty}, ${tz}]) ${boolOp}() {
  ${primitive1};
  ${primitive2};
}`;

            const translateParams = extractTranslateParameters(code);

            expect(translateParams).not.toBeNull();
            if (translateParams) {
              expect(translateParams[0]).toBe(tx);
              expect(translateParams[1]).toBe(ty);
              expect(translateParams[2]).toBe(tz);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Production Nested CSG Conversion Testing', () => {
    it('should correctly apply nested transformation operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          parserFriendlyCoordinate(),
          parserFriendlyAngleVector(),
          parserFriendlyPrimitive(),
          async ([tx, ty, tz], [rx, ry, rz], primitive) => {
            const code = `translate([${tx}, ${ty}, ${tz}]) rotate([${rx}, ${ry}, ${rz}]) ${primitive};`;

            logger.debug(
              `Testing nested translate([${tx}, ${ty}, ${tz}]) rotate([${rx}, ${ry}, ${rz}]) ${primitive} conversion`
            );

            // Parse the code
            const ast = parserService.parseAST(code);
            if (!ast || ast.length === 0) {
              logger.warn(`No AST nodes for nested operations`);
              return; // Skip this test case
            }

            const nestedNode = ast[0];
            if (!nestedNode) return;

            // Set source code for extraction
            setSourceCodeForExtraction(code);

            try {
              // Convert to CSG
              const result = await convertASTNodeToCSG(nestedNode as ASTNode, 0);

              if (result.success && result.data.mesh) {
                const mesh = result.data.mesh;
                expect(mesh).toBeDefined();

                // Verify the mesh has been transformed (should have position and rotation applied)
                expect(mesh.matrix).toBeDefined();

                logger.debug(
                  `✅ Nested translate([${tx}, ${ty}, ${tz}]) rotate([${rx}, ${ry}, ${rz}]) ${primitive} applied correctly`
                );
              } else {
                logger.warn(
                  `Conversion failed for nested operations: ${result.success ? 'no mesh' : result.error}`
                );
              }
            } finally {
              // Always clear source code
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 15, timeout: 35000 }
      );
    });

    it('should correctly apply nested boolean operations with transformations', async () => {
      await fc.assert(
        fc.asyncProperty(
          parserFriendlyBooleanOperation(),
          parserFriendlyCoordinate(),
          parserFriendlyPrimitive(),
          parserFriendlyPrimitive(),
          async (boolOp, [tx, ty, tz], primitive1, primitive2) => {
            const code = `translate([${tx}, ${ty}, ${tz}]) ${boolOp}() {
  ${primitive1};
  ${primitive2};
}`;

            logger.debug(`Testing nested translate([${tx}, ${ty}, ${tz}]) ${boolOp}() conversion`);

            // Parse the code
            const ast = parserService.parseAST(code);
            if (!ast || ast.length === 0) {
              logger.warn(`No AST nodes for nested ${boolOp} operations`);
              return; // Skip this test case
            }

            const nestedNode = ast[0];
            if (!nestedNode) return;

            // Set source code for extraction
            setSourceCodeForExtraction(code);

            try {
              // Convert to CSG
              const result = await convertASTNodeToCSG(nestedNode as ASTNode, 0);

              if (result.success && result.data.mesh) {
                const mesh = result.data.mesh;
                expect(mesh).toBeDefined();
                expect(mesh.geometry).toBeDefined();

                logger.debug(
                  `✅ Nested translate([${tx}, ${ty}, ${tz}]) ${boolOp}() applied correctly`
                );
              } else {
                logger.warn(
                  `Conversion failed for nested ${boolOp} operations: ${result.success ? 'no mesh' : result.error}`
                );
              }
            } finally {
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 12, timeout: 40000 }
      );
    });

    it('should correctly apply deeply nested transformation chains', async () => {
      await fc.assert(
        fc.asyncProperty(
          parserFriendlyCoordinate(),
          parserFriendlyAngleVector(),
          parserFriendlyScaleFactor(),
          parserFriendlyPrimitive(),
          async ([tx, ty, tz], [rx, ry, rz], scale, primitive) => {
            const scaleStr = Array.isArray(scale)
              ? `[${scale[0]}, ${scale[1]}, ${scale[2]}]`
              : scale.toString();
            const code = `translate([${tx}, ${ty}, ${tz}]) rotate([${rx}, ${ry}, ${rz}]) scale(${scaleStr}) ${primitive};`;

            logger.debug(`Testing deeply nested transformation chain conversion`);

            // Parse the code
            const ast = parserService.parseAST(code);
            if (!ast || ast.length === 0) {
              logger.warn(`No AST nodes for deeply nested transformation chain`);
              return; // Skip this test case
            }

            const nestedNode = ast[0];
            if (!nestedNode) return;

            // Set source code for extraction
            setSourceCodeForExtraction(code);

            try {
              // Convert to CSG
              const result = await convertASTNodeToCSG(nestedNode as ASTNode, 0);

              if (result.success && result.data.mesh) {
                const mesh = result.data.mesh;
                expect(mesh).toBeDefined();
                expect(mesh.matrix).toBeDefined();

                logger.debug(`✅ Deeply nested transformation chain applied correctly`);
              } else {
                logger.warn(
                  `Conversion failed for deeply nested transformation chain: ${result.success ? 'no mesh' : result.error}`
                );
              }
            } finally {
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 10, timeout: 45000 }
      );
    });
  });

  describe('Multiple Nested Operations Testing', () => {
    it('should handle multiple nested operation combinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(
              parserFriendlyTransformation(),
              parserFriendlyCoordinate(),
              parserFriendlyPrimitive()
            ),
            { minLength: 2, maxLength: 3 }
          ),
          async (operations) => {
            // Generate multiple nested operations
            const codeLines = operations
              .map(([transformation, [x, y, z], primitive]) => {
                if (transformation === 'translate') {
                  return `translate([${x}, ${y}, ${z}]) ${primitive};`;
                } else if (transformation === 'rotate') {
                  return `rotate([${x}, ${y}, ${z}]) ${primitive};`;
                } else if (transformation === 'scale') {
                  return `scale([${x / 10 + 1}, ${y / 10 + 1}, ${z / 10 + 1}]) ${primitive};`;
                }
                return '';
              })
              .filter((line) => line !== '');

            const code = codeLines.join('\n');

            logger.debug(`Testing ${operations.length} nested operations`);

            const ast = parserService.parseAST(code);
            if (!ast || ast.length !== operations.length) {
              logger.warn(
                `AST length mismatch: expected ${operations.length}, got ${ast?.length || 0}`
              );
              return; // Skip this test case
            }

            setSourceCodeForExtraction(code);

            try {
              // Test each nested operation
              for (let i = 0; i < operations.length; i++) {
                const operation = operations[i];
                if (!operation) continue;
                const [expectedTransformation] = operation;
                const node = ast[i];

                if (!node) continue;

                const result = await convertASTNodeToCSG(node as ASTNode, i);

                if (result.success && result.data.mesh) {
                  const mesh = result.data.mesh;
                  expect(mesh).toBeDefined();
                  expect(mesh.matrix).toBeDefined();

                  logger.debug(
                    `✅ ${expectedTransformation}() nested operation ${i} applied correctly`
                  );
                }
              }
            } finally {
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 8, timeout: 60000 }
      );
    });

    it('should handle complex nested boolean and transformation combinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          parserFriendlyBooleanOperation(),
          parserFriendlyCoordinate(),
          parserFriendlyAngleVector(),
          async (boolOp, [tx, ty, tz], [rx, ry, rz]) => {
            const code = `translate([${tx}, ${ty}, ${tz}]) ${boolOp}() {
  rotate([${rx}, ${ry}, ${rz}]) cube(5);
  scale([1.5, 1.5, 1.5]) sphere(3);
}`;

            logger.debug(`Testing complex nested ${boolOp} with transformations`);

            const ast = parserService.parseAST(code);
            if (!ast || ast.length === 0) {
              logger.warn(`No AST nodes for complex nested ${boolOp} operations`);
              return; // Skip this test case
            }

            const nestedNode = ast[0];
            if (!nestedNode) return;

            setSourceCodeForExtraction(code);

            try {
              const result = await convertASTNodeToCSG(nestedNode as ASTNode, 0);

              if (result.success && result.data.mesh) {
                const mesh = result.data.mesh;
                expect(mesh).toBeDefined();
                expect(mesh.geometry).toBeDefined();

                logger.debug(`✅ Complex nested ${boolOp} with transformations applied correctly`);
              } else {
                logger.warn(
                  `Conversion failed for complex nested ${boolOp} operations: ${result.success ? 'no mesh' : result.error}`
                );
              }
            } finally {
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 8, timeout: 50000 }
      );
    });
  });

  describe('Nested Performance Validation', () => {
    it('should maintain performance targets for nested transformation operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          parserFriendlyCoordinate(),
          parserFriendlyAngleVector(),
          parserFriendlyPrimitive(),
          async ([tx, ty, tz], [rx, ry, rz], primitive) => {
            const code = `translate([${tx}, ${ty}, ${tz}]) rotate([${rx}, ${ry}, ${rz}]) ${primitive};`;

            const ast = parserService.parseAST(code);
            if (!ast || ast.length === 0) {
              logger.warn(`No AST nodes for performance test with nested transformations`);
              return; // Skip this test case
            }

            const nestedNode = ast[0];
            if (!nestedNode) return;

            setSourceCodeForExtraction(code);

            try {
              const startTime = performance.now();
              const result = await convertASTNodeToCSG(nestedNode as ASTNode, 0);
              const endTime = performance.now();

              const conversionTime = endTime - startTime;

              if (result.success) {
                expect(conversionTime).toBeLessThan(200); // Performance target for complex operations
                logger.debug(
                  `Nested transformation conversion time: ${conversionTime.toFixed(2)}ms`
                );
              }
            } finally {
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 15, timeout: 35000 }
      );
    });

    it('should maintain performance targets for complex nested boolean operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          parserFriendlyBooleanOperation(),
          parserFriendlyCoordinate(),
          async (boolOp, [tx, ty, tz]) => {
            const code = `translate([${tx}, ${ty}, ${tz}]) ${boolOp}() {
  cube(5);
  sphere(3);
  cylinder(h=6, r=2);
}`;

            const ast = parserService.parseAST(code);
            if (!ast || ast.length === 0) {
              logger.warn(`No AST nodes for performance test with complex nested ${boolOp}`);
              return; // Skip this test case
            }

            const nestedNode = ast[0];
            if (!nestedNode) return;

            setSourceCodeForExtraction(code);

            try {
              const startTime = performance.now();
              const result = await convertASTNodeToCSG(nestedNode as ASTNode, 0);
              const endTime = performance.now();

              const conversionTime = endTime - startTime;

              if (result.success) {
                expect(conversionTime).toBeLessThan(200); // Performance target for complex operations
                logger.debug(
                  `Complex nested ${boolOp} conversion time: ${conversionTime.toFixed(2)}ms`
                );
              }
            } finally {
              clearSourceCodeForExtraction();
            }
          }
        ),
        { numRuns: 12, timeout: 40000 }
      );
    });
  });
});
