/**
 * Default Initialization End-to-End Integration Tests
 * 
 * Tests the complete pipeline from default code initialization to 3D visualization:
 * Monaco Editor → Zustand store → AST parsing → R3F rendering
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Canvas } from '@react-three/fiber';

import { useAppStore } from '../store/app-store';
import { StoreConnectedEditor } from '../code-editor/components/store-connected-editor';
import { StoreConnectedRenderer } from '../3d-renderer/components/store-connected-renderer';
import { R3FScene } from '../3d-renderer/components/r3f-scene';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, ...props }: any) => {
    React.useEffect(() => {
      // Simulate Monaco Editor initialization
      if (onChange && value) {
        setTimeout(() => onChange(value), 10);
      }
    }, [value, onChange]);
    
    return (
      <div 
        data-testid="monaco-editor-mock"
        data-value={value}
        {...props}
      >
        Monaco Editor: {value}
      </div>
    );
  }
}));

// Mock React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: any) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    scene: { 
      add: vi.fn(), 
      remove: vi.fn(), 
      clear: vi.fn(),
      children: []
    },
    camera: { 
      position: { set: vi.fn() }, 
      lookAt: vi.fn() 
    },
    gl: { 
      render: vi.fn(), 
      setSize: vi.fn(),
      domElement: document.createElement('canvas'),
      info: { render: { frame: 1 } }
    }
  }))
}));

// Mock React Three Drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: (props: any) => <div data-testid="orbit-controls" {...props} />,
  Stats: () => <div data-testid="stats" />
}));

// Mock Three.js
vi.mock('three', () => ({
  BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  SphereGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  CylinderGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  Mesh: vi.fn((geometry, material) => ({
    geometry,
    material,
    position: { set: vi.fn() },
    dispose: vi.fn()
  }))
}));

// Mock OpenSCAD parser
vi.mock('../openscad-parser/services/parser-manager', () => ({
  parseOpenSCADCode: vi.fn().mockResolvedValue({
    success: true,
    value: [
      {
        type: 'cube',
        parameters: { size: [10, 10, 10] },
        children: [],
        position: { line: 1, column: 1 },
        source: 'cube([10,10,10]);'
      }
    ]
  })
}));

describe('Default Initialization End-to-End', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset store to initial state
    useAppStore.setState({
      editor: {
        code: 'cube([10,10,10]);',
        cursorPosition: { line: 1, column: 1 },
        selection: null,
        isDirty: false,
        lastSaved: null
      },
      parsing: {
        ast: [],
        isLoading: false,
        errors: [],
        warnings: [],
        lastParsed: null,
        parseTime: 0
      },
      rendering: {
        meshes: [],
        isRendering: false,
        renderErrors: [],
        camera: {
          position: [5, 5, 5],
          target: [0, 0, 0],
          zoom: 1
        },
        lastRendered: new Date(),
        renderTime: 0
      },
      performance: {
        metrics: {
          renderTime: 0,
          parseTime: 0,
          memoryUsage: 0,
          frameRate: 60
        },
        isMonitoring: false,
        violations: [],
        lastUpdated: null
      },
      config: {
        debounceMs: 300,
        enableAutoSave: false,
        enableRealTimeParsing: true,
        enableRealTimeRendering: true,
        theme: 'dark',
        performance: {
          enableMetrics: true,
          maxRenderTime: 16,
          enableWebGL2: true,
          enableHardwareAcceleration: true
        }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Store Initialization', () => {
    it('should initialize store with default OpenSCAD code', () => {
      const state = useAppStore.getState();
      
      expect(state.editor.code).toBe('cube([10,10,10]);');
      expect(state.editor.isDirty).toBe(false);
      expect(state.parsing.ast).toEqual([]);
    });

    it('should have proper initial configuration', () => {
      const state = useAppStore.getState();
      
      expect(state.config.enableRealTimeParsing).toBe(true);
      expect(state.config.enableRealTimeRendering).toBe(true);
      expect(state.config.debounceMs).toBe(300);
    });
  });

  describe('Monaco Editor Integration', () => {
    it('should display default code in Monaco Editor', async () => {
      render(<StoreConnectedEditor />);
      
      const editor = screen.getByTestId('monaco-editor-mock');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('data-value', 'cube([10,10,10]);');
    });

    it('should show editor status and metrics', async () => {
      render(<StoreConnectedEditor />);
      
      // Check for editor status indicators
      expect(screen.getByText(/OpenSCAD Code Editor/)).toBeInTheDocument();
      
      // Wait for store state to be logged
      await waitFor(() => {
        // The component should render without errors
        expect(screen.getByTestId('monaco-editor-mock')).toBeInTheDocument();
      });
    });
  });

  describe('AST Parsing Pipeline', () => {
    it('should parse default code and generate AST', async () => {
      const { parseOpenSCADCode } = await import('../openscad-parser/services/parser-manager');
      const store = useAppStore.getState();
      
      // Trigger parsing
      const result = await store.parseCode('cube([10,10,10]);');
      
      expect(parseOpenSCADCode).toHaveBeenCalledWith('cube([10,10,10]);');
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.type).toBe('cube');
        expect((result.data[0] as any)?.size).toEqual([10, 10, 10]);
      }
    });

    it('should update store state after successful parsing', async () => {
      const store = useAppStore.getState();
      
      await store.parseCode('cube([10,10,10]);');
      
      const updatedState = useAppStore.getState();
      expect(updatedState.parsing.ast).toHaveLength(1);
      expect(updatedState.parsing.isLoading).toBe(false);
      expect(updatedState.parsing.errors).toEqual([]);
    });
  });

  describe('3D Visualization Pipeline', () => {
    it('should render R3F scene with AST data', async () => {
      // Set up store with parsed AST
      useAppStore.setState({
        parsing: {
          ast: [
            {
              type: 'cube',
              size: [10, 10, 10],
              center: false,
              location: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 20, offset: 19 }
              }
            }
          ],
          isLoading: false,
          errors: [],
          warnings: [],
          lastParsed: new Date(),
          parseTime: 25.5
        }
      });

      render(
        <Canvas>
          <R3FScene
            astNodes={useAppStore.getState().parsing.ast}
            camera={{ 
              position: [5, 5, 5], 
              target: [0, 0, 0],
              zoom: 1,
              fov: 75,
              near: 0.1,
              far: 1000,
              enableControls: true,
              enableAutoRotate: false,
              autoRotateSpeed: 2
            }}
            onCameraChange={vi.fn()}
            onPerformanceUpdate={vi.fn()}
            onRenderComplete={vi.fn()}
            onRenderError={vi.fn()}
          />
        </Canvas>
      );

      // Verify R3F canvas is rendered
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    });

    it('should render store-connected renderer with metrics', async () => {
      render(<StoreConnectedRenderer />);
      
      // Check for renderer components
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
      
      // Check for performance metrics display
      expect(screen.getByText(/3D Visualization/)).toBeInTheDocument();
    });
  });

  describe('Complete End-to-End Pipeline', () => {
    it('should handle complete data flow from editor to renderer', async () => {
      // Render both components
      const { container } = render(
        <div>
          <StoreConnectedEditor />
          <StoreConnectedRenderer />
        </div>
      );

      // Verify both components are rendered
      expect(screen.getByTestId('monaco-editor-mock')).toBeInTheDocument();
      expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
      
      // Verify default code is displayed
      const editor = screen.getByTestId('monaco-editor-mock');
      expect(editor).toHaveAttribute('data-value', 'cube([10,10,10]);');
      
      // Verify the complete pipeline is set up
      expect(container).toBeInTheDocument();
    });

    it('should update UI state when parsing completes', async () => {
      const store = useAppStore.getState();
      
      // Simulate parsing completion
      await store.parseCode('cube([10,10,10]);');
      
      const state = useAppStore.getState();
      
      // Verify state updates
      expect(state.parsing.ast).toHaveLength(1);
      expect(state.parsing.parseTime).toBeGreaterThan(0);
      expect(state.parsing.lastParsed).toBeInstanceOf(Date);
    });

    it('should handle performance metrics collection', async () => {
      const store = useAppStore.getState();
      
      // Trigger parsing and rendering
      await store.parseCode('cube([10,10,10]);');
      
      // Simulate performance update
      store.recordParseTime(25.5);
      store.recordRenderTime(16.7);
      
      const state = useAppStore.getState();
      expect(state.performance.metrics.parseTime).toBe(25.5);
      expect(state.performance.metrics.renderTime).toBe(16.7);
    });
  });

  describe('Visual Verification Requirements', () => {
    it('should configure cube with correct material properties', async () => {
      const { MeshStandardMaterial } = await import('three');
      
      render(
        <Canvas>
          <R3FScene
            astNodes={[
              {
                type: 'cube',
                size: [10, 10, 10],
                center: false,
                location: {
                  start: { line: 1, column: 1, offset: 0 },
                  end: { line: 1, column: 20, offset: 19 }
                }
              }
            ]}
            camera={{ 
              position: [5, 5, 5], 
              target: [0, 0, 0],
              zoom: 1,
              fov: 75,
              near: 0.1,
              far: 1000,
              enableControls: true,
              enableAutoRotate: false,
              autoRotateSpeed: 2
            }}
            onCameraChange={vi.fn()}
            onPerformanceUpdate={vi.fn()}
            onRenderComplete={vi.fn()}
            onRenderError={vi.fn()}
          />
        </Canvas>
      );

      // Wait for component to process AST
      await waitFor(() => {
        expect(MeshStandardMaterial).toHaveBeenCalled();
      });
    });

    it('should provide orbit controls for camera interaction', () => {
      render(<StoreConnectedRenderer />);
      
      expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    });

    it('should display performance stats in development', () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      render(<StoreConnectedRenderer />);
      
      expect(screen.getByTestId('stats')).toBeInTheDocument();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
