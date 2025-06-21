/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CodeEditor } from './code-editor';

// Mock the OpenSCAD parser module
vi.mock('@holistic-stack/openscad-parser', () => ({
  EnhancedOpenscadParser: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    parseAST: vi.fn().mockReturnValue([{ type: 'cube', size: [10, 10, 10] }]),
    getErrorHandler: vi.fn().mockReturnValue({
      getErrors: vi.fn().mockReturnValue([]),
      getWarnings: vi.fn().mockReturnValue([]),
    }),
    dispose: vi.fn(),
  })),
  SimpleErrorHandler: vi.fn().mockImplementation(() => ({
    getErrors: vi.fn().mockReturnValue([]),
    getWarnings: vi.fn().mockReturnValue([]),
  })),
}));

describe('CodeEditor', () => {
  it('should render with default props', () => {
    render(
      <CodeEditor value="cube(10);" />
    );

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveValue("cube(10);");
  });

  it('should apply glass morphism classes', () => {
    render(
      <CodeEditor 
        value="test code" 
        data-testid="code-editor" 
      />
    );
    
    const editor = screen.getByTestId('code-editor');
    expect(editor).toHaveClass('bg-black/20');
    expect(editor).toHaveClass('backdrop-blur-sm');
    expect(editor).toHaveClass('border-white/50');
  });

  it('should handle value changes', () => {
    const onChange = vi.fn();
    render(
      <CodeEditor 
        value="initial code" 
        onChange={onChange}
      />
    );
    
    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: 'new code' } });
    
    expect(onChange).toHaveBeenCalledWith('new code');
  });

  it('should support different languages', () => {
    render(
      <CodeEditor 
        value="function test() {}" 
        language="javascript"
        data-testid="code-editor"
      />
    );
    
    const editor = screen.getByTestId('code-editor');
    expect(editor).toHaveAttribute('data-language', 'javascript');
  });

  it('should support different themes', () => {
    render(
      <CodeEditor 
        value="test code" 
        theme="dark"
        data-testid="code-editor"
      />
    );
    
    const editor = screen.getByTestId('code-editor');
    expect(editor).toHaveAttribute('data-theme', 'dark');
  });

  it('should show line numbers when enabled', () => {
    render(
      <CodeEditor
        value="line 1\nline 2\nline 3"
        showLineNumbers
      />
    );

    // Check that line numbers container exists
    const lineNumbersContainer = screen.getByText('1').closest('div');
    expect(lineNumbersContainer).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should be read-only when specified', () => {
    render(
      <CodeEditor 
        value="readonly code" 
        readOnly
      />
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('readonly');
  });

  it('should support custom placeholder', () => {
    render(
      <CodeEditor 
        value="" 
        placeholder="Enter your code here..."
      />
    );
    
    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('placeholder', 'Enter your code here...');
  });

  it('should handle keyboard shortcuts', () => {
    const onSave = vi.fn();
    render(
      <CodeEditor
        value="test code"
        onSave={onSave}
      />
    );

    const editor = screen.getByRole('textbox');
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalled();
  });

  it('should support OpenSCAD-specific features', () => {
    const onASTChange = vi.fn();
    const onParseErrors = vi.fn();

    render(
      <CodeEditor
        value="cube(10);"
        language="openscad"
        enableASTParsing
        onASTChange={onASTChange}
        onParseErrors={onParseErrors}
        showSyntaxErrors
      />
    );

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('aria-label', 'Code editor for openscad');
  });

  it('should show parser loading indicator for OpenSCAD', async () => {
    render(
      <CodeEditor
        value="cube(10);"
        language="openscad"
        enableASTParsing
      />
    );

    // The loading indicator should appear initially
    expect(screen.getByText('Loading OpenSCAD Parser...')).toBeInTheDocument();

    // Wait for the parser to load
    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Parser ready')).toBeInTheDocument();
    });
  });

  it('should disable AST parsing when enableASTParsing is false', () => {
    render(
      <CodeEditor
        value="cube(10);"
        language="openscad"
        enableASTParsing={false}
      />
    );

    // Should not show loading indicator when AST parsing is disabled
    expect(screen.queryByText('Loading OpenSCAD Parser...')).not.toBeInTheDocument();
    // Should use fallback textarea instead of OpenSCAD Editor
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
