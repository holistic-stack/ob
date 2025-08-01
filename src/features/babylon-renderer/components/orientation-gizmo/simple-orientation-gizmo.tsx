/**
 * @file simple-orientation-gizmo.tsx
 * @description Simplified OrientationGizmo component based on docs/gizmo-snippet.js reference.
 * Renders a 3D-looking orientation widget using 2D canvas with proper axis visualization,
 * mouse interaction, and camera animation for BabylonJS ArcRotateCamera.
 *
 * @example Basic Usage
 * ```typescript
 * <SimpleOrientationGizmo
 *   camera={arcRotateCamera}
 *   className="absolute top-4 right-4 z-10"
 *   onAxisSelected={(axis) => console.log('Selected:', axis)}
 * />
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-23
 */

import type { ArcRotateCamera } from '@babylonjs/core';
import { Animation, Matrix, QuadraticEase, Vector3 } from '@babylonjs/core';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createLogger } from '../../../../shared/services/logger.service';

const logger = createLogger('SimpleOrientationGizmo');

/**
 * Axis direction configuration
 */
interface AxisBubble {
  readonly axis: string;
  readonly direction: Vector3;
  readonly size: number;
  readonly color: readonly [string, string];
  readonly line: number;
  readonly label: string;
  position?: Vector3;
}

/**
 * Gizmo configuration options
 */
interface GizmoOptions {
  readonly size: number;
  readonly padding: number;
  readonly bubbleSizePrimary: number;
  readonly bubbleSizeSecondary: number;
  readonly showSecondary: boolean;
  readonly lineWidth: number;
  readonly fontSize: string;
  readonly fontFamily: string;
  readonly fontWeight: string;
  readonly fontColor: string;
  readonly colors: {
    readonly x: readonly [string, string];
    readonly y: readonly [string, string];
    readonly z: readonly [string, string];
  };
}

/**
 * Default gizmo options
 */
const DEFAULT_GIZMO_OPTIONS: GizmoOptions = {
  size: 90,
  padding: 8,
  bubbleSizePrimary: 8,
  bubbleSizeSecondary: 6,
  showSecondary: true,
  lineWidth: 2,
  fontSize: '11px',
  fontFamily: 'arial',
  fontWeight: 'bold',
  fontColor: '#151515',
  colors: {
    x: ['#f73c3c', '#942424'],
    y: ['#6ccb26', '#417a17'],
    z: ['#178cf0', '#0e5490'],
  },
} as const;

/**
 * Component props
 */
export interface SimpleOrientationGizmoProps {
  readonly camera: ArcRotateCamera | null;
  readonly options?: Partial<GizmoOptions>;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly onAxisSelected?: (axis: AxisBubble) => void;
  readonly onError?: (error: Error) => void;
}

/**
 * SimpleOrientationGizmo component
 *
 * Renders a 3D orientation gizmo using 2D canvas based on the reference implementation
 * from docs/gizmo-snippet.js. Provides visual feedback for camera orientation and
 * allows clicking on axes to animate camera to standard views.
 */
export function SimpleOrientationGizmo({
  camera,
  options: userOptions,
  className,
  style,
  onAxisSelected,
  onError,
}: SimpleOrientationGizmoProps): React.JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const mouseRef = useRef<Vector3 | null>(null);
  const selectedAxisRef = useRef<AxisBubble | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const easingFunction = useRef(new QuadraticEase());

  const [_isInitialized, setIsInitialized] = useState(false);

  // Merge user options with defaults
  const options: GizmoOptions = useMemo(
    () => ({
      ...DEFAULT_GIZMO_OPTIONS,
      ...userOptions,
    }),
    [userOptions]
  );

  // Generate axis bubbles
  const bubbles: AxisBubble[] = useMemo(
    () => [
      {
        axis: 'x',
        direction: new Vector3(1, 0, 0),
        size: options.bubbleSizePrimary,
        color: options.colors.x,
        line: options.lineWidth,
        label: 'X',
      },
      {
        axis: 'y',
        direction: new Vector3(0, 1, 0),
        size: options.bubbleSizePrimary,
        color: options.colors.y,
        line: options.lineWidth,
        label: 'Y',
      },
      {
        axis: 'z',
        direction: new Vector3(0, 0, 1),
        size: options.bubbleSizePrimary,
        color: options.colors.z,
        line: options.lineWidth,
        label: 'Z',
      },
      {
        axis: '-x',
        direction: new Vector3(-1, 0, 0),
        size: options.bubbleSizeSecondary,
        color: options.colors.x,
        line: options.lineWidth,
        label: '-X',
      },
      {
        axis: '-y',
        direction: new Vector3(0, -1, 0),
        size: options.bubbleSizeSecondary,
        color: options.colors.y,
        line: options.lineWidth,
        label: '-Y',
      },
      {
        axis: '-z',
        direction: new Vector3(0, 0, -1),
        size: options.bubbleSizeSecondary,
        color: options.colors.z,
        line: options.lineWidth,
        label: '-Z',
      },
    ],
    [
      options.bubbleSizePrimary,
      options.bubbleSizeSecondary,
      options.colors.x,
      options.colors.y,
      options.colors.z,
      options.lineWidth,
    ]
  );

  /**
   * Get bubble position in 2D canvas coordinates
   */
  const getBubblePosition = useCallback(
    (direction: Vector3): Vector3 => {
      const center = options.size / 2;
      const radius = center - options.padding;

      return new Vector3(
        center + direction.x * radius,
        center - direction.y * radius, // Flip Y for canvas coordinates
        direction.z
      );
    },
    [options.size, options.padding]
  );

  /**
   * Clear canvas
   */
  const clear = useCallback(() => {
    if (!contextRef.current) return;
    contextRef.current.clearRect(0, 0, options.size, options.size);
  }, [options.size]);

  /**
   * Draw circle
   */
  const drawCircle = useCallback((position: Vector3, radius: number, color: string) => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }, []);

  /**
   * Draw line
   */
  const drawLine = useCallback((p1: Vector3, p2: Vector3, width: number, color: string) => {
    if (!contextRef.current) return;

    const ctx = contextRef.current;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
  }, []);

  /**
   * Draw text label
   */
  const drawText = useCallback(
    (position: Vector3, text: string, color: string) => {
      if (!contextRef.current) return;

      const ctx = contextRef.current;
      ctx.font = `${options.fontWeight} ${options.fontSize} ${options.fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, position.x, position.y);
    },
    [options.fontSize, options.fontFamily, options.fontWeight]
  );

  /**
   * Update gizmo rendering
   */
  const update = useCallback(() => {
    if (!camera || !contextRef.current) return;

    try {
      clear();

      // Calculate the rotation matrix from the camera
      const rotMat = new Matrix();
      camera.absoluteRotation.toRotationMatrix(rotMat);
      const invRotMat = rotMat.clone().invert();

      // Update bubble positions
      for (const bubble of bubbles) {
        const invRotVec = Vector3.TransformCoordinates(bubble.direction.clone(), invRotMat);
        bubble.position = getBubblePosition(invRotVec);
      }

      // Generate layers to draw (filter secondary axes if disabled)
      const layers = bubbles.filter(
        (bubble) => options.showSecondary || !bubble.axis.startsWith('-')
      );

      // Sort layers by Z position (back to front)
      layers.sort((a, b) => ((a.position?.z ?? 0) > (b.position?.z ?? 0) ? 1 : -1));

      // Find selected axis based on mouse position
      selectedAxisRef.current = null;
      if (mouseRef.current) {
        let closestDist = Infinity;

        for (const layer of layers) {
          if (!layer.position) continue;
          const distance = Vector3.Distance(mouseRef.current, layer.position);

          if (distance < closestDist || distance < layer.size) {
            closestDist = distance;
            selectedAxisRef.current = layer;
          }
        }
      }

      // Draw layers
      const center = new Vector3(options.size / 2, options.size / 2, 0);

      for (const layer of layers) {
        if (!layer.position) continue;
        const position = layer.position;
        const isSelected = selectedAxisRef.current === layer;
        const isFront = position.z >= -0.01;

        // Choose color based on selection and depth
        let color: string;
        if (isSelected) {
          color = '#FFFFFF';
        } else if (isFront) {
          color = layer.color[0]; // Primary color
        } else {
          color = layer.color[1]; // Secondary color
        }

        // Draw line from center to bubble
        drawLine(center, position, layer.line, color);

        // Draw bubble circle
        drawCircle(position, layer.size, color);

        // Draw label
        if (isFront) {
          drawText(position, layer.label, options.fontColor);
        }
      }
    } catch (error) {
      logger.error('[ERROR][SimpleOrientationGizmo] Update failed:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown update error'));
    }
  }, [camera, clear, getBubblePosition, drawCircle, drawLine, drawText, options, onError, bubbles]);

  /**
   * Handle mouse move
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = new Vector3(event.clientX - rect.left, event.clientY - rect.top, 0);
  }, []);

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  /**
   * Handle click
   */
  const handleClick = useCallback(() => {
    if (!selectedAxisRef.current || !camera) return;

    const selectedAxis = selectedAxisRef.current;
    logger.debug(`[DEBUG][SimpleOrientationGizmo] Axis selected: ${selectedAxis.axis}`);

    // Animate camera to selected axis
    const targetDirection = selectedAxis.direction.clone();
    targetDirection.scaleInPlace(camera.radius);

    Animation.CreateAndStartAnimation(
      'gizmoOrbitCam',
      camera,
      'position',
      60,
      30,
      camera.position.clone(),
      targetDirection,
      Animation.ANIMATIONLOOPMODE_CONSTANT,
      easingFunction.current
    );

    onAxisSelected?.(selectedAxis);
  }, [camera, onAxisSelected]);

  /**
   * Initialize canvas and start render loop
   */
  useEffect(() => {
    if (!canvasRef.current || !camera) return undefined;

    try {
      contextRef.current = canvasRef.current.getContext('2d');
      if (!contextRef.current) {
        throw new Error('Failed to get 2D context');
      }

      setIsInitialized(true);
      logger.debug('[DEBUG][SimpleOrientationGizmo] Initialized successfully');

      // Start render loop
      const renderLoop = () => {
        update();
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };

      renderLoop();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } catch (error) {
      logger.error('[ERROR][SimpleOrientationGizmo] Initialization failed:', error);
      onError?.(error instanceof Error ? error : new Error('Initialization failed'));
      return undefined;
    }
  }, [camera, update, onError]);

  // Don't render if no camera
  if (!camera) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={options.size}
      height={options.size}
      className={className}
      style={{
        borderRadius: '60px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        cursor: 'default',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}
