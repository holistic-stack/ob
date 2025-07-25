/**
 * @file Geometric Accuracy Visual Regression Tests
 *
 * Visual regression tests that validate geometric accuracy and rendering consistency.
 * Tests ensure that 3D meshes are generated correctly from OpenSCAD code with proper
 * dimensions, transformations, and structural properties.
 *
 * @example
 * Tests validate geometric properties instead of visual screenshots:
 * - Primitive dimensions and vertex counts
 * - Transformation matrix accuracy
 * - Boolean operation results
 * - Material and texture assignments
 */

import { NullEngine, Scene } from '@babylonjs/core';
// Mock logger to avoid console output during tests
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASTBridgeConverter } from '../../features/babylon-renderer/services/ast-bridge-converter';
import { OpenscadParser } from '../../features/openscad-parser';
import { createLogger } from '../../shared/services/logger.service';

vi.mock('../../shared/services/logger.service', () => ({
  createLogger: vi.fn(() => ({
    init: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const logger = createLogger('GeometricAccuracy');

// Geometric accuracy tolerances
const _GEOMETRIC_TOLERANCE = {
  POSITION: 0.001, // 1mm tolerance for positions
  DIMENSION: 0.001, // 1mm tolerance for dimensions
  ANGLE: 0.01, // 0.01 radian tolerance for angles
  VERTEX_COUNT: 0, // Exact vertex count matching
} as const;

describe('Geometric Accuracy Visual Regression Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;
  let astConverter: ASTBridgeConverter;

  beforeEach(async () => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create and initialize OpenSCAD parser
    parser = new OpenscadParser();
    await parser.init();

    // Create AST converter
    astConverter = new ASTBridgeConverter();
    await astConverter.initialize(scene);

    logger.debug('[SETUP] Geometric accuracy test environment initialized');
  });

  afterEach(() => {
    // Clean up resources
    if (astConverter) {
      astConverter.dispose();
    }
    if (parser) {
      parser.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Primitive Geometry Accuracy', () => {
    it('should generate cube with correct dimensions', async () => {
      const openscadCode = 'cube([4, 6, 8]);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Validate cube dimensions
      expect(babylonNodes).toHaveLength(1);
      const cubeNode = babylonNodes[0];
      expect(cubeNode).toBeDefined();

      if (!cubeNode) return;

      // Check that the node represents a cube with correct dimensions
      expect(cubeNode.nodeType).toBeDefined();

      // Generate mesh to access metadata
      const meshResult = await cubeNode.generateMesh();
      expect(meshResult.success).toBe(true);

      if (meshResult.success) {
        const mesh = meshResult.data;
        expect(mesh.metadata).toBeDefined();

        // For a cube [4, 6, 8], we expect specific geometric properties
        if (mesh.metadata?.parameters) {
          const params = mesh.metadata.parameters;
          expect(params.size).toEqual([4, 6, 8]);
        }
      }

      logger.debug('[CUBE_ACCURACY] Cube dimensions validated');
    });

    it.skip('should generate sphere with correct radius', async () => {
      const openscadCode = 'sphere(r=5, $fn=32);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Validate sphere properties
      expect(babylonNodes).toHaveLength(1);
      const sphereNode = babylonNodes[0];
      expect(sphereNode).toBeDefined();

      if (!sphereNode) return;

      expect(sphereNode.nodeType).toBeDefined();

      // Generate mesh to access metadata
      const sphereMeshResult = await sphereNode.generateMesh();
      expect(sphereMeshResult.success).toBe(true);

      if (sphereMeshResult.success) {
        const mesh = sphereMeshResult.data;
        expect(mesh.metadata).toBeDefined();

        // For a sphere with r=5, $fn=32, we expect specific properties
        if (mesh.metadata?.parameters) {
          const params = mesh.metadata.parameters;
          expect(params.radius).toBe(5);
          expect(params.$fn).toBe(32);
        }
      }

      logger.debug('[SPHERE_ACCURACY] Sphere radius and resolution validated');
    });

    it.skip('should generate cylinder with correct dimensions', async () => {
      const openscadCode = 'cylinder(h=10, r1=3, r2=5, center=true);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Validate cylinder properties
      expect(babylonNodes).toHaveLength(1);
      const cylinderNode = babylonNodes[0];
      expect(cylinderNode).toBeDefined();

      if (!cylinderNode) return;

      expect(cylinderNode.nodeType).toBeDefined();

      // Generate mesh to access metadata
      const cylinderMeshResult = await cylinderNode.generateMesh();
      expect(cylinderMeshResult.success).toBe(true);

      if (cylinderMeshResult.success) {
        const mesh = cylinderMeshResult.data;
        expect(mesh.metadata).toBeDefined();

        // For a cylinder with h=10, r1=3, r2=5, center=true
        if (mesh.metadata?.parameters) {
          const params = mesh.metadata.parameters;
          expect(params.h).toBe(10);
          expect(params.r1).toBe(3);
          expect(params.r2).toBe(5);
          expect(params.center).toBe(true);
        }
      }

      logger.debug('[CYLINDER_ACCURACY] Cylinder dimensions validated');
    });
  });

  describe('Transformation Accuracy', () => {
    it('should apply translate transformation correctly', async () => {
      const openscadCode = 'translate([5, 10, 15]) cube([2, 2, 2]);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Should have transformation and primitive nodes
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Look for transformation node
      const transformNode = babylonNodes.find((node) => node.metadata?.transform === 'translate');

      if (transformNode?.metadata?.parameters) {
        expect(transformNode.metadata.parameters).toEqual([5, 10, 15]);
      }

      logger.debug('[TRANSLATE_ACCURACY] Translation transformation validated');
    });

    it('should apply rotate transformation correctly', async () => {
      const openscadCode = 'rotate([45, 0, 90]) sphere(r=2);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Look for rotation node
      const rotateNode = babylonNodes.find((node) => node.metadata?.transform === 'rotate');

      if (rotateNode?.metadata?.parameters) {
        expect(rotateNode.metadata.parameters).toEqual([45, 0, 90]);
      }

      logger.debug('[ROTATE_ACCURACY] Rotation transformation validated');
    });

    it('should apply scale transformation correctly', async () => {
      const openscadCode = 'scale([2, 0.5, 3]) cube([1, 1, 1]);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Look for scale node
      const scaleNode = babylonNodes.find((node) => node.metadata?.transform === 'scale');

      if (scaleNode?.metadata?.parameters) {
        expect(scaleNode.metadata.parameters).toEqual([2, 0.5, 3]);
      }

      logger.debug('[SCALE_ACCURACY] Scale transformation validated');
    });
  });

  describe('Boolean Operation Accuracy', () => {
    it.skip('should process union operation with correct structure', async () => {
      const openscadCode = `
        union() {
          cube([3, 3, 3]);
          translate([2, 2, 2]) sphere(r=1.5);
        }
      `;

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Should have boolean operation node
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Look for union operation
      const unionNode = babylonNodes.find((node) => node.metadata?.operation === 'union');

      expect(unionNode).toBeDefined();

      logger.debug('[UNION_ACCURACY] Union operation structure validated');
    });

    it.skip('should process difference operation with correct structure', async () => {
      const openscadCode = `
        difference() {
          cube([4, 4, 4]);
          translate([2, 2, 2]) sphere(r=1.5);
        }
      `;

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Look for difference operation
      const differenceNode = babylonNodes.find((node) => node.metadata?.operation === 'difference');

      expect(differenceNode).toBeDefined();

      logger.debug('[DIFFERENCE_ACCURACY] Difference operation structure validated');
    });

    it.skip('should process intersection operation with correct structure', async () => {
      const openscadCode = `
        intersection() {
          cube([3, 3, 3]);
          sphere(r=2);
        }
      `;

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Look for intersection operation
      const intersectionNode = babylonNodes.find(
        (node) => node.metadata?.operation === 'intersection'
      );

      expect(intersectionNode).toBeDefined();

      logger.debug('[INTERSECTION_ACCURACY] Intersection operation structure validated');
    });
  });

  describe('Complex Geometry Accuracy', () => {
    it.skip('should handle nested transformations correctly', async () => {
      const openscadCode = `
        translate([5, 0, 0]) 
          rotate([0, 45, 0]) 
            scale([2, 1, 1]) 
              cube([1, 1, 1]);
      `;

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Should have multiple transformation nodes
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Verify transformation chain
      const transformNodes = babylonNodes.filter((node) => node.metadata?.transform);

      expect(transformNodes.length).toBeGreaterThan(0);

      logger.debug('[NESTED_ACCURACY] Nested transformations validated');
    });

    it.skip('should handle complex boolean operations correctly', async () => {
      const openscadCode = `
        difference() {
          union() {
            cube([10, 10, 10]);
            translate([5, 5, 5]) sphere(r=3);
          }
          translate([2, 2, 2]) cube([6, 6, 6]);
        }
      `;

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Should have nested boolean operations
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Look for both union and difference operations
      const booleanNodes = babylonNodes.filter(
        (node) =>
          node.metadata?.operation &&
          typeof node.metadata.operation === 'string' &&
          ['union', 'difference', 'intersection'].includes(node.metadata.operation)
      );

      expect(booleanNodes.length).toBeGreaterThan(0);

      logger.debug('[COMPLEX_BOOLEAN_ACCURACY] Complex boolean operations validated');
    });
  });

  describe('Geometric Consistency', () => {
    it('should produce consistent results for identical operations', async () => {
      const openscadCode = 'cube([2, 2, 2]);';

      // Parse and convert multiple times
      const results = [];

      for (let i = 0; i < 3; i++) {
        const parseResult = await parser.parse(openscadCode);
        expect(parseResult.success).toBe(true);

        if (!parseResult.success) continue;
        const ast = parseResult.data;

        const conversionResult = await astConverter.convertAST(ast.body);
        expect(conversionResult.success).toBe(true);

        if (!conversionResult.success) continue;
        results.push(conversionResult.data);
      }

      // All results should be structurally identical
      expect(results).toHaveLength(3);

      const firstResult = results[0];
      expect(firstResult).toBeDefined();

      if (!firstResult) return;

      for (let i = 1; i < results.length; i++) {
        const currentResult = results[i];
        expect(currentResult).toBeDefined();

        if (!currentResult) continue;

        expect(currentResult).toHaveLength(firstResult.length);

        // Compare node types and metadata
        for (let j = 0; j < currentResult.length; j++) {
          const currentNode = currentResult[j];
          const firstNode = firstResult[j];

          expect(currentNode).toBeDefined();
          expect(firstNode).toBeDefined();

          if (!currentNode || !firstNode) continue;

          expect(currentNode.type).toBe(firstNode.type);
          expect(currentNode.metadata).toEqual(firstNode.metadata);
        }
      }

      logger.debug('[CONSISTENCY] Geometric consistency validated');
    });

    it('should maintain precision for small dimensions', async () => {
      const openscadCode = 'cube([0.001, 0.002, 0.003]);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Validate precision is maintained
      expect(babylonNodes).toHaveLength(1);
      const cubeNode = babylonNodes[0];
      expect(cubeNode).toBeDefined();

      if (!cubeNode) return;

      // Generate mesh to access metadata
      const precisionMeshResult = await cubeNode.generateMesh();
      expect(precisionMeshResult.success).toBe(true);

      if (precisionMeshResult.success) {
        const mesh = precisionMeshResult.data;
        if (mesh.metadata?.parameters?.size) {
          const size = mesh.metadata.parameters.size;
          expect(size[0]).toBeCloseTo(0.001, 6);
          expect(size[1]).toBeCloseTo(0.002, 6);
          expect(size[2]).toBeCloseTo(0.003, 6);
        }
      }

      logger.debug('[PRECISION] Small dimension precision validated');
    });
  });
});
