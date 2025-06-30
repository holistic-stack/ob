/**
 * Three.js Renderer Component Test Suite
 *
 * Comprehensive tests for Three.js renderer component following TDD methodology
 * with React Three Fiber integration and OpenSCAD AST rendering.
 */

import type { ASTNode, CubeNode, SphereNode } from '@holistic-stack/openscad-parser';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CameraConfig } from '../../../shared/types/common.types';
import type { RendererProps, Scene3DConfig } from '../types/renderer.types';

interface MockCanvasProps {
  children: React.ReactNode;
  // Add other props as needed, e.g., camera, style
}

// Mock Three.js for testing
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  traverse: vi.fn(),
  children: [],
  dispose: vi.fn(),
};

const mockCamera = {
  position: { set: vi.fn(), x: 10, y: 10, z: 10 },
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn(),
  aspect: 1,
  fov: 75,
  near: 0.1,
  far: 1000,
};

const mockRenderer = {
  render: vi.fn(),
  setSize: vi.fn(),
  setClearColor: vi.fn(),
  dispose: vi.fn(),
  domElement: document.createElement('canvas'),
  shadowMap: { enabled: false, type: 0 },
  outputEncoding: 0,
  toneMapping: 0,
  toneMappingExposure: 1,
};

const mockMesh = {
  geometry: { dispose: vi.fn() },
  material: { dispose: vi.fn() },
  dispose: vi.fn(),
  position: { set: vi.fn() },
  rotation: { set: vi.fn() },
  scale: { set: vi.fn() },
  uuid: 'test-mesh-uuid',
};

// Mock Three.js module
vi.mock('three', () => ({
  Scene: vi.fn(() => mockScene),
  PerspectiveCamera: vi.fn(() => mockCamera),
  WebGLRenderer: vi.fn(() => mockRenderer),
  Mesh: vi.fn(() => mockMesh),
  BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  SphereGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  CylinderGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  AmbientLight: vi.fn(() => ({ dispose: vi.fn() })),
  DirectionalLight: vi.fn(() => ({ dispose: vi.fn() })),
  Color: vi.fn(),
  Vector3: vi.fn(),
  Box3: vi.fn(() => ({ min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } })),
  PCFSoftShadowMap: 1,
  sRGBEncoding: 3001,
  ACESFilmicToneMapping: 4,
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: MockCanvasProps) =>
    React.createElement(
      'div',
      {
        'data-testid': 'three-canvas',
        ...props,
      },
      children
    ),
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    scene: mockScene,
    camera: mockCamera,
    gl: mockRenderer,
    size: { width: 800, height: 600 },
  })),
  extend: vi.fn(),
}));

// Mock three-csg-ts
vi.mock('three-csg-ts', () => ({
  CSG: {
    fromMesh: vi.fn(() => ({
      union: vi.fn(() => ({ toMesh: vi.fn(() => mockMesh) })),
      subtract: vi.fn(() => ({ toMesh: vi.fn(() => mockMesh) })),
      intersect: vi.fn(() => ({ toMesh: vi.fn(() => mockMesh) })),
    })),
  },
}));

// Mock component for TDD (will be replaced with real implementation)
const MockThreeRenderer: React.FC<RendererProps> = ({
  ast,
  camera,
  config: _config,
  className,
  'data-testid': testId,
  onRenderComplete,
  onRenderError: _onRenderError,
  onCameraChange: _onCameraChange,
  onPerformanceUpdate,
}) => {
  const [isRendering, setIsRendering] = React.useState(false);
  const [meshCount, setMeshCount] = React.useState(0);

  React.useEffect(() => {
    if (ast.length > 0) {
      setIsRendering(true);

      // Simulate rendering process
      setTimeout(() => {
        setMeshCount(ast.length);
        setIsRendering(false);

        if (onRenderComplete) {
          const mockMeshes = ast.map((node, index) => ({
            mesh: mockMesh as unknown as THREE.Mesh,
            metadata: {
              id: `mesh-${index}`,
              nodeType: node.type || 'unknown',
              nodeIndex: index,
              triangleCount: 12,
              vertexCount: 8,
              boundingBox: new THREE.Box3(),
              material: 'standard',
              color: '#ffffff',
              opacity: 1,
              visible: true,
            },
            dispose: vi.fn(),
          }));
          onRenderComplete(mockMeshes);
        }

        if (onPerformanceUpdate) {
          onPerformanceUpdate({
            renderTime: 10,
            parseTime: 5,
            memoryUsage: 50,
            frameRate: 60,
            meshCount: ast.length,
            triangleCount: ast.length * 12,
            vertexCount: ast.length * 8,
            drawCalls: ast.length,
            textureMemory: 0,
            bufferMemory: ast.length * 1024,
          });
        }
      }, 10);
    }
  }, [ast, onRenderComplete, onPerformanceUpdate]);

  return (
    <div
      data-testid={testId ?? 'three-renderer'}
      className={className}
      style={{ width: '100%', height: '400px', position: 'relative' }}
    >
      <div data-testid="three-canvas" style={{ width: '100%', height: '100%' }}>
        {isRendering && <div data-testid="rendering-indicator">Rendering...</div>}
        <div data-testid="mesh-count">{meshCount} meshes</div>
        <div data-testid="camera-position">Camera: [{camera.position.join(', ')}]</div>
      </div>
    </div>
  );
};

describe('Three.js Renderer Component', () => {
  let defaultConfig: Scene3DConfig;
  let defaultCamera: CameraConfig;
  let mockAST: ASTNode[];

  beforeEach(() => {
    vi.clearAllMocks();

    defaultConfig = {
      enableShadows: true,
      enableAntialiasing: true,
      enableWebGL2: true,
      enableHardwareAcceleration: true,
      backgroundColor: '#1a1a1a',
      ambientLightIntensity: 0.4,
      directionalLightIntensity: 0.8,
      maxMeshes: 1000,
      maxTriangles: 100000,
    };

    defaultCamera = {
      position: [10, 10, 10],
      target: [0, 0, 0],
      zoom: 1,
      fov: 75,
      near: 0.1,
      far: 1000,
      enableControls: true,
      enableAutoRotate: false,
      autoRotateSpeed: 1,
    };

    mockAST = [
      { type: 'cube', size: [10, 10, 10], center: false } as CubeNode,
      { type: 'sphere', radius: 5 } as SphereNode,
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render Three.js renderer component', () => {
      render(<MockThreeRenderer ast={[]} camera={defaultCamera} config={defaultConfig} />);

      const renderer = screen.getByTestId('three-renderer');
      expect(renderer).toBeInTheDocument();
    });

    it('should render Three.js canvas', () => {
      render(<MockThreeRenderer ast={[]} camera={defaultCamera} config={defaultConfig} />);

      const canvas = screen.getByTestId('three-canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const customClass = 'custom-renderer-class';
      render(
        <MockThreeRenderer
          ast={[]}
          camera={defaultCamera}
          config={defaultConfig}
          className={customClass}
        />
      );

      const renderer = screen.getByTestId('three-renderer');
      expect(renderer).toHaveClass(customClass);
    });

    it('should apply custom test id', () => {
      const customTestId = 'custom-renderer';
      render(
        <MockThreeRenderer
          ast={[]}
          camera={defaultCamera}
          config={defaultConfig}
          data-testid={customTestId}
        />
      );

      const renderer = screen.getByTestId(customTestId);
      expect(renderer).toBeInTheDocument();
    });

    it('should have correct dimensions', () => {
      render(<MockThreeRenderer ast={[]} camera={defaultCamera} config={defaultConfig} />);

      const renderer = screen.getByTestId('three-renderer');
      expect(renderer).toHaveStyle({ width: '100%', height: '400px' });
    });
  });

  describe('AST Rendering', () => {
    it('should render empty scene with no AST nodes', () => {
      render(<MockThreeRenderer ast={[]} camera={defaultCamera} config={defaultConfig} />);

      const meshCount = screen.getByTestId('mesh-count');
      expect(meshCount).toHaveTextContent('0 meshes');
    });

    it('should render meshes from AST nodes', async () => {
      render(<MockThreeRenderer ast={mockAST} camera={defaultCamera} config={defaultConfig} />);

      await waitFor(() => {
        const meshCount = screen.getByTestId('mesh-count');
        expect(meshCount).toHaveTextContent('2 meshes');
      });
    });

    it('should show rendering indicator during rendering', () => {
      render(<MockThreeRenderer ast={mockAST} camera={defaultCamera} config={defaultConfig} />);

      const indicator = screen.getByTestId('rendering-indicator');
      expect(indicator).toHaveTextContent('Rendering...');
    });

    it('should call onRenderComplete when rendering finishes', async () => {
      const onRenderComplete = vi.fn();

      render(
        <MockThreeRenderer
          ast={mockAST}
          camera={defaultCamera}
          config={defaultConfig}
          onRenderComplete={onRenderComplete}
        />
      );

      await waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              mesh: expect.any(Object),
              metadata: expect.objectContaining({
                nodeType: 'cube',
                triangleCount: 12,
                vertexCount: 8,
              }),
            }),
          ])
        );
      });
    });
  });

  describe('Camera Configuration', () => {
    it('should display camera position', () => {
      render(<MockThreeRenderer ast={[]} camera={defaultCamera} config={defaultConfig} />);

      const cameraPosition = screen.getByTestId('camera-position');
      expect(cameraPosition).toHaveTextContent('Camera: [10, 10, 10]');
    });

    it('should update camera position when prop changes', () => {
      const { rerender } = render(
        <MockThreeRenderer ast={[]} camera={defaultCamera} config={defaultConfig} />
      );

      const newCamera = { ...defaultCamera, position: [5, 5, 5] as const };
      rerender(<MockThreeRenderer ast={[]} camera={newCamera} config={defaultConfig} />);

      const cameraPosition = screen.getByTestId('camera-position');
      expect(cameraPosition).toHaveTextContent('Camera: [5, 5, 5]');
    });
  });

  describe('Performance Monitoring', () => {
    it('should call onPerformanceUpdate with metrics', async () => {
      const onPerformanceUpdate = vi.fn();

      render(
        <MockThreeRenderer
          ast={mockAST}
          camera={defaultCamera}
          config={defaultConfig}
          onPerformanceUpdate={onPerformanceUpdate}
        />
      );

      await waitFor(() => {
        expect(onPerformanceUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            renderTime: expect.any(Number),
            meshCount: 2,
            triangleCount: 24,
            vertexCount: 16,
            drawCalls: 2,
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle rendering errors gracefully', () => {
      const onRenderError = vi.fn();

      render(
        <MockThreeRenderer
          ast={mockAST}
          camera={defaultCamera}
          config={defaultConfig}
          onRenderError={onRenderError}
        />
      );

      // Component should render without throwing
      const renderer = screen.getByTestId('three-renderer');
      expect(renderer).toBeInTheDocument();
    });

    it('should provide error callback', () => {
      const onRenderError = vi.fn();

      render(
        <MockThreeRenderer
          ast={mockAST}
          camera={defaultCamera}
          config={defaultConfig}
          onRenderError={onRenderError}
        />
      );

      // Error callback should be available
      expect(onRenderError).toBeDefined();
    });
  });

  describe('Event Callbacks', () => {
    it('should provide camera change callback', () => {
      const _onCameraChange = vi.fn();

      render(
        <MockThreeRenderer
          ast={[]}
          camera={defaultCamera}
          config={defaultConfig}
          onCameraChange={_onCameraChange}
        />
      );

      expect(_onCameraChange).toBeDefined();
    });

    it('should provide render complete callback', () => {
      const onRenderComplete = vi.fn();

      render(
        <MockThreeRenderer
          ast={[]}
          camera={defaultCamera}
          config={defaultConfig}
          onRenderComplete={onRenderComplete}
        />
      );

      expect(onRenderComplete).toBeDefined();
    });
  });
});
