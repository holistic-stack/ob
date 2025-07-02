/**
 * @file Core OpenSCAD Parser Infrastructure
 *
 * Core exports for the custom OpenSCAD parser implementation.
 * Provides drop-in replacement for @holistic-stack/openscad-parser
 * with proper CSGVisitor delegation fix.
 */

export * from './ast-types.js';
export * from './csg/index.js';
export type { IErrorHandler } from './error-handler.interface.js';
export { OpenscadParser } from './openscad-parser.js';
// Advanced AST processing modules
export * from './optimization/index.js';
export { SimpleErrorHandler } from './simple-error-handler.js';
export * from './visitors/index.js';
