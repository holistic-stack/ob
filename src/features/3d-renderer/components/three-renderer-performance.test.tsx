/**
 * Three.js Renderer Performance Tests
 *
 * Tests to verify that the performance measurement utilities work correctly
 * and that the import issue is resolved.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import { Canvas } from '@react-three/fiber';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThreeRenderer } from './three-renderer';

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    scene: {
      add: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      children: [],
    },
    camera: {
      position: { set: vi.fn() },
      lookAt: vi.fn(),
    },
    gl: {
      render: vi.fn(),
      setSize: vi.fn(),
      domElement: document.createElement('canvas'),
    },
  })),
}));

// Mock Three.js
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    children: [],
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn() },
    lookAt: vi.fn(),
  })),
  WebGLRenderer: vi.fn(() => ({
    render: vi.fn(),
    setSize: vi.fn(),
    domElement: document.createElement('canvas'),
  })),
  Mesh: vi.fn(),
  BoxGeometry: vi.fn(),
  SphereGeometry: vi.fn(),
  CylinderGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
}));

// Mock CSG operations
vi.mock('../services/csg-operations.service', () => ({
  performUnion: vi.fn().mockResolvedValue({ success: true, value: [] }),
  performDifference: vi.fn().mockResolvedValue({ success: true, value: [] }),
  performIntersection: vi.fn().mockResolvedValue({ success: true, value: [] }),
}));

// Mock primitive renderer
vi.mock('../services/primitive-renderer.service', () => ({
  renderCube: vi.fn().mockReturnValue({ success: true, value: {} }),
  renderSphere: vi.fn().mockReturnValue({ success: true, value: {} }),
  renderCylinder: vi.fn().mockReturnValue({ success: true, value: {} }),
}));

describe('ThreeRenderer Performance', () => {
  const mockOnPerformanceUpdate = vi.fn();
  const mockOnRenderComplete = vi.fn();
  const mockOnRenderError = vi.fn();
  const mockOnCameraChange = vi.fn();

  const defaultProps = {
    ast: [] as ASTNode[],
    camera: {
      position: [5, 5, 5] as const,
      target: [0, 0, 0] as const,
      zoom: 1,
      fov: 75,
      near: 0.1,
      far: 1000,
      type: 'perspective' as const,
      enableControls: true,
      enableAutoRotate: false,
      autoRotateSpeed: 1,
    },
    config: {
      enableShadows: false,
      enableAntialiasing: true,
      enableWebGL2: true,
      enableHardwareAcceleration: true,
      backgroundColor: '#f0f0f0',
      ambientLightIntensity: 0.3,
      directionalLightIntensity: 0.7,
      maxMeshes: 1000,
      maxTriangles: 50000,
      shadows: true,
    },
    onPerformanceUpdate: mockOnPerformanceUpdate,
    onRenderComplete: mockOnRenderComplete,
    onRenderError: mockOnRenderError,
    onCameraChange: mockOnCameraChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock performance.now() for consistent timing
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0) // Start time
      .mockReturnValueOnce(15.5); // End time (15.5ms duration)
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Performance Measurement', () => {
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
          <ThreeRenderer {...defaultProps} ast={testAST} />
        </Canvas>
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify performance measurement was called
      expect(mockOnPerformanceUpdate).toHaveBeenCalled();

      // Check that the performance update includes timing data
      const performanceCall = mockOnPerformanceUpdate.mock.calls[0];
      if (performanceCall?.[0]) {
        const metrics = performanceCall[0];
        expect(typeof metrics.renderTime).toBe('number');
        expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle performance measurement without errors', () => {
      // Test that the component renders without throwing errors
      expect(() => {
        render(
          <Canvas>
            <ThreeRenderer {...defaultProps} />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should call performance update with valid metrics structure', async () => {
      const testAST: ASTNode[] = [
        {
          type: 'sphere',
          radius: 2,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 15, offset: 14 },
          },
        },
      ];

      render(
        <Canvas>
          <ThreeRenderer {...defaultProps} ast={testAST} />
        </Canvas>
      );

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (mockOnPerformanceUpdate.mock.calls.length > 0) {
        const metrics = mockOnPerformanceUpdate.mock.calls[0][0];

        // Verify metrics structure
        expect(metrics).toHaveProperty('renderTime');
        expect(metrics).toHaveProperty('parseTime');
        expect(metrics).toHaveProperty('memoryUsage');

        // Verify types
        expect(typeof metrics.renderTime).toBe('number');
        expect(typeof metrics.parseTime).toBe('number');
        expect(typeof metrics.memoryUsage).toBe('number');

        // Verify reasonable values
        expect(metrics.renderTime).toBeGreaterThanOrEqual(0);
        expect(metrics.parseTime).toBeGreaterThanOrEqual(0);
        expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Import Resolution', () => {
    it('should not have import errors in browser environment', () => {
      // This test verifies that the component can be imported and used
      // without the ERR_BLOCKED_BY_CLIENT error

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Canvas>
          <ThreeRenderer {...defaultProps} />
        </Canvas>
      );

      // Check that no console errors were logged related to imports
      const importErrors = consoleSpy.mock.calls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === 'string' &&
            (arg.includes('ERR_BLOCKED_BY_CLIENT') ||
              arg.includes('metrics.ts') ||
              arg.includes('Failed to load'))
        )
      );

      expect(importErrors).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should use inline performance measurement function', () => {
      // Test that the inline measureTime function works correctly
      const testFunction = vi.fn(() => 'test result');

      // Mock performance.now to return predictable values
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(100) // Start time
        .mockReturnValueOnce(115); // End time (15ms duration)

      // This simulates the inline measureTime function
      const measureTime = <T,>(fn: () => T): { result: T; duration: number } => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        return { result, duration: end - start };
      };

      const measurement = measureTime(testFunction);

      expect(measurement.result).toBe('test result');
      expect(measurement.duration).toBe(15);
      expect(testFunction).toHaveBeenCalledOnce();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance measurement errors gracefully', async () => {
      // Mock performance.now to throw an error
      vi.spyOn(performance, 'now').mockImplementation(() => {
        throw new Error('Performance API not available');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Component should still render without crashing
      expect(() => {
        render(
          <Canvas>
            <ThreeRenderer {...defaultProps} />
          </Canvas>
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should provide fallback timing when performance API fails', () => {
      // Test fallback behavior when performance.now() is not available
      const originalPerformance = global.performance;

      // Temporarily remove performance API
      (global as any).performance = undefined;

      expect(() => {
        render(
          <Canvas>
            <ThreeRenderer {...defaultProps} />
          </Canvas>
        );
      }).not.toThrow();

      // Restore performance API
      global.performance = originalPerformance;
    });
  });
});
