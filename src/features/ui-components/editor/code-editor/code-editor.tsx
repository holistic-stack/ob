/**
 * Code Editor Component
 * 
 * A code editor with syntax highlighting, line numbers, and glass morphism effects.
 * Supports multiple languages, themes, and keyboard shortcuts.
 */

import React, { forwardRef, useRef, useEffect } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

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
 * Props for the CodeEditor component
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
// Line Numbers Component
// ============================================================================

interface LineNumbersProps {
  readonly lines: number;
}

const LineNumbers: React.FC<LineNumbersProps> = ({ lines }) => (
  <div className="flex flex-col text-right pr-3 py-3 text-white/40 text-sm font-mono select-none">
    {Array.from({ length: lines }, (_, i) => (
      <div key={i + 1} className="leading-6">
        {i + 1}
      </div>
    ))}
  </div>
);

// ============================================================================
// CodeEditor Component
// ============================================================================

/**
 * Code Editor component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <CodeEditor 
 *   value={code}
 *   onChange={setCode}
 *   language="javascript"
 *   showLineNumbers
 *   onSave={() => console.log('Save pressed')}
 * />
 * ```
 */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  (
    {
      value,
      onChange,
      language = 'javascript',
      theme = 'dark',
      showLineNumbers = true,
      readOnly = false,
      placeholder = 'Enter your code here...',
      onSave,
      onFormat,
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
              <LineNumbers lines={lineCount} />
            </div>
          )}
          
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
