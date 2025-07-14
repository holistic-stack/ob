/**
 * @file BabylonJS Scene Component
 *
 * React component that provides declarative BabylonJS scene management
 * with React 19 compatibility and hook-based integration.
 */

import type { Engine as BabylonEngineType, Scene as BabylonSceneType } from '@babylonjs/core';
import { Color3, Color4, Vector3 } from '@babylonjs/core';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Engine, Scene } from 'react-babylonjs';
import { createLogger } from '../../../../shared/services/logger.service';
import { useBabylonEngine } from '../../hooks/use-babylon-engine';
import { useBabylonInspector } from '../../hooks/use-babylon-inspector';

const logger = createLogger('BabylonScene');

/**
 * BabylonJS scene configuration
 */
export interface BabylonSceneConfig {
  readonly enableWebGPU: boolean;
  readonly enableInspector: boolean;
  readonly enablePhysics: boolean;
  readonly enableXR: boolean;
  readonly antialias: boolean;
  readonly adaptToDeviceRatio: boolean;
  readonly backgroundColor: Color3;
  readonly environmentIntensity: number;
  readonly imageProcessingEnabled: boolean;
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  readonly type: 'arcRotate' | 'free' | 'universal';
  readonly position: Vector3;
  readonly target: Vector3;
  readonly radius?: number;
  readonly alpha?: number;
  readonly beta?: number;
  readonly fov?: number;
  readonly minZ?: number;
  readonly maxZ?: number;
}

/**
 * Lighting configuration
 */
export interface LightingConfig {
  readonly ambient: {
    readonly enabled: boolean;
    readonly color: Color3;
    readonly intensity: number;
    readonly direction?: Vector3;
  };
  readonly directional: {
    readonly enabled: boolean;
    readonly color: Color3;
    readonly intensity: number;
    readonly direction: Vector3;
  };
  readonly environment: {
    readonly enabled: boolean;
    readonly textureUrl?: string;
    readonly intensity: number;
  };
}

/**
 * BabylonJS scene props
 */
export interface BabylonSceneProps {
  readonly config?: Partial<BabylonSceneConfig>;
  readonly camera?: Partial<CameraConfig>;
  readonly lighting?: Partial<LightingConfig>;
  readonly children?: React.ReactNode;
  readonly onSceneReady?: (scene: BabylonSceneType) => void;
  readonly onEngineReady?: (engine: BabylonEngineType) => void;
  readonly onRenderLoop?: () => void;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}

/**
 * Default scene configuration
 */
const DEFAULT_SCENE_CONFIG: BabylonSceneConfig = {
  enableWebGPU: true,
  enableInspector: false,
  enablePhysics: false,
  enableXR: false,
  antialias: true,
  adaptToDeviceRatio: true,
  backgroundColor: new Color3(0.2, 0.2, 0.3),
  environmentIntensity: 1.0,
  imageProcessingEnabled: true,
} as const;

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  type: 'arcRotate',
  position: new Vector3(0, 5, -10),
  target: new Vector3(0, 0, 0),
  radius: 10,
  alpha: -Math.PI / 2,
  beta: Math.PI / 2.5,
  fov: Math.PI / 3,
  minZ: 0.1,
  maxZ: 1000,
} as const;

/**
 * Default lighting configuration
 */
const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  ambient: {
    enabled: true,
    color: new Color3(1, 1, 1),
    intensity: 0.7,
    direction: new Vector3(0, 1, 0),
  },
  directional: {
    enabled: true,
    color: new Color3(1, 1, 1),
    intensity: 1.0,
    direction: new Vector3(-1, -1, -1),
  },
  environment: {
    enabled: false,
    intensity: 1.0,
  },
} as const;

/**
 * BabylonJS Scene Component
 *
 * Provides declarative scene management with React 19 compatibility.
 * Integrates with BabylonJS services for engine and inspector management.
 */
export const BabylonScene: React.FC<BabylonSceneProps> = ({
  config: userConfig,
  camera: userCamera,
  lighting: userLighting,
  children,
  onSceneReady,
  onEngineReady,
  onRenderLoop,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BabylonSceneType | null>(null);
  const engineRef = useRef<BabylonEngineType | null>(null);

  // Merge configurations with defaults
  const config = useMemo(
    () => ({
      ...DEFAULT_SCENE_CONFIG,
      ...userConfig,
    }),
    [userConfig]
  );

  const camera = useMemo(
    () => ({
      ...DEFAULT_CAMERA_CONFIG,
      ...userCamera,
    }),
    [userCamera]
  );

  const lighting = useMemo(
    () => ({
      ambient: { ...DEFAULT_LIGHTING_CONFIG.ambient, ...userLighting?.ambient },
      directional: { ...DEFAULT_LIGHTING_CONFIG.directional, ...userLighting?.directional },
      environment: { ...DEFAULT_LIGHTING_CONFIG.environment, ...userLighting?.environment },
    }),
    [userLighting]
  );

  // Initialize BabylonJS services
  const { engineService, engineState, initializeEngine, disposeEngine } = useBabylonEngine();

  const { inspectorService, inspectorState, showInspector, hideInspector } = useBabylonInspector();

  /**
   * Handle scene ready callback
   */
  const handleSceneReady = useCallback(
    (sceneEventArgs: any) => {
      const scene = sceneEventArgs.scene;
      logger.debug('[DEBUG][BabylonScene] Scene ready');
      sceneRef.current = scene;

      // Configure scene properties
      scene.clearColor = new Color4(
        config.backgroundColor.r,
        config.backgroundColor.g,
        config.backgroundColor.b,
        1.0
      );
      scene.environmentIntensity = config.environmentIntensity;
      scene.imageProcessingConfiguration.isEnabled = config.imageProcessingEnabled;

      // Initialize inspector if enabled (async operation)
      if (config.enableInspector && inspectorService) {
        inspectorService.show(scene).then((result) => {
          if (!result.success) {
            logger.warn(`[WARN][BabylonScene] Failed to show inspector: ${result.error.message}`);
          }
        });
      }

      // Call user callback
      onSceneReady?.(scene);
    },
    [config, inspectorService, onSceneReady]
  );

  /**
   * Handle engine ready callback
   */
  const handleEngineReady = useCallback(
    (engine: BabylonEngineType) => {
      logger.debug('[DEBUG][BabylonScene] Engine ready');
      engineRef.current = engine;

      // Call user callback
      onEngineReady?.(engine);
    },
    [onEngineReady]
  );

  /**
   * Handle render loop callback
   */
  const handleRenderLoop = useCallback(() => {
    // Call user callback
    onRenderLoop?.();
  }, [onRenderLoop]);

  /**
   * Initialize engine when canvas is available
   */
  useEffect(() => {
    if (canvasRef.current && engineService) {
      const initEngine = async () => {
        const result = await initializeEngine(canvasRef.current!, {
          enableWebGPU: config.enableWebGPU,
          antialias: config.antialias,
          adaptToDeviceRatio: config.adaptToDeviceRatio,
        });

        if (!result.success) {
          logger.error(
            `[ERROR][BabylonScene] Failed to initialize engine: ${result.error.message}`
          );
        }
      };

      initEngine();
    }

    return () => {
      // Cleanup on unmount
      if (config.enableInspector && inspectorService) {
        hideInspector();
      }
      disposeEngine();
    };
  }, [
    engineService,
    inspectorService,
    config.enableWebGPU,
    config.antialias,
    config.adaptToDeviceRatio,
    config.enableInspector,
    initializeEngine,
    disposeEngine,
    hideInspector,
  ]);

  /**
   * Render the BabylonJS scene
   */
  if (!engineState.isInitialized || !engineState.engine) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          ...style,
        }}
      >
        <div>
          <div>Initializing BabylonJS Engine...</div>
          {engineState.error && (
            <div style={{ color: '#ff6b6b', marginTop: '8px', fontSize: '14px' }}>
              Error: {engineState.error.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Engine
        antialias={config.antialias}
        adaptToDeviceRatio={config.adaptToDeviceRatio}
        onEngineReady={handleEngineReady}
      >
        <Scene onSceneMount={handleSceneReady} onRender={handleRenderLoop}>
          {/* Camera */}
          {camera.type === 'arcRotate' && (
            <arcRotateCamera
              name="camera"
              position={
                camera.position
                  ? new Vector3(camera.position.x, camera.position.y, camera.position.z)
                  : new Vector3(10, 10, 10)
              }
              target={
                camera.target
                  ? new Vector3(camera.target.x, camera.target.y, camera.target.z)
                  : Vector3.Zero()
              }
              radius={camera.radius ?? 10}
              alpha={camera.alpha ?? -Math.PI / 2}
              beta={camera.beta ?? Math.PI / 2.5}
              fov={camera.fov ?? Math.PI / 4}
              minZ={camera.minZ ?? 0.1}
              maxZ={camera.maxZ ?? 1000}
              setActiveOnSceneIfNoneActive={true}
            />
          )}

          {/* Lighting */}
          {lighting.ambient.enabled && (
            <hemisphericLight
              name="ambient-light"
              direction={lighting.ambient.direction || new Vector3(0, 1, 0)}
              diffuse={lighting.ambient.color}
              intensity={lighting.ambient.intensity}
            />
          )}

          {lighting.directional.enabled && (
            <directionalLight
              name="directional-light"
              direction={lighting.directional.direction}
              diffuse={lighting.directional.color}
              intensity={lighting.directional.intensity}
            />
          )}

          {/* User content */}
          {children}
        </Scene>
      </Engine>
    </div>
  );
};
