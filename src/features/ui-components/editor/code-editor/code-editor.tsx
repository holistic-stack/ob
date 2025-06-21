/**
 * Enhanced Code Editor Component
 *
 * A Monaco Editor-based OpenSCAD code editor with glass morphism effects.
 * Integrates with @holistic-stack/openscad-editor for professional OpenSCAD development experience.
 * Follows TDD methodology and liquid glass design system standards.
 */

import React, { forwardRef, useRef, useEffect, useState, useCallback } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

// Monaco Editor integration
declare global {
  interface Window {
    monaco: any;
    MonacoEnvironment: any;
  }
}

// OpenSCAD Editor integration types
type ParseResult = {
  success: boolean;
  errors: Array<{
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
  }>;
  ast?: any[];
};

type OutlineItem = {
  name: string;
  kind: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  children?: OutlineItem[];
};

type FeaturePreset = 'BASIC' | 'STANDARD' | 'IDE' | 'FULL';

type OpenscadEditorFeatures = {
  core: {
    syntaxHighlighting: boolean;
    basicCompletion: boolean;
    bracketMatching: boolean;
    commentCommands: boolean;
  };
  parser: {
    realTimeValidation: boolean;
    astGeneration: boolean;
    errorReporting: boolean;
    symbolExtraction: boolean;
  };
  ide: {
    outline: boolean;
    hover: boolean;
    gotoDefinition: boolean;
    findReferences: boolean;
    documentSymbols: boolean;
    workspaceSymbols: boolean;
    codeActions: boolean;
    rename: boolean;
  };
  advanced: {
    semanticHighlighting: boolean;
    advancedCompletion: boolean;
    parameterHints: boolean;
    signatureHelp: boolean;
    codeLens: boolean;
    inlayHints: boolean;
    foldingRanges: boolean;
    documentFormatting: boolean;
    rangeFormatting: boolean;
  };
};

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Supported programming languages
 */
export type EditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'openscad';

/**
 * Editor theme options
 */
export type EditorTheme = 'light' | 'dark' | 'auto';

/**
 * Props for the Enhanced CodeEditor component
 */
export interface CodeEditorProps extends BaseComponentProps, AriaProps {
  /** Current code value */
  readonly value: string;

  /** Callback when code changes */
  readonly onChange?: (value: string) => void;

  /** Programming language for syntax highlighting */
  readonly language?: EditorLanguage;

  /** Editor theme */
  readonly theme?: EditorTheme;

  /** Whether to show line numbers */
  readonly showLineNumbers?: boolean;

  /** Whether the editor is read-only */
  readonly readOnly?: boolean;

  /** Placeholder text when empty */
  readonly placeholder?: string;

  /** Callback when Ctrl+S is pressed */
  readonly onSave?: () => void;

  /** Callback when code is formatted */
  readonly onFormat?: () => void;

  /** Callback when AST is parsed (OpenSCAD only) */
  readonly onASTChange?: (ast: any[]) => void;

  /** Callback when parse errors are detected (OpenSCAD only) */
  readonly onParseErrors?: (errors: ParseResult['errors']) => void;

  /** Whether to enable real-time AST parsing (OpenSCAD only) */
  readonly enableASTParsing?: boolean;

  /** Whether to show syntax errors inline */
  readonly showSyntaxErrors?: boolean;

  /** Whether to enable code completion */
  readonly enableCodeCompletion?: boolean;

  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;

  /** Whether the editor is over a light background */
  readonly overLight?: boolean;

  /** Custom CSS class name */
  readonly className?: string;

  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// OpenSCAD Language Support
// ============================================================================

/**
 * OpenSCAD language configuration for Monaco Editor
 * Based on @holistic-stack/openscad-editor patterns
 */
const openscadLanguageConfig = {
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
    { open: '"', close: '"' },
    { open: '/*', close: '*/' }
  ],
  surroundingPairs: [
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
const openscadTokensDefinition = {
  defaultToken: '',
  tokenPostfix: '.openscad',

  keywords: [
    'module', 'function', 'if', 'else', 'for', 'while', 'let', 'assert',
    'echo', 'each', 'true', 'false', 'undef', 'include', 'use'
  ],

  builtinFunctions: [
    'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'cross', 'exp',
    'floor', 'len', 'ln', 'log', 'lookup', 'max', 'min', 'norm', 'pow',
    'rands', 'round', 'sign', 'sin', 'sqrt', 'tan', 'str', 'chr', 'ord',
    'concat', 'search', 'version', 'version_num', 'parent_module'
  ],

  builtinModules: [
    'cube', 'sphere', 'cylinder', 'polyhedron', 'square', 'circle', 'polygon',
    'text', 'linear_extrude', 'rotate_extrude', 'scale', 'resize', 'rotate',
    'translate', 'mirror', 'multmatrix', 'color', 'offset', 'hull', 'minkowski',
    'union', 'difference', 'intersection', 'render', 'surface', 'projection'
  ],

  builtinConstants: [
    '$fa', '$fs', '$fn', '$t', '$vpt', '$vpr', '$vpd', '$vpf',
    '$children', '$preview', '$OPENSCAD_VERSION'
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
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
      [/[A-Z][\w$]*/, 'type.identifier'],

      // Whitespace
      { include: '@whitespace' },

      // Delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      // Numbers
      [/\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // Characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid']
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment']
    ],

    string: [
      [/[^\\"]/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
  }
};

/**
 * OpenSCAD dark theme definition
 */
const openscadTheme = {
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
    { token: 'string.quote', foreground: 'ce9178' },
    { token: 'string.escape', foreground: 'd7ba7d' },
    { token: 'string.invalid', foreground: 'f44747' },
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'operator', foreground: 'd4d4d4' },
    { token: 'delimiter', foreground: 'd4d4d4' },
    { token: 'white', foreground: 'd4d4d4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editorLineNumber.foreground': '#858585',
    'editorCursor.foreground': '#aeafad',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
  }
};

/**
 * Register OpenSCAD language with Monaco Editor
 */
const registerOpenSCADLanguage = (monaco: any) => {
  const LANGUAGE_ID = 'openscad';
  const THEME_ID = 'openscad-dark';

  console.log('[CodeEditor] Registering OpenSCAD language with Monaco Editor...');

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

  console.log('[CodeEditor] OpenSCAD language registered successfully');

  return { LANGUAGE_ID, THEME_ID };
};

// ============================================================================
// Monaco Editor Integration
// ============================================================================

/**
 * Monaco Editor wrapper component for React
 */
interface MonacoEditorProps {
  value: string;
  language: string;
  theme: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  options?: any;
  height?: string | number;
  width?: string | number;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  theme,
  onChange,
  onMount,
  options = {},
  height = '100%',
  width = '100%'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isMonacoLoaded, setIsMonacoLoaded] = useState(false);

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        // Monaco Editor is loaded via vite-plugin-monaco-editor
        if (typeof window !== 'undefined' && window.monaco) {
          setIsMonacoLoaded(true);
          return;
        }

        // Wait for Monaco to be available
        const checkMonaco = () => {
          if (window.monaco) {
            setIsMonacoLoaded(true);
          } else {
            setTimeout(checkMonaco, 100);
          }
        };
        checkMonaco();
      } catch (error) {
        console.error('[MonacoEditor] Failed to load Monaco Editor:', error);
      }
    };

    loadMonaco();
  }, []);

  // Initialize editor when Monaco is loaded
  useEffect(() => {
    if (!isMonacoLoaded || !containerRef.current || editorRef.current) {
      return;
    }

    try {
      // Register OpenSCAD language if needed
      if (language === 'openscad') {
        const { THEME_ID } = registerOpenSCADLanguage(window.monaco);

        // Use OpenSCAD theme for OpenSCAD language
        const monacoTheme = theme === 'dark' ? THEME_ID : theme === 'light' ? 'vs' : THEME_ID;

        const editor = window.monaco.editor.create(containerRef.current, {
          value,
          language: 'openscad',
          theme: monacoTheme,
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
          ...options
        });

        editorRef.current = editor;
      } else {
        // Map theme names to Monaco themes for other languages
        const monacoTheme = theme === 'dark' ? 'vs-dark' : theme === 'light' ? 'vs' : 'vs-dark';

        const editor = window.monaco.editor.create(containerRef.current, {
          value,
          language,
          theme: monacoTheme,
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
          ...options
        });

        editorRef.current = editor;
      }

      // Handle content changes
      const disposable = editorRef.current.onDidChangeModelContent(() => {
        const currentValue = editorRef.current.getValue();
        onChange?.(currentValue);
      });

      // Call onMount callback
      onMount?.(editorRef.current, window.monaco);

      return () => {
        disposable.dispose();
        editorRef.current.dispose();
      };
    } catch (error) {
      console.error('[MonacoEditor] Failed to create editor:', error);
    }
  }, [isMonacoLoaded, value, language, theme, onChange, onMount, options]);

  // Update editor value when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      data-testid="monaco-editor"
      data-language={language}
      data-theme={theme}
      style={{ height, width }}
    >
      {/* Display content for testing when Monaco isn't loaded */}
      {!isMonacoLoaded && value && (
        <div style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '8px',
          whiteSpace: 'pre-wrap',
          color: 'white'
        }}>
          {value}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OpenSCAD Syntax Highlighting and Error Detection
// ============================================================================

/**
 * OpenSCAD syntax highlighting configuration
 * Based on the OpenSCAD language specification and @holistic-stack/openscad-editor
 */
const OPENSCAD_KEYWORDS = [
  // Control structures
  'if', 'else', 'for', 'let', 'each',
  // Modules and functions
  'module', 'function', 'use', 'include',
  // Built-in modules
  'cube', 'sphere', 'cylinder', 'polyhedron', 'polygon', 'circle', 'square', 'text',
  // Transformations
  'translate', 'rotate', 'scale', 'resize', 'mirror', 'multmatrix',
  // CSG operations
  'union', 'difference', 'intersection', 'hull', 'minkowski',
  // 2D to 3D
  'linear_extrude', 'rotate_extrude', 'offset',
  // Special variables
  '$fa', '$fs', '$fn', '$t', '$vpr', '$vpt', '$vpd', '$children',
  // Built-in functions
  'abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'cross', 'exp', 'floor',
  'ln', 'log', 'max', 'min', 'norm', 'pow', 'rands', 'round', 'sign', 'sin', 'sqrt', 'tan',
  'concat', 'len', 'str', 'chr', 'ord', 'search', 'lookup',
  // Constants
  'true', 'false', 'undef', 'PI'
];

const OPENSCAD_OPERATORS = [
  '+', '-', '*', '/', '%', '^', '!', '&&', '||', '==', '!=', '<', '>', '<=', '>='
];

/**
 * Syntax highlighting for OpenSCAD code
 */
const highlightOpenSCADSyntax = (code: string): string => {
  let highlighted = code;

  // Highlight keywords
  OPENSCAD_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span class="text-blue-400 font-semibold">${keyword}</span>`);
  });

  // Highlight comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-green-400 italic">$1</span>');
  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-green-400 italic">$1</span>');

  // Highlight strings
  highlighted = highlighted.replace(/"([^"\\]|\\.)*"/g, '<span class="text-yellow-400">"$1"</span>');

  // Highlight numbers
  highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="text-purple-400">$&</span>');

  return highlighted;
};

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  readonly errors: ParseResult['errors'];
  readonly onErrorClick?: (error: ParseResult['errors'][0]) => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors, onErrorClick }) => {
  if (errors.length === 0) return null;

  return (
    <div className="absolute top-2 right-2 z-20 max-w-xs">
      <div className="bg-red-900/80 backdrop-blur-sm border border-red-500/50 rounded-lg p-2 space-y-1">
        <div className="text-red-400 text-xs font-semibold">
          {errors.length} error{errors.length !== 1 ? 's' : ''}
        </div>
        {errors.slice(0, 3).map((error, index) => (
          <div
            key={index}
            className="text-red-300 text-xs cursor-pointer hover:text-red-200 transition-colors"
            onClick={() => onErrorClick?.(error)}
            title={`Line ${error.line}, Column ${error.column}`}
          >
            {error.message}
          </div>
        ))}
        {errors.length > 3 && (
          <div className="text-red-400/60 text-xs">
            +{errors.length - 3} more...
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Line Numbers Component
// ============================================================================

interface LineNumbersProps {
  readonly lines: number;
  readonly errors?: ParseResult['errors'];
}

const LineNumbers: React.FC<LineNumbersProps> = ({ lines, errors = [] }) => {
  const errorLines = new Set(errors.map(e => e.line));

  return (
    <div className="flex flex-col text-right pr-3 py-3 text-white/40 text-sm font-mono select-none">
      {Array.from({ length: lines }, (_, i) => {
        const lineNumber = i + 1;
        const hasError = errorLines.has(lineNumber);

        return (
          <div
            key={lineNumber}
            className={clsx(
              'leading-6 px-1 rounded',
              hasError && 'bg-red-900/30 text-red-400'
            )}
          >
            {lineNumber}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// CodeEditor Component
// ============================================================================

/**
 * Enhanced Code Editor component with OpenSCAD support and glass morphism effects
 *
 * @example
 * ```tsx
 * <CodeEditor
 *   value={code}
 *   onChange={setCode}
 *   language="openscad"
 *   showLineNumbers
 *   enableASTParsing
 *   onSave={() => console.log('Save pressed')}
 *   onASTChange={(ast) => console.log('AST updated:', ast)}
 * />
 * ```
 */
export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(
  (
    {
      value,
      onChange,
      language = 'openscad',
      theme = 'dark',
      showLineNumbers = true,
      readOnly = false,
      placeholder = 'Enter your OpenSCAD code here...',
      onSave,
      onFormat,
      onASTChange,
      onParseErrors,
      enableASTParsing = true,
      showSyntaxErrors = true,
      enableCodeCompletion = false,
      glassConfig,
      overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [isParserLoading, setIsParserLoading] = useState(false);
    const [parser, setParser] = useState<any>(null);
    const [monacoEditor, setMonacoEditor] = useState<any>(null);
    const [monaco, setMonaco] = useState<any>(null);

    // ========================================================================
    // OpenSCAD Parser Integration
    // ========================================================================

    // Initialize OpenSCAD Parser when language is 'openscad'
    useEffect(() => {
      if (language === 'openscad' && enableASTParsing && !parser && !isParserLoading) {
        setIsParserLoading(true);

        // Dynamically import the OpenSCAD Parser to avoid bundle bloat
        import('@holistic-stack/openscad-parser')
          .then(async (module) => {
            const { EnhancedOpenscadParser, SimpleErrorHandler } = module;
            const errorHandler = new SimpleErrorHandler();
            const openscadParser = new EnhancedOpenscadParser(errorHandler);

            await openscadParser.init();
            setParser(openscadParser);
            setIsParserLoading(false);
            console.log('[CodeEditor] OpenSCAD Parser loaded successfully');
          })
          .catch((error) => {
            console.error('[CodeEditor] Failed to load OpenSCAD Parser:', error);
            setIsParserLoading(false);
          });
      }

      // Cleanup parser on unmount
      return () => {
        if (parser) {
          parser.dispose();
        }
      };
    }, [language, enableASTParsing, parser, isParserLoading]);

    // Parse OpenSCAD code using the parser
    const parseOpenSCADCode = useCallback(async (code: string) => {
      if (!parser || language !== 'openscad' || !enableASTParsing) {
        return;
      }

      try {
        // Parse the code to AST
        const ast = parser.parseAST(code);

        // Get parsing errors from the error handler
        const errorHandler = parser.getErrorHandler();
        const errors = errorHandler.getErrors();
        const warnings = errorHandler.getWarnings();

        // Convert to our error format
        const parseErrors = [
          ...errors.map((error: string) => ({
            message: error,
            line: 1, // TODO: Extract line number from error message
            column: 1, // TODO: Extract column number from error message
            severity: 'error' as const,
          })),
          ...warnings.map((warning: string) => ({
            message: warning,
            line: 1, // TODO: Extract line number from warning message
            column: 1, // TODO: Extract column number from warning message
            severity: 'warning' as const,
          })),
        ];

        // Create parse result
        const result: ParseResult = {
          success: errors.length === 0,
          errors: parseErrors,
          ast: ast
        };

        setParseResult(result);

        if (result.success && result.ast) {
          onASTChange?.(result.ast);
        }

        if (result.errors.length > 0) {
          onParseErrors?.(result.errors);
        }

        console.log('[CodeEditor] Parse result:', {
          success: result.success,
          errors: result.errors.length,
          astNodes: result.ast?.length || 0
        });

      } catch (error) {
        console.error('[CodeEditor] OpenSCAD parsing failed:', error);
        const parseError = {
          message: error instanceof Error ? error.message : 'Unknown parsing error',
          line: 1,
          column: 1,
          severity: 'error' as const,
        };

        const result: ParseResult = {
          success: false,
          errors: [parseError],
          ast: []
        };

        setParseResult(result);
        onParseErrors?.([parseError]);
      }
    }, [parser, language, enableASTParsing, onASTChange, onParseErrors]);

    // Parse code when value changes (debounced)
    useEffect(() => {
      if (language === 'openscad' && enableASTParsing && value.trim() && parser) {
        const timeoutId = setTimeout(() => {
          parseOpenSCADCode(value);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
      }
      return undefined;
    }, [value, parseOpenSCADCode, language, enableASTParsing, parser]);

    // Create feature configuration for OpenSCAD Editor
    const createFeatureConfig = useCallback((preset: FeaturePreset = 'IDE'): OpenscadEditorFeatures => {
      const configs = {
        BASIC: {
          core: { syntaxHighlighting: true, basicCompletion: true, bracketMatching: true, commentCommands: true },
          parser: { realTimeValidation: false, astGeneration: false, errorReporting: true, symbolExtraction: false },
          ide: { outline: false, hover: false, gotoDefinition: false, findReferences: false, documentSymbols: false, workspaceSymbols: false, codeActions: false, rename: false },
          advanced: { semanticHighlighting: false, advancedCompletion: false, parameterHints: false, signatureHelp: false, codeLens: false, inlayHints: false, foldingRanges: false, documentFormatting: false, rangeFormatting: false }
        },
        STANDARD: {
          core: { syntaxHighlighting: true, basicCompletion: true, bracketMatching: true, commentCommands: true },
          parser: { realTimeValidation: true, astGeneration: true, errorReporting: true, symbolExtraction: true },
          ide: { outline: true, hover: false, gotoDefinition: false, findReferences: false, documentSymbols: true, workspaceSymbols: false, codeActions: false, rename: false },
          advanced: { semanticHighlighting: false, advancedCompletion: true, parameterHints: false, signatureHelp: false, codeLens: false, inlayHints: false, foldingRanges: true, documentFormatting: true, rangeFormatting: false }
        },
        IDE: {
          core: { syntaxHighlighting: true, basicCompletion: true, bracketMatching: true, commentCommands: true },
          parser: { realTimeValidation: true, astGeneration: true, errorReporting: true, symbolExtraction: true },
          ide: { outline: true, hover: true, gotoDefinition: true, findReferences: true, documentSymbols: true, workspaceSymbols: true, codeActions: true, rename: false },
          advanced: { semanticHighlighting: true, advancedCompletion: true, parameterHints: true, signatureHelp: true, codeLens: false, inlayHints: false, foldingRanges: true, documentFormatting: true, rangeFormatting: true }
        },
        FULL: {
          core: { syntaxHighlighting: true, basicCompletion: true, bracketMatching: true, commentCommands: true },
          parser: { realTimeValidation: true, astGeneration: true, errorReporting: true, symbolExtraction: true },
          ide: { outline: true, hover: true, gotoDefinition: true, findReferences: true, documentSymbols: true, workspaceSymbols: true, codeActions: true, rename: true },
          advanced: { semanticHighlighting: true, advancedCompletion: true, parameterHints: true, signatureHelp: true, codeLens: true, inlayHints: true, foldingRanges: true, documentFormatting: true, rangeFormatting: true }
        }
      };
      return configs[preset];
    }, []);

    // ========================================================================
    // Monaco Editor Integration
    // ========================================================================

    // Handle Monaco Editor mount
    const handleMonacoMount = useCallback((editor: any, monacoInstance: any) => {
      setMonacoEditor(editor);
      setMonaco(monacoInstance);

      // Configure OpenSCAD language support
      if (language === 'openscad') {
        try {
          // Register comprehensive OpenSCAD language support
          const { LANGUAGE_ID, THEME_ID } = registerOpenSCADLanguage(monacoInstance);

          // Ensure the model has the correct language
          const model = editor.getModel();
          if (model && model.getLanguageId() !== LANGUAGE_ID) {
            monacoInstance.editor.setModelLanguage(model, LANGUAGE_ID);
            console.log('[CodeEditor] Model language set to OpenSCAD');
          }

          // Apply OpenSCAD theme
          try {
            monacoInstance.editor.setTheme(THEME_ID);
            console.log('[CodeEditor] OpenSCAD theme applied');
          } catch (themeError) {
            console.warn('[CodeEditor] Failed to apply OpenSCAD theme:', themeError);
          }
        } catch (error) {
          console.error('[CodeEditor] Failed to register OpenSCAD language:', error);
        }
      }

      // Add keyboard shortcuts
      editor.addAction({
        id: 'save-action',
        label: 'Save',
        keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS],
        run: () => {
          onSave?.();
        }
      });

      editor.addAction({
        id: 'format-action',
        label: 'Format Document',
        keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyF],
        run: () => {
          onFormat?.();
        }
      });

      // Set ref
      if (ref && typeof ref === 'object') {
        ref.current = containerRef.current;
      }
    }, [language, onSave, onFormat, ref]);

    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleErrorClick = (error: ParseResult['errors'][0]) => {
      // Jump to error line in Monaco Editor
      if (monacoEditor && error.line > 0) {
        monacoEditor.setPosition({ lineNumber: error.line, column: error.column || 1 });
        monacoEditor.focus();
        monacoEditor.revealLine(error.line);
      }
      console.log('[CodeEditor] Error clicked:', error);
    };

    // ========================================================================
    // Style Generation
    // ========================================================================

    const editorClasses = generateAccessibleStyles(
      clsx(
        // Base editor styles
        'flex-1 h-full flex',
        'relative overflow-hidden',

        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',

        // Gradient pseudo-elements
        'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',

        // Focus styles
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'transition-all duration-200 ease-in-out',

        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <div
        ref={containerRef}
        className={editorClasses}
        data-testid={dataTestId}
        data-language={language}
        data-theme={theme}
        aria-label={ariaLabel}
        role="textbox"
        tabIndex={0}
        style={{ minHeight: '44px' }} // WCAG AA minimum touch target
        {...rest}
      >
        <div className="relative z-10 flex w-full h-full">
          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <MonacoEditor
              value={value}
              language={language}
              theme={theme}
              onChange={(newValue) => onChange?.(newValue ?? '')}
              onMount={handleMonacoMount}
              options={{
                readOnly,
                lineNumbers: showLineNumbers ? 'on' : 'off',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                tabSize: 2,
                insertSpaces: true,
                wordWrap: 'on',
                automaticLayout: true,
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 20,
                lineNumbersMinChars: 3,
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                mouseWheelZoom: true,
                contextmenu: true,
                quickSuggestions: enableCodeCompletion,
                suggestOnTriggerCharacters: enableCodeCompletion,
                acceptSuggestionOnEnter: enableCodeCompletion ? 'on' : 'off',
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
              height="100%"
              width="100%"
            />

            {/* Parser Loading Indicator */}
            {isParserLoading && language === 'openscad' && (
              <div className="absolute top-2 left-2 z-20">
                <div className="bg-blue-900/80 backdrop-blur-sm border border-blue-500/50 rounded-lg px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-400 text-xs">Loading OpenSCAD Parser...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Syntax Errors Display */}
            {showSyntaxErrors && parseResult?.errors && parseResult.errors.length > 0 && (
              <ErrorDisplay
                errors={parseResult.errors}
                onErrorClick={handleErrorClick}
              />
            )}

            {/* Parser Status Indicator */}
            {language === 'openscad' && enableASTParsing && parser && !isParserLoading && (
              <div className="absolute bottom-2 right-2 z-20">
                <div className="bg-green-900/80 backdrop-blur-sm border border-green-500/50 rounded-lg px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-green-400 text-xs">OpenSCAD Parser ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';

// ============================================================================
// Default Export
// ============================================================================

export default CodeEditor;
