/**
 * Main Application Component Tests
 *
 * Tests for the integrated OpenSCAD 3D visualization application
 * that verifies proper integration of Monaco Editor and BabylonJS renderer.
 */

import { render, screen } from '@testing-library/react';
// TODO: Replace with BabylonJS types
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { InspectorTab } from './features/babylon-renderer/services/babylon-inspector-service/babylon-inspector-service';
import type { ASTNode } from './features/openscad-parser/core/ast-types.js';
import { appStoreInstance, DEFAULT_CAMERA } from './features/store/app-store';

// Mock the store-connected components to avoid complex rendering
vi.mock('./features/code-editor/components/store-connected-editor/store-connected-editor', () => ({
  StoreConnectedEditor: () => <div data-testid="store-connected-editor">Editor</div>,
}));

vi.mock(
  './features/babylon-renderer/components/store-connected-renderer/store-connected-renderer',
  () => ({
    StoreConnectedRenderer: (props: { 'data-testid'?: string }) => (
      <div data-testid={props['data-testid'] || 'store-connected-renderer'}>Renderer</div>
    ),
  })
);

// Mock BabylonJS components to avoid canvas context issues
vi.mock('./features/babylon-renderer/components/babylon-scene/babylon-scene', () => ({
  BabylonScene: () => <div data-testid="babylon-scene">BabylonScene</div>,
}));

vi.mock('./features/babylon-renderer/hooks/use-babylon-engine/use-babylon-engine', () => ({
  useBabylonEngine: () => ({
    engine: null,
    scene: null,
    canvas: null,
  }),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    appStoreInstance.setState({
      editor: {
        code: '',
        isDirty: false,
        lastSaved: null,
        cursorPosition: { line: 1, column: 1 },
        selection: null,
      },
      parsing: {
        ast: [],
        errors: [],
        warnings: [],
        isLoading: false,
        lastParsed: null,
        lastParsedCode: null,
        parseTime: 0,
      },
      babylonRendering: {
        scene: null,
        engine: {
          engine: null,
          isInitialized: false,
          isDisposed: false,
          isWebGPU: false,
          canvas: null,
          fps: 0,
          deltaTime: 0,
          renderTime: 0,
          lastUpdated: new Date(),
          error: null,
          performanceMetrics: {
            fps: 0,
            deltaTime: 0,
            renderTime: 0,
            drawCalls: 0,
            triangleCount: 0,
            memoryUsage: 0,
            gpuMemoryUsage: 0,
          },
        },
        inspector: {
          isVisible: false,
          isEmbedded: false,
          currentTab: InspectorTab.SCENE,
          scene: null,
          lastUpdated: new Date(),
        },
        csg: {
          isEnabled: true,
          operations: [],
          lastOperationTime: 0,
          error: null,
          lastUpdated: new Date(),
        },
        materials: [],
        meshes: [],
        isRendering: false,
        renderErrors: [],
        lastRendered: null,
        renderTime: 0,
        performanceMetrics: {
          fps: 0,
          deltaTime: 0,
          renderTime: 0,
          drawCalls: 0,
          triangleCount: 0,
          memoryUsage: 0,
          gpuMemoryUsage: 0,
        },
        camera: DEFAULT_CAMERA,
      },
    });
  });

  describe('Application Layout', () => {
    it('should render main application with header and panels', () => {
      render(<App />);

      // Check header
      expect(screen.getByText('OpenSCAD 3D Visualizer')).toBeInTheDocument();
      expect(screen.getByText('idle')).toBeInTheDocument();

      // Check panels
      expect(screen.getByText('OpenSCAD Code Editor')).toBeInTheDocument();
      expect(screen.getByText('3D Visualization')).toBeInTheDocument();

      // Check components
      expect(screen.getByTestId('main-editor')).toBeInTheDocument();
      expect(screen.getByTestId('main-renderer')).toBeInTheDocument();
    });

    it('should render resize handle with accessibility features', () => {
      render(<App />);

      const resizeHandle = screen.getByTestId('resize-handle');
      expect(resizeHandle).toBeInTheDocument();
      expect(resizeHandle).toHaveAttribute('aria-label', 'Resize panels');
      expect(resizeHandle).toHaveAttribute('type', 'button');
    });

    it('should display application status correctly', () => {
      appStoreInstance.setState({
        babylonRendering: { ...appStoreInstance.getState().babylonRendering, isRendering: true },
      });

      render(<App />);

      expect(screen.getByText('rendering')).toBeInTheDocument();
    });

    it('should display metrics in header', () => {
      const ast: ASTNode[] = [
        {
          type: 'cube',
          size: [1, 1, 1],
          center: false,
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 20, offset: 19 },
          },
        } as ASTNode,
        {
          type: 'sphere',
          radius: 1,
          location: {
            start: { line: 2, column: 1, offset: 21 },
            end: { line: 2, column: 15, offset: 35 },
          },
        } as ASTNode,
      ];
      // TODO: Replace with BabylonJS mesh types
      const meshes: unknown[] = [
        {}, // Mock mesh for cube
        {}, // Mock mesh for sphere
        {}, // Mock mesh for cylinder
      ];

      appStoreInstance.setState({
        parsing: { ...appStoreInstance.getState().parsing, ast },
        babylonRendering: { ...appStoreInstance.getState().babylonRendering, meshes },
      });

      render(<App />);

      expect(screen.getByText('AST: 2 nodes')).toBeInTheDocument();
      expect(screen.getByText('Meshes: 3')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate store-connected editor', () => {
      render(<App />);

      const editor = screen.getByTestId('main-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should integrate store-connected renderer', () => {
      render(<App />);

      const renderer = screen.getByTestId('main-renderer');
      expect(renderer).toBeInTheDocument();
    });

    it('should apply proper CSS classes for layout', () => {
      render(<App />);

      const appContainer = screen.getByText('OpenSCAD 3D Visualizer').closest('.app-container');
      expect(appContainer).toHaveClass('h-screen', 'w-screen', 'bg-gray-900');

      const editorPanel = screen.getByText('OpenSCAD Code Editor').closest('.editor-panel');
      expect(editorPanel).toHaveClass('bg-gray-900', 'border-r', 'border-gray-700');

      const rendererPanel = screen.getByText('3D Visualization').closest('.renderer-panel');
      expect(rendererPanel).toHaveClass('bg-gray-900', 'flex', 'flex-col');
    });
  });

  describe('Responsive Layout', () => {
    it('should have default 50/50 split layout', () => {
      render(<App />);

      const editorPanel = screen.getByText('OpenSCAD Code Editor').closest('.editor-panel');
      const rendererPanel = screen.getByText('3D Visualization').closest('.renderer-panel');

      expect(editorPanel).toHaveStyle({ width: '50%' });
      expect(rendererPanel).toHaveStyle({ width: '50%' });
    });
  });
});
