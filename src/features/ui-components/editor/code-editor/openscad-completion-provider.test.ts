/**
 * @file OpenSCAD Completion Provider Tests
 * 
 * Comprehensive test suite for the OpenSCAD completion provider following TDD methodology.
 * Tests cover function completion, snippet completion, parameter hints, documentation,
 * and context-aware suggestions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { createOpenSCADCompletionProvider } from './openscad-completion-provider';

// Mock Monaco Editor types
const createMockModel = (content: string): monacoEditor.editor.ITextModel => ({
  getWordUntilPosition: (position: monacoEditor.Position) => ({
    word: 'cu',
    startColumn: 1,
    endColumn: 3
  }),
  getValue: () => content,
  getLineContent: (lineNumber: number) => content.split('\n')[lineNumber - 1] || '',
  getLineCount: () => content.split('\n').length,
  getPositionAt: (offset: number) => ({ lineNumber: 1, column: offset + 1 }),
  getOffsetAt: (position: monacoEditor.Position) => position.column - 1,
  findMatches: vi.fn(() => []),
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

const createMockContext = (): monacoEditor.languages.CompletionContext => ({
  triggerKind: monacoEditor.languages.CompletionTriggerKind.Invoke
});

const createMockToken = (): monacoEditor.CancellationToken => ({
  isCancellationRequested: false,
  onCancellationRequested: vi.fn()
});

describe('OpenSCAD Completion Provider', () => {
  let provider: monacoEditor.languages.CompletionItemProvider;
  let mockModel: monacoEditor.editor.ITextModel;
  let mockPosition: monacoEditor.Position;
  let mockContext: monacoEditor.languages.CompletionContext;
  let mockToken: monacoEditor.CancellationToken;

  beforeEach(() => {
    provider = createOpenSCADCompletionProvider();
    mockModel = createMockModel('cube(10);');
    mockPosition = createMockPosition(1, 3);
    mockContext = createMockContext();
    mockToken = createMockToken();
  });

  describe('Provider Creation', () => {
    it('should create a valid completion provider', () => {
      expect(provider).toBeDefined();
      expect(provider.provideCompletionItems).toBeInstanceOf(Function);
      expect(provider.triggerCharacters).toEqual(['.', '(', '[', ' ']);
    });

    it('should have proper trigger characters for OpenSCAD', () => {
      expect(provider.triggerCharacters).toContain('.');
      expect(provider.triggerCharacters).toContain('(');
      expect(provider.triggerCharacters).toContain('[');
      expect(provider.triggerCharacters).toContain(' ');
    });
  });

  describe('Function Completion', () => {
    it('should provide completion for OpenSCAD primitive functions', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      expect(result).toBeDefined();
      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      // Check for primitive functions
      const cubeCompletion = suggestions.find(s => s.label === 'cube');
      expect(cubeCompletion).toBeDefined();
      expect(cubeCompletion!.kind).toBe(monacoEditor.languages.CompletionItemKind.Function);
      expect(cubeCompletion!.insertText).toContain('cube(');
      
      const sphereCompletion = suggestions.find(s => s.label === 'sphere');
      expect(sphereCompletion).toBeDefined();
      expect(sphereCompletion!.kind).toBe(monacoEditor.languages.CompletionItemKind.Function);
      
      const cylinderCompletion = suggestions.find(s => s.label === 'cylinder');
      expect(cylinderCompletion).toBeDefined();
      expect(cylinderCompletion!.kind).toBe(monacoEditor.languages.CompletionItemKind.Function);
    });

    it('should provide completion for OpenSCAD transformation functions', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      // Check for transformation functions
      const translateCompletion = suggestions.find(s => s.label === 'translate');
      expect(translateCompletion).toBeDefined();
      expect(translateCompletion!.kind).toBe(monacoEditor.languages.CompletionItemKind.Function);
      
      const rotateCompletion = suggestions.find(s => s.label === 'rotate');
      expect(rotateCompletion).toBeDefined();
      
      const scaleCompletion = suggestions.find(s => s.label === 'scale');
      expect(scaleCompletion).toBeDefined();
    });

    it('should provide completion for OpenSCAD boolean operations', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      // Check for boolean operations
      const unionCompletion = suggestions.find(s => s.label === 'union');
      expect(unionCompletion).toBeDefined();
      expect(unionCompletion!.kind).toBe(monacoEditor.languages.CompletionItemKind.Function);
      
      const differenceCompletion = suggestions.find(s => s.label === 'difference');
      expect(differenceCompletion).toBeDefined();
      
      const intersectionCompletion = suggestions.find(s => s.label === 'intersection');
      expect(intersectionCompletion).toBeDefined();
    });

    it('should provide completion for OpenSCAD mathematical functions', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      // Check for mathematical functions
      const absCompletion = suggestions.find(s => s.label === 'abs');
      expect(absCompletion).toBeDefined();
      expect(absCompletion!.kind).toBe(monacoEditor.languages.CompletionItemKind.Function);
      
      const cosCompletion = suggestions.find(s => s.label === 'cos');
      expect(cosCompletion).toBeDefined();
      
      const sinCompletion = suggestions.find(s => s.label === 'sin');
      expect(sinCompletion).toBeDefined();
      
      const sqrtCompletion = suggestions.find(s => s.label === 'sqrt');
      expect(sqrtCompletion).toBeDefined();
    });
  });

  describe('Snippet Completion', () => {
    it('should provide completion for OpenSCAD code snippets', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      // Check for code snippets
      const moduleSnippet = suggestions.find(s => s.label === 'Module Definition');
      expect(moduleSnippet).toBeDefined();
      expect(moduleSnippet!.kind).toBe(monacoEditor.languages.CompletionItemKind.Snippet);
      expect(moduleSnippet!.insertText).toContain('module');
      
      const functionSnippet = suggestions.find(s => s.label === 'Function Definition');
      expect(functionSnippet).toBeDefined();
      expect(functionSnippet!.kind).toBe(monacoEditor.languages.CompletionItemKind.Snippet);
      
      const forSnippet = suggestions.find(s => s.label === 'For Loop');
      expect(forSnippet).toBeDefined();
      expect(forSnippet!.kind).toBe(monacoEditor.languages.CompletionItemKind.Snippet);
    });

    it('should provide snippet completion with proper insert text rules', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      const moduleSnippet = suggestions.find(s => s.label === 'Module Definition');
      expect(moduleSnippet!.insertTextRules).toBe(
        monacoEditor.languages.CompletionItemInsertTextRule.InsertAsSnippet
      );
    });
  });

  describe('Documentation and Details', () => {
    it('should provide rich documentation for function completions', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      const cubeCompletion = suggestions.find(s => s.label === 'cube');
      expect(cubeCompletion!.documentation).toBeDefined();
      
      if (typeof cubeCompletion!.documentation === 'object') {
        expect(cubeCompletion!.documentation.value).toContain('Creates a cube');
        expect(cubeCompletion!.documentation.value).toContain('Parameters:');
        expect(cubeCompletion!.documentation.value).toContain('Example:');
      }
      
      expect(cubeCompletion!.detail).toContain('primitive');
    });

    it('should provide parameter information in function completions', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      const cylinderCompletion = suggestions.find(s => s.label === 'cylinder');
      expect(cylinderCompletion!.insertText).toContain('${1:h}');
      expect(cylinderCompletion!.insertText).toContain('${2:r}');
      
      if (typeof cylinderCompletion!.documentation === 'object') {
        expect(cylinderCompletion!.documentation.value).toContain('h');
        expect(cylinderCompletion!.documentation.value).toContain('Height of the cylinder');
      }
    });

    it('should categorize completions properly', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      const cubeCompletion = suggestions.find(s => s.label === 'cube');
      expect(cubeCompletion!.sortText).toContain('primitive');
      
      const translateCompletion = suggestions.find(s => s.label === 'translate');
      expect(translateCompletion!.sortText).toContain('transformation');
      
      const absCompletion = suggestions.find(s => s.label === 'abs');
      expect(absCompletion!.sortText).toContain('mathematical');
    });
  });

  describe('Completion Quality', () => {
    it('should provide a comprehensive set of completions', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      // Should have a good number of completions (functions + snippets)
      expect(suggestions.length).toBeGreaterThan(20);
      expect(suggestions.length).toBeLessThan(100); // Not overwhelming
    });

    it('should have proper completion item properties', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      const suggestions = Array.isArray(result) ? result : result!.suggestions;
      
      suggestions.forEach(suggestion => {
        expect(suggestion.label).toBeDefined();
        expect(suggestion.kind).toBeDefined();
        expect(suggestion.insertText).toBeDefined();
        expect(suggestion.range).toBeDefined();
        
        // Functions should have snippet insert text rules
        if (suggestion.kind === monacoEditor.languages.CompletionItemKind.Function ||
            suggestion.kind === monacoEditor.languages.CompletionItemKind.Snippet) {
          expect(suggestion.insertTextRules).toBe(
            monacoEditor.languages.CompletionItemInsertTextRule.InsertAsSnippet
          );
        }
      });
    });

    it('should not return incomplete results for basic completion', async () => {
      const result = await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );

      if (!Array.isArray(result)) {
        expect(result!.incomplete).toBe(false);
      }
    });
  });

  describe('Performance', () => {
    it('should provide completions within performance threshold', async () => {
      const startTime = performance.now();
      
      await provider.provideCompletionItems(
        mockModel,
        mockPosition,
        mockContext,
        mockToken
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 50ms for good user experience
      expect(duration).toBeLessThan(50);
    });

    it('should handle multiple completion requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() =>
        provider.provideCompletionItems(
          mockModel,
          mockPosition,
          mockContext,
          mockToken
        )
      );
      
      const startTime = performance.now();
      await Promise.all(requests);
      const endTime = performance.now();
      
      const averageTime = (endTime - startTime) / requests.length;
      expect(averageTime).toBeLessThan(20);
    });
  });
});
