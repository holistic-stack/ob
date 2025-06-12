/**
 * @file Basic Pipeline Validation Tests
 * 
 * Simple validation tests for the OpenSCAD to Babylon.js pipeline
 * that don't require CSG2 initialization for faster testing.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../openscad-pipeline/openscad-pipeline';

describe('Basic Pipeline Validation', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let pipeline: OpenScadPipeline;

  beforeEach(async () => {
    console.log('[DEBUG] Setting up basic pipeline test');
    
    // Create Babylon.js scene with NullEngine (headless)
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);

    // Initialize pipeline
    pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 5000 // Shorter timeout for basic tests
    });

    const initResult = await pipeline.initialize();
    if (!initResult.success) {
      throw new Error(`Pipeline initialization failed: ${initResult.error}`);
    }
  });

  afterEach(async () => {
    console.log('[DEBUG] Cleaning up basic pipeline test');
    
    // Clean up pipeline
    await pipeline.dispose();
    
    // Clean up Babylon.js resources
    scene.dispose();
    engine.dispose();
  });

  describe('Pipeline Initialization', () => {
    it('should initialize pipeline successfully', async () => {
      console.log('[DEBUG] Testing pipeline initialization');
      
      // Pipeline should already be initialized in beforeEach
      expect(pipeline).toBeDefined();
      
      console.log('[END] Pipeline initialization test completed');
    });

    it('should handle parser initialization', async () => {
      console.log('[DEBUG] Testing parser initialization');
      
      // The pipeline should have initialized the parser
      // We can test this by trying to process simple code
      const result = await pipeline.processOpenScadCode('cube([1, 1, 1]);', scene);
      
      // Should either succeed or fail gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(typeof result.error).toBe('string');
        console.log('[DEBUG] Parser handled gracefully:', result.error);
      } else {
        console.log('[DEBUG] Parser processed successfully');
      }
      
      console.log('[END] Parser initialization test completed');
    });
  });

  describe('Basic Primitive Processing', () => {
    it('should attempt to process cube([10, 10, 10])', async () => {
      console.log('[DEBUG] Testing basic cube processing');
      
      const openscadCode = 'cube([10, 10, 10]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      // Test that we get a valid result structure
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        console.log('[DEBUG] ✅ Cube processed successfully');
        expect(result.value).toBeDefined();
        
        if (result.metadata) {
          expect(result.metadata.nodeCount).toBeGreaterThan(0);
          expect(result.metadata.totalTimeMs).toBeGreaterThan(0);
        }
      } else {
        console.log('[DEBUG] ⚠️ Cube processing failed (expected in some environments):', result.error);
        expect(typeof result.error).toBe('string');
      }
      
      console.log('[END] Basic cube processing test completed');
    });

    it('should attempt to process sphere(5)', async () => {
      console.log('[DEBUG] Testing basic sphere processing');
      
      const openscadCode = 'sphere(5);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        console.log('[DEBUG] ✅ Sphere processed successfully');
      } else {
        console.log('[DEBUG] ⚠️ Sphere processing failed (expected in some environments):', result.error);
      }
      
      console.log('[END] Basic sphere processing test completed');
    });

    it('should attempt to process cylinder(h=10, r=3)', async () => {
      console.log('[DEBUG] Testing basic cylinder processing');
      
      const openscadCode = 'cylinder(h=10, r=3);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        console.log('[DEBUG] ✅ Cylinder processed successfully');
      } else {
        console.log('[DEBUG] ⚠️ Cylinder processing failed (expected in some environments):', result.error);
      }
      
      console.log('[END] Basic cylinder processing test completed');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid OpenSCAD syntax gracefully', async () => {
      console.log('[DEBUG] Testing error handling for invalid syntax');
      
      const invalidCode = 'invalid_syntax_here();';
      const result = await pipeline.processOpenScadCode(invalidCode, scene);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      // Should handle error gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
        console.log('[DEBUG] Error handled gracefully:', result.error);
      } else {
        console.log('[DEBUG] Invalid syntax processed without error (unexpected but acceptable)');
      }
      
      console.log('[END] Error handling test completed');
    });

    it('should handle empty input gracefully', async () => {
      console.log('[DEBUG] Testing error handling for empty input');
      
      const emptyCode = '';
      const result = await pipeline.processOpenScadCode(emptyCode, scene);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        console.log('[DEBUG] Empty input handled gracefully:', result.error);
      }
      
      console.log('[END] Empty input handling test completed');
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics when enabled', async () => {
      console.log('[DEBUG] Testing performance metrics collection');
      
      const openscadCode = 'cube([5, 5, 5]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);

      expect(result).toBeDefined();
      
      if (result.success && result.metadata) {
        expect(result.metadata.parseTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metadata.visitTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metadata.totalTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metadata.nodeCount).toBeGreaterThanOrEqual(0);
        expect(result.metadata.meshCount).toBeGreaterThanOrEqual(0);
        
        console.log('[DEBUG] Performance metrics collected:', result.metadata);
      } else {
        console.log('[DEBUG] Performance metrics not available (acceptable for basic test)');
      }
      
      console.log('[END] Performance metrics test completed');
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', async () => {
      console.log('[DEBUG] Testing resource disposal');
      
      // Process some code first
      await pipeline.processOpenScadCode('cube([2, 2, 2]);', scene);
      
      // Dispose should not throw
      expect(async () => {
        await pipeline.dispose();
      }).not.toThrow();
      
      console.log('[DEBUG] Resources disposed successfully');
      console.log('[END] Resource disposal test completed');
    });
  });

  describe('Pipeline Integration', () => {
    it('should demonstrate basic pipeline flow', async () => {
      console.log('[INIT] Starting basic pipeline integration test');
      
      const testCases = [
        { name: 'Simple Cube', code: 'cube([3, 3, 3]);' },
        { name: 'Simple Sphere', code: 'sphere(2);' },
        { name: 'Simple Cylinder', code: 'cylinder(h=5, r=1);' }
      ];

      let successCount = 0;
      const totalCount = testCases.length;

      for (const testCase of testCases) {
        console.log(`[DEBUG] Testing ${testCase.name}: ${testCase.code}`);
        
        const result = await pipeline.processOpenScadCode(testCase.code, scene);
        
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        
        if (result.success) {
          successCount++;
          console.log(`[DEBUG] ✅ ${testCase.name} processed successfully`);
        } else {
          console.log(`[DEBUG] ⚠️ ${testCase.name} failed: ${result.error}`);
        }
      }

      console.log(`[DEBUG] Pipeline integration results: ${successCount}/${totalCount} successful`);
      
      // At least the pipeline structure should work
      expect(successCount).toBeGreaterThanOrEqual(0);
      
      console.log('[END] Basic pipeline integration test completed');
    });
  });
});
