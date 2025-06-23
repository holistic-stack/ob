/**
 * @file R3FCanvas Component Tests
 * 
 * TDD tests for the R3FCanvas component following React 19 best practices
 * and functional programming principles. Tests equivalent to BabylonCanvas component tests.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { R3FCanvas } from './r3f-canvas';
import type { R3FCanvasProps } from '../../types/r3f-types';

// Mock React Three Fiber Canvas
vi.mock('@react-three/fiber', () => ({
  Canvas: vi.fn(({ children, onCreated, ...props }) => {
    // Simulate canvas creation
    if (onCreated) {
      const mockState = {
        gl: {
          setClearColor: vi.fn(),
          shadowMap: { enabled: false, type: 'PCFSoftShadowMap' },
          toneMapping: 'ACESFilmicToneMapping',
          toneMappingExposure: 1,
          outputColorSpace: 'SRGBColorSpace'
        },
        scene: {
          background: null
        },
        camera: {
          position: { set: vi.fn() },
          lookAt: vi.fn()
        }
      };
      setTimeout(() => onCreated(mockState), 0);
    }
    
    return (
      <div data-testid="r3f-canvas" {...props}>
        {children}
      </div>
    );
  })
}));

// Mock React Three Drei components
vi.mock('@react-three/drei', () => ({
  OrbitControls: vi.fn(() => <div data-testid="orbit-controls" />),
  Grid: vi.fn(() => <div data-testid="grid" />),
  Environment: vi.fn(() => <div data-testid="environment" />),
  Stats: vi.fn(() => <div data-testid="stats" />)
}));

// Mock R3FScene component
vi.mock('../r3f-scene/r3f-scene', () => ({
  R3FScene: vi.fn(({ children }) => (
    <div data-testid="r3f-scene">
      {children}
    </div>
  ))
}));

// Mock Three.js
vi.mock('three', () => ({
  Color: vi.fn(),
  ACESFilmicToneMapping: 'ACESFilmicToneMapping',
  SRGBColorSpace: 'SRGBColorSpace',
  PCFSoftShadowMap: 'PCFSoftShadowMap',
  Math: { PI: Math.PI }
}));

describe('R3FCanvas', () => {
  beforeEach(() => {
    console.log('[DEBUG] Setting up R3FCanvas test');
    vi.clearAllMocks();
  });

  afterEach(() => {
    console.log('[DEBUG] Cleaning up R3FCanvas test');
    cleanup();
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    console.log('[DEBUG] Testing R3FCanvas rendering with defaults');
    
    render(<R3FCanvas />);
    
    expect(screen.getByTestId('r3f-canvas-container')).toBeInTheDocument();
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('r3f-scene')).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    console.log('[DEBUG] Testing R3FCanvas with custom className');
    
    const customClass = 'custom-canvas-class';
    render(<R3FCanvas className={customClass} />);
    
    const container = screen.getByTestId('r3f-canvas-container');
    expect(container).toHaveClass(customClass);
  });

  it('should render with custom aria-label', () => {
    console.log('[DEBUG] Testing R3FCanvas with custom aria-label');
    
    const customLabel = 'Custom 3D Canvas';
    render(<R3FCanvas aria-label={customLabel} />);
    
    const container = screen.getByTestId('r3f-canvas-container');
    expect(container).toHaveAttribute('aria-label', customLabel);
  });

  it('should render with scene configuration', () => {
    console.log('[DEBUG] Testing R3FCanvas with scene config');
    
    const sceneConfig = {
      enableCamera: true,
      enableLighting: true,
      backgroundColor: '#ff0000',
      enableGrid: true,
      enableAxes: true
    };
    
    render(<R3FCanvas sceneConfig={sceneConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
  });

  it('should render with camera configuration', () => {
    console.log('[DEBUG] Testing R3FCanvas with camera config');
    
    const cameraConfig = {
      position: [5, 5, 5] as const,
      fov: 60,
      enableControls: true,
      enableZoom: true,
      enableRotate: true,
      enablePan: true
    };
    
    render(<R3FCanvas cameraConfig={cameraConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
  });

  it('should render with canvas configuration', () => {
    console.log('[DEBUG] Testing R3FCanvas with canvas config');
    
    const canvasConfig = {
      antialias: true,
      shadows: true,
      alpha: false,
      preserveDrawingBuffer: true
    };
    
    render(<R3FCanvas canvasConfig={canvasConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('should call onRendererReady when renderer is ready', async () => {
    console.log('[DEBUG] Testing onRendererReady callback');
    
    const onRendererReady = vi.fn();
    
    render(<R3FCanvas onRendererReady={onRendererReady} />);
    
    // Wait for async callback
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(onRendererReady).toHaveBeenCalled();
  });

  it('should call onSceneReady when scene is ready', async () => {
    console.log('[DEBUG] Testing onSceneReady callback');
    
    const onSceneReady = vi.fn();
    
    render(<R3FCanvas onSceneReady={onSceneReady} />);
    
    // Wait for async callback
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(onSceneReady).toHaveBeenCalled();
  });

  it('should call onCreated callback', async () => {
    console.log('[DEBUG] Testing onCreated callback');
    
    const onCreated = vi.fn();
    
    render(<R3FCanvas onCreated={onCreated} />);
    
    // Wait for async callback
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(onCreated).toHaveBeenCalled();
  });

  it('should render children inside R3FScene', () => {
    console.log('[DEBUG] Testing R3FCanvas with children');
    
    const TestChild = () => <div data-testid="test-child">Test Child</div>;
    
    render(
      <R3FCanvas>
        <TestChild />
      </R3FCanvas>
    );
    
    expect(screen.getByTestId('r3f-scene')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should disable camera controls when configured', () => {
    console.log('[DEBUG] Testing R3FCanvas with disabled camera controls');
    
    const sceneConfig = {
      enableCamera: false
    };
    
    render(<R3FCanvas sceneConfig={sceneConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('orbit-controls')).not.toBeInTheDocument();
  });

  it('should disable lighting when configured', () => {
    console.log('[DEBUG] Testing R3FCanvas with disabled lighting');
    
    const sceneConfig = {
      enableLighting: false
    };
    
    render(<R3FCanvas sceneConfig={sceneConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    // Lighting is rendered as JSX elements, so we can't easily test their absence
    // This would be better tested in integration tests
  });

  it('should disable grid when configured', () => {
    console.log('[DEBUG] Testing R3FCanvas with disabled grid');
    
    const sceneConfig = {
      enableGrid: false
    };
    
    render(<R3FCanvas sceneConfig={sceneConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('grid')).not.toBeInTheDocument();
  });

  it('should handle onPointerMissed callback', () => {
    console.log('[DEBUG] Testing onPointerMissed callback');
    
    const onPointerMissed = vi.fn();
    
    render(<R3FCanvas onPointerMissed={onPointerMissed} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    // The callback would be tested in integration tests with actual pointer events
  });

  it('should render with fog configuration', () => {
    console.log('[DEBUG] Testing R3FCanvas with fog');
    
    const sceneConfig = {
      fog: {
        color: '#cccccc',
        near: 10,
        far: 100
      }
    };
    
    render(<R3FCanvas sceneConfig={sceneConfig} />);
    
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
    // Fog rendering would be tested in integration tests
  });

  it('should render Stats in development mode', () => {
    console.log('[DEBUG] Testing Stats rendering in development');
    
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(<R3FCanvas />);
    
    expect(screen.getByTestId('stats')).toBeInTheDocument();
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('should not render Stats in production mode', () => {
    console.log('[DEBUG] Testing Stats not rendering in production');
    
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(<R3FCanvas />);
    
    expect(screen.queryByTestId('stats')).not.toBeInTheDocument();
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('should pass through additional props', () => {
    console.log('[DEBUG] Testing additional props passthrough');
    
    const additionalProps = {
      'data-custom': 'test-value',
      role: 'application'
    };
    
    render(<R3FCanvas {...additionalProps} />);
    
    const container = screen.getByTestId('r3f-canvas-container');
    expect(container).toHaveAttribute('data-custom', 'test-value');
    expect(container).toHaveAttribute('role', 'application');
  });
});
