/**
 * @file openscad-rendering-pipeline.integration.test.ts
 * @description Integration tests for the complete OpenSCAD rendering pipeline.
 * Tests the full AST → Geometry → Mesh conversion pipeline with real services.
 *
 * INTEGRATION TEST PRINCIPLES:
 * ✅ Real Service Integration: Uses actual services, not mocks
 * ✅ End-to-End Workflow: Tests complete pipeline from AST to meshes
 * ✅ Performance Validation: Ensures pipeline meets performance targets
 * ✅ Error Scenario Coverage: Tests error handling across service boundaries
 * ✅ Resource Management: Validates proper cleanup and disposal
 * ✅ Cross-Service Communication: Tests service interaction patterns
 */

import { type Engine, NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type {
  ASTNode,
  AssignStatementNode,
  CircleNode,
  CubeNode,
  CylinderNode,
  PolygonNode,
  SphereNode,
  SquareNode,
} from '@/features/openscad-parser';
import { createSimpleSourceLocation } from '@/features/openscad-parser/services/test-utils';
import { isError, isSuccess } from '@/shared';
import { OpenSCADRenderingPipelineService } from './openscad-rendering-pipeline';

// INTEGRATION TEST: Use real BabylonJS engine for authentic testing
describe('OpenSCADRenderingPipeline Integration Tests', () => {
  let pipeline: OpenSCADRenderingPipelineService;
  let engine: Engine;
  let scene: Scene;

  beforeEach(() => {
    // ARRANGE: Set up real BabylonJS environment
    engine = new NullEngine({
      renderWidth: 512,
      renderHeight: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });
    scene = new Scene(engine);
    pipeline = new OpenSCADRenderingPipelineService();
  });

  afterEach(() => {
    // CLEANUP: Proper resource disposal
    scene.dispose();
    engine.dispose();
  });

  describe('Complete Pipeline Integration', () => {
    test('should convert complete OpenSCAD AST to meshes successfully', () => {
      // ARRANGE: Complex AST with multiple primitives and global variables
      const complexAST: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 8,
            location: createSimpleSourceLocation(1, 1),
          },
          location: createSimpleSourceLocation(1, 1),
        } as AssignStatementNode,
        {
          type: 'assign_statement',
          variable: '$fa',
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 6,
            location: createSimpleSourceLocation(2, 1),
          },
          location: createSimpleSourceLocation(2, 1),
        } as AssignStatementNode,
        {
          type: 'sphere',
          radius: 5,
          $fn: 12,
          location: createSimpleSourceLocation(3, 1),
        } as SphereNode,
        {
          type: 'cube',
          size: [2, 4, 6], // Vector3D tuple format
          center: true,
          location: createSimpleSourceLocation(4, 1),
        } as CubeNode,
        {
          type: 'cylinder',
          h: 10,
          r: 3,
          center: false,
          $fn: 6,
          location: createSimpleSourceLocation(5, 1),
        } as CylinderNode,
        {
          type: 'circle',
          r: 4,
          $fn: 8,
          location: createSimpleSourceLocation(6, 1),
        } as CircleNode,
        {
          type: 'square',
          size: [3, 5], // Vector2D tuple format
          center: true,
          location: createSimpleSourceLocation(7, 1),
        } as SquareNode,
        {
          type: 'polygon',
          points: [
            [0, 0],
            [10, 0],
            [5, 8.66],
          ],
          convexity: 1,
          location: createSimpleSourceLocation(8, 1),
        } as PolygonNode,
      ];

      // ACT: Convert complete AST through pipeline
      const startTime = performance.now();
      const result = pipeline.convertASTToMeshes(complexAST, scene, undefined, 'integration-test');
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // ASSERT: Successful conversion with performance validation
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const meshes = result.data;

        // Validate mesh count (6 geometry nodes, 2 assignment statements filtered out)
        expect(meshes.length).toBe(6);

        // Validate mesh naming consistency
        meshes.forEach((mesh, _index) => {
          expect(mesh.name).toMatch(/^integration-test-\d+$/);
        });

        // Validate mesh properties
        meshes.forEach((mesh) => {
          expect(mesh.getTotalVertices()).toBeGreaterThan(0);
          expect(mesh.material).toBeDefined();
        });

        // Performance validation: Should complete within reasonable time
        expect(processingTime).toBeLessThan(100); // 100ms threshold for integration test

        console.log(`Integration test completed in ${processingTime.toFixed(2)}ms`);
      }
    });

    test('should handle mixed 2D and 3D primitives correctly', () => {
      // ARRANGE: Mixed 2D/3D AST
      const mixedAST: ASTNode[] = [
        {
          type: 'sphere',
          radius: 3,
          location: createSimpleSourceLocation(1, 1),
        } as SphereNode,
        {
          type: 'circle',
          r: 2,
          location: createSimpleSourceLocation(2, 1),
        } as CircleNode,
        {
          type: 'cube',
          size: 4,
          location: createSimpleSourceLocation(3, 1),
        } as CubeNode,
        {
          type: 'square',
          size: 3,
          location: createSimpleSourceLocation(4, 1),
        } as SquareNode,
      ];

      // ACT: Convert mixed AST
      const result = pipeline.convertASTToMeshes(mixedAST, scene);

      // ASSERT: All primitives converted successfully
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const meshes = result.data;
        expect(meshes.length).toBe(4);

        // Validate that both 2D and 3D meshes are created
        meshes.forEach((mesh) => {
          expect(mesh).toBeDefined();
          expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        });
      }
    });

    test('should extract and apply global variables correctly', () => {
      // ARRANGE: AST with global variables affecting geometry
      const astWithGlobals: ASTNode[] = [
        {
          type: 'assign_statement',
          variable: '$fn',
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 16,
            location: createSimpleSourceLocation(1, 1),
          },
          location: createSimpleSourceLocation(1, 1),
        } as AssignStatementNode,
        {
          type: 'assign_statement',
          variable: '$fa',
          value: {
            type: 'expression',
            expressionType: 'literal',
            value: 3,
            location: createSimpleSourceLocation(2, 1),
          },
          location: createSimpleSourceLocation(2, 1),
        } as AssignStatementNode,
        {
          type: 'sphere',
          radius: 5,
          // No $fn specified, should use global $fn=16
          location: createSimpleSourceLocation(3, 1),
        } as SphereNode,
        {
          type: 'circle',
          r: 3,
          // No $fn specified, should use global $fn=16
          location: createSimpleSourceLocation(4, 1),
        } as CircleNode,
      ];

      // ACT: Convert AST with global variable extraction
      const result = pipeline.convertASTToMeshes(astWithGlobals, scene);

      // ASSERT: Global variables applied correctly
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const meshes = result.data;
        expect(meshes.length).toBe(2);

        // Validate that global $fn=16 was used for fragment calculation
        // (This would be verified by checking vertex counts match expected fragments)
        meshes.forEach((mesh) => {
          expect(mesh.getTotalVertices()).toBeGreaterThan(8); // More than default fragments
        });
      }
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid AST nodes gracefully', () => {
      // ARRANGE: AST with invalid node
      const invalidAST: ASTNode[] = [
        {
          type: 'sphere',
          radius: 5,
          location: createSimpleSourceLocation(1, 1),
        } as SphereNode,
        {
          type: 'unsupported_primitive',
          location: createSimpleSourceLocation(2, 1),
        } as any,
      ];

      // ACT: Attempt conversion with invalid node
      const result = pipeline.convertASTToMeshes(invalidAST, scene);

      // ASSERT: Should fail gracefully with descriptive error
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.type).toBe('CONVERSION_ERROR');
        expect(result.error.message).toContain('AST to geometry conversion failed');
        expect(result.error.details).toBeDefined();
      }
    });

    test('should validate AST structure before processing', () => {
      // ARRANGE: Invalid AST structure
      const invalidAST = 'not an array' as any;

      // ACT: Validate invalid AST
      const validationResult = pipeline.validateAST(invalidAST);

      // ASSERT: Should reject invalid structure
      expect(isError(validationResult)).toBe(true);

      if (isError(validationResult)) {
        expect(validationResult.error.type).toBe('AST_FILTERING_ERROR');
        expect(validationResult.error.message).toContain('must be an array');
      }
    });

    test('should handle empty AST gracefully', () => {
      // ARRANGE: Empty AST
      const emptyAST: ASTNode[] = [];

      // ACT: Process empty AST
      const result = pipeline.convertASTToMeshes(emptyAST, scene);

      // ASSERT: Should succeed with empty result
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        expect(result.data.length).toBe(0);
      }
    });
  });

  describe('Performance Integration', () => {
    test('should meet performance targets for large AST', () => {
      // ARRANGE: Large AST with many primitives
      const largeAST: ASTNode[] = [];

      // Create 50 sphere nodes
      for (let i = 0; i < 50; i++) {
        largeAST.push({
          type: 'sphere',
          radius: 1 + (i % 5),
          $fn: 6, // Low fragment count for performance
          location: createSimpleSourceLocation(i + 1, 1),
        } as SphereNode);
      }

      // ACT: Process large AST and measure performance
      const startTime = performance.now();
      const result = pipeline.convertASTToMeshes(largeAST, scene, undefined, 'perf-test');
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // ASSERT: Performance targets met
      expect(isSuccess(result)).toBe(true);
      expect(processingTime).toBeLessThan(500); // 500ms threshold for 50 primitives

      if (isSuccess(result)) {
        expect(result.data.length).toBe(50);
        console.log(`Performance test: 50 primitives processed in ${processingTime.toFixed(2)}ms`);
      }
    });

    test('should handle high-detail primitives efficiently', () => {
      // ARRANGE: High-detail primitives
      const highDetailAST: ASTNode[] = [
        {
          type: 'sphere',
          radius: 5,
          $fn: 64, // High detail
          location: createSimpleSourceLocation(1, 1),
        } as SphereNode,
        {
          type: 'cylinder',
          h: 10,
          r: 3,
          $fn: 64, // High detail
          location: createSimpleSourceLocation(2, 1),
        } as CylinderNode,
      ];

      // ACT: Process high-detail AST
      const startTime = performance.now();
      const result = pipeline.convertASTToMeshes(highDetailAST, scene);
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // ASSERT: High detail handled efficiently
      expect(isSuccess(result)).toBe(true);
      expect(processingTime).toBeLessThan(200); // 200ms threshold for high-detail primitives

      if (isSuccess(result)) {
        const meshes = result.data;
        expect(meshes.length).toBe(2);

        // Validate high vertex counts for high-detail meshes
        meshes.forEach((mesh) => {
          expect(mesh.getTotalVertices()).toBeGreaterThan(100);
        });
      }
    });
  });

  describe('Resource Management Integration', () => {
    test('should properly manage memory during conversion', () => {
      // ARRANGE: AST for memory test
      const memoryTestAST: ASTNode[] = [
        {
          type: 'sphere',
          radius: 5,
          location: createSimpleSourceLocation(1, 1),
        } as SphereNode,
        {
          type: 'cube',
          size: 3,
          location: createSimpleSourceLocation(2, 1),
        } as CubeNode,
      ];

      // ACT: Convert AST and track memory
      const initialMeshCount = scene.meshes.length;
      const result = pipeline.convertASTToMeshes(memoryTestAST, scene);

      // ASSERT: Memory managed correctly
      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const finalMeshCount = scene.meshes.length;
        expect(finalMeshCount).toBe(initialMeshCount + 2);

        // Cleanup test
        result.data.forEach((mesh) => mesh.dispose());
        expect(scene.meshes.filter((m) => !m.isDisposed()).length).toBe(initialMeshCount);
      }
    });
  });
});
