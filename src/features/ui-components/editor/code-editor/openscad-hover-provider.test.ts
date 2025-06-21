/**
 * @file OpenSCAD Hover Provider Tests
 * 
 * Comprehensive test suite for the OpenSCAD hover provider following TDD methodology.
 * Tests cover function hover, constant hover, rich documentation, performance,
 * and edge cases for robust hover functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { createOpenSCADHoverProvider } from './openscad-hover-provider';

// Mock Monaco Editor types
const createMockModel = (content: string): monacoEditor.editor.ITextModel => ({
  getWordAtPosition: (position: monacoEditor.Position) => {
    const lines = content.split('\n');
    const line = lines[position.lineNumber - 1] || '';
    const beforeCursor = line.substring(0, position.column - 1);
    const afterCursor = line.substring(position.column - 1);
    
    // Enhanced word extraction logic for OpenSCAD (includes $ for special variables)
    const wordMatch = beforeCursor.match(/[\w$]+$/);
    const wordStart = wordMatch ? beforeCursor.length - wordMatch[0].length + 1 : position.column;
    const wordEndMatch = afterCursor.match(/^[\w$]*/);
    const wordEnd = wordEndMatch ? position.column + wordEndMatch[0].length : position.column;
    
    if (wordMatch || wordEndMatch) {
      const word = (wordMatch ? wordMatch[0] : '') + (wordEndMatch ? wordEndMatch[0] : '');
      return {
        word,
        startColumn: wordStart,
        endColumn: wordEnd
      };
    }
    
    return null;
  },
  getLineContent: (lineNumber: number) => {
    const lines = content.split('\n');
    return lines[lineNumber - 1] || '';
  },
  getValue: () => content,
  getLineCount: () => content.split('\n').length,
  dispose: vi.fn()
} as any);

const createMockPosition = (lineNumber: number, column: number): monacoEditor.Position => ({
  lineNumber,
  column,
  with: vi.fn(),
  delta: vi.fn(),
  equals: vi.fn(),
  isBefore: vi.fn(),
  isBeforeOrEqual: vi.fn(),
  clone: vi.fn(),
  toString: vi.fn()
} as any);

const createMockToken = (): monacoEditor.CancellationToken => ({
  isCancellationRequested: false,
  onCancellationRequested: vi.fn()
});

describe('OpenSCAD Hover Provider', () => {
  let provider: monacoEditor.languages.HoverProvider;
  let mockToken: monacoEditor.CancellationToken;

  beforeEach(() => {
    provider = createOpenSCADHoverProvider();
    mockToken = createMockToken();
  });

  describe('Provider Creation', () => {
    it('should create a valid hover provider', () => {
      expect(provider).toBeDefined();
      expect(provider.provideHover).toBeInstanceOf(Function);
    });
  });

  describe('Function Hover Documentation', () => {
    it('should provide hover documentation for cube function', () => {
      const model = createMockModel('cube(10);');
      const position = createMockPosition(1, 3); // Position on 'cube'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      expect(result!.contents).toHaveLength(1);
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('cube');
      expect(content.value).toContain('Creates a cube or rectangular prism');
      expect(content.value).toContain('size');
      expect(content.value).toContain('center');
      expect(content.value).toContain('Example:');
      expect(content.isTrusted).toBe(true);
    });

    it('should provide hover documentation for sphere function', () => {
      const model = createMockModel('sphere(r=10);');
      const position = createMockPosition(1, 4); // Position on 'sphere'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      expect(result!.contents).toHaveLength(1);
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('sphere');
      expect(content.value).toContain('Creates a sphere at the origin');
      expect(content.value).toContain('radius');
      expect(content.value).toContain('$fn');
    });

    it('should provide hover documentation for transformation functions', () => {
      const model = createMockModel('translate([10, 0, 0]) cube(5);');
      const position = createMockPosition(1, 5); // Position on 'translate'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('translate');
      expect(content.value).toContain('Translates (moves) child objects');
      expect(content.value).toContain('Translation vector');
    });

    it('should provide hover documentation for boolean operations', () => {
      const model = createMockModel('difference() { cube(10); sphere(8); }');
      const position = createMockPosition(1, 6); // Position on 'difference'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('difference');
      expect(content.value).toContain('Subtracts all child objects');
      expect(content.value).toContain('holes and cutouts');
    });

    it('should provide hover documentation for mathematical functions', () => {
      const model = createMockModel('x = abs(-5);');
      const position = createMockPosition(1, 6); // Position on 'abs'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('abs');
      expect(content.value).toContain('absolute value');
      expect(content.value).toContain('Returns:');
      expect(content.value).toContain('number');
    });
  });

  describe('Constant Hover Documentation', () => {
    it('should provide hover documentation for PI constant', () => {
      const model = createMockModel('rotate([0, 0, PI]) cube(10);');
      const position = createMockPosition(1, 14); // Position on 'PI'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('PI');
      expect(content.value).toContain('Mathematical constant');
      expect(content.value).toContain('3.14159');
    });

    it('should provide hover documentation for fragment constants', () => {
      const model = createMockModel('$fn = 50;');
      const position = createMockPosition(1, 2); // Position on '$fn'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('$fn');
      expect(content.value).toContain('Fragment number');
      expect(content.value).toContain('curved surfaces');
    });
  });

  describe('Rich Documentation Format', () => {
    it('should include function signature in hover documentation', () => {
      const model = createMockModel('cylinder(h=20, r=5);');
      const position = createMockPosition(1, 4); // Position on 'cylinder'
      
      const result = provider.provideHover(model, position, mockToken);
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('cylinder(h, r, d, r1, r2, center=false)');
      expect(content.value).toContain('```openscad');
    });

    it('should include parameter documentation with types', () => {
      const model = createMockModel('cube([10, 20, 30]);');
      const position = createMockPosition(1, 3); // Position on 'cube'
      
      const result = provider.provideHover(model, position, mockToken);
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('**Parameters:**');
      expect(content.value).toContain('`size`');
      expect(content.value).toContain('number | [number, number, number]');
      expect(content.value).toContain('*(optional)*');
      expect(content.value).toContain('*(default: false)*');
    });

    it('should include working code examples', () => {
      const model = createMockModel('rotate([45, 0, 0]) cube(10);');
      const position = createMockPosition(1, 4); // Position on 'rotate'
      
      const result = provider.provideHover(model, position, mockToken);
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('**Example:**');
      expect(content.value).toContain('```openscad');
      expect(content.value).toContain('rotate([0, 0, 45]) cube(10);');
    });

    it('should include return type for mathematical functions', () => {
      const model = createMockModel('result = sqrt(16);');
      const position = createMockPosition(1, 11); // Position on 'sqrt'
      
      const result = provider.provideHover(model, position, mockToken);
      
      const content = result!.contents[0] as monacoEditor.IMarkdownString;
      expect(content.value).toContain('**Returns:**');
      expect(content.value).toContain('`number`');
    });
  });

  describe('Hover Range and Position', () => {
    it('should provide correct hover range for function names', () => {
      const model = createMockModel('translate([10, 0, 0]) cube(5);');
      const position = createMockPosition(1, 5); // Position on 'translate'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      expect(result!.range).toBeDefined();
      expect(result!.range!.startLineNumber).toBe(1);
      expect(result!.range!.endLineNumber).toBe(1);
      expect(result!.range!.startColumn).toBeGreaterThan(0);
      expect(result!.range!.endColumn).toBeGreaterThan(result!.range!.startColumn);
    });

    it('should handle multi-line code correctly', () => {
      const model = createMockModel('difference() {\n  cube(10);\n  sphere(8);\n}');
      const position = createMockPosition(2, 4); // Position on 'cube' in second line
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeDefined();
      expect(result!.range!.startLineNumber).toBe(2);
      expect(result!.range!.endLineNumber).toBe(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return null for unknown functions', () => {
      const model = createMockModel('unknownFunction(10);');
      const position = createMockPosition(1, 8); // Position on 'unknownFunction'
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeNull();
    });

    it('should return null when no word at position', () => {
      const model = createMockModel('cube(10);');
      const position = createMockPosition(1, 6); // Position on '(' character
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeNull();
    });

    it('should handle empty model gracefully', () => {
      const model = createMockModel('');
      const position = createMockPosition(1, 1);
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeNull();
    });

    it('should handle position outside model bounds', () => {
      const model = createMockModel('cube(10);');
      const position = createMockPosition(5, 10); // Position beyond content
      
      const result = provider.provideHover(model, position, mockToken);
      
      expect(result).toBeNull();
    });
  });

  describe('Performance Requirements', () => {
    it('should provide hover documentation within performance threshold', () => {
      const model = createMockModel('cube(10);');
      const position = createMockPosition(1, 3);
      
      const startTime = performance.now();
      provider.provideHover(model, position, mockToken);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      // Should complete within 10ms for good user experience
      expect(duration).toBeLessThan(10);
    });

    it('should handle multiple hover requests efficiently', () => {
      const model = createMockModel('cube(10); sphere(5); cylinder(h=20, r=3);');
      const positions = [
        createMockPosition(1, 3),  // cube
        createMockPosition(1, 13), // sphere
        createMockPosition(1, 23)  // cylinder
      ];
      
      const startTime = performance.now();
      positions.forEach(pos => provider.provideHover(model, pos, mockToken));
      const endTime = performance.now();
      
      const averageTime = (endTime - startTime) / positions.length;
      expect(averageTime).toBeLessThan(5);
    });

    it('should handle large code files efficiently', () => {
      const largeCode = 'cube(10);\n'.repeat(1000) + 'sphere(5);';
      const model = createMockModel(largeCode);
      const position = createMockPosition(1001, 4); // Position on 'sphere' at end
      
      const startTime = performance.now();
      const result = provider.provideHover(model, position, mockToken);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(20);
      expect(result).toBeDefined();
    });
  });
});
