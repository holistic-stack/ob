/**
 * @file Tests for the CSG2-based OpenSCAD AST Visitor.
 * @author Luciano Júnior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitorCSG2 } from './openscad-ast-visitor-csg2';
import type { CubeNode, SphereNode, UnionNode } from '@holistic-stack/openscad-parser';

describe('OpenScadAstVisitorCSG2', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let visitor: OpenScadAstVisitorCSG2;

  beforeEach(async () => {
    // Initialize CSG2 before tests
    if (!BABYLON.IsCSG2Ready()) {
      await BABYLON.InitializeCSG2Async();
    }
    
    // Create test environment
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    visitor = new OpenScadAstVisitorCSG2(scene);
  });

  afterEach(() => {
    scene.dispose();
    engine.dispose();
  });

  describe('visitCube', () => {
    it('should create a cube mesh with default dimensions', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 1, column: 10, offset: 9 } 
        }
      };

      const result = visitor.visit(cubeNode);

      expect(result).not.toBeNull();
      expect(result?.name).toContain('cube_1_1');
      expect(result?.getBoundingInfo()).toBeDefined();
    });

    it('should create a cube mesh with custom dimensions', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 3, 4],
        location: { 
          start: { line: 2, column: 5, offset: 20 }, 
          end: { line: 2, column: 15, offset: 30 } 
        }
      };

      const result = visitor.visit(cubeNode);

      expect(result).not.toBeNull();
      expect(result?.name).toContain('cube_2_5');
    });
  });

  describe('visitSphere', () => {
    it('should create a sphere mesh with default radius', () => {
      const sphereNode: SphereNode = {
        type: 'sphere',
        location: { 
          start: { line: 3, column: 1, offset: 40 }, 
          end: { line: 3, column: 10, offset: 49 } 
        }
      };

      const result = visitor.visit(sphereNode);

      expect(result).not.toBeNull();
      expect(result?.name).toContain('sphere_3_1');
    });
  });

  describe('visitUnion', () => {
    it('should return null for union with no children', () => {
      const unionNode: UnionNode = {
        type: 'union',
        children: [],
        location: { 
          start: { line: 4, column: 1, offset: 50 }, 
          end: { line: 6, column: 1, offset: 70 } 
        }
      };

      const result = visitor.visit(unionNode);

      expect(result).toBeNull();
    });

    it('should return the single child for union with one child', () => {
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 5, column: 2, offset: 55 }, 
          end: { line: 5, column: 12, offset: 65 } 
        }
      };

      const unionNode: UnionNode = {
        type: 'union',
        children: [cubeNode],
        location: { 
          start: { line: 4, column: 1, offset: 50 }, 
          end: { line: 6, column: 1, offset: 70 } 
        }
      };

      const result = visitor.visit(unionNode);

      expect(result).not.toBeNull();
      expect(result?.name).toContain('cube_5_2');
    });

    it('should perform CSG2 union operation with multiple children', () => {
      const cube1: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 5, column: 2, offset: 55 }, 
          end: { line: 5, column: 12, offset: 65 } 
        }
      };

      const cube2: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 6, column: 2, offset: 75 }, 
          end: { line: 6, column: 12, offset: 85 } 
        }
      };

      const unionNode: UnionNode = {
        type: 'union',
        children: [cube1, cube2],
        location: { 
          start: { line: 4, column: 1, offset: 50 }, 
          end: { line: 7, column: 1, offset: 90 } 
        }
      };

      const result = visitor.visit(unionNode);

      expect(result).not.toBeNull();
      expect(result?.name).toContain('union_4_1');
    });
  });

  describe('error handling', () => {
    it('should handle unknown node types gracefully', () => {
      const unknownNode = {
        type: 'unknown',
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 1, column: 10, offset: 9 } 
        }
      } as any;

      const result = visitor.visit(unknownNode);

      expect(result).toBeNull();
    });
  });
});
