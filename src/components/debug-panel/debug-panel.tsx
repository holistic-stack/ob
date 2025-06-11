/**
 * @file Debug Panel Component
 * 
 * A React component for debugging mesh visibility and scene issues
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React from 'react';
import * as BABYLON from '@babylonjs/core';

interface DebugPanelProps {
  scene: BABYLON.Scene | null;
  engine: BABYLON.Engine | null;
}

export function DebugPanel({ scene, engine }: DebugPanelProps): React.JSX.Element {
  const createTestCube = () => {
    if (!scene) {
      console.error('[ERROR] No scene available for test cube creation');
      return;
    }

    console.log('[DEBUG] Creating test cube in scene');
    
    // Clear existing test cubes
    const existingTestCubes = scene.meshes.filter(m => m.name.includes('debug_test'));
    existingTestCubes.forEach(mesh => {
      console.log('[DEBUG] Removing existing test cube:', mesh.name);
      mesh.dispose();
    });

    // Create a bright, visible test cube
    const testCube = BABYLON.MeshBuilder.CreateBox('debug_test_cube', { 
      width: 3, 
      height: 3, 
      depth: 3 
    }, scene);

    // Create a very visible material
    const material = new BABYLON.StandardMaterial('debug_test_material', scene);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0); // Bright red
    material.emissiveColor = new BABYLON.Color3(0.3, 0, 0); // Red glow
    material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    testCube.material = material;

    // Position at origin
    testCube.position = new BABYLON.Vector3(0, 0, 0);

    // Ensure visibility
    testCube.setEnabled(true);
    testCube.isVisible = true;

    console.log('[DEBUG] Test cube created:', {
      name: testCube.name,
      position: testCube.position.asArray(),
      isVisible: testCube.isVisible,
      isEnabled: testCube.isEnabled(),
      vertices: testCube.getTotalVertices(),
      indices: testCube.getTotalIndices(),
      hasMaterial: testCube.material !== null
    });

    // Position camera to look at the cube
    const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
    if (camera && camera instanceof BABYLON.ArcRotateCamera) {
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.radius = 10;
      camera.alpha = -Math.PI / 4;
      camera.beta = Math.PI / 3;
      
      console.log('[DEBUG] Camera repositioned to view test cube');
    }

    // Force render
    if (engine) {
      scene.render();
    }
  };

  const analyzeScene = () => {
    if (!scene) {
      console.error('[ERROR] No scene available for analysis');
      return;
    }

    console.log('[DEBUG] === SCENE ANALYSIS ===');
    
    // General scene info
    console.log('[DEBUG] Scene info:', {
      totalMeshes: scene.meshes.length,
      totalLights: scene.lights.length,
      hasActiveCamera: scene.activeCamera !== null,
      isReady: scene.isReady(),
      clearColor: scene.clearColor
    });

    // Camera info
    if (scene.activeCamera) {
      const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
      console.log('[DEBUG] Camera info:', {
        name: camera.name,
        type: camera.constructor.name,
        position: camera.position.asArray(),
        target: camera instanceof BABYLON.ArcRotateCamera ? camera.getTarget().asArray() : 'N/A',
        radius: camera instanceof BABYLON.ArcRotateCamera ? camera.radius : 'N/A'
      });
    }

    // Mesh analysis
    console.log('[DEBUG] Meshes in scene:');
    scene.meshes.forEach((mesh, index) => {
      console.log(`[DEBUG] Mesh ${index}:`, {
        name: mesh.name,
        isVisible: mesh.isVisible,
        isEnabled: mesh.isEnabled(),
        hasGeometry: mesh.geometry !== null,
        vertices: mesh.getTotalVertices(),
        indices: mesh.getTotalIndices(),
        hasMaterial: mesh.material !== null,
        position: mesh.position.asArray(),
        scaling: mesh.scaling.asArray(),
        boundingBox: mesh.getBoundingInfo().boundingBox.center.asArray()
      });
    });

    // Light analysis
    console.log('[DEBUG] Lights in scene:');
    scene.lights.forEach((light, index) => {
      console.log(`[DEBUG] Light ${index}:`, {
        name: light.name,
        type: light.constructor.name,
        intensity: light.intensity,
        isEnabled: light.isEnabled()
      });
    });
  };

  const testRender = () => {
    if (!scene || !engine) {
      console.error('[ERROR] No scene or engine available for render test');
      return;
    }

    console.log('[DEBUG] Testing render...');
    
    try {
      scene.render();
      console.log('[DEBUG] Render successful');
    } catch (error) {
      console.error('[ERROR] Render failed:', error);
    }
  };

  const resetCamera = () => {
    if (!scene) {
      console.error('[ERROR] No scene available for camera reset');
      return;
    }

    const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
    if (camera && camera instanceof BABYLON.ArcRotateCamera) {
      camera.setTarget(BABYLON.Vector3.Zero());
      camera.radius = 15;
      camera.alpha = -Math.PI / 2;
      camera.beta = Math.PI / 2.5;
      
      console.log('[DEBUG] Camera reset to default position');
    }
  };

  return (
    <div style={{ 
      padding: '10px', 
      border: '2px solid #ff6b6b', 
      margin: '10px', 
      backgroundColor: '#ffe0e0',
      borderRadius: '5px'
    }}>
      <h3 style={{ color: '#d63031', margin: '0 0 10px 0' }}>🐛 Debug Panel</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button 
          onClick={createTestCube}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#ff6b6b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Create Test Cube
        </button>
        
        <button 
          onClick={analyzeScene}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#74b9ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Analyze Scene
        </button>
        
        <button 
          onClick={testRender}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#00b894', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Render
        </button>
        
        <button 
          onClick={resetCamera}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#fdcb6e', 
            color: 'black', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset Camera
        </button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#636e72' }}>
        <strong>Instructions:</strong> Use these buttons to debug mesh visibility issues. 
        Check the browser console for detailed output.
      </div>
    </div>
  );
}
