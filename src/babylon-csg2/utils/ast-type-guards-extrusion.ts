/**
 * @file AST Type Guards and Parameter Extraction for Extrusion Operations
 * 
 * Provides type guards and parameter extraction utilities for OpenSCAD extrusion operations
 * (linear_extrude, rotate_extrude). These utilities ensure type safety and provide
 * robust parameter extraction with validation and fallback defaults.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import type { 
  ASTNode, 
  LinearExtrudeNode, 
  RotateExtrudeNode,
  Vector2D 
} from '@holistic-stack/openscad-parser';

/**
 * Result type for parameter extraction operations
 */
export type ExtractionResult<T> = {
  readonly success: true;
  readonly value: T;
} | {
  readonly success: false;
  readonly error: string;
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a node is an extrusion operation
 * @param node The AST node to check
 * @returns True if the node is a LinearExtrudeNode or RotateExtrudeNode
 */
export function isExtrusionNode(node: ASTNode): node is LinearExtrudeNode | RotateExtrudeNode {
  return isLinearExtrudeNode(node) || isRotateExtrudeNode(node);
}

/**
 * Type guard to check if a node is a LinearExtrudeNode
 * @param node The AST node to check
 * @returns True if the node is a LinearExtrudeNode
 */
export function isLinearExtrudeNode(node: ASTNode): node is LinearExtrudeNode {
  return node.type === 'linear_extrude';
}

/**
 * Type guard to check if a node is a RotateExtrudeNode
 * @param node The AST node to check
 * @returns True if the node is a RotateExtrudeNode
 */
export function isRotateExtrudeNode(node: ASTNode): node is RotateExtrudeNode {
  return node.type === 'rotate_extrude';
}

// ============================================================================
// LINEAR EXTRUDE PARAMETER EXTRACTION
// ============================================================================

/**
 * Linear extrude parameters with validated types
 */
export interface LinearExtrudeParams {
  readonly height: number;
  readonly center: boolean;
  readonly convexity: number;
  readonly twist: number;
  readonly slices: number;
  readonly scale: readonly [number, number];
  readonly fn: number | undefined;
}

/**
 * Extracts height parameter from LinearExtrudeNode
 * @param node The LinearExtrudeNode to extract from
 * @returns Extraction result with height value
 */
export function extractLinearExtrudeHeight(node: LinearExtrudeNode): ExtractionResult<number> {
  if (typeof node.height !== 'number') {
    return {
      success: false,
      error: `LinearExtrude height must be a number, got: ${typeof node.height}`
    };
  }

  if (node.height <= 0) {
    return {
      success: false,
      error: `LinearExtrude height must be positive, got: ${node.height}`
    };
  }

  return {
    success: true,
    value: node.height
  };
}

/**
 * Extracts scale parameter from LinearExtrudeNode
 * @param node The LinearExtrudeNode to extract from
 * @returns Extraction result with scale as [x, y] tuple
 */
export function extractLinearExtrudeScale(node: LinearExtrudeNode): ExtractionResult<readonly [number, number]> {
  if (node.scale === undefined) {
    return {
      success: true,
      value: [1, 1] as const
    };
  }

  if (typeof node.scale === 'number') {
    return {
      success: true,
      value: [node.scale, node.scale] as const
    };
  }

  if (Array.isArray(node.scale) && node.scale.length === 2) {
    const [x, y] = node.scale;
    if (typeof x === 'number' && typeof y === 'number') {
      return {
        success: true,
        value: [x, y] as const
      };
    }
  }

  return {
    success: false,
    error: `LinearExtrude scale must be a number or [x, y] array, got: ${JSON.stringify(node.scale)}`
  };
}

/**
 * Extracts all parameters from LinearExtrudeNode with validation and defaults
 * @param node The LinearExtrudeNode to extract from
 * @returns Extraction result with complete parameter set
 */
export function extractLinearExtrudeParams(node: LinearExtrudeNode): ExtractionResult<LinearExtrudeParams> {
  const heightResult = extractLinearExtrudeHeight(node);
  if (!heightResult.success) {
    return heightResult;
  }

  const scaleResult = extractLinearExtrudeScale(node);
  if (!scaleResult.success) {
    return scaleResult;
  }

  return {
    success: true,
    value: {
      height: heightResult.value,
      center: node.center ?? false,
      convexity: node.convexity ?? 1,
      twist: node.twist ?? 0,
      slices: node.slices ?? 20,
      scale: scaleResult.value,
      fn: node.$fn
    }
  };
}

// ============================================================================
// ROTATE EXTRUDE PARAMETER EXTRACTION
// ============================================================================

/**
 * Rotate extrude parameters with validated types
 */
export interface RotateExtrudeParams {
  readonly angle: number;
  readonly convexity: number;
  readonly fn: number | undefined;
  readonly fa: number | undefined;
  readonly fs: number | undefined;
}

/**
 * Extracts all parameters from RotateExtrudeNode with validation and defaults
 * @param node The RotateExtrudeNode to extract from
 * @returns Extraction result with complete parameter set
 */
export function extractRotateExtrudeParams(node: RotateExtrudeNode): ExtractionResult<RotateExtrudeParams> {
  const angle = node.angle ?? 360; // Default to full rotation

  if (typeof angle !== 'number') {
    return {
      success: false,
      error: `RotateExtrude angle must be a number, got: ${typeof angle}`
    };
  }

  if (angle <= 0 || angle > 360) {
    return {
      success: false,
      error: `RotateExtrude angle must be between 0 and 360 degrees, got: ${angle}`
    };
  }

  return {
    success: true,
    value: {
      angle,
      convexity: node.convexity ?? 1,
      fn: node.$fn,
      fa: node.$fa,
      fs: node.$fs
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets a human-readable description of an extrusion node
 * @param node The extrusion node to describe
 * @returns A descriptive string
 */
export function getExtrusionDescription(node: LinearExtrudeNode | RotateExtrudeNode): string {
  if (isLinearExtrudeNode(node)) {
    return `LinearExtrude(height=${node.height}, center=${node.center ?? false}, twist=${node.twist ?? 0})`;
  } else {
    return `RotateExtrude(angle=${node.angle ?? 360}, convexity=${node.convexity ?? 1})`;
  }
}

/**
 * Validates that an extrusion node has children
 * @param node The extrusion node to validate
 * @returns Validation result
 */
export function validateExtrusionChildren(node: LinearExtrudeNode | RotateExtrudeNode): ExtractionResult<readonly ASTNode[]> {
  if (!node.children || node.children.length === 0) {
    return {
      success: false,
      error: `${node.type} operation requires at least one child node`
    };
  }

  return {
    success: true,
    value: node.children
  };
}
