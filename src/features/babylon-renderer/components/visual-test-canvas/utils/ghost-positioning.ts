/**
 * @file Ghost Object Positioning Utility
 * 
 * Utility for calculating optimal ghost object positioning to avoid overlap
 * with transformed objects while maintaining visual comparison context.
 * 
 * Following DRY, KISS, and SRP principles:
 * - DRY: Reusable positioning logic for all transformation types
 * - KISS: Simple, clear positioning calculations
 * - SRP: Single responsibility for ghost positioning
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @date June 2025
 */

/**
 * Represents a 3D vector for positioning
 */
export interface Vector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Represents bounding box information
 */
export interface BoundingBox {
  readonly min: Vector3D;
  readonly max: Vector3D;
}

/**
 * Enhanced bounding box with center calculation
 */
export interface CameraBounds extends BoundingBox {
  readonly center: Vector3D;
  readonly size: Vector3D;
}

/**
 * Configuration for ghost object positioning
 */
export interface GhostPositionConfig {
  readonly separationDistance: number;
  readonly minSeparation: number;
  readonly maxSeparation: number;
}

/**
 * Default configuration for ghost positioning
 */
export const DEFAULT_GHOST_CONFIG: GhostPositionConfig = {
  separationDistance: 15, // Default separation distance
  minSeparation: 8,       // Minimum separation to avoid overlap
  maxSeparation: 25       // Maximum separation to keep in view
} as const;

/**
 * Represents different types of transformations
 */
export interface TransformationType {
  readonly type: 'translate' | 'rotate' | 'scale' | 'combined' | 'none';
  readonly values: readonly number[];
  readonly transformations?: readonly TransformationType[];
}

/**
 * Detects the type of transformation from OpenSCAD code
 *
 * @param openscadCode - The OpenSCAD code to analyze
 * @returns The detected transformation type and values
 */
export function detectTransformationType(openscadCode: string): TransformationType {
  const code = openscadCode.trim();

  // Count distinct transformation types
  const hasTranslate = /translate\s*\(\s*\[([^\]]+)\]\s*\)/.test(code);
  const hasRotate = /rotate\s*\(\s*(?:\[([^\]]+)\]|([^)]+))\s*\)/.test(code);
  const hasScale = /scale\s*\(\s*(?:\[([^\]]+)\]|([^)]+))\s*\)/.test(code);

  const transformationCount = [hasTranslate, hasRotate, hasScale].filter(Boolean).length;

  if (transformationCount > 1) {
    // Combined transformations
    const transformations: TransformationType[] = [];

    // Parse each transformation
    const translateMatch = code.match(/translate\s*\(\s*\[([^\]]+)\]\s*\)/);
    if (translateMatch) {
      const values = parseTransformationValues(translateMatch[1]);
      transformations.push({ type: 'translate', values });
    }

    const rotateMatch = code.match(/rotate\s*\(\s*(?:\[([^\]]+)\]|([^)]+))\s*\)/);
    if (rotateMatch) {
      const values = parseTransformationValues(rotateMatch[1] || rotateMatch[2]);
      transformations.push({ type: 'rotate', values });
    }

    const scaleMatch = code.match(/scale\s*\(\s*(?:\[([^\]]+)\]|([^)]+))\s*\)/);
    if (scaleMatch) {
      const values = parseTransformationValues(scaleMatch[1] || scaleMatch[2]);
      transformations.push({ type: 'scale', values });
    }

    return {
      type: 'combined',
      values: [],
      transformations
    };
  }

  // Single transformations
  const translateMatch = code.match(/translate\s*\(\s*\[([^\]]+)\]\s*\)/);
  if (translateMatch) {
    const values = parseTransformationValues(translateMatch[1]);
    return { type: 'translate', values };
  }

  const rotateMatch = code.match(/rotate\s*\(\s*(?:\[([^\]]+)\]|([^)]+))\s*\)/);
  if (rotateMatch) {
    const values = parseTransformationValues(rotateMatch[1] || rotateMatch[2]);
    return { type: 'rotate', values };
  }

  const scaleMatch = code.match(/scale\s*\(\s*(?:\[([^\]]+)\]|([^)]+))\s*\)/);
  if (scaleMatch) {
    const values = parseTransformationValues(scaleMatch[1] || scaleMatch[2]);
    return { type: 'scale', values };
  }

  return { type: 'none', values: [] };
}

/**
 * Parses transformation values from string
 * 
 * @param valuesString - String containing comma-separated values
 * @returns Array of parsed numbers
 */
function parseTransformationValues(valuesString: string): readonly number[] {
  return valuesString
    .split(',')
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));
}

/**
 * Calculates optimal ghost object offset based on transformation type
 * 
 * @param transformation - The detected transformation
 * @param config - Configuration for positioning
 * @returns The calculated offset vector
 */
export function calculateGhostOffset(
  transformation: TransformationType, 
  config: GhostPositionConfig = DEFAULT_GHOST_CONFIG
): Vector3D {
  switch (transformation.type) {
    case 'translate':
      return calculateTranslateOffset(transformation.values, config);
    
    case 'rotate':
      return calculateRotateOffset(transformation.values, config);
    
    case 'scale':
      return calculateScaleOffset(transformation.values, config);
    
    case 'combined':
      return calculateCombinedOffset(transformation.transformations || [], config);
    
    case 'none':
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

/**
 * Calculates offset for translate transformations
 */
function calculateTranslateOffset(values: readonly number[], config: GhostPositionConfig): Vector3D {
  const [tx = 0, ty = 0, tz = 0] = values;
  
  // Position ghost opposite to translation direction
  const separation = Math.max(config.minSeparation, Math.min(config.maxSeparation, config.separationDistance));
  
  return {
    x: tx !== 0 ? -Math.sign(tx) * separation : 0,
    y: ty !== 0 ? -Math.sign(ty) * separation : 0,
    z: tz !== 0 ? -Math.sign(tz) * separation : 0
  };
}

/**
 * Calculates offset for rotate transformations
 */
function calculateRotateOffset(values: readonly number[], config: GhostPositionConfig): Vector3D {
  const separation = config.separationDistance;
  
  // For rotation, position ghost to show rotation effect clearly
  // Use diagonal positioning to show rotation around multiple axes
  return {
    x: -separation * 0.7, // Diagonal positioning
    y: -separation * 0.5,
    z: -separation * 0.5
  };
}

/**
 * Calculates offset for scale transformations
 */
function calculateScaleOffset(values: readonly number[], config: GhostPositionConfig): Vector3D {
  const separation = config.separationDistance;

  // For scaling, position ghost to show size comparison
  // Use diagonal positioning to show scale difference clearly
  return {
    x: -separation * 0.8,
    y: -separation * 0.6,
    z: -separation * 0.4
  };
}

/**
 * Calculates offset for combined transformations
 */
function calculateCombinedOffset(transformations: readonly TransformationType[], config: GhostPositionConfig): Vector3D {
  // For combined transformations, use a strategic positioning
  // that considers the primary transformation effect
  const separation = config.separationDistance * 1.2; // Slightly larger for complex transformations
  
  return {
    x: -separation * 0.8,
    y: -separation * 0.6,
    z: -separation * 0.4
  };
}

/**
 * Calculates camera bounds that include both transformed and ghost objects
 * 
 * @param transformedBounds - Bounding box of the transformed object
 * @param ghostBounds - Bounding box of the ghost object
 * @returns Combined camera bounds with center and size
 */
export function calculateCameraBounds(
  transformedBounds: BoundingBox, 
  ghostBounds: BoundingBox
): CameraBounds {
  const min: Vector3D = {
    x: Math.min(transformedBounds.min.x, ghostBounds.min.x),
    y: Math.min(transformedBounds.min.y, ghostBounds.min.y),
    z: Math.min(transformedBounds.min.z, ghostBounds.min.z)
  };
  
  const max: Vector3D = {
    x: Math.max(transformedBounds.max.x, ghostBounds.max.x),
    y: Math.max(transformedBounds.max.y, ghostBounds.max.y),
    z: Math.max(transformedBounds.max.z, ghostBounds.max.z)
  };
  
  const center: Vector3D = {
    x: (min.x + max.x) * 0.5,
    y: (min.y + max.y) * 0.5,
    z: (min.z + max.z) * 0.5
  };
  
  const size: Vector3D = {
    x: max.x - min.x,
    y: max.y - min.y,
    z: max.z - min.z
  };
  
  return { min, max, center, size };
}
