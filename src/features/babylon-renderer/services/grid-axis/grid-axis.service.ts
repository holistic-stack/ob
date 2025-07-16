/**
 * @file Grid and Axis Service
 *
 * Service for displaying spatial reference aids including ground grid and XYZ axes.
 * Provides scale-adaptive grid and color-coded axis indicators for CAD precision.
 * 
 * @example
 * ```typescript
 * const gridAxisService = new GridAxisService(scene);
 * 
 * // Setup grid and axes
 * const result = await gridAxisService.setupGridAndAxes({
 *   gridSize: 20,
 *   gridSpacing: 1,
 *   showAxes: true,
 *   axisLength: 5
 * });
 * ```
 */

import { 
  Scene, 
  Mesh,
  Vector3, 
  Color3,
  StandardMaterial,
  CreateGround,
  CreateLines,
  CreateCylinder,
  CreateSphere,
  TransformNode
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('GridAxis');

/**
 * Grid and axis configuration
 */
export interface GridAxisConfig {
  readonly showGrid?: boolean;
  readonly showAxes?: boolean;
  readonly gridSize?: number;
  readonly gridSpacing?: number;
  readonly gridSubdivisions?: number;
  readonly gridColor?: Color3;
  readonly gridOpacity?: number;
  readonly axisLength?: number;
  readonly axisThickness?: number;
  readonly xAxisColor?: Color3;
  readonly yAxisColor?: Color3;
  readonly zAxisColor?: Color3;
  readonly showAxisLabels?: boolean;
  readonly adaptiveGrid?: boolean;
  readonly minGridSpacing?: number;
  readonly maxGridSpacing?: number;
}

/**
 * Grid and axis setup result
 */
export interface GridAxisSetup {
  readonly gridMesh?: Mesh;
  readonly xAxis?: Mesh;
  readonly yAxis?: Mesh;
  readonly zAxis?: Mesh;
  readonly axisLabels?: Mesh[];
  readonly rootNode: TransformNode;
  readonly meshes: readonly Mesh[];
}

/**
 * Grid axis error
 */
export interface GridAxisError {
  readonly code: 'SETUP_FAILED' | 'UPDATE_FAILED' | 'INVALID_PARAMETERS' | 'DISPOSAL_FAILED';
  readonly message: string;
  readonly timestamp: Date;
  readonly details?: Record<string, unknown>;
}

/**
 * Grid and Axis Service
 * 
 * Provides spatial reference aids for CAD precision work.
 * Handles ground grid and XYZ axis indicators with adaptive scaling.
 */
export class GridAxisService {
  private readonly scene: Scene;
  private gridAxisSetup: GridAxisSetup | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    logger.init('[INIT] GridAxis service initialized');
  }

  /**
   * Setup grid and axes for spatial reference
   */
  async setupGridAndAxes(
    config: GridAxisConfig = {}
  ): Promise<Result<GridAxisSetup, GridAxisError>> {
    logger.debug('[GRID_AXES] Setting up grid and axes...');
    const startTime = performance.now();

    return tryCatchAsync(
      async () => {
        // Default configuration optimized for CAD work
        const defaultConfig: Required<GridAxisConfig> = {
          showGrid: true,
          showAxes: true,
          gridSize: 20,
          gridSpacing: 1,
          gridSubdivisions: 10,
          gridColor: new Color3(0.5, 0.5, 0.5),
          gridOpacity: 0.3,
          axisLength: 5,
          axisThickness: 0.05,
          xAxisColor: new Color3(1, 0, 0), // Red for X
          yAxisColor: new Color3(0, 1, 0), // Green for Y
          zAxisColor: new Color3(0, 0, 1), // Blue for Z
          showAxisLabels: true,
          adaptiveGrid: false,
          minGridSpacing: 0.1,
          maxGridSpacing: 10,
        };

        const finalConfig = { ...defaultConfig, ...config };

        // Clear existing setup
        this.clearGridAndAxes();

        // Create root node for organization
        const rootNode = new TransformNode('gridAxisRoot', this.scene);
        const meshes: Mesh[] = [];

        let gridMesh: Mesh | undefined;
        let xAxis: Mesh | undefined;
        let yAxis: Mesh | undefined;
        let zAxis: Mesh | undefined;
        const axisLabels: Mesh[] = [];

        // Create grid
        if (finalConfig.showGrid) {
          gridMesh = this.createGrid(finalConfig, rootNode);
          meshes.push(gridMesh);
        }

        // Create axes
        if (finalConfig.showAxes) {
          const axes = this.createAxes(finalConfig, rootNode);
          xAxis = axes.xAxis;
          yAxis = axes.yAxis;
          zAxis = axes.zAxis;
          meshes.push(xAxis, yAxis, zAxis);

          // Create axis labels
          if (finalConfig.showAxisLabels) {
            const labels = this.createAxisLabels(finalConfig, rootNode);
            axisLabels.push(...labels);
            meshes.push(...labels);
          }
        }

        this.gridAxisSetup = {
          rootNode,
          meshes,
          axisLabels,
          ...(gridMesh && { gridMesh }),
          ...(xAxis && { xAxis }),
          ...(yAxis && { yAxis }),
          ...(zAxis && { zAxis }),
        };

        logger.debug(`[GRID_AXES] Grid and axes setup completed in ${(performance.now() - startTime).toFixed(2)}ms`);
        return this.gridAxisSetup;
      },
      (error) => this.createError('SETUP_FAILED', `Grid and axes setup failed: ${error}`)
    );
  }

  /**
   * Update grid spacing (for adaptive grid)
   */
  async updateGridSpacing(spacing: number): Promise<Result<void, GridAxisError>> {
    logger.debug(`[UPDATE_GRID] Updating grid spacing to: ${spacing}`);

    return tryCatchAsync(
      async () => {
        if (!this.gridAxisSetup?.gridMesh) {
          throw this.createError('UPDATE_FAILED', 'Grid not initialized');
        }

        if (spacing <= 0) {
          throw this.createError('INVALID_PARAMETERS', 'Grid spacing must be positive');
        }

        // Recreate grid with new spacing
        // For now, we'll dispose and recreate - in production this could be optimized
        const currentConfig: GridAxisConfig = {
          gridSpacing: spacing,
        };

        await this.setupGridAndAxes(currentConfig);
        logger.debug('[UPDATE_GRID] Grid spacing updated');
      },
      (error) => this.createError('UPDATE_FAILED', `Update grid spacing failed: ${error}`)
    );
  }

  /**
   * Show/hide grid
   */
  setGridVisibility(visible: boolean): void {
    if (this.gridAxisSetup?.gridMesh) {
      this.gridAxisSetup.gridMesh.setEnabled(visible);
      logger.debug(`[GRID_VISIBILITY] Grid visibility set to: ${visible}`);
    }
  }

  /**
   * Show/hide axes
   */
  setAxesVisibility(visible: boolean): void {
    if (this.gridAxisSetup) {
      this.gridAxisSetup.xAxis?.setEnabled(visible);
      this.gridAxisSetup.yAxis?.setEnabled(visible);
      this.gridAxisSetup.zAxis?.setEnabled(visible);
      this.gridAxisSetup.axisLabels?.forEach(label => label.setEnabled(visible));
      logger.debug(`[AXES_VISIBILITY] Axes visibility set to: ${visible}`);
    }
  }

  /**
   * Get current setup
   */
  getGridAxisSetup(): GridAxisSetup | null {
    return this.gridAxisSetup;
  }

  /**
   * Create ground grid
   */
  private createGrid(config: Required<GridAxisConfig>, parent: TransformNode): Mesh {
    // Create grid lines
    const lines: Vector3[][] = [];
    const halfSize = config.gridSize / 2;
    const spacing = config.gridSpacing;

    // Vertical lines (parallel to Z-axis)
    for (let x = -halfSize; x <= halfSize; x += spacing) {
      lines.push([
        new Vector3(x, 0, -halfSize),
        new Vector3(x, 0, halfSize)
      ]);
    }

    // Horizontal lines (parallel to X-axis)
    for (let z = -halfSize; z <= halfSize; z += spacing) {
      lines.push([
        new Vector3(-halfSize, 0, z),
        new Vector3(halfSize, 0, z)
      ]);
    }

    const gridMesh = CreateLines('grid', { points: lines.flat() }, this.scene);
    gridMesh.color = config.gridColor;
    gridMesh.alpha = config.gridOpacity;
    gridMesh.parent = parent;

    return gridMesh;
  }

  /**
   * Create XYZ axes
   */
  private createAxes(config: Required<GridAxisConfig>, parent: TransformNode): {
    xAxis: Mesh;
    yAxis: Mesh;
    zAxis: Mesh;
  } {
    const axisLength = config.axisLength;
    const thickness = config.axisThickness;

    // X-axis (Red)
    const xAxis = CreateCylinder('xAxis', {
      height: axisLength,
      diameter: thickness,
    }, this.scene);
    xAxis.rotation.z = Math.PI / 2;
    xAxis.position.x = axisLength / 2;
    
    const xMaterial = new StandardMaterial('xAxisMaterial', this.scene);
    xMaterial.diffuseColor = config.xAxisColor;
    xMaterial.emissiveColor = config.xAxisColor.scale(0.2);
    xAxis.material = xMaterial;
    xAxis.parent = parent;

    // Y-axis (Green)
    const yAxis = CreateCylinder('yAxis', {
      height: axisLength,
      diameter: thickness,
    }, this.scene);
    yAxis.position.y = axisLength / 2;
    
    const yMaterial = new StandardMaterial('yAxisMaterial', this.scene);
    yMaterial.diffuseColor = config.yAxisColor;
    yMaterial.emissiveColor = config.yAxisColor.scale(0.2);
    yAxis.material = yMaterial;
    yAxis.parent = parent;

    // Z-axis (Blue)
    const zAxis = CreateCylinder('zAxis', {
      height: axisLength,
      diameter: thickness,
    }, this.scene);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = axisLength / 2;
    
    const zMaterial = new StandardMaterial('zAxisMaterial', this.scene);
    zMaterial.diffuseColor = config.zAxisColor;
    zMaterial.emissiveColor = config.zAxisColor.scale(0.2);
    zAxis.material = zMaterial;
    zAxis.parent = parent;

    return { xAxis, yAxis, zAxis };
  }

  /**
   * Create axis labels
   */
  private createAxisLabels(config: Required<GridAxisConfig>, parent: TransformNode): Mesh[] {
    const labels: Mesh[] = [];
    const labelSize = config.axisThickness * 3;
    const labelOffset = config.axisLength + labelSize;

    // X label (small red sphere)
    const xLabel = CreateSphere('xLabel', { diameter: labelSize }, this.scene);
    xLabel.position.x = labelOffset;
    const xLabelMaterial = new StandardMaterial('xLabelMaterial', this.scene);
    xLabelMaterial.diffuseColor = config.xAxisColor;
    xLabel.material = xLabelMaterial;
    xLabel.parent = parent;
    labels.push(xLabel);

    // Y label (small green sphere)
    const yLabel = CreateSphere('yLabel', { diameter: labelSize }, this.scene);
    yLabel.position.y = labelOffset;
    const yLabelMaterial = new StandardMaterial('yLabelMaterial', this.scene);
    yLabelMaterial.diffuseColor = config.yAxisColor;
    yLabel.material = yLabelMaterial;
    yLabel.parent = parent;
    labels.push(yLabel);

    // Z label (small blue sphere)
    const zLabel = CreateSphere('zLabel', { diameter: labelSize }, this.scene);
    zLabel.position.z = labelOffset;
    const zLabelMaterial = new StandardMaterial('zLabelMaterial', this.scene);
    zLabelMaterial.diffuseColor = config.zAxisColor;
    zLabel.material = zLabelMaterial;
    zLabel.parent = parent;
    labels.push(zLabel);

    return labels;
  }

  /**
   * Clear existing grid and axes
   */
  private clearGridAndAxes(): void {
    if (this.gridAxisSetup) {
      this.gridAxisSetup.rootNode.dispose();
      this.gridAxisSetup = null;
    }
  }

  /**
   * Create a grid axis error
   */
  private createError(
    code: GridAxisError['code'],
    message: string,
    details?: Record<string, unknown>
  ): GridAxisError {
    const error: GridAxisError = {
      code,
      message,
      timestamp: new Date(),
      ...(details && { details }),
    };
    
    return error;
  }

  /**
   * Dispose grid and axes
   */
  dispose(): void {
    this.clearGridAndAxes();
    logger.debug('[DISPOSE] Grid and axes disposed');
  }
}
