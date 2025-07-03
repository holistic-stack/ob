import { describe, it, expect, beforeEach } from 'vitest';
import { ParserError, ErrorCode, Severity } from '../types/error-types.js';
import { MissingSemicolonStrategy } from './missing-semicolon-strategy.js';

describe('MissingSemicolonStrategy', () => {
  let strategy: MissingSemicolonStrategy;

  beforeEach(() => {
    strategy = new MissingSemicolonStrategy();
  });

  describe('canHandle', () => {
    it('should handle MISSING_SEMICOLON error code', () => {
      const error = new ParserError(
        'Missing semicolon',
        ErrorCode.MISSING_SEMICOLON,
        Severity.ERROR,
        { line: 1, column: 10 }
      );

      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle syntax error about missing semicolon', () => {
      const error = new ParserError(
        'Syntax error: missing semicolon',
        ErrorCode.SYNTAX_ERROR,
        Severity.ERROR,
        { line: 1, column: 10 }
      );

      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should not handle other error codes', () => {
      const error = new ParserError(
        'Some other error',
        ErrorCode.UNEXPECTED_TOKEN,
        Severity.ERROR,
        { line: 1, column: 10 }
      );

      expect(strategy.canHandle(error)).toBe(false);
    });
  });

  describe('recover', () => {
    it('should add semicolon to end of line', () => {
      const error = new ParserError(
        'Missing semicolon',
        ErrorCode.MISSING_SEMICOLON,
        Severity.ERROR,
        { line: 2, column: 15 }
      );

      const code = [
        'module test() {',
        '  cube([10, 20, 30])',  // Missing semicolon
        '  sphere(5);',
        '}'
      ].join('\n');

      const result = strategy.recover(error, code);

      expect(result).toContain('  cube([10, 20, 30]);');
      expect(result).toContain('  sphere(5);');
    });

    it('should not add semicolon if line already ends with one', () => {
      const error = new ParserError(
        'Missing semicolon',
        ErrorCode.MISSING_SEMICOLON,
        Severity.ERROR,
        { line: 2, column: 15 }
      );

      const code = [
        'module test() {',
        '  cube([10, 20, 30]);',  // Already has semicolon
        '  sphere(5);',
        '}'
      ].join('\n');

      const result = strategy.recover(error, code);

      // Should return null since no change was needed
      expect(result).toBeNull();
    });

    it('should handle empty lines', () => {
      const error = new ParserError(
        'Missing semicolon',
        ErrorCode.MISSING_SEMICOLON,
        Severity.ERROR,
        { line: 3, column: 1 }
      );

      const code = [
        'module test() {',
        '  cube([10, 20, 30]);',
        '  // Comment',  // Line with just a comment
        '  sphere(5);',
        '}'
      ].join('\n');

      const result = strategy.recover(error, code);

      // Should return null since we can't add a semicolon to a comment line
      expect(result).toBeNull();
    });
  });

  describe('getRecoverySuggestion', () => {
    it('should return a helpful message', () => {
      const error = new ParserError(
        'Missing semicolon',
        ErrorCode.MISSING_SEMICOLON,
        Severity.ERROR,
        { line: 1, column: 10 }
      );

      expect(strategy.getRecoverySuggestion(error)).toBe('Insert missing semicolon');
    });
  });
});
