/**
 * @file CAD Grid System
 * 
 * Professional CAD-style 3D grid system for Babylon.js scenes
 * Provides visible grid on X-Z plane with major/minor grid lines
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import * as BABYLON from '@babylonjs/core';

/**
 * Configuration for CAD grid system
 */
export interface CADGridConfig {
  /** Grid size in world units (default: 20) */
  readonly size?: number;
  /** Number of grid divisions (default: 20) */
  readonly divisions?: number;
  /** Interval for major grid lines (default: 5) */
  readonly majorLineInterval?: number;
  /** Color for minor grid lines (default: '#e0e0e0') */
  readonly minorLineColor?: string;
  /** Color for major grid lines (default: '#808080') */
  readonly majorLineColor?: string;
  /** Grid opacity (default: 0.5) */
  readonly opacity?: number;
  /** Grid position [x, y, z] (default: [0, 0, 0]) */
  readonly position?: readonly [number, number, number];
}

/**
 * Result of CAD grid creation
 */
export interface CADGridData {
  /** The created grid mesh */
  readonly gridMesh: BABYLON.Mesh;
  /** Applied configuration */
  readonly config: Required<CADGridConfig>;
  /** Number of grid lines created */
  readonly lineCount: number;
}

/**
 * Result type for CAD grid operations
 */
export type CADGridResult = 
  | { readonly success: true; readonly data: CADGridData }
  | { readonly success: false; readonly error: string };

/**
 * Default configuration for CAD grid
 */
const DEFAULT_CONFIG: Required<CADGridConfig> = {
  size: 20,
  divisions: 20,
  majorLineInterval: 5,
  minorLineColor: '#e0e0e0',
  majorLineColor: '#808080',
  opacity: 0.5,
  position: [0, 0, 0]
} as const;

/**
 * Validate CAD grid configuration
 */
function validateConfig(config: CADGridConfig): string | null {
  if (config.size !== undefined && config.size <= 0) {
    return 'Grid size must be positive';
  }
  
  if (config.divisions !== undefined && config.divisions <= 0) {
    return 'Grid divisions must be positive';
  }
  
  if (config.opacity !== undefined && (config.opacity < 0 || config.opacity > 1)) {
    return 'Grid opacity must be between 0 and 1';
  }
  
  if (config.majorLineInterval !== undefined && config.majorLineInterval <= 0) {
    return 'Major line interval must be positive';
  }
  
  return null;
}

/**
 * Create grid line geometry
 */
function createGridLines(
  scene: BABYLON.Scene,
  config: Required<CADGridConfig>
): { mesh: BABYLON.Mesh; lineCount: number } {
  console.log('[DEBUG] Creating grid line geometry');
  
  const { size, divisions } = config;
  const step = size / divisions;
  const halfSize = size / 2;
  
  const points: BABYLON.Vector3[] = [];
  let lineCount = 0;
  
  // Create lines parallel to X-axis (running along Z direction)
  for (let i = 0; i <= divisions; i++) {
    const z = -halfSize + (i * step);
    points.push(new BABYLON.Vector3(-halfSize, 0, z));
    points.push(new BABYLON.Vector3(halfSize, 0, z));
    lineCount++;
  }
  
  // Create lines parallel to Z-axis (running along X direction)
  for (let i = 0; i <= divisions; i++) {
    const x = -halfSize + (i * step);
    points.push(new BABYLON.Vector3(x, 0, -halfSize));
    points.push(new BABYLON.Vector3(x, 0, halfSize));
    lineCount++;
  }
  
  // Create line system mesh
  const lineSystem = BABYLON.MeshBuilder.CreateLineSystem('cad-grid', {
    lines: points.reduce((lines: BABYLON.Vector3[][], point, index) => {
      if (index % 2 === 0 && points[index + 1]) {
        lines.push([point, points[index + 1]]);
      }
      return lines;
    }, [])
  }, scene);
  
  return { mesh: lineSystem, lineCount };
}

/**
 * Create and configure grid material
 */
function createGridMaterial(
  scene: BABYLON.Scene,
  config: Required<CADGridConfig>
): BABYLON.StandardMaterial {
  console.log('[DEBUG] Creating grid material');
  
  const material = new BABYLON.StandardMaterial('cad-grid-material', scene);
  
  // Use minor line color as base (major lines handled separately if needed)
  material.emissiveColor = BABYLON.Color3.FromHexString(config.minorLineColor);
  material.disableLighting = true;
  material.alpha = config.opacity;
  
  // Ensure lines are always visible
  material.backFaceCulling = false;
  
  return material;
}

/**
 * Create professional CAD-style 3D grid system
 * 
 * @param scene - Babylon.js scene to add grid to
 * @param userConfig - Optional grid configuration
 * @returns Result containing grid data or error
 * 
 * @example
 * ```typescript
 * const result = createCADGrid(scene, {
 *   size: 30,
 *   divisions: 30,
 *   majorLineInterval: 10,
 *   minorLineColor: '#cccccc',
 *   majorLineColor: '#888888',
 *   opacity: 0.6
 * });
 * 
 * if (result.success) {
 *   console.log('Grid created:', result.data.gridMesh.name);
 * }
 * ```
 */
export function createCADGrid(
  scene: BABYLON.Scene | null,
  userConfig: CADGridConfig = {}
): CADGridResult {
  console.log('[INIT] Creating CAD grid system');
  
  try {
    // Validate scene
    if (!scene || scene.isDisposed) {
      return { success: false, error: 'Invalid scene provided' };
    }
    
    // Validate and merge configuration
    const configError = validateConfig(userConfig);
    if (configError) {
      return { success: false, error: `Invalid configuration: ${configError}` };
    }
    
    const config: Required<CADGridConfig> = {
      ...DEFAULT_CONFIG,
      ...userConfig
    };
    
    console.log('[DEBUG] Grid config:', config);
    
    // Create grid geometry
    const { mesh: gridMesh, lineCount } = createGridLines(scene, config);
    
    // Apply material
    const material = createGridMaterial(scene, config);
    gridMesh.material = material;
    
    // Position grid
    const [x, y, z] = config.position;
    gridMesh.position = new BABYLON.Vector3(x, y, z);
    
    // Configure mesh properties
    gridMesh.isPickable = false; // Don't interfere with object selection
    gridMesh.freezeWorldMatrix(); // Optimize since grid doesn't move
    
    console.log('[END] CAD grid created successfully');
    
    return {
      success: true,
      data: {
        gridMesh,
        config,
        lineCount
      }
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] Failed to create CAD grid:', errorMessage);
    return { success: false, error: `Failed to create CAD grid: ${errorMessage}` };
  }
}

/**
 * Update existing CAD grid configuration
 * 
 * @param gridData - Existing grid data
 * @param newConfig - New configuration to apply
 * @returns Result of update operation
 */
export function updateCADGrid(
  gridData: CADGridData,
  newConfig: Partial<CADGridConfig>
): CADGridResult {
  console.log('[INIT] Updating CAD grid configuration');
  
  try {
    const scene = gridData.gridMesh.getScene();
    
    // Dispose old grid
    gridData.gridMesh.dispose();
    
    // Create new grid with updated config
    const updatedConfig = { ...gridData.config, ...newConfig };
    return createCADGrid(scene, updatedConfig);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] Failed to update CAD grid:', errorMessage);
    return { success: false, error: `Failed to update CAD grid: ${errorMessage}` };
  }
}
