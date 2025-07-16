/**
 * @file Export Service
 *
 * Service for exporting 3D models to various formats (STL, 3MF, GLTF).
 * Provides comprehensive export management with progress tracking and format-specific options.
 *
 * @example
 * ```typescript
 * const exportService = new ExportService(scene);
 *
 * // Export selected meshes to STL
 * const result = await exportService.exportMeshes(selectedMeshes, {
 *   format: 'stl',
 *   filename: 'my-model.stl',
 *   binary: true
 * });
 *
 * if (result.success) {
 *   // File download initiated
 *   console.log('Export completed');
 * }
 * ```
 */

import { type AbstractMesh, Mesh, type Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatchAsync } from '../../../../shared/utils/functional/result';
import type { ProgressService } from '../progress/progress.service';

const logger = createLogger('Export');

/**
 * Supported export formats
 */
export type ExportFormat = 'stl' | '3mf' | 'gltf' | 'glb';

/**
 * Export quality levels
 */
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Export configuration
 */
export interface ExportConfig {
  readonly format: ExportFormat;
  readonly filename: string;
  readonly quality?: ExportQuality;
  readonly binary?: boolean | undefined; // For STL and GLTF
  readonly includeTextures?: boolean | undefined; // For GLTF/GLB
  readonly includeAnimations?: boolean | undefined; // For GLTF/GLB
  readonly embedTextures?: boolean | undefined; // For GLTF
  readonly units?: 'mm' | 'cm' | 'm' | 'in' | 'ft' | undefined; // For 3MF
  readonly precision?: number; // Decimal places for coordinates
  readonly exportSelected?: boolean; // Export only selected meshes
}

/**
 * Export result
 */
export interface ExportResult {
  readonly filename: string;
  readonly format: ExportFormat;
  readonly fileSize: number;
  readonly meshCount: number;
  readonly exportTime: number; // In milliseconds
  readonly downloadUrl?: string; // For browser downloads
}

/**
 * Export error
 */
export interface ExportError {
  readonly code:
    | 'EXPORT_FAILED'
    | 'UNSUPPORTED_FORMAT'
    | 'NO_MESHES'
    | 'INVALID_CONFIG'
    | 'DOWNLOAD_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly format?: ExportFormat;
  readonly details?: Record<string, unknown>;
}

/**
 * Export progress callback
 */
export type ExportProgressCallback = (progress: number, message?: string) => void;

/**
 * Export Service
 *
 * Manages 3D model export to various formats with progress tracking,
 * quality options, and browser download handling.
 */
export class ExportService {
  private readonly scene: Scene;
  private progressService?: ProgressService;

  constructor(scene: Scene, progressService?: ProgressService) {
    this.scene = scene;
    this.progressService = progressService;
    logger.init('[INIT] Export service initialized');
  }

  /**
   * Export meshes to specified format
   */
  async exportMeshes(
    meshes: readonly AbstractMesh[],
    config: ExportConfig,
    onProgress?: ExportProgressCallback
  ): Promise<Result<ExportResult, ExportError>> {
    logger.debug(`[EXPORT_MESHES] Starting export to ${config.format} format`);
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Validate configuration
        this.validateConfig(config);

        // Filter valid meshes
        const validMeshes = meshes.filter((mesh) => mesh instanceof Mesh) as Mesh[];
        if (validMeshes.length === 0) {
          throw this.createError('NO_MESHES', 'No valid meshes to export');
        }

        // Start progress tracking
        let operationId: string | undefined;
        if (this.progressService) {
          const progressResult = this.progressService.startOperation({
            type: 'export',
            title: `Exporting to ${config.format.toUpperCase()}`,
            description: `Exporting ${validMeshes.length} objects`,
            total: 100,
            cancellable: true,
          });

          if (progressResult.success) {
            operationId = progressResult.data;
          }
        }

        try {
          // Update progress
          this.updateProgress(operationId, 10, 'Preparing export...');
          onProgress?.(10, 'Preparing export...');

          // Export based on format
          let exportData: string | ArrayBuffer;
          let mimeType: string;

          switch (config.format) {
            case 'stl':
              exportData = await this.exportSTL(validMeshes, config, operationId, onProgress);
              mimeType = 'application/sla';
              break;
            case '3mf':
              exportData = await this.export3MF(validMeshes, config, operationId, onProgress);
              mimeType = 'model/3mf';
              break;
            case 'gltf':
              exportData = await this.exportGLTF(validMeshes, config, operationId, onProgress);
              mimeType = 'model/gltf+json';
              break;
            case 'glb':
              exportData = await this.exportGLB(validMeshes, config, operationId, onProgress);
              mimeType = 'model/gltf-binary';
              break;
            default:
              throw this.createError(
                'UNSUPPORTED_FORMAT',
                `Unsupported export format: ${config.format}`
              );
          }

          // Update progress
          this.updateProgress(operationId, 90, 'Preparing download...');
          onProgress?.(90, 'Preparing download...');

          // Create download
          const downloadUrl = this.createDownload(exportData, config.filename, mimeType);

          // Calculate file size
          const fileSize =
            typeof exportData === 'string' ? new Blob([exportData]).size : exportData.byteLength;

          const exportTime = performance.now() - startTime;

          // Complete progress
          this.updateProgress(operationId, 100, 'Export completed');
          onProgress?.(100, 'Export completed');

          if (this.progressService && operationId) {
            this.progressService.completeOperation(operationId, 'Export completed successfully');
          }

          const result: ExportResult = {
            filename: config.filename,
            format: config.format,
            fileSize,
            meshCount: validMeshes.length,
            exportTime,
            downloadUrl,
          };

          logger.debug(`[EXPORT_MESHES] Export completed in ${exportTime.toFixed(2)}ms`);
          return result;
        } catch (error) {
          // Handle export errors
          if (this.progressService && operationId) {
            this.progressService.updateProgress(operationId, {
              error: error instanceof Error ? error.message : 'Export failed',
            });
          }
          throw error;
        }
      },
      (error) => this.createError('EXPORT_FAILED', `Export failed: ${error}`, config.format)
    );
  }

  /**
   * Export scene to specified format
   */
  async exportScene(
    config: ExportConfig,
    onProgress?: ExportProgressCallback
  ): Promise<Result<ExportResult, ExportError>> {
    const allMeshes = this.scene.meshes.filter((mesh) => mesh instanceof Mesh);
    return this.exportMeshes(allMeshes, config, onProgress);
  }

  /**
   * Get supported export formats
   */
  getSupportedFormats(): readonly ExportFormat[] {
    return ['stl', '3mf', 'gltf', 'glb'] as const;
  }

  /**
   * Get default configuration for a format
   */
  getDefaultConfig(format: ExportFormat, filename?: string): ExportConfig {
    const baseConfig = {
      format,
      filename: filename || `model.${format}`,
      quality: 'medium' as ExportQuality,
      precision: 3,
      exportSelected: false,
    };

    switch (format) {
      case 'stl':
        return {
          ...baseConfig,
          binary: true,
        };
      case '3mf':
        return {
          ...baseConfig,
          units: 'mm' as const,
        };
      case 'gltf':
        return {
          ...baseConfig,
          binary: false,
          includeTextures: true,
          includeAnimations: false,
          embedTextures: false,
        };
      case 'glb':
        return {
          ...baseConfig,
          binary: true,
          includeTextures: true,
          includeAnimations: false,
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Export to STL format
   */
  private async exportSTL(
    _meshes: Mesh[],
    _config: ExportConfig,
    operationId?: string,
    onProgress?: ExportProgressCallback
  ): Promise<string> {
    this.updateProgress(operationId, 30, 'Generating STL data...');
    onProgress?.(30, 'Generating STL data...');

    // STL export would require BabylonJS STL serializer
    // For now, we'll throw an error indicating it's not yet implemented
    throw this.createError('UNSUPPORTED_FORMAT', 'STL export is not yet implemented');
  }

  /**
   * Export to 3MF format
   */
  private async export3MF(
    _meshes: Mesh[],
    _config: ExportConfig,
    operationId?: string,
    onProgress?: ExportProgressCallback
  ): Promise<string> {
    this.updateProgress(operationId, 30, 'Generating 3MF data...');
    onProgress?.(30, 'Generating 3MF data...');

    // 3MF export would require a custom implementation or third-party library
    // For now, we'll throw an error indicating it's not yet implemented
    throw this.createError('UNSUPPORTED_FORMAT', '3MF export is not yet implemented');
  }

  /**
   * Export to GLTF format
   */
  private async exportGLTF(
    _meshes: Mesh[],
    _config: ExportConfig,
    operationId?: string,
    onProgress?: ExportProgressCallback
  ): Promise<string> {
    this.updateProgress(operationId, 30, 'Generating GLTF data...');
    onProgress?.(30, 'Generating GLTF data...');

    // GLTF export would require BabylonJS GLTF serializer
    // For now, we'll throw an error indicating it's not yet implemented
    throw this.createError('UNSUPPORTED_FORMAT', 'GLTF export is not yet implemented');
  }

  /**
   * Export to GLB format
   */
  private async exportGLB(
    _meshes: Mesh[],
    _config: ExportConfig,
    operationId?: string,
    onProgress?: ExportProgressCallback
  ): Promise<ArrayBuffer> {
    this.updateProgress(operationId, 30, 'Generating GLB data...');
    onProgress?.(30, 'Generating GLB data...');

    // GLB export would require BabylonJS GLTF serializer
    // For now, we'll throw an error indicating it's not yet implemented
    throw this.createError('UNSUPPORTED_FORMAT', 'GLB export is not yet implemented');
  }

  /**
   * Create browser download for exported data
   */
  private createDownload(data: string | ArrayBuffer, filename: string, mimeType: string): string {
    try {
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return url;
    } catch (error) {
      throw this.createError('DOWNLOAD_FAILED', `Failed to create download: ${error}`);
    }
  }

  /**
   * Validate export configuration
   */
  private validateConfig(config: ExportConfig): void {
    if (!config.filename) {
      throw this.createError('INVALID_CONFIG', 'Filename is required');
    }

    if (!this.getSupportedFormats().includes(config.format)) {
      throw this.createError('UNSUPPORTED_FORMAT', `Unsupported format: ${config.format}`);
    }

    if (config.precision !== undefined && (config.precision < 0 || config.precision > 10)) {
      throw this.createError('INVALID_CONFIG', 'Precision must be between 0 and 10');
    }
  }

  /**
   * Update progress if progress service is available
   */
  private updateProgress(
    operationId: string | undefined,
    progress: number,
    message?: string
  ): void {
    if (this.progressService && operationId) {
      this.progressService.updateProgress(operationId, {
        current: progress,
        message,
      });
    }
  }

  /**
   * Create an export error
   */
  private createError(
    code: ExportError['code'],
    message: string,
    format?: ExportFormat,
    details?: Record<string, unknown>
  ): ExportError {
    const error: ExportError = {
      code,
      message,
      timestamp: new Date(),
    };

    if (format !== undefined) {
      (error as ExportError & { format: ExportFormat }).format = format;
    }

    if (details !== undefined) {
      (error as ExportError & { details: Record<string, unknown> }).details = details;
    }

    return error;
  }

  /**
   * Dispose service and clean up resources
   */
  dispose(): void {
    logger.debug('[DISPOSE] Export service disposed');
  }
}
