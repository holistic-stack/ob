/**
 * Node location utilities for AST nodes
 */

export interface NodeLocation {
  readonly start: {
    readonly line: number;
    readonly column: number;
    readonly offset: number;
  };
  readonly end: {
    readonly line: number;
    readonly column: number;
    readonly offset: number;
  };
}

export function createNodeLocation(
  startLine: number,
  startColumn: number,
  startOffset: number,
  endLine: number,
  endColumn: number,
  endOffset: number
): NodeLocation {
  return {
    start: { line: startLine, column: startColumn, offset: startOffset },
    end: { line: endLine, column: endColumn, offset: endOffset },
  };
}
