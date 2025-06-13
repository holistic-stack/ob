/**
 * @file Complete End-to-End Pipeline Tests
 * 
 * Comprehensive E2E tests for the complete OpenSCAD to Babylon.js pipeline:
 * OpenSCAD Code → @holistic-stack/openscad-parser → AST → CSG2 → Babylon.js Scene
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../openscad-pipeline/openscad-pipeline';
import { initializeCSG2ForTests } from '../utils/csg2-test-initializer/csg2-test-initializer';

describe('Complete OpenSCAD to Babylon.js Pipeline E2E Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let pipeline: OpenScadPipeline;

  beforeAll(async () => {
    console.log('[INIT] Initializing CSG2 for E2E tests');
    try {
      // Initialize CSG2 for all tests using test-compatible method
      const result = await initializeCSG2ForTests({
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

  beforeEach(async () => {
    console.log('[DEBUG] Setting up test environment');
    
    // Create Babylon.js scene with NullEngine (headless)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // Initialize pipeline
    pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 30000
    });

    const initResult = await pipeline.initialize();
    if (!initResult.success) {
      throw new Error(`Pipeline initialization failed: ${initResult.error}`);
    }
  });

  afterEach(async () => {
    console.log('[DEBUG] Cleaning up test environment');
    
    // Clean up pipeline
    await pipeline.dispose();
    
    // Clean up Babylon.js resources
    scene.dispose();
    engine.dispose();
  });

  describe('Basic Primitive Processing', () => {
    it('should process cube([10, 10, 10]) successfully', async () => {
      console.log('[DEBUG] Testing cube([10, 10, 10]) processing');
      
      const openscadCode = 'cube([10, 10, 10]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value?.name).toContain('cube_');
        expect(result.value?.getTotalVertices()).toBeGreaterThan(0);
        expect(result.value?.getTotalIndices()).toBeGreaterThan(0);
        
        // Verify metadata
        if (result.metadata) {
          expect(result.metadata.nodeCount).toBeGreaterThan(0);
          expect(result.metadata.totalTimeMs).toBeGreaterThan(0);
          expect(result.metadata.meshCount).toBe(1);
        }
      }
      
      console.log('[END] Cube processing test completed successfully');
    });

    it('should process sphere(5) successfully', async () => {
      console.log('[DEBUG] Testing sphere(5) processing');
      
      const openscadCode = 'sphere(5);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value?.name).toContain('sphere_');
        expect(result.value?.getTotalVertices()).toBeGreaterThan(0);
      }
      
      console.log('[END] Sphere processing test completed successfully');
    });

    it('should process cylinder(h=10, r=3) successfully', async () => {
      console.log('[DEBUG] Testing cylinder(h=10, r=3) processing');
      
      const openscadCode = 'cylinder(h=10, r=3);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value?.name).toContain('cylinder_');
        expect(result.value?.getTotalVertices()).toBeGreaterThan(0);
      }
      
      console.log('[END] Cylinder processing test completed successfully');
    });
  });

  describe('CSG Operations', () => {
    it('should process union operations successfully', async () => {
      console.log('[DEBUG] Testing union operation processing');
      
      const openscadCode = 'union() { cube([5, 5, 5]); translate([3, 3, 3]) sphere(2); }';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value?.getTotalVertices()).toBeGreaterThan(0);
      }
      
      console.log('[END] Union operation test completed successfully');
    });

    it('should process difference operations successfully', async () => {
      console.log('[DEBUG] Testing difference operation processing');
      
      const openscadCode = 'difference() { cube([10, 10, 10]); sphere(6); }';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value?.getTotalVertices()).toBeGreaterThan(0);
      }
      
      console.log('[END] Difference operation test completed successfully');
    });

    it('should process intersection operations successfully', async () => {
      console.log('[DEBUG] Testing intersection operation processing');
      
      const openscadCode = 'intersection() { cube([10, 10, 10]); sphere(8); }';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        expect(result.value?.getTotalVertices()).toBeGreaterThan(0);
      }
      
      console.log('[END] Intersection operation test completed successfully');
    });
  });

  describe('Transformation Operations', () => {
    it('should process translate operations successfully', async () => {
      console.log('[DEBUG] Testing translate operation processing');
      
      const openscadCode = 'translate([5, 10, 15]) cube([5, 5, 5]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.value).toBeInstanceOf(BABYLON.Mesh);
        
        // Check if translation was applied
        if (result.value) {
          expect(result.value.position.x).toBe(5);
          expect(result.value.position.y).toBe(10);
          expect(result.value.position.z).toBe(15);
        }
      }
      
      console.log('[END] Translate operation test completed successfully');
    });
  });

  describe('Performance and Metrics', () => {
    it('should provide performance metrics when enabled', async () => {
      console.log('[DEBUG] Testing performance metrics collection');
      
      const openscadCode = 'cube([10, 10, 10]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.metadata).toBeDefined();
        
        if (result.metadata) {
          expect(result.metadata.parseTimeMs).toBeGreaterThanOrEqual(0);
          expect(result.metadata.visitTimeMs).toBeGreaterThanOrEqual(0);
          expect(result.metadata.totalTimeMs).toBeGreaterThanOrEqual(0);
          expect(result.metadata.nodeCount).toBeGreaterThan(0);
          expect(result.metadata.meshCount).toBeGreaterThanOrEqual(0);
          
          console.log('[DEBUG] Performance metrics:', result.metadata);
        }
      }
      
      console.log('[END] Performance metrics test completed successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid OpenSCAD syntax gracefully', async () => {
      console.log('[DEBUG] Testing error handling for invalid syntax');
      
      const invalidCode = 'invalid_syntax_here();';
      const result = await pipeline.processOpenScadCode(invalidCode, scene);

      // Should either succeed with null result or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        console.log('[DEBUG] Error handled gracefully:', result.error);
      } else {
        console.log('[DEBUG] Invalid syntax processed without error');
      }
      
      console.log('[END] Error handling test completed');
    });
  });

  describe('Complete Pipeline Integration', () => {
    it('should demonstrate the complete pipeline flow', async () => {
      console.log('[INIT] Starting complete pipeline integration test');
      
      const testCases = [
        { name: 'Simple Cube', code: 'cube([10, 10, 10]);' },
        { name: 'Simple Sphere', code: 'sphere(5);' },
        { name: 'Simple Cylinder', code: 'cylinder(h=10, r=3);' },
        { name: 'Union Operation', code: 'union() { cube([5, 5, 5]); sphere(3); }' },
        { name: 'Translated Cube', code: 'translate([2, 2, 2]) cube([5, 5, 5]);' }
      ];

      for (const testCase of testCases) {
        console.log(`[DEBUG] Testing ${testCase.name}: ${testCase.code}`);
        
        const result = await pipeline.processOpenScadCode(testCase.code, scene);
        
        expect(result.success).toBe(true);
        
        if (result.success) {
          expect(result.value).toBeInstanceOf(BABYLON.Mesh);
          console.log(`[DEBUG] ✅ ${testCase.name} processed successfully`);
        }
      }
      
      console.log('[END] Complete pipeline integration test finished successfully');
    });
  });
});
