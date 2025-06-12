/**
 * @file Tests for the OpenSCAD to Babylon.js CSG2 Pipeline Converter
 * 
 * Tests the complete pipeline functionality with real parser instances and NullEngine.
 * Follows functional programming patterns and comprehensive error handling.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import {
  BabylonCSG2Converter,
  createBabylonCSG2Converter,
  convertOpenSCADToBabylon,
  type CSG2ConverterConfig
} from './babylon-csg2-converter';
import { initializeCSG2ForNode } from '../utils/csg2-node-initializer/csg2-node-initializer';

describe('BabylonCSG2Converter', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let converter: BabylonCSG2Converter;

  beforeAll(async () => {
    console.log('[INIT] Initializing CSG2 for tests...');
    // Initialize CSG2 once for all tests using Node.js compatible method
    try {
      const result = await initializeCSG2ForNode({
        enableLogging: true,
        forceMockInTests: true,
        timeout: 15000 // Increased timeout for CI environments
      });

      if (result.success) {
        console.log(`[INIT] CSG2 initialized successfully using ${result.method}`);
      } else {
        console.error('[ERROR] Failed to initialize CSG2:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[ERROR] Failed to initialize CSG2:', error);
      throw error;
    }
  }, 20000); // Increased timeout for beforeAll hook

  beforeEach(() => {
    console.log('[DEBUG] Setting up test environment...');
    
    // Create headless engine
    engine = new BABYLON.NullEngine();
    
    // Create scene
    scene = new BABYLON.Scene(engine);
    
    // Create converter with logging enabled for tests
    const config: CSG2ConverterConfig = {
      enableLogging: true,
      rebuildNormals: true,
      centerMesh: true
    };
    
    converter = new BabylonCSG2Converter(scene, config);
    
    console.log('[DEBUG] Test environment ready');
  });

  afterEach(() => {
    console.log('[DEBUG] Tearing down test environment...');
    if (scene) {
      scene.dispose();
      console.log('[DEBUG] Scene disposed');
    }
    if (engine) {
      engine.dispose();
      console.log('[DEBUG] Engine disposed');
    }
    console.log('[DEBUG] Test environment torn down');
  });

  describe('Initialization', () => {
    it('[INIT] should initialize CSG2 successfully', async () => {
      console.log('[DEBUG] Testing CSG2 initialization...');
      
      const result = await converter.initialize();
      
      expect(result.success).toBe(true);
      console.log('[END] CSG2 initialization test passed');
    });

    it('[INIT] should handle multiple initialization calls', async () => {
      console.log('[DEBUG] Testing multiple CSG2 initialization...');
      
      const result1 = await converter.initialize();
      const result2 = await converter.initialize();
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      console.log('[END] Multiple initialization test passed');
    });
  });

  describe('Factory Functions', () => {
    it('[DEBUG] should create converter with factory function', () => {
      console.log('[DEBUG] Testing factory function...');
      
      const factoryConverter = createBabylonCSG2Converter(scene);
      
      expect(factoryConverter).toBeInstanceOf(BabylonCSG2Converter);
      // Ensure proper cleanup
      factoryConverter.dispose();
      console.log('[END] Factory function test passed');
    });

    it('[DEBUG] should work with convenience function', async () => {
      console.log('[DEBUG] Testing convenience function...');
      
      const openscadCode = 'cube([2, 2, 2]);';
      const result = await convertOpenSCADToBabylon(openscadCode, scene);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        const mesh = result.value[0];
        expect(mesh).toBeInstanceOf(BABYLON.Mesh);
        // Clean up
        mesh?.dispose();
      }
      console.log('[END] Convenience function test passed');
    });
  });

  describe('Primitive Shapes', () => {
    beforeEach(async () => {
      await converter.initialize();
    });

    it('[DEBUG] should convert cube to Babylon.js mesh', async () => {
      console.log('[DEBUG] Testing cube conversion...');
      
      const openscadCode = 'cube([10, 20, 30]);';
      const result = await converter.convertOpenSCAD(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value[0]?.name).toContain('cube');
      }
      console.log('[END] Cube conversion test passed');
    });

    it('[DEBUG] should convert sphere to Babylon.js mesh', async () => {
      console.log('[DEBUG] Testing sphere conversion...');
      
      const openscadCode = 'sphere(r=5);';
      const result = await converter.convertOpenSCAD(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value[0]?.name).toContain('sphere');
      }
      console.log('[END] Sphere conversion test passed');
    });

    it('[DEBUG] should convert cylinder to Babylon.js mesh', async () => {
      console.log('[DEBUG] Testing cylinder conversion...');
      
      const openscadCode = 'cylinder(h=10, r=3);';
      const result = await converter.convertOpenSCAD(openscadCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value[0]?.name).toContain('cylinder');
      }
      console.log('[END] Cylinder conversion test passed');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await converter.initialize();
    });

    it('[ERROR] should handle empty OpenSCAD code', async () => {
      console.log('[DEBUG] Testing empty code handling...');
      
      const result = await converter.convertOpenSCAD('');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Empty');
      }
      console.log('[END] Empty code handling test passed');
    });
  });
});

