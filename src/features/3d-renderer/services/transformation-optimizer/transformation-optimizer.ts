/**
 * @file Transformation Optimizer
 * @description Optimizes multiple transformations into single matrix operations for performance
 * Follows SRP: Single responsibility for transformation chain optimization
 */

import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import type { ASTNode, TranslateNode, RotateNode, ScaleNode, MultmatrixNode } from '../../../openscad-parser/ast/ast-types';
import { createTransformationMatrix } from '../manifold-transformation-helpers/manifold-transformation-helpers';

const logger = createLogger('TransformationOptimizer');

/**
 * Transformation operation for optimization
 */
interface TransformationOperation {
  readonly type: 'translate' | 'rotate' | 'scale' | 'multmatrix';
  readonly v?: readonly [number, number, number]; // For translate/scale
  readonly a?: number | readonly [number, number, number]; // For rotate
  readonly m?: readonly (readonly number[])[];  // For multmatrix
}

/**
 * Extracted transformation chain
 */
interface TransformationChain {
  readonly transformations: readonly TransformationOperation[];
  readonly primitiveNode: ASTNode;
}

/**
 * Optimization result
 */
interface OptimizationResult {
  readonly optimizedMatrix: readonly number[] | null;
  readonly primitiveNode: ASTNode;
  readonly transformationCount: number;
}

/**
 * Extract transformation chain from nested AST nodes
 * Pure function with no side effects
 *
 * @param node - Root AST node to analyze
 * @returns Result with extracted transformation chain
 */
export function extractTransformationChain(node: ASTNode): Result<TransformationChain, string> {
  try {
    const transformations: TransformationOperation[] = [];
    let currentNode = node;

    // Walk down the transformation chain
    while (isTransformationNode(currentNode)) {
      const transformation = extractTransformation(currentNode);
      if (!transformation.success) {
        return transformation;
      }
      
      transformations.push(transformation.data);
      
      // Move to the first child (should be the next transformation or primitive)
      if (currentNode.children && currentNode.children.length > 0) {
        currentNode = currentNode.children[0];
      } else {
        return { success: false, error: 'Transformation node has no children' };
      }
    }

    return {
      success: true,
      data: {
        transformations: Object.freeze(transformations),
        primitiveNode: currentNode,
      },
    };
  } catch (error) {
    const errorMessage = `Failed to extract transformation chain: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Combine multiple transformations into a single matrix
 * Pure function with no side effects
 *
 * @param transformations - Array of transformation operations
 * @returns Result with combined transformation matrix (column-major format)
 */
export function combineTransformationMatrices(
  transformations: readonly TransformationOperation[]
): Result<readonly number[], string> {
  try {
    if (transformations.length === 0) {
      // Return identity matrix
      return {
        success: true,
        data: Object.freeze([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]),
      };
    }

    // Start with identity matrix
    let combinedMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];

    // Apply transformations in order
    for (const transformation of transformations) {
      const matrixResult = createTransformationMatrixFromOperation(transformation);
      if (!matrixResult.success) {
        return matrixResult;
      }

      // Multiply matrices: combinedMatrix = combinedMatrix * transformationMatrix
      combinedMatrix = multiplyMatrices(combinedMatrix, matrixResult.data);
    }

    return { success: true, data: Object.freeze(combinedMatrix) };
  } catch (error) {
    const errorMessage = `Failed to combine transformation matrices: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Optimize a transformation chain by combining multiple transformations into a single matrix
 * Pure function with no side effects
 *
 * @param node - Root AST node to optimize
 * @returns Result with optimization result
 */
export async function optimizeTransformationChain(node: ASTNode): Promise<Result<OptimizationResult, string>> {
  try {
    // Extract transformation chain
    const chainResult = extractTransformationChain(node);
    if (!chainResult.success) {
      return chainResult;
    }

    const { transformations, primitiveNode } = chainResult.data;

    // If no transformations or only one, no optimization needed
    if (transformations.length <= 1) {
      return {
        success: true,
        data: {
          optimizedMatrix: null,
          primitiveNode,
          transformationCount: transformations.length,
        },
      };
    }

    // Combine transformations into single matrix
    const matrixResult = combineTransformationMatrices(transformations);
    if (!matrixResult.success) {
      return matrixResult;
    }

    logger.debug('Successfully optimized transformation chain', {
      originalTransformations: transformations.length,
      primitiveType: primitiveNode.type,
    });

    return {
      success: true,
      data: {
        optimizedMatrix: matrixResult.data,
        primitiveNode,
        transformationCount: transformations.length,
      },
    };
  } catch (error) {
    const errorMessage = `Failed to optimize transformation chain: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if a node is a transformation node
 */
function isTransformationNode(node: ASTNode): boolean {
  return ['translate', 'rotate', 'scale', 'multmatrix'].includes(node.type);
}

/**
 * Extract transformation operation from AST node
 */
function extractTransformation(node: ASTNode): Result<TransformationOperation, string> {
  switch (node.type) {
    case 'translate':
      const translateNode = node as TranslateNode;
      return { success: true, data: { type: 'translate', v: translateNode.v } };
    
    case 'rotate':
      const rotateNode = node as RotateNode;
      return { success: true, data: { type: 'rotate', a: rotateNode.a } };
    
    case 'scale':
      const scaleNode = node as ScaleNode;
      return { success: true, data: { type: 'scale', v: scaleNode.v } };
    
    case 'multmatrix':
      const multmatrixNode = node as MultmatrixNode;
      return { success: true, data: { type: 'multmatrix', m: multmatrixNode.m } };
    
    default:
      return { success: false, error: `Unknown transformation type: ${node.type}` };
  }
}

/**
 * Create transformation matrix from operation
 */
function createTransformationMatrixFromOperation(
  operation: TransformationOperation
): Result<readonly number[], string> {
  switch (operation.type) {
    case 'translate':
      if (!operation.v) {
        return { success: false, error: 'Translation operation missing vector' };
      }
      return createTransformationMatrix({ translation: operation.v });
    
    case 'rotate':
      if (operation.a === undefined) {
        return { success: false, error: 'Rotation operation missing angle' };
      }
      
      if (typeof operation.a === 'number') {
        // Single number means Z-axis rotation
        return createTransformationMatrix({ 
          rotation: { axis: [0, 0, 1], angle: operation.a * Math.PI / 180 }
        });
      } else {
        // Euler angles - for now, just handle Z rotation (simplified)
        const [, , zDeg] = operation.a;
        return createTransformationMatrix({ 
          rotation: { axis: [0, 0, 1], angle: zDeg * Math.PI / 180 }
        });
      }
    
    case 'scale':
      if (!operation.v) {
        return { success: false, error: 'Scale operation missing vector' };
      }
      return createTransformationMatrix({ scale: operation.v });
    
    case 'multmatrix':
      if (!operation.m) {
        return { success: false, error: 'Matrix operation missing matrix' };
      }
      // Convert row-major to column-major
      const matrix = operation.m as number[][];
      return {
        success: true,
        data: [
          matrix[0][0], matrix[1][0], matrix[2][0], matrix[3][0],
          matrix[0][1], matrix[1][1], matrix[2][1], matrix[3][1],
          matrix[0][2], matrix[1][2], matrix[2][2], matrix[3][2],
          matrix[0][3], matrix[1][3], matrix[2][3], matrix[3][3],
        ],
      };
    
    default:
      return { success: false, error: `Unknown transformation type: ${operation.type}` };
  }
}

/**
 * Multiply two 4x4 matrices (column-major format)
 * Column-major format: [m00,m10,m20,m30,m01,m11,m21,m31,m02,m12,m22,m32,m03,m13,m23,m33]
 */
function multiplyMatrices(a: readonly number[], b: readonly number[]): number[] {
  const result = new Array(16);

  // For column-major matrices: result[col*4 + row] = sum(a[k*4 + row] * b[col*4 + k])
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      result[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }

  return result;
}
