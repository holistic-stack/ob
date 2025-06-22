import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  MonacoCodeEditor,
  VisualizationPanel,
  type VisualizationMode
} from './features/ui-components/editor';
import { OpenSCADErrorBoundary } from './features/ui-components/shared/error-boundary/openscad-error-boundary';
import { PerformanceDebugPanel } from './features/ui-components/shared/performance/performance-debug-panel';
import {
  useOpenSCADActions
} from './features/ui-components/editor/stores';
import type { ASTNode } from '@holistic-stack/openscad-parser';

// Types for parse errors
interface ParseError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly severity: 'error' | 'warning';
}

// Default OpenSCAD code example - showcasing multiple primitives in a well-framed scene
const defaultCode = `// OpenSCAD Primitives Showcase
// Demonstrates various 3D shapes positioned for optimal camera framing

// Basic cube at origin
cube([8, 8, 8]);

// Sphere positioned to the right
translate([15, 0, 0])
  sphere(4);

// Cylinder positioned above
translate([0, 12, 0])
  cylinder(h = 8, r = 3);

// Cone (using cylinder with different radii)
translate([15, 12, 0])
  cylinder(h = 10, r1 = 4, r2 = 1);

// Torus-like shape using difference
translate([-12, 0, 4])
  difference() {
    sphere(5);
    sphere(3);
  }

// Rounded cube using hull and spheres
translate([-12, 12, 0])
  hull() {
    translate([0, 0, 0]) sphere(2);
    translate([6, 0, 0]) sphere(2);
    translate([6, 6, 0]) sphere(2);
    translate([0, 6, 0]) sphere(2);
    translate([0, 0, 6]) sphere(2);
    translate([6, 0, 6]) sphere(2);
    translate([6, 6, 6]) sphere(2);
    translate([0, 6, 6]) sphere(2);
  }

// Use "Fit to View" button to frame all objects perfectly!`;

/**
 * Modern App component with OpenSCAD Editor using Zustand store
 */
export function App(): React.JSX.Element {
  const [code, setCode] = useState(defaultCode);
  const [visualizationMode] = useState<VisualizationMode>('solid');
  const [isEditorExpanded, setIsEditorExpanded] = useState(true);

  // Zustand store hooks
  const { updateCode } = useOpenSCADActions();

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    // Update Zustand store with new code (this will trigger AST parsing)
    updateCode(newCode);
  }, [updateCode]);

  // These callbacks are maintained for backward compatibility with MonacoCodeEditor
  const handleASTChange = useCallback((newAst: ASTNode[]) => {
    // AST changes are now handled by Zustand store
    console.log('[App] AST updated via Zustand store:', newAst.length, 'nodes');
  }, []);

  const handleParseErrors = useCallback((errors: ParseError[]) => {
    // Parse errors are now handled by Zustand store
    console.log('[App] Parse errors updated via Zustand store:', errors.length, 'errors');
  }, []);

  const handleViewChange = useCallback((_action: string) => {
    // Handle 3D view changes
  }, []);

  const handleModelClick = useCallback((_point: { x: number; y: number; z: number }) => {
    // Handle model click events
  }, []);

  const toggleEditor = useCallback(() => {
    setIsEditorExpanded(prev => !prev);
  }, []);

  // Keyboard shortcut for toggling editor (Ctrl/Cmd + E)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        toggleEditor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleEditor]);

  // Memoize Monaco editor options to prevent unnecessary re-renders
  const monacoOptions = useMemo(() => ({
    fontSize: 14,
    lineNumbers: 'on' as const,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    automaticLayout: true,
    folding: true,
    glyphMargin: true,
    lineDecorationsWidth: 20,
    lineNumbersMinChars: 3,
    tabSize: 2,
    insertSpaces: true
  }), []);

  // Initialize Zustand store with default code on mount
  useEffect(() => {
    updateCode(defaultCode);
  }, [updateCode]);

  return (
    <div className="h-screen w-screen overflow-hidden relative">
      <OpenSCADErrorBoundary
        enableRecovery={true}
        showTechnicalDetails={true}
        onError={(error, errorInfo) => {
          console.error('[App] Error caught by boundary:', error, errorInfo);
        }}
        className="h-full w-full"
      >
        {/* Full-screen 3D Visualization Panel (Background) */}
        <div className={`absolute inset-0 z-0 transition-all duration-300 ${
          isEditorExpanded ? 'brightness-75' : 'brightness-100'
        }`}>
          <VisualizationPanel
            mode={visualizationMode}
            width="100%"
            height="100%"
            showControls
            onViewChange={handleViewChange}
            onModelClick={handleModelClick}
            aria-label="3D Model Visualization"
          />
        </div>

        {/* Monaco Code Editor Drawer (Overlay) */}
        <div
          className={`absolute top-0 left-0 z-10 h-full transition-all duration-300 ease-in-out ${
            isEditorExpanded ? 'translate-x-0' : '-translate-x-full'
          } ${
            isEditorExpanded ? 'w-full md:w-3/4 lg:w-1/2' : 'w-0'
          }`}
        >
          <div className="h-full w-full relative">
            <MonacoCodeEditor
              value={code}
              onChange={handleCodeChange}
              language="openscad"
              theme="dark"
              height="100%"
              width="100%"
              enableASTParsing
              onASTChange={handleASTChange}
              onParseErrors={handleParseErrors}
              options={monacoOptions}
            />
          </div>
        </div>

        {/* Drawer Toggle Button */}
        <button
          onClick={toggleEditor}
          className={`fixed top-4 z-20 transition-all duration-300 ease-in-out ${
            isEditorExpanded
              ? 'left-[calc(100%-3rem)] md:left-[calc(75%-3rem)] lg:left-[calc(50%-3rem)]'
              : 'left-4'
          }`}
          aria-label={isEditorExpanded ? 'Collapse Code Editor (Ctrl+E)' : 'Expand Code Editor (Ctrl+E)'}
          title={isEditorExpanded ? 'Collapse Code Editor (Ctrl+E)' : 'Expand Code Editor (Ctrl+E)'}
        >
          <div className="bg-black/80 backdrop-blur-sm border border-white/30 rounded-lg p-3 hover:bg-black/90 transition-colors">
            <div className="w-6 h-6 text-white flex items-center justify-center">
              {isEditorExpanded ? (
                // Collapse icon (chevron left)
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              ) : (
                // Expand icon (code)
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polyline points="16,18 22,12 16,6" />
                  <polyline points="8,6 2,12 8,18" />
                </svg>
              )}
            </div>
          </div>
        </button>

        {/* Performance Debug Panel (development only) */}
        {/* <PerformanceDebugPanel
          enabled={process.env.NODE_ENV === 'development'}
          position="top-right"
          maxMetrics={15}
        /> */}
      </OpenSCADErrorBoundary>
    </div>
  );
}

export default App;
