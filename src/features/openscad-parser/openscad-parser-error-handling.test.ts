/**
 * Tests for the enhanced error handling in the OpenscadParser class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenscadParser } from './openscad-parser.js';


describe('OpenscadParser Error Handling', () => {
  let parser: OpenscadParser;

  // Sample valid and invalid OpenSCAD code
  const VALID_OPENSCAD_CODE = 'cube([10, 10, 10]);';
  const INVALID_OPENSCAD_CODE = 'cube([10, 10, 10);'; // Missing closing bracket

  beforeEach(async () => {
    // Configure parser for graceful error handling
    parser = new OpenscadParser();
    await parser.init();
  });

  afterEach(() => {
    parser.dispose();
  });

  it('should parse valid OpenSCAD code without errors', () => {
    const result = parser.parseCST(VALID_OPENSCAD_CODE);

    expect(result).toBeDefined();
    expect(result?.rootNode).toBeDefined();
    expect(result?.rootNode.toString()).not.toContain('ERROR');
  });

  it('should handle invalid OpenSCAD code gracefully', () => {
    // Mock console.error to capture the error message
    const originalConsoleError = console.error;
    const mockConsoleError = vi.fn();
    console.error = mockConsoleError;

    try {
      const result = parser.parseCST(INVALID_OPENSCAD_CODE);

      // Should still parse but with syntax errors in the tree
      expect(result).toBeDefined();
      expect(result?.rootNode).toBeDefined();

      // The tree should contain MISSING tokens (tree-sitter error recovery)
      const rootNodeString = result?.rootNode.toString();
      expect(rootNodeString).toContain('MISSING');



      // Should have called console.error with a formatted error message
      expect(mockConsoleError).toHaveBeenCalled();

      // The first call should be our log about the parse error
      const errorMessage = mockConsoleError.mock.calls[0][0];

      // The error message should contain the syntax error details
      expect(errorMessage).toContain('Syntax error');
      expect(errorMessage).toContain(INVALID_OPENSCAD_CODE);
      expect(errorMessage).toContain('^'); // Pointer to the error position
    } finally {
      // Restore the original console.error
      console.error = originalConsoleError;
    }
  });

  it('should throw a ParserError for initialization errors', async () => {
    const uninitializedParser = new OpenscadParser();

    // Should throw an error when trying to parse without initializing
    await expect(async () => {
      uninitializedParser.parseCST(VALID_OPENSCAD_CODE);
    }).rejects.toThrow('Parser not initialized');
  });
});
