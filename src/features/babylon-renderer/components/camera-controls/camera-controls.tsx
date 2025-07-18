/**
 * @file Camera Controls Component
 *
 * Provides UI controls for camera operations like zoom, pan, and view presets.
 * Integrates with the BabylonJS scene camera control service.
 *
 * @example
 * ```tsx
 * <CameraControls
 *   sceneService={sceneService}
 *   className="absolute top-4 right-4"
 * />
 * ```
 */

import type React from 'react';
import { useCallback, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';
import type { BabylonSceneService } from '../../services/babylon-scene-service';

const logger = createLogger('CameraControls');

/**
 * Camera controls props
 */
export interface CameraControlsProps {
  readonly sceneService: BabylonSceneService | null;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly showViewPresets?: boolean;
  readonly showFrameAll?: boolean;
}

/**
 * View preset options
 */
const VIEW_PRESETS = [
  { key: 'front', label: 'Front', icon: '⬅️' },
  { key: 'back', label: 'Back', icon: '➡️' },
  { key: 'left', label: 'Left', icon: '⬆️' },
  { key: 'right', label: 'Right', icon: '⬇️' },
  { key: 'top', label: 'Top', icon: '🔝' },
  { key: 'bottom', label: 'Bottom', icon: '🔻' },
  { key: 'isometric', label: 'ISO', icon: '📐' },
] as const;

/**
 * Camera Controls Component
 *
 * Provides intuitive camera control buttons for 3D scene navigation.
 * Includes view presets, frame all, and zoom controls.
 */
export const CameraControls: React.FC<CameraControlsProps> = ({
  sceneService,
  className = '',
  style,
  showViewPresets = true,
  showFrameAll = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);

  /**
   * Handle view preset selection
   */
  const handleViewPreset = useCallback(
    async (view: (typeof VIEW_PRESETS)[number]['key']) => {
      if (!sceneService || isLoading) return;

      setIsLoading(true);
      setActiveView(view);

      try {
        logger.debug(`[DEBUG][CameraControls] Setting view to: ${view}`);
        const result = await sceneService.setView(view);

        if (!result.success) {
          logger.error(`[ERROR][CameraControls] Failed to set view: ${result.error.message}`);
        } else {
          logger.debug(`[DEBUG][CameraControls] View set to ${view} successfully`);
        }
      } catch (error) {
        logger.error('[ERROR][CameraControls] View preset error:', error);
      } finally {
        setIsLoading(false);
        // Keep active view for a short time to show feedback
        setTimeout(() => setActiveView(null), 500);
      }
    },
    [sceneService, isLoading]
  );

  /**
   * Handle frame all operation
   */
  const handleFrameAll = useCallback(async () => {
    if (!sceneService || isLoading) return;

    setIsLoading(true);

    try {
      logger.debug('[DEBUG][CameraControls] Framing all meshes');
      const result = await sceneService.frameAll();

      if (!result.success) {
        logger.error(`[ERROR][CameraControls] Failed to frame all: ${result.error.message}`);
      } else {
        logger.debug('[DEBUG][CameraControls] Frame all completed successfully');
      }
    } catch (error) {
      logger.error('[ERROR][CameraControls] Frame all error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sceneService, isLoading]);

  if (!sceneService) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-2 p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 ${className}`}
      style={style}
    >
      {/* Frame All Button */}
      {showFrameAll && (
        <button
          type="button"
          onClick={handleFrameAll}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Frame all objects in view"
        >
          <span>🎯</span>
          <span>Frame All</span>
        </button>
      )}

      {/* View Presets */}
      {showViewPresets && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            View Presets
          </div>
          <div className="grid grid-cols-2 gap-1">
            {VIEW_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleViewPreset(preset.key)}
                disabled={isLoading}
                className={`flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                  activeView === preset.key
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`Set camera to ${preset.label} view`}
              >
                <span className="text-xs">{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera Instructions */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 space-y-1">
        <div>
          🖱️ <strong>Orbit:</strong> Left drag
        </div>
        <div>
          🖱️ <strong>Pan:</strong> Right drag
        </div>
        <div>
          🖱️ <strong>Zoom:</strong> Scroll wheel
        </div>
      </div>
    </div>
  );
};
