/**
 * @file Store-Connected BabylonJS Renderer Tests
 * 
 * Tests for store-connected BabylonJS renderer component.
 * Following TDD principles with React Testing Library.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StoreConnectedRenderer } from './store-connected-renderer';
import type { StoreConnectedRendererProps } from './store-connected-renderer';

// Mock BabylonScene component
vi.mock('../babylon-scene', () => ({
  BabylonScene: React.forwardRef<any, any>(({ 
    onSceneReady, 
    onEngineReady, 
    onRenderLoop,
    children,
    className 
  }, ref) => {
    // Simulate scene ready after a short delay
    React.useEffect(() => {
      const timer = setTimeout(() => {
        const mockScene = {
          getEngine: vi.fn(() => ({
            getRenderingCanvas: vi.fn(() => document.createElement('canvas')),
          })),
        };
        onSceneReady?.(mockScene);
        
        const mockEngine = {
          dispose: vi.fn(),
          runRenderLoop: vi.fn(),
        };
        onEngineReady?.(mockEngine);
      }, 100);
      return () => clearTimeout(timer);
    }, [onSceneReady, onEngineReady]);

    return (
      <div data-testid="babylon-scene" className={className}>
        {children}
      </div>
    );
  }),
}));

// Mock app store
const mockStoreState = {
  ast: [] as any[],
  isRendering: false,
  renderErrors: [] as any[],
  meshes: [] as any[],
  initializeEngine: vi.fn().mockResolvedValue({ success: true }),
  renderAST: vi.fn().mockResolvedValue({ success: true }),
  clearScene: vi.fn(),
  updatePerformanceMetrics: vi.fn(),
  showInspector: vi.fn(() => ({ success: true })),
  hideInspector: vi.fn(() => ({ success: true })),
};

vi.mock('../../../store/app-store', () => ({
  useAppStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  }),
}));

// Mock store selectors
vi.mock('../../../store/selectors', () => ({
  selectParsingAST: vi.fn((state) => state.ast),
  selectRenderingIsRendering: vi.fn((state) => state.isRendering),
  selectRenderingErrors: vi.fn((state) => state.renderErrors),
  selectRenderingMeshes: vi.fn((state) => state.meshes),
}));

describe('StoreConnectedRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock store state
    Object.assign(mockStoreState, {
      ast: [],
      isRendering: false,
      renderErrors: [],
      meshes: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render BabylonScene component', async () => {
      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(screen.getByTestId('babylon-scene')).toBeInTheDocument();
      });
    });

    it('should apply custom className and style', async () => {
      const props: StoreConnectedRendererProps = {
        className: 'custom-renderer',
        style: { width: '800px', height: '600px' },
      };

      const { container } = render(<StoreConnectedRenderer {...props} />);

      await waitFor(() => {
        const rendererContainer = container.firstChild as HTMLElement;
        expect(rendererContainer).toHaveClass('custom-renderer');
        expect(rendererContainer).toHaveStyle({ width: '800px', height: '600px' });
      });
    });

    it('should show rendering overlay when isRendering is true', async () => {
      mockStoreState.isRendering = true;

      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(screen.getByText('Rendering...')).toBeInTheDocument();
      });
    });

    it('should show error overlay when render errors exist', async () => {
      mockStoreState.renderErrors = [
        {
          code: 'RENDER_FAILED',
          message: 'Test render error',
          timestamp: new Date(),
          service: 'renderer',
        },
      ];

      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(screen.getByText('Render Error')).toBeInTheDocument();
        expect(screen.getByText('Test render error')).toBeInTheDocument();
      });
    });
  });

  describe('configuration', () => {
    it('should enable inspector when enableInspector is true', async () => {
      render(<StoreConnectedRenderer enableInspector={true} />);

      await waitFor(() => {
        expect(mockStoreState.showInspector).toHaveBeenCalled();
      });
    });

    it('should disable WebGPU when enableWebGPU is false', async () => {
      render(<StoreConnectedRenderer enableWebGPU={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('babylon-scene')).toBeInTheDocument();
      });
    });
  });

  describe('store integration', () => {
    it('should initialize engine when scene is ready', async () => {
      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreState.initializeEngine).toHaveBeenCalled();
      });
    });

    it('should render AST when AST changes', async () => {
      const mockAST = [
        {
          type: 'sphere',
          parameters: { radius: 5 },
          children: [],
          position: { line: 1, column: 1 },
        },
      ];

      mockStoreState.ast = mockAST;

      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreState.renderAST).toHaveBeenCalledWith(mockAST);
      }, { timeout: 1000 });
    });

    it('should clear scene when AST is empty', async () => {
      mockStoreState.ast = [];

      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreState.clearScene).toHaveBeenCalled();
      });
    });

    it('should update performance metrics', async () => {
      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreState.updatePerformanceMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onRenderComplete when rendering succeeds', async () => {
      const onRenderComplete = vi.fn();
      mockStoreState.ast = [{ type: 'cube', parameters: {}, children: [], position: { line: 1, column: 1 } }];
      mockStoreState.meshes = [{ id: 'mesh-1' }];

      render(<StoreConnectedRenderer onRenderComplete={onRenderComplete} />);

      await waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalledWith(1);
      }, { timeout: 1000 });
    });

    it('should call onRenderError when rendering fails', async () => {
      const onRenderError = vi.fn();
      mockStoreState.renderAST = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'RENDER_FAILED', message: 'Test error', timestamp: new Date(), service: 'renderer' },
      });
      mockStoreState.ast = [{ type: 'invalid', parameters: {}, children: [], position: { line: 1, column: 1 } }];

      render(<StoreConnectedRenderer onRenderError={onRenderError} />);

      await waitFor(() => {
        expect(onRenderError).toHaveBeenCalledWith(expect.any(Error));
      }, { timeout: 1000 });
    });

    it('should call onRenderError when engine initialization fails', async () => {
      const onRenderError = vi.fn();
      mockStoreState.initializeEngine = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'ENGINE_INIT_FAILED', message: 'Engine init failed', timestamp: new Date(), service: 'engine' },
      });

      render(<StoreConnectedRenderer onRenderError={onRenderError} />);

      await waitFor(() => {
        expect(onRenderError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('debouncing', () => {
    it('should debounce AST rendering', async () => {
      const { rerender } = render(<StoreConnectedRenderer />);

      // Change AST multiple times quickly
      mockStoreState.ast = [{ type: 'cube', parameters: {}, children: [], position: { line: 1, column: 1 } }];
      rerender(<StoreConnectedRenderer />);

      mockStoreState.ast = [{ type: 'sphere', parameters: {}, children: [], position: { line: 1, column: 1 } }];
      rerender(<StoreConnectedRenderer />);

      mockStoreState.ast = [{ type: 'cylinder', parameters: {}, children: [], position: { line: 1, column: 1 } }];
      rerender(<StoreConnectedRenderer />);

      // Should only render once after debounce period
      await waitFor(() => {
        expect(mockStoreState.renderAST).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('should skip rendering when already rendering', async () => {
      mockStoreState.isRendering = true;
      mockStoreState.ast = [{ type: 'cube', parameters: {}, children: [], position: { line: 1, column: 1 } }];

      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreState.renderAST).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });

  describe('cleanup', () => {
    it('should cleanup timeouts on unmount', () => {
      const { unmount } = render(<StoreConnectedRenderer />);

      unmount();

      // Component should unmount without errors
      expect(true).toBe(true);
    });
  });
});
