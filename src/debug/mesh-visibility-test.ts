/**
 * @file Mesh Visibility Test
 * 
 * Debug utility to test mesh creation and visibility in Babylon.js scenes
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../babylon-csg2/openscad-pipeline/openscad-pipeline';

/**
 * Test mesh visibility and rendering
 */
export async function testMeshVisibility(): Promise<void> {
  console.log('[INIT] Starting mesh visibility test');

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

    const directionalLight = new BABYLON.DirectionalLight(
      'directionalLight',
      new BABYLON.Vector3(-1, -1, -1),
      scene
    );
    directionalLight.intensity = 0.5;

    console.log('[DEBUG] Scene setup complete');

    // Test 1: Create a simple test cube directly
    console.log('[DEBUG] Test 1: Creating direct test cube');
    const testCube = BABYLON.MeshBuilder.CreateBox('direct_test_cube', { size: 2 }, scene);
    const testMaterial = new BABYLON.StandardMaterial('test_material', scene);
    testMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
    testCube.material = testMaterial;

    console.log('[DEBUG] Direct test cube created:', {
      name: testCube.name,
      isVisible: testCube.isVisible,
      isEnabled: testCube.isEnabled(),
      hasGeometry: testCube.geometry !== null,
      vertices: testCube.getTotalVertices(),
      indices: testCube.getTotalIndices(),
      hasMaterial: testCube.material !== null,
      position: testCube.position.asArray()
    });

    // Test 2: Use the pipeline to create a cube
    console.log('[DEBUG] Test 2: Creating cube through pipeline');
    const pipeline = new OpenScadPipeline({
      enableLogging: true,
      enableMetrics: true
    });

    await pipeline.initialize();
    const result = await pipeline.processOpenScadCode('cube([2, 2, 2]);', scene);

    if (result.success && result.value) {
      console.log('[DEBUG] Pipeline cube created:', {
        name: result.value.name,
        isVisible: result.value.isVisible,
        isEnabled: result.value.isEnabled(),
        hasGeometry: result.value.geometry !== null,
        vertices: result.value.getTotalVertices(),
        indices: result.value.getTotalIndices(),
        hasMaterial: result.value.material !== null,
        position: result.value.position.asArray(),
        scaling: result.value.scaling.asArray()
      });

      // Check material details
      if (result.value.material) {
        const material = result.value.material as BABYLON.StandardMaterial;
        console.log('[DEBUG] Material details:', {
          name: material.name,
          diffuseColor: material.diffuseColor?.asArray(),
          specularColor: material.specularColor?.asArray(),
          emissiveColor: material.emissiveColor?.asArray()
        });
      }
    } else {
      console.error('[ERROR] Pipeline failed:', result.error);
    }

    // Test 3: Check scene contents
    console.log('[DEBUG] Test 3: Scene analysis');
    console.log('[DEBUG] Scene contents:', {
      totalMeshes: scene.meshes.length,
      meshNames: scene.meshes.map(m => m.name),
      visibleMeshes: scene.meshes.filter(m => m.isVisible).length,
      enabledMeshes: scene.meshes.filter(m => m.isEnabled()).length,
      meshesWithGeometry: scene.meshes.filter(m => m.geometry !== null).length,
      meshesWithMaterial: scene.meshes.filter(m => m.material !== null).length,
      totalLights: scene.lights.length,
      lightNames: scene.lights.map(l => l.name),
      hasActiveCamera: scene.activeCamera !== null,
      cameraName: scene.activeCamera?.name
    });

    // Test 4: Render test
    console.log('[DEBUG] Test 4: Render test');
    try {
      scene.render();
      console.log('[DEBUG] Scene rendered successfully');
    } catch (error) {
      console.error('[ERROR] Render failed:', error);
    }

    // Test 5: Bounding box analysis
    console.log('[DEBUG] Test 5: Bounding box analysis');
    scene.meshes.forEach(mesh => {
      if (mesh.name.includes('cube') || mesh.name.includes('test')) {
        const boundingInfo = mesh.getBoundingInfo();
        console.log(`[DEBUG] Mesh ${mesh.name} bounding info:`, {
          center: boundingInfo.boundingBox.center.asArray(),
          size: boundingInfo.boundingBox.extendSize.length(),
          min: boundingInfo.boundingBox.minimum.asArray(),
          max: boundingInfo.boundingBox.maximum.asArray()
        });
      }
    });

    await pipeline.dispose();

  } catch (error) {
    console.error('[ERROR] Mesh visibility test failed:', error);
  } finally {
    scene.dispose();
    engine.dispose();
  }

  console.log('[END] Mesh visibility test completed');
}

/**
 * Test camera positioning
 */
export function testCameraPositioning(scene: BABYLON.Scene, mesh: BABYLON.Mesh): void {
  console.log('[DEBUG] Testing camera positioning for mesh:', mesh.name);

  const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
  if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) {
    console.warn('[WARN] No ArcRotateCamera found in scene');
    return;
  }

  const boundingInfo = mesh.getBoundingInfo();
  const center = boundingInfo.boundingBox.center;
  const size = boundingInfo.boundingBox.extendSize.length();

  console.log('[DEBUG] Mesh bounding info:', {
    center: center.asArray(),
    size: size,
    extendSize: boundingInfo.boundingBox.extendSize.asArray()
  });

  // Position camera to view the mesh
  camera.setTarget(center);
  camera.radius = Math.max(size * 3, 10);
  camera.alpha = -Math.PI / 4;
  camera.beta = Math.PI / 3;

  console.log('[DEBUG] Camera positioned:', {
    target: camera.getTarget().asArray(),
    radius: camera.radius,
    alpha: camera.alpha,
    beta: camera.beta,
    position: camera.position.asArray()
  });
}

/**
 * Create a test material with high visibility
 */
export function createHighVisibilityMaterial(name: string, scene: BABYLON.Scene): BABYLON.StandardMaterial {
  const material = new BABYLON.StandardMaterial(name, scene);
  
  // Bright, high-contrast colors
  material.diffuseColor = new BABYLON.Color3(1, 0.8, 0.2); // Bright orange
  material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  material.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.0); // Slight glow
  
  // Ensure it's not transparent
  material.alpha = 1.0;
  
  console.log('[DEBUG] Created high visibility material:', name);
  return material;
}

// Export for use in other modules
export { testMeshVisibility as default };
