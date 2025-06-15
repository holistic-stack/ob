/**
 * @file Tests for the enhanced OpenSCAD AST visitor
 * Tests the integration with @holistic-stack/openscad-parser and CSG2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitor } from './openscad-ast-visitor';
import type { CubeNode, SphereNode, CylinderNode } from '@holistic-stack/openscad-parser';

describe('Enhanced OpenScadAstVisitor', () => {
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let visitor: OpenScadAstVisitor;

  beforeEach(() => {
    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();
    
    // Create a real scene
    scene = new BABYLON.Scene(engine);
    
    // Create visitor
    visitor = new OpenScadAstVisitor(scene);
  });

  describe('Primitive Node Handling', () => {
    it('should handle CubeNode with size parameter', () => {
      console.log('[TEST] Testing CubeNode handling');
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: 10, // Simple number size
        center: false,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 10, offset: 10 }
        }
      };

      const mesh = visitor.visit(cubeNode);
      
      expect(mesh).not.toBeNull();
      expect(mesh!.name).toContain('cube');
      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] CubeNode test passed');
    });

    it('should handle SphereNode with radius parameter', () => {
      console.log('[TEST] Testing SphereNode handling');
      
      const sphereNode: SphereNode = {
        type: 'sphere',
        radius: 5, // Radius parameter
        location: {
          start: { line: 1, column: 0, offset: 11 },
          end: { line: 1, column: 12, offset: 23 }
        }
      };

      const mesh = visitor.visit(sphereNode);
      
      expect(mesh).not.toBeNull();
      expect(mesh!.name).toContain('sphere');
      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] SphereNode test passed');
    });

    it('should handle CylinderNode with height and radius', () => {
      console.log('[TEST] Testing CylinderNode handling');
      
      const cylinderNode: CylinderNode = {
        type: 'cylinder',
        h: 10, // Height parameter
        r: 3,  // Radius parameter
        center: false,
        location: {
          start: { line: 2, column: 0, offset: 24 },
          end: { line: 2, column: 18, offset: 42 }
        }
      };

      const mesh = visitor.visit(cylinderNode);
      
      expect(mesh).not.toBeNull();
      expect(mesh!.name).toContain('cylinder');
      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] CylinderNode test passed');
    });
  });

  describe('Type Guard Integration', () => {
    it('should use type guards for safe node dispatching', () => {
      console.log('[TEST] Testing type guard integration');
      
      const cubeNode: CubeNode = {
        type: 'cube',
        size: [2, 3, 4], // Vector size
        center: true,
      };

      const mesh = visitor.visit(cubeNode);
      
      expect(mesh).not.toBeNull();
      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Type guard integration test passed');
    });

    it('should handle unknown node types gracefully', () => {
      console.log('[TEST] Testing unknown node type handling');
      
      const unknownNode = {
        type: 'unknown_node_type',
        someProperty: 'value'
      } as any;

      const mesh = visitor.visit(unknownNode);
      
      expect(mesh).toBeNull();
      
      console.log('[TEST] Unknown node type test passed');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters gracefully', () => {
      console.log('[TEST] Testing error handling for invalid parameters');
      
      const invalidCubeNode: CubeNode = {
        type: 'cube',
        size: null as any, // Invalid size
        center: false,
      };

      const mesh = visitor.visit(invalidCubeNode);
      
      // Should still create a mesh with default values
      expect(mesh).not.toBeNull();
      expect(mesh).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[TEST] Error handling test passed');
    });
  });
});
