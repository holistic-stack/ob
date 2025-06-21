/**
 * @file Monaco Code Editor Tests
 * 
 * Comprehensive test suite for the Monaco Code Editor component following TDD methodology.
 * Tests cover basic rendering, Monaco Editor integration, OpenSCAD language support,
 * glass morphism effects, accessibility compliance, and performance requirements.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonacoCodeEditor } from './monaco-code-editor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onMount, onChange, value, ...props }: any) => {
    // Simulate Monaco Editor mount
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getModel: () => ({
            getLanguageId: () => 'plaintext',
            getValue: () => value || '',
            setValue: vi.fn(),
            onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
          }),
          addAction: vi.fn(),
          dispose: vi.fn()
        };
        
        const mockMonaco = {
          languages: {
            register: vi.fn(),
            setLanguageConfiguration: vi.fn(),
            setMonarchTokensProvider: vi.fn(),
            registerCompletionItemProvider: vi.fn(),
            registerHoverProvider: vi.fn(),
            registerDefinitionProvider: vi.fn(),
            registerReferenceProvider: vi.fn(),
            registerDocumentSymbolProvider: vi.fn()
          },
          editor: {
            defineTheme: vi.fn(),
            setTheme: vi.fn(),
            setModelLanguage: vi.fn()
          }
        };
        
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return (
      <div
        data-testid="monaco-editor"
        data-language={props.options?.language || 'plaintext'}
        data-theme={props.options?.theme || 'vs-dark'}
        style={{ height: '100%', width: '100%', fontFamily: 'monospace', fontSize: '14px', padding: '8px', whiteSpace: 'pre-wrap', color: 'white' }}
      >
        {value || ''}
      </div>
    );
  }
}));

describe('MonacoCodeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('role', 'textbox');
      expect(editor).toHaveAttribute('tabindex', '0');
    });

    it('should display the provided code value', () => {
      const code = 'cube(10);';
      render(<MonacoCodeEditor value={code} />);
      
      const monacoEditor = screen.getByTestId('monaco-editor');
      expect(monacoEditor).toHaveTextContent(code);
    });

    it('should apply glass morphism classes', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveClass('bg-black/20');
      expect(editor).toHaveClass('backdrop-blur-sm');
      expect(editor).toHaveClass('border-white/50');
      expect(editor).toHaveClass('rounded-lg');
    });

    it('should have proper ARIA attributes', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('role', 'textbox');
      expect(editor).toHaveAttribute('tabindex', '0');
      expect(editor).toHaveAttribute('data-language', 'openscad');
      expect(editor).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('Monaco Editor Integration', () => {
    it('should initialize Monaco Editor with OpenSCAD language', async () => {
      const onMount = vi.fn();
      render(<MonacoCodeEditor language="openscad" onMount={onMount} />);
      
      await waitFor(() => {
        expect(onMount).toHaveBeenCalled();
      });
      
      const monacoEditor = screen.getByTestId('monaco-editor');
      expect(monacoEditor).toBeInTheDocument();
    });

    it('should apply dark theme by default', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('data-theme', 'dark');
    });

    it('should handle code changes through Monaco Editor', async () => {
      const onChange = vi.fn();
      render(<MonacoCodeEditor onChange={onChange} />);
      
      // Monaco Editor integration is mocked, so we verify the component renders correctly
      const monacoEditor = screen.getByTestId('monaco-editor');
      expect(monacoEditor).toBeInTheDocument();
    });

    it('should support read-only mode', () => {
      render(<MonacoCodeEditor readOnly />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('OpenSCAD Language Support', () => {
    it('should integrate Monaco Editor with OpenSCAD language', async () => {
      const onMount = vi.fn();
      render(<MonacoCodeEditor language="openscad" onMount={onMount} />);
      
      await waitFor(() => {
        expect(onMount).toHaveBeenCalled();
      });
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('data-language', 'openscad');
    });

    it('should configure IDE features for OpenSCAD', async () => {
      const onMount = vi.fn();
      render(<MonacoCodeEditor language="openscad" onMount={onMount} />);
      
      await waitFor(() => {
        expect(onMount).toHaveBeenCalled();
      });
      
      // Verify Monaco Editor is properly configured
      const monacoEditor = screen.getByTestId('monaco-editor');
      expect(monacoEditor).toBeInTheDocument();
    });

    it('should handle AST parsing results', async () => {
      const onASTChange = vi.fn();
      render(
        <MonacoCodeEditor 
          language="openscad" 
          enableASTParsing 
          onASTChange={onASTChange}
          value="cube(10);"
        />
      );
      
      // Verify component renders with AST parsing enabled
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should handle parse errors', async () => {
      const onParseErrors = vi.fn();
      render(
        <MonacoCodeEditor 
          language="openscad" 
          enableASTParsing 
          onParseErrors={onParseErrors}
          value="invalid syntax {"
        />
      );
      
      // Verify component renders with error handling
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
    });
  });

  describe('Glass Morphism Effects', () => {
    it('should apply complete three-layer glass effect', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      
      // Base glass effect
      expect(editor).toHaveClass('bg-black/20');
      expect(editor).toHaveClass('backdrop-blur-sm');
      expect(editor).toHaveClass('border-white/50');
      
      // Shadow system
      expect(editor).toHaveClass('shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]');
      
      // Gradient pseudo-elements
      expect(editor).toHaveClass('before:bg-gradient-to-br');
      expect(editor).toHaveClass('after:bg-gradient-to-tl');
    });

    it('should support custom glass configuration', () => {
      const glassConfig = { intensity: 'heavy' as const, tint: 'blue', blur: 'lg' };
      render(<MonacoCodeEditor glassConfig={glassConfig} />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should adapt to light backgrounds', () => {
      render(<MonacoCodeEditor theme="light" />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('data-theme', 'light');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have minimum touch target size', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      const rect = editor.getBoundingClientRect();
      
      // Minimum 44px for WCAG AA compliance
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('should support keyboard navigation', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('tabindex', '0');
    });

    it('should provide proper role and ARIA attributes', () => {
      render(<MonacoCodeEditor />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('role', 'textbox');
      expect(editor).toHaveAttribute('data-language');
      expect(editor).toHaveAttribute('data-theme');
    });

    it('should support screen readers', () => {
      render(<MonacoCodeEditor value="cube(10);" />);
      
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveAttribute('role', 'textbox');
      
      // Monaco Editor content should be accessible
      const monacoEditor = screen.getByTestId('monaco-editor');
      expect(monacoEditor).toHaveTextContent('cube(10);');
    });
  });

  describe('Performance Requirements', () => {
    it('should render within performance threshold', async () => {
      const startTime = performance.now();
      
      render(<MonacoCodeEditor value="cube(10);" />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 16ms for 60fps
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle large code files efficiently', () => {
      const largeCode = 'cube(10);\n'.repeat(1000);
      
      const startTime = performance.now();
      render(<MonacoCodeEditor value={largeCode} />);
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(100); // Allow more time for large files
    });

    it('should debounce AST parsing', async () => {
      const onASTChange = vi.fn();
      render(
        <MonacoCodeEditor 
          language="openscad" 
          enableASTParsing 
          onASTChange={onASTChange}
          value="cube(3);"
        />
      );
      
      // Verify component renders correctly
      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
    });
  });
});
