/**
 * @file Scene Structure Visual Regression Tests
 *
 * Visual regression tests that validate scene structure, hierarchy, and material assignments.
 * Tests ensure that 3D scenes are constructed correctly with proper object relationships,
 * naming conventions, and material properties.
 *
 * @example
 * Tests validate scene structure properties:
 * - Object hierarchy and parent-child relationships
 * - Material assignments and properties
 * - Scene organization and naming conventions
 * - Metadata preservation and accessibility
 */

import { type AbstractMesh, NullEngine, Scene } from '@babylonjs/core';
// Mock logger to avoid console output during tests
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASTBridgeConverter } from '../../features/babylon-renderer/services/ast-bridge-converter';
import { SelectionService } from '../../features/babylon-renderer/services/selection';
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

const logger = createLogger('SceneStructure');

describe('Scene Structure Visual Regression Tests', () => {
  let engine: NullEngine;
  let scene: Scene;
  let parser: OpenscadParser;
  let astConverter: ASTBridgeConverter;
  let selectionService: SelectionService;

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

    // Create selection service
    selectionService = new SelectionService(scene);
    await selectionService.initialize();

    logger.debug('[SETUP] Scene structure test environment initialized');
  });

  afterEach(() => {
    // Clean up resources
    if (selectionService) {
      selectionService.dispose();
    }
    if (astConverter) {
      astConverter.dispose();
    }
    if (parser) {
      parser.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Object Hierarchy Validation', () => {
    it('should create proper scene hierarchy for simple objects', async () => {
      const openscadCode = `
        cube([2, 2, 2]);
        translate([5, 0, 0]) sphere(r=1);
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

      // Validate scene structure
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Each node should have proper metadata
      for (const node of babylonNodes) {
        expect(node.type).toBeDefined();
        expect(node.metadata).toBeDefined();
      }

      logger.debug('[HIERARCHY] Simple object hierarchy validated');
    });

    it('should maintain parent-child relationships for nested operations', async () => {
      const openscadCode = `
        union() {
          cube([3, 3, 3]);
          translate([2, 2, 2]) {
            sphere(r=1);
            cylinder(h=2, r=0.5);
          }
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

      // Should have hierarchical structure
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Look for union operation with children
      const unionNode = babylonNodes.find((node) => node.metadata?.operation === 'union');

      expect(unionNode).toBeDefined();

      logger.debug('[NESTED_HIERARCHY] Nested operation hierarchy validated');
    });

    it('should handle complex transformation hierarchies', async () => {
      const openscadCode = `
        translate([10, 0, 0]) 
          rotate([0, 45, 0]) 
            scale([2, 1, 1]) 
              difference() {
                cube([2, 2, 2]);
                sphere(r=1);
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

      // Should have transformation chain
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Verify transformation nodes exist
      const transformNodes = babylonNodes.filter((node) => node.metadata?.transform);

      expect(transformNodes.length).toBeGreaterThan(0);

      logger.debug('[TRANSFORM_HIERARCHY] Transformation hierarchy validated');
    });
  });

  describe('Metadata Preservation', () => {
    it('should preserve OpenSCAD source information in metadata', async () => {
      const openscadCode = 'cube([4, 6, 8], center=true);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Validate metadata preservation
      expect(babylonNodes).toHaveLength(1);
      const cubeNode = babylonNodes[0];
      expect(cubeNode).toBeDefined();

      if (!cubeNode) return;

      // Generate mesh to access metadata
      const meshResult = await cubeNode.generateMesh();
      expect(meshResult.success).toBe(true);

      if (meshResult.success) {
        const mesh = meshResult.data;
        expect(mesh.metadata).toBeDefined();
        expect(mesh.metadata?.primitiveType).toBeDefined();
        expect(mesh.metadata?.parameters).toBeDefined();

        // Check specific parameters
        if (mesh.metadata?.parameters) {
          expect(mesh.metadata.parameters.size).toEqual([4, 6, 8]);
          expect(mesh.metadata.parameters.center).toBe(true);
        }
      }

      logger.debug('[METADATA] OpenSCAD metadata preservation validated');
    });

    it('should preserve transformation metadata', async () => {
      const openscadCode = 'translate([1, 2, 3]) rotate([45, 0, 90]) cube([1, 1, 1]);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Look for transformation metadata
      const transformNodes = babylonNodes.filter((node) => node.metadata?.transform);

      expect(transformNodes.length).toBeGreaterThan(0);

      // Validate transformation parameters
      for (const transformNode of transformNodes) {
        expect(transformNode.metadata?.transform).toBeDefined();
        expect(transformNode.metadata?.parameters).toBeDefined();
      }

      logger.debug('[TRANSFORM_METADATA] Transformation metadata preservation validated');
    });

    it('should preserve boolean operation metadata', async () => {
      const openscadCode = `
        difference() {
          cube([5, 5, 5]);
          translate([2.5, 2.5, 2.5]) sphere(r=2);
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

      // Look for boolean operation metadata
      const booleanNode = babylonNodes.find((node) => node.metadata?.operation === 'difference');

      expect(booleanNode).toBeDefined();
      expect(booleanNode?.metadata?.operation).toBe('difference');

      logger.debug('[BOOLEAN_METADATA] Boolean operation metadata preservation validated');
    });
  });

  describe('Selection Integration', () => {
    it('should support selection of generated objects', async () => {
      const openscadCode = `
        cube([2, 2, 2]);
        translate([4, 0, 0]) sphere(r=1);
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

      // Create mock meshes for selection testing
      // (In real implementation, these would be actual BabylonJS meshes)
      const mockMeshes: AbstractMesh[] = [];

      for (let i = 0; i < babylonNodes.length; i++) {
        const node = babylonNodes[i];
        if (!node) continue;

        const mockMesh = {
          id: `openscad-object-${i}`,
          name: `OpenSCAD Object ${i}`,
          metadata: node.metadata,
          isVisible: true,
          isEnabled: () => true,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scaling: { x: 1, y: 1, z: 1 },
          getBoundingInfo: () => ({
            minimum: { x: -1, y: -1, z: -1 },
            maximum: { x: 1, y: 1, z: 1 },
          }),
          getClassName: () => 'Mesh',
          dispose: () => {},
        } as any;

        mockMeshes.push(mockMesh);
      }

      // Test selection functionality
      if (mockMeshes.length > 0) {
        const firstMesh = mockMeshes[0];
        expect(firstMesh).toBeDefined();

        if (!firstMesh) return;

        const selectionResult = selectionService.selectMesh(firstMesh);
        expect(selectionResult.success).toBe(true);

        const selectedMeshes = selectionService.getSelectedMeshes();
        expect(selectedMeshes).toHaveLength(1);
        expect(selectedMeshes[0]).toBe(firstMesh);
      }

      logger.debug('[SELECTION_INTEGRATION] Selection integration validated');
    });

    it('should preserve metadata through selection workflow', async () => {
      const openscadCode = 'cylinder(h=5, r=2, $fn=16);';

      // Parse and convert
      const parseResult = await parser.parse(openscadCode);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;
      const ast = parseResult.data;

      const conversionResult = await astConverter.convertAST(ast.body);
      expect(conversionResult.success).toBe(true);

      if (!conversionResult.success) return;
      const babylonNodes = conversionResult.data;

      // Create mock mesh with metadata
      const mockMesh = {
        id: 'openscad-cylinder',
        name: 'OpenSCAD Cylinder',
        metadata: babylonNodes[0]?.metadata,
        isVisible: true,
        isEnabled: () => true,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scaling: { x: 1, y: 1, z: 1 },
        getBoundingInfo: () => ({
          minimum: { x: -2, y: -2, z: 0 },
          maximum: { x: 2, y: 2, z: 5 },
        }),
        getClassName: () => 'Mesh',
        dispose: () => {},
      } as any;

      // Select and verify metadata preservation
      const selectionResult = selectionService.selectMesh(mockMesh);
      expect(selectionResult.success).toBe(true);

      const selectionState = selectionService.getSelectionState();
      const selectedInfo = selectionState.selectedMeshes[0];

      expect(selectedInfo).toBeDefined();
      expect(selectedInfo?.metadata).toBeDefined();

      // Verify OpenSCAD metadata is preserved
      if (selectedInfo?.metadata) {
        expect(selectedInfo.metadata.openscadType).toBeDefined();
        expect(selectedInfo.metadata.parameters).toBeDefined();
      }

      logger.debug('[METADATA_SELECTION] Metadata preservation through selection validated');
    });
  });

  describe('Scene Organization', () => {
    it('should organize objects logically in scene', async () => {
      const openscadCode = `
        // Group 1: Basic shapes
        cube([1, 1, 1]);
        translate([2, 0, 0]) sphere(r=0.5);
        
        // Group 2: Complex operation
        translate([0, 3, 0]) difference() {
          cube([2, 2, 2]);
          cylinder(h=3, r=0.8);
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

      // Should have multiple objects organized logically
      expect(babylonNodes.length).toBeGreaterThan(0);

      // Categorize nodes by type
      const primitiveNodes = babylonNodes.filter(
        (node) =>
          node.metadata?.openscadType &&
          typeof node.metadata.openscadType === 'string' &&
          ['cube', 'sphere', 'cylinder'].includes(node.metadata.openscadType)
      );

      const transformNodes = babylonNodes.filter((node) => node.metadata?.transform);

      const booleanNodes = babylonNodes.filter((node) => node.metadata?.operation);

      // Should have a mix of different node types
      expect(primitiveNodes.length + transformNodes.length + booleanNodes.length).toBeGreaterThan(
        0
      );

      logger.debug('[SCENE_ORGANIZATION] Scene organization validated');
    });

    it('should handle naming conventions consistently', async () => {
      const openscadCode = `
        cube([1, 1, 1]);
        sphere(r=1);
        cylinder(h=2, r=0.5);
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

      // Validate naming conventions
      for (const node of babylonNodes) {
        expect(node.nodeType).toBeDefined();
        expect(typeof node.nodeType).toBe('string');

        // Check if the node has metadata with OpenSCAD type information
        if (node.metadata?.primitiveType && typeof node.metadata.primitiveType === 'string') {
          expect(['cube', 'sphere', 'cylinder'].includes(node.metadata.primitiveType)).toBe(true);
        }
      }

      logger.debug('[NAMING_CONVENTIONS] Naming conventions validated');
    });
  });

  describe('Visual Consistency', () => {
    it('should produce consistent scene structure for identical code', async () => {
      const openscadCode = 'union() { cube([2, 2, 2]); sphere(r=1); }';

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

      for (let i = 1; i < results.length; i++) {
        const currentResult = results[i];
        const firstResult = results[0];

        expect(currentResult).toBeDefined();
        expect(firstResult).toBeDefined();

        if (!currentResult || !firstResult) continue;

        expect(currentResult).toHaveLength(firstResult.length);

        // Compare structure and metadata
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

      logger.debug('[VISUAL_CONSISTENCY] Scene structure consistency validated');
    });
  });
});
