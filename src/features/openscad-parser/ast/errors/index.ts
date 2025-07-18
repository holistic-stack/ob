/**
 * @file index.ts
 * @description This file serves as the barrel export for the error handling module within the AST.
 * It consolidates and exports various error types and recovery strategies used by the OpenSCAD parser.
 *
 * @architectural_decision
 * Using a barrel export for error-related concerns centralizes their management and import.
 * This makes it easier for other parts of the parser to access specific error types or recovery mechanisms
 * without needing to know their exact file paths, promoting a cleaner and more organized codebase.
 *
 * @example
 * ```typescript
 * import { ParserError, SyntaxError, RecoveryStrategy } from '@/features/openscad-parser/ast/errors';
 *
 * try {
 *   // ... parsing logic that might throw errors
 * } catch (e) {
 *   if (e instanceof ParserError) {
 *     console.error('A parser-specific error occurred:', e.message);
 *   } else if (e instanceof SyntaxError) {
 *     console.error('Syntax issue detected:', e.message);
 *   }
 *   // Attempt recovery if a strategy is available
 *   const recovered = RecoveryStrategy.attempt(e, originalCode);
 * }
 * ```
 */

export * from './parser-error';
export * from './recovery-strategy';
export * from './semantic-error';
export * from './syntax-error';
