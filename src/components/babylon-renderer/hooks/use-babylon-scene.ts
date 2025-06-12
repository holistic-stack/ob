/**
 * @file Babylon Scene Hook (SRP: Scene Management Only)
 * 
 * Custom hook following Single Responsibility Principle:
 * - Only manages Babylon.js scene lifecycle
 * - Handles scene configuration and rendering
 * - Provides scene instance and render function
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';

interface SceneConfig {
  enableCamera?: boolean;
  enableLighting?: boolean;
  backgroundColor?: string;
  cameraPosition?: readonly [number, number, number];
}

interface BabylonSceneState {
  scene: BABYLON.Scene | null;
  isReady: boolean;
  render: () => void;
}

/**
 * Hook for managing Babylon.js scene lifecycle
 * Follows SRP: Only handles scene creation, configuration, and rendering
 */
export function useBabylonScene(
  engine: BABYLON.Engine | null,
  config: SceneConfig = {}
): BabylonSceneState {
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const renderLoopRef = useRef<(() => void) | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Memoized scene configuration (avoiding unnecessary re-renders)
  const sceneConfig = useMemo(() => ({
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#2c3e50',
    cameraPosition: [10, 10, 10] as [number, number, number],
    ...config
  }), [config]);

  // Safe render function with error handling
  const safeRender = useCallback(() => {
    if (!sceneRef.current || !engine) return;
    
    try {
      sceneRef.current.render();
    } catch (renderError) {
      console.error('[ERROR] Scene render failed:', renderError);
      // Don't throw - just log and continue
    }
  }, [engine]);

  // Scene initialization effect
  useEffect(() => {
    if (!engine) {
      setIsReady(false);
      return;
    }

    console.log('[INIT] Creating Babylon.js scene');
    
    try {
      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Configure scene background
      scene.clearColor = new BABYLON.Color4(
        ...BABYLON.Color3.FromHexString(sceneConfig.backgroundColor).asArray(), 
        1.0
      );

      // Add camera if enabled
      if (sceneConfig.enableCamera) {
        console.log('[DEBUG] Setting up ArcRotate camera');

        const camera = new BABYLON.ArcRotateCamera(
          'camera',
          -Math.PI / 4,    // Alpha: 45 degrees around Y axis
          Math.PI / 3,     // Beta: 60 degrees from horizontal
          20,              // Radius: increased distance for better view
          BABYLON.Vector3.Zero(),
          scene
        );

        // Enhanced camera controls for better user experience
        camera.inertia = 0.9;
        camera.angularSensibilityX = 1000;
        camera.angularSensibilityY = 1000;
        camera.panningSensibility = 1000;
        camera.wheelPrecision = 50;

        // Set camera limits for better control
        camera.lowerRadiusLimit = 2;   // Minimum zoom distance
        camera.upperRadiusLimit = 100; // Maximum zoom distance
        camera.lowerBetaLimit = 0.1;   // Prevent camera from going below ground
        camera.upperBetaLimit = Math.PI - 0.1; // Prevent camera from flipping

        // Position camera
        if (sceneConfig.cameraPosition) {
          const [x, y, z] = sceneConfig.cameraPosition;
          camera.position = new BABYLON.Vector3(x, y, z);
          console.log('[DEBUG] Camera positioned at:', camera.position.toString());
        }

        console.log('[DEBUG] Camera setup complete:', {
          alpha: camera.alpha,
          beta: camera.beta,
          radius: camera.radius,
          target: camera.target.toString()
        });
      }

      // Add lighting if enabled
      if (sceneConfig.enableLighting) {
        console.log('[DEBUG] Setting up scene lighting');

        // Ambient light for overall illumination
        const ambientLight = new BABYLON.HemisphericLight(
          'ambientLight',
          new BABYLON.Vector3(0, 1, 0),
          scene
        );
        ambientLight.intensity = 0.8; // Increased for better visibility
        ambientLight.diffuse = new BABYLON.Color3(1, 1, 1);
        ambientLight.specular = new BABYLON.Color3(1, 1, 1);

        // Directional light for shadows and definition
        const directionalLight = new BABYLON.DirectionalLight(
          'directionalLight',
          new BABYLON.Vector3(-1, -1, -1),
          scene
        );
        directionalLight.intensity = 0.6; // Increased for better visibility
        directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
        directionalLight.specular = new BABYLON.Color3(1, 1, 1);

        // Additional point light for better illumination
        const pointLight = new BABYLON.PointLight(
          'pointLight',
          new BABYLON.Vector3(10, 10, 10),
          scene
        );
        pointLight.intensity = 0.4;
        pointLight.diffuse = new BABYLON.Color3(1, 1, 1);

        console.log('[DEBUG] Lighting setup complete:', {
          ambientIntensity: ambientLight.intensity,
          directionalIntensity: directionalLight.intensity,
          pointIntensity: pointLight.intensity
        });
      }

      // Start render loop
      const renderLoop = () => safeRender();
      renderLoopRef.current = renderLoop;
      engine.runRenderLoop(renderLoop);

      setIsReady(true);
      console.log('[DEBUG] Babylon.js scene created successfully');

      // Cleanup function
      return () => {
        console.log('[DEBUG] Cleaning up Babylon.js scene');
        
        if (engine && !engine.isDisposed) {
          engine.stopRenderLoop();
        }
        
        if (scene && !scene.isDisposed) {
          scene.dispose();
        }
        
        sceneRef.current = null;
        renderLoopRef.current = null;
        setIsReady(false);
      };

    } catch (sceneError) {
      console.error('[ERROR] Scene creation failed:', sceneError);
      setIsReady(false);
      return undefined;
    }
  }, [engine, sceneConfig, safeRender]);

  return {
    scene: sceneRef.current,
    isReady,
    render: safeRender
  };
}
