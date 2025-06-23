/**
 * @file R3F AST Visitor Tests
 * 
 * TDD tests for the R3F AST visitor following React 19 best practices
 * and functional programming principles. Tests the conversion of OpenSCAD AST nodes
 * to Three.js geometries and meshes.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { R3FASTVisitor, createR3FASTVisitor } from './r3f-ast-visitor';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { R3FASTVisitorConfig } from '../../types/r3f-csg-types';

// Mock Three.js for testing
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    BoxGeometry: vi.fn().mockImplementation((width, height, depth) => ({
      type: 'BoxGeometry',
      parameters: { width, height, depth },
      dispose: vi.fn()
    })),
    SphereGeometry: vi.fn().mockImplementation((radius, widthSegments, heightSegments) => ({
      type: 'SphereGeometry',
      parameters: { radius, widthSegments, heightSegments },
      dispose: vi.fn()
    })),
    CylinderGeometry: vi.fn().mockImplementation((radiusTop, radiusBottom, height, segments) => ({
      type: 'CylinderGeometry',
      parameters: { radiusTop, radiusBottom, height, segments },
      dispose: vi.fn()
    })),
    MeshStandardMaterial: vi.fn().mockImplementation((params) => ({
      type: 'MeshStandardMaterial',
      ...params,
      dispose: vi.fn()
    })),
    MeshBasicMaterial: vi.fn().mockImplementation((params) => ({
      type: 'MeshBasicMaterial',
      ...params,
      dispose: vi.fn()
    })),
    Mesh: vi.fn().mockImplementation((geometry, material) => ({
      type: 'Mesh',
      geometry,
      material,
      name: '',
      position: { set: vi.fn() },
      rotation: { set: vi.fn() },
      scale: { set: vi.fn() }
    })),
    FrontSide: 'FrontSide'
  };
});

describe('R3FASTVisitor', () => {
  let visitor: R3FASTVisitor;

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F AST visitor test');
    visitor = createR3FASTVisitor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F AST visitor test');
    visitor.dispose();
    vi.clearAllMocks();
  });

  describe('constructor and configuration', () => {
    it('should create visitor with default configuration', () => {
      console.log('[DEBUG] Testing visitor creation with defaults');
      
      const defaultVisitor = createR3FASTVisitor();
      expect(defaultVisitor).toBeDefined();
      expect(typeof defaultVisitor.visit).toBe('function');
      expect(typeof defaultVisitor.dispose).toBe('function');
    });

    it('should create visitor with custom configuration', () => {
      console.log('[DEBUG] Testing visitor creation with custom config');
      
      const config: R3FASTVisitorConfig = {
        enableCSG: false,
        enableCaching: false,
        geometryPrecision: 16,
        enableLogging: false
      };
      
      const customVisitor = createR3FASTVisitor(config);
      expect(customVisitor).toBeDefined();
      
      customVisitor.dispose();
    });
  });

  describe('primitive node processing', () => {
    it('should process cube node with default dimensions', () => {
      console.log('[DEBUG] Testing cube node processing');
      
      const cubeNode: ASTNode = {
        type: 'cube',
        size: [2, 3, 4],
        location: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } }
      } as any;
      
      const result = visitor.visit(cubeNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Mesh');
        expect(result.data.geometry.type).toBe('BoxGeometry');
        expect(result.data.geometry.parameters).toEqual({
          width: 2,
          height: 3,
          depth: 4
        });
        expect(THREE.BoxGeometry).toHaveBeenCalledWith(2, 3, 4);
        expect(THREE.Mesh).toHaveBeenCalled();
      }
    });

    it('should process cube node with single dimension', () => {
      console.log('[DEBUG] Testing cube node with single dimension');
      
      const cubeNode: ASTNode = {
        type: 'cube',
        size: 5,
        location: { start: { line: 2, column: 1 }, end: { line: 2, column: 8 } }
      } as any;
      
      const result = visitor.visit(cubeNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometry.parameters).toEqual({
          width: 5,
          height: 5,
          depth: 5
        });
      }
    });

    it('should process sphere node with radius', () => {
      console.log('[DEBUG] Testing sphere node processing');
      
      const sphereNode: ASTNode = {
        type: 'sphere',
        r: 2.5,
        location: { start: { line: 3, column: 1 }, end: { line: 3, column: 12 } }
      } as any;
      
      const result = visitor.visit(sphereNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Mesh');
        expect(result.data.geometry.type).toBe('SphereGeometry');
        expect(result.data.geometry.parameters.radius).toBe(2.5);
        expect(THREE.SphereGeometry).toHaveBeenCalledWith(2.5, 32, 32);
      }
    });

    it('should process cylinder node with height and radius', () => {
      console.log('[DEBUG] Testing cylinder node processing');
      
      const cylinderNode: ASTNode = {
        type: 'cylinder',
        h: 10,
        r: 3,
        location: { start: { line: 4, column: 1 }, end: { line: 4, column: 15 } }
      } as any;
      
      const result = visitor.visit(cylinderNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Mesh');
        expect(result.data.geometry.type).toBe('CylinderGeometry');
        expect(result.data.geometry.parameters).toEqual({
          radiusTop: 3,
          radiusBottom: 3,
          height: 10,
          segments: 32
        });
        expect(THREE.CylinderGeometry).toHaveBeenCalledWith(3, 3, 10, 32);
      }
    });

    it('should process cylinder node with different top and bottom radii', () => {
      console.log('[DEBUG] Testing cylinder node with different radii');
      
      const cylinderNode: ASTNode = {
        type: 'cylinder',
        h: 8,
        r1: 2,
        r2: 4,
        location: { start: { line: 5, column: 1 }, end: { line: 5, column: 20 } }
      } as any;
      
      const result = visitor.visit(cylinderNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.geometry.parameters).toEqual({
          radiusTop: 4,
          radiusBottom: 2,
          height: 8,
          segments: 32
        });
        expect(THREE.CylinderGeometry).toHaveBeenCalledWith(4, 2, 8, 32);
      }
    });
  });

  describe('transformation node processing', () => {
    it('should process translate node', () => {
      console.log('[DEBUG] Testing translate node processing');
      
      const translateNode: ASTNode = {
        type: 'translate',
        v: [5, 10, 15],
        children: [{
          type: 'cube',
          size: [1, 1, 1],
          location: { start: { line: 6, column: 10 }, end: { line: 6, column: 20 } }
        }],
        location: { start: { line: 6, column: 1 }, end: { line: 6, column: 25 } }
      } as any;
      
      const result = visitor.visit(translateNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.position.set).toHaveBeenCalledWith(5, 10, 15);
      }
    });

    it('should process rotate node', () => {
      console.log('[DEBUG] Testing rotate node processing');
      
      const rotateNode: ASTNode = {
        type: 'rotate',
        a: [90, 45, 0],
        children: [{
          type: 'cube',
          size: [1, 1, 1],
          location: { start: { line: 7, column: 15 }, end: { line: 7, column: 25 } }
        }],
        location: { start: { line: 7, column: 1 }, end: { line: 7, column: 30 } }
      } as any;
      
      const result = visitor.visit(rotateNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        // 90 degrees = π/2 radians, 45 degrees = π/4 radians
        expect(result.data.rotation.set).toHaveBeenCalledWith(
          Math.PI / 2,
          Math.PI / 4,
          0
        );
      }
    });

    it('should process scale node', () => {
      console.log('[DEBUG] Testing scale node processing');
      
      const scaleNode: ASTNode = {
        type: 'scale',
        v: [2, 0.5, 3],
        children: [{
          type: 'sphere',
          r: 1,
          location: { start: { line: 8, column: 12 }, end: { line: 8, column: 18 } }
        }],
        location: { start: { line: 8, column: 1 }, end: { line: 8, column: 25 } }
      } as any;
      
      const result = visitor.visit(scaleNode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scale.set).toHaveBeenCalledWith(2, 0.5, 3);
      }
    });
  });

  describe('CSG operation node processing', () => {
    it('should process union node with multiple children', () => {
      console.log('[DEBUG] Testing union node processing');
      
      const unionNode: ASTNode = {
        type: 'union',
        children: [
          {
            type: 'cube',
            size: [1, 1, 1],
            location: { start: { line: 9, column: 5 }, end: { line: 9, column: 15 } }
          },
          {
            type: 'sphere',
            r: 0.8,
            location: { start: { line: 10, column: 5 }, end: { line: 10, column: 15 } }
          }
        ],
        location: { start: { line: 9, column: 1 }, end: { line: 11, column: 1 } }
      } as any;
      
      const result = visitor.visit(unionNode);
      
      // For now, union just returns the first mesh (CSG not yet implemented)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Mesh');
      }
    });

    it('should process difference node with multiple children', () => {
      console.log('[DEBUG] Testing difference node processing');
      
      const differenceNode: ASTNode = {
        type: 'difference',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            location: { start: { line: 12, column: 5 }, end: { line: 12, column: 15 } }
          },
          {
            type: 'sphere',
            r: 1.2,
            location: { start: { line: 13, column: 5 }, end: { line: 13, column: 15 } }
          }
        ],
        location: { start: { line: 12, column: 1 }, end: { line: 14, column: 1 } }
      } as any;
      
      const result = visitor.visit(differenceNode);
      
      // For now, difference just returns the first mesh (CSG not yet implemented)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Mesh');
      }
    });

    it('should process intersection node with multiple children', () => {
      console.log('[DEBUG] Testing intersection node processing');
      
      const intersectionNode: ASTNode = {
        type: 'intersection',
        children: [
          {
            type: 'cube',
            size: [2, 2, 2],
            location: { start: { line: 15, column: 5 }, end: { line: 15, column: 15 } }
          },
          {
            type: 'sphere',
            r: 1.5,
            location: { start: { line: 16, column: 5 }, end: { line: 16, column: 15 } }
          }
        ],
        location: { start: { line: 15, column: 1 }, end: { line: 17, column: 1 } }
      } as any;
      
      const result = visitor.visit(intersectionNode);
      
      // For now, intersection just returns the first mesh (CSG not yet implemented)
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('Mesh');
      }
    });
  });

  describe('error handling', () => {
    it('should handle unsupported node types', () => {
      console.log('[DEBUG] Testing unsupported node type handling');
      
      const unsupportedNode: ASTNode = {
        type: 'unsupported_type',
        location: { start: { line: 18, column: 1 }, end: { line: 18, column: 10 } }
      } as any;
      
      const result = visitor.visit(unsupportedNode);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported node type');
      }
    });

    it('should handle invalid node structure', () => {
      console.log('[DEBUG] Testing invalid node structure handling');
      
      const invalidNode = null as any;
      
      const result = visitor.visit(invalidNode);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid node');
      }
    });

    it('should handle union node with no children', () => {
      console.log('[DEBUG] Testing union node with no children');
      
      const emptyUnionNode: ASTNode = {
        type: 'union',
        children: [],
        location: { start: { line: 19, column: 1 }, end: { line: 19, column: 10 } }
      } as any;
      
      const result = visitor.visit(emptyUnionNode);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no children');
      }
    });

    it('should handle difference node with insufficient children', () => {
      console.log('[DEBUG] Testing difference node with insufficient children');
      
      const insufficientDifferenceNode: ASTNode = {
        type: 'difference',
        children: [{
          type: 'cube',
          size: [1, 1, 1],
          location: { start: { line: 20, column: 5 }, end: { line: 20, column: 15 } }
        }],
        location: { start: { line: 20, column: 1 }, end: { line: 21, column: 1 } }
      } as any;
      
      const result = visitor.visit(insufficientDifferenceNode);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least 2 children');
      }
    });

    it('should handle transformation node with no children', () => {
      console.log('[DEBUG] Testing transformation node with no children');
      
      const emptyTranslateNode: ASTNode = {
        type: 'translate',
        v: [1, 2, 3],
        children: [],
        location: { start: { line: 21, column: 1 }, end: { line: 21, column: 15 } }
      } as any;
      
      const result = visitor.visit(emptyTranslateNode);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('no children');
      }
    });
  });

  describe('resource management', () => {
    it('should dispose resources properly', () => {
      console.log('[DEBUG] Testing resource disposal');
      
      const cubeNode: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 22, column: 1 }, end: { line: 22, column: 10 } }
      } as any;
      
      const result = visitor.visit(cubeNode);
      expect(result.success).toBe(true);
      
      // Dispose should not throw
      expect(() => visitor.dispose()).not.toThrow();
    });

    it('should track processing metrics', () => {
      console.log('[DEBUG] Testing processing metrics');
      
      const cubeNode: ASTNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { start: { line: 23, column: 1 }, end: { line: 23, column: 10 } }
      } as any;
      
      const initialMetrics = visitor.getMetrics();
      expect(initialMetrics.totalNodes).toBe(0);
      expect(initialMetrics.processedNodes).toBe(0);
      
      visitor.visit(cubeNode);
      
      const finalMetrics = visitor.getMetrics();
      expect(finalMetrics.totalNodes).toBe(1);
      expect(finalMetrics.processedNodes).toBe(1);
      expect(finalMetrics.failedNodes).toBe(0);
    });
  });
});
