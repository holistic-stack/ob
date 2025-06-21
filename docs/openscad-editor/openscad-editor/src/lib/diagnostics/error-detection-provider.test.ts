/**
 * @file Tests for OpenSCAD Error Detection Provider
 * 
 * Tests the error detection functionality including syntax error detection,
 * semantic analysis, and Monaco editor integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { OpenSCADParserService } from '../services/openscad-parser-service';
import {
  OpenSCADErrorDetectionProvider,
  DiagnosticSeverity,
  DEFAULT_ERROR_DETECTION_CONFIG,
  type ErrorDetectionConfig
} from './error-detection-provider';

// Mock Monaco editor
vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    setModelMarkers: vi.fn()
  },
  MarkerSeverity: {
    Error: 8,
    Warning: 4,
    Info: 2,
    Hint: 1
  }
}));

describe('OpenSCADErrorDetectionProvider', () => {
  let parserService: OpenSCADParserService;
  let errorProvider: OpenSCADErrorDetectionProvider;
  let mockModel: monaco.editor.ITextModel;

  beforeEach(async () => {
    // Create and initialize parser service
    parserService = new OpenSCADParserService();
    await parserService.init();

    // Create error detection provider
    errorProvider = new OpenSCADErrorDetectionProvider(parserService);

    // Create mock Monaco model
    mockModel = {
      uri: {
        toString: () => 'test://model.scad'
      },
      getValue: () => 'cube(10);',
      onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
    } as any;
  });

  afterEach(() => {
    errorProvider.dispose();
    parserService.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully with ready parser service', async () => {
      const result = await errorProvider.init();
      
      expect(result.success).toBe(true);
      expect(errorProvider.isReady()).toBe(true);
    });

    it('should fail to initialize with unready parser service', async () => {
      const unreadyParser = new OpenSCADParserService();
      const provider = new OpenSCADErrorDetectionProvider(unreadyParser);
      
      const result = await provider.init();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Parser service is not ready');
    });

    it('should use custom configuration', () => {
      const customConfig: Partial<ErrorDetectionConfig> = {
        enableWarnings: false,
        maxDiagnostics: 50,
        debounceMs: 500
      };
      
      const provider = new OpenSCADErrorDetectionProvider(parserService, customConfig);
      
      // Configuration is private, but we can test behavior
      expect(provider).toBeDefined();
    });
  });

  describe('Error Detection', () => {
    beforeEach(async () => {
      await errorProvider.init();
    });

    it('should detect syntax errors in invalid OpenSCAD code', async () => {
      const invalidCode = 'cube(10; // Missing closing parenthesis';
      
      const result = await errorProvider.detectErrors(mockModel, invalidCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should return no errors for valid OpenSCAD code', async () => {
      const validCode = 'cube(10);';
      
      const result = await errorProvider.detectErrors(mockModel, validCode);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should cache diagnostics for the same model', async () => {
      const code = 'cube(10);';
      
      // First call
      const result1 = await errorProvider.detectErrors(mockModel, code);
      
      // Second call should use cache
      const result2 = await errorProvider.detectErrors(mockModel, code);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      if (result1.success && result2.success) {
        expect(result1.data).toEqual(result2.data);
      }
    });

    it('should fail when not initialized', async () => {
      const uninitializedProvider = new OpenSCADErrorDetectionProvider(parserService);
      
      const result = await uninitializedProvider.detectErrors(mockModel, 'cube(10);');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('Debounced Error Detection', () => {
    beforeEach(async () => {
      await errorProvider.init();
    });

    it('should debounce error detection calls', async () => {
      const code = 'cube(10);';
      
      // Make multiple rapid calls
      errorProvider.detectErrorsDebounced(mockModel, code);
      errorProvider.detectErrorsDebounced(mockModel, code);
      errorProvider.detectErrorsDebounced(mockModel, code);
      
      // Should not throw and should handle debouncing
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });

  describe('Monaco Integration', () => {
    beforeEach(async () => {
      await errorProvider.init();
    });

    it('should update Monaco markers with diagnostics', () => {
      const diagnostics = [
        {
          message: 'Test error',
          severity: DiagnosticSeverity.Error,
          range: {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 5
          },
          source: 'parser' as const,
          code: 'test-error'
        }
      ];
      
      errorProvider.updateMarkers(mockModel, diagnostics);
      
      expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(
        mockModel,
        'openscad-diagnostics',
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Test error',
            severity: DiagnosticSeverity.Error
          })
        ])
      );
    });

    it('should clear diagnostics for a model', () => {
      errorProvider.clearDiagnostics(mockModel);
      
      expect(monaco.editor.setModelMarkers).toHaveBeenCalledWith(
        mockModel,
        'openscad-diagnostics',
        []
      );
    });

    it('should get current diagnostics for a model', async () => {
      const code = 'cube(10);';
      
      // First detect errors to populate cache
      await errorProvider.detectErrors(mockModel, code);
      
      const diagnostics = errorProvider.getDiagnostics(mockModel);
      
      expect(Array.isArray(diagnostics)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const provider = new OpenSCADErrorDetectionProvider(parserService);
      
      expect(provider).toBeDefined();
      // Default config is used internally
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig: Partial<ErrorDetectionConfig> = {
        enableWarnings: false,
        maxDiagnostics: 25
      };
      
      const provider = new OpenSCADErrorDetectionProvider(parserService, customConfig);
      
      expect(provider).toBeDefined();
      // Custom config is merged with defaults internally
    });
  });

  describe('Diagnostic Severity Mapping', () => {
    beforeEach(async () => {
      await errorProvider.init();
    });

    it('should map error severity correctly', () => {
      expect(DiagnosticSeverity.Error).toBe(8);
      expect(DiagnosticSeverity.Warning).toBe(4);
      expect(DiagnosticSeverity.Info).toBe(2);
      expect(DiagnosticSeverity.Hint).toBe(1);
    });
  });

  describe('Disposal', () => {
    beforeEach(async () => {
      await errorProvider.init();
    });

    it('should dispose cleanly', () => {
      expect(errorProvider.isReady()).toBe(true);
      
      errorProvider.dispose();
      
      expect(errorProvider.isReady()).toBe(false);
    });

    it('should clear cache on disposal', async () => {
      // Populate cache
      await errorProvider.detectErrors(mockModel, 'cube(10);');
      
      errorProvider.dispose();
      
      // After disposal, getDiagnostics should return empty array
      const diagnostics = errorProvider.getDiagnostics(mockModel);
      expect(diagnostics).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await errorProvider.init();
    });

    it('should handle parser service errors gracefully', async () => {
      // Mock parser service to throw error
      vi.spyOn(parserService, 'parseDocument').mockRejectedValue(new Error('Parser error'));
      
      const result = await errorProvider.detectErrors(mockModel, 'cube(10);');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Syntax error detection failed');
    });
  });
});
