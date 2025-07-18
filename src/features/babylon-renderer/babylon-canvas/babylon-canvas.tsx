/**
 * @file babylon-canvas.tsx
 * @description A clean, focused React component for Babylon.js canvas rendering.
 * This component handles the initialization and lifecycle management of the Babylon.js engine and scene,
 * providing a robust and optimized foundation for 3D visualization within a React application.
 *
 * @architectural_decision
 * - **React 19 Best Practices**: Leverages React 19's automatic optimization capabilities, reducing the need for manual memoization.
 * - **Context Hoisting**: Designed to prevent WebGL context loss, ensuring stability and reliability of the 3D rendering.
 * - **Proper Cleanup**: Implements a comprehensive cleanup mechanism to dispose of Babylon.js resources when the component unmounts,
 *   preventing memory leaks.
 * - **TypeScript Strict Mode**: Developed with strict TypeScript settings to ensure type safety and reduce runtime errors.
 * - **Error Boundaries**: While not directly implemented within this component, it's designed to work seamlessly with external
 *   error boundaries and `Result<T, E>` patterns for robust error handling.
 *
 * @example
 * ```tsx
 * import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
 * import { BabylonCanvas } from './features/babylon-renderer/babylon-canvas';
 *
 * function My3DScene() {
 *   return (
 *     <BabylonCanvas
 *       onSceneReady={(scene) => {
 *         // Setup your 3D scene here
 *         const camera = new ArcRotateCamera('camera', 0, 0, 10, Vector3.Zero(), scene);
 *         camera.attachControl(scene.getEngine().get  Canvas(), true);
 *         // Add lights, meshes, etc.
 *       }}
 *       onEngineReady={(engine) => {
 *         console.log('Babylon.js Engine ready:', engine);
 *       }}
 *       onRenderLoop={() => {
 *         // Optional: Logic to run on each render frame
 *       }}
 *       engineOptions={{ antialias: true, adaptToDeviceRatio: true }}
 *       className="w-full h-full bg-gray-900"
 *     />
 *   );
 * }
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[BabylonCanvas Component] --> B{useEffect: Mount};
 *    B --> C{Get Canvas Ref};
 *    C -- No Canvas --> D[WARN: Canvas not available];
 *    C -- Canvas Available --> E[Initialize Babylon.js Engine];
 *    E --> F[Initialize Babylon.js Scene];
 *    F --> G[Setup Render Loop];
 *    G --> H[Setup ResizeObserver];
 *    H --> I[Call onEngineReady & onSceneReady callbacks];
 *    I --> J[Return Cleanup Function];
 *    J -- Unmount --> K[Dispose Scene & Engine];
 *    K --> L[Disconnect ResizeObserver];
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

/**
 * @constant logger
 * @description Logger instance for the `BabylonCanvas` component, providing structured logging for lifecycle events and debugging.
 */
const logger = createLogger('BabylonCanvas');

/**
 * @component BabylonCanvas
 * @description A React functional component that renders a `<canvas>` element and initializes a Babylon.js 3D rendering environment within it.
 * It provides callbacks for when the engine and scene are ready, and manages their lifecycle.
 * @param {BabylonCanvasProps} props - The properties for the component.
 * @returns {React.FC<BabylonCanvasProps>} A React functional component.
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
  /**
   * @property {React.RefObject<HTMLCanvasElement>} canvasRef
   * @description A React ref attached to the `<canvas>` DOM element. Used to access the canvas element directly for Babylon.js initialization.
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * @property {React.MutableRefObject<Engine | null>} engineRef
   * @description A mutable ref to store the Babylon.js `Engine` instance. This allows the engine to persist across renders and be accessed in cleanup functions.
   */
  const engineRef = useRef<Engine | null>(null);

  /**
   * @property {React.MutableRefObject<Scene | null>} sceneRef
   * @description A mutable ref to store the Babylon.js `Scene` instance. This allows the scene to persist across renders and be accessed in cleanup functions.
   */
  const sceneRef = useRef<Scene | null>(null);

  /**
   * @effect
   * @description This `useEffect` hook is responsible for initializing the Babylon.js engine and scene
   * when the component mounts, and cleaning them up when the component unmounts.
   * It merges default options with provided `engineOptions` and `sceneOptions`.
   *
   * @dependencies `onSceneReady`, `onEngineReady`, `onRenderLoop`, `engineOptions`, `sceneOptions`
   *
   * @architectural_decision
   * - **Single Effect for Lifecycle**: Consolidates engine and scene initialization and disposal into a single `useEffect` hook.
   *   This ensures that resources are properly managed together.
   * - **`ResizeObserver`**: Uses `ResizeObserver` instead of `window.addEventListener('resize')` for more efficient and targeted resizing.
   *   It observes the parent element of the canvas, ensuring the engine resizes only when its container changes.
   * - **WebGL Context Management**: The `loseContextOnDispose: true` option for the engine helps in proper context management,
   *   especially in development environments with hot module reloading.
   *
   * @limitations
   * - Error handling within the `try...catch` block currently throws an error. In a production application,
   *   this might be replaced with a more robust error reporting mechanism (e.g., `Result<T,E>` pattern or error boundary propagation).
   * - The `sceneOptions` are currently not fully utilized in the `Scene` constructor, only `engineOptions` are.
   *
   * @edge_cases
   * - **Canvas Not Available**: If `canvasRef.current` is `null` (e.g., component unmounts before effect runs),
   *   a warning is logged and initialization is skipped.
   * - **Parent Element Missing**: If `canvasRef.current.parentElement` is `null`, the `ResizeObserver` will not be attached.
   *
   * @example
   * ```typescript
   * // This effect runs automatically on component mount.
   * // The cleanup function returned by this effect runs on component unmount.
   * ```
   */
  useEffect(() => {
    if (!canvasRef.current) {
      logger.warn('[WARN][BabylonCanvas] Canvas ref not available');
      return;
    }

    logger.init('[INIT][BabylonCanvas] Initializing BabylonJS engine and scene');

    const finalEngineOptions: BabylonEngineOptions = {
      ...DEFAULT_ENGINE_OPTIONS,
      ...engineOptions,
    };

    const _finalSceneOptions: BabylonSceneOptions = {
      ...DEFAULT_SCENE_OPTIONS,
      ...sceneOptions,
    };

    try {
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

      const scene = new Scene(engine);
      sceneRef.current = scene;

      engine.runRenderLoop(() => {
        if (onRenderLoop) {
          onRenderLoop();
        }
        scene.render();
      });

      const resizeObserver = new ResizeObserver(() => {
        engine.resize();
      });

      if (canvasRef.current.parentElement) {
        resizeObserver.observe(canvasRef.current.parentElement);
      }

      if (onEngineReady) {
        onEngineReady(engine);
      }

      if (onSceneReady) {
        onSceneReady(scene);
      }

      logger.info('[INFO][BabylonCanvas] ✅ Engine and scene initialized successfully');

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
