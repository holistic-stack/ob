/**
 * @file Pipeline Processor Component
 * 
 * A focused component for processing OpenSCAD code through the pipeline.
 * Handles: OpenSCAD code → @holistic-stack/openscad-parser:parseAST → CSG2 operations
 */
import React, { useCallback, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { PipelineProcessorProps, createPipelineFailure, createPipelineSuccess } from '../../types/pipeline-types';
import { OpenScadPipeline } from '../../babylon-csg2/openscad-pipeline/openscad-pipeline';
import './pipeline-processor.css';

/**
 * Pipeline processor component that orchestrates the conversion process
 * 
 * This is a placeholder implementation - will be enhanced with actual pipeline logic
 */
export function PipelineProcessor({ 
  openscadCode, 
  onResult, 
  onProcessingStart, 
  disabled = false 
}: PipelineProcessorProps): React.JSX.Element {
  console.log('[INIT] PipelineProcessor component rendering');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const handleProcess = useCallback(async () => {
    console.log('[INIT] Starting pipeline processing');
    setIsProcessing(true);
    onProcessingStart();

    try {
      console.log('[DEBUG] Processing OpenSCAD code:', openscadCode.substring(0, 50) + '...');
      
      // Create a temporary scene for processing
      const engine = new BABYLON.NullEngine();
      const tempScene = new BABYLON.Scene(engine);
      
      try {
        // Initialize the OpenSCAD pipeline
        const pipeline = new OpenScadPipeline({
          enableLogging: true,
          enableMetrics: true,
          csg2Timeout: 30000
        });
        
        console.log('[DEBUG] Initializing OpenSCAD pipeline...');
        const initResult = await pipeline.initialize();
        
        if (!initResult.success) {
          throw new Error(`Pipeline initialization failed: ${initResult.error}`);
        }
        
        console.log('[DEBUG] Processing OpenSCAD code through pipeline...');
        const processResult = await pipeline.processOpenScadCode(openscadCode, tempScene);
        
        if (!processResult.success) {
          throw new Error(`Pipeline processing failed: ${processResult.error}`);
        }
        
        console.log('[DEBUG] Pipeline processing successful');
          // Create success result with the generated mesh and metadata
        const result = createPipelineSuccess<BABYLON.Mesh | null>(processResult.value, processResult.metadata);
        
        console.log('[END] Pipeline processing completed');
        onResult(result);
        
        // Clean up resources
        await pipeline.dispose();
        
      } finally {
        // Always dispose the temporary scene and engine
        tempScene.dispose();
        engine.dispose();
      }
        } catch (error) {
      console.error('[ERROR] Pipeline processing failed:', error);
      const result = createPipelineFailure<BABYLON.Mesh | null>(
        error instanceof Error ? error.message : 'Unknown error occurred',
        error
      );
      onResult(result);
    } finally {
      setIsProcessing(false);
    }
  }, [openscadCode, onResult, onProcessingStart]);

  const canProcess = openscadCode.trim().length > 0 && !disabled && !isProcessing;

  return (
    <div className="pipeline-processor">
      <div className="processor-header">
        <h3 className="processor-title">Pipeline Processing</h3>
        <p className="processor-description">
          Convert OpenSCAD code to 3D scene using CSG2 operations
        </p>
      </div>

      <div className="processor-actions">
        <button
          type="button"
          className="process-button"
          onClick={handleProcess}
          disabled={!canProcess}
          aria-describedby="process-status"
        >
          {isProcessing ? (
            <>
              <span className="spinner" aria-hidden="true">⟳</span>
              Processing...
            </>
          ) : (
            'Process OpenSCAD Code'
          )}
        </button>
      </div>

      <div id="process-status" className="processor-status">
        {isProcessing && (
          <div className="status-message processing">
            <span className="status-icon">⚙️</span>
            Processing OpenSCAD code through pipeline...
          </div>
        )}
        {!canProcess && !isProcessing && openscadCode.trim().length === 0 && (
          <div className="status-message info">
            <span className="status-icon">ℹ️</span>
            Enter OpenSCAD code to process
          </div>
        )}
      </div>

      <div className="pipeline-info">
        <h4 className="pipeline-stages-title">Pipeline Stages:</h4>
        <ol className="pipeline-stages">
          <li className="pipeline-stage">
            <span className="stage-name">Parse OpenSCAD</span>
            <span className="stage-description">@holistic-stack/openscad-parser</span>
          </li>
          <li className="pipeline-stage">
            <span className="stage-name">Generate AST</span>
            <span className="stage-description">Abstract Syntax Tree</span>
          </li>
          <li className="pipeline-stage">
            <span className="stage-name">Convert to CSG2</span>
            <span className="stage-description">Babylon.js CSG2 operations</span>
          </li>
          <li className="pipeline-stage">
            <span className="stage-name">Create Scene</span>
            <span className="stage-description">3D Babylon.js scene</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
