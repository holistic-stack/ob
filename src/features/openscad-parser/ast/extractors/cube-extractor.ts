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
  console.log(`[extractCubeNode] Processing cube node: ${node.text.substring(0, 50)}`);
  console.log(`[extractCubeNode] Node type: ${node.type}, childCount: ${node.childCount}`);

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
        console.log(`[extractCubeNode] Found argument_list as child[${i}]`);
        break;
      }
    }
  }

  if (!argsNode) {
    console.log(`[extractCubeNode] No arguments found, using default values`);
    return {
      type: 'cube',
      size,
      center,
      location: getLocation(node),
    };
  }

  console.log(
    `[extractCubeNode] Found arguments node: type=${argsNode.type}, text='${argsNode.text}'`
  );

  const args = extractArguments(argsNode, errorHandler, sourceCode);
  console.log(`[extractCubeNode] Extracted ${args.length} arguments: ${JSON.stringify(args)}`);

  // Process arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle size parameter (first positional parameter or named 'size')
    if ((i === 0 && !arg!.name) || arg!.name === 'size') {
      // Check if it's a vector parameter
      const vectorValue = extractVectorParameter(arg!);
      if (vectorValue && vectorValue.length >= 1) {
        if (vectorValue.length === 3) {
          size = vectorValue as ast.Vector3D;
        } else if (vectorValue.length === 2) {
          const firstElement = vectorValue[0];
          if (typeof firstElement === 'number') {
            size = firstElement;
            console.warn(
              `[extractCubeNode] Cube size given as 2D vector ${JSON.stringify(vectorValue)}, using first element ${firstElement} as scalar size.`
            );
          } else {
            size = 1; // Default fallback
            console.warn(
              `[extractCubeNode] Invalid first element in 2D vector ${JSON.stringify(vectorValue)}, using default size.`
            );
          }
        } else if (vectorValue.length === 1) {
          const firstElement = vectorValue[0];
          if (typeof firstElement === 'number') {
            size = firstElement;
          } else {
            size = 1; // Default fallback
            console.warn(
              `[extractCubeNode] Invalid element in 1D vector ${JSON.stringify(vectorValue)}, using default size.`
            );
          }
        } else {
          // vectorValue.length is 0 or > 3, or other invalid cases.
          size = 1; // Explicitly re-assign default
          console.warn(
            `[extractCubeNode] Invalid vector size parameter: ${JSON.stringify(vectorValue)}, using default size.`
          );
        }
        console.log(`[extractCubeNode] Found vector size: ${JSON.stringify(size)}`);
      } else {
        // vectorValue is null or empty
        const numberValue = extractNumberParameter(arg!, errorHandler);
        if (numberValue !== null) {
          size = numberValue;
        } else {
          size = 1; // Explicitly re-assign default
          console.warn(
            `[extractCubeNode] Could not extract number for size parameter, using default size.`
          );
        }
      }
    }
    // Handle center parameter (second positional parameter or named 'center')
    else if ((i === 1 && !arg!.name) || arg!.name === 'center') {
      const centerValue = extractBooleanParameter(arg!, errorHandler);
      if (centerValue !== null) {
        center = centerValue;
        console.log(`[extractCubeNode] Found center parameter: ${center}`);
      } else {
        console.log(`[extractCubeNode] Invalid center parameter: ${JSON.stringify(arg!.value)}`);
      }
    }
  }

  console.log(`[extractCubeNode] Final parameters: size=${JSON.stringify(size)}, center=${center}`);

  return {
    type: 'cube',
    size,
    center,
    location: getLocation(node),
  };
}
