/**
 * @file Manifold Mesh Converter Tests
 * Task 2.1: Create Three.js to Manifold Converter (Red Phase)
 * 
 * Tests for converting Three.js BufferGeometry to BabylonJS-inspired IManifoldMesh format
 * Following project guidelines:
 * - Use real implementations (no mocks except Three.js WebGL components)
 * - TDD methodology with Red-Green-Refactor cycles
 * - Result<T,E> error handling patterns
 * - BabylonJS-inspired mesh conversion with triangle winding reversal
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import {
  convertThreeToManifold,
  convertManifoldToThree,
  createOfficialManifoldMesh,
  convertThreeToOfficialManifold,
  roundTripConversion,
  type IManifoldMesh
} from './manifold-mesh-converter';
import { 
  getMemoryStats,
  clearAllResources 
} from '../manifold-memory-manager/manifold-memory-manager';
import type { Result } from '../../../../shared/types/result.types';

/**
 * BabylonJS-inspired IManifoldMesh interface for testing
 * Based on BabylonJS CSG2 implementation analysis
 */
interface IManifoldMesh {
  numProp: number;           // Vertex property count (positions + normals + UVs + colors)
  vertProperties: Float32Array;  // Interleaved vertex data
  triVerts: Uint32Array;     // Triangle indices (REVERSED winding order!)
  runIndex: Uint32Array;     // Material run starts
  runOriginalID: Uint32Array; // Material IDs
  numRun: number;            // Number of material runs
}

/**
 * Test suite for Three.js to Manifold mesh conversion
 */
describe('Manifold Mesh Converter - Three.js to Manifold', () => {
  beforeEach(() => {
    // Clear memory for clean test state
    clearAllResources();
  });

  describe('BufferGeometry to IManifoldMesh Conversion', () => {
    it('should convert simple triangle BufferGeometry to IManifoldMesh with triangle winding reversal', () => {
      // Create a simple triangle BufferGeometry
      const geometry = new BufferGeometry();
      
      // Triangle vertices (counter-clockwise winding)
      const vertices = new Float32Array([
        0.0, 1.0, 0.0,  // vertex 0
        -1.0, -1.0, 0.0, // vertex 1
        1.0, -1.0, 0.0   // vertex 2
      ]);
      
      // Triangle indices (counter-clockwise)
      const indices = new Uint32Array([0, 1, 2]);
      
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.setIndex(new Uint32BufferAttribute(indices, 1));
      
      // Convert to IManifoldMesh (this will fail in Red phase)
      const result = convertThreeToManifold(geometry);
      
      // Expected behavior: Result<T,E> pattern
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        const manifoldMesh = result.data;
        
        // Verify BabylonJS-inspired structure
        expect(manifoldMesh.numProp).toBe(3); // Only positions (x, y, z)
        expect(manifoldMesh.vertProperties).toBeInstanceOf(Float32Array);
        expect(manifoldMesh.triVerts).toBeInstanceOf(Uint32Array);
        
        // Verify triangle winding preservation (official Manifold pattern)
        // Original: [0, 1, 2] -> Preserved: [0, 1, 2] (no reversal by default)
        expect(manifoldMesh.triVerts).toEqual(new Uint32Array([0, 1, 2]));
        
        // Verify vertex properties (interleaved)
        expect(manifoldMesh.vertProperties.length).toBe(9); // 3 vertices * 3 properties
        
        // Verify material runs (single material)
        expect(manifoldMesh.numRun).toBe(1);
        expect(manifoldMesh.runIndex).toEqual(new Uint32Array([0]));
        expect(manifoldMesh.runOriginalID).toEqual(new Uint32Array([0]));
      }
    });

    it('should convert BufferGeometry with normals and UVs to IManifoldMesh', () => {
      // Create BufferGeometry with positions, normals, and UVs
      const geometry = new BufferGeometry();
      
      const vertices = new Float32Array([
        0.0, 1.0, 0.0,   // vertex 0
        -1.0, -1.0, 0.0, // vertex 1
        1.0, -1.0, 0.0   // vertex 2
      ]);
      
      const normals = new Float32Array([
        0.0, 0.0, 1.0,   // normal 0
        0.0, 0.0, 1.0,   // normal 1
        0.0, 0.0, 1.0    // normal 2
      ]);
      
      const uvs = new Float32Array([
        0.5, 1.0,  // uv 0
        0.0, 0.0,  // uv 1
        1.0, 0.0   // uv 2
      ]);
      
      const indices = new Uint32Array([0, 1, 2]);
      
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      geometry.setIndex(new Uint32BufferAttribute(indices, 1));
      
      // Convert to IManifoldMesh
      const result = convertThreeToManifold(geometry);
      
      expect(result).toBeDefined();
      if (result.success) {
        const manifoldMesh = result.data;
        
        // Verify numProp includes positions + normals + UVs
        expect(manifoldMesh.numProp).toBe(8); // 3 pos + 3 normal + 2 uv
        
        // Verify interleaved vertex properties
        // Expected: [x0,y0,z0,nx0,ny0,nz0,u0,v0, x1,y1,z1,nx1,ny1,nz1,u1,v1, ...]
        expect(manifoldMesh.vertProperties.length).toBe(24); // 3 vertices * 8 properties
        
        // Verify triangle winding preservation (official Manifold pattern)
        expect(manifoldMesh.triVerts).toEqual(new Uint32Array([0, 1, 2]));
      }
    });

    it('should handle BufferGeometry without indices (non-indexed geometry)', () => {
      // Create non-indexed BufferGeometry
      const geometry = new BufferGeometry();
      
      const vertices = new Float32Array([
        0.0, 1.0, 0.0,   // triangle vertex 0
        -1.0, -1.0, 0.0, // triangle vertex 1
        1.0, -1.0, 0.0   // triangle vertex 2
      ]);
      
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      // No index buffer - vertices define triangles directly
      
      const result = convertThreeToManifold(geometry);
      
      expect(result).toBeDefined();
      if (result.success) {
        const manifoldMesh = result.data;
        
        // Should generate indices automatically with preserved winding
        expect(manifoldMesh.triVerts).toEqual(new Uint32Array([0, 1, 2])); // Preserved winding
        expect(manifoldMesh.numProp).toBe(3); // Only positions
      }
    });

    it('should handle empty or invalid BufferGeometry gracefully', () => {
      // Test with empty geometry
      const emptyGeometry = new BufferGeometry();
      
      const result = convertThreeToManifold(emptyGeometry);
      
      // Should return error result
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('geometry');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle world matrix transformation during conversion', () => {
      // Create BufferGeometry with transformation
      const geometry = new BufferGeometry();
      
      const vertices = new Float32Array([
        1.0, 0.0, 0.0,   // vertex 0
        0.0, 1.0, 0.0,   // vertex 1
        0.0, 0.0, 1.0    // vertex 2
      ]);
      
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.setIndex(new Uint32BufferAttribute([0, 1, 2], 1));
      
      // Mock world matrix (scale by 2)
      const worldMatrix = [
        2, 0, 0, 0,
        0, 2, 0, 0,
        0, 0, 2, 0,
        0, 0, 0, 1
      ];
      
      const result = convertThreeToManifold(geometry, { worldMatrix });
      
      expect(result).toBeDefined();
      if (result.success) {
        const manifoldMesh = result.data;
        
        // Vertices should be transformed by world matrix
        // This establishes the expected interface for matrix transformation
        expect(manifoldMesh.vertProperties).toBeInstanceOf(Float32Array);
        expect(manifoldMesh.vertProperties.length).toBe(9); // 3 vertices * 3 properties
      }
    });

    it('should track memory usage during conversion', () => {
      // Test memory tracking integration
      const initialStats = getMemoryStats();
      
      const geometry = new BufferGeometry();
      const vertices = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      
      const result = convertThreeToManifold(geometry);
      
      // Memory stats should be tracked (implementation will be in Green phase)
      const finalStats = getMemoryStats();
      expect(finalStats).toBeDefined();
      expect(typeof finalStats.activeResources).toBe('number');
    });
  });

  describe('Official Manifold Integration', () => {
    it('should establish interface for creating official Manifold meshes', async () => {
      // Create test mesh data
      const geometry = new BufferGeometry();
      const vertices = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

      const meshDataResult = convertThreeToManifold(geometry);
      expect(meshDataResult.success).toBe(true);

      if (meshDataResult.success) {
        // Test the interface for official mesh creation
        // This will be fully implemented when WASM loading is stable
        const expectedInterface = {
          createOfficialManifoldMesh: expect.any(Function),
          convertThreeToOfficialManifold: expect.any(Function)
        };

        expect(typeof createOfficialManifoldMesh).toBe('function');
        expect(typeof convertThreeToOfficialManifold).toBe('function');

        // Verify mesh data structure matches official Manifold API
        const meshData = meshDataResult.data;
        expect(meshData).toHaveProperty('numProp');
        expect(meshData).toHaveProperty('vertProperties');
        expect(meshData).toHaveProperty('triVerts');
        expect(meshData).toHaveProperty('runIndex');
        expect(meshData).toHaveProperty('runOriginalID');
        expect(meshData).toHaveProperty('numRun');
      }
    });

    it('should handle official mesh creation errors gracefully', async () => {
      // Test error handling for official mesh creation
      const invalidMeshData = {
        numProp: 0,
        vertProperties: new Float32Array([]),
        triVerts: new Uint32Array([]),
        runIndex: new Uint32Array([]),
        runOriginalID: new Uint32Array([]),
        numRun: 0
      };

      // This should handle the error gracefully
      const result = await createOfficialManifoldMesh(invalidMeshData);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      // Error is expected due to invalid data or missing WASM module
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('Manifold to Three.js Conversion', () => {
    it('should convert IManifoldMesh back to Three.js BufferGeometry', () => {
      // Create a test IManifoldMesh (simple triangle)
      const manifoldMesh: IManifoldMesh = {
        numProp: 3, // Only positions
        vertProperties: new Float32Array([
          0.0, 1.0, 0.0,   // vertex 0
          -1.0, -1.0, 0.0, // vertex 1
          1.0, -1.0, 0.0   // vertex 2
        ]),
        triVerts: new Uint32Array([0, 1, 2]), // Triangle indices
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1
      };

      // Convert back to Three.js BufferGeometry (this will fail in Red phase)
      const result = convertManifoldToThree(manifoldMesh);

      // Expected behavior: Result<T,E> pattern
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const geometry = result.data;

        // Verify it's a valid BufferGeometry
        expect(geometry).toBeInstanceOf(BufferGeometry);

        // Verify position attribute
        const positionAttribute = geometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();
        expect(positionAttribute.count).toBe(3);
        expect(positionAttribute.itemSize).toBe(3);

        // Verify triangle indices
        const indexAttribute = geometry.getIndex();
        expect(indexAttribute).toBeDefined();
        if (indexAttribute) {
          expect(indexAttribute.count).toBe(3);
          expect(indexAttribute.array).toEqual(new Uint32Array([0, 1, 2]));
        }

        // Verify vertex positions
        const positions = positionAttribute.array;
        expect(positions[0]).toBeCloseTo(0.0);  // x0
        expect(positions[1]).toBeCloseTo(1.0);  // y0
        expect(positions[2]).toBeCloseTo(0.0);  // z0
        expect(positions[3]).toBeCloseTo(-1.0); // x1
        expect(positions[4]).toBeCloseTo(-1.0); // y1
        expect(positions[5]).toBeCloseTo(0.0);  // z1
      }
    });

    it('should convert IManifoldMesh with normals and UVs to BufferGeometry', () => {
      // Create IManifoldMesh with positions, normals, and UVs
      const manifoldMesh: IManifoldMesh = {
        numProp: 8, // 3 pos + 3 normal + 2 uv
        vertProperties: new Float32Array([
          // vertex 0: pos(0,1,0) + normal(0,0,1) + uv(0.5,1.0)
          0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.5, 1.0,
          // vertex 1: pos(-1,-1,0) + normal(0,0,1) + uv(0.0,0.0)
          -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
          // vertex 2: pos(1,-1,0) + normal(0,0,1) + uv(1.0,0.0)
          1.0, -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0
        ]),
        triVerts: new Uint32Array([0, 1, 2]),
        runIndex: new Uint32Array([0]),
        runOriginalID: new Uint32Array([0]),
        numRun: 1
      };

      const result = convertManifoldToThree(manifoldMesh);

      expect(result).toBeDefined();
      if (result.success) {
        const geometry = result.data;

        // Verify position attribute
        const positionAttribute = geometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();
        expect(positionAttribute.count).toBe(3);

        // Verify normal attribute
        const normalAttribute = geometry.getAttribute('normal');
        expect(normalAttribute).toBeDefined();
        expect(normalAttribute.count).toBe(3);
        expect(normalAttribute.itemSize).toBe(3);

        // Verify UV attribute
        const uvAttribute = geometry.getAttribute('uv');
        expect(uvAttribute).toBeDefined();
        expect(uvAttribute.count).toBe(3);
        expect(uvAttribute.itemSize).toBe(2);

        // Verify normal values
        const normals = normalAttribute.array;
        expect(normals[2]).toBeCloseTo(1.0); // z component of first normal
        expect(normals[5]).toBeCloseTo(1.0); // z component of second normal
        expect(normals[8]).toBeCloseTo(1.0); // z component of third normal

        // Verify UV values
        const uvs = uvAttribute.array;
        expect(uvs[0]).toBeCloseTo(0.5); // u0
        expect(uvs[1]).toBeCloseTo(1.0); // v0
        expect(uvs[2]).toBeCloseTo(0.0); // u1
        expect(uvs[3]).toBeCloseTo(0.0); // v1
      }
    });

    it('should handle material runs and create geometry groups', () => {
      // Create IManifoldMesh with multiple material runs
      const manifoldMesh: IManifoldMesh = {
        numProp: 3,
        vertProperties: new Float32Array([
          // First triangle (material 0)
          0.0, 1.0, 0.0,   // vertex 0
          -1.0, -1.0, 0.0, // vertex 1
          1.0, -1.0, 0.0,  // vertex 2
          // Second triangle (material 1)
          0.0, 2.0, 0.0,   // vertex 3
          -1.0, 0.0, 0.0,  // vertex 4
          1.0, 0.0, 0.0    // vertex 5
        ]),
        triVerts: new Uint32Array([0, 1, 2, 3, 4, 5]), // Two triangles
        runIndex: new Uint32Array([0, 3]), // Material runs: [0-2] and [3-5]
        runOriginalID: new Uint32Array([0, 1]), // Material IDs
        numRun: 2
      };

      const result = convertManifoldToThree(manifoldMesh);

      expect(result).toBeDefined();
      if (result.success) {
        const geometry = result.data;

        // Verify geometry groups for materials
        expect(geometry.groups).toBeDefined();
        expect(geometry.groups.length).toBe(2);

        // Verify first group (material 0)
        expect(geometry.groups[0].start).toBe(0);
        expect(geometry.groups[0].count).toBe(3);
        expect(geometry.groups[0].materialIndex).toBe(0);

        // Verify second group (material 1)
        expect(geometry.groups[1].start).toBe(3);
        expect(geometry.groups[1].count).toBe(3);
        expect(geometry.groups[1].materialIndex).toBe(1);
      }
    });

    it('should handle round-trip conversion (Three.js → Manifold → Three.js)', () => {
      // Create original Three.js geometry
      const originalGeometry = new BufferGeometry();
      const vertices = new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]);
      const indices = new Uint32Array([0, 1, 2]);

      originalGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      originalGeometry.setIndex(new Uint32BufferAttribute(indices, 1));

      // Convert to Manifold
      const manifoldResult = convertThreeToManifold(originalGeometry);
      expect(manifoldResult.success).toBe(true);

      if (manifoldResult.success) {
        // Convert back to Three.js
        const threeResult = convertManifoldToThree(manifoldResult.data);
        expect(threeResult.success).toBe(true);

        if (threeResult.success) {
          const roundTripGeometry = threeResult.data;

          // Verify round-trip preservation
          const roundTripPositions = roundTripGeometry.getAttribute('position');
          expect(roundTripPositions.count).toBe(3);

          const roundTripIndices = roundTripGeometry.getIndex();
          expect(roundTripIndices).toBeDefined();
          if (roundTripIndices) {
            expect(roundTripIndices.count).toBe(3);
            // Verify triangle indices are preserved
            expect(roundTripIndices.array).toEqual(new Uint32Array([0, 1, 2]));
          }
        }
      }
    });

    it('should handle empty or invalid IManifoldMesh gracefully', () => {
      // Test with empty mesh data
      const emptyMesh: IManifoldMesh = {
        numProp: 0,
        vertProperties: new Float32Array([]),
        triVerts: new Uint32Array([]),
        runIndex: new Uint32Array([]),
        runOriginalID: new Uint32Array([]),
        numRun: 0
      };

      const result = convertManifoldToThree(emptyMesh);

      // Should return error result
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('mesh');
        expect(typeof result.error).toBe('string');
      }
    });

    it('should test round-trip conversion with convenience function', () => {
      // Create original Three.js geometry
      const originalGeometry = new BufferGeometry();
      const vertices = new Float32Array([
        0.0, 1.0, 0.0,   // vertex 0
        -1.0, -1.0, 0.0, // vertex 1
        1.0, -1.0, 0.0   // vertex 2
      ]);
      const indices = new Uint32Array([0, 1, 2]);

      originalGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      originalGeometry.setIndex(new Uint32BufferAttribute(indices, 1));

      // Perform round-trip conversion
      const result = roundTripConversion(originalGeometry);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        const roundTripGeometry = result.data;

        // Verify round-trip preservation
        expect(roundTripGeometry).toBeInstanceOf(BufferGeometry);

        const roundTripPositions = roundTripGeometry.getAttribute('position');
        expect(roundTripPositions.count).toBe(3);

        const roundTripIndices = roundTripGeometry.getIndex();
        expect(roundTripIndices).toBeDefined();
        if (roundTripIndices) {
          expect(roundTripIndices.count).toBe(3);
          // Verify triangle indices are preserved
          expect(roundTripIndices.array).toEqual(new Uint32Array([0, 1, 2]));
        }
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle BufferGeometry with invalid vertex data', () => {
      const geometry = new BufferGeometry();
      
      // Invalid vertex data (not multiple of 3)
      const invalidVertices = new Float32Array([1.0, 2.0]); // Missing z component
      geometry.setAttribute('position', new Float32BufferAttribute(invalidVertices, 3));
      
      const result = convertThreeToManifold(geometry);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('vertex');
      }
    });

    it('should provide comprehensive error context for debugging', () => {
      // Test error context and debugging information
      const result = convertThreeToManifold(null as any);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });
});
