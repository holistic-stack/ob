/**
 * @file cube-extractor.ts
 * @description This module provides the `extractCubeNode` function, which is responsible for parsing
 * Tree-sitter nodes representing OpenSCAD `cube()` calls and converting them into a structured
 * `CubeNode` in the Abstract Syntax Tree (AST). It handles various ways of specifying cube dimensions
 * and the `center` parameter.
 *
 * @architectural_decision
 * The `extractCubeNode` function encapsulates the logic for interpreting the arguments of the OpenSCAD `cube()` module.
 * It leverages `argument-extractor.ts` to parse the raw arguments from the CST and then uses `parameter-extractor.ts`
 * to convert these into typed values. This modular approach ensures that the extraction logic is reusable and testable,
 * and keeps the core AST generation clean.
 *
 * @example
 * ```typescript
 * import { extractCubeNode } from './cube-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateCubeExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Cube with single size parameter
 *   let code = 'cube(10);';
 *   let cst = parser.parseCST(code);
 *   let cubeNodeCST = cst?.rootNode.namedChild(0); // Assuming cube() is the first node
 *   if (cubeNodeCST) {
 *     const cubeAST = extractCubeNode(cubeNodeCST, errorHandler, code);
 *     console.log('Single Size Cube AST:', cubeAST); // Expected: { type: 'cube', size: 10, center: false, location: ... }
 *   }
 *
 *   // Example 2: Cube with vector size parameter and centered
 *   code = 'cube([10, 20, 30], center=true);';
 *   cst = parser.parseCST(code);
 *   cubeNodeCST = cst?.rootNode.namedChild(0);
 *   if (cubeNodeCST) {
 *     const cubeAST = extractCubeNode(cubeNodeCST, errorHandler, code);
 *     console.log('Vector Size Centered Cube AST:', cubeAST); // Expected: { type: 'cube', size: [10, 20, 30], center: true, location: ... }
 *   }
 *
 *   // Example 3: Cube with named size parameter
 *   code = 'cube(size=5);';
 *   cst = parser.parseCST(code);
 *   cubeNodeCST = cst?.rootNode.namedChild(0);
 *   if (cubeNodeCST) {
 *     const cubeAST = extractCubeNode(cubeNodeCST, errorHandler, code);
 *     console.log('Named Size Cube AST:', cubeAST); // Expected: { type: 'cube', size: 5, center: false, location: ... }
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateCubeExtraction();
 * ```
 */

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

/**
 * @function extractCubeNode
 * @description Extracts cube parameters from a Tree-sitter node representing an OpenSCAD `cube()` call.
 * It parses the arguments to determine the `size` (scalar or vector) and `center` parameters,
 * and constructs a `CubeNode` for the AST.
 *
 * @param {TSNode} node - The Tree-sitter node corresponding to a `cube()` call.
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging issues during argument extraction.
 * @param {string} [sourceCode] - The original source code string, used for accurate text extraction.
 * @param {Map<string, ast.ParameterValue>} [variableScope] - Optional variable scope for resolving identifiers within arguments.
 * @returns {ast.CubeNode | null} A `CubeNode` object representing the parsed cube, or `null` if the node cannot be processed.
 */
export function extractCubeNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string,
  variableScope?: Map<string, ast.ParameterValue>
): ast.CubeNode | null {
  // Initialize parameters with default values as per OpenSCAD specification.
  let size: number | ast.Vector3D = 1; // Default size is 1 (a 1x1x1 cube)
  let center = false; // Default is not centered

  // Find the argument_list node. It can be a direct child or a field depending on the CST structure.
  let argsNode: TSNode | null = null;

  // First, try to get it as a named field 'arguments' (common for module_instantiation nodes).
  argsNode = node.childForFieldName('arguments');

  // If not found as a named field, iterate through direct children to find an 'argument_list' node.
  if (!argsNode) {
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'argument_list') {
        argsNode = child;
        break;
      }
    }
  }

  // If no arguments node is found, return a CubeNode with default parameters.
  if (!argsNode) {
    return {
      type: 'cube',
      size,
      center,
      location: getLocation(node),
    };
  }

  // Extract all arguments using the generic argument extractor.
  const args = extractArguments(argsNode, errorHandler, sourceCode, variableScope);

  // Process extracted arguments to determine size and center.
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle the 'size' parameter. It can be the first positional argument or a named argument 'size'.
    if ((i === 0 && !arg?.name) || arg?.name === 'size') {
      // Attempt to extract as a vector (for [x, y, z] dimensions).
      const vectorValue = arg ? extractVectorParameter(arg) : null;
      if (vectorValue && vectorValue.length >= 1) {
        if (vectorValue.length === 3) {
          // If it's a 3-element vector, use it directly as Vector3D.
          size = vectorValue as ast.Vector3D;
        } else if (vectorValue.length === 2) {
          // OpenSCAD allows 2-element vectors for size, treating it as [x, y, 1].
          // For simplicity in AST, we might convert it to a scalar if x=y, or a 3D vector.
          // Current logic: if first element is number, use it as scalar size.
          const firstElement = vectorValue[0];
          if (typeof firstElement === 'number') {
            size = firstElement;
          } else {
            size = 1; // Fallback to default if not a number.
          }
        } else if (vectorValue.length === 1) {
          // If it's a 1-element vector, treat it as a scalar size.
          const firstElement = vectorValue[0];
          if (typeof firstElement === 'number') {
            size = firstElement;
          }
        } else {
          // Handle cases where vectorValue has an unexpected length (e.g., 0 or >3).
          // Fallback to default size.
          size = 1; // Explicitly re-assign default.
        }
      } else {
        // If not a vector, attempt to extract as a single number (scalar size).
        const numberValue = arg ? extractNumberParameter(arg, errorHandler) : null;
        if (numberValue !== null) {
          size = numberValue;
        } else {
          // If neither a valid vector nor a number, fallback to default size.
          size = 1; // Explicitly re-assign default.
        }
      }
    }
    // Handle the 'center' parameter. It can be the second positional argument or a named argument 'center'.
    else if ((i === 1 && !arg?.name) || arg?.name === 'center') {
      const centerValue = arg ? extractBooleanParameter(arg, errorHandler) : null;
      if (centerValue !== null) {
        center = centerValue;
      } else {
        // If center value is not a valid boolean, it's ignored (retains default `false`).
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
