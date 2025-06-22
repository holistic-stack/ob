/**
 * @file Camera Utilities Tests
 * 
 * Comprehensive test suite for camera utilities following TDD methodology
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import {
  validateCamera,
  validateMesh,
  validateMeshArray,
  applyCameraPosition,
  logCameraPosition,
  logCameraResult,
  createCameraError,
  withCameraErrorHandling,
  getCameraState,
  compareCameraPositions
} from './camera-utils';
import type { CameraPosition } from '../types/babylon-types';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn()
};

beforeEach(() => {
  vi.clearAllMocks();
  console.log = mockConsole.log;
  console.warn = mockConsole.warn;
});

// Mock Babylon.js objects
const createMockCamera = (isDisposed = false) => {
  const camera = {
    isDisposed,
    alpha: -Math.PI / 4,
    beta: Math.PI / 3,
    radius: 20,
    getTarget: vi.fn(() => new BABYLON.Vector3(0, 0, 0)),
    setTarget: vi.fn()
  } as unknown as BABYLON.ArcRotateCamera;
  
  return camera;
};

const createMockMesh = (name: string, isDisposed = false) => {
  const mesh = {
    name,
    isDisposed
  } as unknown as BABYLON.AbstractMesh;
  
  return mesh;
};

describe('Camera Utilities', () => {
  describe('validateCamera', () => {
    it('should validate a valid camera', () => {
      const camera = createMockCamera();
      const result = validateCamera(camera);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(camera);
    });

    it('should reject null camera', () => {
      const result = validateCamera(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera is null or undefined');
    });

    it('should reject undefined camera', () => {
      const result = validateCamera(undefined);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera is null or undefined');
    });

    it('should reject disposed camera', () => {
      const camera = createMockCamera(true);
      const result = validateCamera(camera);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Camera is disposed');
    });
  });

  describe('validateMesh', () => {
    it('should validate a valid mesh', () => {
      const mesh = createMockMesh('test-mesh');
      const result = validateMesh(mesh);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(mesh);
    });

    it('should reject null mesh', () => {
      const result = validateMesh(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mesh is null or undefined');
    });

    it('should reject disposed mesh', () => {
      const mesh = createMockMesh('test-mesh', true);
      const result = validateMesh(mesh);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mesh is disposed');
    });
  });

  describe('validateMeshArray', () => {
    it('should validate valid mesh array', () => {
      const meshes = [createMockMesh('mesh1'), createMockMesh('mesh2')];
      const result = validateMeshArray(meshes);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(meshes);
    });

    it('should reject null mesh array', () => {
      const result = validateMeshArray(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mesh array is null or undefined');
    });

    it('should reject empty mesh array', () => {
      const result = validateMeshArray([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No meshes provided');
    });

    it('should filter out disposed meshes', () => {
      const meshes = [
        createMockMesh('mesh1'),
        createMockMesh('mesh2', true), // disposed
        createMockMesh('mesh3')
      ];
      const result = validateMeshArray(meshes);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.map(m => m.name)).toEqual(['mesh1', 'mesh3']);
    });
  });

  describe('applyCameraPosition', () => {
    it('should apply camera position correctly', () => {
      const camera = createMockCamera();
      const position: CameraPosition = {
        target: [10, 20, 30],
        alpha: Math.PI / 2,
        beta: Math.PI / 4,
        radius: 50
      };
      
      const result = applyCameraPosition(camera, position);
      
      expect(result.success).toBe(true);
      expect(camera.setTarget).toHaveBeenCalledWith(new BABYLON.Vector3(10, 20, 30));
      expect(camera.alpha).toBe(Math.PI / 2);
      expect(camera.beta).toBe(Math.PI / 4);
      expect(camera.radius).toBe(50);
    });

    it('should handle errors during application', () => {
      const camera = createMockCamera();
      camera.setTarget = vi.fn(() => { throw new Error('Test error'); });
      
      const position: CameraPosition = {
        target: [0, 0, 0],
        alpha: 0,
        beta: 0,
        radius: 10
      };
      
      const result = applyCameraPosition(camera, position);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to apply camera position');
    });
  });

  describe('logCameraPosition', () => {
    it('should log camera position with operation name', () => {
      const camera = createMockCamera();
      
      logCameraPosition('test operation', camera);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[CameraService] test operation:',
        expect.objectContaining({
          alpha: camera.alpha,
          beta: camera.beta,
          radius: camera.radius
        })
      );
    });

    it('should include additional info in logs', () => {
      const camera = createMockCamera();
      const additionalInfo = { meshCount: 5 };
      
      logCameraPosition('test operation', camera, additionalInfo);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[CameraService] test operation:',
        expect.objectContaining({
          meshCount: 5
        })
      );
    });
  });

  describe('logCameraResult', () => {
    it('should log successful result', () => {
      const result = { success: true, data: 'test data' } as const;
      
      logCameraResult('test operation', result);
      
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[CameraService] test operation completed successfully',
        undefined
      );
    });

    it('should log failed result', () => {
      const result = { success: false, error: 'test error' } as const;
      
      logCameraResult('test operation', result);
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[CameraService] test operation failed:',
        'test error',
        undefined
      );
    });
  });

  describe('createCameraError', () => {
    it('should create error message from Error object', () => {
      const error = new Error('Test error message');
      const result = createCameraError('test operation', error);
      
      expect(result).toBe('Failed to test operation: Test error message');
    });

    it('should handle unknown error types', () => {
      const result = createCameraError('test operation', 'string error');
      
      expect(result).toBe('Failed to test operation: Unknown error');
    });
  });

  describe('withCameraErrorHandling', () => {
    it('should return success for successful operation', () => {
      const fn = vi.fn(() => 'test result');
      const result = withCameraErrorHandling('test operation', fn);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('test result');
    });

    it('should handle thrown errors', () => {
      const fn = vi.fn(() => { throw new Error('Test error'); });
      const result = withCameraErrorHandling('test operation', fn);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to test operation');
    });
  });

  describe('getCameraState', () => {
    it('should extract camera state correctly', () => {
      const camera = createMockCamera();
      camera.getTarget = vi.fn(() => new BABYLON.Vector3(5, 10, 15));
      
      const state = getCameraState(camera);
      
      expect(state).toEqual({
        target: [5, 10, 15],
        alpha: camera.alpha,
        beta: camera.beta,
        radius: camera.radius
      });
    });
  });

  describe('compareCameraPositions', () => {
    it('should return true for identical positions', () => {
      const pos1: CameraPosition = {
        target: [0, 0, 0],
        alpha: Math.PI / 4,
        beta: Math.PI / 3,
        radius: 20
      };
      const pos2: CameraPosition = { ...pos1 };
      
      const result = compareCameraPositions(pos1, pos2);
      
      expect(result).toBe(true);
    });

    it('should return false for different positions', () => {
      const pos1: CameraPosition = {
        target: [0, 0, 0],
        alpha: Math.PI / 4,
        beta: Math.PI / 3,
        radius: 20
      };
      const pos2: CameraPosition = {
        target: [1, 0, 0],
        alpha: Math.PI / 4,
        beta: Math.PI / 3,
        radius: 20
      };
      
      const result = compareCameraPositions(pos1, pos2);
      
      expect(result).toBe(false);
    });

    it('should handle tolerance correctly', () => {
      const pos1: CameraPosition = {
        target: [0, 0, 0],
        alpha: 0,
        beta: 0,
        radius: 20
      };
      const pos2: CameraPosition = {
        target: [0.0005, 0, 0],
        alpha: 0,
        beta: 0,
        radius: 20
      };
      
      const result = compareCameraPositions(pos1, pos2, 0.001);
      
      expect(result).toBe(true);
    });
  });
});
