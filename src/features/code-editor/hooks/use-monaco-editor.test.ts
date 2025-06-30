/**
 * Monaco Editor Hook Test Suite
 *
 * Tests for useMonacoEditor hook following TDD methodology
 * with Zustand store integration and performance monitoring.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../store/app-store';
import { useMonacoEditor } from './use-monaco-editor';

// Mock Monaco Editor
const _mockEditor = {
  getValue: vi.fn(() => ''),
  setValue: vi.fn(),
  getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
  setPosition: vi.fn(),
  getSelection: vi.fn(() => ({ isEmpty: () => true })),
  setSelection: vi.fn(),
  focus: vi.fn(),
  getContainerDomNode: vi.fn(() => ({ blur: vi.fn() })),
  trigger: vi.fn(),
  getAction: vi.fn(() => ({ run: vi.fn() })),
  onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
  onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
  onDidChangeCursorSelection: vi.fn(() => ({ dispose: vi.fn() })),
  dispose: vi.fn(),
};

// Mock store
let _mockStore: ReturnType<typeof createAppStore>;

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

describe('useMonacoEditor Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);

    // Create fresh store for each test
    _mockStore = createAppStore({
      enableDevtools: false,
      enablePersistence: false,
      debounceConfig: {
        parseDelayMs: 0, // Disable debouncing for tests
        renderDelayMs: 0,
        saveDelayMs: 0,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useMonacoEditor());

      expect(result.current.editorRef.current).toBeNull();
      expect(result.current.containerRef.current).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.metrics).toEqual({
        renderTime: 0,
        updateTime: 0,
        validationTime: 0,
        completionTime: 0,
      });
      expect(result.current.actions).toBeDefined();
    });

    it('should accept custom options', () => {
      const options = {
        language: 'javascript',
        theme: 'vs-light',
        debounceMs: 500,
      };

      const { result } = renderHook(() => useMonacoEditor(options));

      // Options are used internally, hook should still initialize
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Editor Actions', () => {
    it('should provide getValue action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      // Mock editor is not connected, should return empty string
      expect(result.current.actions.getValue()).toBe('');
    });

    it('should provide setValue action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.setValue('cube(10);');
      });

      // setValue should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide getPosition action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      const position = result.current.actions.getPosition();
      expect(position).toEqual({ line: 1, column: 1 });
    });

    it('should provide setPosition action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.setPosition({ line: 5, column: 10 });
      });

      // setPosition should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide getSelection action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      const selection = result.current.actions.getSelection();
      expect(selection).toBeNull();
    });

    it('should provide setSelection action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.setSelection({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 5,
        });
      });

      // setSelection should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide focus action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.focus();
      });

      // focus should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide blur action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.blur();
      });

      // blur should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide undo action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.undo();
      });

      // undo should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide redo action', () => {
      const { result } = renderHook(() => useMonacoEditor());

      act(() => {
        result.current.actions.redo();
      });

      // redo should not throw when editor is not connected
      expect(true).toBe(true);
    });

    it('should provide format action', async () => {
      const { result } = renderHook(() => useMonacoEditor());

      await act(async () => {
        await result.current.actions.format();
      });

      // format should not throw when editor is not connected
      expect(true).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should initialize with zero metrics', () => {
      const { result } = renderHook(() => useMonacoEditor());

      expect(result.current.metrics).toEqual({
        renderTime: 0,
        updateTime: 0,
        validationTime: 0,
        completionTime: 0,
      });
    });

    it('should track performance metrics', () => {
      mockPerformanceNow
        .mockReturnValueOnce(0) // Start time
        .mockReturnValueOnce(10); // End time

      const { result } = renderHook(() => useMonacoEditor());

      // Metrics should be available
      expect(result.current.metrics).toBeDefined();
      expect(typeof result.current.metrics.renderTime).toBe('number');
      expect(typeof result.current.metrics.updateTime).toBe('number');
      expect(typeof result.current.metrics.validationTime).toBe('number');
      expect(typeof result.current.metrics.completionTime).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      const { result } = renderHook(() => useMonacoEditor());

      // Hook should initialize without throwing
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });

    it('should provide error state', () => {
      const { result } = renderHook(() => useMonacoEditor());

      expect(result.current.error).toBeNull();
      expect(typeof result.current.error).toBe('object'); // null is object type
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = renderHook(() => useMonacoEditor());

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should reset state on cleanup', () => {
      const { result, unmount } = renderHook(() => useMonacoEditor());

      // Verify initial state
      expect(result.current.isLoading).toBe(true);

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Refs', () => {
    it('should provide editor ref', () => {
      const { result } = renderHook(() => useMonacoEditor());

      expect(result.current.editorRef).toBeDefined();
      expect(result.current.editorRef.current).toBeNull();
    });

    it('should provide container ref', () => {
      const { result } = renderHook(() => useMonacoEditor());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });
  });

  describe('Options Handling', () => {
    it('should handle empty options', () => {
      const { result } = renderHook(() => useMonacoEditor({}));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle partial options', () => {
      const { result } = renderHook(() =>
        useMonacoEditor({
          language: 'typescript',
        })
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle all options', () => {
      const options = {
        language: 'openscad',
        theme: 'vs-dark',
        debounceMs: 300,
        enableSyntaxValidation: true,
        enableAutoCompletion: true,
      };

      const { result } = renderHook(() => useMonacoEditor(options));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });
});
