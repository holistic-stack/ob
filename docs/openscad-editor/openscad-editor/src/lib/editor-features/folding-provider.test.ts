/**
 * @file Tests for Enhanced Code Folding Provider
 * 
 * Tests the OpenSCAD folding provider functionality including:
 * - Module and function folding
 * - Control structure folding
 * - Block and comment folding
 * - Configuration and edge cases
 */

import { OpenSCADFoldingProvider, OpenSCADFoldingKind, DEFAULT_FOLDING_CONFIG } from './folding-provider';
import { OpenSCADParserService } from '../services/openscad-parser-service';
import * as monaco from 'monaco-editor';

// Mock Monaco editor
const createMockTextModel = (content: string): monaco.editor.ITextModel => ({
  getValue: () => content,
  getLineCount: () => content.split('\n').length,
  getLineContent: (lineNumber: number) => content.split('\n')[lineNumber - 1] || '',
  getPositionAt: (offset: number) => ({ lineNumber: 1, column: offset + 1 }),
  getOffsetAt: (position: monaco.IPosition) => position.column - 1,
  uri: monaco.Uri.parse('test://test.scad'),
  id: 'test-model',
  isDisposed: () => false
} as any);

const createMockFoldingContext = (): monaco.languages.FoldingContext => ({
  tabSize: 2,
  insertSpaces: true
} as any);

const createMockCancellationToken = (): monaco.CancellationToken => ({
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => {} })
} as any);

describe('OpenSCADFoldingProvider', () => {
  let parserService: OpenSCADParserService;
  let foldingProvider: OpenSCADFoldingProvider;

  beforeEach(async () => {
    parserService = new OpenSCADParserService();
    await parserService.init('/tree-sitter-openscad.wasm');
    foldingProvider = new OpenSCADFoldingProvider(parserService);
  });

  afterEach(() => {
    parserService.dispose();
  });

  describe('Module Folding', () => {
    it('should provide folding ranges for module definitions', async () => {
      const code = `
module test_module() {
  cube([10, 10, 10]);
  sphere(5);
}

module another_module() {
  cylinder(h=10, r=5);
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges).toHaveLength(2);
      expect(ranges[0].start).toBe(2); // module test_module() {
      expect(ranges[0].end).toBe(5);   // }
      expect(ranges[1].start).toBe(7); // module another_module() {
      expect(ranges[1].end).toBe(9);   // }
    });

    it('should extract symbol names for modules', async () => {
      const code = `
module named_module() {
  cube([5, 5, 5]);
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges).toHaveLength(1);
      // Note: symbolName is part of OpenSCADFoldingRange but not exposed in Monaco interface
      // This would be tested through the internal implementation
    });
  });

  describe('Function Folding', () => {
    it('should provide folding ranges for function definitions', async () => {
      const code = `
function calculate_area(width, height) = 
  width * height;

function complex_function(x, y) = 
  let(
    a = x + y,
    b = x - y
  ) a * b;`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges.length).toBeGreaterThanOrEqual(1);
      // Complex function should be foldable
      const complexFunctionRange = ranges.find(r => r.start >= 5);
      expect(complexFunctionRange).toBeDefined();
    });
  });

  describe('Control Structure Folding', () => {
    it('should provide folding ranges for if statements', async () => {
      const code = `
module test() {
  if (condition) {
    cube([10, 10, 10]);
    sphere(5);
  }
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges.length).toBeGreaterThanOrEqual(2); // module + if statement
    });

    it('should provide folding ranges for for loops', async () => {
      const code = `
module test() {
  for (i = [0:10]) {
    translate([i, 0, 0])
      cube([1, 1, 1]);
  }
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges.length).toBeGreaterThanOrEqual(2); // module + for loop
    });
  });

  describe('Block and Array Folding', () => {
    it('should provide folding ranges for block statements', async () => {
      const code = `
module test() {
  {
    cube([10, 10, 10]);
    sphere(5);
    cylinder(h=10, r=3);
  }
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges.length).toBeGreaterThanOrEqual(1); // At least the module
    });

    it('should provide folding ranges for large arrays', async () => {
      const code = `
points = [
  [0, 0, 0],
  [10, 0, 0],
  [10, 10, 0],
  [0, 10, 0]
];`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Comment Folding', () => {
    it('should provide folding ranges for multi-line comments', async () => {
      const code = `
/*
 * This is a multi-line comment
 * that spans several lines
 * and should be foldable
 */
module test() {
  cube([10, 10, 10]);
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges.length).toBeGreaterThanOrEqual(1);
      // Should include both comment and module folding
    });
  });

  describe('Configuration', () => {
    it('should respect folding configuration settings', async () => {
      const configuredProvider = new OpenSCADFoldingProvider(parserService, {
        enableModuleFolding: false,
        enableFunctionFolding: true,
        minimumFoldingLines: 5
      });

      const code = `
module small_module() {
  cube([10, 10, 10]);
}

function test_function() = 
  let(
    a = 10,
    b = 20,
    c = 30
  ) a + b + c;`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await configuredProvider.provideFoldingRanges(model, context, token);

      // Should not include module folding (disabled)
      // Should include function folding if it meets minimum lines requirement
      expect(ranges.length).toBeLessThanOrEqual(1);
    });

    it('should allow configuration updates', () => {
      const initialConfig = foldingProvider.getConfig();
      expect(initialConfig.enableModuleFolding).toBe(true);

      foldingProvider.updateConfig({ enableModuleFolding: false });
      
      const updatedConfig = foldingProvider.getConfig();
      expect(updatedConfig.enableModuleFolding).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty documents', async () => {
      const model = createMockTextModel('');
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      expect(ranges).toEqual([]);
    });

    it('should handle documents with syntax errors', async () => {
      const code = `
module broken_module( {
  cube([10, 10, 10]);
  // Missing closing parenthesis
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      // Should not crash and may still provide some folding ranges
      expect(Array.isArray(ranges)).toBe(true);
    });

    it('should handle very short code blocks', async () => {
      const code = `
module tiny() {
  cube(1);
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      // Should respect minimum folding lines configuration
      expect(ranges.length).toBeLessThanOrEqual(1);
    });

    it('should handle nested modules correctly', async () => {
      const code = `
module outer() {
  module inner() {
    cube([10, 10, 10]);
  }
  inner();
}`;

      const model = createMockTextModel(code);
      const context = createMockFoldingContext();
      const token = createMockCancellationToken();

      const ranges = await foldingProvider.provideFoldingRanges(model, context, token);

      // Should detect both outer and inner modules
      expect(ranges.length).toBe(2);

      // Sort ranges by start line for predictable testing
      const sortedRanges = ranges.sort((a, b) => a.start - b.start);

      // First range should be the outer module (lines 2-7)
      expect(sortedRanges[0].start).toBe(2);
      expect(sortedRanges[0].end).toBe(7);

      // Second range should be the inner module (lines 3-5)
      expect(sortedRanges[1].start).toBe(3);
      expect(sortedRanges[1].end).toBe(5);

      // Verify that nested folding is working correctly
      // The outer range should contain the inner range (this is expected for nested structures)
      const outerRange = sortedRanges[0]; // First range (2-7)
      const innerRange = sortedRanges[1]; // Second range (3-5)
      expect(outerRange.start).toBeLessThanOrEqual(innerRange.start);
      expect(outerRange.end).toBeGreaterThanOrEqual(innerRange.end);
    });
  });

  describe('Factory Function', () => {
    it('should create folding provider with default config', async () => {
      const { createFoldingProvider } = await import('./folding-provider');
      const provider = createFoldingProvider(parserService);

      expect(provider).toBeInstanceOf(OpenSCADFoldingProvider);
      expect(provider.getConfig()).toEqual(DEFAULT_FOLDING_CONFIG);
    });

    it('should create folding provider with custom config', async () => {
      const { createFoldingProvider } = await import('./folding-provider');
      const customConfig = { enableModuleFolding: false };
      const provider = createFoldingProvider(parserService, customConfig);

      expect(provider).toBeInstanceOf(OpenSCADFoldingProvider);
      expect(provider.getConfig().enableModuleFolding).toBe(false);
    });
  });
});
