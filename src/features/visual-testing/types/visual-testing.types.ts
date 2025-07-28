/**
 * @file Visual Testing Types
 *
 * TypeScript type definitions for visual regression testing components and utilities.
 * Provides type safety for camera configurations, test scenarios, and scene management.
 *
 * @example
 * ```typescript
 * import { VisualTestScenario, CameraAngle } from './visual-testing.types';
 *
 * const testScenario: VisualTestScenario = {
 *   name: 'circle-primitive',
 *   primitive: 'circle',
 *   cameraAngles: ['front', 'isometric'],
 *   parameters: { r: 10 }
 * };
 * ```
 */

import type { AbstractMesh, Engine, Scene } from '@babylonjs/core';

/**
 * Supported camera angles for visual testing
 * - front: Orthogonal front view
 * - top: Top-down view (optimal for 2D primitives)
 * - side: Side view
 * - back: Back view
 * - isometric: Perspective view
 */
export type CameraAngle = 'front' | 'top' | 'side' | 'back' | 'isometric';

/**
 * Supported primitive types for visual testing
 * 2D primitives: circle, square, polygon
 * 3D primitives: cube, sphere, cylinder
 */
export type PrimitiveType = 'circle' | 'square' | 'polygon' | 'cube' | 'sphere' | 'cylinder';

/**
 * Camera configuration for visual testing
 */
export interface VisualTestCameraConfig {
  readonly angle: CameraAngle;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly alpha: number;
  readonly beta: number;
  readonly radius: number;
}

/**
 * Parameters for 2D primitive generation
 */
export interface PrimitiveParameters {
  readonly [key: string]: unknown;
  readonly r?: number; // Circle radius
  readonly d?: number; // Circle diameter
  readonly size?: number | readonly [number, number]; // Square size
  readonly center?: boolean; // Center parameter
  readonly points?: readonly (readonly [number, number])[]; // Polygon points
}

/**
 * Visual test scenario configuration
 */
export interface VisualTestScenario {
  readonly name: string;
  readonly primitive: PrimitiveType;
  readonly cameraAngles: readonly CameraAngle[];
  readonly parameters: PrimitiveParameters;
  readonly description?: string;
}

/**
 * Visual test result
 */
export interface VisualTestResult {
  readonly success: boolean;
  readonly scenarioName: string;
  readonly cameraAngle: CameraAngle;
  readonly screenshotPath?: string;
  readonly error?: string;
  readonly meshCount?: number;
  readonly renderTime?: number;
}

/**
 * Scene initialization options for visual testing
 */
export interface VisualTestSceneOptions {
  readonly backgroundColor?: readonly [number, number, number, number];
  readonly lightIntensity?: number;
  readonly enableAntialiasing?: boolean;
  readonly preserveDrawingBuffer?: boolean;
}

/**
 * Mesh generation callback for visual tests
 */
export type MeshGenerationCallback = (scene: Scene) => Promise<AbstractMesh | null>;

/**
 * Scene ready callback for visual tests
 */
export type SceneReadyCallback = (scene: Scene, engine: Engine) => void;

/**
 * Visual test configuration
 */
export interface VisualTestConfig {
  readonly scenarios: readonly VisualTestScenario[];
  readonly sceneOptions?: VisualTestSceneOptions;
  readonly screenshotOptions?: {
    readonly threshold?: number;
    readonly maxDiffPixels?: number;
    readonly animations?: 'disabled' | 'allow';
  };
}

/**
 * Predefined visual test scenarios for 2D primitives
 */
export const DEFAULT_VISUAL_TEST_SCENARIOS: readonly VisualTestScenario[] = [
  {
    name: 'circle-default',
    primitive: 'circle',
    cameraAngles: ['front', 'isometric'],
    parameters: { r: 10 },
    description: 'Default circle with radius 10',
  },
  {
    name: 'circle-diameter',
    primitive: 'circle',
    cameraAngles: ['front', 'top'],
    parameters: { d: 20 },
    description: 'Circle with diameter 20',
  },
  {
    name: 'square-default',
    primitive: 'square',
    cameraAngles: ['front', 'isometric'],
    parameters: { size: 10 },
    description: 'Default square with size 10',
  },
  {
    name: 'square-centered',
    primitive: 'square',
    cameraAngles: ['front', 'side'],
    parameters: { size: [15, 10], center: true },
    description: 'Centered rectangle 15x10',
  },
  {
    name: 'polygon-triangle',
    primitive: 'polygon',
    cameraAngles: ['front', 'isometric'],
    parameters: {
      points: [
        [0, 0],
        [10, 0],
        [5, 8.66],
      ],
    },
    description: 'Triangle polygon',
  },
] as const;

/**
 * Camera configurations for each angle
 */
export const VISUAL_TEST_CAMERA_CONFIGS: Record<CameraAngle, VisualTestCameraConfig> = {
  front: {
    angle: 'front',
    position: [0, 0, 20],
    target: [0, 0, 0],
    alpha: 0,
    beta: Math.PI / 2,
    radius: 20,
  },
  top: {
    angle: 'top',
    position: [0, 20, 0],
    target: [0, 0, 0],
    alpha: 0,
    beta: 0,
    radius: 20,
  },
  side: {
    angle: 'side',
    position: [20, 0, 0],
    target: [0, 0, 0],
    alpha: Math.PI / 2,
    beta: Math.PI / 2,
    radius: 20,
  },
  back: {
    angle: 'back',
    position: [0, 0, -20],
    target: [0, 0, 0],
    alpha: Math.PI,
    beta: Math.PI / 2,
    radius: 20,
  },
  isometric: {
    angle: 'isometric',
    position: [15, 15, 15],
    target: [0, 0, 0],
    alpha: Math.PI / 4,
    beta: Math.PI / 3,
    radius: 25.98, // sqrt(15^2 + 15^2 + 15^2)
  },
} as const;
