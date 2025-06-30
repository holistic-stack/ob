/**
 * Primitive Renderer Service Test Suite
 *
 * Tests for primitive renderer service following TDD methodology
 * with real Three.js geometry creation and OpenSCAD AST rendering.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Three.js with proper BufferGeometry types
vi.mock('three', async () => {
  const actual = await vi.importActual('three');

  // Create mocked geometries that extend the base geometry structure
  const mockBoxGeometry = vi.fn().mockImplementation((_width = 1, _height = 1, _depth = 1) => {
    const geometry = Object.create((actual as any).BufferGeometry.prototype);
    Object.assign(geometry, {
      type: 'BoxGeometry',
      dispose: vi.fn(),
      setAttribute: vi.fn(),
      setIndex: vi.fn(),
      computeVertexNormals: vi.fn(),
      getAttribute: vi.fn(),
      attributes: { position: { count: 24 } },
      index: { count: 36 },
    });
    return geometry;
  });

  const mockSphereGeometry = vi
    .fn()
    .mockImplementation((_radius = 1, _widthSegments = 32, _heightSegments = 16) => {
      const geometry = Object.create((actual as any).BufferGeometry.prototype);
      Object.assign(geometry, {
        type: 'SphereGeometry',
        dispose: vi.fn(),
        setAttribute: vi.fn(),
        setIndex: vi.fn(),
        computeVertexNormals: vi.fn(),
        getAttribute: vi.fn(),
        attributes: { position: { count: 100 } },
        index: { count: 300 },
      });
      return geometry;
    });

  const mockCylinderGeometry = vi
    .fn()
    .mockImplementation((_radiusTop = 1, _radiusBottom = 1, _height = 1, _radialSegments = 32) => {
      const geometry = Object.create((actual as any).BufferGeometry.prototype);
      Object.assign(geometry, {
        type: 'CylinderGeometry',
        dispose: vi.fn(),
        setAttribute: vi.fn(),
        setIndex: vi.fn(),
        computeVertexNormals: vi.fn(),
        getAttribute: vi.fn(),
        attributes: { position: { count: 64 } },
        index: { count: 192 },
      });
      return geometry;
    });

  const mockMeshStandardMaterial = vi.fn().mockImplementation((params = {}) => {
    const material = Object.create((actual as any).Material.prototype);
    Object.assign(material, {
      type: 'MeshStandardMaterial',
      dispose: vi.fn(),
      clone: vi.fn().mockReturnThis(),
      copy: vi.fn().mockReturnThis(),
      color: params.color || { r: 1, g: 1, b: 1, getHex: () => 0xffffff },
      metalness: params.metalness || 0,
      roughness: params.roughness || 1,
      wireframe: params.wireframe || false,
      transparent: params.transparent || false,
      opacity: params.opacity || 1,
      side: params.side || 0, // THREE.FrontSide
    });
    return material;
  });

  return {
    ...actual,
    BoxGeometry: mockBoxGeometry,
    SphereGeometry: mockSphereGeometry,
    CylinderGeometry: mockCylinderGeometry,
    MeshStandardMaterial: mockMeshStandardMaterial,
    MeshBasicMaterial: vi.fn().mockImplementation((params = {}) => {
      const material = Object.create((actual as any).Material.prototype);
      Object.assign(material, {
        type: 'MeshBasicMaterial',
        dispose: vi.fn(),
        wireframe: params.wireframe || false,
        transparent: params.transparent || false,
        opacity: params.opacity || 1,
      });
      return material;
    }),
    FrontSide: 0,
    DoubleSide: 2,
    Color: (actual as any).Color,
  };
});

import type { MaterialConfig, PrimitiveParams } from '../types/renderer.types';
import {
  createMaterialFactory,
  createPrimitiveRendererFactory,
  renderASTNode,
  renderPrimitive,
} from './primitive-renderer';

describe('Primitive Renderer Service', () => {
  let geometryFactory: ReturnType<typeof createPrimitiveRendererFactory>;
  let materialFactory: ReturnType<typeof createMaterialFactory>;

  beforeEach(() => {
    geometryFactory = createPrimitiveRendererFactory();
    materialFactory = createMaterialFactory();
  });

  afterEach(() => {
    // Clean up any created geometries and materials
    vi.restoreAllMocks();
  });

  describe('Geometry Factory', () => {
    describe('createCube', () => {
      it('should create cube geometry with single size parameter', () => {
        const result = geometryFactory.createCube(2);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.BoxGeometry);
          expect(result.data.type).toBe('BoxGeometry');
        }
      });

      it('should create cube geometry with array size parameter', () => {
        const result = geometryFactory.createCube([2, 3, 4]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.BoxGeometry);
          expect(result.data.type).toBe('BoxGeometry');
        }
      });

      it('should fail for negative dimensions', () => {
        const result = geometryFactory.createCube([-1, 2, 3]);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Cube dimensions must be positive');
        }
      });

      it('should fail for zero dimensions', () => {
        const result = geometryFactory.createCube([1, 0, 3]);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Cube dimensions must be positive');
        }
      });
    });

    describe('createSphere', () => {
      it('should create sphere geometry with default segments', () => {
        const result = geometryFactory.createSphere(5);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.SphereGeometry);
          expect(result.data.type).toBe('SphereGeometry');
        }
      });

      it('should create sphere geometry with custom segments', () => {
        const result = geometryFactory.createSphere(3, 16);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.SphereGeometry);
          expect(result.data.type).toBe('SphereGeometry');
        }
      });

      it('should fail for negative radius', () => {
        const result = geometryFactory.createSphere(-1);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Sphere radius must be positive');
        }
      });

      it('should fail for insufficient segments', () => {
        const result = geometryFactory.createSphere(1, 2);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Sphere segments must be at least 3');
        }
      });
    });

    describe('createCylinder', () => {
      it('should create cylinder geometry with default segments', () => {
        const result = geometryFactory.createCylinder(2, 5);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.CylinderGeometry);
          expect(result.data.type).toBe('CylinderGeometry');
        }
      });

      it('should create cylinder geometry with custom segments', () => {
        const result = geometryFactory.createCylinder(1, 3, 8);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.CylinderGeometry);
          expect(result.data.type).toBe('CylinderGeometry');
        }
      });

      it('should fail for negative radius', () => {
        const result = geometryFactory.createCylinder(-1, 5);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Cylinder radius must be positive');
        }
      });

      it('should fail for negative height', () => {
        const result = geometryFactory.createCylinder(1, -5);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Cylinder height must be positive');
        }
      });
    });

    describe('createPolyhedron', () => {
      it('should create polyhedron geometry from vertices and faces', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ] as const;

        const faces = [
          [0, 1, 2],
          [0, 1, 3],
          [0, 2, 3],
          [1, 2, 3],
        ] as const;

        const result = geometryFactory.createPolyhedron(vertices, faces);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.BufferGeometry);
          expect(result.data.attributes.position).toBeDefined();
          expect(result.data.index).toBeDefined();
        }
      });

      it('should fail for insufficient vertices', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ] as const;
        const faces = [[0, 1, 2]] as const;

        const result = geometryFactory.createPolyhedron(vertices, faces);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Polyhedron must have at least 4 vertices');
        }
      });

      it('should fail for insufficient faces', () => {
        const vertices = [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ] as const;
        const faces = [[0, 1, 2]] as const;

        const result = geometryFactory.createPolyhedron(vertices, faces);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Polyhedron must have at least 4 faces');
        }
      });
    });
  });

  describe('Material Factory', () => {
    describe('createStandard', () => {
      it('should create standard material with default properties', () => {
        const config: MaterialConfig = {
          color: '#ff0000',
          opacity: 1,
          metalness: 0.2,
          roughness: 0.7,
          wireframe: false,
          transparent: false,
          side: 'front',
        };

        const result = materialFactory.createStandard(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.MeshStandardMaterial);
          expect(result.data.type).toBe('MeshStandardMaterial');
          expect((result.data as any).color.getHex()).toBe(0xff0000);
          expect((result.data as any).opacity).toBe(1);
          expect((result.data as any).metalness).toBe(0.2);
          expect((result.data as any).roughness).toBe(0.7);
          expect((result.data as any).wireframe).toBe(false);
          expect(result.data.transparent).toBe(false);
          expect(result.data.side).toBe(THREE.FrontSide);
        }
      });

      it('should create transparent material when opacity < 1', () => {
        const config: MaterialConfig = {
          color: '#00ff00',
          opacity: 0.5,
          metalness: 0.1,
          roughness: 0.8,
          wireframe: false,
          transparent: false,
          side: 'double',
        };

        const result = materialFactory.createStandard(config);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.transparent).toBe(true);
          expect(result.data.opacity).toBe(0.5);
          expect(result.data.side).toBe(THREE.DoubleSide);
        }
      });
    });

    describe('createWireframe', () => {
      it('should create wireframe material', () => {
        const result = materialFactory.createWireframe('#0000ff');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.MeshBasicMaterial);
          expect((result.data as any).wireframe).toBe(true);
          expect(result.data.transparent).toBe(true);
          expect(result.data.opacity).toBe(0.8);
        }
      });
    });

    describe('createTransparent', () => {
      it('should create transparent material', () => {
        const result = materialFactory.createTransparent('#ffff00', 0.3);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBeInstanceOf(THREE.MeshStandardMaterial);
          expect(result.data.transparent).toBe(true);
          expect(result.data.opacity).toBe(0.3);
          expect(result.data.side).toBe(THREE.DoubleSide);
        }
      });

      it('should fail for invalid opacity values', () => {
        const result = materialFactory.createTransparent('#ffffff', 1.5);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Opacity must be between 0 and 1');
        }
      });
    });
  });

  describe('renderPrimitive', () => {
    it('should render cube primitive', () => {
      const params: PrimitiveParams = {
        type: 'cube',
        parameters: { size: [2, 3, 4] },
        transformations: [],
        material: {
          color: '#ff0000',
          opacity: 1,
          metalness: 0.1,
          roughness: 0.8,
          wireframe: false,
          transparent: false,
          side: 'front',
        },
      };

      const result = renderPrimitive(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeInstanceOf(THREE.Mesh);
        expect(result.data.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
        expect(result.data.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
        expect(result.data.metadata.nodeType).toBe('cube');
        expect(result.data.metadata.triangleCount).toBeGreaterThan(0);
        expect(result.data.metadata.vertexCount).toBeGreaterThan(0);
        expect(typeof result.data.dispose).toBe('function');
      }
    });

    it('should render sphere primitive', () => {
      const params: PrimitiveParams = {
        type: 'sphere',
        parameters: { radius: 5, segments: 16 },
        transformations: [],
        material: {
          color: '#00ff00',
          opacity: 0.8,
          metalness: 0.2,
          roughness: 0.6,
          wireframe: false,
          transparent: true,
          side: 'double',
        },
      };

      const result = renderPrimitive(params);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
        expect(result.data.metadata.nodeType).toBe('sphere');
      }
    });

    it('should fail for unsupported primitive type', () => {
      const params: PrimitiveParams = {
        type: 'unknown' as any,
        parameters: {},
        transformations: [],
        material: {
          color: '#ffffff',
          opacity: 1,
          metalness: 0.1,
          roughness: 0.8,
          wireframe: false,
          transparent: false,
          side: 'front',
        },
      };

      const result = renderPrimitive(params);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported primitive type: unknown');
      }
    });
  });

  describe('renderASTNode', () => {
    it('should render cube AST node', async () => {
      const node: ASTNode = {
        type: 'cube',
        size: [1, 2, 3],
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = await renderASTNode(node, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh).toBeInstanceOf(THREE.Mesh);
        expect(result.data.metadata.nodeType).toBe('cube');
        expect(result.data.metadata.nodeIndex).toBe(0);
        expect(result.data.metadata.id).toBe('cube-0');
      }
    });

    it('should render sphere AST node with transformations', async () => {
      const node: ASTNode = {
        type: 'sphere',
        radius: 2,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = await renderASTNode(node, 1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
        expect(result.data.metadata.nodeIndex).toBe(1);
        expect(result.data.metadata.id).toBe('sphere-1');

        // Check that transformations were applied
        expect(result.data.mesh.position.y).toBe(1);
        expect(result.data.mesh.rotation.x).toBeCloseTo(Math.PI / 2);
        expect(result.data.mesh.scale.z).toBe(2);
      }
    });

    it('should handle AST node with minimal parameters', async () => {
      const node: ASTNode = {
        type: 'cylinder',
        h: 1,
        r: 0.5,
        center: false,
        location: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 10, offset: 9 },
        },
      };

      const result = await renderASTNode(node, 2);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mesh.geometry).toBeInstanceOf(THREE.CylinderGeometry);
        expect(result.data.metadata.nodeIndex).toBe(2);
      }
    });
  });
});
