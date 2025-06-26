/**
 * Main Application Component Tests
 * 
 * Tests for the integrated OpenSCAD 3D visualization application
 * that verifies proper integration of Monaco Editor and Three.js renderer.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import App from './App';

// Mock the store-connected components
vi.mock('./features/code-editor/components/store-connected-editor', () => ({
  StoreConnectedEditor: ({ className, 'data-testid': testId }: any) => (
    <div 
      className={className}
      data-testid={testId || 'store-connected-editor-mock'}
    >
      <div data-testid="editor-mock-content">Monaco Editor Mock</div>
    </div>
  )
}));

vi.mock('./features/3d-renderer/components/store-connected-renderer', () => ({
  StoreConnectedRenderer: ({ className, 'data-testid': testId }: any) => (
    <div 
      className={className}
      data-testid={testId || 'store-connected-renderer-mock'}
    >
      <div data-testid="renderer-mock-content">Three.js Renderer Mock</div>
    </div>
  )
}));

// Mock store state
const mockStoreState = {
  application: {
    status: 'idle'
  },
  editor: {
    code: ''
  },
  parsing: {
    ast: []
  },
  rendering: {
    isRendering: false,
    meshes: [],
    renderErrors: []
  },
  performance: {
    metrics: {
      renderTime: 0,
      parseTime: 0,
      memoryUsage: 0
    }
  }
};

// Mock the store
vi.mock('./features/store/app-store', () => ({
  useAppStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      // Handle selectors
      const selectorName = selector.name;
      if (selectorName === 'selectApplicationStatus') return mockStoreState.application.status;
      if (selectorName === 'selectEditorCode') return mockStoreState.editor.code;
      if (selectorName === 'selectParsingAST') return mockStoreState.parsing.ast;
      if (selectorName === 'selectRenderingState') return mockStoreState.rendering;
      if (selectorName === 'selectPerformanceMetrics') return mockStoreState.performance.metrics;
      
      // Handle action selectors - return mock functions
      return vi.fn();
    }
    return vi.fn();
  })
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    mockStoreState.application.status = 'idle';
    mockStoreState.editor.code = '';
    mockStoreState.parsing.ast = [];
    mockStoreState.rendering.isRendering = false;
    mockStoreState.rendering.meshes = [];
    mockStoreState.rendering.renderErrors = [];
    mockStoreState.performance.metrics = { renderTime: 0, parseTime: 0, memoryUsage: 0 };
  });

  describe('Application Layout', () => {
    it('should render main application with header and panels', () => {
      render(<App />);
      
      // Check header
      expect(screen.getByText('OpenSCAD 3D Visualizer')).toBeInTheDocument();
      expect(screen.getByText('Idle')).toBeInTheDocument();
      
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
      mockStoreState.application.status = 'working';
      
      render(<App />);
      
      expect(screen.getByText('Working')).toBeInTheDocument();
    });

    it('should display metrics in header', () => {
      mockStoreState.parsing.ast = [{}, {}] as any[];
      mockStoreState.rendering.meshes = [{}, {}, {}] as any[];
      mockStoreState.performance.metrics.renderTime = 15.5;
      
      render(<App />);
      
      expect(screen.getByText('AST: 2 nodes')).toBeInTheDocument();
      expect(screen.getByText('Meshes: 3')).toBeInTheDocument();
      expect(screen.getByText('Render: 15.5ms')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate store-connected editor', () => {
      render(<App />);
      
      const editor = screen.getByTestId('main-editor');
      expect(editor).toBeInTheDocument();
      expect(screen.getByTestId('editor-mock-content')).toBeInTheDocument();
      expect(screen.getByText('Monaco Editor Mock')).toBeInTheDocument();
    });

    it('should integrate store-connected renderer', () => {
      render(<App />);
      
      const renderer = screen.getByTestId('main-renderer');
      expect(renderer).toBeInTheDocument();
      expect(screen.getByTestId('renderer-mock-content')).toBeInTheDocument();
      expect(screen.getByText('Three.js Renderer Mock')).toBeInTheDocument();
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
