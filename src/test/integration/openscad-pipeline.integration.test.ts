/**
 * @file OpenSCAD Pipeline Integration Tests
 *
 * Comprehensive integration tests for the complete OpenSCAD→Babylon.js pipeline.
 * Tests the end-to-end workflow from OpenSCAD code to 3D rendering, selection, and export.
 *
 * @example
 * Tests cover the complete pipeline:
 * OpenSCAD Code → Parser → AST → CSG Operations → BabylonJS Meshes → Rendering → Selection → Export
 */

import { NullEngine, Scene } from '@babylonjs/core';
// Mock logger to avoid console output during tests
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASTBridgeConverter } from '../../features/babylon-renderer/services/ast-bridge-converter';
import { ExportService } from '../../features/babylon-renderer/services/export';
import { SelectionService } from '../../features/babylon-renderer/services/selection';
import { OpenscadParser } from '../../features/openscad-parser';

vi.mock('../../shared/services/logger.service', () => ({
  createLogger: vi.fn(() => ({
    init: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { createLogger } from '../../shared/services/logger.service';

const logger = createLogger('PipelineIntegration');

describe('OpenSCAD Pipeline Integration Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;
  let astConverter: ASTBridgeConverter;
  let selectionService: SelectionService;
  let exportService: ExportService;

  beforeEach(async () => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create and initialize OpenSCAD parser
    parser = new OpenscadParser();
    await parser.init();

    // Create AST converter
    astConverter = new ASTBridgeConverter(scene);

    // Create services
    selectionService = new SelectionService(scene);
    await selectionService.initialize();

    exportService = new ExportService(scene);

    logger.debug('[SETUP] Integration test environment initialized');
  });

  afterEach(() => {
    // Clean up resources
    if (selectionService) {
      selectionService.dispose();
    }
    if (exportService) {
      exportService.dispose();
    }
    if (parser) {
      parser.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Basic Primitives Pipeline', () => {
    it('should process cube from OpenSCAD to BabylonJS mesh', async () => {
      const openscadCode = 'cube([2, 3, 4]);';

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = parser.parseASTWithResult(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const astNodes = parseResult.data;
      expect(astNodes).toBeDefined();
      expect(astNodes.length).toBeGreaterThan(0);

      // Step 2: Convert AST to BabylonJS nodes
      const conversionResult = await astConverter.convertAST(astNodes);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;
      expect(babylonNodes).toBeDefined();
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Step 3: Verify BabylonJS node properties
      const cubeNode = babylonNodes[0];
      expect(cubeNode).toBeDefined();
      expect(cubeNode.type).toBeDefined();

      logger.debug('[CUBE_PIPELINE] Successfully processed cube through complete pipeline');
    });

    it('should process sphere from OpenSCAD to BabylonJS mesh', async () => {
      const openscadCode = 'sphere(r=5, $fn=32);';

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify sphere operation
      const sphereOperation = csgOperations[0];
      expect(sphereOperation.type).toBe('primitive');
      expect(sphereOperation.primitive).toBe('sphere');
      expect(sphereOperation.parameters.r).toBe(5);
      expect(sphereOperation.parameters.$fn).toBe(32);

      logger.debug('[SPHERE_PIPELINE] Successfully processed sphere through complete pipeline');
    });

    it('should process cylinder from OpenSCAD to BabylonJS mesh', async () => {
      const openscadCode = 'cylinder(h=10, r1=3, r2=5, center=true);';

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify cylinder operation
      const cylinderOperation = csgOperations[0];
      expect(cylinderOperation.type).toBe('primitive');
      expect(cylinderOperation.primitive).toBe('cylinder');
      expect(cylinderOperation.parameters).toEqual({
        h: 10,
        r1: 3,
        r2: 5,
        center: true,
      });

      logger.debug('[CYLINDER_PIPELINE] Successfully processed cylinder through complete pipeline');
    });
  });

  describe('Boolean Operations Pipeline', () => {
    it('should process union operation through complete pipeline', async () => {
      const openscadCode = `
        union() {
          cube([2, 2, 2]);
          translate([1, 1, 1]) sphere(r=1);
        }
      `;

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify union operation structure
      expect(csgOperations.length).toBeGreaterThan(0);
      const unionOperation = csgOperations.find(
        (op) => op.type === 'boolean' && op.operation === 'union'
      );
      expect(unionOperation).toBeDefined();

      logger.debug(
        '[UNION_PIPELINE] Successfully processed union operation through complete pipeline'
      );
    });

    it('should process difference operation through complete pipeline', async () => {
      const openscadCode = `
        difference() {
          cube([4, 4, 4]);
          translate([2, 2, 2]) sphere(r=1.5);
        }
      `;

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify difference operation structure
      const differenceOperation = csgOperations.find(
        (op) => op.type === 'boolean' && op.operation === 'difference'
      );
      expect(differenceOperation).toBeDefined();

      logger.debug(
        '[DIFFERENCE_PIPELINE] Successfully processed difference operation through complete pipeline'
      );
    });

    it('should process intersection operation through complete pipeline', async () => {
      const openscadCode = `
        intersection() {
          cube([3, 3, 3]);
          sphere(r=2);
        }
      `;

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify intersection operation structure
      const intersectionOperation = csgOperations.find(
        (op) => op.type === 'boolean' && op.operation === 'intersection'
      );
      expect(intersectionOperation).toBeDefined();

      logger.debug(
        '[INTERSECTION_PIPELINE] Successfully processed intersection operation through complete pipeline'
      );
    });
  });

  describe('Transformation Operations Pipeline', () => {
    it('should process translate transformation through complete pipeline', async () => {
      const openscadCode = 'translate([5, 10, 15]) cube([2, 2, 2]);';

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify transformation operation
      const transformOperation = csgOperations.find((op) => op.type === 'transform');
      expect(transformOperation).toBeDefined();
      if (transformOperation && transformOperation.type === 'transform') {
        expect(transformOperation.transform).toBe('translate');
        expect(transformOperation.parameters).toEqual([5, 10, 15]);
      }

      logger.debug(
        '[TRANSLATE_PIPELINE] Successfully processed translate transformation through complete pipeline'
      );
    });

    it('should process rotate transformation through complete pipeline', async () => {
      const openscadCode = 'rotate([45, 0, 90]) cube([2, 2, 2]);';

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify rotation operation
      const rotateOperation = csgOperations.find(
        (op) => op.type === 'transform' && op.transform === 'rotate'
      );
      expect(rotateOperation).toBeDefined();

      logger.debug(
        '[ROTATE_PIPELINE] Successfully processed rotate transformation through complete pipeline'
      );
    });

    it('should process scale transformation through complete pipeline', async () => {
      const openscadCode = 'scale([2, 0.5, 3]) sphere(r=1);';

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;

      // Step 3: Verify scale operation
      const scaleOperation = csgOperations.find(
        (op) => op.type === 'transform' && op.transform === 'scale'
      );
      expect(scaleOperation).toBeDefined();

      logger.debug(
        '[SCALE_PIPELINE] Successfully processed scale transformation through complete pipeline'
      );
    });
  });

  describe('Complex Nested Operations Pipeline', () => {
    it('should process complex nested operations through complete pipeline', async () => {
      const openscadCode = `
        difference() {
          union() {
            cube([10, 10, 10]);
            translate([5, 5, 5]) sphere(r=3);
          }
          translate([2, 2, 2]) {
            cube([6, 6, 6]);
            translate([3, 3, 3]) cylinder(h=8, r=2);
          }
        }
      `;

      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;
      expect(ast.type).toBe('Program');

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      if (!csgResult.success) return;
      const csgOperations = csgResult.data;
      expect(csgOperations.length).toBeGreaterThan(0);

      // Step 3: Verify complex operation structure
      const hasBoolean = csgOperations.some((op) => op.type === 'boolean');
      const hasPrimitive = csgOperations.some((op) => op.type === 'primitive');
      const hasTransform = csgOperations.some((op) => op.type === 'transform');

      expect(hasBoolean).toBe(true);
      expect(hasPrimitive).toBe(true);
      expect(hasTransform).toBe(true);

      logger.debug(
        '[COMPLEX_PIPELINE] Successfully processed complex nested operations through complete pipeline'
      );
    });
  });

  describe('Error Handling Pipeline', () => {
    it('should handle invalid OpenSCAD syntax gracefully', async () => {
      const invalidCode = 'cube([2, 3, 4]; // Missing closing parenthesis';

      // Step 1: Parse invalid OpenSCAD code
      const parseResult = await parser.parse(invalidCode);

      // Should either fail gracefully or recover with partial AST
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        expect(parseResult.error.code).toBeDefined();
        logger.debug('[ERROR_PIPELINE] Parser correctly handled invalid syntax');
      } else {
        // If parser recovered, AST should still be valid
        expect(parseResult.data).toBeDefined();
        logger.debug('[ERROR_PIPELINE] Parser recovered from invalid syntax');
      }
    });

    it('should handle unsupported OpenSCAD features gracefully', async () => {
      const unsupportedCode = 'import("external_file.stl");';

      // Step 1: Parse unsupported OpenSCAD code
      const parseResult = await parser.parse(unsupportedCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST (may fail or skip unsupported features)
      const csgResult = await astConverter.convertAST(ast);

      // Should handle unsupported features gracefully
      if (!csgResult.success) {
        expect(csgResult.error).toBeDefined();
        logger.debug('[ERROR_PIPELINE] AST converter correctly handled unsupported feature');
      } else {
        // If converter handled it, operations should be valid
        expect(csgResult.data).toBeDefined();
        logger.debug('[ERROR_PIPELINE] AST converter handled unsupported feature');
      }
    });
  });

  describe('Performance Pipeline', () => {
    it('should process moderately complex model within performance targets', async () => {
      const complexCode = `
        difference() {
          cube([20, 20, 20]);
          for (i = [0:4]) {
            for (j = [0:4]) {
              translate([i*4, j*4, 0]) cylinder(h=25, r=1.5);
            }
          }
        }
      `;

      const startTime = performance.now();

      // Step 1: Parse OpenSCAD code
      const parseResult = await parser.parse(complexCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      // Step 2: Convert AST to CSG operations
      const csgResult = await astConverter.convertAST(ast);
      expect(csgResult.success).toBe(true);

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(1000); // 1 second

      logger.debug(
        `[PERFORMANCE_PIPELINE] Complex model processed in ${processingTime.toFixed(2)}ms`
      );
    });
  });
});
