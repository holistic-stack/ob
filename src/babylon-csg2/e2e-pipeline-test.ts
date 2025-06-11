/**
 * @file End-to-End Pipeline Test for OpenSCAD cube([10, 10, 10]) to Babylon.js
 * 
 * This test demonstrates the complete working pipeline:
 * OpenSCAD Code → @holistic-stack/openscad-parser → AST → CSG2 → Babylon.js Scene
 * 
 * @author Luciano Júnior
 */

import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from './openscad-pipeline/openscad-pipeline';

/**
 * Complete end-to-end test for the OpenSCAD to Babylon.js pipeline
 */
async function testCubePipeline(): Promise<void> {
  console.log('[INIT] Starting end-to-end pipeline test for cube([10, 10, 10])');

  // Step 1: Create Babylon.js scene
  console.log('[DEBUG] Creating Babylon.js scene with NullEngine');
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    // Step 2: Initialize the pipeline
    console.log('[DEBUG] Initializing OpenSCAD pipeline');
    const pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 30000
    });

    const initResult = await pipeline.initialize();
    if (!initResult.success) {
      throw new Error(`Pipeline initialization failed: ${initResult.error}`);
    }
    console.log('[DEBUG] Pipeline initialized successfully');

    // Step 3: Process OpenSCAD cube code
    const openscadCode = 'cube([10, 10, 10]);';
    console.log(`[DEBUG] Processing OpenSCAD code: ${openscadCode}`);
    
    const result = await pipeline.processOpenScadCode(openscadCode, scene);

    // Step 4: Verify results
    if (!result.success) {
      throw new Error(`Pipeline processing failed: ${result.error}`);
    }

    console.log('[DEBUG] Pipeline processing successful!');
    console.log(`[DEBUG] Generated mesh: ${result.value?.name || 'null'}`);
    
    if (result.metadata) {
      console.log('[DEBUG] Performance metrics:');
      console.log(`  - Parse time: ${result.metadata.parseTimeMs}ms`);
      console.log(`  - Visit time: ${result.metadata.visitTimeMs}ms`);
      console.log(`  - Total time: ${result.metadata.totalTimeMs}ms`);
      console.log(`  - Node count: ${result.metadata.nodeCount}`);
      console.log(`  - Mesh count: ${result.metadata.meshCount}`);
    }

    // Step 5: Validate the generated mesh
    if (result.value) {
      console.log('[DEBUG] Validating generated mesh properties');
      console.log(`  - Mesh name: ${result.value.name}`);
      console.log(`  - Mesh type: ${result.value.constructor.name}`);
      console.log(`  - Position: (${result.value.position.x}, ${result.value.position.y}, ${result.value.position.z})`);
      console.log(`  - Scaling: (${result.value.scaling.x}, ${result.value.scaling.y}, ${result.value.scaling.z})`);
      console.log(`  - Vertices: ${result.value.getTotalVertices()}`);
      console.log(`  - Indices: ${result.value.getTotalIndices()}`);
    } else {
      console.log('[WARN] No mesh was generated');
    }

    // Step 6: Clean up
    await pipeline.dispose();
    console.log('[DEBUG] Pipeline disposed successfully');

  } catch (error) {
    console.error('[ERROR] Pipeline test failed:', error);
    throw error;
  } finally {
    // Clean up Babylon.js resources
    scene.dispose();
    engine.dispose();
    console.log('[DEBUG] Babylon.js resources disposed');
  }

  console.log('[END] End-to-end pipeline test completed successfully');
}

/**
 * Run the test if this file is executed directly
 * Note: This function can be called from other modules for testing
 */
async function runE2ETest(): Promise<boolean> {
  try {
    await testCubePipeline();
    console.log('✅ Pipeline test PASSED');
    return true;
  } catch (error) {
    console.error('❌ Pipeline test FAILED:', error);
    return false;
  }
}

export { testCubePipeline, runE2ETest };
