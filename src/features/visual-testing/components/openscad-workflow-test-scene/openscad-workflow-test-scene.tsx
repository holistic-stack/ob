/**
 * @file openscad-workflow-test-scene.tsx
 * @description OpenSCAD Workflow Test Scene using unified pipeline architecture.
 * This component demonstrates clean code principles: SOLID, DRY, KISS, YAGNI.
 *
 * ARCHITECTURE FEATURES:
 * ✅ Single Responsibility: Each function has one clear purpose
 * ✅ DRY: Unified pipeline eliminates code duplication
 * ✅ KISS: Simple interface with single service call
 * ✅ YAGNI: No unnecessary complexity or abstractions
 * ✅ Dependency Inversion: Depends on abstractions (pipeline service)
 * ✅ Open/Closed: Extensible through pipeline service
 *
 * @author OpenSCAD Babylon Team
 * @version 3.0.0
 * @since 2025-07-31
 */

import type { AbstractMesh, Scene as BabylonScene } from '@babylonjs/core';
import { Color3, Color4, StandardMaterial } from '@babylonjs/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import { isError } from '../../../../shared/types/result.types';
import { OpenSCADRenderingPipelineService } from '../../../openscad-geometry-builder/services/pipeline/openscad-rendering-pipeline';

import { OpenscadParser } from '../../../openscad-parser/openscad-parser';

const logger = createLogger('OpenSCADWorkflowTestScene');

/**
 * Props for the OpenSCAD workflow test scene
 */
export interface OpenSCADWorkflowTestSceneProps {
  /** OpenSCAD code to render */
  readonly openscadCode: string;
  /** BabylonJS scene for rendering */
  readonly babylonScene: BabylonScene;
  /** Optional callback when meshes are generated */
  readonly onMeshesGenerated?: (meshes: AbstractMesh[]) => void;
  /** Optional callback when errors occur */
  readonly onError?: (error: string) => void;
  /** Optional callback for processing status updates */
  readonly onStatusUpdate?: (status: string) => void;
}

/**
 * Processing status enum for better type safety
 */
export enum ProcessingStatus {
  IDLE = 'idle',
  PARSING = 'parsing',
  CONVERTING = 'converting',
  RENDERING = 'rendering',
  COMPLETE = 'complete',
  ERROR = 'error',
}

/**
 * OpenSCAD Workflow Test Scene Component
 *
 * CLEAN CODE PRINCIPLES APPLIED:
 *
 * 1. SINGLE RESPONSIBILITY: This component only orchestrates the OpenSCAD workflow
 * 2. DRY: Uses unified pipeline instead of duplicating conversion logic
 * 3. KISS: Simple, clear interface with minimal complexity
 * 4. YAGNI: Only implements what's actually needed
 * 5. DEPENDENCY INVERSION: Depends on pipeline abstraction, not concrete implementations
 * 6. OPEN/CLOSED: Extensible through pipeline service, closed for modification
 */
export function OpenSCADWorkflowTestScene({
  openscadCode,
  babylonScene,
  onMeshesGenerated,
  onError,
  onStatusUpdate,
}: OpenSCADWorkflowTestSceneProps) {
  // STATE: Keep state minimal and focused (KISS principle)
  const [_status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [generatedMeshes, setGeneratedMeshes] = useState<AbstractMesh[]>([]);

  // SERVICES: Single responsibility - each service has one job
  const pipelineRef = useRef<OpenSCADRenderingPipelineService | null>(null);
  const parserRef = useRef<OpenscadParser | null>(null);

  // INITIALIZATION: Clean service setup with proper cleanup
  useEffect(() => {
    logger.init('[INIT][OpenSCADWorkflowTestScene] Initializing services');

    pipelineRef.current = new OpenSCADRenderingPipelineService();
    parserRef.current = new OpenscadParser();

    // Initialize the parser
    parserRef.current.init().catch((error) => {
      logger.error('[ERROR][OpenSCADWorkflowTestScene] Failed to initialize parser:', error);
    });

    return () => {
      logger.end('[END][OpenSCADWorkflowTestScene] Cleaning up services');
      // Inline cleanup to avoid dependency issues
      if (parserRef.current) {
        parserRef.current.dispose();
      }
      pipelineRef.current = null;
      parserRef.current = null;
    };
  }, []);

  /**
   * Update processing status with clean state management
   * CLEAN CODE: Single responsibility, clear naming
   */
  const updateStatus = useCallback(
    (newStatus: ProcessingStatus, message: string) => {
      setStatus(newStatus);
      onStatusUpdate?.(message);
      logger.debug(`[STATUS][OpenSCADWorkflowTestScene] ${newStatus}: ${message}`);
    },
    [onStatusUpdate]
  );

  /**
   * Handle errors with consistent error management
   * CLEAN CODE: Single responsibility, consistent error handling
   */
  const handleError = useCallback(
    (errorMessage: string) => {
      logger.error(`[ERROR][OpenSCADWorkflowTestScene] ${errorMessage}`);
      setStatus(ProcessingStatus.ERROR);
      onError?.(errorMessage);
      onStatusUpdate?.(`Error: ${errorMessage}`);
    },
    [onError, onStatusUpdate]
  );

  /**
   * Apply clean, consistent visual styling to meshes
   * CLEAN CODE: Single responsibility, no side effects, pure function approach
   */
  const applyCleanMeshStyling = useCallback((meshes: AbstractMesh[], scene: BabylonScene) => {
    const VISUAL_CONFIG = {
      MATERIAL: {
        DIFFUSE_COLOR: new Color3(0.2, 0.4, 0.8), // Blue
        SPECULAR_COLOR: new Color3(0.1, 0.1, 0.1), // Low specular
      },
      EDGES: {
        WIDTH: 2.0,
        COLOR: new Color4(0, 0, 0, 1), // Black edges with full opacity
      },
    } as const;

    meshes.forEach((mesh, index) => {
      if (!mesh) {
        logger.warn(`[WARN][OpenSCADWorkflowTestScene] Mesh at index ${index} is null`);
        return;
      }

      // Create material with clean configuration
      const material = new StandardMaterial(`openscad_material_${index}`, scene);
      material.diffuseColor = VISUAL_CONFIG.MATERIAL.DIFFUSE_COLOR;
      material.specularColor = VISUAL_CONFIG.MATERIAL.SPECULAR_COLOR;
      material.wireframe = false;

      mesh.material = material;

      // Enable edge rendering with clean configuration
      mesh.enableEdgesRendering();
      mesh.edgesWidth = VISUAL_CONFIG.EDGES.WIDTH;
      mesh.edgesColor = VISUAL_CONFIG.EDGES.COLOR;

      logger.debug(`[DEBUG][OpenSCADWorkflowTestScene] Applied styling to mesh: ${mesh.name}`);
    });
  }, []);

  /**
   * Process OpenSCAD workflow using clean architecture
   * CLEAN CODE: Single function, single responsibility, clear error handling
   */
  const processOpenSCADWorkflow = useCallback(
    async (code: string, scene: BabylonScene) => {
      if (!pipelineRef.current || !parserRef.current) {
        handleError('Services not initialized');
        return;
      }

      try {
        // STEP 1: Parse OpenSCAD code (Single Responsibility)
        updateStatus(ProcessingStatus.PARSING, 'Parsing OpenSCAD code...');
        const parseResult = parserRef.current.parseASTWithResult(code);

        if (isError(parseResult)) {
          handleError(`Parse failed: ${String(parseResult.error)}`);
          return;
        }

        const ast = parseResult.data;
        logger.debug(`[DEBUG][OpenSCADWorkflowTestScene] Parsed ${ast.length} AST nodes`);

        // STEP 2: Convert AST to meshes using unified pipeline (DRY principle)
        updateStatus(ProcessingStatus.CONVERTING, 'Converting AST to geometry...');
        const conversionResult = pipelineRef.current.convertASTToMeshes(
          ast,
          scene,
          undefined, // Let pipeline extract globals automatically
          'openscad-workflow' // Consistent naming
        );

        if (!conversionResult.success) {
          handleError(`Conversion failed: ${conversionResult.error.message}`);
          return;
        }

        const meshes = conversionResult.data;
        logger.debug(`[DEBUG][OpenSCADWorkflowTestScene] Generated ${meshes.length} meshes`);

        // STEP 3: Apply visual styling (Single Responsibility)
        updateStatus(ProcessingStatus.RENDERING, 'Applying visual styling...');
        applyCleanMeshStyling(meshes, scene);

        // STEP 4: Update state and notify (KISS principle)
        setGeneratedMeshes(meshes);
        onMeshesGenerated?.(meshes);
        updateStatus(ProcessingStatus.COMPLETE, 'Processing complete');

        logger.debug('[DEBUG][OpenSCADWorkflowTestScene] Workflow completed successfully');
      } catch (error) {
        handleError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [updateStatus, handleError, applyCleanMeshStyling, onMeshesGenerated]
  );

  // MAIN PROCESSING: Single responsibility - process OpenSCAD code
  useEffect(() => {
    if (!openscadCode?.trim() || !babylonScene || !pipelineRef.current || !parserRef.current) {
      return;
    }

    processOpenSCADWorkflow(openscadCode, babylonScene);
  }, [openscadCode, babylonScene, processOpenSCADWorkflow]);

  /**
   * Clean up generated meshes with proper resource management
   * CLEAN CODE: Single responsibility, proper cleanup
   */
  const cleanupMeshes = useCallback(() => {
    generatedMeshes.forEach((mesh) => {
      if (mesh && !mesh.isDisposed()) {
        mesh.dispose();
      }
    });
    setGeneratedMeshes([]);
    logger.debug('[DEBUG][OpenSCADWorkflowTestScene] Cleaned up generated meshes');
  }, [generatedMeshes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMeshes();
    };
  }, [cleanupMeshes]);

  // CLEAN CODE: Component returns null (no UI rendering)
  // This follows Single Responsibility - component only manages 3D scene
  return null;
}

/**
 * Hook for using the OpenSCAD workflow with unified pipeline
 * CLEAN CODE: Single responsibility, clear interface, proper state management
 */
export function useOpenSCADWorkflow(openscadCode: string, babylonScene: BabylonScene | null) {
  const [meshes, setMeshes] = useState<AbstractMesh[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleMeshesGenerated = useCallback((generatedMeshes: AbstractMesh[]) => {
    setMeshes(generatedMeshes);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setMeshes([]);
  }, []);

  const handleStatusUpdate = useCallback((statusMessage: string) => {
    // Extract status from message for better state management
    if (statusMessage.includes('complete')) {
      setStatus(ProcessingStatus.COMPLETE);
    } else if (statusMessage.includes('Error')) {
      setStatus(ProcessingStatus.ERROR);
    } else if (statusMessage.includes('Parsing')) {
      setStatus(ProcessingStatus.PARSING);
    } else if (statusMessage.includes('Converting')) {
      setStatus(ProcessingStatus.CONVERTING);
    } else if (statusMessage.includes('Rendering')) {
      setStatus(ProcessingStatus.RENDERING);
    }
  }, []);

  return {
    meshes,
    status,
    error,
    isProcessing:
      status !== ProcessingStatus.IDLE &&
      status !== ProcessingStatus.COMPLETE &&
      status !== ProcessingStatus.ERROR,
    WorkflowComponent: babylonScene ? (
      <OpenSCADWorkflowTestScene
        openscadCode={openscadCode}
        babylonScene={babylonScene}
        onMeshesGenerated={handleMeshesGenerated}
        onError={handleError}
        onStatusUpdate={handleStatusUpdate}
      />
    ) : null,
  };
}
