/**
 * @file Scene Controls Component
 * 
 * Interactive controls for Babylon.js scene manipulation
 * Provides wireframe toggle, camera controls, lighting, and background settings
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { SceneControlsProps } from '../../types/babylon-types';
import './scene-controls.css';

/**
 * SceneControls Component
 * 
 * Responsible for:
 * - Providing interactive controls for scene manipulation
 * - Wireframe mode toggle
 * - Camera position reset
 * - Lighting controls
 * - Background color picker
 * - Collapsible interface
 * 
 * @param props - Scene controls configuration and event handlers
 * @returns JSX element containing the controls interface
 * 
 * @example
 * ```tsx
 * <SceneControls
 *   scene={scene}
 *   wireframeEnabled={false}
 *   lightingEnabled={true}
 *   backgroundColor="#2c3e50"
 *   onWireframeToggle={() => toggleWireframe()}
 *   onCameraReset={() => resetCamera()}
 *   onLightingToggle={() => toggleLighting()}
 *   onBackgroundColorChange={(color) => setBackgroundColor(color)}
 * />
 * ```
 */
export function SceneControls({
  scene,
  className = '',
  title = 'Scene Controls',
  wireframeEnabled = false,
  lightingEnabled = true,
  backgroundColor = '#2c3e50',
  defaultCollapsed = false,
  onWireframeToggle,
  onCameraReset,
  onLightingToggle,
  onBackgroundColorChange,
  'aria-label': ariaLabel = 'Scene Controls',
  ...props
}: SceneControlsProps): React.JSX.Element {
  console.log('[INIT] Initializing SceneControls component');

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Derived state
  const isSceneValid = useMemo(() => {
    return scene && !scene.isDisposed;
  }, [scene]);

  const cameraPosition = useMemo(() => {
    if (!isSceneValid || !scene || !scene.cameras.length) {
      return 'No camera';
    }

    const camera = scene.cameras[0] as BABYLON.ArcRotateCamera;
    if (camera instanceof BABYLON.ArcRotateCamera) {
      return `α: ${camera.alpha.toFixed(2)}, β: ${camera.beta.toFixed(2)}, r: ${camera.radius.toFixed(2)}`;
    }
    
    return 'Unknown camera type';
  }, [isSceneValid, scene]);

  // Event handlers
  const handleWireframeToggle = useCallback(() => {
    console.log('[DEBUG] Wireframe toggle clicked');
    if (onWireframeToggle) {
      onWireframeToggle();
    }
  }, [onWireframeToggle]);

  const handleCameraReset = useCallback(() => {
    console.log('[DEBUG] Camera reset clicked');
    if (onCameraReset) {
      onCameraReset();
    }
  }, [onCameraReset]);

  const handleLightingToggle = useCallback(() => {
    console.log('[DEBUG] Lighting toggle clicked');
    if (onLightingToggle) {
      onLightingToggle();
    }
  }, [onLightingToggle]);

  const handleBackgroundColorChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    console.log('[DEBUG] Background color changed to:', color);
    if (onBackgroundColorChange) {
      onBackgroundColorChange(color);
    }
  }, [onBackgroundColorChange]);

  const handleCollapseToggle = useCallback(() => {
    console.log('[DEBUG] Controls collapse toggled');
    setIsCollapsed(prev => !prev);
  }, []);

  // Combine CSS classes
  const controlsClasses = ['scene-controls', className].filter(Boolean).join(' ');

  return (
    <div
      className={controlsClasses}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      {/* Header with title and collapse button */}
      <div className="scene-controls__header">
        <h3 className="scene-controls__title">{title}</h3>
        <button
          type="button"
          className="scene-controls__collapse-btn"
          onClick={handleCollapseToggle}
          aria-label={isCollapsed ? 'Expand controls' : 'Collapse controls'}
          tabIndex={0}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {/* Controls content */}
      <div
        className={`scene-controls__content ${isCollapsed ? 'scene-controls__content--collapsed' : ''}`}
        data-testid="controls-content"
        style={{ display: isCollapsed ? 'none' : 'block' }}
      >
        {/* Wireframe Controls */}
        <div className="scene-controls__section">
          <h4 className="scene-controls__section-title">Rendering</h4>
          <div className="scene-controls__control-group">
            <button
              type="button"
              className={`scene-controls__button ${wireframeEnabled ? 'scene-controls__button--active' : ''}`}
              onClick={handleWireframeToggle}
              disabled={!isSceneValid}
              aria-label={`Wireframe ${wireframeEnabled ? 'On' : 'Off'}`}
              tabIndex={0}
            >
              Wireframe: {wireframeEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="scene-controls__section">
          <h4 className="scene-controls__section-title">Camera</h4>
          <div className="scene-controls__control-group">
            <button
              type="button"
              className="scene-controls__button"
              onClick={handleCameraReset}
              disabled={!isSceneValid}
              aria-label="Reset Camera"
              tabIndex={0}
            >
              Reset Camera
            </button>
            <div className="scene-controls__info">
              <span className="scene-controls__info-label">Camera Position:</span>
              <span className="scene-controls__info-value">{cameraPosition}</span>
            </div>
          </div>
        </div>

        {/* Lighting Controls */}
        <div className="scene-controls__section">
          <h4 className="scene-controls__section-title">Lighting</h4>
          <div className="scene-controls__control-group">
            <button
              type="button"
              className={`scene-controls__button ${lightingEnabled ? 'scene-controls__button--active' : ''}`}
              onClick={handleLightingToggle}
              disabled={!isSceneValid}
              aria-label={`Lighting ${lightingEnabled ? 'On' : 'Off'}`}
              tabIndex={0}
            >
              Lighting: {lightingEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Background Controls */}
        <div className="scene-controls__section">
          <h4 className="scene-controls__section-title">Background</h4>
          <div className="scene-controls__control-group">
            <label className="scene-controls__label">
              <span className="scene-controls__label-text">Background Color:</span>
              <input
                type="color"
                className="scene-controls__color-input"
                value={backgroundColor}
                onChange={handleBackgroundColorChange}
                disabled={!isSceneValid}
                aria-label="Background Color"
                tabIndex={0}
              />
            </label>
          </div>
        </div>

        {/* Scene Status */}
        <div className="scene-controls__section">
          <h4 className="scene-controls__section-title">Status</h4>
          <div className="scene-controls__control-group">
            <div className="scene-controls__info">
              <span className="scene-controls__info-label">Scene:</span>
              <span className={`scene-controls__info-value ${isSceneValid ? 'scene-controls__info-value--success' : 'scene-controls__info-value--error'}`}>
                {isSceneValid ? 'Ready' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export types for convenience
export type { SceneControlsProps };
