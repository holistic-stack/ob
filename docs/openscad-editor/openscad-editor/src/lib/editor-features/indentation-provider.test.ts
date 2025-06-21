/**
 * @file Tests for Smart Indentation Provider
 * 
 * Tests the OpenSCAD indentation provider functionality including:
 * - New line indentation
 * - Closing bracket alignment
 * - Context-aware indentation
 * - Configuration handling
 */

import { OpenSCADIndentationProvider, IndentationAction, DEFAULT_INDENTATION_CONFIG } from './indentation-provider';
import { OpenSCADParserService } from '../services/openscad-parser-service';
import * as monaco from 'monaco-editor';

// Mock Monaco editor
const createMockTextModel = (lines: string[]): monaco.editor.ITextModel => ({
  getValue: () => lines.join('\n'),
  getLineCount: () => lines.length,
  getLineContent: (lineNumber: number) => lines[lineNumber - 1] || '',
  getPositionAt: (offset: number) => ({ lineNumber: 1, column: offset + 1 }),
  getOffsetAt: (position: monaco.IPosition) => position.column - 1,
  uri: monaco.Uri.parse('test://test.scad'),
  id: 'test-model',
  isDisposed: () => false
} as any);

const createMockPosition = (lineNumber: number, column: number): monaco.Position => ({
  lineNumber,
  column
} as monaco.Position);

const createMockFormattingOptions = (): monaco.languages.FormattingOptions => ({
  tabSize: 2,
  insertSpaces: true
});

const createMockCancellationToken = (): monaco.CancellationToken => ({
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => {} })
} as any);

describe('OpenSCADIndentationProvider', () => {
  let parserService: OpenSCADParserService;
  let indentationProvider: OpenSCADIndentationProvider;

  beforeEach(async () => {
    parserService = new OpenSCADParserService();
    await parserService.init('/tree-sitter-openscad.wasm');
    indentationProvider = new OpenSCADIndentationProvider(parserService);
  });

  afterEach(() => {
    parserService.dispose();
  });

  describe('New Line Indentation', () => {
    it('should increase indentation after opening braces', async () => {
      const lines = [
        'module test() {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('  '); // 2 spaces indentation
    });

    it('should increase indentation after module definitions', async () => {
      const lines = [
        'module complex_module(param1, param2) {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('  ');
    });

    it('should increase indentation after function definitions', async () => {
      const lines = [
        'function calculate(x, y) =',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('  ');
    });

    it('should increase indentation after control structures', async () => {
      const lines = [
        '  if (condition) {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('    '); // Previous indent + new indent
    });

    it('should increase indentation after for loops', async () => {
      const lines = [
        '  for (i = [0:10]) {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('    ');
    });

    it('should maintain indentation for regular lines', async () => {
      const lines = [
        '  cube([10, 10, 10]);',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      // Should maintain the same indentation level
      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('  ');
    });
  });

  describe('Closing Bracket Alignment', () => {
    it('should align closing braces with opening braces', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '    }' // Incorrectly indented
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(3, 5);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '}', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe(''); // Should align with module line (no indentation)
    });

    it('should align closing parentheses correctly', async () => {
      const lines = [
        'function complex(',
        '  param1,',
        '  param2',
        '    )' // Incorrectly indented
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(4, 5);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, ')', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe(''); // Should align with function line
    });

    it('should align closing brackets correctly', async () => {
      const lines = [
        'points = [',
        '  [0, 0, 0],',
        '  [10, 10, 10]',
        '    ]' // Incorrectly indented
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(4, 5);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, ']', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe(''); // Should align with points line
    });

    it('should not modify correctly aligned closing brackets', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '}' // Correctly aligned
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(3, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '}', options, token
      );

      expect(edits).toHaveLength(0); // No changes needed
    });
  });

  describe('Configuration', () => {
    it('should respect tab size configuration', async () => {
      const customProvider = new OpenSCADIndentationProvider(parserService, {
        tabSize: 4,
        insertSpaces: true
      });

      const lines = [
        'module test() {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = { tabSize: 4, insertSpaces: true };
      const token = createMockCancellationToken();

      const edits = await customProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('    '); // 4 spaces
    });

    it('should respect tab character configuration', async () => {
      const customProvider = new OpenSCADIndentationProvider(parserService, {
        tabSize: 1,
        insertSpaces: false
      });

      const lines = [
        'module test() {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = { tabSize: 1, insertSpaces: false };
      const token = createMockCancellationToken();

      const edits = await customProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(1);
      expect(edits[0].text).toBe('\t'); // Tab character
    });

    it('should allow disabling indentation on type', async () => {
      const customProvider = new OpenSCADIndentationProvider(parserService, {
        indentOnType: false
      });

      const lines = [
        'module test() {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(2, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await customProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(0); // No edits when disabled
    });

    it('should allow configuration updates', () => {
      const initialConfig = indentationProvider.getConfig();
      expect(initialConfig.tabSize).toBe(2);

      indentationProvider.updateConfig({ tabSize: 4 });
      
      const updatedConfig = indentationProvider.getConfig();
      expect(updatedConfig.tabSize).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty lines gracefully', async () => {
      const lines = [''];
      const model = createMockTextModel(lines);
      const position = createMockPosition(1, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(edits).toHaveLength(0);
    });

    it('should handle first line correctly', async () => {
      const lines = [
        'module test() {',
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(1, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      // Should not crash on first line
      expect(Array.isArray(edits)).toBe(true);
    });

    it('should handle unmatched brackets gracefully', async () => {
      const lines = [
        'module test() {',
        '  cube([10, 10, 10]);',
        '}' // This closing brace
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(3, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      // Try to format a closing bracket that doesn't have a clear match
      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, ')', options, token
      );

      expect(Array.isArray(edits)).toBe(true);
    });

    it('should handle mixed indentation gracefully', async () => {
      const lines = [
        'module test() {',
        '\t  cube([10, 10, 10]);', // Mixed tabs and spaces
        ''
      ];
      const model = createMockTextModel(lines);
      const position = createMockPosition(3, 1);
      const options = createMockFormattingOptions();
      const token = createMockCancellationToken();

      const edits = await indentationProvider.provideOnTypeFormattingEdits(
        model, position, '\n', options, token
      );

      expect(Array.isArray(edits)).toBe(true);
    });
  });

  describe('Trigger Characters', () => {
    it('should define correct trigger characters', () => {
      expect(indentationProvider.autoFormatTriggerCharacters).toContain('\n');
      expect(indentationProvider.autoFormatTriggerCharacters).toContain('}');
      expect(indentationProvider.autoFormatTriggerCharacters).toContain(')');
      expect(indentationProvider.autoFormatTriggerCharacters).toContain(']');
      expect(indentationProvider.autoFormatTriggerCharacters).toContain(';');
    });
  });

  describe('Factory Function', () => {
    it('should create indentation provider with default config', async () => {
      const { createIndentationProvider } = await import('./indentation-provider');
      const provider = createIndentationProvider(parserService);

      expect(provider).toBeInstanceOf(OpenSCADIndentationProvider);
      expect(provider.getConfig()).toEqual(DEFAULT_INDENTATION_CONFIG);
    });

    it('should create indentation provider with custom config', async () => {
      const { createIndentationProvider } = await import('./indentation-provider');
      const customConfig = { tabSize: 4 };
      const provider = createIndentationProvider(parserService, customConfig);

      expect(provider).toBeInstanceOf(OpenSCADIndentationProvider);
      expect(provider.getConfig().tabSize).toBe(4);
    });
  });
});
