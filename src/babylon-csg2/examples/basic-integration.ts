/**
 * @file Basic integration example for OpenSCAD to Babylon.js pipeline
 * 
 * This example demonstrates the current functionality of the OpenSCAD to
 * Babylon.js CSG2 pipeline, showing how to convert basic primitives.
 * 
 * @example
 * ```typescript
 * import { runBasicIntegrationExample } from './basic-integration.js';
 * 
 * // Run the example
 * await runBasicIntegrationExample();
 * ```
 */

import type { UnionNode, CubeNode, SphereNode, CylinderNode } from '@holistic-stack/openscad-parser';
import { OpenScadPipeline } from '../openscad-pipeline/openscad-pipeline';



/**
 * Run the basic integration example
 * Updated to use geometry data approach instead of NullEngine
 */
export async function runBasicIntegrationExample(): Promise<void> {
  console.log('[INIT] Starting basic integration example using OpenScadPipeline');

  // Create pipeline for processing
  const pipeline = new OpenScadPipeline({
    enableLogging: true,
    enableMetrics: true
  });

  try {
    // Initialize the pipeline
    console.log('[DEBUG] Initializing OpenSCAD pipeline');
    const initResult = await pipeline.initialize();
    if (!initResult.success) {
      throw new Error(`Pipeline initialization failed: ${initResult.error}`);
    }

    // Test OpenSCAD code instead of AST
    const openscadCode = `
      union() {
        cube([10, 10, 10]);
        translate([15, 0, 0]) sphere(7);
        translate([0, 15, 0]) cylinder(h=20, r=3);
      }
    `;

    console.log('[DEBUG] Processing OpenSCAD code to geometry data');
    const result = await pipeline.processOpenScadCodeToGeometry(openscadCode);

    if (!result.success) {
      throw new Error(`Processing failed: ${result.error}`);
    }

    // Report processing results
    console.log('[DEBUG] Processing completed successfully');
    if (result.value) {
      console.log('[DEBUG] Geometry data generated:', {
        name: result.value.name,
        vertexCount: result.value.positions ? result.value.positions.length / 3 : 0,
        indexCount: result.value.indices ? result.value.indices.length : 0,
        hasNormals: !!result.value.normals,
        hasUVs: !!result.value.uvs,
        hasMaterial: !!result.value.materialData
      });
    } else {
      console.log('[DEBUG] No geometry data generated (empty result)');
    }

    console.log('[END] Basic integration example completed successfully');

  } catch (error) {
    console.log('[ERROR] Unexpected error in integration example:', error);
    throw error;
  } finally {
    // Clean up pipeline
    await pipeline.dispose();
  }
}


