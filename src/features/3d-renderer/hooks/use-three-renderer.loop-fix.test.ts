/**
 * Infinite Loop Fix Test
 *
 * Quick test to verify the useEffect infinite loop is resolved.
 * This test specifically checks for the "Maximum update depth exceeded" error.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useThreeRenderer } from './use-three-renderer.js';

// Mock Three.js renderer store with stable state - tracks if initialized
let mockIsInitialized = false;
const mockStoreState = {
  get scene() {
    return null;
  },
  get camera() {
    return null;
  },
  get renderer() {
    return null;
  },
  get isInitialized() {
    return mockIsInitialized;
  },
  isRendering: false,
  error: null,
  meshes: [],
  metrics: {
    renderTime: 0,
    parseTime: 0,
    memoryUsage: 0,
    frameRate: 60,
    operationId: 'initial',
    cpuTime: 0,
    peakMemoryUsage: 0,
    ioOperations: 0,
    networkRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    throughput: 0,
    errorRate: 0,
    meshCount: 0,
    triangleCount: 0,
    vertexCount: 0,
    drawCalls: 0,
    textureMemory: 0,
    bufferMemory: 0,
  },
  initializeRenderer: vi.fn(() => {
    mockIsInitialized = true;
  }),
  renderAST: vi.fn(),
  clearScene: vi.fn(),
  updateCamera: vi.fn(),
  resetCamera: vi.fn(),
  takeScreenshot: vi.fn(),
  updateMetrics: vi.fn(),
  setError: vi.fn(),
  dispose: vi.fn(() => {
    mockIsInitialized = false;
  }),
};

vi.mock('../store/three-renderer.store.js', () => ({
  useThreeRendererStore: vi.fn(() => mockStoreState),
}));

// Mock app store
vi.mock('../../store/index.js', () => ({
  useAppStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      const selectorStr = selector.toString();
      if (selectorStr.includes('selectParsingAST')) return [];
      if (selectorStr.includes('selectRenderingCamera')) return null;
      if (selectorStr.includes('updateCamera')) return vi.fn();
    }
    return null;
  }),
  selectParsingAST: vi.fn(),
  selectRenderingCamera: vi.fn(),
}));

// Mock the frame hook
vi.mock('./use-frame.js', () => ({
  useThreeFrame: vi.fn(),
}));

vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
    background: null,
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn() },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
    fov: 75,
    near: 0.1,
    far: 1000,
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setClearColor: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement('canvas'),
    shadowMap: { enabled: false, type: 'PCFSoftShadowMap' },
    outputColorSpace: 'SRGBColorSpace',
    toneMapping: 'ACESFilmicToneMapping',
  })),
  Color: vi.fn(() => ({})),
  PCFSoftShadowMap: 'PCFSoftShadowMap',
  SRGBColorSpace: 'SRGBColorSpace',
  ACESFilmicToneMapping: 'ACESFilmicToneMapping',
}));

vi.mock('../services/primitive-renderer.js', () => ({
  renderASTNode: vi.fn().mockResolvedValue({
    success: true,
    data: {
      mesh: { dispose: vi.fn() },
      dispose: vi.fn(),
      metadata: { triangleCount: 0, vertexCount: 0 },
    },
  }),
}));

describe('useThreeRenderer Infinite Loop Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsInitialized = false; // Reset state between tests
  });

  it('should not cause infinite loop on initialization', () => {
    // This test will fail with "Maximum update depth exceeded" if the infinite loop exists
    expect(() => {
      const { result, unmount } = renderHook(() => useThreeRenderer());

      // The hook should render successfully without infinite loops
      expect(result.current.meshes).toEqual([]);
      expect(result.current.actions).toBeDefined();
      expect(result.current.sceneRef).toBeDefined();
      expect(result.current.cameraRef).toBeDefined();
      expect(result.current.rendererRef).toBeDefined();
      // Note: isInitialized may be true or false depending on when useEffect runs
      expect(typeof result.current.isInitialized).toBe('boolean');

      unmount();
    }).not.toThrow();
  });

  it('should handle multiple renders without infinite loops', () => {
    // Test multiple hook instances to ensure no accumulated state issues
    for (let i = 0; i < 3; i++) {
      expect(() => {
        const { unmount } = renderHook(() => useThreeRenderer());
        unmount();
      }).not.toThrow();
    }
  });
});
