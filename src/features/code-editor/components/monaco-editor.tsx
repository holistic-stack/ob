/**
 * Monaco Editor Component
 *
 * React component wrapper for Monaco Editor with OpenSCAD syntax highlighting,
 * Zustand store integration, and functional programming patterns.
 */

import MonacoEditor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from '../../../shared/utils/functional/pipe';
import { tryCatch } from '../../../shared/utils/functional/result';
import type {
  EditorChangeEvent,
  EditorCursorEvent,
  EditorFocusEvent,
  EditorSelectionEvent,
  MonacoEditorConfig,
  MonacoEditorProps,
} from '../types/editor.types';

/**
 * Default Monaco Editor configuration
 */
const DEFAULT_CONFIG: MonacoEditorConfig = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Consolas, "Courier New", monospace',
  lineNumbers: 'on',
  minimap: {
    enabled: true,
    side: 'right',
  },
  wordWrap: 'on',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderWhitespace: 'boundary',
  tabSize: 2,
  insertSpaces: true,
};

/**
 * Monaco Editor Component with OpenSCAD support
 */
export const MonacoEditorComponent: React.FC<MonacoEditorProps> = ({
  value,
  language = 'openscad',
  theme = 'vs-dark',
  config = {},
  readOnly = false,
  className,
  'data-testid': testId,
  onChange,
  onCursorPositionChange,
  onSelectionChange,
  onFocus,
  onBlur,
  onMount,
  onUnmount,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [_isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Merge default config with provided config
  const editorConfig = React.useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
    }),
    [config]
  );

  // Debounced change handler for performance
  const debouncedOnChange = useCallback(
    debounce((event: EditorChangeEvent) => {
      onChange?.(event);
    }, 300),
    []
  );

  /**
   * Handle editor mount
   */
  const handleEditorMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, _monaco: typeof import('monaco-editor')) => {
      const result = tryCatch(
        () => {
          editorRef.current = editor;
          setIsReady(true);
          setError(null);

          // Configure editor options
          editor.updateOptions({
            theme,
            fontSize: editorConfig.fontSize,
            fontFamily: editorConfig.fontFamily,
            lineNumbers: editorConfig.lineNumbers,
            minimap: editorConfig.minimap,
            wordWrap: editorConfig.wordWrap,
            automaticLayout: editorConfig.automaticLayout,
            scrollBeyondLastLine: editorConfig.scrollBeyondLastLine,
            renderWhitespace: editorConfig.renderWhitespace,
            tabSize: editorConfig.tabSize,
            insertSpaces: editorConfig.insertSpaces,
            readOnly,
          });

          // Set up event listeners
          const disposables: monaco.IDisposable[] = [];

          // Content change events
          disposables.push(
            editor.onDidChangeModelContent((e) => {
              const model = editor.getModel();
              if (model) {
                const changeEvent: EditorChangeEvent = {
                  value: model.getValue(),
                  changes: e.changes,
                  versionId: e.versionId,
                };
                debouncedOnChange(changeEvent);
              }
            })
          );

          // Cursor position change events
          if (onCursorPositionChange) {
            disposables.push(
              editor.onDidChangeCursorPosition((e) => {
                const cursorEvent: EditorCursorEvent = {
                  position: {
                    line: e.position.lineNumber,
                    column: e.position.column,
                  },
                  secondaryPositions: e.secondaryPositions.map((pos) => ({
                    line: pos.lineNumber,
                    column: pos.column,
                  })),
                };
                onCursorPositionChange(cursorEvent);
              })
            );
          }

          // Selection change events
          if (onSelectionChange) {
            disposables.push(
              editor.onDidChangeCursorSelection((e) => {
                const selectionEvent: EditorSelectionEvent = {
                  selection: {
                    startLineNumber: e.selection.startLineNumber,
                    startColumn: e.selection.startColumn,
                    endLineNumber: e.selection.endLineNumber,
                    endColumn: e.selection.endColumn,
                  },
                  secondarySelections: e.secondarySelections.map((sel) => ({
                    startLineNumber: sel.startLineNumber,
                    startColumn: sel.startColumn,
                    endLineNumber: sel.endLineNumber,
                    endColumn: sel.endColumn,
                  })),
                };
                onSelectionChange(selectionEvent);
              })
            );
          }

          // Focus events
          if (onFocus) {
            disposables.push(
              editor.onDidFocusEditorWidget(() => {
                const focusEvent: EditorFocusEvent = { hasFocus: true };
                onFocus(focusEvent);
              })
            );
          }

          if (onBlur) {
            disposables.push(
              editor.onDidBlurEditorWidget(() => {
                const focusEvent: EditorFocusEvent = { hasFocus: false };
                onBlur(focusEvent);
              })
            );
          }

          // Store disposables for cleanup
          (editor as any)._disposables = disposables;

          // Call onMount callback
          onMount?.(editor);

          return editor;
        },
        (err) =>
          `Failed to mount Monaco Editor: ${err instanceof Error ? err.message : String(err)}`
      );

      if (!result.success) {
        setError(result.error);
        console.error('[ERROR][MonacoEditor]', result.error);
      }
    },
    [
      theme,
      editorConfig,
      readOnly,
      debouncedOnChange,
      onCursorPositionChange,
      onSelectionChange,
      onFocus,
      onBlur,
      onMount,
    ]
  );

  /**
   * Handle editor unmount
   */
  const handleEditorUnmount = useCallback(() => {
    const result = tryCatch(
      () => {
        if (editorRef.current) {
          // Dispose event listeners
          const disposables = (editorRef.current as any)._disposables;
          if (disposables) {
            disposables.forEach((disposable: monaco.IDisposable) => {
              disposable.dispose();
            });
          }

          // Call onUnmount callback
          onUnmount?.();

          editorRef.current = null;
          setIsReady(false);
        }
      },
      (err) =>
        `Failed to unmount Monaco Editor: ${err instanceof Error ? err.message : String(err)}`
    );

    if (!result.success) {
      console.error('[ERROR][MonacoEditor]', result.error);
    }
  }, [onUnmount]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      handleEditorUnmount();
    };
  }, [handleEditorUnmount]);

  /**
   * Error boundary for Monaco Editor
   */
  if (error) {
    return (
      <div
        className={`monaco-editor-error ${className || ''}`}
        data-testid={`${testId || 'monaco-editor'}-error`}
        style={{
          height: '400px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          fontFamily: 'monospace',
        }}
      >
        <div>
          <h3>Monaco Editor Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`monaco-editor-container ${className || ''}`}
      data-testid={testId || 'monaco-editor'}
      style={{ height: '400px', width: '100%' }}
    >
      <MonacoEditor
        height="100%"
        width="100%"
        language={language}
        value={value}
        theme={theme}
        options={{
          ...editorConfig,
          readOnly,
        }}
        onMount={handleEditorMount}
        loading={
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
            }}
          >
            Loading Monaco Editor...
          </div>
        }
      />
    </div>
  );
};

// Export as default for easier importing
export default MonacoEditorComponent;
