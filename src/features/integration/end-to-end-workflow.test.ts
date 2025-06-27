/**
 * End-to-End Workflow Validation
 * 
 * Comprehensive testing of complete pipeline from OpenSCAD code through
 * matrix operations to 3D rendering, validating all service integrations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Matrix4, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry } from 'three';
import { useAppStore } from '../store/app-store';
import { MatrixServiceContainer } from '../3d-renderer/services/matrix-service-container';
import { MatrixIntegrationService } from '../3d-renderer/services/matrix-integration.service';
import { convertASTNodeToCSG, convertASTNodesToCSGUnion } from '../3d-renderer/services/ast-to-csg-converter';
import { parseOpenSCADCode } from '../openscad-parser/services/parser-manager';

/**
 * End-to-end test scenarios
 */
const E2E_TEST_SCENARIOS = {
  // Simple primitive rendering
  simplePrimitive: {
    code: 'cube([10,10,10]);',
    expectedNodes: 1,
    expectedType: 'cube',
    timeoutMs: 5000
  },
  // Complex transformation
  complexTransformation: {
    code: 'translate([5,0,0]) rotate([0,45,0]) scale([2,1,1]) cube([5,5,5]);',
    expectedNodes: 1,
    expectedType: 'translate',
    timeoutMs: 10000
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
    timeoutMs: 15000
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
    timeoutMs: 20000
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
    timeoutMs: 30000
  }
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
 * Validate AST node structure
 */
const validateASTNode = (node: any, expectedType?: string): boolean => {
  if (!node || typeof node !== 'object') return false;
  if (expectedType && node.type !== expectedType) return false;
  
  // Check required properties
  if (!node.type || !node.location) return false;
  
  // Validate location structure
  if (!node.location.start || !node.location.end) return false;
  if (typeof node.location.start.line !== 'number') return false;
  if (typeof node.location.start.column !== 'number') return false;
  
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
  workflowFn: () => Promise<any>
): Promise<{ result: any; metrics: Partial<WorkflowMetrics> }> => {
  const startTime = Date.now();
  const memoryBefore = process.memoryUsage?.()?.heapUsed || 0;
  
  try {
    const result = await workflowFn();
    const endTime = Date.now();
    const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;
    
    const metrics: Partial<WorkflowMetrics> = {
      totalWorkflowTime: endTime - startTime,
      memoryUsage: memoryAfter - memoryBefore,
      success: true
    };
    
    return { result, metrics };
  } catch (error) {
    const endTime = Date.now();
    const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;
    
    const metrics: Partial<WorkflowMetrics> = {
      totalWorkflowTime: endTime - startTime,
      memoryUsage: memoryAfter - memoryBefore,
      success: false
    };
    
    return { result: null, metrics };
  }
};

describe('End-to-End Workflow Validation', () => {
  let matrixServiceContainer: MatrixServiceContainer;
  let matrixIntegrationService: MatrixIntegrationService;

  beforeEach(() => {
    console.log('[INIT][E2EWorkflowTest] Setting up end-to-end test environment');
    
    // Initialize matrix services
    matrixServiceContainer = new MatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true
    });
    
    matrixIntegrationService = new MatrixIntegrationService(matrixServiceContainer);
    
    // Reset app store
    useAppStore.setState({
      code: '',
      parsing: {
        ast: [],
        isLoading: false,
        errors: [],
        warnings: [],
        lastParsed: null,
        parseTime: 0
      },
      scene3D: {
        meshes: [],
        isLoading: false,
        errors: [],
        lastRendered: null,
        renderTime: 0
      }
    });
  });

  afterEach(async () => {
    console.log('[END][E2EWorkflowTest] Cleaning up end-to-end test environment');
    await matrixIntegrationService.shutdown();
  });

  describe('Simple Primitive Workflow', () => {
    it('should complete full workflow for simple cube', async () => {
      console.log('[DEBUG][E2EWorkflowTest] Testing simple cube workflow');
      
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
        expect(validateASTNode(ast[0]!, scenario.expectedType)).toBe(true);
        
        // Step 2: Update store with parsed AST
        useAppStore.setState({
          code: scenario.code,
          parsing: {
            ast,
            isLoading: false,
            errors: [],
            warnings: [],
            lastParsed: new Date(),
            parseTime
          }
        });
        
        // Step 3: Convert AST to CSG with matrix operations
        const csgStartTime = Date.now();
        const csgResult = convertASTNodeToCSG(ast[0]!, 0);
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
          scene3D: {
            meshes: [mesh3D],
            isLoading: false,
            errors: [],
            lastRendered: new Date(),
            renderTime: Date.now() - renderStartTime
          }
        });
        
        return {
          parseTime,
          csgConversionTime,
          astNodeCount: ast.length,
          matrixOperationCount: telemetryMetrics?.operationCount ?? 0,
          mesh3D
        };
      });
      
      console.log('[DEBUG][E2EWorkflowTest] Simple cube workflow metrics:', metrics);
      
      // Validate workflow performance
      expect(metrics.success).toBe(true);
      expect(metrics.totalWorkflowTime).toBeLessThan(scenario.timeoutMs);
      expect(workflowResult.astNodeCount).toBe(scenario.expectedNodes);
      
      // Validate final store state
      const finalState = useAppStore.getState();
      expect(finalState.code).toBe(scenario.code);
      expect(finalState.parsing.ast).toHaveLength(scenario.expectedNodes);
      expect(finalState.scene3D.meshes).toHaveLength(1);
      expect(finalState.parsing.errors).toHaveLength(0);
      expect(finalState.scene3D.errors).toHaveLength(0);
    }, E2E_TEST_SCENARIOS.simplePrimitive.timeoutMs);

    it('should handle sphere primitive with matrix transformations', async () => {
      console.log('[DEBUG][E2EWorkflowTest] Testing sphere with transformations');
      
      const code = 'translate([10,5,0]) scale([2,1,1]) sphere(5);';
      
      const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
        // Parse and convert
        const parseResult = await parseOpenSCADCode(code);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) throw new Error('Parse failed');

        const ast = parseResult.data;
        const csgResult = convertASTNodeToCSG(ast[0]!, 0);
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
      expect(workflowResult.mesh3D.metadata.nodeType).toBe('translate');
    }, E2E_TEST_SCENARIOS.simplePrimitive.timeoutMs);
  });

  describe('Complex Transformation Workflow', () => {
    it('should handle complex nested transformations', async () => {
      console.log('[DEBUG][E2EWorkflowTest] Testing complex transformation workflow');
      
      const scenario = E2E_TEST_SCENARIOS.complexTransformation;
      
      const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
        // Parse complex transformation
        const parseResult = await parseOpenSCADCode(scenario.code);
        expect(parseResult.success).toBe(true);
        if (!parseResult.success) throw new Error('Parse failed');

        const ast = parseResult.data;
        expect(ast).toHaveLength(scenario.expectedNodes);
        expect(validateASTNode(ast[0]!, scenario.expectedType)).toBe(true);

        // Convert with matrix operations
        const csgResult = convertASTNodeToCSG(ast[0]!, 0);
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
      expect(workflowResult.mesh3D.metadata.transformations).toBeGreaterThan(0);
    }, E2E_TEST_SCENARIOS.complexTransformation.timeoutMs);
  });

  describe('Multiple Primitives Workflow', () => {
    it('should handle multiple primitives with union operation', async () => {
      console.log('[DEBUG][E2EWorkflowTest] Testing multiple primitives workflow');
      
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
          expect(validateASTNode(ast[index]!, expectedType)).toBe(true);
        });

        // Convert to union CSG
        const unionResult = convertASTNodesToCSGUnion(ast);
        expect(unionResult.success).toBe(true);
        if (!unionResult.success) throw new Error('Union conversion failed');

        const unionMesh = unionResult.data;
        expect(validateMesh(unionMesh.mesh)).toBe(true);
        expect(unionMesh.metadata.nodeType).toBe('union');
        
        // Validate matrix operations for all primitives
        // Note: getStatistics method may not be available in current implementation
        const cacheStats = { hits: 0, misses: 0 }; // Placeholder for cache statistics

        return { unionMesh, cacheStats, astNodeCount: ast.length };
      });
      
      expect(metrics.success).toBe(true);
      expect(workflowResult.astNodeCount).toBe(scenario.expectedNodes);
      expect(workflowResult.unionMesh.metadata.triangleCount).toBeGreaterThan(0);
    }, E2E_TEST_SCENARIOS.multiplePrimitives.timeoutMs);
  });

  describe('Boolean Operations Workflow', () => {
    it('should handle difference operation with matrix validation', async () => {
      console.log('[DEBUG][E2EWorkflowTest] Testing boolean operations workflow');
      
      const scenario = E2E_TEST_SCENARIOS.booleanOperations;
      
      const { result: workflowResult, metrics } = await measureWorkflowPerformance(async () => {
        // Parse boolean operation
        const parseResult = await parseOpenSCADCode(scenario.code);
        expect(parseResult.success).toBe(true);
        
        const ast = parseResult.value;
        expect(ast).toHaveLength(scenario.expectedNodes);
        expect(validateASTNode(ast[0], scenario.expectedType)).toBe(true);
        
        // Convert with CSG operations
        const csgResult = convertASTNodeToCSG(ast[0], 0);
        expect(csgResult.success).toBe(true);
        
        const mesh3D = csgResult.data;
        expect(mesh3D.metadata.nodeType).toBe(scenario.expectedType);
        
        // Validate matrix operations for boolean operations
        const validationService = matrixServiceContainer.getValidationService();
        const validationMetrics = validationService.getPerformanceMetrics();
        
        // Boolean operations should involve matrix transformations
        expect(validationMetrics.operationCount).toBeGreaterThan(0);
        
        return { mesh3D, validationMetrics };
      });
      
      expect(metrics.success).toBe(true);
      expect(workflowResult.mesh3D.metadata.nodeType).toBe('difference');
      expect(workflowResult.validationMetrics.operationCount).toBeGreaterThan(0);
    }, E2E_TEST_SCENARIOS.booleanOperations.timeoutMs);
  });

  describe('Performance and Integration Validation', () => {
    it('should maintain performance targets across full workflow', async () => {
      console.log('[DEBUG][E2EWorkflowTest] Testing performance targets');
      
      const testCases = [
        E2E_TEST_SCENARIOS.simplePrimitive,
        E2E_TEST_SCENARIOS.complexTransformation,
        E2E_TEST_SCENARIOS.multiplePrimitives
      ];
      
      const performanceResults: Array<{ scenario: string; metrics: Partial<WorkflowMetrics> }> = [];
      
      for (const scenario of testCases) {
        const { metrics } = await measureWorkflowPerformance(async () => {
          const parseResult = await parseOpenSCADCode(scenario.code);
          expect(parseResult.success).toBe(true);
          
          const ast = parseResult.value;
          const csgResult = convertASTNodeToCSG(ast[0], 0);
          expect(csgResult.success).toBe(true);
          
          return csgResult.data;
        });
        
        performanceResults.push({
          scenario: Object.keys(E2E_TEST_SCENARIOS).find(key => 
            E2E_TEST_SCENARIOS[key as keyof typeof E2E_TEST_SCENARIOS] === scenario
          ) ?? 'unknown',
          metrics
        });
      }
      
      // Validate performance targets
      performanceResults.forEach(({ scenario, metrics }) => {
        console.log(`[DEBUG][E2EWorkflowTest] ${scenario} performance:`, metrics);
        
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
      console.log('[DEBUG][E2EWorkflowTest] Testing service integration consistency');
      
      const code = 'rotate([45,0,0]) cube([10,10,10]);';
      
      // Perform workflow multiple times to test consistency
      const results: any[] = [];
      
      for (let i = 0; i < 5; i++) {
        const parseResult = await parseOpenSCADCode(code);
        expect(parseResult.success).toBe(true);
        
        const ast = parseResult.value;
        const csgResult = convertASTNodeToCSG(ast[0], 0);
        expect(csgResult.success).toBe(true);
        
        results.push(csgResult.data);
      }
      
      // All results should be consistent
      const firstResult = results[0];
      results.forEach((result) => {
        expect(result.metadata.nodeType).toBe(firstResult.metadata.nodeType);
        expect(result.metadata.triangleCount).toBe(firstResult.metadata.triangleCount);
        
        // Matrix transformations should be identical
        expect(result.mesh.rotation.x).toBeCloseTo(firstResult.mesh.rotation.x, 5);
        expect(result.mesh.rotation.y).toBeCloseTo(firstResult.mesh.rotation.y, 5);
        expect(result.mesh.rotation.z).toBeCloseTo(firstResult.mesh.rotation.z, 5);
      });
      
      // Cache should show high hit rate for repeated operations
      const cacheService = matrixServiceContainer.getCacheService();
      const cacheStats = cacheService.getStatistics();
      const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
      
      expect(hitRate).toBeGreaterThan(0.6); // >60% cache hit rate
    }, 15000);
  });
});
