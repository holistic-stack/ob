/**
 * @file OpenSCAD AST Visitor Extrusion Operations Tests
 * 
 * Comprehensive unit tests for linear_extrude and rotate_extrude operations
 * Tests parameter extraction, mesh creation, and error handling
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenscadParser } from '@holistic-stack/openscad-parser';
import * as BABYLON from '@babylonjs/core';
import { OpenScadAstVisitor } from './openscad-ast-visitor';
import { initializeCSG2ForTests } from '../../lib/initializers/csg2-test-initializer/csg2-test-initializer';

// Test wrapper class to access protected methods
class TestableOpenScadAstVisitor extends OpenScadAstVisitor {
  public testVisitLinearExtrude(node: any): BABYLON.Mesh | null {
    return this.visitLinearExtrude(node);
  }

  public testVisitRotateExtrude(node: any): BABYLON.Mesh | null {
    return this.visitRotateExtrude(node);
  }
}

describe('OpenScadAstVisitor Extrusion Operations', () => {
  let parser: OpenscadParser;
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let visitor: TestableOpenScadAstVisitor;

  beforeEach(async () => {
    console.log('[INIT] Setting up extrusion operations test environment');
    
    // Initialize CSG2 for testing
    await initializeCSG2ForTests();
    
    // Initialize parser
    parser = new OpenscadParser();
    await parser.init();
    
    // Initialize Babylon.js with NullEngine
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    
    // Initialize visitor
    visitor = new TestableOpenScadAstVisitor(scene);
    
    console.log('[DEBUG] Test environment setup completed');
  });

  afterEach(() => {
    console.log('[INIT] Cleaning up test environment');
    
    scene?.dispose();
    engine?.dispose();
    parser?.dispose();
    
    console.log('[END] Test environment cleanup completed');
  });

  describe('Linear Extrude Operations', () => {
    it('should create mesh for basic linear extrude', async () => {
      console.log('[INIT] Testing basic linear extrude');
      
      const openscadCode = `
        linear_extrude(height=10) {
          circle(r=5);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(ast).toBeTruthy();
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);

      const linearExtrudeNode = ast[0];
      expect(linearExtrudeNode?.type).toBe('linear_extrude');
      
      const result = visitor.testVisitLinearExtrude(linearExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Basic linear extrude test completed');
    });

    it('should handle linear extrude with twist parameter', async () => {
      console.log('[INIT] Testing linear extrude with twist');
      
      const openscadCode = `
        linear_extrude(height=15, twist=45) {
          square([4, 4]);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const linearExtrudeNode = ast[0];
      
      const result = visitor.testVisitLinearExtrude(linearExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Linear extrude with twist test completed');
    });

    it('should handle linear extrude with scale parameter', async () => {
      console.log('[INIT] Testing linear extrude with scale');
      
      const openscadCode = `
        linear_extrude(height=12, scale=[1.5, 0.5]) {
          square([6, 6], center=true);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const linearExtrudeNode = ast[0];
      
      const result = visitor.testVisitLinearExtrude(linearExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Linear extrude with scale test completed');
    });

    it('should handle centered linear extrude', async () => {
      console.log('[INIT] Testing centered linear extrude');
      
      const openscadCode = `
        linear_extrude(height=8, center=true) {
          circle(r=3);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const linearExtrudeNode = ast[0];
      
      const result = visitor.testVisitLinearExtrude(linearExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Centered linear extrude test completed');
    });

    it('should return null for linear extrude with no children', async () => {
      console.log('[INIT] Testing linear extrude with no children');
      
      const openscadCode = `linear_extrude(height=10) {}`;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const linearExtrudeNode = ast[0];
      
      // Should return null for invalid parameters
      const result = visitor.testVisitLinearExtrude(linearExtrudeNode);
      expect(result).toBeNull();
      
      console.log('[END] Linear extrude no children test completed');
    });
  });

  describe('Rotate Extrude Operations', () => {
    it('should create mesh for basic rotate extrude', async () => {
      console.log('[INIT] Testing basic rotate extrude');
      
      const openscadCode = `
        rotate_extrude() {
          translate([10, 0, 0]) circle(r=3);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const rotateExtrudeNode = ast[0];
      expect(rotateExtrudeNode?.type).toBe('rotate_extrude');
      
      const result = visitor.testVisitRotateExtrude(rotateExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Basic rotate extrude test completed');
    });

    it('should handle rotate extrude with angle parameter', async () => {
      console.log('[INIT] Testing rotate extrude with angle');
      
      const openscadCode = `
        rotate_extrude(angle=180) {
          translate([8, 0, 0]) square([2, 6]);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const rotateExtrudeNode = ast[0];
      
      const result = visitor.testVisitRotateExtrude(rotateExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Rotate extrude with angle test completed');
    });

    it('should handle rotate extrude with 270 degree angle', async () => {
      console.log('[INIT] Testing rotate extrude with 270 degrees');
      
      const openscadCode = `
        rotate_extrude(angle=270) {
          translate([6, 0, 0]) circle(r=2);
        }
      `;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const rotateExtrudeNode = ast[0];
      
      const result = visitor.testVisitRotateExtrude(rotateExtrudeNode);
      expect(result).toBeTruthy();
      expect(result).toBeInstanceOf(BABYLON.Mesh);
      
      console.log('[END] Rotate extrude 270 degrees test completed');
    });

    it('should return null for rotate extrude with no children', async () => {
      console.log('[INIT] Testing rotate extrude with no children');
      
      const openscadCode = `rotate_extrude() {}`;
      
      const ast = parser.parseAST(openscadCode);
      expect(Array.isArray(ast)).toBe(true);
      expect(ast.length).toBeGreaterThan(0);
      const rotateExtrudeNode = ast[0];
      
      // Should return null for invalid parameters
      const result = visitor.testVisitRotateExtrude(rotateExtrudeNode);
      expect(result).toBeNull();
      
      console.log('[END] Rotate extrude no children test completed');
    });
  });
});
