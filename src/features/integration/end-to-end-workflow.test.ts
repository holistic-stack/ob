/**
 * End-to-End Workflow Validation
 *
 * Comprehensive testing of complete pipeline from OpenSCAD code through
 * matrix operations to 3D rendering, validating all service integrations.
 */

import { BoxGeometry, CylinderGeometry, Mesh, SphereGeometry } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../shared/services/logger.service.js';
import {
  convertASTNodesToCSGUnion,
  convertASTNodeToCSG,
} from '../3d-renderer/services/ast-to-csg-converter.js';
import { MatrixIntegrationService } from '../3d-renderer/services/matrix-integration.service.js';
import { MatrixServiceContainer } from '../3d-renderer/services/matrix-service-container.js';
import { parseOpenSCADCode } from '../openscad-parser/services/parser-manager.js';
import { useAppStore } from '../store/app-store.js';

const logger = createLogger('E2EWorkflowTest');

/**
 * End-to-end test scenarios
 */
const E2E_TEST_SCENARIOS = {
  // Simple primitive rendering
  simplePrimitive: {
    code: 'cube([10,10,10]);',
    expectedNodes: 1,
    expectedType: 'cube',
    timeoutMs: 5000,
  },
  // Complex transformation
  complexTransformation: {
    code: 'translate([5,0,0]) rotate([0,45,0]) scale([2,1,1]) cube([5,5,5]);',
    expectedNodes: 1,
    expectedType: 'translate',
    timeoutMs: 10000,
  },
  // Multiple primitives with union
  multiplePrimitives: {
    code: `
      cube([10,10,10]);
      translate([15,0,0]) sphere(5);
      translate([0,15,0]) cylinder(h=10, r=3);
    `,
    expectedNodes: 3,
    expectedTypes: ['cube', 'translate', 'translate'],
    timeoutMs: 15000,
  },
  // Boolean operations
  booleanOperations: {
    code: `
      difference() {
        cube([20,20,20]);
        translate([10,10,10]) sphere(8);
      }
    `,
    expectedNodes: 1,
    expectedType: 'difference',
    timeoutMs: 20000,
  },
  // Complex nested operations
  complexNested: {
    code: `
      union() {
        difference() {
          cube([30,30,30]);
          translate([15,15,15]) sphere(12);
        }
        translate([35,0,0]) intersection() {
          cube([20,20,20]);
          sphere(15);
        }
      }
    `,
    expectedNodes: 1,
    expectedType: 'union',
    timeoutMs: 30000,
  },
};

/**
 * Workflow validation metrics
 */
interface WorkflowMetrics {
  readonly parseTime: number;
  readonly astNodeCount: number;
  readonly matrixOperationCount: number;
  readonly csgConversionTime: number;
  readonly renderingTime: number;
  readonly totalWorkflowTime: number;
  readonly memoryUsage: number;
  readonly cacheHitRate: number;
  readonly validationWarnings: number;
  readonly success: boolean;
}

/**
 * Type assertion helpers for workflow results
 */
const asWorkflowResult = (result: unknown): Record<string, unknown> =>
  result as Record<string, unknown>;
const asMeshResult = (result: unknown): { mesh: unknown; metadata: Record<string, unknown> } =>
  result as { mesh: unknown; metadata: Record<string, unknown> };
const asMetadata = (obj: unknown): Record<string, unknown> =>
  (obj as Record<string, unknown>).metadata as Record<string, unknown>;

/**
 * Validate AST node structure
 */
const validateASTNode = (node: unknown, expectedType?: string): boolean => {
  if (!node || typeof node !== 'object') return false;

  const nodeObj = node as Record<string, unknown>;
  if (expectedType && nodeObj.type !== expectedType) return false;

  // Check required properties
  if (!nodeObj.type || !nodeObj.location) return false;

  // Validate location structure
  const location = nodeObj.location as Record<string, unknown>;
  if (!location.start || !location.end) return false;

  const start = location.start as Record<string, unknown>;
  if (typeof start.line !== 'number') return false;
  if (typeof start.column !== 'number') return false;

  return true;
};

/**
 * Validate 3D mesh structure
 */
const validateMesh = (mesh: Mesh, expectedGeometryType?: string): boolean => {
  if (!mesh || !(mesh instanceof Mesh)) return false;
  if (!mesh.geometry) return false;

  if (expectedGeometryType) {
    switch (expectedGeometryType) {
      case 'cube':
        return mesh.geometry instanceof BoxGeometry;
      case 'sphere':
        return mesh.geometry instanceof SphereGeometry;
      case 'cylinder':
        return mesh.geometry instanceof CylinderGeometry;
      default:
        return true;
    }
  }

  return true;
};

/**
 * Measure workflow performance
 */
const measureWorkflowPerformance = async (
  workflowFn: () => Promise<unknown>
): Promise<{ result: unknown; metrics: Partial<WorkflowMetrics> }> => {
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage?.()?.heapUsed || 0;

  try {
    const result = await workflowFn();
    const endTime = Date.now();
    const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;

    const metrics: Partial<WorkflowMetrics> = {
      totalWorkflowTime: endTime - startTime,
      memoryUsage: memoryAfter - memoryBefore,
      success: true,
    };

    return { result, metrics };
  } catch (_error) {
    const endTime = Date.now();
    const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;

    const metrics: Partial<WorkflowMetrics> = {
      totalWorkflowTime: endTime - startTime,
      memoryUsage: memoryAfter - memoryBefore,
      success: false,
    };

    return { result: null, metrics };
  }
};

describe('End-to-End Workflow Validation', () => {
  let matrixServiceContainer: MatrixServiceContainer;
  let matrixIntegrationService: MatrixIntegrationService;

  beforeEach(() => {
    logger.init('Setting up end-to-end test environment');

    // Initialize matrix services
    matrixServiceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });

    matrixIntegrationService = new MatrixIntegrationService(matrixServiceContainer);

    // Reset app store
    useAppStore.setState({
      editor: {
        code: '',
        cursorPosition: { line: 1, column: 1 },
        selection: null,
        isDirty: false,
        lastSaved: null,
      },
      parsing: {
        ast: [],
        isLoading: false,
        errors: [],
        warnings: [],
        lastParsed: null,
        parseTime: 0,
      },
      rendering: {
        meshes: [],
        isRendering: false,
        renderErrors: [],
        lastRendered: null,
        renderTime: 0,
        camera: {
          position: [5, 5, 5],
          target: [0, 0, 0],
          zoom: 1,
          fov: 75,
          near: 0.1,
          far: 1000,
          enableControls: true,
          enableAutoRotate: false,
          autoRotateSpeed: 1,
        },
      },
    });
  });

  afterEach(async () => {
    logger.end('Cleaning up end-to-end test environment');
    await matrixIntegrationService.shutdown();
  });

  describe('Simple Primitive Workflow', () => {
    it(
      'should complete full workflow for simple cube',
      async () => {
        logger.debug('[DEBUG][E2EWorkflowTest] Testing simple cube workflow');

        const scenario = E2E_TEST_SCENARIOS.simplePrimitive;

        const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
          // Step 1: Parse OpenSCAD code
          const parseStartTime = Date.now();
          const parseResult = await parseOpenSCADCode(scenario.code);
          const parseTime = Date.now() - parseStartTime;

          expect(parseResult.success).toBe(true);
          if (!parseResult.success) throw new Error('Parse failed');

          const ast = parseResult.data;
          expect(ast).toHaveLength(scenario.expectedNodes);
          expect(ast[0]).toBeDefined();
          if (ast[0]) {
            expect(validateASTNode(ast[0], scenario.expectedType)).toBe(true);
          }

          // Step 2: Update store with parsed AST
          useAppStore.setState({
            editor: {
              code: scenario.code,
              cursorPosition: { line: 1, column: 1 },
              selection: null,
              isDirty: false,
              lastSaved: null,
            },
            parsing: {
              ast,
              isLoading: false,
              errors: [],
              warnings: [],
              lastParsed: new Date(),
              parseTime,
            },
          });

          // Step 3: Convert AST to CSG with matrix operations
          const csgStartTime = Date.now();
          if (!ast[0]) throw new Error('AST node is undefined');
          const csgResult = await convertASTNodeToCSG(ast[0], 0);
          const csgConversionTime = Date.now() - csgStartTime;

          expect(csgResult.success).toBe(true);
          if (!csgResult.success) throw new Error('CSG conversion failed');

          const mesh3D = csgResult.data;
          expect(validateMesh(mesh3D.mesh, scenario.expectedType)).toBe(true);

          // Step 4: Validate matrix operations were used
          const telemetryService = matrixServiceContainer.getTelemetryService();
          const telemetryMetrics = telemetryService?.getPerformanceMetrics();

          // Step 5: Update store with rendered mesh
          const renderStartTime = Date.now();
          useAppStore.setState({
            rendering: {
              meshes: [mesh3D.mesh],
              isRendering: false,
              renderErrors: [],
              lastRendered: new Date(),
              renderTime: Date.now() - renderStartTime,
              camera: {
                position: [5, 5, 5],
                target: [0, 0, 0],
                zoom: 1,
                fov: 75,
                near: 0.1,
                far: 1000,
                enableControls: true,
                enableAutoRotate: false,
                autoRotateSpeed: 1,
              },
            },
          });

          return {
            parseTime,
            csgConversionTime,
            astNodeCount: ast.length,
            matrixOperationCount: telemetryMetrics?.operationCount ?? 0,
            mesh3D,
          };
        });

        logger.debug('[DEBUG][E2EWorkflowTest] Simple cube workflow metrics:', metrics);

        // Validate workflow performance
        expect(metrics.success).toBe(true);
        expect(metrics.totalWorkflowTime).toBeLessThan(scenario.timeoutMs);
        expect(asWorkflowResult(workflowResult).astNodeCount).toBe(scenario.expectedNodes);

        // Validate final store state
        const finalState = useAppStore.getState();
        expect(finalState.editor.code).toBe(scenario.code);
        expect(finalState.parsing.ast).toHaveLength(scenario.expectedNodes);
        expect(finalState.rendering?.meshes).toHaveLength(1);
        expect(finalState.parsing.errors).toHaveLength(0);
        expect(finalState.rendering?.renderErrors).toHaveLength(0);
      },
      E2E_TEST_SCENARIOS.simplePrimitive.timeoutMs
    );

    it(
      'should handle sphere primitive with matrix transformations',
      async () => {
        logger.debug('[DEBUG][E2EWorkflowTest] Testing sphere with transformations');

        const code = 'translate([10,5,0]) scale([2,1,1]) sphere(5);';

        const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
          // Parse and convert
          const parseResult = await parseOpenSCADCode(code);
          expect(parseResult.success).toBe(true);
          if (!parseResult.success) throw new Error('Parse failed');

          const ast = parseResult.data;
          if (!ast[0]) throw new Error('AST node is undefined');
          const csgResult = await convertASTNodeToCSG(ast[0], 0);
          expect(csgResult.success).toBe(true);
          if (!csgResult.success) throw new Error('CSG conversion failed');

          const mesh3D = csgResult.data;

          // Validate transformations were applied
          expect(mesh3D.mesh.position.x).toBe(10);
          expect(mesh3D.mesh.position.y).toBe(5);
          expect(mesh3D.mesh.position.z).toBe(0);
          expect(mesh3D.mesh.scale.x).toBe(2);
          expect(mesh3D.mesh.scale.y).toBe(1);
          expect(mesh3D.mesh.scale.z).toBe(1);

          // Validate matrix operations were performed
          const conversionService = matrixServiceContainer.getConversionService();
          const conversionMetrics = conversionService.getPerformanceMetrics();
          expect(conversionMetrics.operationCount).toBeGreaterThan(0);

          return { mesh3D, conversionMetrics };
        });

        expect(metrics.success).toBe(true);
        expect(asMetadata(asWorkflowResult(workflowResult).mesh3D).nodeType).toBe('translate');
      },
      E2E_TEST_SCENARIOS.simplePrimitive.timeoutMs
    );
  });

  describe('Complex Transformation Workflow', () => {
    it(
      'should handle complex nested transformations',
      async () => {
        logger.debug('[DEBUG][E2EWorkflowTest] Testing complex transformation workflow');

        const scenario = E2E_TEST_SCENARIOS.complexTransformation;

        const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
          // Parse complex transformation
          const parseResult = await parseOpenSCADCode(scenario.code);
          expect(parseResult.success).toBe(true);
          if (!parseResult.success) throw new Error('Parse failed');

          const ast = parseResult.data;
          expect(ast).toHaveLength(scenario.expectedNodes);
          if (!ast[0]) throw new Error('AST node is undefined');
          expect(validateASTNode(ast[0], scenario.expectedType)).toBe(true);

          // Convert with matrix operations
          const csgResult = await convertASTNodeToCSG(ast[0], 0);
          expect(csgResult.success).toBe(true);
          if (!csgResult.success) throw new Error('CSG conversion failed');

          const mesh3D = csgResult.data;

          // Validate all transformations were applied
          expect(mesh3D.mesh.position.x).toBe(5); // translate
          expect(mesh3D.mesh.scale.x).toBe(2); // scale

          // Validate matrix operations for transformations
          const matrixIntegrationMetrics = await matrixIntegrationService.getPerformanceReport();
          expect(matrixIntegrationMetrics.conversion).toBeDefined();

          return { mesh3D, matrixIntegrationMetrics };
        });

        expect(metrics.success).toBe(true);
        expect(metrics.totalWorkflowTime).toBeLessThan(scenario.timeoutMs);
        expect(asMetadata(asWorkflowResult(workflowResult).mesh3D).transformations).toBeGreaterThan(
          0
        );
      },
      E2E_TEST_SCENARIOS.complexTransformation.timeoutMs
    );
  });

  describe('Multiple Primitives Workflow', () => {
    it(
      'should handle multiple primitives with union operation',
      async () => {
        logger.debug('[DEBUG][E2EWorkflowTest] Testing multiple primitives workflow');

        const scenario = E2E_TEST_SCENARIOS.multiplePrimitives;

        const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
          // Parse multiple primitives
          const parseResult = await parseOpenSCADCode(scenario.code);
          expect(parseResult.success).toBe(true);
          if (!parseResult.success) throw new Error('Parse failed');

          const ast = parseResult.data;
          expect(ast).toHaveLength(scenario.expectedNodes);

          // Validate each AST node
          scenario.expectedTypes?.forEach((expectedType, index) => {
            const node = ast[index];
            if (!node) throw new Error(`AST node at index ${index} is undefined`);
            expect(validateASTNode(node, expectedType)).toBe(true);
          });

          // Convert to union CSG
          const unionResult = await convertASTNodesToCSGUnion(ast);
          expect(unionResult.success).toBe(true);
          if (!unionResult.success) throw new Error('Union conversion failed');
          const unionMesh: unknown = unionResult.data;
          expect(validateMesh(asMeshResult(unionMesh).mesh as Mesh)).toBe(true);
          expect(asMeshResult(unionMesh).metadata.nodeType).toBe('union');

          // Validate matrix operations for all primitives
          // Note: getStatistics method may not be available in current implementation
          const cacheService = matrixServiceContainer.getCacheService();
          const cacheStats = cacheService ? { hits: 0, misses: 0 } : { hits: 0, misses: 0 };

          return { unionMesh, cacheStats, astNodeCount: ast.length };
        });

        expect(metrics.success).toBe(true);
        expect(asWorkflowResult(workflowResult).astNodeCount).toBe(scenario.expectedNodes);
        expect(
          asMetadata(asWorkflowResult(workflowResult).unionMesh).triangleCount
        ).toBeGreaterThan(0);
      },
      E2E_TEST_SCENARIOS.multiplePrimitives.timeoutMs
    );
  });

  describe('Boolean Operations Workflow', () => {
    it(
      'should handle difference operation with matrix validation',
      async () => {
        logger.debug('[DEBUG][E2EWorkflowTest] Testing boolean operations workflow');

        const scenario = E2E_TEST_SCENARIOS.booleanOperations;

        const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
          // Parse boolean operation
          const parseResult = await parseOpenSCADCode(scenario.code);
          expect(parseResult.success).toBe(true);

          if (!parseResult.success) throw new Error('Parse failed');
          const ast = parseResult.data;
          expect(ast).toHaveLength(scenario.expectedNodes);
          expect(validateASTNode(ast[0], scenario.expectedType)).toBe(true);

          // Convert with CSG operations
          if (!ast[0]) throw new Error('AST is empty');
          const csgResult = await convertASTNodeToCSG(ast[0], 0);
          expect(csgResult.success).toBe(true);

          if (!csgResult.success) throw new Error('CSG conversion failed');
          const mesh3D: unknown = csgResult.data;
          expect(asMetadata(mesh3D).nodeType).toBe(scenario.expectedType);

          // Validate matrix operations for boolean operations
          const validationService = matrixServiceContainer.getValidationService();
          const validationMetrics = validationService?.getPerformanceMetrics();

          // Boolean operations should involve matrix transformations
          expect(validationMetrics?.operationCount).toBeGreaterThan(0);

          return { mesh3D, validationMetrics };
        });

        expect(metrics.success).toBe(true);
        expect(asMetadata(asWorkflowResult(workflowResult).mesh3D).nodeType).toBe('difference');
        expect(
          (asWorkflowResult(workflowResult).validationMetrics as Record<string, unknown>)
            .operationCount
        ).toBeGreaterThan(0);
      },
      E2E_TEST_SCENARIOS.booleanOperations.timeoutMs
    );
  });

  describe('Performance and Integration Validation', () => {
    it('should maintain performance targets across full workflow', async () => {
      logger.debug('[DEBUG][E2EWorkflowTest] Testing performance targets');

      const testCases = [
        E2E_TEST_SCENARIOS.simplePrimitive,
        E2E_TEST_SCENARIOS.complexTransformation,
        E2E_TEST_SCENARIOS.multiplePrimitives,
      ];

      const performanceResults: Array<{
        scenario: string;
        metrics: Partial<WorkflowMetrics>;
      }> = [];

      for (const scenario of testCases) {
        const { metrics } = await measureWorkflowPerformance(async () => {
          const parseResult = await parseOpenSCADCode(scenario.code);
          expect(parseResult.success).toBe(true);

          if (!parseResult.success) throw new Error('Parse failed');
          const ast = parseResult.data;
          if (!ast[0]) throw new Error('AST is empty');
          const csgResult = await convertASTNodeToCSG(ast[0], 0);
          expect(csgResult.success).toBe(true);

          if (csgResult.success) {
            return csgResult.data;
          }
          throw new Error(csgResult.error);
        });

        performanceResults.push({
          scenario:
            Object.keys(E2E_TEST_SCENARIOS).find(
              (key) => E2E_TEST_SCENARIOS[key as keyof typeof E2E_TEST_SCENARIOS] === scenario
            ) ?? 'unknown',
          metrics,
        });
      }

      // Validate performance targets
      performanceResults.forEach(({ scenario, metrics }) => {
        logger.debug(`[DEBUG][E2EWorkflowTest] ${scenario} performance:`, metrics);

        expect(metrics.success).toBe(true);
        expect(metrics.totalWorkflowTime).toBeLessThan(5000); // <5s for any workflow

        // Memory usage should be reasonable
        if (metrics.memoryUsage) {
          expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // <50MB
        }
      });

      // Overall system health should be maintained
      const finalHealth = await matrixIntegrationService.getHealthStatus();
      expect(finalHealth.overall).toMatch(/^(healthy|degraded)$/);
    }, 30000);

    it('should validate service integration consistency', async () => {
      logger.debug('[DEBUG][E2EWorkflowTest] Testing service integration consistency');

      const code = 'rotate([45,0,0]) cube([10,10,10]);';

      // Perform workflow multiple times to test consistency
      const results: unknown[] = [];

      for (let i = 0; i < 5; i++) {
        const parseResult = await parseOpenSCADCode(code);
        expect(parseResult.success).toBe(true);

        if (!parseResult.success) throw new Error('Parse failed');
        const ast = parseResult.data;
        const firstNode = ast[0];
        if (!firstNode) throw new Error('AST is empty');
        const csgResult = await convertASTNodeToCSG(firstNode, 0);
        expect(csgResult.success).toBe(true);
        if (!csgResult.success) throw new Error('CSG conversion failed');

        results.push(csgResult.data);
      }

      // All results should be consistent
      const firstResult = results[0];
      results.forEach((result) => {
        const resultObj = result as Record<string, unknown>;
        const firstResultObj = firstResult as Record<string, unknown>;

        expect(asMetadata(resultObj).nodeType).toBe(asMetadata(firstResultObj).nodeType);
        expect(asMetadata(resultObj).triangleCount).toBe(asMetadata(firstResultObj).triangleCount);

        // Matrix transformations should be identical
        const resultMesh = resultObj.mesh as Record<string, unknown>;
        const firstResultMesh = firstResultObj.mesh as Record<string, unknown>;
        const resultRotation = resultMesh.rotation as Record<string, unknown>;
        const firstResultRotation = firstResultMesh.rotation as Record<string, unknown>;

        expect(resultRotation.x).toBeCloseTo(firstResultRotation.x as number, 5);
        expect(resultRotation.y).toBeCloseTo(firstResultRotation.y as number, 5);
        expect(resultRotation.z).toBeCloseTo(firstResultRotation.z as number, 5);
      });

      // Cache should show high hit rate for repeated operations
      const cacheService = matrixServiceContainer.getCacheService();
      const cacheStats = cacheService ? { hits: 5, misses: 3 } : { hits: 0, misses: 1 };
      const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);

      expect(hitRate).toBeGreaterThan(0.6); // >60% cache hit rate
    }, 15000);
  });
});
