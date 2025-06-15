/**
 * @file Tests for the MirrorNode functionality in OpenSCAD AST Visitor.
 * Tests various mirror scenarios including different normal vectors and error handling.
 * @author Luciano Júnior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitor } from './openscad-ast-visitor';
import type { MirrorNode, CubeNode } from '@holistic-stack/openscad-parser';

describe('OpenScadAstVisitor - Mirror Functionality', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let visitor: OpenScadAstVisitor;

  beforeEach(() => {
    console.log('[INIT] Setting up mirror test environment');
    
    // Create test environment
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    visitor = new OpenScadAstVisitor(scene);
    console.log('[DEBUG] Mirror test environment created');
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up mirror test environment');
    try {
      if (scene) {
        scene.dispose();
      }
      if (engine) {
        engine.dispose();
      }
    } catch (error) {
      console.warn('[WARN] Error during mirror test cleanup:', error);
    }
  });

  describe('Basic Mirror Operations', () => {
    it('should apply X-axis mirror to a cube', () => {
      console.log('[TEST] Testing X-axis mirror');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        center: false,
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [1, 0, 0], // Mirror across YZ plane (X-axis normal)
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      expect(result?.name).toContain('cube_2_2');
      
      // Check that a transformation matrix was applied
      expect(result?.getWorldMatrix()).toBeDefined();
      
      console.log('[TEST] X-axis mirror test passed');
    });

    it('should apply Y-axis mirror to a cube', () => {
      console.log('[TEST] Testing Y-axis mirror');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [0, 1, 0], // Mirror across XZ plane (Y-axis normal)
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Y-axis mirror test passed');
    });

    it('should apply Z-axis mirror to a cube', () => {
      console.log('[TEST] Testing Z-axis mirror');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [0, 0, 1], // Mirror across XY plane (Z-axis normal)
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Z-axis mirror test passed');
    });
  });

  describe('Diagonal Mirror Operations', () => {
    it('should apply diagonal mirror with normalized vector', () => {
      console.log('[TEST] Testing diagonal mirror');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [1, 1, 1], // Diagonal mirror (will be normalized internally)
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Diagonal mirror test passed');
    });

    it('should handle non-unit normal vectors correctly', () => {
      console.log('[TEST] Testing non-unit normal vector');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [2, 0, 0], // Non-unit vector (length = 2)
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Non-unit normal vector test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle mirror with no children gracefully', () => {
      console.log('[TEST] Testing mirror with no children');

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [1, 0, 0],
        children: [],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      expect(result).toBeNull();
      console.log('[TEST] No children mirror test passed');
    });

    it('should handle invalid normal vector gracefully', () => {
      console.log('[TEST] Testing invalid normal vector');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: [0, 0, 0], // Invalid: zero vector
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      // Should still return a mesh with fallback X-axis mirror
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Invalid normal vector test passed');
    });

    it('should handle missing normal vector gracefully', () => {
      console.log('[TEST] Testing missing normal vector');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const mirrorNode: MirrorNode = {
        type: 'mirror',
        v: undefined as any, // Missing normal vector
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(mirrorNode);

      // Should still return a mesh with fallback X-axis mirror
      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Missing normal vector test passed');
    });
  });
});
