/**
 * @file Complete Pipeline E2E Test
 * 
 * End-to-end test demonstrating the complete OpenSCAD to Babylon.js pipeline:
 * OpenSCAD Code → @holistic-stack/openscad-parser → AST → CSG2 → Babylon.js Scene
 * 
 * @author Luciano Júnior
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../openscad-pipeline/openscad-pipeline';
import { initializeCSG2ForTests } from '../../vitest-setup';

describe('[INIT] Complete Pipeline E2E Tests', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;
  let pipeline: OpenScadPipeline;

  beforeAll(async () => {
    console.log('[INIT] Setting up E2E test environment');
    await initializeCSG2ForTests();
  });

  beforeEach(async () => {
    console.log('[DEBUG] Creating test scene and pipeline');
    
    // Create Babylon.js environment
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
    
    // Initialize pipeline
    pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 30000
    });
    
    const initResult = await pipeline.initialize();
    expect(initResult.success).toBe(true);
  });

  afterEach(async () => {
    console.log('[DEBUG] Cleaning up test environment');
    
    if (pipeline) {
      await pipeline.dispose();
    }
    
    if (scene) {
      scene.dispose();
    }
    
    if (engine) {
      engine.dispose();
    }
  });

  it('should process simple cube OpenSCAD code end-to-end', async () => {
    console.log('[TEST] Testing simple cube pipeline');
    
    const openscadCode = 'cube([10, 10, 10]);';
    
    const result = await pipeline.processOpenScadCode(openscadCode, scene);
    
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeDefined();
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);

      if (result.value) {
        const mesh = result.value;
        expect(mesh.name).toContain('cube');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.getTotalIndices()).toBeGreaterThan(0);
      }

      // Check metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.parseTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.visitTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.nodeCount).toBeGreaterThanOrEqual(1);
      expect(result.metadata?.meshCount).toBeGreaterThanOrEqual(1);
    }
    
    console.log('[TEST] Simple cube pipeline test passed');
  });

  it('should process sphere OpenSCAD code end-to-end', async () => {
    console.log('[TEST] Testing sphere pipeline');
    
    const openscadCode = 'sphere(5);';
    
    const result = await pipeline.processOpenScadCode(openscadCode, scene);
    
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeDefined();
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);

      if (result.value) {
        const mesh = result.value;
        expect(mesh.name).toContain('sphere');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.getTotalIndices()).toBeGreaterThan(0);
      }
    }
    
    console.log('[TEST] Sphere pipeline test passed');
  });

  it('should process cylinder OpenSCAD code end-to-end', async () => {
    console.log('[TEST] Testing cylinder pipeline');
    
    const openscadCode = 'cylinder(h=10, r=3);';
    
    const result = await pipeline.processOpenScadCode(openscadCode, scene);
    
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeDefined();
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);

      if (result.value) {
        const mesh = result.value;
        expect(mesh.name).toContain('cylinder');
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.getTotalIndices()).toBeGreaterThan(0);
      }
    }
    
    console.log('[TEST] Cylinder pipeline test passed');
  });

  it('should process union operation end-to-end', async () => {
    console.log('[TEST] Testing union operation pipeline');
    
    const openscadCode = `
      union() {
        cube([5, 5, 5]);
        translate([6, 0, 0])
          sphere(3);
      }
    `;
    
    const result = await pipeline.processOpenScadCode(openscadCode, scene);
    
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.value).toBeDefined();
      expect(result.value).toBeInstanceOf(BABYLON.Mesh);

      if (result.value) {
        const mesh = result.value;
        expect(mesh.getTotalVertices()).toBeGreaterThan(0);
        expect(mesh.getTotalIndices()).toBeGreaterThan(0);
      }

      // Should have processed multiple nodes
      expect(result.metadata?.nodeCount).toBeGreaterThanOrEqual(2);
    }
    
    console.log('[TEST] Union operation pipeline test passed');
  });

  it('should handle invalid OpenSCAD code gracefully', async () => {
    console.log('[TEST] Testing error handling for invalid code');
    
    const invalidCode = 'invalid_function([1, 2, 3]);';
    
    const result = await pipeline.processOpenScadCode(invalidCode, scene);
    
    // Should handle gracefully - either succeed with warning or fail gracefully
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    }
    
    console.log('[TEST] Error handling test passed');
  });

  it('should handle empty OpenSCAD code', async () => {
    console.log('[TEST] Testing empty code handling');
    
    const emptyCode = '';
    
    const result = await pipeline.processOpenScadCode(emptyCode, scene);
    
    // Should handle empty code gracefully
    expect(result).toBeDefined();
    
    console.log('[TEST] Empty code handling test passed');
  });

  it('should provide performance metrics', async () => {
    console.log('[TEST] Testing performance metrics collection');
    
    const openscadCode = 'cube([5, 5, 5]);';
    
    const startTime = Date.now();
    const result = await pipeline.processOpenScadCode(openscadCode, scene);
    const endTime = Date.now();
    
    expect(result.success).toBe(true);
    
    if (result.success && result.metadata) {
      // Verify timing metrics are reasonable
      expect(result.metadata.totalTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.totalTimeMs).toBeLessThan(endTime - startTime + 100); // Allow some margin
      
      // Verify other metrics
      expect(result.metadata.parseTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.visitTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.nodeCount).toBeGreaterThanOrEqual(1);
      expect(result.metadata.meshCount).toBeGreaterThanOrEqual(1);
    }
    
    console.log('[TEST] Performance metrics test passed');
  });
});

console.log('[END] Complete Pipeline E2E Tests loaded');
