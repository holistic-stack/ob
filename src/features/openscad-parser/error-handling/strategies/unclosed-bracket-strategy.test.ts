import { describe, it, expect, beforeEach } from 'vitest';
import { ParserError, ErrorCode, Severity } from '../types/error-types.js';
import { UnclosedBracketStrategy } from './unclosed-bracket-strategy.js';

describe('UnclosedBracketStrategy', () => {
  let strategy: UnclosedBracketStrategy;

  beforeEach(() => {
    strategy = new UnclosedBracketStrategy();
  });

  describe('canHandle', () => {
    it('should handle UNCLOSED_PAREN error code', () => {
      const error = new ParserError(
        'Unclosed parenthesis',
        ErrorCode.UNCLOSED_PAREN,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle UNCLOSED_BRACKET error code', () => {
      const error = new ParserError(
        'Unclosed bracket',
        ErrorCode.UNCLOSED_BRACKET,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle UNCLOSED_BRACE error code', () => {
      const error = new ParserError(
        'Unclosed brace',
        ErrorCode.UNCLOSED_BRACE,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle syntax error about missing parenthesis', () => {
      const error = new ParserError(
        'Syntax error: missing )',
        ErrorCode.SYNTAX_ERROR,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should not handle other error codes', () => {
      const error = new ParserError(
        'Some other error',
        ErrorCode.MISSING_SEMICOLON,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.canHandle(error)).toBe(false);
    });
  });

  describe('recover - Parentheses', () => {
    it('should add missing closing parenthesis', () => {
      const error = new ParserError(
        'Missing closing parenthesis',
        ErrorCode.UNCLOSED_PAREN,
        Severity.ERROR,
        { line: 1, column: 16 }
      );

      const code = 'cube([10, 20, 30';  // Missing closing )
      const result = strategy.recover(error, code);

      expect(result).toBe('cube([10, 20, 30])');
    });

    it('should handle nested parentheses', () => {
      const error = new ParserError(
        'Missing closing parenthesis',
        ErrorCode.UNCLOSED_PAREN,
        Severity.ERROR,
        { line: 1, column: 26 }
      );

      const code = 'translate([0, 0, 0]) cube([10, 20, 30';  // Missing closing )
      const result = strategy.recover(error, code);

      expect(result).toBe('translate([0, 0, 0]) cube([10, 20, 30])');
    });
  });

  describe('recover - Brackets', () => {
    it('should add missing closing bracket', () => {
      const error = new ParserError(
        'Missing closing bracket',
        ErrorCode.UNCLOSED_BRACKET,
        Severity.ERROR,
        { line: 1, column: 15 }
      );

      const code = 'cube([10, 20, 30';  // Missing closing ]
      const result = strategy.recover(error, code);

      expect(result).toBe('cube([10, 20, 30])');
    });

    it('should handle nested brackets', () => {
      const error = new ParserError(
        'Missing closing bracket',
        ErrorCode.UNCLOSED_BRACKET,
        Severity.ERROR,
        { line: 1, column: 25 }
      );

      const code = 'polyhedron(points=[[0,0,0], [1,0,0], [0,1,0]';  // Missing closing ]
      const result = strategy.recover(error, code);

      expect(result).toBe('polyhedron(points=[[0,0,0], [1,0,0], [0,1,0]])');
    });
  });

  describe('recover - Braces', () => {
    it('should add missing closing brace for module', () => {
      const error = new ParserError(
        'Missing closing brace',
        ErrorCode.UNCLOSED_BRACE,
        Severity.ERROR,
        { line: 2, column: 1 }
      );

      const code = [
        'module test() {',
        '  cube([10, 20, 30]);',
        '  sphere(5);'  // Missing closing }
      ].join('\n');

      const expected = [
        'module test() {',
        '  cube([10, 20, 30]);',
        '  sphere(5);',
        '}'
      ].join('\n');

      const result = strategy.recover(error, code);
      expect(result).toBe(expected);
    });
  });

  describe('getRecoverySuggestion', () => {
    it('should return correct suggestion for unclosed parenthesis', () => {
      const error = new ParserError(
        'Missing closing parenthesis',
        ErrorCode.UNCLOSED_PAREN,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.getRecoverySuggestion(error)).toBe('Insert missing closing parenthesis');
    });

    it('should return correct suggestion for unclosed bracket', () => {
      const error = new ParserError(
        'Missing closing bracket',
        ErrorCode.UNCLOSED_BRACKET,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.getRecoverySuggestion(error)).toBe('Insert missing closing bracket');
    });

    it('should return correct suggestion for unclosed brace', () => {
      const error = new ParserError(
        'Missing closing brace',
        ErrorCode.UNCLOSED_BRACE,
        Severity.ERROR,
        { line: 1, column: 10 }
      );
      expect(strategy.getRecoverySuggestion(error)).toBe('Insert missing closing brace');
    });
  });
});
