/**
 * @file Integration tests for the error handling system.
 * @module openscad-parser/error-handling/error-handling-integration.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler } from './error-handler.js';
import { Logger } from './logger.js';
import { RecoveryStrategyRegistry } from './recovery-strategy-registry.js';
import { Severity, ErrorCode, ParserError } from './types/error-types.js';

describe('Error Handling Integration', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      throwErrors: false,
      minSeverity: Severity.WARNING,
      attemptRecovery: true,
    });
  });

  describe('ErrorHandler', () => {
    it('should create and report syntax errors', () => {
      const error = errorHandler.createSyntaxError('Missing semicolon', {
        line: 10,
        column: 5,
        source: 'x = 5',
      });

      errorHandler.report(error);

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Missing semicolon');
      expect(errors[0].code).toBe(ErrorCode.SYNTAX_ERROR);
      expect(errors[0].severity).toBe(Severity.ERROR);
    });

    it('should create and report type errors', () => {
      const error = errorHandler.createTypeError('Type mismatch', {
        line: 5,
        column: 10,
        expected: ['number'],
        found: 'string',
      });

      errorHandler.report(error);

      const errors = errorHandler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Type mismatch');
      expect(errors[0].code).toBe(ErrorCode.TYPE_ERROR);
    });

    it('should filter errors by severity', () => {
      // Create errors with specific severities using the ParserError constructor directly
      const debugError = new ParserError('Debug message', ErrorCode.INTERNAL_ERROR, Severity.DEBUG, {});
      const warningError = new ParserError('Warning message', ErrorCode.VALIDATION_ERROR, Severity.WARNING, {});
      const errorError = errorHandler.createSyntaxError('Error message', {});

      errorHandler.report(debugError);
      errorHandler.report(warningError);
      errorHandler.report(errorError);

      // Should only collect warning and error (not debug)
      const allErrors = errorHandler.getErrors();
      expect(allErrors).toHaveLength(2);

      const criticalErrors = errorHandler.getErrorsBySeverity(Severity.ERROR);
      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].message).toBe('Error message');
    });

    it('should clear errors', () => {
      const error = errorHandler.createSyntaxError('Test error', {});
      errorHandler.report(error);

      expect(errorHandler.hasErrors()).toBe(true);

      errorHandler.clearErrors();

      expect(errorHandler.hasErrors()).toBe(false);
      expect(errorHandler.getErrors()).toHaveLength(0);
    });
  });

  describe('Logger', () => {
    it('should log messages at appropriate levels', () => {
      const messages: string[] = [];
      const logger = new Logger({
        level: Severity.WARNING,
        output: (msg) => messages.push(msg),
      });

      logger.debug('Debug message'); // Should not be logged
      logger.info('Info message');   // Should not be logged
      logger.warn('Warning message'); // Should be logged
      logger.error('Error message');  // Should be logged

      expect(messages).toHaveLength(2);
      expect(messages[0]).toContain('Warning message');
      expect(messages[1]).toContain('Error message');
    });

    it('should format messages with timestamp and severity', () => {
      const messages: string[] = [];
      const logger = new Logger({
        includeTimestamp: true,
        includeSeverity: true,
        output: (msg) => messages.push(msg),
      });

      logger.error('Test error');

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      expect(messages[0]).toContain('[ERROR]');
      expect(messages[0]).toContain('Test error');
    });

    it('should respect enabled/disabled state', () => {
      const messages: string[] = [];
      const logger = new Logger({
        enabled: false,
        output: (msg) => messages.push(msg),
      });

      logger.error('This should not be logged');

      expect(messages).toHaveLength(0);

      logger.setEnabled(true);
      logger.error('This should be logged');

      expect(messages).toHaveLength(1);
    });
  });

  describe('RecoveryStrategyRegistry', () => {
    let registry: RecoveryStrategyRegistry;

    beforeEach(() => {
      registry = new RecoveryStrategyRegistry();
    });

    it('should register default strategies', () => {
      expect(registry.getStrategyCount()).toBeGreaterThan(0);
    });

    it('should attempt recovery for supported errors', () => {
      const error = errorHandler.createSyntaxError('Missing semicolon', {
        line: 1,
        column: 5,
        nodeType: ';',
      });

      const originalCode = 'x = 5\ny = 10';
      const recoveredCode = registry.attemptRecovery(error, originalCode);

      // The missing semicolon strategy should handle this
      expect(recoveredCode).toBeTruthy();
      expect(recoveredCode).toContain(';');
    });

    it('should provide recovery suggestions', () => {
      const error = errorHandler.createSyntaxError('Missing semicolon', {
        line: 1,
        column: 5,
        nodeType: ';',
      });

      const suggestions = registry.getRecoverySuggestions(error);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toContain('semicolon');
    });

    it('should check if recovery is possible', () => {
      const recoverableError = errorHandler.createSyntaxError('Missing semicolon', {
        line: 1,
        column: 5,
        nodeType: ';',
      });

      const unrecoverableError = errorHandler.createInternalError('Internal error', {});

      expect(registry.canRecover(recoverableError)).toBe(true);
      expect(registry.canRecover(unrecoverableError)).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should integrate error error-handling with recovery registry', () => {
      const error = errorHandler.createSyntaxError('Missing semicolon', {
        line: 1,
        column: 5,
        nodeType: ';',
      });

      const originalCode = 'x = 5\ny = 10';
      const recoveredCode = errorHandler.attemptRecovery(error, originalCode);

      expect(recoveredCode).toBeTruthy();
      expect(recoveredCode).not.toBe(originalCode);
    });

    it('should integrate error error-handling with logger', () => {
      const messages: string[] = [];
      const customErrorHandler = new ErrorHandler({
        throwErrors: false,
        loggerOptions: {
          output: (msg) => messages.push(msg),
        },
      });

      const error = customErrorHandler.createSyntaxError('Test error', {});
      customErrorHandler.report(error);

      expect(messages).toHaveLength(1);
      expect(messages[0]).toContain('Test error');
    });
  });
});
