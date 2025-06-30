/**
 * Monaco Editor Hook
 *
 * React hook for Monaco Editor integration with Zustand store,
 * including debounced updates, performance monitoring, and error handling.
 */

import type * as monaco from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '../../../shared/utils/functional/pipe';
import { tryCatch } from '../../../shared/utils/functional/result';
import { measureTime } from '../../../shared/utils/performance/metrics';
import { useAppStore } from '../../store';
import {
  selectConfigDebounceMs,
  selectEditorCode,
  selectEditorCursorPosition,
  selectEditorSelection,
} from '../../store/selectors';
import type {
  EditorPerformanceMetrics,
  EditorStateManager,
  UseMonacoEditorOptions,
  UseMonacoEditorReturn,
} from '../types/editor.types';

/**
 * Default options for Monaco Editor hook
 */
const DEFAULT_OPTIONS: UseMonacoEditorOptions = {
  language: 'openscad',
  theme: 'vs-dark',
  debounceMs: 300,
  enableSyntaxValidation: true,
  enableAutoCompletion: true,
};

/**
 * Monaco Editor hook with Zustand store integration
 */
export const useMonacoEditor = (
  options: Partial<UseMonacoEditorOptions> = {}
): UseMonacoEditorReturn => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Refs
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EditorPerformanceMetrics>({
    renderTime: 0,
    updateTime: 0,
    validationTime: 0,
    completionTime: 0,
  });

  // Store selectors and actions
  const code = useAppStore(selectEditorCode);
  const cursorPosition = useAppStore(selectEditorCursorPosition);
  const _selection = useAppStore(selectEditorSelection);
  const debounceMs = useAppStore(selectConfigDebounceMs);

  const updateCode = useAppStore((state) => state.updateCode);
  const updateCursorPosition = useAppStore((state) => state.updateCursorPosition);
  const updateSelection = useAppStore((state) => state.updateSelection);
  const markDirty = useAppStore((state) => state.markDirty);
  const recordParseTime = useAppStore((state) => state.recordParseTime);

  /**
   * Debounced code update handler
   */
  const debouncedUpdateCode = useCallback(
    debounce((newCode: string) => {
      const { result: _parseResult, duration } = measureTime(() => {
        updateCode(newCode);
        recordParseTime(duration);
      });

      setMetrics((prev) => ({ ...prev, updateTime: duration }));
    }, mergedOptions.debounceMs || debounceMs),
    []
  );

  /**
   * Handle editor content changes
   */
  const handleContentChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && value !== code) {
        const { duration } = measureTime(() => {
          debouncedUpdateCode(value);
          markDirty();
        });

        setMetrics((prev) => ({ ...prev, updateTime: duration }));
      }
    },
    [code, debouncedUpdateCode, markDirty]
  );

  /**
   * Handle cursor position changes
   */
  const handleCursorPositionChange = useCallback(
    (e: monaco.editor.ICursorPositionChangedEvent) => {
      const newPosition = {
        line: e.position.lineNumber,
        column: e.position.column,
      };

      if (
        newPosition.line !== cursorPosition.line ||
        newPosition.column !== cursorPosition.column
      ) {
        updateCursorPosition(newPosition);
      }
    },
    [cursorPosition, updateCursorPosition]
  );

  /**
   * Handle selection changes
   */
  const handleSelectionChange = useCallback(
    (e: monaco.editor.ICursorSelectionChangedEvent) => {
      const newSelection = e.selection.isEmpty()
        ? null
        : {
            startLineNumber: e.selection.startLineNumber,
            startColumn: e.selection.startColumn,
            endLineNumber: e.selection.endLineNumber,
            endColumn: e.selection.endColumn,
          };

      updateSelection(newSelection);
    },
    [updateSelection]
  );

  /**
   * Editor state manager
   */
  const actions: EditorStateManager = {
    getValue: () => {
      return editorRef.current?.getValue() || '';
    },

    setValue: (value: string) => {
      if (editorRef.current) {
        editorRef.current.setValue(value);
      }
    },

    getPosition: () => {
      const position = editorRef.current?.getPosition();
      return position
        ? {
            line: position.lineNumber,
            column: position.column,
          }
        : { line: 1, column: 1 };
    },

    setPosition: (position) => {
      if (editorRef.current) {
        editorRef.current.setPosition({
          lineNumber: position.line,
          column: position.column,
        });
      }
    },

    getSelection: () => {
      const selection = editorRef.current?.getSelection();
      return selection && !selection.isEmpty()
        ? {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          }
        : null;
    },

    setSelection: (selection) => {
      if (editorRef.current && selection) {
        editorRef.current.setSelection({
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        });
      }
    },

    focus: () => {
      editorRef.current?.focus();
    },

    blur: () => {
      editorRef.current?.getContainerDomNode().blur();
    },

    undo: () => {
      editorRef.current?.trigger('keyboard', 'undo', null);
    },

    redo: () => {
      editorRef.current?.trigger('keyboard', 'redo', null);
    },

    format: async () => {
      if (editorRef.current) {
        const { duration } = await measureTime(async () => {
          await editorRef.current?.getAction('editor.action.formatDocument')?.run();
        });

        setMetrics((prev) => ({ ...prev, validationTime: duration }));
      }
    },
  };

  /**
   * Initialize editor event listeners
   */
  const _initializeEditor = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      const result = tryCatch(
        () => {
          editorRef.current = editor;
          setIsLoading(false);
          setError(null);

          // Set up event listeners
          const disposables: monaco.IDisposable[] = [];

          // Content change events
          disposables.push(
            editor.onDidChangeModelContent(() => {
              handleContentChange(editor.getValue());
            })
          );

          // Cursor position change events
          disposables.push(editor.onDidChangeCursorPosition(handleCursorPositionChange));

          // Selection change events
          disposables.push(editor.onDidChangeCursorSelection(handleSelectionChange));

          // Performance monitoring
          disposables.push(
            editor.onDidChangeModelContent(() => {
              const { duration } = measureTime(() => {
                // Measure render time
              });
              setMetrics((prev) => ({ ...prev, renderTime: duration }));
            })
          );

          // Store disposables for cleanup
          (editor as unknown as { _hookDisposables: monaco.IDisposable[] })._hookDisposables =
            disposables;

          console.log('[INIT][useMonacoEditor] Editor initialized successfully');

          return editor;
        },
        (err) =>
          `Failed to initialize Monaco Editor: ${err instanceof Error ? err.message : String(err)}`
      );

      if (!result.success) {
        setError(result.error);
        console.error('[ERROR][useMonacoEditor]', result.error);
      }
    },
    [handleContentChange, handleCursorPositionChange, handleSelectionChange]
  );

  /**
   * Cleanup editor resources
   */
  const cleanupEditor = useCallback(() => {
    if (editorRef.current) {
      const disposables = (
        editorRef.current as unknown as { _hookDisposables?: monaco.IDisposable[] }
      )._hookDisposables;
      if (disposables) {
        disposables.forEach((disposable: monaco.IDisposable) => {
          disposable.dispose();
        });
      }

      editorRef.current = null;
      setIsLoading(true);
      setError(null);

      console.log('[CLEANUP][useMonacoEditor] Editor resources cleaned up');
    }
  }, []);

  /**
   * Sync store state with editor
   */
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== code) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  useEffect(() => {
    if (editorRef.current) {
      const currentPosition = editorRef.current.getPosition();
      if (
        currentPosition &&
        (currentPosition.lineNumber !== cursorPosition.line ||
          currentPosition.column !== cursorPosition.column)
      ) {
        editorRef.current.setPosition({
          lineNumber: cursorPosition.line,
          column: cursorPosition.column,
        });
      }
    }
  }, [cursorPosition]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanupEditor();
    };
  }, [cleanupEditor]);

  return {
    editorRef,
    containerRef,
    isLoading,
    error,
    metrics,
    actions,
  };
};

export default useMonacoEditor;
