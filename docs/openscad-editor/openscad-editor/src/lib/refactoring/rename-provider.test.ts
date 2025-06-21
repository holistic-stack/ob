/**
 * @file Tests for OpenSCAD Rename Provider
 * 
 * Comprehensive test suite for rename functionality including scope analysis,
 * conflict detection, and AST-based symbol resolution.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { OpenSCADRenameProvider, type RenameConfig } from './rename-provider';
import { type OpenSCADParserService } from '../services/openscad-parser-service';

// Mock implementations for testing
class MockParserService implements Partial<OpenSCADParserService> {
  isReady(): boolean {
    return true;
  }

  async parseDocument(code: string) {
    return {
      success: true,
      ast: [],
      errors: []
    };
  }

  getAST() {
    // Return a mock AST for testing
    return [];
  }
}

class MockSymbolProvider {
  getSymbols() {
    // Return mock symbols that include testVariable references
    return [
      {
        name: 'testVariable',
        kind: 'variable' as const,
        loc: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 12, offset: 12 }
        },
        scope: 'global'
      },
      {
        name: 'testVariable',
        kind: 'variable' as const,
        loc: {
          start: { line: 1, column: 5, offset: 22 },
          end: { line: 1, column: 17, offset: 34 }
        },
        scope: 'global'
      }
    ];
  }

  getSymbolAtPosition(ast: any[], position: any) {
    // Return a mock symbol for testing
    return {
      name: 'testVariable',
      kind: 'variable' as const,
      loc: {
        start: { line: 0, column: 0, offset: 0 },
        end: { line: 0, column: 12, offset: 12 }
      },
      scope: 'global'
    };
  }

  findSymbolDefinition() {
    return null;
  }

  findSymbolReferences(ast: any[], symbolName: string) {
    // Return mock references for testing
    return [
      {
        name: symbolName,
        kind: 'variable' as const,
        loc: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: symbolName.length, offset: symbolName.length }
        }
      },
      {
        name: symbolName,
        kind: 'variable' as const,
        loc: {
          start: { line: 2, column: 4, offset: 20 },
          end: { line: 2, column: 4 + symbolName.length, offset: 20 + symbolName.length }
        }
      }
    ];
  }
}

class MockPositionUtilities {
  findNodeAt() {
    return null;
  }

  getNodeRange() {
    return {
      start: { line: 0, column: 0, offset: 0 },
      end: { line: 0, column: 10, offset: 10 }
    };
  }

  isPositionInRange() {
    return true;
  }
}

describe('OpenSCADRenameProvider', () => {
  let renameProvider: OpenSCADRenameProvider;
  let mockParserService: MockParserService;
  let mockSymbolProvider: MockSymbolProvider;
  let mockPositionUtilities: MockPositionUtilities;
  let mockModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParserService = new MockParserService();
    mockSymbolProvider = new MockSymbolProvider();
    mockPositionUtilities = new MockPositionUtilities();

    renameProvider = new OpenSCADRenameProvider(
      mockParserService as OpenSCADParserService,
      mockSymbolProvider as any,
      mockPositionUtilities as any
    );

    // Create a mock Monaco model
    mockModel = {
      uri: monaco.Uri.parse('file:///test.scad'),
      getValue: () => 'testVariable = 10;\ncube(testVariable);',
      getLineLength: (line: number) => line === 1 ? 17 : 18,
      getVersionId: () => 1
    } as any;
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('prepareRename', () => {
    it('should prepare rename for valid symbol', async () => {
      const position = new monaco.Position(1, 5); // Position within 'testVariable'
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      const result = await renameProvider.prepareRename(mockModel, position, token);

      expect(result).toBeDefined();
      expect(result?.text).toBe('testVariable');
      expect(result?.range).toBeDefined();
    });

    it('should handle cancellation token', async () => {
      const position = new monaco.Position(1, 5);
      const token = { isCancellationRequested: true } as monaco.CancellationToken;

      const result = await renameProvider.prepareRename(mockModel, position, token);

      expect(result).toBeNull();
    });

    it('should throw error for invalid symbol position', async () => {
      // Mock symbol provider to return no symbol
      mockSymbolProvider.getSymbolAtPosition = () => undefined;

      const position = new monaco.Position(1, 5);
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      await expect(
        renameProvider.prepareRename(mockModel, position, token)
      ).rejects.toThrow('No symbol found at position');
    });
  });

  describe('provideRenameEdits', () => {
    it('should provide rename edits for valid symbol', async () => {
      const position = new monaco.Position(1, 5);
      const newName = 'newVariableName';
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      const result = await renameProvider.provideRenameEdits(mockModel, position, newName, token);

      expect(result).toBeDefined();
      expect(result?.edits).toHaveLength(2); // Two references in mock
      expect(result?.edits[0].textEdit.text).toBe(newName);
    });

    it('should handle cancellation token', async () => {
      const position = new monaco.Position(1, 5);
      const newName = 'newVariableName';
      const token = { isCancellationRequested: true } as monaco.CancellationToken;

      const result = await renameProvider.provideRenameEdits(mockModel, position, newName, token);

      expect(result).toBeNull();
    });

    it('should reject reserved keywords', async () => {
      const position = new monaco.Position(1, 5);
      const newName = 'module'; // Reserved keyword
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      const result = await renameProvider.provideRenameEdits(mockModel, position, newName, token);

      expect(result).toBeNull(); // Should be rejected due to validation
    });

    it('should reject invalid identifiers', async () => {
      const position = new monaco.Position(1, 5);
      const newName = '123invalid'; // Invalid identifier
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      const result = await renameProvider.provideRenameEdits(mockModel, position, newName, token);

      expect(result).toBeNull(); // Should be rejected due to validation
    });
  });

  describe('validation', () => {
    it('should validate valid identifier names', async () => {
      const validNames = ['validName', 'valid_name', '_validName', 'valid123'];
      
      for (const name of validNames) {
        const position = new monaco.Position(1, 5);
        const token = { isCancellationRequested: false } as monaco.CancellationToken;

        const result = await renameProvider.provideRenameEdits(mockModel, position, name, token);
        expect(result).toBeDefined();
      }
    });

    it('should reject reserved OpenSCAD keywords', async () => {
      const reservedNames = ['module', 'function', 'if', 'else', 'for', 'cube', 'sphere'];
      
      for (const name of reservedNames) {
        const position = new monaco.Position(1, 5);
        const token = { isCancellationRequested: false } as monaco.CancellationToken;

        const result = await renameProvider.provideRenameEdits(mockModel, position, name, token);
        expect(result).toBeNull();
      }
    });

    it('should reject invalid identifier formats', async () => {
      const invalidNames = ['123invalid', 'invalid-name', 'invalid.name', 'invalid name'];
      
      for (const name of invalidNames) {
        const position = new monaco.Position(1, 5);
        const token = { isCancellationRequested: false } as monaco.CancellationToken;

        const result = await renameProvider.provideRenameEdits(mockModel, position, name, token);
        expect(result).toBeNull();
      }
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customConfig: Partial<RenameConfig> = {
        enableScopeValidation: false,
        enableConflictDetection: false,
        maxReferences: 50
      };

      const customProvider = new OpenSCADRenameProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockPositionUtilities as any,
        customConfig
      );

      expect(customProvider).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle parser service errors gracefully', async () => {
      // Mock parser service to not be ready
      mockParserService.isReady = () => false;

      const position = new monaco.Position(1, 5);
      const newName = 'newName';
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      const result = await renameProvider.provideRenameEdits(mockModel, position, newName, token);

      expect(result).toBeNull();
    });

    it('should handle symbol provider errors gracefully', async () => {
      // Mock symbol provider to throw error
      mockSymbolProvider.getSymbolAtPosition = () => {
        throw new Error('Symbol provider error');
      };

      const position = new monaco.Position(1, 5);
      const newName = 'newName';
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      const result = await renameProvider.provideRenameEdits(mockModel, position, newName, token);

      expect(result).toBeNull();
    });
  });

  describe('scope analysis', () => {
    it('should handle different symbol kinds', async () => {
      const symbolKinds = ['variable', 'function', 'module', 'parameter'] as const;
      
      for (const kind of symbolKinds) {
        mockSymbolProvider.getSymbolAtPosition = () => ({
          name: 'testSymbol',
          kind,
          loc: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 10, offset: 10 }
          },
          scope: 'global'
        });

        const position = new monaco.Position(1, 5);
        const token = { isCancellationRequested: false } as monaco.CancellationToken;

        const result = await renameProvider.prepareRename(mockModel, position, token);
        expect(result).toBeDefined();
      }
    });

    it('should reject renaming constants', async () => {
      mockSymbolProvider.getSymbolAtPosition = () => ({
        name: 'PI',
        kind: 'constant' as const,
        loc: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 2, offset: 2 }
        },
        scope: 'global'
      });

      const position = new monaco.Position(1, 5);
      const token = { isCancellationRequested: false } as monaco.CancellationToken;

      await expect(
        renameProvider.prepareRename(mockModel, position, token)
      ).rejects.toThrow('Cannot rename constant: PI');
    });
  });
});
