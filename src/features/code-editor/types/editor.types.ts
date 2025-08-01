/**
 * @file editor.types.ts
 * @description Comprehensive TypeScript type definitions for Monaco Editor integration with React and Zustand,
 * providing type-safe interfaces for configuration, events, state management, and service contracts.
 * This file serves as the central type registry for the entire code-editor feature, ensuring consistent
 * typing across all components, hooks, and services.
 *
 * @architectural_decision
 * **Type-First Architecture**: All interfaces are designed with immutability in mind (readonly properties)
 * to ensure predictable state management and prevent accidental mutations. The type system provides
 * compile-time guarantees for data integrity and API consistency.
 *
 * **Granular Type Design**: Types are structured to be highly specific and composable, allowing for
 * precise typing of complex editor features while maintaining flexibility for future extensions.
 *
 * **Domain-Driven Design**: Types are organized by functional domains (configuration, events, state,
 * services) to promote clear separation of concerns and ease of maintenance.
 *
 * @performance_considerations
 * - **Readonly Properties**: All interface properties are readonly to enable structural sharing and
 *   prevent unnecessary object mutations that could trigger React re-renders
 * - **Immutable Data Structures**: Type definitions enforce immutability patterns that work optimally
 *   with React's reconciliation algorithm and Zustand's state management
 * - **Type Inference**: Generic types and union types are designed to minimize TypeScript compilation
 *   overhead while providing maximum type safety
 *
 * @example Basic Type Usage
 * ```typescript
 * import type { MonacoEditorConfig, EditorStateManager } from '@/features/code-editor/types';
 *
 * // Type-safe configuration
 * const editorConfig: MonacoEditorConfig = {
 *   theme: 'vs-dark',
 *   fontSize: 14,
 *   fontFamily: 'Monaco, Menlo, Courier New',
 *   lineNumbers: 'on',
 *   minimap: { enabled: true, side: 'right' },
 *   wordWrap: 'on',
 *   automaticLayout: true,
 *   scrollBeyondLastLine: false,
 *   renderWhitespace: 'boundary',
 *   tabSize: 2,
 *   insertSpaces: true
 * };
 *
 * // Type-safe state manager
 * const handleEditorActions = (manager: EditorStateManager) => {
 *   manager.setValue('cube(10);');
 *   const position = manager.getPosition(); // { line: number, column: number }
 *   manager.setPosition({ line: 1, column: 10 });
 * };
 * ```
 *
 * @example Event Handling with Type Safety
 * ```typescript
 * import type { EditorChangeEvent, EditorCursorEvent } from '@/features/code-editor/types';
 *
 * const handleContentChange = (event: EditorChangeEvent) => {
 *   console.log(`Code changed to: ${event.value}`);
 *   console.log(`Version: ${event.versionId}`);
 *   event.changes.forEach(change => {
 *     console.log(`Range: ${change.range}, Text: ${change.text}`);
 *   });
 * };
 *
 * const handleCursorMove = (event: EditorCursorEvent) => {
 *   console.log(`Cursor at line ${event.position.line}, column ${event.position.column}`);
 *   if (event.secondaryPositions.length > 0) {
 *     console.log(`Multi-cursor mode with ${event.secondaryPositions.length} additional cursors`);
 *   }
 * };
 * ```
 *
 * @example Service Implementation with Type Contracts
 * ```typescript
 * import type { EditorService, CompletionProvider, SyntaxValidator } from '@/features/code-editor/types';
 *
 * class MonacoEditorService implements EditorService {
 *   async initialize(): AsyncResult<void, string> {
 *     // Implementation with type-safe error handling
 *     return { success: true, data: undefined };
 *   }
 *
 *   createEditor(container: HTMLElement, config: MonacoEditorConfig): Result<monaco.editor.IStandaloneCodeEditor, string> {
 *     // Type-safe editor creation
 *     try {
 *       const editor = monaco.editor.create(container, config);
 *       return { success: true, data: editor };
 *     } catch (error) {
 *       return { success: false, error: `Failed to create editor: ${error}` };
 *     }
 *   }
 *
 *   // Additional method implementations...
 * }
 * ```
 *
 * @example React Component Integration
 * ```typescript
 * import type { MonacoEditorProps, UseMonacoEditorReturn } from '@/features/code-editor/types';
 * import { useMonacoEditor } from '@/features/code-editor/hooks';
 *
 * interface EditorWrapperProps extends Partial<MonacoEditorProps> {
 *   onReady?: (manager: UseMonacoEditorReturn) => void;
 * }
 *
 * function EditorWrapper({ onReady, ...editorProps }: EditorWrapperProps) {
 *   const editorManager = useMonacoEditor({
 *     language: 'openscad',
 *     enableSyntaxValidation: true
 *   });
 *
 *   useEffect(() => {
 *     if (!editorManager.isLoading && !editorManager.error) {
 *       onReady?.(editorManager);
 *     }
 *   }, [editorManager, onReady]);
 *
 *   return <div ref={editorManager.containerRef} />;
 * }
 * ```
 *
 * @testing_integration
 * **Type-Safe Testing**: All types include comprehensive test coverage patterns:
 * ```typescript
 * import type { EditorStateManager, EditorPerformanceMetrics } from '@/features/code-editor/types';
 *
 * // Mock implementations for testing
 * const createMockStateManager = (): EditorStateManager => ({
 *   getValue: jest.fn(() => ''),
 *   setValue: jest.fn(),
 *   getPosition: jest.fn(() => ({ line: 1, column: 1 })),
 *   setPosition: jest.fn(),
 *   getSelection: jest.fn(() => null),
 *   setSelection: jest.fn(),
 *   focus: jest.fn(),
 *   blur: jest.fn(),
 *   undo: jest.fn(),
 *   redo: jest.fn(),
 *   format: jest.fn().mockResolvedValue(undefined)
 * });
 *
 * // Performance metrics for testing
 * const mockMetrics: EditorPerformanceMetrics = {
 *   renderTime: 15.5,
 *   updateTime: 3.2,
 *   validationTime: 8.1,
 *   completionTime: 12.3
 * };
 * ```
 *
 * @extension_patterns
 * **Future Extensibility**: Types are designed to support future enhancements:
 * ```typescript
 * // Extending base types for custom features
 * interface ExtendedEditorConfig extends MonacoEditorConfig {
 *   readonly customFeatures: {
 *     readonly enableAIAssist: boolean;
 *     readonly enableCollaboration: boolean;
 *   };
 * }
 *
 * // Plugin system support
 * interface EditorPlugin {
 *   readonly id: string;
 *   readonly name: string;
 *   readonly activate: (editor: monaco.editor.IStandaloneCodeEditor) => Promise<void>;
 *   readonly deactivate: () => Promise<void>;
 * }
 * ```
 *
 * @integration_notes
 * - **Monaco Editor**: Direct integration with Monaco Editor TypeScript definitions
 * - **React**: Compatible with React 18+ concurrent features and strict mode
 * - **Zustand**: Designed for optimal integration with Zustand store patterns
 * - **Result Types**: Consistent error handling using Result<T, E> pattern
 * - **Async Operations**: Full support for async/await patterns with proper error handling
 */

import type * as monaco from 'monaco-editor';
import type * as React from 'react';
import type { AsyncResult, EditorPosition, Result } from '@/shared';

/**
 * @interface MonacoEditorConfig
 * @description Defines the configuration options for the Monaco Editor instance.
 * These settings control the editor's appearance and behavior.
 */
export interface MonacoEditorConfig {
  /** @property The color theme of the editor. */
  readonly theme: 'vs-dark' | 'vs-light' | 'hc-black';
  /** @property The font size for the editor text. */
  readonly fontSize: number;
  /** @property The font family used for the editor text. */
  readonly fontFamily: string;
  /** @property Controls the display of line numbers. */
  readonly lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  /** @property Configuration for the editor's minimap. */
  readonly minimap: {
    readonly enabled: boolean;
    readonly side: 'left' | 'right';
  };
  /** @property Controls how text wraps in the editor. */
  readonly wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  /** @property If true, the editor will automatically resize to fit its container. */
  readonly automaticLayout: boolean;
  /** @property If true, allows scrolling beyond the last line of code. */
  readonly scrollBeyondLastLine: boolean;
  /** @property Controls how whitespace characters are rendered. */
  readonly renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  /** @property The number of spaces a tab is equal to. */
  readonly tabSize: number;
  /** @property If true, inserts spaces when tab is pressed. */
  readonly insertSpaces: boolean;
}

/**
 * @interface OpenSCADLanguageConfig
 * @description Defines the language-specific tokens for OpenSCAD, used for syntax highlighting and auto-completion.
 */
export interface OpenSCADLanguageConfig {
  readonly keywords: ReadonlyArray<string>;
  readonly operators: ReadonlyArray<string>;
  readonly builtinFunctions: ReadonlyArray<string>;
  readonly builtinModules: ReadonlyArray<string>;
  readonly constants: ReadonlyArray<string>;
}

/**
 * @interface EditorChangeEvent
 * @description Represents the event payload when the editor's content changes.
 */
export interface EditorChangeEvent {
  /** @property The new value of the editor's content. */
  readonly value: string;
  /** @property The specific changes that occurred in the model. */
  readonly changes: ReadonlyArray<monaco.editor.IModelContentChange>;
  /** @property The version ID of the model after the change. */
  readonly versionId: number;
}

/**
 * @interface EditorCursorEvent
 * @description Represents the event payload for cursor position changes.
 */
export interface EditorCursorEvent {
  /** @property The primary cursor position. */
  readonly position: EditorPosition;
  /** @property An array of secondary cursor positions. */
  readonly secondaryPositions: ReadonlyArray<EditorPosition>;
}

/**
 * @interface EditorSelection
 * @description Defines the structure of a selection within the Monaco Editor.
 */
export interface EditorSelection {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

/**
 * @interface EditorSelectionEvent
 * @description Represents the event payload for selection changes.
 */
export interface EditorSelectionEvent {
  /** @property The primary selection. */
  readonly selection: EditorSelection;
  /** @property An array of secondary selections. */
  readonly secondarySelections: ReadonlyArray<EditorSelection>;
}

/**
 * @interface EditorFocusEvent
 * @description Represents the event payload when the editor gains or loses focus.
 */
export interface EditorFocusEvent {
  readonly hasFocus: boolean;
}

/**
 * @interface EditorAction
 * @description Defines a custom action that can be executed in the editor.
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
 * @interface CompletionItem
 * @description Defines a single item in the auto-completion list.
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

/**
 * @interface CompletionProvider
 * @description Defines the contract for a completion item provider for Monaco.
 */
export interface CompletionProvider {
  readonly triggerCharacters?: ReadonlyArray<string>;
  readonly provideCompletionItems: (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext
  ) => Promise<monaco.languages.CompletionList | null>;
}

/**
 * @interface SyntaxError
 * @description Represents a syntax error identified by the validator.
 */
export interface SyntaxError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
  readonly severity: monaco.MarkerSeverity;
  readonly code?: string;
}

/**
 * @interface SyntaxValidator
 * @description Defines the contract for a syntax validator.
 */
export interface SyntaxValidator {
  readonly validate: (code: string) => Promise<ReadonlyArray<SyntaxError>>;
}

/**
 * @interface EditorPerformanceMetrics
 * @description Defines the structure for tracking editor performance metrics.
 */
export interface EditorPerformanceMetrics {
  readonly renderTime: number;
  readonly updateTime: number;
  readonly validationTime: number;
  readonly completionTime: number;
}

/**
 * @interface EditorStateManager
 * @description Provides an imperative API to manage the editor's state.
 * This is useful for components or hooks that need to interact with the editor directly.
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
 * @interface MonacoEditorProps
 * @description Defines the props for the `MonacoEditorComponent`.
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
 * @interface EditorService
 * @description Defines the contract for a service that manages the editor's lifecycle and features.
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
 * @interface UseMonacoEditorOptions
 * @description Defines the options for the `useMonacoEditor` hook.
 */
export interface UseMonacoEditorOptions {
  readonly language: string;
  readonly theme?: string;
  readonly config?: Partial<MonacoEditorConfig>;
  readonly debounceMs?: number;
  readonly enableSyntaxValidation?: boolean;
  readonly enableAutoCompletion?: boolean;
}

/**
 * @interface UseMonacoEditorReturn
 * @description Defines the return value of the `useMonacoEditor` hook.
 */
export interface UseMonacoEditorReturn {
  readonly editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly metrics: EditorPerformanceMetrics;
  readonly actions: EditorStateManager;
}

/**
 * @interface EditorContextValue
 * @description Defines the shape of the value provided by the `EditorContext`.
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
 * @interface EditorTheme
 * @description Defines the structure for a custom Monaco Editor theme.
 */
export interface EditorTheme {
  readonly name: string;
  readonly base: 'vs' | 'vs-dark' | 'hc-black';
  readonly inherit: boolean;
  readonly rules: ReadonlyArray<monaco.editor.ITokenThemeRule>;
  readonly colors: Record<string, string>;
}

/**
 * @interface ConfigValidator
 * @description Defines the contract for validating editor configurations.
 */
export interface ConfigValidator {
  readonly validateConfig: (
    config: Partial<MonacoEditorConfig>
  ) => Result<MonacoEditorConfig, string>;
  readonly validateLanguageConfig: (config: OpenSCADLanguageConfig) => Result<void, string>;
}

/**
 * @type EditorError
 * @description A discriminated union representing the different types of errors that can occur in the editor feature.
 */
export type EditorError =
  | { readonly type: 'initialization'; readonly message: string }
  | { readonly type: 'configuration'; readonly message: string }
  | { readonly type: 'language'; readonly message: string }
  | { readonly type: 'validation'; readonly message: string }
  | { readonly type: 'performance'; readonly message: string };

/**
 * @interface EditorLifecycle
 * @description Defines lifecycle hooks for the editor, allowing for custom logic to be executed at different stages.
 */
export interface EditorLifecycle {
  readonly onBeforeMount: () => Promise<void>;
  readonly onMount: (editor: monaco.editor.IStandaloneCodeEditor) => Promise<void>;
  readonly onBeforeUnmount: () => Promise<void>;
  readonly onUnmount: () => Promise<void>;
}

/**
 * @interface EditorStoreIntegration
 * @description Defines the contract for integrating the editor with a state management store like Zustand.
 */
export interface EditorStoreIntegration {
  readonly connectToStore: () => void;
  readonly disconnectFromStore: () => void;
  readonly syncWithStore: () => void;
  readonly isConnected: boolean;
}
