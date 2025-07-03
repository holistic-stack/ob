import { describe, it, expect, beforeEach } from 'vitest';
import { ParserError, ErrorCode, Severity } from '../types/error-types.js';
import { UnknownIdentifierStrategy } from './unknown-identifier-strategy.js';

describe('UnknownIdentifierStrategy', () => {
  let strategy: UnknownIdentifierStrategy;

  beforeEach(() => {
    strategy = new UnknownIdentifierStrategy();

    // Set up test identifiers in different scopes
    strategy.setCurrentScope(['global']);
    strategy.addIdentifier('width', 'variable');
    strategy.addIdentifier('height', 'variable');
    strategy.addIdentifier('length', 'variable');  // Add missing 'length' identifier
    strategy.addIdentifier('render', 'function');
    strategy.addIdentifier('customCube', 'module');

    // Add some similar identifiers
    strategy.addIdentifier('widht', 'variable');  // Common typo
    strategy.addIdentifier('hight', 'variable');  // Common typo
    strategy.addIdentifier('renderObject', 'function');
  });

  describe('canHandle', () => {
    it('should handle UNDEFINED_VARIABLE error code', () => {
      const error = new ParserError(
        'Undefined variable',
        ErrorCode.UNDEFINED_VARIABLE,
        Severity.ERROR,
        { found: 'lenght' }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle UNDEFINED_FUNCTION error code', () => {
      const error = new ParserError(
        'Undefined function',
        ErrorCode.UNDEFINED_FUNCTION,
        Severity.ERROR,
        { found: 'rendr' }
      );
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should handle error messages about undefined variables', () => {
      const error = new ParserError(
        '"lenght" is not defined',
        ErrorCode.REFERENCE_ERROR,
        Severity.ERROR
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

  describe('extractIdentifier', () => {
    it('should extract identifier from context', () => {
      const error = new ParserError(
        'Error',
        ErrorCode.UNDEFINED_VARIABLE,
        Severity.ERROR,
        { found: 'lenght' }
      );

      const identifier = (strategy as any).extractIdentifier(error);
      expect(identifier).toBe('lenght');
    });

    it('should extract identifier from error message', () => {
      const error = new ParserError(
        'Undefined variable "lenght"',
        ErrorCode.REFERENCE_ERROR,
        Severity.ERROR
      );

      const identifier = (strategy as any).extractIdentifier(error);
      expect(identifier).toBe('lenght');
    });
  });

  describe('findSimilarIdentifiers', () => {
    it('should find similar variable names', () => {
      const suggestions = (strategy as any).findSimilarIdentifiers('lenght');
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].name).toBe('height');  // 'height' comes before 'length' alphabetically with same distance
      expect(suggestions[1].name).toBe('length');
    });

    it('should find similar function names', () => {
      const suggestions = (strategy as any).findSimilarIdentifiers('rendr');
      expect(suggestions).toHaveLength(1);  // Only 'render' is within edit distance 2
      expect(suggestions[0].name).toBe('render');
    });

    it('should respect max suggestions limit', () => {
      // Add more similar variables
      strategy.addIdentifier('w1dth', 'variable');
      strategy.addIdentifier('w1dth2', 'variable');

      const suggestions = (strategy as any).findSimilarIdentifiers('width');
      expect(suggestions).toHaveLength(3); // Default max is 3
    });
  });

  describe('recover', () => {
    it('should correct simple typos in variable names', () => {
      const error = new ParserError(
        'Undefined variable',
        ErrorCode.UNDEFINED_VARIABLE,
        Severity.ERROR,
        {
          line: 1,
          column: 15,  // 'lenght' starts at position 15 in 'cube([10, 20, lenght]);'
          found: 'lenght'
        }
      );

      const code = 'cube([10, 20, lenght]);';
      const result = strategy.recover(error, code);

      // Should suggest 'height' as the correction (first alphabetically with same distance)
      expect(result).toContain('height');

      // Error context should be updated with suggestions
      expect(error.context.suggestions).toContain('height');
      expect(error.context.suggestions).toContain('length');
    });

    it('should handle function name typos', () => {
      const error = new ParserError(
        'Undefined function',
        ErrorCode.UNDEFINED_FUNCTION,
        Severity.ERROR,
        {
          line: 1,
          column: 1,
          found: 'rendr'
        }
      );

      const code = 'rendr();';
      const result = strategy.recover(error, code);

      // Should suggest 'render' as the correction
      expect(result).toContain('render(');
    });

    it('should return null for unknown identifiers with no close matches', () => {
      const error = new ParserError(
        'Undefined variable',
        ErrorCode.UNDEFINED_VARIABLE,
        Severity.ERROR,
        {
          line: 1,
          column: 1,
          found: 'xyz123'
        }
      );

      const code = 'xyz123 = 10;';
      const result = strategy.recover(error, code);

      // No close matches, should return null
      expect(result).toBeNull();
    });
  });

  describe('getRecoverySuggestion', () => {
    it('should return a helpful suggestion with alternatives', () => {
      const error = new ParserError(
        'Undefined variable',
        ErrorCode.UNDEFINED_VARIABLE,
        Severity.ERROR,
        {
          found: 'lenght',
          suggestions: ['length', 'width']
        }
      );

      const suggestion = strategy.getRecoverySuggestion(error);
      expect(suggestion).toContain("Did you mean 'length' or 'width'?");
    });

    it('should handle cases with no suggestions', () => {
      const error = new ParserError(
        'Undefined variable',
        ErrorCode.UNDEFINED_VARIABLE,
        Severity.ERROR,
        { found: 'xyz123' }
      );

      const suggestion = strategy.getRecoverySuggestion(error);
      expect(suggestion).toBe('Check for typos or missing variable/function declarations');
    });
  });
});
