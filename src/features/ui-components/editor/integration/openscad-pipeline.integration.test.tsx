/**
 * OpenSCAD Pipeline Integration Tests
 * 
 * Comprehensive integration tests for the complete OpenSCAD 3D visualization pipeline:
 * MonacoCodeEditor → AST parsing → CSG2 operations → Babylon.js rendering → VisualizationPanel
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonacoCodeEditor } from '../code-editor/monaco-code-editor';
import { VisualizationPanel } from '../visualization-panel/visualization-panel';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import type { ParseError } from '../code-editor/openscad-ast-service';

// Mock dependencies
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, value }: any) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="OpenSCAD code editor"
    />
  )
}));

vi.mock('../../../babylon-renderer/components/babylon-renderer/babylon-renderer', () => ({
  BabylonRenderer: ({ astData, onASTProcessingComplete }: any) => {
    React.useEffect(() => {
      if (astData && astData.length > 0) {
        // Simulate successful mesh creation
        setTimeout(() => {
          onASTProcessingComplete?.([{ name: 'test-mesh', position: { x: 0, y: 0, z: 0 } }]);
        }, 100);
      }
    }, [astData, onASTProcessingComplete]);

    return (
      <div data-testid="babylon-renderer">
        {astData && astData.length > 0 ? (
          <div data-testid="rendered-meshes">
            Rendered {astData.length} AST nodes
          </div>
        ) : (
          <div data-testid="no-content">No content to render</div>
        )}
      </div>
    );
  }
}));

vi.mock('../code-editor/openscad-ast-service', () => ({
  parseOpenSCADCodeDebounced: vi.fn(),
  cancelDebouncedParsing: vi.fn(),
  validateAST: vi.fn(() => true),
  getPerformanceMetrics: vi.fn(() => ({ assessment: 'good', recommendation: 'Performance is good' }))
}));

vi.mock('../../shared/performance/performance-monitor', () => ({
  measurePerformance: vi.fn(async (operation: string, fn: () => Promise<any>) => {
    const result = await fn();
    return { result, metrics: { operation, duration: 100, withinTarget: true } };
  })
}));

// Test data
const validOpenSCADCode = `
cube([10, 10, 10]);
sphere(5);
`;

const invalidOpenSCADCode = `
cube([10, 10, 10]  // Missing semicolon
sphere(5);
`;

const mockValidAST: ASTNode[] = [
  { type: 'cube', size: [10, 10, 10] } as any,
  { type: 'sphere', radius: 5 } as any
];

const mockParseError: ParseError = {
  message: 'Syntax error: missing semicolon',
  line: 2,
  column: 18,
  severity: 'error'
};

describe('OpenSCAD Pipeline Integration', () => {
  let mockParseFunction: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockParseFunction = vi.mocked(require('../code-editor/openscad-ast-service').parseOpenSCADCodeDebounced);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('successful pipeline flow', () => {
    it('should complete full pipeline from code to 3D visualization', async () => {
      // Arrange
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: 150
      });

      const onASTChange = vi.fn();
      const onParseErrors = vi.fn();

      // Act
      render(
        <div>
          <MonacoCodeEditor
            value={validOpenSCADCode}
            enableASTParsing={true}
            onASTChange={onASTChange}
            onParseErrors={onParseErrors}
            data-testid="code-editor"
          />
          <VisualizationPanel
            astData={mockValidAST}
            parseErrors={[]}
            data-testid="visualization-panel"
          />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.type(editor, ' // Added comment');

      // Assert
      await waitFor(() => {
        expect(mockParseFunction).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onASTChange).toHaveBeenCalledWith(mockValidAST);
        expect(onParseErrors).toHaveBeenCalledWith([]);
      });

      expect(screen.getByTestId('babylon-renderer')).toBeInTheDocument();
      expect(screen.getByTestId('rendered-meshes')).toBeInTheDocument();
      expect(screen.getByText('Rendered 2 AST nodes')).toBeInTheDocument();
    });

    it('should show performance indicators during processing', async () => {
      // Arrange
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: 150
      });

      // Act
      render(
        <MonacoCodeEditor
          value={validOpenSCADCode}
          enableASTParsing={true}
          data-testid="code-editor"
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.clear(editor);
      await userEvent.type(editor, validOpenSCADCode);

      // Assert - Check for parsing indicator
      expect(screen.getByText('Parsing AST...')).toBeInTheDocument();

      // Wait for parsing to complete
      await waitFor(() => {
        expect(screen.getByText('✓ 2 AST nodes')).toBeInTheDocument();
      });
    });
  });

  describe('error handling in pipeline', () => {
    it('should handle parse errors gracefully', async () => {
      // Arrange
      mockParseFunction.mockResolvedValue({
        success: false,
        ast: [],
        errors: [mockParseError],
        parseTime: 200
      });

      const onParseErrors = vi.fn();

      // Act
      render(
        <div>
          <MonacoCodeEditor
            value={invalidOpenSCADCode}
            enableASTParsing={true}
            onParseErrors={onParseErrors}
            data-testid="code-editor"
          />
          <VisualizationPanel
            astData={[]}
            parseErrors={[mockParseError]}
            data-testid="visualization-panel"
          />
        </div>
      );

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.type(editor, ' ');

      // Assert
      await waitFor(() => {
        expect(onParseErrors).toHaveBeenCalledWith([mockParseError]);
      });

      expect(screen.getByText('1 Parse Error')).toBeInTheDocument();
      expect(screen.getByText('Syntax error: missing semicolon')).toBeInTheDocument();
      expect(screen.getByText('Line 2, Column 18')).toBeInTheDocument();
    });

    it('should show helpful error suggestions', async () => {
      // Arrange
      const semicolonError: ParseError = {
        message: 'Unexpected token: missing semicolon',
        line: 1,
        column: 15,
        severity: 'error'
      };

      mockParseFunction.mockResolvedValue({
        success: false,
        ast: [],
        errors: [semicolonError],
        parseTime: 180
      });

      // Act
      render(
        <MonacoCodeEditor
          value="cube([10, 10, 10]"
          enableASTParsing={true}
          data-testid="code-editor"
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.type(editor, ' ');

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Suggestion:')).toBeInTheDocument();
        expect(screen.getByText(/add a semicolon/i)).toBeInTheDocument();
      });
    });

    it('should handle empty code gracefully', async () => {
      // Arrange
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: [],
        errors: [],
        parseTime: 50
      });

      // Act
      render(
        <div>
          <MonacoCodeEditor
            value=""
            enableASTParsing={true}
            data-testid="code-editor"
          />
          <VisualizationPanel
            astData={[]}
            parseErrors={[]}
            data-testid="visualization-panel"
          />
        </div>
      );

      // Assert
      expect(screen.getByTestId('no-content')).toBeInTheDocument();
      expect(screen.getByText('No OpenSCAD code to visualize')).toBeInTheDocument();
    });
  });

  describe('performance monitoring', () => {
    it('should track parsing performance', async () => {
      // Arrange
      const slowParseTime = 400; // Exceeds 300ms target
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: slowParseTime
      });

      // Act
      render(
        <MonacoCodeEditor
          value={validOpenSCADCode}
          enableASTParsing={true}
          data-testid="code-editor"
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.type(editor, ' ');

      // Assert
      await waitFor(() => {
        expect(mockParseFunction).toHaveBeenCalled();
      });

      // Verify performance monitoring was called
      const measurePerformance = vi.mocked(require('../../shared/performance/performance-monitor').measurePerformance);
      expect(measurePerformance).toHaveBeenCalledWith('AST_PARSING', expect.any(Function));
    });

    it('should show performance warnings for slow operations', async () => {
      // Arrange
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: 500 // Slow parsing
      });

      // Act
      render(
        <MonacoCodeEditor
          value={validOpenSCADCode}
          enableASTParsing={true}
          data-testid="code-editor"
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      await userEvent.type(editor, ' ');

      // Assert - Should log performance warning
      await waitFor(() => {
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('AST parsing exceeded target time')
        );
      });
    });
  });

  describe('debouncing behavior', () => {
    it('should debounce rapid code changes', async () => {
      // Arrange
      mockParseFunction.mockResolvedValue({
        success: true,
        ast: mockValidAST,
        errors: [],
        parseTime: 100
      });

      // Act
      render(
        <MonacoCodeEditor
          value=""
          enableASTParsing={true}
          data-testid="code-editor"
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      
      // Rapid typing
      await userEvent.type(editor, 'c');
      await userEvent.type(editor, 'u');
      await userEvent.type(editor, 'b');
      await userEvent.type(editor, 'e');

      // Assert - Should only parse once after debounce period
      await waitFor(() => {
        expect(mockParseFunction).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      // Act
      render(
        <div>
          <MonacoCodeEditor
            value={validOpenSCADCode}
            enableASTParsing={true}
            aria-label="OpenSCAD Code Editor"
            data-testid="code-editor"
          />
          <VisualizationPanel
            astData={mockValidAST}
            aria-label="3D Model Visualization"
            data-testid="visualization-panel"
          />
        </div>
      );

      // Assert
      expect(screen.getByLabelText('OpenSCAD Code Editor')).toBeInTheDocument();
      expect(screen.getByLabelText('3D Model Visualization')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      // Act
      render(
        <MonacoCodeEditor
          value={validOpenSCADCode}
          enableASTParsing={true}
          data-testid="code-editor"
        />
      );

      const editor = screen.getByTestId('monaco-editor');
      
      // Assert - Editor should be focusable
      editor.focus();
      expect(editor).toHaveFocus();

      // Should handle keyboard input
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');
      
      // Editor should still be focused and functional
      expect(editor).toHaveFocus();
    });
  });
});
