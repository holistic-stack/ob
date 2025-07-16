/**
 * @file Store-Connected BabylonJS Renderer
 *
 * React component that connects the BabylonJS renderer with the Zustand store.
 * Provides seamless integration between OpenSCAD AST and 3D visualization.
 */

import {
  type Engine as BabylonEngineType,
  type Scene as BabylonSceneType,
  Color3,
  Vector3,
} from '@babylonjs/core';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { ASTNode } from '../../../openscad-parser/core/ast-types';
import { useAppStore } from '../../../store/app-store';
import {
  selectParsingAST,
  selectRenderingErrors,
  selectRenderingIsRendering,
  selectRenderingMeshes,
} from '../../../store/selectors';
import type { BabylonSceneProps } from '../babylon-scene';
import { BabylonScene } from '../babylon-scene';

const logger = createLogger('StoreConnectedRenderer');

/**
 * Store-connected renderer props
 */
export interface StoreConnectedRendererProps {
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly enableInspector?: boolean;
  readonly enableWebGPU?: boolean;
  readonly onRenderComplete?: (meshCount: number) => void;
  readonly onRenderError?: (error: Error) => void;
}

/**
 * Store-Connected BabylonJS Renderer Component
 *
 * Integrates BabylonJS scene with Zustand store for reactive 3D rendering.
 * Automatically renders OpenSCAD AST changes and manages rendering state.
 */
export const StoreConnectedRenderer: React.FC<StoreConnectedRendererProps> = ({
  className,
  style,
  enableInspector = false,
  enableWebGPU = true,
  onRenderComplete,
  onRenderError,
}) => {
  // Debug component mounting
  logger.debug('[DEBUG][StoreConnectedRenderer] Component is mounting/rendering');

  const sceneRef = useRef<BabylonSceneType | null>(null);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const lastASTRef = useRef<readonly ASTNode[]>([]);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store selectors - use individual primitive selectors to avoid infinite loops
  const ast = useAppStore(selectParsingAST);
  const isRendering = useAppStore(selectRenderingIsRendering);
  const renderErrors = useAppStore(selectRenderingErrors);
  const meshes = useAppStore(selectRenderingMeshes);

  // Debug initial AST value on mount
  useEffect(() => {
    logger.debug(`[DEBUG][StoreConnectedRenderer] Component mounted with AST: ${ast.length} nodes`);
    logger.debug(`[DEBUG][StoreConnectedRenderer] Initial AST reference: ${ast}`);
    logger.debug(`[DEBUG][StoreConnectedRenderer] Initial AST content: ${JSON.stringify(ast)}`);
  }, []); // Empty dependency array - runs only on mount

  // Debug AST changes
  console.log(`[DEBUG][StoreConnectedRenderer] Component rendering - AST length: ${ast.length}, AST reference:`, ast);
  logger.debug(`[DEBUG][StoreConnectedRenderer] Component rendering - AST length: ${ast.length}`);

  // Debug AST changes - use length and JSON to force dependency detection
  useEffect(() => {
    console.log(`[DEBUG][StoreConnectedRenderer] AST useEffect triggered - length: ${ast.length}`);
    logger.debug(`[DEBUG][StoreConnectedRenderer] AST changed: ${ast.length} nodes`);
  }, [ast.length, JSON.stringify(ast)]);

  // Store actions - use individual selectors to avoid infinite loops
  const renderAST = useAppStore((state) => state.renderAST);
  const setScene = useAppStore((state) => state.setScene);
  const clearScene = useAppStore((state) => state.clearScene);
  const updatePerformanceMetrics = useAppStore((state) => state.updatePerformanceMetrics);
  const showInspector = useAppStore((state) => state.showInspector);
  const hideInspector = useAppStore((state) => state.hideInspector);

  // Create stable fallback functions to prevent infinite loops
  const safeRenderAST = useCallback(
    async (astNodes: any[]) => {
      logger.debug(`[DEBUG][StoreConnectedRenderer] safeRenderAST called with ${astNodes.length} nodes`);

      if (renderAST) {
        const result = await renderAST(astNodes);
        logger.debug(`[DEBUG][StoreConnectedRenderer] renderAST completed with success: ${result.success}`);
        return result;
      }

      logger.error(`[ERROR][StoreConnectedRenderer] renderAST function not available`);
      return {
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED' as const,
          message: 'BabylonJS rendering not implemented',
          timestamp: new Date(),
          service: 'renderer' as const,
        },
      };
    },
    [renderAST]
  );

  const safeClearScene = useCallback(() => {
    if (clearScene) {
      clearScene();
    }
  }, [clearScene]);

  const safeShowInspector = useCallback(async () => {
    if (showInspector) {
      return await showInspector();
    }
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED' as const,
        message: 'Inspector not implemented',
        timestamp: new Date(),
        service: 'inspector' as const,
      },
    };
  }, [showInspector]);

  const safeHideInspector = useCallback(() => {
    if (hideInspector) {
      return hideInspector();
    }
    return {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED' as const,
        message: 'Inspector not implemented',
        timestamp: new Date(),
        service: 'inspector' as const,
      },
    };
  }, [hideInspector]);

  /**
   * Scene configuration
   */
  const sceneConfig = useMemo(
    (): Partial<BabylonSceneProps['config']> => ({
      enableWebGPU,
      enableInspector,
      enablePhysics: false,
      enableXR: false,
      antialias: true,
      adaptToDeviceRatio: true,
    }),
    [enableWebGPU, enableInspector]
  );

  /**
   * Camera configuration for OpenSCAD visualization
   */
  const cameraConfig = useMemo(
    (): Partial<BabylonSceneProps['camera']> => ({
      type: 'arcRotate',
      radius: 20,
      alpha: -Math.PI / 4,
      beta: Math.PI / 3,
      fov: Math.PI / 3,
      minZ: 0.1,
      maxZ: 1000,
    }),
    []
  );

  /**
   * Lighting configuration optimized for 3D models
   */
  const lightingConfig = useMemo(
    (): Partial<BabylonSceneProps['lighting']> => ({
      ambient: {
        enabled: true,
        intensity: 0.6,
        color: new Color3(1, 1, 1), // White ambient light
        direction: new Vector3(0, 1, 0), // Up direction
      },
      directional: {
        enabled: true,
        intensity: 1.0,
        color: new Color3(1, 1, 1), // White directional light
        direction: new Vector3(-1, -1, -1), // Top-left-front direction
      },
      environment: {
        enabled: false,
        intensity: 1.0,
      },
    }),
    []
  );

  /**
   * Handle scene ready
   */
  const handleSceneReady = useCallback(async (scene: BabylonSceneType) => {
    logger.info('[INFO][StoreConnectedRenderer] 🎬 Scene ready callback triggered!');
    logger.info(
      `[INFO][StoreConnectedRenderer] Scene details: ${scene ? 'Scene object exists' : 'Scene is null'}`
    );

    sceneRef.current = scene;
    setIsSceneReady(!!scene);

    // Set scene reference in the store for AST rendering
    if (setScene) {
      setScene(scene);
    }

    if (scene) {
      logger.info(
        `[INFO][StoreConnectedRenderer] Scene info - meshes: ${scene.meshes?.length ?? 0}, cameras: ${scene.cameras?.length ?? 0}, lights: ${scene.lights?.length ?? 0}`
      );
      logger.info(
        `[INFO][StoreConnectedRenderer] Engine info - canvas: ${scene.getEngine()?.getRenderingCanvas() ? 'exists' : 'missing'}`
      );
    }

    logger.info('[DEBUG][StoreConnectedRenderer] Scene and engine ready for rendering');
  }, []);

  /**
   * Handle engine ready
   */
  const handleEngineReady = useCallback(
    (engine: BabylonEngineType) => {
      logger.info('[INFO][StoreConnectedRenderer] 🚀 Engine ready callback triggered!');
      logger.info(
        `[INFO][StoreConnectedRenderer] Engine details: ${engine ? 'Engine object exists' : 'Engine is null'}`
      );

      // Start performance monitoring
      updatePerformanceMetrics();

      // Set up performance monitoring interval
      const performanceInterval = setInterval(() => {
        updatePerformanceMetrics();
      }, 1000);

      // Cleanup on unmount
      return () => {
        clearInterval(performanceInterval);
      };
    },
    [updatePerformanceMetrics]
  );

  /**
   * Handle render loop
   */
  const handleRenderLoop = useCallback(() => {
    // Update performance metrics periodically
    if (Math.random() < 0.01) {
      // Update 1% of frames to avoid performance impact
      updatePerformanceMetrics();
    }
  }, [updatePerformanceMetrics]);

  /**
   * Render AST when it changes
   */
  useEffect(() => {
    console.log(`[DEBUG][StoreConnectedRenderer] MAIN useEffect triggered - AST length: ${ast.length}, lastAST length: ${lastASTRef.current.length}`);
    logger.debug(`[DEBUG][StoreConnectedRenderer] useEffect triggered - AST length: ${ast.length}, lastAST length: ${lastASTRef.current.length}`);

    // CRITICAL FIX: Prevent infinite loop when both ASTs are empty
    // If both current and last AST are empty, skip rendering to prevent infinite loop
    if (ast.length === 0 && lastASTRef.current.length === 0) {
      logger.debug('[DEBUG][StoreConnectedRenderer] Skipping render - both ASTs are empty');
      return;
    }

    // Skip if AST hasn't changed (check content only, not reference)

    // For non-empty ASTs, do a content check
    if (lastASTRef.current.length > 0 && ast.length === lastASTRef.current.length && ast.length > 0) {
      const currentASTString = JSON.stringify(ast);
      const lastASTString = JSON.stringify(lastASTRef.current);
      const astChanged = currentASTString !== lastASTString;

      console.log(`[DEBUG][StoreConnectedRenderer] AST content comparison:`);
      console.log(`[DEBUG][StoreConnectedRenderer] Current AST:`, currentASTString.substring(0, 200));
      console.log(`[DEBUG][StoreConnectedRenderer] Last AST:`, lastASTString.substring(0, 200));
      console.log(`[DEBUG][StoreConnectedRenderer] AST changed:`, astChanged);

      if (!astChanged) {
        logger.debug('[DEBUG][StoreConnectedRenderer] Skipping render - AST content unchanged');
        return;
      }
    }

    logger.debug(`[DEBUG][StoreConnectedRenderer] AST change detected - proceeding with render`);

    // Skip if already rendering
    if (isRendering) {
      logger.debug('[DEBUG][StoreConnectedRenderer] Skipping render - already rendering');
      return;
    }

    // Skip if no AST
    if (!ast || ast.length === 0) {
      // Only clear scene if there are meshes to clear (prevent infinite loop)
      if (meshes.length > 0) {
        logger.debug('[DEBUG][StoreConnectedRenderer] Clearing scene - no AST');
        safeClearScene();
      } else {
        logger.debug('[DEBUG][StoreConnectedRenderer] Scene already clear - no AST');
      }
      lastASTRef.current = ast;
      return;
    }

    // Debounce rendering
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(async () => {
      logger.debug(`[DEBUG][StoreConnectedRenderer] Rendering AST with ${ast.length} nodes...`);

      const startTime = performance.now();
      const result = await safeRenderAST([...ast]);
      const renderTime = performance.now() - startTime;

      if (result.success) {
        logger.debug(
          `[DEBUG][StoreConnectedRenderer] AST rendered successfully in ${renderTime.toFixed(2)}ms`
        );
        onRenderComplete?.(meshes.length);
      } else {
        logger.error(
          `[ERROR][StoreConnectedRenderer] AST rendering failed: ${result.error.message}`
        );
        onRenderError?.(new Error(result.error.message));
      }

      lastASTRef.current = ast;
    }, 300); // 300ms debounce

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [
    ast.length,
    JSON.stringify(ast),
    isRendering,
    safeRenderAST,
    safeClearScene,
    onRenderComplete,
    onRenderError,
  ]);

  /**
   * Handle inspector toggle
   */
  useEffect(() => {
    if (enableInspector && isSceneReady) {
      safeShowInspector().then((result) => {
        if (!result.success) {
          logger.warn(
            `[WARN][StoreConnectedRenderer] Failed to show inspector: ${result.error.message}`
          );
        }
      });
    } else if (!enableInspector) {
      const result = safeHideInspector();
      if (!result.success) {
        logger.warn(
          `[WARN][StoreConnectedRenderer] Failed to hide inspector: ${result.error.message}`
        );
      }
    }
  }, [enableInspector, isSceneReady, safeShowInspector, safeHideInspector]);

  /**
   * Log render errors
   */
  useEffect(() => {
    if (renderErrors.length > 0) {
      const latestError = renderErrors[renderErrors.length - 1];
      logger.error('[ERROR][StoreConnectedRenderer] Render error:', latestError);
      onRenderError?.(new Error(latestError?.message || 'Unknown render error'));
    }
  }, [renderErrors, onRenderError]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Render status overlay
   */
  const renderStatusOverlay = () => {
    if (isRendering) {
      return (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-white">Rendering...</span>
          </div>
        </div>
      );
    }

    if (renderErrors.length > 0) {
      return (
        <div className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-10 max-w-sm">
          <div className="font-semibold">Render Error</div>
          <div className="text-sm mt-1">
            {renderErrors[renderErrors.length - 1]?.message || 'Unknown error occurred'}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`relative ${className || ''}`} style={style}>
      <BabylonScene
        config={sceneConfig || {}}
        camera={cameraConfig || {}}
        lighting={lightingConfig || {}}
        onSceneReady={handleSceneReady}
        onEngineReady={handleEngineReady}
        onRenderLoop={handleRenderLoop}
        className="w-full h-full"
      />
      {renderStatusOverlay()}
    </div>
  );
};
