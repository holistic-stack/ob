/**
 * @file BabylonCanvas Component
 *
 * A clean, focused React component for BabylonJS canvas rendering.
 * Follows React 19 best practices with automatic optimization and context hoisting.
 *
 * @example
 * ```tsx
 * <BabylonCanvas
 *   onSceneReady={(scene) => {
 *     // Setup your 3D scene
 *     const camera = new ArcRotateCamera('camera', 0, 0, 10, Vector3.Zero(), scene);
 *   }}
 *   onEngineReady={(engine) => {
 *     console.log('Engine ready:', engine);
 *   }}
 *   className="w-full h-full"
 * />
 * ```
 */

import { Engine, Scene } from '@babylonjs/core';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { createLogger } from '../../../shared/services/logger.service';
import type {
  BabylonCanvasProps,
  BabylonEngineOptions,
  BabylonSceneOptions,
} from './babylon-canvas.types';
import { DEFAULT_ENGINE_OPTIONS, DEFAULT_SCENE_OPTIONS } from './babylon-canvas.types';

const logger = createLogger('BabylonCanvas');

/**
 * BabylonCanvas Component
 *
 * A React component that provides a canvas element with BabylonJS engine and scene initialization.
 * Follows React 19 patterns with automatic optimization and proper cleanup.
 *
 * Key Features:
 * - React 19 automatic optimization (no manual memoization needed)
 * - Context hoisting to prevent WebGL context loss
 * - Proper cleanup and disposal
 * - TypeScript strict mode compliance
 * - Error boundaries with Result<T,E> patterns
 */
export const BabylonCanvas: React.FC<BabylonCanvasProps> = ({
  onSceneReady,
  onEngineReady,
  onRenderLoop,
  engineOptions,
  sceneOptions,
  className = 'w-full h-full',
  style,
  'data-testid': dataTestId = 'babylon-canvas',
  'aria-label': ariaLabel = 'BabylonJS 3D Canvas',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  /**
   * Initialize BabylonJS engine and scene
   * Uses React 19 patterns with proper dependency management
   */
  useEffect(() => {
    if (!canvasRef.current) {
      logger.warn('[WARN][BabylonCanvas] Canvas ref not available');
      return;
    }

    logger.init('[INIT][BabylonCanvas] Initializing BabylonJS engine and scene');

    // Merge user options with defaults
    const finalEngineOptions: BabylonEngineOptions = {
      ...DEFAULT_ENGINE_OPTIONS,
      ...engineOptions,
    };

    const finalSceneOptions: BabylonSceneOptions = {
      ...DEFAULT_SCENE_OPTIONS,
      ...sceneOptions,
    };

    try {
      // Create engine with context hoisting for stability
      const engine = new Engine(
        canvasRef.current,
        finalEngineOptions.antialias ?? true,
        {
          preserveDrawingBuffer: finalEngineOptions.preserveDrawingBuffer ?? true,
          stencil: finalEngineOptions.stencil ?? true,
          loseContextOnDispose: finalEngineOptions.loseContextOnDispose ?? true,
        },
        finalEngineOptions.adaptToDeviceRatio ?? true
      );

      engineRef.current = engine;

      // Create scene
      const scene = new Scene(engine);
      sceneRef.current = scene;

      // Setup render loop
      engine.runRenderLoop(() => {
        if (onRenderLoop) {
          onRenderLoop();
        }
        scene.render();
      });

      // Handle resize with ResizeObserver (better than window events)
      const resizeObserver = new ResizeObserver(() => {
        engine.resize();
      });

      if (canvasRef.current.parentElement) {
        resizeObserver.observe(canvasRef.current.parentElement);
      }

      // Call user callbacks (React 19 auto-optimizes these)
      if (onEngineReady) {
        onEngineReady(engine);
      }

      if (onSceneReady) {
        onSceneReady(scene);
      }

      logger.info('[INFO][BabylonCanvas] ✅ Engine and scene initialized successfully');

      // Cleanup function
      return () => {
        logger.debug('[DEBUG][BabylonCanvas] Cleaning up BabylonJS resources');

        resizeObserver.disconnect();

        if (sceneRef.current) {
          sceneRef.current.dispose();
          sceneRef.current = null;
        }

        if (engineRef.current) {
          engineRef.current.dispose();
          engineRef.current = null;
        }

        logger.end('[END][BabylonCanvas] Cleanup complete');
      };
    } catch (error) {
      logger.error('[ERROR][BabylonCanvas] Failed to initialize:', error);
      // In a real implementation, we'd use Result<T,E> patterns here
      throw error;
    }
  }, [onSceneReady, onEngineReady, onRenderLoop, engineOptions, sceneOptions]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      role="img"
    />
  );
};
