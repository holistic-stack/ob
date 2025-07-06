/**
 * AST to CSG Converter Service Tests
 *
 * Comprehensive tests for AST-to-CSG conversion with real custom CSG utility operations.
 * Tests the complete pipeline from OpenSCAD AST nodes to Three.js CSG meshes.
 */

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  SphereNode,
} from '../../../openscad-parser/core/ast-types.js';

import { convertASTNodeToCSG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterTest');

// Note: MirrorNode and RotateExtrudeNode interfaces removed as they were unused
// These can be re-added when mirror and rotate_extrude functionality is implemented

describe('[INIT][ASTToCSGConverter] AST to CSG Converter Service', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    logger.init('Setting up test environment');
    scene = new THREE.Scene();
  });

  afterEach(() => {
    logger.end('Cleaning up test environment');
    // Dispose of all scene objects
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    scene.clear();
  });

  describe('convertASTNodeToCSG', () => {
    it('should convert cube AST node to CSG mesh', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing cube conversion');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const result = await convertASTNodeToCSG(cubeNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('cube');
        expect(mesh3D.metadata.nodeId).toBeDefined();
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);
        expect(mesh3D.metadata.vertexCount).toBeGreaterThan(0);

        // Verify disposal function
        expect(typeof mesh3D.dispose).toBe('function');

        // Test disposal
        mesh3D.dispose();
      }
    });

    it('should convert sphere AST node to CSG mesh', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing sphere conversion');

      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      };

      const result = await convertASTNodeToCSG(sphereNode, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('sphere');
        expect(mesh3D.metadata.nodeId).toBeDefined();
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);

        mesh3D.dispose();
      }
    });

    it('should convert cylinder AST node to CSG mesh', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing cylinder conversion');

      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 25, offset: 24 },
        },
      };

      const result = await convertASTNodeToCSG(cylinderNode, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
        expect(mesh3D.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('cylinder');
        expect(mesh3D.metadata.nodeId).toBeDefined();

        mesh3D.dispose();
      }
    });

    it('should handle unsupported AST node types', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing unsupported node type');

      const unsupportedNode = {
        type: 'unsupported_type',
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      } as unknown as ASTNode;

      const result = await convertASTNodeToCSG(unsupportedNode, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported AST node type');
      }
    });

    it('should handle CSG conversion timeout', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing CSG conversion timeout');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      // Use very short timeout to trigger timeout condition
      const result = await convertASTNodeToCSG(cubeNode, 0, {
        material: {
          color: '#00ff88',
          opacity: 1,
          metalness: 0.1,
          roughness: 0.8,
          wireframe: false,
          transparent: false,
          side: 'front',
        },
        enableOptimization: true,
        maxComplexity: 50000,
        timeoutMs: 1, // Very short timeout
      });

      // Should either succeed quickly or timeout
      if (!result.success) {
        expect(result.error).toMatch(/timeout|failed/i);
      }
    });

    it('should apply custom material configuration', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing custom material configuration');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [5, 5, 5],
        center: true,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const customMaterial = {
        color: '#ff0000',
        opacity: 0.8,
        metalness: 0.5,
        roughness: 0.3,
        wireframe: true,
        transparent: true,
        side: 'double' as const,
      };

      const result = await convertASTNodeToCSG(cubeNode, 0, {
        material: customMaterial,
        enableOptimization: false,
        maxComplexity: 10000,
        timeoutMs: 5000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;
        const material = mesh3D.mesh.material as THREE.MeshStandardMaterial;

        // Verify custom material properties are applied
        expect(mesh3D.metadata.color).toBe('#ff0000');
        expect(mesh3D.metadata.opacity).toBe(0.8);
        expect(material.wireframe).toBe(true);
        expect(material.transparent).toBe(true);

        mesh3D.dispose();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should convert cube within performance target (<16ms)', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing cube conversion performance');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [10, 10, 10],
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const startTime = performance.now();
      const result = await convertASTNodeToCSG(cubeNode, 0);
      const endTime = performance.now();

      const conversionTime = endTime - startTime;
      logger.debug(`Cube conversion time: ${conversionTime.toFixed(2)}ms`);

      expect(result.success).toBe(true);
      expect(conversionTime).toBeLessThan(16); // <16ms target

      if (result.success) {
        result.data.dispose();
      }
    });
  });
});
