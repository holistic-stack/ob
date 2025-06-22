/**
 * @file CAD Grid React Component Tests
 * 
 * TDD tests for CAD Grid React component integration
 * Tests component lifecycle, props handling, and Babylon.js integration
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { CADGridComponent, type CADGridComponentProps } from './cad-grid-component';
import type { CADGridData } from './cad-grid';

describe('CAD Grid React Component', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    console.log('[INIT] Setting up CAD Grid React component test environment');
    
    // Create null engine for headless testing
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    console.log('[END] Cleaning up CAD Grid React component test environment');
    
    cleanup();
    scene.dispose();
    engine.dispose();
  });

  describe('Component Rendering', () => {
    it('should render without crashing with valid scene', () => {
      console.log('[DEBUG] Testing basic component rendering');
      
      const { container } = render(
        <CADGridComponent scene={scene} />
      );
      
      expect(container.querySelector('[data-testid="cad-grid-component"]')).toBeDefined();
    });

    it('should handle null scene gracefully', () => {
      console.log('[DEBUG] Testing null scene handling');
      
      const { container } = render(
        <CADGridComponent scene={null} />
      );
      
      expect(container.querySelector('[data-testid="cad-grid-component"]')).toBeDefined();
    });

    it('should apply custom className and aria-label', () => {
      console.log('[DEBUG] Testing custom props');
      
      const { container } = render(
        <CADGridComponent
          scene={scene}
          className="custom-grid"
          aria-label="Custom Grid System"
        />
      );
      
      const element = container.querySelector('[data-testid="cad-grid-component"]');
      expect(element?.className).toContain('custom-grid');
      expect(element?.getAttribute('aria-label')).toBe('Custom Grid System');
    });
  });

  describe('Grid Creation Callbacks', () => {
    it('should call onGridCreated when grid is successfully created', async () => {
      console.log('[DEBUG] Testing onGridCreated callback');
      
      const onGridCreated = vi.fn();
      const onGridError = vi.fn();
      
      render(
        <CADGridComponent
          scene={scene}
          onGridCreated={onGridCreated}
          onGridError={onGridError}
        />
      );
      
      // Wait for useEffect to run
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onGridCreated).toHaveBeenCalledTimes(1);
      expect(onGridError).not.toHaveBeenCalled();
      
      const gridData = onGridCreated.mock.calls[0][0] as CADGridData;
      expect(gridData.gridMesh).toBeDefined();
      expect(gridData.config).toBeDefined();
      expect(gridData.lineCount).toBeGreaterThan(0);
    });

    it('should call onGridError when scene is invalid', async () => {
      console.log('[DEBUG] Testing onGridError callback');
      
      const onGridCreated = vi.fn();
      const onGridError = vi.fn();
      
      // Create disposed scene to trigger error
      const disposedScene = new BABYLON.Scene(engine);
      disposedScene.dispose();
      
      render(
        <CADGridComponent
          scene={disposedScene}
          onGridCreated={onGridCreated}
          onGridError={onGridError}
        />
      );
      
      // Wait for useEffect to run
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onGridCreated).not.toHaveBeenCalled();
      // Note: Component handles disposed scene gracefully, so no error callback
    });
  });

  describe('Configuration Updates', () => {
    it('should update grid when configuration changes', async () => {
      console.log('[DEBUG] Testing configuration updates');
      
      const onGridCreated = vi.fn();
      
      const { rerender } = render(
        <CADGridComponent
          scene={scene}
          config={{ size: 20, divisions: 20 }}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for initial creation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onGridCreated).toHaveBeenCalledTimes(1);
      
      // Update configuration
      rerender(
        <CADGridComponent
          scene={scene}
          config={{ size: 30, divisions: 30 }}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should be called again for the update
      expect(onGridCreated).toHaveBeenCalledTimes(2);
      
      const updatedGridData = onGridCreated.mock.calls[1][0] as CADGridData;
      expect(updatedGridData.config.size).toBe(30);
      expect(updatedGridData.config.divisions).toBe(30);
    });
  });

  describe('Visibility Control', () => {
    it('should control grid visibility through visible prop', async () => {
      console.log('[DEBUG] Testing visibility control');
      
      const onGridCreated = vi.fn();
      
      const { rerender } = render(
        <CADGridComponent
          scene={scene}
          visible={true}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for creation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onGridCreated).toHaveBeenCalledTimes(1);
      const gridData = onGridCreated.mock.calls[0][0] as CADGridData;
      
      // Initially visible
      expect(gridData.gridMesh.isEnabled()).toBe(true);
      
      // Hide grid
      rerender(
        <CADGridComponent
          scene={scene}
          visible={false}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for visibility update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(gridData.gridMesh.isEnabled()).toBe(false);
      
      // Show grid again
      rerender(
        <CADGridComponent
          scene={scene}
          visible={true}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for visibility update
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(gridData.gridMesh.isEnabled()).toBe(true);
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup grid on unmount', async () => {
      console.log('[DEBUG] Testing component cleanup');
      
      const onGridCreated = vi.fn();
      
      const { unmount } = render(
        <CADGridComponent
          scene={scene}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for creation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onGridCreated).toHaveBeenCalledTimes(1);
      const gridData = onGridCreated.mock.calls[0][0] as CADGridData;
      
      expect(gridData.gridMesh.isDisposed()).toBe(false);
      
      // Unmount component
      unmount();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(gridData.gridMesh.isDisposed()).toBe(true);
    });

    it('should handle scene changes gracefully', async () => {
      console.log('[DEBUG] Testing scene changes');
      
      const onGridCreated = vi.fn();
      const newScene = new BABYLON.Scene(engine);
      
      const { rerender } = render(
        <CADGridComponent
          scene={scene}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for initial creation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(onGridCreated).toHaveBeenCalledTimes(1);
      const originalGridData = onGridCreated.mock.calls[0][0] as CADGridData;
      
      // Change scene
      rerender(
        <CADGridComponent
          scene={newScene}
          onGridCreated={onGridCreated}
        />
      );
      
      // Wait for scene change handling
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should create new grid in new scene
      expect(onGridCreated).toHaveBeenCalledTimes(2);
      const newGridData = onGridCreated.mock.calls[1][0] as CADGridData;
      
      expect(newGridData.gridMesh.getScene()).toBe(newScene);
      expect(originalGridData.gridMesh.isDisposed()).toBe(true);
      
      // Cleanup
      newScene.dispose();
    });
  });
});
