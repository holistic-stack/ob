/**
 * @file index.ts
 * @description This file is the main entry point for the OpenSCAD parser feature.
 * It exports all the necessary classes, types, and utilities for parsing OpenSCAD code,
 * handling errors, and working with the Abstract Syntax Tree (AST).
 *
 * @architectural_decision
 * A barrel export is used to provide a single, consolidated entry point to the parser feature.
 * This simplifies imports for other modules and promotes a clean, organized architecture.
 * The `EnhancedOpenscadParser` alias is maintained for backward compatibility with existing tests and documentation.
 *
 * @example
 * ```typescript
 * import { OpenscadParser, SimpleErrorHandler } from '@/features/openscad-parser';
 *
 * const errorHandler = new SimpleErrorHandler();
 * const parser = new OpenscadParser(errorHandler);
 * await parser.init();
 *
 * const ast = parser.parseAST('cube(10);');
 * console.log(ast);
 *
 * parser.dispose();
 * ```
 */

// Export AST types and interfaces
export * from './ast/ast-types.js';
// Export AST utilities and extractors
export * from './ast/index.js';
// Export visitor system
export * from './ast/visitors/index.js';
// Export CST utilities
export * from './cst/query-utils.js';
// Export error handling utilities
export * from './error-handling/index.js';
export { ErrorHandler, type ErrorHandlerOptions } from './error-handling/index.js';
// Export error handling classes and interfaces
export { type IErrorHandler, SimpleErrorHandler } from './error-handling/simple-error-handler.js';
// Export main parser class
// Export EnhancedOpenscadParser as an alias for OpenscadParser
// This maintains compatibility with existing documentation and test patterns
export { OpenscadParser, OpenscadParser as EnhancedOpenscadParser } from './openscad-parser.js';
