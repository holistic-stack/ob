/**
 * @file sphere-extractor.ts
 * @description This module provides the `extractSphereNode` function, which is responsible for parsing
 * Tree-sitter nodes representing OpenSCAD `sphere()` calls and converting them into a structured
 * `SphereNode` in the Abstract Syntax Tree (AST). It handles various ways of specifying sphere dimensions
 * (radius or diameter) and special `$fa`, `$fs`, `$fn` parameters.
 *
 * @architectural_decision
 * The `extractSphereNode` function encapsulates the logic for interpreting the arguments of the OpenSCAD `sphere()` module.
 * It leverages `argument-extractor.ts` to parse the raw arguments from the CST and then uses `parameter-extractor.ts`
 * to convert these into typed values. This modular approach ensures that the extraction logic is reusable and testable,
 * and keeps the core AST generation clean. It specifically handles the OpenSCAD convention where `d` (diameter) overrides `r` (radius).
 *
 * @example
 * ```typescript
 * import { extractSphereNode } from './sphere-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateSphereExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Sphere with radius
 *   let code = 'sphere(r=10);';
 *   let cst = parser.parseCST(code);
 *   let sphereNodeCST = cst?.rootNode.namedChild(0); // Assuming sphere() is the first node
 *   if (sphereNodeCST) {
 *     const sphereAST = extractSphereNode(sphereNodeCST, errorHandler, code);
 *     console.log('Radius Sphere AST:', sphereAST); // Expected: { type: 'sphere', radius: 10, location: ... }
 *   }
 *
 *   // Example 2: Sphere with diameter
 *   code = 'sphere(d=20);';
 *   cst = parser.parseCST(code);
 *   sphereNodeCST = cst?.rootNode.namedChild(0);
 *   if (sphereNodeCST) {
 *     const sphereAST = extractSphereNode(sphereNodeCST, errorHandler, code);
 *     console.log('Diameter Sphere AST:', sphereAST); // Expected: { type: 'sphere', radius: 10, diameter: 20, location: ... }
 *   }
 *
 *   // Example 3: Positional radius
 *   code = 'sphere(5);';
 *   cst = parser.parseCST(code);
 *   sphereNodeCST = cst?.rootNode.namedChild(0);
 *   if (sphereNodeCST) {
 *     const sphereAST = extractSphereNode(sphereNodeCST, errorHandler, code);
 *     console.log('Positional Radius Sphere AST:', sphereAST); // Expected: { type: 'sphere', radius: 5, location: ... }
 *   }
 *
 *   // Example 4: Sphere with $fn parameter
 *   code = 'sphere(r=10, $fn=100);';
 *   cst = parser.parseCST(code);
 *   sphereNodeCST = cst?.rootNode.namedChild(0);
 *   if (sphereNodeCST) {
 *     const sphereAST = extractSphereNode(sphereNodeCST, errorHandler, code);
 *     console.log('Sphere with $fn AST:', sphereAST); // Expected: { type: 'sphere', radius: 10, $fn: 100, location: ... }
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateSphereExtraction();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import {
  extractNumberParameter,
  extractNumberParameterOrReference,
} from './parameter-extractor.js';

/**
 * @function extractSphereNode
 * @description Extracts parameters for a `sphere()` call from a Tree-sitter CST node and constructs a `SphereNode`.
 * This function handles the `r` (radius), `d` (diameter), and special `$fa`, `$fs`, `$fn` parameters of the OpenSCAD `sphere` module.
 *
 * @param {TSNode} node - The Tree-sitter node corresponding to a `sphere()` call.
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging issues during argument extraction.
 * @param {string} [sourceCode] - The original source code string, used for accurate text extraction.
 * @returns {ast.SphereNode | null} A `SphereNode` object representing the parsed sphere, or `null` if the node cannot be processed.
 */
export function extractSphereNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.SphereNode | null {
  // Check if this is actually a sphere node by verifying its name.
  const nameNode = node.childForFieldName('name');
  if (!nameNode || nameNode.text !== 'sphere') {
    return null;
  }

  // Initialize parameters with default values as per OpenSCAD specification.
  let radius: number | string = 1; // Default radius is 1, can be parameter reference
  let diameter: number | string | undefined;
  let fn: number | undefined;
  let fa: number | undefined;
  let fs: number | undefined;

  // The arguments for the sphere are typically found in a child node named 'arguments'.
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    // If no arguments node is found, return a SphereNode with default radius.
    return {
      type: 'sphere',
      radius,
      location: getLocation(node),
    };
  }

  // Extract all arguments using the generic argument extractor.
  const args = extractArguments(argsNode, errorHandler, sourceCode);

  // First, process positional parameters. The first positional parameter is typically the radius.
  if (args.length > 0 && args[0] && !args[0].name) {
    const radiusValue = extractNumberParameterOrReference(args[0]);
    if (radiusValue !== null) {
      radius = radiusValue;
    }
  }

  // Then process all named parameters. Named parameters override positional ones.
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue; // Skip undefined arguments

    // Handle 'r' parameter (named radius).
    if (arg.name === 'r') {
      const radiusValue = extractNumberParameterOrReference(arg);
      if (radiusValue !== null) {
        radius = radiusValue;
      } else {
        // If radius value is not a valid number or reference, it's ignored.
      }
    }
    // Handle 'd' parameter (named diameter).
    // In OpenSCAD, if both r and d are specified, d takes precedence.
    else if (arg.name === 'd') {
      const diameterValue = extractNumberParameterOrReference(arg);
      if (diameterValue !== null) {
        diameter = diameterValue;
        // Only calculate radius if diameter is a number, not a parameter reference
        if (typeof diameterValue === 'number') {
          radius = diameterValue / 2; // Set radius based on diameter, as diameter overrides radius.
        } else {
          // If diameter is a parameter reference, store it and let module resolution handle it
          radius = diameterValue; // Use the parameter reference
        }
      } else {
        // If diameter value is not a valid number or reference, it's ignored.
      }
    }
    // Handle special `$fn` parameter.
    else if (arg.name === '$fn') {
      const fnValue = extractNumberParameter(arg);
      if (fnValue !== null) {
        fn = fnValue;
      } else {
        // If $fn value is not a valid number, it's ignored.
      }
    }
    // Handle special `$fa` parameter.
    else if (arg.name === '$fa') {
      const faValue = extractNumberParameter(arg);
      if (faValue !== null) {
        fa = faValue;
      } else {
        // If $fa value is not a valid number, it's ignored.
      }
    }
    // Handle special `$fs` parameter.
    else if (arg.name === '$fs') {
      const fsValue = extractNumberParameter(arg);
      if (fsValue !== null) {
        fs = fsValue;
      } else {
        // If $fs value is not a valid number, it's ignored.
      }
    }
  }

  // Construct the SphereNode. Include diameter only if it was explicitly specified.
  if (diameter !== undefined) {
    return {
      type: 'sphere',
      radius,
      diameter,
      ...(fn !== undefined && { $fn: fn }),
      ...(fa !== undefined && { $fa: fa }),
      ...(fs !== undefined && { $fs: fs }),
      location: getLocation(node),
    };
  } else {
    return {
      type: 'sphere',
      radius,
      ...(fn !== undefined && { $fn: fn }),
      ...(fa !== undefined && { $fa: fa }),
      ...(fs !== undefined && { $fs: fs }),
      location: getLocation(node),
    };
  }
}
