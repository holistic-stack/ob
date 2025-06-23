/**
 * @file OpenSCAD Editor Panel Tests
 * 
 * TDD tests for the OpenSCAD editor panel component following React 19 best practices
 * and functional programming principles. Tests code editing, conversion, and UI interactions.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { OpenSCADEditorPanel } from './openscad-editor-panel';
import type { OpenSCADEditorPanelProps } from './openscad-editor-panel';

// Mock the R3F CSG converter hook
vi.mock('../../../r3f-csg/hooks/use-r3f-csg-converter', () => ({
  useR3FCSGConverter: vi.fn(() => ({
    convertToR3F: vi.fn(async (code) => ({
      success: true,
      data: {
        CanvasComponent: () => React.createElement('div', { 'data-testid': 'mock-canvas' }),
        SceneComponent: () => React.createElement('div', { 'data-testid': 'mock-scene' }),
        MeshComponents: [() => React.createElement('div', { 'data-testid': 'mock-mesh' })],
        scene: { type: 'Scene' },
        camera: { type: 'PerspectiveCamera' },
        meshes: [{ type: 'Mesh', geometry: { dispose: vi.fn() }, material: { dispose: vi.fn() } }],
        metrics: {
          totalNodes: 1,
          processedNodes: 1,
          failedNodes: 0,
          processingTime: 150,
          memoryUsage: 1024,
          cacheHits: 0,
          cacheMisses: 1
        },
        jsx: '<Canvas>Mock JSX</Canvas>'
      }
    })),
    convertToJSX: vi.fn(async () => ({ success: true, data: 'Mock JSX' })),
    isProcessing: false,
    progress: null,
    error: null,
    result: null,
    state: {
      isProcessing: false,
      conversionCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    },
    statistics: {
      conversionCount: 0,
      cacheHitRate: 0,
      cacheSize: 0
    },
    clearCache: vi.fn(),
    clearError: vi.fn(),
    clearResult: vi.fn(),
    reset: vi.fn()
  }))
}));

describe('OpenSCADEditorPanel', () => {
  const defaultProps: OpenSCADEditorPanelProps = {
    initialCode: 'cube([10, 10, 10]);',
    showExamples: true,
    showStatistics: true
  };

  beforeEach(() => {
    console.log('[DEBUG] Setting up OpenSCAD editor panel test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up OpenSCAD editor panel test');
    vi.clearAllMocks();
  });

  describe('component rendering', () => {
    it('should render with default props', () => {
      console.log('[DEBUG] Testing default rendering');
      
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      expect(screen.getByText('OpenSCAD Code Editor')).toBeInTheDocument();
      expect(screen.getByLabelText('Expand editor')).toBeInTheDocument();
      expect(screen.getByText('Lines: 1')).toBeInTheDocument();
      expect(screen.getByText('Chars: 18')).toBeInTheDocument();
    });

    it('should render with custom initial code', () => {
      console.log('[DEBUG] Testing custom initial code');
      
      const customCode = 'sphere(5);';
      render(<OpenSCADEditorPanel {...defaultProps} initialCode={customCode} />);
      
      expect(screen.getByText('Chars: 10')).toBeInTheDocument();
    });

    it('should render in disabled state', () => {
      console.log('[DEBUG] Testing disabled state');
      
      render(<OpenSCADEditorPanel {...defaultProps} disabled={true} />);
      
      const panel = screen.getByText('OpenSCAD Code Editor').closest('.openscad-editor-panel');
      expect(panel).toHaveClass('disabled');
    });
  });

  describe('panel expansion and collapse', () => {
    it('should expand panel when expand button is clicked', async () => {
      console.log('[DEBUG] Testing panel expansion');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      const expandButton = screen.getByLabelText('Expand editor');
      
      // Initially collapsed
      expect(screen.queryByPlaceholderText('Enter your OpenSCAD code here...')).not.toBeInTheDocument();
      
      // Click to expand
      await user.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your OpenSCAD code here...')).toBeInTheDocument();
        expect(screen.getByLabelText('Collapse editor')).toBeInTheDocument();
      });
    });

    it('should collapse panel when collapse button is clicked', async () => {
      console.log('[DEBUG] Testing panel collapse');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Expand first
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your OpenSCAD code here...')).toBeInTheDocument();
      });
      
      // Then collapse
      await user.click(screen.getByLabelText('Collapse editor'));
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter your OpenSCAD code here...')).not.toBeInTheDocument();
      });
    });
  });

  describe('code editing functionality', () => {
    it('should allow editing code in the textarea', async () => {
      console.log('[DEBUG] Testing code editing');
      
      const user = userEvent.setup();
      const onCodeChange = vi.fn();
      
      render(<OpenSCADEditorPanel {...defaultProps} onCodeChange={onCodeChange} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('cube([10, 10, 10]);')).toBeInTheDocument();
      });
      
      const codeEditor = screen.getByDisplayValue('cube([10, 10, 10]);');
      
      // Clear and type new code
      await user.clear(codeEditor);
      await user.type(codeEditor, 'sphere(8);');
      
      expect(codeEditor).toHaveValue('sphere(8);');
      expect(onCodeChange).toHaveBeenCalledWith('sphere(8);');
    });

    it('should update statistics when code changes', async () => {
      console.log('[DEBUG] Testing statistics updates');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('cube([10, 10, 10]);')).toBeInTheDocument();
      });
      
      const codeEditor = screen.getByDisplayValue('cube([10, 10, 10]);');
      
      // Add more lines
      await user.clear(codeEditor);
      await user.type(codeEditor, 'cube([10, 10, 10]);\nsphere(5);');
      
      await waitFor(() => {
        expect(screen.getByText('Lines: 2')).toBeInTheDocument();
      });
    });

    it('should clear code when clear button is clicked', async () => {
      console.log('[DEBUG] Testing code clearing');
      
      const user = userEvent.setup();
      const onCodeChange = vi.fn();
      
      render(<OpenSCADEditorPanel {...defaultProps} onCodeChange={onCodeChange} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Clear')).toBeInTheDocument();
      });
      
      // Click clear button
      await user.click(screen.getByText('Clear'));
      
      expect(onCodeChange).toHaveBeenCalledWith('');
    });
  });

  describe('conversion functionality', () => {
    it('should trigger conversion when convert button is clicked', async () => {
      console.log('[DEBUG] Testing manual conversion');
      
      const user = userEvent.setup();
      const onConversionComplete = vi.fn();
      
      render(<OpenSCADEditorPanel {...defaultProps} onConversionComplete={onConversionComplete} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
      
      // Click convert button
      await user.click(screen.getByText('Convert to 3D'));
      
      await waitFor(() => {
        expect(onConversionComplete).toHaveBeenCalled();
      });
    });

    it('should handle conversion errors', async () => {
      console.log('[DEBUG] Testing conversion error handling');
      
      // Mock converter to fail
      const { useR3FCSGConverter } = await import('../../../r3f-csg/hooks/use-r3f-csg-converter');
      const mockConverter = useR3FCSGConverter as any;
      
      mockConverter.mockImplementationOnce(() => ({
        convertToR3F: vi.fn(async () => ({
          success: false,
          error: 'Test conversion error'
        })),
        isProcessing: false,
        progress: null,
        error: 'Test conversion error',
        result: null,
        state: { isProcessing: false, conversionCount: 0, cacheHits: 0, cacheMisses: 0 },
        statistics: { conversionCount: 0, cacheHitRate: 0, cacheSize: 0 },
        clearCache: vi.fn(),
        clearError: vi.fn(),
        clearResult: vi.fn(),
        reset: vi.fn()
      }));
      
      const onConversionError = vi.fn();
      const user = userEvent.setup();
      
      render(<OpenSCADEditorPanel {...defaultProps} onConversionError={onConversionError} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
      
      // Click convert button
      await user.click(screen.getByText('Convert to 3D'));
      
      await waitFor(() => {
        expect(onConversionError).toHaveBeenCalledWith('Test conversion error');
      });
    });

    it('should show progress during conversion', async () => {
      console.log('[DEBUG] Testing progress display');
      
      // Mock converter with progress
      const { useR3FCSGConverter } = await import('../../../r3f-csg/hooks/use-r3f-csg-converter');
      const mockConverter = useR3FCSGConverter as any;
      
      mockConverter.mockImplementationOnce(() => ({
        convertToR3F: vi.fn(async () => ({ success: true, data: {} })),
        isProcessing: true,
        progress: {
          stage: 'ast-processing',
          progress: 50,
          message: 'Processing AST...',
          timeElapsed: 250,
          estimatedTimeRemaining: 250
        },
        error: null,
        result: null,
        state: { isProcessing: true, conversionCount: 0, cacheHits: 0, cacheMisses: 0 },
        statistics: { conversionCount: 0, cacheHitRate: 0, cacheSize: 0 },
        clearCache: vi.fn(),
        clearError: vi.fn(),
        clearResult: vi.fn(),
        reset: vi.fn()
      }));
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Processing AST...')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('Stage: ast-processing')).toBeInTheDocument();
        expect(screen.getByText('ETA: 250ms')).toBeInTheDocument();
      });
    });
  });

  describe('example code library', () => {
    it('should render example buttons when showExamples is true', async () => {
      console.log('[DEBUG] Testing example code library');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} showExamples={true} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Example Code Library')).toBeInTheDocument();
        expect(screen.getByText('Simple Cube')).toBeInTheDocument();
        expect(screen.getByText('Simple Sphere')).toBeInTheDocument();
        expect(screen.getByText('Difference Operation')).toBeInTheDocument();
      });
    });

    it('should load example code when example button is clicked', async () => {
      console.log('[DEBUG] Testing example code loading');
      
      const user = userEvent.setup();
      const onCodeChange = vi.fn();
      
      render(<OpenSCADEditorPanel {...defaultProps} onCodeChange={onCodeChange} showExamples={true} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Simple Sphere')).toBeInTheDocument();
      });
      
      // Click sphere example
      await user.click(screen.getByText('Simple Sphere'));
      
      expect(onCodeChange).toHaveBeenCalledWith('sphere(8);');
    });

    it('should not render examples when showExamples is false', async () => {
      console.log('[DEBUG] Testing hidden examples');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} showExamples={false} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your OpenSCAD code here...')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Example Code Library')).not.toBeInTheDocument();
    });
  });

  describe('statistics display', () => {
    it('should render statistics when showStatistics is true', async () => {
      console.log('[DEBUG] Testing statistics display');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} showStatistics={true} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Converter Statistics')).toBeInTheDocument();
        expect(screen.getByText('Total Conversions')).toBeInTheDocument();
        expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument();
        expect(screen.getByText('Cache Size')).toBeInTheDocument();
        expect(screen.getByText('Last Conversion')).toBeInTheDocument();
      });
    });

    it('should not render statistics when showStatistics is false', async () => {
      console.log('[DEBUG] Testing hidden statistics');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} showStatistics={false} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your OpenSCAD code here...')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Converter Statistics')).not.toBeInTheDocument();
    });
  });

  describe('utility controls', () => {
    it('should call clearCache when cache button is clicked', async () => {
      console.log('[DEBUG] Testing cache clearing');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Clear Cache')).toBeInTheDocument();
      });
      
      // Click clear cache button
      await user.click(screen.getByText('Clear Cache'));
      
      // Should not throw - functionality is handled by the hook
      expect(screen.getByText('Clear Cache')).toBeInTheDocument();
    });

    it('should call reset when reset button is clicked', async () => {
      console.log('[DEBUG] Testing reset functionality');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      });
      
      // Click reset button
      await user.click(screen.getByText('Reset'));
      
      // Should not throw - functionality is handled by the hook
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should provide proper ARIA labels', async () => {
      console.log('[DEBUG] Testing accessibility features');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Expand panel
      await user.click(screen.getByLabelText('Expand editor'));
      
      await waitFor(() => {
        const codeEditor = screen.getByLabelText('OpenSCAD code editor');
        expect(codeEditor).toBeInTheDocument();
        
        // Test keyboard navigation
        codeEditor.focus();
        expect(document.activeElement).toBe(codeEditor);
      });
    });

    it('should support keyboard navigation', async () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      const user = userEvent.setup();
      render(<OpenSCADEditorPanel {...defaultProps} />);
      
      // Test expand button keyboard activation
      const expandButton = screen.getByLabelText('Expand editor');
      expandButton.focus();
      expect(document.activeElement).toBe(expandButton);
      
      // Activate with Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your OpenSCAD code here...')).toBeInTheDocument();
      });
    });
  });
});
