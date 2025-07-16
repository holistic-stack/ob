/**
 * @file Tests for Feature Detection Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FeatureDetectionService,
  FeatureSupportLevel,
  type BrowserCapabilities,
} from './feature-detection.service';

// Mock global objects for testing
const mockCanvas = {
  getContext: vi.fn(),
};

const mockWebGLContext = {
  getParameter: vi.fn(),
  getExtension: vi.fn(),
  VERSION: 'VERSION',
  MAX_TEXTURE_SIZE: 'MAX_TEXTURE_SIZE',
  MAX_VERTEX_ATTRIBS: 'MAX_VERTEX_ATTRIBS',
  UNMASKED_RENDERER_WEBGL: 'UNMASKED_RENDERER_WEBGL',
  UNMASKED_VENDOR_WEBGL: 'UNMASKED_VENDOR_WEBGL',
};

const mockGPU = {
  requestAdapter: vi.fn(),
};

const mockAdapter = {
  features: new Set(['texture-compression-bc']),
};

// Setup global mocks
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => mockCanvas),
  },
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: {
    hardwareConcurrency: 8,
    gpu: mockGPU,
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    localStorage: {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    sessionStorage: {
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(global, 'Worker', {
  value: function Worker() {},
  writable: true,
});

Object.defineProperty(global, 'ResizeObserver', {
  value: function ResizeObserver() {},
  writable: true,
});

describe('FeatureDetectionService', () => {
  let service: FeatureDetectionService;

  beforeEach(() => {
    service = new FeatureDetectionService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      // Setup WebGL mock
      mockCanvas.getContext.mockReturnValue(mockWebGLContext);
      mockWebGLContext.getParameter.mockImplementation((param) => {
        switch (param) {
          case 'VERSION':
            return 'WebGL 2.0';
          case 'MAX_TEXTURE_SIZE':
            return 4096;
          case 'MAX_VERTEX_ATTRIBS':
            return 16;
          default:
            return null;
        }
      });
      mockWebGLContext.getExtension.mockReturnValue({
        UNMASKED_RENDERER_WEBGL: 'UNMASKED_RENDERER_WEBGL',
        UNMASKED_VENDOR_WEBGL: 'UNMASKED_VENDOR_WEBGL',
      });

      // Setup WebGPU mock
      mockGPU.requestAdapter.mockResolvedValue(mockAdapter);

      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(service.getCapabilities()).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      // Make the entire detectCapabilities method fail by breaking document.createElement
      Object.defineProperty(global, 'document', {
        value: {
          createElement: vi.fn(() => {
            throw new Error('DOM not available');
          }),
        },
        writable: true,
      });

      const result = await service.initialize();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INITIALIZATION_FAILED');
        expect(result.error.message).toContain('Failed to initialize feature detection');
      }

      // Restore document for other tests
      Object.defineProperty(global, 'document', {
        value: {
          createElement: vi.fn(() => mockCanvas),
        },
        writable: true,
      });
    });

    it('should not reinitialize if already initialized', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGLContext);
      mockWebGLContext.getParameter.mockReturnValue('WebGL 2.0');
      mockGPU.requestAdapter.mockResolvedValue(mockAdapter);

      const result1 = await service.initialize();
      const result2 = await service.initialize();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Should only be called during first initialization, not second
      expect(mockCanvas.getContext).toHaveBeenCalledTimes(1); // Only called once during first init
    });
  });

  describe('WebGL detection', () => {
    it('should detect WebGL support correctly', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGLContext);
      mockWebGLContext.getParameter.mockImplementation((param) => {
        switch (param) {
          case 'VERSION':
            return 'WebGL 2.0';
          case 'MAX_TEXTURE_SIZE':
            return 4096;
          case 'MAX_VERTEX_ATTRIBS':
            return 16;
          default:
            return null;
        }
      });
      mockWebGLContext.getExtension.mockReturnValue({
        UNMASKED_RENDERER_WEBGL: 'UNMASKED_RENDERER_WEBGL',
        UNMASKED_VENDOR_WEBGL: 'UNMASKED_VENDOR_WEBGL',
      });

      await service.initialize();

      expect(service.isWebGLSupported()).toBe(true);

      const capabilities = service.getCapabilities();
      expect(capabilities?.webgl?.supported).toBe(true);
      expect(capabilities?.webgl?.version).toBe('WebGL 2.0');
      expect(capabilities?.webgl?.maxTextureSize).toBe(4096);
    });

    it('should handle WebGL not supported', async () => {
      mockCanvas.getContext.mockReturnValue(null);

      await service.initialize();

      expect(service.isWebGLSupported()).toBe(false);

      const capabilities = service.getCapabilities();
      expect(capabilities?.webgl?.supported).toBe(false);
      expect(capabilities?.webgl?.version).toBe(null);
    });
  });

  describe('WebGPU detection', () => {
    it('should detect WebGPU support correctly', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGLContext);
      mockWebGLContext.getParameter.mockReturnValue('WebGL 2.0');
      mockGPU.requestAdapter.mockResolvedValue(mockAdapter);

      await service.initialize();

      expect(service.isWebGPUSupported()).toBe(true);

      const capabilities = service.getCapabilities();
      expect(capabilities?.webgpu?.supported).toBe(true);
      expect(capabilities?.webgpu?.adapter).toBe(true);
      expect(capabilities?.webgpu?.features).toContain('texture-compression-bc');
    });

    it('should handle WebGPU not supported', async () => {
      // Create a new service instance for this test
      const testService = new FeatureDetectionService();

      // Remove GPU from navigator
      Object.defineProperty(global, 'navigator', {
        value: {
          hardwareConcurrency: 8,
        },
        writable: true,
      });

      mockCanvas.getContext.mockReturnValue(mockWebGLContext);
      mockWebGLContext.getParameter.mockReturnValue('WebGL 2.0');

      await testService.initialize();

      expect(testService.isWebGPUSupported()).toBe(false);

      const capabilities = testService.getCapabilities();
      expect(capabilities?.webgpu?.supported).toBe(false);

      testService.dispose();
    });
  });

  describe('feature support assessment', () => {
    it('should handle features when not initialized', () => {
      const testService = new FeatureDetectionService();

      const support = testService.getFeatureSupport('webgl');

      expect(support.level).toBe(FeatureSupportLevel.UNSUPPORTED);
      expect(support.reason).toBe('Feature detection not initialized');
      expect(support.fallbackAvailable).toBe(false);
      expect(support.recommendations).toContain('Initialize feature detection service');

      testService.dispose();
    });

    it('should handle unknown features when not initialized', () => {
      const testService = new FeatureDetectionService();

      const support = testService.getFeatureSupport('unknown-feature');

      expect(support.level).toBe(FeatureSupportLevel.UNSUPPORTED);
      expect(support.reason).toBe('Feature detection not initialized');
      expect(support.fallbackAvailable).toBe(false);

      testService.dispose();
    });
  });

  describe('high-performance detection', () => {
    it('should return false when not initialized', () => {
      const testService = new FeatureDetectionService();
      expect(testService.isHighPerformanceRenderingAvailable()).toBe(false);
      testService.dispose();
    });

    it('should return false when WebGL is not supported', async () => {
      const testService = new FeatureDetectionService();

      // Mock no WebGL support
      mockCanvas.getContext.mockReturnValue(null);

      await testService.initialize();
      expect(testService.isHighPerformanceRenderingAvailable()).toBe(false);

      testService.dispose();
    });
  });

  describe('disposal', () => {
    it('should dispose cleanly', async () => {
      mockCanvas.getContext.mockReturnValue(mockWebGLContext);
      mockWebGLContext.getParameter.mockReturnValue('WebGL 2.0');

      await service.initialize();
      
      expect(service.getCapabilities()).toBeDefined();
      
      service.dispose();
      
      expect(service.getCapabilities()).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should handle capabilities check before initialization', () => {
      expect(service.getCapabilities()).toBe(null);
      expect(service.isWebGLSupported()).toBe(false);
      expect(service.isWebGPUSupported()).toBe(false);
      expect(service.isHighPerformanceRenderingAvailable()).toBe(false);
    });

    it('should provide fallback support info when not initialized', () => {
      const support = service.getFeatureSupport('webgl');

      expect(support.level).toBe(FeatureSupportLevel.UNSUPPORTED);
      expect(support.reason).toBe('Feature detection not initialized');
      expect(support.fallbackAvailable).toBe(false);
      expect(support.recommendations).toContain('Initialize feature detection service');
    });
  });
});
