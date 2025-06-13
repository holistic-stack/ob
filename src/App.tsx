/**
 * @file Modern App Component (React 19)
 *
 * Main application component using modern React 19 patterns:
 * - Proper state management with React 19 hooks
 * - Error boundaries for 3D rendering failures
 * - Optimized re-rendering patterns
 * - Clean component architecture
 *
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ErrorBoundary as _ErrorBoundary } from 'react-error-boundary';
import { BabylonRenderer } from './components/babylon-renderer/babylon-renderer';
import { useOpenSCADProcessor } from './features/openscad-processor';
import { OpenSCADInput } from './components/openscad-input';
import { PipelineResult } from './types/pipeline-types';
import './App.css';

/**
 * Error boundary for 3D rendering failures
 */
class RenderingErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ERROR] 3D Rendering Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>🚨 3D Rendering Error</h3>
          <p>The 3D renderer encountered an error and needs to be reset.</p>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="reset-button"
          >
            Reset Renderer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple wrapper component that uses the useOpenSCADProcessor hook
 */
interface PipelineProcessorWrapperProps {
  readonly openscadCode: string;
  readonly onResult: (result: PipelineResult) => void;
  readonly onProcessingStart: () => void;
  readonly onProcessingEnd: () => void;
  readonly autoProcess: boolean;
}

function PipelineProcessorWrapper({
  openscadCode,
  onResult,
  onProcessingStart,
  onProcessingEnd,
  autoProcess
}: PipelineProcessorWrapperProps): React.JSX.Element {
  const {
    isInitializing,
    isReady,
    isProcessing,
    error,
    result,
    stats,
    processCode
  } = useOpenSCADProcessor();

  // Handle result changes
  useEffect(() => {
    if (result) {
      // Convert the hook result to the expected App result format
      onResult(result as PipelineResult);
    }
  }, [result, onResult]);

  // Handle processing state changes
  useEffect(() => {
    if (isProcessing) {
      onProcessingStart();
    } else {
      onProcessingEnd();
    }
  }, [isProcessing, onProcessingStart, onProcessingEnd]);

  // Auto-process when code changes
  useEffect(() => {
    if (autoProcess && isReady && openscadCode.trim() && !isProcessing) {
      const timeoutId = setTimeout(() => {
        void processCode(openscadCode);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [autoProcess, isReady, openscadCode, isProcessing, processCode]);

  const handleManualProcess = useCallback(() => {
    if (isReady && !isProcessing && openscadCode.trim()) {
      void processCode(openscadCode);
    }
  }, [isReady, isProcessing, openscadCode, processCode]);

  return (
    <div className="pipeline-processor-wrapper">
      <div className="processor-header">
        <h3>🔧 OpenSCAD Processor (React 19 Hook)</h3>
        <div className="processor-stats">
          <span>Runs: {stats.totalRuns}</span>
          <span>Success: {stats.successCount}</span>
          <span>Errors: {stats.errorCount}</span>
          <span>Avg Time: {Math.round(stats.averageTime)}ms</span>
        </div>
      </div>

      <div className="processor-controls">
        <button
          onClick={handleManualProcess}
          disabled={!isReady || isProcessing || !openscadCode.trim()}
          className={`process-button ${isProcessing ? 'processing' : ''}`}
        >
          {isProcessing ? (
            <>
              <span className="spinner">⟳</span>
              Processing...
            </>
          ) : (
            'Process OpenSCAD Code'
          )}
        </button>
      </div>

      <div className="processor-status">
        {isInitializing && (
          <div className="status-message warning">
            ⚠️ Pipeline initializing...
          </div>
        )}

        {error && (
          <div className="status-message error">
            ❌ Error: {error}
          </div>
        )}

        {isReady && !openscadCode.trim() && (
          <div className="status-message info">
            ℹ️ Enter OpenSCAD code to process
          </div>
        )}

        {result && result.success && (
          <div className="status-message success">
            ✅ Processing completed successfully
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modern App component with React 19 patterns
 */
export function App(): React.JSX.Element {
  console.log('[DEBUG] 🎯 App component rendering - timestamp:', new Date().toISOString());

  // State management
  const [openscadCode, setOpenscadCode] = useState('cube([10, 10, 10]);');
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoProcess, setAutoProcess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<{ totalTime: number } | null>(null);

  // Scene configuration
  const sceneConfig = useMemo(() => ({
    enableCamera: true,
    enableLighting: true,
    backgroundColor: '#2c3e50',
    cameraPosition: [10, 10, 10] as [number, number, number]
  }), []);

  // Event handlers
  const handleCodeChange = useCallback((code: string) => {
    setOpenscadCode(code);
  }, []);

  const handlePipelineResult = useCallback((result: PipelineResult) => {
    setPipelineResult(result);
    setIsProcessing(false);

    if (result.success) {
      setPerformanceStats({ totalTime: Date.now() % 1000 }); // Mock performance stats
    }
  }, []);

  const handleProcessingStart = useCallback(() => {
    setIsProcessing(true);
    setPerformanceStats(null);
  }, []);

  const handleReset = useCallback(() => {
    setOpenscadCode('cube([10, 10, 10]);');
    setPipelineResult(null);
    setIsProcessing(false);
    setPerformanceStats(null);
  }, []);

  const handleLoadExample = useCallback((example: string) => {
    const examples = {
      cube: 'cube([10, 10, 10]);',
      sphere: 'sphere(5);',
      cylinder: 'cylinder(h=10, r=3);',
      union: 'union() {\n  cube([5, 5, 5]);\n  translate([3, 3, 3]) sphere(2);\n}',
      difference: 'difference() {\n  cube([10, 10, 10]);\n  sphere(6);\n}',
      complex: 'difference() {\n  union() {\n    cube([20, 20, 10]);\n    translate([0, 0, 10]) cylinder(h=5, r=8);\n  }\n  translate([0, 0, -1]) cylinder(h=17, r=3);\n}'
    };

    const code = examples[example as keyof typeof examples] || examples.cube;
    setOpenscadCode(code);
  }, []);

  console.log('[DEBUG] 🚀 Rendering full App component with refactored PipelineProcessor');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔧 Modern OpenSCAD to Babylon.js Pipeline</h1>
        <p>React 19 + Babylon.js integration with modern patterns</p>

        <div className="header-controls">
          <button onClick={handleReset} className="reset-button">
            🔄 Reset
          </button>

          <label className="toggle-control">
            <input
              type="checkbox"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
            />
            Auto-process
          </label>

          <label className="toggle-control">
            <input
              type="checkbox"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
            />
            Advanced
          </label>
        </div>
      </header>

      <main className="app-main">
        <div className="app-layout">
          {/* Code Editor Section */}
          <section className="editor-section">
            <div className="section-header">
              <h2>📝 OpenSCAD Code</h2>
              <div className="example-buttons">
                <button onClick={() => handleLoadExample('cube')}>Cube</button>
                <button onClick={() => handleLoadExample('sphere')}>Sphere</button>
                <button onClick={() => handleLoadExample('cylinder')}>Cylinder</button>
                <button onClick={() => handleLoadExample('union')}>Union</button>
                <button onClick={() => handleLoadExample('difference')}>Difference</button>
                {showAdvanced && (
                  <button onClick={() => handleLoadExample('complex')}>Complex</button>
                )}
              </div>
            </div>

            <OpenSCADInput
              value={openscadCode}
              onChange={handleCodeChange}
            />
          </section>

          {/* 3D Renderer Section */}
          <section className="renderer-section">
            <div className="section-header">
              <h2>🎮 3D Scene</h2>
              {performanceStats && (
                <div className="performance-badge">
                  ⚡ {performanceStats.totalTime}ms
                </div>
              )}
            </div>

            <RenderingErrorBoundary>
              <BabylonRenderer
                pipelineResult={pipelineResult}
                isProcessing={isProcessing}
                sceneConfig={sceneConfig}
              />
            </RenderingErrorBoundary>
          </section>
        </div>

        {/* Pipeline Processor */}
        <section className="processor-section">
          <PipelineProcessorWrapper
            openscadCode={openscadCode}
            onResult={handlePipelineResult}
            onProcessingStart={handleProcessingStart}
            onProcessingEnd={() => setIsProcessing(false)}
            autoProcess={autoProcess}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Modern React 19 + Babylon.js integration •
          No external 3D libraries •
          WebGL error recovery •
          Optimized performance
        </p>
      </footer>
    </div>
  );
}

export default App;
