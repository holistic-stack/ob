/**
 * @file value-extractor.ts
 * @description This module provides the `extractValue` function, a core utility for converting Tree-sitter
 * CST nodes into a generic `ast.Value` representation. It handles various literal types (numbers, strings, booleans),
 * vectors, ranges, and attempts to process simple expressions.
 *
 * @architectural_decision
 * The `extractValue` function is designed to be a versatile, low-level extractor that can interpret the raw
 * Tree-sitter nodes into a more structured `ast.Value`. This `ast.Value` can then be further processed by
 * other extractors (like `argument-extractor`) or directly used in AST nodes. It includes basic logic for
 * handling unary and binary expressions, but defers complex expression evaluation to a dedicated evaluator.
 * The inclusion of `variableScope` allows for basic identifier resolution during extraction.
 *
 * @example
 * ```typescript
 * import { extractValue } from './value-extractor';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 * import * as TreeSitter from 'web-tree-sitter';
 *
 * async function demonstrateValueExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   // Example 1: Extract a number literal
 *   let code = '123.45';
 *   let cst = parser.parseCST(code);
 *   let valueNode = cst?.rootNode.namedChild(0); // Assuming '123.45' is the first node
 *   if (valueNode) {
 *     const value = extractValue(valueNode, code);
 *     console.log('Number Value:', value); // Expected: { type: 'number', value: '123.45' }
 *   }
 *
 *   // Example 2: Extract a string literal
 *   code = '"hello world" ';
 *   cst = parser.parseCST(code);
 *   valueNode = cst?.rootNode.namedChild(0);
 *   if (valueNode) {
 *     const value = extractValue(valueNode, code);
 *     console.log('String Value:', value); // Expected: { type: 'string', value: 'hello world' }
 *   }
 *
 *   // Example 3: Extract a boolean literal
 *   code = 'true';
 *   cst = parser.parseCST(code);
 *   valueNode = cst?.rootNode.namedChild(0);
 *   if (valueNode) {
 *     const value = extractValue(valueNode, code);
 *     console.log('Boolean Value:', value); // Expected: { type: 'boolean', value: 'true' }
 *   }
 *
 *   // Example 4: Extract a vector literal
 *   code = '[1, 2, 3]';
 *   cst = parser.parseCST(code);
 *   valueNode = cst?.rootNode.namedChild(0);
 *   if (valueNode) {
 *     const value = extractValue(valueNode, code);
 *     console.log('Vector Value:', value); // Expected: { type: 'vector', value: [...] }
 *   }
 *
 *   // Example 5: Extract a simple binary expression (limited evaluation)
 *   code = '1 + 2';
 *   cst = parser.parseCST(code);
 *   valueNode = cst?.rootNode.namedChild(0);
 *   if (valueNode) {
 *     const value = extractValue(valueNode, code);
 *     console.log('Binary Expression Value:', value); // Expected: { type: 'number', value: 3 }
 *   }
 *
 *   parser.dispose();
 * }
 *
 * demonstrateValueExtraction();
 * ```
 */

import type { Node as TSNode } from 'web-tree-sitter';
import type * as ast from '../ast-types.js';
import type { ErrorHandler } from '../ast-types.js';

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
  console.log(
    `[getNodeText] DEBUG - node.type: ${node.type}, node.text: "${node.text}", startIndex: ${node.startIndex}, endIndex: ${node.endIndex}, sourceCode length: ${sourceCode?.length || 'undefined'}`
  );

  if (sourceCode && node.startIndex !== undefined && node.endIndex !== undefined) {
    try {
      const extractedText = sourceCode.slice(node.startIndex, node.endIndex);
      console.log(
        `[getNodeText] DEBUG - extractedText: "${extractedText}", length: ${extractedText.length}`
      );
      if (extractedText.length > 0 && extractedText.length <= 1000) {
        return extractedText;
      }
    } catch (error) {
      console.log(`[getNodeText] DEBUG - extraction error:`, error);
    }
  }

  const fallbackText = node.text || '';
  console.log(`[getNodeText] DEBUG - returning fallback text: "${fallbackText}"`);
  return fallbackText;
}

/**
 * @function convertValueToParameterValue
 * @description Converts a generic `ast.Value` object (as extracted by `value-extractor`)
 * into a more specific `ast.ParameterValue` type, which is used in the AST.
 * This function handles type coercion and conversion for numbers, booleans, strings, vectors, and ranges.
 *
 * @param {ast.Value | ast.ErrorNode} value - The generic value object or an error node to convert.
 * @returns {ast.ParameterValue} The converted parameter value, or `null` if conversion is not possible.
 */
function convertValueToParameterValue(value: ast.Value | ast.ErrorNode): ast.ParameterValue {
  console.log(
    `[value-extractor convertValueToParameterValue] DEBUG - Converting value:`,
    JSON.stringify(value, null, 2)
  );

  if (value.type === 'error') {
    return value as ast.ErrorNode;
  } else if (value.type === 'number') {
    // Ensure we have a valid numeric value before parsing
    const numericValue = value.value;
    console.log(
      `[value-extractor convertValueToParameterValue] DEBUG - Number value: "${numericValue}", type: ${typeof numericValue}`
    );

    if (numericValue === null || numericValue === undefined) {
      console.log(
        `[value-extractor convertValueToParameterValue] DEBUG - Number value is null/undefined, returning null`
      );
      return null;
    }

    // Check for empty string
    if (typeof numericValue === 'string' && numericValue.trim() === '') {
      console.log(
        `[value-extractor convertValueToParameterValue] DEBUG - Number value is empty string, returning null`
      );
      return null;
    }

    const parsedValue =
      typeof numericValue === 'string' ? parseFloat(numericValue) : Number(numericValue);
    console.log(
      `[value-extractor convertValueToParameterValue] DEBUG - Parsed value: ${parsedValue}, isNaN: ${Number.isNaN(parsedValue)}`
    );

    if (Number.isNaN(parsedValue)) {
      console.log(
        `[value-extractor convertValueToParameterValue] DEBUG - Parsed value is NaN, returning null`
      );
      return null;
    }

    console.log(
      `[value-extractor convertValueToParameterValue] DEBUG - Returning primitive number: ${parsedValue}`
    );
    return parsedValue;
  } else if (value.type === 'boolean') {
    return value.value === 'true';
  } else if (value.type === 'string') {
    return value.value as string;
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

    // Check if any element is an identifier - if so, create a VectorExpressionNode
    const hasIdentifiers = vectorElements.some((v) => v.type === 'identifier');

    if (hasIdentifiers) {
      // Create a VectorExpressionNode to preserve identifiers
      const elements = vectorElements.map((v) => {
        if (v.type === 'number') {
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
        } else if (v.type === 'identifier') {
          return {
            type: 'expression',
            expressionType: 'identifier',
            name: v.value as string,
          } as ast.IdentifierNode;
        } else {
          // Default fallback for other types
          return {
            type: 'expression',
            expressionType: 'literal',
            value: 0,
          } as ast.LiteralNode;
        }
      });

      return {
        type: 'expression',
        expressionType: 'vector',
        elements: elements,
      } as ast.VectorExpressionNode;
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

      if (vectorValues.length === 2) {
        return vectorValues as ast.Vector2D;
      } else if (vectorValues.length >= 3) {
        return [vectorValues[0], vectorValues[1], vectorValues[2]] as ast.Vector3D;
      }
      // Fallback for empty or 1-element vectors
      return [0, 0, 0] as ast.Vector3D; // Default fallback
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
  } else if (value.type === 'expression') {
    // Handle ExpressionNode directly
    return value as ast.ExpressionNode;
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
 * Convert a node to a ParameterValue
 * @param node The node to convert
 * @param errorHandler Optional error handler for enhanced expression evaluation
 * @param sourceCode Optional source code string for extracting correct text when node.text is truncated
 * @returns A ParameterValue object or undefined if the conversion fails
 */
function convertNodeToParameterValue(
  node: TSNode,
  _errorHandler?: ErrorHandler,
  sourceCode: string = '',
  variableScope?: Map<string, ast.ParameterValue>
): ast.ParameterValue | undefined {
  // Extract value using the standard extraction function
  const value = extractValue(node, sourceCode, variableScope);

  // Convert Value to ParameterValue
  if (value) {
    return convertValueToParameterValue(value);
  }

  return undefined;
}

/**
 * Extracts function arguments from Tree-sitter CST nodes and converts them to AST parameters.
 *
 * This function is the main entry point for argument extraction, handling both simple
 * and complex argument patterns found in OpenSCAD function calls. It supports:
 * - Positional arguments: `cube(10, 20, 30)`
 * - Named arguments: `cube(size=[10, 20, 30], center=true)`
 * - Mixed arguments: `cube(10, center=true)`
 * - Complex expressions: `cube(x + 5, center=condition)`
 * - Vector arguments: `translate([x, y, z])`
 * - Range arguments: `for(i = [0:10:100])`
 *
 * The function handles different CST node types that can contain arguments:
 * - `arguments`: Standard argument container
 * - `argument_list`: Alternative argument container format
 * - `argument`: Individual argument nodes
 * - `named_argument`: Explicitly named arguments
 *
 * This function extracts arguments from CST nodes and converts them to typed parameters.
 *
 * @param argsNode - The CST node containing the arguments to extract
 * @param errorHandler - Optional error handler for enhanced expression evaluation and error reporting
 * @param sourceCode - Optional source code string for text extraction
 * @returns Array of Parameter objects with optional names and typed values
 *
 * @example Extracting positional arguments
 * ```typescript
 * // For OpenSCAD code: cube(10, 20, 30)
 * const args = extractArguments(argumentsNode);
 * // Returns: [
 * //   { value: 10 },
 * //   { value: 20 },
 * //   { value: 30 }
 * // ]
 * ```
 *
 * @example Extracting named arguments
 * ```typescript
 * // For OpenSCAD code: cylinder(h=20, r=5, center=true)
 * const args = extractArguments(argumentsNode);
 * // Returns: [
 * //   { name: 'h', value: 20 },
 * //   { name: 'r', value: 5 },
 * //   { name: 'center', value: true }
 * // ]
 * ```
 *
 * @example Extracting mixed arguments
 * ```typescript
 * // For OpenSCAD code: cube([10, 20, 30], center=true)
 * const args = extractArguments(argumentsNode);
 * // Returns: [
 * //   { value: [10, 20, 30] },
 * //   { name: 'center', value: true }
 * // ]
 * ```
 *
 * @example With error handling and source code
 * ```typescript
 * const errorHandler = new SimpleErrorHandler();
 * const args = extractArguments(argumentsNode, errorHandler, sourceCode);
 *
 * if (errorHandler.getErrors().length > 0) {
 *   console.log('Argument extraction errors:', errorHandler.getErrors());
 * }
 * ```
 *
 * @since 0.1.0
 * @category Extractors
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
        const param = extractArgument(child, errorHandler, sourceCode, variableScope);
        if (param) {
          args.push(param);
        }
      } else if (child.type === 'named_argument') {
        // Handle named arguments directly
        const _childText = getNodeText(child, sourceCode);
        const param = extractArgument(child, errorHandler, sourceCode, variableScope);
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
              const param = extractArgument(argChild, errorHandler, sourceCode, variableScope);
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
              const param = extractArgument(argChild, errorHandler, sourceCode, variableScope);
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
          const param = extractArgument(innerArgNode, errorHandler, sourceCode, variableScope);
          if (param) {
            args.push(param);
            extractedAnyArguments = true;
          }
        }
      }

      // Only treat as direct expression if no argument children were found AND no arguments were extracted
      if (!hasArgumentChildren && !extractedAnyArguments && argNode.namedChildCount > 0) {
        const value = convertNodeToParameterValue(argNode, errorHandler, sourceCode, variableScope);
        if (value !== undefined) {
          args.push({ name: undefined, value }); // Positional argument
        }
      }
    }
    // Expecting 'argument' nodes which contain either 'named_argument' or an expression directly
    else if (argNode.type === 'argument') {
      const param = extractArgument(argNode, errorHandler, sourceCode, variableScope); // extractArgument should handle named vs positional within 'argument'
      if (param) {
        args.push(param);
      }
    } else {
      // Handle cases where the child of argument_list is directly an expression (e.g. a single array_literal)
      // This might be needed if 'argument' nodes are not always present for single, unnamed arguments.
      console.log(
        `[extractArguments] Child is not of type 'argument', attempting to process as direct value: type=${argNode.type}`
      );
      const value = convertNodeToParameterValue(argNode, errorHandler, sourceCode, variableScope);
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
        // This is a very naive way to parse, ideally we'd re-invoke a mini-parser or expression here.
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
 * Extract a parameter from an argument node
 * @param argNode The argument node
 * @param errorHandler Optional error handler for enhanced expression evaluation
 * @param sourceCode Optional source code for extracting correct text when node.text is truncated
 * @returns A parameter object or null if the argument is invalid
 */
function extractArgument(
  argNode: TSNode,
  errorHandler?: ErrorHandler,
  sourceCode?: string,
  variableScope?: Map<string, ast.ParameterValue>
): ast.Parameter | null {
  const nodeText = getNodeText(argNode, sourceCode);
  // Detect Tree-sitter memory corruption patterns
  // If we see patterns like ');' or ')' as argument text, it's likely corruption
  if (nodeText.match(/^\s*\)[\s;]*$/)) {
    console.log(
      `[extractArgument] Detected Tree-sitter memory corruption in argument: '${nodeText}'. Skipping.`
    );
    return null;
  }

  // Handle named_argument nodes directly
  if (argNode.type === 'named_argument') {
    // For named_argument nodes, look for identifier and value children
    let identifierNode: TSNode | null = null;
    let valueNode: TSNode | null = null;

    for (let i = 0; i < argNode.childCount; i++) {
      const child = argNode.child(i);
      if (!child) continue;

      if (child.type === 'identifier' && !identifierNode) {
        identifierNode = child;
      } else if (
        child.type !== '=' &&
        child.type !== 'equals' &&
        child.type !== 'identifier' &&
        !valueNode
      ) {
        valueNode = child;
      }
    }

    if (identifierNode && valueNode) {
      const name = getNodeText(identifierNode, sourceCode);
      const value = convertNodeToParameterValue(valueNode, errorHandler, sourceCode, variableScope);
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
    const value = extractValue(valueField, sourceCode, variableScope);
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
    const value = extractValue(expressionNode, sourceCode, variableScope);
    if (!value) {
      return null;
    }
    // Convert Value to ParameterValue
    const paramValue = convertValueToParameterValue(value);
    return { name, value: paramValue };
  } else if (argNode.namedChildCount === 1 && argNode.namedChild(0)) {
    // This is a positional argument
    const valueNode = argNode.namedChild(0);
    if (valueNode) {
      // Extract the value
      const value = extractValue(valueNode, sourceCode, variableScope);
      if (!value) {
        return null;
      }
      // Convert Value to ParameterValue
      const paramValue = convertValueToParameterValue(value);
      return { name: undefined, value: paramValue };
    }
  }
  return null;
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
 * Extract a value from a value node
 *
 * @param valueNode - The value node to extract from
 * @param sourceCode - The original source code string
 * @param variableScope - Optional variable scope for resolving identifiers
 * @returns A value object or null if the value is invalid
 *
 * @example
 * ```typescript
 * const numberNode = parser.parse('42').rootNode.namedChild(0);
 * const value = extractValue(numberNode, '42');
 * // Returns: { type: 'number', value: '42' }
 * ```
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
        return extractValue(expressionChild, sourceCode, variableScope);
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
    case 'number': // Changed from 'number_literal'
      return { type: 'number', value: getNodeText(valueNode, sourceCode) };

    case 'string': // Add support for 'string' node type (new grammar)
    case 'string_literal': {
      // Remove quotes from string
      const stringText = getNodeText(valueNode, sourceCode);
      const stringValue = stringText.substring(1, stringText.length - 1);
      return { type: 'string', value: stringValue };
    }

    case 'boolean': // Added support for 'boolean' node type
    case 'boolean_literal': // Reverted to previous correct logic
    case 'true': // Reverted to previous correct logic
    case 'false': {
      // Reverted to previous correct logic
      // const boolValue = valueNode.text === 'true'; // Not strictly needed as value is string 'true'/'false'
      return { type: 'boolean', value: getNodeText(valueNode, sourceCode) };
    }

    case 'identifier': {
      const identifierText = getNodeText(valueNode, sourceCode);
      // If a variableScope is provided, try to resolve the identifier
      if (variableScope?.has(identifierText)) {
        const value = variableScope.get(identifierText);

        // Handle ErrorNode
        if (
          value &&
          typeof value === 'object' &&
          value !== null &&
          'type' in value &&
          value.type === 'error'
        ) {
          return null; // Or handle the error appropriately
        }

        // Handle ExpressionNode - convert to appropriate Value type
        if (
          value &&
          typeof value === 'object' &&
          value !== null &&
          'type' in value &&
          value.type === 'expression'
        ) {
          const expr = value as ast.ExpressionNode;
          if (expr.expressionType === 'literal' && 'value' in expr) {
            const literalValue = expr.value;
            if (typeof literalValue === 'string') {
              return { type: 'string', value: literalValue };
            } else if (typeof literalValue === 'number') {
              return { type: 'number', value: literalValue };
            }
          }
          // For other expression types, return as identifier
          return { type: 'identifier', value: valueNode.text };
        }

        // Handle primitive values
        if (typeof value === 'string') {
          return { type: 'string', value: value };
        } else if (typeof value === 'number') {
          return { type: 'number', value: value };
        } else if (typeof value === 'boolean') {
          return { type: 'boolean', value: value };
        }

        // Handle Vector types
        if (Array.isArray(value)) {
          return {
            type: 'vector',
            value: value.map((v) => ({ type: 'number', value: v }) as ast.Value),
          };
        }
      }
      return { type: 'identifier', value: identifierText };
    }

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
          const operator = getNodeText(operatorNode, sourceCode);
          const operandValue = extractValue(operandNode, sourceCode, variableScope);

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
          const result = extractValue(child, sourceCode, variableScope);
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
          const result = extractValue(child, sourceCode, variableScope);
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
          const leftValue = extractValue(leftNode, sourceCode, variableScope);
          const rightValue = extractValue(rightNode, sourceCode, variableScope);
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

/**
 * Extract a range literal from a range_literal node
 * @param rangeNode The range_literal node
 * @returns A range value object or null if the range is invalid
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

export interface ExtractedNamedArgument {
  name: string;
  value: ast.Value;
}

export type ExtractedParameter = ExtractedNamedArgument | ast.Value;
