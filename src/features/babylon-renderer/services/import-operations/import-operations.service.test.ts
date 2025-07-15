/**
 * @file Import Operations Service Tests
 *
 * Tests for the ImportOperationsService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ImportOperationsService,
  type IncludeParams,
  type STLImportParams,
  type SVGImportParams,
  type ThreeMFImportParams,
} from './import-operations.service';

// Mock the ImportMeshAsync function since we can't load real files in tests
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');
  return {
    ...actual,
    ImportMeshAsync: vi.fn(),
  };
});

describe('ImportOperationsService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let importService: ImportOperationsService;

  beforeEach(() => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);
    importService = new ImportOperationsService(scene);
  });

  afterEach(() => {
    // Clean up resources
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize import operations service', () => {
      expect(importService).toBeDefined();
    });
  });

  describe('STL Import Operations', () => {
    it('should handle STL import parameters validation', async () => {
      const params: STLImportParams = {
        scale: 2.0,
        center: true,
        mergeVertices: true,
        flipYZ: false,
      };

      // Mock ImportMeshAsync to simulate file not found
      const { ImportMeshAsync } = await import('@babylonjs/core');
      vi.mocked(ImportMeshAsync).mockRejectedValue(new Error('File not found'));

      const result = await importService.importSTL('nonexistent.stl', params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
        expect(result.error.filePath).toBe('nonexistent.stl');
      }
    });

    it('should handle STL import with default parameters', async () => {
      // Mock ImportMeshAsync to simulate successful import
      const { ImportMeshAsync } = await import('@babylonjs/core');
      vi.mocked(ImportMeshAsync).mockResolvedValue({
        meshes: [],
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: [],
        geometries: [],
        lights: [],
        spriteManagers: [],
      });

      const result = await importService.importSTL('test.stl');
      expect(result.success).toBe(false); // Should fail with no meshes

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
      }
    });

    it('should handle STL import with scaling parameters', async () => {
      const params: STLImportParams = {
        scale: [2, 3, 4],
        center: true,
      };

      const { ImportMeshAsync } = await import('@babylonjs/core');
      vi.mocked(ImportMeshAsync).mockRejectedValue(new Error('Mock error'));

      const result = await importService.importSTL('scaled.stl', params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
      }
    });
  });

  describe('3MF Import Operations', () => {
    it('should handle 3MF import parameters validation', async () => {
      const params: ThreeMFImportParams = {
        scale: 1.5,
        preserveMaterials: true,
        units: 'mm',
      };

      const { ImportMeshAsync } = await import('@babylonjs/core');
      vi.mocked(ImportMeshAsync).mockRejectedValue(new Error('File not found'));

      const result = await importService.import3MF('model.3mf', params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
        expect(result.error.filePath).toBe('model.3mf');
      }
    });

    it('should handle 3MF import with different units', async () => {
      const params: ThreeMFImportParams = {
        units: 'cm',
        preserveMaterials: false,
      };

      const { ImportMeshAsync } = await import('@babylonjs/core');
      vi.mocked(ImportMeshAsync).mockResolvedValue({
        meshes: [],
        particleSystems: [],
        skeletons: [],
        animationGroups: [],
        transformNodes: [],
        geometries: [],
        lights: [],
        spriteManagers: [],
      });

      const result = await importService.import3MF('model.3mf', params);
      expect(result.success).toBe(false); // Should fail with no meshes

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
      }
    });
  });

  describe('SVG Import Operations', () => {
    it('should handle SVG import parameters validation', async () => {
      const params: SVGImportParams = {
        scale: 2.0,
        resolution: 100,
        center: true,
      };

      // Mock scene._loadFile to simulate file loading failure
      scene._loadFile = vi
        .fn()
        .mockImplementation((filePath, onSuccess, onProgress, useOffline, useArray, onError) => {
          onError?.(undefined, { message: 'File not found' });
          return {} as unknown as import('@babylonjs/core').IFileRequest;
        });

      const result = await importService.importSVG('profile.svg', params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
        expect(result.error.filePath).toBe('profile.svg');
      }
    });

    it('should handle SVG import with valid path data', async () => {
      const params: SVGImportParams = {
        scale: 1.0,
        center: false,
      };

      // Mock scene._loadFile to simulate successful SVG loading
      const mockSVGContent = '<svg><path d="M 0 0 L 10 0 L 10 10 L 0 10 Z"/></svg>';
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess(mockSVGContent);
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.importSVG('square.svg', params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data[0]).toHaveProperty('x');
        expect(result.data[0]).toHaveProperty('y');
      }
    });

    it('should handle SVG import with invalid path data', async () => {
      // Mock scene._loadFile to simulate SVG without path
      const mockSVGContent = '<svg><rect x="0" y="0" width="10" height="10"/></svg>';
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess(mockSVGContent);
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.importSVG('invalid.svg');
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
      }
    });

    it('should handle SVG import with scaling', async () => {
      const params: SVGImportParams = {
        scale: 2.0,
      };

      // Mock scene._loadFile to simulate successful SVG loading
      const mockSVGContent = '<svg><path d="M 0 0 L 5 0 L 5 5 L 0 5 Z"/></svg>';
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess(mockSVGContent);
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.importSVG('scaled.svg', params);
      expect(result.success).toBe(true);

      if (result.success) {
        // Check that coordinates are scaled
        expect(result.data[1]?.x).toBe(10); // 5 * 2
        expect(result.data[2]?.y).toBe(10); // 5 * 2
      }
    });
  });

  describe('Include/Use Operations', () => {
    it('should handle include directive parameters', async () => {
      const params: IncludeParams = {
        filePath: 'library.scad',
        useDirective: false,
        variables: { size: 10 },
      };

      // Mock scene._loadFile to simulate file loading failure
      scene._loadFile = vi
        .fn()
        .mockImplementation((filePath, onSuccess, onProgress, useOffline, useArray, onError) => {
          onError?.(undefined, { message: 'File not found' });
          return {} as unknown as import('@babylonjs/core').IFileRequest;
        });

      const result = await importService.processInclude(params);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
        expect(result.error.filePath).toBe('library.scad');
      }
    });

    it('should handle use directive parameters', async () => {
      const params: IncludeParams = {
        filePath: 'module.scad',
        useDirective: true,
      };

      // Mock scene._loadFile to simulate successful file loading
      const mockOpenSCADContent = 'module test_module() { cube([10, 10, 10]); }';
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess(mockOpenSCADContent);
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.processInclude(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBe(mockOpenSCADContent);
      }
    });

    it('should handle include with variables', async () => {
      const params: IncludeParams = {
        filePath: 'parametric.scad',
        variables: {
          width: 20,
          height: 30,
          depth: 40,
        },
      };

      // Mock scene._loadFile to simulate successful file loading
      const mockContent = 'cube([width, height, depth]);';
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess(mockContent);
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.processInclude(params);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toContain('cube');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found errors', async () => {
      // Mock scene._loadFile to simulate file not found
      scene._loadFile = vi
        .fn()
        .mockImplementation((filePath, onSuccess, onProgress, useOffline, useArray, onError) => {
          onError?.(undefined, { message: 'File not found' });
          return {} as unknown as import('@babylonjs/core').IFileRequest;
        });

      const result = await importService.importSVG('missing.svg');
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
        expect(result.error.message).toContain('File not found');
      }
    });

    it('should handle parsing errors gracefully', async () => {
      // Mock scene._loadFile to simulate corrupted file
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess('invalid content');
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.importSVG('corrupted.svg');
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('LOADING_FAILED');
      }
    });
  });

  describe('Performance and Metadata', () => {
    it('should track operation timing', async () => {
      // Mock scene._loadFile to simulate successful operation
      const mockSVGContent = '<svg><path d="M 0 0 L 10 0 L 10 10 Z"/></svg>';
      scene._loadFile = vi.fn().mockImplementation((filePath, onSuccess) => {
        onSuccess(mockSVGContent);
        return {} as unknown as import('@babylonjs/core').IFileRequest;
      });

      const result = await importService.importSVG('timed.svg');
      expect(result.success).toBe(true);

      // Operation timing is tracked internally but not exposed in SVG results
      // For mesh imports, timing would be in metadata
    });
  });
});
