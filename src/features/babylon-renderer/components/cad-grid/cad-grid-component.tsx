/**
 * @file CAD Grid React Component
 * 
 * React wrapper for professional CAD-style 3D grid system
 * Integrates with existing Babylon.js renderer architecture
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createCADGrid, updateCADGrid, type CADGridConfig, type CADGridData } from './cad-grid';

/**
 * Props for CAD Grid React component
 */
export interface CADGridComponentProps {
  /** Babylon.js scene to add grid to */
  readonly scene: BABYLON.Scene | null;
  /** Grid configuration */
  readonly config?: CADGridConfig;
  /** Whether grid is visible (default: true) */
  readonly visible?: boolean;
  /** Callback when grid is created */
  readonly onGridCreated?: (gridData: CADGridData) => void;
  /** Callback when grid creation fails */
  readonly onGridError?: (error: string) => void;
  /** CSS class name for styling */
  readonly className?: string;
  /** ARIA label for accessibility */
  readonly 'aria-label'?: string;
}

/**
 * CAD Grid React Component
 * 
 * Provides a React wrapper around the CAD grid system for easy integration
 * with existing Babylon.js renderer components.
 * 
 * @param props - Component configuration and event handlers
 * @returns JSX element (null - grid is rendered in 3D scene)
 * 
 * @example
 * ```tsx
 * <CADGridComponent
 *   scene={scene}
 *   config={{
 *     size: 30,
 *     divisions: 30,
 *     majorLineInterval: 10,
 *     minorLineColor: '#cccccc',
 *     majorLineColor: '#888888',
 *     opacity: 0.6
 *   }}
 *   visible={true}
 *   onGridCreated={(gridData) => console.log('Grid created:', gridData)}
 *   onGridError={(error) => console.error('Grid error:', error)}
 * />
 * ```
 */
export function CADGridComponent({
  scene,
  config = {},
  visible = true,
  onGridCreated,
  onGridError,
  className = '',
  'aria-label': ariaLabel = 'CAD Grid System',
  ...props
}: CADGridComponentProps): React.JSX.Element | null {
  console.log('[INIT] Initializing CAD Grid React component');
  
  // Ref to store current grid data
  const gridDataRef = useRef<CADGridData | null>(null);
  const configRef = useRef<CADGridConfig>(config);
  
  /**
   * Create or update grid based on scene and configuration
   */
  const createOrUpdateGrid = useCallback(() => {
    if (!scene || scene.isDisposed) {
      console.log('[DEBUG] Scene not available, skipping grid creation');
      return;
    }

    console.log('[DEBUG] Creating/updating CAD grid');

    try {
      // Create new grid if none exists
      if (!gridDataRef.current) {
        console.log('[DEBUG] Creating new CAD grid');

        const createResult = createCADGrid(scene, config);

        if (createResult.success) {
          gridDataRef.current = createResult.data;
          configRef.current = config;

          console.log('[DEBUG] Grid created successfully');

          if (onGridCreated) {
            onGridCreated(createResult.data);
          }
        } else {
          console.error('[ERROR] Failed to create grid:', createResult.error);
          if (onGridError) {
            onGridError(createResult.error);
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ERROR] Exception in grid creation:', errorMessage);
      if (onGridError) {
        onGridError(errorMessage);
      }
    }
  }, [scene, config, onGridCreated, onGridError]);
  
  /**
   * Handle visibility changes
   */
  const updateVisibility = useCallback(() => {
    if (gridDataRef.current) {
      console.log('[DEBUG] Updating grid visibility:', visible);
      gridDataRef.current.gridMesh.setEnabled(visible);
    }
  }, [visible]);
  
  /**
   * Cleanup grid on unmount
   */
  const cleanupGrid = useCallback(() => {
    if (gridDataRef.current) {
      console.log('[DEBUG] Cleaning up CAD grid');
      
      try {
        if (!gridDataRef.current.gridMesh.isDisposed()) {
          gridDataRef.current.gridMesh.dispose();
        }
      } catch (error) {
        console.warn('[WARN] Error during grid cleanup:', error);
      }
      
      gridDataRef.current = null;
    }
  }, []);
  
  // Effect to create/update grid when scene or config changes
  useEffect(() => {
    createOrUpdateGrid();
    
    // Cleanup on unmount or scene change
    return () => {
      if (gridDataRef.current && scene !== gridDataRef.current.gridMesh.getScene()) {
        cleanupGrid();
      }
    };
  }, [scene, config, createOrUpdateGrid, cleanupGrid]);
  
  // Effect to handle visibility changes
  useEffect(() => {
    updateVisibility();
  }, [visible, updateVisibility]);
  
  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupGrid();
    };
  }, [cleanupGrid]);
  
  console.log('[END] CAD Grid React component initialized');
  
  // This component renders into the 3D scene, not the DOM
  // Return null but provide accessibility context
  return (
    <div
      className={`cad-grid-component ${className}`.trim()}
      aria-label={ariaLabel}
      aria-hidden="true"
      style={{ display: 'none' }}
      data-testid="cad-grid-component"
      {...props}
    />
  );
}
