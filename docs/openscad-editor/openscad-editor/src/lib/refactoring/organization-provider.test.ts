/**
 * @file Tests for OpenSCAD Organization Provider
 * 
 * Comprehensive test suite for code organization functionality including sorting,
 * grouping, unused code removal, and import organization.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { 
  OpenSCADOrganizationProvider, 
  OrganizationActionKind,
  type OrganizationConfig 
} from './organization-provider';
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
    // Return mock AST data for testing
    return [
      {
        type: 'source_file',
        children: [
          { type: 'variable_assignment', name: 'width' },
          { type: 'function_definition', name: 'calculateVolume' },
          { type: 'module_definition', name: 'createBox' },
          { type: 'variable_assignment', name: 'unusedVar' }
        ]
      }
    ];
  }
}

class MockSymbolProvider {
  getSymbols() {
    // Return symbols in non-alphabetical order to trigger sorting
    // Alphabetical order should be: calculateVolume, createBox, unusedVar, width
    return [
      {
        name: 'width', // Should be last alphabetically
        kind: 'variable' as const,
        loc: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 10, offset: 10 } }
      },
      {
        name: 'createBox', // Should be second alphabetically
        kind: 'module' as const,
        loc: { start: { line: 5, column: 0, offset: 50 }, end: { line: 8, column: 1, offset: 80 } }
      },
      {
        name: 'unusedVar', // Should be third alphabetically
        kind: 'variable' as const,
        loc: { start: { line: 10, column: 0, offset: 100 }, end: { line: 10, column: 15, offset: 115 } },
        isUsed: false
      },
      {
        name: 'calculateVolume', // Should be first alphabetically
        kind: 'function' as const,
        loc: { start: { line: 2, column: 0, offset: 20 }, end: { line: 3, column: 20, offset: 40 } }
      }
    ];
  }

  findSymbolReferences() {
    return [];
  }

  findUnusedSymbols() {
    return [
      {
        name: 'unusedVar',
        kind: 'variable' as const,
        loc: { start: { line: 10, column: 0, offset: 100 }, end: { line: 10, column: 15, offset: 115 } },
        isUsed: false
      }
    ];
  }
}

class MockDependencyAnalyzer {
  analyzeDependencies() {
    return new Map([
      ['createBox', ['width', 'calculateVolume']],
      ['calculateVolume', ['width']]
    ]);
  }

  findCircularDependencies() {
    return [];
  }

  getTopologicalOrder(symbols: any[]) {
    // Return symbols sorted by dependency order - different from input order
    // Force a specific order that's different from the input to trigger sorting
    const sortedSymbols = [...symbols];
    sortedSymbols.sort((a, b) => {
      // Sort by name to ensure a different order than input
      return a.name.localeCompare(b.name);
    });
    return sortedSymbols;
  }
}

describe('OpenSCADOrganizationProvider', () => {
  let organizationProvider: OpenSCADOrganizationProvider;
  let mockParserService: MockParserService;
  let mockSymbolProvider: MockSymbolProvider;
  let mockDependencyAnalyzer: MockDependencyAnalyzer;
  let mockModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParserService = new MockParserService();
    mockSymbolProvider = new MockSymbolProvider();
    mockDependencyAnalyzer = new MockDependencyAnalyzer();

    // Enable all features for testing - use alphabetical sorting for simpler testing
    const testConfig = {
      enableSorting: true,
      enableGrouping: true,
      enableUnusedRemoval: true, // Enable for testing
      enableImportOrganization: true,
      sortOrder: 'alphabetical' as const, // Use alphabetical for easier testing
      groupingStrategy: 'type' as const,
      preserveComments: true,
      addSeparators: true
    };

    organizationProvider = new OpenSCADOrganizationProvider(
      mockParserService as OpenSCADParserService,
      mockSymbolProvider as any,
      mockDependencyAnalyzer as any,
      testConfig
    );

    // Create a mock Monaco model
    mockModel = {
      uri: monaco.Uri.parse('file:///test.scad'),
      getValue: () => `width = 10;
height = 20;
function calculateVolume(w, h, d) = w * h * d;
depth = 5;
module createBox(w, h, d) {
    cube([w, h, d]);
}
unusedVar = 42;`,
      getVersionId: () => 1
    } as any;
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('getOrganizationActions', () => {
    it('should return organization actions for disorganized code', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should include sort action when needed', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const sortAction = result.data!.find(action => action.kind === OrganizationActionKind.SortDeclarations);
      expect(sortAction).toBeDefined();
      expect(sortAction!.title).toContain('Sort declarations');
    });

    it('should include group action when needed', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const groupAction = result.data!.find(action => action.kind === OrganizationActionKind.GroupSymbols);
      expect(groupAction).toBeDefined();
      expect(groupAction!.title).toContain('Group symbols');
    });

    it('should include remove unused action when unused symbols exist', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const removeAction = result.data!.find(action => action.kind === OrganizationActionKind.RemoveUnused);
      expect(removeAction).toBeDefined();
      expect(removeAction!.title).toContain('Remove');
      expect(removeAction!.title).toContain('unused');
    });

    it('should include full organization action when multiple actions available', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const fullAction = result.data!.find(action => action.kind === OrganizationActionKind.FullOrganization);
      expect(fullAction).toBeDefined();
      expect(fullAction!.title).toContain('Organize entire file');
      expect(fullAction!.isPreferred).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should respect configuration settings', () => {
      const customConfig: Partial<OrganizationConfig> = {
        enableSorting: false,
        enableGrouping: true,
        enableUnusedRemoval: false,
        sortOrder: 'alphabetical',
        groupingStrategy: 'functionality'
      };

      const customProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        customConfig
      );

      expect(customProvider).toBeDefined();
    });

    it('should filter actions based on configuration', async () => {
      const configWithOnlyGrouping: Partial<OrganizationConfig> = {
        enableSorting: false,
        enableGrouping: true,
        enableUnusedRemoval: false,
        enableImportOrganization: false
      };

      const limitedProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        configWithOnlyGrouping
      );

      const result = await limitedProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const actionKinds = result.data!.map(action => action.kind);
      expect(actionKinds).not.toContain(OrganizationActionKind.SortDeclarations);
      expect(actionKinds).toContain(OrganizationActionKind.GroupSymbols);
    });
  });

  describe('sorting strategies', () => {
    it('should support alphabetical sorting', async () => {
      const alphabeticalConfig: Partial<OrganizationConfig> = {
        sortOrder: 'alphabetical'
      };

      const alphabeticalProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        alphabeticalConfig
      );

      const result = await alphabeticalProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const sortAction = result.data!.find(action => action.kind === OrganizationActionKind.SortDeclarations);
      expect(sortAction?.title).toContain('alphabetical');
    });

    it('should support dependency-based sorting', async () => {
      const dependencyConfig: Partial<OrganizationConfig> = {
        enableSorting: true,
        enableGrouping: true,
        enableUnusedRemoval: true,
        enableImportOrganization: true,
        sortOrder: 'dependency',
        groupingStrategy: 'type',
        preserveComments: true,
        addSeparators: true
      };

      const dependencyProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        dependencyConfig
      );

      const result = await dependencyProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const sortAction = result.data!.find(action => action.kind === OrganizationActionKind.SortDeclarations);
      expect(sortAction).toBeDefined();
      expect(sortAction!.title).toContain('dependency');
    });
  });

  describe('grouping strategies', () => {
    it('should support type-based grouping', async () => {
      const typeConfig: Partial<OrganizationConfig> = {
        groupingStrategy: 'type'
      };

      const typeProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        typeConfig
      );

      const result = await typeProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const groupAction = result.data!.find(action => action.kind === OrganizationActionKind.GroupSymbols);
      expect(groupAction?.title).toContain('type');
    });

    it('should support functionality-based grouping', async () => {
      const functionalityConfig: Partial<OrganizationConfig> = {
        groupingStrategy: 'functionality'
      };

      const functionalityProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        functionalityConfig
      );

      const result = await functionalityProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const groupAction = result.data!.find(action => action.kind === OrganizationActionKind.GroupSymbols);
      expect(groupAction?.title).toContain('functionality');
    });

    it('should support dependency-based grouping', async () => {
      const dependencyConfig: Partial<OrganizationConfig> = {
        groupingStrategy: 'dependency'
      };

      const dependencyProvider = new OpenSCADOrganizationProvider(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockDependencyAnalyzer as any,
        dependencyConfig
      );

      const result = await dependencyProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const groupAction = result.data!.find(action => action.kind === OrganizationActionKind.GroupSymbols);
      expect(groupAction?.title).toContain('dependency');
    });
  });

  describe('unused symbol removal', () => {
    it('should identify unused symbols correctly', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const removeAction = result.data!.find(action => action.kind === OrganizationActionKind.RemoveUnused);
      expect(removeAction).toBeDefined();
      expect(removeAction!.affectedSymbols).toContain('unusedVar');
    });

    it('should create safe removal edits', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const removeAction = result.data!.find(action => action.kind === OrganizationActionKind.RemoveUnused);
      expect(removeAction?.isSafe).toBe(true);
      expect(removeAction?.edit.edits).toBeDefined();
    });
  });

  describe('import organization', () => {
    it('should handle include/use statements', async () => {
      // Mock symbols with includes
      mockSymbolProvider.getSymbols = () => [
        {
          name: 'library.scad',
          kind: 'include' as const,
          loc: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 20, offset: 20 } }
        },
        {
          name: 'utils.scad',
          kind: 'use' as const,
          loc: { start: { line: 1, column: 0, offset: 21 }, end: { line: 1, column: 15, offset: 36 } }
        }
      ];

      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const importAction = result.data!.find(action => action.kind === OrganizationActionKind.OrganizeImports);
      expect(importAction).toBeDefined();
      expect(importAction!.title).toContain('Organize imports');
    });
  });

  describe('safety analysis', () => {
    it('should detect circular dependencies', async () => {
      // Mock circular dependencies
      mockDependencyAnalyzer.findCircularDependencies = () => [['a', 'b', 'a']];

      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      // Actions should be marked as potentially unsafe
      const actions = result.data!;
      const unsafeActions = actions.filter(action => action.isSafe === false);
      expect(unsafeActions.length).toBeGreaterThan(0);
    });

    it('should mark safe operations correctly', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const removeAction = result.data!.find(action => action.kind === OrganizationActionKind.RemoveUnused);
      expect(removeAction?.isSafe).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle parser service errors gracefully', async () => {
      // Mock parser service to not be ready
      mockParserService.isReady = () => false;

      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should handle symbol provider errors gracefully', async () => {
      // Mock symbol provider to throw error
      mockSymbolProvider.getSymbols = () => {
        throw new Error('Symbol provider error');
      };

      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Symbol provider error');
    });
  });

  describe('workspace edits', () => {
    it('should create valid workspace edits', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      result.data!.forEach(action => {
        expect(action.edit).toBeDefined();
        expect(action.edit.edits).toBeDefined();
        expect(Array.isArray(action.edit.edits)).toBe(true);
      });
    });

    it('should include version information in edits', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      const removeAction = result.data!.find(action => action.kind === OrganizationActionKind.RemoveUnused);
      if (removeAction && removeAction.edit.edits.length > 0) {
        const edit = removeAction.edit.edits[0];
        expect(edit.versionId).toBe(1);
        expect(edit.resource).toBe(mockModel.uri);
      }
    });
  });

  describe('action metadata', () => {
    it('should provide descriptive titles and descriptions', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      result.data!.forEach(action => {
        expect(action.title).toBeTruthy();
        expect(action.title.length).toBeGreaterThan(5);
        expect(action.description).toBeTruthy();
        expect(action.description.length).toBeGreaterThan(10);
      });
    });

    it('should track affected symbols', async () => {
      const result = await organizationProvider.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      result.data!.forEach(action => {
        if (action.affectedSymbols) {
          expect(Array.isArray(action.affectedSymbols)).toBe(true);
          expect(action.affectedSymbols.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
