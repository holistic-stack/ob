/**
 * Store-Connected Renderer Component Tests
 *
 * Tests for the Zustand-centric 3D renderer component that verifies
 * proper data flow through the store without direct pipeline access.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CameraConfig } from '../../../shared/types/common.types';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type { RenderError } from '../../store/types/store.types';
import type { Mesh3D, RenderingMetrics } from '../types/renderer.types';

import { StoreConnectedRenderer } from './store-connected-renderer';

interface MockCanvasProps {
  children: React.ReactNode;
  // Add other props as needed, e.g., camera, style
}

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: MockCanvasProps) => (
    <div data-testid="r3f-canvas" {...props}>
      {children}
    </div>
  ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    scene: { add: vi.fn(), remove: vi.fn(), clear: vi.fn() },
    camera: { position: { set: vi.fn() }, lookAt: vi.fn() },
    gl: { render: vi.fn(), setSize: vi.fn() },
  })),
}));

interface MockOrbitControlsProps {
  onChange?: (event: { target: { object: THREE.Object3D; target: THREE.Vector3 } }) => void;
  // Add other props as needed
}

// Mock React Three Drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: ({ onChange, ...props }: MockOrbitControlsProps) => (
    <div data-testid="orbit-controls" {...props} />
  ),
  Stats: () => <div data-testid="stats" />,
}));

interface MockThreeRendererProps {
  astNodes: ReadonlyArray<ASTNode>;
  camera: CameraConfig;
  onRenderComplete?: (meshes: ReadonlyArray<Mesh3D>) => void;
  onPerformanceUpdate?: (metrics: RenderingMetrics) => void;
  // Add other props as needed
}

// Mock Three.js renderer component
vi.mock('./three-renderer', () => ({
  ThreeRenderer: ({
    astNodes,
    camera,
    onRenderComplete,
    onPerformanceUpdate,
    ...props
  }: MockThreeRendererProps) => {
    // Simulate rendering completion
    React.useEffect(() => {
      if (onRenderComplete) {
        setTimeout(() => onRenderComplete([]), 10);
      }
      if (onPerformanceUpdate) {
        setTimeout(
          () =>
            onPerformanceUpdate({
              renderTime: 15.5,
              parseTime: 5.2,
              memoryUsage: 1024 * 1024 * 2.5,
              meshCount: 0,
              triangleCount: 0,
              vertexCount: 0,
              drawCalls: 0,
              textureMemory: 0,
              bufferMemory: 0,
              frameRate: 60,
            }),
          20
        );
      }
    }, [onRenderComplete, onPerformanceUpdate]);

    return (
      <div
        data-testid="three-renderer"
        data-ast-count={astNodes?.length || 0}
        data-camera-position={JSON.stringify(camera?.position)}
        {...props}
      />
    );
  },
}));

// Mock store with realistic data
const mockStoreState = {
  parsing: {
    ast: [] as ASTNode[],
  },
  rendering: {
    camera: { position: [5, 5, 5], target: [0, 0, 0] },
    isRendering: false,
    meshes: [] as Mesh3D[],
    renderErrors: [] as RenderError[],
  },
  performance: {
    metrics: {
      renderTime: 0,
      parseTime: 0,
      memoryUsage: 0,
    },
  },
  config: {
    enableRealTimeRendering: true,
  },
};

const mockStoreActions = {
  updateCamera: vi.fn(),
  updateMetrics: vi.fn(),
  renderFromAST: vi.fn().mockResolvedValue({ success: true, value: [] }),
  addRenderError: vi.fn(),
  clearRenderErrors: vi.fn(),
};

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      // Handle selectors
      const selectorName = selector.name;
      if (selectorName === 'selectParsingAST') return mockStoreState.parsing.ast;
      if (selectorName === 'selectRenderingCamera') return mockStoreState.rendering.camera;
      if (selectorName === 'selectRenderingState') return mockStoreState.rendering;
      if (selectorName === 'selectPerformanceMetrics') return mockStoreState.performance.metrics;
      if (selectorName === 'selectConfigEnableRealTimeRendering')
        return mockStoreState.config.enableRealTimeRendering;

      // Handle action selectors
      return selector(mockStoreActions);
    }
    return vi.fn();
  }),
}));

describe('StoreConnectedRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    mockStoreState.parsing.ast = [];
    mockStoreState.rendering.isRendering = false;
    mockStoreState.rendering.meshes = [];
    mockStoreState.rendering.renderErrors = [];
    mockStoreState.config.enableRealTimeRendering = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render store-connected renderer component', () => {
      render(<StoreConnectedRenderer />);

      expect(screen.getByTestId('store-connected-renderer')).toBeInTheDocument();
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('three-renderer')).toBeInTheDocument();
    });

    it('should apply custom props correctly', () => {
      render(
        <StoreConnectedRenderer
          className="custom-class"
          data-testid="custom-renderer"
          width={1024}
          height={768}
        />
      );

      const renderer = screen.getByTestId('custom-renderer');
      expect(renderer).toBeInTheDocument();
      expect(renderer).toHaveClass('custom-class');
      expect(renderer).toHaveStyle({ width: '1024px', height: '768px' });
    });

    it('should render orbit controls and stats in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<StoreConnectedRenderer />);

      expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
      expect(screen.getByTestId('stats')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Zustand Store Integration', () => {
    it('should pass AST data from store to Three.js renderer', () => {
      const mockAST: ASTNode[] = [
        {
          type: 'cube',
          size: [1, 1, 1],
          center: false,
        },
      ];

      mockStoreState.parsing.ast = mockAST;

      render(<StoreConnectedRenderer />);

      const threeRenderer = screen.getByTestId('three-renderer');
      expect(threeRenderer).toHaveAttribute('data-ast-count', '1');
    });

    it('should pass camera configuration from store', () => {
      const mockCamera = { position: [10, 10, 10], target: [2, 2, 2] };
      mockStoreState.rendering.camera = mockCamera;

      render(<StoreConnectedRenderer />);

      const threeRenderer = screen.getByTestId('three-renderer');
      expect(threeRenderer).toHaveAttribute(
        'data-camera-position',
        JSON.stringify(mockCamera.position)
      );
    });

    it('should show rendering indicator when store indicates rendering', () => {
      mockStoreState.rendering.isRendering = true;

      render(<StoreConnectedRenderer />);

      expect(screen.getByTestId('rendering-indicator')).toBeInTheDocument();
      expect(screen.getByText('Rendering...')).toBeInTheDocument();
    });

    it('should display render errors from store', () => {
      mockStoreState.rendering.renderErrors = [
        { type: 'initialization', message: 'Test error 1' },
        { type: 'initialization', message: 'Test error 2' },
      ];

      render(<StoreConnectedRenderer />);

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Test error 1')).toBeInTheDocument();
      expect(screen.getByText('Test error 2')).toBeInTheDocument();
    });
  });

  describe('Store Action Integration', () => {
    it('should call store actions when performance metrics are updated', async () => {
      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreActions.updateMetrics).toHaveBeenCalledWith({
          renderTime: 15.5,
          parseTime: 5.2,
          memoryUsage: 1024 * 1024 * 2.5,
        });
      });
    });

    it('should trigger AST rendering when AST changes and real-time rendering is enabled', async () => {
      const mockAST: ASTNode[] = [
        {
          type: 'sphere',
          radius: 1,
        },
      ];

      // Initial render
      render(<StoreConnectedRenderer />);

      // Update AST in store
      mockStoreState.parsing.ast = mockAST;

      // Re-render to trigger effect
      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreActions.clearRenderErrors).toHaveBeenCalled();
        expect(mockStoreActions.renderFromAST).toHaveBeenCalledWith(mockAST);
      });
    });

    it('should not trigger rendering when real-time rendering is disabled', async () => {
      mockStoreState.config.enableRealTimeRendering = false;
      mockStoreState.parsing.ast = [
        {
          type: 'cube',
          size: [1, 1, 1],
          center: false,
        },
      ];

      render(<StoreConnectedRenderer />);

      // Wait a bit to ensure no rendering is triggered
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockStoreActions.renderFromAST).not.toHaveBeenCalled();
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display performance metrics in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      mockStoreState.performance.metrics = {
        renderTime: 25.7,
        parseTime: 8.3,
        memoryUsage: 1024 * 1024 * 3.2,
      };
      mockStoreState.rendering.meshes = [
        {
          mesh: {} as THREE.Mesh,
          metadata: {
            nodeType: 'cube',
            nodeIndex: 0,
            id: 'cube-0',
            triangleCount: 12,
            vertexCount: 8,
            boundingBox: new THREE.Box3(),
            material: 'default',
            color: '#ffffff',
            opacity: 1,
            visible: true,
          },
          dispose: vi.fn(),
        },
        {
          mesh: {} as THREE.Mesh,
          metadata: {
            nodeType: 'sphere',
            nodeIndex: 1,
            id: 'sphere-1',
            triangleCount: 100,
            vertexCount: 50,
            boundingBox: new THREE.Box3(),
            material: 'default',
            color: '#ffffff',
            opacity: 1,
            visible: true,
          },
          dispose: vi.fn(),
        },
        {
          mesh: {} as THREE.Mesh,
          metadata: {
            nodeType: 'cylinder',
            nodeIndex: 2,
            id: 'cylinder-2',
            triangleCount: 64,
            vertexCount: 32,
            boundingBox: new THREE.Box3(),
            material: 'default',
            color: '#ffffff',
            opacity: 1,
            visible: true,
          },
          dispose: vi.fn(),
        },
      ];

      render(<StoreConnectedRenderer />);

      const performanceDisplay = screen.getByTestId('performance-display');
      expect(performanceDisplay).toBeInTheDocument();
      expect(performanceDisplay).toHaveTextContent('Render Time: 25.70ms');
      expect(performanceDisplay).toHaveTextContent('Parse Time: 8.30ms');
      expect(performanceDisplay).toHaveTextContent('Memory: 3.2MB');
      expect(performanceDisplay).toHaveTextContent('Meshes: 3');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    it('should handle render errors and update store', async () => {
      mockStoreActions.renderFromAST.mockResolvedValueOnce({
        success: false,
        error: 'Mock render error',
      });

      mockStoreState.parsing.ast = [
        {
          type: 'error' as const,
          message: 'Test error',
          errorCode: 'PARSE_ERROR',
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 10, offset: 9 },
          },
        },
      ];

      render(<StoreConnectedRenderer />);

      await waitFor(() => {
        expect(mockStoreActions.addRenderError).toHaveBeenCalledWith('Mock render error');
      });
    });
  });
});
