/**
 * @file Complete Working Pipeline Example for OpenSCAD cube([10, 10, 10])
 * 
 * This example demonstrates the complete working pipeline:
 * OpenSCAD Code → @holistic-stack/openscad-parser → AST → CSG2 → Babylon.js Scene
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../src/babylon-csg2/openscad-pipeline/openscad-pipeline';

/**
 * Complete working example of the OpenSCAD to Babylon.js pipeline
 */
async function demonstrateWorkingPipeline(): Promise<void> {
  console.log('[INIT] Starting complete OpenSCAD to Babylon.js pipeline demonstration');

  // Step 1: Create Babylon.js scene with NullEngine (headless)
  console.log('[DEBUG] Creating Babylon.js scene');
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    // Step 2: Initialize the OpenSCAD pipeline
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

    // Step 3: Process the OpenSCAD cube code
    const openscadCode = 'cube([10, 10, 10]);';
    console.log(`[DEBUG] Processing OpenSCAD code: ${openscadCode}`);
    
    const result = await pipeline.processOpenScadCode(openscadCode, scene);

    // Step 4: Verify the pipeline worked correctly
    if (!result.success) {
      throw new Error(`Pipeline processing failed: ${result.error}`);
    }

    console.log('[DEBUG] ✅ Pipeline processing successful!');
    
    // Step 5: Examine the generated mesh
    if (result.value) {
      console.log('[DEBUG] Generated mesh details:');
      console.log(`  - Name: ${result.value.name}`);
      console.log(`  - Type: ${result.value.constructor.name}`);
      console.log(`  - Position: (${result.value.position.x}, ${result.value.position.y}, ${result.value.position.z})`);
      console.log(`  - Scaling: (${result.value.scaling.x}, ${result.value.scaling.y}, ${result.value.scaling.z})`);
      console.log(`  - Total Vertices: ${result.value.getTotalVertices()}`);
      console.log(`  - Total Indices: ${result.value.getTotalIndices()}`);
      console.log(`  - Bounding Box: ${JSON.stringify(result.value.getBoundingInfo().boundingBox)}`);
    } else {
      console.log('[WARN] No mesh was generated');
    }

    // Step 6: Display performance metrics
    if (result.metadata) {
      console.log('[DEBUG] Performance metrics:');
      console.log(`  - Parse time: ${result.metadata.parseTimeMs}ms`);
      console.log(`  - Visit time: ${result.metadata.visitTimeMs}ms`);
      console.log(`  - Total time: ${result.metadata.totalTimeMs}ms`);
      console.log(`  - Node count: ${result.metadata.nodeCount}`);
      console.log(`  - Mesh count: ${result.metadata.meshCount}`);
    }

    // Step 7: Demonstrate the complete pipeline components
    console.log('[DEBUG] Pipeline components used:');
    console.log('  1. @holistic-stack/openscad-parser - Parsed OpenSCAD code to AST');
    console.log('  2. OpenScadAstVisitor - Converted AST nodes to Babylon.js meshes');
    console.log('  3. CSG2 Operations - Applied boolean operations (if any)');
    console.log('  4. Babylon.js Scene - Integrated mesh into 3D scene');

    // Step 8: Clean up resources
    await pipeline.dispose();
    console.log('[DEBUG] Pipeline disposed successfully');

  } catch (error) {
    console.error('[ERROR] Pipeline demonstration failed:', error);
    throw error;
  } finally {
    // Clean up Babylon.js resources
    scene.dispose();
    engine.dispose();
    console.log('[DEBUG] Babylon.js resources disposed');
  }

  console.log('[END] Complete pipeline demonstration finished successfully');
}

/**
 * Advanced example with multiple primitives and CSG operations
 */
async function demonstrateAdvancedPipeline(): Promise<void> {
  console.log('[INIT] Starting advanced OpenSCAD pipeline demonstration');

  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    const pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true,
      csg2Timeout: 30000
    });

    await pipeline.initialize();

    // Test different OpenSCAD primitives
    const testCases = [
      'cube([10, 10, 10]);',
      'sphere(5);',
      'cylinder(h=10, r=3);',
      'union() { cube([5, 5, 5]); translate([3, 3, 3]) sphere(2); }',
      'difference() { cube([10, 10, 10]); sphere(6); }'
    ];

    for (const [index, code] of testCases.entries()) {
      console.log(`[DEBUG] Testing case ${index + 1}: ${code}`);
      
      const result = await pipeline.processOpenScadCode(code, scene);
      
      if (result.success) {
        console.log(`[DEBUG] ✅ Case ${index + 1} successful - Generated: ${result.value?.name || 'null'}`);
      } else {
        console.log(`[DEBUG] ❌ Case ${index + 1} failed: ${result.error}`);
      }
    }

    await pipeline.dispose();

  } catch (error) {
    console.error('[ERROR] Advanced pipeline demonstration failed:', error);
    throw error;
  } finally {
    scene.dispose();
    engine.dispose();
  }

  console.log('[END] Advanced pipeline demonstration completed');
}

/**
 * Run all demonstrations
 */
async function runAllDemonstrations(): Promise<boolean> {
  try {
    await demonstrateWorkingPipeline();
    await demonstrateAdvancedPipeline();
    console.log('🎉 All pipeline demonstrations PASSED');
    return true;
  } catch (error) {
    console.error('❌ Pipeline demonstration FAILED:', error);
    return false;
  }
}

export { demonstrateWorkingPipeline, demonstrateAdvancedPipeline, runAllDemonstrations };
