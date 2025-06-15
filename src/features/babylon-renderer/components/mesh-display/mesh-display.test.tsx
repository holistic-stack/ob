/**
 * @file Mesh Display Component Tests
 * 
 * TDD tests for the MeshDisplay component
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { MeshDisplay } from './mesh-display';
import type { MeshDisplayProps } from '../../types/babylon-types';

describe('MeshDisplay', () => {
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;
  let mockMesh: BABYLON.Mesh;

  beforeEach(() => {
    console.log('[INIT] Setting up MeshDisplay component tests');
    
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
  });

  afterEach(() => {
    console.log('[END] Cleaning up MeshDisplay component tests');
    cleanup();
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  describe('rendering', () => {
    it('should render mesh display container with default props', () => {
      console.log('[DEBUG] Testing mesh display rendering');
      
      render(<MeshDisplay scene={mockScene} />);
      
      expect(screen.getByRole('region', { name: 'Mesh Display' })).toBeInTheDocument();
      expect(screen.getByText('Mesh Display')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      console.log('[DEBUG] Testing custom className');
      
      render(<MeshDisplay scene={mockScene} className="custom-mesh-display" />);
      
      const meshDisplay = screen.getByRole('region', { name: 'Mesh Display' });
      expect(meshDisplay).toHaveClass('mesh-display', 'custom-mesh-display');
    });

    it('should render with custom title', () => {
      console.log('[DEBUG] Testing custom title');
      
      render(<MeshDisplay scene={mockScene} title="Custom Mesh Viewer" />);
      
      expect(screen.getByText('Custom Mesh Viewer')).toBeInTheDocument();
    });

    it('should handle null scene gracefully', () => {
      console.log('[DEBUG] Testing null scene handling');
      
      render(<MeshDisplay scene={null} />);
      
      const meshDisplay = screen.getByRole('region', { name: 'Mesh Display' });
      expect(meshDisplay).toBeInTheDocument();
      expect(screen.getByText('No scene available')).toBeInTheDocument();
    });
  });

  describe('mesh loading', () => {
    it('should display meshes when available', async () => {
      console.log('[DEBUG] Testing mesh display');

      render(<MeshDisplay scene={mockScene} />);

      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
    });

    it('should show empty state when no meshes', async () => {
      console.log('[DEBUG] Testing empty state');

      // Create scene without meshes
      const emptyScene = new BABYLON.Scene(mockEngine);

      render(<MeshDisplay scene={emptyScene} />);

      await waitFor(() => {
        expect(screen.getByText(/no meshes/i)).toBeInTheDocument();
      });

      emptyScene.dispose();
    });

    it('should update when meshes are added to scene', async () => {
      console.log('[DEBUG] Testing dynamic mesh updates');

      const emptyScene = new BABYLON.Scene(mockEngine);
      const { rerender } = render(<MeshDisplay scene={emptyScene} />);

      await waitFor(() => {
        expect(screen.getByText(/no meshes/i)).toBeInTheDocument();
      });

      // Add mesh to scene
      BABYLON.MeshBuilder.CreateSphere('testSphere', { diameter: 2 }, emptyScene);

      rerender(<MeshDisplay scene={emptyScene} />);

      await waitFor(() => {
        expect(screen.getByText('testSphere')).toBeInTheDocument();
      }, { timeout: 2000 });

      emptyScene.dispose();
    });

    it('should handle loading state transitions', async () => {
      console.log('[DEBUG] Testing loading state transitions');

      render(<MeshDisplay scene={mockScene} />);

      // Should eventually show the mesh
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
    });
  });

  describe('mesh interaction', () => {
    it('should call onMeshSelect when mesh is clicked', async () => {
      console.log('[DEBUG] Testing mesh selection');
      
      const mockOnMeshSelect = vi.fn();
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          onMeshSelect={mockOnMeshSelect}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      const meshItem = screen.getByText('testBox');
      fireEvent.click(meshItem);
      
      expect(mockOnMeshSelect).toHaveBeenCalledWith(mockMesh);
    });

    it('should call onMeshDelete when delete button is clicked', async () => {
      console.log('[DEBUG] Testing mesh deletion');
      
      const mockOnMeshDelete = vi.fn();
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          onMeshDelete={mockOnMeshDelete}
          showDeleteButton={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByRole('button', { name: /delete.*testBox/i });
      fireEvent.click(deleteButton);
      
      expect(mockOnMeshDelete).toHaveBeenCalledWith(mockMesh);
    });

    it('should call onMeshToggleVisibility when visibility button is clicked', async () => {
      console.log('[DEBUG] Testing mesh visibility toggle');
      
      const mockOnMeshToggleVisibility = vi.fn();
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          onMeshToggleVisibility={mockOnMeshToggleVisibility}
          showVisibilityButton={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      const visibilityButton = screen.getByRole('button', { name: /toggle visibility.*testBox/i });
      fireEvent.click(visibilityButton);
      
      expect(mockOnMeshToggleVisibility).toHaveBeenCalledWith(mockMesh);
    });

    it('should show mesh properties when expanded', async () => {
      console.log('[DEBUG] Testing mesh properties display');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          showMeshProperties={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      const expandButton = screen.getByRole('button', { name: /expand.*testBox/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText(/vertices/i)).toBeInTheDocument();
      expect(screen.getByText(/triangles/i)).toBeInTheDocument();
    });
  });

  describe('filtering and search', () => {
    beforeEach(() => {
      // Add multiple meshes for filtering tests
      BABYLON.MeshBuilder.CreateSphere('sphere1', { diameter: 1 }, mockScene);
      BABYLON.MeshBuilder.CreateCylinder('cylinder1', { height: 2 }, mockScene);
    });

    it('should render search input when searchable is true', () => {
      console.log('[DEBUG] Testing search input rendering');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          searchable={true}
        />
      );
      
      expect(screen.getByPlaceholderText(/search meshes/i)).toBeInTheDocument();
    });

    it('should filter meshes based on search term', async () => {
      console.log('[DEBUG] Testing mesh filtering');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          searchable={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
        expect(screen.getByText('sphere1')).toBeInTheDocument();
        expect(screen.getByText('cylinder1')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search meshes/i);
      fireEvent.change(searchInput, { target: { value: 'sphere' } });
      
      await waitFor(() => {
        expect(screen.queryByText('testBox')).not.toBeInTheDocument();
        expect(screen.getByText('sphere1')).toBeInTheDocument();
        expect(screen.queryByText('cylinder1')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      console.log('[DEBUG] Testing no search results');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          searchable={true}
        />
      );
      
      const searchInput = screen.getByPlaceholderText(/search meshes/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText(/no meshes match/i)).toBeInTheDocument();
      });
    });

    it('should clear search when clear button is clicked', async () => {
      console.log('[DEBUG] Testing search clear');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          searchable={true}
        />
      );
      
      const searchInput = screen.getByPlaceholderText(/search meshes/i);
      fireEvent.change(searchInput, { target: { value: 'sphere' } });
      
      await waitFor(() => {
        expect(screen.getByText('sphere1')).toBeInTheDocument();
      });
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
        expect(screen.getByText('sphere1')).toBeInTheDocument();
        expect(screen.getByText('cylinder1')).toBeInTheDocument();
      });
    });
  });

  describe('mesh statistics', () => {
    it('should display mesh count when showStatistics is true', async () => {
      console.log('[DEBUG] Testing mesh statistics');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          showStatistics={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/1 mesh/i)).toBeInTheDocument();
      });
    });

    it('should update statistics when meshes change', async () => {
      console.log('[DEBUG] Testing statistics updates');

      const { rerender } = render(
        <MeshDisplay
          scene={mockScene}
          showStatistics={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/1 mesh/i)).toBeInTheDocument();
      });

      // Add another mesh
      BABYLON.MeshBuilder.CreateSphere('sphere2', { diameter: 1 }, mockScene);

      // Force re-render to trigger mesh list update
      rerender(
        <MeshDisplay
          scene={mockScene}
          showStatistics={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/2 meshes/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing accessibility attributes');
      
      render(<MeshDisplay scene={mockScene} />);
      
      const meshDisplay = screen.getByRole('region', { name: 'Mesh Display' });
      expect(meshDisplay).toHaveAttribute('aria-label', 'Mesh Display');
    });

    it('should support custom ARIA attributes', () => {
      console.log('[DEBUG] Testing custom ARIA attributes');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          aria-label="Custom Mesh Display"
          aria-describedby="mesh-description"
        />
      );
      
      const meshDisplay = screen.getByRole('region');
      expect(meshDisplay).toHaveAttribute('aria-label', 'Custom Mesh Display');
      expect(meshDisplay).toHaveAttribute('aria-describedby', 'mesh-description');
    });

    it('should have keyboard navigation support', async () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          showDeleteButton={true}
          showVisibilityButton={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
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
      
      render(<MeshDisplay scene={mockScene} />);
      
      const meshDisplay = screen.getByRole('region', { name: 'Mesh Display' });
      expect(meshDisplay).toBeInTheDocument();
      expect(screen.getByText(/scene not available/i)).toBeInTheDocument();
    });

    it('should handle mesh disposal gracefully', async () => {
      console.log('[DEBUG] Testing mesh disposal handling');

      const { rerender } = render(<MeshDisplay scene={mockScene} />);

      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });

      // Dispose mesh
      mockMesh.dispose();

      // Force re-render to trigger mesh list update
      rerender(<MeshDisplay scene={mockScene} />);

      await waitFor(() => {
        expect(screen.queryByText('testBox')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should maintain consistent state during errors', async () => {
      console.log('[DEBUG] Testing state consistency during errors');
      
      const { rerender } = render(<MeshDisplay scene={mockScene} />);
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      // Dispose scene and rerender
      mockScene.dispose();
      rerender(<MeshDisplay scene={mockScene} />);
      
      const meshDisplay = screen.getByRole('region', { name: 'Mesh Display' });
      expect(meshDisplay).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', async () => {
      console.log('[DEBUG] Testing render performance');
      
      const mockOnMeshSelect = vi.fn();
      
      const { rerender } = render(
        <MeshDisplay 
          scene={mockScene} 
          onMeshSelect={mockOnMeshSelect}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('testBox')).toBeInTheDocument();
      });
      
      // Rerender with same props
      rerender(
        <MeshDisplay 
          scene={mockScene} 
          onMeshSelect={mockOnMeshSelect}
        />
      );
      
      // Component should handle this gracefully
      const meshDisplay = screen.getByRole('region', { name: 'Mesh Display' });
      expect(meshDisplay).toBeInTheDocument();
    });

    it('should handle large numbers of meshes efficiently', async () => {
      console.log('[DEBUG] Testing performance with many meshes');
      
      // Create many meshes
      for (let i = 0; i < 50; i++) {
        BABYLON.MeshBuilder.CreateBox(`box${i}`, { size: 1 }, mockScene);
      }
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          showStatistics={true}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText(/51 meshes/i)).toBeInTheDocument();
      });
    });
  });

  describe('virtualization', () => {
    it('should enable virtualization for large mesh lists when specified', async () => {
      console.log('[DEBUG] Testing virtualization');
      
      // Create many meshes
      for (let i = 0; i < 100; i++) {
        BABYLON.MeshBuilder.CreateBox(`box${i}`, { size: 1 }, mockScene);
      }
      
      render(
        <MeshDisplay 
          scene={mockScene} 
          virtualizeList={true}
          maxVisibleItems={10}
        />
      );
      
      await waitFor(() => {
        // Should only render visible items
        const meshItems = screen.getAllByText(/box\d+/);
        expect(meshItems.length).toBeLessThanOrEqual(10);
      });
    });
  });
});
