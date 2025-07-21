/**
 * @file index.ts
 * @description Error handling system exports for OpenSCAD parser.
 */

// Export core error handling classes
export { ErrorHandler, type ErrorHandlerOptions } from './error-handler.js';
export { Logger, type LoggerOptions } from './logger.js';
export { RecoveryStrategyRegistry } from './recovery-strategy-registry.js';
export * from './strategies/missing-semicolon-strategy.js';

// Export recovery strategies
export * from './strategies/recovery-strategy.js';
export * from './strategies/unclosed-bracket-strategy.js';
export * from './strategies/unknown-identifier-strategy.js';
// Export error types
export * from './types/error-types.js';
// Note: type-mismatch-strategy not exported by default due to TypeChecker dependency
