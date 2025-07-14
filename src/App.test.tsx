/**
 * Main Application Component Tests
 *
 * Tests for the integrated OpenSCAD 3D visualization application
 * that verifies proper integration of Monaco Editor and Three.js renderer.
 */

import { render, screen } from '@testing-library/react';
// TODO: Replace with BabylonJS types
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { ASTNode } from './features/openscad-parser/core/ast-types.js';
import { appStoreInstance } from './features/store/app-store';

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
      rendering: {
        meshes: [],
        isRendering: false,
        renderErrors: [],
        lastRendered: null,
        renderTime: 0,
        camera: {
          position: [10, 10, 10],
          target: [0, 0, 0],
          zoom: 1,
          fov: 75,
          near: 0.1,
          far: 1000,
          enableControls: true,
          enableAutoRotate: false,
          autoRotateSpeed: 1,
        },
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
        rendering: { ...appStoreInstance.getState().rendering, isRendering: true },
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
        rendering: { ...appStoreInstance.getState().rendering, meshes },
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
