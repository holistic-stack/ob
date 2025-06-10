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

import { NullEngine } from '@babylonjs/core';
import type { UnionNode, CubeNode, SphereNode, CylinderNode } from '@holistic-stack/openscad-parser';
import { SceneFactory } from '../scene-factory';



/**
 * Run the basic integration example
 */
export async function runBasicIntegrationExample(): Promise<void> {
  console.log('[INIT] Starting basic integration example using SceneFactory');

  const engine = new NullEngine();

  // Create a sample AST, for example a union of a few primitives
  const cube: CubeNode = { type: 'cube', size: [10, 10, 10] };
  const sphere: SphereNode = { type: 'sphere', radius: 7 };
  const cylinder: CylinderNode = { type: 'cylinder', h: 20, r: 3 };
  const rootNode: UnionNode = { type: 'union', children: [cube, sphere, cylinder] };

  try {
    console.log('[DEBUG] Creating scene from AST using SceneFactory');
    const scene = await SceneFactory.createFromAst(engine, rootNode);

    // Report scene statistics
    console.log('[DEBUG] Scene created successfully. Scene statistics:');
    console.log(`  - Total meshes: ${scene.meshes.length}`);
    console.log(`  - Total cameras: ${scene.cameras.length}`);
    console.log(`  - Total lights: ${scene.lights.length}`);

    // Count only user-created meshes (exclude camera/light/ground meshes)
    const userMeshes = scene.meshes.filter(mesh => 
      mesh.name.includes('cube') || 
      mesh.name.includes('sphere') || 
      mesh.name.includes('cylinder') ||
      mesh.name.includes('union')
    );

    // In a proper CSG2 union, we should get 1 combined mesh
    // But if CSG2 is not available, we might get multiple meshes
    if (userMeshes.length === 0) {
      throw new Error('No user meshes were created from the AST');
    }

    console.log(`[DEBUG] Successfully created ${userMeshes.length} user mesh(es) from union operation`);
    console.log('[END] Basic integration example completed successfully');

    // Clean up resources
    scene.dispose();
  } catch (error) {
    console.log('[ERROR] Unexpected error in integration example:', error);
    throw error;
  } finally {
    engine.dispose();
  }
}


