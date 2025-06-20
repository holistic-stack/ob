/**
 * Test suite for 2D primitive visitor methods in OpenScadAstVisitor
 * 
 * Tests the visitor methods for CircleNode, SquareNode, and PolygonNode
 * to ensure they create proper Babylon.js 2D meshes.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import type { CircleNode, SquareNode, PolygonNode } from '@holistic-stack/openscad-parser';
import { OpenScadAstVisitor } from './openscad-ast-visitor';
import { initializeCSG2ForTests } from '../../lib/initializers/csg2-test-initializer/csg2-test-initializer';

describe('[INIT] 2D Primitive Visitor Methods', () => {
  console.log('[INIT] Starting 2D primitive visitor tests');

  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;
  let visitor: OpenScadAstVisitor;

  beforeEach(async () => {
    console.log('[DEBUG] Setting up 2D primitive test environment');

    // Create a null engine (headless)
    engine = new BABYLON.NullEngine();

    // Create a real scene
    scene = new BABYLON.Scene(engine);

    // Initialize CSG2 for tests with shorter timeout
    await initializeCSG2ForTests({ timeout: 5000, enableLogging: false });

    // Create visitor instance
    visitor = new OpenScadAstVisitor(scene);

    console.log('[DEBUG] 2D primitive test environment created');
  }, 10000); // 10 second timeout for setup

  afterEach(() => {
    console.log('[DEBUG] Cleaning up 2D primitive test environment');
    
    // Clean up scene resources
    scene.dispose();
    engine.dispose();
    
    console.log('[DEBUG] 2D primitive test environment cleaned up');
  });

  describe('CircleNode Visitor', () => {
    it('should create a circle mesh with radius parameter', () => {
      console.log('[TEST] Testing circle creation with radius');
      
      const circleNode: CircleNode = {
        type: 'circle',
        r: 5,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 15, offset: 15 } }
      };

      const mesh = visitor.visit(circleNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('circle');
      expect(mesh?.getVerticesData(BABYLON.VertexBuffer.PositionKind)).toBeTruthy();
      
      console.log('[TEST] Circle creation test passed');
    });

    it('should create a circle mesh with diameter parameter', () => {
      console.log('[TEST] Testing circle creation with diameter');
      
      const circleNode: CircleNode = {
        type: 'circle',
        d: 10,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 15, offset: 15 } }
      };

      const mesh = visitor.visit(circleNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('circle');
      
      console.log('[TEST] Circle with diameter test passed');
    });

    it('should handle circle with missing parameters gracefully', () => {
      console.log('[TEST] Testing circle with missing parameters');
      
      // Create circle without radius/diameter using type assertion
      const circleNode = {
        type: 'circle' as const,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 15, offset: 15 } }
      } as CircleNode;

      const mesh = visitor.visit(circleNode);
      
      // Should still create a mesh with default radius
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('circle');
      
      console.log('[TEST] Circle missing parameters test passed');
    });
  });

  describe('SquareNode Visitor', () => {
    it('should create a square mesh with size parameter', () => {
      console.log('[TEST] Testing square creation with size');
      
      const squareNode: SquareNode = {
        type: 'square',
        size: [10, 20],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const mesh = visitor.visit(squareNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('square');
      expect(mesh?.getVerticesData(BABYLON.VertexBuffer.PositionKind)).toBeTruthy();
      
      console.log('[TEST] Square creation test passed');
    });

    it('should create a square mesh with uniform size', () => {
      console.log('[TEST] Testing square creation with uniform size');
      
      const squareNode: SquareNode = {
        type: 'square',
        size: 15,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 20 } }
      };

      const mesh = visitor.visit(squareNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('square');
      
      console.log('[TEST] Square uniform size test passed');
    });

    it('should handle square center parameter', () => {
      console.log('[TEST] Testing square with center parameter');
      
      const squareNode: SquareNode = {
        type: 'square',
        size: [8, 12],
        center: true,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 25, offset: 25 } }
      };

      const mesh = visitor.visit(squareNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('square');
      
      console.log('[TEST] Square center parameter test passed');
    });
  });

  describe('PolygonNode Visitor', () => {
    it('should create a polygon mesh with points', () => {
      console.log('[TEST] Testing polygon creation with points');
      
      const polygonNode: PolygonNode = {
        type: 'polygon',
        points: [[0, 0], [10, 0], [10, 10], [0, 10]],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 30, offset: 30 } }
      };

      const mesh = visitor.visit(polygonNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('polygon');
      expect(mesh?.getVerticesData(BABYLON.VertexBuffer.PositionKind)).toBeTruthy();
      
      console.log('[TEST] Polygon creation test passed');
    });

    it('should create a triangle polygon', () => {
      console.log('[TEST] Testing triangle polygon creation');
      
      const polygonNode: PolygonNode = {
        type: 'polygon',
        points: [[0, 0], [5, 0], [2.5, 5]],
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 25, offset: 25 } }
      };

      const mesh = visitor.visit(polygonNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('polygon');
      
      console.log('[TEST] Triangle polygon test passed');
    });

    it('should handle polygon with missing points gracefully', () => {
      console.log('[TEST] Testing polygon with missing points');
      
      // Create polygon without points using type assertion
      const polygonNode = {
        type: 'polygon' as const,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 15, offset: 15 } }
      } as PolygonNode;

      const mesh = visitor.visit(polygonNode);
      
      // Should still create a mesh with default triangle
      expect(mesh).toBeTruthy();
      expect(mesh?.name).toContain('polygon');
      
      console.log('[TEST] Polygon missing points test passed');
    });
  });

  describe('2D Primitive Materials', () => {
    it('should create 2D primitives with proper materials', () => {
      console.log('[TEST] Testing 2D primitive materials');
      
      const circleNode: CircleNode = {
        type: 'circle',
        r: 3,
        location: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 10 } }
      };

      const mesh = visitor.visit(circleNode);
      
      expect(mesh).toBeTruthy();
      expect(mesh?.material).toBeTruthy();
      expect(mesh?.material?.name).toContain('material');
      
      console.log('[TEST] 2D primitive materials test passed');
    });
  });

  console.log('[END] 2D primitive visitor tests completed successfully');
});
