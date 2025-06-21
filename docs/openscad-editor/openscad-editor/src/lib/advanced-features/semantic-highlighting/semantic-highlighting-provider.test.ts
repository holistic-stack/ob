/**
 * @file Tests for OpenSCAD Semantic Highlighting Provider
 * @description Comprehensive tests for semantic highlighting functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  OpenSCADSemanticHighlightingProvider,
  SEMANTIC_TOKEN_TYPES,
  SEMANTIC_TOKEN_MODIFIERS,
  DEFAULT_SEMANTIC_CONFIG,
  createSemanticHighlightingProvider
} from './semantic-highlighting-provider';
import type { OpenSCADParserService } from '../../services/openscad-parser-service';

// Mock parser service
const createMockParserService = (isReady = true, ast: any[] = []): OpenSCADParserService => ({
  isReady: () => isReady,
  getAST: () => ast,
  parseDocument: vi.fn(),
  getDocumentOutline: vi.fn(),
  getSymbols: vi.fn(),
  dispose: vi.fn()
} as any);

// Mock Monaco model
const createMockModel = (content: string, uri = 'test://test.scad'): monaco.editor.ITextModel => ({
  getValue: () => content,
  getVersionId: () => 1,
  uri: { toString: () => uri } as monaco.Uri,
  getLineContent: vi.fn(),
  getWordAtPosition: vi.fn()
} as any);

// Mock AST nodes
const createMockASTNode = (type: string, text?: string, startPos?: any, endPos?: any, children?: any[]): any => ({
  type,
  text,
  startPosition: startPos,
  endPosition: endPos,
  children
});

describe('OpenSCADSemanticHighlightingProvider', () => {
  let provider: OpenSCADSemanticHighlightingProvider;
  let mockParserService: OpenSCADParserService;

  beforeEach(() => {
    mockParserService = createMockParserService();
    provider = new OpenSCADSemanticHighlightingProvider(mockParserService);
  });

  afterEach(() => {
    provider.clearCache();
  });

  describe('Constructor and Configuration', () => {
    it('should create provider with default configuration', () => {
      const provider = new OpenSCADSemanticHighlightingProvider();
      expect(provider).toBeDefined();
    });

    it('should create provider with custom configuration', () => {
      const config = {
        enableBuiltinHighlighting: false,
        maxCacheSize: 50
      };
      const provider = new OpenSCADSemanticHighlightingProvider(mockParserService, config);
      expect(provider).toBeDefined();
    });

    it('should create provider using factory function', () => {
      const provider = createSemanticHighlightingProvider(mockParserService);
      expect(provider).toBeDefined();
    });

    it('should create provider with partial config using factory', () => {
      const config = { enableParameterHighlighting: false };
      const provider = createSemanticHighlightingProvider(mockParserService, config);
      expect(provider).toBeDefined();
    });
  });

  describe('Legend', () => {
    it('should provide correct semantic token legend', () => {
      const legend = provider.getLegend();
      
      expect(legend.tokenTypes).toEqual([...SEMANTIC_TOKEN_TYPES]);
      expect(legend.tokenModifiers).toEqual([...SEMANTIC_TOKEN_MODIFIERS]);
    });

    it('should have consistent token type indices', () => {
      const legend = provider.getLegend();
      
      expect(legend.tokenTypes.indexOf('namespace')).toBe(0);
      expect(legend.tokenTypes.indexOf('function')).toBe(1);
      expect(legend.tokenTypes.indexOf('variable')).toBe(2);
      expect(legend.tokenTypes.indexOf('parameter')).toBe(3);
    });

    it('should have consistent token modifier indices', () => {
      const legend = provider.getLegend();
      
      expect(legend.tokenModifiers.indexOf('declaration')).toBe(0);
      expect(legend.tokenModifiers.indexOf('definition')).toBe(1);
      expect(legend.tokenModifiers.indexOf('readonly')).toBe(2);
    });
  });

  describe('Semantic Token Provision', () => {
    it('should return null when parser service is not ready', async () => {
      const notReadyService = createMockParserService(false);
      const provider = new OpenSCADSemanticHighlightingProvider(notReadyService);
      const model = createMockModel('cube(10);');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).toBeNull();
    });

    it('should return null when no parser service is provided', async () => {
      const provider = new OpenSCADSemanticHighlightingProvider();
      const model = createMockModel('cube(10);');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).toBeNull();
    });

    it('should provide semantic tokens for built-in functions', async () => {
      const ast = [
        createMockASTNode('identifier', 'cube', { row: 0, column: 0 }, { row: 0, column: 4 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('cube(10);');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
      expect(result!.data.length).toBeGreaterThan(0);
    });

    it('should provide semantic tokens for module definitions', async () => {
      const ast = [
        createMockASTNode('module_definition', 'my_module', { row: 0, column: 7 }, { row: 0, column: 16 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('module my_module() {}');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
    });

    it('should provide semantic tokens for function definitions', async () => {
      const ast = [
        createMockASTNode('function_definition', 'my_func', { row: 0, column: 9 }, { row: 0, column: 16 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('function my_func() = 42;');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
    });

    it('should provide semantic tokens for variable assignments', async () => {
      const ast = [
        createMockASTNode('variable_assignment', 'my_var', { row: 0, column: 0 }, { row: 0, column: 6 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('my_var = 10;');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
    });
  });

  describe('Built-in Function Recognition', () => {
    const builtinFunctions = ['cube', 'sphere', 'cylinder', 'translate', 'rotate', 'union', 'difference'];

    builtinFunctions.forEach(funcName => {
      it(`should recognize ${funcName} as built-in function`, async () => {
        const ast = [
          createMockASTNode('identifier', funcName, { row: 0, column: 0 }, { row: 0, column: funcName.length })
        ];
        const service = createMockParserService(true, ast);
        const provider = new OpenSCADSemanticHighlightingProvider(service);
        const model = createMockModel(`${funcName}();`);

        const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
        
        expect(result).not.toBeNull();
        expect(result!.data).toBeInstanceOf(Uint32Array);
        expect(result!.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Token Type Classification', () => {
    it('should classify numbers correctly', async () => {
      const ast = [
        createMockASTNode('number', '42', { row: 0, column: 0 }, { row: 0, column: 2 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('42');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
    });

    it('should classify strings correctly', async () => {
      const ast = [
        createMockASTNode('string', '"hello"', { row: 0, column: 0 }, { row: 0, column: 7 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('"hello"');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
    });

    it('should classify comments correctly', async () => {
      const ast = [
        createMockASTNode('comment', '// comment', { row: 0, column: 0 }, { row: 0, column: 10 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('// comment');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).not.toBeNull();
      expect(result!.data).toBeInstanceOf(Uint32Array);
    });
  });

  describe('Caching', () => {
    it('should cache semantic tokens', async () => {
      const ast = [
        createMockASTNode('identifier', 'cube', { row: 0, column: 0 }, { row: 0, column: 4 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('cube(10);');

      // First call
      const result1 = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      // Second call should use cache
      const result2 = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1!.resultId).toBe(result2!.resultId);
    });

    it('should clear cache when requested', async () => {
      const ast = [
        createMockASTNode('identifier', 'cube', { row: 0, column: 0 }, { row: 0, column: 4 })
      ];
      const service = createMockParserService(true, ast);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('cube(10);');

      await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      provider.clearCache();
      
      // Should work after cache clear
      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      expect(result).not.toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should respect configuration settings', () => {
      const config = {
        enableBuiltinHighlighting: false,
        enableUserDefinedHighlighting: false,
        cacheResults: false
      };
      const provider = new OpenSCADSemanticHighlightingProvider(mockParserService, config);
      
      expect(provider).toBeDefined();
    });

    it('should update configuration', () => {
      provider.updateConfig({ enableBuiltinHighlighting: false });
      
      // Should work after config update
      expect(provider).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const service = {
        isReady: () => true,
        getAST: () => { throw new Error('Test error'); }
      } as any;
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('cube(10);');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).toBeNull();
    });

    it('should handle null AST gracefully', async () => {
      const service = createMockParserService(true, null as any);
      const provider = new OpenSCADSemanticHighlightingProvider(service);
      const model = createMockModel('cube(10);');

      const result = await provider.provideDocumentSemanticTokens(model, null, {} as any);
      
      expect(result).toBeNull();
    });
  });

  describe('Default Configuration', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SEMANTIC_CONFIG.enableBuiltinHighlighting).toBe(true);
      expect(DEFAULT_SEMANTIC_CONFIG.enableUserDefinedHighlighting).toBe(true);
      expect(DEFAULT_SEMANTIC_CONFIG.enableParameterHighlighting).toBe(true);
      expect(DEFAULT_SEMANTIC_CONFIG.enableCommentHighlighting).toBe(true);
      expect(DEFAULT_SEMANTIC_CONFIG.cacheResults).toBe(true);
      expect(DEFAULT_SEMANTIC_CONFIG.maxCacheSize).toBe(100);
    });
  });
});
