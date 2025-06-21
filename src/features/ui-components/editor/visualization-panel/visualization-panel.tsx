/**
 * Visualization Panel Component
 * 
 * A 3D visualization panel for displaying 3D models with glass morphism effects.
 * Supports different visualization modes, loading states, and view controls.
 */

import React, { forwardRef } from 'react';
import {
  clsx,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';
import { BabylonRenderer } from '../../../babylon-renderer/components/babylon-renderer/babylon-renderer';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { ParseError } from '../code-editor/openscad-ast-service';
import { OpenSCADErrorBoundary } from '../../shared/error-boundary/openscad-error-boundary';

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

/**
 * View control actions
 */
export type ViewAction = 'reset' | 'zoom-in' | 'zoom-out' | 'rotate-left' | 'rotate-right';

/**
 * Props for the VisualizationPanel component
 */
export interface VisualizationPanelProps extends BaseComponentProps, AriaProps {
  /** 3D model data to visualize (legacy) */
  readonly modelData?: ModelData;

  /** AST data from OpenSCAD parsing */
  readonly astData?: readonly ASTNode[];

  /** Parse errors from OpenSCAD parsing */
  readonly parseErrors?: readonly ParseError[];

  /** Whether AST parsing is in progress */
  readonly isParsing?: boolean;

  /** Visualization mode */
  readonly mode?: VisualizationMode;

  /** Whether the panel is in loading state */
  readonly loading?: boolean;

  /** Error message to display */
  readonly error?: string;

  /** Whether to show view controls */
  readonly showControls?: boolean;

  /** Width of the visualization panel */
  readonly width?: number | string;

  /** Height of the visualization panel */
  readonly height?: number | string;

  /** Callback when view changes */
  readonly onViewChange?: (action: ViewAction) => void;

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

// ============================================================================
// View Controls Component
// ============================================================================

interface ViewControlsProps {
  readonly onViewChange: (action: ViewAction) => void;
}

const ViewControls: React.FC<ViewControlsProps> = ({ onViewChange }) => (
  <div className="absolute top-2 right-2 flex gap-1 z-20">
    <button
      className="p-1 bg-black/40 hover:bg-black/60 rounded text-white/80 hover:text-white transition-colors"
      onClick={() => onViewChange('reset')}
      aria-label="Reset view"
      title="Reset view"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
    <button
      className="p-1 bg-black/40 hover:bg-black/60 rounded text-white/80 hover:text-white transition-colors"
      onClick={() => onViewChange('zoom-in')}
      aria-label="Zoom in"
      title="Zoom in"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    </button>
    <button
      className="p-1 bg-black/40 hover:bg-black/60 rounded text-white/80 hover:text-white transition-colors"
      onClick={() => onViewChange('zoom-out')}
      aria-label="Zoom out"
      title="Zoom out"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
      </svg>
    </button>
  </div>
);

// ============================================================================
// Babylon 3D Renderer Component
// ============================================================================

interface BabylonRendererWrapperProps {
  readonly astData?: readonly ASTNode[];
  readonly mode: VisualizationMode;
  readonly onModelClick?: ((point: { x: number; y: number; z: number }) => void) | undefined;
}

const BabylonRendererWrapper: React.FC<BabylonRendererWrapperProps> = ({
  astData,
  mode,
  onModelClick
}) => {
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
          onASTProcessingStart={() => {
            console.log('[VisualizationPanel] AST processing started');
          }}
          onASTProcessingComplete={(meshes) => {
            console.log('[VisualizationPanel] AST processing completed with', meshes.length, 'meshes');
          }}
          onASTProcessingError={(error) => {
            console.error('[VisualizationPanel] AST processing error:', error);
          }}
          aria-label="3D OpenSCAD Visualization"
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
 *   showControls
 *   onViewChange={(action) => console.log('View changed:', action)}
 * />
 * ```
 */
export const VisualizationPanel = forwardRef<HTMLDivElement, VisualizationPanelProps>(
  (
    {
      modelData,
      astData,
      parseErrors,
      isParsing = false,
      mode = 'solid',
      loading = false,
      error,
      showControls = true,
      width = 350,
      height = 400,
      onViewChange,
      onModelClick,
      glassConfig,
      overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
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
              <ErrorDisplay message={`Parse errors: ${parseErrors.map(e => e.message).join(', ')}`} />
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

            {/* View Controls */}
            {showControls && onViewChange && (
              <ViewControls onViewChange={onViewChange} />
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
