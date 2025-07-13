/**
 * @file Store 3D Renderer Bridge
 *
 * A bridge component that connects the Zustand store to the 3D rendering layer.
 * This component handles the conversion from AST to generic mesh data and passes
 * it to the rendering layer, maintaining proper architectural separation.
 *
 * Architecture Flow: Store State → Bridge Component → Layer 3 (Rendering)
 *
 * This component follows the refined architecture by:
 * - Using the conversion service to transform AST to generic mesh data
 * - Passing only generic data to the rendering layer
 * - Maintaining proper separation of concerns
 *
 * @example
 * ```tsx
 * <Store3DRendererBridge
 *   className="h-full w-full"
 *   data-testid="main-renderer"
 * />
 * ```
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { createLogger } from '../../../../shared/services/logger.service';
import { useAppStore } from '../../../store/app-store';
import { useASTConverter } from '../../../ast-to-csg-converter/hooks/use-ast-converter/use-ast-converter';
import type { GenericMeshData } from '../../../ast-to-csg-converter/types/conversion.types';
import { MeshDataScene } from '../mesh-data-scene/mesh-data-scene';
import type { CameraConfig } from '../../../../shared/types/common.types';

const logger = createLogger('Store3DRendererBridge');

/**
 * Props for the Store3DRendererBridge component
 *
 * @interface Store3DRendererBridgeProps
 */
export interface Store3DRendererBridgeProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly enableDebug?: boolean;
  readonly enableShadows?: boolean;
  readonly lightIntensity?: number;
}

/**
 * Store Connected Generic Renderer Component
 * 
 * This component bridges the Zustand store with the new generic rendering architecture.
 * It automatically converts AST nodes to generic mesh data and renders them using
 * the generic scene component.
 */
export const Store3DRendererBridge: React.FC<Store3DRendererBridgeProps> = ({
  className = '',
  'data-testid': testId = 'store-3d-renderer-bridge',
  enableDebug = false,
  enableShadows = true,
  lightIntensity = 100,
}) => {
  const [genericMeshes, setGenericMeshes] = useState<ReadonlyArray<GenericMeshData>>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Get AST and camera from store
  const ast = useAppStore((state) => state.parsing.ast);
  const camera = useAppStore((state) => state.rendering?.camera || {
    position: [5, 5, 5] as const,
    target: [0, 0, 0] as const,
    zoom: 1,
    fov: 75,
    near: 0.1,
    far: 1000,
    enableControls: true,
    enableAutoRotate: false,
    autoRotateSpeed: 1,
  });
  const addRenderError = useAppStore((state) => state.addRenderError);

  // Use the conversion hook
  const { state: converterState, convert } = useASTConverter(true);

  /**
   * Convert AST to generic mesh data when AST changes
   */
  const convertASTToMeshes = useCallback(async () => {
    if (!ast || ast.length === 0) {
      setGenericMeshes([]);
      setConversionError(null);
      return;
    }

    if (!converterState.isInitialized) {
      logger.warn('[CONVERT] Converter not initialized yet, skipping conversion');
      return;
    }

    setIsConverting(true);
    setConversionError(null);

    try {
      logger.debug(`[CONVERT] Converting ${ast.length} AST nodes to generic meshes`);

      const conversionResult = await convert(ast, {
        optimizeResult: true,
        preserveMaterials: false,
        enableCaching: true,
      });

      if (conversionResult.success) {
        setGenericMeshes(conversionResult.data.meshes);
        setConversionError(null);
        
        logger.debug(`[CONVERT] Successfully converted to ${conversionResult.data.meshes.length} generic meshes`);
      } else {
        setConversionError(conversionResult.error);
        addRenderError({
          type: 'geometry',
          message: `Conversion failed: ${conversionResult.error}`,
        });
        
        logger.error('[ERROR] AST to mesh conversion failed:', conversionResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setConversionError(errorMessage);
      addRenderError({
        type: 'geometry',
        message: `Conversion error: ${errorMessage}`,
      });
      
      logger.error('[ERROR] Exception during AST conversion:', errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, [ast, converterState.isInitialized, convert, addRenderError]);

  /**
   * Convert AST when it changes
   */
  useEffect(() => {
    convertASTToMeshes();
  }, [convertASTToMeshes]);

  /**
   * Handle camera changes
   */
  const handleCameraChange = useCallback((newCamera: CameraConfig) => {
    // Could update store camera here if needed
    logger.debug('[CAMERA] Camera changed:', newCamera);
  }, []);

  /**
   * Handle render completion
   */
  const handleRenderComplete = useCallback((meshes: ReadonlyArray<any>) => {
    logger.debug(`[RENDER] Render completed with ${meshes.length} meshes`);
  }, []);

  /**
   * Handle render errors
   */
  const handleRenderError = useCallback((error: { message: string }) => {
    logger.error('[ERROR] Render error:', error.message);
    addRenderError({
      type: 'geometry',
      message: error.message,
    });
  }, [addRenderError]);

  return (
    <div className={`store-connected-generic-renderer ${className}`} data-testid={testId}>
      {/* Show conversion status in debug mode */}
      {enableDebug && (
        <div className="debug-info" style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px', fontSize: '12px' }}>
          <div>Converter: {converterState.isInitialized ? 'Ready' : 'Initializing...'}</div>
          <div>Converting: {isConverting ? 'Yes' : 'No'}</div>
          <div>AST Nodes: {ast?.length || 0}</div>
          <div>Generic Meshes: {genericMeshes.length}</div>
          {conversionError && <div style={{ color: 'red' }}>Error: {conversionError}</div>}
        </div>
      )}

      {/* React Three Fiber Canvas */}
      <Canvas
        camera={{
          position: camera.position,
          fov: camera.fov,
          near: camera.near,
          far: camera.far,
        }}
        shadows={enableShadows}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Mesh Data Scene Component (Layer 3: Generic Rendering) */}
        <MeshDataScene
          meshes={genericMeshes}
          camera={camera}
          onCameraChange={handleCameraChange}
          onRenderComplete={handleRenderComplete}
          onRenderError={handleRenderError}
          debugWireframe={enableDebug}
          enableShadows={enableShadows}
          lightIntensity={lightIntensity}
        />
      </Canvas>

      {/* Error Display */}
      {conversionError && !enableDebug && (
        <div 
          style={{ 
            position: 'absolute', 
            bottom: 10, 
            left: 10, 
            right: 10, 
            background: 'rgba(255, 0, 0, 0.8)', 
            color: 'white', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          Conversion Error: {conversionError}
        </div>
      )}

      {/* Loading Indicator */}
      {isConverting && (
        <div 
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            background: 'rgba(0, 0, 0, 0.7)', 
            color: 'white', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '16px'
          }}
        >
          Converting AST to meshes...
        </div>
      )}
    </div>
  );
};
