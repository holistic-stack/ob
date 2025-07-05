import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import { extractNumberParameter } from './parameter-extractor.js';

/**
 * Extract a sphere node from an accessor expression node
 * @param node The accessor expression node
 * @returns A sphere AST node or null if the node cannot be processed
 */
export function extractSphereNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.SphereNode | null {
  // Default values
  let radius: number = 1;
  let diameter: number | undefined;
  let fn: number | undefined;
  let fa: number | undefined;
  let fs: number | undefined;

  // Extract arguments from the argument_list
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    return {
      type: 'sphere',
      radius,
      location: getLocation(node),
    };
  }

  const args = extractArguments(argsNode, errorHandler, sourceCode);
  // First, check for positional parameters
  if (args.length > 0 && args[0] && !args[0].name) {
    // First positional parameter could be radius
    const radiusValue = extractNumberParameter(args[0]);
    if (radiusValue !== null) {
      radius = radiusValue;
    }
  }

  // Then process all named parameters
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
    // Handle diameter parameter (named 'd')
    else if (arg.name === 'd') {
      const diameterValue = extractNumberParameter(arg);
      if (diameterValue !== null) {
        diameter = diameterValue;
        radius = diameterValue / 2; // Set radius based on diameter
      } else {
        // No action needed if diameterValue is null
      }
    }
    // Handle $fn parameter
    else if (arg.name === '$fn') {
      const fnValue = extractNumberParameter(arg);
      if (fnValue !== null) {
        fn = fnValue;
      } else {
        // No action needed if fnValue is null
      }
    }
    // Handle $fa parameter
    else if (arg.name === '$fa') {
      const faValue = extractNumberParameter(arg);
      if (faValue !== null) {
        fa = faValue;
      } else {
        // No action needed if faValue is null
      }
    }
    // Handle $fs parameter
    else if (arg.name === '$fs') {
      const fsValue = extractNumberParameter(arg);
      if (fsValue !== null) {
        fs = fsValue;
      } else {
        // No action needed if fsValue is null
      }
    }
  }
  // Create the sphere node with the appropriate parameters
  if (diameter !== undefined) {
    return {
      type: 'sphere',
      radius,
      diameter,
      ...(fn !== undefined && { fn }),
      ...(fa !== undefined && { fa }),
      ...(fs !== undefined && { fs }),
      location: getLocation(node),
    };
  } else {
    return {
      type: 'sphere',
      radius,
      ...(fn !== undefined && { fn }),
      ...(fa !== undefined && { fa }),
      ...(fs !== undefined && { fs }),
      location: getLocation(node),
    };
  }
}
