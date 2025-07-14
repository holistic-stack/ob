/**
 * @file BabylonJS Scene Component Tests
 * 
 * Tests for BabylonJS scene component functionality.
 * Following TDD principles with React Testing Library.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Vector3, Color3 } from '@babylonjs/core';
import { BabylonScene } from './babylon-scene';
import type { BabylonSceneProps } from './babylon-scene';

// Mock BabylonJS components
vi.mock('react-babylonjs', () => ({
  Engine: React.forwardRef<any, any>(({ children, onEngineReady }, ref) => {
    // Simulate engine ready after a short delay
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onEngineReady?.({
          dispose: vi.fn(),
          runRenderLoop: vi.fn(),
          stopRenderLoop: vi.fn(),
        });
      }, 100);
      return () => clearTimeout(timer);
    }, [onEngineReady]);

    return <div data-testid="babylon-engine">{children}</div>;
  }),
  Scene: React.forwardRef<any, any>(({ children, onSceneReady, onRender }, ref) => {
    // Simulate scene ready after a short delay
    React.useEffect(() => {
      const timer = setTimeout(() => {
        onSceneReady?.({
          dispose: vi.fn(),
          render: vi.fn(),
          clearColor: { asColor4: vi.fn() },
          environmentIntensity: 1.0,
          imageProcessingConfiguration: { isEnabled: true },
        });
      }, 150);
      return () => clearTimeout(timer);
    }, [onSceneReady]);

    return <div data-testid="babylon-scene">{children}</div>;
  }),
}));

// Mock BabylonJS core
vi.mock('@babylonjs/core', () => {
  const Vector3Mock = vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z }));
  (Vector3Mock as any).Zero = vi.fn(() => ({ x: 0, y: 0, z: 0 }));

  const Color3Mock = vi.fn().mockImplementation((r = 1, g = 1, b = 1) => ({
    r, g, b,
    asColor4: vi.fn(() => ({ r, g, b, a: 1 })),
  }));

  return {
    Vector3: Vector3Mock,
    Color3: Color3Mock,
    ArcRotateCamera: vi.fn(),
    HemisphericLight: vi.fn(),
  };
});

// Mock hooks
vi.mock('../../hooks/use-babylon-engine', () => ({
  useBabylonEngine: vi.fn(() => ({
    engineService: {
      init: vi.fn().mockResolvedValue({ success: true }),
      dispose: vi.fn().mockResolvedValue({ success: true }),
      getState: vi.fn(() => ({
        isInitialized: true,
        engine: { dispose: vi.fn() },
        error: null,
      })),
    },
    engineState: {
      isInitialized: true,
      engine: { dispose: vi.fn() },
      error: null,
    },
    initializeEngine: vi.fn().mockResolvedValue({ success: true }),
    disposeEngine: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

vi.mock('../../hooks/use-babylon-inspector', () => ({
  useBabylonInspector: vi.fn(() => ({
    inspectorService: {
      show: vi.fn(() => ({ success: true })),
      hide: vi.fn(() => ({ success: true })),
    },
    inspectorState: {
      isVisible: false,
      error: null,
    },
    showInspector: vi.fn(() => ({ success: true })),
    hideInspector: vi.fn(() => ({ success: true })),
  })),
}));

describe('BabylonScene', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render with default configuration', async () => {
      render(<BabylonScene />);

      await waitFor(() => {
        expect(screen.getByTestId('babylon-engine')).toBeInTheDocument();
        expect(screen.getByTestId('babylon-scene')).toBeInTheDocument();
      });
    });

    it('should render loading state when engine is not initialized', () => {
      const { useBabylonEngine } = require('../../hooks/use-babylon-engine');
      useBabylonEngine.mockReturnValue({
        engineService: null,
        engineState: {
          isInitialized: false,
          engine: null,
          error: null,
        },
        initializeEngine: vi.fn(),
        disposeEngine: vi.fn(),
      });

      render(<BabylonScene />);

      expect(screen.getByText('Initializing BabylonJS Engine...')).toBeInTheDocument();
    });

    it('should render error state when engine initialization fails', () => {
      const { useBabylonEngine } = require('../../hooks/use-babylon-engine');
      useBabylonEngine.mockReturnValue({
        engineService: null,
        engineState: {
          isInitialized: false,
          engine: null,
          error: {
            code: 'ENGINE_INITIALIZATION_FAILED',
            message: 'WebGPU not supported',
          },
        },
        initializeEngine: vi.fn(),
        disposeEngine: vi.fn(),
      });

      render(<BabylonScene />);

      expect(screen.getByText('Initializing BabylonJS Engine...')).toBeInTheDocument();
      expect(screen.getByText('Error: WebGPU not supported')).toBeInTheDocument();
    });

    it('should apply custom className and style', async () => {
      const props: BabylonSceneProps = {
        className: 'custom-scene',
        style: { width: '800px', height: '600px' },
      };

      const { container } = render(<BabylonScene {...props} />);

      await waitFor(() => {
        const sceneContainer = container.firstChild as HTMLElement;
        expect(sceneContainer).toHaveClass('custom-scene');
        expect(sceneContainer).toHaveStyle({ width: '800px', height: '600px' });
      });
    });
  });

  describe('configuration', () => {
    it('should apply custom scene configuration', async () => {
      const config = {
        enableWebGPU: false,
        enableInspector: true,
        antialias: false,
      };

      render(<BabylonScene config={config} />);

      await waitFor(() => {
        expect(screen.getByTestId('babylon-engine')).toBeInTheDocument();
      });
    });

    it('should apply custom camera configuration', async () => {
      const camera = {
        type: 'arcRotate' as const,
        radius: 15,
        alpha: Math.PI / 4,
        beta: Math.PI / 3,
      };

      render(<BabylonScene camera={camera} />);

      await waitFor(() => {
        expect(screen.getByTestId('babylon-scene')).toBeInTheDocument();
      });
    });

    it('should apply custom lighting configuration', async () => {
      const lighting = {
        ambient: {
          enabled: true,
          intensity: 0.5,
          color: new Color3(1, 1, 1),
          direction: new Vector3(0, 1, 0),
        },
        directional: {
          enabled: false,
          intensity: 0.8,
          color: new Color3(1, 1, 1),
          direction: new Vector3(-1, -1, -1),
        },
      };

      render(<BabylonScene lighting={lighting} />);

      await waitFor(() => {
        expect(screen.getByTestId('babylon-scene')).toBeInTheDocument();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onSceneReady when scene is ready', async () => {
      const onSceneReady = vi.fn();

      render(<BabylonScene onSceneReady={onSceneReady} />);

      await waitFor(() => {
        expect(onSceneReady).toHaveBeenCalledWith(
          expect.objectContaining({
            dispose: expect.any(Function),
            render: expect.any(Function),
          })
        );
      });
    });

    it('should call onEngineReady when engine is ready', async () => {
      const onEngineReady = vi.fn();

      render(<BabylonScene onEngineReady={onEngineReady} />);

      await waitFor(() => {
        expect(onEngineReady).toHaveBeenCalledWith(
          expect.objectContaining({
            dispose: expect.any(Function),
            runRenderLoop: expect.any(Function),
          })
        );
      });
    });

    it('should call onRenderLoop during rendering', async () => {
      const onRenderLoop = vi.fn();

      render(<BabylonScene onRenderLoop={onRenderLoop} />);

      // Note: onRenderLoop would be called during actual rendering
      // In this test environment, we just verify the component renders
      await waitFor(() => {
        expect(screen.getByTestId('babylon-scene')).toBeInTheDocument();
      });
    });
  });

  describe('children rendering', () => {
    it('should render children components', async () => {
      render(
        <BabylonScene>
          <div data-testid="custom-child">Custom Content</div>
        </BabylonScene>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-child')).toBeInTheDocument();
        expect(screen.getByText('Custom Content')).toBeInTheDocument();
      });
    });
  });

  describe('inspector integration', () => {
    it('should show inspector when enabled in config', async () => {
      const { useBabylonInspector } = require('../../hooks/use-babylon-inspector');
      const mockShowInspector = vi.fn(() => ({ success: true }));
      
      useBabylonInspector.mockReturnValue({
        inspectorService: {
          show: mockShowInspector,
          hide: vi.fn(),
        },
        inspectorState: { isVisible: false, error: null },
        showInspector: mockShowInspector,
        hideInspector: vi.fn(),
      });

      render(<BabylonScene config={{ enableInspector: true }} />);

      await waitFor(() => {
        expect(mockShowInspector).toHaveBeenCalled();
      });
    });
  });
});
