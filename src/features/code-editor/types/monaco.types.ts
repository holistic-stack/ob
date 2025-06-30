/**
 * Monaco Editor Integration Types
 *
 * Specific types for Monaco Editor integration with React and TypeScript,
 * including worker configuration and language registration.
 */

import type * as monaco from 'monaco-editor';

/**
 * Monaco worker configuration
 */
export interface MonacoWorkerConfig {
  readonly getWorkerUrl: (moduleId: string, label: string) => string;
  readonly getWorker: (moduleId: string, label: string) => Worker;
}

/**
 * Monaco environment configuration
 */
export interface MonacoEnvironment {
  readonly getWorkerUrl?: (moduleId: string, label: string) => string;
  readonly getWorker?: (moduleId: string, label: string) => Worker;
  readonly createTrustedTypesPolicy?: (policyName: string, policyOptions: unknown) => unknown;
}

/**
 * Monaco loader configuration
 */
export interface MonacoLoaderConfig {
  readonly paths?: {
    readonly vs?: string;
  };
  readonly 'vs/nls'?: {
    readonly availableLanguages?: Record<string, string>;
  };
}

/**
 * Monaco initialization options
 */
export interface MonacoInitOptions {
  readonly workerConfig?: MonacoWorkerConfig;
  readonly environment?: MonacoEnvironment;
  readonly loaderConfig?: MonacoLoaderConfig;
  readonly enableWorkers?: boolean;
  readonly enableLanguageFeatures?: boolean;
}

/**
 * Monaco editor instance wrapper
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
 * Monaco language registration
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
 * Monaco theme registration
 */
export interface MonacoThemeRegistration {
  readonly name: string;
  readonly base: 'vs' | 'vs-dark' | 'hc-black';
  readonly inherit: boolean;
  readonly rules: ReadonlyArray<monaco.editor.ITokenThemeRule>;
  readonly colors: Record<string, string>;
}

/**
 * Monaco completion provider registration
 */
export interface MonacoCompletionProviderRegistration {
  readonly languageId: string;
  readonly provider: monaco.languages.CompletionItemProvider;
  readonly triggerCharacters?: ReadonlyArray<string>;
}

/**
 * Monaco diagnostic provider registration
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
 * Monaco hover provider registration
 */
export interface MonacoHoverProviderRegistration {
  readonly languageId: string;
  readonly provider: monaco.languages.HoverProvider;
}

/**
 * Monaco formatting provider registration
 */
export interface MonacoFormattingProviderRegistration {
  readonly languageId: string;
  readonly provider: monaco.languages.DocumentFormattingEditProvider;
}

/**
 * Monaco action registration
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
 * Monaco command registration
 */
export interface MonacoCommandRegistration {
  readonly id: string;
  readonly handler: (accessor: unknown, ...args: unknown[]) => void | Promise<void>;
}

/**
 * Monaco keybinding registration
 */
export interface MonacoKeybindingRegistration {
  readonly keybinding: number;
  readonly command: string;
  readonly when?: string;
}

/**
 * Monaco service registration
 */
export interface MonacoServiceRegistration {
  readonly id: string;
  readonly service: unknown;
  readonly override?: boolean;
}

/**
 * Monaco editor options extension
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
 * Monaco editor state
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
 * Monaco editor metrics
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
 * Monaco editor events
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
 * Monaco editor disposables
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
 * Monaco editor factory
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
 * Monaco editor manager
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
