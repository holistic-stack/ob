/**
 * @file Export Service Tests
 *
 * Tests for the ExportService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { type AbstractMesh, CreateBox, CreateSphere, NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ExportConfig, type ExportFormat, ExportService } from './export.service';

// Mock logger to avoid console output during tests
vi.mock('../../../../shared/services/logger.service', () => ({
  createLogger: vi.fn(() => ({
    init: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Note: STL export is not yet implemented, so we test the error handling

// Mock DOM APIs for download functionality
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

Object.defineProperty(global, 'Blob', {
  value: class MockBlob {
    constructor(
      public data: any[],
      public options?: any
    ) {}
    get size() {
      return 1024;
    }
  },
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

describe('ExportService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let exportService: ExportService;
  let testMesh1: AbstractMesh;
  let testMesh2: AbstractMesh;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create test meshes
    testMesh1 = CreateBox('testBox1', { size: 1 }, scene);
    testMesh2 = CreateSphere('testSphere1', { diameter: 1 }, scene);

    // Create export service
    exportService = new ExportService(scene);

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up resources
    if (exportService) {
      exportService.dispose();
    }
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize export service', () => {
      expect(exportService).toBeDefined();
      expect(exportService.getSupportedFormats()).toContain('stl');
    });

    it('should get supported formats', () => {
      const formats = exportService.getSupportedFormats();
      expect(formats).toEqual(['stl', '3mf', 'gltf', 'glb']);
    });

    it('should get default configuration for STL', () => {
      const config = exportService.getDefaultConfig('stl', 'test.stl');
      expect(config).toEqual({
        format: 'stl',
        filename: 'test.stl',
        quality: 'medium',
        precision: 3,
        exportSelected: false,
        binary: true,
      });
    });

    it('should get default configuration for GLTF', () => {
      const config = exportService.getDefaultConfig('gltf');
      expect(config).toEqual({
        format: 'gltf',
        filename: 'model.gltf',
        quality: 'medium',
        precision: 3,
        exportSelected: false,
        binary: false,
        includeTextures: true,
        includeAnimations: false,
        embedTextures: false,
      });
    });
  });

  describe('STL Export', () => {
    it('should successfully export STL format', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'test.stl',
        binary: true,
      };

      const result = await exportService.exportMeshes([testMesh1, testMesh2], config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filename).toBe('test.stl');
        expect(result.data.format).toBe('stl');
        expect(result.data.meshCount).toBe(2);
        expect(result.data.fileSize).toBeGreaterThan(0);
      }
    });

    it('should successfully export scene to STL format', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'scene.stl',
        binary: false,
      };

      const result = await exportService.exportScene(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filename).toBe('scene.stl');
        expect(result.data.format).toBe('stl');
        expect(result.data.meshCount).toBeGreaterThan(0);
      }
    });

    it('should handle progress callback during STL export attempt', async () => {
      const progressCallback = vi.fn();
      const config: ExportConfig = {
        format: 'stl',
        filename: 'test.stl',
      };

      await exportService.exportMeshes([testMesh1], config, progressCallback);

      // Progress callback should be called for initial setup
      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('Unsupported Formats', () => {
    it('should fail to export 3MF format', async () => {
      const config: ExportConfig = {
        format: '3mf',
        filename: 'test.3mf',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
        expect(result.error.message).toContain('3MF export is not yet implemented');
      }
    });

    it('should fail to export GLTF format', async () => {
      const config: ExportConfig = {
        format: 'gltf',
        filename: 'test.gltf',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
        expect(result.error.message).toContain('GLTF export is not yet implemented');
      }
    });

    it('should fail to export GLB format', async () => {
      const config: ExportConfig = {
        format: 'glb',
        filename: 'test.glb',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
        expect(result.error.message).toContain('GLB export is not yet implemented');
      }
    });
  });

  describe('Validation', () => {
    it('should fail with empty filename', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: '',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Filename is required');
      }
    });

    it('should fail with unsupported format', async () => {
      const config: ExportConfig = {
        format: 'obj' as ExportFormat,
        filename: 'test.obj',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
      }
    });

    it('should fail with invalid precision', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'test.stl',
        precision: 15, // Invalid: > 10
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONFIG');
        expect(result.error.message).toContain('Precision must be between 0 and 10');
      }
    });

    it('should fail with no valid meshes', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'test.stl',
      };

      const result = await exportService.exportMeshes([], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NO_MESHES');
        expect(result.error.message).toContain('No valid meshes to export');
      }
    });

    it('should filter out non-mesh objects', async () => {
      // Create a non-mesh object (camera, light, etc.)
      const nonMesh = scene.createDefaultCameraOrLight(true, true, true);

      const config: ExportConfig = {
        format: 'stl',
        filename: 'test.stl',
      };

      const result = await exportService.exportMeshes([testMesh1, nonMesh as any], config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.meshCount).toBe(1); // Only the valid mesh
      }
    });
  });

  describe('Configuration Options', () => {
    it('should handle binary STL configuration', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'binary.stl',
        binary: true,
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(true);
      // Binary flag should be passed to STLExport.CreateSTL
    });

    it('should handle ASCII STL configuration', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'ascii.stl',
        binary: false,
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(true);
      // Binary flag should be passed to STLExport.CreateSTL
    });

    it('should handle quality settings', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'high-quality.stl',
        quality: 'high',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(true);
      // Quality setting should be processed (though not used in STL)
    });

    it('should handle precision settings', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'precise.stl',
        precision: 5,
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(true);
      // Precision setting should be processed
    });
  });

  describe('Download Functionality', () => {
    it('should create download URL', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: 'download.stl',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.downloadUrl).toBe('mock-url');
      }

      // Verify DOM manipulation
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle download creation errors', async () => {
      // Mock URL.createObjectURL to throw an error
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => {
        throw new Error('Mock download error');
      });

      const config: ExportConfig = {
        format: 'stl',
        filename: 'error.stl',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DOWNLOAD_FAILED');
      }

      // Restore original function
      URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported format errors', async () => {
      const config: ExportConfig = {
        format: 'unsupported' as any,
        filename: 'error.unsupported',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
        expect(result.error.message).toContain('Unsupported format');
      }
    });

    it('should include error details', async () => {
      const config: ExportConfig = {
        format: 'stl',
        filename: '',
      };

      const result = await exportService.exportMeshes([testMesh1], config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.timestamp).toBeInstanceOf(Date);
        expect(result.error.format).toBe('stl');
      }
    });
  });

  describe('Service Disposal', () => {
    it('should dispose service cleanly', () => {
      expect(() => {
        exportService.dispose();
      }).not.toThrow();
    });
  });
});
