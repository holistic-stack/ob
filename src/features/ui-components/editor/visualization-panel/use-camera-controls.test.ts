/**
 * @file Camera Controls Hook Tests
 * 
 * Unit tests for the camera controls hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as BABYLON from '@babylonjs/core';
import { useCameraControls } from './use-camera-controls';

// Mock Babylon.js objects
const createMockCamera = () => {
  const camera = {
    radius: 20,
    alpha: -Math.PI / 4,
    beta: Math.PI / 3,
    getTarget: vi.fn(() => new BABYLON.Vector3(0, 0, 0)),
    setTarget: vi.fn()
  } as unknown as BABYLON.ArcRotateCamera;
  
  return camera;
};

const createMockScene = (camera?: BABYLON.ArcRotateCamera) => {
  const scene = {
    cameras: camera ? [camera] : [],
    meshes: []
  } as unknown as BABYLON.Scene;
  
  return scene;
};

describe('useCameraControls', () => {
  let mockCamera: BABYLON.ArcRotateCamera;
  let mockScene: BABYLON.Scene;

  beforeEach(() => {
    mockCamera = createMockCamera();
    mockScene = createMockScene(mockCamera);
    vi.clearAllMocks();
  });

  describe('hook initialization', () => {
    it('should return camera controls API', () => {
      const { result } = renderHook(() => useCameraControls());
      
      expect(result.current).toHaveProperty('handleViewAction');
      expect(result.current).toHaveProperty('setScene');
      expect(result.current).toHaveProperty('getCamera');
      expect(typeof result.current.handleViewAction).toBe('function');
      expect(typeof result.current.setScene).toBe('function');
      expect(typeof result.current.getCamera).toBe('function');
    });

    it('should return null camera when no scene is set', () => {
      const { result } = renderHook(() => useCameraControls());
      
      const camera = result.current.getCamera();
      expect(camera).toBeNull();
    });
  });

  describe('scene management', () => {
    it('should set and get scene correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      const camera = result.current.getCamera();
      expect(camera).toBe(mockCamera);
    });

    it('should handle null scene', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(null);
      });
      
      const camera = result.current.getCamera();
      expect(camera).toBeNull();
    });
  });

  describe('zoom controls', () => {
    it('should zoom in correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      const initialRadius = mockCamera.radius;
      
      act(() => {
        result.current.handleViewAction('zoom-in');
      });
      
      expect(mockCamera.radius).toBe(initialRadius * 0.8);
    });

    it('should zoom out correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      const initialRadius = mockCamera.radius;
      
      act(() => {
        result.current.handleViewAction('zoom-out');
      });
      
      expect(mockCamera.radius).toBe(initialRadius * 1.25);
    });
  });

  describe('pan controls', () => {
    it('should pan up correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      act(() => {
        result.current.handleViewAction('pan-up');
      });
      
      expect(mockCamera.setTarget).toHaveBeenCalledWith(
        expect.objectContaining({
          _y: 2 // 20 * 0.1 = 2
        })
      );
    });

    it('should pan down correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      act(() => {
        result.current.handleViewAction('pan-down');
      });
      
      expect(mockCamera.setTarget).toHaveBeenCalledWith(
        expect.objectContaining({
          _y: -2 // -20 * 0.1 = -2
        })
      );
    });

    it('should pan left correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      act(() => {
        result.current.handleViewAction('pan-left');
      });
      
      expect(mockCamera.setTarget).toHaveBeenCalledWith(
        expect.objectContaining({
          _x: -2 // -20 * 0.1 = -2
        })
      );
    });

    it('should pan right correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      act(() => {
        result.current.handleViewAction('pan-right');
      });
      
      expect(mockCamera.setTarget).toHaveBeenCalledWith(
        expect.objectContaining({
          _x: 2 // 20 * 0.1 = 2
        })
      );
    });
  });

  describe('rotation controls', () => {
    it('should rotate left correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      const initialAlpha = mockCamera.alpha;
      
      act(() => {
        result.current.handleViewAction('rotate-left');
      });
      
      expect(mockCamera.alpha).toBe(initialAlpha - Math.PI / 8);
    });

    it('should rotate right correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      const initialAlpha = mockCamera.alpha;
      
      act(() => {
        result.current.handleViewAction('rotate-right');
      });
      
      expect(mockCamera.alpha).toBe(initialAlpha + Math.PI / 8);
    });
  });

  describe('reset controls', () => {
    it('should reset camera correctly', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      // Modify camera position
      mockCamera.radius = 50;
      mockCamera.alpha = 1;
      mockCamera.beta = 2;
      
      act(() => {
        result.current.handleViewAction('reset');
      });
      
      expect(mockCamera.radius).toBe(20);
      expect(mockCamera.alpha).toBe(-Math.PI / 4);
      expect(mockCamera.beta).toBe(Math.PI / 3);
      expect(mockCamera.setTarget).toHaveBeenCalledWith(BABYLON.Vector3.Zero());
    });
  });

  describe('error handling', () => {
    it('should handle actions when no scene is set', () => {
      const { result } = renderHook(() => useCameraControls());
      
      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleViewAction('zoom-in');
        });
      }).not.toThrow();
    });

    it('should handle unknown view actions', () => {
      const { result } = renderHook(() => useCameraControls());
      
      act(() => {
        result.current.setScene(mockScene);
      });
      
      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleViewAction('unknown-action' as any);
        });
      }).not.toThrow();
    });
  });
});
