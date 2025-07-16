/**
 * @file Selection Info Component
 *
 * Component for displaying information about selected 3D objects.
 * Shows object properties, metadata, and selection statistics.
 *
 * @example
 * ```tsx
 * <SelectionInfo
 *   scene={scene}
 *   showMetadata={true}
 *   showStatistics={true}
 *   onClearSelection={() => console.log('Selection cleared')}
 * />
 * ```
 */

import type { AbstractMesh, Scene, Vector3 } from '@babylonjs/core';
import type React from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import { useSelection, useSelectionStats } from '../../services/selection/use-selection.hook';

const logger = createLogger('SelectionInfo');

/**
 * Selection info props
 */
export interface SelectionInfoProps {
  readonly scene: Scene | null;
  readonly showMetadata?: boolean;
  readonly showStatistics?: boolean;
  readonly showBoundingBox?: boolean;
  readonly className?: string;
  readonly onClearSelection?: () => void;
  readonly onSelectMesh?: (mesh: AbstractMesh) => void;
  readonly 'data-testid'?: string;
}

/**
 * Format vector for display
 */
const formatVector3 = (vector: Vector3): string => {
  return `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)})`;
};

/**
 * Get mesh bounding box information
 */
const getMeshBoundingInfo = (mesh: AbstractMesh) => {
  try {
    const boundingInfo = mesh.getBoundingInfo();
    const min = boundingInfo.minimum;
    const max = boundingInfo.maximum;
    const size = max.subtract(min);
    const center = min.add(max).scale(0.5);

    return {
      min: formatVector3(min),
      max: formatVector3(max),
      size: formatVector3(size),
      center: formatVector3(center),
      volume: size.x * size.y * size.z,
    };
  } catch (error) {
    logger.warn(`[BOUNDING_INFO] Failed to get bounding info for mesh ${mesh.name}: ${error}`);
    return null;
  }
};

/**
 * Get mesh metadata as displayable entries
 */
const getMetadataEntries = (metadata: unknown): Array<[string, string]> => {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }

  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (value !== null && value !== undefined) {
      let displayValue: string;

      if (typeof value === 'object') {
        displayValue = JSON.stringify(value, null, 2);
      } else {
        displayValue = String(value);
      }

      entries.push([key, displayValue]);
    }
  }

  return entries;
};

/**
 * Selection Info Component
 *
 * Displays comprehensive information about selected 3D objects including
 * properties, metadata, bounding box information, and selection statistics.
 */
export const SelectionInfo: React.FC<SelectionInfoProps> = ({
  scene,
  showMetadata = true,
  showStatistics = true,
  showBoundingBox = true,
  className = '',
  onClearSelection,
  onSelectMesh,
  'data-testid': dataTestId = 'selection-info',
}) => {
  const { selectedMeshes, selectedMeshInfos, hoveredMesh, clearSelection } = useSelection(scene);
  const stats = useSelectionStats(scene);

  const handleClearSelection = () => {
    clearSelection();
    onClearSelection?.();
  };

  const handleMeshClick = (mesh: AbstractMesh) => {
    onSelectMesh?.(mesh);
  };

  if (!scene) {
    return (
      <div className={`selection-info ${className}`} data-testid={dataTestId}>
        <div className="text-gray-500 text-sm">No scene available</div>
      </div>
    );
  }

  return (
    <div className={`selection-info ${className}`} data-testid={dataTestId}>
      {/* Selection Statistics */}
      {showStatistics && (
        <div className="selection-stats mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Selection</h3>
            {stats.hasSelection && (
              <button
                onClick={handleClearSelection}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                data-testid="clear-selection-button"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Count:</span>
              <span className="ml-1 font-mono">{stats.selectedCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Mode:</span>
              <span className="ml-1 font-mono capitalize">{stats.selectionMode}</span>
            </div>
          </div>

          {stats.lastSelectionTime && (
            <div className="text-xs text-gray-500 mt-1">
              Last: {stats.lastSelectionTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Hovered Mesh */}
      {hoveredMesh && (
        <div className="hovered-mesh mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Hovering</h3>
          <div className="text-sm text-yellow-700">
            <div className="font-mono">{hoveredMesh.name || hoveredMesh.id}</div>
            <div className="text-xs text-yellow-600">Type: {hoveredMesh.getClassName()}</div>
          </div>
        </div>
      )}

      {/* Selected Meshes */}
      {stats.hasSelection ? (
        <div className="selected-meshes space-y-3">
          {selectedMeshInfos.map((meshInfo, index) => {
            const mesh = meshInfo.mesh;
            const boundingInfo = showBoundingBox ? getMeshBoundingInfo(mesh) : null;
            const metadataEntries = showMetadata ? getMetadataEntries(meshInfo.metadata) : [];

            return (
              <div
                key={`${mesh.id}-${index}`}
                className="mesh-info p-3 bg-blue-50 border border-blue-200 rounded-lg"
                data-testid={`selected-mesh-${index}`}
              >
                {/* Mesh Header */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-800">{mesh.name || mesh.id}</h4>
                  <button
                    onClick={() => handleMeshClick(mesh)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                    data-testid={`focus-mesh-${index}`}
                  >
                    Focus
                  </button>
                </div>

                {/* Basic Properties */}
                <div className="mesh-properties mb-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-1 font-mono">{mesh.getClassName()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <span className="ml-1 font-mono text-xs">{mesh.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Visible:</span>
                      <span className="ml-1 font-mono">{mesh.isVisible ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Enabled:</span>
                      <span className="ml-1 font-mono">{mesh.isEnabled() ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs">
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-1 font-mono">{formatVector3(mesh.position)}</span>
                  </div>

                  <div className="text-xs">
                    <span className="text-gray-600">Rotation:</span>
                    <span className="ml-1 font-mono">{formatVector3(mesh.rotation)}</span>
                  </div>

                  <div className="text-xs">
                    <span className="text-gray-600">Scaling:</span>
                    <span className="ml-1 font-mono">{formatVector3(mesh.scaling)}</span>
                  </div>
                </div>

                {/* Bounding Box Information */}
                {showBoundingBox && boundingInfo && (
                  <div className="bounding-info mb-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Bounding Box</h5>
                    <div className="text-xs space-y-1">
                      <div>
                        <span className="text-gray-600">Min:</span>
                        <span className="ml-1 font-mono">{boundingInfo.min}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max:</span>
                        <span className="ml-1 font-mono">{boundingInfo.max}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="ml-1 font-mono">{boundingInfo.size}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Center:</span>
                        <span className="ml-1 font-mono">{boundingInfo.center}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Volume:</span>
                        <span className="ml-1 font-mono">{boundingInfo.volume.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {showMetadata && metadataEntries.length > 0 && (
                  <div className="metadata">
                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Metadata</h5>
                    <div className="text-xs space-y-1">
                      {metadataEntries.map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="text-gray-600 min-w-0 flex-shrink-0">{key}:</span>
                          <span className="ml-1 font-mono text-xs break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Time */}
                <div className="selection-time mt-2 pt-2 border-t border-blue-200">
                  <div className="text-xs text-blue-600">
                    Selected: {meshInfo.selectionTime.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-selection text-center py-8">
          <div className="text-gray-400 text-sm">No objects selected</div>
          <div className="text-gray-400 text-xs mt-1">Click on a 3D object to select it</div>
        </div>
      )}
    </div>
  );
};

export default SelectionInfo;
