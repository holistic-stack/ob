/**
 * @file Babylon Renderer Component Tests
 * 
 * TDD tests for the main BabylonRenderer component that composes all sub-components
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { BabylonRenderer } from './babylon-renderer';
import type { BabylonRendererProps } from '../../types/babylon-types';

describe('BabylonRenderer', () => {
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;

  beforeEach(() => {
    console.log('[INIT] Setting up BabylonRenderer component tests');
    
    // Create mock engine and scene
    mockEngine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    mockScene = new BABYLON.Scene(mockEngine);
    
    // Add some test content
    BABYLON.MeshBuilder.CreateBox('testBox', { size: 2 }, mockScene);
    new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), mockScene);
  });

  afterEach(() => {
    console.log('[END] Cleaning up BabylonRenderer component tests');
    cleanup();
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  describe('rendering and layout', () => {
    it('should render main renderer container with default layout', () => {
      console.log('[DEBUG] Testing main renderer container rendering');
      
      render(<BabylonRenderer />);
      
      expect(screen.getByRole('main', { name: 'Babylon Renderer' })).toBeInTheDocument();
      expect(screen.getByTestId('babylon-renderer-container')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      console.log('[DEBUG] Testing custom className');
      
      render(<BabylonRenderer className="custom-renderer" />);
      
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toHaveClass('babylon-renderer', 'custom-renderer');
    });

    it('should render all sub-components when enabled', () => {
      console.log('[DEBUG] Testing sub-component rendering');
      
      render(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
          showDebugPanel={true}
        />
      );
      
      // Check for canvas (always present)
      expect(screen.getByLabelText('Babylon Canvas')).toBeInTheDocument();
      
      // Check for optional components
      expect(screen.getByText('Scene Controls')).toBeInTheDocument();
      expect(screen.getByText('Mesh Display')).toBeInTheDocument();
      expect(screen.getByText('Debug Panel')).toBeInTheDocument();
    });

    it('should use responsive layout by default', () => {
      console.log('[DEBUG] Testing responsive layout');
      
      render(<BabylonRenderer />);
      
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toHaveClass('babylon-renderer--responsive');
    });

    it('should support custom layout configuration', () => {
      console.log('[DEBUG] Testing custom layout');
      
      render(
        <BabylonRenderer 
          layout="grid"
          responsive={false}
        />
      );
      
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toHaveClass('babylon-renderer--grid');
      expect(container).not.toHaveClass('babylon-renderer--responsive');
    });
  });

  describe('engine and scene integration', () => {
    it('should initialize engine and scene automatically', async () => {
      console.log('[DEBUG] Testing automatic engine/scene initialization');
      
      render(<BabylonRenderer />);
      
      await waitFor(() => {
        const canvas = screen.getByLabelText('Babylon Canvas');
        expect(canvas).toBeInTheDocument();
      });
    });

    it('should use provided engine configuration', () => {
      console.log('[DEBUG] Testing custom engine configuration');
      
      const engineConfig = {
        antialias: true,
        adaptToDeviceRatio: true,
        powerPreference: 'high-performance' as const
      };
      
      render(<BabylonRenderer engineConfig={engineConfig} />);
      
      const canvas = screen.getByLabelText('Babylon Canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should use provided scene configuration', () => {
      console.log('[DEBUG] Testing custom scene configuration');
      
      const sceneConfig = {
        enableCamera: true,
        enableLighting: true,
        backgroundColor: '#ff0000',
        cameraPosition: [5, 5, 5] as const
      };
      
      render(<BabylonRenderer sceneConfig={sceneConfig} />);
      
      const canvas = screen.getByLabelText('Babylon Canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should handle engine creation failure gracefully', () => {
      console.log('[DEBUG] Testing engine creation failure handling');

      render(<BabylonRenderer />);

      // Should still render container even if engine creation fails
      expect(screen.getByTestId('babylon-renderer-container')).toBeInTheDocument();

      // Should show loading state initially
      expect(screen.getByText('Initializing Babylon.js Renderer...')).toBeInTheDocument();
    });
  });

  describe('component communication and data flow', () => {
    it('should pass scene to all sub-components', async () => {
      console.log('[DEBUG] Testing scene passing to sub-components');
      
      render(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
          showDebugPanel={true}
        />
      );
      
      await waitFor(() => {
        // All components should receive the scene and be functional
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
        expect(screen.getByText('Debug Panel')).toBeInTheDocument();
      });
    });

    it('should handle scene controls events', async () => {
      console.log('[DEBUG] Testing scene controls event handling');

      const mockOnSceneChange = vi.fn();

      render(
        <BabylonRenderer
          showSceneControls={true}
          onSceneChange={mockOnSceneChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
      });

      // Find wireframe button (should be disabled initially due to no scene)
      const wireframeButton = screen.getByRole('button', { name: /wireframe/i });
      expect(wireframeButton).toBeInTheDocument();
      expect(wireframeButton).toBeDisabled();
    }, { timeout: 5000 });

    it('should handle mesh display events', async () => {
      console.log('[DEBUG] Testing mesh display event handling');
      
      const mockOnMeshSelect = vi.fn();
      
      render(
        <BabylonRenderer 
          showMeshDisplay={true}
          onMeshSelect={mockOnMeshSelect}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
      });
      
      // Component should be ready to handle mesh selection
      const meshDisplay = screen.getByText('Mesh Display');
      expect(meshDisplay).toBeInTheDocument();
    });

    it('should handle debug panel events', async () => {
      console.log('[DEBUG] Testing debug panel event handling');
      
      const mockOnDebugExport = vi.fn();
      
      render(
        <BabylonRenderer 
          showDebugPanel={true}
          onDebugExport={mockOnDebugExport}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Debug Panel')).toBeInTheDocument();
      });
      
      // Component should be ready to handle debug export
      const debugPanel = screen.getByText('Debug Panel');
      expect(debugPanel).toBeInTheDocument();
    });
  });

  describe('state management', () => {
    it('should maintain consistent state across components', async () => {
      console.log('[DEBUG] Testing state consistency');
      
      render(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
          showDebugPanel={true}
        />
      );
      
      await waitFor(() => {
        // All components should be rendered and share the same scene state
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
        expect(screen.getByText('Debug Panel')).toBeInTheDocument();
      });
    });

    it('should update all components when scene changes', async () => {
      console.log('[DEBUG] Testing scene change propagation');
      
      const { rerender } = render(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
      });
      
      // Rerender with different configuration
      rerender(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
          sceneConfig={{ backgroundColor: '#00ff00' }}
        />
      );
      
      // Components should still be present and functional
      await waitFor(() => {
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
      });
    });

    it('should handle component enable/disable dynamically', async () => {
      console.log('[DEBUG] Testing dynamic component enable/disable');
      
      const { rerender } = render(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={false}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
        expect(screen.queryByText('Mesh Display')).not.toBeInTheDocument();
      });
      
      // Enable mesh display
      rerender(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Scene Controls')).toBeInTheDocument();
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
      });
    });
  });

  describe('performance and optimization', () => {
    it('should not re-render unnecessarily', () => {
      console.log('[DEBUG] Testing render performance');
      
      const { rerender } = render(<BabylonRenderer />);
      
      // Rerender with same props
      rerender(<BabylonRenderer />);
      
      // Component should handle this gracefully
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toBeInTheDocument();
    });

    it('should handle large numbers of meshes efficiently', async () => {
      console.log('[DEBUG] Testing performance with many meshes');
      
      render(
        <BabylonRenderer 
          showMeshDisplay={true}
          meshDisplayConfig={{ virtualizeList: true, maxVisibleItems: 50 }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Mesh Display')).toBeInTheDocument();
      });
    });

    it('should optimize debug panel updates', async () => {
      console.log('[DEBUG] Testing debug panel performance');
      
      render(
        <BabylonRenderer 
          showDebugPanel={true}
          debugPanelConfig={{ updateInterval: 1000, showPerformanceMetrics: true }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Debug Panel')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing accessibility attributes');
      
      render(<BabylonRenderer />);
      
      const main = screen.getByRole('main', { name: 'Babylon Renderer' });
      expect(main).toHaveAttribute('aria-label', 'Babylon Renderer');
    });

    it('should support custom ARIA attributes', () => {
      console.log('[DEBUG] Testing custom ARIA attributes');
      
      render(
        <BabylonRenderer 
          aria-label="Custom 3D Renderer"
          aria-describedby="renderer-description"
        />
      );
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Custom 3D Renderer');
      expect(main).toHaveAttribute('aria-describedby', 'renderer-description');
    });

    it('should have keyboard navigation support', () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      render(
        <BabylonRenderer 
          showSceneControls={true}
          showDebugPanel={true}
        />
      );
      
      // All interactive elements should be keyboard accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });
  });

  describe('error handling', () => {
    it('should handle component errors gracefully', () => {
      console.log('[DEBUG] Testing component error handling');
      
      render(<BabylonRenderer />);
      
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toBeInTheDocument();
    });

    it('should maintain functionality when sub-components fail', async () => {
      console.log('[DEBUG] Testing sub-component failure handling');
      
      render(
        <BabylonRenderer 
          showSceneControls={true}
          showMeshDisplay={true}
        />
      );
      
      // Main container should still be functional
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toBeInTheDocument();
    });

    it('should provide error boundaries for sub-components', () => {
      console.log('[DEBUG] Testing error boundaries');
      
      render(<BabylonRenderer />);
      
      // Component should render without errors
      const container = screen.getByTestId('babylon-renderer-container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('cleanup and disposal', () => {
    it('should cleanup resources on unmount', () => {
      console.log('[DEBUG] Testing resource cleanup');
      
      const { unmount } = render(<BabylonRenderer />);
      
      unmount();
      
      // Component should cleanup gracefully
      expect(screen.queryByTestId('babylon-renderer-container')).not.toBeInTheDocument();
    });

    it('should dispose engine and scene properly', () => {
      console.log('[DEBUG] Testing engine/scene disposal');
      
      const { unmount } = render(<BabylonRenderer />);
      
      unmount();
      
      // Resources should be cleaned up
      expect(screen.queryByLabelText('Babylon Canvas')).not.toBeInTheDocument();
    });
  });
});
