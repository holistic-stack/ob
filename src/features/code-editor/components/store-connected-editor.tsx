/**
 * Store-Connected Monaco Editor Component
 *
 * Zustand-centric Monaco Editor that integrates with the application store
 * for OpenSCAD code editing with real-time AST parsing and 3D rendering.
 */

import React, { useCallback, useEffect } from 'react';
import { MonacoEditorComponent } from './monaco-editor';
import { useAppStore } from '../../store';
import {
  selectEditorCode,
  selectEditorSelection,
  selectEditorIsDirty,
  selectParsingErrors,
  selectParsingWarnings,
  selectConfigEnableRealTimeParsing
} from '../../store/selectors';
import type { EditorChangeEvent, EditorCursorEvent, EditorSelectionEvent } from '../types/editor.types';

/**
 * Props for the store-connected editor
 */
interface StoreConnectedEditorProps {
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly height?: string | number;
  readonly width?: string | number;
}

/**
 * Store-connected Monaco Editor that implements Zustand-only data flow
 */
export const StoreConnectedEditor: React.FC<StoreConnectedEditorProps> = ({
  className = '',
  'data-testid': testId = 'store-connected-editor',
  height = '100%',
  width = '100%'
}) => {
  console.log('[INIT][StoreConnectedEditor] Initializing store-connected Monaco Editor');

  // Store selectors - all data comes from Zustand
  const code = useAppStore(selectEditorCode);
  const selection = useAppStore(selectEditorSelection);
  const isDirty = useAppStore(selectEditorIsDirty);
  const parsingErrors = useAppStore(selectParsingErrors);
  const parsingWarnings = useAppStore(selectParsingWarnings);
  const enableRealTimeParsing = useAppStore(selectConfigEnableRealTimeParsing);

  // Store actions - all mutations go through Zustand
  const updateCode = useAppStore((state) => state.updateCode);
  const updateSelection = useAppStore((state) => state.updateSelection);
  const updateCursorPosition = useAppStore((state) => state.updateCursorPosition);
  const markDirty = useAppStore((state) => state.markDirty);
  const parseAST = useAppStore((state) => state.parseAST);

  /**
   * Handle code changes - update store with 300ms debouncing
   */
  const handleCodeChange = useCallback((event: EditorChangeEvent) => {
    console.log('[DEBUG][StoreConnectedEditor] Code changed, updating store');
    
    // Update code in store (this will trigger debounced parsing if enabled)
    updateCode(event.value);
    
    // Mark as dirty for save state tracking
    markDirty();
    
    console.log(`[DEBUG][StoreConnectedEditor] Code updated: ${event.value.length} characters`);
  }, [updateCode, markDirty]);

  /**
   * Handle cursor position changes - update store
   */
  const handleCursorChange = useCallback((event: EditorCursorEvent) => {
    console.log('[DEBUG][StoreConnectedEditor] Cursor position changed');
    updateCursorPosition({
      line: event.position.lineNumber,
      column: event.position.column
    });
  }, [updateCursorPosition]);

  /**
   * Handle selection changes - update store
   */
  const handleSelectionChange = useCallback((event: EditorSelectionEvent) => {
    console.log('[DEBUG][StoreConnectedEditor] Selection changed');
    updateSelection({
      startLine: event.selection.startLineNumber,
      startColumn: event.selection.startColumn,
      endLine: event.selection.endLineNumber,
      endColumn: event.selection.endColumn
    });
  }, [updateSelection]);

  /**
   * Effect: Log store state changes for debugging
   */
  useEffect(() => {
    console.log('[DEBUG][StoreConnectedEditor] Store state updated:', {
      codeLength: code.length,
      isDirty,
      errorCount: parsingErrors.length,
      warningCount: parsingWarnings.length,
      realTimeParsing: enableRealTimeParsing,
      hasSelection: selection !== null
    });
  }, [code, isDirty, parsingErrors, parsingWarnings, enableRealTimeParsing, selection]);

  /**
   * Effect: Trigger manual parsing when real-time parsing is disabled
   */
  useEffect(() => {
    if (!enableRealTimeParsing && code.length > 0) {
      console.log('[DEBUG][StoreConnectedEditor] Manual parsing trigger');
      // Manual parsing can be triggered here if needed
      // For now, we rely on the store's debounced parsing
    }
  }, [code, enableRealTimeParsing, parseAST]);

  return (
    <div 
      className={`store-connected-editor ${className}`}
      data-testid={testId}
      style={{ height, width }}
    >
      {/* Editor Status Bar */}
      <div className="editor-status-bar bg-gray-800 text-white px-4 py-2 text-sm flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-blue-400">OpenSCAD</span>
          <span className={`${isDirty ? 'text-yellow-400' : 'text-green-400'}`}>
            {isDirty ? '● Modified' : '● Saved'}
          </span>
          {selection && (
            <span className="text-gray-400">
              Ln {selection.startLine}, Col {selection.startColumn}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {parsingErrors.length > 0 && (
            <span className="text-red-400">
              {parsingErrors.length} error{parsingErrors.length !== 1 ? 's' : ''}
            </span>
          )}
          {parsingWarnings.length > 0 && (
            <span className="text-yellow-400">
              {parsingWarnings.length} warning{parsingWarnings.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-gray-400">
            {code.length} chars
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="editor-container" style={{ height: 'calc(100% - 40px)' }}>
        <MonacoEditorComponent
          value={code}
          language="openscad"
          theme="vs-dark"
          onChange={handleCodeChange}
          onCursorPositionChange={handleCursorChange}
          onSelectionChange={handleSelectionChange}
          config={{
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            lineNumbers: 'on',
            minimap: { enabled: true },
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'boundary',
            tabSize: 2,
            insertSpaces: true
          }}
          className="h-full w-full"
          data-testid="monaco-editor-instance"
        />
      </div>

      {/* Error/Warning Panel */}
      {(parsingErrors.length > 0 || parsingWarnings.length > 0) && (
        <div className="error-panel bg-gray-900 border-t border-gray-700 max-h-32 overflow-y-auto">
          {parsingErrors.map((error, index) => (
            <div 
              key={`error-${index}`}
              className="error-item px-4 py-2 text-red-400 text-sm border-b border-gray-800"
            >
              <span className="font-semibold">Error:</span> {error}
            </div>
          ))}
          {parsingWarnings.map((warning, index) => (
            <div 
              key={`warning-${index}`}
              className="warning-item px-4 py-2 text-yellow-400 text-sm border-b border-gray-800"
            >
              <span className="font-semibold">Warning:</span> {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreConnectedEditor;
