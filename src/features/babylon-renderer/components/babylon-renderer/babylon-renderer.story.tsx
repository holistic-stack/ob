/**
 * @file Babylon Renderer Story for Playwright Component Testing
 * 
 * Simple story component for testing BabylonRenderer in Playwright
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { BabylonRenderer } from './babylon-renderer';

export function BasicBabylonRenderer() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BabylonRenderer />
    </div>
  );
}

export function FullBabylonRenderer() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BabylonRenderer 
        showSceneControls={true}
        showMeshDisplay={true}
        showDebugPanel={true}
      />
    </div>
  );
}

export function GridLayoutBabylonRenderer() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BabylonRenderer 
        layout="grid"
        showSceneControls={true}
        showMeshDisplay={true}
        showDebugPanel={true}
      />
    </div>
  );
}

export function CustomBabylonRenderer() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BabylonRenderer 
        layout="grid"
        responsive={false}
        showSceneControls={true}
        showMeshDisplay={true}
        showDebugPanel={true}
        engineConfig={{
          antialias: true
        }}
        sceneConfig={{
          enableCamera: true,
          enableLighting: true,
          backgroundColor: '#ff0000',
          cameraPosition: [5, 5, 5]
        }}
        className="custom-renderer"
        aria-label="Custom 3D Renderer"
      />
    </div>
  );
}
