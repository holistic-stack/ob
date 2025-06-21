/**
 * @file Tests for Enhanced OpenSCAD Completion Provider
 *
 * Tests the enhanced completion provider using real implementations
 * following the project's best practices of avoiding mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { OpenSCADCompletionProvider } from './completion-provider';
import { OpenSCADParserService } from '../services/openscad-parser-service';

// Helper to create Monaco text model
const createTextModel = (content: string): monaco.editor.ITextModel => {
  return monaco.editor.createModel(content, 'openscad');
};

// Helper to create Monaco position
const createPosition = (lineNumber: number, column: number): monaco.Position => {
  return new monaco.Position(lineNumber, column);
};

// Sample OpenSCAD code for testing
const SAMPLE_OPENSCAD_CODE = `
module test_module(size = 10, center = false) {
  cube([size, size, size], center);
}

my_var = 20;
test_module(my_var, true);
`;

const SIMPLE_CODE = 'cube(10);';

describe('Enhanced OpenSCAD Completion Provider', () => {
  let provider: OpenSCADCompletionProvider;
  let parserService: OpenSCADParserService;

  beforeEach(async () => {
    // Create real parser service instance
    parserService = new OpenSCADParserService();
    await parserService.init();

    // Create completion provider with real parser service
    // Symbol provider and position utilities are optional and will be undefined initially
    provider = new OpenSCADCompletionProvider(parserService);
  });

  afterEach(() => {
    // Clean up parser service
    parserService.dispose();
  });

  describe('Basic Functionality', () => {
    it('should create completion provider with enhanced APIs', () => {
      expect(provider).toBeInstanceOf(OpenSCADCompletionProvider);
      expect(provider.triggerCharacters).toEqual(['.', '(', '[', ' ']);
    });

    it('should provide completion stats', () => {
      const stats = provider.getLastCompletionStats();
      expect(stats).toHaveProperty('totalSuggestions');
      expect(stats).toHaveProperty('astSymbols');
      expect(stats).toHaveProperty('builtinSymbols');
      expect(stats).toHaveProperty('snippets');
      expect(stats).toHaveProperty('computeTime');
    });
  });

  describe('Enhanced Context Analysis', () => {
    it('should provide completions for basic OpenSCAD code', async () => {
      const model = createTextModel('module test() {\n  cube(10);\n}');
      const position = createPosition(2, 8); // Inside cube call

      const result = await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should skip completion in strings', async () => {
      const model = createTextModel('"test string with cube"');
      const position = createPosition(1, 15); // Inside string

      const result = await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      expect(result.suggestions).toHaveLength(0);
    });

    it('should skip completion in comments', async () => {
      const model = createTextModel('// comment with cube');
      const position = createPosition(1, 15); // Inside comment

      const result = await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('Symbol-based Completion', () => {
    it('should provide completions with parser service', async () => {
      // Parse some OpenSCAD code first
      await parserService.parseDocument(SAMPLE_OPENSCAD_CODE);

      const model = createTextModel('test');
      const position = createPosition(1, 5);

      const result = await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      // Should get some suggestions (built-ins at minimum)
      expect(result.suggestions.length).toBeGreaterThan(0);

      // Should include built-in symbols that start with 'test' or common ones
      const hasBuiltins = result.suggestions.some(s => {
        const label = typeof s.label === 'string' ? s.label : s.label.label;
        return label.startsWith('test') || label === 'translate' || label === 'cube';
      });
      expect(hasBuiltins).toBe(true);
    });

    it('should include built-in OpenSCAD symbols', async () => {
      const model = createTextModel('cu');
      const position = createPosition(1, 3);

      const result = await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      // Should include built-in symbols like 'cube'
      const cubeCompletion = result.suggestions.find(s => {
        const label = typeof s.label === 'string' ? s.label : s.label.label;
        return label === 'cube';
      });
      expect(cubeCompletion).toBeDefined();
    });

    it('should provide completions for empty input', async () => {
      const model = createTextModel('');
      const position = createPosition(1, 1);

      const result = await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      // Should still provide built-in completions
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Stats', () => {
    it('should track completion performance', async () => {
      const model = createTextModel('test');
      const position = createPosition(1, 5);

      await provider.provideCompletionItems(
        model,
        position,
        { triggerKind: monaco.languages.CompletionTriggerKind.Invoke }
      );

      const stats = provider.getLastCompletionStats();
      expect(stats.computeTime).toBeGreaterThan(0);
      expect(stats.totalSuggestions).toBeGreaterThan(0);
    });
  });

  describe('API Integration', () => {
    it('should have proper trigger characters', () => {
      expect(provider.triggerCharacters).toEqual(['.', '(', '[', ' ']);
    });

    it('should provide completion stats', () => {
      const stats = provider.getLastCompletionStats();
      expect(stats).toHaveProperty('totalSuggestions');
      expect(stats).toHaveProperty('astSymbols');
      expect(stats).toHaveProperty('builtinSymbols');
      expect(stats).toHaveProperty('snippets');
      expect(stats).toHaveProperty('computeTime');
    });
  });
});
