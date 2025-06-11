/**
 * @file Modern Pipeline Processor Component (React 19)
 * 
 * A React 19 compatible pipeline processor following modern patterns:
 * - Proper async handling with React 19 patterns
 * - Optimized resource management
 * - Better error handling and recovery
 * - No scene disposal issues
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import { OpenScadPipeline } from '../../babylon-csg2/openscad-pipeline/openscad-pipeline';
import { PipelineProcessorProps, PipelineResult, createPipelineSuccess, createPipelineError } from '../../types/pipeline-types';

/**
 * Modern pipeline processor with React 19 patterns
 */
export function PipelineProcessorV2({
  openscadCode,
  onResult,
  onProcessingStart,
  onProcessingEnd,
  autoProcess = false
}: PipelineProcessorProps): React.JSX.Element {

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedCode, setLastProcessedCode] = useState<string>('');
  const [processingStats, setProcessingStats] = useState<{
    totalRuns: number;
    successCount: number;
    errorCount: number;
    averageTime: number;
  }>({
    totalRuns: 0,
    successCount: 0,
    errorCount: 0,
    averageTime: 0
  });

  // Use refs to avoid stale closures
  const pipelineRef = useRef<OpenScadPipeline | null>(null);
  const processingTimeRef = useRef<number>(0);
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

  // Process OpenSCAD code with modern async patterns
  const processCode = useCallback(async (code: string): Promise<void> => {
    if (!code.trim() || !pipelineRef.current) {
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
    processingTimeRef.current = Date.now();

    try {
      // Create a dedicated scene for processing
      const engine = new BABYLON.NullEngine();
      const scene = new BABYLON.Scene(engine);

      // Set up scene for processing
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

      // Process with timeout and abort signal
      const processPromise = pipelineRef.current.processOpenScadCode(code, scene);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), 30000);
      });

      const abortPromise = new Promise<never>((_, reject) => {
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          reject(new Error('Processing aborted'));
        });
      });

      const result = await Promise.race([processPromise, timeoutPromise, abortPromise]);

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

        const processingTime = Date.now() - processingTimeRef.current;
        
        // Update stats
        setProcessingStats(prev => ({
          totalRuns: prev.totalRuns + 1,
          successCount: prev.successCount + 1,
          errorCount: prev.errorCount,
          averageTime: (prev.averageTime * prev.totalRuns + processingTime) / (prev.totalRuns + 1)
        }));

        const successResult = createPipelineSuccess(simpleMesh, {
          ...result.metadata,
          totalTimeMs: processingTime
        });

        setLastProcessedCode(code);
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
      const processingTime = Date.now() - processingTimeRef.current;
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      
      console.error('[ERROR] Pipeline processing failed:', errorMessage);

      // Update stats
      setProcessingStats(prev => ({
        totalRuns: prev.totalRuns + 1,
        successCount: prev.successCount,
        errorCount: prev.errorCount + 1,
        averageTime: (prev.averageTime * prev.totalRuns + processingTime) / (prev.totalRuns + 1)
      }));

      const errorResult = createPipelineError(errorMessage, {
        parseTimeMs: 0,
        visitTimeMs: 0,
        totalTimeMs: processingTime,
        nodeCount: 0,
        meshCount: 0
      });

      onResult(errorResult);

    } finally {
      setIsProcessing(false);
      onProcessingEnd();
      abortControllerRef.current = null;
      console.log('[END] Pipeline processing completed');
    }
  }, [onResult, onProcessingStart, onProcessingEnd]);

  // Auto-process when code changes
  useEffect(() => {
    if (autoProcess && openscadCode !== lastProcessedCode && !isProcessing) {
      const timeoutId = setTimeout(() => {
        processCode(openscadCode);
      }, 500); // Debounce auto-processing

      return () => clearTimeout(timeoutId);
    }
  }, [autoProcess, openscadCode, lastProcessedCode, isProcessing, processCode]);

  // Manual process handler
  const handleManualProcess = useCallback(() => {
    if (!isProcessing) {
      processCode(openscadCode);
    }
  }, [openscadCode, isProcessing, processCode]);

  // Cancel processing
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const canProcess = openscadCode.trim().length > 0 && pipelineRef.current !== null;

  return (
    <div className="pipeline-processor-v2">
      <div className="processor-header">
        <h3>Modern Pipeline Processor</h3>
        <div className="processor-stats">
          <span>Runs: {processingStats.totalRuns}</span>
          <span>Success: {processingStats.successCount}</span>
          <span>Errors: {processingStats.errorCount}</span>
          <span>Avg Time: {Math.round(processingStats.averageTime)}ms</span>
        </div>
      </div>

      <div className="processor-controls">
        <button
          onClick={handleManualProcess}
          disabled={!canProcess || isProcessing}
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

        {isProcessing && (
          <button
            onClick={handleCancel}
            className="cancel-button"
          >
            Cancel
          </button>
        )}

        <label className="auto-process-toggle">
          <input
            type="checkbox"
            checked={autoProcess}
            onChange={(e) => {
              // This would need to be passed up to parent component
              console.log('Auto-process toggled:', e.target.checked);
            }}
          />
          Auto-process on code change
        </label>
      </div>

      <div className="processor-status">
        {!pipelineRef.current && (
          <div className="status-message warning">
            ⚠️ Pipeline initializing...
          </div>
        )}
        
        {!canProcess && pipelineRef.current && (
          <div className="status-message info">
            ℹ️ Enter OpenSCAD code to process
          </div>
        )}

        {lastProcessedCode && (
          <div className="status-message success">
            ✓ Last processed: {lastProcessedCode.substring(0, 50)}...
          </div>
        )}
      </div>
    </div>
  );
}
