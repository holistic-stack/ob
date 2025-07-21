/**
 * @file index.ts
 * @description This file serves as the barrel export for the AST (Abstract Syntax Tree) module.
 * It aggregates and exports all the necessary components for working with the OpenSCAD AST,
 * including type definitions, extractors, registries, utilities, and the visitor-based AST generator.
 *
 * @architectural_decision
 * A barrel export is used to simplify imports from the AST module. This provides a single, clean
 * entry point for other parts of the parser to access AST-related functionality, improving code
 * organization and maintainability.
 *
 * @example
 * ```ts
 * import { VisitorASTGenerator, type ASTNode } from '@/features/openscad-parser/ast';
 * ```
 */

export * from './ast-types';
export * from './extractors';

export * from './utils';
export * from './visitor-ast-generator';
export * from './visitors/index';
