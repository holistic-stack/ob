/**
 * @file BabylonJS Scene Component Tests
 *
 * Tests for BabylonJS scene component functionality.
 * Following TDD principles with React Testing Library and real BabylonJS NullEngine.
 */

import { Color3, Vector3 } from '@babylonjs/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BabylonScene } from './babylon-scene';

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window events
Object.defineProperty(window, 'addEventListener', { value: vi.fn(), writable: true });
Object.defineProperty(window, 'removeEventListener', { value: vi.fn(), writable: true });

// Mock BabylonJS Engine to prevent actual WebGL initialization in tests
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');
  return {
    ...actual,
    Engine: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      runRenderLoop: vi.fn(),
      resize: vi.fn(),
    })),
    Scene: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      render: vi.fn(),
      setActiveCameraByName: vi.fn(),
    })),
    ArcRotateCamera: vi.fn(),
    HemisphericLight: vi.fn(),
    DirectionalLight: vi.fn(),
    MeshBuilder: {
      CreateBox: vi.fn().mockReturnValue({
        position: { x: 0, y: 0, z: 0 },
      }),
    },
  };
});

// Mock hooks
vi.mock('../../hooks/use-babylon-inspector', () => ({
  useBabylonInspector: () => ({
    inspectorService: null,
    hideInspector: vi.fn(),
  }),
}));

// Mock logger
vi.mock('../../../../shared/services/logger.service', () => ({
  createLogger: () => ({
    init: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    end: vi.fn(),
  }),
}));

describe('BabylonScene', () => {
  it('should render canvas element', () => {
    render(<BabylonScene />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('aria-label', 'BabylonJS 3D Scene');
  });

  it('should render with custom className and style', () => {
    const customStyle = { width: '800px', height: '600px' };
    const customClass = 'custom-babylon-scene';

    render(<BabylonScene className={customClass} style={customStyle} />);

    const container = screen.getByRole('img').parentElement;
    expect(container).toHaveClass(customClass);
    expect(container).toHaveStyle(customStyle);
  });

  it('should accept configuration props', () => {
    const config = {
      enableWebGPU: false,
      antialias: false,
      backgroundColor: new Color3(1, 0, 0),
    };

    render(<BabylonScene config={config} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept camera configuration', () => {
    const camera = {
      type: 'arcRotate' as const,
      position: new Vector3(5, 5, 5),
      target: new Vector3(0, 0, 0),
    };

    render(<BabylonScene camera={camera} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept lighting configuration', () => {
    const lighting = {
      ambient: {
        enabled: true,
        color: new Color3(0.5, 0.5, 0.5),
        intensity: 0.8,
      },
      directional: {
        enabled: true,
        color: new Color3(1, 1, 1),
        intensity: 1.0,
        direction: new Vector3(-1, -1, -1),
      },
      environment: {
        enabled: false,
        intensity: 1.0,
      },
    };

    render(<BabylonScene lighting={lighting} />);

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });



  it('should accept orientation gizmo configuration', () => {
    const gizmoConfig = {
      enabled: true,
      position: 'bottom-left' as const,
      size: 120,
      enableTransitions: false,
    };

    render(
      <BabylonScene
        orientationGizmo={gizmoConfig}
        style={{ width: '800px', height: '600px' }}
      />
    );

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  it('should accept gizmo configuration', () => {
    const gizmoConfig = {
      enabled: true,
      position: 'top-left' as const,
      size: 80,
    };

    render(
      <BabylonScene
        orientationGizmo={gizmoConfig}
        style={{ width: '800px', height: '600px' }}
      />
    );

    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });
});
