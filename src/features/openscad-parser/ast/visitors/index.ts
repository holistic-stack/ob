/**
 * @file Visitor pattern exports for OpenSCAD parser
 *
 * This module provides a centralized export point for all visitor implementations
 * in the OpenSCAD parser. The visitor pattern is fundamental to the parser's
 * architecture, enabling modular processing of different OpenSCAD language
 * constructs while maintaining separation of concerns and extensibility.
 *
 * The visitor system includes:
 * - **Base Infrastructure**: Core visitor interfaces and base implementations
 * - **Specialized Visitors**: Domain-specific visitors for different OpenSCAD constructs
 * - **Composite Patterns**: Visitors that combine multiple processing strategies
 * - **Query Integration**: Advanced visitors with CST search capabilities
 * - **Error Handling**: Visitors with integrated error recovery and reporting
 *
 * Visitor architecture features:
 * - **Modular Design**: Each visitor handles specific OpenSCAD language constructs
 * - **Extensible Pattern**: Easy to add new visitors for additional functionality
 * - **Composable Processing**: Visitors can be combined for complex processing workflows
 * - **Performance Optimization**: Specialized visitors for efficient processing
 * - **Error Recovery**: Integrated error handling and recovery strategies
 * - **Type Safety**: Strong typing throughout the visitor hierarchy
 *
 * Available visitor categories:
 * - **Core Visitors**: `ASTVisitor`, `BaseASTVisitor` - fundamental visitor infrastructure
 * - **Shape Visitors**: `PrimitiveVisitor`, `CSGVisitor` - geometric shape processing
 * - **Transform Visitors**: `TransformVisitor` - transformation operations
 * - **Structure Visitors**: `ModuleVisitor`, `FunctionVisitor`, `ControlStructureVisitor` - language structures
 * - **Expression Visitors**: `ExpressionVisitor`, `VariableVisitor` - expression and variable processing
 * - **Composite Visitors**: `CompositeVisitor` - multi-visitor coordination
 * - **Query Visitors**: `QueryVisitor` - advanced CST search and processing
 *
 * @example Basic visitor usage
 * ```typescript
 * import { PrimitiveVisitor, TransformVisitor, CompositeVisitor } from './visitors';
 *
 * // Create specialized visitors
 * const primitiveVisitor = new PrimitiveVisitor(sourceCode, errorHandler);
 * const transformVisitor = new TransformVisitor(sourceCode, errorHandler);
 *
 * // Combine visitors for comprehensive processing
 * const compositeVisitor = new CompositeVisitor(sourceCode, errorHandler);
 * compositeVisitor.addVisitor(primitiveVisitor);
 * compositeVisitor.addVisitor(transformVisitor);
 *
 * // Process OpenSCAD nodes
 * const astNode = compositeVisitor.visitNode(cstNode);
 * ```
 *
 * @example Advanced visitor composition
 * ```typescript
 * import {
 *   BaseASTVisitor,
 *   ModuleVisitor,
 *   ExpressionVisitor,
 *   QueryVisitor
 * } from './visitors';
 *
 * // Create processing pipeline
 * const moduleVisitor = new ModuleVisitor(sourceCode, errorHandler);
 * const expressionVisitor = new ExpressionVisitor(sourceCode, errorHandler);
 *
 * // Add query capabilities
 * const queryVisitor = new QueryVisitor(
 *   sourceCode,
 *   tree,
 *   language,
 *   moduleVisitor,
 *   errorHandler
 * );
 *
 * // Find and process specific constructs
 * const moduleNodes = queryVisitor.findNodesByType('module_definition');
 * const processedModules = moduleNodes.map(node => queryVisitor.visitNode(node));
 * ```
 *
 * @example Custom visitor implementation
 * ```typescript
 * import { BaseASTVisitor } from './visitors';
 * import type { ASTNode } from '../ast-types';
 *
 * class CustomVisitor extends BaseASTVisitor {
 *   protected createASTNodeForFunction(
 *     node: TSNode,
 *     functionName: string,
 *     args: Parameter[]
 *   ): ASTNode | null {
 *     // Custom processing logic
 *     return this.processCustomFunction(node, functionName, args);
 *   }
 * }
 * ```
 *
 * @module visitors
 * @since 0.1.0
 */
export * from './ast-visitor';
export * from './base-ast-visitor';
export * from './composite-visitor';
export * from './control-structure-visitor';
export * from './csg-visitor';
// export * from './expression-visitor'; // Temporarily commented out due to build issues
export * from './function-visitor';
export * from './module-visitor';
export * from './primitive-visitor';
export * from './query-visitor';
export * from './transform-visitor';
// export * from './variable-visitor'; // Temporarily commented out due to build issues
export * from './assert-statement-visitor/assert-statement-visitor';
