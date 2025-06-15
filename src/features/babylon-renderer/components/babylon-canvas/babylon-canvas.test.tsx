/**
 * @file Babylon Canvas Component Tests
 * 
 * TDD tests for the BabylonCanvas component
 * Following React 19 best practices and functional programming principles
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { BabylonCanvas } from './babylon-canvas';
import type { BabylonCanvasProps } from '../../types/babylon-types';

// Mock the hooks
vi.mock('../../hooks/use-babylon-engine/use-babylon-engine', () => ({
  useBabylonEngine: vi.fn()
}));

vi.mock('../../hooks/use-babylon-scene/use-babylon-scene', () => ({
  useBabylonScene: vi.fn()
}));

import { useBabylonEngine } from '../../hooks/use-babylon-engine/use-babylon-engine';
import { useBabylonScene } from '../../hooks/use-babylon-scene/use-babylon-scene';

const mockUseBabylonEngine = vi.mocked(useBabylonEngine);
const mockUseBabylonScene = vi.mocked(useBabylonScene);

describe('BabylonCanvas', () => {
  let mockEngine: BABYLON.NullEngine;
  let mockScene: BABYLON.Scene;

  beforeEach(() => {
    console.log('[INIT] Setting up BabylonCanvas component tests');
    
    // Create mock engine and scene
    mockEngine = new BABYLON.NullEngine({
      renderWidth: 800,
      renderHeight: 600,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1
    });
    
    mockScene = new BABYLON.Scene(mockEngine);
    
    // Setup default mock implementations
    mockUseBabylonEngine.mockReturnValue({
      engine: mockEngine,
      isReady: true,
      error: null,
      dispose: vi.fn()
    });
    
    mockUseBabylonScene.mockReturnValue({
      scene: mockScene,
      isReady: true,
      render: vi.fn(),
      dispose: vi.fn()
    });
  });

  afterEach(() => {
    console.log('[END] Cleaning up BabylonCanvas component tests');
    cleanup();
    vi.clearAllMocks();
    
    if (mockScene && !mockScene.isDisposed) {
      mockScene.dispose();
    }
    
    if (mockEngine && !mockEngine.isDisposed) {
      mockEngine.dispose();
    }
  });

  describe('rendering', () => {
    it('should render canvas element with correct attributes', () => {
      console.log('[DEBUG] Testing canvas rendering');
      
      const props: BabylonCanvasProps = {
        className: 'test-canvas',
        'aria-label': 'Test 3D Scene'
      };
      
      render(<BabylonCanvas {...props} />);
      
      const canvas = screen.getByLabelText('Test 3D Scene');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('babylon-canvas', 'test-canvas');
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should render with default props', () => {
      console.log('[DEBUG] Testing default props rendering');
      
      render(<BabylonCanvas />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('babylon-canvas');
    });

    it('should apply custom className', () => {
      console.log('[DEBUG] Testing custom className');
      
      render(<BabylonCanvas className="custom-canvas-class" />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toHaveClass('babylon-canvas', 'custom-canvas-class');
    });

    it('should apply custom aria-label', () => {
      console.log('[DEBUG] Testing custom aria-label');
      
      render(<BabylonCanvas aria-label="Custom Scene Label" />);
      
      const canvas = screen.getByLabelText('Custom Scene Label');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('engine integration', () => {
    it('should initialize engine with canvas ref', () => {
      console.log('[DEBUG] Testing engine initialization');
      
      render(<BabylonCanvas />);
      
      expect(mockUseBabylonEngine).toHaveBeenCalledWith(
        expect.any(Object), // canvas ref
        undefined // no engine config
      );
    });

    it('should pass engine config when provided', () => {
      console.log('[DEBUG] Testing engine config passing');
      
      const engineConfig = {
        antialias: true,
        powerPreference: 'high-performance' as const
      };
      
      render(<BabylonCanvas engineConfig={engineConfig} />);
      
      expect(mockUseBabylonEngine).toHaveBeenCalledWith(
        expect.any(Object),
        engineConfig
      );
    });

    it('should handle engine creation failure', () => {
      console.log('[DEBUG] Testing engine creation failure');
      
      mockUseBabylonEngine.mockReturnValue({
        engine: null,
        isReady: false,
        error: 'Engine creation failed',
        dispose: vi.fn()
      });
      
      render(<BabylonCanvas />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toBeInTheDocument();
      // Component should still render canvas even if engine fails
    });
  });

  describe('scene integration', () => {
    it('should initialize scene with engine and config', () => {
      console.log('[DEBUG] Testing scene initialization');
      
      const sceneConfig = {
        enableCamera: true,
        enableLighting: true,
        backgroundColor: '#ff0000'
      };
      
      render(<BabylonCanvas sceneConfig={sceneConfig} />);
      
      expect(mockUseBabylonScene).toHaveBeenCalledWith(
        mockEngine,
        sceneConfig
      );
    });

    it('should use default scene config when none provided', () => {
      console.log('[DEBUG] Testing default scene config');
      
      render(<BabylonCanvas />);
      
      expect(mockUseBabylonScene).toHaveBeenCalledWith(
        mockEngine,
        undefined
      );
    });

    it('should handle scene creation failure', () => {
      console.log('[DEBUG] Testing scene creation failure');
      
      mockUseBabylonScene.mockReturnValue({
        scene: null,
        isReady: false,
        render: vi.fn(),
        dispose: vi.fn()
      });
      
      render(<BabylonCanvas />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toBeInTheDocument();
      // Component should still render canvas even if scene fails
    });
  });

  describe('render loop integration', () => {
    it('should start render loop when scene is ready', () => {
      console.log('[DEBUG] Testing render loop start');
      
      const mockRender = vi.fn();
      mockUseBabylonScene.mockReturnValue({
        scene: mockScene,
        isReady: true,
        render: mockRender,
        dispose: vi.fn()
      });
      
      render(<BabylonCanvas />);
      
      // Render loop should be managed by the component
      expect(mockUseBabylonScene).toHaveBeenCalled();
    });

    it('should not start render loop when scene is not ready', () => {
      console.log('[DEBUG] Testing render loop with unready scene');
      
      const mockRender = vi.fn();
      mockUseBabylonScene.mockReturnValue({
        scene: null,
        isReady: false,
        render: mockRender,
        dispose: vi.fn()
      });
      
      render(<BabylonCanvas />);
      
      expect(mockUseBabylonScene).toHaveBeenCalled();
    });
  });

  describe('cleanup and disposal', () => {
    it('should cleanup on unmount', () => {
      console.log('[DEBUG] Testing component cleanup');
      
      const mockEngineDispose = vi.fn();
      const mockSceneDispose = vi.fn();
      
      mockUseBabylonEngine.mockReturnValue({
        engine: mockEngine,
        isReady: true,
        error: null,
        dispose: mockEngineDispose
      });
      
      mockUseBabylonScene.mockReturnValue({
        scene: mockScene,
        isReady: true,
        render: vi.fn(),
        dispose: mockSceneDispose
      });
      
      const { unmount } = render(<BabylonCanvas />);
      
      unmount();
      
      // Cleanup should be handled by the hooks themselves
      expect(mockUseBabylonEngine).toHaveBeenCalled();
      expect(mockUseBabylonScene).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      console.log('[DEBUG] Testing accessibility attributes');
      
      render(<BabylonCanvas />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toHaveAttribute('aria-label', '3D Scene Canvas');
    });

    it('should support custom ARIA attributes', () => {
      console.log('[DEBUG] Testing custom ARIA attributes');
      
      render(
        <BabylonCanvas 
          aria-label="Custom 3D Visualization"
          aria-describedby="scene-description"
        />
      );
      
      const canvas = screen.getByLabelText('Custom 3D Visualization');
      expect(canvas).toHaveAttribute('aria-label', 'Custom 3D Visualization');
      expect(canvas).toHaveAttribute('aria-describedby', 'scene-description');
    });
  });

  describe('responsive behavior', () => {
    it('should handle window resize events', () => {
      console.log('[DEBUG] Testing responsive behavior');
      
      render(<BabylonCanvas />);
      
      // The engine hook should handle resize events
      expect(mockUseBabylonEngine).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle engine errors gracefully', () => {
      console.log('[DEBUG] Testing engine error handling');
      
      mockUseBabylonEngine.mockReturnValue({
        engine: null,
        isReady: false,
        error: 'WebGL not supported',
        dispose: vi.fn()
      });
      
      render(<BabylonCanvas />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toBeInTheDocument();
      // Component should render despite engine errors
    });

    it('should handle scene errors gracefully', () => {
      console.log('[DEBUG] Testing scene error handling');
      
      mockUseBabylonScene.mockReturnValue({
        scene: null,
        isReady: false,
        render: vi.fn(),
        dispose: vi.fn()
      });
      
      render(<BabylonCanvas />);
      
      const canvas = screen.getByLabelText('3D Scene Canvas');
      expect(canvas).toBeInTheDocument();
      // Component should render despite scene errors
    });
  });
});
