/**
 * @file Tests for Enhanced Error Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EnhancedError,
  createEnhancedError,
  withSourceLocation,
  withContext,
  errorToResult,
  createErrorResult,
  withEnhancedErrors,
  withEnhancedErrorsAsync,
  type SourceLocation,
  type ErrorContext,
} from './enhanced-error';

describe('EnhancedError', () => {
  describe('constructor', () => {
    it('should create error with minimal config', () => {
      const error = new EnhancedError({
        message: 'Test error',
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.recoverable).toBe(true);
      expect(error.suggestions).toEqual([]);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create error with full config', () => {
      const location: SourceLocation = {
        file: 'test.ts',
        function: 'testFunction',
        line: 42,
        column: 10,
      };

      const context: ErrorContext = {
        operation: 'testing',
        component: 'test-component',
        userId: 'user123',
      };

      const error = new EnhancedError({
        message: 'Detailed test error',
        code: 'TEST_ERROR',
        source: 'cube(10);',
        location,
        context,
        severity: 'high',
        recoverable: false,
        suggestions: ['Check syntax', 'Verify parameters'],
      });

      expect(error.message).toBe('Detailed test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.source).toBe('cube(10);');
      expect(error.location).toEqual(location);
      expect(error.context).toMatchObject(context);
      expect(error.severity).toBe('high');
      expect(error.recoverable).toBe(false);
      expect(error.suggestions).toEqual(['Check syntax', 'Verify parameters']);
    });

    it('should preserve cause error', () => {
      const originalError = new Error('Original error');
      const error = new EnhancedError({
        message: 'Enhanced error',
        cause: originalError,
      });

      expect(error.cause).toBe(originalError);
    });
  });

  describe('getFormattedMessage', () => {
    it('should format message with minimal info', () => {
      const error = new EnhancedError({
        message: 'Simple error',
      });

      const formatted = error.getFormattedMessage();
      expect(formatted).toBe('Simple error');
    });

    it('should format message with full context', () => {
      const error = new EnhancedError({
        message: 'Complex error',
        code: 'COMPLEX_ERROR',
        source: 'cube(10); sphere(5);',
        location: {
          file: 'model.scad',
          function: 'createModel',
          line: 15,
          column: 8,
        },
        context: {
          operation: 'parsing',
        },
        suggestions: ['Check syntax', 'Verify dimensions'],
      });

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('Complex error');
      expect(formatted).toContain('[COMPLEX_ERROR]');
      expect(formatted).toContain('file: model.scad');
      expect(formatted).toContain('function: createModel');
      expect(formatted).toContain('line: 15');
      expect(formatted).toContain('column: 8');
      expect(formatted).toContain('Source: "cube(10); sphere(5);"');
      expect(formatted).toContain('Operation: parsing');
      expect(formatted).toContain('Suggestions: Check syntax, Verify dimensions');
    });

    it('should truncate long source code', () => {
      const longSource = 'a'.repeat(150);
      const error = new EnhancedError({
        message: 'Error with long source',
        source: longSource,
      });

      const formatted = error.getFormattedMessage();
      expect(formatted).toContain('Source: "' + 'a'.repeat(100) + '..."');
    });
  });

  describe('getDebugInfo', () => {
    it('should return comprehensive debug information', () => {
      const error = new EnhancedError({
        message: 'Debug test error',
        code: 'DEBUG_ERROR',
        severity: 'critical',
        location: { file: 'debug.ts', line: 10 },
        context: { operation: 'debugging' },
      });

      const debugInfo = error.getDebugInfo();
      
      expect(debugInfo).toMatchObject({
        message: 'Debug test error',
        code: 'DEBUG_ERROR',
        severity: 'critical',
        recoverable: true,
        location: { file: 'debug.ts', line: 10 },
        context: expect.objectContaining({ operation: 'debugging' }),
      });
      
      expect(debugInfo.timestamp).toBeDefined();
      expect(debugInfo.stack).toBeDefined();
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const error = new EnhancedError({
        message: 'JSON test error',
        code: 'JSON_ERROR',
      });

      const json = error.toJSON();
      expect(json).toMatchObject({
        message: 'JSON test error',
        code: 'JSON_ERROR',
      });
    });
  });
});

describe('createEnhancedError', () => {
  it('should create enhanced error', () => {
    const error = createEnhancedError({
      message: 'Factory test error',
      code: 'FACTORY_ERROR',
    });

    expect(error).toBeInstanceOf(EnhancedError);
    expect(error.message).toBe('Factory test error');
    expect(error.code).toBe('FACTORY_ERROR');
  });
});

describe('withSourceLocation', () => {
  it('should add source location to regular error', () => {
    const originalError = new Error('Original error');
    const location: SourceLocation = {
      file: 'source.ts',
      function: 'sourceFunction',
      line: 25,
    };

    const enhancedError = withSourceLocation(originalError, location);

    expect(enhancedError).toBeInstanceOf(EnhancedError);
    expect(enhancedError.message).toBe('Original error');
    expect(enhancedError.location).toEqual(location);
    expect(enhancedError.cause).toBe(originalError);
  });

  it('should merge location with existing enhanced error', () => {
    const originalError = new EnhancedError({
      message: 'Enhanced error',
      location: { file: 'original.ts', line: 10 },
    });

    const newLocation: SourceLocation = {
      function: 'newFunction',
      column: 5,
    };

    const mergedError = withSourceLocation(originalError, newLocation);

    expect(mergedError.location).toEqual({
      file: 'original.ts',
      line: 10,
      function: 'newFunction',
      column: 5,
    });
  });
});

describe('withContext', () => {
  it('should add context to regular error', () => {
    const originalError = new Error('Original error');
    const context: ErrorContext = {
      operation: 'testing',
      component: 'test-component',
    };

    const enhancedError = withContext(originalError, context);

    expect(enhancedError).toBeInstanceOf(EnhancedError);
    expect(enhancedError.context).toMatchObject(context);
    expect(enhancedError.cause).toBe(originalError);
  });

  it('should merge context with existing enhanced error', () => {
    const originalError = new EnhancedError({
      message: 'Enhanced error',
      context: { operation: 'original', userId: 'user123' },
    });

    const newContext: ErrorContext = {
      operation: 'updated',
      component: 'new-component',
    };

    const mergedError = withContext(originalError, newContext);

    expect(mergedError.context).toMatchObject({
      operation: 'updated',
      userId: 'user123',
      component: 'new-component',
    });
  });
});

describe('errorToResult', () => {
  it('should convert enhanced error to result', () => {
    const error = createEnhancedError({
      message: 'Result test error',
      code: 'RESULT_ERROR',
    });

    const result = errorToResult<string>(error);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(error);
    }
  });
});

describe('createErrorResult', () => {
  it('should create error result directly', () => {
    const result = createErrorResult<number>({
      message: 'Direct result error',
      code: 'DIRECT_ERROR',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Direct result error');
      expect(result.error.code).toBe('DIRECT_ERROR');
    }
  });
});

describe('withEnhancedErrors', () => {
  it('should wrap function and enhance thrown errors', () => {
    const throwingFunction = (shouldThrow: boolean) => {
      if (shouldThrow) {
        throw new Error('Function error');
      }
      return 'success';
    };

    const wrappedFunction = withEnhancedErrors(
      throwingFunction,
      { file: 'wrapper.ts', function: 'wrappedFunction' },
      { operation: 'wrapping' }
    );

    // Should work normally when not throwing
    expect(wrappedFunction(false)).toBe('success');

    // Should enhance error when throwing
    expect(() => wrappedFunction(true)).toThrow(EnhancedError);
    
    try {
      wrappedFunction(true);
    } catch (error) {
      expect(error).toBeInstanceOf(EnhancedError);
      const enhancedError = error as EnhancedError;
      expect(enhancedError.message).toBe('Function error');
      expect(enhancedError.location?.file).toBe('wrapper.ts');
      expect(enhancedError.context.operation).toBe('wrapping');
    }
  });
});

describe('withEnhancedErrorsAsync', () => {
  it('should wrap async function and enhance thrown errors', async () => {
    const asyncThrowingFunction = async (shouldThrow: boolean) => {
      if (shouldThrow) {
        throw new Error('Async function error');
      }
      return 'async success';
    };

    const wrappedFunction = withEnhancedErrorsAsync(
      asyncThrowingFunction,
      { file: 'async-wrapper.ts', function: 'wrappedAsyncFunction' }
    );

    // Should work normally when not throwing
    await expect(wrappedFunction(false)).resolves.toBe('async success');

    // Should enhance error when throwing
    await expect(wrappedFunction(true)).rejects.toThrow(EnhancedError);
    
    try {
      await wrappedFunction(true);
    } catch (error) {
      expect(error).toBeInstanceOf(EnhancedError);
      const enhancedError = error as EnhancedError;
      expect(enhancedError.message).toBe('Async function error');
      expect(enhancedError.location?.file).toBe('async-wrapper.ts');
    }
  });
});
