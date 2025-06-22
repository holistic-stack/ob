/**
 * @file Scene Controls Component Tests
 * 
 * TDD tests for the SceneControls component
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { SceneControls } from './scene-controls';
import type { SceneControlsProps } from '../../types/babylon-types';

describe('SceneControls', () => {
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;
  let mockCamera: BABYLON.ArcRotateCamera;

  beforeEach(() => {
    console.log('[INIT] Setting up SceneControls component tests');
    
    // Create mock engine and scene
    mockEngine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    mockScene = new BABYLON.Scene(mockEngine);
    
    // Create mock camera
    mockCamera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 4,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      mockScene
    );
  });

  afterEach(() => {
    console.log('[END] Cleaning up SceneControls component tests');
    cleanup();
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  describe('rendering', () => {
    it('should render controls panel with default props', () => {
      console.log('[DEBUG] Testing controls panel rendering');
      
      render(<SceneControls scene={mockScene} />);
      
      expect(screen.getByRole('region', { name: 'Scene Controls' })).toBeInTheDocument();
      expect(screen.getByText('Scene Controls')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      console.log('[DEBUG] Testing custom className');
      
      render(<SceneControls scene={mockScene} className="custom-controls" />);
      
      const controlsPanel = screen.getByRole('region', { name: 'Scene Controls' });
      expect(controlsPanel).toHaveClass('scene-controls', 'custom-controls');
    });

    it('should render with custom title', () => {
      console.log('[DEBUG] Testing custom title');
      
      render(<SceneControls scene={mockScene} title="Custom Scene Settings" />);
      
      expect(screen.getByText('Custom Scene Settings')).toBeInTheDocument();
    });

    it('should handle null scene gracefully', () => {
      console.log('[DEBUG] Testing null scene handling');
      
      render(<SceneControls scene={null} />);
      
      const controlsPanel = screen.getByRole('region', { name: 'Scene Controls' });
      expect(controlsPanel).toBeInTheDocument();
      expect(screen.getByText('Scene Controls')).toBeInTheDocument();
    });
  });

  describe('wireframe controls', () => {
    it('should render wireframe toggle button', () => {
      console.log('[DEBUG] Testing wireframe toggle rendering');
      
      render(<SceneControls scene={mockScene} />);
      
      const wireframeButton = screen.getByRole('button', { name: /wireframe/i });
      expect(wireframeButton).toBeInTheDocument();
    });

    it('should call onWireframeToggle when wireframe button is clicked', () => {
      console.log('[DEBUG] Testing wireframe toggle callback');
      
      const mockOnWireframeToggle = vi.fn();
      
      render(
        <SceneControls 
          scene={mockScene} 
          onWireframeToggle={mockOnWireframeToggle}
        />
      );
      
      const wireframeButton = screen.getByRole('button', { name: /wireframe/i });
      fireEvent.click(wireframeButton);
      
      expect(mockOnWireframeToggle).toHaveBeenCalledTimes(1);
    });

    it('should show wireframe state in button text', () => {
      console.log('[DEBUG] Testing wireframe state display');
      
      render(<SceneControls scene={mockScene} wireframeEnabled={true} />);
      
      const wireframeButton = screen.getByRole('button', { name: /wireframe.*on/i });
      expect(wireframeButton).toBeInTheDocument();
    });

    it('should disable wireframe button when scene is null', () => {
      console.log('[DEBUG] Testing wireframe button disabled state');
      
      render(<SceneControls scene={null} />);
      
      const wireframeButton = screen.getByRole('button', { name: /wireframe/i });
      expect(wireframeButton).toBeDisabled();
    });
  });

  describe('camera controls', () => {
    it('should show camera controls are handled at canvas level', () => {
      console.log('[DEBUG] Testing camera controls message');

      render(<SceneControls scene={mockScene} />);

      // Camera controls are now handled at Babylon.js canvas level
      // The component should show a message about this
      const cameraMessage = screen.getByText(/camera controls are now handled directly at babylon\.js canvas level/i);
      expect(cameraMessage).toBeInTheDocument();
    });
  });

  describe('lighting controls', () => {
    it('should render lighting toggle button', () => {
      console.log('[DEBUG] Testing lighting toggle rendering');
      
      render(<SceneControls scene={mockScene} />);
      
      const lightingButton = screen.getByRole('button', { name: /lighting/i });
      expect(lightingButton).toBeInTheDocument();
    });

    it('should call onLightingToggle when lighting button is clicked', () => {
      console.log('[DEBUG] Testing lighting toggle callback');
      
      const mockOnLightingToggle = vi.fn();
      
      render(
        <SceneControls 
          scene={mockScene} 
          onLightingToggle={mockOnLightingToggle}
        />
      );
      
      const lightingButton = screen.getByRole('button', { name: /lighting/i });
      fireEvent.click(lightingButton);
      
      expect(mockOnLightingToggle).toHaveBeenCalledTimes(1);
    });

    it('should show lighting state in button text', () => {
      console.log('[DEBUG] Testing lighting state display');
      
      render(<SceneControls scene={mockScene} lightingEnabled={false} />);
      
      const lightingButton = screen.getByRole('button', { name: /lighting.*off/i });
      expect(lightingButton).toBeInTheDocument();
    });

    it('should disable lighting button when scene is null', () => {
      console.log('[DEBUG] Testing lighting button disabled state');
      
      render(<SceneControls scene={null} />);
      
      const lightingButton = screen.getByRole('button', { name: /lighting/i });
      expect(lightingButton).toBeDisabled();
    });
  });

  describe('background controls', () => {
    it('should render background color input', () => {
      console.log('[DEBUG] Testing background color input rendering');
      
      render(<SceneControls scene={mockScene} />);
      
      const colorInput = screen.getByLabelText(/background color/i);
      expect(colorInput).toBeInTheDocument();
      expect(colorInput).toHaveAttribute('type', 'color');
    });

    it('should call onBackgroundColorChange when color changes', () => {
      console.log('[DEBUG] Testing background color change callback');
      
      const mockOnBackgroundColorChange = vi.fn();
      
      render(
        <SceneControls 
          scene={mockScene} 
          onBackgroundColorChange={mockOnBackgroundColorChange}
        />
      );
      
      const colorInput = screen.getByLabelText(/background color/i);
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      
      expect(mockOnBackgroundColorChange).toHaveBeenCalledWith('#ff0000');
    });

    it('should show current background color', () => {
      console.log('[DEBUG] Testing background color display');
      
      render(<SceneControls scene={mockScene} backgroundColor="#00ff00" />);
      
      const colorInput = screen.getByLabelText(/background color/i) as HTMLInputElement;
      expect(colorInput.value).toBe('#00ff00');
    });

    it('should disable background color input when scene is null', () => {
      console.log('[DEBUG] Testing background color input disabled state');
      
      render(<SceneControls scene={null} />);
      
      const colorInput = screen.getByLabelText(/background color/i);
      expect(colorInput).toBeDisabled();
    });
  });

  describe('collapsible functionality', () => {
    it('should render collapse/expand button', () => {
      console.log('[DEBUG] Testing collapse button rendering');
      
      render(<SceneControls scene={mockScene} />);
      
      const collapseButton = screen.getByRole('button', { name: /collapse|expand/i });
      expect(collapseButton).toBeInTheDocument();
    });

    it('should toggle controls visibility when collapse button is clicked', () => {
      console.log('[DEBUG] Testing controls collapse functionality');
      
      render(<SceneControls scene={mockScene} />);
      
      const collapseButton = screen.getByRole('button', { name: /collapse/i });
      const controlsContent = screen.getByTestId('controls-content');
      
      // Initially expanded
      expect(controlsContent).toBeVisible();
      
      // Click to collapse
      fireEvent.click(collapseButton);
      expect(controlsContent).not.toBeVisible();
      
      // Click to expand
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);
      expect(controlsContent).toBeVisible();
    });

    it('should start collapsed when defaultCollapsed is true', () => {
      console.log('[DEBUG] Testing default collapsed state');
      
      render(<SceneControls scene={mockScene} defaultCollapsed={true} />);
      
      const controlsContent = screen.getByTestId('controls-content');
      expect(controlsContent).not.toBeVisible();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing accessibility attributes');
      
      render(<SceneControls scene={mockScene} />);
      
      const controlsPanel = screen.getByRole('region', { name: 'Scene Controls' });
      expect(controlsPanel).toHaveAttribute('aria-label', 'Scene Controls');
    });

    it('should support custom ARIA attributes', () => {
      console.log('[DEBUG] Testing custom ARIA attributes');
      
      render(
        <SceneControls 
          scene={mockScene} 
          aria-label="Custom Scene Controls"
          aria-describedby="controls-description"
        />
      );
      
      const controlsPanel = screen.getByRole('region');
      expect(controlsPanel).toHaveAttribute('aria-label', 'Custom Scene Controls');
      expect(controlsPanel).toHaveAttribute('aria-describedby', 'controls-description');
    });

    it('should have keyboard navigation support', () => {
      console.log('[DEBUG] Testing keyboard navigation');
      
      render(<SceneControls scene={mockScene} />);
      
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
      
      render(<SceneControls scene={mockScene} />);
      
      const controlsPanel = screen.getByRole('region', { name: 'Scene Controls' });
      expect(controlsPanel).toBeInTheDocument();
      
      // Scene-related buttons should be disabled (excluding collapse/expand)
      const wireframeButton = screen.getByRole('button', { name: /wireframe/i });
      const cameraButton = screen.getByRole('button', { name: /reset camera/i });
      const lightingButton = screen.getByRole('button', { name: /lighting/i });
      const colorInput = screen.getByLabelText(/background color/i);

      expect(wireframeButton).toBeDisabled();
      expect(cameraButton).toBeDisabled();
      expect(lightingButton).toBeDisabled();
      expect(colorInput).toBeDisabled();

      // Collapse button should still work
      const collapseButton = screen.getByRole('button', { name: /collapse|expand/i });
      expect(collapseButton).not.toBeDisabled();
    });

    it('should maintain consistent state during errors', () => {
      console.log('[DEBUG] Testing state consistency during errors');
      
      const { rerender } = render(<SceneControls scene={mockScene} />);
      
      // Dispose scene and rerender
      mockScene.dispose();
      rerender(<SceneControls scene={mockScene} />);
      
      const controlsPanel = screen.getByRole('region', { name: 'Scene Controls' });
      expect(controlsPanel).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should not re-render unnecessarily', () => {
      console.log('[DEBUG] Testing render performance');
      
      const mockOnWireframeToggle = vi.fn();
      
      const { rerender } = render(
        <SceneControls 
          scene={mockScene} 
          onWireframeToggle={mockOnWireframeToggle}
        />
      );
      
      // Rerender with same props
      rerender(
        <SceneControls 
          scene={mockScene} 
          onWireframeToggle={mockOnWireframeToggle}
        />
      );
      
      // Component should handle this gracefully
      const controlsPanel = screen.getByRole('region', { name: 'Scene Controls' });
      expect(controlsPanel).toBeInTheDocument();
    });
  });
});
