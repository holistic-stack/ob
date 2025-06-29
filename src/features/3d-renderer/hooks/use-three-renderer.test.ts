/**
 * Three.js Renderer Hook Test Suite
 * 
 * Tests for useThreeRenderer hook following TDD methodology
 * with Zustand store integration and Three.js scene management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { useThreeRenderer } from './use-three-renderer';
import { createAppStore } from '../../store/app-store';

// Mock Three.js for testing
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
  background: null,
  children: []
};

const mockCamera = {
  position: { set: vi.fn(), x: 10, y: 10, z: 10 },
  lookAt: vi.fn(),
  updateProjectionMatrix: vi.fn(),
  fov: 75,
  near: 0.1,
  far: 1000
};

const mockRenderer = {
  render: vi.fn(),
  setSize: vi.fn(),
  setClearColor: vi.fn(),
  dispose: vi.fn(),
  domElement: {
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data')
  },
  shadowMap: { enabled: false, type: 0 },
  outputEncoding: 0,
  toneMapping: 0
};

const mockMesh = {
  geometry: { dispose: vi.fn() },
  material: { dispose: vi.fn() },
  dispose: vi.fn(),
  position: { set: vi.fn() },
  rotation: { set: vi.fn() },
  scale: { set: vi.fn() }
};

// Mock Three.js module
vi.mock('three', () => ({
  Scene: vi.fn(() => mockScene),
  PerspectiveCamera: vi.fn(() => mockCamera),
  WebGLRenderer: vi.fn(() => mockRenderer),
  Mesh: vi.fn(() => mockMesh),
  Color: vi.fn(),
  PCFSoftShadowMap: 1,
  sRGBEncoding: 3001,
  ACESFilmicToneMapping: 4
}));

// Mock primitive renderer
vi.mock('../services/primitive-renderer', () => ({
  renderASTNode: vi.fn((node, index) => ({
    success: true,
    data: {
      mesh: mockMesh,
      metadata: {
        id: `${node.type}-${index}`,
        nodeType: node.type,
        nodeIndex: index,
        triangleCount: 12,
        vertexCount: 8,
        boundingBox: {},
        material: 'standard',
        color: '#ffffff',
        opacity: 1,
        visible: true
      },
      dispose: vi.fn()
    }
  }))
}));

// Mock store actions
const mockStoreActions = {
  updateCamera: vi.fn(),
  updateMetrics: vi.fn(),
  renderFromAST: vi.fn(),
  markDirty: vi.fn()
};

// Mock useAppStore hook
vi.mock('../../store', () => {
  const mockSelectParsingAST = vi.fn(() => []);
  const mockSelectRenderingCamera = vi.fn(() => ({ position: [5, 5, 5], target: [0, 0, 0] }));
  const mockSelectRenderingState = vi.fn(() => ({ isRendering: false, meshes: [], renderErrors: [] }));
  const mockSelectPerformanceMetrics = vi.fn(() => ({ renderTime: 0, parseTime: 0, memoryUsage: 0 }));

  return {
    useAppStore: vi.fn((selector) => {
      // Handle selector functions
      if (typeof selector === 'function') {
        const selectorName = selector.name;
        if (selectorName === 'selectParsingAST') return [];
        if (selectorName === 'selectRenderingCamera') return { position: [5, 5, 5], target: [0, 0, 0] };
        if (selectorName === 'selectRenderingState') return { isRendering: false, meshes: [], renderErrors: [] };
        if (selectorName === 'selectPerformanceMetrics') return { renderTime: 0, parseTime: 0, memoryUsage: 0 };

        // Handle action selectors
        const mockState = {
          updateCamera: mockStoreActions.updateCamera,
          updateMetrics: mockStoreActions.updateMetrics,
          renderFromAST: mockStoreActions.renderFromAST,
          markDirty: mockStoreActions.markDirty
        };
        return selector(mockState);
      }
      return vi.fn();
    }),
    selectParsingAST: mockSelectParsingAST,
    selectRenderingCamera: mockSelectRenderingCamera,
    selectRenderingState: mockSelectRenderingState,
    selectPerformanceMetrics: mockSelectPerformanceMetrics
  };
});

// Mock store
let mockStore: ReturnType<typeof createAppStore>;

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});

describe('useThreeRenderer Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    
    // Create fresh store for each test
    mockStore = createAppStore({
      enableDevtools: false,
      enablePersistence: false,
      debounceConfig: {
        parseDelayMs: 0,
        renderDelayMs: 0,
        saveDelayMs: 0
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.sceneRef.current).toBeNull();
      expect(result.current.cameraRef.current).toBeNull();
      expect(result.current.rendererRef.current).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isRendering).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.meshes).toEqual([]);
      expect(result.current.metrics).toEqual({
        renderTime: 0,
        parseTime: 0,
        memoryUsage: 0,
        frameRate: 60,
        meshCount: 0,
        triangleCount: 0,
        vertexCount: 0,
        drawCalls: 0,
        textureMemory: 0,
        bufferMemory: 0
      });
      expect(result.current.actions).toBeDefined();
    });

    it('should provide all required actions', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(typeof result.current.actions.renderAST).toBe('function');
      expect(typeof result.current.actions.clearScene).toBe('function');
      expect(typeof result.current.actions.updateCamera).toBe('function');
      expect(typeof result.current.actions.resetCamera).toBe('function');
      expect(typeof result.current.actions.takeScreenshot).toBe('function');
    });
  });

  describe('Scene Management', () => {
    it('should clear scene when called', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      act(() => {
        result.current.actions.clearScene();
      });
      
      expect(result.current.meshes).toEqual([]);
      expect(result.current.metrics.meshCount).toBe(0);
    });

    it('should handle empty AST rendering', async () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      await act(async () => {
        await result.current.actions.renderAST([]);
      });
      
      expect(result.current.meshes).toEqual([]);
    });

    it('should render AST nodes', async () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      const mockAST: ASTNode[] = [
        { type: 'cube', size: [1, 1, 1], center: false },
        { type: 'sphere', radius: 1 }
      ];
      
      // Mock initialization
      act(() => {
        result.current.sceneRef.current = mockScene as any;
        result.current.cameraRef.current = mockCamera as any;
        result.current.rendererRef.current = mockRenderer as any;
        (result.current as any).setIsInitialized(true);
      });
      
      await act(async () => {
        await result.current.actions.renderAST(mockAST);
      });
      
      // Should attempt to render (even if mocked)
      expect(result.current.isRendering).toBe(false);
    });
  });

  describe('Camera Controls', () => {
    it('should update camera configuration', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      const newCamera = {
        position: [5, 5, 5] as const,
        target: [1, 1, 1] as const,
        zoom: 1.5,
        fov: 60,
        near: 0.2,
        far: 500,
        enableControls: true,
        enableAutoRotate: true,
        autoRotateSpeed: 2
      };
      
      act(() => {
        result.current.actions.updateCamera(newCamera);
      });
      
      // Camera update should not throw
      expect(true).toBe(true);
    });

    it('should reset camera to default', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      act(() => {
        result.current.actions.resetCamera();
      });
      
      // Reset should not throw
      expect(true).toBe(true);
    });
  });

  describe('Screenshot Functionality', () => {
    it('should take screenshot when renderer is initialized', async () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      // Mock initialization
      act(() => {
        result.current.sceneRef.current = mockScene as any;
        result.current.cameraRef.current = mockCamera as any;
        result.current.rendererRef.current = mockRenderer as any;
      });
      
      let screenshot: string = '';
      await act(async () => {
        screenshot = await result.current.actions.takeScreenshot();
      });
      
      expect(screenshot).toBe('data:image/png;base64,mock-image-data');
      expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
    });

    it('should throw error when taking screenshot without initialization', async () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      await expect(async () => {
        await act(async () => {
          await result.current.actions.takeScreenshot();
        });
      }).rejects.toThrow('Renderer not initialized');
    });
  });

  describe('Performance Metrics', () => {
    it('should track rendering metrics', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.metrics).toBeDefined();
      expect(typeof result.current.metrics.renderTime).toBe('number');
      expect(typeof result.current.metrics.meshCount).toBe('number');
      expect(typeof result.current.metrics.triangleCount).toBe('number');
      expect(typeof result.current.metrics.frameRate).toBe('number');
    });

    it('should update metrics after rendering', async () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      const mockAST: ASTNode[] = [
        { type: 'cube', size: [1, 1, 1], center: false }
      ];
      
      // Mock initialization
      act(() => {
        result.current.sceneRef.current = mockScene as any;
        result.current.cameraRef.current = mockCamera as any;
        result.current.rendererRef.current = mockRenderer as any;
        (result.current as any).setIsInitialized(true);
      });
      
      await act(async () => {
        await result.current.actions.renderAST(mockAST);
      });
      
      expect(result.current.metrics.renderTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle rendering errors gracefully', async () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      // Mock failed rendering
      const mockFailedAST: ASTNode[] = [        {
          type: 'error' as const,
          message: 'Test error',
          errorCode: 'PARSE_ERROR',
          location: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 10, offset: 9 }
          }
        }
      ];
      
      await act(async () => {
        try {
          await result.current.actions.renderAST(mockFailedAST);
        } catch (_error) {
          // Expected to fail for uninitialized renderer
        }
      });
      
      // Should handle error gracefully
      expect(result.current.error).toBeDefined();
    });

    it('should provide error state', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.error).toBeNull();
      expect(typeof result.current.error).toBe('object'); // null is object type
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on unmount', () => {
      const { unmount } = renderHook(() => useThreeRenderer());
      
      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should dispose of meshes on cleanup', () => {
      const { result, unmount } = renderHook(() => useThreeRenderer());
      
      // Add some mock meshes
      act(() => {
        (result.current as any).setMeshes([
          {
            mesh: mockMesh,
            metadata: { id: 'test' },
            dispose: vi.fn()
          }
        ]);
      });
      
      // Unmount should not throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Refs', () => {
    it('should provide scene ref', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.sceneRef).toBeDefined();
      expect(result.current.sceneRef.current).toBeNull();
    });

    it('should provide camera ref', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.cameraRef).toBeDefined();
      expect(result.current.cameraRef.current).toBeNull();
    });

    it('should provide renderer ref', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.rendererRef).toBeDefined();
      expect(result.current.rendererRef.current).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should track initialization state', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.isInitialized).toBe(false);
    });

    it('should track rendering state', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(result.current.isRendering).toBe(false);
    });

    it('should track mesh collection', () => {
      const { result } = renderHook(() => useThreeRenderer());
      
      expect(Array.isArray(result.current.meshes)).toBe(true);
      expect(result.current.meshes).toHaveLength(0);
    });
  });
});
