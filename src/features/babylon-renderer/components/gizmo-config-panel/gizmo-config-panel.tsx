/**
 * @file Gizmo Configuration Panel Component
 * @description User interface for configuring orientation gizmo appearance and behavior.
 * Provides intuitive controls for visibility, position, size, colors, and animation settings
 * with real-time preview and Zustand store integration.
 *
 * @architectural_decision
 * **Controlled Component Pattern**: This component is fully controlled by the Zustand store,
 * ensuring consistent state management and enabling real-time updates across the application.
 * All configuration changes are immediately reflected in the gizmo display.
 *
 * **Accessibility First**: Implements WCAG 2.1 AA standards with proper ARIA labels,
 * keyboard navigation, and screen reader support for inclusive user experience.
 *
 * @example Basic Usage
 * ```tsx
 * import { GizmoConfigPanel } from './gizmo-config-panel';
 *
 * function SettingsDialog() {
 *   return (
 *     <div className="settings-panel">
 *       <GizmoConfigPanel
 *         onConfigChange={(config) => console.log('Config updated:', config)}
 *         className="gizmo-settings"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Advanced Usage with Custom Styling
 * ```tsx
 * <GizmoConfigPanel
 *   onConfigChange={handleConfigChange}
 *   onVisibilityToggle={handleVisibilityToggle}
 *   className="custom-panel"
 *   showAdvancedOptions={true}
 *   enablePreview={true}
 * />
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type React from 'react';
import { useCallback, useState } from 'react';
import type { GizmoConfig, GizmoPosition } from '@/features/babylon-renderer/types';
import { DEFAULT_GIZMO_CONFIG } from '@/features/babylon-renderer/types';
import {
  selectGizmoConfig,
  selectGizmoIsVisible,
  selectGizmoPosition,
  useAppStore,
} from '@/features/store';
import { createLogger } from '@/shared';

const logger = createLogger('GizmoConfigPanel');

/**
 * Gizmo configuration panel properties
 */
export interface GizmoConfigPanelProps {
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly showAdvancedOptions?: boolean;
  readonly enablePreview?: boolean;
  readonly onConfigChange?: (config: GizmoConfig) => void;
  readonly onVisibilityToggle?: (visible: boolean) => void;
  readonly onPositionChange?: (position: GizmoPosition) => void;
}

/**
 * Position options for the gizmo
 */
const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left', icon: '↖' },
  { value: 'top-right', label: 'Top Right', icon: '↗' },
  { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
  { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
] as const;

/**
 * Size presets for quick selection
 */
const SIZE_PRESETS = [
  { value: 60, label: 'Small' },
  { value: 90, label: 'Medium' },
  { value: 120, label: 'Large' },
  { value: 150, label: 'Extra Large' },
] as const;

/**
 * Color presets for axis colors
 */
const COLOR_PRESETS = {
  default: {
    x: ['#ff4444', '#cc3333'],
    y: ['#44ff44', '#33cc33'],
    z: ['#4444ff', '#3333cc'],
  },
  vibrant: {
    x: ['#ff0000', '#dd0000'],
    y: ['#00ff00', '#00dd00'],
    z: ['#0000ff', '#0000dd'],
  },
  pastel: {
    x: ['#ffaaaa', '#dd8888'],
    y: ['#aaffaa', '#88dd88'],
    z: ['#aaaaff', '#8888dd'],
  },
  monochrome: {
    x: ['#ffffff', '#cccccc'],
    y: ['#bbbbbb', '#999999'],
    z: ['#888888', '#666666'],
  },
} as const;

/**
 * Gizmo Configuration Panel Component
 *
 * Provides comprehensive controls for customizing the orientation gizmo
 * with real-time preview and accessibility features.
 */
export const GizmoConfigPanel: React.FC<GizmoConfigPanelProps> = ({
  className = '',
  style,
  showAdvancedOptions = false,
  onConfigChange,
  onVisibilityToggle,
  onPositionChange,
}) => {
  // Local state for advanced options toggle
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);

  // Store subscriptions
  const isVisible = useAppStore(selectGizmoIsVisible);
  const position = useAppStore(selectGizmoPosition);
  const config = useAppStore(selectGizmoConfig);

  // Store actions
  const { setGizmoVisibility, setGizmoPosition, updateGizmoConfig } = useAppStore();

  // Ensure we have a valid config
  const currentConfig = config || DEFAULT_GIZMO_CONFIG;

  /**
   * Handle visibility toggle
   */
  const handleVisibilityToggle = useCallback(() => {
    const newVisibility = !isVisible;
    setGizmoVisibility(newVisibility);
    onVisibilityToggle?.(newVisibility);
    logger.debug(`[DEBUG][GizmoConfigPanel] Visibility toggled: ${newVisibility}`);
  }, [isVisible, setGizmoVisibility, onVisibilityToggle]);

  /**
   * Handle position change
   */
  const handlePositionChange = useCallback(
    (newPosition: GizmoPosition) => {
      setGizmoPosition(newPosition);
      onPositionChange?.(newPosition);
      logger.debug(`[DEBUG][GizmoConfigPanel] Position changed: ${newPosition}`);
    },
    [setGizmoPosition, onPositionChange]
  );

  /**
   * Handle configuration updates
   */
  const handleConfigUpdate = useCallback(
    (updates: Partial<GizmoConfig>) => {
      const newConfig = { ...currentConfig, ...updates };
      updateGizmoConfig(updates);
      onConfigChange?.(newConfig);
      logger.debug('[DEBUG][GizmoConfigPanel] Configuration updated:', updates);
    },
    [currentConfig, updateGizmoConfig, onConfigChange]
  );

  /**
   * Handle size change
   */
  const handleSizeChange = useCallback(
    (size: number) => {
      handleConfigUpdate({ size });
    },
    [handleConfigUpdate]
  );

  /**
   * Handle color preset selection
   */
  const handleColorPresetChange = useCallback(
    (presetName: keyof typeof COLOR_PRESETS) => {
      const colors = COLOR_PRESETS[presetName];
      handleConfigUpdate({ colors });
    },
    [handleConfigUpdate]
  );

  /**
   * Handle individual color changes
   */
  const handleColorChange = useCallback(
    (axis: 'x' | 'y' | 'z', colorIndex: 0 | 1, color: string) => {
      const newColors = {
        ...currentConfig.colors,
        [axis]: [
          colorIndex === 0 ? color : currentConfig.colors[axis][0],
          colorIndex === 1 ? color : currentConfig.colors[axis][1],
        ],
      };
      handleConfigUpdate({ colors: newColors });
    },
    [currentConfig.colors, handleConfigUpdate]
  );

  /**
   * Reset to default configuration
   */
  const handleReset = useCallback(() => {
    updateGizmoConfig(DEFAULT_GIZMO_CONFIG);
    onConfigChange?.(DEFAULT_GIZMO_CONFIG);
    logger.debug('[DEBUG][GizmoConfigPanel] Configuration reset to defaults');
  }, [updateGizmoConfig, onConfigChange]);

  return (
    <section
      className={`gizmo-config-panel bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
      style={style}
      aria-label="Orientation Gizmo Configuration"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Orientation Gizmo Settings
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Reset to default settings"
        >
          Reset
        </button>
      </div>

      {/* Visibility Toggle */}
      <div className="mb-6">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={handleVisibilityToggle}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            aria-describedby="visibility-description"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Show Orientation Gizmo
          </span>
        </label>
        <p id="visibility-description" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Toggle the visibility of the 3D orientation gizmo
        </p>
      </div>

      {/* Position Selection */}
      <div className="mb-6">
        <h4 className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Position</h4>
        <div className="grid grid-cols-2 gap-2">
          {POSITION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePositionChange(option.value as GizmoPosition)}
              className={`p-3 text-sm border rounded-lg transition-colors ${
                position === option.value
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={position === option.value}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{option.icon}</span>
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div className="mb-6">
        <h4 className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Size</h4>
        <div className="space-y-3">
          {/* Size Presets */}
          <div className="flex space-x-2">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleSizeChange(preset.value)}
                className={`px-3 py-1 text-xs border rounded transition-colors ${
                  currentConfig.size === preset.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Size Slider */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8">60</span>
            <input
              type="range"
              min="60"
              max="200"
              value={currentConfig.size}
              onChange={(e) => handleSizeChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              aria-label="Custom gizmo size"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8">200</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white w-8">
              {currentConfig.size}
            </span>
          </div>
        </div>
      </div>

      {/* Color Presets */}
      <div className="mb-6">
        <h4 className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Color Theme
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(COLOR_PRESETS).map(([presetName, colors]) => (
            <button
              key={presetName}
              type="button"
              onClick={() => handleColorPresetChange(presetName as keyof typeof COLOR_PRESETS)}
              className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label={`Apply ${presetName} color theme`}
            >
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.x[0] }}
                    aria-hidden="true"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.y[0] }}
                    aria-hidden="true"
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.z[0] }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-xs capitalize text-gray-700 dark:text-gray-300">
                  {presetName}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          aria-expanded={showAdvanced}
          aria-controls="advanced-options"
        >
          <span>{showAdvanced ? '▼' : '▶'}</span>
          <span>Advanced Options</span>
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div id="advanced-options" className="space-y-4 border-t pt-4">
          {/* Individual Color Controls */}
          <div>
            <h4 className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              Custom Colors
            </h4>
            <div className="space-y-3">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="flex items-center space-x-3">
                  <label
                    htmlFor={`${axis}-primary-color`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 w-4 uppercase"
                  >
                    {axis}:
                  </label>
                  <input
                    id={`${axis}-primary-color`}
                    type="color"
                    value={currentConfig.colors[axis][0]}
                    onChange={(e) => handleColorChange(axis, 0, e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    aria-label={`${axis.toUpperCase()} axis primary color`}
                  />
                  <input
                    id={`${axis}-secondary-color`}
                    type="color"
                    value={currentConfig.colors[axis][1]}
                    onChange={(e) => handleColorChange(axis, 1, e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    aria-label={`${axis.toUpperCase()} axis secondary color`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-3">
            <label htmlFor="show-secondary-axes" className="flex items-center space-x-3">
              <input
                id="show-secondary-axes"
                type="checkbox"
                checked={currentConfig.showSecondary}
                onChange={(e) => handleConfigUpdate({ showSecondary: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show secondary axes</span>
            </label>

            <div className="flex items-center space-x-3">
              <label htmlFor="gizmo-padding" className="text-sm text-gray-700 dark:text-gray-300">
                Padding:
              </label>
              <input
                id="gizmo-padding"
                type="range"
                min="5"
                max="20"
                value={currentConfig.padding}
                onChange={(e) => handleConfigUpdate({ padding: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                aria-label="Gizmo padding"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 w-8">
                {currentConfig.padding}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
