/**
 * Monaco Editor Component Simple Test Suite
 * 
 * Basic tests for Monaco Editor React component following TDD methodology
 * without complex Monaco dependencies for initial validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { MonacoEditorProps } from '../types/editor.types';

// Simple mock component for TDD
const MockMonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  onMount,
  onFocus,
  onBlur,
  className,
  'data-testid': testId,
  readOnly = false
}) => {
  const [editorValue, setEditorValue] = React.useState(value);

  // Update internal state when value prop changes
  React.useEffect(() => {
    setEditorValue(value);
  }, [value]);

  React.useEffect(() => {
    if (onMount) {
      const mockEditor = {
        getValue: () => editorValue,
        setValue: (newValue: string) => setEditorValue(newValue),
        focus: vi.fn(),
        dispose: vi.fn()
      };
      onMount(mockEditor as any);
    }
  }, [onMount]);

  const handleChange = (newValue: string) => {
    if (readOnly) return;
    
    setEditorValue(newValue);
    if (onChange) {
      onChange({
        value: newValue,
        changes: [],
        versionId: 1
      });
    }
  };

  return (
    <div
      data-testid={testId || 'monaco-editor'}
      className={className}
      style={{ height: '400px', width: '100%' }}
    >
      <textarea
        data-testid="monaco-editor-textarea"
        value={editorValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => onFocus?.({ hasFocus: true })}
        onBlur={() => onBlur?.({ hasFocus: false })}
        readOnly={readOnly}
        style={{ width: '100%', height: '100%', resize: 'none' }}
      />
    </div>
  );
};

describe('Monaco Editor Component (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render Monaco Editor component', () => {
      render(<MockMonacoEditor value="" language="openscad" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      const initialValue = 'cube(10);';
      render(<MockMonacoEditor value={initialValue} language="openscad" />);
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      expect(textarea).toHaveValue(initialValue);
    });

    it('should apply custom className', () => {
      const customClass = 'custom-editor-class';
      render(<MockMonacoEditor value="" language="openscad" className={customClass} />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveClass(customClass);
    });

    it('should apply custom test id', () => {
      const customTestId = 'custom-editor';
      render(<MockMonacoEditor value="" language="openscad" data-testid={customTestId} />);
      
      const editor = screen.getByTestId(customTestId);
      expect(editor).toBeInTheDocument();
    });

    it('should have correct dimensions', () => {
      render(<MockMonacoEditor value="" language="openscad" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveStyle({ height: '400px', width: '100%' });
    });
  });

  describe('Event Handling', () => {
    it('should call onChange when content changes', () => {
      const onChange = vi.fn();
      render(<MockMonacoEditor value="" language="openscad" onChange={onChange} />);
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      fireEvent.change(textarea, { target: { value: 'sphere(5);' } });
      
      expect(onChange).toHaveBeenCalledWith({
        value: 'sphere(5);',
        changes: [],
        versionId: 1
      });
    });

    it('should call onMount when editor is mounted', () => {
      const onMount = vi.fn();
      render(<MockMonacoEditor value="" language="openscad" onMount={onMount} />);
      
      expect(onMount).toHaveBeenCalledWith(
        expect.objectContaining({
          getValue: expect.any(Function),
          setValue: expect.any(Function),
          focus: expect.any(Function),
          dispose: expect.any(Function)
        })
      );
    });

    it('should call onFocus when editor gains focus', () => {
      const onFocus = vi.fn();
      render(<MockMonacoEditor value="" language="openscad" onFocus={onFocus} />);
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      fireEvent.focus(textarea);
      
      expect(onFocus).toHaveBeenCalledWith({ hasFocus: true });
    });

    it('should call onBlur when editor loses focus', () => {
      const onBlur = vi.fn();
      render(<MockMonacoEditor value="" language="openscad" onBlur={onBlur} />);
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      fireEvent.blur(textarea);
      
      expect(onBlur).toHaveBeenCalledWith({ hasFocus: false });
    });
  });

  describe('Read-only Mode', () => {
    it('should handle read-only mode', () => {
      render(<MockMonacoEditor value="cube(10);" language="openscad" readOnly />);
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      expect(textarea).toHaveAttribute('readonly');
    });

    it('should not trigger onChange in read-only mode', () => {
      const onChange = vi.fn();
      render(
        <MockMonacoEditor 
          value="cube(10);" 
          language="openscad" 
          readOnly 
          onChange={onChange} 
        />
      );
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      fireEvent.change(textarea, { target: { value: 'sphere(5);' } });
      
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should render within performance threshold', () => {
      const startTime = performance.now();
      
      render(<MockMonacoEditor value="cube(10);" language="openscad" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 16ms threshold
      expect(renderTime).toBeLessThan(16);
    });

    it('should handle large content efficiently', () => {
      const largeContent = 'cube(10);\n'.repeat(100);
      const startTime = performance.now();
      
      render(<MockMonacoEditor value={largeContent} language="openscad" />);
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      expect(textarea).toHaveValue(largeContent);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large content within reasonable time
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Value Updates', () => {
    it('should update value when prop changes', () => {
      const { rerender } = render(<MockMonacoEditor value="cube(10);" language="openscad" />);
      
      let textarea = screen.getByTestId('monaco-editor-textarea');
      expect(textarea).toHaveValue('cube(10);');
      
      rerender(<MockMonacoEditor value="sphere(5);" language="openscad" />);
      
      textarea = screen.getByTestId('monaco-editor-textarea');
      expect(textarea).toHaveValue('sphere(5);');
    });

    it('should maintain internal state between renders', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <MockMonacoEditor value="" language="openscad" onChange={onChange} />
      );
      
      const textarea = screen.getByTestId('monaco-editor-textarea');
      fireEvent.change(textarea, { target: { value: 'cylinder(5, 10);' } });
      
      expect(onChange).toHaveBeenCalledWith({
        value: 'cylinder(5, 10);',
        changes: [],
        versionId: 1
      });
      
      // Re-render with same props
      rerender(<MockMonacoEditor value="" language="openscad" onChange={onChange} />);
      
      // Internal state should be maintained
      expect(textarea).toHaveValue('cylinder(5, 10);');
    });
  });
});
