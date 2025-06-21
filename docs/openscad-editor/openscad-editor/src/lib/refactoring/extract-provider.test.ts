/**
 * @file Tests for OpenSCAD Extract Provider
 * 
 * Comprehensive test suite for extract functionality including variable extraction,
 * function extraction, and module extraction with parameter detection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { 
  OpenSCADExtractProvider, 
  ExtractActionKind,
  type ExtractConfig 
} from './extract-provider';
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
}

class MockSymbolProvider {
  getSymbols() {
    return [];
  }

  getSymbolAtPosition() {
    return undefined;
  }

  findSymbolsInRange() {
    return [];
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

  findNodesInRange() {
    return [];
  }
}

describe('OpenSCADExtractProvider', () => {
  let extractProvider: OpenSCADExtractProvider;
  let mockParserService: MockParserService;
  let mockSymbolProvider: MockSymbolProvider;
  let mockPositionUtilities: MockPositionUtilities;
  let mockModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParserService = new MockParserService();
    mockSymbolProvider = new MockSymbolProvider();
    mockPositionUtilities = new MockPositionUtilities();

    extractProvider = new OpenSCADExtractProvider(
      mockParserService as OpenSCADParserService,
      mockSymbolProvider as any,
      mockPositionUtilities as any
    );

    // Create a mock Monaco model
    mockModel = {
      uri: monaco.Uri.parse('file:///test.scad'),
      getValue: () => 'width = 10;\nheight = 20;\ncube([width, height, 5]);',
      getValueInRange: (range: monaco.IRange) => {
        // Mock implementation for different ranges
        if (range.startLineNumber === 3 && range.startColumn === 6) {
          return '[width, height, 5]'; // cube dimensions
        }
        if (range.startLineNumber === 1 && range.startColumn === 9) {
          return '10'; // width value
        }
        return 'selected_text';
      },
      getVersionId: () => 1
    } as any;
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('getExtractActions', () => {
    it('should return extract actions for valid selection', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 3,
        startColumn: 6,
        endLineNumber: 3,
        endColumn: 21
      };

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty selection', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      };

      // Mock empty selection
      mockModel.getValueInRange = () => '';

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return empty array for very short selection', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 2
      };

      // Mock very short selection
      mockModel.getValueInRange = () => 'x';

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('extract variable', () => {
    it('should create extract variable action', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 3,
        startColumn: 6,
        endLineNumber: 3,
        endColumn: 21
      };

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      const variableAction = result.data!.find(action => action.kind === ExtractActionKind.ExtractVariable);
      expect(variableAction).toBeDefined();
      expect(variableAction!.title).toContain('Extract to variable');
      expect(variableAction!.edit.edits).toHaveLength(2); // Declaration + replacement
    });

    it('should generate appropriate variable names', async () => {
      const testCases = [
        { text: '100', expectedPattern: /extracted_value|100/ },
        { text: 'width + height', expectedPattern: /width_height|extracted_value/ },
        { text: 'sin(angle)', expectedPattern: /sin_angle|extracted_value/ }
      ];

      for (const testCase of testCases) {
        mockModel.getValueInRange = () => testCase.text;

        const selection: monaco.IRange = {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: testCase.text.length + 1
        };

        const result = await extractProvider.getExtractActions(mockModel, selection);
        expect(result.success).toBe(true);

        const variableAction = result.data!.find(action => action.kind === ExtractActionKind.ExtractVariable);
        expect(variableAction).toBeDefined();
        expect(variableAction!.title).toMatch(testCase.expectedPattern);
      }
    });
  });

  describe('extract function', () => {
    it('should create extract function action for expressions', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 20
      };

      mockModel.getValueInRange = () => 'width * height * depth';

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      const functionAction = result.data!.find(action => action.kind === ExtractActionKind.ExtractFunction);
      expect(functionAction).toBeDefined();
      expect(functionAction!.title).toContain('Extract to function');
      expect(functionAction!.edit.edits).toHaveLength(2); // Definition + replacement
    });

    it('should infer parameters from expression', async () => {
      mockModel.getValueInRange = () => 'width * height + depth';

      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 22
      };

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      const functionAction = result.data!.find(action => action.kind === ExtractActionKind.ExtractFunction);
      expect(functionAction).toBeDefined();

      // Check that the function call includes parameters
      const replacementEdit = functionAction!.edit.edits.find(edit => 
        edit.textEdit.range.startLineNumber === selection.startLineNumber
      );
      expect(replacementEdit?.textEdit.text).toMatch(/\(.*\)/); // Should have parameters
    });
  });

  describe('extract module', () => {
    it('should create extract module action for geometry code', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 25
      };

      mockModel.getValueInRange = () => 'translate([x, y, z]) cube(size)';

      const result = await extractProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      const moduleAction = result.data!.find(action => action.kind === ExtractActionKind.ExtractModule);
      expect(moduleAction).toBeDefined();
      expect(moduleAction!.title).toContain('Extract to module');
      expect(moduleAction!.edit.edits).toHaveLength(2); // Definition + replacement
    });

    it('should detect geometry operations', async () => {
      const geometryExpressions = [
        'cube([10, 10, 10])',
        'sphere(r=5)',
        'translate([1, 2, 3]) cylinder(h=10, r=2)',
        'union() { cube(5); sphere(3); }'
      ];

      for (const expression of geometryExpressions) {
        mockModel.getValueInRange = () => expression;

        const selection: monaco.IRange = {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: expression.length + 1
        };

        const result = await extractProvider.getExtractActions(mockModel, selection);
        expect(result.success).toBe(true);

        const moduleAction = result.data!.find(action => action.kind === ExtractActionKind.ExtractModule);
        expect(moduleAction).toBeDefined();
      }
    });
  });

  describe('configuration', () => {
    it('should respect configuration settings', () => {
      const customConfig: Partial<ExtractConfig> = {
        enableVariableExtraction: false,
        enableFunctionExtraction: true,
        enableModuleExtraction: false,
        maxParameterCount: 5,
        minExpressionLength: 10
      };

      const customProvider = new OpenSCADExtractProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockPositionUtilities as any,
        customConfig
      );

      expect(customProvider).toBeDefined();
    });

    it('should filter actions based on configuration', async () => {
      const configWithOnlyVariable: Partial<ExtractConfig> = {
        enableVariableExtraction: true,
        enableFunctionExtraction: false,
        enableModuleExtraction: false
      };

      const limitedProvider = new OpenSCADExtractProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockPositionUtilities as any,
        configWithOnlyVariable
      );

      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10
      };

      mockModel.getValueInRange = () => 'test_expression';

      const result = await limitedProvider.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(1);
      expect(result.data![0].kind).toBe(ExtractActionKind.ExtractVariable);
    });
  });

  describe('parameter inference', () => {
    it('should infer parameters from complex expressions', async () => {
      const expressions = [
        'width * height * depth',
        'sin(angle) * radius',
        'translate([x, y, z]) rotate([rx, ry, rz])',
        'for (i = [0:count-1]) translate([i*spacing, 0, 0])'
      ];

      for (const expression of expressions) {
        mockModel.getValueInRange = () => expression;

        const selection: monaco.IRange = {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: expression.length + 1
        };

        const result = await extractProvider.getExtractActions(mockModel, selection);
        expect(result.success).toBe(true);

        // Should have function and/or module actions with parameters
        const actionsWithParams = result.data!.filter(action => 
          action.kind === ExtractActionKind.ExtractFunction || 
          action.kind === ExtractActionKind.ExtractModule
        );
        expect(actionsWithParams.length).toBeGreaterThan(0);
      }
    });
  });

  describe('error handling', () => {
    it('should handle parser service errors gracefully', async () => {
      // Mock parser service to not be ready
      mockParserService.isReady = () => false;

      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10
      };

      const result = await extractProvider.getExtractActions(mockModel, selection);

      // Should still work without parser service (using fallback logic)
      expect(result.success).toBe(true);
    });

    it('should handle invalid selections gracefully', async () => {
      const invalidSelections = [
        { startLineNumber: -1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
        { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
        { startLineNumber: 100, startColumn: 1, endLineNumber: 100, endColumn: 10 }
      ];

      for (const selection of invalidSelections) {
        mockModel.getValueInRange = () => '';

        const result = await extractProvider.getExtractActions(mockModel, selection);
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('name generation', () => {
    it('should generate meaningful names from expressions', async () => {
      const testCases = [
        { expression: 'width * height', expectedType: 'variable' },
        { expression: 'calculate_area(w, h)', expectedType: 'function' },
        { expression: 'cube([size, size, size])', expectedType: 'module' }
      ];

      for (const testCase of testCases) {
        mockModel.getValueInRange = () => testCase.expression;

        const selection: monaco.IRange = {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: testCase.expression.length + 1
        };

        const result = await extractProvider.getExtractActions(mockModel, selection);
        expect(result.success).toBe(true);
        expect(result.data!.length).toBeGreaterThan(0);

        // Check that generated names are reasonable
        result.data!.forEach(action => {
          expect(action.title).toMatch(/[a-zA-Z_][a-zA-Z0-9_]*/);
          expect(action.title.length).toBeGreaterThan(10); // Should have descriptive titles
        });
      }
    });
  });
});
