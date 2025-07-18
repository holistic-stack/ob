/**
 * @file BabylonJS Scene Component
 *
 * React component that provides declarative BabylonJS scene management
 * with React 19 compatibility and hook-based integration.
 */

import type { Engine as BabylonEngineType, Scene as BabylonSceneType } from '@babylonjs/core';
import { Color3, Engine, Vector3 } from '@babylonjs/core';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import { useBabylonInspector } from '../../hooks/use-babylon-inspector';
import type {
  SceneCameraConfig as ServiceCameraConfig,
  SceneLightingConfig as ServiceLightingConfig,
  BabylonSceneConfig as ServiceSceneConfig,
} from '../../services/babylon-scene-service';
import { createBabylonSceneService } from '../../services/babylon-scene-service';
import { performCompleteBufferClearing } from '../../utils/buffer-clearing/buffer-clearing';

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
  const { inspectorService, hideInspector } = useBabylonInspector();

  /**
   * Initialize BabylonJS engine and scene using Scene Management Service
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    logger.init('[INIT][BabylonScene] Initializing BabylonJS engine and scene');

    // Create engine
    const engine = new Engine(
      canvasRef.current,
      config.antialias,
      {
        preserveDrawingBuffer: true,
        stencil: true,
        loseContextOnDispose: true,
      },
      config.adaptToDeviceRatio
    );

    engineRef.current = engine;

    // Create scene service and initialize
    const sceneService = createBabylonSceneService();

    // Convert component config to service config
    const serviceConfig: ServiceSceneConfig = {
      autoClear: false,
      autoClearDepthAndStencil: false,
      backgroundColor: config.backgroundColor,
      environmentIntensity: config.environmentIntensity,
      enablePhysics: config.enablePhysics,
      enableInspector: config.enableInspector,
      imageProcessingEnabled: config.imageProcessingEnabled,
    };

    const serviceCameraConfig: Partial<ServiceCameraConfig> = {
      type: camera.type,
      position: camera.position,
      target: camera.target,
      ...(camera.radius !== undefined && { radius: camera.radius }),
      ...(camera.alpha !== undefined && { alpha: camera.alpha }),
      ...(camera.beta !== undefined && { beta: camera.beta }),
      ...(camera.fov !== undefined && { fov: camera.fov }),
      ...(camera.minZ !== undefined && { minZ: camera.minZ }),
      ...(camera.maxZ !== undefined && { maxZ: camera.maxZ }),
    };

    const serviceLightingConfig: ServiceLightingConfig = {
      ambient: lighting.ambient,
      directional: lighting.directional,
    };

    const initOptions = {
      engine,
      config: serviceConfig,
      camera: serviceCameraConfig,
      lighting: serviceLightingConfig,
      onSceneReady: (scene: BabylonSceneType) => {
        sceneRef.current = scene;
        // Store scene service reference for camera controls
        (scene as BabylonSceneType & { _sceneService?: typeof sceneService })._sceneService =
          sceneService;
        onSceneReady?.(scene);
      },
      ...(onRenderLoop && { onRenderLoop }),
    };

    const initializeScene = async () => {
      const result = await sceneService.init(initOptions);

      if (!result.success) {
        logger.error('[ERROR][BabylonScene] Scene initialization failed:', result.error);
        return;
      }

      logger.debug('[DEBUG][BabylonScene] Scene initialized successfully');
    };

    initializeScene();

    // Setup render loop with explicit buffer clearing to prevent camera trails
    engine.runRenderLoop(() => {
      if (sceneRef.current) {
        // Perform complete buffer clearing to prevent camera trails/ghosting
        performCompleteBufferClearing(engine, sceneRef.current);

        // Render the scene
        sceneRef.current.render();
      }
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Call engine ready callback
    onEngineReady?.(engine);

    logger.info('[INFO][BabylonScene] ✅ BabylonJS engine and scene initialized');

    // Cleanup
    return () => {
      logger.debug('[DEBUG][BabylonScene] Cleaning up BabylonJS resources');
      window.removeEventListener('resize', handleResize);

      if (config.enableInspector && inspectorService) {
        hideInspector();
      }

      // Dispose scene service
      sceneService.dispose();

      // Dispose engine
      engine.dispose();

      sceneRef.current = null;
      engineRef.current = null;

      logger.end('[END][BabylonScene] Cleanup complete');
    };
  }, [
    config,
    camera,
    lighting,
    onEngineReady,
    onSceneReady,
    onRenderLoop,
    inspectorService,
    hideInspector,
  ]);

  /**
   * Render the canvas element
   */
  return (
    <div className={className} style={style}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        data-testid="babylon-canvas"
        aria-label="BabylonJS 3D Scene"
        role="img"
      />
    </div>
  );
};
