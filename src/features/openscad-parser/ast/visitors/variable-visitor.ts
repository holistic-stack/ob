/**
 * @file Variable references visitor for OpenSCAD parser
 *
 * This module implements the VariableVisitor class, which specializes in processing
 * OpenSCAD variable references and identifier nodes, converting them to structured
 * AST representations. Variables are fundamental to OpenSCAD's programming model,
 * enabling data storage, parameter passing, and dynamic value computation.
 *
 * The VariableVisitor handles:
 * - **Variable References**: Identifier resolution and variable access
 * - **Identifier Processing**: Direct identifier node conversion to variable expressions
 * - **Scope Resolution**: Variable name extraction and validation
 * - **Expression Integration**: Variable nodes as part of larger expressions
 * - **Error Recovery**: Graceful handling of malformed variable references
 * - **Location Tracking**: Source location preservation for debugging and IDE integration
 *
 * Key features:
 * - **Identifier Extraction**: Robust extraction of variable names from CST nodes
 * - **Type-Safe Processing**: Conversion to strongly-typed variable expression nodes
 * - **Error Context Preservation**: Detailed error information for debugging
 * - **Safe Logging**: Conditional logging that handles missing error handlers
 * - **Performance Optimization**: Efficient processing with minimal overhead
 * - **CST Integration**: Seamless integration with tree-sitter node structures
 *
 * Variable processing patterns:
 * - **Simple Variables**: `myVar` - direct variable reference
 * - **Parameter Variables**: Function and module parameter references
 * - **Built-in Variables**: `$fn`, `$fa`, `$fs` - OpenSCAD special variables
 * - **Scoped Variables**: Variables within let expressions and function scopes
 * - **Array Elements**: Variables used in array indexing expressions
 *
 * The visitor implements a focused processing strategy:
 * 1. **Identifier Extraction**: Locate identifier nodes within variable contexts
 * 2. **Name Validation**: Ensure valid variable names and handle edge cases
 * 3. **Expression Creation**: Convert to variable expression nodes with proper typing
 * 4. **Error Handling**: Provide detailed error context for malformed references
 *
 * @example Basic variable processing
 * ```typescript
 * import { VariableVisitor } from './variable-visitor';
 *
 * const visitor = new VariableVisitor(sourceCode, errorHandler);
 *
 * // Process variable reference
 * const varNode = visitor.visitVariable(variableCST);
 * // Returns: { type: 'expression', expressionType: 'variable', name: 'myVar', location: {...} }
 *
 * // Process identifier directly
 * const identNode = visitor.visitIdentifier(identifierCST);
 * // Returns: { type: 'expression', expressionType: 'variable', name: 'identifier', location: {...} }
 * ```
 *
 * @example Variable processing in expressions
 * ```typescript
 * // For OpenSCAD code: x + y * z
 * // Each variable (x, y, z) is processed by VariableVisitor
 * const xVar = visitor.visitIdentifier(xCST);
 * const yVar = visitor.visitIdentifier(yCST);
 * const zVar = visitor.visitIdentifier(zCST);
 * // Each returns a variable expression node
 * ```
 *
 * @example Error handling for malformed variables
 * ```typescript
 * const visitor = new VariableVisitor(sourceCode, errorHandler);
 *
 * // Process malformed variable reference
 * const result = visitor.createVariableNode(malformedCST);
 *
 * if (!result) {
 *   const errors = errorHandler.getErrors();
 *   console.log('Variable processing errors:', errors);
 * }
 * ```
 *
 * @module variable-visitor
 * @since 0.1.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import * as ast from '../ast-types.js';
import { BaseASTVisitor } from './base-ast-visitor.js';
import { ErrorHandler } from '../../error-handling/index.js';
import { getLocation } from '../utils/location-utils.js';
import { findDescendantOfType } from '../utils/node-utils.js';

/**
 * Visitor for processing OpenSCAD variable references and identifiers.
 *
 * The VariableVisitor extends BaseASTVisitor to provide specialized handling for
 * variable references and identifier nodes. It focuses on converting CST identifier
 * nodes to properly typed variable expression nodes while maintaining error context
 * and location information.
 *
 * This implementation provides:
 * - **Focused Processing**: Specialized handling only for variable-related nodes
 * - **Robust Extraction**: Safe identifier extraction with error handling
 * - **Type Safety**: Conversion to strongly-typed variable expression nodes
 * - **Error Recovery**: Graceful handling of malformed variable references
 * - **Performance Optimization**: Minimal overhead for simple variable processing
 *
 * @class VariableVisitor
 * @extends {BaseASTVisitor}
 * @since 0.1.0
 */
export class VariableVisitor extends BaseASTVisitor {
  /**
   * Constructor for the VariableVisitor
   * @param source The source code
   * @param errorHandler The error handler
   */
  constructor(source: string, protected override errorHandler: ErrorHandler) {
    super(source, errorHandler);
  }

  /**
   * Override visitStatement to only handle variable-related statements
   * This prevents the VariableVisitor from interfering with other statement types
   * that should be handled by specialized visitors (PrimitiveVisitor, TransformVisitor, etc.)
   *
   * @param node The statement node to visit
   * @returns The variable AST node or null if this is not a variable statement
   * @override
   */
  override visitStatement(node: TSNode): ast.ASTNode | null {
    // Only handle statements that contain variable assignments or references
    // Check for assignment_statement with variable assignments
    const assignmentStatement = findDescendantOfType(node, 'assignment_statement');
    if (assignmentStatement) {
      // Assignment statements are handled by AssignStatementVisitor, not VariableVisitor
      return null;
    }

    // Check for variable_statement (if such a node type exists in the grammar)
    const variableStatement = findDescendantOfType(node, 'variable_statement');
    if (variableStatement) {
      // Process variable statement
      const identifier = findDescendantOfType(variableStatement, 'identifier');
      if (identifier) {
        return this.visitIdentifier(identifier);
      }
    }

    // Return null for all other statement types to let specialized visitors handle them
    return null;
  }

  /**
   * Create a variable node from a variable node in the CST
   * @param node The variable node from the CST
   * @returns A variable node for the AST
   */
  createVariableNode(node: TSNode): ast.VariableNode | null {
    this.safeLog(
      'info',
      `[VariableVisitor.createVariableNode] Processing variable node: ${node.text}`,
      'VariableVisitor.createVariableNode',
      node
    );

    try {
      // Extract the variable name from the identifier node
      const identifierNode = findDescendantOfType(node, 'identifier');
      if (!identifierNode) {
        this.safeLog(
          'warning',
          `[VariableVisitor.createVariableNode] No identifier found in variable node: ${node.text}`,
          'VariableVisitor.createVariableNode',
          node
        );
        return null;
      }

      // Create the variable node
      return {
        type: 'expression',
        expressionType: 'variable',
        name: identifierNode.text,
        location: getLocation(node),
      };
    } catch (error) {
      this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        'VariableVisitor.createVariableNode',
        node
      );
      return null;
    }
  }

  /**
   * Visit a variable node in the CST
   * @param node The variable node from the CST
   * @returns A variable node for the AST
   */
  visitVariable(node: TSNode): ast.VariableNode | null {
    this.safeLog(
      'info',
      `[VariableVisitor.visitVariable] Processing variable: ${node.text}`,
      'VariableVisitor.visitVariable',
      node
    );
    return this.createVariableNode(node);
  }

  /**
   * Visit an identifier node in the CST
   * @param node The identifier node from the CST
   * @returns A variable node for the AST
   */
  visitIdentifier(node: TSNode): ast.VariableNode | null {
    this.safeLog(
      'info',
      `[VariableVisitor.visitIdentifier] Processing identifier: ${node.text}`,
      'VariableVisitor.visitIdentifier',
      node
    );
    
    // Create a variable node directly from the identifier
    return {
      type: 'expression',
      expressionType: 'variable',
      name: node.text,
      location: getLocation(node),
    };
  }
  
  /**
   * Safe logging helper that checks if errorHandler exists
   */
  private safeLog(level: 'info' | 'debug' | 'warning' | 'error', message: string, context?: string, node?: unknown): void {
    if (this.errorHandler) {
      switch (level) {
        case 'info':
          this.errorHandler.logInfo(message, context, node);
          break;
        case 'debug':
          this.errorHandler.logDebug(message, context, node);
          break;
        case 'warning':
          this.errorHandler.logWarning(message, context, node);
          break;
        case 'error':
          this.errorHandler.logError(message, context, node);
          break;
      }
    }
  }
  
  /**
   * Create an AST node for a function (required by BaseASTVisitor)
   * @param node The function node
   * @param functionName The function name
   * @param args The function arguments
   * @returns The function call AST node or null if not handled
   */
  createASTNodeForFunction(node: TSNode, _functionName?: string, _args?: ast.Parameter[]): ast.ASTNode | null {
    // VariableVisitor doesn't handle function definitions or calls
    return null;
  }
}