import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cstTreeCursorWalkLog } from './cstTreeCursorWalkLog.js';
import { EnhancedOpenscadParser } from '../../enhanced-parser.js';
import { TreeCursor } from 'web-tree-sitter';


describe('cstTreeCursorWalkLog', () => {
  let parser: EnhancedOpenscadParser;
  let consoleSpy: any;

  beforeEach(async () => {
    consoleSpy = vi.spyOn(console, 'log');
    parser = new EnhancedOpenscadParser();
    await parser.init();
    console.log('Parser initialized successfully');
  });

  afterEach(() => {
    parser.dispose();
    consoleSpy.mockRestore();
  });

  // Helper to parse code and get tree cursor
  const parseCode = (code: string): TreeCursor => {
    const tree = parser.parse(code);
    if (!tree) {
      throw new Error('Failed to parse code');
    }
    return tree.walk();
  };

  // Helper to get all console output as a single string
  const getConsoleOutput = () => {
    return consoleSpy.mock.calls.map((call: any[]) => call[0]).join('\n');
  };

  // Helper to check if specific node types appear in the output in the correct order
  const verifyNodeSequence = (output: string, nodeTypes: string[]) => {
    let lastIndex = -1;
    for (const nodeType of nodeTypes) {
      const currentIndex = output.indexOf(nodeType);
      // Fix: Use separate expect statements without message parameter
      expect(currentIndex).toBeGreaterThan(-1);
      if (currentIndex === -1) {
        console.error(`Node type ${nodeType} not found in output`);
      }
      expect(currentIndex).toBeGreaterThan(lastIndex);
      if (currentIndex <= lastIndex) {
        console.error(`Node type ${nodeType} not in correct sequence`);
      }
      lastIndex = currentIndex;
    }
  };

  it('should log basic node information', () => {
    // Arrange
    const code = 'cube(10);';
    const cursor = parseCode(code);
    consoleSpy.mockClear();

    // Act
    cstTreeCursorWalkLog(cursor, code);

    // Assert
    const output = getConsoleOutput();

    // Verify root node is source_file
    expect(output).toContain('source_file');

    // Verify node position is logged correctly
    expect(output).toMatch(/\[\d+,\d+ → \d+,\d+\]/);

    // Verify node text is extracted
    expect(output).toContain('cube(10)');

    // Verify hierarchical structure with these node types in sequence
    verifyNodeSequence(output, ['source_file', 'statement', 'module_instantiation']);
  });

  it('should handle multi-line nodes correctly', () => {
    // Arrange
    const code = 'module test() {\n  cube(10);\n}';
    const cursor = parseCode(code);
    consoleSpy.mockClear();

    // Act
    cstTreeCursorWalkLog(cursor, code);

    // Assert
    const output = getConsoleOutput();

    // Should truncate multi-line content appropriately
    expect(output).toContain('module test()');
    expect(output).toMatch(/\.\.\./); // Ellipsis for truncated content

    // Verify hierarchical relationship between module and its body
    verifyNodeSequence(output, ['source_file', 'module_definition']);
  });

  it('should preserve cursor state after traversal', () => {
    // Arrange
    const code = 'cube(10);';
    const cursor = parseCode(code);

    // Record initial position
    const initialNodeType = cursor.nodeType;
    const initialFieldName = cursor.currentFieldName;
    const initialDepth = cursor.currentDepth;

    consoleSpy.mockClear();

    // Act
    cstTreeCursorWalkLog(cursor, code);

    // Assert - cursor should be back at its starting position
    expect(cursor.nodeType).toBe(initialNodeType);
    expect(cursor.currentFieldName).toBe(initialFieldName);
    expect(cursor.currentDepth).toBe(initialDepth);
  });

  it('should respect maxDepth parameter', () => {
    // Arrange
    const code = 'module test() {\n  cube(10);\n}';
    const cursor = parseCode(code);
    consoleSpy.mockClear();

    // Act - limit traversal to depth 1
    cstTreeCursorWalkLog(cursor, code, 1);

    // Assert
    const limitedOutput = getConsoleOutput();
    const limitedLineCount = limitedOutput.split('\n').length;

    // Now test with greater depth
    consoleSpy.mockClear();
    cstTreeCursorWalkLog(cursor, code);

    const fullOutput = getConsoleOutput();
    const fullLineCount = fullOutput.split('\n').length;

    // Full traversal should have at least as many lines as limited depth
    expect(fullLineCount).toBeGreaterThanOrEqual(limitedLineCount);
  });

  it('should handle null or undefined cursor gracefully', () => {
    // Should not throw errors
    expect(() => cstTreeCursorWalkLog(null, '')).not.toThrow();
    expect(() => cstTreeCursorWalkLog(undefined, '')).not.toThrow();
  });

  it('should truncate long text nodes appropriately', () => {
    // Arrange
    const longText = 'a'.repeat(100);
    const code = `echo("${longText}");`;
    const cursor = parseCode(code);
    consoleSpy.mockClear();

    // Act
    cstTreeCursorWalkLog(cursor, code);

    // Assert
    const output = getConsoleOutput();
    expect(output).toContain('...'); // Should truncate long strings
    expect(output).not.toContain(longText); // Full text shouldn't appear
  });

  it('should traverse complex nested structures', () => {
    // Arrange
    const complexCode = `
        module complex() {
          if (true) {
            for (i = [0:10]) {
              translate([i, 0, 0]) {
                cube(1);
              }
            }
          }
        }
      `;
    const cursor = parseCode(complexCode);
    consoleSpy.mockClear();

    // Act - just run the walkLog on the entire tree
    cstTreeCursorWalkLog(cursor, complexCode);

    // Assert
    const output = getConsoleOutput();

    // Check for presence of key structural elements
    expect(output).toContain('module_definition');
    expect(output).toContain('statement');

    // Check proper nesting depth by counting indentation levels
    const maxIndentLevel = Math.max(
      ...output.split('\n').map((line: string) => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      })
    );

    // Complex structure should have deep nesting
    expect(maxIndentLevel).toBeGreaterThan(10);
  });

  it('should correctly log transform statements', () => {
    // Arrange
    const code = 'translate([10, 20, 30]) cube(5);';
    const cursor = parseCode(code);
    consoleSpy.mockClear();

    // Act
    cstTreeCursorWalkLog(cursor, code);

    // Assert
    const output = getConsoleOutput();

    // Verify both translate and cube appear in the output
    expect(output).toContain('translate([10, 20, 30])');
    expect(output).toContain('cube(5)');

    // The transform should come before the object being transformed
    const translateIndex = output.indexOf('translate');
    const cubeIndex = output.indexOf('cube');
    expect(translateIndex).toBeLessThan(cubeIndex);
  });
});
