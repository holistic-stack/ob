/**
 * @file Enhanced Completion Provider Tests
 * @description Comprehensive tests for the Enhanced Code Completion Provider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  EnhancedCompletionProvider,
  createEnhancedCompletionProvider,
  DEFAULT_ENHANCED_COMPLETION_CONFIG,
  type EnhancedCompletionConfig
} from './enhanced-completion-provider';
import type { OpenscadParser, SymbolInfo, ASTNode } from '@holistic-stack/openscad-parser';

// Mock Monaco types for testing
const createMockModel = (content: string[]): monaco.editor.ITextModel => ({
  getLineContent: vi.fn((lineNumber: number) => content[lineNumber - 1] || ''),
  getLinesContent: vi.fn(() => content),
  getWordAtPosition: vi.fn((position: monaco.Position) => {
    const line = content[position.lineNumber - 1] || '';
    const beforeCursor = line.substring(0, position.column - 1);
    const match = beforeCursor.match(/\w+$/);
    return match ? { word: match[0], startColumn: position.column - match[0].length, endColumn: position.column } : null;
  })
} as any);

const createMockPosition = (lineNumber: number, column: number): monaco.Position => ({
  lineNumber,
  column
} as monaco.Position);

// Mock parser for testing
const createMockParser = (): OpenscadParser => ({
  init: vi.fn(),
  dispose: vi.fn(),
  parse: vi.fn(),
  getSymbols: vi.fn()
} as any);

// Mock AST and symbols for testing
const createMockAST = (): ASTNode[] => [];
const createMockSymbols = (symbols: SymbolInfo[] = []): SymbolInfo[] => symbols;

describe('EnhancedCompletionProvider', () => {
  let provider: EnhancedCompletionProvider;
  let mockParser: OpenscadParser;
  let mockModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParser = createMockParser();
    provider = new EnhancedCompletionProvider(mockParser);
    mockModel = createMockModel(['cube(10);', 'sphere(5);', 'module test() {}']);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const defaultProvider = new EnhancedCompletionProvider(mockParser);
      expect(defaultProvider).toBeInstanceOf(EnhancedCompletionProvider);
    });

    it('should create provider with custom configuration', () => {
      const customConfig: EnhancedCompletionConfig = {
        ...DEFAULT_ENHANCED_COMPLETION_CONFIG,
        maxSuggestions: 25,
        debounceMs: 200
      };
      const customProvider = new EnhancedCompletionProvider(mockParser, customConfig);
      expect(customProvider).toBeInstanceOf(EnhancedCompletionProvider);
    });

    it('should create provider using factory function', () => {
      const factoryProvider = createEnhancedCompletionProvider(mockParser);
      expect(factoryProvider).toBeInstanceOf(EnhancedCompletionProvider);
    });

    it('should create provider with partial config using factory', () => {
      const factoryProvider = createEnhancedCompletionProvider(mockParser, {
        maxSuggestions: 30
      });
      expect(factoryProvider).toBeInstanceOf(EnhancedCompletionProvider);
    });
  });

  describe('AST and Symbol Updates', () => {
    it('should update AST and symbols successfully', () => {
      const mockSymbols: SymbolInfo[] = [
        { name: 'myModule', kind: 'module', parameters: [{ name: 'size', value: undefined }], loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 10, offset: 9 } } },
        { name: 'myFunction', kind: 'function', parameters: [{ name: 'x', value: undefined }, { name: 'y', value: undefined }], loc: { start: { line: 2, column: 1, offset: 20 }, end: { line: 2, column: 15, offset: 34 } } }
      ];
      const ast = createMockAST();

      expect(() => provider.updateAST(ast, mockSymbols)).not.toThrow();
    });

    it('should clear cache when AST is updated', async () => {
      const position = createMockPosition(1, 5);

      // First call to populate cache
      await provider.provideCompletionItems(mockModel, position);

      // Update AST (should clear cache)
      const ast = createMockAST();
      provider.updateAST(ast, []);

      // Second call should work without issues
      const result = await provider.provideCompletionItems(mockModel, position);
      expect(result).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('Built-in Completions', () => {
    it('should provide built-in cube completion', async () => {
      const position = createMockPosition(1, 3); // Position after "cu"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'cu', startColumn: 1, endColumn: 3 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      expect(result.suggestions).toBeDefined();
      const cubeCompletion = result.suggestions.find(item => item.label === 'cube');
      expect(cubeCompletion).toBeDefined();
      expect(cubeCompletion?.insertText).toBe('cube(${1:size})');
    });

    it('should provide built-in sphere completion', async () => {
      const position = createMockPosition(1, 3); // Position after "sp"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'sp', startColumn: 1, endColumn: 3 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      const sphereCompletion = result.suggestions.find(item => item.label === 'sphere');
      expect(sphereCompletion).toBeDefined();
      expect(sphereCompletion?.insertText).toBe('sphere(${1:r})');
    });

    it('should provide transformation completions', async () => {
      const position = createMockPosition(1, 3); // Position after "tr"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'tr', startColumn: 1, endColumn: 3 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      const translateCompletion = result.suggestions.find(item => item.label === 'translate');
      expect(translateCompletion).toBeDefined();
      expect(translateCompletion?.insertText).toBe('translate([${1:x}, ${2:y}, ${3:z}])');
    });

    it('should provide control structure completions', async () => {
      const position = createMockPosition(1, 3); // Position after "fo"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'fo', startColumn: 1, endColumn: 3 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      const forCompletion = result.suggestions.find(item => item.label === 'for');
      expect(forCompletion).toBeDefined();
      expect(forCompletion?.insertText).toContain('for (${1:i} = [${2:start}:${3:end}])');
    });
  });

  describe('User-defined Symbol Completions', () => {
    it('should provide user-defined module completions', async () => {
      const mockSymbols: SymbolInfo[] = [
        { name: 'myCustomModule', kind: 'module', parameters: [{ name: 'width', value: undefined }, { name: 'height', value: undefined }], loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 20, offset: 19 } } }
      ];
      const ast = createMockAST();
      provider.updateAST(ast, mockSymbols);

      const position = createMockPosition(1, 3); // Position after "my"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'my', startColumn: 1, endColumn: 3 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      const moduleCompletion = result.suggestions.find(item => item.label === 'myCustomModule');
      expect(moduleCompletion).toBeDefined();
      expect(moduleCompletion?.insertText).toBe('myCustomModule(${1:width}, ${2:height})');
      expect(moduleCompletion?.category).toBe('user-defined');
    });

    it('should provide user-defined function completions', async () => {
      const mockSymbols: SymbolInfo[] = [
        { name: 'calculateArea', kind: 'function', parameters: [{ name: 'radius', value: undefined }], loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 15, offset: 14 } } }
      ];
      const ast = createMockAST();
      provider.updateAST(ast, mockSymbols);

      const position = createMockPosition(1, 4); // Position after "calc"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'calc', startColumn: 1, endColumn: 5 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      const functionCompletion = result.suggestions.find(item => item.label === 'calculateArea');
      expect(functionCompletion).toBeDefined();
      expect(functionCompletion?.insertText).toBe('calculateArea(${1:radius})');
    });

    it('should provide variable completions', async () => {
      const mockSymbols: SymbolInfo[] = [
        { name: 'boxWidth', kind: 'variable', loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 8, offset: 7 } } }
      ];
      const ast = createMockAST();
      provider.updateAST(ast, mockSymbols);

      const position = createMockPosition(1, 4); // Position after "box"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'box', startColumn: 1, endColumn: 4 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      const variableCompletion = result.suggestions.find(item => item.label === 'boxWidth');
      expect(variableCompletion).toBeDefined();
      expect(variableCompletion?.insertText).toBe('boxWidth');
    });
  });

  describe('Completion Filtering and Ranking', () => {
    it('should filter completions based on input', async () => {
      const position = createMockPosition(1, 6); // Position after "sphere"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'sphere', startColumn: 1, endColumn: 7 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      // Should include sphere but not cube
      const sphereCompletion = result.suggestions.find(item => item.label === 'sphere');
      const cubeCompletion = result.suggestions.find(item => item.label === 'cube');
      
      expect(sphereCompletion).toBeDefined();
      expect(cubeCompletion).toBeUndefined();
    });

    it('should prioritize exact matches', async () => {
      const mockSymbols: SymbolInfo[] = [
        { name: 'cube', kind: 'variable', loc: { start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 4, offset: 3 } } },
        { name: 'cubeSize', kind: 'variable', loc: { start: { line: 2, column: 1, offset: 10 }, end: { line: 2, column: 8, offset: 17 } } }
      ];
      const ast = createMockAST();
      provider.updateAST(ast, mockSymbols);

      const position = createMockPosition(1, 5); // Position after "cube"
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'cube', startColumn: 1, endColumn: 5 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      // Built-in cube should come first (exact match + builtin priority)
      expect(result.suggestions[0]?.label).toBe('cube');
    });

    it('should respect maxSuggestions configuration', async () => {
      const customConfig: EnhancedCompletionConfig = {
        ...DEFAULT_ENHANCED_COMPLETION_CONFIG,
        maxSuggestions: 5
      };
      const limitedProvider = new EnhancedCompletionProvider(mockParser, customConfig);

      const position = createMockPosition(1, 1); // Position at start
      mockModel.getWordAtPosition = vi.fn(() => ({ word: '', startColumn: 1, endColumn: 1 }));

      const result = await limitedProvider.provideCompletionItems(mockModel, position);
      
      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Create a model that throws an error
      const errorModel = {
        getLineContent: vi.fn(() => { throw new Error('Test error'); }),
        getLinesContent: vi.fn(() => []),
        getWordAtPosition: vi.fn(() => null)
      } as any;

      const position = createMockPosition(1, 1);
      
      const result = await provider.provideCompletionItems(errorModel, position);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toEqual([]);
    });

    it('should handle null parse result', async () => {
      // Don't set any parse result
      const position = createMockPosition(1, 1);
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'test', startColumn: 1, endColumn: 5 }));

      const result = await provider.provideCompletionItems(mockModel, position);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('Context Analysis', () => {
    it('should detect function context', async () => {
      const functionLine = 'function myFunc(param1, param2';
      mockModel = createMockModel([functionLine]);
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'param', startColumn: 20, endColumn: 25 }));

      const position = createMockPosition(1, 25);
      
      const result = await provider.provideCompletionItems(mockModel, position);
      
      expect(result).toBeDefined();
      // Context analysis should work without throwing errors
    });

    it('should detect module context', async () => {
      const moduleLine = 'module myModule(size, height';
      mockModel = createMockModel([moduleLine]);
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'height', startColumn: 23, endColumn: 29 }));

      const position = createMockPosition(1, 29);
      
      const result = await provider.provideCompletionItems(mockModel, position);
      
      expect(result).toBeDefined();
      // Context analysis should work without throwing errors
    });
  });

  describe('Caching', () => {
    it('should use cached results for identical contexts', async () => {
      const position = createMockPosition(1, 3);
      mockModel.getWordAtPosition = vi.fn(() => ({ word: 'cu', startColumn: 1, endColumn: 3 }));

      // First call
      const result1 = await provider.provideCompletionItems(mockModel, position);
      
      // Second call with same context
      const result2 = await provider.provideCompletionItems(mockModel, position);
      
      expect(result1.suggestions).toEqual(result2.suggestions);
    });
  });
});

describe('Default Configuration', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_ENHANCED_COMPLETION_CONFIG.enableBuiltinCompletion).toBe(true);
    expect(DEFAULT_ENHANCED_COMPLETION_CONFIG.enableUserDefinedCompletion).toBe(true);
    expect(DEFAULT_ENHANCED_COMPLETION_CONFIG.enableParameterHints).toBe(true);
    expect(DEFAULT_ENHANCED_COMPLETION_CONFIG.enableDocumentation).toBe(true);
    expect(DEFAULT_ENHANCED_COMPLETION_CONFIG.maxSuggestions).toBe(50);
    expect(DEFAULT_ENHANCED_COMPLETION_CONFIG.debounceMs).toBe(100);
  });
});
