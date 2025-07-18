/**
 * @file color-extractor.ts
 * @description This module provides the `extractColorNode` function, which is responsible for parsing
 * Tree-sitter nodes representing OpenSCAD `color()` calls and converting them into a structured
 * `ColorNode` in the Abstract Syntax Tree (AST). It handles various ways of specifying colors,
 * including named colors, RGB/RGBA vectors, and optional alpha values.
 *
 * @architectural_decision
 * The `extractColorNode` function encapsulates the logic for interpreting the complex argument structure
 * of the OpenSCAD `color()` module. It leverages `argument-extractor.ts` to parse the arguments and then
 * applies specific logic to determine the color value (string or Vector4D) and alpha component.
 * This separation ensures that the core AST generation logic remains clean, while the specifics of color
 * argument parsing are handled in a dedicated, testable module.
 *
 * @example
 * ```typescript
 * import { extractColorNode } from './color-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateColorExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Named color
 *   let code = 'color("red") cube(10);';
 *   let cst = parser.parseCST(code);
 *   let colorNodeCST = cst?.rootNode.namedChild(0); // Assuming color() is the first node
 *   if (colorNodeCST) {
 *     const colorAST = extractColorNode(colorNodeCST, errorHandler, code);
 *     console.log('Named Color AST:', colorAST); // Expected: { type: 'color', c: 'red', children: [], location: ... }
 *   }
 *
 *   // Example 2: RGB vector
 *   code = 'color([1, 0, 0]) sphere(5);';
 *   cst = parser.parseCST(code);
 *   colorNodeCST = cst?.rootNode.namedChild(0);
 *   if (colorNodeCST) {
 *     const colorAST = extractColorNode(colorNodeCST, errorHandler, code);
 *     console.log('RGB Color AST:', colorAST); // Expected: { type: 'color', c: [1, 0, 0, 1], children: [], location: ... }
 *   }
 *
 *   // Example 3: RGBA vector with explicit alpha
 *   code = 'color([0, 0, 1, 0.5]) cylinder(h=10);';
 *   cst = parser.parseCST(code);
 *   colorNodeCST = cst?.rootNode.namedChild(0);
 *   if (colorNodeCST) {
 *     const colorAST = extractColorNode(colorNodeCST, errorHandler, code);
 *     console.log('RGBA Color AST:', colorAST); // Expected: { type: 'color', c: [0, 0, 1, 0.5], children: [], location: ... }
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateColorExtraction();
 * ```
 */

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

/**
 * @function extractColorNode
 * @description Extracts color information from a Tree-sitter node representing an OpenSCAD `color()` call.
 * It parses the arguments to determine the color value (named string or RGBA vector) and constructs a `ColorNode`.
 *
 * @param {TSNode} node - The Tree-sitter node corresponding to a `color()` call.
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging issues during argument extraction.
 * @param {string} [sourceCode] - The original source code string, used for accurate text extraction.
 * @returns {ast.ColorNode | null} A `ColorNode` object representing the parsed color, or `null` if the node cannot be processed.
 */
export function extractColorNode(
  node: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string
): ast.ColorNode | null {
  // Default values as per OpenSCAD behavior if no arguments are provided or invalid.
  let color: string | ast.Vector4D = 'red';
  let _alpha: number | undefined;

  // The `color` module's arguments are typically found in a child node named 'arguments'.
  const argsNode = node.childForFieldName('arguments');
  if (!argsNode) {
    // If no arguments node is found, return a default ColorNode (e.g., red with no children).
    // This handles cases like `color() { ... }` where the color is implicitly red.
    return {
      type: 'color',
      c: color,
      children: [], // Children will be populated by the TransformVisitor
      location: getLocation(node),
    };
  }

  // Extract all arguments using the generic argument extractor.
  const args = extractArguments(argsNode, errorHandler, sourceCode);

  // Process extracted arguments to determine the color and alpha.
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle the main color parameter. It can be the first positional argument or a named argument 'c'.
    if ((i === 0 && !arg?.name) || arg?.name === 'c') {
      // Attempt to extract as a vector (for RGB/RGBA values).
      const vectorValue = arg ? extractVectorParameter(arg) : null;
      if (vectorValue) {
        if (vectorValue.length === 3) {
          // If it's an RGB vector, convert to RGBA by adding a default alpha of 1.0.
          color = [vectorValue[0], vectorValue[1], vectorValue[2], 1.0] as ast.Vector4D;
        } else if (vectorValue.length === 4) {
          // If it's already an RGBA vector, use it directly and capture the alpha.
          color = [vectorValue[0], vectorValue[1], vectorValue[2], vectorValue[3]] as ast.Vector4D;
          _alpha = vectorValue[3];
        } else {
          // Log a warning or handle cases where the vector has an unexpected number of components.
          // For now, it will fall through to try as a string if vector length is not 3 or 4.
        }
      } else {
        // If not a vector, attempt to extract as a string (for named colors like "red", "blue").
        const stringValue = arg ? extractStringParameter(arg) : null;
        if (stringValue !== null) {
          color = stringValue;
        } else {
          // If neither a valid vector nor a string, the argument is ignored for color determination.
        }
      }
    }
    // Handle the alpha parameter. It can be the second positional argument or a named argument 'alpha'.
    else if ((i === 1 && !arg?.name) || arg?.name === 'alpha') {
      const alphaValue = arg ? extractNumberParameter(arg) : null;
      if (alphaValue !== null) {
        _alpha = alphaValue;
      } else {
        // If alpha value is not a valid number, it's ignored.
      }
    }
  }

  // The `children` array is not populated by this extractor. It is expected to be populated
  // by a subsequent visitor (e.g., `TransformVisitor`) that processes the child block of the `color` module.
  const children: ast.ASTNode[] = [];

  return {
    type: 'color',
    c: color,
    children,
    location: getLocation(node),
  };
}
