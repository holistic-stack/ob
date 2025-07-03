/**
 * Tests for the SyntaxError class
 */

import { SyntaxError } from './syntax-error.js';
import { ErrorPosition } from './parser-error.js';

describe('SyntaxError', () => {
  // Test data
  const message = 'Test syntax error';
  const source = 'cube([10, 10, 10);';
  const position: ErrorPosition = { line: 0, column: 15, offset: 15 };

  it('should create a SyntaxError with the correct properties', () => {
    const error = new SyntaxError(message, source, position);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.name).toBe('SyntaxError');
    expect(error.message).toContain(message);
    expect(error.code).toBe('SYNTAX_ERROR');
    expect(error.source).toBe(source);
    expect(error.position).toEqual(position);
  });

  it('should create a missing token error', () => {
    const tokenName = ']';
    const error = SyntaxError.missingToken(tokenName, source, position);

    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.message).toContain(`Missing ${tokenName}`);
    expect(error.suggestions).toHaveLength(1);
    expect(error.suggestions[0].message).toContain(
      `Add the missing ${tokenName}`
    );
    expect(error.suggestions[0].replacement).toBe(tokenName);
  });

  it('should create an unexpected token error', () => {
    const foundToken = ')';
    const expectedToken = ']';
    const error = SyntaxError.unexpectedToken(
      foundToken,
      expectedToken,
      source,
      position
    );

    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.message).toContain(`Unexpected token '${foundToken}'`);
    expect(error.message).toContain(`expected '${expectedToken}'`);
    expect(error.suggestions).toHaveLength(1);
    expect(error.suggestions[0].message).toContain(
      `Replace '${foundToken}' with '${expectedToken}'`
    );
    expect(error.suggestions[0].replacement).toBe(expectedToken);
  });

  it('should create an unmatched token error', () => {
    const openToken = '[';
    const closeToken = ']';
    const error = SyntaxError.unmatchedToken(
      openToken,
      closeToken,
      source,
      position
    );

    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.message).toContain(`Unmatched '${openToken}'`);
    expect(error.message).toContain(`missing '${closeToken}'`);
    expect(error.suggestions).toHaveLength(1);
    expect(error.suggestions[0].message).toContain(
      `Add the missing '${closeToken}'`
    );
    expect(error.suggestions[0].replacement).toBe(closeToken);
  });

  it('should create a missing semicolon error', () => {
    const error = SyntaxError.missingSemicolon(source, position);

    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.message).toContain('Missing semicolon');
    expect(error.suggestions).toHaveLength(1);
    expect(error.suggestions[0].message).toContain('Add a semicolon');
    expect(error.suggestions[0].replacement).toBe(';');
  });
});
