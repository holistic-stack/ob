/**
 * @file Shape Detector for Three.js Geometries
 * @description Analyzes Three.js BufferGeometry to detect basic shapes for manifold conversion
 *
 * This module follows the Single Responsibility Principle by focusing solely on detecting
 * and analyzing geometric shapes. It provides pattern recognition for common Three.js
 * geometries to enable optimal manifold conversion strategies.
 *
 * @example
 * ```typescript
 * import { detectBasicShape } from './shape-detector';
 * import { BoxGeometry } from 'three';
 *
 * const boxGeometry = new BoxGeometry(2, 1, 0.5);
 * const detection = detectBasicShape(boxGeometry);
 *
 * if (detection?.type === 'cube') {
 *   console.log('Detected cube with size:', detection.params.size);
 * }
 * ```
 */

import type { BufferGeometry } from 'three';
import type { Result } from '../../../../../shared/types/result.types';

/**
 * Supported basic shape types for detection
 */
export type BasicShapeType = 'cube' | 'sphere' | 'cylinder';

/**
 * Parameters for a detected cube shape
 */
export interface CubeParams {
  readonly size: readonly [number, number, number];
}

/**
 * Parameters for a detected sphere shape
 */
export interface SphereParams {
  readonly radius: number;
  readonly detail: number;
}

/**
 * Parameters for a detected cylinder shape
 */
export interface CylinderParams {
  readonly radius: number;
  readonly height: number;
  readonly segments: number;
}

/**
 * Union type for shape parameters
 */
export type ShapeParams = CubeParams | SphereParams | CylinderParams;

/**
 * Result of shape detection analysis
 */
export interface ShapeDetection {
  readonly type: BasicShapeType;
  readonly params: ShapeParams;
  readonly confidence: number; // 0-1 confidence score
}

/**
 * Geometry analysis data extracted from BufferGeometry
 */
interface GeometryAnalysis {
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly hasIndex: boolean;
  readonly boundingBox: {
    readonly width: number;
    readonly height: number;
    readonly depth: number;
  };
}

/**
 * Analyzes a BufferGeometry to extract basic metrics
 *
 * @param geometry - Three.js BufferGeometry to analyze
 * @returns Result containing geometry analysis or error
 */
function analyzeGeometry(geometry: BufferGeometry): Result<GeometryAnalysis, string> {
  try {
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) {
      return { success: false, error: 'Geometry missing position attribute' };
    }

    const vertexCount = positionAttribute.count;
    const index = geometry.getIndex();
    const triangleCount = index ? index.count / 3 : 0;
    const hasIndex = !!index;

    // Compute bounding box for size analysis
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) {
      return { success: false, error: 'Failed to compute bounding box' };
    }

    const analysis: GeometryAnalysis = {
      vertexCount,
      triangleCount,
      hasIndex,
      boundingBox: {
        width: box.max.x - box.min.x,
        height: box.max.y - box.min.y,
        depth: box.max.z - box.min.z,
      },
    };

    return { success: true, data: analysis };
  } catch (error) {
    return {
      success: false,
      error: `Geometry analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Detects if geometry matches a cube pattern
 *
 * Three.js BoxGeometry typically has:
 * - 24 vertices (4 per face × 6 faces for proper normals)
 * - 12 triangles (2 per face × 6 faces)
 *
 * @param analysis - Geometry analysis data
 * @returns Cube detection result or undefined
 */
function detectCube(analysis: GeometryAnalysis): ShapeDetection | undefined {
  // Three.js BoxGeometry pattern
  if (analysis.vertexCount === 24 && analysis.triangleCount === 12 && analysis.hasIndex) {
    const { width, height, depth } = analysis.boundingBox;

    return {
      type: 'cube',
      params: {
        size: [width, height, depth] as const,
      },
      confidence: 0.95, // High confidence for exact match
    };
  }

  // Alternative cube patterns (e.g., custom cubes with 8 vertices)
  if (analysis.vertexCount === 8 && analysis.triangleCount === 12 && analysis.hasIndex) {
    const { width, height, depth } = analysis.boundingBox;

    return {
      type: 'cube',
      params: {
        size: [width, height, depth] as const,
      },
      confidence: 0.9, // Slightly lower confidence for alternative pattern
    };
  }

  return undefined;
}

/**
 * Detects if geometry matches a sphere pattern
 *
 * Three.js SphereGeometry typically has:
 * - Variable vertex count based on segments
 * - Triangle-to-vertex ratio around 1.8-2.2
 * - Roughly spherical bounding box
 *
 * @param analysis - Geometry analysis data
 * @returns Sphere detection result or undefined
 */
function detectSphere(analysis: GeometryAnalysis): ShapeDetection | undefined {
  const { vertexCount, triangleCount, boundingBox } = analysis;

  // Must have reasonable vertex count for a sphere
  if (vertexCount < 50 || vertexCount > 5000 || triangleCount < 100) {
    return undefined;
  }

  // Check triangle-to-vertex ratio (typical for spheres)
  const ratio = triangleCount / vertexCount;
  if (ratio < 1.5 || ratio > 2.5) {
    return undefined;
  }

  // Check if bounding box is roughly cubic (spherical)
  const { width, height, depth } = boundingBox;
  const avgSize = (width + height + depth) / 3;
  const maxDeviation = Math.max(
    Math.abs(width - avgSize),
    Math.abs(height - avgSize),
    Math.abs(depth - avgSize)
  );

  // Allow 20% deviation from perfect sphere
  if (maxDeviation > avgSize * 0.2) {
    return undefined;
  }

  const radius = avgSize / 2;
  const estimatedDetail = Math.round(Math.sqrt(vertexCount / 10)); // Rough estimate

  return {
    type: 'sphere',
    params: {
      radius,
      detail: Math.max(1, estimatedDetail),
    },
    confidence: 0.75, // Lower confidence due to estimation
  };
}

/**
 * Detects if geometry matches a cylinder pattern
 *
 * Three.js CylinderGeometry typically has:
 * - Even vertex count
 * - Specific triangle-to-vertex ratio
 * - Height > width/depth or width/depth > height
 *
 * @param analysis - Geometry analysis data
 * @returns Cylinder detection result or undefined
 */
function detectCylinder(analysis: GeometryAnalysis): ShapeDetection | undefined {
  const { vertexCount, triangleCount, boundingBox } = analysis;

  // Must have reasonable vertex count and even number
  if (vertexCount < 12 || vertexCount % 2 !== 0 || triangleCount < 20) {
    return undefined;
  }

  // Check triangle-to-vertex ratio (typical for cylinders)
  const ratio = triangleCount / vertexCount;
  if (ratio < 1.5 || ratio > 3.0) {
    return undefined;
  }

  const { width, height, depth } = boundingBox;

  // Check if one dimension is significantly larger (cylinder axis)
  const dimensions = [width, height, depth].sort((a, b) => b - a);
  const [largest, middle, smallest] = dimensions;

  // Cylinder should have one large dimension and two similar smaller ones
  if (largest < middle * 1.5 || Math.abs(middle - smallest) > middle * 0.3) {
    return undefined;
  }

  const radius = (middle + smallest) / 4; // Average of the two smaller dimensions
  const cylinderHeight = largest;
  const estimatedSegments = Math.round(vertexCount / 4); // Rough estimate

  return {
    type: 'cylinder',
    params: {
      radius,
      height: cylinderHeight,
      segments: Math.max(8, estimatedSegments),
    },
    confidence: 0.7, // Lower confidence due to complexity
  };
}

/**
 * Detects basic shape patterns in Three.js BufferGeometry
 *
 * Analyzes the geometry's vertex count, triangle count, and bounding box
 * to determine if it matches common patterns for cubes, spheres, or cylinders.
 *
 * @param geometry - Three.js BufferGeometry to analyze
 * @returns Shape detection result or undefined if no pattern matches
 *
 * @example
 * ```typescript
 * import { BoxGeometry } from 'three';
 *
 * const box = new BoxGeometry(2, 1, 0.5);
 * const detection = detectBasicShape(box);
 *
 * if (detection?.type === 'cube') {
 *   console.log('Detected cube:', detection.params.size); // [2, 1, 0.5]
 *   console.log('Confidence:', detection.confidence); // 0.95
 * }
 * ```
 */
export function detectBasicShape(geometry: BufferGeometry): ShapeDetection | undefined {
  const analysisResult = analyzeGeometry(geometry);
  if (!analysisResult.success) {
    return undefined;
  }

  const analysis = analysisResult.data;

  // Try detection in order of confidence/specificity
  const cubeDetection = detectCube(analysis);
  if (cubeDetection) {
    return cubeDetection;
  }

  const sphereDetection = detectSphere(analysis);
  if (sphereDetection) {
    return sphereDetection;
  }

  const cylinderDetection = detectCylinder(analysis);
  if (cylinderDetection) {
    return cylinderDetection;
  }

  return undefined;
}

/**
 * Detects basic shape with detailed analysis information
 *
 * @param geometry - Three.js BufferGeometry to analyze
 * @returns Result containing detection and analysis data or error
 */
export function detectBasicShapeWithAnalysis(geometry: BufferGeometry): Result<
  {
    detection: ShapeDetection | undefined;
    analysis: GeometryAnalysis;
  },
  string
> {
  const analysisResult = analyzeGeometry(geometry);
  if (!analysisResult.success) {
    return analysisResult;
  }

  const analysis = analysisResult.data;
  const detection = detectBasicShape(geometry);

  return {
    success: true,
    data: { detection, analysis },
  };
}
