import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import {
  extractNumberParameter,
  extractStringParameter,
  extractVectorParameter,
} from './parameter-extractor.js';
// findDescendantOfType is not used in this file

/**
 * Extract a color node from an accessor expression node
 * @param node The accessor expression node
 * @returns A color AST node or null if the node cannot be processed
 */
export function extractColorNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.ColorNode | null {
  console.log(`[extractColorNode] Processing color node: ${node.text.substring(0, 50)}`);

  // Default values
  let color: string | ast.Vector4D = 'red';
  let alpha: number | undefined;

  // Extract arguments from the argument_list
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    console.log(`[extractColorNode] No arguments found, using default values`);
    return {
      type: 'color',
      c: color,
      children: [],
      location: getLocation(node),
    };
  }

  const args = extractArguments(argsNode, errorHandler, sourceCode);
  console.log(`[extractColorNode] Extracted ${args.length} arguments: ${JSON.stringify(args)}`);

  // Process arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle color parameter (first positional parameter or named 'c')
    if ((i === 0 && !arg?.name) || arg?.name === 'c') {
      // Check if it's a vector parameter (RGB or RGBA)
      const vectorValue = extractVectorParameter(arg!);
      if (vectorValue) {
        if (vectorValue.length === 3) {
          // Convert RGB to RGBA by adding alpha=1
          color = [vectorValue[0], vectorValue[1], vectorValue[2], 1.0] as ast.Vector4D;
          console.log(
            `[extractColorNode] Found RGB color, converted to RGBA: ${JSON.stringify(color)}`
          );
        } else if (vectorValue.length === 4) {
          color = [vectorValue[0], vectorValue[1], vectorValue[2], vectorValue[3]] as ast.Vector4D;
          alpha = vectorValue[3];
          console.log(`[extractColorNode] Found RGBA color: ${JSON.stringify(color)}`);
        } else {
          console.log(`[extractColorNode] Invalid color vector length: ${vectorValue.length}`);
        }
      } else {
        // Try as a string parameter (color name or hex)
        const stringValue = extractStringParameter(arg!);
        if (stringValue !== null) {
          color = stringValue;
          console.log(`[extractColorNode] Found color name: ${color}`);
        } else {
          console.log(`[extractColorNode] Invalid color parameter: ${JSON.stringify(arg?.value)}`);
        }
      }
    }
    // Handle alpha parameter (second positional parameter or named 'alpha')
    else if ((i === 1 && !arg?.name) || arg?.name === 'alpha') {
      const alphaValue = extractNumberParameter(arg!);
      if (alphaValue !== null) {
        alpha = alphaValue;
        console.log(`[extractColorNode] Found alpha parameter: ${alpha}`);
      } else {
        console.log(`[extractColorNode] Invalid alpha parameter: ${JSON.stringify(arg?.value)}`);
      }
    }
  }

  console.log(
    `[extractColorNode] Final parameters: color=${JSON.stringify(color)}, alpha=${alpha}`
  );

  // We don't process children here - that's handled by the transform visitor
  // The transform visitor will populate the children array after this extractor returns
  const children: ast.ASTNode[] = [];

  return {
    type: 'color',
    c: color,
    children,
    location: getLocation(node),
  };
}
