/**
 * Tests for the ParserError class
 */

import { ParserError, ErrorPosition, ErrorSuggestion } from './parser-error.js';

describe('ParserError', () => {
  // Test data
  const message = 'Test error message';
  const code = 'TEST_ERROR';
  const source = 'cube([10, 10, 10]);';
  const position: ErrorPosition = { line: 0, column: 5, offset: 5 };
  const suggestions: ErrorSuggestion[] = [
    { message: 'Test suggestion', replacement: 'cube(10);' },
  ];

  it('should create a ParserError with the correct properties', () => {
    const error = new ParserError(message, code, source, position, suggestions);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ParserError);
    expect(error.name).toBe('ParserError');
    expect(error.message).toContain(message);
    expect(error.getPositionString()).toContain('line 1'); // 1-based line number
    expect(error.getPositionString()).toContain('column 6'); // 1-based column number
    expect(error.code).toBe(code);
    expect(error.source).toBe(source);
    expect(error.position).toEqual(position);
    expect(error.suggestions).toEqual(suggestions);
  });

  it('should get the source line where the error occurred', () => {
    const error = new ParserError(message, code, source, position);

    expect(error.getSourceLine()).toBe(source);
  });

  it('should get a formatted error message with context', () => {
    const error = new ParserError(message, code, source, position, suggestions);
    const formattedMessage = error.getFormattedMessage();

    expect(formattedMessage).toContain(message);
    expect(formattedMessage).toContain(source);
    expect(formattedMessage).toContain('^'); // Pointer to the error position
    expect(formattedMessage).toContain('Suggestions');
    expect(formattedMessage).toContain(suggestions[0].message);
    expect(formattedMessage).toContain(suggestions[0].replacement);
  });

  it('should create a ParserError from a tree-sitter position', () => {
    const treePosition = { row: 0, column: 5 };
    const position = ParserError.fromTreeSitterPosition(treePosition);

    expect(position).toEqual({ line: 0, column: 5, offset: 0 });
  });

  it('should create a ParserError from a tree-sitter node', () => {
    const node = { startPosition: { row: 0, column: 5 } };
    const error = ParserError.fromNode(
      message,
      code,
      source,
      node,
      suggestions
    );

    expect(error).toBeInstanceOf(ParserError);
    expect(error.message).toContain(message);
    expect(error.code).toBe(code);
    expect(error.source).toBe(source);
    expect(error.position).toEqual({ line: 0, column: 5, offset: 0 });
    expect(error.suggestions).toEqual(suggestions);
  });
});
