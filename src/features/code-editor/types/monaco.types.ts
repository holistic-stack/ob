/**
 * @file monaco.types.ts
 * @description Production-ready TypeScript definitions for advanced Monaco Editor integration,
 * web worker configuration, language providers, and performance optimization patterns.
 * These types extend Monaco's core API with application-specific enhancements and provide
 * comprehensive interfaces for plugin architecture, theming, and service registration.
 *
 * @architectural_decision
 * **Separation of Concerns**: Monaco-specific types are isolated from general editor abstractions
 * to maintain clear boundaries between Monaco Editor API and application logic. This design
 * facilitates easier migration to alternative editors if needed and provides Monaco-specific
 * optimizations without affecting core editor interfaces.
 *
 * **Performance-First Design**: All interfaces prioritize performance considerations including
 * web worker configurations, lazy loading patterns, memory management, and efficient event handling.
 *
 * **Extensibility Framework**: Types support plugin architecture, custom language providers,
 * theme extensions, and service registration patterns for comprehensive editor customization.
 *
 * @performance_characteristics
 * - **Web Worker Support**: Full typing for offloading expensive operations to background threads
 * - **Memory Management**: Comprehensive disposal patterns prevent memory leaks
 * - **Lazy Loading**: Configuration for efficient Monaco Editor resource loading
 * - **Event Optimization**: Type-safe event handling with minimal overhead
 * - **Provider Registration**: Efficient language service provider management
 *
 * @example Basic Monaco Integration
 * ```typescript
 * import type { MonacoEditorManager, ExtendedEditorOptions } from '@/features/code-editor/types';
 *
 * class EditorService {
 *   private manager: MonacoEditorManager;
 *
 *   async initializeEditor(container: HTMLElement) {
 *     // Initialize with performance optimizations
 *     await this.manager.initialize({
 *       enableWorkers: true,
 *       enableLanguageFeatures: true,
 *       workerConfig: {
 *         getWorkerUrl: (moduleId, label) => {
 *           if (label === 'openscad') {
 *             return '/workers/openscad.worker.js';
 *           }
 *           return `/workers/${label}.worker.js`;
 *         },
 *         getWorker: (moduleId, label) => new Worker(this.getWorkerUrl(moduleId, label))
 *       }
 *     });
 *
 *     // Create editor with enhanced options
 *     const editorOptions: ExtendedEditorOptions = {
 *       language: 'openscad',
 *       theme: 'vs-dark',
 *       enableSyntaxHighlighting: true,
 *       enableAutoCompletion: true,
 *       enablePerformanceMonitoring: true,
 *       debounceMs: 300,
 *       maxFileSize: 1024 * 1024, // 1MB limit
 *       fontSize: 14,
 *       wordWrap: 'on',
 *       automaticLayout: true
 *     };
 *
 *     return await this.manager.createEditor(container, editorOptions);
 *   }
 * }
 * ```
 *
 * @example Language Provider Registration
 * ```typescript
 * import type {
 *   MonacoLanguageRegistration,
 *   MonacoCompletionProviderRegistration
 * } from '@/features/code-editor/types';
 *
 * // Register OpenSCAD language with full feature support
 * const openscadLanguage: MonacoLanguageRegistration = {
 *   id: 'openscad',
 *   extensions: ['.scad'],
 *   aliases: ['OpenSCAD', 'openscad'],
 *   mimetypes: ['text/x-openscad'],
 *   configuration: {
 *     comments: {
 *       lineComment: '//',
 *       blockComment: ['/*', '*\/']
 *     },
 *     brackets: [
 *       ['{', '}'],
 *       ['[', ']'],
 *       ['(', ')']
 *     ],
 *     autoClosingPairs: [
 *       { open: '{', close: '}' },
 *       { open: '[', close: ']' },
 *       { open: '(', close: ')' },
 *       { open: '"', close: '"' }
 *     ]
 *   },
 *   tokenizer: {
 *     defaultToken: 'invalid',
 *     keywords: ['module', 'function', 'if', 'else', 'for'],
 *     builtins: ['cube', 'sphere', 'cylinder', 'union', 'difference'],
 *     // ... additional tokenizer rules
 *   }
 * };
 *
 * // Register intelligent completion provider
 * const completionProvider: MonacoCompletionProviderRegistration = {
 *   languageId: 'openscad',
 *   triggerCharacters: ['.', '(', '['],
 *   provider: {
 *     provideCompletionItems: async (model, position, context) => {
 *       const word = model.getWordUntilPosition(position);
 *       const range = {
 *         startLineNumber: position.lineNumber,
 *         endLineNumber: position.lineNumber,
 *         startColumn: word.startColumn,
 *         endColumn: word.endColumn
 *       };
 *
 *       return {
 *         suggestions: [
 *           {
 *             label: 'cube',
 *             kind: monaco.languages.CompletionItemKind.Function,
 *             insertText: 'cube([${1:10}, ${2:10}, ${3:10}], center=${4:false});',
 *             insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
 *             documentation: 'Creates a cube with specified dimensions',
 *             range
 *           }
 *           // ... additional completions
 *         ]
 *       };
 *     }
 *   }
 * };
 * ```
 *
 * @example Performance Monitoring Integration
 * ```typescript
 * import type { MonacoEditorMetrics, MonacoEditorInstance } from '@/features/code-editor/types';
 *
 * class PerformanceMonitor {
 *   private metrics: MonacoEditorMetrics = {
 *     initializationTime: 0,
 *     renderTime: 0,
 *     updateTime: 0,
 *     memoryUsage: 0,
 *     modelSize: 0,
 *     lineCount: 0,
 *     characterCount: 0
 *   };
 *
 *   monitorEditor(editor: MonacoEditorInstance) {
 *     // Track content changes
 *     editor.editor.onDidChangeModelContent(() => {
 *       const startTime = performance.now();
 *
 *       // Update metrics
 *       this.metrics = {
 *         ...this.metrics,
 *         updateTime: performance.now() - startTime,
 *         modelSize: editor.model.getValueLength(),
 *         lineCount: editor.model.getLineCount(),
 *         characterCount: editor.getValue().length
 *       };
 *
 *       // Warn about performance issues
 *       if (this.metrics.updateTime > 50) {
 *         console.warn(`Slow editor update: ${this.metrics.updateTime}ms`);
 *       }
 *     });
 *
 *     // Monitor memory usage
 *     if (performance.memory) {
 *       setInterval(() => {
 *         this.metrics = {
 *           ...this.metrics,
 *           memoryUsage: performance.memory.usedJSHeapSize
 *         };
 *       }, 5000);
 *     }
 *   }
 *
 *   getMetrics(): MonacoEditorMetrics {
 *     return { ...this.metrics };
 *   }
 * }
 * ```
 *
 * @example Web Worker Configuration
 * ```typescript
 * import type { MonacoWorkerConfig, MonacoEnvironment } from '@/features/code-editor/types';
 *
 * // Configure web workers for optimal performance
 * const workerConfig: MonacoWorkerConfig = {
 *   getWorkerUrl: (moduleId: string, label: string): string => {
 *     const baseUrl = process.env.NODE_ENV === 'production'
 *       ? '/static/workers/'
 *       : '/workers/';
 *
 *     switch (label) {
 *       case 'openscad':
 *         return `${baseUrl}openscad.worker.js`;
 *       case 'typescript':
 *       case 'javascript':
 *         return `${baseUrl}ts.worker.js`;
 *       case 'json':
 *         return `${baseUrl}json.worker.js`;
 *       case 'css':
 *       case 'scss':
 *       case 'less':
 *         return `${baseUrl}css.worker.js`;
 *       case 'html':
 *       case 'handlebars':
 *       case 'razor':
 *         return `${baseUrl}html.worker.js`;
 *       default:
 *         return `${baseUrl}editor.worker.js`;
 *     }
 *   },
 *
 *   getWorker: (moduleId: string, label: string): Worker => {
 *     const workerUrl = this.getWorkerUrl(moduleId, label);
 *     const worker = new Worker(workerUrl, {
 *       type: 'module',
 *       name: `monaco-${label}-worker`
 *     });
 *
 *     // Configure worker error handling
 *     worker.onerror = (error) => {
 *       console.error(`Monaco worker error (${label}):`, error);
 *     };
 *
 *     return worker;
 *   }
 * };
 *
 * // Set up Monaco environment
 * const environment: MonacoEnvironment = {
 *   getWorkerUrl: workerConfig.getWorkerUrl,
 *   getWorker: workerConfig.getWorker,
 *   createTrustedTypesPolicy: (policyName: string, policyOptions: unknown) => {
 *     // Configure trusted types for CSP compliance
 *     if (window.trustedTypes && window.trustedTypes.createPolicy) {
 *       return window.trustedTypes.createPolicy(policyName, policyOptions);
 *     }
 *     return undefined;
 *   }
 * };
 *
 * // Apply to global Monaco environment
 * window.MonacoEnvironment = environment;
 * ```
 *
 * @example Theme and Action Registration
 * ```typescript
 * import type {
 *   MonacoThemeRegistration,
 *   MonacoActionRegistration
 * } from '@/features/code-editor/types';
 *
 * // Custom dark theme optimized for OpenSCAD
 * const openscadDarkTheme: MonacoThemeRegistration = {
 *   name: 'openscad-dark',
 *   base: 'vs-dark',
 *   inherit: true,
 *   rules: [
 *     { token: 'keyword.openscad', foreground: '569cd6' },
 *     { token: 'primitive.openscad', foreground: '4ec9b0' },
 *     { token: 'transform.openscad', foreground: 'dcdcaa' },
 *     { token: 'number.openscad', foreground: 'b5cea8' },
 *     { token: 'string.openscad', foreground: 'ce9178' },
 *     { token: 'comment.openscad', foreground: '6a9955', fontStyle: 'italic' }
 *   ],
 *   colors: {
 *     'editor.background': '#1e1e1e',
 *     'editor.foreground': '#d4d4d4',
 *     'editor.lineHighlightBackground': '#2d2d30',
 *     'editor.selectionBackground': '#264f78',
 *     'editorCursor.foreground': '#aeafad'
 *   }
 * };
 *
 * // Custom format action
 * const formatAction: MonacoActionRegistration = {
 *   id: 'openscad.format',
 *   label: 'Format OpenSCAD Code',
 *   keybindings: [
 *     monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF
 *   ],
 *   contextMenuGroupId: 'formatting',
 *   contextMenuOrder: 1,
 *   precondition: '!editorReadonly',
 *   run: async (editor) => {
 *     try {
 *       const model = editor.getModel();
 *       if (!model) return;
 *
 *       const value = model.getValue();
 *       const formatted = await formatOpenSCADCode(value);
 *
 *       model.setValue(formatted);
 *       console.log('OpenSCAD code formatted successfully');
 *     } catch (error) {
 *       console.error('Failed to format OpenSCAD code:', error);
 *     }
 *   }
 * };
 * ```
 *
 * @testing_integration
 * **Mock Implementations for Testing**:
 * ```typescript
 * import type { MonacoEditorInstance, MonacoEditorManager } from '@/features/code-editor/types';
 *
 * // Mock Monaco editor instance for testing
 * const createMockEditorInstance = (): MonacoEditorInstance => ({
 *   editor: {
 *     getValue: jest.fn(() => ''),
 *     setValue: jest.fn(),
 *     getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
 *     onDidChangeModelContent: jest.fn(() => ({ dispose: jest.fn() })),
 *     focus: jest.fn(),
 *     layout: jest.fn(),
 *     dispose: jest.fn()
 *   } as any,
 *   model: {
 *     getValue: jest.fn(() => ''),
 *     setValue: jest.fn(),
 *     getLineCount: jest.fn(() => 1),
 *     dispose: jest.fn()
 *   } as any,
 *   dispose: jest.fn(),
 *   updateOptions: jest.fn(),
 *   getValue: jest.fn(() => ''),
 *   setValue: jest.fn(),
 *   getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
 *   setPosition: jest.fn(),
 *   getSelection: jest.fn(() => null),
 *   setSelection: jest.fn(),
 *   focus: jest.fn(),
 *   layout: jest.fn()
 * });
 * ```
 *
 * @limitations
 * - **Monaco Version Dependency**: Types are coupled to specific Monaco Editor version
 * - **Web Worker Support**: Requires modern browser support for web workers
 * - **Memory Management**: Complex disposal patterns required for memory optimization
 * - **Build Configuration**: Requires specific webpack/vite configuration for Monaco assets
 *
 * @integration_notes
 * - **Webpack Integration**: Requires monaco-editor-webpack-plugin for proper asset bundling
 * - **Vite Integration**: Compatible with vite-plugin-monaco-editor
 * - **CSP Compliance**: Full support for Content Security Policy with Trusted Types
 * - **Accessibility**: Maintains Monaco's built-in accessibility features
 * - **Performance**: Optimized for large file handling and responsive UI
 */

import type * as monaco from 'monaco-editor';

/**
 * @interface MonacoWorkerConfig
 * @description Defines the configuration for Monaco Editor's web workers.
 * Web workers are used to offload expensive tasks like language analysis to a separate thread,
 * improving UI responsiveness.
 */
export interface MonacoWorkerConfig {
  /** @property A function that returns the URL for a given worker module. */
  readonly getWorkerUrl: (moduleId: string, label: string) => string;
  /** @property A function that returns a new Worker instance for a given module. */
  readonly getWorker: (moduleId: string, label: string) => Worker;
}

/**
 * @interface MonacoEnvironment
 * @description Configures the environment in which the Monaco Editor runs,
 * particularly how web workers are created.
 */
export interface MonacoEnvironment {
  readonly getWorkerUrl?: (moduleId: string, label: string) => string;
  readonly getWorker?: (moduleId: string, label: string) => Worker;
  readonly createTrustedTypesPolicy?: (policyName: string, policyOptions: unknown) => unknown;
}

/**
 * @interface MonacoLoaderConfig
 * @description Defines configuration for the Monaco Editor's loader,
 * which is responsible for loading the editor's source files.
 */
export interface MonacoLoaderConfig {
  /** @property Specifies the paths to the editor's source files. */
  readonly paths?: {
    readonly vs?: string;
  };
  /** @property Configures available languages for localization. */
  readonly 'vs/nls'?: {
    readonly availableLanguages?: Record<string, string>;
  };
}

/**
 * @interface MonacoInitOptions
 * @description Defines options for initializing the Monaco Editor loader.
 */
export interface MonacoInitOptions {
  readonly workerConfig?: MonacoWorkerConfig;
  readonly environment?: MonacoEnvironment;
  readonly loaderConfig?: MonacoLoaderConfig;
  readonly enableWorkers?: boolean;
  readonly enableLanguageFeatures?: boolean;
}

/**
 * @interface MonacoEditorInstance
 * @description Wraps a Monaco Editor instance, providing a simplified and consistent API.
 */
export interface MonacoEditorInstance {
  readonly editor: monaco.editor.IStandaloneCodeEditor;
  readonly model: monaco.editor.ITextModel;
  readonly dispose: () => void;
  readonly updateOptions: (options: monaco.editor.IStandaloneEditorConstructionOptions) => void;
  readonly getValue: () => string;
  readonly setValue: (value: string) => void;
  readonly getPosition: () => monaco.Position;
  readonly setPosition: (position: monaco.Position) => void;
  readonly getSelection: () => monaco.Selection | null;
  readonly setSelection: (selection: monaco.Selection) => void;
  readonly focus: () => void;
  readonly layout: (dimension?: monaco.editor.IDimension) => void;
}

/**
 * @interface MonacoLanguageRegistration
 * @description Defines the properties needed to register a new language with Monaco.
 */
export interface MonacoLanguageRegistration {
  readonly id: string;
  readonly extensions: ReadonlyArray<string>;
  readonly aliases: ReadonlyArray<string>;
  readonly mimetypes: ReadonlyArray<string>;
  readonly configuration: monaco.languages.LanguageConfiguration;
  readonly tokenizer: monaco.languages.IMonarchLanguage;
}

/**
 * @interface MonacoThemeRegistration
 * @description Defines the properties for registering a custom editor theme.
 */
export interface MonacoThemeRegistration {
  readonly name: string;
  readonly base: 'vs' | 'vs-dark' | 'hc-black';
  readonly inherit: boolean;
  readonly rules: ReadonlyArray<monaco.editor.ITokenThemeRule>;
  readonly colors: Record<string, string>;
}

/**
 * @interface MonacoCompletionProviderRegistration
 * @description Defines how to register a completion item provider for a specific language.
 */
export interface MonacoCompletionProviderRegistration {
  readonly languageId: string;
  readonly provider: monaco.languages.CompletionItemProvider;
  readonly triggerCharacters?: ReadonlyArray<string>;
}

/**
 * @interface MonacoDiagnosticProviderRegistration
 * @description Defines how to register a diagnostic provider to show errors and warnings.
 */
export interface MonacoDiagnosticProviderRegistration {
  readonly languageId: string;
  readonly provider: {
    readonly onDidChange?: monaco.IEvent<monaco.Uri>;
    readonly provideDiagnostics: (
      model: monaco.editor.ITextModel
    ) => Promise<ReadonlyArray<monaco.editor.IMarkerData>>;
  };
}

/**
 * @interface MonacoHoverProviderRegistration
 * @description Defines how to register a hover provider to show information on hover.
 */
export interface MonacoHoverProviderRegistration {
  readonly languageId: string;
  readonly provider: monaco.languages.HoverProvider;
}

/**
 * @interface MonacoFormattingProviderRegistration
 * @description Defines how to register a document formatting provider.
 */
export interface MonacoFormattingProviderRegistration {
  readonly languageId: string;
  readonly provider: monaco.languages.DocumentFormattingEditProvider;
}

/**
 * @interface MonacoActionRegistration
 * @description Defines a custom editor action that can be triggered by a keybinding or from the command palette.
 */
export interface MonacoActionRegistration {
  readonly id: string;
  readonly label: string;
  readonly keybindings?: ReadonlyArray<number>;
  readonly contextMenuGroupId?: string;
  readonly contextMenuOrder?: number;
  readonly precondition?: string;
  readonly run: (editor: monaco.editor.ICodeEditor, ...args: unknown[]) => void | Promise<void>;
}

/**
 * @interface MonacoCommandRegistration
 * @description Defines a command that can be executed within the editor.
 */
export interface MonacoCommandRegistration {
  readonly id: string;
  readonly handler: (accessor: unknown, ...args: unknown[]) => void | Promise<void>;
}

/**
 * @interface MonacoKeybindingRegistration
 * @description Defines a keybinding that triggers a specific command.
 */
export interface MonacoKeybindingRegistration {
  readonly keybinding: number;
  readonly command: string;
  readonly when?: string;
}

/**
 * @interface MonacoServiceRegistration
 * @description Defines how to register a custom service with the editor's dependency injection system.
 */
export interface MonacoServiceRegistration {
  readonly id: string;
  readonly service: unknown;
  readonly override?: boolean;
}

/**
 * @interface ExtendedEditorOptions
 * @description Extends the default Monaco editor options with custom application-specific settings.
 */
export interface ExtendedEditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {
  readonly enableSyntaxHighlighting?: boolean;
  readonly enableAutoCompletion?: boolean;
  readonly enableErrorSquiggles?: boolean;
  readonly enableHover?: boolean;
  readonly enableFormatting?: boolean;
  readonly debounceMs?: number;
  readonly maxFileSize?: number;
  readonly enablePerformanceMonitoring?: boolean;
}

/**
 * @interface MonacoEditorState
 * @description Represents the state of the Monaco editor at any given time.
 */
export interface MonacoEditorState {
  readonly isInitialized: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly editor: monaco.editor.IStandaloneCodeEditor | null;
  readonly model: monaco.editor.ITextModel | null;
  readonly viewState: monaco.editor.ICodeEditorViewState | null;
}

/**
 * @interface MonacoEditorMetrics
 * @description Defines the structure for performance and usage metrics of the editor.
 */
export interface MonacoEditorMetrics {
  readonly initializationTime: number;
  readonly renderTime: number;
  readonly updateTime: number;
  readonly memoryUsage: number;
  readonly modelSize: number;
  readonly lineCount: number;
  readonly characterCount: number;
}

/**
 * @interface MonacoEditorEvents
 * @description A collection of the core events exposed by the Monaco Editor.
 */
export interface MonacoEditorEvents {
  readonly onDidChangeModelContent: monaco.IEvent<monaco.editor.IModelContentChangedEvent>;
  readonly onDidChangeCursorPosition: monaco.IEvent<monaco.editor.ICursorPositionChangedEvent>;
  readonly onDidChangeCursorSelection: monaco.IEvent<monaco.editor.ICursorSelectionChangedEvent>;
  readonly onDidFocusEditorWidget: monaco.IEvent<void>;
  readonly onDidBlurEditorWidget: monaco.IEvent<void>;
  readonly onDidChangeModelLanguage: monaco.IEvent<monaco.editor.IModelLanguageChangedEvent>;
  readonly onDidChangeConfiguration: monaco.IEvent<monaco.editor.ConfigurationChangedEvent>;
}

/**
 * @interface MonacoEditorDisposables
 * @description A collection of disposable resources that need to be cleaned up when the editor is destroyed.
 */
export interface MonacoEditorDisposables {
  readonly editor: monaco.IDisposable;
  readonly model: monaco.IDisposable;
  readonly providers: ReadonlyArray<monaco.IDisposable>;
  readonly actions: ReadonlyArray<monaco.IDisposable>;
  readonly commands: ReadonlyArray<monaco.IDisposable>;
  readonly keybindings: ReadonlyArray<monaco.IDisposable>;
}

/**
 * @interface MonacoEditorFactory
 * @description Defines a factory for creating Monaco Editor instances and models.
 */
export interface MonacoEditorFactory {
  readonly create: (
    container: HTMLElement,
    options: ExtendedEditorOptions
  ) => Promise<MonacoEditorInstance>;
  readonly createModel: (
    value: string,
    language: string,
    uri?: monaco.Uri
  ) => monaco.editor.ITextModel;
  readonly dispose: () => void;
}

/**
 * @interface MonacoEditorManager
 * @description Defines a manager that orchestrates the entire lifecycle and configuration of the Monaco Editor.
 */
export interface MonacoEditorManager {
  readonly initialize: (options?: MonacoInitOptions) => Promise<void>;
  readonly createEditor: (
    container: HTMLElement,
    options: ExtendedEditorOptions
  ) => Promise<MonacoEditorInstance>;
  readonly registerLanguage: (registration: MonacoLanguageRegistration) => void;
  readonly registerTheme: (registration: MonacoThemeRegistration) => void;
  readonly registerCompletionProvider: (
    registration: MonacoCompletionProviderRegistration
  ) => monaco.IDisposable;
  readonly registerDiagnosticProvider: (
    registration: MonacoDiagnosticProviderRegistration
  ) => monaco.IDisposable;
  readonly registerHoverProvider: (
    registration: MonacoHoverProviderRegistration
  ) => monaco.IDisposable;
  readonly registerFormattingProvider: (
    registration: MonacoFormattingProviderRegistration
  ) => monaco.IDisposable;
  readonly registerAction: (registration: MonacoActionRegistration) => monaco.IDisposable;
  readonly registerCommand: (registration: MonacoCommandRegistration) => monaco.IDisposable;
  readonly registerKeybinding: (registration: MonacoKeybindingRegistration) => monaco.IDisposable;
  readonly dispose: () => void;
  readonly isInitialized: boolean;
}
