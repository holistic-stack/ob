/**
 * Store-Connected Three.js Renderer Component
 *
 * Zustand-centric React component that renders 3D scenes exclusively through
 * the application store, implementing the proper data flow:
 * OpenSCAD code → Store → AST → Three.js rendering
 */

import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { createLogger } from '../../../shared/services/logger.service.js';
import type { CameraConfig } from '../../../shared/types/common.types.js';
import type { Result } from '../../../shared/types/result.types.js';
import type { AppStore } from '../../store/app-store.js';
import { useAppStore } from '../../store/app-store.js';
import {
  selectConfigEnableRealTimeRendering,
  selectParsingAST,
  selectRenderingCamera,
  selectRenderingState,
} from '../../store/selectors/index.js';
import type { RenderingError, RenderingState } from '../../store/types/store.types';
import type { Mesh3D } from '../types/renderer.types';
import { R3FScene } from './r3f-scene';

const logger = createLogger('StoreConnectedRenderer');

// Default fallback objects - defined outside component to prevent re-creation
const DEFAULT_RENDERING_STATE: RenderingState = {
  meshes: [],
  isRendering: false,
  renderErrors: [],
  lastRendered: null,
  renderTime: 0,
  camera: {
    position: [5, 5, 5] as readonly [number, number, number],
    target: [0, 0, 0] as readonly [number, number, number],
    zoom: 1,
    fov: 75,
    near: 0.1,
    far: 1000,
    enableControls: true,
    enableAutoRotate: false,
    autoRotateSpeed: 1,
  },
};

/**
 * Props for the store-connected renderer
 */
interface StoreConnectedRendererProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * Store-connected Three.js renderer that implements Zustand-only data flow
 */
export const StoreConnectedRenderer: React.FC<StoreConnectedRendererProps> = ({
  className = '',
  'data-testid': testId = 'store-connected-renderer',
  width = 800,
  height = 600,
}) => {
  logger.init('Initializing store-connected 3D renderer');

  // Store selectors - all data comes from Zustand with proper fallbacks
  const ast = useAppStore((state: AppStore) => selectParsingAST(state) ?? []);
  const camera = useAppStore(
    (state: AppStore) =>
      selectRenderingCamera(state) ??
      ({
        position: [5, 5, 5] as readonly [number, number, number],
        target: [0, 0, 0] as readonly [number, number, number],
        zoom: 1,
        fov: 75,
        near: 0.1,
        far: 1000,
        enableControls: true,
        enableAutoRotate: false,
        autoRotateSpeed: 1,
      } as CameraConfig)
  );
  const renderingState = useAppStore(selectRenderingState) ?? DEFAULT_RENDERING_STATE;

  const enableRealTimeRendering = useAppStore(selectConfigEnableRealTimeRendering) ?? true;

  // Store actions - use direct selectors with stable callbacks (more efficient)
  const updateCamera = useAppStore(
    useCallback(
      (state: AppStore) =>
        state.updateCamera ??
        (() => {
          // Default empty implementation
        }),
      []
    )
  );

  const addRenderError = useAppStore(
    useCallback(
      (state: AppStore) =>
        state.addRenderError ??
        (() => {
          // Default empty implementation
        }),
      []
    )
  );
  const clearRenderErrors = useAppStore(
    useCallback(
      (state: AppStore) =>
        state.clearRenderErrors ??
        (() => {
          // Default empty implementation
        }),
      []
    )
  );
  const updateMeshes = useAppStore(
    useCallback(
      (state: AppStore) =>
        state.updateMeshes ??
        (() => {
          // Default empty implementation
        }),
      []
    )
  );

  /**
   * Handle camera changes - update store
   */
  const handleCameraChange = useCallback(
    (newCamera: CameraConfig) => {
      logger.debug('Camera changed, updating store');
      updateCamera(newCamera);
    },
    [updateCamera]
  );

  /**
   * Handle render completion - update store state
   */
  const handleRenderComplete = useCallback(
    (meshes: ReadonlyArray<Mesh3D>) => {
      logger.debug(`Render completed with ${meshes.length} meshes`);

      // Update store with actual mesh data
      updateMeshes(meshes.map((m) => m.mesh));

      logger.debug(`Updated store with ${meshes.length} meshes`);
    },
    [
      // Update store with actual mesh data
      updateMeshes,
    ]
  );

  /**
   * Handle render errors - update store
   */
  const handleRenderError = useCallback(
    (error: { message: string }) => {
      logger.error('Render error:', error.message);
      addRenderError({ type: 'webgl', message: error.message });
    },
    [addRenderError]
  );

  /**
   * Memoized AST processing (expensive calculation optimization)
   */
  const processedAST = useMemo(() => {
    return ast?.filter((node) => node != null) ?? [];
  }, [ast]);

  /**
   * Effect: Clear render errors when AST changes (R3F Scene handles actual rendering)
   */
  useEffect(() => {
    if (!enableRealTimeRendering || processedAST.length === 0) {
      return;
    }

    logger.debug('AST changed, clearing render errors (R3F Scene will handle rendering)');
    clearRenderErrors();
  }, [enableRealTimeRendering, processedAST, clearRenderErrors]);

  /**
   * Memoized debug info (prevent unnecessary recalculations)
   */
  const debugInfo = useMemo(
    () => ({
      astNodeCount: processedAST.length,
      isRendering: renderingState?.isRendering ?? false,
      meshCount: renderingState?.meshes?.length ?? 0,
      errorCount: renderingState?.renderErrors?.length ?? 0,
      cameraPosition: camera?.position ?? [0, 0, 0],
      lastRenderTime: 0,
    }),
    [
      processedAST.length,
      renderingState?.isRendering,
      renderingState?.meshes?.length,
      renderingState?.renderErrors?.length,
      camera?.position,
    ]
  );

  /**
   * Effect: Log store state changes for debugging (optimized dependencies)
   */
  useEffect(() => {
    logger.debug('Store state updated:', debugInfo);
  }, [debugInfo]); // Single memoized dependency

  // Camera is already properly typed from the selector with fallback
  const defaultCamera: CameraConfig = camera;

  return (
    <div
      className={`store-connected-renderer ${className}`}
      data-testid={testId}
      style={{ width, height }}
    >
      <Canvas
        camera={{
          position: defaultCamera.position,
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* R3F Scene component - handles all Three.js rendering */}
        <R3FScene
          astNodes={ast ?? []}
          camera={defaultCamera}
          onCameraChange={handleCameraChange}
          onRenderComplete={handleRenderComplete}
          onRenderError={handleRenderError}
        />

        {/* Performance stats (if monitoring is enabled) */}
        {process.env.NODE_ENV === 'development' && <Stats />}
      </Canvas>

      {/* Rendering status indicator */}
      {renderingState?.isRendering && (
        <div
          className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded"
          data-testid="rendering-indicator"
        >
          Rendering...
        </div>
      )}

      {/* Error display */}
      {renderingState?.renderErrors?.length > 0 && (
        <div
          className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded max-w-md"
          data-testid="error-display"
        >
          <div className="font-semibold">Render Errors:</div>
          {(renderingState?.renderErrors ?? []).map((error: RenderingError, index: number) => (
            <div
              key={`render-error-${error.type}-${error.message.slice(0, 30)}-${index}`}
              className="text-sm"
            >
              {error.message}
            </div>
          ))}
        </div>
      )}

      {/* Development info display */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-2 rounded text-sm"
          data-testid="development-display"
        >
          <div>Meshes: {renderingState?.meshes?.length ?? 0}</div>
          <div>Errors: {renderingState?.renderErrors?.length ?? 0}</div>
        </div>
      )}
    </div>
  );
};

export default StoreConnectedRenderer;
