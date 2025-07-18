/**
 * @file offset-extractor.ts
 * @description This module provides the `extractOffsetNode` function, which is responsible for parsing
 * Tree-sitter nodes representing OpenSCAD `offset()` calls and converting them into a structured
 * `OffsetNode` in the Abstract Syntax Tree (AST). It handles the `r` (radius), `delta`, and `chamfer` parameters.
 *
 * @architectural_decision
 * The `extractOffsetNode` function encapsulates the logic for interpreting the arguments of the OpenSCAD `offset()` module.
 * It leverages `argument-extractor.ts` to parse the raw arguments from the CST and then uses `parameter-extractor.ts`
 * to convert these into typed values. This modular approach ensures that the extraction logic is reusable and testable,
 * and keeps the core AST generation clean.
 *
 * @example
 * ```typescript
 * import { extractOffsetNode } from './offset-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateOffsetExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Offset with radius
 *   let code = 'offset(r=5) square(10);';
 *   let cst = parser.parseCST(code);
 *   let offsetNodeCST = cst?.rootNode.namedChild(0); // Assuming offset() is the first node
 *   if (offsetNodeCST) {
 *     const offsetAST = extractOffsetNode(offsetNodeCST, errorHandler, code);
 *     console.log('Offset (r) AST:', offsetAST); // Expected: { type: 'offset', r: 5, delta: 0, chamfer: false, children: [], location: ... }
 *   }
 *
 *   // Example 2: Offset with delta and chamfer
 *   code = 'offset(delta=2, chamfer=true) circle(5);';
 *   cst = parser.parseCST(code);
 *   offsetNodeCST = cst?.rootNode.namedChild(0);
 *   if (offsetNodeCST) {
 *     const offsetAST = extractOffsetNode(offsetNodeCST, errorHandler, code);
 *     console.log('Offset (delta, chamfer) AST:', offsetAST); // Expected: { type: 'offset', r: 0, delta: 2, chamfer: true, children: [], location: ... }
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateOffsetExtraction();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { getLocation } from '../utils/location-utils.js';
import { extractArguments } from './argument-extractor.js';
import { extractBooleanParameter, extractNumberParameter } from './parameter-extractor.js';

/**
 * @function extractOffsetNode
 * @description Extracts parameters for an `offset()` call from a Tree-sitter CST node and constructs an `OffsetNode`.
 * This function handles the `r` (radius), `delta`, and `chamfer` parameters of the OpenSCAD `offset` module.
 *
 * @param {TSNode} node - The Tree-sitter node corresponding to an `offset()` call.
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging issues during argument extraction.
 * @param {string} [sourceCode] - The original source code string, used for accurate text extraction.
 * @returns {ast.OffsetNode | null} An `OffsetNode` object representing the parsed offset operation, or `null` if the node cannot be processed.
 */
export function extractOffsetNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.OffsetNode | null {
  // Initialize parameters with default values as per OpenSCAD specification.
  let radius = 0;
  let delta = 0;
  let chamfer = false;

  // The `offset` module's arguments are typically found in a child node named 'arguments'.
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    // If no arguments node is found, return an OffsetNode with default parameters.
    return {
      type: 'offset',
      r: radius,
      delta,
      chamfer,
      children: [], // Children will be populated by the TransformVisitor
      location: getLocation(node),
    };
  }

  // Extract all arguments using the generic argument extractor.
  const args = extractArguments(argsNode, errorHandler, sourceCode);

  // Process extracted arguments to determine radius, delta, and chamfer.
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue; // Skip undefined arguments

    // Handle 'r' parameter (named 'r').
    if (arg.name === 'r') {
      const radiusValue = extractNumberParameter(arg);
      if (radiusValue !== null) {
        radius = radiusValue;
      } else {
        // If radius value is not a valid number, it's ignored (retains default `0`).
      }
    }
    // Handle 'delta' parameter (named 'delta').
    else if (arg.name === 'delta') {
      const deltaValue = extractNumberParameter(arg);
      if (deltaValue !== null) {
        delta = deltaValue;
      } else {
        // If delta value is not a valid number, it's ignored (retains default `0`).
      }
    }
    // Handle 'chamfer' parameter (named 'chamfer').
    else if (arg.name === 'chamfer') {
      const chamferValue = extractBooleanParameter(arg);
      if (chamferValue !== null) {
        chamfer = chamferValue;
      } else {
        // If chamfer value is not a valid boolean, it's ignored (retains default `false`).
      }
    }
  }

  // The `children` array is not populated by this extractor. It is expected to be populated
  // by a subsequent visitor (e.g., `TransformVisitor`) that processes the child block of the `offset` module.
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
