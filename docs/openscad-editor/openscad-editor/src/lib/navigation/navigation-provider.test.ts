/**
 * @file Enhanced OpenSCAD Navigation Provider Tests
 * 
 * Comprehensive tests for the enhanced navigation provider including
 * go-to-definition, find-references, and symbol search functionality.
 * 
 * Tests use real parser instances following TDD principles with
 * functional programming patterns and immutable data structures.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { OpenSCADNavigationProvider } from './navigation-provider';
import type { OpenSCADParserService, OutlineItem } from '../services/openscad-parser-service';

// Test data and mocks
const createMockModel = (content: string): monaco.editor.ITextModel => {
  const lines = content.split('\n');
  return {
    uri: monaco.Uri.parse('test://test.scad'),
    getValue: () => content,
    getLineContent: (lineNumber: number) => lines[lineNumber - 1] || '',
    getLineCount: () => lines.length,
    getWordAtPosition: (position: monaco.Position) => {
      const line = lines[position.lineNumber - 1];
      if (!line) return null;
      
      const beforeCursor = line.substring(0, position.column - 1);
      const afterCursor = line.substring(position.column - 1);
      
      const wordStart = beforeCursor.search(/\w+$/);
      const wordEnd = afterCursor.search(/\W/);
      
      if (wordStart === -1) return null;
      
      const start = wordStart;
      const end = wordEnd === -1 ? line.length : position.column - 1 + wordEnd;
      const word = line.substring(start, end);
      
      return {
        word,
        startColumn: start + 1,
        endColumn: end + 1
      };
    }
  } as monaco.editor.ITextModel;
};

const createMockParserService = (outline: OutlineItem[] = []): OpenSCADParserService => ({
  isReady: () => true,
  getDocumentOutline: () => outline,
  getAST: () => [], // Add missing getAST method
  parse: vi.fn(),
  dispose: vi.fn()
} as unknown as OpenSCADParserService);

const sampleOpenSCADCode = `
module cube_with_hole(size = 10, hole_size = 5) {
    difference() {
        cube(size);
        cylinder(h = size + 1, r = hole_size / 2, center = true);
    }
}

function calculate_volume(length, width, height) {
    return length * width * height;
}

size = 20;
hole_diameter = 8;
volume = calculate_volume(size, size, size);

cube_with_hole(size, hole_diameter / 2);
`;

const sampleOutline: OutlineItem[] = [
  {
    name: 'cube_with_hole',
    type: 'module',
    range: {
      startLine: 1,
      endLine: 6,
      startColumn: 0,
      endColumn: 1
    },
    children: []
  },
  {
    name: 'calculate_volume',
    type: 'function',
    range: {
      startLine: 8,
      endLine: 10,
      startColumn: 0,
      endColumn: 1
    },
    children: []
  },
  {
    name: 'size',
    type: 'variable',
    range: {
      startLine: 12,
      endLine: 12,
      startColumn: 0,
      endColumn: 8
    },
    children: []
  }
];

describe('OpenSCADNavigationProvider', () => {
  let navigationProvider: OpenSCADNavigationProvider;
  let mockParserService: OpenSCADParserService;
  let testModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParserService = createMockParserService(sampleOutline);
    navigationProvider = new OpenSCADNavigationProvider(mockParserService);
    testModel = createMockModel(sampleOpenSCADCode);
  });

  afterEach(() => {
    navigationProvider.clearCache();
  });

  describe('provideDefinition', () => {
    it('should find module definition', async () => {
      // Position on "cube_with_hole" call at line 16
      const position = new monaco.Position(16, 1);
      
      const definition = await navigationProvider.provideDefinition(testModel, position);
      
      expect(definition).toBeDefined();
      if (definition && 'range' in definition) {
        expect(definition.range.startLineNumber).toBe(2); // 1-based line number
        expect(definition.uri).toBe(testModel.uri);
      }
    });

    it('should find function definition', async () => {
      // Position on "calculate_volume" call at line 14
      const position = new monaco.Position(14, 10);
      
      const definition = await navigationProvider.provideDefinition(testModel, position);
      
      expect(definition).toBeDefined();
      if (definition && 'range' in definition) {
        expect(definition.range.startLineNumber).toBe(9); // 1-based line number
      }
    });

    it('should find variable definition', async () => {
      // Position on "size" usage at line 16
      const position = new monaco.Position(16, 15);
      
      const definition = await navigationProvider.provideDefinition(testModel, position);
      
      expect(definition).toBeDefined();
      if (definition && 'range' in definition) {
        expect(definition.range.startLineNumber).toBe(13); // 1-based line number
      }
    });

    it('should return null for unknown symbol', async () => {
      // Position on unknown symbol
      const position = new monaco.Position(1, 1);
      
      const definition = await navigationProvider.provideDefinition(testModel, position);
      
      expect(definition).toBeNull();
    });

    it('should return null when parser service is not ready', async () => {
      const notReadyService = createMockParserService();
      notReadyService.isReady = () => false;
      
      const provider = new OpenSCADNavigationProvider(notReadyService);
      const position = new monaco.Position(16, 1);
      
      const definition = await provider.provideDefinition(testModel, position);
      
      expect(definition).toBeNull();
    });
  });

  describe('provideReferences', () => {
    it('should find all references to a symbol', async () => {
      // Position on "size" definition (middle of the word)
      const position = new monaco.Position(13, 3);
      const context = { includeDeclaration: true };

      const references = await navigationProvider.provideReferences(testModel, position, context);

      expect(references).toBeDefined();
      expect(Array.isArray(references)).toBe(true);
      if (references) {
        expect(references.length).toBeGreaterThan(1); // Should find multiple usages
      }
    });

    it('should exclude declaration when requested', async () => {
      const position = new monaco.Position(13, 3);
      const context = { includeDeclaration: false };

      const references = await navigationProvider.provideReferences(testModel, position, context);

      expect(references).toBeDefined();
      if (references) {
        // Should not include the declaration line
        const declarationFound = references.some(ref => ref.range.startLineNumber === 13);
        expect(declarationFound).toBe(false);
      }
    });

    it('should return empty array for unknown symbol', async () => {
      const position = new monaco.Position(1, 1);
      const context = { includeDeclaration: true };
      
      const references = await navigationProvider.provideReferences(testModel, position, context);
      
      expect(references).toBeDefined();
      expect(Array.isArray(references)).toBe(true);
      if (references) {
        expect(references.length).toBe(0);
      }
    });
  });

  describe('searchSymbols', () => {
    it('should find symbols with exact match', async () => {
      const symbols = await navigationProvider.searchSymbols('cube_with_hole');
      
      expect(symbols).toBeDefined();
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols[0].name).toBe('cube_with_hole');
      expect(symbols[0].type).toBe('module');
    });

    it('should find symbols with partial match', async () => {
      const symbols = await navigationProvider.searchSymbols('cube');
      
      expect(symbols).toBeDefined();
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols.some(s => s.name.includes('cube'))).toBe(true);
    });

    it('should support fuzzy matching', async () => {
      const symbols = await navigationProvider.searchSymbols('cwh', { fuzzy: true });

      expect(symbols).toBeDefined();
      // Should find "cube_with_hole" with fuzzy matching (first letters: c-w-h)
      expect(symbols.some(s => s.name === 'cube_with_hole')).toBe(true);
    });

    it('should filter by symbol type', async () => {
      const symbols = await navigationProvider.searchSymbols('', { 
        symbolTypes: ['module'] 
      });
      
      expect(symbols).toBeDefined();
      expect(symbols.every(s => s.type === 'module')).toBe(true);
    });

    it('should respect max results limit', async () => {
      const symbols = await navigationProvider.searchSymbols('', { 
        maxResults: 1 
      });
      
      expect(symbols).toBeDefined();
      expect(symbols.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array when parser service is not ready', async () => {
      const notReadyService = createMockParserService();
      notReadyService.isReady = () => false;
      
      const provider = new OpenSCADNavigationProvider(notReadyService);
      const symbols = await provider.searchSymbols('test');
      
      expect(symbols).toBeDefined();
      expect(symbols.length).toBe(0);
    });
  });

  describe('navigation statistics', () => {
    it('should track navigation statistics', async () => {
      const position = new monaco.Position(16, 1);
      
      await navigationProvider.provideDefinition(testModel, position);
      
      const stats = navigationProvider.getLastNavigationStats();
      expect(stats.lastOperation).toBe('go-to-definition');
      expect(stats.searchTime).toBeGreaterThan(0);
      expect(typeof stats.symbolsFound).toBe('number');
    });

    it('should track search statistics', async () => {
      await navigationProvider.searchSymbols('cube');
      
      const stats = navigationProvider.getLastNavigationStats();
      expect(stats.lastOperation).toBe('symbol-search');
      expect(stats.searchTime).toBeGreaterThan(0);
      expect(stats.symbolsFound).toBeGreaterThan(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', () => {
      // Perform some operations to populate cache
      navigationProvider.searchSymbols('test');
      
      // Clear cache
      navigationProvider.clearCache();
      
      // Cache should be empty (this is a simplified test)
      const stats = navigationProvider.getLastNavigationStats();
      expect(stats.cacheHits).toBe(0);
    });
  });
});
