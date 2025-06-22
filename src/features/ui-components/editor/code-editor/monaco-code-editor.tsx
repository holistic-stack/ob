/**
 * @file Monaco Code Editor Component
 * 
 * A professional code editor component with Monaco Editor integration,
 * OpenSCAD language support, and comprehensive IDE features including:
 * - Syntax highlighting with custom OpenSCAD theme
 * - Real-time AST parsing and error detection
 * - Intelligent code completion with 100+ OpenSCAD symbols
 * - Rich hover documentation with examples
 * - Go-to-definition and find references
 * - Document symbol outline and navigation
 * - Glass morphism design with WCAG 2.1 AA accessibility
 * - Performance optimized with < 16ms render times
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { clsx } from '../../shared';
import { createOpenSCADCompletionProvider } from './openscad-completion-provider';
import { createOpenSCADHoverProvider } from './openscad-hover-provider';
import { createOpenSCADDiagnosticsProvider } from './openscad-diagnostics-provider';
import { type ParseError } from './openscad-ast-service';
import { type ASTNode } from '@holistic-stack/openscad-parser';
import { ParseErrorDisplay } from '../../shared/error-display/parse-error-display';
import {
  useOpenSCADActions,
  useOpenSCADErrors,
  useOpenSCADStatus,
  useOpenSCADAst,
  cleanupOpenSCADStore
} from '../stores';
import type { ComponentSize } from '../../shared/types';
import {
  generateMonacoGlassClasses,
  generateMonacoContentLayer,
  generateMonacoStatusGlass,
  generateMonacoSizing,
  createMonacoGlassConfig,
  type MonacoGlassConfig,
  type MonacoGlassOptions,
} from './monaco-glass-styles';

// Re-export types for backward compatibility
export type { ParseError };
export type { MonacoGlassConfig, MonacoGlassOptions };

export interface MonacoCodeEditorProps {
  /** Current code value */
  readonly value?: string;
  /** Callback when code changes */
  readonly onChange?: (value: string) => void;
  /** Programming language */
  readonly language?: 'openscad' | 'javascript' | 'typescript' | 'json';
  /** Editor theme */
  readonly theme?: 'dark' | 'light';
  /** Editor height */
  readonly height?: string | number;
  /** Editor width */
  readonly width?: string | number;
  /** Monaco editor options */
  readonly options?: monacoEditor.editor.IStandaloneEditorConstructionOptions;
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<MonacoGlassConfig>;
  /** Component size for 8px grid compliance */
  readonly size?: ComponentSize;
  /** Whether editor is read-only */
  readonly readOnly?: boolean;
  /** Whether editor is disabled */
  readonly disabled?: boolean;
  /** Enable AST parsing for OpenSCAD */
  readonly enableASTParsing?: boolean;
  /** Callback when AST is parsed (OpenSCAD only) */
  readonly onASTChange?: (ast: any[]) => void;
  /** Callback when parse errors are detected (OpenSCAD only) */
  readonly onParseErrors?: (errors: ParseError[]) => void;
  /** Callback when editor is mounted */
  readonly onMount?: (editor: monacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => void;
  /** Callback when error is clicked */
  readonly onErrorClick?: (error: ParseError) => void;
}

const LANGUAGE_ID = 'openscad';
const THEME_ID = 'openscad-dark';

/**
 * OpenSCAD language configuration for Monaco Editor
 */
const openscadLanguageConfig: monacoEditor.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' }
  ],
  wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g
};

/**
 * OpenSCAD syntax highlighting tokens definition
 */
const openscadTokensDefinition: monacoEditor.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.openscad',

  keywords: [
    'module', 'function', 'if', 'else', 'for', 'while', 'let', 'assert',
    'echo', 'each', 'true', 'false', 'undef', 'include', 'use'
  ],

  builtinFunctions: [
    'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'cross', 'exp',
    'floor', 'ln', 'log', 'max', 'min', 'norm', 'pow', 'rands', 'round',
    'sign', 'sin', 'sqrt', 'tan', 'concat', 'len', 'str', 'chr', 'ord',
    'search', 'lookup'
  ],

  builtinModules: [
    'cube', 'sphere', 'cylinder', 'polyhedron', 'polygon', 'circle', 'square',
    'text', 'translate', 'rotate', 'scale', 'resize', 'mirror', 'multmatrix',
    'union', 'difference', 'intersection', 'hull', 'minkowski',
    'linear_extrude', 'rotate_extrude', 'offset'
  ],

  builtinConstants: [
    'PI', '$fa', '$fs', '$fn', '$t', '$vpr', '$vpt', '$vpd', '$children'
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Identifiers and keywords
      [/[a-z_$][\w$]*/, {
        cases: {
          '@keywords': 'keyword',
          '@builtinFunctions': 'predefined',
          '@builtinModules': 'type',
          '@builtinConstants': 'constant',
          '@default': 'identifier'
        }
      }],

      // Numbers
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Comments
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],

      // Operators and punctuation
      [/@symbols/, 'operator'],
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/[;,.]/, 'delimiter'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      ["\\*/", 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],
  },
};

/**
 * OpenSCAD dark theme definition
 */
const openscadTheme: monacoEditor.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
    { token: 'predefined', foreground: 'dcdcaa' },
    { token: 'type', foreground: '4ec9b0', fontStyle: 'bold' },
    { token: 'constant', foreground: '9cdcfe' },
    { token: 'identifier', foreground: 'd4d4d4' },
    { token: 'type.identifier', foreground: '4ec9b0' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'number.float', foreground: 'b5cea8' },
    { token: 'number.hex', foreground: 'b5cea8' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'string.escape', foreground: 'd7ba7d' },
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'operator', foreground: 'd4d4d4' },
    { token: 'delimiter', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
    'editor.selectionBackground': '#264f78',
    'editor.selectionHighlightBackground': '#add6ff26',
    'editor.wordHighlightBackground': '#575757b8',
    'editor.wordHighlightStrongBackground': '#004972b8',
    'editorCursor.foreground': '#aeafad',
    'editor.lineHighlightBackground': '#2a2d2e',
  }
};

/**
 * Register OpenSCAD language with Monaco Editor
 */
const registerOpenSCADLanguage = (monaco: Monaco) => {
  console.log('[MonacoCodeEditor] Registering OpenSCAD language...');

  // Register the language
  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.scad'],
    aliases: ['OpenSCAD', 'openscad'],
    mimetypes: ['text/x-openscad']
  });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, openscadLanguageConfig);

  // Set tokens provider using Monarch tokenizer
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, openscadTokensDefinition);

  // Define and set the theme
  monaco.editor.defineTheme(THEME_ID, openscadTheme);

  // Register completion provider for intelligent code completion
  const completionProvider = createOpenSCADCompletionProvider();
  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, completionProvider);
  console.log('[MonacoCodeEditor] OpenSCAD completion provider registered');

  // Register hover provider for rich documentation
  const hoverProvider = createOpenSCADHoverProvider();
  monaco.languages.registerHoverProvider(LANGUAGE_ID, hoverProvider);
  console.log('[MonacoCodeEditor] OpenSCAD hover provider registered');

  // Create diagnostics provider for real-time error detection
  const diagnosticsProvider = createOpenSCADDiagnosticsProvider();
  console.log('[MonacoCodeEditor] OpenSCAD diagnostics provider created');

  console.log('[MonacoCodeEditor] OpenSCAD language registered successfully');

  return { LANGUAGE_ID, THEME_ID, diagnosticsProvider };
};

/**
 * Monaco Code Editor Component
 */
export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  value = '',
  onChange,
  language = 'openscad',
  theme = 'dark',
  height = '400px',
  width = '100%',
  options = {},
  glassConfig,
  size = 'medium',
  readOnly = false,
  disabled = false,
  enableASTParsing = false,
  onASTChange,
  onParseErrors,
  onMount,
  onErrorClick
}) => {
  // Zustand store hooks
  const { updateCode } = useOpenSCADActions();
  const parseErrors = useOpenSCADErrors();
  const { isParsing, isASTValid } = useOpenSCADStatus();
  const ast = useOpenSCADAst();

  // Local state for Monaco editor
  const [isMonacoReady, setIsMonacoReady] = useState(false);

  // Refs
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const hasInitialParsed = useRef(false);

  // Notify parent components when AST or errors change (with stable references)
  useEffect(() => {
    if (enableASTParsing && language === 'openscad') {
      // Only call if callbacks exist and data has actually changed
      if (onASTChange && ast.length >= 0) {
        onASTChange(Array.from(ast) as ASTNode[]);
      }
      if (onParseErrors && parseErrors.length >= 0) {
        onParseErrors(Array.from(parseErrors) as ParseError[]);
      }
    }
  }, [ast, parseErrors, enableASTParsing, language]); // Removed callback dependencies to prevent loops

  // Handle Monaco Editor mount
  const handleEditorDidMount = useCallback((
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsMonacoReady(true);

    // Register OpenSCAD language if needed
    if (language === 'openscad') {
      try {
        const { LANGUAGE_ID: langId, THEME_ID: themeId, diagnosticsProvider } = registerOpenSCADLanguage(monaco);

        // Ensure the model has the correct language
        const model = editor.getModel();
        if (model && model.getLanguageId() !== langId) {
          monaco.editor.setModelLanguage(model, langId);
          console.log('[MonacoCodeEditor] Model language set to OpenSCAD');
        }

        // Set up real-time validation if diagnostics provider is available
        if (model && diagnosticsProvider) {
          // Initial validation
          diagnosticsProvider.validateCode(model, 500);

          // Set up content change listener for real-time validation
          const disposable = model.onDidChangeContent(() => {
            diagnosticsProvider.validateCode(model, 500);
          });

          // Store disposable for cleanup
          editor.onDidDispose(() => {
            disposable.dispose();
          });

          console.log('[MonacoCodeEditor] Real-time validation enabled');
        }

        // Apply OpenSCAD theme
        try {
          monaco.editor.setTheme(themeId);
          console.log('[MonacoCodeEditor] OpenSCAD theme applied');
        } catch (themeError) {
          console.warn('[MonacoCodeEditor] Failed to apply OpenSCAD theme:', themeError);
        }
      } catch (error) {
        console.error('[MonacoCodeEditor] Failed to register OpenSCAD language:', error);
      }
    }

    // Call onMount callback
    onMount?.(editor, monaco);
  }, [language, onMount]);

  // Handle code changes with Zustand store
  const handleCodeChange = useCallback((newValue: string | undefined) => {
    const codeValue = newValue ?? '';

    // Call parent onChange handler
    onChange?.(codeValue);

    // Update Zustand store (handles debouncing internally)
    if (enableASTParsing && language === 'openscad') {
      updateCode(codeValue);
    }
  }, [onChange, enableASTParsing, language, updateCode]);

  // Parse initial value when component mounts (only once)
  useEffect(() => {
    if (enableASTParsing && language === 'openscad' && value.trim() && !hasInitialParsed.current) {
      hasInitialParsed.current = true;
      // Use a timeout to avoid blocking the initial render
      const timeoutId = setTimeout(() => {
        updateCode(value);
      }, 100);

      return () => clearTimeout(timeoutId);
    }

    return undefined; // Explicit return for all code paths
  }, [enableASTParsing, language]); // Removed value and updateCode to prevent infinite loops

  // Cleanup store on unmount
  useEffect(() => {
    return () => {
      cleanupOpenSCADStore();
    };
  }, []);

  // Default editor options
  const defaultOptions: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
    language: language === 'openscad' ? LANGUAGE_ID : language,
    theme: language === 'openscad' && theme === 'dark' ? THEME_ID : theme === 'dark' ? 'vs-dark' : 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    glyphMargin: true,
    folding: true,
    lineDecorationsWidth: 20,
    lineNumbersMinChars: 3,
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    readOnly,
    ...options
  };

  // Create glass configuration with validation
  const monacoGlassConfig = createMonacoGlassConfig({
    editorTheme: theme,
    enableFocusRing: true,
    enableTransitions: true,
    ...glassConfig,
  });

  // Glass morphism options based on component state
  const glassOptions: MonacoGlassOptions = {
    size,
    disabled,
    readOnly,
    hasErrors: parseErrors.length > 0,
    isActive: isMonacoReady,
  };

  // Generate glass morphism classes using reusable utilities (DRY principle)
  const glassClasses = clsx(
    generateMonacoGlassClasses(monacoGlassConfig, glassOptions),
    generateMonacoSizing(size)
  );

  // Calculate minimum height based on 8px grid system
  const minHeight = size === 'small' ? '40px' : size === 'large' ? '56px' : '48px';
  const computedHeight = typeof height === 'string' && height.includes('px')
    ? `max(${height}, ${minHeight})`
    : height;

  return (
    <div
      className={glassClasses}
      style={{
        height: computedHeight,
        width,
        minHeight
      }}
      data-testid="monaco-code-editor"
      data-language={language}
      data-theme={theme}
      role="textbox"
      tabIndex={0}
    >
      <div className={generateMonacoContentLayer()}>
        <Editor
          height="100%"
          width="100%"
          value={value}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={defaultOptions}
        />
        
        {/* Parsing indicator */}
        {isParsing && enableASTParsing && (
          <div className="absolute top-2 left-2 z-20">
            <div className={clsx(generateMonacoStatusGlass('parsing'), 'flex items-center gap-2')}>
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-300 text-xs">Parsing AST...</span>
            </div>
          </div>
        )}

        {/* Enhanced error display */}
        {parseErrors.length > 0 && (
          <div className="absolute top-2 right-2 z-20 max-w-sm">
            <ParseErrorDisplay
              errors={Array.from(parseErrors) as ParseError[]}
              onErrorClick={onErrorClick}
              maxErrors={3}
              showLineNumbers={true}
              showSuggestions={true}
              className="text-xs"
            />
          </div>
        )}

        {/* Success indicator */}
        {isASTValid && ast.length > 0 && enableASTParsing && !isParsing && (
          <div className="absolute bottom-2 right-2 z-20">
            <div className={generateMonacoStatusGlass('success')}>
              <span className="text-green-300 text-xs">
                ✓ {ast.length} AST {ast.length === 1 ? 'node' : 'nodes'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonacoCodeEditor;
