/**
 * @file import-parameters.ts
 * @description Extended import parameters and file format types for import functionality.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

import type { Vector3 } from './geometry-data';

/**
 * Supported 3D file formats for import
 */
export type Supported3DFormat = 'stl' | 'off' | 'obj' | 'amf' | '3mf' | 'csg';

/**
 * Supported 2D file formats for import
 */
export type Supported2DFormat = 'dxf' | 'svg';

/**
 * Supported image formats for import
 */
export type SupportedImageFormat = 'png';

/**
 * All supported import formats
 */
export type SupportedImportFormat = Supported3DFormat | Supported2DFormat | SupportedImageFormat;

/**
 * Legacy type alias for compatibility
 */
export type ImportFileFormat = SupportedImportFormat;

/**
 * STL file metadata
 */
export interface STLMetadata {
  readonly format: 'ascii' | 'binary';
  readonly triangleCount: number;
  readonly header?: string;
}

/**
 * OFF file metadata
 */
export interface OFFMetadata {
  readonly vertexCount: number;
  readonly faceCount: number;
  readonly edgeCount: number;
}

/**
 * Complete OpenSCAD import() primitive parameters
 */
export interface ImportParameters {
  readonly file: string; // Required: filename with extension
  readonly convexity?: number; // Default: 1 (optimization for preview rendering)
  readonly center?: boolean; // Default: false (center object in X-Y plane)
  readonly scale?: number; // Default: 1.0 (scale factor)
  readonly origin?: readonly [number, number]; // Default: [0, 0] (positioning offset)

  // Format-specific parameters
  readonly width?: number; // For image imports
  readonly height?: number; // For image imports
  readonly dpi?: number; // Default: 96 (dots per inch for SVG/DXF)
  readonly id?: string; // For SVG imports (specific element ID)
  readonly layer?: string; // For DXF/SVG imports (specific layer)

  // Fragment parameters for curves
  readonly $fn?: number; // Fragment count for smooth curves
  readonly $fa?: number; // Minimum angle step
  readonly $fs?: number; // Minimum segment length
}

/**
 * Import result with metadata
 */
export interface ImportResult {
  readonly vertices: readonly Vector3[];
  readonly faces: readonly (readonly number[])[];
  readonly normals?: readonly Vector3[];
  readonly metadata: STLMetadata | OFFMetadata;
  readonly bounds: {
    readonly min: Vector3;
    readonly max: Vector3;
  };
}

/**
 * File format detection result
 */
export interface FileFormatInfo {
  readonly format: SupportedImportFormat;
  readonly is3D: boolean;
  readonly is2D: boolean;
  readonly isImage: boolean;
  readonly description: string;
}

/**
 * Import validation result
 */
export interface ImportValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly suggestions: readonly string[];
}

/**
 * Normalized import parameters with all defaults applied
 */
export interface NormalizedImportParameters {
  readonly file: string;
  readonly convexity: number;
  readonly center: boolean;
  readonly scale: number;
  readonly origin: readonly [number, number];
  readonly width?: number;
  readonly height?: number;
  readonly dpi: number;
  readonly id?: string;
  readonly layer?: string;
  readonly fn: number;
  readonly fa: number;
  readonly fs: number;
}

/**
 * Default import parameters matching OpenSCAD defaults
 */
export const DEFAULT_IMPORT_PARAMETERS: Required<Omit<ImportParameters, 'file' | 'width' | 'height' | 'id' | 'layer'>> = {
  convexity: 1,
  center: false,
  scale: 1.0,
  origin: [0, 0] as const,
  dpi: 96,
  $fn: 0, // Use $fa and $fs for fragment calculation
  $fa: 12,
  $fs: 2,
} as const;

/**
 * File format mappings
 */
export const FILE_FORMAT_MAP: Record<string, SupportedImportFormat> = {
  '.stl': 'stl',
  '.off': 'off',
  '.obj': 'obj',
  '.amf': 'amf',
  '.3mf': '3mf',
  '.csg': 'csg',
  '.dxf': 'dxf',
  '.svg': 'svg',
  '.png': 'png',
} as const;

/**
 * Format descriptions
 */
export const FORMAT_DESCRIPTIONS: Record<SupportedImportFormat, string> = {
  stl: 'STereoLithography format - triangular mesh data',
  off: 'Object File Format - vertices and faces',
  obj: 'Wavefront OBJ format - 3D geometry',
  amf: 'Additive Manufacturing Format - 3D printing',
  '3mf': '3D Manufacturing Format - Microsoft 3D printing',
  csg: 'OpenSCAD CSG format - constructive solid geometry',
  dxf: 'AutoCAD DXF format - 2D vector graphics',
  svg: 'Scalable Vector Graphics - 2D vector format',
  png: 'Portable Network Graphics - raster image format',
} as const;

/**
 * Detect file format from filename
 *
 * @param filename - Filename with extension
 * @returns File format information or null if unsupported
 */
export function detectFileFormat(filename: string): FileFormatInfo | null {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !(extension in FILE_FORMAT_MAP)) {
    return null;
  }

  const format = FILE_FORMAT_MAP[extension];
  const is3D = ['stl', 'off', 'obj', 'amf', '3mf', 'csg'].includes(format);
  const is2D = ['dxf', 'svg'].includes(format);
  const isImage = ['png'].includes(format);

  return {
    format,
    is3D,
    is2D,
    isImage,
    description: FORMAT_DESCRIPTIONS[format],
  };
}

/**
 * Validate import parameters
 *
 * @param params - Import parameters to validate
 * @returns Validation result with errors and warnings
 */
export function validateImportParameters(params: ImportParameters): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate required file parameter
  if (!params.file || typeof params.file !== 'string' || params.file.trim().length === 0) {
    errors.push('File parameter is required and must be a non-empty string');
  } else {
    // Check file format
    const formatInfo = detectFileFormat(params.file);
    if (!formatInfo) {
      errors.push(`Unsupported file format: ${params.file}`);
      suggestions.push('Supported formats: STL, OFF, OBJ, AMF, 3MF, CSG, DXF, SVG, PNG');
    }
  }

  // Validate convexity
  if (params.convexity !== undefined) {
    if (typeof params.convexity !== 'number' || params.convexity < 1) {
      errors.push('Convexity must be a positive integer >= 1');
    } else if (params.convexity > 100) {
      warnings.push('Very high convexity values may impact performance');
    }
  }

  // Validate scale
  if (params.scale !== undefined) {
    if (typeof params.scale !== 'number' || params.scale <= 0) {
      errors.push('Scale must be a positive number > 0');
    } else if (params.scale < 0.001) {
      warnings.push('Very small scale values may cause precision issues');
    } else if (params.scale > 1000) {
      warnings.push('Very large scale values may cause memory issues');
    }
  }

  // Validate origin
  if (params.origin !== undefined) {
    if (!Array.isArray(params.origin) || params.origin.length !== 2) {
      errors.push('Origin must be an array of two numbers [x, y]');
    } else if (!params.origin.every(coord => typeof coord === 'number' && isFinite(coord))) {
      errors.push('Origin coordinates must be finite numbers');
    }
  }

  // Validate DPI
  if (params.dpi !== undefined) {
    if (typeof params.dpi !== 'number' || params.dpi < 0.001) {
      errors.push('DPI must be a positive number >= 0.001');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

/**
 * Normalize import parameters with defaults
 *
 * @param params - Input import parameters
 * @returns Normalized parameters with all defaults applied
 */
export function normalizeImportParameters(params: ImportParameters): NormalizedImportParameters {
  return {
    file: params.file,
    convexity: params.convexity ?? DEFAULT_IMPORT_PARAMETERS.convexity,
    center: params.center ?? DEFAULT_IMPORT_PARAMETERS.center,
    scale: params.scale ?? DEFAULT_IMPORT_PARAMETERS.scale,
    origin: params.origin ?? DEFAULT_IMPORT_PARAMETERS.origin,
    width: params.width,
    height: params.height,
    dpi: params.dpi ?? DEFAULT_IMPORT_PARAMETERS.dpi,
    id: params.id,
    layer: params.layer,
    fn: params.$fn ?? DEFAULT_IMPORT_PARAMETERS.$fn,
    fa: params.$fa ?? DEFAULT_IMPORT_PARAMETERS.$fa,
    fs: params.$fs ?? DEFAULT_IMPORT_PARAMETERS.$fs,
  };
}
