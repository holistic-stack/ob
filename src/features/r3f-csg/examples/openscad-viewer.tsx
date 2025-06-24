/**
 * @file OpenSCAD Viewer Example
 * 
 * Example React component demonstrating the R3F CSG converter usage.
 * Shows how to create an interactive OpenSCAD viewer with real-time conversion
 * to React Three Fiber components.
 * 
 * Features:
 * - Real-time OpenSCAD code editing
 * - Live 3D preview with React Three Fiber
 * - Progress tracking and error handling
 * - Performance metrics display
 * - Glass morphism UI design
 * - Responsive layout with 8px grid system
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useR3FCSGConverter, useOpenSCADToR3F, type UseR3FCSGConverterConfig } from '../hooks/use-r3f-csg-converter';

// ============================================================================
// Glass Morphism Styles (8px Grid System)
// ============================================================================

const glassStyles = {
  container: `
    min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900
    p-8 font-sans
  `,
  
  header: `
    mb-8 text-center
  `,
  
  title: `
    text-4xl font-bold text-white mb-4
    bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent
  `,
  
  subtitle: `
    text-lg text-slate-300 max-w-2xl mx-auto
  `,
  
  mainLayout: `
    grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto
  `,
  
  panel: `
    bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg
    shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]
    relative overflow-hidden
    before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none
    after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none
  `,
  
  panelContent: `
    relative z-10 p-6
  `,
  
  panelTitle: `
    text-xl font-semibold text-white mb-4 flex items-center gap-3
  `,
  
  codeEditor: `
    w-full h-96 bg-slate-900/50 border border-slate-600/50 rounded-lg
    p-4 text-sm font-mono text-slate-100 resize-none
    focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50
    placeholder-slate-400
  `,
  
  viewer3D: `
    w-full h-96 bg-slate-900/30 border border-slate-600/50 rounded-lg
    overflow-hidden relative
  `,
  
  progressBar: `
    w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-4
  `,
  
  progressFill: `
    h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300
  `,
  
  statusPanel: `
    mt-6 p-4 bg-slate-800/30 border border-slate-600/30 rounded-lg
  `,
  
  errorMessage: `
    p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm
  `,
  
  successMessage: `
    p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200 text-sm
  `,
  
  metricsGrid: `
    grid grid-cols-2 gap-4 mt-4
  `,
  
  metricItem: `
    text-center p-3 bg-slate-700/30 rounded-lg
  `,
  
  metricValue: `
    text-2xl font-bold text-white
  `,
  
  metricLabel: `
    text-sm text-slate-400 mt-1
  `,
  
  button: `
    px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg
    font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600
    focus:outline-none focus:ring-2 focus:ring-blue-400/50
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  
  buttonSecondary: `
    px-6 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-200 rounded-lg
    font-medium transition-all duration-200 hover:bg-slate-600/50
    focus:outline-none focus:ring-2 focus:ring-slate-400/50
  `
} as const;

// ============================================================================
// Example OpenSCAD Code
// ============================================================================

const EXAMPLE_CODE = `// OpenSCAD Example - Mechanical Part
difference() {
  // Main body
  cube([20, 15, 8], center=true);
  
  // Mounting holes
  translate([-6, 0, 0])
    cylinder(h=10, r=2, center=true);
  
  translate([6, 0, 0])
    cylinder(h=10, r=2, center=true);
  
  // Central cutout
  cube([8, 6, 10], center=true);
}

// Support bracket
translate([0, -10, -4])
  cube([16, 3, 4]);`;

// ============================================================================
// OpenSCAD Viewer Component
// ============================================================================

/**
 * Interactive OpenSCAD viewer with real-time R3F conversion
 */
export const OpenSCADViewer: React.FC = () => {
  const [code, setCode] = useState(EXAMPLE_CODE);
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  // Converter configuration
  const converterConfig: UseR3FCSGConverterConfig = useMemo(() => ({
    enableCaching: true,
    enableLogging: false,
    autoConvert: autoUpdate,
    debounceMs: 1000,
    retryOnError: true,
    maxRetries: 2,
    canvasConfig: {
      shadows: true,
      antialias: true,
      camera: {
        position: [15, 15, 15],
        fov: 60
      }
    },
    sceneConfig: {
      background: '#1e293b',
      enableGrid: true,
      enableAxes: true,
      enableStats: false
    },
    controlsConfig: {
      enableOrbitControls: true,
      enableZoom: true,
      enablePan: true,
      enableRotate: true,
      autoRotate: false
    }
  }), [autoUpdate]);

  // Use the simplified hook for auto-conversion
  const {
    isLoading,
    progress,
    error,
    CanvasComponent,
    scene,
    meshes,
    metrics,
    retry,
    reset
  } = useOpenSCADToR3F(code, converterConfig);

  // Manual conversion using the full hook
  const converter = useR3FCSGConverter(converterConfig);

  const handleManualConvert = useCallback(async () => {
    await converter.convertToR3F(code);
  }, [converter, code]);

  const handleCodeChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  }, []);

  const handleExampleLoad = useCallback((exampleCode: string) => {
    setCode(exampleCode);
  }, []);

  // Format metrics for display
  const formattedMetrics = useMemo(() => {
    if (!metrics) return null;
    
    return {
      processingTime: `${metrics.processingTime.toFixed(1)}ms`,
      memoryUsage: `${(metrics.memoryUsage / 1024).toFixed(1)}KB`,
      meshCount: meshes?.length ?? 0,
      nodeCount: metrics.processedNodes
    };
  }, [metrics, meshes]);

  return (
    <div className={glassStyles.container}>
      {/* Header */}
      <header className={glassStyles.header}>
        <h1 className={glassStyles.title}>
          OpenSCAD → React Three Fiber
        </h1>
        <p className={glassStyles.subtitle}>
          Real-time conversion from OpenSCAD code to interactive 3D React components
          using the R3F CSG pipeline with glass morphism design.
        </p>
      </header>

      {/* Main Layout */}
      <div className={glassStyles.mainLayout}>
        {/* Code Editor Panel */}
        <div className={glassStyles.panel}>
          <div className={glassStyles.panelContent}>
            <h2 className={glassStyles.panelTitle}>
              <span>📝</span>
              OpenSCAD Code Editor
            </h2>
            
            <textarea
              value={code}
              onChange={handleCodeChange}
              className={glassStyles.codeEditor}
              placeholder="Enter your OpenSCAD code here..."
              spellCheck={false}
            />
            
            {/* Controls */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleManualConvert}
                disabled={isLoading}
                className={glassStyles.button}
              >
                {isLoading ? 'Converting...' : 'Convert to R3F'}
              </button>
              
              <button
                onClick={() => setAutoUpdate(!autoUpdate)}
                className={autoUpdate ? glassStyles.button : glassStyles.buttonSecondary}
              >
                Auto Update: {autoUpdate ? 'ON' : 'OFF'}
              </button>
              
              <button
                onClick={reset}
                className={glassStyles.buttonSecondary}
              >
                Reset
              </button>
            </div>

            {/* Example Buttons */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => handleExampleLoad('cube([10, 10, 10]);')}
                className={glassStyles.buttonSecondary}
              >
                Cube
              </button>
              <button
                onClick={() => handleExampleLoad('sphere(8);')}
                className={glassStyles.buttonSecondary}
              >
                Sphere
              </button>
              <button
                onClick={() => handleExampleLoad('cylinder(h=15, r=5);')}
                className={glassStyles.buttonSecondary}
              >
                Cylinder
              </button>
              <button
                onClick={() => handleExampleLoad(EXAMPLE_CODE)}
                className={glassStyles.buttonSecondary}
              >
                Complex Example
              </button>
            </div>
          </div>
        </div>

        {/* 3D Viewer Panel */}
        <div className={glassStyles.panel}>
          <div className={glassStyles.panelContent}>
            <h2 className={glassStyles.panelTitle}>
              <span>🎮</span>
              3D Preview
            </h2>
            
            {/* Progress Bar */}
            {isLoading && progress && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-300 mb-2">
                  <span>{progress.message}</span>
                  <span>{progress.progress}%</span>
                </div>
                <div className={glassStyles.progressBar}>
                  <div 
                    className={glassStyles.progressFill}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* 3D Viewer */}
            <div className={glassStyles.viewer3D}>
              {CanvasComponent ? (
                <CanvasComponent />
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Processing OpenSCAD code...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-400">
                  <div className="text-center">
                    <p className="mb-4">❌ Conversion failed</p>
                    <button onClick={retry} className={glassStyles.button}>
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Enter OpenSCAD code to see 3D preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Panel */}
      <div className={`${glassStyles.panel} mt-8`}>
        <div className={glassStyles.panelContent}>
          <h2 className={glassStyles.panelTitle}>
            <span>📊</span>
            Conversion Status & Metrics
          </h2>
          
          {/* Error Display */}
          {error && (
            <div className={glassStyles.errorMessage}>
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Success Display */}
          {!error && !isLoading && CanvasComponent && (
            <div className={glassStyles.successMessage}>
              <strong>Success:</strong> OpenSCAD code converted to React Three Fiber components successfully!
            </div>
          )}
          
          {/* Metrics Display */}
          {formattedMetrics && (
            <div className={glassStyles.metricsGrid}>
              <div className={glassStyles.metricItem}>
                <div className={glassStyles.metricValue}>{formattedMetrics.processingTime}</div>
                <div className={glassStyles.metricLabel}>Processing Time</div>
              </div>
              <div className={glassStyles.metricItem}>
                <div className={glassStyles.metricValue}>{formattedMetrics.memoryUsage}</div>
                <div className={glassStyles.metricLabel}>Memory Usage</div>
              </div>
              <div className={glassStyles.metricItem}>
                <div className={glassStyles.metricValue}>{formattedMetrics.meshCount}</div>
                <div className={glassStyles.metricLabel}>Mesh Count</div>
              </div>
              <div className={glassStyles.metricItem}>
                <div className={glassStyles.metricValue}>{formattedMetrics.nodeCount}</div>
                <div className={glassStyles.metricLabel}>Nodes Processed</div>
              </div>
            </div>
          )}
          
          {/* Converter Statistics */}
          <div className="mt-6 p-4 bg-slate-800/30 border border-slate-600/30 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-3">Converter Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-blue-400">{converter.statistics.conversionCount}</div>
                <div className="text-sm text-slate-400">Total Conversions</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-400">{converter.statistics.cacheHitRate.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Cache Hit Rate</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-400">{converter.statistics.cacheSize}</div>
                <div className="text-sm text-slate-400">Cache Size</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Default export
export default OpenSCADViewer;
