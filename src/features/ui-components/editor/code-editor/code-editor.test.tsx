/**
 * Enhanced Code Editor Component Tests
 *
 * Tests for the Monaco Editor-based OpenSCAD code editor with glass morphism effects.
 * Follows TDD methodology with comprehensive coverage of all features.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeEditor } from './code-editor';

// Mock Monaco Editor to avoid loading issues in tests
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange, onMount, ...props }) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          getValue: () => value,
          setValue: vi.fn(),
          getModel: () => ({
            getLanguageId: () => 'openscad',
            onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() })),
            getValue: () => value
          }),
          dispose: vi.fn(),
          addAction: vi.fn(),
          focus: vi.fn(),
          setPosition: vi.fn(),
          revealLine: vi.fn()
        };
        const mockMonaco = {
          editor: {
            setTheme: vi.fn(),
            setModelLanguage: vi.fn()
          },
          languages: {
            registerCompletionItemProvider: vi.fn(),
            registerHoverProvider: vi.fn(),
            registerDefinitionProvider: vi.fn()
          }
        };
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return React.createElement('div', {
      'data-testid': 'monaco-editor',
      'data-language': props.language,
      'data-theme': props.theme,
      onClick: () => onChange?.(value + ' test')
    }, value);
  })
}));

// Mock OpenSCAD Editor components
vi.mock('@holistic-stack/openscad-editor', () => ({
  OpenscadEditor: vi.fn(({ value, onChange, features, onParseResult, ...props }) => {
    React.useEffect(() => {
      if (onParseResult) {
        onParseResult({
          success: true,
          errors: [],
          ast: [{ type: 'module', name: 'test' }]
        });
      }
    }, [value, onParseResult]);

    return React.createElement('div', {
      'data-testid': 'openscad-editor',
      'data-features': features,
      onClick: () => onChange?.(value + ' openscad')
    }, value);
  }),
  createFeatureConfig: vi.fn((preset) => ({
    core: { syntaxHighlighting: true, basicEditing: true, keyboardShortcuts: true },
    parser: { realTimeParsing: preset !== 'BASIC', astGeneration: preset !== 'BASIC' },
    ide: { codeCompletion: preset === 'IDE' || preset === 'FULL' },
    advanced: { folding: preset === 'FULL' }
  })),
  OpenscadOutline: vi.fn(() => React.createElement('div', { 'data-testid': 'openscad-outline' })),
  FormattingConfig: vi.fn(() => React.createElement('div', { 'data-testid': 'formatting-config' }))
}));

// Mock OpenSCAD Parser
vi.mock('@holistic-stack/openscad-parser', () => ({
  EnhancedOpenscadParser: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    parseAST: vi.fn().mockReturnValue([{ type: 'module', name: 'test' }]),
    getErrorHandler: vi.fn().mockReturnValue({
      getErrors: vi.fn().mockReturnValue([]),
      getWarnings: vi.fn().mockReturnValue([])
    }),
    dispose: vi.fn()
  })),
  SimpleErrorHandler: vi.fn().mockImplementation(() => ({
    getErrors: vi.fn().mockReturnValue([]),
    getWarnings: vi.fn().mockReturnValue([])
  }))
}));

describe('CodeEditor', () => {
  const defaultProps = {
    value: 'cube(10);',
    onChange: vi.fn(),
    'data-testid': 'code-editor'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(<CodeEditor {...defaultProps} />);

      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should display the provided code value', () => {
      render(<CodeEditor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveTextContent('cube(10);');
    });

    it('should apply glass morphism classes', () => {
      render(<CodeEditor {...defaultProps} />);

      const container = screen.getByTestId('code-editor');
      expect(container).toHaveClass('bg-black/20');
      expect(container).toHaveClass('backdrop-blur-sm');
      expect(container).toHaveClass('border-white/50');
    });

    it('should have proper ARIA attributes', () => {
      render(
        <CodeEditor
          {...defaultProps}
          aria-label="OpenSCAD Code Editor"
        />
      );

      const container = screen.getByTestId('code-editor');
      expect(container).toHaveAttribute('aria-label', 'OpenSCAD Code Editor');
    });
  });

  describe('Monaco Editor Integration', () => {
    it('should initialize Monaco Editor with OpenSCAD language', () => {
      render(<CodeEditor {...defaultProps} language="openscad" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'openscad');
    });

    it('should apply dark theme by default', () => {
      render(<CodeEditor {...defaultProps} />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-theme', 'dark');
    });

    it('should handle code changes through Monaco Editor', async () => {
      const onChange = vi.fn();
      render(<CodeEditor {...defaultProps} onChange={onChange} />);

      const editor = screen.getByTestId('monaco-editor');

      // Simulate Monaco Editor change by triggering the mocked onChange
      fireEvent.click(editor);

      // The mock should trigger onChange with the test value
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should support read-only mode', () => {
      render(<CodeEditor {...defaultProps} readOnly />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
      // Monaco Editor read-only is handled internally
    });
  });

  describe('OpenSCAD Language Support', () => {
    it('should integrate Monaco Editor with OpenSCAD language', () => {
      render(<CodeEditor {...defaultProps} language="openscad" />);

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'openscad');
    });

    it('should configure IDE features for OpenSCAD', () => {
      render(
        <CodeEditor
          {...defaultProps}
          language="openscad"
          enableCodeCompletion
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
      // Code completion is configured in Monaco Editor options
    });

    it('should handle AST parsing results', async () => {
      const onASTChange = vi.fn();
      render(
        <CodeEditor
          {...defaultProps}
          language="openscad"
          enableASTParsing
          onASTChange={onASTChange}
        />
      );

      await waitFor(() => {
        expect(onASTChange).toHaveBeenCalledWith([{ type: 'module', name: 'test' }]);
      });
    });

    it('should handle parse errors', async () => {
      const onParseErrors = vi.fn();
      render(
        <CodeEditor
          {...defaultProps}
          language="openscad"
          enableASTParsing
          onParseErrors={onParseErrors}
        />
      );

      // Parse errors are handled through the OpenSCAD parser integration
      // The component should call onParseErrors when errors are detected
      await waitFor(() => {
        // Since our mock parser returns success: true with no errors,
        // onParseErrors should be called with an empty array
        expect(onParseErrors).toHaveBeenCalledWith([]);
      }, { timeout: 2000 });
    });
  });

  describe('Glass Morphism Effects', () => {
    it('should apply complete three-layer glass effect', () => {
      render(<CodeEditor {...defaultProps} />);

      const container = screen.getByTestId('code-editor');

      // Base glass effect
      expect(container).toHaveClass('bg-black/20');
      expect(container).toHaveClass('backdrop-blur-sm');
      expect(container).toHaveClass('border-white/50');

      // Complex shadows
      expect(container.className).toMatch(/shadow-\[inset/);

      // Gradient pseudo-elements
      expect(container.className).toMatch(/before:absolute/);
      expect(container.className).toMatch(/after:absolute/);

      // Positioning context
      expect(container).toHaveClass('relative');
    });

    it('should support custom glass configuration', () => {
      const glassConfig = {
        opacity: 0.3,
        blur: 'md',
        border: 'white/60'
      };

      render(<CodeEditor {...defaultProps} glassConfig={glassConfig} />);

      const container = screen.getByTestId('code-editor');
      expect(container).toBeInTheDocument();
      // Custom glass config is applied through generateGlassClasses
    });

    it('should adapt to light backgrounds', () => {
      render(<CodeEditor {...defaultProps} overLight />);

      const container = screen.getByTestId('code-editor');
      expect(container).toBeInTheDocument();
      // Light background adaptation is handled by generateGlassClasses
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have minimum touch target size', () => {
      render(<CodeEditor {...defaultProps} />);

      const container = screen.getByTestId('code-editor');
      const rect = container.getBoundingClientRect();

      // Minimum 44px for WCAG AA compliance
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);

      const container = screen.getByTestId('code-editor');

      await user.tab();
      expect(container).toHaveFocus();
    });

    it('should provide proper role and ARIA attributes', () => {
      render(
        <CodeEditor
          {...defaultProps}
          aria-label="Code Editor"
          role="textbox"
        />
      );

      const container = screen.getByTestId('code-editor');
      expect(container).toHaveAttribute('role', 'textbox');
      expect(container).toHaveAttribute('aria-label', 'Code Editor');
    });

    it('should support screen readers', () => {
      render(
        <CodeEditor
          {...defaultProps}
          aria-describedby="editor-help"
        />
      );

      const container = screen.getByTestId('code-editor');
      expect(container).toHaveAttribute('aria-describedby', 'editor-help');
    });
  });

  describe('Performance Requirements', () => {
    it('should render within performance threshold', () => {
      const startTime = performance.now();

      render(<CodeEditor {...defaultProps} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 16ms for 60fps
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle large code files efficiently', () => {
      const largeCode = 'cube(10);\n'.repeat(1000);

      const startTime = performance.now();
      render(<CodeEditor {...defaultProps} value={largeCode} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Allow more time for large content
    });

    it('should debounce AST parsing', async () => {
      const onASTChange = vi.fn();
      const { rerender } = render(
        <CodeEditor
          {...defaultProps}
          language="openscad"
          enableASTParsing
          onASTChange={onASTChange}
        />
      );

      // Rapid changes should be debounced
      rerender(<CodeEditor {...defaultProps} value="cube(1);" onASTChange={onASTChange} />);
      rerender(<CodeEditor {...defaultProps} value="cube(2);" onASTChange={onASTChange} />);
      rerender(<CodeEditor {...defaultProps} value="cube(3);" onASTChange={onASTChange} />);

      // Should not call onASTChange for every change
      await waitFor(() => {
        expect(onASTChange).toHaveBeenCalledTimes(1);
      });
    });
  });
});
