/**
 * @file Grid Layout Component
 * 
 * TDD-driven 12-column grid layout component following SRP principles.
 * Implements Tailwind CSS grid with Monaco editor (5 cols) and Three.js viewer (7 cols).
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React from 'react';
import { MonacoCodeEditor } from '../../editor/code-editor';
import { VisualizationPanel } from '../../editor/visualization-panel/visualization-panel';
import type { GridLayoutProps } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

// GridLayoutProps is imported from '../types'

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * GridLayout Component
 * 
 * Implements a 12-column grid layout using Tailwind CSS with:
 * - Monaco editor in 5 columns (left side)
 * - Three.js viewer in 7 columns (right side)
 * 
 * Follows SRP by only handling grid layout structure without business logic.
 * 
 * @param props - Component props
 * @returns JSX element containing the 12-column grid layout
 * 
 * @example
 * ```tsx
 * <GridLayout />
 * ```
 */
export const GridLayout: React.FC<GridLayoutProps> = ({
  className = '',
  'data-testid': dataTestId = 'grid-layout-container',
  'aria-label': ariaLabel = '12-Column Grid Layout'
}) => {
  console.log('[INIT] Rendering GridLayout component');

  return (
    <div
      data-testid={dataTestId}
      role="main"
      aria-label={ariaLabel}
      className={`
        grid 
        grid-cols-12 
        gap-0 
        w-full 
        h-full
        ${className}
      `.trim()}
    >
      {/* Monaco Editor Section - 5 columns */}
      <div
        data-testid="monaco-editor-section"
        className="col-span-5 h-full"
      >
        <MonacoCodeEditor
          data-testid="monaco-code-editor"
          value="// Welcome to OpenSCAD!\n// Start coding your 3D models here\n\ncube([10, 10, 10]);"
          language="openscad"
          theme="dark"
          height="100%"
          width="100%"
          enableASTParsing={true}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Three.js Viewer Section - 7 columns */}
      <div
        data-testid="threejs-viewer-section"
        className="col-span-7 h-full"
      >
        <VisualizationPanel
          data-testid="visualization-panel"
          mode="solid"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default GridLayout;
