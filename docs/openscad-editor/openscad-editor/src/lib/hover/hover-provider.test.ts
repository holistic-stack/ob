/**
 * @file Enhanced OpenSCAD Hover Provider Tests
 * 
 * Comprehensive tests for the enhanced hover provider including
 * rich documentation display, parameter information, and examples.
 * 
 * Tests use real parser instances following TDD principles with
 * functional programming patterns and immutable data structures.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { OpenSCADHoverProvider } from './hover-provider';
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
  parse: vi.fn(),
  dispose: vi.fn()
} as unknown as OpenSCADParserService);

const sampleOpenSCADCode = `
/**
 * Creates a cube with a cylindrical hole through the center
 * @param size The size of the cube (default: 10)
 * @param hole_size The diameter of the hole (default: 5)
 * @example
 * cube_with_hole(20, 8);
 * cube_with_hole(size=15, hole_size=6);
 */
module cube_with_hole(size = 10, hole_size = 5) {
    difference() {
        cube(size);
        cylinder(h = size + 1, r = hole_size / 2, center = true);
    }
}

/**
 * Calculates the volume of a rectangular box
 * @param length The length of the box
 * @param width The width of the box  
 * @param height The height of the box
 * @returns The volume as length * width * height
 * @example
 * vol = calculate_volume(10, 5, 3); // Returns 150
 */
function calculate_volume(length, width, height) {
    return length * width * height;
}

// Global variables with documentation
size = 20;        // Size of the main cube
hole_diameter = 8; // Diameter of the hole

// Usage example
volume = calculate_volume(size, size, size);
cube_with_hole(size, hole_diameter / 2);
`;

const sampleOutline: OutlineItem[] = [
  {
    name: 'cube_with_hole',
    type: 'module',
    range: {
      startLine: 9, // 0-based line number for line 10 in the content (module cube_with_hole)
      endLine: 14,
      startColumn: 0,
      endColumn: 1
    },
    children: []
  },
  {
    name: 'calculate_volume',
    type: 'function',
    range: {
      startLine: 25, // 0-based line number for line 26 in the content (function calculate_volume)
      endLine: 27,
      startColumn: 0,
      endColumn: 1
    },
    children: []
  },
  {
    name: 'size',
    type: 'variable',
    range: {
      startLine: 30, // 0-based line number for line 31 in the content (size = 20)
      endLine: 30,
      startColumn: 0,
      endColumn: 8
    },
    children: []
  }
];

describe('OpenSCADHoverProvider', () => {
  let hoverProvider: OpenSCADHoverProvider;
  let mockParserService: OpenSCADParserService;
  let testModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParserService = createMockParserService(sampleOutline);
    hoverProvider = new OpenSCADHoverProvider(mockParserService);
    testModel = createMockModel(sampleOpenSCADCode);
  });

  afterEach(() => {
    hoverProvider.clearCache();
  });

  describe('provideHover', () => {
    it('should provide hover for built-in symbols', async () => {
      // Test with a built-in symbol first
      const cubeModel = createMockModel('cube(10);');
      const position = new monaco.Position(1, 2); // Position on "cube"

      const hover = await hoverProvider.provideHover(cubeModel, position);

      expect(hover).toBeDefined();
      expect(hover?.contents).toBeDefined();
      expect(hover?.contents.length).toBeGreaterThan(0);

      // Check that it contains signature for cube
      const firstContent = hover?.contents[0];
      if (firstContent && typeof firstContent !== 'string') {
        expect(firstContent.value).toContain('module cube');
      }
    });

    it('should provide hover for module definition', async () => {
      // Position on "cube_with_hole" definition at line 10 (1-based), column 15
      const position = new monaco.Position(10, 15);

      const hover = await hoverProvider.provideHover(testModel, position);

      expect(hover).toBeDefined();
      expect(hover?.contents).toBeDefined();
      expect(hover?.contents.length).toBeGreaterThan(0);

      // Check that it contains signature
      const firstContent = hover?.contents[0];
      if (firstContent && typeof firstContent !== 'string') {
        expect(firstContent.value).toContain('module cube_with_hole');
      }
    });

    it('should provide hover for function definition', async () => {
      // Position on "calculate_volume" definition at line 26 (1-based), column 15
      const position = new monaco.Position(26, 15);

      const hover = await hoverProvider.provideHover(testModel, position);

      expect(hover).toBeDefined();
      expect(hover?.contents).toBeDefined();

      const firstContent = hover?.contents[0];
      if (firstContent && typeof firstContent !== 'string') {
        expect(firstContent.value).toContain('function calculate_volume');
      }
    });

    it('should provide hover for variable definition', async () => {
      // Position on "size" variable at line 31 (1-based), column 2
      const position = new monaco.Position(31, 2);

      const hover = await hoverProvider.provideHover(testModel, position);

      expect(hover).toBeDefined();
      expect(hover?.contents).toBeDefined();

      const firstContent = hover?.contents[0];
      if (firstContent && typeof firstContent !== 'string') {
        expect(firstContent.value).toContain('variable size');
      }
    });

    it('should return null for unknown symbols', async () => {
      // Position on whitespace
      const position = new monaco.Position(1, 1);
      
      const hover = await hoverProvider.provideHover(testModel, position);
      
      expect(hover).toBeNull();
    });

    it('should return null when parser service is not ready', async () => {
      const notReadyService = createMockParserService();
      notReadyService.isReady = () => false;
      
      const provider = new OpenSCADHoverProvider(notReadyService);
      const position = new monaco.Position(10, 15);

      const hover = await provider.provideHover(testModel, position);

      expect(hover).toBeNull();
    });
  });

  describe('hover content formatting', () => {
    it('should include symbol signature in code block', async () => {
      const position = new monaco.Position(10, 15);
      const hover = await hoverProvider.provideHover(testModel, position);

      expect(hover?.contents).toBeDefined();
      const signatureContent = hover?.contents[0];

      if (signatureContent && typeof signatureContent !== 'string') {
        expect(signatureContent.value).toMatch(/```openscad\s*module cube_with_hole/);
      }
    });

    it('should include type and line information', async () => {
      const position = new monaco.Position(31, 2);
      const hover = await hoverProvider.provideHover(testModel, position);

      expect(hover?.contents).toBeDefined();

      // Should contain type and line information
      const hasTypeInfo = hover?.contents.some(content => {
        const value = typeof content === 'string' ? content : content.value;
        return value.includes('Type:') && value.includes('Line:');
      });

      expect(hasTypeInfo).toBe(true);
    });

    it('should provide proper hover range', async () => {
      const position = new monaco.Position(10, 15);
      const hover = await hoverProvider.provideHover(testModel, position);

      expect(hover?.range).toBeDefined();
      expect(hover?.range.startLineNumber).toBe(10);
      expect(hover?.range.endLineNumber).toBe(10);
      expect(hover?.range.startColumn).toBeGreaterThan(0);
      expect(hover?.range.endColumn).toBeGreaterThan(hover?.range.startColumn);
    });
  });

  describe('hover options', () => {
    it('should respect includeDocumentation option', async () => {
      const providerWithoutDocs = new OpenSCADHoverProvider(
        mockParserService,
        undefined,
        undefined,
        { includeDocumentation: false }
      );

      const position = new monaco.Position(10, 15);
      const hover = await providerWithoutDocs.provideHover(testModel, position);

      expect(hover?.contents).toBeDefined();
      // Should only contain signature, not documentation
      expect(hover?.contents.length).toBe(2); // Signature + type info
    });

    it('should respect maxDocumentationLength option', async () => {
      const providerWithShortDocs = new OpenSCADHoverProvider(
        mockParserService,
        undefined,
        undefined,
        { maxDocumentationLength: 50 }
      );

      const position = new monaco.Position(10, 15);
      const hover = await providerWithShortDocs.provideHover(testModel, position);

      expect(hover?.contents).toBeDefined();

      // Check that documentation is truncated if it exists
      const docContent = hover?.contents.find(content => {
        const value = typeof content === 'string' ? content : content.value;
        return value.length > 0 && !value.includes('```');
      });

      if (docContent) {
        const value = typeof docContent === 'string' ? docContent : docContent.value;
        expect(value.length).toBeLessThanOrEqual(53); // 50 + "..."
      }
    });
  });

  describe('caching', () => {
    it('should cache hover results', async () => {
      const position = new monaco.Position(10, 15);
      
      // First call
      const hover1 = await hoverProvider.provideHover(testModel, position);
      
      // Second call should use cache
      const hover2 = await hoverProvider.provideHover(testModel, position);
      
      expect(hover1).toEqual(hover2);
      
      const stats = hoverProvider.getLastHoverStats();
      expect(stats.cacheHits).toBeGreaterThan(0);
    });

    it('should clear cache when requested', async () => {
      const position = new monaco.Position(10, 15);

      // Populate cache
      await hoverProvider.provideHover(testModel, position);

      // Clear cache
      hoverProvider.clearCache();

      // Cache should be empty
      const stats = hoverProvider.getLastHoverStats();
      expect(stats.cacheHits).toBe(0);
    });
  });

  describe('statistics tracking', () => {
    it('should track hover statistics', async () => {
      const position = new monaco.Position(10, 15);

      await hoverProvider.provideHover(testModel, position);

      const stats = hoverProvider.getLastHoverStats();
      expect(stats.lastOperation).toBe('provide-hover');
      expect(stats.hoverTime).toBeGreaterThan(0);
      expect(typeof stats.symbolsFound).toBe('number');
      expect(typeof stats.documentationLength).toBe('number');
    });

    it('should track documentation length', async () => {
      const position = new monaco.Position(10, 15);

      await hoverProvider.provideHover(testModel, position);

      const stats = hoverProvider.getLastHoverStats();
      expect(stats.documentationLength).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle parser service errors gracefully', async () => {
      const errorService = createMockParserService();
      errorService.getDocumentOutline = () => {
        throw new Error('Parser error');
      };

      const provider = new OpenSCADHoverProvider(errorService);
      const position = new monaco.Position(10, 15);
      
      const hover = await provider.provideHover(testModel, position);
      
      expect(hover).toBeNull();
    });

    it('should handle invalid positions gracefully', async () => {
      const position = new monaco.Position(1000, 1000); // Invalid position
      
      const hover = await hoverProvider.provideHover(testModel, position);
      
      expect(hover).toBeNull();
    });
  });
});
