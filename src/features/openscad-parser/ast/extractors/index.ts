/**
 * @file Extractor utilities module exports
 *
 * This module serves as the central export point for all parameter and value extraction
 * utilities used in the OpenSCAD parser. The extractors are responsible for converting
 * Tree-sitter CST nodes into typed parameter values that can be used in AST generation.
 *
 * The extractor system provides:
 * - **Argument Extraction**: Converting function call arguments from CST to typed parameters
 * - **Value Extraction**: Converting individual values (numbers, strings, vectors) from CST nodes
 * - **Type Safety**: Ensuring extracted values match expected TypeScript types
 * - **Error Handling**: Graceful handling of malformed or missing parameters
 *
 * Key extraction capabilities:
 * - **Positional Arguments**: `cube(10)` - arguments by position
 * - **Named Arguments**: `cube(size=10, center=true)` - arguments by name
 * - **Mixed Arguments**: `cube(10, center=true)` - combination of both
 * - **Vector Values**: `[10, 20, 30]` - multi-dimensional arrays
 * - **Primitive Values**: Numbers, strings, booleans
 * - **Complex Expressions**: Mathematical expressions and function calls
 *
 * @example Basic argument extraction
 * ```typescript
 * import { extractArguments } from '@holistic-stack/openscad-parser/extractors';
 *
 * // Extract arguments from a function call CST node
 * const args = extractArguments(argumentsNode);
 * // Returns: [{ name: 'size', value: 10 }, { name: 'center', value: true }]
 * ```
 *
 * @example Value extraction
 * ```typescript
 * import { extractParameterValue } from '@holistic-stack/openscad-parser/extractors';
 *
 * // Extract a specific value from a CST node
 * const value = extractParameterValue(valueNode);
 * // Returns: { type: 'vector', value: [10, 20, 30] }
 * ```
 *
 * @example Type-safe parameter processing
 * ```typescript
 * import { extractArguments, type ExtractedParameter } from '@holistic-stack/openscad-parser/extractors';
 *
 * function processCubeParameters(args: ExtractedParameter[]) {
 *   const sizeParam = args.find(arg => arg.name === 'size' || !arg.name);
 *   const centerParam = args.find(arg => arg.name === 'center');
 *
 *   return {
 *     size: sizeParam?.value ?? 1,
 *     center: centerParam?.value ?? false
 *   };
 * }
 * ```
 *
 * @module extractors
 * @since 0.1.0
 */

// Re-export from argument-extractor
export {
  extractArguments,
} from './argument-extractor.js';

// Re-export types from argument-extractor
export type {
  ExtractedNamedArgument,
  ExtractedParameter,
} from './argument-extractor.js';

// Re-export from value-extractor with a renamed function to avoid conflict
import { extractValue as extractParameterValue } from './value-extractor.js';
export { extractParameterValue };
