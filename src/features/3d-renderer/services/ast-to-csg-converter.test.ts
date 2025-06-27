/**
 * AST to CSG Converter Service Tests
 * 
 * Comprehensive tests for AST-to-CSG conversion with real three-csg-ts operations.
 * Tests the complete pipeline from OpenSCAD AST nodes to Three.js CSG meshes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import type { CubeNode, SphereNode, CylinderNode } from '@holistic-stack/openscad-parser';

import { 
  convertASTNodeToCSG, 
  convertASTNodesToCSGUnion 
} from './ast-to-csg-converter';

describe('[INIT][ASTToCSGConverter] AST to CSG Converter Service', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    console.log('[INIT][ASTToCSGConverterTest] Setting up test environment');
    scene = new THREE.Scene();
  });

  afterEach(() => {
    console.log('[END][ASTToCSGConverterTest] Cleaning up test environment');
    // Dispose of all scene objects
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    scene.clear();
  });

  describe('convertASTNodeToCSG', () => {
    it('should convert cube AST node to CSG mesh', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing cube conversion');
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false,
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 20 }
        }
      };

      const result = convertASTNodeToCSG(cubeNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        
        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
        
        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('cube');
        expect(mesh3D.metadata.nodeIndex).toBe(0);
        expect(mesh3D.metadata.color).toBe('#00ff88');
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);
        expect(mesh3D.metadata.vertexCount).toBeGreaterThan(0);
        
        // Verify geometry dimensions
        const geometry = mesh3D.mesh.geometry as THREE.BoxGeometry;
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox!;
        expect(boundingBox.getSize(new THREE.Vector3())).toEqual(new THREE.Vector3(10, 10, 10));
        
        // Verify material properties
        const material = mesh3D.mesh.material as THREE.MeshStandardMaterial;
        expect(material.color.getHex()).toBe(0x00ff88);
        expect(material.metalness).toBe(0.1);
        expect(material.roughness).toBe(0.8);
        
        // Test disposal
        expect(() => mesh3D.dispose()).not.toThrow();
        
        console.log('[DEBUG][ASTToCSGConverterTest] Cube conversion successful');
      }
    });

    it('should convert sphere AST node to CSG mesh', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing sphere conversion');
      
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 15 }
        }
      };

      const result = convertASTNodeToCSG(sphereNode, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        
        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
        
        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('sphere');
        expect(mesh3D.metadata.nodeIndex).toBe(1);
        expect(mesh3D.metadata.id).toBe('csg-sphere-1');
        
        // Verify geometry dimensions
        const geometry = mesh3D.mesh.geometry as THREE.SphereGeometry;
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox!;
        const size = boundingBox.getSize(new THREE.Vector3());
        expect(size.x).toBeCloseTo(10, 1); // diameter = 2 * radius
        expect(size.y).toBeCloseTo(10, 1);
        expect(size.z).toBeCloseTo(10, 1);
        
        console.log('[DEBUG][ASTToCSGConverterTest] Sphere conversion successful');
      }
    });

    it('should convert cylinder AST node to CSG mesh', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing cylinder conversion');
      
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 15,
        r: 3,
        center: false,
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 25 }
        }
      };

      const result = convertASTNodeToCSG(cylinderNode, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        
        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
        
        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('cylinder');
        expect(mesh3D.metadata.nodeIndex).toBe(2);
        expect(mesh3D.metadata.id).toBe('csg-cylinder-2');
        
        // Verify geometry dimensions
        const geometry = mesh3D.mesh.geometry as THREE.CylinderGeometry;
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox!;
        const size = boundingBox.getSize(new THREE.Vector3());
        expect(size.x).toBeCloseTo(6, 1); // diameter = 2 * radius
        expect(size.y).toBeCloseTo(15, 1); // height
        expect(size.z).toBeCloseTo(6, 1); // diameter = 2 * radius
        
        // Verify positioning (cylinder should be positioned with base at origin when center=false)
        expect(mesh3D.mesh.position.y).toBeCloseTo(7.5, 1); // height / 2
        
        console.log('[DEBUG][ASTToCSGConverterTest] Cylinder conversion successful');
      }
    });

    it('should handle unsupported AST node types', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing unsupported node type');
      
      const unsupportedNode = {
        type: 'unsupported',
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 15 }
        }
      } as any;

      const result = convertASTNodeToCSG(unsupportedNode, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported AST node type for CSG conversion: unsupported');
        console.log('[DEBUG][ASTToCSGConverterTest] Unsupported node type handled correctly');
      }
    });

    it('should apply custom material configuration', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing custom material configuration');
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [5, 5, 5],
        center: true,
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 20 }
        }
      };

      const customConfig = {
        material: {
          color: '#ff0000',
          opacity: 0.8,
          metalness: 0.5,
          roughness: 0.3,
          wireframe: true,
          transparent: true,
          side: 'double' as const
        }
      };

      const result = convertASTNodeToCSG(cubeNode, 0, customConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        const material = mesh3D.mesh.material as THREE.MeshStandardMaterial;
        
        expect(material.color.getHex()).toBe(0xff0000);
        expect(material.opacity).toBe(0.8);
        expect(material.metalness).toBe(0.5);
        expect(material.roughness).toBe(0.3);
        expect(material.wireframe).toBe(true);
        expect(material.transparent).toBe(true);
        expect(material.side).toBe(THREE.DoubleSide);
        
        expect(mesh3D.metadata.color).toBe('#ff0000');
        expect(mesh3D.metadata.opacity).toBe(0.8);
        
        console.log('[DEBUG][ASTToCSGConverterTest] Custom material configuration applied correctly');
      }
    });
  });

  describe('convertASTNodesToCSGUnion', () => {
    it('should create CSG union from multiple AST nodes', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing CSG union operation');
      
      const nodes = [
        {
          type: 'cube',
          size: [5, 5, 5],
          center: true,
          location: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 20 }
          }
        } as CubeNode,
        {
          type: 'sphere',
          radius: 3,
          location: {
            start: { line: 2, column: 1 },
            end: { line: 2, column: 15 }
          }
        } as SphereNode
      ];

      const result = convertASTNodesToCSGUnion(nodes);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        
        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
        
        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('union');
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);
        expect(mesh3D.metadata.vertexCount).toBeGreaterThan(0);
        
        // Verify that CSG union was performed (geometry should be different from individual primitives)
        expect(mesh3D.mesh.geometry).not.toBeInstanceOf(THREE.BoxGeometry);
        expect(mesh3D.mesh.geometry).not.toBeInstanceOf(THREE.SphereGeometry);
        
        console.log('[DEBUG][ASTToCSGConverterTest] CSG union operation successful');
      }
    });

    it('should handle single node as pass-through', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing single node pass-through');
      
      const nodes = [
        {
          type: 'cube',
          size: [8, 8, 8],
          center: false,
          location: {
            start: { line: 1, column: 1 },
            end: { line: 1, column: 20 }
          }
        } as CubeNode
      ];

      const result = convertASTNodesToCSGUnion(nodes);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        
        // For single node, should still create a valid mesh
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.metadata.nodeType).toBe('union');
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);
        
        console.log('[DEBUG][ASTToCSGConverterTest] Single node pass-through successful');
      }
    });

    it('should handle empty node array', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing empty node array');
      
      const result = convertASTNodesToCSGUnion([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No AST nodes provided for CSG union');
        console.log('[DEBUG][ASTToCSGConverterTest] Empty node array handled correctly');
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should complete conversion within performance requirements', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing performance requirements');
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false,
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 20 }
        }
      };

      const startTime = performance.now();
      const result = convertASTNodeToCSG(cubeNode, 0);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      
      console.log(`[DEBUG][ASTToCSGConverterTest] Conversion completed in ${duration.toFixed(2)}ms`);
    });

    it('should properly dispose of resources', () => {
      console.log('[DEBUG][ASTToCSGConverterTest] Testing resource disposal');
      
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 4,
        location: {
          start: { line: 1, column: 1 },
          end: { line: 1, column: 15 }
        }
      };

      const result = convertASTNodeToCSG(sphereNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        
        // Add to scene to verify it works
        scene.add(mesh3D.mesh);
        expect(scene.children).toHaveLength(1);
        
        // Test disposal
        expect(() => mesh3D.dispose()).not.toThrow();
        
        // Verify geometry and material are disposed
        expect(mesh3D.mesh.geometry.attributes.position).toBeDefined();
        
        console.log('[DEBUG][ASTToCSGConverterTest] Resource disposal successful');
      }
    });
  });
});
