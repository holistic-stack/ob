/**
 * Monaco Editor Type Definitions
 * 
 * Comprehensive type definitions for Monaco Editor integration
 * with OpenSCAD syntax highlighting and Zustand store integration.
 */

import type * as monaco from 'monaco-editor';
import type { Result, AsyncResult } from '../../../shared/types/result.types';
import type { EditorPosition, EditorSelection } from '../../../shared/types/common.types';

/**
 * Monaco Editor configuration types
 */
export interface MonacoEditorConfig {
  readonly theme: 'vs-dark' | 'vs-light' | 'hc-black';
  readonly fontSize: number;
  readonly fontFamily: string;
  readonly lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  readonly minimap: {
    readonly enabled: boolean;
    readonly side: 'left' | 'right';
  };
  readonly wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  readonly automaticLayout: boolean;
  readonly scrollBeyondLastLine: boolean;
  readonly renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  readonly tabSize: number;
  readonly insertSpaces: boolean;
}

/**
 * OpenSCAD language configuration
 */
export interface OpenSCADLanguageConfig {
  readonly keywords: ReadonlyArray<string>;
  readonly operators: ReadonlyArray<string>;
  readonly builtinFunctions: ReadonlyArray<string>;
  readonly builtinModules: ReadonlyArray<string>;
  readonly constants: ReadonlyArray<string>;
}

/**
 * Editor event types
 */
export interface EditorChangeEvent {
  readonly value: string;
  readonly changes: ReadonlyArray<monaco.editor.IModelContentChange>;
  readonly versionId: number;
}

export interface EditorCursorEvent {
  readonly position: EditorPosition;
  readonly secondaryPositions: ReadonlyArray<EditorPosition>;
}

export interface EditorSelectionEvent {
  readonly selection: EditorSelection;
  readonly secondarySelections: ReadonlyArray<EditorSelection>;
}

export interface EditorFocusEvent {
  readonly hasFocus: boolean;
}

/**
 * Editor action types
 */
export interface EditorAction {
  readonly id: string;
  readonly label: string;
  readonly keybinding?: number;
  readonly contextMenuGroupId?: string;
  readonly contextMenuOrder?: number;
  readonly run: (editor: monaco.editor.IStandaloneCodeEditor) => void | Promise<void>;
}

/**
 * Code completion types
 */
export interface CompletionItem {
  readonly label: string;
  readonly kind: monaco.languages.CompletionItemKind;
  readonly detail?: string;
  readonly documentation?: string;
  readonly insertText: string;
  readonly range: monaco.IRange;
  readonly sortText?: string;
  readonly filterText?: string;
}

export interface CompletionProvider {
  readonly triggerCharacters?: ReadonlyArray<string>;
  readonly provideCompletionItems: (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ) => Promise<monaco.languages.CompletionList | null>;
}

/**
 * Syntax validation types
 */
export interface SyntaxError {
  readonly message: string;
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
  readonly severity: monaco.MarkerSeverity;
  readonly code?: string;
}

export interface SyntaxValidator {
  readonly validate: (code: string) => Promise<ReadonlyArray<SyntaxError>>;
}

/**
 * Editor performance metrics
 */
export interface EditorPerformanceMetrics {
  readonly renderTime: number;
  readonly updateTime: number;
  readonly validationTime: number;
  readonly completionTime: number;
}

/**
 * Editor state management types
 */
export interface EditorStateManager {
  readonly getValue: () => string;
  readonly setValue: (value: string) => void;
  readonly getPosition: () => EditorPosition;
  readonly setPosition: (position: EditorPosition) => void;
  readonly getSelection: () => EditorSelection | null;
  readonly setSelection: (selection: EditorSelection | null) => void;
  readonly focus: () => void;
  readonly blur: () => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly format: () => Promise<void>;
}

/**
 * Editor component props
 */
export interface MonacoEditorProps {
  readonly value: string;
  readonly language: string;
  readonly theme?: string;
  readonly config?: Partial<MonacoEditorConfig>;
  readonly readOnly?: boolean;
  readonly className?: string;
  readonly 'data-testid'?: string;
  
  // Event handlers
  readonly onChange?: (event: EditorChangeEvent) => void;
  readonly onCursorPositionChange?: (event: EditorCursorEvent) => void;
  readonly onSelectionChange?: (event: EditorSelectionEvent) => void;
  readonly onFocus?: (event: EditorFocusEvent) => void;
  readonly onBlur?: (event: EditorFocusEvent) => void;
  readonly onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  readonly onUnmount?: () => void;
}

/**
 * Editor service types
 */
export interface EditorService {
  readonly initialize: () => AsyncResult<void, string>;
  readonly createEditor: (
    container: HTMLElement,
    config: MonacoEditorConfig
  ) => Result<monaco.editor.IStandaloneCodeEditor, string>;
  readonly registerLanguage: (config: OpenSCADLanguageConfig) => Result<void, string>;
  readonly registerCompletionProvider: (provider: CompletionProvider) => Result<void, string>;
  readonly registerSyntaxValidator: (validator: SyntaxValidator) => Result<void, string>;
  readonly dispose: () => void;
}

/**
 * Editor hook types
 */
export interface UseMonacoEditorOptions {
  readonly language: string;
  readonly theme?: string;
  readonly config?: Partial<MonacoEditorConfig>;
  readonly debounceMs?: number;
  readonly enableSyntaxValidation?: boolean;
  readonly enableAutoCompletion?: boolean;
}

export interface UseMonacoEditorReturn {
  readonly editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly metrics: EditorPerformanceMetrics;
  readonly actions: EditorStateManager;
}

/**
 * Editor context types
 */
export interface EditorContextValue {
  readonly editor: monaco.editor.IStandaloneCodeEditor | null;
  readonly isReady: boolean;
  readonly config: MonacoEditorConfig;
  readonly updateConfig: (config: Partial<MonacoEditorConfig>) => void;
  readonly registerAction: (action: EditorAction) => void;
  readonly executeAction: (actionId: string) => Promise<void>;
}

/**
 * Editor theme types
 */
export interface EditorTheme {
  readonly name: string;
  readonly base: 'vs' | 'vs-dark' | 'hc-black';
  readonly inherit: boolean;
  readonly rules: ReadonlyArray<monaco.editor.ITokenThemeRule>;
  readonly colors: Record<string, string>;
}

/**
 * Editor configuration validation
 */
export interface ConfigValidator {
  readonly validateConfig: (config: Partial<MonacoEditorConfig>) => Result<MonacoEditorConfig, string>;
  readonly validateLanguageConfig: (config: OpenSCADLanguageConfig) => Result<void, string>;
}

/**
 * Editor error types
 */
export type EditorError = 
  | { readonly type: 'initialization'; readonly message: string }
  | { readonly type: 'configuration'; readonly message: string }
  | { readonly type: 'language'; readonly message: string }
  | { readonly type: 'validation'; readonly message: string }
  | { readonly type: 'performance'; readonly message: string };

/**
 * Editor lifecycle types
 */
export interface EditorLifecycle {
  readonly onBeforeMount: () => Promise<void>;
  readonly onMount: (editor: monaco.editor.IStandaloneCodeEditor) => Promise<void>;
  readonly onBeforeUnmount: () => Promise<void>;
  readonly onUnmount: () => Promise<void>;
}

/**
 * Editor integration types for Zustand store
 */
export interface EditorStoreIntegration {
  readonly connectToStore: () => void;
  readonly disconnectFromStore: () => void;
  readonly syncWithStore: () => void;
  readonly isConnected: boolean;
}
