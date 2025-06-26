/**
 * CSG Operations Service Test Suite
 * 
 * Tests for CSG operations service following TDD methodology
 * with real three-csg-ts operations and Three.js mesh processing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  performCSGOperation,
  createCSGConfig,
  performBatchCSGOperations,
  validateMeshesForCSG,
  estimateCSGComplexity,
  isCSGOperationFeasible
} from './csg-operations';
import type { CSGConfig, CSGOperation } from '../types/renderer.types';

// Mock three-csg-ts for testing
const mockCSGResult = {
  toMesh: vi.fn(() => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial();
    return new THREE.Mesh(geometry, material);
  })
};

const mockCSG = {
  union: vi.fn(() => mockCSGResult),
  subtract: vi.fn(() => mockCSGResult),
  intersect: vi.fn(() => mockCSGResult)
};

vi.mock('three-csg-ts', () => ({
  CSG: {
    fromMesh: vi.fn(() => mockCSG)
  }
}));

describe('CSG Operations Service', () => {
  let testMeshes: THREE.Mesh[];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create test meshes
    testMeshes = [
      new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      ),
      new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      ),
      new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 3, 16),
        new THREE.MeshStandardMaterial({ color: 0x0000ff })
      )
    ];
    
    // Ensure geometries have proper attributes
    testMeshes.forEach(mesh => {
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingBox();
    });
  });

  afterEach(() => {
    // Clean up geometries and materials
    testMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    
    vi.restoreAllMocks();
  });

  describe('createCSGConfig', () => {
    it('should create CSG config with default options', () => {
      const config = createCSGConfig('union', testMeshes.slice(0, 2));
      
      expect(config.operation).toBe('union');
      expect(config.meshes).toHaveLength(2);
      expect(config.enableOptimization).toBe(true);
      expect(config.maxComplexity).toBe(50000);
    });

    it('should create CSG config with custom options', () => {
      const config = createCSGConfig('difference', testMeshes, {
        enableOptimization: false,
        maxComplexity: 10000
      });
      
      expect(config.operation).toBe('difference');
      expect(config.meshes).toHaveLength(3);
      expect(config.enableOptimization).toBe(false);
      expect(config.maxComplexity).toBe(10000);
    });
  });

  describe('validateMeshesForCSG', () => {
    it('should validate valid meshes', () => {
      const result = validateMeshesForCSG(testMeshes);
      
      expect(result.success).toBe(true);
    });

    it('should fail for empty mesh array', () => {
      const result = validateMeshesForCSG([]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No meshes provided');
      }
    });

    it('should fail for mesh without geometry', () => {
      const invalidMesh = new THREE.Mesh();
      const result = validateMeshesForCSG([invalidMesh]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Mesh validation failed');
      }
    });

    it('should fail for mesh without position attribute', () => {
      const invalidGeometry = new THREE.BufferGeometry();
      const invalidMesh = new THREE.Mesh(invalidGeometry, new THREE.MeshStandardMaterial());
      const result = validateMeshesForCSG([invalidMesh]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Mesh geometry has no position attribute');
      }
    });
  });

  describe('estimateCSGComplexity', () => {
    it('should calculate complexity for multiple meshes', () => {
      const complexity = estimateCSGComplexity(testMeshes);
      
      expect(complexity).toBeGreaterThan(0);
      expect(typeof complexity).toBe('number');
    });

    it('should return 0 for empty mesh array', () => {
      const complexity = estimateCSGComplexity([]);
      
      expect(complexity).toBe(0);
    });

    it('should handle meshes without geometry', () => {
      const invalidMesh = new THREE.Mesh();
      const complexity = estimateCSGComplexity([invalidMesh]);
      
      expect(complexity).toBe(0);
    });
  });

  describe('isCSGOperationFeasible', () => {
    it('should return true for feasible operations', () => {
      const result = isCSGOperationFeasible('union', testMeshes.slice(0, 2));
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false for overly complex operations', () => {
      const result = isCSGOperationFeasible('union', testMeshes, 1); // Very low threshold
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should return false for invalid meshes', () => {
      const invalidMesh = new THREE.Mesh();
      const result = isCSGOperationFeasible('union', [invalidMesh]);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('performCSGOperation', () => {
    it('should perform union operation', async () => {
      const config = createCSGConfig('union', testMeshes.slice(0, 2));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(THREE.Mesh);
        expect(mockCSG.union).toHaveBeenCalled();
      }
    });

    it('should perform difference operation', async () => {
      const config = createCSGConfig('difference', testMeshes.slice(0, 2));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(THREE.Mesh);
        expect(mockCSG.subtract).toHaveBeenCalled();
      }
    });

    it('should perform intersection operation', async () => {
      const config = createCSGConfig('intersection', testMeshes.slice(0, 2));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(THREE.Mesh);
        expect(mockCSG.intersect).toHaveBeenCalled();
      }
    });

    it('should handle single mesh union', async () => {
      const config = createCSGConfig('union', testMeshes.slice(0, 1));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(THREE.Mesh);
        // Should return cloned mesh without CSG operation
      }
    });

    it('should fail for empty mesh array', async () => {
      const config = createCSGConfig('union', []);
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No meshes provided');
      }
    });

    it('should fail for difference with single mesh', async () => {
      const config = createCSGConfig('difference', testMeshes.slice(0, 1));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('difference operation requires at least 2 meshes');
      }
    });

    it('should fail for intersection with single mesh', async () => {
      const config = createCSGConfig('intersection', testMeshes.slice(0, 1));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('intersection operation requires at least 2 meshes');
      }
    });

    it('should fail for unsupported operation', async () => {
      const config = createCSGConfig('unknown' as CSGOperation, testMeshes.slice(0, 2));
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported CSG operation: unknown');
      }
    });

    it('should fail for overly complex meshes', async () => {
      const config = createCSGConfig('union', testMeshes, {
        maxComplexity: 1 // Very low threshold
      });
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Total mesh complexity too high');
      }
    });
  });

  describe('performBatchCSGOperations', () => {
    it('should perform multiple CSG operations', async () => {
      const configs = [
        createCSGConfig('union', testMeshes.slice(0, 2)),
        createCSGConfig('difference', testMeshes.slice(1, 3))
      ];
      
      const results = await performBatchCSGOperations(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle mixed success and failure results', async () => {
      const configs = [
        createCSGConfig('union', testMeshes.slice(0, 2)),
        createCSGConfig('difference', testMeshes.slice(0, 1)) // This should fail
      ];
      
      const results = await performBatchCSGOperations(configs);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it('should handle empty config array', async () => {
      const results = await performBatchCSGOperations([]);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should complete operations within reasonable time', async () => {
      const startTime = performance.now();
      const config = createCSGConfig('union', testMeshes.slice(0, 2));
      const result = await performCSGOperation(config);
      const endTime = performance.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle geometry optimization', async () => {
      const config = createCSGConfig('union', testMeshes.slice(0, 2), {
        enableOptimization: true
      });
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometry.attributes.normal).toBeDefined();
        expect(result.data.geometry.boundingBox).toBeDefined();
      }
    });

    it('should handle disabled optimization', async () => {
      const config = createCSGConfig('union', testMeshes.slice(0, 2), {
        enableOptimization: false
      });
      const result = await performCSGOperation(config);
      
      expect(result.success).toBe(true);
    });
  });
});
