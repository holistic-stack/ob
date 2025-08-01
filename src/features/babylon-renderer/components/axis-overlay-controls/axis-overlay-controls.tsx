/**
 * @file axis-overlay-controls.tsx
 * @description React component for controlling SketchUp-style 3D axis overlay.
 * Provides minimal UI controls for visibility and basic styling options.
 *
 * @example Basic Usage
 * ```tsx
 * <AxisOverlayControls />
 * ```
 */

import type React from 'react';
import type { AxisOverlayConfig } from '@/features/babylon-renderer';
import { useAppStore } from '@/features/store';

/**
 * SketchUp-Style Axis Overlay Controls Component
 *
 * Provides a minimal control panel for managing SketchUp-style 3D axis overlay:
 * - Visibility toggle
 * - Opacity control
 * - Status information
 *
 * Note: SketchUp-style axes are clean and simple - no tick marks or labels
 */
export function AxisOverlayControls(): React.JSX.Element {
  // Zustand store selectors with defensive check
  const axisOverlayState = useAppStore((state) => state.babylonRendering?.axisOverlay);
  const setAxisOverlayVisibility = useAppStore((state) => state.setAxisOverlayVisibility);
  const updateAxisOverlayConfig = useAppStore((state) => state.updateAxisOverlayConfig);

  // Early return if axis overlay state is not available
  if (!axisOverlayState) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 w-80">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">3D Axis Overlay Controls</h3>
        <div className="text-red-500">Axis overlay state not available</div>
      </div>
    );
  }

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAxisOverlayVisibility(event.target.checked);
  };

  const handleConfigChange = (updates: Partial<AxisOverlayConfig>) => {
    updateAxisOverlayConfig(updates);
  };

  // SketchUp-style axes: simplified controls - no tick intervals, fonts, units, or labels

  const handleOpacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    handleConfigChange({ opacity: value });
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">SketchUp-Style Axes</h3>

      {/* Visibility Toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={axisOverlayState.isVisible}
            onChange={handleVisibilityChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Coordinate Axes</span>
        </label>
      </div>

      {/* Simplified Configuration */}
      <div className="space-y-4">
        {/* Opacity */}
        <div>
          <label htmlFor="opacity" className="block text-sm font-medium text-gray-700 mb-1">
            Opacity: {Math.round(axisOverlayState.config.opacity * 100)}%
          </label>
          <input
            id="opacity"
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={axisOverlayState.config.opacity}
            onChange={handleOpacityChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Information about SketchUp-style axes */}
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <div className="font-medium mb-1">SketchUp-Style Coordinate System:</div>
          <div>
            • <span className="text-red-600">Red</span> = X-axis (solid positive, dotted negative)
          </div>
          <div>
            • <span className="text-green-600">Green</span> = Y-axis (solid positive, dotted
            negative)
          </div>
          <div>
            • <span className="text-blue-600">Blue</span> = Z-axis (solid positive, dotted negative)
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Status: {axisOverlayState.isInitialized ? 'Initialized' : 'Not Initialized'}</div>
          <div>Zoom Level: {axisOverlayState.currentZoomLevel.toFixed(1)}</div>
          {axisOverlayState.error && (
            <div className="text-red-500">Error: {axisOverlayState.error.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
