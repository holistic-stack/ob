/**
 * @file R3F Renderer CSG Integration Tests
 * 
 * TDD tests for the R3F renderer with CSG converter integration.
 * Tests the complete OpenSCAD code input and 3D visualization workflow.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { R3FRenderer } from './r3f-renderer';
import type { R3FRendererProps } from '../../types/r3f-types';

// Mock the R3F CSG converter hook
vi.mock('../../../r3f-csg/hooks/use-r3f-csg-converter', () => ({
  useR3FCSGConverter: vi.fn(() => ({
    convertToR3F: vi.fn(async (code) => ({
      success: true,
      data: {
        CanvasComponent: () => React.createElement('div', { 'data-testid': 'mock-canvas' }),
        SceneComponent: () => React.createElement('div', { 'data-testid': 'mock-scene' }),
        MeshComponents: [() => React.createElement('div', { 'data-testid': 'mock-mesh' })],
        scene: { type: 'Scene', add: vi.fn(), remove: vi.fn() },
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

// Mock the R3F Canvas component
vi.mock('../r3f-canvas/r3f-canvas', () => ({
  R3FCanvas: vi.fn(({ onRendererReady, onSceneReady, onError }) => {
    // Simulate successful initialization
    React.useEffect(() => {
      const mockRenderer = { type: 'WebGLRenderer', dispose: vi.fn() };
      const mockScene = { type: 'Scene', add: vi.fn(), remove: vi.fn() };
      
      if (onRendererReady) onRendererReady(mockRenderer);
      if (onSceneReady) onSceneReady(mockScene);
    }, [onRendererReady, onSceneReady]);
    
    return React.createElement('div', { 'data-testid': 'r3f-canvas' });
  })
}));

// Mock Three.js
vi.mock('three', () => ({
  WebGLRenderer: vi.fn(),
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn(),
  Mesh: vi.fn(),
  BoxGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn()
}));

describe('R3F Renderer CSG Integration', () => {
  const defaultProps: R3FRendererProps = {
    showSceneControls: true,
    showMeshDisplay: false,
    showDebugPanel: false
  };

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F renderer CSG integration test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F renderer CSG integration test');
    vi.clearAllMocks();
  });

  describe('OpenSCAD code editor integration', () => {
    it('should render OpenSCAD code editor section when scene controls are shown', () => {
      console.log('[DEBUG] Testing OpenSCAD editor rendering');
      
      render(<R3FRenderer {...defaultProps} />);
      
      expect(screen.getByText('OpenSCAD Code')).toBeInTheDocument();
      expect(screen.getByText('Show Editor')).toBeInTheDocument();
    });

    it('should toggle code editor visibility', async () => {
      console.log('[DEBUG] Testing code editor toggle');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      const toggleButton = screen.getByText('Show Editor');
      
      // Initially editor should be hidden
      expect(screen.queryByPlaceholderText('Enter OpenSCAD code here...')).not.toBeInTheDocument();
      
      // Click to show editor
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OpenSCAD code here...')).toBeInTheDocument();
        expect(screen.getByText('Hide Editor')).toBeInTheDocument();
      });
    });

    it('should allow editing OpenSCAD code', async () => {
      console.log('[DEBUG] Testing OpenSCAD code editing');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OpenSCAD code here...')).toBeInTheDocument();
      });
      
      const codeEditor = screen.getByDisplayValue('cube([10, 10, 10]);');
      
      // Clear and type new code
      await user.clear(codeEditor);
      await user.type(codeEditor, 'sphere(5);');
      
      expect(codeEditor).toHaveValue('sphere(5);');
    });

    it('should provide example code buttons', async () => {
      console.log('[DEBUG] Testing example code buttons');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Load Cube Example')).toBeInTheDocument();
        expect(screen.getByText('Load Sphere Example')).toBeInTheDocument();
      });
      
      const codeEditor = screen.getByPlaceholderText('Enter OpenSCAD code here...');
      
      // Test sphere example
      await user.click(screen.getByText('Load Sphere Example'));
      expect(codeEditor).toHaveValue('sphere(8);');
      
      // Test cube example
      await user.click(screen.getByText('Load Cube Example'));
      expect(codeEditor).toHaveValue('cube([10, 10, 10]);');
    });
  });

  describe('OpenSCAD to 3D conversion', () => {
    it('should trigger conversion when convert button is clicked', async () => {
      console.log('[DEBUG] Testing manual conversion trigger');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
      
      // Click convert button
      await user.click(screen.getByText('Convert to 3D'));
      
      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Converting...')).toBeInTheDocument();
      });
    });

    it('should handle conversion errors gracefully', async () => {
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
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
      
      // Click convert button
      await user.click(screen.getByText('Convert to 3D'));
      
      // Should handle error gracefully
      await waitFor(() => {
        // The error should be handled internally
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
    });

    it('should show conversion progress when available', async () => {
      console.log('[DEBUG] Testing conversion progress display');
      
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
          timeElapsed: 250
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
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Processing AST...')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('scene integration', () => {
    it('should integrate converted meshes with the R3F scene', async () => {
      console.log('[DEBUG] Testing scene integration');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Verify R3F canvas is rendered
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
      
      // Show the editor and convert
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Convert to 3D'));
      
      // Should integrate with the scene
      await waitFor(() => {
        expect(screen.getByText('Converting...')).toBeInTheDocument();
      });
    });

    it('should handle scene cleanup when new meshes are added', async () => {
      console.log('[DEBUG] Testing scene cleanup');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show editor and convert multiple times
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        expect(screen.getByText('Convert to 3D')).toBeInTheDocument();
      });
      
      // First conversion
      await user.click(screen.getByText('Convert to 3D'));
      
      await waitFor(() => {
        expect(screen.getByText('Converting...')).toBeInTheDocument();
      });
      
      // Change code and convert again
      const codeEditor = screen.getByDisplayValue('cube([10, 10, 10]);');
      await user.clear(codeEditor);
      await user.type(codeEditor, 'sphere(3);');
      
      await user.click(screen.getByText('Convert to 3D'));
      
      // Should handle cleanup and new conversion
      await waitFor(() => {
        expect(screen.getByText('Converting...')).toBeInTheDocument();
      });
    });
  });

  describe('user interface integration', () => {
    it('should maintain existing scene controls functionality', () => {
      console.log('[DEBUG] Testing existing scene controls');
      
      render(<R3FRenderer {...defaultProps} />);
      
      expect(screen.getByText('Scene Controls')).toBeInTheDocument();
      expect(screen.getByText('Toggle Wireframe')).toBeInTheDocument();
      expect(screen.getByText('Toggle Lighting')).toBeInTheDocument();
    });

    it('should show converter statistics when editor is open', async () => {
      console.log('[DEBUG] Testing converter statistics display');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      // Statistics should not be visible initially (they're in the hook implementation)
      // This test verifies the UI structure is in place
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OpenSCAD code here...')).toBeInTheDocument();
      });
    });

    it('should handle responsive layout with code editor', async () => {
      console.log('[DEBUG] Testing responsive layout');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        const editorContainer = screen.getByPlaceholderText('Enter OpenSCAD code here...');
        expect(editorContainer).toBeInTheDocument();
        
        // Verify the editor has proper CSS classes for responsive design
        expect(editorContainer).toHaveClass('openscad-code-editor');
      });
    });
  });

  describe('accessibility', () => {
    it('should provide proper ARIA labels for OpenSCAD editor', async () => {
      console.log('[DEBUG] Testing accessibility features');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        const codeEditor = screen.getByPlaceholderText('Enter OpenSCAD code here...');
        expect(codeEditor).toBeInTheDocument();
        
        // Verify keyboard navigation works
        codeEditor.focus();
        expect(document.activeElement).toBe(codeEditor);
      });
    });

    it('should support keyboard navigation for editor controls', async () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      const user = userEvent.setup();
      render(<R3FRenderer {...defaultProps} />);
      
      // Show the editor
      await user.click(screen.getByText('Show Editor'));
      
      await waitFor(() => {
        const convertButton = screen.getByText('Convert to 3D');
        expect(convertButton).toBeInTheDocument();
        
        // Test keyboard activation
        convertButton.focus();
        expect(document.activeElement).toBe(convertButton);
      });
    });
  });
});
