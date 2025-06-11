/**
 * @file Tests for the RotateNode functionality in OpenSCAD AST Visitor.
 * Tests various rotation scenarios including Euler angles and axis-angle rotation.
 * @author Luciano Júnior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitor } from './openscad-ast-visitor';
import type { RotateNode, CubeNode } from '@holistic-stack/openscad-parser';

describe('OpenScadAstVisitor - Rotate Functionality', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let visitor: OpenScadAstVisitor;

  beforeEach(() => {
    console.log('[INIT] Setting up rotate test environment');
    
    // Create test environment
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    visitor = new OpenScadAstVisitor(scene);
    console.log('[DEBUG] Rotate test environment created');
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up rotate test environment');
    try {
      if (scene) {
        scene.dispose();
      }
      if (engine) {
        engine.dispose();
      }
    } catch (error) {
      console.warn('[WARN] Error during rotate test cleanup:', error);
    }
  });

  describe('Euler Angles Rotation', () => {
    it('should apply Euler angles rotation to a cube', () => {
      console.log('[TEST] Testing Euler angles rotation');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        center: false,
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: [45, 30, 60], // Euler angles in degrees
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      expect(result?.name).toContain('cube_2_2');
      
      // Check that rotation was applied (converted to radians)
      const expectedRotationX = (45 * Math.PI) / 180;
      const expectedRotationY = (30 * Math.PI) / 180;
      const expectedRotationZ = (60 * Math.PI) / 180;
      
      expect(result?.rotation.x).toBeCloseTo(expectedRotationX, 5);
      expect(result?.rotation.y).toBeCloseTo(expectedRotationY, 5);
      expect(result?.rotation.z).toBeCloseTo(expectedRotationZ, 5);
      
      console.log('[TEST] Euler angles rotation test passed');
    });

    it('should handle zero rotation', () => {
      console.log('[TEST] Testing zero rotation');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: [0, 0, 0], // No rotation
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      expect(result).not.toBeNull();
      expect(result?.rotation.x).toBe(0);
      expect(result?.rotation.y).toBe(0);
      expect(result?.rotation.z).toBe(0);
      
      console.log('[TEST] Zero rotation test passed');
    });
  });

  describe('Axis-Angle Rotation', () => {
    it('should apply Z-axis rotation when only angle is provided', () => {
      console.log('[TEST] Testing Z-axis rotation');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: 90, // 90 degrees around Z-axis (default)
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      expect(result).not.toBeNull();
      expect(result?.rotation.x).toBe(0);
      expect(result?.rotation.y).toBe(0);
      expect(result?.rotation.z).toBeCloseTo((90 * Math.PI) / 180, 5);
      
      console.log('[TEST] Z-axis rotation test passed');
    });

    it('should apply X-axis rotation when axis is specified', () => {
      console.log('[TEST] Testing X-axis rotation with axis vector');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: 45, // 45 degrees
        v: [1, 0, 0], // Around X-axis
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      expect(result).not.toBeNull();
      expect(result?.rotation.x).toBeCloseTo((45 * Math.PI) / 180, 5);
      expect(result?.rotation.y).toBe(0);
      expect(result?.rotation.z).toBe(0);
      
      console.log('[TEST] X-axis rotation test passed');
    });

    it('should apply Y-axis rotation when axis is specified', () => {
      console.log('[TEST] Testing Y-axis rotation with axis vector');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 2, 2],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: -30, // -30 degrees
        v: [0, 1, 0], // Around Y-axis
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      expect(result).not.toBeNull();
      expect(result?.rotation.x).toBe(0);
      expect(result?.rotation.y).toBeCloseTo((-30 * Math.PI) / 180, 5);
      expect(result?.rotation.z).toBe(0);
      
      console.log('[TEST] Y-axis rotation test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle rotation with no children gracefully', () => {
      console.log('[TEST] Testing rotation with no children');

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: [45, 0, 0],
        children: [],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      expect(result).toBeNull();
      console.log('[TEST] No children rotation test passed');
    });

    it('should handle invalid rotation parameters gracefully', () => {
      console.log('[TEST] Testing invalid rotation parameters');

      const cubeNode: CubeNode = {
        type: 'cube',
        size: [1, 1, 1],
        location: { 
          start: { line: 2, column: 2, offset: 20 }, 
          end: { line: 2, column: 12, offset: 30 } 
        }
      };

      const rotateNode: RotateNode = {
        type: 'rotate',
        a: [45, 30] as any, // Invalid: only 2 elements instead of 3
        children: [cubeNode],
        location: { 
          start: { line: 1, column: 1, offset: 0 }, 
          end: { line: 3, column: 1, offset: 40 } 
        }
      };

      const result = visitor.visit(rotateNode);

      // Should still return a mesh with fallback zero rotation
      expect(result).not.toBeNull();
      expect(result?.rotation.x).toBe(0);
      expect(result?.rotation.y).toBe(0);
      expect(result?.rotation.z).toBe(0);
      
      console.log('[TEST] Invalid rotation parameters test passed');
    });
  });
});
