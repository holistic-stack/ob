/**
 * Integration Test Setup
 * 
 * Global setup and configuration for integration tests including mocks,
 * performance monitoring, and test utilities for the OpenSCAD 3D visualization pipeline.
 * 
 * @author OpenSCAD-R3F Pipeline
 * @version 1.0.0
 */

import React from 'react';
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';

// ============================================================================
// Global Test Configuration
// ============================================================================

// Increase timeout for integration tests
vi.setConfig({ testTimeout: 30000 });

// ============================================================================
// Performance Monitoring Setup
// ============================================================================

// Mock performance API for consistent testing
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  },
  writable: true
});

// ============================================================================
// Three.js Mocking
// ============================================================================

// Mock Three.js for integration tests
vi.mock('three', () => ({
  Scene: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    dispose: vi.fn(),
    children: []
  })),
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn()
  })),
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    render: vi.fn(),
    dispose: vi.fn(),
    setSize: vi.fn(),
    domElement: document.createElement('canvas')
  })),
  Mesh: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn(), x: 0, y: 0, z: 0 },
    rotation: { set: vi.fn(), x: 0, y: 0, z: 0 },
    scale: { set: vi.fn(), x: 1, y: 1, z: 1 },
    dispose: vi.fn()
  })),
  FreeCamera: vi.fn().mockImplementation(() => ({
    setTarget: vi.fn(),
    position: { x: 0, y: 0, z: 0 },
    attachToCanvas: vi.fn()
  })),
  HemisphericLight: vi.fn().mockImplementation(() => ({
    intensity: 1
  })),
  DirectionalLight: vi.fn().mockImplementation(() => ({
    intensity: 1,
    direction: { x: 0, y: -1, z: 0 }
  })),
  MeshBuilder: {
    CreateBox: vi.fn(() => ({
      name: 'test-box',
      position: { x: 0, y: 0, z: 0 },
      dispose: vi.fn(),
      freezeWorldMatrix: vi.fn(),
      freezeNormals: vi.fn(),
      material: null,
      geometry: { dispose: vi.fn() },
      isDisposed: false,
      getBoundingInfo: vi.fn(() => ({
        boundingBox: {
          extendSize: { length: vi.fn(() => 5) }
        }
      })),
      cullingStrategy: 0,
      occlusionQueryAlgorithmType: 0,
      alwaysSelectAsActiveMesh: false
    })),
    CreateSphere: vi.fn(() => ({
      name: 'test-sphere',
      position: { x: 0, y: 0, z: 0 },
      dispose: vi.fn(),
      freezeWorldMatrix: vi.fn(),
      freezeNormals: vi.fn(),
      material: null,
      geometry: { dispose: vi.fn() },
      isDisposed: false,
      getBoundingInfo: vi.fn(() => ({
        boundingBox: {
          extendSize: { length: vi.fn(() => 5) }
        }
      })),
      cullingStrategy: 0,
      occlusionQueryAlgorithmType: 0,
      alwaysSelectAsActiveMesh: false
    })),
    CreateCylinder: vi.fn(() => ({
      name: 'test-cylinder',
      position: { x: 0, y: 0, z: 0 },
      dispose: vi.fn(),
      freezeWorldMatrix: vi.fn(),
      freezeNormals: vi.fn(),
      material: null,
      geometry: { dispose: vi.fn() },
      isDisposed: false,
      getBoundingInfo: vi.fn(() => ({
        boundingBox: {
          extendSize: { length: vi.fn(() => 5) }
        }
      })),
      cullingStrategy: 0,
      occlusionQueryAlgorithmType: 0,
      alwaysSelectAsActiveMesh: false
    }))
  },
  StandardMaterial: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    freeze: vi.fn()
  })),
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  Color3: vi.fn().mockImplementation((r = 0, g = 0, b = 0) => ({ r, g, b })),
  Color4: vi.fn().mockImplementation((r = 0, g = 0, b = 0, a = 1) => ({ r, g, b, a })),
  AbstractMesh: {
    CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY: 0,
    OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE: 0
  },
  InitializeCSG2Async: vi.fn().mockResolvedValue(undefined)
}));

// ============================================================================
// Monaco Editor Mocking
// ============================================================================

vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ onChange, value, onMount }) => {
    const mockEditor = {
      getValue: vi.fn(() => value),
      setValue: vi.fn(),
      getModel: vi.fn(() => ({
        getLanguageId: vi.fn(() => 'openscad'),
        onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() }))
      })),
      onDidDispose: vi.fn(() => ({ dispose: vi.fn() }))
    };

    const mockMonaco = {
      editor: {
        setModelLanguage: vi.fn(),
        setTheme: vi.fn()
      }
    };

    React.useEffect(() => {
      if (onMount) {
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return React.createElement('div', {
      'data-testid': 'monaco-editor-mock',
      onChange: (e: any) => onChange?.(e.target.value),
      defaultValue: value
    });
  })
}));

// ============================================================================
// OpenSCAD Parser Mocking
// ============================================================================

vi.mock('@holistic-stack/openscad-parser', () => ({
  ASTNode: {},
  parseAST: vi.fn(),
  EnhancedOpenscadParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn().mockResolvedValue({
      success: true,
      value: [],
      error: null
    })
  })),
  SimpleErrorHandler: vi.fn()
}));

// ============================================================================
// Three.js CSG Mocking
// ============================================================================

vi.mock('three-csg-ts', () => ({
  CSG: {
    fromMesh: vi.fn().mockReturnValue({
      union: vi.fn().mockReturnThis(),
      subtract: vi.fn().mockReturnThis(),
      intersect: vi.fn().mockReturnThis(),
      toMesh: vi.fn().mockReturnValue(null)
    })
  }
}));

// ============================================================================
// Console Mocking for Clean Test Output
// ============================================================================

const originalConsole = { ...console };

beforeAll(() => {
  // Mock console methods to reduce noise in tests
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.debug = vi.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset performance monitoring
  if (window.performance) {
    vi.mocked(window.performance.now).mockReturnValue(Date.now());
  }
  
  // Reset DOM
  document.body.innerHTML = '';
});

afterEach(() => {
  // Cleanup React components
  cleanup();
  
  // Clear any pending timers
  vi.clearAllTimers();
  
  // Reset modules
  vi.resetModules();
});

// ============================================================================
// Global Test Utilities
// ============================================================================

// Add custom matchers for integration tests
expect.extend({
  toBeWithinPerformanceTarget(received: number, target: number) {
    const pass = received <= target;
    return {
      message: () =>
        pass
          ? `Expected ${received}ms to exceed performance target of ${target}ms`
          : `Expected ${received}ms to be within performance target of ${target}ms`,
      pass
    };
  },

  toHaveValidAST(received: any) {
    const pass = Array.isArray(received) && received.every(node => 
      node && typeof node === 'object' && typeof node.type === 'string'
    );
    return {
      message: () =>
        pass
          ? `Expected AST to be invalid`
          : `Expected valid AST structure with type property on all nodes`,
      pass
    };
  }
});

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface AsymmetricMatchersContaining {
    toBeWithinPerformanceTarget(target: number): any;
    toHaveValidAST(): any;
  }
}

// ============================================================================
// Test Data Factories
// ============================================================================

export const createMockASTNode = (type: string, props: Record<string, any> = {}) => ({
  type,
  ...props
});

export const createMockParseError = (message: string, line: number = 1, column: number = 1) => ({
  message,
  line,
  column,
  severity: 'error' as const
});

export const createMockPerformanceMetrics = (operation: string, duration: number = 100) => ({
  operation,
  startTime: Date.now() - duration,
  endTime: Date.now(),
  duration,
  target: 300,
  withinTarget: duration <= 300,
  timestamp: Date.now()
});

// ============================================================================
// Test Environment Validation
// ============================================================================

// Validate test environment setup
if (typeof window === 'undefined') {
  throw new Error('Integration tests require a browser-like environment');
}

if (!window.performance) {
  throw new Error('Performance API is required for integration tests');
}

console.log('[Test Setup] Integration test environment initialized successfully');
