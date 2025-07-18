/**
 * @file Export Dialog Component
 *
 * Component for configuring and initiating 3D model exports.
 * Provides format selection, configuration options, and progress tracking.
 *
 * @example
 * ```tsx
 * <ExportDialog
 *   scene={scene}
 *   selectedMeshes={selectedMeshes}
 *   isOpen={showExportDialog}
 *   onClose={() => setShowExportDialog(false)}
 *   onExportComplete={(result) => console.log('Export completed:', result)}
 * />
 * ```
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import type React from 'react';
import { useEffect, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type {
  ExportConfig,
  ExportError,
  ExportFormat,
  ExportQuality,
  ExportResult,
} from '../../services/export/export.service';
import { useExport } from '../../services/export/use-export.hook';
import { ProgressBar } from '../progress-bar/progress-bar';

const logger = createLogger('ExportDialog');

/**
 * Export dialog props
 */
export interface ExportDialogProps {
  readonly scene: Scene | null;
  readonly selectedMeshes?: readonly AbstractMesh[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onExportComplete?: (result: ExportResult) => void;
  readonly onExportError?: (error: string) => void;
  readonly className?: string;
  readonly 'data-testid'?: string;
}

/**
 * Export Dialog Component
 *
 * Provides a comprehensive interface for configuring and initiating 3D model exports
 * with format selection, quality options, and real-time progress tracking.
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  scene,
  selectedMeshes = [],
  isOpen,
  onClose,
  onExportComplete,
  onExportError,
  className = '',
  'data-testid': dataTestId = 'export-dialog',
}) => {
  const {
    exportMeshes,
    exportScene,
    isExporting,
    exportProgress,
    exportMessage,
    getSupportedFormats,
    cancelExport,
  } = useExport(scene);

  // Form state
  const [format, setFormat] = useState<ExportFormat>('stl');
  const [filename, setFilename] = useState('model');
  const [quality, setQuality] = useState<ExportQuality>('medium');
  const [binary, setBinary] = useState(true);
  const [includeTextures, setIncludeTextures] = useState(true);
  const [includeAnimations, setIncludeAnimations] = useState(false);
  const [embedTextures, setEmbedTextures] = useState(false);
  const [units, setUnits] = useState<'mm' | 'cm' | 'm' | 'in' | 'ft'>('mm');
  const [precision, setPrecision] = useState(3);
  const [exportSelected, setExportSelected] = useState(false);

  // Update filename extension when format changes
  useEffect(() => {
    if (filename && !filename.includes('.')) {
      setFilename(`model.${format}`);
    } else if (filename.includes('.')) {
      const baseName = filename.substring(0, filename.lastIndexOf('.'));
      setFilename(`${baseName}.${format}`);
    }
  }, [format, filename]);

  // Update export selected based on selected meshes
  useEffect(() => {
    setExportSelected(selectedMeshes.length > 0);
  }, [selectedMeshes.length]);

  const supportedFormats = getSupportedFormats();

  const handleExport = async () => {
    if (!scene) {
      onExportError?.('No scene available for export');
      return;
    }

    try {
      const config: ExportConfig = {
        format,
        filename,
        quality,
        precision,
        exportSelected,
        ...(format === 'stl' || format === 'glb' ? { binary } : {}),
        ...(format === 'gltf' || format === 'glb' ? { includeTextures, includeAnimations } : {}),
        ...(format === 'gltf' ? { embedTextures } : {}),
        ...(format === '3mf' ? { units } : {}),
      };

      let result: Result<ExportResult, ExportError>;
      if (exportSelected && selectedMeshes.length > 0) {
        result = await exportMeshes(selectedMeshes, config);
      } else {
        result = await exportScene(config);
      }

      if (result.success && result.data) {
        onExportComplete?.(result.data);
        onClose();
        logger.debug(`[EXPORT] Export completed: ${result.data.filename}`);
      } else if (!result.success) {
        onExportError?.(result.error.message);
        logger.error(`[EXPORT] Export failed: ${result.error.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      onExportError?.(errorMessage);
      logger.error(`[EXPORT] Export error: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    if (isExporting) {
      cancelExport();
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`export-dialog-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      data-testid={dataTestId}
    >
      <div className="export-dialog bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="dialog-header p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Export 3D Model</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              data-testid="close-dialog-button"
              disabled={isExporting}
            >
              ×
            </button>
          </div>

          {selectedMeshes.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {selectedMeshes.length} object{selectedMeshes.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Content */}
        <div className="dialog-content p-6 space-y-4">
          {/* Export Target */}
          <fieldset className="form-group">
            <legend className="block text-sm font-medium text-gray-700 mb-2">Export Target</legend>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="export-target"
                  checked={!exportSelected}
                  onChange={() => setExportSelected(false)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">Entire Scene</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="export-target"
                  checked={exportSelected}
                  onChange={() => setExportSelected(true)}
                  className="mr-2"
                  disabled={isExporting || selectedMeshes.length === 0}
                />
                <span className="text-sm">Selected Objects ({selectedMeshes.length})</span>
              </label>
            </div>
          </fieldset>

          {/* Format Selection */}
          <div className="form-group">
            <label htmlFor="format-select" className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              id="format-select"
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
              data-testid="format-select"
            >
              {supportedFormats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt.toUpperCase()} - {getFormatDescription(fmt)}
                </option>
              ))}
            </select>
          </div>

          {/* Filename */}
          <div className="form-group">
            <label
              htmlFor="filename-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filename
            </label>
            <input
              id="filename-input"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
              data-testid="filename-input"
            />
          </div>

          {/* Quality */}
          <div className="form-group">
            <label
              htmlFor="quality-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Quality
            </label>
            <select
              id="quality-select"
              value={quality}
              onChange={(e) => setQuality(e.target.value as ExportQuality)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
              data-testid="quality-select"
            >
              <option value="low">Low - Faster export, larger file</option>
              <option value="medium">Medium - Balanced</option>
              <option value="high">High - Better quality</option>
              <option value="ultra">Ultra - Best quality, slower</option>
            </select>
          </div>

          {/* Format-specific options */}
          {(format === 'stl' || format === 'glb') && (
            <div className="form-group">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={binary}
                  onChange={(e) => setBinary(e.target.checked)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">Binary format (smaller file size)</span>
              </label>
            </div>
          )}

          {(format === 'gltf' || format === 'glb') && (
            <div className="form-group space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeTextures}
                  onChange={(e) => setIncludeTextures(e.target.checked)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">Include textures</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeAnimations}
                  onChange={(e) => setIncludeAnimations(e.target.checked)}
                  className="mr-2"
                  disabled={isExporting}
                />
                <span className="text-sm">Include animations</span>
              </label>

              {format === 'gltf' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={embedTextures}
                    onChange={(e) => setEmbedTextures(e.target.checked)}
                    className="mr-2"
                    disabled={isExporting}
                  />
                  <span className="text-sm">Embed textures in file</span>
                </label>
              )}
            </div>
          )}

          {format === '3mf' && (
            <div className="form-group">
              <label
                htmlFor="units-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Units
              </label>
              <select
                id="units-select"
                value={units}
                onChange={(e) => setUnits(e.target.value as typeof units)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isExporting}
              >
                <option value="mm">Millimeters (mm)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="m">Meters (m)</option>
                <option value="in">Inches (in)</option>
                <option value="ft">Feet (ft)</option>
              </select>
            </div>
          )}

          {/* Precision */}
          <div className="form-group">
            <label
              htmlFor="precision-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Precision (decimal places)
            </label>
            <input
              id="precision-input"
              type="number"
              min="0"
              max="10"
              value={precision}
              onChange={(e) => setPrecision(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            />
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="progress-section">
              <ProgressBar
                percentage={exportProgress}
                title={exportMessage || 'Exporting...'}
                size="md"
                color="blue"
                showPercentage={true}
                showTimeRemaining={false}
                data-testid="export-progress"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isExporting}
            data-testid="cancel-button"
          >
            {isExporting ? 'Cancel Export' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExporting || !filename.trim()}
            data-testid="export-button"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Get format description for display
 */
function getFormatDescription(format: ExportFormat): string {
  switch (format) {
    case 'stl':
      return '3D Printing (STL)';
    case '3mf':
      return 'Advanced 3D Printing (3MF)';
    case 'gltf':
      return 'Web/AR/VR (glTF)';
    case 'glb':
      return 'Web/AR/VR Binary (GLB)';
    default:
      return 'Unknown format';
  }
}

export default ExportDialog;
