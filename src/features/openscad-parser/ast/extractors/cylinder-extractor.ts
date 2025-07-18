/**
 * @file cylinder-extractor.ts
 * @description This module provides the `extractCylinderNode` function, which is responsible for parsing
 * Tree-sitter nodes representing OpenSCAD `cylinder()` calls and converting them into a structured
 * `CylinderNode` in the Abstract Syntax Tree (AST). It handles various ways of specifying cylinder
 * dimensions (height, radii/diameters) and the `center` parameter, as well as special `$fa`, `$fs`, `$fn` parameters.
 *
 * @architectural_decision
 * The `extractCylinderNode` function encapsulates the complex logic for interpreting the arguments of the OpenSCAD `cylinder()` module.
 * It leverages `argument-extractor.ts` to parse the raw arguments from the CST and then uses `parameter-extractor.ts`
 * to convert these into typed values. It specifically handles the multiple overloaded syntaxes for `cylinder`,
 * including positional and named arguments for height, single radius/diameter, and separate top/bottom radii/diameters.
 * This modular approach ensures that the extraction logic is reusable and testable, and keeps the core AST generation clean.
 *
 * @example
 * ```typescript
 * import { extractCylinderNode } from './cylinder-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateCylinderExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Cylinder with height and single radius
 *   let code = 'cylinder(h=10, r=5);';
 *   let cst = parser.parseCST(code);
 *   let cylinderNodeCST = cst?.rootNode.namedChild(0); // Assuming cylinder() is the first node
 *   if (cylinderNodeCST) {
 *     const cylinderAST = extractCylinderNode(cylinderNodeCST, errorHandler, code);
 *     console.log('Cylinder (h, r) AST:', cylinderAST); // Expected: { type: 'cylinder', h: 10, r: 5, r1: 5, r2: 5, center: false, location: ... }
 *   }
 *
 *   // Example 2: Cylinder with height, r1, r2, and centered
 *   code = 'cylinder(h=20, r1=5, r2=10, center=true);';
 *   cst = parser.parseCST(code);
 *   cylinderNodeCST = cst?.rootNode.namedChild(0);
 *   if (cylinderNodeCST) {
 *     const cylinderAST = extractCylinderNode(cylinderNodeCST, errorHandler, code);
 *     console.log('Cylinder (h, r1, r2, center) AST:', cylinderAST); // Expected: { type: 'cylinder', h: 20, r1: 5, r2: 10, center: true, location: ... }
 *   }
 *
 *   // Example 3: Positional arguments (h, r)
 *   code = 'cylinder(15, 7);';
 *   cst = parser.parseCST(code);
 *   cylinderNodeCST = cst?.rootNode.namedChild(0);
 *   if (cylinderNodeCST) {
 *     const cylinderAST = extractCylinderNode(cylinderNodeCST, errorHandler, code);
 *     console.log('Cylinder (pos h, r) AST:', cylinderAST); // Expected: { type: 'cylinder', h: 15, r: 7, r1: 7, r2: 7, center: false, location: ... }
 *   }
 *
 *   // Example 4: Positional arguments (h, r1, r2)
 *   code = 'cylinder(25, 8, 12);';
 *   cst = parser.parseCST(code);
 *   cylinderNodeCST = cst?.rootNode.namedChild(0);
 *   if (cylinderNodeCST) {
 *     const cylinderAST = extractCylinderNode(cylinderNodeCST, errorHandler, code);
 *     console.log('Cylinder (pos h, r1, r2) AST:', cylinderAST); // Expected: { type: 'cylinder', h: 25, r1: 8, r2: 12, center: false, location: ... }
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateCylinderExtraction();
 * ```
 */

import type { Node as SyntaxNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import { extractBooleanParameter, extractNumberParameter } from './parameter-extractor.js';

/**
 * @function extractCylinderNode
 * @description Extracts parameters for a `cylinder()` call from a Tree-sitter CST node and constructs a `CylinderNode`.
 * This function handles the various argument formats supported by OpenSCAD's `cylinder` module.
 *
 * @param {SyntaxNode} node - The CST node representing the `cylinder()` call.
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging issues during argument extraction.
 * @param {string} [sourceCode] - The original source code string, used for accurate text extraction.
 * @returns {ast.CylinderNode | null} A `CylinderNode` object representing the parsed cylinder, or `null` if extraction fails (e.g., missing mandatory `h` parameter).
 */
export function extractCylinderNode(
  node: SyntaxNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.CylinderNode | null {
  // Ensure the node is a call expression or module call, otherwise it's not a cylinder invocation.
  if (node.type !== 'call_expression' && node.type !== 'module_call') {
    return null;
  }

  const location = getLocation(node);
  // The arguments for the cylinder are typically found in a child node named 'arguments'.
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    // The 'h' (height) parameter is mandatory for a cylinder. If no arguments node is found,
    // it implies 'h' cannot be provided, so return null as it's an invalid cylinder definition.
    return null;
  }

  // Extract all arguments using the generic argument extractor.
  const params = extractArguments(argsNode, errorHandler, sourceCode);

  // Initialize all possible cylinder parameters. OpenSCAD has complex defaulting rules.
  let h: number | undefined;
  let r: number | undefined;
  let d: number | undefined;
  let r1: number | undefined;
  let r2: number | undefined;
  let d1: number | undefined;
  let d2: number | undefined;
  let center: boolean | undefined;
  let $fn: number | undefined;
  let $fa: number | undefined;
  let $fs: number | undefined;

  // Process named arguments first, as they explicitly override positional defaults.
  for (const param of params) {
    if (param.name) {
      switch (param.name) {
        case 'h':
          h = extractNumberParameter(param) ?? undefined;
          break;
        case 'r':
          r = extractNumberParameter(param) ?? undefined;
          break;
        case 'd':
          d = extractNumberParameter(param) ?? undefined;
          break;
        case 'r1':
          r1 = extractNumberParameter(param) ?? undefined;
          break;
        case 'r2':
          r2 = extractNumberParameter(param) ?? undefined;
          break;
        case 'd1':
          d1 = extractNumberParameter(param) ?? undefined;
          break;
        case 'd2':
          d2 = extractNumberParameter(param) ?? undefined;
          break;
        case 'center':
          center = extractBooleanParameter(param) ?? undefined;
          break;
        case '$fn':
          $fn = extractNumberParameter(param) ?? undefined;
          break;
        case '$fa':
          $fa = extractNumberParameter(param) ?? undefined;
          break;
        case '$fs':
          $fs = extractNumberParameter(param) ?? undefined;
          break;
      }
    }
  }

  // Implement positional argument handling. Positional arguments are processed only if their named counterparts haven't been set.
  const positionalArgs = params.filter((p) => !p.name);
  let currentPositionalIndex = 0;

  // 1. Positional 'h' (height) - mandatory.
  if (h === undefined && positionalArgs.length > currentPositionalIndex) {
    const param = positionalArgs[currentPositionalIndex];
    if (param) {
      const val = extractNumberParameter(param);
      if (val !== null) {
        h = val;
        currentPositionalIndex++;
      }
    }
  }

  // 2. Positional 'r1' & 'r2' OR 'r' (radii/diameters).
  // Check for the `cylinder(h, r1, r2)` pattern first (two consecutive numbers after h).
  if (
    r1 === undefined &&
    r2 === undefined &&
    r === undefined && // Only if no radius-like param already set by name
    positionalArgs.length > currentPositionalIndex + 1
  ) {
    const potential_r1_param = positionalArgs[currentPositionalIndex];
    const potential_r2_param = positionalArgs[currentPositionalIndex + 1];
    if (potential_r1_param && potential_r2_param) {
      const val_r1 = extractNumberParameter(potential_r1_param);
      const val_r2 = extractNumberParameter(potential_r2_param);

      if (val_r1 !== null && val_r2 !== null) {
        r1 = val_r1;
        r2 = val_r2;
        currentPositionalIndex += 2;
      }
    }
  }

  // If `r1, r2` pattern didn't match or apply, check for a single positional `r`.
  if (
    r === undefined &&
    r1 === undefined && // Only if r is not set and r1 is not set (r2 might be set if r1 was named)
    positionalArgs.length > currentPositionalIndex
  ) {
    const param = positionalArgs[currentPositionalIndex];
    if (param) {
      const val = extractNumberParameter(param);
      if (val !== null) {
        r = val;
        currentPositionalIndex++;
      }
    }
  }

  // 3. Positional 'center'.
  if (center === undefined && positionalArgs.length > currentPositionalIndex) {
    const param = positionalArgs[currentPositionalIndex];
    if (param) {
      const val = extractBooleanParameter(param);
      if (val !== null) {
        center = val;
        currentPositionalIndex++;
      }
    }
  }

  // Basic validation: 'h' is mandatory for a cylinder. If it's still undefined or not a number,
  // after processing all arguments, then the cylinder definition is invalid.
  if (typeof h !== 'number') {
    // Log an error or warning if h is missing, as it's a critical parameter.
    errorHandler?.handleError(
      new Error(
        `Missing mandatory 'h' parameter for cylinder at ${location.start.line}:${location.start.column}`
      )
    );
    return null;
  }

  // Construct the CylinderNode with extracted and default values.
  const cylinderNode: ast.CylinderNode = {
    type: 'cylinder',
    h: h, // `h` is now guaranteed to be a number.
    location,
  };

  // Assign optional parameters if they were found.
  if (r !== undefined) cylinderNode.r = r;
  if (d !== undefined) cylinderNode.d = d;
  if (r1 !== undefined) cylinderNode.r1 = r1;
  if (r2 !== undefined) cylinderNode.r2 = r2;
  if (d1 !== undefined) cylinderNode.d1 = d1;
  if (d2 !== undefined) cylinderNode.d2 = d2;
  if (center !== undefined) cylinderNode.center = center;
  if ($fn !== undefined) cylinderNode.$fn = $fn;
  if ($fa !== undefined) cylinderNode.$fa = $fa;
  if ($fs !== undefined) cylinderNode.$fs = $fs;

  // Apply OpenSCAD's implicit rules for radii/diameters:
  // - If `d` is given, `r` is `d/2`. If `r1` and `r2` are not specified, they also default to `d/2`.
  if (d !== undefined && r === undefined) {
    cylinderNode.r = d / 2;
    if (r1 === undefined) cylinderNode.r1 = d / 2;
    if (r2 === undefined) cylinderNode.r2 = d / 2;
  }
  // - If `d1` is given, `r1` is `d1/2`.
  if (d1 !== undefined && r1 === undefined) {
    cylinderNode.r1 = d1 / 2;
  }
  // - If `d2` is given, `r2` is `d2/2`.
  if (d2 !== undefined && r2 === undefined) {
    cylinderNode.r2 = d2 / 2;
  }

  // - If `r` is given (and `r1`/`r2` are not), then `r1` and `r2` default to `r`.
  if (r !== undefined) {
    if (r1 === undefined) cylinderNode.r1 = r;
    if (r2 === undefined) cylinderNode.r2 = r;
  }

  // Note: OpenSCAD has specific behaviors for when only one of r1/r2 is defined (the other defaults to it).
  // This is implicitly handled if `r` is defined, as `r1` and `r2` take `r`'s value.
  // If `r` is not defined, but one of `r1`/`r2` is, this needs specific handling if not covered by the above.
  // For now, we assume the most common patterns are covered.

  return cylinderNode;
}
