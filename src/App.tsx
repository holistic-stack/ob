/**
 * Main Application Component
 *
 * OpenSCAD 3D Visualization Application with Zustand-centric architecture.
 * Integrates Monaco Editor for code input with Three.js renderer for 3D output.
 */

import type React from 'react';
import { useEffect, useState } from 'react';
import type * as THREE from 'three';
import { StoreConnectedRenderer } from './features/3d-renderer/components/store-connected-renderer';
import type { RenderingError } from './features/3d-renderer/types/renderer.types.js';
import { StoreConnectedEditor } from './features/code-editor/components/store-connected-editor';
import type { ASTNode } from './features/openscad-parser/core/ast-types.js';
import { useAppStore } from './features/store/app-store';
import {
  selectEditorCode,
  selectParsingAST,
  selectParsingLastParsed, // Import the new selector
  selectRenderingErrors,
  selectRenderingIsRendering,
  selectRenderingMeshes,
} from './features/store/selectors';
import { createLogger } from './shared/services/logger.service';

/**
 * Main Application Component
 */

const logger = createLogger('App');

export function App(): React.JSX.Element {
  logger.init('Rendering OpenSCAD 3D Visualization Application v2.0.0');

  // Store selectors for application state
  const editorCode: string = useAppStore(selectEditorCode);
  const ast: ReadonlyArray<ASTNode> = useAppStore(selectParsingAST);
  const lastParsed: Date | null = useAppStore(selectParsingLastParsed); // Get the last parsed date
  const applicationStatus: boolean = useAppStore(selectRenderingIsRendering);
  const renderingStateMeshes: ReadonlyArray<THREE.Mesh> = useAppStore(selectRenderingMeshes);

  const renderErrors: ReadonlyArray<RenderingError> = useAppStore(selectRenderingErrors);
  // Display render errors if any
  useEffect(() => {
    if (renderErrors.length > 0) {
      logger.error(
        'Render errors detected:',
        renderErrors.map((e) => e.message)
      );
    }
  }, [renderErrors]);

  // Local state for layout
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  /**
   * Initialize application on mount
   */
  useEffect(() => {
    logger.init('Application mounted and ready');
  }, []);

  /**
   * Log application state changes
   */
  useEffect(() => {
    logger.debug('Application state updated:', {
      status: applicationStatus,
      codeLength: editorCode.length,
      astNodeCount: ast?.length ?? 0,
      isRendering: applicationStatus,
      meshCount: renderingStateMeshes.length,
    });
  }, [applicationStatus, editorCode, ast, renderingStateMeshes]);

  /**
   * Handle panel resize
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      const newWidth = Math.max(20, Math.min(80, (e.clientX / containerWidth) * 100));
      setEditorWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="app-container h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Application Header */}
      <header className="app-header bg-gray-800 border-b border-gray-700 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-white">OpenSCAD 3D Visualizer</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span
              className={`w-2 h-2 rounded-full ${
                applicationStatus ? 'bg-yellow-400' : 'bg-green-400'
              }`}
            />
            <span className="capitalize">{applicationStatus ? 'rendering' : 'idle'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>AST: {ast?.length ?? 0} nodes</span>
          <span>Meshes: {renderingStateMeshes.length}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main flex h-[calc(100vh-64px)]">
        {/* Editor Panel */}
        <div
          className="editor-panel bg-gray-900 border-r border-gray-700 flex flex-col"
          style={{ width: `${editorWidth}%` }}
        >
          <div className="panel-header bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-sm font-medium text-gray-300">OpenSCAD Code Editor</h2>
          </div>
          <div className="panel-content flex-1">
            <StoreConnectedEditor className="h-full" data-testid="main-editor" />
          </div>
        </div>

        {/* Resize Handle */}
        <button
          type="button"
          aria-label="Resize panels"
          className={`resize-handle w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isResizing ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              setEditorWidth(Math.max(20, editorWidth - 5));
            } else if (e.key === 'ArrowRight') {
              setEditorWidth(Math.min(80, editorWidth + 5));
            }
          }}
          data-testid="resize-handle"
        />

        {/* 3D Renderer Panel */}
        <div
          className="renderer-panel bg-gray-900 flex flex-col"
          style={{ width: `${100 - editorWidth}%` }}
        >
          <div className="panel-header bg-gray-800 px-4 py-2 border-b border-gray-700">
            <h2 className="text-sm font-medium text-gray-300">3D Visualization</h2>
          </div>
          <div className="panel-content flex-1 relative">
            <StoreConnectedRenderer
              key={lastParsed instanceof Date ? lastParsed.getTime() : 'initial'} // Add the key prop here
              className="h-full w-full"
              data-testid="main-renderer"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
