/**
 * Main Application Component
 *
 * OpenSCAD 3D Visualization Application with Zustand-centric architecture.
 * Integrates Monaco Editor for code input with Three.js renderer for 3D output.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type React from 'react';
import { useEffect, useState } from 'react';
import type * as THREE from 'three';
import { StoreConnectedRenderer } from './features/3d-renderer/components/store-connected-renderer';
import { StoreConnectedEditor } from './features/code-editor/components/store-connected-editor';
import { type AppStore, useAppStore } from './features/store/app-store';
import type { PerformanceMetrics } from './shared/types/common.types';

/**
 * Main Application Component
 */

export function App(): React.JSX.Element {
  console.log('[INIT][App] Rendering OpenSCAD 3D Visualization Application v2.0.0');

  // Store selectors for application state
  const editorCode: string = useAppStore((state: AppStore) => state.editor.code);
  const ast: ReadonlyArray<ASTNode> = useAppStore((state: AppStore) => state.parsing.ast);
  const applicationStatus: boolean = useAppStore((state: AppStore) => state.rendering.isRendering);
  const renderingStateMeshes: ReadonlyArray<THREE.Mesh> = useAppStore(
    (state: AppStore) => state.rendering.meshes
  );
  const performanceMetrics: PerformanceMetrics = useAppStore(
    (state: AppStore) => state.performance.metrics
  );
  const renderErrors: ReadonlyArray<string> = useAppStore(
    (state: AppStore) => state.rendering.renderErrors
  );
  // Display render errors if any
  useEffect(() => {
    if (renderErrors.length > 0) {
      console.error('[ERROR][App] Render errors detected:', renderErrors);
    }
  }, [renderErrors]);

  // Local state for layout
  const [editorWidth, setEditorWidth] = useState(50); // Percentage
  const [isResizing, setIsResizing] = useState(false);

  /**
   * Initialize application on mount
   */
  useEffect(() => {
    console.log('[INIT][App] Application mounted and ready');
  }, []);

  /**
   * Log application state changes
   */
  useEffect(() => {
    console.log('[DEBUG][App] Application state updated:', {
      status: applicationStatus,
      codeLength: editorCode.length,
      astNodeCount: ast?.length ?? 0,
      isRendering: applicationStatus,
      meshCount: renderingStateMeshes.length,
      renderTime: performanceMetrics.renderTime,
    });
  }, [applicationStatus, editorCode, ast, renderingStateMeshes, performanceMetrics]);

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
          <span>Render: {performanceMetrics.renderTime.toFixed(1)}ms</span>
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
            <StoreConnectedRenderer className="h-full w-full" data-testid="main-renderer" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
