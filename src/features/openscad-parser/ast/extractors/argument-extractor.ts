/**
 * @file argument-extractor.ts
 * @description This module provides utilities for extracting and converting function arguments
 * from Tree-sitter CST nodes into structured AST parameter objects. It handles both positional
 * and named arguments, supporting various OpenSCAD data types and expressions.
 *
 * @architectural_decision
 * The argument extraction logic is encapsulated in this module to centralize the complex process
 * of interpreting Tree-sitter's generic argument nodes into meaningful OpenSCAD parameters.
 * It leverages `value-extractor.ts` for individual value parsing and includes robust error handling.
 * The design supports the flexible argument passing mechanisms of OpenSCAD, including mixed positional
 * and named arguments, and complex nested expressions.
 *
 * @example
 * ```typescript
 * import { extractArguments } from './argument-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateArgumentExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   const code = 'cylinder(h=20, r1=5, r2=10, center=true);';
 *   const cst = parser.parseCST(code);
 *   if (!cst) return;
 *
 *   // Assuming the CST structure allows direct access to the arguments node
 *   // For a call_expression, arguments are typically a named child.
 *   const callExpressionNode = cst.rootNode.namedChild(0); // e.g., cylinder(...)
 *   if (callExpressionNode && callExpressionNode.type === 'call_expression') {
 *     const argsNode = callExpressionNode.namedChild(1); // Assuming the arguments are the second named child
 *     if (argsNode) {
 *       const extractedParams = extractArguments(argsNode, errorHandler, code);
 *       console.log('Extracted Parameters:', extractedParams);
 *       // Expected output:
 *       // [
 *       //   { name: 'h', value: { value: 20, type: 'number' } },
 *       //   { name: 'r1', value: { value: 5, type: 'number' } },
 *       //   { name: 'r2', value: { value: 10, type: 'number' } },
 *       //   { name: 'center', value: { value: true, type: 'boolean' } }
 *       // ]
 *     }
 *   }
 *   parser.dispose();
 * }
 *
 * demonstrateArgumentExtraction();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type { ErrorHandler } from '../../error-handling/index.js';
import type * as ast from '../ast-types.js';
import { extractValue as extractValueFromNode } from './value-extractor.js';

/**
 * @function getNodeText
 * @description Extracts the raw text content from a Tree-sitter node.
 * It prioritizes extracting from the original source code using byte offsets for accuracy,
 * falling back to `node.text` if source code is not provided or extraction fails.
 *
 * @param {TSNode} node - The Tree-sitter node from which to extract text.
 * @param {string} [sourceCode] - The optional original source code string.
 * @returns {string} The extracted text content of the node.
 */
function getNodeText(node: TSNode, sourceCode?: string): string {
  if (sourceCode && node.startIndex !== undefined && node.endIndex !== undefined) {
    try {
      const extractedText = sourceCode.slice(node.startIndex, node.endIndex);
      if (extractedText.length > 0 && extractedText.length <= 1000) {
        return extractedText;
      }
    } catch (_error) {
      // Handle extraction errors gracefully
    }
  }

  return node.text || '';
}

/**
 * @function convertValueToParameterValue
 * @description Converts a generic `ast.Value` object (as extracted by `value-extractor`)
 * into a more specific `ast.ParameterValue` type, which is used in the AST.
 * This function handles type coercion and conversion for numbers, booleans, strings, vectors, and ranges.
 *
 * @param {ast.Value} value - The generic value object to convert.
 * @returns {ast.ParameterValue} The converted parameter value, or `null` if conversion is not possible.
 */
function convertValueToParameterValue(value: ast.Value): ast.ParameterValue {
  console.log(
    `[convertValueToParameterValue] DEBUG - Converting value:`,
    JSON.stringify(value, null, 2)
  );

  if (value.type === 'number') {
    // Ensure we have a valid numeric value before parsing
    const numericValue = value.value;
    console.log(
      `[convertValueToParameterValue] DEBUG - Number value: "${numericValue}", type: ${typeof numericValue}`
    );

    if (numericValue === null || numericValue === undefined) {
      console.log(
        `[convertValueToParameterValue] DEBUG - Number value is null/undefined, returning null`
      );
      return null;
    }

    // Check for empty string
    if (typeof numericValue === 'string' && numericValue.trim() === '') {
      console.log(
        `[convertValueToParameterValue] DEBUG - Number value is empty string, returning null`
      );
      return null;
    }

    const parsedValue =
      typeof numericValue === 'string' ? parseFloat(numericValue) : Number(numericValue);
    console.log(
      `[convertValueToParameterValue] DEBUG - Parsed value: ${parsedValue}, isNaN: ${Number.isNaN(parsedValue)}`
    );

    if (Number.isNaN(parsedValue)) {
      console.log(`[convertValueToParameterValue] DEBUG - Parsed value is NaN, returning null`);
      return null;
    }

    const result = {
      type: 'expression',
      expressionType: 'literal',
      value: parsedValue,
    } as ast.LiteralNode;

    console.log(
      `[convertValueToParameterValue] DEBUG - Returning literal node:`,
      JSON.stringify(result, null, 2)
    );
    return result;
  } else if (value.type === 'boolean') {
    return {
      type: 'expression',
      expressionType: 'literal',
      value: value.value === 'true',
    } as ast.LiteralNode;
  } else if (value.type === 'string') {
    return {
      type: 'expression',
      expressionType: 'literal',
      value: value.value as string,
    } as ast.LiteralNode;
  } else if (value.type === 'identifier') {
    // For identifiers, we might want to create a VariableNode or IdentifierNode
    // For now, returning as string to match previous behavior, but this might need refinement
    // to align with how identifiers are treated as expressions.
    return {
      type: 'expression',
      expressionType: 'identifier',
      name: value.value as string,
    } as ast.IdentifierNode;
  } else if (value.type === 'vector') {
    const vectorElements = value.value as ast.Value[];

    // Check if any elements are identifiers that need to be preserved for parameter substitution
    const hasIdentifiers = vectorElements.some((v) => v.type === 'identifier');

    if (hasIdentifiers) {
      // Create a vector expression node that preserves identifiers
      const elements = vectorElements.map((v) => {
        if (v.type === 'identifier') {
          return {
            type: 'expression',
            expressionType: 'identifier',
            name: v.value as string,
          } as ast.IdentifierNode;
        } else if (v.type === 'number') {
          const numericValue = v.value;
          if (numericValue === null || numericValue === undefined) {
            return {
              type: 'expression',
              expressionType: 'literal',
              value: 0,
            } as ast.LiteralNode;
          }
          const parsedValue =
            typeof numericValue === 'string' ? parseFloat(numericValue) : Number(numericValue);
          return {
            type: 'expression',
            expressionType: 'literal',
            value: Number.isNaN(parsedValue) ? 0 : parsedValue,
          } as ast.LiteralNode;
        }
        // Default for other types
        return {
          type: 'expression',
          expressionType: 'literal',
          value: 0,
        } as ast.LiteralNode;
      });

      const vectorExpressionNode = {
        type: 'expression',
        expressionType: 'vector',
        elements: elements,
      } as ast.VectorExpressionNode;

      console.log(
        `[convertValueToParameterValue] DEBUG - Created VectorExpressionNode:`,
        JSON.stringify(vectorExpressionNode, null, 2)
      );

      return vectorExpressionNode;
    } else {
      // All elements are numeric, convert to simple vector
      const vectorValues = vectorElements.map((v) => {
        if (v.type === 'number') {
          const numericValue = v.value;
          if (numericValue === null || numericValue === undefined) {
            return 0; // Default for null/undefined values in vector context
          }
          const parsedValue =
            typeof numericValue === 'string' ? parseFloat(numericValue) : Number(numericValue);
          return Number.isNaN(parsedValue) ? 0 : parsedValue;
        }
        return 0; // Default for non-numeric elements in a vector context
      });

      // Check if it's intended to be an ExpressionNode (VectorExpressionNode)
      // This part is tricky as ast.Value for 'vector' is different from ast.VectorExpressionNode
      // For now, let's assume if it's from ast.Value, it's a direct vector, not an expression node.
      if (vectorValues.length === 2) {
        return vectorValues as ast.Vector2D;
      } else if (vectorValues.length >= 3) {
        return [vectorValues[0], vectorValues[1], vectorValues[2]] as ast.Vector3D;
      }
      // Fallback for empty or 1-element vectors, or if conversion is ambiguous
      // OpenSCAD allows single numbers to be treated as vectors in some contexts, but ParameterValue expects specific types.
      // Returning an empty VectorExpressionNode or null might be alternatives.
      // For now, returning a default vector to avoid crashes, but this needs review.
      return [0, 0, 0] as ast.Vector3D; // Default fallback, consider implications
    }
  } else if (value.type === 'range') {
    // Create an expression node for range
    const rangeNode: ast.RangeExpressionNode = {
      type: 'expression',
      expressionType: 'range_expression',
      start: {
        type: 'expression',
        expressionType: 'literal',
        value: value.start ? parseFloat(value.start) : 0, // Default to 0 if undefined
      } as ast.LiteralNode,
      end: {
        type: 'expression',
        expressionType: 'literal',
        value: value.end ? parseFloat(value.end) : 0, // Default to 0 if undefined
      } as ast.LiteralNode,
    };
    if (value.step) {
      rangeNode.step = {
        type: 'expression',
        expressionType: 'literal',
        value: parseFloat(value.step),
      } as ast.LiteralNode;
    }
    return rangeNode;
  }

  // Default fallback - create a literal expression for unrecognized ast.Value types
  // or if 'value.value' is not a string (e.g. for 'vector' type if not handled above)
  let literalValue: string | number | boolean = '';
  if (typeof value.value === 'string') {
    literalValue = value.value;
  } else if (typeof value.value === 'number') {
    literalValue = value.value;
  } else if (typeof value.value === 'boolean') {
    literalValue = value.value;
  } else {
    // Fallback for complex value.value types or if unhandled
    // This might occur if a 'vector' ast.Value.value (which is Value[]) reaches here.
    // Consider logging a warning or throwing an error for unhandled ast.Value subtypes.
    // Defaulting to empty string, but this is likely not correct for all cases.
  }

  return {
    type: 'expression',
    expressionType: 'literal',
    value: literalValue,
  } as ast.LiteralNode;
}

/**
 * @function convertNodeToParameterValue
 * @description Converts a Tree-sitter node directly into an `ast.ParameterValue`.
 * This function acts as an intermediary, first extracting a generic `ast.Value` from the node,
 * and then converting it to the more specific `ast.ParameterValue`.
 *
 * @param {TSNode} node - The Tree-sitter node to convert.
 * @param {ErrorHandler} [_errorHandler] - Optional error handler for logging (currently unused).
 * @param {string} [sourceCode=''] - The original source code string for accurate text extraction.
 * @param {Map<string, ast.ParameterValue>} [_variableScope] - Optional variable scope for resolving identifiers (currently unused).
 * @returns {ast.ParameterValue | undefined} The converted parameter value, or `undefined` if conversion fails.
 */
function convertNodeToParameterValue(
  node: TSNode,
  _errorHandler?: ErrorHandler,
  sourceCode: string = '',
  _variableScope?: Map<string, ast.ParameterValue>
): ast.ParameterValue | undefined {
  // Extract value using the standard extraction function
  const value = extractValueFromNode(node, sourceCode, _variableScope);

  // Convert Value to ParameterValue
  if (value) {
    return convertValueToParameterValue(value);
  }

  return undefined;
}

/**
 * @function extractArguments
 * @description Extracts function arguments from a Tree-sitter CST node and converts them into an array of `ast.Parameter` objects.
 * This function handles various argument patterns, including positional, named, and mixed arguments, as well as complex expressions.
 *
 * @param {TSNode} argsNode - The Tree-sitter CST node that contains the arguments (e.g., an `arguments` or `argument_list` node).
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging and reporting issues during extraction.
 * @param {string} [sourceCode] - The original source code string, used for accurate text extraction from Tree-sitter nodes.
 * @param {Map<string, ast.ParameterValue>} [variableScope] - Optional variable scope for resolving identifiers within expressions.
 * @returns {ast.Parameter[]} An array of `ast.Parameter` objects, each representing an extracted argument.
 *
 * @limitations
 * - The function includes a workaround for Tree-sitter memory corruption issues that can affect empty argument lists.
 * - The handling of complex expressions within arguments relies on `extractValueFromNode`, which itself has limitations on expression evaluation.
 * - The current implementation might not fully support all edge cases of OpenSCAD's argument parsing, especially for highly dynamic or malformed inputs.
 */
export function extractArguments(
  argsNode: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string,
  variableScope?: Map<string, ast.ParameterValue>
): ast.Parameter[] {
  const nodeText = getNodeText(argsNode, sourceCode);
  // Detect Tree-sitter memory corruption for empty argument lists
  // If we see patterns like ');' or ')' as argument text, it's likely corruption
  if (nodeText.match(/^\s*\)[\s;]*$/)) {
    console.log(
      `[extractArguments] Detected Tree-sitter memory corruption in empty argument list: '${nodeText}'. Returning empty arguments.`
    );
    return [];
  }

  const args: ast.Parameter[] = [];

  // Handle argument_list nodes specially
  if (argsNode.type === 'argument_list') {
    // For argument_list, we need to look at all children, not just named children
    // The structure is typically: '(' argument1 ',' argument2 ')'
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (!child) continue;
      // Skip punctuation tokens like '(', ')', ','
      if (child.type === '(' || child.type === ')' || child.type === ',') {
        continue;
      }

      // Process actual argument nodes or expressions
      if (child.type === 'argument') {
        const param = extractArgument(child, errorHandler, sourceCode);
        if (param) {
          args.push(param);
        }
      } else if (child.type === 'named_argument') {
        // Handle named arguments directly
        const _childText = getNodeText(child, sourceCode);
        const param = extractArgument(child, errorHandler, sourceCode);
        if (param) {
          args.push(param);
        }
      } else if (child.type === 'arguments') {
        // Handle arguments node that contains expressions
        const _childText = getNodeText(child, sourceCode);
        // Check if this arguments node contains named arguments by examining CST structure
        // instead of relying on text (which can be truncated due to tree-sitter memory issues)
        let hasNamedArguments = false;
        for (let j = 0; j < child.childCount; j++) {
          const argChild = child.child(j);
          if (argChild && argChild.type === 'argument') {
            // Check if this argument has a name field (indicating it's a named argument)
            const nameField = argChild.childForFieldName('name');
            if (nameField) {
              hasNamedArguments = true;
              break;
            }
          }
        }

        if (hasNamedArguments) {
          // Find the argument child and process it with extractArgument
          for (let j = 0; j < child.childCount; j++) {
            const argChild = child.child(j);
            if (argChild && argChild.type === 'argument') {
              const param = extractArgument(argChild, errorHandler, sourceCode);
              if (param) {
                args.push(param);
              }
            }
          }
        } else {
          // Handle positional arguments - process individual argument children
          for (let j = 0; j < child.childCount; j++) {
            const argChild = child.child(j);
            if (argChild && argChild.type === 'argument') {
              const param = extractArgument(argChild, errorHandler, sourceCode);
              if (param) {
                args.push(param);
              }
            }
          }
        }
      } else if (
        child.type === 'number' ||
        child.type === 'string_literal' ||
        child.type === 'array_expression' ||
        child.type === 'identifier'
      ) {
        // Handle direct value nodes (positional arguments)
        const _childText = getNodeText(child, sourceCode);
        const value = convertNodeToParameterValue(child, errorHandler, sourceCode, variableScope);
        if (value !== undefined) {
          args.push({ name: undefined, value }); // Positional argument
        }
      }
    }
    return args;
  }

  // Process each argument based on named children (structured parsing for 'arguments' nodes)
  for (let i = 0; i < argsNode.namedChildCount; i++) {
    const argNode = argsNode.namedChild(i);
    if (!argNode) continue;

    const _argNodeText = getNodeText(argNode, sourceCode);
    // Handle 'arguments' node that contains 'argument' nodes or direct expressions
    if (argNode.type === 'arguments') {
      // Check if this arguments node has argument children
      let hasArgumentChildren = false;
      let extractedAnyArguments = false;

      for (let j = 0; j < argNode.namedChildCount; j++) {
        const innerArgNode = argNode.namedChild(j);
        if (!innerArgNode) continue;

        if (innerArgNode.type === 'argument') {
          hasArgumentChildren = true;
          const param = extractArgument(innerArgNode, errorHandler, sourceCode);
          if (param) {
            args.push(param);
            extractedAnyArguments = true;
          }
        }
      }

      // Only treat as direct expression if no argument children were found AND no arguments were extracted
      if (!hasArgumentChildren && !extractedAnyArguments && argNode.namedChildCount > 0) {
        const value = convertNodeToParameterValue(argNode, errorHandler, sourceCode);
        if (value !== undefined) {
          args.push({ name: undefined, value }); // Positional argument
        }
      }
    }
    // Expecting 'argument' nodes which contain either 'named_argument' or an expression directly
    else if (argNode.type === 'argument') {
      const param = extractArgument(argNode, errorHandler, sourceCode); // extractArgument should handle named vs positional within 'argument'
      if (param) {
        args.push(param);
      }
    } else {
      // Handle cases where the child of argument_list is directly an expression (e.g. a single array_literal)
      // This might be needed if 'argument' nodes are not always present for single, unnamed arguments.
      console.log(
        `[extractArguments] Child is not of type 'argument', attempting to process as direct value: type=${argNode.type}`
      );
      const value = convertNodeToParameterValue(argNode, errorHandler, sourceCode);
      if (value !== undefined) {
        args.push({ name: undefined, value }); // Positional argument
      }
    }
  }

  // Fallback: If no arguments were extracted via structured parsing AND argsNode.text is non-empty and not just whitespace,
  // then consider the old text-based parsing. For now, this is commented out to isolate issues.
  /*
  if (args.length === 0 && argsNode.text && argsNode.text.trim() !== '') {
    // Split the text by commas
    const argTexts = argsNode.text.split(',');
    for (const argText of argTexts) {
      const trimmedArgText = argText.trim();
      if (trimmedArgText) {
        // This is a very naive way to parse, ideally we'd re-invoke a mini-parser or expression parser here.
        // For now, let's assume it's a literal or identifier if it gets to this fallback.
        // This part would need significant improvement if relied upon.
        let value: ast.ParameterValue | undefined;
        if (!isNaN(parseFloat(trimmedArgText))) {
          value = parseFloat(trimmedArgText);
        } else if (trimmedArgText.toLowerCase() === 'true') {
          value = true;
        } else if (trimmedArgText.toLowerCase() === 'false') {
          value = false;
        } else if (trimmedArgText.startsWith('"') && trimmedArgText.endsWith('"')) {
          value = trimmedArgText.slice(1, -1);
        } else {
          // Assuming identifier or some other complex expression not handled here
        }
        if (value !== undefined) {
          args.push({ value });
        }
      }
    }
  }
  */

  // If after all attempts, args is empty and argsNode.text is also empty or whitespace (e.g. for `translate()`), ensure we return empty.
  if (args.length === 0 && (!argsNode.text || argsNode.text.trim() === '')) {
    return [];
  }
  return args;
}

/**
 * @function extractArgument
 * @description Extracts a single parameter from a Tree-sitter `argument` or `named_argument` node.
 * It determines whether the argument is named or positional and extracts its value accordingly.
 *
 * @param {TSNode} argNode - The Tree-sitter node representing a single argument.
 * @param {ErrorHandler} [errorHandler] - Optional error handler for logging.
 * @param {string} [sourceCode] - The original source code string.
 * @param {Map<string, ast.ParameterValue>} [variableScope] - Optional variable scope for resolving identifiers.
 * @returns {ast.Parameter | null} An `ast.Parameter` object if extraction is successful, or `null` if the argument is invalid.
 */
function extractArgument(
  argNode: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string,
  variableScope?: Map<string, ast.ParameterValue>
): ast.Parameter | null {
  const nodeText = getNodeText(argNode, sourceCode);
  // Check for invalid argument patterns
  if (nodeText.match(/^\s*\)[\s;]*$/)) {
    console.log(`[extractArgument] Invalid argument pattern: '${nodeText}'. Skipping.`);
    return null;
  }

  // Handle named_argument nodes directly
  if (argNode.type === 'named_argument') {
    const nameNode = argNode.childForFieldName('name');
    const valueNode = argNode.childForFieldName('value');

    if (nameNode && valueNode) {
      const name = getNodeText(nameNode, sourceCode);
      const value = convertNodeToParameterValue(valueNode, errorHandler, sourceCode, variableScope);
      if (value !== undefined) {
        return { name, value };
      }
      return null;
    }

    // Fallback for grammars where named_argument does not have named fields
    let identifierNode: TSNode | null = null;
    let expressionNode: TSNode | null = null;
    for (let i = 0; i < argNode.childCount; i++) {
      const child = argNode.child(i);
      if (!child) continue;
      if (child.type === 'identifier' && !identifierNode) {
        identifierNode = child;
      } else if (child.type !== '=') {
        expressionNode = child;
      }
    }

    if (identifierNode && expressionNode) {
      const name = getNodeText(identifierNode, sourceCode);
      const value = convertNodeToParameterValue(
        expressionNode,
        errorHandler,
        sourceCode,
        variableScope
      );
      if (value !== undefined) {
        return { name, value };
      }
    }

    return null;
  }

  // Check if this is a named argument by examining CST structure
  // instead of relying on text (which can be truncated due to tree-sitter memory issues)
  // Named arguments have the pattern: identifier = expression
  const nameField = argNode.childForFieldName('name');
  const valueField = argNode.childForFieldName('value');

  if (nameField && valueField) {
    const name = getNodeText(nameField, sourceCode);

    // Extract the value from the expression
    const value = extractValue(valueField, sourceCode);
    if (!value) {
      return null;
    }
    // Convert Value to ParameterValue
    const paramValue = convertValueToParameterValue(value);
    return { name, value: paramValue };
  }

  // Fallback: Check for named argument pattern by examining children structure
  // This handles cases where field names might not be available
  let identifierNode: TSNode | null = null;
  let expressionNode: TSNode | null = null;
  let hasEqualsSign = false;

  // Look through all children to find identifier, equals, and expression
  for (let i = 0; i < argNode.childCount; i++) {
    const child = argNode.child(i);
    if (!child) continue;

    if (child.type === 'identifier' && !identifierNode) {
      identifierNode = child;
    } else if (child.type === '=' || child.type === 'equals') {
      hasEqualsSign = true;
    } else if (
      child.type !== '=' &&
      child.type !== 'equals' &&
      child.type !== 'identifier' &&
      !expressionNode
    ) {
      // This should be the expression part (not the '=' operator or identifier)
      expressionNode = child;
    }
  }

  if (identifierNode && expressionNode && hasEqualsSign) {
    const name = getNodeText(identifierNode, sourceCode);

    // Extract the value from the expression
    const value = extractValue(expressionNode, sourceCode);
    if (!value) {
      return null;
    }
    // Convert Value to ParameterValue
    const paramValue = convertValueToParameterValue(value);
    return { name, value: paramValue };
  } else {
    // This is a positional argument
    // For positional arguments, we need to find the actual value node within the argument node
    let valueNode: TSNode | null = null;

    // Look for the first child that contains the actual value (not punctuation)
    for (let i = 0; i < argNode.childCount; i++) {
      const child = argNode.child(i);
      if (
        child &&
        child.type !== '(' &&
        child.type !== ')' &&
        child.type !== ',' &&
        child.type !== ';'
      ) {
        valueNode = child;
        break;
      }
    }

    // If no suitable child found, try the argument node itself as fallback
    if (!valueNode) {
      valueNode = argNode;
    }

    const value = extractValue(valueNode, sourceCode, variableScope);
    if (!value) {
      return null;
    }
    const paramValue = convertValueToParameterValue(value);
    return { name: undefined, value: paramValue };
  }
}

/**
 * Extract a vector literal from a vector_literal node
 *
 * @param vectorNode - The vector_literal node
 * @param sourceCode - The original source code string
 * @param variableScope - Optional variable scope for resolving identifiers
 * @returns A vector value object or null if the vector is invalid
 *
 * @example
 * ```typescript
 * const vectorNode = parser.parse('[1, 2, 3]').rootNode.namedChild(0);
 * const vector = extractVectorLiteral(vectorNode, '[1, 2, 3]');
 * // Returns: { type: 'vector', value: [{ type: 'number', value: '1' }, ...] }
 * ```
 */
function extractVectorLiteral(
  vectorNode: TSNode,
  sourceCode: string = '',
  variableScope?: Map<string, ast.ParameterValue>
): ast.VectorValue | null {
  const values: ast.Value[] = [];

  // Iterate over named children to skip syntax tokens like '[', ']', ','
  for (let i = 0; i < vectorNode.namedChildCount; i++) {
    const elementNode = vectorNode.namedChild(i);
    if (elementNode) {
      // Ensure child exists
      const value = extractValue(elementNode, sourceCode, variableScope);
      if (value) {
        values.push(value);
      }
    }
  }

  // It's possible for an array like `[,,]` to parse with no actual values.
  // Or if extractValue fails for all children. Default OpenSCAD behavior might be relevant here.
  return { type: 'vector', value: values };
}

/**
 * Extract a range literal from a range_literal node
 *
 * @param rangeNode - The range_literal node
 * @returns A range value object or null if the range is invalid
 *
 * @example
 * ```typescript
 * const rangeNode = parser.parse('[1:2:10]').rootNode.namedChild(0);
 * const range = extractRangeLiteral(rangeNode);
 * // Returns: { type: 'range', start: '1', end: '10', step: '2' }
 * ```
 */
function extractRangeLiteral(rangeNode: TSNode): ast.RangeValue | null {
  const startNode = rangeNode.childForFieldName('start');
  const endNode = rangeNode.childForFieldName('end');
  const stepNode = rangeNode.childForFieldName('step');

  const rangeValue: Omit<ast.RangeValue, 'value'> = {
    type: 'range',
  };

  if (startNode) {
    rangeValue.start = startNode.text;
  }
  if (endNode) {
    rangeValue.end = endNode.text;
  }
  if (stepNode) {
    rangeValue.step = stepNode.text;
  }

  // The 'value' property inherited from ast.Value is problematic here.
  // ast.RangeValue should ideally not have a 'value: string | Value[]' field.
  // For now, we cast to satisfy the return type, but ast-types.ts needs review.
  return rangeValue as ast.RangeValue;
}

/**
 * @function extractValue
 * @description Extracts a value from a Tree-sitter node. This function is a simplified version
 * of the `extractValue` from `value-extractor.ts` and is used internally within `argument-extractor.ts`.
 * It handles various literal types, vectors, ranges, and some basic expressions.
 *
 * @param {TSNode} valueNode - The Tree-sitter node representing the value.
 * @param {string} [sourceCode=''] - The original source code string.
 * @param {Map<string, ast.ParameterValue>} [variableScope] - Optional variable scope for resolving identifiers.
 * @returns {ast.Value | null} A generic `ast.Value` object if extraction is successful, or `null` if the value is invalid or unsupported.
 *
 * @limitations
 * - This function contains simplified logic for expression evaluation (e.g., binary expressions, unary expressions).
 *   For full expression evaluation, a dedicated expression evaluator should be used.
 * - Handling of `call_expression`, `special_variable`, and `member_expression` is currently basic (returns string representation).
 * - The `variableScope` parameter is passed but not fully utilized for complex expression resolution within this function.
 */
export function extractValue(
  valueNode: TSNode,
  sourceCode: string = '',
  variableScope?: Map<string, ast.ParameterValue>
): ast.Value | null {
  switch (valueNode.type) {
    case 'expression': {
      const expressionChild = valueNode.namedChild(0); // Or child(0) if expressions can be anonymous
      if (expressionChild) {
        console.log(
          `[extractValue] Expression child: type=${expressionChild.type}, text='${expressionChild.text}'`
        );
        return extractValue(expressionChild, sourceCode);
      }
      return null;
    }
    case 'arguments': {
      // 'arguments' nodes should be handled by extractArguments, not extractValue
      // This prevents incorrect processing of multiple arguments as a single value
      console.log(
        `[extractValue] 'arguments' node should be handled by extractArguments, not extractValue. Returning null.`
      );
      return null;
    }
    case 'argument': {
      // Do not handle 'argument' nodes in extractValue - they should be handled by extractArgument
      // This prevents named arguments from being incorrectly processed as positional arguments
      console.log(
        `[extractValue] 'argument' node should be handled by extractArgument, not extractValue. Returning null.`
      );
      return null;
    }
    case 'number': {
      // Changed from 'number_literal'
      const numberText = getNodeText(valueNode, sourceCode);
      console.log(
        `[extractValue] DEBUG - Number node: text="${numberText}", sourceCode="${sourceCode?.slice(0, 50)}..."`
      );
      return { type: 'number', value: numberText };
    }

    case 'string': // Add support for 'string' node type (new grammar)
    case 'string_literal': {
      // Remove quotes from string
      const stringValue = valueNode.text.substring(1, valueNode.text.length - 1);
      return { type: 'string', value: stringValue };
    }

    case 'boolean': // Added support for 'boolean' node type
    case 'boolean_literal': // Reverted to previous correct logic
    case 'true': // Reverted to previous correct logic
    case 'false': {
      // Reverted to previous correct logic
      // const boolValue = valueNode.text === 'true'; // Not strictly needed as value is string 'true'/'false'
      return { type: 'boolean', value: valueNode.text };
    }

    case 'identifier':
      return { type: 'identifier', value: valueNode.text };

    case 'vector_literal': // Fallthrough
    case 'array_literal':
    case 'array_expression': // Support array_expression as vector literal
    case 'vector_expression': // Add support for vector_expression
      return extractVectorLiteral(valueNode, sourceCode, variableScope);

    case 'range_literal':
      return extractRangeLiteral(valueNode);

    // Handle expression hierarchy - these nodes typically have a single child that contains the actual value
    case 'unary_expression': {
      // Handle unary expressions specially (e.g., -5, +3, !flag)
      if (valueNode.childCount === 2) {
        const operatorNode = valueNode.child(0);
        const operandNode = valueNode.child(1);

        if (operatorNode && operandNode) {
          const operator = operatorNode.text;
          const operandValue = extractValue(operandNode, sourceCode);

          if (operandValue && typeof operandValue === 'object' && 'value' in operandValue) {
            // Handle structured value objects
            const actualValue = operandValue.value;
            // Convert string numbers to actual numbers
            const numericValue =
              typeof actualValue === 'string'
                ? parseFloat(actualValue)
                : typeof actualValue === 'number'
                  ? actualValue
                  : NaN;

            if (
              operator === '-' &&
              typeof numericValue === 'number' &&
              !Number.isNaN(numericValue)
            ) {
              return { type: 'number', value: -numericValue };
            }
            if (
              operator === '+' &&
              typeof numericValue === 'number' &&
              !Number.isNaN(numericValue)
            ) {
              return { type: 'number', value: numericValue };
            }
          }
        }
      }
      return null;
    }

    case 'conditional_expression':
    case 'logical_or_expression':
    case 'logical_and_expression':
    case 'equality_expression':
    case 'relational_expression':
    case 'additive_expression':
    case 'multiplicative_expression':
    case 'exponentiation_expression':
    case 'postfix_expression':
    case 'accessor_expression':
    case 'primary_expression': {
      // These expression types typically have a single child that contains the actual value
      // Traverse down the expression hierarchy to find the leaf value
      // Try to find the first named child that contains a value
      for (let i = 0; i < valueNode.namedChildCount; i++) {
        const child = valueNode.namedChild(i);
        if (child) {
          console.log(`[extractValue] Trying child ${i}: type=${child.type}, text='${child.text}'`);
          const result = extractValue(child, sourceCode);
          if (result) {
            return result;
          }
        }
      }

      // If no named children worked, try all children
      for (let i = 0; i < valueNode.childCount; i++) {
        const child = valueNode.child(i);
        if (child?.isNamed) {
          console.log(
            `[extractValue] Trying unnamed child ${i}: type=${child.type}, text='${child.text}'`
          );
          const result = extractValue(child, sourceCode);
          if (result) {
            return result;
          }
        }
      }
      return null;
    }

    case 'binary_expression': {
      // Handle binary expressions like 1 + 2, 3 * 4, etc.
      // For now, we'll evaluate simple arithmetic expressions
      // This is a basic implementation - a full expression evaluator would be more robust
      if (valueNode.childCount >= 3) {
        const leftNode = valueNode.child(0);
        const operatorNode = valueNode.child(1);
        const rightNode = valueNode.child(2);

        if (leftNode && operatorNode && rightNode) {
          const leftValue = extractValue(leftNode, sourceCode);
          const rightValue = extractValue(rightNode, sourceCode);
          const operator = operatorNode.text;
          // Only handle numeric operations for now
          if (leftValue?.type === 'number' && rightValue?.type === 'number') {
            const leftNum =
              typeof leftValue.value === 'string'
                ? parseFloat(leftValue.value)
                : typeof leftValue.value === 'number'
                  ? leftValue.value
                  : NaN;
            const rightNum =
              typeof rightValue.value === 'string'
                ? parseFloat(rightValue.value)
                : typeof rightValue.value === 'number'
                  ? rightValue.value
                  : NaN;

            if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
              let result: number;
              switch (operator) {
                case '+':
                  result = leftNum + rightNum;
                  break;
                case '-':
                  result = leftNum - rightNum;
                  break;
                case '*':
                  result = leftNum * rightNum;
                  break;
                case '/':
                  result = rightNum !== 0 ? leftNum / rightNum : 0;
                  break;
                default:
                  return null;
              }
              return { type: 'number', value: result };
            }
          }
        }
      }
      return null;
    }

    case 'call_expression': {
      // Handle nested function calls - for now, return as string representation
      // TODO: Implement proper function call expression handling
      return {
        type: 'string',
        value: valueNode.text,
      };
    }

    case 'special_variable': {
      // Handle special variables like $t, $fa, $fs, $fn, etc.
      // For now, return them as identifiers that can be evaluated later
      // Special variables typically have numeric values (0 for most, time-based for $t)
      const variableName = valueNode.text;
      console.log(`[extractValue] Processing special variable: '${variableName}'`);

      // Return as identifier type so it can be handled by expression evaluators
      return {
        type: 'identifier',
        value: variableName,
      };
    }

    case 'member_expression': {
      // Handle member expressions like size.x, size.y, size.z
      // These are property access expressions on objects/vectors
      console.log(`[extractValue] Processing member expression: '${valueNode.text}'`);

      // For now, return as string representation
      // TODO: Implement proper member access evaluation with variable scope
      return {
        type: 'string',
        value: valueNode.text,
      };
    }

    default:
      console.log(
        `[extractValue] Unhandled node type: '${valueNode.type}', text: '${valueNode.text}'`
      );
      return null;
  }
}

export interface ExtractedNamedArgument {
  name: string;
  value: ast.Value;
}

export type ExtractedParameter = ExtractedNamedArgument | ast.Value;
