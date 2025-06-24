/**
 * @file R3F Scene Controls
 * 
 * Enhanced scene controls for React Three Fiber with advanced material controls,
 * lighting options, and CSG-specific settings. Provides a comprehensive interface
 * for controlling 3D scene appearance and behavior.
 * 
 * Features:
 * - Advanced material controls (wireframe, transparency, colors)
 * - Professional lighting setup (three-point lighting system)
 * - CSG operation visualization modes
 * - Camera controls and presets
 * - Performance monitoring and optimization
 * - Glass morphism UI with 8px grid system
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { ProcessingProgress } from '../../../r3f-csg/types/r3f-csg-types';
import './r3f-scene-controls.css';

// ============================================================================
// Component Props and Types
// ============================================================================

/**
 * Material configuration for scene objects
 */
export interface MaterialConfig {
  readonly wireframe: boolean;
  readonly transparent: boolean;
  readonly opacity: number;
  readonly color: string;
  readonly metalness: number;
  readonly roughness: number;
  readonly emissive: string;
  readonly emissiveIntensity: number;
}

/**
 * Lighting configuration for the scene
 */
export interface LightingConfig {
  readonly enableAmbient: boolean;
  readonly ambientIntensity: number;
  readonly ambientColor: string;
  readonly enableDirectional: boolean;
  readonly directionalIntensity: number;
  readonly directionalColor: string;
  readonly directionalPosition: [number, number, number];
  readonly enablePoint: boolean;
  readonly pointIntensity: number;
  readonly pointColor: string;
  readonly pointPosition: [number, number, number];
  readonly enableShadows: boolean;
}

/**
 * Camera configuration and presets
 */
export interface CameraConfig {
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly fov: number;
  readonly near: number;
  readonly far: number;
  readonly enableControls: boolean;
  readonly autoRotate: boolean;
  readonly autoRotateSpeed: number;
}

/**
 * CSG visualization modes
 */
export type CSGVisualizationMode = 
  | 'solid' 
  | 'wireframe' 
  | 'transparent' 
  | 'exploded' 
  | 'cross-section'
  | 'debug';

/**
 * Scene environment settings
 */
export interface EnvironmentConfig {
  readonly background: string;
  readonly enableFog: boolean;
  readonly fogColor: string;
  readonly fogNear: number;
  readonly fogFar: number;
  readonly enableGrid: boolean;
  readonly gridSize: number;
  readonly gridDivisions: number;
  readonly enableAxes: boolean;
  readonly axesSize: number;
}

/**
 * Props for R3F Scene Controls component
 */
export interface R3FSceneControlsProps {
  readonly scene?: THREE.Scene | undefined;
  readonly camera?: THREE.Camera | undefined;
  readonly meshes?: readonly THREE.Mesh[];
  readonly onMaterialChange?: (config: MaterialConfig) => void;
  readonly onLightingChange?: (config: LightingConfig) => void;
  readonly onCameraChange?: (config: CameraConfig) => void;
  readonly onEnvironmentChange?: (config: EnvironmentConfig) => void;
  readonly onCSGModeChange?: (mode: CSGVisualizationMode) => void;
  readonly onExportScene?: (format: 'gltf' | 'obj' | 'stl') => void;
  readonly onResetScene?: () => void;
  readonly conversionProgress?: ProcessingProgress | null;
  readonly isProcessing?: boolean;
  readonly className?: string;
  readonly disabled?: boolean;
}

// ============================================================================
// Default Configurations
// ============================================================================

const DEFAULT_MATERIAL_CONFIG: MaterialConfig = {
  wireframe: false,
  transparent: false,
  opacity: 1.0,
  color: '#4f46e5',
  metalness: 0.1,
  roughness: 0.4,
  emissive: '#000000',
  emissiveIntensity: 0.0
} as const;

const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
  enableAmbient: true,
  ambientIntensity: 0.4,
  ambientColor: '#ffffff',
  enableDirectional: true,
  directionalIntensity: 1.0,
  directionalColor: '#ffffff',
  directionalPosition: [10, 10, 5],
  enablePoint: true,
  pointIntensity: 0.5,
  pointColor: '#ffffff',
  pointPosition: [-5, 5, 5],
  enableShadows: true
} as const;

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  position: [15, 15, 15],
  target: [0, 0, 0],
  fov: 60,
  near: 0.1,
  far: 1000,
  enableControls: true,
  autoRotate: false,
  autoRotateSpeed: 1.0
} as const;

const DEFAULT_ENVIRONMENT_CONFIG: EnvironmentConfig = {
  background: '#2c3e50',
  enableFog: false,
  fogColor: '#2c3e50',
  fogNear: 50,
  fogFar: 200,
  enableGrid: true,
  gridSize: 20,
  gridDivisions: 20,
  enableAxes: true,
  axesSize: 5
} as const;

// ============================================================================
// Camera Presets
// ============================================================================

const CAMERA_PRESETS = {
  front: { position: [0, 0, 20], target: [0, 0, 0], name: 'Front View' },
  back: { position: [0, 0, -20], target: [0, 0, 0], name: 'Back View' },
  left: { position: [-20, 0, 0], target: [0, 0, 0], name: 'Left View' },
  right: { position: [20, 0, 0], target: [0, 0, 0], name: 'Right View' },
  top: { position: [0, 20, 0], target: [0, 0, 0], name: 'Top View' },
  bottom: { position: [0, -20, 0], target: [0, 0, 0], name: 'Bottom View' },
  isometric: { position: [15, 15, 15], target: [0, 0, 0], name: 'Isometric' },
  perspective: { position: [20, 10, 20], target: [0, 0, 0], name: 'Perspective' }
} as const;

// ============================================================================
// R3F Scene Controls Component
// ============================================================================

/**
 * R3F Scene Controls component
 * 
 * Provides comprehensive controls for React Three Fiber scenes including
 * material properties, lighting setup, camera controls, and CSG-specific
 * visualization modes.
 */
export const R3FSceneControls: React.FC<R3FSceneControlsProps> = ({
  scene,
  camera,
  meshes = [],
  onMaterialChange,
  onLightingChange,
  onCameraChange,
  onEnvironmentChange,
  onCSGModeChange,
  onExportScene,
  onResetScene,
  conversionProgress,
  isProcessing = false,
  className = '',
  disabled = false
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'material' | 'lighting' | 'camera' | 'environment' | 'csg'>('material');
  const [materialConfig, setMaterialConfig] = useState<MaterialConfig>(DEFAULT_MATERIAL_CONFIG);
  const [lightingConfig, setLightingConfig] = useState<LightingConfig>(DEFAULT_LIGHTING_CONFIG);
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>(DEFAULT_CAMERA_CONFIG);
  const [environmentConfig, setEnvironmentConfig] = useState<EnvironmentConfig>(DEFAULT_ENVIRONMENT_CONFIG);
  const [csgMode, setCSGMode] = useState<CSGVisualizationMode>('solid');
  const [isExpanded, setIsExpanded] = useState(true);

  // Handle material configuration changes
  const handleMaterialChange = useCallback((updates: Partial<MaterialConfig>) => {
    const newConfig = { ...materialConfig, ...updates };
    setMaterialConfig(newConfig);
    if (onMaterialChange) {
      onMaterialChange(newConfig);
    }
  }, [materialConfig, onMaterialChange]);

  // Handle lighting configuration changes
  const handleLightingChange = useCallback((updates: Partial<LightingConfig>) => {
    const newConfig = { ...lightingConfig, ...updates };
    setLightingConfig(newConfig);
    if (onLightingChange) {
      onLightingChange(newConfig);
    }
  }, [lightingConfig, onLightingChange]);

  // Handle camera configuration changes
  const handleCameraChange = useCallback((updates: Partial<CameraConfig>) => {
    const newConfig = { ...cameraConfig, ...updates };
    setCameraConfig(newConfig);
    if (onCameraChange) {
      onCameraChange(newConfig);
    }
  }, [cameraConfig, onCameraChange]);

  // Handle environment configuration changes
  const handleEnvironmentChange = useCallback((updates: Partial<EnvironmentConfig>) => {
    const newConfig = { ...environmentConfig, ...updates };
    setEnvironmentConfig(newConfig);
    if (onEnvironmentChange) {
      onEnvironmentChange(newConfig);
    }
  }, [environmentConfig, onEnvironmentChange]);

  // Handle CSG mode changes
  const handleCSGModeChange = useCallback((mode: CSGVisualizationMode) => {
    setCSGMode(mode);
    if (onCSGModeChange) {
      onCSGModeChange(mode);
    }
  }, [onCSGModeChange]);

  // Handle camera preset selection
  const handleCameraPreset = useCallback((presetKey: keyof typeof CAMERA_PRESETS) => {
    const preset = CAMERA_PRESETS[presetKey];
    handleCameraChange({
      position: preset.position as [number, number, number],
      target: preset.target as [number, number, number]
    });
  }, [handleCameraChange]);

  // Scene statistics
  const sceneStats = useMemo(() => {
    if (!scene || !meshes) return null;
    
    let vertexCount = 0;
    let triangleCount = 0;
    
    meshes.forEach(mesh => {
      if (mesh.geometry) {
        const positions = mesh.geometry.attributes.position;
        if (positions) {
          vertexCount += positions.count;
          triangleCount += positions.count / 3;
        }
      }
    });
    
    return {
      meshCount: meshes.length,
      vertexCount,
      triangleCount: Math.floor(triangleCount),
      memoryEstimate: vertexCount * 12 + triangleCount * 6 // Rough estimate in bytes
    };
  }, [scene, meshes]);

  return (
    <div className={`r3f-scene-controls ${className} ${disabled ? 'disabled' : ''}`}>
      {/* Header */}
      <div className="controls-header">
        <div className="header-content">
          <h3 className="controls-title">
            <span className="title-icon">🎛️</span>
            Scene Controls
          </h3>
          <div className="header-actions">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              disabled={disabled}
              aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}
            >
              {isExpanded ? '🔽' : '▶️'}
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        {sceneStats && (
          <div className="quick-stats">
            <span className="stat-item">Meshes: {sceneStats.meshCount}</span>
            <span className="stat-item">Vertices: {sceneStats.vertexCount.toLocaleString()}</span>
            <span className="stat-item">Triangles: {sceneStats.triangleCount.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="controls-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            {[
              { key: 'material', label: 'Material', icon: '🎨' },
              { key: 'lighting', label: 'Lighting', icon: '💡' },
              { key: 'camera', label: 'Camera', icon: '📷' },
              { key: 'environment', label: 'Environment', icon: '🌍' },
              { key: 'csg', label: 'CSG', icon: '🔧' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                disabled={disabled}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Material Controls */}
            {activeTab === 'material' && (
              <div className="control-section">
                <h4 className="section-title">Material Properties</h4>
                
                <div className="control-grid">
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={materialConfig.wireframe}
                        onChange={(e) => handleMaterialChange({ wireframe: e.target.checked })}
                        disabled={disabled}
                      />
                      Wireframe Mode
                    </label>
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={materialConfig.transparent}
                        onChange={(e) => handleMaterialChange({ transparent: e.target.checked })}
                        disabled={disabled}
                      />
                      Transparent
                    </label>
                  </div>
                  
                  <div className="control-group">
                    <label htmlFor="material-color-input" className="control-label">Color</label>
                    <input
                      id="material-color-input"
                      type="color"
                      value={materialConfig.color}
                      onChange={(e) => handleMaterialChange({ color: e.target.value })}
                      disabled={disabled}
                      className="color-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      Opacity: {materialConfig.opacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialConfig.opacity}
                      onChange={(e) => handleMaterialChange({ opacity: parseFloat(e.target.value) })}
                      disabled={disabled}
                      className="range-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      Metalness: {materialConfig.metalness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialConfig.metalness}
                      onChange={(e) => handleMaterialChange({ metalness: parseFloat(e.target.value) })}
                      disabled={disabled}
                      className="range-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      Roughness: {materialConfig.roughness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={materialConfig.roughness}
                      onChange={(e) => handleMaterialChange({ roughness: parseFloat(e.target.value) })}
                      disabled={disabled}
                      className="range-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Lighting Controls */}
            {activeTab === 'lighting' && (
              <div className="control-section">
                <h4 className="section-title">Lighting Setup</h4>
                
                <div className="control-grid">
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={lightingConfig.enableAmbient}
                        onChange={(e) => handleLightingChange({ enableAmbient: e.target.checked })}
                        disabled={disabled}
                      />
                      Ambient Light
                    </label>
                  </div>
                  
                  {lightingConfig.enableAmbient && (
                    <div className="control-group">
                      <label className="control-label">
                        Ambient Intensity: {lightingConfig.ambientIntensity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={lightingConfig.ambientIntensity}
                        onChange={(e) => handleLightingChange({ ambientIntensity: parseFloat(e.target.value) })}
                        disabled={disabled}
                        className="range-input"
                      />
                    </div>
                  )}
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={lightingConfig.enableDirectional}
                        onChange={(e) => handleLightingChange({ enableDirectional: e.target.checked })}
                        disabled={disabled}
                      />
                      Directional Light
                    </label>
                  </div>
                  
                  {lightingConfig.enableDirectional && (
                    <div className="control-group">
                      <label className="control-label">
                        Directional Intensity: {lightingConfig.directionalIntensity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={lightingConfig.directionalIntensity}
                        onChange={(e) => handleLightingChange({ directionalIntensity: parseFloat(e.target.value) })}
                        disabled={disabled}
                        className="range-input"
                      />
                    </div>
                  )}
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={lightingConfig.enableShadows}
                        onChange={(e) => handleLightingChange({ enableShadows: e.target.checked })}
                        disabled={disabled}
                      />
                      Enable Shadows
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Controls */}
            {activeTab === 'camera' && (
              <div className="control-section">
                <h4 className="section-title">Camera Controls</h4>
                
                <div className="camera-presets">
                  <h5 className="subsection-title">View Presets</h5>
                  <div className="preset-grid">
                    {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => handleCameraPreset(key as keyof typeof CAMERA_PRESETS)}
                        disabled={disabled}
                        className="preset-button"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="control-grid">
                  <div className="control-group">
                    <label className="control-label">
                      FOV: {cameraConfig.fov}°
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="1"
                      value={cameraConfig.fov}
                      onChange={(e) => handleCameraChange({ fov: parseInt(e.target.value) })}
                      disabled={disabled}
                      className="range-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={cameraConfig.autoRotate}
                        onChange={(e) => handleCameraChange({ autoRotate: e.target.checked })}
                        disabled={disabled}
                      />
                      Auto Rotate
                    </label>
                  </div>
                  
                  {cameraConfig.autoRotate && (
                    <div className="control-group">
                      <label className="control-label">
                        Rotation Speed: {cameraConfig.autoRotateSpeed.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={cameraConfig.autoRotateSpeed}
                        onChange={(e) => handleCameraChange({ autoRotateSpeed: parseFloat(e.target.value) })}
                        disabled={disabled}
                        className="range-input"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Environment Controls */}
            {activeTab === 'environment' && (
              <div className="control-section">
                <h4 className="section-title">Environment Settings</h4>
                
                <div className="control-grid">
                  <div className="control-group">
                    <label htmlFor="environment-background-input" className="control-label">Background Color</label>
                    <input
                      id="environment-background-input"
                      type="color"
                      value={environmentConfig.background}
                      onChange={(e) => handleEnvironmentChange({ background: e.target.value })}
                      disabled={disabled}
                      className="color-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={environmentConfig.enableGrid}
                        onChange={(e) => handleEnvironmentChange({ enableGrid: e.target.checked })}
                        disabled={disabled}
                      />
                      Show Grid
                    </label>
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={environmentConfig.enableAxes}
                        onChange={(e) => handleEnvironmentChange({ enableAxes: e.target.checked })}
                        disabled={disabled}
                      />
                      Show Axes
                    </label>
                  </div>
                  
                  <div className="control-group">
                    <label className="control-label">
                      <input
                        type="checkbox"
                        checked={environmentConfig.enableFog}
                        onChange={(e) => handleEnvironmentChange({ enableFog: e.target.checked })}
                        disabled={disabled}
                      />
                      Enable Fog
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* CSG Controls */}
            {activeTab === 'csg' && (
              <div className="control-section">
                <h4 className="section-title">CSG Visualization</h4>
                
                <div className="csg-modes">
                  <h5 className="subsection-title">Visualization Mode</h5>
                  <div className="mode-grid">
                    {[
                      { key: 'solid', label: 'Solid', icon: '🧊' },
                      { key: 'wireframe', label: 'Wireframe', icon: '🕸️' },
                      { key: 'transparent', label: 'Transparent', icon: '👻' },
                      { key: 'exploded', label: 'Exploded', icon: '💥' },
                      { key: 'cross-section', label: 'Cross Section', icon: '✂️' },
                      { key: 'debug', label: 'Debug', icon: '🐛' }
                    ].map(mode => (
                      <button
                        key={mode.key}
                        onClick={() => handleCSGModeChange(mode.key as CSGVisualizationMode)}
                        className={`mode-button ${csgMode === mode.key ? 'active' : ''}`}
                        disabled={disabled}
                      >
                        <span className="mode-icon">{mode.icon}</span>
                        <span className="mode-label">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Export Options */}
                <div className="export-section">
                  <h5 className="subsection-title">Export Scene</h5>
                  <div className="export-buttons">
                    {['gltf', 'obj', 'stl'].map(format => (
                      <button
                        key={format}
                        onClick={() => onExportScene?.(format as 'gltf' | 'obj' | 'stl')}
                        disabled={disabled || !meshes.length}
                        className="export-button"
                      >
                        Export {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conversion Progress */}
          {conversionProgress && (
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-message">{conversionProgress.message}</span>
                <span className="progress-percentage">{conversionProgress.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${conversionProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={onResetScene}
              disabled={disabled || isProcessing}
              className="action-button reset"
            >
              <span className="button-icon">🔄</span>
              Reset Scene
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Default export
export default R3FSceneControls;
