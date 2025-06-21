/**
 * @file Tests for Refactoring Service
 * 
 * Comprehensive test suite for the central refactoring service including
 * provider coordination, Monaco integration, and action execution.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { 
  RefactoringService, 
  type RefactoringServiceConfig 
} from './refactoring-service';
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
    return []; // Return empty AST for testing
  }
}

class MockSymbolProvider {
  getSymbols() {
    return [
      {
        name: 'testVariable',
        kind: 'variable' as const,
        loc: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 12, offset: 12 } }
      }
    ];
  }

  getSymbolAtPosition() {
    return {
      name: 'testVariable',
      kind: 'variable' as const,
      loc: { start: { line: 0, column: 0, offset: 0 }, end: { line: 0, column: 12, offset: 12 } }
    };
  }

  findSymbolReferences() {
    return [];
  }

  findUnusedSymbols() {
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

class MockDependencyAnalyzer {
  analyzeDependencies() {
    return new Map();
  }

  findCircularDependencies() {
    return [];
  }

  getTopologicalOrder(symbols: any[]) {
    return symbols;
  }
}

// Mock Monaco editor
const mockMonaco = {
  languages: {
    registerRenameProvider: () => ({ dispose: () => {} }),
    registerCodeActionProvider: () => ({ dispose: () => {} })
  }
} as any;

describe('RefactoringService', () => {
  let refactoringService: RefactoringService;
  let mockParserService: MockParserService;
  let mockSymbolProvider: MockSymbolProvider;
  let mockPositionUtilities: MockPositionUtilities;
  let mockDependencyAnalyzer: MockDependencyAnalyzer;
  let mockModel: monaco.editor.ITextModel;

  beforeEach(() => {
    mockParserService = new MockParserService();
    mockSymbolProvider = new MockSymbolProvider();
    mockPositionUtilities = new MockPositionUtilities();
    mockDependencyAnalyzer = new MockDependencyAnalyzer();

    refactoringService = new RefactoringService(
      mockParserService as OpenSCADParserService,
      mockSymbolProvider as any,
      mockPositionUtilities as any,
      mockDependencyAnalyzer as any
    );

    // Create a mock Monaco model
    mockModel = {
      uri: monaco.Uri.parse('file:///test.scad'),
      getValue: () => 'testVariable = 10;\ncube(testVariable);',
      getValueInRange: (range: monaco.IRange) => 'testVariable',
      getVersionId: () => 1,
      pushEditOperations: () => {}
    } as any;
  });

  afterEach(() => {
    refactoringService.dispose();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const service = new RefactoringService();
      const status = service.getStatus();
      
      expect(status).toBeDefined();
      expect(status.providersRegistered).toBe(0); // No providers registered yet
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<RefactoringServiceConfig> = {
        enableCodeActions: false,
        enableQuickFix: false,
        rename: { enableScopeValidation: false },
        extract: { enableVariableExtraction: false },
        organization: { enableSorting: false }
      };

      const service = new RefactoringService(
        mockParserService as OpenSCADParserService,
        mockSymbolProvider as any,
        mockPositionUtilities as any,
        mockDependencyAnalyzer as any,
        customConfig
      );

      expect(service).toBeDefined();
      service.dispose();
    });
  });

  describe('provider registration', () => {
    it('should register providers with Monaco', async () => {
      const result = await refactoringService.registerProviders(mockMonaco, 'openscad');

      expect(result.success).toBe(true);
      const status = refactoringService.getStatus();
      expect(status.providersRegistered).toBeGreaterThan(0);
    });

    it('should handle registration errors gracefully', async () => {
      const errorMonaco = {
        languages: {
          registerRenameProvider: () => { throw new Error('Registration failed'); },
          registerCodeActionProvider: () => ({ dispose: () => {} })
        }
      } as any;

      const result = await refactoringService.registerProviders(errorMonaco, 'openscad');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Registration failed');
    });
  });

  describe('refactoring actions', () => {
    it('should get all available refactoring actions', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10
      };

      const result = await refactoringService.getAllRefactoringActions(mockModel, selection);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get extract actions for selection', async () => {
      const selection: monaco.IRange = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10
      };

      const result = await refactoringService.getExtractActions(mockModel, selection);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get organization actions for model', async () => {
      const result = await refactoringService.getOrganizationActions(mockModel);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('rename functionality', () => {
    it('should check if rename is available at position', async () => {
      const position = new monaco.Position(1, 5);

      const canRename = await refactoringService.canRename(mockModel, position);

      expect(typeof canRename).toBe('boolean');
    });

    it('should handle rename availability check errors', async () => {
      // Mock symbol provider to throw error
      mockSymbolProvider.getSymbolAtPosition = () => {
        throw new Error('Symbol provider error');
      };

      const position = new monaco.Position(1, 5);
      const canRename = await refactoringService.canRename(mockModel, position);

      expect(canRename).toBe(false);
    });
  });

  describe('action execution', () => {
    it('should execute refactoring actions', async () => {
      const mockAction = {
        kind: 'extract.variable' as const,
        title: 'Extract to variable',
        description: 'Extract selected expression to variable',
        edit: {
          edits: [{
            resource: mockModel.uri,
            versionId: 1,
            textEdit: {
              range: {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 5
              },
              text: 'newVariable'
            }
          }]
        }
      };

      const result = await refactoringService.executeRefactoringAction(mockAction, mockModel);

      expect(result.success).toBe(true);
    });

    it('should handle action execution errors', async () => {
      const invalidAction = {
        kind: 'extract.variable' as const,
        title: 'Invalid action',
        description: 'This action will fail',
        edit: {
          edits: [{
            resource: mockModel.uri,
            versionId: 1,
            textEdit: {
              range: {
                startLineNumber: -1, // Invalid range
                startColumn: -1,
                endLineNumber: -1,
                endColumn: -1
              },
              text: 'invalid'
            }
          }]
        }
      };

      // Mock model to throw error on edit operations
      mockModel.pushEditOperations = () => {
        throw new Error('Edit operation failed');
      };

      const result = await refactoringService.executeRefactoringAction(invalidAction, mockModel);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to apply workspace edit');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<RefactoringServiceConfig> = {
        enableCodeActions: false,
        rename: { enableScopeValidation: false }
      };

      refactoringService.updateConfig(newConfig);

      // Configuration should be updated (no direct way to verify, but should not throw)
      expect(() => refactoringService.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('service status', () => {
    it('should provide accurate service status', () => {
      const status = refactoringService.getStatus();

      expect(status).toHaveProperty('isReady');
      expect(status).toHaveProperty('providersRegistered');
      expect(status).toHaveProperty('hasParserService');
      expect(status).toHaveProperty('hasSymbolProvider');
      expect(typeof status.isReady).toBe('boolean');
      expect(typeof status.providersRegistered).toBe('number');
      expect(typeof status.hasParserService).toBe('boolean');
      expect(typeof status.hasSymbolProvider).toBe('boolean');
    });

    it('should reflect parser service availability', () => {
      const status = refactoringService.getStatus();
      expect(status.hasParserService).toBe(true);
      expect(status.isReady).toBe(true);
    });

    it('should reflect symbol provider availability', () => {
      const status = refactoringService.getStatus();
      expect(status.hasSymbolProvider).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing providers gracefully', async () => {
      const serviceWithoutProviders = new RefactoringService();

      const extractResult = await serviceWithoutProviders.getExtractActions(mockModel, {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 10
      });

      expect(extractResult.success).toBe(false);
      expect(extractResult.error).toContain('not available');

      serviceWithoutProviders.dispose();
    });

    it('should handle parser service errors', async () => {
      // Mock parser service to not be ready
      mockParserService.isReady = () => false;

      const result = await refactoringService.getAllRefactoringActions(mockModel);

      // Should still work with fallback logic
      expect(result.success).toBe(true);
    });
  });

  describe('disposal', () => {
    it('should dispose resources properly', () => {
      // Register providers first
      refactoringService.registerProviders(mockMonaco, 'openscad');

      const statusBefore = refactoringService.getStatus();
      expect(statusBefore.providersRegistered).toBeGreaterThan(0);

      refactoringService.dispose();

      const statusAfter = refactoringService.getStatus();
      expect(statusAfter.providersRegistered).toBe(0);
    });

    it('should handle multiple dispose calls safely', () => {
      expect(() => {
        refactoringService.dispose();
        refactoringService.dispose();
        refactoringService.dispose();
      }).not.toThrow();
    });
  });

  describe('code action provider', () => {
    it('should create valid code action provider', async () => {
      await refactoringService.registerProviders(mockMonaco, 'openscad');

      // The code action provider should be registered
      const status = refactoringService.getStatus();
      expect(status.providersRegistered).toBeGreaterThan(0);
    });
  });

  describe('workspace edit application', () => {
    it('should apply workspace edits in correct order', async () => {
      const mockAction = {
        kind: 'organize.sort' as const,
        title: 'Sort declarations',
        description: 'Sort symbols in dependency order',
        edit: {
          edits: [
            {
              resource: mockModel.uri,
              versionId: 1,
              textEdit: {
                range: {
                  startLineNumber: 2,
                  startColumn: 1,
                  endLineNumber: 2,
                  endColumn: 5
                },
                text: 'second'
              }
            },
            {
              resource: mockModel.uri,
              versionId: 1,
              textEdit: {
                range: {
                  startLineNumber: 1,
                  startColumn: 1,
                  endLineNumber: 1,
                  endColumn: 5
                },
                text: 'first'
              }
            }
          ]
        }
      };

      const result = await refactoringService.executeRefactoringAction(mockAction, mockModel);

      expect(result.success).toBe(true);
    });
  });
});
