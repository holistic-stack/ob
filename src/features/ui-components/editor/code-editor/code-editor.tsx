/**
 * Enhanced Code Editor Component
 *
 * A code editor with OpenSCAD syntax highlighting, AST parsing, error detection,
 * and glass morphism effects. Integrates with @openscad/editor (Monaco-based)
 * for professional OpenSCAD development experience.
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

// OpenSCAD Editor integration types
// Based on @openscad/editor package structure from the demo
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
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
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
      enableCodeCompletion = true,
      glassConfig,
      overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [outline, setOutline] = useState<OutlineItem[]>([]);
    const [isParserLoading, setIsParserLoading] = useState(false);
    const [parser, setParser] = useState<any>(null);

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
    // Effects
    // ========================================================================

    useEffect(() => {
      if (ref && typeof ref === 'object') {
        ref.current = textareaRef.current;
      }
    }, [ref]);
    
    // ========================================================================
    // Event Handlers
    // ========================================================================
    
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(event.target.value);
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle Ctrl+S for save
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        onSave?.();
      }
      
      // Handle Ctrl+Shift+F for format
      if (event.ctrlKey && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        onFormat?.();
      }
      
      // Handle Tab for indentation
      if (event.key === 'Tab') {
        event.preventDefault();
        const textarea = event.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange?.(newValue);
        
        // Set cursor position after the inserted spaces
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    };
    
    // ========================================================================
    // Event Handlers
    // ========================================================================

    const handleErrorClick = (error: ParseResult['errors'][0]) => {
      // TODO: Jump to error line in editor
      console.log('[CodeEditor] Error clicked:', error);
    };

    // ========================================================================
    // Style Generation
    // ========================================================================

    const glassClasses = generateGlassClasses(glassConfig || {}, overLight);
    const lineCount = value.split('\n').length;
    
    const editorClasses = generateAccessibleStyles(
      clsx(
        // Base editor styles
        'flex-1 h-full flex',
        'relative overflow-hidden',
        
        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50 rounded-r-lg',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',
        
        // Gradient pseudo-elements
        'before:absolute before:inset-0 before:rounded-r-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 before:rounded-r-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',
        
        // Custom className
        className
      )
    );
    
    const textareaClasses = clsx(
      'flex-1 resize-none outline-none bg-transparent',
      'text-white font-mono text-sm leading-6',
      'p-3 overflow-auto',
      'placeholder:text-white/40',
      {
        'cursor-not-allowed': readOnly,
      }
    );

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div
        className={editorClasses}
        data-testid={dataTestId}
        data-language={language}
        data-theme={theme}
        {...rest}
      >
        <div className="relative z-10 flex w-full h-full">
          {showLineNumbers && (
            <div className="border-r border-white/20">
              <LineNumbers
                lines={lineCount}
                errors={showSyntaxErrors ? (parseResult?.errors || []) : []}
              />
            </div>
          )}

          <div className="flex-1 relative">
            {/* Enhanced textarea with OpenSCAD syntax highlighting */}
            <textarea
              ref={textareaRef}
              className={textareaClasses}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              placeholder={placeholder}
              aria-label={ariaLabel || `Code editor for ${language}`}
              role="textbox"
              aria-multiline="true"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
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
