/**
 * @file Pipeline Processor Component
 * 
 * A focused component for processing OpenSCAD code through the pipeline.
 * Handles: OpenSCAD code → @holistic-stack/openscad-parser:parseAST → CSG2 operations
 */
import React, { useCallback, useState, useRef, useEffect } from 'react';
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
  const [lastProcessedCode, setLastProcessedCode] = useState<string>('');

  // Use refs to avoid stale closures and manage resources
  const pipelineRef = useRef<OpenScadPipeline | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize pipeline once
  useEffect(() => {
    const initializePipeline = async () => {
      if (pipelineRef.current) return;

      console.log('[INIT] Initializing modern pipeline processor');

      try {
        const pipeline = new OpenScadPipeline({
          enableLogging: true,
          enableMetrics: true,
          csg2Timeout: 10000
        });

        const initResult = await pipeline.initialize();
        if (initResult.success) {
          pipelineRef.current = pipeline;
          console.log('[DEBUG] Pipeline initialized successfully');
        } else {
          console.error('[ERROR] Pipeline initialization failed:', initResult.error);
        }
      } catch (error) {
        console.error('[ERROR] Pipeline initialization error:', error);
      }
    };

    initializePipeline();

    // Cleanup on unmount
    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.dispose();
        pipelineRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleProcess = useCallback(async () => {
    if (!openscadCode.trim() || !pipelineRef.current) {
      console.warn('[WARN] Cannot process: empty code or pipeline not ready');
      return;
    }

    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    console.log('[INIT] Starting modern pipeline processing');
    setIsProcessing(true);
    onProcessingStart();

    try {
      // Create a dedicated scene for processing
      const engine = new BABYLON.NullEngine();
      const scene = new BABYLON.Scene(engine);

      // Set up scene for processing
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

      // Process with the initialized pipeline
      const result = await pipelineRef.current.processOpenScadCode(openscadCode, scene);

      if (result.success && result.value) {
        console.log('[DEBUG] Pipeline processing successful');

        // Create a simple mesh representation for the renderer
        // This avoids the scene disposal issues
        const simpleMesh = BABYLON.MeshBuilder.CreateBox(
          `processed_${Date.now()}`,
          { size: 2 },
          scene
        );

        // Copy basic properties from the result if it's a mesh
        if (result.value instanceof BABYLON.Mesh) {
          const sourceMesh = result.value;

          // Copy transform
          simpleMesh.position = sourceMesh.position.clone();
          simpleMesh.rotation = sourceMesh.rotation.clone();
          simpleMesh.scaling = sourceMesh.scaling.clone();

          // Copy geometry data if available
          try {
            const positions = sourceMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const normals = sourceMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            const indices = sourceMesh.getIndices();

            if (positions && positions.length > 0) {
              simpleMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            }
            if (normals && normals.length > 0) {
              simpleMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
            }
            if (indices && indices.length > 0) {
              simpleMesh.setIndices(indices);
            }
          } catch (geometryError) {
            console.warn('[WARN] Could not copy geometry:', geometryError);
            // Keep the simple box mesh as fallback
          }
        }

        const successResult = createPipelineSuccess(simpleMesh, result.metadata);
        setLastProcessedCode(openscadCode);
        onResult(successResult);

        // Don't dispose the scene immediately - let the renderer handle it
        // This prevents the WebGL context issues
        setTimeout(() => {
          scene.dispose();
          engine.dispose();
        }, 1000);

      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

      console.error('[ERROR] Pipeline processing failed:', errorMessage);

      const errorResult = createPipelineFailure<BABYLON.Mesh | null>(errorMessage, error);
      onResult(errorResult);

    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
      console.log('[END] Pipeline processing completed');
    }
  }, [openscadCode, onResult, onProcessingStart]);

  const canProcess = openscadCode.trim().length > 0 && !disabled && !isProcessing && pipelineRef.current !== null;

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
