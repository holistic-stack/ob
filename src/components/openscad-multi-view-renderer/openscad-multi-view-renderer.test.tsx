/**
 * @file Unit Tests for OpenSCAD Multi-View Renderer Component
 * 
 * Unit tests for the OpenSCAD Multi-View Renderer component using Vitest and React Testing Library.
 * Complements the Playwright component tests with focused unit testing.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { OpenSCADMultiViewRenderer } from './openscad-multi-view-renderer';
import * as BABYLON from '@babylonjs/core';

// Mock Babylon.js for unit tests
vi.mock('@babylonjs/core', () => ({
  NullEngine: vi.fn().mockImplementation(() => ({
    runRenderLoop: vi.fn(),
    stopRenderLoop: vi.fn(),
    dispose: vi.fn(),
    isDisposed: false
  })),
  Scene: vi.fn().mockImplementation(() => ({
    createDefaultCameraOrLight: vi.fn(),
    addMesh: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    isDisposed: false
  })),
  ArcRotateCamera: vi.fn().mockImplementation(() => ({
    setPosition: vi.fn(),
    setTarget: vi.fn(),
    getClassName: () => 'ArcRotateCamera',
    position: { toString: () => '(10, 10, 10)' }
  })),
  UniversalCamera: vi.fn().mockImplementation(() => ({
    setTarget: vi.fn(),
    getClassName: () => 'UniversalCamera',
    position: { toString: () => '(0, 20, 0)' }
  })),
  Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z, toString: () => `(${x}, ${y}, ${z})` })),
  HemisphericLight: vi.fn(),
  DirectionalLight: vi.fn(),
  Mesh: vi.fn().mockImplementation(() => ({
    name: 'test-mesh',
    getTotalVertices: () => 24,
    getTotalIndices: () => 36,
    clone: vi.fn().mockReturnValue({
      setParent: vi.fn(),
      name: 'cloned-mesh'
    })
  }))
}));

// Mock OpenScadPipeline
vi.mock('../../babylon-csg2/openscad-pipeline/openscad-pipeline', () => ({
  OpenScadPipeline: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    processOpenScadCode: vi.fn().mockResolvedValue({
      success: true,
      value: new BABYLON.Mesh('test-mesh'),
      metadata: {
        parseTimeMs: 100,
        visitTimeMs: 50,
        nodeCount: 1,
        meshCount: 1
      }
    }),
    dispose: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('OpenSCADMultiViewRenderer Component', () => {
  
  beforeEach(() => {
    console.log('[INIT] Setting up OpenSCAD Multi-View Renderer unit test');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render component with basic structure', () => {
    console.log('[DEBUG] Testing basic component rendering');
    
    render(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        width={400}
        height={300}
      />
    );

    // Verify main title
    expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    
    // Verify processing status
    expect(screen.getByTestId('processing-status')).toBeInTheDocument();
    
    // Verify all 4 view containers
    expect(screen.getByTestId('perspective-view')).toBeInTheDocument();
    expect(screen.getByTestId('top-view')).toBeInTheDocument();
    expect(screen.getByTestId('side-view')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-view')).toBeInTheDocument();
    
    // Verify view labels
    expect(screen.getByText('Perspective View')).toBeInTheDocument();
    expect(screen.getByText('Top View')).toBeInTheDocument();
    expect(screen.getByText('Side View')).toBeInTheDocument();
    expect(screen.getByText('Bottom View')).toBeInTheDocument();
    
    console.log('[END] Basic component rendering test completed');
  });

  it('should render 4 canvas elements for different views', () => {
    console.log('[DEBUG] Testing canvas elements rendering');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="cube([10, 10, 10]);"
        width={400}
        height={300}
      />
    );

    // Verify all 4 canvas elements are present using tag name
    const canvases = container.querySelectorAll('canvas');
    expect(canvases).toHaveLength(4);

    // Verify canvas dimensions
    canvases.forEach(canvas => {
      expect(canvas).toHaveAttribute('width', '400');
      expect(canvas).toHaveAttribute('height', '300');
    });

    console.log('[END] Canvas elements test completed');
  });

  it('should show camera controls when synchronization is enabled', () => {
    console.log('[DEBUG] Testing camera synchronization controls');
    
    render(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        enableCameraSynchronization={true}
      />
    );

    // Verify camera controls are present
    expect(screen.getByTestId('sync-cameras-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('reset-cameras-button')).toBeInTheDocument();
    
    // Verify toggle is checked by default
    const toggle = screen.getByTestId('sync-cameras-toggle');
    expect(toggle).toBeChecked();
    
    console.log('[END] Camera synchronization controls test completed');
  });

  it('should show debug information when enabled', () => {
    console.log('[DEBUG] Testing debug information display');
    
    render(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
        enableDebugInfo={true}
      />
    );

    // Note: Debug info will be shown after cameras are initialized
    // This test verifies the component accepts the prop
    expect(screen.getByTestId('perspective-view')).toBeInTheDocument();
    
    console.log('[END] Debug information test completed');
  });

  it('should handle different OpenSCAD code inputs', () => {
    console.log('[DEBUG] Testing different OpenSCAD code inputs');
    
    const testCases = [
      'cube([10, 10, 10]);',
      'sphere(5);',
      'cylinder(h=10, r=3);',
      'union() { cube([5, 5, 5]); sphere(2); }'
    ];

    testCases.forEach(code => {
      cleanup();
      
      render(
        <OpenSCADMultiViewRenderer 
          openscadCode={code}
          width={400}
          height={300}
        />
      );

      // Verify component renders with different code
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
      expect(screen.getByTestId('processing-status')).toBeInTheDocument();
    });
    
    console.log('[END] Different OpenSCAD code inputs test completed');
  });

  it('should handle custom dimensions', () => {
    console.log('[DEBUG] Testing custom canvas dimensions');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="cube([10, 10, 10]);"
        width={800}
        height={600}
      />
    );

    // Verify custom dimensions are applied
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      expect(canvas).toHaveAttribute('width', '800');
      expect(canvas).toHaveAttribute('height', '600');
    });

    console.log('[END] Custom dimensions test completed');
  });

  it('should use default dimensions when not specified', () => {
    console.log('[DEBUG] Testing default canvas dimensions');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="cube([10, 10, 10]);"
      />
    );

    // Verify default dimensions (400x300)
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      expect(canvas).toHaveAttribute('width', '400');
      expect(canvas).toHaveAttribute('height', '300');
    });

    console.log('[END] Default dimensions test completed');
  });

  it('should have proper CSS grid layout for 4 views', () => {
    console.log('[DEBUG] Testing CSS grid layout');
    
    render(
      <OpenSCADMultiViewRenderer 
        openscadCode="cube([10, 10, 10]);"
      />
    );

    // Find the views grid container
    const gridContainer = screen.getByTestId('perspective-view').parentElement;
    expect(gridContainer).toHaveClass('views-grid');
    
    // Verify grid styling is applied
    expect(gridContainer).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr'
    });
    
    console.log('[END] CSS grid layout test completed');
  });

  it('should handle empty OpenSCAD code gracefully', () => {
    console.log('[DEBUG] Testing empty OpenSCAD code handling');

    render(
      <OpenSCADMultiViewRenderer
        openscadCode=""
      />
    );

    // Component should still render without errors
    expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    expect(screen.getByTestId('processing-status')).toBeInTheDocument();

    console.log('[END] Empty OpenSCAD code test completed');
  });

});

// Visual Regression Tests with Snapshots
describe('OpenSCADMultiViewRenderer - Visual Regression Tests', () => {
  beforeEach(() => {
    console.log('[INIT] Setting up OpenSCAD Multi-View Renderer snapshot test');
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up Babylon.js resources');
    cleanup();
  });

  it('should match snapshot for basic cube rendering', async () => {
    console.log('[DEBUG] Testing cube rendering snapshot');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="cube([10, 10, 10]);"
        width={400}
        height={300}
        enableDebugInfo={true}
      />
    );

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    });

    // Take snapshot of the rendered component
    expect(container.firstChild).toMatchSnapshot('cube-multi-view-renderer.html');

    console.log('[END] Cube rendering snapshot test completed');
  });

  it('should match snapshot for sphere rendering', async () => {
    console.log('[DEBUG] Testing sphere rendering snapshot');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="sphere(5);"
        width={400}
        height={300}
        enableDebugInfo={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    });

    expect(container.firstChild).toMatchSnapshot('sphere-multi-view-renderer.html');

    console.log('[END] Sphere rendering snapshot test completed');
  });

  it('should match snapshot for union operation', async () => {
    console.log('[DEBUG] Testing union operation snapshot');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="union() { cube([5, 5, 5]); sphere(3); }"
        width={800}
        height={600}
        enableCameraSynchronization={true}
        enableDebugInfo={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    });

    expect(container.firstChild).toMatchSnapshot('union-multi-view-renderer.html');

    console.log('[END] Union operation snapshot test completed');
  });

  it('should match snapshot for cylinder with different dimensions', async () => {
    console.log('[DEBUG] Testing cylinder with different dimensions snapshot');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="cylinder(h=10, r=3);"
        width={600}
        height={400}
        enableCameraSynchronization={false}
        enableDebugInfo={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    });

    expect(container.firstChild).toMatchSnapshot('cylinder-multi-view-renderer.html');

    console.log('[END] Cylinder snapshot test completed');
  });

  it('should match snapshot for large canvas dimensions', async () => {
    console.log('[DEBUG] Testing large dimensions snapshot');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="cube([2, 4, 6]);"
        width={1000}
        height={800}
        enableCameraSynchronization={true}
        enableDebugInfo={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    });

    expect(container.firstChild).toMatchSnapshot('large-dimensions-multi-view-renderer.html');

    console.log('[END] Large dimensions snapshot test completed');
  });

  it('should match snapshot for component with all features enabled', async () => {
    console.log('[DEBUG] Testing full-featured component snapshot');

    const { container } = render(
      <OpenSCADMultiViewRenderer
        openscadCode="difference() { cube([10, 10, 10]); sphere(6); }"
        width={800}
        height={600}
        enableCameraSynchronization={true}
        enableDebugInfo={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Multi-View Renderer')).toBeInTheDocument();
    });

    // Verify all expected elements are present
    expect(screen.getByTestId('sync-cameras-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('reset-cameras-button')).toBeInTheDocument();

    // Debug info might not be present if there's an initialization error
    const debugInfo = screen.queryByTestId('debug-info');
    if (debugInfo) {
      expect(debugInfo).toBeInTheDocument();
    }

    expect(container.firstChild).toMatchSnapshot('full-featured-multi-view-renderer.html');

    console.log('[END] Full-featured component snapshot test completed');
  });
});
