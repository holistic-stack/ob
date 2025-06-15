/**
 * @file Debug Panel Component
 * 
 * Interactive debug panel for Babylon.js scene inspection and performance monitoring
 * Provides comprehensive debugging information, performance metrics, and scene analysis
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { DebugPanelProps } from '../../types/babylon-types';
import './debug-panel.css';

/**
 * DebugPanel Component
 * 
 * Responsible for:
 * - Displaying comprehensive scene debugging information
 * - Real-time performance monitoring and metrics
 * - Scene analysis with mesh, camera, and lighting details
 * - Interactive debug controls and export functionality
 * - Collapsible sections for organized information display
 * - Search and filtering capabilities for large scenes
 * 
 * @param props - Debug panel configuration and event handlers
 * @returns JSX element containing the debug panel interface
 * 
 * @example
 * ```tsx
 * <DebugPanel
 *   scene={scene}
 *   showSceneInfo={true}
 *   showPerformanceMetrics={true}
 *   showMeshDetails={true}
 *   showCameraInfo={true}
 *   showLightingInfo={true}
 *   updateInterval={100}
 *   onRefresh={() => refreshDebugInfo()}
 *   onExportReport={(report) => exportReport(report)}
 * />
 * ```
 */
export function DebugPanel({
  scene,
  className = '',
  title = 'Debug Panel',
  showSceneInfo = false,
  showPerformanceMetrics = false,
  showMeshDetails = false,
  showCameraInfo = false,
  showLightingInfo = false,
  showMemoryUsage = false,
  showRenderStats = false,
  showDebugControls = false,
  collapsibleSections = false,
  defaultCollapsed = false,
  searchable = false,
  updateInterval = 1000,
  onRefresh,
  onExportReport,
  'aria-label': ariaLabel = 'Debug Panel',
  ...props
}: DebugPanelProps): React.JSX.Element {
  console.log('[INIT] Initializing DebugPanel component');

  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    defaultCollapsed ? new Set(['scene-info', 'performance', 'mesh-details', 'camera-info', 'lighting-info']) : new Set()
  );
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    activeMeshes: 0,
    memoryUsage: 0
  });

  // Derived state
  const isSceneValid = useMemo(() => {
    return scene && !scene.isDisposed;
  }, [scene]);

  const sceneInfo = useMemo(() => {
    if (!isSceneValid) {
      return null;
    }

    return {
      ready: scene.isReady(),
      meshCount: scene.meshes.length,
      lightCount: scene.lights.length,
      cameraCount: scene.cameras.length,
      materialCount: scene.materials.length,
      textureCount: scene.textures.length
    };
  }, [isSceneValid, scene]);

  const meshDetails = useMemo(() => {
    if (!isSceneValid) {
      return [];
    }

    return scene.meshes
      .filter(mesh => mesh.name !== '__root__')
      .map(mesh => {
        const geometry = mesh instanceof BABYLON.Mesh ? mesh.geometry : null;
        return {
          name: mesh.name,
          id: mesh.uniqueId,
          visible: mesh.isVisible,
          enabled: mesh.isEnabled(),
          ready: mesh.isReady(),
          vertices: geometry ? geometry.getTotalVertices() : 0,
          indices: geometry ? geometry.getTotalIndices() : 0,
          triangles: geometry ? Math.floor(geometry.getTotalIndices() / 3) : 0,
          position: `${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}`,
          hasMaterial: !!mesh.material
        };
      })
      .filter(mesh => 
        !searchTerm || mesh.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [isSceneValid, scene, searchTerm]);

  const cameraInfo = useMemo(() => {
    if (!isSceneValid || !scene.cameras.length) {
      return null;
    }

    const camera = scene.cameras[0];
    const info: any = {
      name: camera.name,
      type: camera.getClassName(),
      position: `${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`
    };

    if (camera instanceof BABYLON.ArcRotateCamera) {
      info.alpha = camera.alpha.toFixed(2);
      info.beta = camera.beta.toFixed(2);
      info.radius = camera.radius.toFixed(2);
      info.target = `${camera.target.x.toFixed(2)}, ${camera.target.y.toFixed(2)}, ${camera.target.z.toFixed(2)}`;
    }

    return info;
  }, [isSceneValid, scene]);

  const lightingInfo = useMemo(() => {
    if (!isSceneValid) {
      return [];
    }

    return scene.lights.map(light => ({
      name: light.name,
      type: light.getClassName(),
      enabled: light.isEnabled(),
      intensity: light.intensity,
      position: light instanceof BABYLON.DirectionalLight || light instanceof BABYLON.SpotLight || light instanceof BABYLON.PointLight
        ? `${light.position.x.toFixed(2)}, ${light.position.y.toFixed(2)}, ${light.position.z.toFixed(2)}`
        : 'N/A'
    }));
  }, [isSceneValid, scene]);

  // Performance monitoring
  useEffect(() => {
    if (!showPerformanceMetrics || !isSceneValid) {
      return;
    }

    const intervalId = setInterval(() => {
      const engine = scene.getEngine();
      const fps = engine.getFps();
      const frameTime = 1000 / fps;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        fps: Math.round(fps),
        frameTime: Math.round(frameTime * 100) / 100,
        drawCalls: engine.drawCalls,
        activeMeshes: scene.getActiveMeshes().length,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }));
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [showPerformanceMetrics, isSceneValid, scene, updateInterval]);

  // Event handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log('[DEBUG] Debug search term changed to:', value);
    setSearchTerm(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    console.log('[DEBUG] Clearing debug search');
    setSearchTerm('');
  }, []);

  const handleSectionToggle = useCallback((sectionId: string) => {
    console.log('[DEBUG] Toggling debug section:', sectionId);
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('[DEBUG] Refreshing debug information');
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const handleExportReport = useCallback(() => {
    console.log('[DEBUG] Exporting debug report');
    if (onExportReport) {
      const report = {
        timestamp: new Date().toISOString(),
        scene: sceneInfo,
        meshes: meshDetails,
        camera: cameraInfo,
        lighting: lightingInfo,
        performance: performanceMetrics
      };
      onExportReport(report);
    }
  }, [onExportReport, sceneInfo, meshDetails, cameraInfo, lightingInfo, performanceMetrics]);

  // Helper functions
  const isSectionCollapsed = useCallback((sectionId: string) => {
    return collapsibleSections && collapsedSections.has(sectionId);
  }, [collapsibleSections, collapsedSections]);

  const renderSectionHeader = useCallback((sectionId: string, title: string) => {
    if (!collapsibleSections) {
      return <h4 className="debug-panel__section-title">{title}</h4>;
    }

    const isCollapsed = isSectionCollapsed(sectionId);
    return (
      <div className="debug-panel__section-header">
        <h4 className="debug-panel__section-title">{title}</h4>
        <button
          type="button"
          className="debug-panel__section-toggle"
          onClick={() => handleSectionToggle(sectionId)}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${title}`}
          tabIndex={0}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>
    );
  }, [collapsibleSections, isSectionCollapsed, handleSectionToggle]);

  // Combine CSS classes
  const debugPanelClasses = ['debug-panel', className].filter(Boolean).join(' ');

  // Render content based on state
  const renderContent = () => {
    if (!isSceneValid) {
      return (
        <div className="debug-panel__empty">
          <span className="debug-panel__empty-text">
            {scene ? 'Scene not available' : 'No scene available'}
          </span>
        </div>
      );
    }

    return (
      <div className="debug-panel__sections">
        {/* Scene Information */}
        {showSceneInfo && (
          <div className="debug-panel__section">
            {renderSectionHeader('scene-info', 'Scene Information')}
            <div
              className={`debug-panel__section-content ${isSectionCollapsed('scene-info') ? 'debug-panel__section-content--collapsed' : ''}`}
              data-testid="scene-info-content"
              style={{ display: isSectionCollapsed('scene-info') ? 'none' : 'block' }}
            >
              {sceneInfo && (
                <div className="debug-panel__info-grid">
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Scene Ready:</span>
                    <span className={`debug-panel__info-value ${sceneInfo.ready ? 'debug-panel__info-value--success' : 'debug-panel__info-value--error'}`}>
                      {sceneInfo.ready ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Meshes:</span>
                    <span className="debug-panel__info-value">{sceneInfo.meshCount}</span>
                  </div>
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Lights:</span>
                    <span className="debug-panel__info-value">{sceneInfo.lightCount}</span>
                  </div>
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Cameras:</span>
                    <span className="debug-panel__info-value">{sceneInfo.cameraCount}</span>
                  </div>
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Materials:</span>
                    <span className="debug-panel__info-value">{sceneInfo.materialCount}</span>
                  </div>
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Textures:</span>
                    <span className="debug-panel__info-value">{sceneInfo.textureCount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {showPerformanceMetrics && (
          <div className="debug-panel__section">
            {renderSectionHeader('performance', 'Performance Metrics')}
            <div
              className={`debug-panel__section-content ${isSectionCollapsed('performance') ? 'debug-panel__section-content--collapsed' : ''}`}
              style={{ display: isSectionCollapsed('performance') ? 'none' : 'block' }}
            >
              <div className="debug-panel__info-grid">
                <div className="debug-panel__info-item">
                  <span className="debug-panel__info-label">FPS:</span>
                  <span className="debug-panel__info-value">{performanceMetrics.fps}</span>
                </div>
                <div className="debug-panel__info-item">
                  <span className="debug-panel__info-label">Frame Time:</span>
                  <span className="debug-panel__info-value">{performanceMetrics.frameTime}ms</span>
                </div>
                {showRenderStats && (
                  <>
                    <div className="debug-panel__info-item">
                      <span className="debug-panel__info-label">Draw Calls:</span>
                      <span className="debug-panel__info-value">{performanceMetrics.drawCalls}</span>
                    </div>
                    <div className="debug-panel__info-item">
                      <span className="debug-panel__info-label">Active Meshes:</span>
                      <span className="debug-panel__info-value">{performanceMetrics.activeMeshes}</span>
                    </div>
                  </>
                )}
                {showMemoryUsage && performanceMetrics.memoryUsage > 0 && (
                  <div className="debug-panel__info-item">
                    <span className="debug-panel__info-label">Memory:</span>
                    <span className="debug-panel__info-value">
                      {(performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera Information */}
        {showCameraInfo && cameraInfo && (
          <div className="debug-panel__section">
            {renderSectionHeader('camera-info', 'Camera Information')}
            <div
              className={`debug-panel__section-content ${isSectionCollapsed('camera-info') ? 'debug-panel__section-content--collapsed' : ''}`}
              style={{ display: isSectionCollapsed('camera-info') ? 'none' : 'block' }}
            >
              <div className="debug-panel__info-grid">
                <div className="debug-panel__info-item">
                  <span className="debug-panel__info-label">Name:</span>
                  <span className="debug-panel__info-value">{cameraInfo.name}</span>
                </div>
                <div className="debug-panel__info-item">
                  <span className="debug-panel__info-label">Type:</span>
                  <span className="debug-panel__info-value">{cameraInfo.type}</span>
                </div>
                <div className="debug-panel__info-item">
                  <span className="debug-panel__info-label">Position:</span>
                  <span className="debug-panel__info-value">{cameraInfo.position}</span>
                </div>
                {cameraInfo.alpha !== undefined && (
                  <>
                    <div className="debug-panel__info-item">
                      <span className="debug-panel__info-label">Alpha:</span>
                      <span className="debug-panel__info-value">{cameraInfo.alpha}</span>
                    </div>
                    <div className="debug-panel__info-item">
                      <span className="debug-panel__info-label">Beta:</span>
                      <span className="debug-panel__info-value">{cameraInfo.beta}</span>
                    </div>
                    <div className="debug-panel__info-item">
                      <span className="debug-panel__info-label">Radius:</span>
                      <span className="debug-panel__info-value">{cameraInfo.radius}</span>
                    </div>
                    <div className="debug-panel__info-item">
                      <span className="debug-panel__info-label">Target:</span>
                      <span className="debug-panel__info-value">{cameraInfo.target}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lighting Information */}
        {showLightingInfo && lightingInfo.length > 0 && (
          <div className="debug-panel__section">
            {renderSectionHeader('lighting-info', 'Lighting Information')}
            <div
              className={`debug-panel__section-content ${isSectionCollapsed('lighting-info') ? 'debug-panel__section-content--collapsed' : ''}`}
              style={{ display: isSectionCollapsed('lighting-info') ? 'none' : 'block' }}
            >
              <div className="debug-panel__light-list">
                {lightingInfo.map((light, index) => (
                  <div key={index} className="debug-panel__light-item">
                    <div className="debug-panel__light-header">
                      <span className="debug-panel__light-name">{light.name}</span>
                      <span className="debug-panel__light-type">({light.type})</span>
                    </div>
                    <div className="debug-panel__light-details">
                      <span className="debug-panel__light-detail">
                        Intensity: {light.intensity.toFixed(2)}
                      </span>
                      {light.position !== 'N/A' && (
                        <span className="debug-panel__light-detail">
                          Position: {light.position}
                        </span>
                      )}
                      <span className={`debug-panel__light-detail ${light.enabled ? 'debug-panel__light-detail--enabled' : 'debug-panel__light-detail--disabled'}`}>
                        {light.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mesh Details */}
        {showMeshDetails && (
          <div className="debug-panel__section">
            {renderSectionHeader('mesh-details', 'Mesh Details')}
            <div
              className={`debug-panel__section-content ${isSectionCollapsed('mesh-details') ? 'debug-panel__section-content--collapsed' : ''}`}
              style={{ display: isSectionCollapsed('mesh-details') ? 'none' : 'block' }}
            >
              {meshDetails.length === 0 ? (
                <div className="debug-panel__empty-section">
                  <span className="debug-panel__empty-text">
                    {searchTerm ? `No meshes match "${searchTerm}"` : 'No meshes in scene'}
                  </span>
                </div>
              ) : (
                <div className="debug-panel__mesh-list">
                  {meshDetails.map((mesh) => (
                    <div key={mesh.id} className="debug-panel__mesh-item">
                      <div className="debug-panel__mesh-header">
                        <span className="debug-panel__mesh-name">{mesh.name}</span>
                        <button
                          type="button"
                          className="debug-panel__mesh-expand"
                          onClick={() => handleSectionToggle(`mesh-${mesh.id}`)}
                          aria-label={`${isSectionCollapsed(`mesh-${mesh.id}`) ? 'Expand' : 'Collapse'} details for ${mesh.name}`}
                          tabIndex={0}
                        >
                          {isSectionCollapsed(`mesh-${mesh.id}`) ? '▼' : '▲'}
                        </button>
                      </div>
                      {!isSectionCollapsed(`mesh-${mesh.id}`) && (
                        <div className="debug-panel__mesh-details">
                          <div className="debug-panel__info-grid">
                            <div className="debug-panel__info-item">
                              <span className="debug-panel__info-label">Vertices:</span>
                              <span className="debug-panel__info-value">{mesh.vertices}</span>
                            </div>
                            <div className="debug-panel__info-item">
                              <span className="debug-panel__info-label">Triangles:</span>
                              <span className="debug-panel__info-value">{mesh.triangles}</span>
                            </div>
                            <div className="debug-panel__info-item">
                              <span className="debug-panel__info-label">Position:</span>
                              <span className="debug-panel__info-value">{mesh.position}</span>
                            </div>
                            <div className="debug-panel__info-item">
                              <span className="debug-panel__info-label">Visible:</span>
                              <span className={`debug-panel__info-value ${mesh.visible ? 'debug-panel__info-value--success' : 'debug-panel__info-value--error'}`}>
                                {mesh.visible ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="debug-panel__info-item">
                              <span className="debug-panel__info-label">Enabled:</span>
                              <span className={`debug-panel__info-value ${mesh.enabled ? 'debug-panel__info-value--success' : 'debug-panel__info-value--error'}`}>
                                {mesh.enabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="debug-panel__info-item">
                              <span className="debug-panel__info-label">Material:</span>
                              <span className={`debug-panel__info-value ${mesh.hasMaterial ? 'debug-panel__info-value--success' : 'debug-panel__info-value--error'}`}>
                                {mesh.hasMaterial ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={debugPanelClasses}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      {/* Header */}
      <div className="debug-panel__header">
        <h3 className="debug-panel__title">{title}</h3>
        
        {showDebugControls && (
          <div className="debug-panel__controls">
            <button
              type="button"
              className="debug-panel__control-btn"
              onClick={handleRefresh}
              disabled={!isSceneValid}
              aria-label="Refresh Debug Info"
              tabIndex={0}
            >
              🔄
            </button>
            <button
              type="button"
              className="debug-panel__control-btn"
              onClick={handleExportReport}
              disabled={!isSceneValid}
              aria-label="Export Debug Report"
              tabIndex={0}
            >
              📄
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      {searchable && (showMeshDetails || showLightingInfo) && (
        <div className="debug-panel__search">
          <input
            type="text"
            className="debug-panel__search-input"
            placeholder="Search debug info..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search debug info"
          />
          {searchTerm && (
            <button
              type="button"
              className="debug-panel__search-clear"
              onClick={handleSearchClear}
              aria-label="Clear search"
              tabIndex={0}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="debug-panel__content">
        {renderContent()}
      </div>
    </div>
  );
}

// Re-export types for convenience
export type { DebugPanelProps };
