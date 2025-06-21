/**
 * Visualization Panel Component
 * 
 * A 3D visualization panel for displaying 3D models with glass morphism effects.
 * Supports different visualization modes, loading states, and view controls.
 */

import React, { forwardRef, useRef, useEffect } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

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
  /** 3D model data to visualize */
  readonly modelData?: ModelData;
  
  /** Visualization mode */
  readonly mode?: VisualizationMode;
  
  /** Whether the panel is in loading state */
  readonly loading?: boolean;
  
  /** Error message to display */
  readonly error?: string;
  
  /** Whether to show view controls */
  readonly showControls?: boolean;
  
  /** Width of the visualization panel */
  readonly width?: number;
  
  /** Height of the visualization panel */
  readonly height?: number;
  
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
// 3D Canvas Component
// ============================================================================

interface CanvasProps {
  readonly modelData: ModelData;
  readonly mode: VisualizationMode;
  readonly onModelClick?: (point: { x: number; y: number; z: number }) => void;
}

const Canvas3D: React.FC<CanvasProps> = ({ modelData, mode, onModelClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // This would integrate with a 3D rendering library like Three.js or Babylon.js
    // For now, we'll show a placeholder
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder 3D object (cube wireframe)
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 80;
    
    // Draw cube wireframe
    ctx.beginPath();
    ctx.rect(centerX - size/2, centerY - size/2, size, size);
    ctx.rect(centerX - size/2 + 20, centerY - size/2 + 20, size, size);
    
    // Connect corners
    ctx.moveTo(centerX - size/2, centerY - size/2);
    ctx.lineTo(centerX - size/2 + 20, centerY - size/2 + 20);
    ctx.moveTo(centerX + size/2, centerY - size/2);
    ctx.lineTo(centerX + size/2 + 20, centerY - size/2 + 20);
    ctx.moveTo(centerX - size/2, centerY + size/2);
    ctx.lineTo(centerX - size/2 + 20, centerY + size/2 + 20);
    ctx.moveTo(centerX + size/2, centerY + size/2);
    ctx.lineTo(centerX + size/2 + 20, centerY + size/2 + 20);
    
    ctx.stroke();
  }, [modelData, mode]);
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onModelClick) return;
    
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to 3D coordinates (simplified)
    onModelClick({ x, y, z: 0 });
  };
  
  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className="w-full h-full cursor-pointer"
      onClick={handleCanvasClick}
      role="img"
      aria-label="3D visualization canvas"
    />
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
    
    const glassClasses = generateGlassClasses(glassConfig || {}, overLight);
    
    const panelClasses = generateAccessibleStyles(
      clsx(
        // Base panel styles
        'relative overflow-hidden',
        
        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',
        
        // Gradient pseudo-elements
        'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',
        
        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div
        ref={ref}
        className={panelClasses}
        style={{ width: `${width}px`, height: `${height}px` }}
        data-testid={dataTestId}
        data-mode={mode}
        role="region"
        aria-label={ariaLabel || '3D Visualization'}
        {...rest}
      >
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-white/20">
            <h3 className="text-white/90 text-sm font-medium">3D Visualization</h3>
          </div>
          
          {/* Content */}
          <div className="flex-1 relative">
            {loading && <LoadingSpinner />}
            {error && <ErrorDisplay message={error} />}
            {!loading && !error && modelData && (
              <Canvas3D 
                modelData={modelData} 
                mode={mode} 
                onModelClick={onModelClick}
              />
            )}
            {!loading && !error && !modelData && (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-sm">No model to display</p>
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
