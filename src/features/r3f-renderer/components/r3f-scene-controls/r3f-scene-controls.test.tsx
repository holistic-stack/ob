/**
 * @file R3F Scene Controls Tests
 * 
 * TDD tests for the R3F scene controls component following React 19 best practices
 * and functional programming principles. Tests material controls, lighting setup,
 * camera controls, and CSG visualization modes.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { R3FSceneControls } from './r3f-scene-controls';
import type { R3FSceneControlsProps } from './r3f-scene-controls';

// Mock Three.js
vi.mock('three', () => ({
  Scene: vi.fn().mockImplementation(() => ({
    type: 'Scene',
    children: [],
    traverse: vi.fn()
  })),
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    type: 'PerspectiveCamera',
    position: { x: 0, y: 0, z: 0 },
    fov: 75
  })),
  Mesh: vi.fn().mockImplementation(() => ({
    type: 'Mesh',
    geometry: {
      attributes: {
        position: { count: 24 }
      }
    },
    material: { dispose: vi.fn() },
    position: { x: 0, y: 0, z: 0 }
  }))
}));

describe('R3FSceneControls', () => {
  const mockScene = {
    type: 'Scene',
    children: [],
    traverse: vi.fn()
  } as any;

  const mockCamera = {
    type: 'PerspectiveCamera',
    position: { x: 15, y: 15, z: 15 },
    fov: 60
  } as any;

  const mockMeshes = [
    {
      type: 'Mesh',
      geometry: {
        attributes: {
          position: { count: 24 }
        }
      },
      material: { dispose: vi.fn() },
      position: { x: 0, y: 0, z: 0 }
    }
  ] as any[];

  const defaultProps: R3FSceneControlsProps = {
    scene: mockScene,
    camera: mockCamera,
    meshes: mockMeshes
  };

  beforeEach(() => {
    console.log('[DEBUG] Setting up R3F scene controls test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3F scene controls test');
    vi.clearAllMocks();
  });

  describe('component rendering', () => {
    it('should render with default props', () => {
      console.log('[DEBUG] Testing default rendering');
      
      render(<R3FSceneControls {...defaultProps} />);
      
      expect(screen.getByText('Scene Controls')).toBeInTheDocument();
      expect(screen.getByLabelText('Collapse controls')).toBeInTheDocument();
      expect(screen.getByText('Meshes: 1')).toBeInTheDocument();
      expect(screen.getByText('Vertices: 24')).toBeInTheDocument();
    });

    it('should render in disabled state', () => {
      console.log('[DEBUG] Testing disabled state');
      
      render(<R3FSceneControls {...defaultProps} disabled={true} />);
      
      const controls = screen.getByText('Scene Controls').closest('.r3f-scene-controls');
      expect(controls).toHaveClass('disabled');
    });

    it('should calculate scene statistics correctly', () => {
      console.log('[DEBUG] Testing scene statistics calculation');
      
      const multipleMeshes = [
        ...mockMeshes,
        {
          type: 'Mesh',
          geometry: {
            attributes: {
              position: { count: 36 }
            }
          },
          material: { dispose: vi.fn() },
          position: { x: 1, y: 1, z: 1 }
        }
      ] as any[];
      
      render(<R3FSceneControls {...defaultProps} meshes={multipleMeshes} />);
      
      expect(screen.getByText('Meshes: 2')).toBeInTheDocument();
      expect(screen.getByText('Vertices: 60')).toBeInTheDocument();
      expect(screen.getByText('Triangles: 20')).toBeInTheDocument();
    });
  });

  describe('panel expansion and collapse', () => {
    it('should expand and collapse controls panel', async () => {
      console.log('[DEBUG] Testing panel expansion/collapse');
      
      const user = userEvent.setup();
      render(<R3FSceneControls {...defaultProps} />);
      
      // Initially expanded
      expect(screen.getByText('Material')).toBeInTheDocument();
      
      // Click to collapse
      await user.click(screen.getByLabelText('Collapse controls'));
      
      await waitFor(() => {
        expect(screen.queryByText('Material')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Expand controls')).toBeInTheDocument();
      });
      
      // Click to expand again
      await user.click(screen.getByLabelText('Expand controls'));
      
      await waitFor(() => {
        expect(screen.getByText('Material')).toBeInTheDocument();
      });
    });
  });

  describe('tab navigation', () => {
    it('should switch between different control tabs', async () => {
      console.log('[DEBUG] Testing tab navigation');
      
      const user = userEvent.setup();
      render(<R3FSceneControls {...defaultProps} />);
      
      // Initially on Material tab
      expect(screen.getByText('Material Properties')).toBeInTheDocument();
      
      // Switch to Lighting tab
      await user.click(screen.getByText('Lighting'));
      
      await waitFor(() => {
        expect(screen.getByText('Lighting Setup')).toBeInTheDocument();
        expect(screen.queryByText('Material Properties')).not.toBeInTheDocument();
      });
      
      // Switch to Camera tab
      await user.click(screen.getByText('Camera'));
      
      await waitFor(() => {
        expect(screen.getByText('Camera Controls')).toBeInTheDocument();
        expect(screen.getByText('View Presets')).toBeInTheDocument();
      });
      
      // Switch to Environment tab
      await user.click(screen.getByText('Environment'));
      
      await waitFor(() => {
        expect(screen.getByText('Environment Settings')).toBeInTheDocument();
      });
      
      // Switch to CSG tab
      await user.click(screen.getByText('CSG'));
      
      await waitFor(() => {
        expect(screen.getByText('CSG Visualization')).toBeInTheDocument();
        expect(screen.getByText('Visualization Mode')).toBeInTheDocument();
      });
    });
  });

  describe('material controls', () => {
    it('should handle material property changes', async () => {
      console.log('[DEBUG] Testing material controls');
      
      const onMaterialChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onMaterialChange={onMaterialChange} />);
      
      // Test wireframe toggle
      const wireframeCheckbox = screen.getByLabelText('Wireframe Mode');
      await user.click(wireframeCheckbox);
      
      expect(onMaterialChange).toHaveBeenCalledWith(
        expect.objectContaining({ wireframe: true })
      );
      
      // Test transparency toggle
      const transparentCheckbox = screen.getByLabelText('Transparent');
      await user.click(transparentCheckbox);
      
      expect(onMaterialChange).toHaveBeenCalledWith(
        expect.objectContaining({ transparent: true })
      );
      
      // Test opacity slider
      const opacitySlider = screen.getByLabelText(/Opacity:/);
      fireEvent.change(opacitySlider, { target: { value: '0.5' } });
      
      expect(onMaterialChange).toHaveBeenCalledWith(
        expect.objectContaining({ opacity: 0.5 })
      );
    });

    it('should handle color changes', async () => {
      console.log('[DEBUG] Testing color controls');
      
      const onMaterialChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onMaterialChange={onMaterialChange} />);
      
      const colorInput = screen.getByLabelText('Color');
      await user.click(colorInput);
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      
      expect(onMaterialChange).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#ff0000' })
      );
    });

    it('should handle metalness and roughness changes', async () => {
      console.log('[DEBUG] Testing metalness and roughness controls');
      
      const onMaterialChange = vi.fn();
      
      render(<R3FSceneControls {...defaultProps} onMaterialChange={onMaterialChange} />);
      
      // Test metalness slider
      const metalnessSlider = screen.getByLabelText(/Metalness:/);
      fireEvent.change(metalnessSlider, { target: { value: '0.8' } });
      
      expect(onMaterialChange).toHaveBeenCalledWith(
        expect.objectContaining({ metalness: 0.8 })
      );
      
      // Test roughness slider
      const roughnessSlider = screen.getByLabelText(/Roughness:/);
      fireEvent.change(roughnessSlider, { target: { value: '0.2' } });
      
      expect(onMaterialChange).toHaveBeenCalledWith(
        expect.objectContaining({ roughness: 0.2 })
      );
    });
  });

  describe('lighting controls', () => {
    it('should handle lighting configuration changes', async () => {
      console.log('[DEBUG] Testing lighting controls');
      
      const onLightingChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onLightingChange={onLightingChange} />);
      
      // Switch to lighting tab
      await user.click(screen.getByText('Lighting'));
      
      await waitFor(() => {
        expect(screen.getByText('Lighting Setup')).toBeInTheDocument();
      });
      
      // Test ambient light toggle
      const ambientCheckbox = screen.getByLabelText('Ambient Light');
      await user.click(ambientCheckbox);
      
      expect(onLightingChange).toHaveBeenCalledWith(
        expect.objectContaining({ enableAmbient: false })
      );
      
      // Test directional light toggle
      const directionalCheckbox = screen.getByLabelText('Directional Light');
      await user.click(directionalCheckbox);
      
      expect(onLightingChange).toHaveBeenCalledWith(
        expect.objectContaining({ enableDirectional: false })
      );
      
      // Test shadows toggle
      const shadowsCheckbox = screen.getByLabelText('Enable Shadows');
      await user.click(shadowsCheckbox);
      
      expect(onLightingChange).toHaveBeenCalledWith(
        expect.objectContaining({ enableShadows: false })
      );
    });

    it('should handle light intensity changes', async () => {
      console.log('[DEBUG] Testing light intensity controls');
      
      const onLightingChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onLightingChange={onLightingChange} />);
      
      // Switch to lighting tab
      await user.click(screen.getByText('Lighting'));
      
      await waitFor(() => {
        const ambientIntensitySlider = screen.getByLabelText(/Ambient Intensity:/);
        fireEvent.change(ambientIntensitySlider, { target: { value: '0.8' } });
        
        expect(onLightingChange).toHaveBeenCalledWith(
          expect.objectContaining({ ambientIntensity: 0.8 })
        );
      });
    });
  });

  describe('camera controls', () => {
    it('should handle camera preset selection', async () => {
      console.log('[DEBUG] Testing camera presets');
      
      const onCameraChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onCameraChange={onCameraChange} />);
      
      // Switch to camera tab
      await user.click(screen.getByText('Camera'));
      
      await waitFor(() => {
        expect(screen.getByText('View Presets')).toBeInTheDocument();
      });
      
      // Test front view preset
      await user.click(screen.getByText('Front View'));
      
      expect(onCameraChange).toHaveBeenCalledWith(
        expect.objectContaining({
          position: [0, 0, 20],
          target: [0, 0, 0]
        })
      );
      
      // Test isometric view preset
      await user.click(screen.getByText('Isometric'));
      
      expect(onCameraChange).toHaveBeenCalledWith(
        expect.objectContaining({
          position: [15, 15, 15],
          target: [0, 0, 0]
        })
      );
    });

    it('should handle camera property changes', async () => {
      console.log('[DEBUG] Testing camera property controls');
      
      const onCameraChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onCameraChange={onCameraChange} />);
      
      // Switch to camera tab
      await user.click(screen.getByText('Camera'));
      
      await waitFor(() => {
        // Test FOV slider
        const fovSlider = screen.getByLabelText(/FOV:/);
        fireEvent.change(fovSlider, { target: { value: '45' } });
        
        expect(onCameraChange).toHaveBeenCalledWith(
          expect.objectContaining({ fov: 45 })
        );
      });
      
      // Test auto rotate toggle
      const autoRotateCheckbox = screen.getByLabelText('Auto Rotate');
      await user.click(autoRotateCheckbox);
      
      expect(onCameraChange).toHaveBeenCalledWith(
        expect.objectContaining({ autoRotate: true })
      );
    });
  });

  describe('environment controls', () => {
    it('should handle environment configuration changes', async () => {
      console.log('[DEBUG] Testing environment controls');
      
      const onEnvironmentChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onEnvironmentChange={onEnvironmentChange} />);
      
      // Switch to environment tab
      await user.click(screen.getByText('Environment'));
      
      await waitFor(() => {
        expect(screen.getByText('Environment Settings')).toBeInTheDocument();
      });
      
      // Test background color change
      const backgroundColorInput = screen.getByLabelText('Background Color');
      fireEvent.change(backgroundColorInput, { target: { value: '#ff0000' } });
      
      expect(onEnvironmentChange).toHaveBeenCalledWith(
        expect.objectContaining({ background: '#ff0000' })
      );
      
      // Test grid toggle
      const gridCheckbox = screen.getByLabelText('Show Grid');
      await user.click(gridCheckbox);
      
      expect(onEnvironmentChange).toHaveBeenCalledWith(
        expect.objectContaining({ enableGrid: false })
      );
      
      // Test axes toggle
      const axesCheckbox = screen.getByLabelText('Show Axes');
      await user.click(axesCheckbox);
      
      expect(onEnvironmentChange).toHaveBeenCalledWith(
        expect.objectContaining({ enableAxes: false })
      );
    });
  });

  describe('CSG visualization controls', () => {
    it('should handle CSG mode changes', async () => {
      console.log('[DEBUG] Testing CSG mode controls');
      
      const onCSGModeChange = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onCSGModeChange={onCSGModeChange} />);
      
      // Switch to CSG tab
      await user.click(screen.getByText('CSG'));
      
      await waitFor(() => {
        expect(screen.getByText('CSG Visualization')).toBeInTheDocument();
      });
      
      // Test wireframe mode
      await user.click(screen.getByText('Wireframe'));
      
      expect(onCSGModeChange).toHaveBeenCalledWith('wireframe');
      
      // Test transparent mode
      await user.click(screen.getByText('Transparent'));
      
      expect(onCSGModeChange).toHaveBeenCalledWith('transparent');
      
      // Test exploded mode
      await user.click(screen.getByText('Exploded'));
      
      expect(onCSGModeChange).toHaveBeenCalledWith('exploded');
    });

    it('should handle export functionality', async () => {
      console.log('[DEBUG] Testing export functionality');
      
      const onExportScene = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onExportScene={onExportScene} />);
      
      // Switch to CSG tab
      await user.click(screen.getByText('CSG'));
      
      await waitFor(() => {
        expect(screen.getByText('Export Scene')).toBeInTheDocument();
      });
      
      // Test GLTF export
      await user.click(screen.getByText('Export GLTF'));
      
      expect(onExportScene).toHaveBeenCalledWith('gltf');
      
      // Test OBJ export
      await user.click(screen.getByText('Export OBJ'));
      
      expect(onExportScene).toHaveBeenCalledWith('obj');
      
      // Test STL export
      await user.click(screen.getByText('Export STL'));
      
      expect(onExportScene).toHaveBeenCalledWith('stl');
    });

    it('should disable export buttons when no meshes are present', () => {
      console.log('[DEBUG] Testing export button disabled state');
      
      render(<R3FSceneControls {...defaultProps} meshes={[]} />);
      
      // Switch to CSG tab
      fireEvent.click(screen.getByText('CSG'));
      
      // Export buttons should be disabled
      expect(screen.getByText('Export GLTF')).toBeDisabled();
      expect(screen.getByText('Export OBJ')).toBeDisabled();
      expect(screen.getByText('Export STL')).toBeDisabled();
    });
  });

  describe('progress display', () => {
    it('should display conversion progress when provided', () => {
      console.log('[DEBUG] Testing progress display');
      
      const progress = {
        stage: 'ast-processing' as const,
        progress: 75,
        message: 'Processing AST...',
        timeElapsed: 1500
      };
      
      render(<R3FSceneControls {...defaultProps} conversionProgress={progress} />);
      
      expect(screen.getByText('Processing AST...')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should handle reset scene action', async () => {
      console.log('[DEBUG] Testing reset scene action');
      
      const onResetScene = vi.fn();
      const user = userEvent.setup();
      
      render(<R3FSceneControls {...defaultProps} onResetScene={onResetScene} />);
      
      await user.click(screen.getByText('Reset Scene'));
      
      expect(onResetScene).toHaveBeenCalled();
    });

    it('should disable actions when processing', () => {
      console.log('[DEBUG] Testing disabled state during processing');
      
      render(<R3FSceneControls {...defaultProps} isProcessing={true} />);
      
      expect(screen.getByText('Reset Scene')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should provide proper ARIA labels and keyboard navigation', async () => {
      console.log('[DEBUG] Testing accessibility features');
      
      const user = userEvent.setup();
      render(<R3FSceneControls {...defaultProps} />);
      
      // Test expand button accessibility
      const expandButton = screen.getByLabelText('Collapse controls');
      expandButton.focus();
      expect(document.activeElement).toBe(expandButton);
      
      // Test keyboard activation
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByLabelText('Expand controls')).toBeInTheDocument();
      });
    });

    it('should handle disabled state properly', () => {
      console.log('[DEBUG] Testing disabled accessibility');
      
      render(<R3FSceneControls {...defaultProps} disabled={true} />);
      
      // All interactive elements should be disabled
      const expandButton = screen.getByLabelText('Collapse controls');
      expect(expandButton).toBeDisabled();
    });
  });
});
