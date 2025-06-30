/**
 * R3F Scene Component Tests
 *
 * Tests for the React Three Fiber scene component that verifies
 * proper Three.js object creation and R3F integration.
 */

import type { ASTNode, CubeNode, CylinderNode, SphereNode } from '@holistic-stack/openscad-parser';
import { Canvas } from '@react-three/fiber';
import { render } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// import { type Mesh3D } from '../types/renderer.types';

import { R3FScene } from './r3f-scene';

// Mock ResizeObserver for test environment
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver;

// Mock React Three Fiber hooks
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  children: [],
};

const mockGl = {
  info: {
    render: {
      frame: 1,
    },
  },
};

vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useThree: vi.fn(() => ({
      scene: mockScene,
      gl: mockGl,
    })),
    useFrame: vi.fn((callback: (state: unknown, delta: number) => void) => {
      // Simulate frame callback
      setTimeout(() => callback({} as unknown, 0.016), 16);
    }),
  };
});

// Mock React Three Drei
interface OrbitControlsChangeEvent {
  target: {
    object: { position: THREE.Vector3 };
    target: THREE.Vector3;
  };
}

vi.mock('@react-three/drei', () => ({
  OrbitControls: ({
    onChange,
    ...props
  }: {
    onChange?: (event: OrbitControlsChangeEvent) => void;
  }) => {
    React.useEffect(() => {
      // Simulate orbit controls change
      if (onChange) {
        const mockEvent = {
          target: {
            object: {
              position: new THREE.Vector3(5, 5, 5),
            },
            target: new THREE.Vector3(0, 0, 0),
          },
        };
        setTimeout(() => onChange(mockEvent), 10);
      }
    }, [onChange]);

    return <div data-testid="orbit-controls" {...props} />;
  },
}));

// Mock Three.js
vi.mock('three', () => ({
  BoxGeometry: vi.fn(() => ({
    dispose: vi.fn(),
    attributes: { position: { count: 24 } },
    index: { count: 36 },
  })),
  SphereGeometry: vi.fn(() => ({
    dispose: vi.fn(),
    attributes: { position: { count: 32 } },
    index: { count: 96 },
  })),
  CylinderGeometry: vi.fn(() => ({
    dispose: vi.fn(),
    attributes: { position: { count: 64 } },
    index: { count: 192 },
  })),
  MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  Mesh: vi.fn((geometry, material) => ({
    geometry,
    material,
    position: { set: vi.fn() },
    dispose: vi.fn(),
  })),
}));

// Use real primitive renderer service - no mocks

describe('R3FScene', () => {
  const mockOnCameraChange = vi.fn();
  const mockOnPerformanceUpdate = vi.fn();
  const mockOnRenderComplete = vi.fn();
  const mockOnRenderError = vi.fn();

  const defaultProps = {
    astNodes: [] as ASTNode[],
    camera: {
      position: [5, 5, 5] as const,
      target: [0, 0, 0] as const,
      zoom: 1,
      fov: 75,
      near: 0.1,
      far: 1000,
      enableControls: true,
      enableAutoRotate: false,
      autoRotateSpeed: 2,
    },
    onCameraChange: mockOnCameraChange,
    onPerformanceUpdate: mockOnPerformanceUpdate,
    onRenderComplete: mockOnRenderComplete,
    onRenderError: mockOnRenderError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene.add.mockClear();
    mockScene.remove.mockClear();

    // Mock performance.now() for consistent timing
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(15.5); // End time (15.5ms duration)
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render R3F scene component without errors', () => {
      expect(() => {
        render(
          <Canvas>
            <R3FScene {...defaultProps} />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should render lighting and controls', () => {
      const { container } = render(
        <Canvas>
          <R3FScene {...defaultProps} />
        </Canvas>
      );

      // Check that the component renders without throwing
      expect(container).toBeTruthy();
    });
  });

  describe('AST Node Processing', () => {
    it('should handle empty AST nodes array', async () => {
      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={[]} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnRenderComplete).toHaveBeenCalledWith([]);
    });

    it('should process cube AST nodes', async () => {
      const cubeAST: CubeNode[] = [
        {
          type: 'cube',
          size: [2, 2, 2],
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={cubeAST} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockScene.add).toHaveBeenCalled();
      expect(mockOnRenderComplete).toHaveBeenCalled();
    });

    it('should process sphere AST nodes', async () => {
      const sphereAST: SphereNode[] = [
        {
          type: 'sphere',
          radius: 1.5,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 15, offset: 14 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={sphereAST} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockScene.add).toHaveBeenCalled();
      expect(mockOnRenderComplete).toHaveBeenCalled();
    });

    it('should process cylinder AST nodes', async () => {
      const cylinderAST: CylinderNode[] = [
        {
          type: 'cylinder',
          h: 3,
          r: 1,
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={cylinderAST} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockScene.add).toHaveBeenCalled();
      expect(mockOnRenderComplete).toHaveBeenCalled();
    });

    it('should handle multiple AST nodes', async () => {
      const multipleAST: ASTNode[] = [
        {
          type: 'cube',
          size: [1, 1, 1],
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        },
        {
          type: 'sphere',
          radius: 0.5,
          location: {
            start: { line: 2, column: 1, offset: 21 },
            end: { line: 2, column: 15, offset: 35 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={multipleAST} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockScene.add).toHaveBeenCalledTimes(2);
      expect(mockOnRenderComplete).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should call performance update callback', async () => {
      render(
        <Canvas>
          <R3FScene {...defaultProps} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnPerformanceUpdate).toHaveBeenCalled();

      const performanceCall = mockOnPerformanceUpdate.mock.calls[0];
      if (performanceCall?.[0]) {
        const metrics = performanceCall[0];
        expect(typeof metrics.renderTime).toBe('number');
        expect(typeof metrics.parseTime).toBe('number');
        expect(typeof metrics.memoryUsage).toBe('number');
      }
    });

    it('should measure render time correctly', async () => {
      const testAST: ASTNode[] = [
        {
          type: 'cube',
          size: [1, 1, 1],
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={testAST} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnPerformanceUpdate).toHaveBeenCalled();

      const metrics = mockOnPerformanceUpdate.mock.calls[0][0];
      expect(metrics.renderTime).toBe(15.5); // Based on our mock
    });
  });

  describe('Camera Integration', () => {
    it('should handle camera changes from orbit controls', async () => {
      render(
        <Canvas>
          <R3FScene {...defaultProps} />
        </Canvas>
      );

      // Wait for orbit controls to trigger change
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnCameraChange).toHaveBeenCalledWith({
        position: [5, 5, 5],
        target: [0, 0, 0],
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported AST node types', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console errors during testing
      });

      const unsupportedAST: ASTNode[] = [
        {
          type: 'error',
          errorCode: 'UNSUPPORTED_NODE',
          message: 'Unsupported AST node type: unsupported',
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 15, offset: 14 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={unsupportedAST} />
        </Canvas>
      );

      // Wait for effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to render AST node'),
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it('should call onRenderError when an error occurs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Mock implementation to suppress console errors during testing
      });
      const unsupportedAST: ASTNode[] = [
        {
          type: 'error',
          errorCode: 'UNSUPPORTED_NODE',
          message: 'Unsupported AST node type: unsupported',
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 15, offset: 14 },
          },
        },
      ];

      render(
        <Canvas>
          <R3FScene {...defaultProps} astNodes={unsupportedAST} />
        </Canvas>
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockOnRenderError).toHaveBeenCalled();
      const errorCall = mockOnRenderError.mock.calls[0];
      expect(errorCall[0]).toBeInstanceOf(Error);
      expect(errorCall[0].message).toContain('Unsupported AST node type: unsupported');

      consoleSpy.mockRestore();
    });
  });
});
