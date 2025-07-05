import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import {
  extractBooleanParameter,
  extractNumberParameter,
  extractVectorParameter,
} from './parameter-extractor.js';
// findDescendantOfType is not used in this file

/**
 * Extract a cube node from an accessor expression node
 * @param node The accessor expression node
 * @param errorHandler Optional error handler for enhanced expression evaluation
 * @returns A cube AST node or null if the node cannot be processed
 */
export function extractCubeNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.CubeNode | null {
  // Initialize parameters with default values
  let size: number | ast.Vector3D = 1; // Default size to 1
  let center = false; // Default center to false

  // Find the argument_list node - it could be a direct child or a field
  let argsNode: TSNode | null = null;

  // First try to get it as a field (for module_instantiation nodes)
  argsNode = node.childForFieldName('arguments');

  // If not found as field, look for argument_list as a direct child (for accessor_expression nodes)
  if (!argsNode) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'argument_list') {
        argsNode = child;
        break;
      }
    }
  }

  if (!argsNode) {
    return {
      type: 'cube',
      size,
      center,
      location: getLocation(node),
    };
  }

  const args = extractArguments(argsNode, errorHandler, sourceCode);
  // Process arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle size parameter (first positional parameter or named 'size')
    if ((i === 0 && !arg?.name) || arg?.name === 'size') {
      // Check if it's a vector parameter
      const vectorValue = arg ? extractVectorParameter(arg) : null;
      if (vectorValue && vectorValue.length >= 1) {
        if (vectorValue.length === 3) {
          size = vectorValue as ast.Vector3D;
        } else if (vectorValue.length === 2) {
          const firstElement = vectorValue[0];
          if (typeof firstElement === 'number') {
            size = firstElement;
          } else {
            size = 1; // Default fallback
          }
        } else if (vectorValue.length === 1) {
          const firstElement = vectorValue[0];
          if (typeof firstElement === 'number') {
            size = firstElement;
          } else {
            size = 1; // Default fallback
          }
        } else {
          // vectorValue.length is 0 or > 3, or other invalid cases.
          size = 1; // Explicitly re-assign default
        }
      } else {
        // vectorValue is null or empty
        const numberValue = arg ? extractNumberParameter(arg, errorHandler) : null;
        if (numberValue !== null) {
          size = numberValue;
        } else {
          size = 1; // Explicitly re-assign default
        }
      }
    }
    // Handle center parameter (second positional parameter or named 'center')
    else if ((i === 1 && !arg?.name) || arg?.name === 'center') {
      const centerValue = arg ? extractBooleanParameter(arg, errorHandler) : null;
      if (centerValue !== null) {
        center = centerValue;
      } else {
        // No action needed if centerValue is null
      }
    }
  }
  return {
    type: 'cube',
    size,
    center,
    location: getLocation(node),
  };
}
