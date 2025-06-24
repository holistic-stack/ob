/**
 * @file OpenSCAD Diagnostics Provider Tests
 * 
 * Comprehensive test suite for the OpenSCAD diagnostics provider following TDD methodology.
 * Tests cover syntax validation, error detection, warning detection, performance optimization,
 * and integration with Monaco Editor markers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { createOpenSCADDiagnosticsProvider } from './openscad-diagnostics-provider';

// Mock Monaco Editor
const createMockModel = (content: string): monacoEditor.editor.ITextModel => ({
  getValue: () => content,
  uri: { toString: () => 'test://test.scad' } as monacoEditor.Uri,
  dispose: vi.fn()
} as any);

const createMockUri = (): monacoEditor.Uri => ({
  toString: () => 'test://test.scad'
} as any);

describe('OpenSCAD Diagnostics Provider', () => {
  let provider: ReturnType<typeof createOpenSCADDiagnosticsProvider>;
  let mockModel: monacoEditor.editor.ITextModel;

  beforeEach(() => {
    provider = createOpenSCADDiagnosticsProvider();
    mockModel = createMockModel('cube(10);');

    // Setup timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Provider Creation', () => {
    it('should create a valid diagnostics provider', () => {
      expect(provider).toBeDefined();
      expect(provider.validateCode).toBeInstanceOf(Function);
      expect(provider.parseOpenSCADDiagnostics).toBeInstanceOf(Function);
      expect(provider.convertDiagnosticsToMarkers).toBeInstanceOf(Function);
    });
  });

  describe('Syntax Validation', () => {
    it('should detect no errors for valid OpenSCAD code', () => {
      const code = 'cube(10);';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      expect(diagnostics).toHaveLength(0);
    });

    it('should detect unmatched brackets', () => {
      const code = 'cube(10];';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      expect(diagnostics.length).toBeGreaterThan(0);
      const bracketError = diagnostics.find(d => d.code === 'unmatched-bracket');
      expect(bracketError).toBeDefined();
      expect(bracketError!.severity).toBe(monacoEditor.MarkerSeverity.Error);
      expect(bracketError!.message).toContain('Unmatched');
      expect(bracketError!.source).toBe('openscad-linter');
    });

    it('should detect missing semicolons', () => {
      const code = 'cube(10)';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      expect(diagnostics.length).toBeGreaterThan(0);
      const semicolonError = diagnostics.find(d => d.code === 'missing-semicolon');
      expect(semicolonError).toBeDefined();
      expect(semicolonError!.severity).toBe(monacoEditor.MarkerSeverity.Error);
      expect(semicolonError!.message).toContain('Missing semicolon');
      expect(semicolonError!.source).toBe('openscad-linter');
    });

    it('should detect missing parameters', () => {
      const code = 'cube();';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      expect(diagnostics.length).toBeGreaterThan(0);
      const paramError = diagnostics.find(d => d.code === 'missing-parameter');
      expect(paramError).toBeDefined();
      expect(paramError!.severity).toBe(monacoEditor.MarkerSeverity.Error);
      expect(paramError!.message).toContain('requires size parameter');
      expect(paramError!.source).toBe('openscad-linter');
    });

    it('should handle validation exceptions gracefully', () => {
      // Create a code that might cause validation to throw
      const code = 'invalid\ncode';
      const uri = createMockUri();

      // This should not throw, but handle gracefully
      expect(() => {
        const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);
        expect(Array.isArray(diagnostics)).toBe(true);
      }).not.toThrow();
    });

    it('should detect multiple syntax errors', () => {
      const code = 'cube(\nsphere()';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      expect(diagnostics.length).toBeGreaterThan(1);

      // Should have missing semicolon and missing parameter errors
      const semicolonError = diagnostics.find(d => d.code === 'missing-semicolon');
      const paramError = diagnostics.find(d => d.code === 'missing-parameter');

      expect(semicolonError).toBeDefined();
      expect(paramError).toBeDefined();
    });
  });

  describe('Common Issues Detection', () => {
    it('should detect high $fn values as performance warnings', () => {
      const code = '$fn = 200;\ncube(10);';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      const fnWarning = diagnostics.find(d => d.code === 'high-fn-value');
      expect(fnWarning).toBeDefined();
      expect(fnWarning!.severity).toBe(monacoEditor.MarkerSeverity.Warning);
      expect(fnWarning!.message).toContain('High $fn value');
      expect(fnWarning!.range.startLineNumber).toBe(1);
      expect(fnWarning!.source).toBe('openscad-linter');
    });

    it('should not warn for reasonable $fn values', () => {
      const code = '$fn = 50;\ncube(10);';
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      const fnWarning = diagnostics.find(d => d.code === 'high-fn-value');
      expect(fnWarning).toBeUndefined();
    });

    it('should detect redundant transformations', () => {
      const code = `
        translate([0, 0, 0]) cube(10);
        scale([1, 1, 1]) sphere(5);
        rotate([0, 0, 0]) cylinder(h=10, r=5);
      `;
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      const redundantTranslate = diagnostics.find(d => d.code === 'redundant-translate');
      const redundantScale = diagnostics.find(d => d.code === 'redundant-scale');
      const redundantRotate = diagnostics.find(d => d.code === 'redundant-rotate');

      expect(redundantTranslate).toBeDefined();
      expect(redundantScale).toBeDefined();
      expect(redundantRotate).toBeDefined();

      expect(redundantTranslate!.severity).toBe(monacoEditor.MarkerSeverity.Info);
      expect(redundantScale!.severity).toBe(monacoEditor.MarkerSeverity.Info);
      expect(redundantRotate!.severity).toBe(monacoEditor.MarkerSeverity.Info);
    });

    it('should detect issues on correct line numbers', () => {
      const code = `cube(10);
translate([0, 0, 0]) sphere(5);
$fn = 150;`;
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      const redundantTranslate = diagnostics.find(d => d.code === 'redundant-translate');
      const highFn = diagnostics.find(d => d.code === 'high-fn-value');

      expect(redundantTranslate!.range.startLineNumber).toBe(2);
      expect(highFn!.range.startLineNumber).toBe(3);
    });
  });

  describe('Error Detection Patterns', () => {
    it('should detect function calls with missing parameters', () => {
      const testCases = [
        { code: 'cube();', expectedMessage: 'cube() requires size parameter' },
        { code: 'sphere();', expectedMessage: 'sphere() requires radius parameter' },
        { code: 'cylinder();', expectedMessage: 'cylinder() requires height and radius parameters' },
        { code: 'translate();', expectedMessage: 'translate() requires vector parameter' },
        { code: 'rotate();', expectedMessage: 'rotate() requires vector parameter' }
      ];

      for (const testCase of testCases) {
        const uri = createMockUri();
        const diagnostics = provider.parseOpenSCADDiagnostics(testCase.code, uri);

        const paramError = diagnostics.find(d => d.code === 'missing-parameter');
        expect(paramError).toBeDefined();
        expect(paramError!.message).toBe(testCase.expectedMessage);
        expect(paramError!.severity).toBe(monacoEditor.MarkerSeverity.Error);
      }
    });

    it('should detect bracket mismatches', () => {
      const testCases = [
        { code: 'cube(10];', expectedMessage: 'Unmatched closing bracket' },
        { code: 'cube[10);', expectedMessage: 'Unmatched closing parenthesis' },
        { code: 'union() { cube(10); }];', expectedMessage: 'Unmatched closing bracket' }
      ];

      for (const testCase of testCases) {
        const uri = createMockUri();
        const diagnostics = provider.parseOpenSCADDiagnostics(testCase.code, uri);

        const bracketError = diagnostics.find(d => d.code === 'unmatched-bracket');
        expect(bracketError).toBeDefined();
        expect(bracketError!.message).toBe(testCase.expectedMessage);
        expect(bracketError!.severity).toBe(monacoEditor.MarkerSeverity.Error);
      }
    });

    it('should ignore comments and empty lines for semicolon checks', () => {
      const code = `// This is a comment
/* Multi-line comment */
union() {
  cube(10);
}`;
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(code, uri);

      // Should not have missing semicolon errors for comments or braces
      const semicolonErrors = diagnostics.filter(d => d.code === 'missing-semicolon');
      expect(semicolonErrors).toHaveLength(0);
    });
  });

  describe('Marker Conversion', () => {
    it('should convert diagnostics to Monaco markers correctly', () => {
      const diagnostics = [
        {
          range: {
            startLineNumber: 1,
            startColumn: 5,
            endLineNumber: 1,
            endColumn: 10
          },
          severity: monacoEditor.MarkerSeverity.Error,
          message: 'Test error',
          code: 'test-error',
          source: 'openscad-parser' as const
        }
      ];

      const markers = provider.convertDiagnosticsToMarkers(diagnostics);

      expect(markers).toHaveLength(1);
      expect(markers[0]?.severity).toBe(monacoEditor.MarkerSeverity.Error);
      expect(markers[0]?.startLineNumber).toBe(1);
      expect(markers[0]?.startColumn).toBe(5);
      expect(markers[0]?.endLineNumber).toBe(1);
      expect(markers[0]?.endColumn).toBe(10);
      expect(markers[0]?.message).toBe('Test error');
      expect(markers[0]?.code).toBe('test-error');
      expect(markers[0]?.source).toBe('openscad-parser');
    });

    it('should handle multiple diagnostics conversion', () => {
      const diagnostics = [
        {
          range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 },
          severity: monacoEditor.MarkerSeverity.Error,
          message: 'Error 1',
          code: 'error-1',
          source: 'openscad-parser' as const
        },
        {
          range: { startLineNumber: 2, startColumn: 1, endLineNumber: 2, endColumn: 5 },
          severity: monacoEditor.MarkerSeverity.Warning,
          message: 'Warning 1',
          code: 'warning-1',
          source: 'openscad-linter' as const
        }
      ];

      const markers = provider.convertDiagnosticsToMarkers(diagnostics);

      expect(markers).toHaveLength(2);
      expect(markers[0]?.severity).toBe(monacoEditor.MarkerSeverity.Error);
      expect(markers[1]?.severity).toBe(monacoEditor.MarkerSeverity.Warning);
    });
  });

  describe('Debounced Validation', () => {
    it('should debounce validation calls', () => {
      const setModelMarkersSpy = vi.spyOn(monacoEditor.editor, 'setModelMarkers').mockImplementation(() => {});

      // Call validation multiple times quickly
      provider.validateCode(mockModel, 100);
      provider.validateCode(mockModel, 100);
      provider.validateCode(mockModel, 100);

      // Should not have called setModelMarkers yet
      expect(setModelMarkersSpy).not.toHaveBeenCalled();

      // Fast-forward timers
      vi.advanceTimersByTime(100);

      // Should have called setModelMarkers only once
      expect(setModelMarkersSpy).toHaveBeenCalledTimes(1);

      setModelMarkersSpy.mockRestore();
    });

    it('should validate immediately when debounce time elapses', () => {
      const setModelMarkersSpy = vi.spyOn(monacoEditor.editor, 'setModelMarkers').mockImplementation(() => {});

      provider.validateCode(mockModel, 200);

      // Should not have validated yet
      expect(setModelMarkersSpy).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      vi.advanceTimersByTime(200);

      // Should have validated
      expect(setModelMarkersSpy).toHaveBeenCalledTimes(1);

      setModelMarkersSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle large code files efficiently', () => {
      const largeCode = 'cube(10);\n'.repeat(1000);
      mockModel = createMockModel(largeCode);

      const startTime = performance.now();
      const uri = createMockUri();
      provider.parseOpenSCADDiagnostics(largeCode, uri);
      const endTime = performance.now();

      const duration = endTime - startTime;
      // Should complete within 100ms for large files
      expect(duration).toBeLessThan(100);
    });

    it('should handle validation errors gracefully', () => {
      const setModelMarkersSpy = vi.spyOn(monacoEditor.editor, 'setModelMarkers').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a model that might cause issues
      const problematicModel = createMockModel('');
      problematicModel.getValue = () => { throw new Error('Model access failed'); };

      provider.validateCode(problematicModel, 0);
      vi.advanceTimersByTime(0);

      // Should have logged error but not crashed
      expect(consoleErrorSpy).toHaveBeenCalled();

      setModelMarkersSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle complex nested structures efficiently', () => {
      const complexCode = `
        union() {
          difference() {
            cube([20, 20, 20]);
            translate([5, 5, 5]) cube([10, 10, 10]);
          }
          translate([25, 0, 0]) {
            intersection() {
              sphere(10);
              cube([15, 15, 15]);
            }
          }
        }
      `;

      const startTime = performance.now();
      const uri = createMockUri();
      const diagnostics = provider.parseOpenSCADDiagnostics(complexCode, uri);
      const endTime = performance.now();

      const duration = endTime - startTime;
      // Should complete quickly even for complex nested structures
      expect(duration).toBeLessThan(50);
      expect(Array.isArray(diagnostics)).toBe(true);
    });
  });
});
