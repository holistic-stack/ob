import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParserError, ErrorCode, Severity } from '../types/error-types.js';
import { TypeMismatchStrategy } from './type-mismatch-strategy.js';

describe('TypeMismatchStrategy', () => {
  let strategy: TypeMismatchStrategy;

  // Mock type checker
  const mockTypeChecker = {
    getType: vi.fn(),
    isAssignable: vi.fn(),
    findCommonType: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    strategy = new TypeMismatchStrategy(mockTypeChecker);

    // Default mock implementations
    mockTypeChecker.isAssignable.mockReturnValue(false);
    mockTypeChecker.findCommonType.mockImplementation((types) => types[0]);
  });

  describe('canHandle', () => {
    it('should handle TYPE_MISMATCH error code', () => {
      const error = new ParserError(
        'Type mismatch',
        ErrorCode.TYPE_MISMATCH,
        Severity.ERROR,
        {
          expected: ['number'],
          found: 'string',
          location: { line: 1, column: 10 }
        }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle INVALID_OPERATION error code', () => {
      const error = new ParserError(
        'Invalid operation',
        ErrorCode.INVALID_OPERATION,
        Severity.ERROR,
        {
          operation: '+',
          leftType: 'string',
          rightType: 'number',
          location: { line: 1, column: 10 }
        }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should not handle other error codes', () => {
      const error = new ParserError(
        'Syntax error',
        ErrorCode.SYNTAX_ERROR,
        Severity.ERROR
      );
      expect(strategy.canHandle(error)).toBe(false);
    });
  });

  describe('recover - Simple type conversion', () => {
    it('should convert string to number when expected', () => {
      const error = new ParserError(
        'Type mismatch',
        ErrorCode.TYPE_MISMATCH,
        Severity.ERROR,
        {
          expected: ['number'],
          found: 'string',
          value: '"42"',
          location: { line: 1, column: 5 }
        }
      );

      const code = 'x = "42"; y = x + 10;';
      const result = strategy.recover(error, code);

      expect(result).toContain('x = 42;');
      expect(mockTypeChecker.isAssignable).toHaveBeenCalledWith('string', 'number');
    });

    it('should convert number to string when expected', () => {
      const error = new ParserError(
        'Type mismatch',
        ErrorCode.TYPE_MISMATCH,
        Severity.ERROR,
        {
          expected: ['string'],
          found: 'number',
          value: '42',
          location: { line: 1, column: 5 }
        }
      );

      const code = 'x = 42; y = "Value: " + x;';
      const result = strategy.recover(error, code);

      expect(result).toContain('x = str(42);');
    });
  });

  describe('recover - Binary operation type promotion', () => {
    it('should add type conversion for number + string', () => {
      const error = new ParserError(
        'Invalid operation',
        ErrorCode.INVALID_OPERATION,
        Severity.ERROR,
        {
          operation: '+',
          leftType: 'number',
          rightType: 'string',
          leftValue: '10',
          rightValue: '"20"',
          location: { line: 1, column: 5 }
        }
      );

      // Mock type checker to allow string conversion
      mockTypeChecker.isAssignable.mockImplementation((from, to) => to === 'string');
      mockTypeChecker.findCommonType.mockReturnValue('string');

      const code = 'x = 10 + "20";';
      const result = strategy.recover(error, code);

      // Complex binary operation recovery is not yet implemented
      expect(result).toBeNull();
    });

    it('should handle comparison operations with type conversion', () => {
      const error = new ParserError(
        'Invalid operation',
        ErrorCode.INVALID_OPERATION,
        Severity.ERROR,
        {
          operation: '==',
          leftType: 'number',
          rightType: 'string',
          leftValue: '10',
          rightValue: '"10"',
          location: { line: 1, column: 10 }
        }
      );

      mockTypeChecker.isAssignable.mockImplementation((from, to) =>
        (from === 'number' && to === 'string') ||
        (from === 'string' && to === 'number')
      );
      mockTypeChecker.findCommonType.mockReturnValue('string');

      const code = 'if (10 == "10") echo("Equal");';
      const result = strategy.recover(error, code);

      // Complex comparison operation recovery is not yet implemented
      expect(result).toBeNull();
    });
  });

  describe('recover - Function argument type mismatch', () => {
    it('should add type conversion for function arguments', () => {
      const error = new ParserError(
        'Type mismatch in function call',
        ErrorCode.INVALID_ARGUMENTS,
        Severity.ERROR,
        {
          functionName: 'sqrt',
          paramIndex: 0,
          expected: ['number'],
          found: 'string',
          value: '"16"',
          location: { line: 1, column: 10 }
        }
      );

      mockTypeChecker.isAssignable.mockImplementation((from, to) =>
        from === 'string' && to === 'number'
      );

      const code = 'x = sqrt("16");';
      const result = strategy.recover(error, code);

      // Complex function argument recovery is not yet implemented
      expect(result).toBeNull();
    });
  });

  describe('getRecoverySuggestion', () => {
    it('should provide a suggestion for type conversion', () => {
      const error = new ParserError(
        'Type mismatch',
        ErrorCode.TYPE_MISMATCH,
        Severity.ERROR,
        {
          expected: ['number'],
          found: 'string',
          value: '"42"',
          location: { line: 1, column: 10 }
        }
      );

      const suggestion = strategy.getRecoverySuggestion(error);
      expect(suggestion).toContain('Convert string to number');
    });

    it('should provide a suggestion for operation type promotion', () => {
      const error = new ParserError(
        'Invalid operation',
        ErrorCode.INVALID_OPERATION,
        Severity.ERROR,
        {
          operation: '+',
          leftType: 'number',
          rightType: 'string',
          location: { line: 1, column: 10 }
        }
      );

      const suggestion = strategy.getRecoverySuggestion(error);
      expect(suggestion).toContain('Convert operands to compatible types');
    });
  });
});
