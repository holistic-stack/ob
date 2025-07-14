/**
 * @file Store-Connected BabylonJS Renderer
 *
 * React component that connects the BabylonJS renderer with the Zustand store.
 * Provides seamless integration between OpenSCAD AST and 3D visualization.
 */

import { Color3, Vector3 } from '@babylonjs/core';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  const sceneRef = useRef<any>(null);
  const lastASTRef = useRef<readonly ASTNode[]>([]);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store selectors
  const ast = useAppStore(selectParsingAST);
  const isRendering = useAppStore(selectRenderingIsRendering);
  const renderErrors = useAppStore(selectRenderingErrors);
  const meshes = useAppStore(selectRenderingMeshes);

  // Store actions
  const {
    initializeEngine,
    renderAST,
    clearScene,
    updatePerformanceMetrics,
    showInspector,
    hideInspector,
  } = useAppStore((state) => ({
    initializeEngine:
      state.initializeEngine ||
      (() =>
        Promise.resolve({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'BabylonJS rendering not implemented',
            timestamp: new Date(),
            service: 'renderer',
          },
        })),
    renderAST:
      state.renderAST ||
      (() =>
        Promise.resolve({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'BabylonJS rendering not implemented',
            timestamp: new Date(),
            service: 'renderer',
          },
        })),
    clearScene: state.clearScene || (() => {}),
    updatePerformanceMetrics: state.updatePerformanceMetrics || (() => {}),
    showInspector:
      state.showInspector ||
      (() => ({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Inspector not implemented',
          timestamp: new Date(),
          service: 'inspector',
        },
      })),
    hideInspector:
      state.hideInspector ||
      (() => ({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Inspector not implemented',
          timestamp: new Date(),
          service: 'inspector',
        },
      })),
  }));

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
  const handleSceneReady = useCallback(
    async (scene: any) => {
      logger.debug('[DEBUG][StoreConnectedRenderer] Scene ready, initializing engine...');
      sceneRef.current = scene;

      // Initialize BabylonJS engine through store
      const canvas = scene.getEngine().getRenderingCanvas();
      if (canvas) {
        const result = await initializeEngine(canvas);
        if (!result.success) {
          logger.error(
            `[ERROR][StoreConnectedRenderer] Engine initialization failed: ${result.error.message}`
          );
          onRenderError?.(new Error(result.error.message));
        } else {
          logger.debug('[DEBUG][StoreConnectedRenderer] Engine initialized successfully');
        }
      }
    },
    [initializeEngine, onRenderError]
  );

  /**
   * Handle engine ready
   */
  const handleEngineReady = useCallback(
    (_engine: any) => {
      logger.debug('[DEBUG][StoreConnectedRenderer] Engine ready');

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
    // Skip if AST hasn't changed
    if (ast === lastASTRef.current) {
      return;
    }

    // Skip if already rendering
    if (isRendering) {
      logger.debug('[DEBUG][StoreConnectedRenderer] Skipping render - already rendering');
      return;
    }

    // Skip if no AST
    if (!ast || ast.length === 0) {
      logger.debug('[DEBUG][StoreConnectedRenderer] Clearing scene - no AST');
      clearScene();
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
      const result = await renderAST(ast);
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
  }, [ast, isRendering, renderAST, clearScene, meshes.length, onRenderComplete, onRenderError]);

  /**
   * Handle inspector toggle
   */
  useEffect(() => {
    if (enableInspector && sceneRef.current) {
      const result = showInspector();
      if (!result.success) {
        logger.warn(
          `[WARN][StoreConnectedRenderer] Failed to show inspector: ${result.error.message}`
        );
      }
    } else if (!enableInspector) {
      const result = hideInspector();
      if (!result.success) {
        logger.warn(
          `[WARN][StoreConnectedRenderer] Failed to hide inspector: ${result.error.message}`
        );
      }
    }
  }, [enableInspector, showInspector, hideInspector]);

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
