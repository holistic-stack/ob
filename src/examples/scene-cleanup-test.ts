/**
 * @file Scene Cleanup Test
 * 
 * Test script to verify that scene cleanup works properly when processing
 * multiple OpenSCAD shapes in sequence.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../babylon-csg2/openscad-pipeline/openscad-pipeline';

/**
 * Test scene cleanup by processing multiple shapes in sequence
 */
export async function testSceneCleanup(): Promise<void> {
  console.log('[INIT] Starting scene cleanup test');

  // Create a headless engine for testing
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);

  try {
    // Set up basic scene
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.3, 1.0);

    // Add camera
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );

    // Add lighting
    const ambientLight = new BABYLON.HemisphericLight(
      'ambientLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.7;

    console.log('[DEBUG] Scene setup complete');

    // Initialize pipeline
    const pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true
    });

    await pipeline.initialize();

    // Test shapes to process in sequence
    const testShapes = [
      { name: 'Cube', code: 'cube([3, 3, 3]);' },
      { name: 'Sphere', code: 'sphere(2);' },
      { name: 'Cylinder', code: 'cylinder(h=4, r=1.5);' },
      { name: 'Large Cube', code: 'cube([5, 5, 5]);' }
    ];

    for (let i = 0; i < testShapes.length; i++) {
      const shape = testShapes[i]!;
      console.log(`\n[DEBUG] === Processing ${shape.name} (${i + 1}/${testShapes.length}) ===`);
      
      // Count meshes before processing
      const meshesBeforeCount = scene.meshes.length;
      const meshesBeforeNames = scene.meshes.map(m => m.name);
      console.log('[DEBUG] Meshes before processing:', {
        count: meshesBeforeCount,
        names: meshesBeforeNames
      });

      // Process the shape
      const result = await pipeline.processOpenScadCode(shape.code, scene);

      if (result.success && result.value) {
        console.log('[DEBUG] Shape processed successfully:', {
          shapeName: shape.name,
          meshName: result.value.name,
          vertices: result.value.getTotalVertices(),
          indices: result.value.getTotalIndices()
        });

        // Count meshes after processing
        const meshesAfterCount = scene.meshes.length;
        const meshesAfterNames = scene.meshes.map(m => m.name);
        console.log('[DEBUG] Meshes after processing:', {
          count: meshesAfterCount,
          names: meshesAfterNames
        });

        // Verify scene state
        const pipelineMeshes = scene.meshes.filter(m => 
          m.name.includes('cube_') || 
          m.name.includes('sphere_') || 
          m.name.includes('cylinder_')
        );

        console.log('[DEBUG] Pipeline meshes in scene:', pipelineMeshes.map(m => ({
          name: m.name,
          isVisible: m.isVisible,
          isEnabled: m.isEnabled()
        })));

        // Check if we have exactly one pipeline mesh (proper cleanup)
        if (pipelineMeshes.length === 1) {
          console.log('[DEBUG] ✅ Scene cleanup working correctly - exactly 1 pipeline mesh');
        } else {
          console.warn('[WARN] ⚠️ Scene cleanup issue - found', pipelineMeshes.length, 'pipeline meshes');
        }

      } else {
        console.error('[ERROR] Failed to process', shape.name, ':', result.error);
      }

      // Small delay between shapes
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final scene analysis
    console.log('\n[DEBUG] === Final Scene Analysis ===');
    const finalMeshes = scene.meshes;
    console.log('[DEBUG] Final scene state:', {
      totalMeshes: finalMeshes.length,
      meshNames: finalMeshes.map(m => m.name),
      pipelineMeshes: finalMeshes.filter(m => 
        m.name.includes('cube_') || 
        m.name.includes('sphere_') || 
        m.name.includes('cylinder_')
      ).length,
      cameraMeshes: finalMeshes.filter(m => m.name === 'camera').length,
      lightMeshes: finalMeshes.filter(m => m.name.includes('light')).length
    });

    // Cleanup
    await pipeline.dispose();

  } catch (error) {
    console.error('[ERROR] Scene cleanup test failed:', error);
  } finally {
    scene.dispose();
    engine.dispose();
  }

  console.log('[END] Scene cleanup test completed');
}

/**
 * Test manual scene cleanup function
 */
export function testManualSceneCleanup(scene: BABYLON.Scene): void {
  console.log('[DEBUG] Testing manual scene cleanup');

  // Count meshes before cleanup
  const meshesBeforeCount = scene.meshes.length;
  const meshesBeforeNames = scene.meshes.map(m => m.name);
  
  console.log('[DEBUG] Before cleanup:', {
    count: meshesBeforeCount,
    names: meshesBeforeNames
  });

  // Perform cleanup (same logic as BabylonRenderer)
  const meshesToDispose = scene.meshes.filter(mesh => 
    mesh.name !== 'camera' && 
    !mesh.name.includes('light')
  );

  console.log('[DEBUG] Meshes to dispose:', meshesToDispose.map(m => m.name));

  meshesToDispose.forEach(mesh => {
    console.log('[DEBUG] Disposing mesh:', mesh.name);
    mesh.dispose();
  });

  // Count meshes after cleanup
  const meshesAfterCount = scene.meshes.length;
  const meshesAfterNames = scene.meshes.map(m => m.name);
  
  console.log('[DEBUG] After cleanup:', {
    count: meshesAfterCount,
    names: meshesAfterNames,
    disposed: meshesBeforeCount - meshesAfterCount
  });
}

/**
 * Simulate the BabylonRenderer cleanup behavior
 */
export function simulateRendererCleanup(scene: BABYLON.Scene, newMeshName: string): void {
  console.log('[DEBUG] Simulating BabylonRenderer cleanup for new mesh:', newMeshName);

  // This simulates what happens in the BabylonRenderer when a new pipeline result arrives
  const meshesToDispose = scene.meshes.filter(mesh => 
    mesh.name !== 'camera' && 
    !mesh.name.includes('light')
  );

  console.log('[DEBUG] Meshes that would be disposed:', meshesToDispose.map(m => m.name));

  // Don't actually dispose in simulation, just log what would happen
  console.log('[DEBUG] Cleanup simulation complete');
}

// Export for use in other modules
export { testSceneCleanup as default };
