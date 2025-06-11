/**
 * @file Main App component for OpenSCAD to Babylon.js pipeline testing
 * 
 * Root component that orchestrates the complete pipeline testing interface.
 * Follows SRP by delegating specific responsibilities to focused components.
 */
import React, { useState, useCallback } from 'react';
import { OpenSCADInput } from './components/openscad-input';
import { PipelineProcessor } from './components/pipeline-processor/pipeline-processor';
import { BabylonRenderer } from './components/babylon-renderer/babylon-renderer';
import { ErrorDisplay } from './components/error-display/error-display';
import { PipelineResult } from './types/pipeline-types';
import './App.css';

/**
 * Main application component for testing the OpenSCAD pipeline
 * 
 * Pipeline flow: OpenSCAD code → parseAST → CSG2 → Babylon scene
 */
function App(): React.JSX.Element {
  console.log('[INIT] App component mounting');

  const [openscadCode, setOpenscadCode] = useState<string>('cube([10, 10, 10]);');
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleCodeChange = useCallback((code: string) => {
    console.log('[DEBUG] OpenSCAD code changed, length:', code.length);
    setOpenscadCode(code);
    setError(null); // Clear previous errors when code changes
  }, []);

  const handlePipelineResult = useCallback((result: PipelineResult) => {
    console.log('[DEBUG] Pipeline result received:', result.success ? 'success' : 'failure');
    setPipelineResult(result);
    setIsProcessing(false);
    
    if (!result.success) {
      setError(result.error);
      console.error('[ERROR] Pipeline failed:', result.error);
    } else {
      setError(null);
      console.log('[END] Pipeline processing completed successfully');
    }
  }, []);

  const handleProcessingStart = useCallback(() => {
    console.log('[INIT] Starting pipeline processing');
    setIsProcessing(true);
    setError(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>OpenSCAD to Babylon.js Pipeline</h1>
        <p className="pipeline-description">
          OpenSCAD Code → @holistic-stack/openscad-parser:parseAST → CSG2 Babylon JS → Babylon JS Scene
        </p>
      </header>

      <main className="app-main">
        <div className="app-layout">
          {/* Left panel: Input and controls */}
          <div className="input-panel">
            <OpenSCADInput
              value={openscadCode}
              onChange={handleCodeChange}
              disabled={isProcessing}
            />
            
            <PipelineProcessor
              openscadCode={openscadCode}
              onResult={handlePipelineResult}
              onProcessingStart={handleProcessingStart}
              disabled={isProcessing}
            />

            {error && (
              <ErrorDisplay
                error={error}
                onClear={() => setError(null)}
              />
            )}
          </div>

          {/* Right panel: 3D rendering */}
          <div className="render-panel">
            <BabylonRenderer
              pipelineResult={pipelineResult}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
