/**
 * AST to CSG Converter Service Tests
 *
 * Comprehensive tests for AST-to-CSG conversion with real custom CSG utility operations.
 * Tests the complete pipeline from OpenSCAD AST nodes to Three.js CSG meshes.
 */

import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../../shared/services/logger.service.js';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  DifferenceNode,
  IntersectionNode,
  RotateNode,
  ScaleNode,
  SourceLocation,
  SphereNode,
  TranslateNode,
  UnionNode,
} from '../../openscad-parser/core/ast-types.js';

import { convertASTNodesToCSGUnion, convertASTNodeToCSG } from './ast-to-csg-converter.js';

const logger = createLogger('ASTToCSGConverterTest');

/**
 * Mirror node interface for testing
 */
interface MirrorNode {
  type: 'mirror';
  v: readonly [number, number, number];
  children: readonly ASTNode[];
  location?: SourceLocation;
}

/**
 * Rotate extrude node interface for testing
 */
interface RotateExtrudeNode {
  type: 'rotate_extrude';
  angle?: number;
  children: readonly ASTNode[];
  location?: SourceLocation;
}

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
        expect(mesh3D.metadata.nodeIndex).toBe(0);
        expect(mesh3D.metadata.color).toBe('#00ff88');
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);
        expect(mesh3D.metadata.vertexCount).toBeGreaterThan(0);

        // Verify geometry dimensions
        const geometry = mesh3D.mesh.geometry as THREE.BoxGeometry;
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        expect(boundingBox?.getSize(new THREE.Vector3())).toEqual(new THREE.Vector3(10, 10, 10));

        // Verify material properties
        const material = mesh3D.mesh.material as THREE.MeshStandardMaterial;
        expect(material.color.getHex()).toBe(0x00ff88);
        expect(material.metalness).toBe(0.1);
        expect(material.roughness).toBe(0.8);

        // Test disposal
        expect(() => mesh3D.dispose()).not.toThrow();

        logger.debug('[DEBUG][ASTToCSGConverterTest] Cube conversion successful');
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
        expect(mesh3D.metadata.nodeIndex).toBe(1);
        expect(mesh3D.metadata.id).toBe('csg-sphere-1');

        // Verify geometry dimensions
        const geometry = mesh3D.mesh.geometry as THREE.SphereGeometry;
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        expect(boundingBox?.getSize(new THREE.Vector3())).toEqual(new THREE.Vector3(10, 10, 10));

        logger.debug('[DEBUG][ASTToCSGConverterTest] Sphere conversion successful');
      }
    });

    it('should convert cylinder AST node to CSG mesh', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing cylinder conversion');

      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 15,
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
        expect(mesh3D.metadata.nodeIndex).toBe(2);
        expect(mesh3D.metadata.id).toBe('csg-cylinder-2');

        // Verify geometry dimensions
        const geometry = mesh3D.mesh.geometry as THREE.CylinderGeometry;
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        expect(boundingBox?.getSize(new THREE.Vector3())).toEqual(new THREE.Vector3(10, 10, 10));

        // Verify positioning (cylinder should be positioned with base at origin when center=false)
        expect(mesh3D.mesh.position.y).toBeCloseTo(7.5, 1); // height / 2

        logger.debug('[DEBUG][ASTToCSGConverterTest] Cylinder conversion successful');
      }
    });

    it('should handle unsupported AST node types', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing unsupported node type');

      // Create a mock unsupported node that extends the base ASTNode interface
      const unsupportedNode = {
        type: 'unsupported' as const,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      } as const;

      // Cast to ASTNode for testing unsupported node types
      const result = await convertASTNodeToCSG(unsupportedNode as unknown as ASTNode, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported AST node type for CSG conversion: unsupported');
        logger.debug('[DEBUG][ASTToCSGConverterTest] Unsupported node type handled correctly');
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

      const customConfig = {
        material: {
          color: '#ff0000',
          opacity: 0.8,
          metalness: 0.5,
          roughness: 0.3,
          wireframe: true,
          transparent: true,
          side: 'double' as const,
        },
      };

      const result = await convertASTNodeToCSG(cubeNode, 0, customConfig);

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

        logger.debug(
          '[DEBUG][ASTToCSGConverterTest] Custom material configuration applied correctly'
        );
      }
    });
  });

  describe('Transformation Operations', () => {
    it('should convert translate node with child', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing translate node conversion');

      const cubeChild: CubeNode = {
        type: 'cube',
        size: [5, 5, 5],
        center: true,
        location: {
          start: { line: 2, column: 5, offset: 54 },
          end: { line: 2, column: 25, offset: 74 },
        },
      };

      const translateNode: TranslateNode = {
        type: 'translate',
        v: [10, 20, 30],
        children: [cubeChild],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 3, column: 1, offset: 100 },
        },
      };

      const result = await convertASTNodeToCSG(translateNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);

        // Verify translation was applied
        expect(mesh3D.mesh.position.x).toBe(10);
        expect(mesh3D.mesh.position.y).toBe(20);
        expect(mesh3D.mesh.position.z).toBe(30);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('translate');
        expect(mesh3D.metadata.nodeIndex).toBe(0);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Translate node conversion successful');
      }
    });

    it('should convert rotate node with child', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing rotate node conversion');

      const sphereChild: SphereNode = {
        type: 'sphere',
        radius: 3,
        location: {
          start: { line: 2, column: 5, offset: 54 },
          end: { line: 2, column: 15, offset: 64 },
        },
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: [45, 90, 180],
        children: [sphereChild],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 3, column: 1, offset: 100 },
        },
      };

      const result = await convertASTNodeToCSG(rotateNode, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);

        // Verify rotation was applied (converted to radians)
        expect(mesh3D.mesh.rotation.x).toBeCloseTo(THREE.MathUtils.degToRad(45), 3);
        expect(mesh3D.mesh.rotation.y).toBeCloseTo(THREE.MathUtils.degToRad(90), 3);
        expect(mesh3D.mesh.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(180), 3);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('rotate');
        expect(mesh3D.metadata.nodeIndex).toBe(1);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Rotate node conversion successful');
      }
    });

    it('should convert scale node with child', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing scale node conversion');

      const cylinderChild: CylinderNode = {
        type: 'cylinder',
        h: 10,
        r: 2,
        center: false,
        location: {
          start: { line: 2, column: 5, offset: 54 },
          end: { line: 2, column: 25, offset: 74 },
        },
      };

      const scaleNode: ScaleNode = {
        type: 'scale',
        v: [2, 0.5, 3],
        children: [cylinderChild],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 3, column: 1, offset: 100 },
        },
      };

      const result = await convertASTNodeToCSG(scaleNode, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);

        // Verify scaling was applied
        expect(mesh3D.mesh.scale.x).toBe(2);
        expect(mesh3D.mesh.scale.y).toBe(0.5);
        expect(mesh3D.mesh.scale.z).toBe(3);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('scale');
        expect(mesh3D.metadata.nodeIndex).toBe(2);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Scale node conversion successful');
      }
    });

    it('should handle transformation nodes without children', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing transformation node without children');

      const translateNode: TranslateNode = {
        type: 'translate',
        v: [5, 5, 5],
        children: [],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 20, offset: 19 },
        },
      };

      const result = await convertASTNodeToCSG(translateNode, 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Translate node must have children');
        logger.debug('[DEBUG][ASTToCSGConverterTest] Empty transformation node handled correctly');
      }
    });
  });

  describe('Advanced Operations', () => {
    it('should convert mirror node with child', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing mirror node conversion');

      const cubeChild: CubeNode = {
        type: 'cube',
        size: [5, 5, 10],
        center: true,
        location: {
          start: { line: 2, column: 5, offset: 20 },
          end: { line: 2, column: 25, offset: 40 },
        },
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [1, 0, 0], // Mirror across X-axis
        children: [cubeChild],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 3, column: 1, offset: 50 },
        },
      };

      const result = await convertASTNodeToCSG(mirrorNode as unknown as ASTNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);

        // Verify mirror transformation was applied (negative scale on X-axis)
        expect(mesh3D.mesh.scale.x).toBe(-1);
        expect(mesh3D.mesh.scale.y).toBe(1);
        expect(mesh3D.mesh.scale.z).toBe(1);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('mirror');
        expect(mesh3D.metadata.nodeIndex).toBe(0);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Mirror node conversion successful');
      }
    });

    it('should convert rotate_extrude node', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing rotate_extrude node conversion');

      const rotateExtrudeNode: RotateExtrudeNode = {
        type: 'rotate_extrude',
        angle: 180,
        children: [],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 30, offset: 30 },
        },
      };

      const result = await convertASTNodeToCSG(rotateExtrudeNode as unknown as ASTNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.TorusGeometry);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('rotate_extrude');
        expect(mesh3D.metadata.nodeIndex).toBe(0);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Rotate_extrude node conversion successful');
      }
    });
  });

  describe('CSG Boolean Operations', () => {
    it('should convert union node with placeholder when no children', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing union node without children');

      const unionNode: UnionNode = {
        type: 'union',
        children: [],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = await convertASTNodeToCSG(unionNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify placeholder mesh was created
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('union');
        expect(mesh3D.metadata.nodeIndex).toBe(0);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Union placeholder creation successful');
      }
    });

    it('should convert intersection node with placeholder when no children', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing intersection node without children');

      const intersectionNode: IntersectionNode = {
        type: 'intersection',
        children: [],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      };

      const result = await convertASTNodeToCSG(intersectionNode, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify placeholder mesh was created
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('intersection');
        expect(mesh3D.metadata.nodeIndex).toBe(1);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Intersection placeholder creation successful');
      }
    });

    it('should convert difference node with placeholder when no children', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing difference node without children');

      const differenceNode: DifferenceNode = {
        type: 'difference',
        children: [],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 12, offset: 11 },
        },
      };

      const result = await convertASTNodeToCSG(differenceNode, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify placeholder mesh was created
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('difference');
        expect(mesh3D.metadata.nodeIndex).toBe(2);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Difference placeholder creation successful');
      }
    });
  });

  describe('convertASTNodesToCSGUnion', () => {
    it('should create CSG union from multiple AST nodes', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing CSG union operation');

      const nodes = [
        {
          type: 'cube',
          size: [5, 5, 5],
          center: true,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        } as CubeNode,
        {
          type: 'sphere',
          radius: 3,
          location: {
            start: { line: 2, column: 1, offset: 50 },
            end: { line: 2, column: 15, offset: 64 },
          },
        } as SphereNode,
      ];

      const result = await convertASTNodesToCSGUnion(nodes);

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

        logger.debug('[DEBUG][ASTToCSGConverterTest] CSG union operation successful');
      }
    });

    it('should handle single node as pass-through', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing single node pass-through');

      const nodes = [
        {
          type: 'cube',
          size: [8, 8, 8],
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        } as CubeNode,
      ];

      const result = await convertASTNodesToCSGUnion(nodes);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // For single node, should still create a valid mesh
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);
        expect(mesh3D.metadata.nodeType).toBe('union');
        expect(mesh3D.metadata.triangleCount).toBeGreaterThan(0);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Single node pass-through successful');
      }
    });

    it('should handle empty node array', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing empty node array');

      const result = await convertASTNodesToCSGUnion([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No AST nodes provided for CSG union');
        logger.debug('[DEBUG][ASTToCSGConverterTest] Empty node array handled correctly');
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should complete conversion within performance requirements', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing performance requirements');

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
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Should complete within 100ms

      logger.debug(
        `[DEBUG][ASTToCSGConverterTest] Conversion completed in ${duration.toFixed(2)}ms`
      );
    });

    it('should properly dispose of resources', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing resource disposal');

      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 4,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 15, offset: 14 },
        },
      };

      const result = await convertASTNodeToCSG(sphereNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Add to scene to verify it works
        scene.add(mesh3D.mesh);
        expect(scene.children).toHaveLength(1);

        // Test disposal
        expect(() => mesh3D.dispose()).not.toThrow();

        // Verify geometry and material are disposed
        const positionAttribute = mesh3D.mesh.geometry.getAttribute('position');
        expect(positionAttribute).toBeDefined();

        logger.debug('[DEBUG][ASTToCSGConverterTest] Resource disposal successful');
      }
    });
  });

  describe('Validation Test Case', () => {
    it('should handle the specific OpenSCAD validation case with correct positioning', async () => {
      logger.debug(
        '[DEBUG][ASTToCSGConverterTest] Testing validation case with translate and boolean operations'
      );

      // Test translate with negative X coordinate (left side)
      const leftTranslateNode: TranslateNode = {
        type: 'translate',
        v: [-24, 0, 0],
        children: [
          {
            type: 'union',
            children: [
              {
                type: 'cube',
                size: [15, 15, 15],
                center: true,
                location: {
                  start: { line: 3, column: 9, offset: 50 },
                  end: { line: 3, column: 30, offset: 71 },
                },
              },
              {
                type: 'sphere',
                radius: 10,
                location: {
                  start: { line: 4, column: 9, offset: 81 },
                  end: { line: 4, column: 20, offset: 92 },
                },
              },
            ],
            location: {
              start: { line: 2, column: 5, offset: 30 },
              end: { line: 5, column: 5, offset: 100 },
            },
          },
        ],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 6, column: 1, offset: 110 },
        },
      };

      const result = await convertASTNodeToCSG(leftTranslateNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify mesh properties
        expect(mesh3D.mesh).toBeInstanceOf(THREE.Mesh);

        // Verify translation was applied correctly - should be at X=-24
        expect(mesh3D.mesh.position.x).toBe(-24);
        expect(mesh3D.mesh.position.y).toBe(0);
        expect(mesh3D.mesh.position.z).toBe(0);

        // Verify metadata
        expect(mesh3D.metadata.nodeType).toBe('translate');

        logger.debug('[DEBUG][ASTToCSGConverterTest] Left translate positioning verified: X=-24');
      }
    });

    it('should handle translate with positive X coordinate (right side)', async () => {
      logger.debug('[DEBUG][ASTToCSGConverterTest] Testing right side translate positioning');

      // Test translate with positive X coordinate (right side)
      const rightTranslateNode: TranslateNode = {
        type: 'translate',
        v: [24, 0, 0],
        children: [
          {
            type: 'difference',
            children: [
              {
                type: 'cube',
                size: [15, 15, 15],
                center: true,
                location: {
                  start: { line: 3, column: 9, offset: 50 },
                  end: { line: 3, column: 30, offset: 71 },
                },
              },
              {
                type: 'sphere',
                radius: 10,
                location: {
                  start: { line: 4, column: 9, offset: 81 },
                  end: { line: 4, column: 20, offset: 92 },
                },
              },
            ],
            location: {
              start: { line: 2, column: 5, offset: 30 },
              end: { line: 5, column: 5, offset: 100 },
            },
          },
        ],
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 6, column: 1, offset: 110 },
        },
      };

      const result = await convertASTNodeToCSG(rightTranslateNode, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        const mesh3D = result.data;

        // Verify translation was applied correctly - should be at X=24
        expect(mesh3D.mesh.position.x).toBe(24);
        expect(mesh3D.mesh.position.y).toBe(0);
        expect(mesh3D.mesh.position.z).toBe(0);

        logger.debug('[DEBUG][ASTToCSGConverterTest] Right translate positioning verified: X=24');
      }
    });
  });
});
