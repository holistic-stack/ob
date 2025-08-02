/**
 * @file import-service.ts
 * @description Main Import Service for OpenSCAD import() primitive
 *
 * Unified service that handles multiple file formats (STL, OFF) and provides
 * OpenSCAD-compatible import functionality with proper parameter handling.
 *
 * @example
 * ```typescript
 * const importService = new ImportService();
 *
 * const result = await importService.importFile(fileContent, {
 *   file: "model.stl",
 *   scale: 2.0,
 *   center: true,
 *   convexity: 10
 * });
 *
 * if (result.success) {
 *   console.log(`Imported ${result.data.vertices.length} vertices`);
 * }
 * ```
 */

import { createLogger } from '@/shared/services/logger.service';
import type { Result } from '@/shared/types/result.types';
import { error, success } from '@/shared/utils/functional/result';
import type { GeometryGenerationError, PolyhedronGeometryData } from '../../../types/geometry-data';
import type { ImportParameters, SupportedImportFormat } from '../../../types/import-parameters';
import {
  detectFileFormat,
  normalizeImportParameters,
  validateImportParameters,
} from '../../../types/import-parameters';
import { OFFImporterService } from './off-importer/off-importer';
import { STLImporterService } from './stl-importer/stl-importer';

const logger = createLogger('ImportService');

/**
 * Import result type
 */
export type ImportResult = Result<PolyhedronGeometryData, GeometryGenerationError>;

/**
 * Import statistics
 */
import type { Supported3DFormat } from '../../../types/import-parameters';

export interface ImportStatistics {
  readonly format: Supported3DFormat;
  readonly fileSize: number;
  readonly vertexCount: number;
  readonly faceCount: number;
  readonly parseTime: number;
  readonly totalTime: number;
}

/**
 * Main Import Service
 *
 * Provides unified import functionality for multiple 3D file formats.
 * Automatically detects file format and delegates to appropriate importer.
 */
export class ImportService {
  private readonly stlImporter: STLImporterService;
  private readonly offImporter: OFFImporterService;

  constructor() {
    this.stlImporter = new STLImporterService();
    this.offImporter = new OFFImporterService();

    logger.init('[INIT] ImportService initialized with STL and OFF support');
  }

  /**
   * Import file content with OpenSCAD parameters
   *
   * @param content - File content (string or Uint8Array)
   * @param params - OpenSCAD import parameters
   * @returns Result containing 3D geometry or error
   */
  async importFile(content: string | Uint8Array, params: ImportParameters): Promise<ImportResult> {
    const startTime = performance.now();

    try {
      logger.debug(`[IMPORT] Starting import of file: ${params.file}`);

      // Validate parameters
      const validation = validateImportParameters(params);
      if (!validation.isValid) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: `Invalid import parameters: ${validation.errors.join(', ')}`,
          details: { errors: validation.errors, warnings: validation.warnings },
        });
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn(`[WARN] Import warnings: ${validation.warnings.join(', ')}`);
      }

      // Detect file format
      const formatInfo = detectFileFormat(params.file);
      if (!formatInfo) {
        return error({
          type: 'INVALID_PARAMETERS',
          message: `Unsupported file format: ${params.file}`,
          details: { file: params.file },
        });
      }

      // Normalize parameters
      const normalizedParams = normalizeImportParameters(params);

      logger.debug(`[FORMAT] Detected format: ${formatInfo.format} (${formatInfo.description})`);

      // Delegate to appropriate importer
      const parseStartTime = performance.now();
      let result: ImportResult;

      switch (formatInfo.format) {
        case 'stl':
          result = await this.stlImporter.importSTL(content, normalizedParams);
          break;

        case 'off':
          if (typeof content !== 'string') {
            return error({
              type: 'INVALID_PARAMETERS',
              message: 'OFF files must be provided as text content',
              details: { format: 'off' },
            });
          }
          result = await this.offImporter.importOFF(content, normalizedParams);
          break;

        default:
          return error({
            type: 'INVALID_PARAMETERS',
            message: `Import format not yet implemented: ${formatInfo.format}`,
            details: { format: formatInfo.format },
          });
      }

      const parseTime = performance.now() - parseStartTime;
      const totalTime = performance.now() - startTime;

      if (result.success) {
        const stats: ImportStatistics = {
          format: formatInfo.format,
          fileSize: typeof content === 'string' ? content.length : content.length,
          vertexCount: result.data.vertices.length,
          faceCount: result.data.faces.length,
          parseTime,
          totalTime,
        };

        logger.debug(
          `[SUCCESS] Import completed: ${stats.vertexCount} vertices, ${stats.faceCount} faces in ${totalTime.toFixed(2)}ms`
        );

        // Add import statistics to metadata
        const enhancedGeometry: PolyhedronGeometryData = {
          ...result.data,
          metadata: {
            ...result.data.metadata,
            importStatistics: stats,
          },
        };

        return success(enhancedGeometry);
      }

      return result;
    } catch (err) {
      const totalTime = performance.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);

      logger.error(`[ERROR] Import failed after ${totalTime.toFixed(2)}ms: ${errorMessage}`);

      return error({
        type: 'COMPUTATION_ERROR',
        message: `Import failed: ${errorMessage}`,
        details: { file: params.file, totalTime },
      });
    }
  }

  /**
   * Check if a file format is supported
   *
   * @param filename - Filename to check
   * @returns True if format is supported
   */
  isFormatSupported(filename: string): boolean {
    const formatInfo = detectFileFormat(filename);
    return formatInfo !== null && ['stl', 'off'].includes(formatInfo.format);
  }

  /**
   * Get list of supported file formats
   *
   * @returns Array of supported format information
   */
  getSupportedFormats(): Array<{
    format: SupportedImportFormat;
    description: string;
    extensions: string[];
  }> {
    return [
      {
        format: 'stl',
        description: 'STereoLithography format - triangular mesh data',
        extensions: ['.stl'],
      },
      {
        format: 'off',
        description: 'Object File Format - vertices and faces',
        extensions: ['.off'],
      },
    ];
  }

  /**
   * Validate file content before import
   *
   * @param content - File content to validate
   * @param params - Import parameters
   * @returns Validation result
   */
  async validateFileContent(
    content: string | Uint8Array,
    params: ImportParameters
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    formatInfo?: ReturnType<typeof detectFileFormat>;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate parameters
    const paramValidation = validateImportParameters(params);
    errors.push(...paramValidation.errors);
    warnings.push(...paramValidation.warnings);

    // Detect format
    const formatInfo = detectFileFormat(params.file);
    if (!formatInfo) {
      errors.push(`Unsupported file format: ${params.file}`);
      return { isValid: false, errors, warnings };
    }

    // Check content size
    const contentSize = typeof content === 'string' ? content.length : content.length;
    if (contentSize === 0) {
      errors.push('File content is empty');
    } else if (contentSize > 100 * 1024 * 1024) {
      // 100MB limit
      warnings.push('Large file size may impact performance');
    }

    // Format-specific validation
    switch (formatInfo.format) {
      case 'stl':
        if (typeof content === 'string') {
          if (!this.stlImporter.isASCIISTL(content)) {
            warnings.push('Content appears to be binary STL but provided as string');
          }
        }
        break;

      case 'off':
        if (typeof content !== 'string') {
          errors.push('OFF files must be provided as text content');
        } else if (!content.trim().startsWith('OFF')) {
          errors.push('Invalid OFF file: missing OFF header');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      formatInfo,
    };
  }

  /**
   * Get import service statistics
   *
   * @returns Service statistics
   */
  getServiceInfo(): {
    supportedFormats: number;
    version: string;
    capabilities: string[];
  } {
    return {
      supportedFormats: this.getSupportedFormats().length,
      version: '1.0.0',
      capabilities: [
        'STL import (ASCII and binary)',
        'OFF import with triangulation',
        'Scaling and centering',
        'Origin offset',
        'Mesh validation',
        'Error recovery',
      ],
    };
  }
}
