/**
 * @file Camera Controls Hook
 * 
 * React hook for controlling Babylon.js camera from UI components
 * Provides camera manipulation functions for zoom, pan, rotate, and reset
 */

import { useCallback, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { 
  positionCameraForScene, 
  resetCamera 
} from '../../../babylon-renderer/services/camera-service';
import type { ViewAction } from './visualization-panel';

// ============================================================================
// Types
// ============================================================================

export interface CameraControlsAPI {
  readonly handleViewAction: (action: ViewAction) => void;
  readonly setScene: (scene: BABYLON.Scene | null) => void;
  readonly getCamera: () => BABYLON.ArcRotateCamera | null;
}

// ============================================================================
// Camera Controls Hook
// ============================================================================

/**
 * Hook for controlling Babylon.js camera from UI components
 * 
 * @returns Camera control API with view action handler and scene setter
 */
export const useCameraControls = (): CameraControlsAPI => {
  const sceneRef = useRef<BABYLON.Scene | null>(null);

  /**
   * Get the current ArcRotateCamera from the scene
   */
  const getCamera = useCallback((): BABYLON.ArcRotateCamera | null => {
    if (!sceneRef.current) {
      console.warn('[CameraControls] No scene available');
      return null;
    }

    const camera = sceneRef.current.cameras.find(
      cam => cam instanceof BABYLON.ArcRotateCamera
    ) as BABYLON.ArcRotateCamera;

    if (!camera) {
      console.warn('[CameraControls] No ArcRotateCamera found in scene');
      return null;
    }

    return camera;
  }, []);

  /**
   * Set the scene reference for camera control
   */
  const setScene = useCallback((scene: BABYLON.Scene | null) => {
    sceneRef.current = scene;
    console.log('[CameraControls] Scene set:', !!scene);
  }, []);

  /**
   * Handle zoom in action
   */
  const handleZoomIn = useCallback(() => {
    const camera = getCamera();
    if (!camera) return;

    const zoomFactor = 0.8; // Zoom in by 20%
    camera.radius *= zoomFactor;
    console.log('[CameraControls] Zoom in - new radius:', camera.radius);
  }, [getCamera]);

  /**
   * Handle zoom out action
   */
  const handleZoomOut = useCallback(() => {
    const camera = getCamera();
    if (!camera) return;

    const zoomFactor = 1.25; // Zoom out by 25%
    camera.radius *= zoomFactor;
    console.log('[CameraControls] Zoom out - new radius:', camera.radius);
  }, [getCamera]);

  /**
   * Handle pan actions
   */
  const handlePan = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const camera = getCamera();
    if (!camera) return;

    const panAmount = camera.radius * 0.1; // Pan by 10% of current radius
    const currentTarget = camera.getTarget();

    let deltaX = 0;
    let deltaY = 0;
    let deltaZ = 0;

    switch (direction) {
      case 'up':
        deltaY = panAmount;
        break;
      case 'down':
        deltaY = -panAmount;
        break;
      case 'left':
        deltaX = -panAmount;
        break;
      case 'right':
        deltaX = panAmount;
        break;
    }

    const newTarget = new BABYLON.Vector3(
      currentTarget.x + deltaX,
      currentTarget.y + deltaY,
      currentTarget.z + deltaZ
    );

    camera.setTarget(newTarget);
    console.log('[CameraControls] Pan', direction, '- new target:', newTarget);
  }, [getCamera]);

  /**
   * Handle rotation actions
   */
  const handleRotate = useCallback((direction: 'left' | 'right') => {
    const camera = getCamera();
    if (!camera) return;

    const rotationAmount = Math.PI / 8; // 22.5 degrees

    if (direction === 'left') {
      camera.alpha -= rotationAmount;
    } else {
      camera.alpha += rotationAmount;
    }

    console.log('[CameraControls] Rotate', direction, '- new alpha:', camera.alpha);
  }, [getCamera]);

  /**
   * Handle reset camera action
   */
  const handleReset = useCallback(() => {
    const camera = getCamera();
    if (!camera) return;

    resetCamera(camera);
    console.log('[CameraControls] Camera reset to default position');
  }, [getCamera]);

  /**
   * Handle fit to view action
   */
  const handleFitToView = useCallback(() => {
    const camera = getCamera();
    const scene = sceneRef.current;
    if (!camera || !scene) return;

    // Get all meshes in the scene
    const meshes = scene.meshes.filter(mesh => 
      mesh instanceof BABYLON.AbstractMesh && 
      !mesh.isDisposed &&
      mesh.name !== '__root__' // Exclude root mesh
    ) as BABYLON.AbstractMesh[];

    if (meshes.length === 0) {
      console.warn('[CameraControls] No meshes found for fit to view');
      return;
    }

    const result = positionCameraForScene(camera, meshes);
    if (result.success) {
      console.log('[CameraControls] Fit to view - camera positioned for', meshes.length, 'meshes');
    } else {
      console.warn('[CameraControls] Fit to view failed:', result.error);
    }
  }, [getCamera]);

  /**
   * Main view action handler
   */
  const handleViewAction = useCallback((action: ViewAction) => {
    console.log('[CameraControls] Handling view action:', action);

    switch (action) {
      case 'zoom-in':
        handleZoomIn();
        break;
      case 'zoom-out':
        handleZoomOut();
        break;
      case 'pan-up':
        handlePan('up');
        break;
      case 'pan-down':
        handlePan('down');
        break;
      case 'pan-left':
        handlePan('left');
        break;
      case 'pan-right':
        handlePan('right');
        break;
      case 'rotate-left':
        handleRotate('left');
        break;
      case 'rotate-right':
        handleRotate('right');
        break;
      case 'reset':
        handleReset();
        break;
      case 'fit-to-view':
        handleFitToView();
        break;
      default:
        console.warn('[CameraControls] Unknown view action:', action);
    }
  }, [
    handleZoomIn,
    handleZoomOut,
    handlePan,
    handleRotate,
    handleReset,
    handleFitToView
  ]);

  return {
    handleViewAction,
    setScene,
    getCamera
  };
};

export default useCameraControls;
