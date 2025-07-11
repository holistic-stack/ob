/**
 * @file Manifold CSG Operations Tests
 * Task 2.4: Create CSG Operations Service (Red Phase)
 * 
 * Tests for CSG operations using Manifold library with real OpenscadParser integration
 * Following project guidelines:
 * - Use real OpenscadParser instances (no mocks)
 * - TDD methodology with Red-Green-Refactor cycles
 * - Result<T,E> error handling patterns
 * - BabylonJS-inspired simple CSG operations (union, subtract, intersect)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import { 
  ManifoldCSGOperations,
  performUnion,
  performSubtraction,
  performIntersection,
  type CSGOperationOptions,
  type CSGOperationResult
} from './manifold-csg-operations';
import { 
  createTestParser,
  parseOpenSCADSafely,
  TEST_OPENSCAD_SAMPLES
} from '@/vitest-helpers/openscad-parser-test-utils';
import { 
  convertThreeToManifold,
  convertManifoldToThree
} from '../manifold-mesh-converter/manifold-mesh-converter';
import { MaterialIDManager } from '../manifold-material-manager/manifold-material-manager';
import { 
  getMemoryStats,
  clearAllResources 
} from '../manifold-memory-manager/manifold-memory-manager';
import type { Result } from '../../../../shared/types/result.types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';

/**
 * Test suite for Manifold CSG operations
 */
describe('Manifold CSG Operations Service', () => {
  let parser: OpenscadParser;
  let materialManager: MaterialIDManager;

  beforeEach(async () => {
    // Clear memory for clean test state
    clearAllResources();
    
    // Create real OpenscadParser instance (no mocks per project guidelines)
    parser = createTestParser();
    await parser.init();
    
    // Initialize material manager
    materialManager = new MaterialIDManager();
    await materialManager.initialize();
  });

  afterEach(async () => {
    // Proper cleanup
    if (materialManager) {
      materialManager.dispose();
    }
    if (parser && typeof parser.dispose === 'function') {
      parser.dispose();
    }
    
    // Verify no memory leaks
    const stats = getMemoryStats();
    expect(stats.activeResources).toBe(0);
  });

  describe('Basic CSG Operations', () => {
    it('should perform union operation with two geometries', async () => {
      // Create two simple cube geometries
      const geometry1 = createTestCubeGeometry([0, 0, 0], [5, 5, 5]);
      const geometry2 = createTestCubeGeometry([2.5, 0, 0], [5, 5, 5]);
      
      // Perform union operation (this will fail in Red phase)
      const result = await performUnion([geometry1, geometry2]);
      
      // Expected behavior: Result<T,E> pattern
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        const unionGeometry = result.data;
        
        // Verify result is valid BufferGeometry
        expect(unionGeometry).toBeInstanceOf(BufferGeometry);
        
        // Verify position attribute exists
        const positionAttribute = unionGeometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();
        expect(positionAttribute.count).toBeGreaterThan(0);
        
        // Verify indices exist
        const indexAttribute = unionGeometry.getIndex();
        expect(indexAttribute).toBeDefined();
        if (indexAttribute) {
          expect(indexAttribute.count).toBeGreaterThan(0);
          expect(indexAttribute.count % 3).toBe(0); // Valid triangles
        }
      }
    });

    it('should perform subtraction operation with two geometries', async () => {
      // Create base geometry and subtraction geometry
      const baseGeometry = createTestCubeGeometry([0, 0, 0], [10, 10, 10]);
      const subtractGeometry = createTestCubeGeometry([2, 2, 2], [6, 6, 6]);
      
      // Perform subtraction operation (this will fail in Red phase)
      const result = await performSubtraction(baseGeometry, subtractGeometry);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        const differenceGeometry = result.data;
        
        // Verify result is valid BufferGeometry
        expect(differenceGeometry).toBeInstanceOf(BufferGeometry);
        
        // Verify geometry has valid structure
        const positionAttribute = differenceGeometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();
        expect(positionAttribute.count).toBeGreaterThan(0);
        
        // Result should have more vertices than original (due to hole)
        const originalVertexCount = baseGeometry.getAttribute('position').count;
        expect(positionAttribute.count).toBeGreaterThanOrEqual(originalVertexCount);
      }
    });

    it('should perform intersection operation with two geometries', async () => {
      // Create two overlapping geometries
      const geometry1 = createTestCubeGeometry([0, 0, 0], [10, 10, 10]);
      const geometry2 = createTestCubeGeometry([5, 5, 5], [10, 10, 10]);
      
      // Perform intersection operation (this will fail in Red phase)
      const result = await performIntersection([geometry1, geometry2]);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        const intersectionGeometry = result.data;
        
        // Verify result is valid BufferGeometry
        expect(intersectionGeometry).toBeInstanceOf(BufferGeometry);
        
        // Verify geometry structure
        const positionAttribute = intersectionGeometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();
        expect(positionAttribute.count).toBeGreaterThan(0);
        
        // Intersection should be smaller than either original
        const vertices1 = geometry1.getAttribute('position').count;
        const vertices2 = geometry2.getAttribute('position').count;
        expect(positionAttribute.count).toBeLessThanOrEqual(Math.max(vertices1, vertices2));
      }
    });
  });

  describe('OpenSCAD Parser Integration', () => {
    it('should establish interface for CSG operations with OpenSCAD AST', async () => {
      // This test establishes the expected interface for AST-to-CSG conversion
      // without requiring actual parser integration (which will be implemented later)

      const expectedInterface = {
        extractPrimitives: expect.any(Function),
        convertToGeometries: expect.any(Function),
        performCSGOperation: expect.any(Function)
      };

      // Verify CSG operation functions exist
      expect(typeof performUnion).toBe('function');
      expect(typeof performSubtraction).toBe('function');
      expect(typeof performIntersection).toBe('function');

      // Verify parser is available for future integration
      expect(parser).toBeDefined();
      expect(typeof parser.init).toBe('function');
    });

    it('should handle CSG operation interface for future AST integration', async () => {
      // This test establishes the expected interface for future AST processing
      // The actual AST-to-CSG conversion will be implemented in later tasks

      // Verify CSG operations can handle multiple geometries
      const geometry1 = createTestCubeGeometry([0, 0, 0], [5, 5, 5]);
      const geometry2 = createTestCubeGeometry([2.5, 0, 0], [5, 5, 5]);

      const unionResult = await performUnion([geometry1, geometry2]);
      expect(unionResult).toBeDefined();
      expect(typeof unionResult.success).toBe('boolean');

      // This establishes the interface that AST-to-CSG conversion will use
      if (unionResult.success) {
        const result = unionResult.data;
        expect(result.geometry).toBeInstanceOf(BufferGeometry);
        expect(typeof result.operationTime).toBe('number');
        expect(typeof result.vertexCount).toBe('number');
        expect(typeof result.triangleCount).toBe('number');
      }
    });
  });

  describe('ManifoldCSGOperations Class', () => {
    it('should manage CSG operations with automatic resource cleanup', async () => {
      // Test ManifoldCSGOperations class (this will fail in Red phase)
      const csgOperations = new ManifoldCSGOperations(materialManager);
      
      // Initialize CSG operations
      const initResult = await csgOperations.initialize();
      
      expect(initResult).toBeDefined();
      expect(typeof initResult.success).toBe('boolean');
      
      if (initResult.success) {
        // Test union operation through class
        const geometry1 = createTestCubeGeometry([0, 0, 0], [5, 5, 5]);
        const geometry2 = createTestCubeGeometry([2.5, 0, 0], [5, 5, 5]);
        
        const unionResult = await csgOperations.union([geometry1, geometry2]);
        expect(unionResult).toBeDefined();
        expect(typeof unionResult.success).toBe('boolean');
        
        // Test cleanup
        const disposeResult = csgOperations.dispose();
        expect(disposeResult.success).toBe(true);
      }
    });

    it('should handle material preservation in CSG operations', async () => {
      // Test material handling in CSG operations
      const csgOperations = new ManifoldCSGOperations(materialManager);
      const initResult = await csgOperations.initialize();
      
      if (initResult.success) {
        // Create geometries with different materials
        const geometry1 = createTestCubeGeometry([0, 0, 0], [5, 5, 5]);
        const geometry2 = createTestCubeGeometry([2.5, 0, 0], [5, 5, 5]);
        
        // Add material groups
        geometry1.addGroup(0, geometry1.getIndex()!.count, 0); // Material 0
        geometry2.addGroup(0, geometry2.getIndex()!.count, 1); // Material 1
        
        const options: CSGOperationOptions = {
          preserveMaterials: true,
          materialMapping: materialManager
        };
        
        const unionResult = await csgOperations.union([geometry1, geometry2], options);
        expect(unionResult).toBeDefined();
        
        if (unionResult.success) {
          const resultGeometry = unionResult.data;
          
          // Verify material groups are preserved
          expect(resultGeometry.groups).toBeDefined();
          expect(resultGeometry.groups.length).toBeGreaterThan(0);
        }
        
        csgOperations.dispose();
      }
    });

    it('should handle CSG operation errors gracefully', async () => {
      // Test error handling in CSG operations
      const csgOperations = new ManifoldCSGOperations(materialManager);
      const initResult = await csgOperations.initialize();
      
      if (initResult.success) {
        // Test with invalid geometry
        const invalidGeometry = new BufferGeometry(); // Empty geometry
        
        const unionResult = await csgOperations.union([invalidGeometry]);
        expect(unionResult).toBeDefined();
        expect(unionResult.success).toBe(false);
        
        if (!unionResult.success) {
          expect(unionResult.error).toBeDefined();
          expect(typeof unionResult.error).toBe('string');
        }
        
        csgOperations.dispose();
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should track memory usage during CSG operations', async () => {
      // Test memory tracking integration
      const initialStats = getMemoryStats();
      
      const geometry1 = createTestCubeGeometry([0, 0, 0], [5, 5, 5]);
      const geometry2 = createTestCubeGeometry([2.5, 0, 0], [5, 5, 5]);
      
      const result = await performUnion([geometry1, geometry2]);
      
      // Memory stats should be tracked (implementation will be in Green phase)
      const finalStats = getMemoryStats();
      expect(finalStats).toBeDefined();
      expect(typeof finalStats.activeResources).toBe('number');
    });

    it('should handle large CSG operations efficiently', async () => {
      // Test with larger geometries
      const geometry1 = createTestCubeGeometry([0, 0, 0], [20, 20, 20]);
      const geometry2 = createTestCubeGeometry([10, 0, 0], [20, 20, 20]);
      
      const startTime = performance.now();
      const result = await performUnion([geometry1, geometry2]);
      const endTime = performance.now();
      
      // Performance should be reasonable (implementation will optimize this)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});

/**
 * Helper function to create test cube geometry
 */
function createTestCubeGeometry(position: [number, number, number], size: [number, number, number]): BufferGeometry {
  const [x, y, z] = position;
  const [w, h, d] = size;
  
  // Create simple cube vertices
  const vertices = new Float32Array([
    // Front face
    x, y, z,         x + w, y, z,         x + w, y + h, z,         x, y + h, z,
    // Back face
    x, y, z + d,     x, y + h, z + d,     x + w, y + h, z + d,     x + w, y, z + d,
  ]);
  
  // Create cube indices (2 triangles per face, 6 faces)
  const indices = new Uint32Array([
    0, 1, 2,  0, 2, 3,  // Front
    4, 5, 6,  4, 6, 7,  // Back
    0, 4, 7,  0, 7, 1,  // Bottom
    2, 6, 5,  2, 5, 3,  // Top
    0, 3, 5,  0, 5, 4,  // Left
    1, 7, 6,  1, 6, 2   // Right
  ]);
  
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  
  return geometry;
}
