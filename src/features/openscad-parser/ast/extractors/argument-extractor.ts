/**
 * @file Argument extraction utilities for OpenSCAD parser
 *
 * This module provides utilities for extracting and converting function arguments
 * from Tree-sitter CST nodes into structured AST parameter objects. It handles
 * both positional and named arguments, supporting various OpenSCAD data types
 * including numbers, strings, booleans, vectors, ranges, and expressions.
 *
 * The argument extractor is a critical component of the AST generation process,
 * responsible for:
 * - Parsing function call arguments from CST nodes
 * - Converting raw values to typed ParameterValue objects
 * - Handling named vs positional argument patterns
 * - Supporting complex expressions and nested structures
 * - Providing error handling and recovery
 *
 * @example Basic usage
 * ```typescript
 * import { extractArguments } from './argument-extractor';
 *
 * // Extract arguments from a function call like cube(10, center=true)
 * const args = extractArguments(argumentsNode);
 * // Returns: [
 * //   { value: 10 },                    // positional argument
 * //   { name: 'center', value: true }   // named argument
 * // ]
 * ```
 *
 * @module argument-extractor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import {
  extractValue as extractParameterValue,
  extractValueEnhanced,
} from './value-extractor.js';
import { ErrorHandler } from '../../error-handling/index.js';

/**
 * Extract text from source code using node position information.
 * This is a workaround for Tree-sitter memory management issues that can cause
 * node.text to be truncated.
 *
 * @param node - The Tree-sitter node
 * @param sourceCode - The original source code
 * @returns The correct text for the node, or node.text as fallback
 */
function getNodeText(node: TSNode, sourceCode?: string): string {
  if (sourceCode && node.startIndex !== undefined && node.endIndex !== undefined) {
    try {
      const extractedText = sourceCode.slice(node.startIndex, node.endIndex);
      // Only use extracted text if it's not empty and seems reasonable
      if (extractedText.length > 0 && extractedText.length <= 1000) {
        return extractedText;
      }
    } catch (error) {
      console.warn(`[getNodeText] Failed to extract text from source: ${error}`);
    }
  }

  // Fallback to node.text
  return node.text || '';
}

/**
 * Convert a Value to a ParameterValue
 * @param value The Value object to convert
 * @returns A ParameterValue object
 */
function convertValueToParameterValue(value: ast.Value): ast.ParameterValue {
  if (value.type === 'number') {
    return {
      type: 'expression',
      expressionType: 'literal',
      value: parseFloat(value.value as string),
    } as ast.LiteralNode;
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
    const vectorValues = (value.value as ast.Value[]).map(v => {
      if (v.type === 'number') {
        return parseFloat(v.value as string);
      }
      return 0; // Default for non-numeric elements in a vector context
    });

    // Check if it's intended to be an ExpressionNode (VectorExpressionNode)
    // This part is tricky as ast.Value for 'vector' is different from ast.VectorExpressionNode
    // For now, let's assume if it's from ast.Value, it's a direct vector, not an expression node.
    if (vectorValues.length === 2) {
      return vectorValues as ast.Vector2D;
    } else if (vectorValues.length >= 3) {
      return [
        vectorValues[0],
        vectorValues[1],
        vectorValues[2],
      ] as ast.Vector3D;
    }
    // Fallback for empty or 1-element vectors, or if conversion is ambiguous
    // OpenSCAD allows single numbers to be treated as vectors in some contexts, but ParameterValue expects specific types.
    // Returning an empty VectorExpressionNode or null might be alternatives.
    // For now, returning a default vector to avoid crashes, but this needs review.
    return [0, 0, 0] as ast.Vector3D; // Default fallback, consider implications
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
    console.warn(
      `[convertValueToParameterValue] Unhandled ast.Value subtype or value for default literal: ${
        value.type
      }, value: ${JSON.stringify(value.value)}`
    );
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
 * @returns A ParameterValue object or undefined if the conversion fails
 */
function convertNodeToParameterValue(
  node: TSNode,
  errorHandler?: ErrorHandler
): ast.ParameterValue | undefined {
  // Use enhanced value extraction if error handler is available
  if (errorHandler) {
    return extractValueEnhanced(node, errorHandler);
  }

  // Fall back to the original value-extractor function
  return extractParameterValue(node);
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
 * **Memory Management Workaround**: This function includes workarounds for Tree-sitter
 * memory management issues that can cause `node.text` to be truncated. When possible,
 * it uses the source code directly with node position information to extract correct text.
 *
 * @param argsNode - The CST node containing the arguments to extract
 * @param errorHandler - Optional error handler for enhanced expression evaluation and error reporting
 * @param sourceCode - Optional source code string for extracting correct text when node.text is truncated
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
  sourceCode?: string
): ast.Parameter[] {
  const nodeText = getNodeText(argsNode, sourceCode);
  console.log(
    `[extractArguments] Processing arguments node: type=${argsNode.type}, text=${nodeText}`
  );

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
    console.log(`[extractArguments] Processing argument_list node`);

    // For argument_list, we need to look at all children, not just named children
    // The structure is typically: '(' argument1 ',' argument2 ')'
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (!child) continue;

      console.log(
        `[extractArguments] Processing argument_list child ${i}: type=${child.type}, text=${child.text}`
      );

      // Skip punctuation tokens like '(', ')', ','
      if (child.type === '(' || child.type === ')' || child.type === ',') {
        continue;
      }

      // Process actual argument nodes or expressions
      if (child.type === 'argument') {
        const param = extractArgument(child, errorHandler, sourceCode);
        if (param) {
          console.log(
            `[extractArguments] Extracted parameter from argument: ${JSON.stringify(
              param
            )}`
          );
          args.push(param);
        }
      } else if (child.type === 'named_argument') {
        // Handle named arguments directly
        const childText = getNodeText(child, sourceCode);
        console.log(
          `[extractArguments] Processing named_argument: type=${child.type}, text=${childText}`
        );
        const param = extractArgument(child, errorHandler, sourceCode);
        if (param) {
          console.log(
            `[extractArguments] Extracted parameter from named_argument: ${JSON.stringify(
              param
            )}`
          );
          args.push(param);
        }
      } else if (child.type === 'arguments') {
        // Handle arguments node that contains expressions
        const childText = getNodeText(child, sourceCode);
        console.log(
          `[extractArguments] Processing arguments node: type=${child.type}, text=${childText}`
        );

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
          console.log(
            `[extractArguments] Detected named argument in arguments node (via CST structure), processing with extractArgument`
          );

          // Find the argument child and process it with extractArgument
          for (let j = 0; j < child.childCount; j++) {
            const argChild = child.child(j);
            if (argChild && argChild.type === 'argument') {
              const param = extractArgument(argChild, errorHandler, sourceCode);
              if (param) {
                console.log(
                  `[extractArguments] Extracted named parameter: ${JSON.stringify(
                    param
                  )}`
                );
                args.push(param);
              }
            }
          }
        } else {
          // Handle positional arguments - process individual argument children
          console.log(
            `[extractArguments] Processing positional arguments in arguments node`
          );

          for (let j = 0; j < child.childCount; j++) {
            const argChild = child.child(j);
            if (argChild && argChild.type === 'argument') {
              const param = extractArgument(argChild, errorHandler, sourceCode);
              if (param) {
                console.log(
                  `[extractArguments] Extracted positional parameter: ${JSON.stringify(
                    param
                  )}`
                );
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
        const childText = getNodeText(child, sourceCode);
        console.log(
          `[extractArguments] Processing direct value: type=${child.type}, text=${childText}`
        );
        const value = convertNodeToParameterValue(child, errorHandler);
        if (value !== undefined) {
          args.push({ name: undefined, value }); // Positional argument
          console.log(
            `[extractArguments] Extracted direct value as positional argument: ${JSON.stringify(
              { value }
            )}`
          );
        }
      }
    }

    console.log(
      `[extractArguments] Extracted ${
        args.length
      } arguments from argument_list: ${JSON.stringify(args)}`
    );
    return args;
  }

  // Process each argument based on named children (structured parsing for 'arguments' nodes)
  for (let i = 0; i < argsNode.namedChildCount; i++) {
    const argNode = argsNode.namedChild(i);
    if (!argNode) continue;

    const argNodeText = getNodeText(argNode, sourceCode);
    console.log(
      `[extractArguments] Processing structured child ${i}: type=${argNode.type}, text=${argNodeText}`
    );

    // Handle 'arguments' node that contains 'argument' nodes or direct expressions
    if (argNode.type === 'arguments') {
      console.log(
        `[extractArguments] Found 'arguments' node, processing its children`
      );
      console.log(
        `[extractArguments] Arguments node has ${argNode.namedChildCount} named children and ${argNode.childCount} total children`
      );

      // Check if this arguments node has argument children
      let hasArgumentChildren = false;
      let extractedAnyArguments = false;

      for (let j = 0; j < argNode.namedChildCount; j++) {
        const innerArgNode = argNode.namedChild(j);
        if (!innerArgNode) continue;

        const innerArgNodeText = getNodeText(innerArgNode, sourceCode);
        console.log(
          `[extractArguments] Processing inner argument ${j}: type=${innerArgNode.type}, text=${innerArgNodeText}`
        );

        if (innerArgNode.type === 'argument') {
          hasArgumentChildren = true;
          const param = extractArgument(innerArgNode, errorHandler, sourceCode);
          if (param) {
            console.log(
              `[extractArguments] Extracted parameter from inner argument: ${JSON.stringify(
                param
              )}`
            );
            args.push(param);
            extractedAnyArguments = true;
          }
        }
      }

      // Only treat as direct expression if no argument children were found AND no arguments were extracted
      if (
        !hasArgumentChildren &&
        !extractedAnyArguments &&
        argNode.namedChildCount > 0
      ) {
        console.log(
          `[extractArguments] No argument children found and no arguments extracted, treating arguments node as direct expression`
        );
        const value = convertNodeToParameterValue(argNode, errorHandler);
        if (value !== undefined) {
          args.push({ name: undefined, value }); // Positional argument
          console.log(
            `[extractArguments] Extracted arguments node as positional argument: ${JSON.stringify(
              { value }
            )}`
          );
        }
      }
    }
    // Expecting 'argument' nodes which contain either 'named_argument' or an expression directly
    else if (argNode.type === 'argument') {
      const param = extractArgument(argNode, errorHandler, sourceCode); // extractArgument should handle named vs positional within 'argument'
      if (param) {
        console.log(
          `[extractArguments] Extracted parameter from structured child: ${JSON.stringify(
            param
          )}`
        );
        args.push(param);
      }
    } else {
      // Handle cases where the child of argument_list is directly an expression (e.g. a single array_literal)
      // This might be needed if 'argument' nodes are not always present for single, unnamed arguments.
      console.log(
        `[extractArguments] Child is not of type 'argument', attempting to process as direct value: type=${argNode.type}`
      );
      const value = convertNodeToParameterValue(argNode, errorHandler);
      if (value !== undefined) {
        args.push({ name: undefined, value }); // Positional argument
        console.log(
          `[extractArguments] Extracted direct value as positional argument: ${JSON.stringify(
            { value }
          )}`
        );
      }
    }
  }

  // Fallback: If no arguments were extracted via structured parsing AND argsNode.text is non-empty and not just whitespace,
  // then consider the old text-based parsing. For now, this is commented out to isolate issues.
  /*
  if (args.length === 0 && argsNode.text && argsNode.text.trim() !== '') {
    console.log(`[extractArguments] No structured args found, trying to parse text directly: ${argsNode.text}`);

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
          console.warn(`[extractArguments] Fallback text parsing cannot handle complex argument: ${trimmedArgText}`);
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
    console.log(
      '[extractArguments] No arguments found and text is empty, returning empty array.'
    );
    return [];
  }

  console.log(
    `[extractArguments] Extracted ${args.length} arguments: ${JSON.stringify(
      args
    )}`
  );
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
  sourceCode?: string
): ast.Parameter | null {
  const nodeText = getNodeText(argNode, sourceCode);
  console.log(
    `[extractArgument] Processing argument node: type=${argNode.type}, text=${nodeText}`
  );

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
    console.log(`[extractArgument] Processing named_argument node`);

    // For named_argument nodes, look for identifier and value children
    let identifierNode: TSNode | null = null;
    let valueNode: TSNode | null = null;

    for (let i = 0; i < argNode.childCount; i++) {
      const child = argNode.child(i);
      if (!child) continue;

      const childText = getNodeText(child, sourceCode);
      console.log(
        `[extractArgument] named_argument child ${i}: type=${child.type}, text=${childText}`
      );

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
      const value = convertNodeToParameterValue(valueNode, errorHandler);
      if (value !== undefined) {
        console.log(
          `[extractArgument] Extracted named parameter: ${name} = ${JSON.stringify(
            value
          )}`
        );
        return { name, value };
      }
    }

    console.log(`[extractArgument] Failed to extract named_argument`);
    return null;
  }

  // Check if this is a named argument by examining CST structure
  // instead of relying on text (which can be truncated due to tree-sitter memory issues)
  // Named arguments have the pattern: identifier = expression
  const nameField = argNode.childForFieldName('name');
  const valueField = argNode.childForFieldName('value');

  if (nameField && valueField) {
    console.log(
      `[extractArgument] Detected named argument pattern via CST fields`
    );

    const name = getNodeText(nameField, sourceCode);
    const valueFieldText = getNodeText(valueField, sourceCode);
    console.log(
      `[extractArgument] Processing named argument: ${name} = ${valueFieldText}`
    );

    // Extract the value from the expression
    const value = extractValue(valueField);
    if (!value) {
      console.log(
        `[extractArgument] Failed to extract value from expression: ${valueFieldText}`
      );
      return null;
    }

    console.log(
      `[extractArgument] Extracted value: ${JSON.stringify(value)}`
    );
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

    const childText = getNodeText(child, sourceCode);
    console.log(
      `[extractArgument] Examining child ${i}: type=${child.type}, text='${childText}'`
    );

    if (child.type === 'identifier' && !identifierNode) {
      identifierNode = child;
      console.log(`[extractArgument] Found identifier: ${childText}`);
    } else if (child.type === '=' || child.type === 'equals') {
      hasEqualsSign = true;
      console.log(`[extractArgument] Found equals sign`);
    } else if (
      child.type !== '=' &&
      child.type !== 'equals' &&
      child.type !== 'identifier' &&
      !expressionNode
    ) {
      // This should be the expression part (not the '=' operator or identifier)
      expressionNode = child;
      console.log(
        `[extractArgument] Found expression: type=${child.type}, text='${childText}'`
      );
    }
  }

  if (identifierNode && expressionNode && hasEqualsSign) {

    const name = getNodeText(identifierNode, sourceCode);
    const expressionText = getNodeText(expressionNode, sourceCode);
    console.log(
      `[extractArgument] Processing named argument (fallback): ${name} = ${expressionText}`
    );

    // Extract the value from the expression
    const value = extractValue(expressionNode);
    if (!value) {
      console.log(
        `[extractArgument] Failed to extract value from expression: ${expressionText}`
      );
      return null;
    }

    console.log(
      `[extractArgument] Extracted value: ${JSON.stringify(value)}`
    );
    // Convert Value to ParameterValue
    const paramValue = convertValueToParameterValue(value);
    return { name, value: paramValue };
  } else if (argNode.namedChildCount === 1 && argNode.namedChild(0)) {
    // This is a positional argument
    const valueNode = argNode.namedChild(0);
    if (valueNode) {
      const valueNodeText = getNodeText(valueNode, sourceCode);
      console.log(
        `[extractArgument] Found positional argument: ${valueNodeText}`
      );

      // Extract the value
      const value = extractValue(valueNode);
      if (!value) {
        console.log(
          `[extractArgument] Failed to extract value from node: ${valueNodeText}`
        );
        return null;
      }

      console.log(
        `[extractArgument] Extracted value: ${JSON.stringify(value)}`
      );
      // Convert Value to ParameterValue
      const paramValue = convertValueToParameterValue(value);
      return { name: undefined, value: paramValue };
    }
  }

  console.log(
    `[extractArgument] Failed to extract argument from node: ${nodeText}`
  );
  return null;
}

/**
 * Extract a value from a value node
 * @param valueNode The value node
 * @returns A value object or null if the value is invalid
 */
export function extractValue(valueNode: TSNode): ast.Value | null {
  // --- BEGIN DIAGNOSTIC LOGGING ---
  // console.log(`[extractValue ENTRY] Node Type: '${valueNode.type}', Text: '${valueNode.text.replace(/\n/g, '\\n')}', isNamed: ${valueNode.isNamed}`);
  // --- END DIAGNOSTIC LOGGING ---

  console.log(
    `[extractValue] Processing value node: type=${valueNode.type}, text='${valueNode.text}'`
  );
  switch (valueNode.type) {
    case 'expression': {
      const expressionChild = valueNode.namedChild(0); // Or child(0) if expressions can be anonymous
      if (expressionChild) {
        console.log(
          `[extractValue] Expression child: type=${expressionChild.type}, text='${expressionChild.text}'`
        );
        return extractValue(expressionChild);
      }
      console.log('[extractValue] Expression node has no processable child.');
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
      console.log(`[extractValue] Matched number. Value: ${valueNode.text}`);
      return { type: 'number', value: valueNode.text };

    case 'string': // Add support for 'string' node type (new grammar)
    case 'string_literal': {
      // Remove quotes from string
      const stringValue = valueNode.text.substring(
        1,
        valueNode.text.length - 1
      );
      console.log(`[extractValue] Extracted string: ${stringValue}`);
      return { type: 'string', value: stringValue };
    }

    case 'boolean': // Added support for 'boolean' node type
    case 'boolean_literal': // Reverted to previous correct logic
    case 'true': // Reverted to previous correct logic
    case 'false': {
      // Reverted to previous correct logic
      // const boolValue = valueNode.text === 'true'; // Not strictly needed as value is string 'true'/'false'
      console.log(`[extractValue] Extracted boolean: ${valueNode.text}`);
      return { type: 'boolean', value: valueNode.text };
    }

    case 'identifier':
      console.log(`[extractValue] Extracted identifier: ${valueNode.text}`);
      return { type: 'identifier', value: valueNode.text };

    case 'vector_literal': // Fallthrough
    case 'array_literal':
    case 'vector_expression': // Add support for vector_expression
      return extractVectorLiteral(valueNode);

    case 'range_literal':
      return extractRangeLiteral(valueNode);

    // Handle expression hierarchy - these nodes typically have a single child that contains the actual value
    case 'unary_expression': {
      // Handle unary expressions specially (e.g., -5, +3, !flag)
      console.log(
        `[extractValue] Processing unary_expression: ${valueNode.text}`
      );

      if (valueNode.childCount === 2) {
        const operatorNode = valueNode.child(0);
        const operandNode = valueNode.child(1);

        if (operatorNode && operandNode) {
          const operator = operatorNode.text;
          const operandValue = extractValue(operandNode);

          console.log(
            `[extractValue] Unary operator: '${operator}', operand: ${JSON.stringify(operandValue)}`
          );

          if (operandValue && typeof operandValue === 'object' && 'value' in operandValue) {
            // Handle structured value objects
            const actualValue = operandValue.value;
            // Convert string numbers to actual numbers
            const numericValue = typeof actualValue === 'string' ? parseFloat(actualValue) :
                                typeof actualValue === 'number' ? actualValue : NaN;

            if (operator === '-' && typeof numericValue === 'number' && !isNaN(numericValue)) {
              console.log(`[extractValue] Applied unary minus to structured value: -${numericValue}`);
              return { type: 'number', value: -numericValue };
            }
            if (operator === '+' && typeof numericValue === 'number' && !isNaN(numericValue)) {
              console.log(`[extractValue] Applied unary plus to structured value: +${numericValue}`);
              return { type: 'number', value: numericValue };
            }
          } else if (typeof operandValue === 'number') {
            // Handle direct numeric values
            if (operator === '-') {
              console.log(`[extractValue] Applied unary minus to direct value: -${operandValue}`);
              return { type: 'number', value: -operandValue };
            }
            if (operator === '+') {
              console.log(`[extractValue] Applied unary plus to direct value: +${operandValue}`);
              return { type: 'number', value: operandValue };
            }
          }
        }
      }

      console.log(
        `[extractValue] Could not process unary_expression: ${valueNode.text}`
      );
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
      console.log(
        `[extractValue] Processing expression hierarchy node: ${valueNode.type}`
      );

      // Try to find the first named child that contains a value
      for (let i = 0; i < valueNode.namedChildCount; i++) {
        const child = valueNode.namedChild(i);
        if (child) {
          console.log(
            `[extractValue] Trying child ${i}: type=${child.type}, text='${child.text}'`
          );
          const result = extractValue(child);
          if (result) {
            console.log(
              `[extractValue] Successfully extracted from ${valueNode.type} via child ${i}`
            );
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
          const result = extractValue(child);
          if (result) {
            console.log(
              `[extractValue] Successfully extracted from ${valueNode.type} via unnamed child ${i}`
            );
            return result;
          }
        }
      }

      console.log(
        `[extractValue] Could not extract value from expression hierarchy node: ${valueNode.type}`
      );
      return null;
    }

    case 'binary_expression': {
      // Handle binary expressions like 1 + 2, 3 * 4, etc.
      console.log(`[extractValue] Processing binary_expression: ${valueNode.text}`);

      // For now, we'll evaluate simple arithmetic expressions
      // This is a basic implementation - a full expression evaluator would be more robust
      if (valueNode.childCount >= 3) {
        const leftNode = valueNode.child(0);
        const operatorNode = valueNode.child(1);
        const rightNode = valueNode.child(2);

        if (leftNode && operatorNode && rightNode) {
          const leftValue = extractValue(leftNode);
          const rightValue = extractValue(rightNode);
          const operator = operatorNode.text;

          console.log(`[extractValue] Binary expression: ${JSON.stringify(leftValue)} ${operator} ${JSON.stringify(rightValue)}`);

          // Only handle numeric operations for now
          if (leftValue?.type === 'number' && rightValue?.type === 'number') {
            const leftNum = typeof leftValue.value === 'string' ? parseFloat(leftValue.value) :
                           typeof leftValue.value === 'number' ? leftValue.value : NaN;
            const rightNum = typeof rightValue.value === 'string' ? parseFloat(rightValue.value) :
                            typeof rightValue.value === 'number' ? rightValue.value : NaN;

            if (!isNaN(leftNum) && !isNaN(rightNum)) {
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
                  console.log(`[extractValue] Unsupported binary operator: ${operator}`);
                  return null;
              }

              console.log(`[extractValue] Evaluated binary expression: ${leftNum} ${operator} ${rightNum} = ${result}`);
              return { type: 'number', value: result };
            }
          }
        }
      }

      console.log(`[extractValue] Could not evaluate binary_expression: ${valueNode.text}`);
      return null;
    }

    case 'call_expression': {
      // Handle nested function calls - for now, return as string representation
      // TODO: Implement proper function call expression handling
      console.log(`[extractValue] Processing call_expression: ${valueNode.text}`);

      return {
        type: 'string',
        value: valueNode.text
      };
    }

    default:
      console.log(`[extractValue] Unhandled node type: '${valueNode.type}', text: '${valueNode.text}'`);
      return null;
  }
}

/**
 * Extract a vector literal from a vector_literal node
 * @param vectorNode The vector_literal node
 * @returns A vector value object or null if the vector is invalid
 */
function extractVectorLiteral(vectorNode: TSNode): ast.VectorValue | null {
  console.log(
    `[extractVectorLiteral] Processing vector/array node: type=${vectorNode.type}, text='${vectorNode.text}'`
  );
  const values: ast.Value[] = [];

  // Iterate over all children, including syntax tokens like ',', '[', ']'
  // extractValue should filter out non-value tokens by returning null.
  for (let i = 0; i < vectorNode.childCount; i++) {
    const elementNode = vectorNode.child(i);
    if (elementNode) {
      // Ensure child exists
      // --- BEGIN DIAGNOSTIC LOGGING ---
      console.log(
        `[extractVectorLiteral BEFORE extractValue] Child node: Type='${
          elementNode.type
        }', Text='${elementNode.text.replace(/\n/g, '\\n')}', isNamed=${
          elementNode.isNamed
        }`
      );
      // --- END DIAGNOSTIC LOGGING ---
      const value = extractValue(elementNode);
      if (value) {
        console.log(
          '[extractVectorLiteral] Successfully extracted value for child:',
          JSON.stringify(value)
        );
        values.push(value);
      }
    }
  }

  // It's possible for an array like `[,,]` to parse with no actual values.
  // Or if extractValue fails for all children. Default OpenSCAD behavior might be relevant here.
  // For now, if values is empty but the text wasn't just '[]', it might indicate a parsing problem for its elements.
  if (
    values.length === 0 &&
    vectorNode.text.trim() !== '[]' &&
    vectorNode.text.trim() !== ''
  ) {
    console.warn(
      `[extractVectorLiteral] Parsed an empty vector from non-empty text: '${vectorNode.text}'. This might indicate issues extracting its elements.`
    );
  }
  return { type: 'vector', value: values };
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
