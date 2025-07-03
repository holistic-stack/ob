/**
 * @file Assign Statement Visitor for OpenSCAD Parser
 *
 * This module implements the AssignStatementVisitor class, which handles the parsing
 * and AST generation for OpenSCAD assign statements. Assign statements are deprecated
 * in OpenSCAD but still supported for legacy code compatibility.
 *
 * The visitor supports assign statements with the pattern:
 * - Basic assign: assign(var = value) { statements }
 * - Multiple assignments: assign(var1 = value1, var2 = value2) { statements }
 * - Complex expressions: assign(x = a + b, y = sin(angle)) { statements }
 *
 * ## Architecture
 *
 * The AssignStatementVisitor integrates with the parser's visitor system through:
 * 1. CompositeVisitor integration for seamless parsing
 * 2. BaseASTVisitor enhancement for assign_statement detection
 * 3. Expression system integration for assignment value parsing
 *
 * ## Technical Implementation
 *
 * - **Real CST Parsing**: Uses actual tree-sitter `assign_statement` nodes
 * - **Expression Integration**: Leverages existing expression visitor system
 * - **Assignment Processing**: Sophisticated logic to handle multiple assignments
 * - **Error Handling**: Comprehensive error handling for malformed statements
 *
 * @example
 * ```typescript
 * // Basic usage with parser
 * const parser = new EnhancedOpenscadParser(new SimpleErrorHandler());
 * await parser.init();
 *
 * // Parse basic assign statement
 * const ast1 = parser.parseAST('assign(x = 5) cube(x);');
 * console.log(ast1[0]); // AssignStatementNode
 *
 * // Parse assign with multiple assignments
 * const ast2 = parser.parseAST('assign(x = 5, y = 10) cube([x, y, 1]);');
 * console.log(ast2[0]); // AssignStatementNode with multiple assignments
 *
 * // Parse assign with block
 * const ast3 = parser.parseAST('assign(r = 10) { sphere(r); translate([r*2, 0, 0]) sphere(r); }');
 * console.log(ast3[0]); // AssignStatementNode with block body
 * ```
 *
 * @since 1.0.0
 */

import { Node as TSNode } from 'web-tree-sitter';
import { BaseASTVisitor } from '../base-ast-visitor.js';
import { ErrorHandler } from '../../../error-handling/index.js';
import * as ast from '../../ast-types.js';
import { getLocation } from '../../utils/location-utils.js';
import {
  extractArguments,
  type ExtractedParameter,
  type ExtractedNamedArgument,
} from '../../extractors/argument-extractor.js';

/**
 * Visitor class for processing OpenSCAD assign statements.
 *
 * The AssignStatementVisitor converts Tree-sitter CST nodes representing assign
 * statements into structured AST nodes. It handles both single and multiple
 * assignments within assign statements.
 *
 * Assign statements in OpenSCAD follow the pattern:
 * - `assign(var = value) statement` - Single assignment
 * - `assign(var1 = value1, var2 = value2) { statements }` - Multiple assignments with block
 *
 * The visitor integrates with the expression system to properly parse assignment
 * values, ensuring full support for complex expressions within assign statements.
 *
 * @example Creating and using the visitor
 * ```typescript
 * const visitor = new AssignStatementVisitor(sourceCode, errorHandler);
 *
 * // Process basic assign statement
 * const basicAssign = visitor.visitAssignStatement(basicAssignCST);
 * // Returns: { type: 'assign', assignments: [...], body: {...} }
 *
 * // Process assign with multiple assignments
 * const multipleAssign = visitor.visitAssignStatement(multipleAssignCST);
 * // Returns: { type: 'assign', assignments: [...], body: {...} }
 * ```
 *
 * @since 1.0.0
 */
export class AssignStatementVisitor extends BaseASTVisitor {
  /**
   * Creates a new AssignStatementVisitor instance.
   *
   * @param sourceCode - The original OpenSCAD source code being parsed
   * @param errorHandler - Handler for managing parsing errors and warnings
   *
   * @example
   * ```typescript
   * const errorHandler = new ErrorHandler();
   * const visitor = new AssignStatementVisitor(sourceCode, errorHandler);
   * ```
   */
  constructor(
    sourceCode: string,
    protected override errorHandler: ErrorHandler
  ) {
    super(sourceCode, errorHandler);
  }

  /**
   * Create an AST node for a specific function.
   * This method handles assign function calls by converting them to assign statements.
   *
   * @param node - The node to process
   * @param functionName - The name of the function
   * @param args - The arguments to the function
   * @returns AssignStatementNode for assign functions, null for others
   */
  protected createASTNodeForFunction(
    node: TSNode,
    functionName: string,
    args: ast.Parameter[]
  ): ast.ASTNode | null {
    // Handle assign function calls
    if (functionName === 'assign') {
      return this.processAssignFunctionCall(node, args);
    }

    // Other functions are not handled by this visitor
    return null;
  }

  /**
   * Process an assign function call and convert it to an assign statement.
   * This method handles module_instantiation nodes with name 'assign'.
   *
   * @param node - The module_instantiation CST node
   * @param args - The extracted arguments from the function call
   * @returns The corresponding AssignStatementNode AST node, or null if processing fails
   * @private
   */
  private processAssignFunctionCall(
    node: TSNode,
    args: ast.Parameter[]
  ): ast.AssignStatementNode | null {
    this.safeLog(
      'info',
      `[AssignStatementVisitor.processAssignFunctionCall] Processing assign function call: ${node.text.substring(
        0,
        50
      )}`,
      'AssignStatementVisitor.processAssignFunctionCall',
      node
    );

    // Convert function call arguments to assignments
    const assignments: ast.AssignmentNode[] = [];

    for (const arg of args) {
      if (arg.name && arg.value) {
        // Convert parameter to assignment
        const variableIdentifierNode: ast.IdentifierNode = {
          type: 'expression',
          expressionType: 'identifier',
          name: arg.name,
          location: getLocation(node), // Use parent node location as fallback
        };

        const assignment: ast.AssignmentNode = {
          type: 'assignment',
          variable: variableIdentifierNode,
          value: arg.value,
          location: getLocation(node), // Use the function call location
        };
        assignments.push(assignment);
      }
    }

    // Find the body statement after the function call
    // For assign function calls like "assign(x = 5) cube(x);", the body is in the statement field
    let body: ast.ASTNode | null = null;

    // According to the OpenSCAD grammar, module_instantiation can have a statement field:
    // module_instantiation: seq(name, arguments, statement)
    // So for "assign(x = 5) cube(x);", the structure is:
    // - name: "assign"
    // - arguments: "(x = 5)"
    // - statement: "cube(x);"

    const statementField = node.childForFieldName('statement');
    if (statementField) {
      this.safeLog(
        'info',
        `[AssignStatementVisitor.processAssignFunctionCall] Found statement field: ${statementField.text}`,
        'AssignStatementVisitor.processAssignFunctionCall',
        statementField
      );
      body = this.visitNode(statementField);
    } else {
      // Fallback: look for block field
      const blockField = node.childForFieldName('block');
      if (blockField) {
        this.safeLog(
          'info',
          `[AssignStatementVisitor.processAssignFunctionCall] Found block field: ${blockField.text}`,
          'AssignStatementVisitor.processAssignFunctionCall',
          blockField
        );
        body = this.visitNode(blockField);
      } else {
        // Last resort: look for any statement or module_instantiation child that's not the arguments
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (!child) continue;

          // Skip argument_list and other non-body nodes
          if (
            child.type === 'argument_list' ||
            child.type === 'identifier' ||
            child.type === '(' ||
            child.type === ')' ||
            child.type === ';'
          ) {
            continue;
          }

          // Look for statement or module_instantiation nodes
          if (
            child.type === 'statement' ||
            child.type === 'module_instantiation' ||
            child.type === 'block'
          ) {
            this.safeLog(
              'info',
              `[AssignStatementVisitor.processAssignFunctionCall] Found child body: ${child.type} - ${child.text}`,
              'AssignStatementVisitor.processAssignFunctionCall',
              child
            );
            body = this.visitNode(child);
            break;
          }
        }
      }
    }

    if (!body) {
      this.safeLog(
        'warning',
        `[AssignStatementVisitor.processAssignFunctionCall] No body found for assign function call`,
        'AssignStatementVisitor.processAssignFunctionCall',
        node
      );
      // For assign statements without a body, create an empty module instantiation
      body = {
        type: 'module_instantiation',
        name: 'empty',
        args: [],
        children: [],
        location: getLocation(node),
      } as ast.ModuleInstantiationNode;
    }

    // Create the assign statement AST node
    const assignNode: ast.AssignStatementNode = {
      type: 'assign',
      assignments,
      body: body, // We ensure body is not null above
      location: getLocation(node),
    };

    this.safeLog(
      'info',
      `[AssignStatementVisitor.processAssignFunctionCall] Successfully created assign statement with ${assignments.length} assignments`,
      'AssignStatementVisitor.processAssignFunctionCall',
      node
    );

    return assignNode;
  }

  /**
   * Safe logging helper that checks if errorHandler exists
   *
   * @param level - The log level
   * @param message - The message to log
   * @param context - Optional context information
   * @param node - Optional node for additional context
   *
   * @private
   */
  private safeLog(
    level: 'info' | 'debug' | 'warning' | 'error',
    message: string,
    context?: string,
    node?: unknown
  ): void {
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
   * Override visitStatement to handle assign statements specifically.
   *
   * This method checks if the statement contains an assign module instantiation
   * and processes it accordingly. For non-assign statements, it returns null
   * to allow other visitors to handle them.
   *
   * @param node - The Tree-sitter node representing the statement
   * @returns An AssignStatementNode if the statement contains 'assign', null otherwise
   *
   * @since 1.0.0
   */
  override visitStatement(node: TSNode): ast.AssignStatementNode | null {
    this.safeLog(
      'info',
      `[AssignStatementVisitor.visitStatement] Processing statement: ${node.text.substring(
        0,
        50
      )}`,
      'AssignStatementVisitor.visitStatement',
      node
    );

    // Look for module_instantiation in the statement
    const moduleInstantiation = this.findDescendantOfType(
      node,
      'module_instantiation'
    );
    if (moduleInstantiation) {
      // Check if it's an assign module instantiation
      const nameFieldNode = moduleInstantiation.childForFieldName('name');
      if (nameFieldNode && nameFieldNode.text === 'assign') {
        this.safeLog(
          'info',
          `[AssignStatementVisitor.visitStatement] Found assign module instantiation in statement`,
          'AssignStatementVisitor.visitStatement',
          moduleInstantiation
        );
        return this.visitModuleInstantiation(moduleInstantiation);
      }
    }

    // Look for assignment_statement in the statement (modern OpenSCAD syntax)
    const assignmentStatement = this.findDescendantOfType(
      node,
      'assignment_statement'
    );
    if (assignmentStatement) {
      this.safeLog(
        'info',
        `[AssignStatementVisitor.visitStatement] Found assignment_statement in statement`,
        'AssignStatementVisitor.visitStatement',
        assignmentStatement
      );
      return this.visitAssignStatement(assignmentStatement);
    }

    // Look for assign_statement in the statement (deprecated syntax, if the grammar supports it)
    const assignStatement = this.findDescendantOfType(node, 'assign_statement');
    if (assignStatement) {
      this.safeLog(
        'info',
        `[AssignStatementVisitor.visitStatement] Found assign_statement in statement`,
        'AssignStatementVisitor.visitStatement',
        assignStatement
      );
      return this.visitAssignStatement(assignStatement);
    }

    // Not an assign statement, let other visitors handle it
    this.safeLog(
      'debug',
      `[AssignStatementVisitor.visitStatement] No assign statement found, skipping`,
      'AssignStatementVisitor.visitStatement',
      node
    );
    return null;
  }

  /**
   * Helper method to find descendant nodes of a specific type.
   *
   * @param node - The parent node to search in
   * @param nodeType - The type of node to find
   * @returns The first descendant node of the specified type, or null if not found
   *
   * @private
   */
  private findDescendantOfType(node: TSNode, nodeType: string): TSNode | null {
    // Check direct children first
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === nodeType) {
        return child;
      }
    }

    // Recursively check descendants
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        const descendant = this.findDescendantOfType(child, nodeType);
        if (descendant) {
          return descendant;
        }
      }
    }

    return null;
  }

  /**
   * Visit a module instantiation node and check if it's an assign statement.
   *
   * This method handles the deprecated assign() function syntax by detecting
   * module instantiations with the name 'assign' and converting them to
   * proper AssignStatementNode structures.
   *
   * @param node - The Tree-sitter node representing the module instantiation
   * @returns An AssignStatementNode if the module is 'assign', null otherwise
   *
   * @example Processing assign module instantiation
   * ```typescript
   * // For OpenSCAD code: assign(x = 5) cube(x);
   * const assignNode = visitor.visitModuleInstantiation(node);
   * // Returns: { type: 'assign', assignments: [...], body: {...} }
   * ```
   *
   * @since 1.0.0
   */
  override visitModuleInstantiation(
    node: TSNode
  ): ast.AssignStatementNode | null {
    this.safeLog(
      'info',
      `[AssignStatementVisitor.visitModuleInstantiation] Processing module instantiation: ${node.text.substring(
        0,
        50
      )}`,
      'AssignStatementVisitor.visitModuleInstantiation',
      node
    );

    // Extract module name using the same approach as BaseASTVisitor
    const nameFieldNode = node.childForFieldName('name');
    if (!nameFieldNode) {
      this.safeLog(
        'debug',
        `[AssignStatementVisitor.visitModuleInstantiation] No name field found for module instantiation`,
        'AssignStatementVisitor.visitModuleInstantiation',
        node
      );
      return null;
    }

    const functionName = nameFieldNode.text;
    if (functionName !== 'assign') {
      this.safeLog(
        'debug',
        `[AssignStatementVisitor.visitModuleInstantiation] Module name '${functionName}' is not 'assign', skipping`,
        'AssignStatementVisitor.visitModuleInstantiation',
        node
      );
      return null;
    }

    this.safeLog(
      'info',
      `[AssignStatementVisitor.visitModuleInstantiation] Processing assign module instantiation`,
      'AssignStatementVisitor.visitModuleInstantiation',
      node
    );

    // Extract arguments using the same approach as BaseASTVisitor
    const argsNode = node.childForFieldName('arguments');
    let extractedArgs = argsNode
      ? extractArguments(argsNode, undefined, this.source)
      : [];

    // If the argument extractor failed to extract arguments (e.g., due to complex expressions),
    // fall back to manual extraction
    if (extractedArgs.length === 0 && argsNode) {
      const manualArgs = this.manuallyExtractArguments(argsNode);
      // Convert ExtractedParameter[] to Parameter[] by converting the values
      extractedArgs = manualArgs
        .filter(
          (arg): arg is ExtractedNamedArgument =>
            'name' in arg && arg.name !== undefined
        )
        .map(
          (arg): ast.Parameter => ({
            name: arg.name,
            value: this.convertValueToParameterValue(arg.value),
          })
        );
    }

    // Convert function arguments to assignments
    const assignments: ast.AssignmentNode[] = [];

    for (const arg of extractedArgs) {
      if ('name' in arg && arg.name) {
        // Convert the extracted value to an expression node
        let value = this.convertExtractedValueToExpression(arg.value);

        // If conversion failed, create a generic expression node
        if (!value) {
          // Try to extract the raw expression text from the original argument
          const rawValue = argsNode
            ? this.extractRawExpressionFromArgument(argsNode, arg.name)
            : null;
          value = {
            type: 'expression',
            expressionType: 'literal',
            value: rawValue || 'unknown',
            location: getLocation(node),
          };
        }

        let nameNodeForLocation: TSNode | null = null;
        if (argsNode) {
          // Iterate through children of argument_list to find the named_argument CST node
          // whose 'name' field matches arg.name
          for (let i = 0; i < argsNode.childCount; i++) {
            const childNode = argsNode.child(i);

            if (childNode && childNode.type === 'named_argument') {
              const currentArgNameFieldNode =
                childNode.childForFieldName('name');

              if (
                currentArgNameFieldNode &&
                currentArgNameFieldNode.text === arg.name
              ) {
                nameNodeForLocation = currentArgNameFieldNode; // This is the identifier node for the name
                break;
              }
            }
          }
        }

        const variableIdentifierNodeBase = {
          type: 'expression' as const,
          expressionType: 'identifier' as const,
          name: arg.name,
        };

        const variableIdentifierNode: ast.IdentifierNode = nameNodeForLocation
          ? {
              ...variableIdentifierNodeBase,
              location: getLocation(nameNodeForLocation),
            }
          : {
              ...variableIdentifierNodeBase,
              location: getLocation(node), // Use parent node location as fallback
            };

        // The location for the AssignmentNode itself should be the span of "name = value"
        let assignmentLocationNode: TSNode | null = null;
        if (
          nameNodeForLocation &&
          nameNodeForLocation.parent &&
          nameNodeForLocation.parent.type === 'named_argument'
        ) {
          assignmentLocationNode = nameNodeForLocation.parent;
        }

        assignments.push({
          type: 'assignment',
          variable: variableIdentifierNode,
          value,
          location: assignmentLocationNode
            ? getLocation(assignmentLocationNode)
            : getLocation(node), // Fallback to whole assign stmt location
        });
      }
    }

    // Extract the body (the statement or block that follows the assign call)
    let body: ast.ASTNode | null = null;

    // The CST structure for assign(x = 5) cube(x); is:
    // module_instantiation
    //   ├── identifier: "assign"
    //   ├── argument_list: "(x = 5)"
    //   └── statement: "cube(x);"

    if (node.childCount >= 3) {
      const bodyNode = node.child(2);
      if (bodyNode) {
        this.safeLog(
          'info',
          `[AssignStatementVisitor.visitModuleInstantiation] Found body node: type=${bodyNode.type}, text="${bodyNode.text}"`,
          'AssignStatementVisitor.visitModuleInstantiation',
          bodyNode
        );

        // Handle different types of body nodes
        if (bodyNode.type === 'block') {
          // For block bodies, create a simple block node without processing individual statements
          // This avoids the issue where the AssignStatementVisitor interferes with statement processing
          this.safeLog(
            'info',
            `[AssignStatementVisitor.visitModuleInstantiation] Processing block body: type=${bodyNode.type}, text="${bodyNode.text}"`,
            'AssignStatementVisitor.visitModuleInstantiation',
            bodyNode
          );
          body = {
            type: 'expression',
            expressionType: 'block',
            statements: [], // Empty for now - could be enhanced later
            location: getLocation(bodyNode),
          } as ast.ExpressionNode;
        } else if (bodyNode.type === 'statement') {
          // For statement bodies, look for module_instantiation within the statement
          const moduleInstantiation = this.findDescendantOfType(
            bodyNode,
            'module_instantiation'
          );
          if (moduleInstantiation) {
            this.safeLog(
              'info',
              `[AssignStatementVisitor.visitModuleInstantiation] Found module_instantiation in statement body: type=${moduleInstantiation.type}, text="${moduleInstantiation.text}"`,
              'AssignStatementVisitor.visitModuleInstantiation',
              moduleInstantiation
            );
            // Process the module instantiation using the parent class's method
            body = super.visitModuleInstantiation(moduleInstantiation);
          } else {
            // Use the parent class's visitNode method to process the statement
            body = super.visitNode(bodyNode);
          }
        } else {
          // For other types of bodies, use the parent class's visitNode method
          this.safeLog(
            'info',
            `[AssignStatementVisitor.visitModuleInstantiation] Processing other body type: type=${bodyNode.type}, text="${bodyNode.text}"`,
            'AssignStatementVisitor.visitModuleInstantiation',
            bodyNode
          );
          body = super.visitNode(bodyNode);
        }
      }
    } else {
      this.safeLog(
        'info',
        `[AssignStatementVisitor.visitModuleInstantiation] No body found - node has only ${node.childCount} children`,
        'AssignStatementVisitor.visitModuleInstantiation',
        node
      );
    }

    return {
      type: 'assign',
      assignments,
      body: body || {
        type: 'expression',
        expressionType: 'literal',
        value: 'empty',
        location: getLocation(node),
      },
      location: getLocation(node),
    };
  }

  /**
   * Visits an assign statement node and converts it to an AST node.
   *
   * This method processes Tree-sitter CST nodes representing assign statements
   * and converts them into structured AssignStatementNode AST nodes. It handles
   * both single and multiple assignments within assign statements.
   *
   * The method expects the CST node to follow the grammar pattern:
   * ```
   * assign_statement: seq(
   *   'assign',
   *   '(',
   *   optional(commaSep1(assign_assignment)),
   *   ')',
   *   choice(block, statement)
   * )
   * ```
   *
   * @param node - The Tree-sitter CST node representing an assign statement
   * @returns The corresponding AssignStatementNode AST node, or null if processing fails
   *
   * @example Basic assign statement
   * ```typescript
   * // For OpenSCAD code: assign(x = 5) cube(x);
   * const assignNode = visitor.visitAssignStatement(cstNode);
   * // Returns: { type: 'assign', assignments: [{ variable: 'x', value: {...} }], body: {...} }
   * ```
   *
   * @example Multiple assignments
   * ```typescript
   * // For OpenSCAD code: assign(x = 5, y = 10) cube([x, y, 1]);
   * const assignNode = visitor.visitAssignStatement(cstNode);
   * // Returns: {
   * //   type: 'assign',
   * //   assignments: [
   * //     { variable: 'x', value: {...} },
   * //     { variable: 'y', value: {...} }
   * //   ],
   * //   body: {...}
   * // }
   * ```
   *
   * @since 1.0.0
   */
  override visitAssignStatement(node: TSNode): ast.AssignStatementNode {
    console.log('[visitAssignStatement] node:', node);
    console.log('[visitAssignStatement] node.text:', node.text);
    console.log('[visitAssignStatement] node.type:', node.type);

    this.safeLog(
      'info',
      `[AssignStatementVisitor.visitAssignStatement] Processing assignment statement: ${node.text.substring(
        0,
        50
      )}`,
      'AssignStatementVisitor.visitAssignStatement',
      node
    );

    // Handle modern assignment_statement nodes (e.g., "range = [0:2:10];")
    if (node.type === 'assignment_statement') {
      const assignment = this.processModernAssignmentStatement(node);
      if (!assignment) {
        // Return a default assign statement node instead of null
        return {
          type: 'assign',
          assignments: [],
          body: {
            type: 'expression',
            expressionType: 'literal',
            value: 'empty',
            location: getLocation(node),
          },
          location: getLocation(node),
        };
      }

      // Wrap the assignment in an AssignStatementNode for consistency
      return {
        type: 'assign',
        assignments: [assignment],
        body: {
          type: 'expression',
          expressionType: 'literal',
          value: '',
          location: getLocation(node),
        },
        location: getLocation(node),
      } as ast.AssignStatementNode;
    }

    // Handle deprecated assign() function syntax
    // Extract assignments from assign_assignment nodes
    const assignments: ast.AssignmentNode[] = [];

    // Find all assign_assignment children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'assign_assignment') {
        const assignment = this.processAssignAssignment(child);
        if (assignment) {
          assignments.push(assignment);
        }
      }
    }

    // Extract the body (block or statement)
    let body: ast.ASTNode | null = null;

    // Look for block or statement as the last significant child
    for (let i = node.childCount - 1; i >= 0; i--) {
      const child = node.child(i);
      if (child && (child.type === 'block' || child.type === 'statement')) {
        body = this.visitNode(child);
        break;
      }
    }

    if (!body) {
      this.safeLog(
        'warning',
        `[AssignStatementVisitor.visitAssignStatement] No body found in assign statement`,
        'AssignStatementVisitor.visitAssignStatement',
        node
      );
      // Return a default assign statement node instead of null
      return {
        type: 'assign',
        assignments,
        body: {
          type: 'expression',
          expressionType: 'literal',
          value: 'empty',
          location: getLocation(node),
        },
        location: getLocation(node),
      };
    }

    // Create the assign statement AST node
    const assignNode: ast.AssignStatementNode = {
      type: 'assign',
      assignments,
      body,
      location: getLocation(node),
    };

    this.safeLog(
      'info',
      `[AssignStatementVisitor.visitAssignStatement] Successfully created assign statement with ${assignments.length} assignments`,
      'AssignStatementVisitor.visitAssignStatement',
      node
    );

    return assignNode;
  }

  /**
   * Process a modern assignment_statement node (e.g., "range = [0:2:10];").
   *
   * This method handles the modern OpenSCAD variable assignment syntax where
   * assignment_statement nodes have name and value fields directly.
   *
   * @param node - The assignment_statement CST node
   * @returns A simple variable assignment AST node, or null if processing fails
   *
   * @private
   */
  private processModernAssignmentStatement(node: TSNode): ast.AssignmentNode {
    console.log('[processModernAssignmentStatement] node:', node);
    console.log('[processModernAssignmentStatement] node.text:', node.text);
    console.log('[processModernAssignmentStatement] node.type:', node.type);

    this.safeLog(
      'info',
      `[AssignStatementVisitor.processModernAssignmentStatement] Processing modern assignment: ${node.text.substring(
        0,
        50
      )}`,
      'AssignStatementVisitor.processModernAssignmentStatement',
      node
    );

    // Extract variable name from the name field
    const nameNode = node.childForFieldName('name');
    if (!nameNode) {
      this.safeLog(
        'error',
        `[AssignStatementVisitor.processModernAssignmentStatement] No name field found in assignment statement`,
        'AssignStatementVisitor.processModernAssignmentStatement',
        node
      );
      // Return a default assignment node instead of null
      return {
        type: 'assignment',
        variable: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'unknown',
          location: getLocation(node),
        },
        value: {
          type: 'expression',
          expressionType: 'literal',
          value: 'unknown',
          location: getLocation(node),
        },
        location: getLocation(node),
      };
    }

    const variableIdentifierNode: ast.IdentifierNode = {
      type: 'expression',
      expressionType: 'identifier',
      name: nameNode.text,
      location: getLocation(nameNode),
    };

    // Extract value from the value field
    const valueNode = node.childForFieldName('value');
    if (!valueNode) {
      this.safeLog(
        'error',
        '[AssignStatementVisitor.processModernAssignmentStatement] No value node found',
        'AssignStatementVisitor.processModernAssignmentStatement',
        node
      );
      // Return a default assignment node instead of null
      return {
        type: 'assignment',
        variable: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'unknown',
          location: getLocation(node),
        },
        value: {
          type: 'expression',
          expressionType: 'literal',
          value: 'unknown',
          location: getLocation(node),
        },
        location: getLocation(node),
      };
    }

    // Process the value expression using the expression visitor system
    const value = this.processExpression(valueNode);
    if (!value) {
      this.safeLog(
        'error',
        '[AssignStatementVisitor.processModernAssignmentStatement] Failed to process value expression',
        'AssignStatementVisitor.processModernAssignmentStatement',
        valueNode
      );
      // Return a default assignment node instead of null
      return {
        type: 'assignment',
        variable: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'unknown',
          location: getLocation(node),
        },
        value: {
          type: 'expression',
          expressionType: 'literal',
          value: 'unknown',
          location: getLocation(node),
        },
        location: getLocation(node),
      };
    }

    // Create a simple variable assignment AST node
    // For modern assignments like "range = [0:2:10];", we create an assignment node
    const assignmentNode: ast.AssignmentNode = {
      type: 'assignment',
      variable: variableIdentifierNode, // Use the created IdentifierNode
      value: value,
      location: getLocation(node), // Location of the whole "x = val"
    };

    this.safeLog(
      'info',
      'Assignment node created successfully',
      'AssignStatementVisitor.processModernAssignmentStatement',
      node
    );

    // Note: The overall 'location' of the AssignmentNode is the location of the whole 'a = b;' statement.
    // The 'location' of the 'variableIdentifierNode' is specifically for the 'a' part.

    return assignmentNode;
  }

  /**
   * Process an assign_assignment node to extract variable name and value.
   *
   * @param node - The assign_assignment CST node
   * @returns The corresponding AssignmentNode, or null if processing fails
   *
   * @private
   */
  private processAssignAssignment(node: TSNode): ast.AssignmentNode | null {
    this.safeLog(
      'info',
      `[AssignStatementVisitor.processAssignAssignment] Processing assignment: ${node.text.substring(
        0,
        30
      )}`,
      'AssignStatementVisitor.processAssignAssignment',
      node
    );

    // Extract variable name
    const nameNode = node.childForFieldName('name');
    if (!nameNode) {
      this.safeLog(
        'error',
        `[AssignStatementVisitor.processAssignAssignment] No name found in assignment`,
        'AssignStatementVisitor.processAssignAssignment',
        node
      );
      // Return a default assignment node instead of null
      return {
        type: 'assignment',
        variable: {
          type: 'expression',
          expressionType: 'identifier',
          name: 'unknown',
          location: getLocation(node),
        },
        value: {
          type: 'expression',
          expressionType: 'literal',
          value: 'unknown',
          location: getLocation(node),
        },
        location: getLocation(node),
      };
    }

    const variableIdentifierNode: ast.IdentifierNode = {
      type: 'expression',
      expressionType: 'identifier',
      name: nameNode.text,
      location: getLocation(nameNode),
    };

    // Extract value expression
    const valueNode = node.childForFieldName('value');
    if (!valueNode) {
      this.safeLog(
        'error',
        `[AssignStatementVisitor.processAssignAssignment] No value found in assignment`,
        'AssignStatementVisitor.processAssignAssignment',
        node
      );
      // Return a default assignment node instead of null
      return {
        type: 'assignment',
        variable: {
          type: 'expression',
          expressionType: 'identifier',
          name: nameNode.text || 'unknown',
          location: getLocation(nameNode),
        },
        value: {
          type: 'expression',
          expressionType: 'literal',
          value: 'unknown',
          location: getLocation(node),
        },
        location: getLocation(node),
      };
    }

    const value = this.processExpression(valueNode);
    if (!value) {
      this.safeLog(
        'error',
        `[AssignStatementVisitor.processAssignAssignment] Failed to process value expression`,
        'AssignStatementVisitor.processAssignAssignment',
        valueNode
      );
      // Return a default assignment node instead of null
      return {
        type: 'assignment',
        variable: {
          type: 'expression',
          expressionType: 'identifier',
          name: nameNode.text || 'unknown',
          location: getLocation(nameNode),
        },
        value: {
          type: 'expression',
          expressionType: 'literal',
          value: 'unknown',
          location: getLocation(valueNode),
        },
        location: getLocation(node),
      };
    }

    return {
      type: 'assignment',
      variable: variableIdentifierNode,
      value,
      location: getLocation(node),
    };
  }

  /**
   * Manually extract arguments from an argument_list node when the standard extractor fails.
   *
   * This method handles cases where the argument extractor fails due to complex expressions
   * that it doesn't understand (like binary_expression, function_call, etc.).
   *
   * @param argsNode - The argument_list node to extract arguments from
   * @returns Array of extracted parameters with name and raw expression text
   *
   * @private
   */
  private manuallyExtractArguments(argsNode: TSNode): ExtractedParameter[] {
    const results: ExtractedParameter[] = [];

    // Look for the arguments node within the argument_list
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (child && child.type === 'arguments') {
        // Process each argument within the arguments node
        for (let j = 0; j < child.childCount; j++) {
          const argChild = child.child(j);
          if (argChild && argChild.type === 'argument') {
            // Extract name and value from the argument
            const nameNode = argChild.child(0);
            const equalsNode = argChild.child(1);

            if (
              nameNode &&
              nameNode.type === 'identifier' &&
              equalsNode &&
              equalsNode.type === '='
            ) {
              // Find the expression node (everything after the '=')
              for (let k = 2; k < argChild.childCount; k++) {
                const exprNode = argChild.child(k);
                if (exprNode && exprNode.text.trim() !== '') {
                  results.push({
                    name: nameNode.text,
                    value: {
                      type: 'string',
                      value: exprNode.text,
                    },
                  });
                  break; // Only take the first expression node
                }
              }
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Extract the raw expression text for a named argument from the arguments node.
   *
   * @param argsNode - The argument_list node containing the arguments
   * @param variableName - The name of the variable to find
   * @returns The raw text of the expression, or null if not found
   *
   * @private
   */
  private extractRawExpressionFromArgument(
    argsNode: TSNode,
    variableName: string
  ): string | null {
    // Find the argument with the matching variable name
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (child && child.type === 'arguments') {
        // Look for argument nodes within the arguments node
        for (let j = 0; j < child.childCount; j++) {
          const argChild = child.child(j);
          if (argChild && argChild.type === 'argument') {
            // Check if this argument has the matching variable name
            const nameNode = argChild.child(0);
            if (
              nameNode &&
              nameNode.type === 'identifier' &&
              nameNode.text === variableName
            ) {
              // Find the expression after the '=' sign
              for (let k = 2; k < argChild.childCount; k++) {
                const exprNode = argChild.child(k);
                if (
                  exprNode &&
                  exprNode.type !== '=' &&
                  exprNode.text.trim() !== ''
                ) {
                  return exprNode.text;
                }
              }
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Convert an extracted value from the argument extractor to an expression node.
   *
   * @param extractedValue - The extracted value from the argument extractor
   * @returns The corresponding expression AST node, or null if conversion fails
   *
   * @private
   */
  private convertExtractedValueToExpression(
    extractedValue: any
  ): ast.ExpressionNode | null {
    if (!extractedValue || typeof extractedValue !== 'object') {
      return null;
    }

    // Handle different types of extracted values
    switch (extractedValue.type) {
      case 'number':
        return {
          type: 'expression',
          expressionType: 'literal',
          value: extractedValue.value,
          location: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 0, offset: 0 },
          }, // Default location
        };
      case 'string':
        return {
          type: 'expression',
          expressionType: 'literal',
          value: extractedValue.value,
          location: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 0, offset: 0 },
          }, // Default location
        };
      case 'boolean':
        return {
          type: 'expression',
          expressionType: 'literal',
          value: extractedValue.value,
          location: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 0, offset: 0 },
          }, // Default location
        };
      case 'identifier':
        return {
          type: 'expression',
          expressionType: 'variable',
          name: extractedValue.value,
          location: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 0, offset: 0 },
          }, // Default location
        };
      default:
        // For unknown types, create a generic literal expression
        return {
          type: 'expression',
          expressionType: 'literal',
          value: extractedValue.value || extractedValue,
          location: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 0, offset: 0 },
          }, // Default location
        };
    }
  }

  /**
   * Convert a Value to a ParameterValue.
   *
   * @param value - The Value object to convert
   * @returns A ParameterValue object
   * @private
   */
  private convertValueToParameterValue(value: ast.Value): ast.ParameterValue {
    if (value.type === 'number') {
      return parseFloat(value.value as string);
    } else if (value.type === 'boolean') {
      return value.value === 'true';
    } else if (value.type === 'string') {
      return value.value as string;
    } else if (value.type === 'identifier') {
      return {
        type: 'expression',
        expressionType: 'variable',
        name: value.value as string,
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 0, offset: 0 },
        },
      } as ast.VariableNode;
    } else if (value.type === 'vector') {
      const vectorValues = (value.value as ast.Value[]).map(v => {
        if (v.type === 'number') {
          return parseFloat(v.value as string);
        }
        return 0; // Default for non-numeric elements
      });

      if (vectorValues.length === 2) {
        return vectorValues as ast.Vector2D;
      } else if (vectorValues.length >= 3) {
        return [
          vectorValues[0],
          vectorValues[1],
          vectorValues[2],
        ] as ast.Vector3D;
      }
      return [0, 0, 0] as ast.Vector3D; // Default fallback
    }

    // Default fallback - return as string
    return (value.value as string) || '';
  }

  /**
   * Processes an expression node using the expression visitor system.
   *
   * This method delegates expression processing to the appropriate expression
   * visitor, ensuring consistent handling of expressions throughout the parser.
   *
   * @param node - The expression CST node to process
   * @returns The corresponding expression AST node, or null if processing fails
   *
   * @private
   */
  private processExpression(node: TSNode): ast.ExpressionNode | null {
    this.safeLog(
      'info',
      `[AssignStatementVisitor.processExpression] Processing expression: type=${node.type}, text=${node.text}`,
      'AssignStatementVisitor.processExpression',
      node
    );

    // Handle different expression types
    switch (node.type) {
      case 'range_expression':
        return this.processRangeExpression(node);
      case 'number':
        return {
          type: 'expression',
          expressionType: 'literal',
          value: parseFloat(node.text),
          location: getLocation(node),
        } as ast.LiteralNode;
      case 'string':
        return {
          type: 'expression',
          expressionType: 'literal',
          value: node.text.slice(1, -1), // Remove quotes
          location: getLocation(node),
        } as ast.LiteralNode;
      case 'identifier':
        return {
          type: 'expression',
          expressionType: 'variable',
          name: node.text,
          location: getLocation(node),
        };
      default:
        // For other expression types, use the base visitor's expression handling
        const result = this.visitExpression(node);
        if (result && result.type === 'expression') {
          return result as ast.ExpressionNode;
        }

        // Fallback: create a literal expression with the raw text
        this.safeLog(
          'warning',
          `[AssignStatementVisitor.processExpression] Unhandled expression type: ${node.type}, falling back to literal`,
          'AssignStatementVisitor.processExpression',
          node
        );
        return {
          type: 'expression',
          expressionType: 'literal',
          value: node.text,
          location: getLocation(node),
        };
    }
  }

  /**
   * Process a range_expression node to create a RangeExpressionNode.
   *
   * @param node - The range_expression CST node
   * @returns The corresponding RangeExpressionNode, or null if processing fails
   *
   * @private
   */
  private processRangeExpression(node: TSNode): ast.RangeExpressionNode | null {
    this.safeLog(
      'info',
      `[AssignStatementVisitor.processRangeExpression] Processing range expression: ${node.text}`,
      'AssignStatementVisitor.processRangeExpression',
      node
    );

    // Extract start, step, and end from the range expression
    const startNode = node.childForFieldName('start');
    const stepNode = node.childForFieldName('step');
    const endNode = node.childForFieldName('end');

    if (!startNode || !endNode) {
      this.safeLog(
        'warning',
        `[AssignStatementVisitor.processRangeExpression] Missing start or end in range expression`,
        'AssignStatementVisitor.processRangeExpression',
        node
      );
      return null;
    }

    const start = this.processExpression(startNode);
    const end = this.processExpression(endNode);
    const step = stepNode ? this.processExpression(stepNode) : undefined;

    if (!start || !end) {
      this.safeLog(
        'warning',
        `[AssignStatementVisitor.processRangeExpression] Failed to process start or end expressions`,
        'AssignStatementVisitor.processRangeExpression',
        node
      );
      return null;
    }

    return {
      type: 'expression',
      expressionType: 'range_expression',
      start,
      end,
      step: step || undefined,
      location: getLocation(node),
    } as ast.RangeExpressionNode;
  }
}
