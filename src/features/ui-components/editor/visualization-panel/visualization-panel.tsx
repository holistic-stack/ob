/**
 * Visualization Panel Component
 * 
 * A 3D visualization panel for displaying 3D models with glass morphism effects.
 * Supports different visualization modes, loading states, and view controls.
 */

import React, { forwardRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import {
  clsx,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';
import { BabylonRenderer } from '../../../babylon-renderer/components/babylon-renderer/babylon-renderer';
import type { BabylonSceneConfig } from '../../../babylon-renderer/types/babylon-types';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { ParseError } from '../code-editor/openscad-ast-service';
import { OpenSCADErrorBoundary } from '../../shared/error-boundary/openscad-error-boundary';
import {
  useOpenSCADAst,
  useOpenSCADErrors,
  useOpenSCADStatus
} from '../stores';


// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Visualization mode options
 */
export type VisualizationMode = 'solid' | 'wireframe' | 'points' | 'transparent';

/**
 * 3D model data structure
 */
export interface ModelData {
  readonly vertices: readonly number[];
  readonly faces: readonly number[];
  readonly normals?: readonly number[];
  readonly uvs?: readonly number[];
}

// ViewAction type removed - camera controls now handled by Babylon.js GUI navigation cube

/**
 * Props for the VisualizationPanel component
 *
 * Note: AST data, parse errors, and parsing status are now managed by Zustand store
 */
export interface VisualizationPanelProps extends BaseComponentProps, AriaProps {
  /** 3D model data to visualize (legacy) */
  readonly modelData?: ModelData;

  /** Visualization mode */
  readonly mode?: VisualizationMode;

  /** Whether the panel is in loading state (external loading, not AST parsing) */
  readonly loading?: boolean;

  /** Error message to display (external error, not parse errors) */
  readonly error?: string;

  // showControls removed - camera controls now handled by Babylon.js GUI navigation cube

  /** Width of the visualization panel */
  readonly width?: number | string;

  /** Height of the visualization panel */
  readonly height?: number | string;

  // onViewChange removed - camera controls now handled by Babylon.js GUI navigation cube

  /** Callback when model is clicked */
  readonly onModelClick?: (point: { x: number; y: number; z: number }) => void;

  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;

  /** Whether the panel is over a light background */
  readonly overLight?: boolean;

  /** Custom CSS class name */
  readonly className?: string;

  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// Loading Spinner Component
// ============================================================================

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div
        className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"
        role="status"
        aria-label="Loading"
      />
      <p className="text-white/70 text-sm">Loading 3D model...</p>
    </div>
  </div>
);

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  readonly message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center" role="alert">
      <svg
        className="w-12 h-12 text-red-400 mx-auto mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  </div>
);

// ViewControls component removed - camera controls now handled by professional Babylon.js GUI navigation cube

// ============================================================================
// CAD Viewport Configuration
// ============================================================================

/**
 * Professional CAD viewport configuration with 3D grid and navigation cube
 * Optimized for OpenSCAD visualization with enhanced spatial reference
 */
const CAD_VIEWPORT_CONFIG: BabylonSceneConfig = {
  enableCamera: true,
  enableLighting: true,
  backgroundColor: '#2c3e50',

  // Professional 3D grid system for spatial reference
  cadGrid: {
    enabled: true,
    size: 40,              // Larger grid for OpenSCAD models
    divisions: 40,         // More divisions for finer reference
    majorLineInterval: 5,  // Major lines every 5 units
    minorLineColor: '#e0e0e0',
    majorLineColor: '#808080',
    opacity: 0.4,          // Subtle but visible
    position: [0, 0, 0]    // Centered at origin
  },

  // Interactive navigation cube for view orientation
  cadNavigationCube: {
    enabled: true,
    size: 1.5,             // Slightly larger for better visibility
    position: [0.85, 0.85, 0], // Top-right corner positioning
    faceLabels: {
      front: 'Front',
      back: 'Back',
      left: 'Left',
      right: 'Right',
      top: 'Top',
      bottom: 'Bottom'
    },
    faceColors: {
      front: '#4CAF50',   // Green - Front view
      back: '#F44336',    // Red - Back view
      left: '#2196F3',    // Blue - Left view
      right: '#FF9800',   // Orange - Right view
      top: '#9C27B0',     // Purple - Top view
      bottom: '#607D8B'   // Blue Grey - Bottom view
    }
  }
} as const;

// ============================================================================
// Babylon 3D Renderer Component
// ============================================================================

interface BabylonRendererWrapperProps {
  readonly astData?: readonly ASTNode[];
  readonly mode: VisualizationMode;
  readonly onModelClick?: ((point: { x: number; y: number; z: number }) => void) | undefined;
  readonly onSceneReady?: (scene: BABYLON.Scene | null) => void;
}

const BabylonRendererWrapper: React.FC<BabylonRendererWrapperProps> = ({
  astData,
  mode: _mode,
  onModelClick,
  onSceneReady
}) => {
  console.log('[VisualizationPanel] Initializing CAD viewport with professional features');

  return (
    <div className="w-full h-full">
      <OpenSCADErrorBoundary
        enableRecovery={true}
        showTechnicalDetails={false}
        onError={(error, errorInfo) => {
          console.error('[VisualizationPanel] 3D rendering error:', error, errorInfo);
        }}
        className="w-full h-full"
      >
        <BabylonRenderer
          layout="flex"
          responsive={true}
          showSceneControls={false}
          showMeshDisplay={false}
          showDebugPanel={false}
          sceneConfig={CAD_VIEWPORT_CONFIG}
          astData={astData ?? []}
          onMeshSelect={(mesh) => {
            // Convert Babylon.js mesh selection to 3D point
            if (onModelClick && mesh) {
              const position = mesh.position;
              onModelClick({
                x: position.x,
                y: position.y,
                z: position.z
              });
            }
          }}
          onSceneChange={(scene) => {
            // Pass scene to camera controls
            onSceneReady?.(scene);
          }}
          onASTProcessingStart={() => {
            console.log('[VisualizationPanel] AST processing started');
          }}
          onASTProcessingComplete={(meshes) => {
            console.log('[VisualizationPanel] AST processing completed with', meshes.length, 'meshes');
          }}
          onASTProcessingError={(error) => {
            console.error('[VisualizationPanel] AST processing error:', error);
          }}
          aria-label="3D OpenSCAD Visualization with CAD Viewport"
        />
      </OpenSCADErrorBoundary>
    </div>
  );
};

// ============================================================================
// VisualizationPanel Component
// ============================================================================

/**
 * Visualization Panel component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <VisualizationPanel
 *   modelData={model3D}
 *   mode="solid"
 *   onModelClick={(point) => console.log('Model clicked:', point)}
 * />
 * ```
 */
export const VisualizationPanel = forwardRef<HTMLDivElement, VisualizationPanelProps>(
  (
    {
      modelData,
      mode = 'solid',
      loading = false,
      error,
      // showControls removed - camera controls now handled by Babylon.js GUI navigation cube
      width = 350,
      height = 400,
      // onViewChange removed - camera controls now handled by Babylon.js GUI navigation cube
      onModelClick,
      glassConfig: _glassConfig,
      overLight: _overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    // ========================================================================
    // Zustand Store Hooks
    // ========================================================================

    const astData = useOpenSCADAst();
    const parseErrors = useOpenSCADErrors();
    const { isParsing } = useOpenSCADStatus();

    // View change handler removed - camera controls now handled by professional Babylon.js GUI navigation cube
    // ========================================================================
    // Style Generation
    // ========================================================================

    const panelClasses = generateAccessibleStyles(
      clsx(
        // Base panel styles
        'relative overflow-hidden',

        // Glass morphism effects - only apply if not full screen
        typeof width === 'string' && width === '100%'
          ? 'bg-transparent'
          : 'bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',

        // Gradient pseudo-elements - only for non-fullscreen
        typeof width === 'string' && width === '100%'
          ? ''
          : 'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',

        // Custom className
        className
      )
    );

    // Calculate style object for width and height
    const panelStyle: React.CSSProperties = {
      width: typeof width === 'string' ? width : `${width}px`,
      height: typeof height === 'string' ? height : `${height}px`
    };

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div
        ref={ref}
        className={panelClasses}
        style={panelStyle}
        data-testid={dataTestId}
        data-mode={mode}
        role="region"
        aria-label={ariaLabel || '3D Visualization'}
        {...rest}
      >
        <div className="relative z-10 h-full flex flex-col">
          {/* Header - only show when not full screen */}
          {!(typeof width === 'string' && width === '100%') && (
            <div className="p-3 border-b border-white/20">
              <h3 className="text-white/90 text-sm font-medium">3D Visualization</h3>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 relative">
            {/* Loading states */}
            {(loading || isParsing) && <LoadingSpinner />}

            {/* Error states */}
            {error && <ErrorDisplay message={error} />}
            {parseErrors && parseErrors.length > 0 && !error && (
              <ErrorDisplay message={`Parse errors: ${parseErrors.map((e: ParseError) => e.message).join(', ')}`} />
            )}

            {/* 3D Rendering */}
            {!loading && !isParsing && !error && !parseErrors?.length && astData && astData.length > 0 && (
              <BabylonRendererWrapper
                astData={astData}
                mode={mode}
                onModelClick={onModelClick}
              />
            )}

            {/* Legacy model data support */}
            {!loading && !isParsing && !error && !parseErrors?.length && !astData && modelData && (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-sm">Legacy model data not supported</p>
              </div>
            )}

            {/* No data state */}
            {!loading && !isParsing && !error && !parseErrors?.length && !astData?.length && !modelData && (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-sm">No OpenSCAD code to visualize</p>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }
);

VisualizationPanel.displayName = 'VisualizationPanel';

// ============================================================================
// Default Export
// ============================================================================

export default VisualizationPanel;
