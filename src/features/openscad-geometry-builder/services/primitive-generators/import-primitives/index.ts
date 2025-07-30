/**
 * @file import-primitives/index.ts
 * @description Export all import primitive generators for OpenSCAD import() primitive support.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-29
 */

// Re-export import parameter types
export type {
  FileFormatInfo,
  ImportParameters,
  ImportValidationResult,
  NormalizedImportParameters,
  SupportedImportFormat,
} from '../../../types/import-parameters';
export {
  DEFAULT_IMPORT_PARAMETERS,
  detectFileFormat,
  FILE_FORMAT_MAP,
  FORMAT_DESCRIPTIONS,
  normalizeImportParameters,
  validateImportParameters,
} from '../../../types/import-parameters';
export type { ImportResult, ImportStatistics } from './import-service';
// Main import service
export { ImportService } from './import-service';
export type { OFFImportResult, OFFMesh } from './off-importer/off-importer';
// OFF importer
export { OFFImporterService } from './off-importer/off-importer';
export type {
  MeshBounds,
  MeshValidationResult,
  STLImportResult,
  STLMesh,
} from './stl-importer/stl-importer';
// STL importer
export { STLImporterService } from './stl-importer/stl-importer';
