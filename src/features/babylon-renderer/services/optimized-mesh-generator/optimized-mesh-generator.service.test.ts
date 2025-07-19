/**
 * @file Optimized Mesh Generator Service Tests
 *
 * Tests for the OptimizedMeshGeneratorService with real BabylonJS NullEngine.
 * Following TDD principles with comprehensive integration testing.
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ASTNode } from '../../../openscad-parser/core/ast-types';
import {
  type OptimizationConfig,
  OptimizedMeshGenerationErrorCode,
  OptimizedMeshGeneratorService,
} from './optimized-mesh-generator.service';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('OptimizedMeshGeneratorService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let service: OptimizedMeshGeneratorService;

  beforeEach(async () => {
    // Create a null engine (headless)
    engine = new NullEngine();

    // Create a real scene
    scene = new Scene(engine);

    // Create service
    service = new OptimizedMeshGeneratorService(scene);
  });

  afterEach(() => {
    service.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);
    });

    it('should fail mesh generation when not initialized', async () => {
      const astNode: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(OptimizedMeshGenerationErrorCode.SERVICE_NOT_READY);
      }
    });
  });

  describe('mesh generation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should generate optimized mesh for cube', async () => {
      const astNode: ASTNode = {
        type: 'cube',
        size: [2, 2, 2],
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.originalComplexity).toBeGreaterThanOrEqual(0);
        expect(result.data.optimizedComplexity).toBeGreaterThanOrEqual(0);
        expect(result.data.generationTime).toBeGreaterThan(0);
        expect(result.data.optimizationTime).toBeGreaterThanOrEqual(0);
        expect(result.data.performanceGain).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate optimized mesh for sphere', async () => {
      const astNode: ASTNode = {
        type: 'sphere',
        radius: 1.5,
        $fn: 32,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      };

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.originalComplexity).toBeGreaterThanOrEqual(0);
        expect(result.data.optimizedComplexity).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate optimized mesh for cylinder', async () => {
      const astNode: ASTNode = {
        type: 'cylinder',
        h: 3,
        r: 1,
        $fn: 16,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.originalComplexity).toBeGreaterThanOrEqual(0);
        expect(result.data.optimizedComplexity).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle unsupported AST node types', async () => {
      const astNode = {
        type: 'unsupported_type',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      } as unknown as ASTNode;

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(OptimizedMeshGenerationErrorCode.MESH_GENERATION_FAILED);
      }
    });
  });

  describe('optimization configuration', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should respect LOD enablement setting', async () => {
      const astNode: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      // Test with LOD disabled
      const resultDisabled = await service.generateOptimizedMesh(astNode, {
        optimization: { enableLOD: false },
      });

      expect(resultDisabled.success).toBe(true);
      if (resultDisabled.success) {
        expect(resultDisabled.data.lodApplied).toBe(false);
      }

      // Test with LOD enabled
      const resultEnabled = await service.generateOptimizedMesh(astNode, {
        optimization: { enableLOD: true },
      });

      expect(resultEnabled.success).toBe(true);
      if (resultEnabled.success) {
        // LOD may or may not be applied depending on complexity threshold
        expect(resultEnabled.data.lodApplied).toBeDefined();
      }
    });

    it('should respect complexity threshold', async () => {
      const astNode: ASTNode = {
        type: 'sphere',
        radius: 1,
        $fn: 8, // Low complexity
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      };

      // Set very high threshold - LOD should not be applied
      const result = await service.generateOptimizedMesh(astNode, {
        optimization: {
          enableLOD: true,
          complexityThreshold: 10000,
          autoOptimize: true,
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lodApplied).toBe(false);
      }
    });

    it('should allow configuration updates', async () => {
      const newConfig: Partial<OptimizationConfig> = {
        enableLOD: false,
        complexityThreshold: 500,
        lodQuality: 'high',
      };

      // Should not throw
      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('performance metrics', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should provide performance metrics', async () => {
      const metrics = service.getPerformanceMetrics();

      // Metrics may be null if performance optimization service is not ready
      if (metrics) {
        expect(metrics.frameRate).toBeGreaterThanOrEqual(0);
        expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
        expect(metrics.triangleCount).toBeGreaterThanOrEqual(0);
        expect(metrics.meshCount).toBeGreaterThanOrEqual(0);
        expect(metrics.lastUpdated).toBeInstanceOf(Date);
      }
    });
  });

  describe('service lifecycle', () => {
    it('should dispose cleanly', async () => {
      await service.initialize();

      // Should not throw
      expect(() => service.dispose()).not.toThrow();
    });

    it('should handle multiple dispose calls', async () => {
      await service.initialize();

      service.dispose();

      // Second dispose should not throw
      expect(() => service.dispose()).not.toThrow();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle invalid AST node gracefully', async () => {
      const invalidNode = null as any;

      const result = await service.generateOptimizedMesh(invalidNode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(OptimizedMeshGenerationErrorCode.MESH_GENERATION_FAILED);
      }
    });

    it('should handle mesh generation failures gracefully', async () => {
      const astNode = {
        type: 'cube',
        size: null, // Invalid parameters
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      } as ASTNode;

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(OptimizedMeshGenerationErrorCode.MESH_GENERATION_FAILED);
      }
    });
  });

  describe('integration with existing services', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should integrate with primitive shape generator', async () => {
      const cubeNode: ASTNode = {
        type: 'cube',
        size: [1, 2, 3],
        center: true,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const result = await service.generateOptimizedMesh(cubeNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeDefined();
        expect(result.data.mesh.name).toContain('cube');
      }
    });

    it('should provide meaningful generation times', async () => {
      const astNode: ASTNode = {
        type: 'sphere',
        radius: 2,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 12, offset: 11 },
        },
      };

      const result = await service.generateOptimizedMesh(astNode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.generationTime).toBeGreaterThan(0);
        expect(result.data.optimizationTime).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
