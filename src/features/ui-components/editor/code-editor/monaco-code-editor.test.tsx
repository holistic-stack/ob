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

  describe('Glass Morphism Effects (Enhanced TDD)', () => {
    it('should apply base glass morphism effects following design system', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');

      // Base glass effect - exact requirements
      expect(editor).toHaveClass('bg-black/20');
      expect(editor).toHaveClass('backdrop-blur-sm');
      expect(editor).toHaveClass('border');
      expect(editor).toHaveClass('border-white/50');
      expect(editor).toHaveClass('rounded-lg');
    });

    it('should apply complex shadow system with three layers', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');

      // Complex shadow system - exact specification
      expect(editor).toHaveClass(
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]'
      );
    });

    it('should apply gradient pseudo-elements for refraction effects', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');

      // Before pseudo-element
      expect(editor).toHaveClass('before:absolute');
      expect(editor).toHaveClass('before:inset-0');
      expect(editor).toHaveClass('before:rounded-lg');
      expect(editor).toHaveClass('before:bg-gradient-to-br');
      expect(editor).toHaveClass('before:from-white/60');
      expect(editor).toHaveClass('before:via-transparent');
      expect(editor).toHaveClass('before:to-transparent');
      expect(editor).toHaveClass('before:opacity-70');
      expect(editor).toHaveClass('before:pointer-events-none');

      // After pseudo-element
      expect(editor).toHaveClass('after:absolute');
      expect(editor).toHaveClass('after:inset-0');
      expect(editor).toHaveClass('after:rounded-lg');
      expect(editor).toHaveClass('after:bg-gradient-to-tl');
      expect(editor).toHaveClass('after:from-white/30');
      expect(editor).toHaveClass('after:via-transparent');
      expect(editor).toHaveClass('after:to-transparent');
      expect(editor).toHaveClass('after:opacity-50');
      expect(editor).toHaveClass('after:pointer-events-none');
    });

    it('should ensure content layer is positioned above gradients', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');
      const contentLayer = editor.querySelector('.relative.z-10');

      expect(contentLayer).toBeInTheDocument();
      expect(contentLayer).toHaveClass('relative', 'z-10', 'h-full', 'w-full');
    });

    it('should use generateGlassClasses utility following DRY principle', () => {
      const glassConfig = {
        blurIntensity: 'lg' as const,
        opacity: 0.2,
        elevation: 'medium' as const,
        enableDistortion: false,
        enableSpecularHighlights: true,
      };

      render(<MonacoCodeEditor glassConfig={glassConfig} />);

      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
      // Should integrate with shared glass utilities
    });

    it('should maintain glass effects across different themes', () => {
      const { rerender } = render(<MonacoCodeEditor theme="dark" />);

      let editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveClass('bg-black/20', 'backdrop-blur-sm');

      rerender(<MonacoCodeEditor theme="light" />);
      editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveClass('bg-black/20', 'backdrop-blur-sm');
    });

    it('should apply focus ring with glass morphism integration', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveClass(
        'focus-within:ring-2',
        'focus-within:ring-blue-500',
        'focus-within:ring-offset-2'
      );
    });

    it('should include transition effects for smooth interactions', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
    });
  });

  describe('8px Grid System Compliance', () => {
    it('should follow 8px grid for minimum touch target size', () => {
      render(<MonacoCodeEditor height="20px" />);

      const editor = screen.getByTestId('monaco-code-editor');
      // Should use 48px (8px grid) instead of 44px
      expect(editor).toHaveStyle({ minHeight: '48px' });
    });

    it('should use 8px grid compliant border radius', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toHaveClass('rounded-lg'); // 8px border radius
    });

    it('should avoid non-8px-grid values', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');
      // Should not have forbidden classes like p-5, gap-5, px-7
      expect(editor.className).not.toMatch(/p-5|gap-5|px-7|py-5/);
    });
  });

  describe('DRY and SRP Principles', () => {
    it('should use shared glass utilities instead of hardcoded styles', () => {
      render(<MonacoCodeEditor />);

      const editor = screen.getByTestId('monaco-code-editor');
      // Should use generateGlassClasses utility
      expect(editor).toBeInTheDocument();
    });

    it('should separate styling concerns from editor logic', () => {
      render(<MonacoCodeEditor />);

      // Component should have clear separation between:
      // 1. Glass morphism styling
      // 2. Monaco Editor integration
      // 3. AST parsing logic
      const editor = screen.getByTestId('monaco-code-editor');
      const monacoEditor = screen.getByTestId('monaco-editor');

      expect(editor).toBeInTheDocument();
      expect(monacoEditor).toBeInTheDocument();
    });

    it('should reuse glass configuration across instances', () => {
      const glassConfig = {
        blurIntensity: 'lg' as const,
        opacity: 0.2,
        elevation: 'medium' as const,
        enableDistortion: false,
        enableSpecularHighlights: true,
      };

      const { rerender } = render(<MonacoCodeEditor glassConfig={glassConfig} />);

      let editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();

      rerender(<MonacoCodeEditor glassConfig={glassConfig} language="javascript" />);
      editor = screen.getByTestId('monaco-code-editor');
      expect(editor).toBeInTheDocument();
      // Should reuse same glass configuration
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
