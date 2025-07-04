/**
 * @file Main exports for OpenSCAD parser feature
 *
 * This module provides the central export point for all OpenSCAD parser functionality,
 * including the main parser class, error handling, AST types, and visitor utilities.
 * It follows the bulletproof-react architecture pattern with feature-based organization.
 *
 * Key exports:
 * - **Parser Classes**: OpenscadParser and EnhancedOpenscadParser (alias)
 * - **Error Handling**: SimpleErrorHandler, IErrorHandler, ErrorHandler
 * - **AST Types**: All AST node types and interfaces
 * - **Visitor System**: Base visitors and specialized implementations
 * - **Utilities**: Extractors, query utilities, and helper functions
 *
 * @example Basic parser usage
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
 *
 * @example Enhanced parser usage (alias)
 * ```typescript
 * import { EnhancedOpenscadParser, SimpleErrorHandler } from '@/features/openscad-parser';
 *
 * const errorHandler = new SimpleErrorHandler();
 * const parser = new EnhancedOpenscadParser(errorHandler);
 * await parser.init();
 *
 * const ast = parser.parseAST('translate([1,0,0]) sphere(5);');
 * parser.dispose();
 * ```
 *
 * @example Error handling
 * ```typescript
 * import { OpenscadParser, SimpleErrorHandler, type IErrorHandler } from '@/features/openscad-parser';
 *
 * const errorHandler: IErrorHandler = new SimpleErrorHandler();
 * const parser = new OpenscadParser(errorHandler);
 * await parser.init();
 *
 * try {
 *   const ast = parser.parseAST('invalid syntax');
 * } catch (error) {
 *   const errors = errorHandler.getErrors();
 *   console.error('Parsing errors:', errors);
 * }
 * ```
 *
 * @module openscad-parser
 * @since 0.1.0
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
