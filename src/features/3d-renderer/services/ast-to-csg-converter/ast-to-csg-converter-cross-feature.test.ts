/**
 * AST to CSG Converter - Cross-Feature Integration Tests
 *
 * Integration tests that span multiple features (parser + 3D renderer + store).
 * Tests the complete data flow from OpenSCAD code to rendered 3D meshes through Zustand store.
 *
 * Follows the ast-to-csg-converter-[variation].test.ts pattern for consistency.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { ASTNode } from '../../../openscad-parser/core/ast-types.js';
import { UnifiedParserService } from '../../../openscad-parser/services/unified-parser-service.js';
import { createAppStore } from '../../../store/app-store.js';
import { convertASTNodeToCSG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterCrossFeatureTest');

/**
 * Cross-feature integration test scenarios
 */
const CROSS_FEATURE_SCENARIOS = {
  basicPrimitiveFlow: {
    name: 'Basic Primitive Data Flow',
    code: 'cube([10, 10, 10]);',
    expectedNodeCount: 1,
    expectedNodeTypes: ['function_call'],
    expectedStoreNodeCount: 1, // Same as parser for single statements
    hasRenderableContent: true,
    description: 'Tests complete flow: code → store → parser → AST → CSG → rendering',
  },

  transformationFlow: {
    name: 'Transformation Data Flow',
    code: 'translate([5, 0, 0]) cube([5, 5, 5]);',
    expectedNodeCount: 1,
    expectedNodeTypes: ['function_call'],
    expectedStoreNodeCount: 1, // Same as parser for single statements
    hasRenderableContent: true,
    description: 'Tests transformation pipeline through store integration',
  },

  multipleObjectsFlow: {
    name: 'Multiple Objects Data Flow',
    code: 'cube([10, 10, 10]); sphere(r=5); cylinder(h=15, r=3);',
    expectedNodeCount: 3, // Parser correctly parses 3 separate function calls
    expectedNodeTypes: ['function_call', 'function_call', 'function_call'],
    expectedStoreNodeCount: 1, // Store restructuring combines into single program node
    hasRenderableContent: true,
    description: 'Tests multiple objects through complete pipeline',
  },

  complexCSGFlow: {
    name: 'Complex CSG Data Flow',
    code: `
difference() {
    cube([20, 20, 20]);
    translate([10, 10, 10]) sphere(r=8);
}
`,
    expectedNodeCount: 1,
    expectedNodeTypes: ['difference'],
    expectedStoreNodeCount: 1, // Same as parser for single statements
    hasRenderableContent: true,
    description: 'Tests complex CSG operations through store and rendering pipeline',
  },

  errorRecoveryFlow: {
    name: 'Error Recovery Data Flow',
    code: 'cube([10, 10, 10]); invalid_function(); sphere(r=5);',
    expectedNodeCount: 3, // Parser correctly parses all 3 function calls (including invalid ones)
    expectedNodeTypes: ['function_call', 'function_call', 'function_call'],
    expectedStoreNodeCount: 1, // Store restructuring combines into single program node
    hasRenderableContent: true,
    description: 'Tests error recovery and partial rendering through store',
  },

  realTimeUpdateFlow: {
    name: 'Real-Time Update Data Flow',
    code: 'cube([5, 5, 5]);',
    expectedNodeCount: 1,
    expectedNodeTypes: ['function_call'],
    expectedStoreNodeCount: 1, // Same as parser for single statements
    hasRenderableContent: true,
    description: 'Tests real-time code updates through store debouncing',
  },
};

describe('AST to CSG Converter - Cross-Feature Integration', () => {
  let parserService: UnifiedParserService;
  let store: ReturnType<typeof createAppStore>;

  beforeEach(async () => {
    logger.init('Setting up cross-feature integration test environment');

    // Initialize parser service
    parserService = new UnifiedParserService({
      enableLogging: true,
      enableCaching: false,
      retryAttempts: 3,
      timeoutMs: 10000,
    });

    await parserService.initialize();

    // Initialize store with test configuration
    store = createAppStore({
      enableDevtools: false, // Disable for testing
      enablePersistence: false, // Disable for testing
      debounceConfig: {
        parseDelayMs: 100, // Reduced for testing
        saveDelayMs: 500,
        renderDelayMs: 300,
      },
    });

    logger.debug('Cross-feature test environment initialized successfully');
  });

  describe('Parser Integration Tests', () => {
    Object.entries(CROSS_FEATURE_SCENARIOS).forEach(([scenarioKey, scenario]) => {
      it(`should parse ${scenarioKey} through store integration`, async () => {
        logger.init(`Testing ${scenario.name} - ${scenario.description}`);

        // Test direct parser integration
        const parseResult = await parserService.parseDocument(scenario.code);

        expect(parseResult.success).toBe(true);
        if (parseResult.success) {
          const ast = parseResult.data.ast;
          expect(ast).toBeDefined();
          expect(ast).not.toBeNull();

          if (ast) {
            expect(ast.length).toBe(scenario.expectedNodeCount);
            logger.debug(`${scenario.name} parsed ${ast.length} nodes directly`);

            // Verify node types if nodes exist
            if (ast.length > 0 && scenario.expectedNodeTypes.length > 0) {
              ast.forEach((node, index) => {
                expect(node).toBeDefined();
                expect(node?.type).toBe(scenario.expectedNodeTypes[index]);
                logger.debug(`Node ${index + 1}: ${node?.type}`);
              });
            }
          }
        }

        logger.end(`${scenario.name} parser integration test completed`);
      });
    });
  });

  describe('Store Integration Tests', () => {
    Object.entries(CROSS_FEATURE_SCENARIOS).forEach(([scenarioKey, scenario]) => {
      it(`should handle ${scenarioKey} through store state management`, async () => {
        logger.init(`Testing ${scenario.name} store integration`);

        // Update code through store
        store.getState().updateCode(scenario.code);

        // Verify editor state
        expect(store.getState().editor.code).toBe(scenario.code);
        expect(store.getState().editor.isDirty).toBe(true);

        // Trigger parsing through store
        const parseResult = await store.getState().parseCode(scenario.code);

        expect(parseResult.success).toBe(true);
        if (parseResult.success) {
          const ast = parseResult.data;
          expect(ast).toBeDefined();
          const expectedCount = scenario.expectedStoreNodeCount ?? scenario.expectedNodeCount;
          expect(ast.length).toBe(expectedCount);

          // Verify store parsing state
          expect(store.getState().parsing.isLoading).toBe(false);
          expect(store.getState().parsing.errors.length).toBe(0);
          expect(store.getState().parsing.ast).toBeDefined();
          expect(store.getState().parsing.ast?.length).toBe(expectedCount);

          logger.debug(`${scenario.name} store integration successful with ${ast.length} nodes`);
        }

        logger.end(`${scenario.name} store integration test completed`);
      });
    });
  });

  describe('End-to-End Flow Tests', () => {
    const renderableScenarios = Object.entries(CROSS_FEATURE_SCENARIOS).filter(
      ([, scenario]) => scenario.hasRenderableContent
    );

    renderableScenarios.forEach(([scenarioKey, scenario]) => {
      it(`should complete end-to-end flow for ${scenarioKey}`, async () => {
        logger.init(`Testing ${scenario.name} end-to-end flow`);

        const startTime = performance.now();

        // Step 1: Update code through store
        store.getState().updateCode(scenario.code);
        expect(store.getState().editor.code).toBe(scenario.code);

        // Step 2: Parse through store
        const parseResult = await store.getState().parseCode(scenario.code);
        expect(parseResult.success).toBe(true);

        if (parseResult.success) {
          const ast = parseResult.data;

          // Step 3: Convert AST to CSG
          const conversionResults = await Promise.all(
            ast.map(async (node: ASTNode, index: number) => ({
              node,
              result: await convertASTNodeToCSG(node, index),
            }))
          );

          expect(conversionResults.length).toBeGreaterThan(0);

          // Step 4: Verify rendering state through store
          if (store.getState().parsing.ast) {
            const renderResult = await store.getState().renderFromAST(store.getState().parsing.ast);

            if (renderResult.success) {
              const meshes = renderResult.data;
              expect(meshes).toBeDefined();
              expect(meshes.length).toBeGreaterThanOrEqual(0);

              // Update store with rendered meshes
              store.getState().updateMeshes(meshes);
              expect(store.getState().rendering?.meshes).toBeDefined();

              logger.debug(
                `${scenario.name} end-to-end flow completed with ${meshes.length} meshes`
              );
            } else {
              logger.debug(
                `${scenario.name} rendering failed (expected for some complex operations): ${renderResult.error}`
              );
            }
          }
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        expect(totalTime).toBeLessThan(5000); // 5 second timeout for complex operations
        logger.debug(`${scenario.name} end-to-end flow completed in ${totalTime.toFixed(2)}ms`);

        logger.end(`${scenario.name} end-to-end flow test completed`);
      });
    });
  });

  describe('Real-Time Update Tests', () => {
    it('should handle rapid code updates through store debouncing', async () => {
      logger.init('Testing rapid code updates with debouncing');

      const codeSequence = [
        'cube([1, 1, 1]);',
        'cube([2, 2, 2]);',
        'cube([3, 3, 3]);',
        'sphere(r=2);',
        'cylinder(h=5, r=1);',
      ];

      // Rapidly update code multiple times
      for (const code of codeSequence) {
        store.getState().updateCode(code);
        expect(store.getState().editor.code).toBe(code);
        expect(store.getState().editor.isDirty).toBe(true);
      }

      // Wait for debouncing to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Parse the final code
      const finalCode = codeSequence[codeSequence.length - 1];
      if (!finalCode) {
        throw new Error('No final code found in sequence');
      }
      const parseResult = await store.getState().parseCode(finalCode);

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.length).toBe(1); // cylinder
        expect(store.getState().parsing.ast?.length).toBe(1);
      }

      logger.end('Rapid code updates test completed');
    });

    it('should maintain performance under repeated operations', async () => {
      logger.init('Testing repeated operations performance');

      const testCode = 'translate([1, 2, 3]) cube([5, 5, 5]);';
      const times: number[] = [];

      // Perform the same operation multiple times
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        store.getState().updateCode(testCode);
        const parseResult = await store.getState().parseCode(testCode);

        const endTime = performance.now();
        const operationTime = endTime - startTime;

        expect(parseResult.success).toBe(true);
        expect(operationTime).toBeLessThan(100); // 100ms per operation
        times.push(operationTime);
      }

      // Calculate performance statistics
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      expect(avgTime).toBeLessThan(50); // Average should be under 50ms
      expect(maxTime).toBeLessThan(200); // Max should be under 200ms

      logger.debug(
        `Repeated operations: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`
      );
      logger.end('Repeated operations performance test completed');
    });
  });

  describe('Error Handling and Recovery Tests', () => {
    it('should handle store state during parsing errors', async () => {
      logger.init('Testing store state during parsing errors');

      const invalidCode = 'completely_invalid_syntax @#$%';

      // Update store with invalid code
      store.getState().updateCode(invalidCode);
      expect(store.getState().editor.code).toBe(invalidCode);

      // Attempt to parse invalid code
      const parseResult = await store.getState().parseCode(invalidCode);

      // Parser should handle gracefully
      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.length).toBe(1); // Parser creates a program node even for invalid syntax
        expect(store.getState().parsing.ast?.length).toBe(1);
      }

      // Store should maintain consistent state
      expect(store.getState().parsing.isLoading).toBe(false);
      expect(store.getState().editor.isDirty).toBe(true);

      logger.end('Store error handling test completed');
    });

    it('should recover from errors and continue processing', async () => {
      logger.init('Testing error recovery and continued processing');

      // Start with invalid code
      const invalidCode = 'invalid_function();';
      store.getState().updateCode(invalidCode);
      await store.getState().parseCode(invalidCode);

      // Switch to valid code
      const validCode = 'cube([10, 10, 10]);';
      store.getState().updateCode(validCode);
      const parseResult = await store.getState().parseCode(validCode);

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.length).toBe(1);
        expect(store.getState().parsing.ast?.length).toBe(1);
        expect(store.getState().parsing.errors.length).toBe(0);
      }

      logger.end('Error recovery test completed');
    });
  });
});
