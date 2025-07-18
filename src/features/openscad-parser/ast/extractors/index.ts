/**
 * @file index.ts
 * @description This file serves as the barrel export for all parameter and value extraction utilities
 * within the OpenSCAD parser's AST module. It consolidates various extractors that convert Tree-sitter
 * CST nodes into structured, typed parameter values for AST generation.
 *
 * @architectural_decision
 * Using a barrel export here provides a single, convenient entry point for accessing all extraction-related
 * functionalities. This simplifies imports in other parts of the parser and promotes a cleaner, more organized
 * codebase. It also allows for easy management of the public API of the extractors.
 *
 * @example
 * ```typescript
 * import { extractArguments, extractParameterValue, type ExtractedParameter } from './index';
 * import * as TreeSitter from 'web-tree-sitter';
 * import { OpenscadParser } from '../../openscad-parser';
 * import { SimpleErrorHandler } from '../../error-handling/simple-error-handler';
 *
 * async function demonstrateExtraction() {
 *   const errorHandler = new SimpleErrorHandler();
 *   const parser = new OpenscadParser(errorHandler);
 *   await parser.init();
 *
 *   const code = 'cube(size=10, center=true);';
 *   const cst = parser.parseCST(code);
 *   if (!cst) return;
 *
 *   // Assuming we can find the arguments node for 'cube'
 *   // This part would typically involve traversing the CST to find the relevant node
 *   const cubeCallNode = cst.rootNode.namedChild(0); // Example: get the first statement
 *   if (cubeCallNode && cubeCallNode.type === 'call_expression') {
 *     const argumentsNode = cubeCallNode.namedChild(1); // Assuming arguments are the second named child
 *     if (argumentsNode) {
 *       const extractedArgs: ExtractedParameter[] = extractArguments(argumentsNode, code, errorHandler);
 *       console.log('Extracted Arguments:', extractedArgs);
 *       // Expected output: [{ name: 'size', value: 10, type: 'number' }, { name: 'center', value: true, type: 'boolean' }]
 *
 *       // Example of extracting a single parameter value
 *       const sizeParamNode = argumentsNode.namedChild(0); // Assuming 'size=10' is the first argument
 *       if (sizeParamNode) {
 *         const sizeValue = extractParameterValue(sizeParamNode, code, errorHandler);
 *         console.log('Extracted Size Value:', sizeValue); // Expected: { value: 10, type: 'number' }
 *       }
 *     }
 *   }
 *   parser.dispose();
 * }
 *
 * demonstrateExtraction();
 * ```
 */

// Re-export types from argument-extractor
export type {
  ExtractedNamedArgument,
  ExtractedParameter,
} from './argument-extractor.js';
// Re-export from argument-extractor
export { extractArguments } from './argument-extractor.js';

// Re-export from value-extractor with a renamed function to avoid conflict
import { extractValue as extractParameterValue } from './value-extractor.js';
export { extractParameterValue };
