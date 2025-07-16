/**
 * @file Export Hooks
 *
 * React hooks for managing 3D model export operations.
 * Provides reactive export functionality with progress tracking and error handling.
 * 
 * @example
 * ```tsx
 * function ExportComponent() {
 *   const { exportMeshes, exportScene, isExporting, exportProgress } = useExport(scene);
 *   const { selectedMeshes } = useSelection(scene);
 *   
 *   const handleExport = async () => {
 *     const result = await exportMeshes(selectedMeshes, {
 *       format: 'stl',
 *       filename: 'my-model.stl',
 *       binary: true
 *     });
 *     
 *     if (result.success) {
 *       console.log('Export completed:', result.data);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleExport} disabled={isExporting}>
 *         Export STL
 *       </button>
 *       {isExporting && <p>Progress: {exportProgress}%</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useState, useRef } from 'react';
import { Scene, AbstractMesh } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import {
  ExportService,
  type ExportConfig,
  type ExportResult,
  type ExportError,
  type ExportFormat,
  type ExportProgressCallback,
} from './export.service';
import { useProgress } from '../progress/use-progress.hook';

const logger = createLogger('ExportHook');

// Global export service instances per scene
const exportServices = new Map<Scene, ExportService>();

/**
 * Get or create export service for a scene
 */
function getExportService(scene: Scene): ExportService {
  let service = exportServices.get(scene);
  
  if (!service) {
    service = new ExportService(scene);
    exportServices.set(scene, service);
  }
  
  return service;
}

/**
 * Export hook return type
 */
export interface UseExportReturn {
  readonly exportMeshes: (
    meshes: readonly AbstractMesh[],
    config: ExportConfig,
    onProgress?: ExportProgressCallback
  ) => Promise<{ success: boolean; data?: ExportResult; error?: ExportError }>;
  readonly exportScene: (
    config: ExportConfig,
    onProgress?: ExportProgressCallback
  ) => Promise<{ success: boolean; data?: ExportResult; error?: ExportError }>;
  readonly isExporting: boolean;
  readonly exportProgress: number;
  readonly exportMessage: string | null;
  readonly lastExportResult: ExportResult | null;
  readonly lastExportError: ExportError | null;
  readonly getSupportedFormats: () => readonly ExportFormat[];
  readonly getDefaultConfig: (format: ExportFormat, filename?: string) => ExportConfig;
  readonly cancelExport: () => void;
}

/**
 * Main export hook for managing 3D model export operations
 */
export const useExport = (scene: Scene | null): UseExportReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);
  const [lastExportError, setLastExportError] = useState<ExportError | null>(null);
  
  const exportService = scene ? getExportService(scene) : null;
  const abortControllerRef = useRef<AbortController | null>(null);

  const exportMeshes = useCallback(async (
    meshes: readonly AbstractMesh[],
    config: ExportConfig,
    onProgress?: ExportProgressCallback
  ) => {
    if (!exportService) {
      const error: ExportError = {
        code: 'EXPORT_FAILED',
        message: 'No export service available',
        timestamp: new Date(),
      };
      setLastExportError(error);
      return { success: false, error };
    }

    if (isExporting) {
      const error: ExportError = {
        code: 'EXPORT_FAILED',
        message: 'Export already in progress',
        timestamp: new Date(),
      };
      setLastExportError(error);
      return { success: false, error };
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('Starting export...');
      setLastExportError(null);
      setLastExportResult(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Combined progress callback
      const progressCallback: ExportProgressCallback = (progress, message) => {
        setExportProgress(progress);
        setExportMessage(message || null);
        onProgress?.(progress, message);
      };

      const result = await exportService.exportMeshes(meshes, config, progressCallback);

      if (result.success) {
        setLastExportResult(result.data);
        setExportMessage('Export completed successfully');
        logger.debug(`[EXPORT_MESHES] Export completed: ${result.data.filename}`);
        return { success: true, data: result.data };
      } else {
        setLastExportError(result.error);
        setExportMessage(`Export failed: ${result.error.message}`);
        logger.error(`[EXPORT_MESHES] Export failed: ${result.error.message}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const exportError: ExportError = {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown export error',
        timestamp: new Date(),
      };
      setLastExportError(exportError);
      setExportMessage(`Export failed: ${exportError.message}`);
      logger.error(`[EXPORT_MESHES] Export error: ${exportError.message}`);
      return { success: false, error: exportError };
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  }, [exportService, isExporting]);

  const exportScene = useCallback(async (
    config: ExportConfig,
    onProgress?: ExportProgressCallback
  ) => {
    if (!exportService) {
      const error: ExportError = {
        code: 'EXPORT_FAILED',
        message: 'No export service available',
        timestamp: new Date(),
      };
      setLastExportError(error);
      return { success: false, error };
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('Starting scene export...');
      setLastExportError(null);
      setLastExportResult(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Combined progress callback
      const progressCallback: ExportProgressCallback = (progress, message) => {
        setExportProgress(progress);
        setExportMessage(message || null);
        onProgress?.(progress, message);
      };

      const result = await exportService.exportScene(config, progressCallback);

      if (result.success) {
        setLastExportResult(result.data);
        setExportMessage('Scene export completed successfully');
        logger.debug(`[EXPORT_SCENE] Export completed: ${result.data.filename}`);
        return { success: true, data: result.data };
      } else {
        setLastExportError(result.error);
        setExportMessage(`Scene export failed: ${result.error.message}`);
        logger.error(`[EXPORT_SCENE] Export failed: ${result.error.message}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const exportError: ExportError = {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown export error',
        timestamp: new Date(),
      };
      setLastExportError(exportError);
      setExportMessage(`Scene export failed: ${exportError.message}`);
      logger.error(`[EXPORT_SCENE] Export error: ${exportError.message}`);
      return { success: false, error: exportError };
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  }, [exportService]);

  const getSupportedFormats = useCallback((): readonly ExportFormat[] => {
    if (!exportService) {
      return [];
    }
    return exportService.getSupportedFormats();
  }, [exportService]);

  const getDefaultConfig = useCallback((format: ExportFormat, filename?: string): ExportConfig => {
    if (!exportService) {
      return {
        format,
        filename: filename || `model.${format}`,
        quality: 'medium',
        precision: 3,
        exportSelected: false,
      };
    }
    return exportService.getDefaultConfig(format, filename);
  }, [exportService]);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsExporting(false);
      setExportMessage('Export cancelled');
      logger.debug('[CANCEL_EXPORT] Export operation cancelled');
    }
  }, []);

  return {
    exportMeshes,
    exportScene,
    isExporting,
    exportProgress,
    exportMessage,
    lastExportResult,
    lastExportError,
    getSupportedFormats,
    getDefaultConfig,
    cancelExport,
  };
};

/**
 * Hook for export statistics and history
 */
export const useExportStats = (scene: Scene | null) => {
  const { lastExportResult, lastExportError } = useExport(scene);

  const stats = {
    hasExported: lastExportResult !== null,
    lastExportTime: lastExportResult?.exportTime,
    lastExportFormat: lastExportResult?.format,
    lastExportFileSize: lastExportResult?.fileSize,
    lastExportMeshCount: lastExportResult?.meshCount,
    hasError: lastExportError !== null,
    lastErrorMessage: lastExportError?.message,
  };

  return stats;
};

/**
 * Hook for quick export with predefined configurations
 */
export const useQuickExport = (scene: Scene | null) => {
  const { exportMeshes, exportScene, getDefaultConfig } = useExport(scene);

  const exportSTL = useCallback(async (
    meshes: readonly AbstractMesh[],
    filename?: string
  ) => {
    const config = getDefaultConfig('stl', filename);
    return exportMeshes(meshes, config);
  }, [exportMeshes, getDefaultConfig]);

  const exportGLTF = useCallback(async (
    meshes: readonly AbstractMesh[],
    filename?: string
  ) => {
    const config = getDefaultConfig('gltf', filename);
    return exportMeshes(meshes, config);
  }, [exportMeshes, getDefaultConfig]);

  const exportSceneSTL = useCallback(async (filename?: string) => {
    const config = getDefaultConfig('stl', filename);
    return exportScene(config);
  }, [exportScene, getDefaultConfig]);

  const exportSceneGLTF = useCallback(async (filename?: string) => {
    const config = getDefaultConfig('gltf', filename);
    return exportScene(config);
  }, [exportScene, getDefaultConfig]);

  return {
    exportSTL,
    exportGLTF,
    exportSceneSTL,
    exportSceneGLTF,
  };
};

/**
 * Cleanup function for export services
 */
export const cleanupExportServices = (): void => {
  for (const [scene, service] of exportServices.entries()) {
    service.dispose();
    exportServices.delete(scene);
  }
};
