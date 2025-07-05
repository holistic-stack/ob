/**
 * Infinite Loop Fix Test
 *
 * Quick test to verify the useEffect infinite loop is resolved.
 * This test specifically checks for the "Maximum update depth exceeded" error.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useThreeRenderer } from './use-three-renderer.js';

// Stable mock functions to prevent infinite loops
const mockUpdateStoreMetrics = vi.fn();
const mockMarkDirty = vi.fn();
const mockUpdateStoreCamera = vi.fn();

// Minimal mocks to test the hook without complex dependencies
vi.mock('../../../shared/store/app.store.js', () => ({
  useAppStore: vi.fn((selector) => {
    // Return stable values for selectors
    if (selector === selectParsingAST || selector.name === 'selectParsingAST') return [];
    if (selector === selectRenderingCamera || selector.name === 'selectRenderingCamera')
      return null;
    if (selector === selectPerformanceMetrics || selector.name === 'selectPerformanceMetrics')
      return null;

    // Return stable action functions
    if (typeof selector === 'function') {
      const selectorStr = selector.toString();
      if (selectorStr.includes('updateMetrics')) return mockUpdateStoreMetrics;
      if (selectorStr.includes('markDirty')) return mockMarkDirty;
      if (selectorStr.includes('updateCamera')) return mockUpdateStoreCamera;
    }

    return vi.fn(); // Fallback
  }),
}));

// Mock the selector functions
const selectParsingAST = vi.fn();
const selectRenderingCamera = vi.fn();
const selectPerformanceMetrics = vi.fn();

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
  });

  it('should not cause infinite loop on initialization', () => {
    // This test will fail with "Maximum update depth exceeded" if the infinite loop exists
    expect(() => {
      const { result, unmount } = renderHook(() => useThreeRenderer());

      // Basic assertions to ensure hook works
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.meshes).toEqual([]);
      expect(result.current.actions).toBeDefined();

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
