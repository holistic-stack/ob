/**
 * @file OpenSCAD Pipeline Tests
 * 
 * Comprehensive tests for the complete OpenSCAD to Babylon.js pipeline.
 * Tests the integration of parser, visitor, and CSG2 components.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from './openscad-pipeline';
import { initializeCSG2ForTests, createTestScene, disposeTestScene } from '../../vitest-setup';

describe('OpenScadPipeline Integration Tests', () => {
  let pipeline: OpenScadPipeline;
  let scene: BABYLON.Scene;
  let engine: BABYLON.NullEngine;

  beforeAll(async () => {
    console.log('[INIT] Initializing CSG2 for pipeline tests');
    await initializeCSG2ForTests();
  });

  beforeEach(async () => {
    console.log('[DEBUG] Setting up pipeline test environment');
    const testScene = createTestScene();
    engine = testScene.engine;
    scene = testScene.scene;
    
    pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 5000
    });
  });

  afterEach(async () => {
    console.log('[DEBUG] Cleaning up pipeline test environment');
    await pipeline.dispose();
    disposeTestScene(engine, scene);
  });

  describe('Pipeline Initialization', () => {
    it('should initialize successfully', async () => {
      console.log('[DEBUG] Testing pipeline initialization');
      
      expect(pipeline.isReady()).toBe(false);
      
      const result = await pipeline.initialize();
      
      expect(result.success).toBe(true);
      expect(pipeline.isReady()).toBe(true);
      console.log('[DEBUG] Pipeline initialization test passed');
    });

    it('should handle multiple initialization calls gracefully', async () => {
      console.log('[DEBUG] Testing multiple pipeline initialization calls');
      
      const result1 = await pipeline.initialize();
      expect(result1.success).toBe(true);
      
      const result2 = await pipeline.initialize();
      expect(result2.success).toBe(true);
      
      expect(pipeline.isReady()).toBe(true);
      console.log('[DEBUG] Multiple initialization test passed');
    });

    it('should fail processing when not initialized', async () => {
      console.log('[DEBUG] Testing processing without initialization');
      
      const result = await pipeline.processOpenScadCode('cube([1,1,1]);', scene);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
      console.log('[DEBUG] Processing without initialization test passed');
    });
  });

  describe('Simple Primitive Processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process a simple cube', async () => {
      console.log('[DEBUG] Testing simple cube processing');
      
      const openscadCode = 'cube([10, 20, 30]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      expect(result.value?.name).toContain('cube_');
      
      if (result.metadata) {
        expect(result.metadata.nodeCount).toBeGreaterThan(0);
        expect(result.metadata.totalTimeMs).toBeGreaterThan(0);
      }
      
      console.log('[DEBUG] Simple cube processing test passed');
    });

    it('should process a simple sphere', async () => {
      console.log('[DEBUG] Testing simple sphere processing');
      
      const openscadCode = 'sphere(r=5);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      expect(result.value?.name).toContain('sphere_');
      console.log('[DEBUG] Simple sphere processing test passed');
    });

    it('should process a simple cylinder', async () => {
      console.log('[DEBUG] Testing simple cylinder processing');
      
      const openscadCode = 'cylinder(h=10, r=3);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      expect(result.value?.name).toContain('cylinder_');
      console.log('[DEBUG] Simple cylinder processing test passed');
    });
  });

  describe('CSG Operations Processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process a union operation', async () => {
      console.log('[DEBUG] Testing union operation processing');
      
      const openscadCode = `
        union() {
          cube([10, 10, 10]);
          sphere(r=5);
        }
      `;
      
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      console.log('[DEBUG] Union operation processing test passed');
    });

    it('should process a difference operation', async () => {
      console.log('[DEBUG] Testing difference operation processing');
      
      const openscadCode = `
        difference() {
          cube([10, 10, 10]);
          sphere(r=3);
        }
      `;
      
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      console.log('[DEBUG] Difference operation processing test passed');
    });

    it('should process an intersection operation', async () => {
      console.log('[DEBUG] Testing intersection operation processing');
      
      const openscadCode = `
        intersection() {
          cube([10, 10, 10]);
          sphere(r=8);
        }
      `;
      
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      console.log('[DEBUG] Intersection operation processing test passed');
    });
  });

  describe('Transform Operations Processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process a translate operation', async () => {
      console.log('[DEBUG] Testing translate operation processing');
      
      const openscadCode = `
        translate([5, 10, 15]) {
          cube([5, 5, 5]);
        }
      `;
      
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);
      
      // Check if translation was applied
      if (result.value) {
        expect(result.value.position.x).toBe(5);
        expect(result.value.position.y).toBe(10);
        expect(result.value.position.z).toBe(15);
      }
      
      console.log('[DEBUG] Translate operation processing test passed');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should handle invalid OpenSCAD syntax gracefully', async () => {
      console.log('[DEBUG] Testing invalid OpenSCAD syntax handling');
      
      const invalidCode = 'invalid_syntax_here!!!';
      const result = await pipeline.processOpenScadCode(invalidCode, scene);
      
      // Should either succeed with empty result or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      } else {
        expect(result.value).toBeNull();
      }
      
      console.log('[DEBUG] Invalid syntax handling test passed');
    });

    it('should handle empty OpenSCAD code', async () => {
      console.log('[DEBUG] Testing empty OpenSCAD code handling');
      
      const result = await pipeline.processOpenScadCode('', scene);
      
      // Should handle empty code gracefully
      if (result.success) {
        expect(result.value).toBeNull();
      } else {
        expect(result.error).toBeDefined();
      }
      
      console.log('[DEBUG] Empty code handling test passed');
    });
  });

  describe('Pipeline Metrics', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should provide performance metrics when enabled', async () => {
      console.log('[DEBUG] Testing pipeline metrics collection');
      
      const openscadCode = 'cube([5, 5, 5]);';
      const result = await pipeline.processOpenScadCode(openscadCode, scene);
      
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      
      if (result.metadata) {
        expect(result.metadata.parseTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metadata.visitTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metadata.totalTimeMs).toBeGreaterThanOrEqual(0);
        expect(result.metadata.nodeCount).toBeGreaterThan(0);
        expect(result.metadata.meshCount).toBeGreaterThanOrEqual(0);
      }
      
      console.log('[DEBUG] Pipeline metrics test passed');
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', async () => {
      console.log('[DEBUG] Testing pipeline resource disposal');
      
      await pipeline.initialize();
      expect(pipeline.isReady()).toBe(true);
      
      await pipeline.dispose();
      expect(pipeline.isReady()).toBe(false);
      
      console.log('[DEBUG] Resource disposal test passed');
    });
  });
});
