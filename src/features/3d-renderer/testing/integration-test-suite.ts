/**
 * Integration Test Suite
 *
 * Comprehensive integration tests for the complete OpenSCAD processing pipeline:
 * Monaco Editor → AST parsing → CSG operations → Three.js rendering
 */

import type * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { error, success } from '../../../shared/utils/functional/result.js';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import { convertASTNodeToCSG } from '../services/ast-to-csg-converter.js';
import { MaterialService } from '../services/material.service.js';
import { MatrixIntegrationService } from '../services/matrix-integration.service.js';
import { MatrixServiceContainer } from '../services/matrix-service-container.js';
import type { MaterialConfig, Mesh3D } from '../types/renderer.types.js';
import { matrixOperationTester, type PerformanceAssertion } from './matrix-test-utils.js';

const logger = createLogger('IntegrationTestSuite');

/**
 * Integration test configuration
 */
export interface IntegrationTestConfig {
  readonly enablePerformanceValidation: boolean;
  readonly maxRenderTime: number;
  readonly maxMemoryUsage: number;
  readonly validateVisualOutput: boolean;
  readonly enableMatrixValidation: boolean;
}

/**
 * Pipeline test result
 */
export interface PipelineTestResult {
  success: boolean;
  stages: {
    astParsing: { success: boolean; duration: number; error?: string };
    csgConversion: { success: boolean; duration: number; error?: string };
    matrixOperations: { success: boolean; duration: number; error?: string };
    rendering: { success: boolean; duration: number; error?: string };
  };
  totalDuration: number;
  memoryUsage: number;
  outputMesh?: THREE.Mesh;
  error?: string;
}

/**
 * Integration Test Suite
 */
export class IntegrationTestSuite {
  private readonly config: IntegrationTestConfig;
  private readonly performanceAssertion: PerformanceAssertion;
  private readonly materialService: MaterialService;
  private readonly matrixServiceContainer: MatrixServiceContainer;
  private readonly matrixIntegrationService: MatrixIntegrationService;

  constructor(config: Partial<IntegrationTestConfig> = {}) {
    this.config = {
      enablePerformanceValidation: true,
      maxRenderTime: 16, // <16ms requirement
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB
      validateVisualOutput: true,
      enableMatrixValidation: true,
      ...config,
    };

    this.performanceAssertion = matrixOperationTester.getPerformanceAssertion();
    this.materialService = new MaterialService();
    this.matrixServiceContainer = new MatrixServiceContainer();
    this.matrixIntegrationService = new MatrixIntegrationService(this.matrixServiceContainer);
  }

  /**
   * Test complete OpenSCAD processing pipeline
   */
  async testCompletePipeline(
    openscadCode: string,
    expectedPrimitiveType?: string
  ): Promise<Result<PipelineTestResult, string>> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    logger.init(`Testing complete pipeline for: ${openscadCode.substring(0, 50)}...`);

    const result: PipelineTestResult = {
      success: false,
      stages: {
        astParsing: { success: false, duration: 0 },
        csgConversion: { success: false, duration: 0 },
        matrixOperations: { success: false, duration: 0 },
        rendering: { success: false, duration: 0 },
      },
      totalDuration: 0,
      memoryUsage: 0,
    };

    try {
      // Stage 1: AST Parsing (simulated - would normally use OpenSCAD parser)
      const astStageStart = performance.now();
      const astResult = await this.simulateASTGeneration(openscadCode, expectedPrimitiveType);
      const astStageEnd = performance.now();

      result.stages.astParsing = {
        success: astResult.success,
        duration: astStageEnd - astStageStart,
        ...(astResult.success ? {} : { error: astResult.error }),
      };

      if (!astResult.success) {
        result.error = `AST parsing failed: ${astResult.error}`;
        return success(result);
      }

      // Stage 2: CSG Conversion
      const csgStageStart = performance.now();
      const csgResult = await this.testCSGConversion(astResult.data);
      const csgStageEnd = performance.now();

      result.stages.csgConversion = {
        success: csgResult.success,
        duration: csgStageEnd - csgStageStart,
        ...(csgResult.success ? {} : { error: csgResult.error }),
      };

      if (!csgResult.success) {
        result.error = `CSG conversion failed: ${csgResult.error}`;
        return success(result);
      }

      // Stage 3: Matrix Operations
      const matrixStageStart = performance.now();
      const matrixResult = await this.testMatrixOperations(csgResult.data);
      const matrixStageEnd = performance.now();

      result.stages.matrixOperations = {
        success: matrixResult.success,
        duration: matrixStageEnd - matrixStageStart,
        ...(matrixResult.success ? {} : { error: matrixResult.error }),
      };

      if (!matrixResult.success) {
        result.error = `Matrix operations failed: ${matrixResult.error}`;
        return success(result);
      }

      // Stage 4: Three.js Rendering
      const renderStageStart = performance.now();
      const renderResult = await this.testThreeJSRendering(matrixResult.data);
      const renderStageEnd = performance.now();

      result.stages.rendering = {
        success: renderResult.success,
        duration: renderStageEnd - renderStageStart,
        ...(renderResult.success ? {} : { error: renderResult.error }),
      };

      if (!renderResult.success) {
        result.error = `Rendering failed: ${renderResult.error}`;
        return success(result);
      }

      // Calculate final metrics
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      result.success = true;
      result.totalDuration = endTime - startTime;
      result.memoryUsage = endMemory - startMemory;
      result.outputMesh = renderResult.data;

      // Performance validation
      if (this.config.enablePerformanceValidation) {
        const perfResult = await this.validatePerformance(result);
        if (!perfResult.success) {
          result.error = `Performance validation failed: ${perfResult.error}`;
          result.success = false;
        }
      }

      logger.end(
        `Pipeline test completed: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.totalDuration.toFixed(2)}ms)`
      );

      return success(result);
    } catch (err) {
      const endTime = performance.now();
      result.totalDuration = endTime - startTime;
      result.error = `Pipeline test error: ${err instanceof Error ? err.message : String(err)}`;

      logger.error('Pipeline test failed:', err);

      return success(result);
    }
  }

  /**
   * Test multiple OpenSCAD primitives
   */
  async testMultiplePrimitives(): Promise<
    Result<
      {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        results: Array<{ code: string; result: PipelineTestResult }>;
      },
      string
    >
  > {
    const testCases = [
      { code: 'cube([10,10,10]);', type: 'cube' },
      { code: 'sphere(r=5);', type: 'sphere' },
      { code: 'cylinder(h=10, r=3);', type: 'cylinder' },
      { code: 'translate([5,0,0]) cube([5,5,5]);', type: 'translate' },
      { code: 'rotate([0,0,45]) cube([10,10,10]);', type: 'rotate' },
      { code: 'scale([2,1,1]) sphere(r=3);', type: 'scale' },
    ];

    const results: Array<{ code: string; result: PipelineTestResult }> = [];
    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
      logger.debug(`[DEBUG][IntegrationTestSuite] Testing: ${testCase.code}`);

      const pipelineResult = await this.testCompletePipeline(testCase.code, testCase.type);

      if (pipelineResult.success) {
        const testResult = pipelineResult.data;
        results.push({ code: testCase.code, result: testResult });

        if (testResult.success) {
          passedTests++;
        } else {
          failedTests++;
        }
      } else {
        failedTests++;
        results.push({
          code: testCase.code,
          result: {
            success: false,
            stages: {
              astParsing: { success: false, duration: 0, error: pipelineResult.error },
              csgConversion: { success: false, duration: 0 },
              matrixOperations: { success: false, duration: 0 },
              rendering: { success: false, duration: 0 },
            },
            totalDuration: 0,
            memoryUsage: 0,
            error: pipelineResult.error,
          },
        });
      }
    }

    return success({
      totalTests: testCases.length,
      passedTests,
      failedTests,
      results,
    });
  }

  /**
   * Simulate AST generation (would normally use real OpenSCAD parser)
   */
  private async simulateASTGeneration(
    code: string,
    expectedType?: string
  ): Promise<Result<ASTNode, string>> {
    try {
      // Simple simulation based on code patterns
      if (code.includes('cube(')) {
        return success({
          type: 'cube',
          size: [10, 10, 10],
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: code.length, offset: code.length - 1 },
          },
        } as ASTNode);
      }

      if (code.includes('sphere(')) {
        return success({
          type: 'sphere',
          radius: 5,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: code.length, offset: code.length - 1 },
          },
        } as ASTNode);
      }

      if (code.includes('cylinder(')) {
        return success({
          type: 'cylinder',
          h: 10,
          r: 3,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: code.length, offset: code.length - 1 },
          },
        } as ASTNode);
      }

      // Handle transformations
      if (code.includes('translate(') || code.includes('rotate(') || code.includes('scale(')) {
        return success({
          type: expectedType || 'transform',
          children: [
            {
              type: 'cube',
              size: [10, 10, 10],
              center: false,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: code.length, offset: code.length - 1 },
              },
            },
          ],
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: code.length, offset: code.length - 1 },
          },
        } as ASTNode);
      }

      return error(`Unsupported OpenSCAD code: ${code}`);
    } catch (err) {
      return error(`AST generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Test CSG conversion stage
   */
  private async testCSGConversion(astNode: ASTNode): Promise<Result<Mesh3D, string>> {
    try {
      const result = await convertASTNodeToCSG(astNode, 0);
      return result;
    } catch (err) {
      return error(`CSG conversion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Test matrix operations stage
   */
  private async testMatrixOperations(mesh: Mesh3D): Promise<Result<Mesh3D, string>> {
    if (!this.config.enableMatrixValidation) {
      return success(mesh);
    }

    try {
      // Test matrix validation on the mesh's transformation matrix
      const matrixResult = await this.matrixIntegrationService.convertMatrix4ToMLMatrix(
        mesh.mesh.matrix,
        {
          useValidation: true,
          useTelemetry: true,
        }
      );

      if (!matrixResult.success) {
        return error(`Matrix validation failed: ${matrixResult.error}`);
      }

      return success(mesh);
    } catch (err) {
      return error(`Matrix operations failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Test Three.js rendering stage
   */
  private async testThreeJSRendering(mesh: Mesh3D): Promise<Result<THREE.Mesh, string>> {
    try {
      // Create material
      const materialConfig: MaterialConfig = {
        color: '#00ff88',
        opacity: 1,
        metalness: 0.1,
        roughness: 0.8,
        wireframe: false,
        transparent: false,
        side: 'front',
      };

      const materialResult = this.materialService.createMaterial(materialConfig);
      if (!materialResult.success) {
        return error(`Material creation failed: ${materialResult.error}`);
      }

      // Create Three.js mesh (use the existing mesh from Mesh3D)
      const threeMesh = mesh.mesh.clone();
      threeMesh.material = materialResult.data;
      threeMesh.matrixAutoUpdate = false;

      // Validate mesh properties
      if (!threeMesh.geometry || !threeMesh.material) {
        return error('Invalid mesh: missing geometry or material');
      }

      if (this.config.validateVisualOutput) {
        const validationResult = this.validateMeshOutput(threeMesh);
        if (!validationResult.success) {
          return error(`Mesh validation failed: ${validationResult.error}`);
        }
      }

      return success(threeMesh);
    } catch (err) {
      return error(
        `Three.js rendering failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Validate performance requirements
   */
  private async validatePerformance(result: PipelineTestResult): Promise<Result<void, string>> {
    if (result.totalDuration > this.config.maxRenderTime) {
      return error(
        `Performance requirement failed: total duration ${result.totalDuration.toFixed(2)}ms exceeds limit of ${this.config.maxRenderTime}ms`
      );
    }

    if (result.memoryUsage > this.config.maxMemoryUsage) {
      return error(
        `Memory requirement failed: usage ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(this.config.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`
      );
    }

    return success(undefined);
  }

  /**
   * Validate mesh output
   */
  private validateMeshOutput(mesh: THREE.Mesh): Result<void, string> {
    try {
      // Check geometry
      if (!mesh.geometry.attributes.position) {
        return error('Mesh geometry missing position attribute');
      }

      const positionCount = mesh.geometry.attributes.position.count;
      if (positionCount === 0) {
        return error('Mesh geometry has no vertices');
      }

      // Check material
      if (!mesh.material) {
        return error('Mesh missing material');
      }

      // Check matrix
      if (!mesh.matrix) {
        return error('Mesh missing transformation matrix');
      }

      return success(undefined);
    } catch (err) {
      return error(`Mesh validation error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    logger.end('Disposing Integration Test Suite');
    this.materialService.dispose();
    this.matrixServiceContainer.shutdown();
  }
}

/**
 * Default integration test suite instance
 */
export const integrationTestSuite = new IntegrationTestSuite();
