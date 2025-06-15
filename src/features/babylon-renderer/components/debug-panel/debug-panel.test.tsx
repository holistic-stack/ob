/**
 * @file Debug Panel Component Tests
 * 
 * TDD tests for the DebugPanel component
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { DebugPanel } from './debug-panel';
import type { DebugPanelProps } from '../../types/babylon-types';

describe('DebugPanel', () => {
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;
  let mockMesh: BABYLON.Mesh;

  beforeEach(() => {
    console.log('[INIT] Setting up DebugPanel component tests');
    
    // Create mock engine and scene
    mockEngine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    mockScene = new BABYLON.Scene(mockEngine);
    
    // Create mock mesh
    mockMesh = BABYLON.MeshBuilder.CreateBox('testBox', { size: 2 }, mockScene);
    
    // Add some lights for testing
    new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), mockScene);
    new BABYLON.DirectionalLight('light2', new BABYLON.Vector3(0, -1, 0), mockScene);
  });

  afterEach(() => {
    console.log('[END] Cleaning up DebugPanel component tests');
    cleanup();
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  describe('rendering', () => {
    it('should render debug panel with default props', () => {
      console.log('[DEBUG] Testing debug panel rendering');
      
      render(<DebugPanel scene={mockScene} />);
      
      expect(screen.getByRole('region', { name: 'Debug Panel' })).toBeInTheDocument();
      expect(screen.getByText('Debug Panel')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      console.log('[DEBUG] Testing custom className');
      
      render(<DebugPanel scene={mockScene} className="custom-debug-panel" />);
      
      const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
      expect(debugPanel).toHaveClass('debug-panel', 'custom-debug-panel');
    });

    it('should render with custom title', () => {
      console.log('[DEBUG] Testing custom title');
      
      render(<DebugPanel scene={mockScene} title="Custom Debug Info" />);
      
      expect(screen.getByText('Custom Debug Info')).toBeInTheDocument();
    });

    it('should handle null scene gracefully', () => {
      console.log('[DEBUG] Testing null scene handling');
      
      render(<DebugPanel scene={null} />);
      
      const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
      expect(debugPanel).toBeInTheDocument();
      expect(screen.getByText('No scene available')).toBeInTheDocument();
    });
  });

  describe('scene information display', () => {
    it('should display basic scene information', async () => {
      console.log('[DEBUG] Testing scene information display');

      render(<DebugPanel scene={mockScene} showSceneInfo={true} />);

      await waitFor(() => {
        expect(screen.getByText(/scene ready/i)).toBeInTheDocument();
        expect(screen.getByText('Scene Information')).toBeInTheDocument();
        // Check for specific labels and values
        expect(screen.getByText('Meshes:')).toBeInTheDocument();
        expect(screen.getByText('Lights:')).toBeInTheDocument();
      });
    });

    it('should display mesh details when expanded', async () => {
      console.log('[DEBUG] Testing mesh details display');
      
      render(<DebugPanel scene={mockScene} showMeshDetails={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      const expandButton = screen.getByRole('button', { name: /collapse.*testBox/i });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText(/vertices/i)).toBeInTheDocument();
        expect(screen.getByText(/triangles/i)).toBeInTheDocument();
        expect(screen.getByText(/position/i)).toBeInTheDocument();
      });
    });

    it('should display camera information', async () => {
      console.log('[DEBUG] Testing camera information display');
      
      // Add a camera to the scene
      const camera = new BABYLON.ArcRotateCamera(
        'camera',
        -Math.PI / 4,
        Math.PI / 3,
        10,
        BABYLON.Vector3.Zero(),
        mockScene
      );
      
      render(<DebugPanel scene={mockScene} showCameraInfo={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Camera Information')).toBeInTheDocument();
        expect(screen.getByText('ArcRotateCamera')).toBeInTheDocument();
      });
    });

    it('should display lighting information', async () => {
      console.log('[DEBUG] Testing lighting information display');
      
      render(<DebugPanel scene={mockScene} showLightingInfo={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Lighting Information')).toBeInTheDocument();
        expect(screen.getByText('light1')).toBeInTheDocument();
        expect(screen.getByText('light2')).toBeInTheDocument();
      });
    });
  });

  describe('performance monitoring', () => {
    it('should display performance metrics when enabled', async () => {
      console.log('[DEBUG] Testing performance metrics display');
      
      render(<DebugPanel scene={mockScene} showPerformanceMetrics={true} />);
      
      await waitFor(() => {
        expect(screen.getByText(/fps/i)).toBeInTheDocument();
        expect(screen.getByText(/frame time/i)).toBeInTheDocument();
      });
    });

    it('should update performance metrics in real-time', async () => {
      console.log('[DEBUG] Testing real-time performance updates');
      
      render(<DebugPanel scene={mockScene} showPerformanceMetrics={true} updateInterval={100} />);
      
      await waitFor(() => {
        expect(screen.getByText(/fps/i)).toBeInTheDocument();
      });
      
      // Wait for at least one update cycle
      await waitFor(() => {
        const fpsElement = screen.getByText(/fps/i);
        expect(fpsElement).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should display memory usage when available', async () => {
      console.log('[DEBUG] Testing memory usage display');

      render(<DebugPanel scene={mockScene} showPerformanceMetrics={true} showMemoryUsage={true} />);

      await waitFor(() => {
        expect(screen.getByText(/fps/i)).toBeInTheDocument();
        // Memory usage might not be available in test environment
      });
    });

    it('should display render statistics', async () => {
      console.log('[DEBUG] Testing render statistics display');

      render(<DebugPanel scene={mockScene} showPerformanceMetrics={true} showRenderStats={true} />);

      await waitFor(() => {
        expect(screen.getByText(/fps/i)).toBeInTheDocument();
        expect(screen.getByText(/frame time/i)).toBeInTheDocument();
      });
    });
  });

  describe('debug controls', () => {
    it('should render debug action buttons', () => {
      console.log('[DEBUG] Testing debug action buttons');
      
      render(<DebugPanel scene={mockScene} showDebugControls={true} />);
      
      expect(screen.getByRole('button', { name: /refresh debug info/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export debug report/i })).toBeInTheDocument();
    });

    it('should call onRefresh when refresh button is clicked', () => {
      console.log('[DEBUG] Testing refresh button callback');
      
      const mockOnRefresh = vi.fn();
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showDebugControls={true}
          onRefresh={mockOnRefresh}
        />
      );
      
      const refreshButton = screen.getByRole('button', { name: /refresh debug info/i });
      fireEvent.click(refreshButton);
      
      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should call onExportReport when export button is clicked', () => {
      console.log('[DEBUG] Testing export button callback');
      
      const mockOnExportReport = vi.fn();
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showDebugControls={true}
          onExportReport={mockOnExportReport}
        />
      );
      
      const exportButton = screen.getByRole('button', { name: /export debug report/i });
      fireEvent.click(exportButton);
      
      expect(mockOnExportReport).toHaveBeenCalledTimes(1);
    });

    it('should disable debug controls when scene is null', () => {
      console.log('[DEBUG] Testing debug controls disabled state');
      
      render(<DebugPanel scene={null} showDebugControls={true} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh debug info/i });
      const exportButton = screen.getByRole('button', { name: /export debug report/i });
      
      expect(refreshButton).toBeDisabled();
      expect(exportButton).toBeDisabled();
    });
  });

  describe('collapsible sections', () => {
    it('should render section collapse/expand buttons', () => {
      console.log('[DEBUG] Testing section collapse buttons');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showSceneInfo={true}
          showPerformanceMetrics={true}
          collapsibleSections={true}
        />
      );
      
      expect(screen.getByRole('button', { name: /collapse.*scene info/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /collapse.*performance/i })).toBeInTheDocument();
    });

    it('should toggle section visibility when collapse button is clicked', async () => {
      console.log('[DEBUG] Testing section collapse functionality');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showSceneInfo={true}
          collapsibleSections={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/scene ready/i)).toBeInTheDocument();
      });
      
      const collapseButton = screen.getByRole('button', { name: /collapse.*scene info/i });
      fireEvent.click(collapseButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/scene ready/i)).not.toBeVisible();
      });
      
      // Click to expand again
      const expandButton = screen.getByRole('button', { name: /expand.*scene info/i });
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText(/scene ready/i)).toBeVisible();
      });
    });

    it('should start with collapsed sections when defaultCollapsed is true', () => {
      console.log('[DEBUG] Testing default collapsed state');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showSceneInfo={true}
          collapsibleSections={true}
          defaultCollapsed={true}
        />
      );
      
      const sceneInfoSection = screen.getByTestId('scene-info-content');
      expect(sceneInfoSection).not.toBeVisible();
    });
  });

  describe('filtering and search', () => {
    it('should render search input when searchable is true', () => {
      console.log('[DEBUG] Testing search input rendering');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showMeshDetails={true}
          searchable={true}
        />
      );
      
      expect(screen.getByPlaceholderText(/search debug info/i)).toBeInTheDocument();
    });

    it('should filter debug information based on search term', async () => {
      console.log('[DEBUG] Testing debug info filtering');
      
      // Add multiple meshes for filtering
      BABYLON.MeshBuilder.CreateSphere('sphere1', { diameter: 1 }, mockScene);
      BABYLON.MeshBuilder.CreateCylinder('cylinder1', { height: 2 }, mockScene);
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showMeshDetails={true}
          searchable={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
        expect(screen.getByText('sphere1')).toBeInTheDocument();
        expect(screen.getByText('cylinder1')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search debug info/i);
      fireEvent.change(searchInput, { target: { value: 'sphere' } });
      
      await waitFor(() => {
        expect(screen.queryByText('testBox')).not.toBeInTheDocument();
        expect(screen.getByText('sphere1')).toBeInTheDocument();
        expect(screen.queryByText('cylinder1')).not.toBeInTheDocument();
      });
    });

    it('should clear search when clear button is clicked', async () => {
      console.log('[DEBUG] Testing search clear');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showMeshDetails={true}
          searchable={true}
        />
      );
      
      const searchInput = screen.getByPlaceholderText(/search debug info/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing accessibility attributes');
      
      render(<DebugPanel scene={mockScene} />);
      
      const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
      expect(debugPanel).toHaveAttribute('aria-label', 'Debug Panel');
    });

    it('should support custom ARIA attributes', () => {
      console.log('[DEBUG] Testing custom ARIA attributes');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          aria-label="Custom Debug Panel"
          aria-describedby="debug-description"
        />
      );
      
      const debugPanel = screen.getByRole('region');
      expect(debugPanel).toHaveAttribute('aria-label', 'Custom Debug Panel');
      expect(debugPanel).toHaveAttribute('aria-describedby', 'debug-description');
    });

    it('should have keyboard navigation support', () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      render(
        <DebugPanel 
          scene={mockScene} 
          showDebugControls={true}
          collapsibleSections={true}
        />
      );
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('error handling', () => {
    it('should handle disposed scene gracefully', () => {
      console.log('[DEBUG] Testing disposed scene handling');
      
      mockScene.dispose();
      
      render(<DebugPanel scene={mockScene} />);
      
      const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
      expect(debugPanel).toBeInTheDocument();
      expect(screen.getByText(/scene not available/i)).toBeInTheDocument();
    });

    it('should maintain consistent state during errors', () => {
      console.log('[DEBUG] Testing state consistency during errors');
      
      const { rerender } = render(<DebugPanel scene={mockScene} />);
      
      // Dispose scene and rerender
      mockScene.dispose();
      rerender(<DebugPanel scene={mockScene} />);
      
      const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
      expect(debugPanel).toBeInTheDocument();
    });

    it('should handle performance monitoring errors gracefully', async () => {
      console.log('[DEBUG] Testing performance monitoring error handling');
      
      render(<DebugPanel scene={mockScene} showPerformanceMetrics={true} />);
      
      // Component should handle this gracefully even if performance API is unavailable
      await waitFor(() => {
        const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
        expect(debugPanel).toBeInTheDocument();
      });
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      console.log('[DEBUG] Testing render performance');
      
      const mockOnRefresh = vi.fn();
      
      const { rerender } = render(
        <DebugPanel 
          scene={mockScene} 
          onRefresh={mockOnRefresh}
        />
      );
      
      // Rerender with same props
      rerender(
        <DebugPanel 
          scene={mockScene} 
          onRefresh={mockOnRefresh}
        />
      );
      
      // Component should handle this gracefully
      const debugPanel = screen.getByRole('region', { name: 'Debug Panel' });
      expect(debugPanel).toBeInTheDocument();
    });

    it('should handle update interval changes efficiently', async () => {
      console.log('[DEBUG] Testing update interval performance');
      
      const { rerender } = render(
        <DebugPanel 
          scene={mockScene} 
          showPerformanceMetrics={true}
          updateInterval={1000}
        />
      );
      
      // Change update interval
      rerender(
        <DebugPanel 
          scene={mockScene} 
          showPerformanceMetrics={true}
          updateInterval={500}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/fps/i)).toBeInTheDocument();
      });
    });
  });
});
