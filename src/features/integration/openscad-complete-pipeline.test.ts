/**
 * @file Complete OpenSCAD Pipeline Integration Tests
 *
 * Tests the complete flow from OpenSCAD code parsing to AST generation,
 * Zustand store updates, CSG conversion, and Tree Sitter updates.
 *
 * NO MOCKS - Uses real implementations throughout the entire pipeline.
 *
 * Flow: OpenSCAD Code → Tree Sitter Parse → AST → Zustand Store → CSG → 3D Meshes
 *
 * @author OpenSCAD 3D Visualization Team
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../shared/services/logger.service.js';
import { convertASTNodeToCSG } from '../3d-renderer/services/ast-to-csg-converter.js';
import type { ASTNode } from '../openscad-parser/core/ast-types.js';
import { OpenscadParser } from '../openscad-parser/core/openscad-parser.js';
import { SimpleErrorHandler } from '../openscad-parser/core/simple-error-handler.js';
import { UnifiedParserService } from '../openscad-parser/services/unified-parser-service.js';
import { useAppStore } from '../store/app-store.js';

const logger = createLogger('CompletePipelineTest');

/**
 * Test scenarios for complete pipeline validation
 */
const PIPELINE_TEST_SCENARIOS = {
  simpleCube: {
    name: 'Simple Cube',
    code: 'cube([10,10,10]);',
    expectedNodeCount: 1,
    expectedNodeType: 'function_call', // Tree Sitter parses as function_call
    expectedMeshType: 'BoxGeometry',
    timeoutMs: 5000,
  },
  transformedSphere: {
    name: 'Transformed Sphere',
    code: 'translate([5,5,5]) sphere(r=3);',
    expectedNodeCount: 1, // Single function call with nested structure
    expectedNodeType: 'function_call',
    expectedMeshType: 'SphereGeometry',
    timeoutMs: 5000,
  },
  unionOperation: {
    name: 'Union Operation',
    code: 'union() { cube([5,5,5]); sphere(r=3); }',
    expectedNodeCount: 1, // Single union function call
    expectedNodeType: 'union', // Direct parsing correctly returns specific type
    expectedMeshType: 'BufferGeometry', // CSG result
    timeoutMs: 8000,
  },
  complexNested: {
    name: 'Complex Nested Operations',
    code: `
      difference() {
        union() {
          cube([10,10,10]);
          translate([5,0,0]) sphere(r=4);
        }
        translate([2,2,2]) cube([6,6,6]);
      }
    `,
    expectedNodeCount: 1, // Single difference function call
    expectedNodeType: 'difference', // Direct parsing correctly returns specific type
    expectedMeshType: 'BufferGeometry',
    timeoutMs: 10000,
  },
} as const;

describe('Complete OpenSCAD Pipeline Integration Tests', () => {
  let parserService: UnifiedParserService;
  let directParser: OpenscadParser;
  let errorHandler: SimpleErrorHandler;

  beforeEach(async () => {
    logger.init('Setting up complete pipeline test environment');

    // Initialize real parser services (NO MOCKS)
    errorHandler = new SimpleErrorHandler();
    directParser = new OpenscadParser(errorHandler);
    parserService = new UnifiedParserService({
      enableCaching: false, // Disable caching for test isolation
      enableLogging: true,
      timeoutMs: 10000,
    });

    // Initialize parsers
    await directParser.init();
    await parserService.initialize();

    logger.debug('Parser services initialized successfully');
  });

  describe('OpenSCAD Code → Tree Sitter → AST Pipeline', () => {
    it.each(Object.entries(PIPELINE_TEST_SCENARIOS))(
      'should parse %s through complete Tree Sitter pipeline',
      async (_scenarioKey, scenario) => {
        logger.init(`Testing ${scenario.name} parsing pipeline`);

        // Step 1: Parse with direct Tree Sitter parser
        const cstResult = directParser.parseCST(scenario.code);
        expect(cstResult).toBeDefined();
        expect(cstResult.rootNode).toBeDefined();

        logger.debug(`CST parsing successful, root node type: ${cstResult.rootNode.type}`);

        // Step 2: Convert CST to AST
        const ast = directParser.parseAST(scenario.code);
        expect(ast).toBeDefined();
        expect(ast.length).toBeGreaterThan(0);
        expect(ast.length).toBe(scenario.expectedNodeCount);

        // Verify AST structure
        const rootNode = ast[0];
        expect(rootNode).toBeDefined();
        expect(rootNode?.type).toBe(scenario.expectedNodeType);

        logger.debug(
          `AST conversion successful: ${ast.length} nodes, root type: ${rootNode?.type}`
        );

        // Step 3: Validate AST node structure
        const validateASTNode = (node: ASTNode): void => {
          expect(node.type).toBeDefined();
          expect(node.location).toBeDefined();
          expect(node.location?.start).toBeDefined();
          expect(node.location?.end).toBeDefined();

          // Recursively validate children if present
          if ('children' in node && Array.isArray(node.children)) {
            node.children.forEach(validateASTNode);
          }
        };

        ast.forEach(validateASTNode);

        logger.end(`${scenario.name} parsing pipeline validation completed`);
      },
      { timeout: 10000 }
    );
  });

  describe('AST → Zustand Store Integration', () => {
    it.each(Object.entries(PIPELINE_TEST_SCENARIOS))(
      'should update Zustand store with %s AST data',
      async (_scenarioKey, scenario) => {
        logger.init(`Testing ${scenario.name} Zustand store integration`);

        const { result } = renderHook(() => useAppStore());

        // Step 1: Parse code to AST
        const parseResult = await act(async () => {
          return await result.current.parseCode(scenario.code);
        });

        expect(parseResult.success).toBe(true);
        if (!parseResult.success) return;

        // Step 2: Verify store state updates
        const storeState = result.current;

        expect(storeState.parsing.ast).toBeDefined();
        expect(storeState.parsing.ast.length).toBe(scenario.expectedNodeCount);
        expect(storeState.parsing.isLoading).toBe(false);
        expect(storeState.parsing.errors).toHaveLength(0);
        expect(storeState.parsing.lastParsed).toBeDefined();
        expect(storeState.parsing.parseTime).toBeGreaterThan(0);

        // Step 3: Verify AST structure in store
        const storedAST = storeState.parsing.ast;
        const rootNode = storedAST[0];
        expect(rootNode?.type).toBe(scenario.expectedNodeType);

        // Step 4: Verify performance metrics
        expect(storeState.performance.metrics.parseTime).toBeGreaterThan(0);
        expect(storeState.performance.metrics.parseTime).toBeLessThan(scenario.timeoutMs);

        logger.debug(
          `Store updated: ${storedAST.length} AST nodes, parse time: ${storeState.parsing.parseTime.toFixed(2)}ms`
        );
        logger.end(`${scenario.name} Zustand store integration completed`);
      },
      { timeout: 15000 }
    );
  });

  describe('AST → CSG Conversion Pipeline', () => {
    it.each(Object.entries(PIPELINE_TEST_SCENARIOS))(
      'should convert %s AST to CSG meshes',
      async (_scenarioKey, scenario) => {
        logger.init(`Testing ${scenario.name} AST to CSG conversion`);

        // Step 1: Parse code to AST
        const ast = directParser.parseAST(scenario.code);
        expect(ast.length).toBeGreaterThan(0);

        const rootNode = ast[0];
        if (!rootNode) throw new Error('No root AST node found');

        // Step 2: Convert AST to CSG
        const csgResult = await convertASTNodeToCSG(rootNode, 0, {
          material: {
            color: '#00ff88',
            opacity: 1,
            metalness: 0.1,
            roughness: 0.8,
            wireframe: false,
            transparent: false,
            side: 'front',
          },
          enableOptimization: true,
          maxComplexity: 50000,
          timeoutMs: scenario.timeoutMs,
        });

        if (!csgResult.success) {
          logger.error(`CSG conversion failed for ${scenario.name}: ${csgResult.error}`);
          console.error(`[DEBUG] CSG conversion failed for ${scenario.name}:`, csgResult.error);
          console.error(`[DEBUG] AST node:`, JSON.stringify(rootNode, null, 2));
          throw new Error(`CSG conversion failed: ${csgResult.error}`);
        }
        expect(csgResult.success).toBe(true);

        // Step 3: Validate CSG mesh (Mesh3D wrapper)
        const mesh3D = csgResult.data;
        expect(mesh3D).toBeDefined();
        expect(mesh3D.mesh).toBeDefined();
        expect(mesh3D.metadata).toBeDefined();

        // Step 4: Verify Three.js mesh properties
        const threeMesh = mesh3D.mesh;
        expect(threeMesh.geometry).toBeDefined();
        expect(threeMesh.geometry.type).toContain('Geometry');
        expect(threeMesh.position).toBeDefined();
        expect(threeMesh.rotation).toBeDefined();
        expect(threeMesh.scale).toBeDefined();

        // Step 5: Verify material properties
        const material = threeMesh.material;
        if (Array.isArray(material)) {
          expect(material.length).toBeGreaterThan(0);
        } else {
          expect(material.type).toContain('Material');
        }

        logger.debug(
          `CSG conversion successful: ${threeMesh.geometry.type}, vertices: ${threeMesh.geometry.getAttribute('position')?.count ?? 0}`
        );
        logger.end(`${scenario.name} CSG conversion completed`);
      },
      { timeout: 15000 }
    );
  });

  describe('Complete End-to-End Pipeline: Code → Store → CSG → Tree Sitter', () => {
    it.each(Object.entries(PIPELINE_TEST_SCENARIOS))(
      'should execute complete pipeline for %s',
      async (scenarioKey, scenario) => {
        logger.init(`Testing complete end-to-end pipeline for ${scenario.name}`);

        const { result } = renderHook(() => useAppStore());

        // Step 1: Update editor code (simulating user input)
        act(() => {
          result.current.updateCode(scenario.code);
        });

        expect(result.current.editor.code).toBe(scenario.code);
        expect(result.current.editor.isDirty).toBe(true);

        // Step 2: Parse code through store (triggers Tree Sitter → AST)
        const parseResult = await act(async () => {
          return await result.current.parseCode(scenario.code);
        });

        expect(parseResult.success).toBe(true);
        if (!parseResult.success) {
          logger.error(`Parse failed: ${parseResult.error}`);
          throw new Error(`Parse failed: ${parseResult.error}`);
        }

        // Step 3: Verify store state after parsing
        const storeState = result.current;
        expect(storeState.parsing.ast.length).toBe(scenario.expectedNodeCount);
        expect(storeState.parsing.errors).toHaveLength(0);

        // Step 4: Convert AST to CSG (simulating 3D rendering)
        const ast = storeState.parsing.ast;
        const rootNode = ast[0];
        if (!rootNode) throw new Error('No root AST node in store');

        const csgResult = await convertASTNodeToCSG(rootNode, 0);
        expect(csgResult.success).toBe(true);

        if (!csgResult.success) {
          logger.error(`CSG conversion failed: ${csgResult.error}`);
          throw new Error(`CSG conversion failed: ${csgResult.error}`);
        }

        // Step 5: Verify CSG mesh integration
        const mesh3D = csgResult.data;
        expect(mesh3D.mesh.geometry).toBeDefined();
        expect(mesh3D.mesh.material).toBeDefined();

        // Step 6: Update rendering state in store
        act(() => {
          result.current.updateMeshes([mesh3D.mesh]);
        });

        expect(result.current.rendering?.meshes).toHaveLength(1);
        expect(result.current.rendering?.lastRendered).toBeDefined();

        // Step 7: Verify complete pipeline metrics
        const finalState = result.current;
        expect(finalState.parsing.parseTime).toBeGreaterThan(0);
        expect(finalState.parsing.parseTime).toBeLessThan(scenario.timeoutMs);
        expect(finalState.performance.metrics.parseTime).toBeGreaterThan(0);

        logger.debug(
          `Complete pipeline metrics: parse=${finalState.parsing.parseTime.toFixed(2)}ms, nodes=${ast.length}, meshes=${finalState.rendering?.meshes.length ?? 0}`
        );
        logger.end(`${scenario.name} complete pipeline validation completed`);
      },
      { timeout: 20000 }
    );
  });

  describe('Tree Sitter Document State Management', () => {
    it('should maintain Tree Sitter document state across multiple parses', async () => {
      logger.init('Testing Tree Sitter document state management');

      // Step 1: Parse initial document
      const initialCode = 'cube([5,5,5]);';
      const initialResult = await parserService.parseDocument(initialCode);
      expect(initialResult.success).toBe(true);

      // Step 2: Parse modified document (simulating incremental editing)
      const modifiedCode = 'cube([10,10,10]);';
      const modifiedResult = await parserService.parseDocument(modifiedCode);
      expect(modifiedResult.success).toBe(true);

      // Step 3: Verify document state is maintained
      if (initialResult.success && modifiedResult.success) {
        expect(modifiedResult.data.parseTime).toBeDefined();
        expect(modifiedResult.data.ast).toBeDefined();
        expect(modifiedResult.data.ast?.length).toBe(1);

        const astNode = modifiedResult.data.ast?.[0];
        expect(astNode?.type).toBe('function_call'); // Tree Sitter parses as function_call
      }

      logger.end('Tree Sitter document state management completed');
    });

    it('should handle syntax errors gracefully in Tree Sitter pipeline', async () => {
      logger.init('Testing Tree Sitter error handling');

      const invalidCode = 'cube([10,10,10]; // Missing closing parenthesis';

      // Parse with unified service
      const parseResult = await parserService.parseDocument(invalidCode);

      // Should handle errors gracefully
      if (!parseResult.success) {
        expect(parseResult.error).toBeDefined();
        logger.debug(`Error handled correctly: ${parseResult.error}`);
      } else {
        // If parsing succeeds, should have error information
        expect(parseResult.data.errors).toBeDefined();
        if (parseResult.data.errors.length > 0) {
          logger.debug(`Parse errors captured: ${parseResult.data.errors.length} errors`);
        }
      }

      logger.end('Tree Sitter error handling completed');
    });
  });

  describe('Performance and Resource Management', () => {
    it('should maintain performance targets across complete pipeline', async () => {
      logger.init('Testing complete pipeline performance');

      const testCode = 'union() { cube([10,10,10]); sphere(r=5); cylinder(h=15, r=3); }';
      const startTime = performance.now();

      // Execute complete pipeline
      const { result } = renderHook(() => useAppStore());

      const parseResult = await act(async () => {
        return await result.current.parseCode(testCode);
      });

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      // Convert to CSG
      const ast = result.current.parsing.ast;
      const rootNode = ast[0];
      if (!rootNode) throw new Error('No root node');

      const csgResult = await convertASTNodeToCSG(rootNode, 0);
      expect(csgResult.success).toBe(true);

      const totalTime = performance.now() - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // <10s total pipeline
      expect(result.current.parsing.parseTime).toBeLessThan(5000); // <5s parse time

      logger.debug(
        `Pipeline performance: total=${totalTime.toFixed(2)}ms, parse=${result.current.parsing.parseTime.toFixed(2)}ms`
      );
      logger.end('Complete pipeline performance validation completed');
    });
  });
});
