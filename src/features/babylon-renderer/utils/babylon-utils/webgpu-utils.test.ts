/**
 * @file WebGPU Utils Tests
 * 
 * Tests for WebGPU utility functions.
 * Following TDD principles with real implementations where possible.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isWebGPUSupported,
  getWebGPUCapabilities,
  checkWebGPUFeatures,
  requestWebGPUAdapter,
  logWebGPUCapabilities,
} from './webgpu-utils';

describe('WebGPU Utils', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.restoreAllMocks();
  });

  describe('isWebGPUSupported', () => {
    it('should return false when WebGPU is not supported', () => {
      // Mock navigator without gpu
      vi.stubGlobal('navigator', {});
      
      const result = isWebGPUSupported();
      expect(result).toBe(false);
    });

    it('should return false when gpu is undefined', () => {
      // Mock navigator with undefined gpu
      vi.stubGlobal('navigator', { gpu: undefined });
      
      const result = isWebGPUSupported();
      expect(result).toBe(false);
    });

    it('should return true when WebGPU is supported', () => {
      // Mock navigator with gpu
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn(),
          getPreferredCanvasFormat: vi.fn(),
        },
      });
      
      const result = isWebGPUSupported();
      expect(result).toBe(true);
    });
  });

  describe('getWebGPUCapabilities', () => {
    it('should return error when WebGPU is not supported', async () => {
      // Mock navigator without gpu
      vi.stubGlobal('navigator', {});
      
      const result = await getWebGPUCapabilities();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_SUPPORTED');
        expect(result.error.message).toContain('WebGPU is not supported');
      }
    });

    it('should return error when adapter request fails', async () => {
      // Mock navigator with gpu that returns null adapter
      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(null),
          getPreferredCanvasFormat: vi.fn(),
        },
      });
      
      const result = await getWebGPUCapabilities();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('ADAPTER_REQUEST_FAILED');
      }
    });

    it('should return capabilities when WebGPU is supported', async () => {
      // Mock successful WebGPU adapter
      const mockAdapter = {
        requestAdapterInfo: vi.fn().mockResolvedValue({
          vendor: 'Test Vendor',
          architecture: 'Test Architecture',
          device: 'Test Device',
        }),
        limits: {
          maxTextureDimension2D: 8192,
          maxBufferSize: 1024 * 1024 * 1024,
        },
        features: new Set(['texture-compression-bc']),
      };

      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
          getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
        },
      });
      
      const result = await getWebGPUCapabilities();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isSupported).toBe(true);
        expect(result.data.adapterInfo).toBeDefined();
        expect(result.data.limits).toBeDefined();
        expect(result.data.features).toEqual(['texture-compression-bc']);
        expect(result.data.preferredFormat).toBe('bgra8unorm');
      }
    });
  });

  describe('checkWebGPUFeatures', () => {
    it('should return false when required features are missing', async () => {
      // Mock adapter with limited features
      const mockAdapter = {
        requestAdapterInfo: vi.fn().mockResolvedValue({}),
        limits: {},
        features: new Set(['basic-feature']),
      };

      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
          getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
        },
      });
      
      const result = await checkWebGPUFeatures(['advanced-feature', 'another-feature']);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should return true when all required features are available', async () => {
      // Mock adapter with all required features
      const mockAdapter = {
        requestAdapterInfo: vi.fn().mockResolvedValue({}),
        limits: {},
        features: new Set(['feature1', 'feature2', 'feature3']),
      };

      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
          getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
        },
      });
      
      const result = await checkWebGPUFeatures(['feature1', 'feature2']);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('requestWebGPUAdapter', () => {
    it('should return error when WebGPU is not supported', async () => {
      // Mock navigator without gpu
      vi.stubGlobal('navigator', {});
      
      const result = await requestWebGPUAdapter();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_SUPPORTED');
      }
    });

    it('should return adapter when request succeeds', async () => {
      const mockAdapter = {
        requestAdapterInfo: vi.fn(),
        limits: {},
        features: new Set(),
      };

      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
        },
      });
      
      const result = await requestWebGPUAdapter();
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockAdapter);
      }
    });
  });

  describe('logWebGPUCapabilities', () => {
    it('should handle logging when WebGPU is not supported', async () => {
      // Mock navigator without gpu
      vi.stubGlobal('navigator', {});
      
      // Should not throw
      await expect(logWebGPUCapabilities()).resolves.toBeUndefined();
    });

    it('should log capabilities when WebGPU is supported', async () => {
      const mockAdapter = {
        requestAdapterInfo: vi.fn().mockResolvedValue({
          vendor: 'Test Vendor',
          architecture: 'Test Architecture',
          device: 'Test Device',
        }),
        limits: {
          maxTextureDimension2D: 8192,
          maxBufferSize: 1024 * 1024 * 1024,
        },
        features: new Set(['texture-compression-bc']),
      };

      vi.stubGlobal('navigator', {
        gpu: {
          requestAdapter: vi.fn().mockResolvedValue(mockAdapter),
          getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
        },
      });
      
      // Should not throw
      await expect(logWebGPUCapabilities()).resolves.toBeUndefined();
    });
  });
});
