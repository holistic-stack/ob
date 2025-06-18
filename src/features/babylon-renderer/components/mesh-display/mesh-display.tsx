/**
 * @file Mesh Display Component
 * 
 * Interactive display for Babylon.js meshes with search, filtering, and management
 * Provides mesh selection, visibility toggle, deletion, and property inspection
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import type { MeshDisplayProps } from '../../types/babylon-types';
import './mesh-display.css';

/**
 * MeshDisplay Component
 * 
 * Responsible for:
 * - Displaying list of meshes in the scene
 * - Providing search and filtering capabilities
 * - Handling mesh selection and interaction
 * - Showing mesh properties and statistics
 * - Managing mesh visibility and deletion
 * - Supporting virtualization for large mesh lists
 * 
 * @param props - Mesh display configuration and event handlers
 * @returns JSX element containing the mesh display interface
 * 
 * @example
 * ```tsx
 * <MeshDisplay
 *   scene={scene}
 *   searchable={true}
 *   showStatistics={true}
 *   showDeleteButton={true}
 *   showVisibilityButton={true}
 *   onMeshSelect={(mesh) => selectMesh(mesh)}
 *   onMeshDelete={(mesh) => deleteMesh(mesh)}
 *   onMeshToggleVisibility={(mesh) => toggleVisibility(mesh)}
 * />
 * ```
 */
export function MeshDisplay({
  scene,
  className = '',
  title = 'Mesh Display',
  searchable = false,
  showStatistics = false,
  showDeleteButton = false,
  showVisibilityButton = false,
  showMeshProperties = false,
  virtualizeList = false,
  maxVisibleItems = 20,
  onMeshSelect,
  onMeshDelete,
  onMeshToggleVisibility,
  'aria-label': ariaLabel = 'Mesh Display',
  ...props
}: MeshDisplayProps): React.JSX.Element {
  console.log('[INIT] Initializing MeshDisplay component');

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMeshes, setExpandedMeshes] = useState<Set<string>>(new Set());
  const [meshList, setMeshList] = useState<BABYLON.AbstractMesh[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isSceneValid = useMemo(() => {
    return scene && !scene.isDisposed;
  }, [scene]);

  // Update mesh list when scene changes
  useEffect(() => {
    if (!isSceneValid) {
      setMeshList([]);
      setIsLoading(false);
      return;
    }

    console.log('[DEBUG] Updating mesh list from scene');
    setIsLoading(true);

    // Get all meshes from scene
    const meshes = scene?.meshes.filter(mesh => mesh.name !== '__root__') ?? [];
    setMeshList(meshes);
    setIsLoading(false);

    // Set up a timer to periodically check for mesh changes
    // This is needed because React doesn't automatically detect Babylon.js scene changes
    const intervalId = setInterval(() => {
      if (scene && !scene.isDisposed) {
        const currentMeshes = scene.meshes.filter(mesh => mesh.name !== '__root__');
        setMeshList(prevMeshes => {
          // Only update if the mesh list actually changed
          if (currentMeshes.length !== prevMeshes.length ||
              currentMeshes.some((mesh, index) => mesh !== prevMeshes[index])) {
            console.log('[DEBUG] Mesh list changed, updating display');
            return currentMeshes;
          }
          return prevMeshes;
        });
      }
    }, 100); // Check every 100ms

    return () => {
      clearInterval(intervalId);
    };
  }, [isSceneValid, scene]);

  // Filtered meshes based on search term
  const filteredMeshes = useMemo(() => {
    if (!searchTerm.trim()) {
      return meshList;
    }
    
    return meshList.filter(mesh =>
      mesh.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [meshList, searchTerm]);

  // Virtualized meshes for performance
  const displayedMeshes = useMemo(() => {
    if (!virtualizeList) {
      return filteredMeshes;
    }
    
    return filteredMeshes.slice(0, maxVisibleItems);
  }, [filteredMeshes, virtualizeList, maxVisibleItems]);

  // Statistics
  const statistics = useMemo(() => {
    const totalMeshes = meshList.length;
    const visibleMeshes = meshList.filter(mesh => mesh.isVisible).length;
    const hiddenMeshes = totalMeshes - visibleMeshes;
    
    return {
      total: totalMeshes,
      visible: visibleMeshes,
      hidden: hiddenMeshes,
      filtered: filteredMeshes.length
    };
  }, [meshList, filteredMeshes]);

  // Event handlers
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log('[DEBUG] Search term changed to:', value);
    setSearchTerm(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    console.log('[DEBUG] Clearing search');
    setSearchTerm('');
  }, []);

  const handleMeshClick = useCallback((mesh: BABYLON.AbstractMesh) => {
    console.log('[DEBUG] Mesh clicked:', mesh.name);
    if (onMeshSelect) {
      onMeshSelect(mesh);
    }
  }, [onMeshSelect]);

  const handleMeshDelete = useCallback((mesh: BABYLON.AbstractMesh, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('[DEBUG] Mesh delete clicked:', mesh.name);
    if (onMeshDelete) {
      onMeshDelete(mesh);
    }
  }, [onMeshDelete]);

  const handleMeshToggleVisibility = useCallback((mesh: BABYLON.AbstractMesh, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('[DEBUG] Mesh visibility toggle clicked:', mesh.name);
    if (onMeshToggleVisibility) {
      onMeshToggleVisibility(mesh);
    }
  }, [onMeshToggleVisibility]);

  const handleMeshExpand = useCallback((meshName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('[DEBUG] Mesh expand toggled:', meshName);
    setExpandedMeshes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(meshName)) {
        newSet.delete(meshName);
      } else {
        newSet.add(meshName);
      }
      return newSet;
    });
  }, []);

  // Helper functions
  const getMeshProperties = useCallback((mesh: BABYLON.AbstractMesh) => {
    if (mesh instanceof BABYLON.Mesh) {
      const geometry = mesh.geometry;
      const verticesCount = geometry ? geometry.getTotalVertices() : 0;
      const indicesCount = geometry ? geometry.getTotalIndices() : 0;
      const trianglesCount = indicesCount / 3;
      
      return {
        vertices: verticesCount,
        indices: indicesCount,
        triangles: Math.floor(trianglesCount),
        visible: mesh.isVisible,
        enabled: mesh.isEnabled(),
        position: `${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}`
      };
    }
    
    return {
      vertices: 0,
      indices: 0,
      triangles: 0,
      visible: mesh.isVisible,
      enabled: mesh.isEnabled(),
      position: `${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)}`
    };
  }, []);

  // Combine CSS classes
  const meshDisplayClasses = ['mesh-display', className].filter(Boolean).join(' ');

  // Render content based on state
  const renderContent = () => {
    if (!isSceneValid) {
      return (
        <div className="mesh-display__empty">
          <span className="mesh-display__empty-text">
            {scene ? 'Scene not available' : 'No scene available'}
          </span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="mesh-display__loading">
          <span className="mesh-display__loading-text">Loading meshes...</span>
        </div>
      );
    }

    if (meshList.length === 0) {
      return (
        <div className="mesh-display__empty">
          <span className="mesh-display__empty-text">No meshes in scene</span>
        </div>
      );
    }

    if (filteredMeshes.length === 0 && searchTerm) {
      return (
        <div className="mesh-display__empty">
          <span className="mesh-display__empty-text">
            No meshes match "{searchTerm}"
          </span>
        </div>
      );
    }

    return (
      <div className="mesh-display__list">
        {displayedMeshes.map((mesh) => {
          const isExpanded = expandedMeshes.has(mesh.name);
          const properties = showMeshProperties ? getMeshProperties(mesh) : null;
          
          return (
            <div
              key={mesh.uniqueId}
              className="mesh-display__item"
              onClick={() => handleMeshClick(mesh)}
              role="button"
              tabIndex={0}
              aria-label={`Select mesh ${mesh.name}`}
            >
              <div className="mesh-display__item-header">
                <span className="mesh-display__item-name">{mesh.name}</span>
                
                <div className="mesh-display__item-actions">
                  {showMeshProperties && (
                    <button
                      type="button"
                      className="mesh-display__action-btn"
                      onClick={(e) => handleMeshExpand(mesh.name, e)}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} properties for ${mesh.name}`}
                      tabIndex={0}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  )}
                  
                  {showVisibilityButton && (
                    <button
                      type="button"
                      className={`mesh-display__action-btn ${mesh.isVisible ? 'mesh-display__action-btn--active' : ''}`}
                      onClick={(e) => handleMeshToggleVisibility(mesh, e)}
                      aria-label={`Toggle visibility for ${mesh.name}`}
                      tabIndex={0}
                    >
                      {mesh.isVisible ? '👁️' : '🙈'}
                    </button>
                  )}
                  
                  {showDeleteButton && (
                    <button
                      type="button"
                      className="mesh-display__action-btn mesh-display__action-btn--danger"
                      onClick={(e) => handleMeshDelete(mesh, e)}
                      aria-label={`Delete mesh ${mesh.name}`}
                      tabIndex={0}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              {showMeshProperties && isExpanded && properties && (
                <div className="mesh-display__item-properties">
                  <div className="mesh-display__property">
                    <span className="mesh-display__property-label">Vertices:</span>
                    <span className="mesh-display__property-value">{properties.vertices}</span>
                  </div>
                  <div className="mesh-display__property">
                    <span className="mesh-display__property-label">Triangles:</span>
                    <span className="mesh-display__property-value">{properties.triangles}</span>
                  </div>
                  <div className="mesh-display__property">
                    <span className="mesh-display__property-label">Position:</span>
                    <span className="mesh-display__property-value">{properties.position}</span>
                  </div>
                  <div className="mesh-display__property">
                    <span className="mesh-display__property-label">Visible:</span>
                    <span className={`mesh-display__property-value ${properties.visible ? 'mesh-display__property-value--success' : 'mesh-display__property-value--error'}`}>
                      {properties.visible ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {virtualizeList && filteredMeshes.length > maxVisibleItems && (
          <div className="mesh-display__virtualization-info">
            Showing {displayedMeshes.length} of {filteredMeshes.length} meshes
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={meshDisplayClasses}
      role="region"
      aria-label={ariaLabel}
      {...props}
    >
      {/* Header */}
      <div className="mesh-display__header">
        <h3 className="mesh-display__title">{title}</h3>
        
        {showStatistics && (
          <div className="mesh-display__statistics">
            <span className="mesh-display__stat">
              {statistics.total} {statistics.total === 1 ? 'mesh' : 'meshes'}
            </span>
            {statistics.total > 0 && (
              <span className="mesh-display__stat-detail">
                ({statistics.visible} visible, {statistics.hidden} hidden)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      {searchable && (
        <div className="mesh-display__search">
          <input
            type="text"
            className="mesh-display__search-input"
            placeholder="Search meshes..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search meshes"
          />
          {searchTerm && (
            <button
              type="button"
              className="mesh-display__search-clear"
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
      <div className="mesh-display__content">
        {renderContent()}
      </div>
    </div>
  );
}

// Re-export types for convenience
export type { MeshDisplayProps };
