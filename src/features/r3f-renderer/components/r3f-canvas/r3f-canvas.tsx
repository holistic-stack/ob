/**
 * @file R3FCanvas Component
 *
 * React Three Fiber canvas component equivalent to BabylonCanvas.
 * Handles renderer and scene initialization with proper lifecycle management
 *
 * Features:
 * - Clean canvas rendering without UI controls (perfect for visual testing)
 * - Proper renderer and scene lifecycle management
 * - Support for both development and testing environments
 * - Comprehensive logging for debugging
 * - Integration with R3F engine and scene services
 *
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useEffect, useCallback, useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import type { R3FCanvasProps } from '../../types/r3f-types';
import { R3FScene } from '../r3f-scene/r3f-scene';
import { R3FCameraControls } from '../r3f-camera-controls/r3f-camera-controls';
import { R3FNavigationCube } from '../r3f-navigation-cube/r3f-navigation-cube';
import './r3f-canvas.css';

/**
 * R3FCanvas Component
 *
 * Responsible for:
 * - Rendering the React Three Fiber Canvas
 * - Initializing R3F renderer and scene
 * - Managing render loop
 * - Providing clean API for 3D rendering
 *
 * @param props - Canvas configuration and styling props
 * @returns JSX element containing the R3F canvas
 *
 * @example
 * ```tsx
 * <R3FCanvas
 *   className="my-canvas"
 *   sceneConfig={{
 *     enableCamera: true,
 *     enableLighting: true,
 *     backgroundColor: '#2c3e50'
 *   }}
 *   canvasConfig={{
 *     antialias: true,
 *     shadows: true
 *   }}
 *   onRendererReady={(renderer) => console.log('Renderer ready:', renderer)}
 *   onSceneReady={(scene) => console.log('Scene ready:', scene)}
 * />
 * ```
 */
export function R3FCanvas({
  className = '',
  canvasConfig = {},
  sceneConfig = {},
  cameraConfig = {},
  onRendererReady,
  onSceneReady,
  onRenderFrame,
  onCreated,
  onPointerMissed,
  children,
  'aria-label': ariaLabel = '3D Scene Canvas',
  ...props
}: R3FCanvasProps): React.JSX.Element {
  console.log('[INIT] Initializing R3FCanvas component');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendererInstance, setRendererInstance] = useState<THREE.WebGLRenderer | null>(null);
  const [sceneInstance, setSceneInstance] = useState<THREE.Scene | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Default canvas configuration
  const defaultCanvasConfig = {
    antialias: true,
    alpha: false,
    shadows: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    outputColorSpace: THREE.SRGBColorSpace,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance' as const,
    ...canvasConfig
  };

  // Default camera configuration
  const defaultCameraConfig = {
    position: sceneConfig.cameraPosition ?? [10, 10, 10],
    fov: 50,
    near: 0.1,
    far: 1000,
    enableControls: true,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    enableDamping: true,
    dampingFactor: 0.05,
    autoRotate: false,
    autoRotateSpeed: 2,
    minDistance: 1,
    maxDistance: 100,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    ...cameraConfig
  };

  // Default scene configuration
  const defaultSceneConfig = {
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#2c3e50',
    enableGrid: true,
    enableAxes: true,
    ambientLightIntensity: 0.4,
    directionalLightIntensity: 1,
    directionalLightPosition: [10, 10, 5] as const,
    gridSize: 20,
    ...sceneConfig
  };

  // Callback for renderer ready event
  const handleRendererReady = useCallback((renderer: THREE.WebGLRenderer) => {
    console.log('[DEBUG] Renderer ready, calling onRendererReady callback');
    setRendererInstance(renderer);
    if (onRendererReady) {
      onRendererReady(renderer);
    }
  }, [onRendererReady]);

  // Callback for scene ready event
  const handleSceneReady = useCallback((scene: THREE.Scene) => {
    console.log('[DEBUG] Scene ready, calling onSceneReady callback');
    setSceneInstance(scene);
    if (onSceneReady) {
      onSceneReady(scene);
    }
  }, [onSceneReady]);

  // Callback for render frame event
  const handleRenderFrame = useCallback((scene: THREE.Scene) => {
    if (onRenderFrame) {
      onRenderFrame(scene);
    }
  }, [onRenderFrame]);

  const handleCreated = useCallback((state: any) => {
    console.log('[DEBUG] R3F Canvas created, state:', state);

    // Set background color
    if (defaultSceneConfig.backgroundColor) {
      state.scene.background = new THREE.Color(defaultSceneConfig.backgroundColor);
    }

    // Configure renderer
    state.gl.setClearColor(defaultSceneConfig.backgroundColor || '#2c3e50');
    state.gl.shadowMap.enabled = defaultCanvasConfig.shadows;
    state.gl.shadowMap.type = THREE.PCFSoftShadowMap;

    // Set up tone mapping for better visual quality
    state.gl.toneMapping = defaultCanvasConfig.toneMapping;
    state.gl.toneMappingExposure = 1;
    state.gl.outputColorSpace = defaultCanvasConfig.outputColorSpace;

    // Store instances
    handleRendererReady(state.gl);
    handleSceneReady(state.scene);
    setIsInitialized(true);

    // Call user callback
    if (onCreated) {
      onCreated(state);
    }

    console.log('[DEBUG] R3F Canvas initialization complete');
  }, [defaultSceneConfig.backgroundColor, defaultCanvasConfig.shadows, defaultCanvasConfig.toneMapping, defaultCanvasConfig.outputColorSpace, handleRendererReady, handleSceneReady, onCreated]);

  // Derived state
  const isReady = isInitialized && rendererInstance && sceneInstance;

  // Render frame effect
  useEffect(() => {
    if (isReady && sceneInstance) {
      handleRenderFrame(sceneInstance);
    }
  }, [isReady, sceneInstance, handleRenderFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[DEBUG] R3FCanvas unmounting, cleaning up');
      setRendererInstance(null);
      setSceneInstance(null);
      setIsInitialized(false);
    };
  }, []);

  // Combine CSS classes
  const containerClasses = [
    'r3f-canvas-container',
    'w-full h-full',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      role="img"
      aria-label={ariaLabel}
      data-testid="r3f-canvas-container"
      {...props}
    >
      <Canvas
        ref={canvasRef}
        camera={defaultCameraConfig}
        onCreated={handleCreated}
        {...(onPointerMissed && { onPointerMissed })}
        shadows="soft"
        gl={{
          antialias: defaultCanvasConfig.antialias,
          alpha: defaultCanvasConfig.alpha,
          preserveDrawingBuffer: defaultCanvasConfig.preserveDrawingBuffer,
          powerPreference: defaultCanvasConfig.powerPreference,
          toneMapping: defaultCanvasConfig.toneMapping,
          outputColorSpace: defaultCanvasConfig.outputColorSpace
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          {/* Enhanced Camera Controls */}
          {defaultSceneConfig.enableCamera && defaultCameraConfig.enableControls && (
            <R3FCameraControls
              enableZoom={defaultCameraConfig.enableZoom}
              enablePan={defaultCameraConfig.enablePan}
              enableRotate={defaultCameraConfig.enableRotate}
              autoRotate={defaultCameraConfig.autoRotate}
              autoRotateSpeed={defaultCameraConfig.autoRotateSpeed}
              minDistance={defaultCameraConfig.minDistance}
              maxDistance={defaultCameraConfig.maxDistance}
              minPolarAngle={defaultCameraConfig.minPolarAngle}
              maxPolarAngle={defaultCameraConfig.maxPolarAngle}
              dampingFactor={defaultCameraConfig.dampingFactor}
              enableDamping={defaultCameraConfig.enableDamping}
              target={defaultSceneConfig.cameraTarget ?? [0, 0, 0]}
              position={defaultSceneConfig.cameraPosition ?? [10, 10, 10]}
              autoFrame={false}
              onPositionChange={(position) => {
                console.log('[R3F Canvas] Camera position changed:', position);
              }}
              onError={(error) => {
                console.error('[R3F Canvas] Camera error:', error);
              }}
            />
          )}

          {/* Navigation Cube */}
          {defaultSceneConfig.enableCamera && (
            <R3FNavigationCube
              size={1.2}
              showLabels={true}
              enableAnimation={true}
              visible={true}
              onCameraChange={(position) => {
                console.log('[R3F Canvas] Navigation cube camera change:', position);
              }}
              onError={(error) => {
                console.error('[R3F Canvas] Navigation cube error:', error);
              }}
            />
          )}

          {/* Lighting */}
          {defaultSceneConfig.enableLighting && (
            <>
              <ambientLight 
                intensity={defaultSceneConfig.ambientLightIntensity || 0.4} 
              />
              <directionalLight
                position={defaultSceneConfig.directionalLightPosition || [10, 10, 5]}
                intensity={defaultSceneConfig.directionalLightIntensity || 1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
              />
            </>
          )}

          {/* Grid */}
          {defaultSceneConfig.enableGrid && (
            <Grid
              args={[defaultSceneConfig.gridSize || 20, defaultSceneConfig.gridSize || 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6f6f6f"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#9d4b4b"
              fadeDistance={25}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />
          )}

          {/* Axes Helper */}
          {defaultSceneConfig.enableAxes && (
            <axesHelper args={[5]} />
          )}

          {/* Environment */}
          <Environment preset="city" />

          {/* Scene Content */}
          <R3FScene config={defaultSceneConfig}>
            {children}
          </R3FScene>

          {/* Performance Stats (development only) */}
          {process.env.NODE_ENV === 'development' && <Stats />}

          {/* Fog */}
          {defaultSceneConfig.fog && (
            <fog
              attach="fog"
              args={[
                defaultSceneConfig.fog.color,
                defaultSceneConfig.fog.near,
                defaultSceneConfig.fog.far
              ]}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

// Default export for easier imports
export default R3FCanvas;
