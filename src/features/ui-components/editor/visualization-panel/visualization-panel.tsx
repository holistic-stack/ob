/**
 * Visualization Panel Component
 *
 * A component for rendering 3D visualizations and handling visualization modes.
 * Integrates with R3F renderer and OpenSCAD AST data for real-time visualization.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { clsx } from '../../shared';
import { R3FRenderer } from '../../../r3f-renderer/components/r3f-renderer/r3f-renderer';
import { useOpenSCADAst, useOpenSCADCode, useOpenSCADStatus } from '../stores/openscad-ast-store';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type VisualizationMode = 'preview' | 'wireframe' | 'solid' | 'transparent';

export interface ModelData {
  readonly vertices: readonly number[];
  readonly indices: readonly number[];
  readonly normals?: readonly number[];
  readonly colors?: readonly number[];
}

export interface ViewAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly onClick: () => void;
}

export interface VisualizationPanelProps {
  readonly modelData?: ModelData;
  readonly mode?: VisualizationMode;
  readonly onModeChange?: (mode: VisualizationMode) => void;
  readonly viewActions?: readonly ViewAction[];
  readonly className?: string;
  readonly 'data-testid'?: string;
}

// ============================================================================
// Component
// ============================================================================

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  modelData,
  mode = 'preview',
  onModeChange,
  viewActions = [],
  className,
  'data-testid': dataTestId = 'visualization-panel'
}) => {
  const [currentMode, setCurrentMode] = useState<VisualizationMode>(mode);

  // Connect to OpenSCAD AST store
  const ast = useOpenSCADAst();
  const code = useOpenSCADCode();
  const { isParsing, isASTValid } = useOpenSCADStatus();

  // Track if we have valid data to render
  const hasValidData = isASTValid && ast.length > 0;
  const hasModelData = modelData && modelData.vertices.length > 0;
  const shouldShowR3F = hasValidData || code.trim().length > 0;

  const handleModeChange = useCallback((newMode: VisualizationMode) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  // Handle R3F renderer events
  const handleASTProcessingStart = useCallback(() => {
    console.log('[VisualizationPanel] AST processing started');
  }, []);

  const handleASTProcessingComplete = useCallback(() => {
    console.log('[VisualizationPanel] AST processing completed');
  }, []);

  const handleASTProcessingError = useCallback((error: string) => {
    console.error('[VisualizationPanel] AST processing error:', error);
  }, []);

  return (
    <div 
      className={clsx(
        'visualization-panel',
        'w-full h-full bg-gray-900 relative overflow-hidden',
        className
      )}
      data-testid={dataTestId}
    >
      {/* Mode Controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        {(['preview', 'wireframe', 'solid', 'transparent'] as const).map((modeOption) => (
          <button
            key={modeOption}
            onClick={() => handleModeChange(modeOption)}
            className={clsx(
              'px-3 py-1 text-xs rounded-md transition-colors',
              currentMode === modeOption
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}
          >
            {modeOption}
          </button>
        ))}
      </div>

      {/* View Actions */}
      {viewActions.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          {viewActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="px-3 py-1 text-xs rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              title={action.label}
            >
              {action.icon && <span className="mr-1">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 3D Viewport */}
      <div className="w-full h-full relative">
        {shouldShowR3F ? (
          <R3FRenderer
            {...(ast.length > 0 && { astData: ast[0] })}
            canvasConfig={{
              antialias: true,
              shadows: true
            }}
            sceneConfig={{
              backgroundColor: '#1e293b',
              enableGrid: true,
              enableAxes: true
            }}
            cameraConfig={{
              position: [15, 15, 15],
              fov: 60
            }}
            onASTProcessingStart={handleASTProcessingStart}
            onASTProcessingComplete={handleASTProcessingComplete}
            onASTProcessingError={handleASTProcessingError}
            className="w-full h-full"
            aria-label="3D Model Visualization"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isParsing ? (
              <div className="text-blue-400 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Parsing OpenSCAD...</span>
                </div>
                <div className="text-sm text-gray-400">Processing AST for visualization</div>
              </div>
            ) : hasModelData ? (
              <div className="text-gray-400 text-center">
                <div className="mb-2">3D Model Loaded</div>
                <div className="text-sm">
                  Vertices: {modelData.vertices.length / 3}<br/>
                  Faces: {modelData.indices.length / 3}<br/>
                  Mode: {currentMode}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                <div className="mb-2">No model loaded</div>
                <div className="text-sm">Type OpenSCAD code in the editor to see the 3D visualization</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
