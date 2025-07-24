/**
 * @file Orientation Gizmo Service
 * @description Core service for managing 3D orientation gizmo functionality.
 * Provides canvas-based rendering, mouse interaction detection, and camera
 * animation for BabylonJS ArcRotateCamera integration. Follows functional
 * programming patterns with Result<T,E> error handling and immutable state.
 *
 * @architectural_decision
 * **Service Pattern**: Implements IGizmoService interface for dependency injection
 * and testability. All operations return Result<T,E> for explicit error handling.
 *
 * **Canvas Rendering**: Uses 2D canvas for gizmo overlay instead of WebGL for
 * better performance and simpler implementation.
 *
 * **Immutable Operations**: All state changes return new objects, never mutate
 * existing state to maintain functional programming principles.
 *
 * @example Basic Service Usage
 * ```typescript
 * const service = new OrientationGizmoService();
 * const initResult = await service.initialize({
 *   camera: arcRotateCamera,
 *   canvas: canvasElement,
 *   config: DEFAULT_GIZMO_CONFIG
 * });
 *
 * if (initResult.success) {
 *   const updateResult = service.update();
 *   if (updateResult.success) {
 *     console.log('Gizmo updated:', updateResult.data);
 *   }
 * }
 * ```
 *
 * @example Camera Animation
 * ```typescript
 * const selectResult = await service.selectAxis(AxisDirection.POSITIVE_X);
 * if (selectResult.success) {
 *   console.log('Camera animating to X axis:', selectResult.data);
 * }
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import { Animation, type ArcRotateCamera, Matrix, QuadraticEase, Vector3 } from '@babylonjs/core';
import type { Result } from '../../../../shared/types/result.types';
import type {
  AxisDirection,
  GizmoAxis,
  GizmoConfig,
  GizmoError,
  GizmoInitOptions,
  GizmoInitResult,
  GizmoInteractionEvent,
  GizmoInteractionResult,
  GizmoState,
  GizmoUpdateResult_Type,
  IGizmoService,
} from '../../types/orientation-gizmo.types';
import {
  createGizmoId,
  DEFAULT_GIZMO_CONFIG,
  GizmoErrorCode,
  GizmoPosition,
} from '../../types/orientation-gizmo.types';

/**
 * Core orientation gizmo service implementation
 * Handles canvas rendering, mouse interaction, and camera animation
 */
export class OrientationGizmoService implements IGizmoService {
  private camera: ArcRotateCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private config: GizmoConfig = DEFAULT_GIZMO_CONFIG;
  private axes: readonly GizmoAxis[] = [];
  private center: Vector3 = Vector3.Zero();
  private mousePosition: Vector3 | null = null;
  private selectedAxis: GizmoAxis | null = null;
  private isInitialized = false;
  private easingFunction = new QuadraticEase();

  /**
   * Initialize the gizmo service with camera and configuration
   */
  async initialize(options: GizmoInitOptions): Promise<GizmoInitResult> {
    try {
      // Validate camera
      if (!options.camera || options.camera.getClassName() !== 'ArcRotateCamera') {
        return this.createErrorResult(
          GizmoErrorCode.CAMERA_NOT_SUPPORTED,
          'Only ArcRotateCamera is supported for orientation gizmo'
        );
      }

      // Validate canvas
      if (!options.canvas) {
        return this.createErrorResult(
          GizmoErrorCode.CANVAS_NOT_FOUND,
          'Canvas element is required for gizmo rendering'
        );
      }

      // Get 2D context
      const context = options.canvas.getContext('2d');
      if (!context) {
        return this.createErrorResult(
          GizmoErrorCode.INITIALIZATION_FAILED,
          'Failed to get 2D rendering context from canvas'
        );
      }

      // Store references
      this.camera = options.camera;
      this.canvas = options.canvas;
      this.context = context;
      this.config = { ...DEFAULT_GIZMO_CONFIG, ...options.config };

      // Initialize axes configuration
      this.axes = this.createAxesConfiguration();
      this.center = new Vector3(this.config.size / 2, this.config.size / 2, 0);

      // Setup easing function
      this.easingFunction.setEasingMode(2); // EASINGMODE_EASEINOUT

      // Setup canvas properties
      this.setupCanvas();

      this.isInitialized = true;

      return {
        success: true,
        data: this.createCurrentState(),
      };
    } catch (error) {
      return this.createErrorResult(
        GizmoErrorCode.INITIALIZATION_FAILED,
        `Failed to initialize gizmo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Update gizmo rendering and interaction detection
   */
  update(): GizmoUpdateResult_Type {
    if (!this.isInitialized || !this.camera || !this.context) {
      return this.createErrorResult(
        GizmoErrorCode.RENDER_FAILED,
        'Gizmo not initialized or missing required components'
      );
    }

    try {
      const startTime = performance.now();

      // Clear canvas
      this.clearCanvas();

      // Calculate camera rotation matrix
      const rotationMatrix = new Matrix();
      this.camera.absoluteRotation.toRotationMatrix(rotationMatrix);
      const inverseRotationMatrix = rotationMatrix.clone().invert();

      // Update axis positions based on camera rotation
      const updatedAxes = this.updateAxisPositions(inverseRotationMatrix);

      // Detect mouse interaction
      const selectedAxis = this.detectAxisSelection(updatedAxes);

      // Render the gizmo
      this.renderGizmo(updatedAxes, selectedAxis);

      const frameTime = performance.now() - startTime;

      return {
        success: true,
        data: {
          rendered: true,
          frameTime,
          interactionDetected: selectedAxis !== null,
          selectedAxis: (selectedAxis?.axis as AxisDirection) || null,
        },
      };
    } catch (error) {
      return this.createErrorResult(
        GizmoErrorCode.RENDER_FAILED,
        `Failed to update gizmo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Handle axis selection and camera animation
   */
  async selectAxis(axis: AxisDirection): Promise<GizmoInteractionResult> {
    if (!this.camera) {
      return this.createErrorResult(
        GizmoErrorCode.INTERACTION_FAILED,
        'Camera not available for axis selection'
      );
    }

    try {
      const axisConfig = this.axes.find((a) => a.axis === axis);
      if (!axisConfig) {
        return this.createErrorResult(
          GizmoErrorCode.INTERACTION_FAILED,
          `Invalid axis direction: ${axis}`
        );
      }

      // Calculate target position
      const direction = axisConfig.direction.clone();
      direction.scaleInPlace(10); // Distance from target

      // Create animation
      const animation = Animation.CreateAndStartAnimation(
        'gizmoOrbitCamera',
        this.camera,
        'position',
        60, // Frame rate
        30, // Duration in frames (0.5 seconds at 60fps)
        this.camera.position.clone(),
        direction,
        0, // Loop mode (no loop)
        this.easingFunction
      );

      if (!animation) {
        return this.createErrorResult(
          GizmoErrorCode.ANIMATION_FAILED,
          'Failed to create camera animation'
        );
      }

      const interactionEvent: GizmoInteractionEvent = {
        axis,
        direction: direction.clone(),
        timestamp: new Date(),
        mousePosition: this.mousePosition?.clone() || Vector3.Zero(),
        cameraPosition: this.camera.position.clone(),
      };

      return {
        success: true,
        data: interactionEvent,
      };
    } catch (error) {
      return this.createErrorResult(
        GizmoErrorCode.INTERACTION_FAILED,
        `Failed to select axis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { axis, originalError: error }
      );
    }
  }

  /**
   * Update gizmo configuration
   */
  updateConfig(config: Partial<GizmoConfig>): Result<GizmoConfig, GizmoError> {
    try {
      this.config = { ...this.config, ...config };
      this.axes = this.createAxesConfiguration();
      this.center = new Vector3(this.config.size / 2, this.config.size / 2, 0);

      if (this.canvas) {
        this.setupCanvas();
      }

      return {
        success: true as const,
        data: this.config,
      };
    } catch (error) {
      return this.createErrorResult(
        GizmoErrorCode.CONFIGURATION_INVALID,
        `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { config, originalError: error }
      );
    }
  }

  /**
   * Get current gizmo state
   */
  getState(): GizmoState {
    return this.createCurrentState();
  }

  /**
   * Dispose of gizmo resources
   */
  dispose(): Result<void, GizmoError> {
    try {
      this.camera = null;
      this.canvas = null;
      this.context = null;
      this.mousePosition = null;
      this.selectedAxis = null;
      this.isInitialized = false;

      return {
        success: true as const,
        data: undefined,
      };
    } catch (error) {
      return this.createErrorResult(
        GizmoErrorCode.INITIALIZATION_FAILED,
        `Failed to dispose gizmo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Update mouse position for interaction detection
   */
  updateMousePosition(position: Vector3 | null): void {
    this.mousePosition = position;
  }

  /**
   * Create axes configuration based on current config
   */
  private createAxesConfiguration(): readonly GizmoAxis[] {
    const { colors, bubbleSizePrimary, bubbleSizeSecondary, lineWidth } = this.config;

    return Object.freeze([
      // Primary axes
      {
        axis: '+x' as AxisDirection,
        direction: new Vector3(1, 0, 0),
        size: bubbleSizePrimary,
        color: [colors.x[0], colors.x[1]] as const,
        line: lineWidth,
        label: 'X',
      },
      {
        axis: '+y' as AxisDirection,
        direction: new Vector3(0, 1, 0),
        size: bubbleSizePrimary,
        color: [colors.y[0], colors.y[1]] as const,
        line: lineWidth,
        label: 'Y',
      },
      {
        axis: '+z' as AxisDirection,
        direction: new Vector3(0, 0, 1),
        size: bubbleSizePrimary,
        color: [colors.z[0], colors.z[1]] as const,
        line: lineWidth,
        label: 'Z',
      },
      // Secondary axes (negative directions)
      {
        axis: '-x' as AxisDirection,
        direction: new Vector3(-1, 0, 0),
        size: bubbleSizeSecondary,
        color: [colors.x[0], colors.x[1]] as const,
      },
      {
        axis: '-y' as AxisDirection,
        direction: new Vector3(0, -1, 0),
        size: bubbleSizeSecondary,
        color: [colors.y[0], colors.y[1]] as const,
      },
      {
        axis: '-z' as AxisDirection,
        direction: new Vector3(0, 0, -1),
        size: bubbleSizeSecondary,
        color: [colors.z[0], colors.z[1]] as const,
      },
    ]);
  }

  /**
   * Setup canvas properties and dimensions
   */
  private setupCanvas(): void {
    if (!this.canvas) return;

    this.canvas.width = this.config.size;
    this.canvas.height = this.config.size;
    this.canvas.style.borderRadius = '60px';
    this.canvas.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
  }

  /**
   * Clear the canvas for new frame
   */
  private clearCanvas(): void {
    if (!this.context || !this.canvas) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Update axis positions based on camera rotation
   */
  private updateAxisPositions(
    inverseRotationMatrix: Matrix
  ): (GizmoAxis & { position: Vector3 })[] {
    return this.axes.map((axis) => {
      const transformedDirection = Vector3.TransformCoordinates(
        axis.direction.clone(),
        inverseRotationMatrix
      );
      const position = this.getBubblePosition(transformedDirection);

      return {
        ...axis,
        direction: transformedDirection,
        position,
      } as GizmoAxis & { position: Vector3 };
    });
  }

  /**
   * Calculate bubble position on canvas
   */
  private getBubblePosition(direction: Vector3): Vector3 {
    const { padding, bubbleSizePrimary } = this.config;
    const radius = this.center.x - bubbleSizePrimary / 2 - padding;

    return new Vector3(
      direction.x * radius + this.center.x,
      this.center.y - direction.y * radius,
      direction.z
    );
  }

  /**
   * Detect which axis is selected based on mouse position
   */
  private detectAxisSelection(axes: (GizmoAxis & { position: Vector3 })[]): GizmoAxis | null {
    if (!this.mousePosition) return null;

    // Filter visible axes based on configuration
    const visibleAxes = axes.filter((axis) => {
      if (this.config.showSecondary) return true;
      return !axis.axis.startsWith('-');
    });

    // Sort by Z position (furthest first, closest last for proper selection)
    visibleAxes.sort((a, b) => a.position.z - b.position.z);

    let closestAxis: GizmoAxis | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const axis of visibleAxes) {
      const distance = Vector3.Distance(this.mousePosition, axis.position);

      // Select if within bubble radius or closest to mouse
      if (distance < axis.size || distance < closestDistance) {
        closestDistance = distance;
        closestAxis = axis;
      }
    }

    return closestAxis;
  }

  /**
   * Render the complete gizmo
   */
  private renderGizmo(
    axes: (GizmoAxis & { position: Vector3 })[],
    selectedAxis: GizmoAxis | null
  ): void {
    if (!this.context) return;

    // Filter and sort axes for rendering
    const visibleAxes = axes.filter((axis) => {
      if (this.config.showSecondary) return true;
      return !axis.axis.startsWith('-');
    });

    // Sort by Z position (back to front for proper layering)
    visibleAxes.sort((a, b) => a.position.z - b.position.z);

    // Render each axis
    for (const axis of visibleAxes) {
      this.renderAxis(axis, selectedAxis === axis);
    }
  }

  /**
   * Render a single axis bubble and line
   */
  private renderAxis(axis: GizmoAxis & { position: Vector3 }, isSelected: boolean): void {
    if (!this.context) return;

    // Determine color based on selection and Z position
    let color: string;
    if (isSelected) {
      color = '#FFFFFF';
    } else if (axis.position.z >= -0.01) {
      color = axis.color[0]; // Front color
    } else {
      color = axis.color[1]; // Back color
    }

    // Draw connecting line if enabled
    if (axis.line) {
      this.drawLine(this.center, axis.position, axis.line, color);
    }

    // Draw bubble
    this.drawCircle(axis.position, axis.size, color);

    // Draw label if provided
    if (axis.label) {
      this.drawLabel(axis.position, axis.label);
    }
  }

  /**
   * Draw a circle on the canvas
   */
  private drawCircle(position: Vector3, radius: number, color: string): void {
    if (!this.context) return;

    this.context.beginPath();
    this.context.arc(position.x, position.y, radius, 0, 2 * Math.PI);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.closePath();
  }

  /**
   * Draw a line on the canvas
   */
  private drawLine(start: Vector3, end: Vector3, width: number, color: string): void {
    if (!this.context) return;

    this.context.beginPath();
    this.context.moveTo(start.x, start.y);
    this.context.lineTo(end.x, end.y);
    this.context.lineWidth = width;
    this.context.strokeStyle = color;
    this.context.stroke();
    this.context.closePath();
  }

  /**
   * Draw text label on the canvas
   */
  private drawLabel(position: Vector3, label: string): void {
    if (!this.context) return;

    const { font } = this.config;
    this.context.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
    this.context.fillStyle = font.fontColor;
    this.context.textBaseline = 'middle';
    this.context.textAlign = 'center';
    this.context.fillText(label, position.x, position.y + font.fontYAdjust);
  }

  /**
   * Create current gizmo state
   */
  private createCurrentState(): GizmoState {
    return {
      id: createGizmoId('orientation-gizmo'),
      isVisible: true,
      position: GizmoPosition.TOP_RIGHT,
      config: this.config,
      selectedAxis: (this.selectedAxis?.axis as AxisDirection) || null,
      mouseState: {
        position: this.mousePosition,
        isHovering: this.mousePosition !== null,
        hoveredAxis: (this.selectedAxis?.axis as AxisDirection) || null,
        isDragging: false,
      },
      cameraAnimation: {
        isAnimating: false,
        targetPosition: null,
        startTime: 0,
        duration: 0,
        easingFunction: 'quadratic',
      },
      lastInteraction: null,
      isInitialized: this.isInitialized,
      error: null,
    };
  }

  /**
   * Create error result helper
   */
  private createErrorResult<T>(
    code: GizmoErrorCode,
    message: string,
    details?: Record<string, unknown>
  ): Result<T, GizmoError> {
    return {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date(),
        details: details ?? {},
      },
    };
  }
}
