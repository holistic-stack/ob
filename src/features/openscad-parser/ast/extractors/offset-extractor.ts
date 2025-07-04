import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import { extractBooleanParameter, extractNumberParameter } from './parameter-extractor.js';
// findDescendantOfType is not used in this file

/**
 * Extract an offset node from an accessor expression node
 * @param node The accessor expression node
 * @returns An offset AST node or null if the node cannot be processed
 */
export function extractOffsetNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.OffsetNode | null {
  console.log(`[extractOffsetNode] Processing offset node: ${node.text.substring(0, 50)}`);

  // Default values
  let radius = 0;
  let delta = 0;
  let chamfer = false;

  // Extract arguments from the argument_list
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    console.log(`[extractOffsetNode] No arguments found, using default values`);
    return {
      type: 'offset',
      r: radius,
      delta,
      chamfer,
      children: [],
      location: getLocation(node),
    };
  }

  const args = extractArguments(argsNode, errorHandler, sourceCode);
  console.log(`[extractOffsetNode] Extracted ${args.length} arguments: ${JSON.stringify(args)}`);

  // Process arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue; // Skip undefined arguments

    // Handle radius parameter (named 'r')
    if (arg.name === 'r') {
      const radiusValue = extractNumberParameter(arg);
      if (radiusValue !== null) {
        radius = radiusValue;
        console.log(`[extractOffsetNode] Found radius parameter: ${radius}`);
      } else {
        console.log(`[extractOffsetNode] Invalid radius parameter: ${JSON.stringify(arg.value)}`);
      }
    }
    // Handle delta parameter (named 'delta')
    else if (arg.name === 'delta') {
      const deltaValue = extractNumberParameter(arg);
      if (deltaValue !== null) {
        delta = deltaValue;
        console.log(`[extractOffsetNode] Found delta parameter: ${delta}`);
      } else {
        console.log(`[extractOffsetNode] Invalid delta parameter: ${JSON.stringify(arg.value)}`);
      }
    }
    // Handle chamfer parameter (named 'chamfer')
    else if (arg.name === 'chamfer') {
      const chamferValue = extractBooleanParameter(arg);
      if (chamferValue !== null) {
        chamfer = chamferValue;
        console.log(`[extractOffsetNode] Found chamfer parameter: ${chamfer}`);
      } else {
        console.log(`[extractOffsetNode] Invalid chamfer parameter: ${JSON.stringify(arg.value)}`);
      }
    }
  }

  console.log(
    `[extractOffsetNode] Final parameters: radius=${radius}, delta=${delta}, chamfer=${chamfer}`
  );

  // We don't process children here - that's handled by the transform visitor
  // The transform visitor will populate the children array after this extractor returns
  const children: ast.ASTNode[] = [];

  return {
    type: 'offset',
    r: radius,
    delta,
    chamfer,
    children,
    location: getLocation(node),
  };
}
