/**
 * @file Centralized Parsing Service
 *
 * This service provides a single, unified entry point for all OpenSCAD parsing operations.
 * It encapsulates the entire pipeline:
 * 1. Acquiring the singleton parser instance.
 * 2. Parsing the code to generate a Concrete Syntax Tree (CST).
 * 3. Transforming the CST into an Abstract Syntax Tree (AST) using the visitor pattern.
 * 4. Applying AST restructuring for hierarchical correctness.
 * 5. Handling errors gracefully using the built-in recovery mechanisms.
 *
 * This service is designed to be called from anywhere in the application (e.g., initial load, editor changes)
 * to ensure a consistent and reliable parsing process, mitigating issues related to parser state corruption.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type {
  AsyncOperationResult,
  OperationError,
} from '../../../shared/types/operations.types.js';
import { isSuccess, type Result } from '../../../shared/types/result.types.js';
import { operationUtils } from '../../../shared/types/utils.js';
// NOTE: AST restructuring service removed - functionality moved to conversion layer
import { ParserError } from '../ast/errors/parser-error.js';
import type { ASTNode } from '../core/ast-types.js';
import { RecoveryStrategyRegistry } from '../error-handling/recovery-strategy-registry.js';
import { getInitializedParser, initializeParser } from './parser-initialization.service.js';

const logger = createLogger('ParsingService');

/**
 * Attempts to recover from a parser error by re-parsing with a fresh instance.
 * This is a simpler, more robust recovery strategy than trying to fix the code itself.
 * @param code The source code that failed to parse.
 * @returns A Result containing the recovered AST or an error message.
 */
const recoverWithFreshParser = async (
  code: string
): Promise<Result<ReadonlyArray<ASTNode>, string>> => {
  logger.warn('Attempting recovery with a fresh parser instance.');
  const initResult = await initializeParser(); // Force re-initialization
  if (!initResult.success) {
    const errorMsg = `Recovery failed: Could not re-initialize parser: ${initResult.error}`;
    logger.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const freshParser = getInitializedParser();
  if (!freshParser) {
    const errorMsg = 'Recovery failed: Could not get fresh parser instance.';
    logger.error(errorMsg);
    return { success: false, error: errorMsg };
  }

  const parseResult = freshParser.parseASTWithResult(code);
  if (isSuccess(parseResult)) {
    logger.debug('Recovery successful with fresh parser instance.');
    return { success: true, data: parseResult.data };
  }

  const errorMsg = `Recovery with fresh parser failed: ${parseResult.error}`;
  logger.error(errorMsg);
  return { success: false, error: errorMsg };
};

/**
 * Parses the given OpenSCAD code into an AST.
 * This function orchestrates the entire parsing pipeline.
 *
 * @param code The OpenSCAD code to parse.
 * @returns An AsyncOperationResult containing the AST or an error.
 */
export const unifiedParseOpenSCAD = async (
  code: string
): AsyncOperationResult<ReadonlyArray<ASTNode>, OperationError> => {
  const operationId = operationUtils.generateOperationId();
  const metadata = operationUtils.createMetadata(
    operationId,
    operationUtils.createOperationType('parse'),
    { priority: 'high', tags: ['parsing', 'ast', 'unified'] }
  );

  try {
    // 1. Ensure parser is initialized
    const initResult = await initializeParser();
    if (!initResult.success) {
      const errorMessage = `Parser initialization failed: ${initResult.error}`;
      logger.error(errorMessage);
      const operationError = operationUtils.createOperationError('INIT_ERROR', errorMessage);
      return operationUtils.createError(operationError, metadata);
    }

    const parser = getInitializedParser();
    if (!parser) {
      const errorMessage = 'Parser not available after initialization.';
      logger.error(errorMessage);
      const operationError = operationUtils.createOperationError(
        'PARSER_UNAVAILABLE',
        errorMessage
      );
      return operationUtils.createError(operationError, metadata);
    }

    // 2. Attempt to parse the code
    let parseResult = parser.parseASTWithResult(code);

    // 3. If parsing fails, attempt recovery
    if (!isSuccess(parseResult)) {
      logger.warn(`Initial parse failed: ${parseResult.error}.`);
      const recoveryResult = await recoverWithFreshParser(code);

      if (isSuccess(recoveryResult)) {
        parseResult = { success: true, data: [...recoveryResult.data] };
      } else {
        // If recovery also fails, return the error
        const errorMessage = `Parse and recovery failed: ${recoveryResult.error}`;
        logger.error(errorMessage);
        const operationError = operationUtils.createOperationError(
          'PARSE_AND_RECOVERY_FAILURE',
          errorMessage
        );
        return operationUtils.createError(operationError, metadata);
      }
    }

    if (!isSuccess(parseResult)) {
      const errorMessage = `Parse failed: ${(parseResult as any).error}`;
      logger.error(errorMessage);
      const operationError = operationUtils.createOperationError('PARSE_ERROR', errorMessage);
      return operationUtils.createError(operationError, metadata);
    }

    const rawAST = parseResult.data;

    // 4. Return the parsed AST (restructuring moved to conversion layer)
    logger.debug(`Unified parsing successful. AST nodes: ${rawAST.length}.`);

    return operationUtils.createSuccess(rawAST, metadata);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error(`An unexpected error occurred during unified parsing: ${errorMessage}`);
    const operationError = operationUtils.createOperationError(
      'UNIFIED_PARSE_EXCEPTION',
      errorMessage,
      { recoverable: false, ...(err instanceof Error && err.stack ? { stack: err.stack } : {}) }
    );
    return operationUtils.createError(operationError, metadata);
  }
};
