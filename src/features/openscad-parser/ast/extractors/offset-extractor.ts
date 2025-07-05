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
  // Default values
  let radius = 0;
  let delta = 0;
  let chamfer = false;

  // Extract arguments from the argument_list
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
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
  // Process arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue; // Skip undefined arguments

    // Handle radius parameter (named 'r')
    if (arg.name === 'r') {
      const radiusValue = extractNumberParameter(arg);
      if (radiusValue !== null) {
        radius = radiusValue;
      } else {
        // No action needed if radiusValue is null
      }
    }
    // Handle delta parameter (named 'delta')
    else if (arg.name === 'delta') {
      const deltaValue = extractNumberParameter(arg);
      if (deltaValue !== null) {
        delta = deltaValue;
      } else {
        // No action needed if deltaValue is null
      }
    }
    // Handle chamfer parameter (named 'chamfer')
    else if (arg.name === 'chamfer') {
      const chamferValue = extractBooleanParameter(arg);
      if (chamferValue !== null) {
        chamfer = chamferValue;
      } else {
        // No action needed if chamferValue is null
      }
    }
  }
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
