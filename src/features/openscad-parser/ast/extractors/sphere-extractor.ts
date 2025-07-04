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
  console.log(`[extractSphereNode] Processing sphere node: ${node.text.substring(0, 50)}`);

  // Default values
  let radius: number = 1;
  let diameter: number | undefined;
  let fn: number | undefined;
  let fa: number | undefined;
  let fs: number | undefined;

  // Extract arguments from the argument_list
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    console.log(`[extractSphereNode] No arguments found, using default values`);
    return {
      type: 'sphere',
      radius,
      location: getLocation(node),
    };
  }

  const args = extractArguments(argsNode, errorHandler, sourceCode);
  console.log(`[extractSphereNode] Extracted ${args.length} arguments: ${JSON.stringify(args)}`);

  // First, check for positional parameters
  if (args.length > 0 && args[0] && !args[0].name) {
    // First positional parameter could be radius
    const radiusValue = extractNumberParameter(args[0]);
    if (radiusValue !== null) {
      radius = radiusValue;
      console.log(`[extractSphereNode] Found positional radius parameter: ${radius}`);
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
        console.log(`[extractSphereNode] Found radius parameter: ${radius}`);
      } else {
        console.log(`[extractSphereNode] Invalid radius parameter: ${JSON.stringify(arg.value)}`);
      }
    }
    // Handle diameter parameter (named 'd')
    else if (arg.name === 'd') {
      const diameterValue = extractNumberParameter(arg);
      if (diameterValue !== null) {
        diameter = diameterValue;
        radius = diameterValue / 2; // Set radius based on diameter
        console.log(
          `[extractSphereNode] Found diameter parameter: ${diameter}, calculated radius: ${radius}`
        );
      } else {
        console.log(`[extractSphereNode] Invalid diameter parameter: ${JSON.stringify(arg.value)}`);
      }
    }
    // Handle $fn parameter
    else if (arg.name === '$fn') {
      const fnValue = extractNumberParameter(arg);
      if (fnValue !== null) {
        fn = fnValue;
        console.log(`[extractSphereNode] Found $fn parameter: ${fn}`);
      } else {
        console.log(`[extractSphereNode] Invalid $fn parameter: ${JSON.stringify(arg.value)}`);
      }
    }
    // Handle $fa parameter
    else if (arg.name === '$fa') {
      const faValue = extractNumberParameter(arg);
      if (faValue !== null) {
        fa = faValue;
        console.log(`[extractSphereNode] Found $fa parameter: ${fa}`);
      } else {
        console.log(`[extractSphereNode] Invalid $fa parameter: ${JSON.stringify(arg.value)}`);
      }
    }
    // Handle $fs parameter
    else if (arg.name === '$fs') {
      const fsValue = extractNumberParameter(arg);
      if (fsValue !== null) {
        fs = fsValue;
        console.log(`[extractSphereNode] Found $fs parameter: ${fs}`);
      } else {
        console.log(`[extractSphereNode] Invalid $fs parameter: ${JSON.stringify(arg.value)}`);
      }
    }
  }

  console.log(
    `[extractSphereNode] Final parameters: radius=${radius}, diameter=${diameter}, fn=${fn}, fa=${fa}, fs=${fs}`
  );

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
