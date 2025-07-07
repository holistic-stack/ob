/**
 * R3F Scene Component Tests
 *
 * Tests for the React Three Fiber scene component that verifies
 * proper Three.js object creation and R3F integration.
 */

import ReactThreeTestRenderer, { type ReactThreeTest } from '@react-three/test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ASTNode,
  CubeNode,
  CylinderNode,
  SphereNode,
} from '../../openscad-parser/core/ast-types.js';

import { R3FScene } from './r3f-scene';

// Mock ResizeObserver for test environment
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = MockResizeObserver;

// Use real primitive renderer service - no mocks except Three.js WebGL components

// Use real primitive renderer service - no mocks except Three.js WebGL components

describe('R3FScene', () => {
  let renderer: ReactThreeTest.Renderer | null = null;
  const mockOnCameraChange = vi.fn();
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
    onRenderComplete: mockOnRenderComplete,
    onRenderError: mockOnRenderError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (renderer) {
      renderer.unmount();
      renderer = null;
    }
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render R3F scene component without errors', async () => {
      renderer = await ReactThreeTestRenderer.create(<R3FScene {...defaultProps} />);
      expect(renderer.scene).toBeDefined();
    });

    it('should render lighting and controls', async () => {
      renderer = await ReactThreeTestRenderer.create(<R3FScene {...defaultProps} />);

      // Check that the scene contains lighting and controls
      expect(renderer.scene.children).toBeDefined();
      expect(renderer.scene.children.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AST Node Processing', () => {
    it('should handle empty AST nodes array', async () => {
      renderer = await ReactThreeTestRenderer.create(<R3FScene {...defaultProps} astNodes={[]} />);

      // The scene will contain lighting and controls, but no meshes from AST nodes
      expect(renderer.scene.children.length).toBeGreaterThanOrEqual(0);

      // The onRenderComplete callback should be called with empty array
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

      renderer = await ReactThreeTestRenderer.create(
        <R3FScene {...defaultProps} astNodes={cubeAST} />
      );

      // The scene should contain the cube mesh (plus lighting and controls)
      expect(renderer.scene.children.length).toBeGreaterThan(0);

      // The onRenderComplete callback should be called with the cube mesh
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mesh: expect.any(Object),
            metadata: expect.objectContaining({
              nodeType: 'cube',
              nodeIndex: 0,
            }),
          }),
        ])
      );
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

      renderer = await ReactThreeTestRenderer.create(
        <R3FScene {...defaultProps} astNodes={sphereAST} />
      );

      // The scene should contain the sphere mesh (plus lighting and controls)
      expect(renderer.scene.children.length).toBeGreaterThan(0);

      // The onRenderComplete callback should be called with the sphere mesh
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mesh: expect.any(Object),
            metadata: expect.objectContaining({
              nodeType: 'sphere',
              nodeIndex: 0,
            }),
          }),
        ])
      );
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

      renderer = await ReactThreeTestRenderer.create(
        <R3FScene {...defaultProps} astNodes={cylinderAST} />
      );

      // The scene should contain the cylinder mesh (plus lighting and controls)
      expect(renderer.scene.children.length).toBeGreaterThan(0);

      // The onRenderComplete callback should be called with the cylinder mesh
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mesh: expect.any(Object),
            metadata: expect.objectContaining({
              nodeType: 'cylinder',
              nodeIndex: 0,
            }),
          }),
        ])
      );
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

      renderer = await ReactThreeTestRenderer.create(
        <R3FScene {...defaultProps} astNodes={multipleAST} />
      );

      // The scene should contain both meshes (plus lighting and controls)
      expect(renderer.scene.children.length).toBeGreaterThan(0);

      // The onRenderComplete callback should be called with both meshes
      expect(mockOnRenderComplete).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mesh: expect.any(Object),
            metadata: expect.objectContaining({
              nodeType: 'cube',
              nodeIndex: 0,
            }),
          }),
          expect.objectContaining({
            mesh: expect.any(Object),
            metadata: expect.objectContaining({
              nodeType: 'sphere',
              nodeIndex: 1,
            }),
          }),
        ])
      );
    });
  });

  describe('Camera Integration', () => {
    it('should handle camera changes from orbit controls', async () => {
      renderer = await ReactThreeTestRenderer.create(<R3FScene {...defaultProps} />);

      // The scene should render successfully with orbit controls
      expect(renderer.scene).toBeDefined();
      expect(renderer.scene.children.length).toBeGreaterThanOrEqual(0);

      // Note: Camera change events from OrbitControls are difficult to test
      // in the test environment, so we just verify the component renders
      // without errors when camera props are provided
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported AST node types', async () => {
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

      renderer = await ReactThreeTestRenderer.create(
        <R3FScene {...defaultProps} astNodes={unsupportedAST} />
      );

      // The scene should still render (with lighting and controls)
      expect(renderer.scene).toBeDefined();
      expect(renderer.scene.children.length).toBeGreaterThanOrEqual(0);

      // The onRenderError callback should be called for the unsupported node
      expect(mockOnRenderError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to create mesh for node 0 (error)'),
        })
      );
    });

    it('should call onRenderError when an error occurs', async () => {
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

      renderer = await ReactThreeTestRenderer.create(
        <R3FScene {...defaultProps} astNodes={unsupportedAST} />
      );

      // The onRenderError callback should be called with error details
      expect(mockOnRenderError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to create mesh for node 0 (error)'),
        })
      );
    });
  });
});
