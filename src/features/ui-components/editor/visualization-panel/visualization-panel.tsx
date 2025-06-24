/**
 * Visualization Panel Component
 * 
 * A component for rendering 3D visualizations and handling visualization modes.
 */

import React, { useState, useCallback } from 'react';
import { clsx } from '../../shared';

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

  const handleModeChange = useCallback((newMode: VisualizationMode) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

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
      <div className="w-full h-full flex items-center justify-center">
        {modelData ? (
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
            <div className="text-sm">Load an OpenSCAD file to see the 3D visualization</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
