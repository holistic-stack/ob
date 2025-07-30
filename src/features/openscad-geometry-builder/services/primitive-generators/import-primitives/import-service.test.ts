/**
 * @file import-service.test.ts
 * @description Tests for ImportService
 *
 * Tests unified import functionality across multiple file formats.
 * Validates OpenSCAD import() primitive compatibility and error handling.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types';
import type { ImportParameters } from '../../../types/import-parameters';
import { ImportService } from './import-service';

describe('ImportService', () => {
  let importService: ImportService;

  beforeEach(() => {
    importService = new ImportService();
  });

  describe('Service Initialization', () => {
    it('should initialize with supported formats', () => {
      const formats = importService.getSupportedFormats();
      expect(formats).toHaveLength(2);
      expect(formats.map((f) => f.format)).toContain('stl');
      expect(formats.map((f) => f.format)).toContain('off');
    });

    it('should provide service information', () => {
      const info = importService.getServiceInfo();
      expect(info.supportedFormats).toBe(2);
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities).toContain('STL import (ASCII and binary)');
      expect(info.capabilities).toContain('OFF import with triangulation');
    });
  });

  describe('Format Detection', () => {
    it('should detect STL format', () => {
      expect(importService.isFormatSupported('model.stl')).toBe(true);
      expect(importService.isFormatSupported('MODEL.STL')).toBe(true);
    });

    it('should detect OFF format', () => {
      expect(importService.isFormatSupported('model.off')).toBe(true);
      expect(importService.isFormatSupported('MODEL.OFF')).toBe(true);
    });

    it('should reject unsupported formats', () => {
      expect(importService.isFormatSupported('model.obj')).toBe(false);
      expect(importService.isFormatSupported('model.ply')).toBe(false);
      expect(importService.isFormatSupported('model.txt')).toBe(false);
    });
  });

  describe('STL Import Integration', () => {
    it('should import ASCII STL through unified interface', async () => {
      const stlContent = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid test`;

      const params: ImportParameters = {
        file: 'test.stl',
        scale: 1.0,
      };

      const result = await importService.importFile(stlContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.vertices).toHaveLength(3);
        expect(geometry.faces).toHaveLength(1);
        expect(geometry.metadata.importStatistics?.format).toBe('stl');
      }
    });

    it('should import binary STL through unified interface', async () => {
      // Create minimal binary STL
      const header = new ArrayBuffer(80);
      const triangleCount = new Uint32Array([1]);
      const triangleData = new Float32Array([
        0,
        0,
        1, // Normal
        0,
        0,
        0, // Vertex 1
        1,
        0,
        0, // Vertex 2
        0,
        1,
        0, // Vertex 3
      ]);
      const attributeBytes = new Uint16Array([0]);

      const binarySTL = new Uint8Array(
        header.byteLength +
          triangleCount.byteLength +
          triangleData.byteLength +
          attributeBytes.byteLength
      );

      let offset = 0;
      binarySTL.set(new Uint8Array(header), offset);
      offset += header.byteLength;
      binarySTL.set(new Uint8Array(triangleCount.buffer), offset);
      offset += triangleCount.byteLength;
      binarySTL.set(new Uint8Array(triangleData.buffer), offset);
      offset += triangleData.byteLength;
      binarySTL.set(new Uint8Array(attributeBytes.buffer), offset);

      const params: ImportParameters = {
        file: 'test.stl',
      };

      const result = await importService.importFile(binarySTL, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.vertices).toHaveLength(3);
        expect(geometry.faces).toHaveLength(1);
        expect(geometry.metadata.importStatistics?.format).toBe('stl');
      }
    });
  });

  describe('OFF Import Integration', () => {
    it('should import OFF through unified interface', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const params: ImportParameters = {
        file: 'test.off',
        scale: 1.0,
      };

      const result = await importService.importFile(offContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.vertices).toHaveLength(3);
        expect(geometry.faces).toHaveLength(1);
        expect(geometry.metadata.importStatistics?.format).toBe('off');
      }
    });

    it('should handle OFF with quad triangulation', async () => {
      const offContent = `OFF
4 1 0
0.0 0.0 0.0
1.0 0.0 0.0
1.0 1.0 0.0
0.0 1.0 0.0
4 0 1 2 3`;

      const params: ImportParameters = {
        file: 'test.off',
      };

      const result = await importService.importFile(offContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.vertices).toHaveLength(4);
        expect(geometry.faces).toHaveLength(2); // Quad triangulated to 2 triangles
        expect(geometry.metadata.importStatistics?.format).toBe('off');
      }
    });
  });

  describe('Parameter Handling', () => {
    it('should apply scaling across formats', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const params: ImportParameters = {
        file: 'test.off',
        scale: 2.0,
      };

      const result = await importService.importFile(offContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const geometry = result.data;
        expect(geometry.vertices[1]).toEqual({ x: 2, y: 0, z: 0 });
        expect(geometry.vertices[2]).toEqual({ x: 0, y: 2, z: 0 });
      }
    });

    it('should apply centering across formats', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
2.0 0.0 0.0
0.0 2.0 0.0
3 0 1 2`;

      const params: ImportParameters = {
        file: 'test.off',
        center: true,
      };

      const result = await importService.importFile(offContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const geometry = result.data;
        // Check that mesh is approximately centered
        const avgX = geometry.vertices.reduce((sum, v) => sum + v.x, 0) / geometry.vertices.length;
        const avgY = geometry.vertices.reduce((sum, v) => sum + v.y, 0) / geometry.vertices.length;

        expect(avgX).toBeCloseTo(0, 0);
        expect(avgY).toBeCloseTo(0, 0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid parameters', async () => {
      const result = await importService.importFile('content', {
        file: '', // Invalid empty filename
      });

      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('Invalid import parameters');
      }
    });

    it('should handle unsupported file format', async () => {
      const result = await importService.importFile('content', {
        file: 'model.unsupported',
      });

      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('Unsupported file format');
      }
    });

    it('should handle binary content for OFF files', async () => {
      const binaryContent = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

      const result = await importService.importFile(binaryContent, {
        file: 'test.off',
      });

      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('OFF files must be provided as text content');
      }
    });

    it('should handle malformed content', async () => {
      const malformedContent = 'This is not valid STL or OFF content';

      const result = await importService.importFile(malformedContent, {
        file: 'test.stl',
      });

      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('STL');
      }
    });
  });

  describe('Content Validation', () => {
    it('should validate STL content', async () => {
      const stlContent = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid test`;

      const validation = await importService.validateFileContent(stlContent, {
        file: 'test.stl',
      });

      expect(validation.isValid).toBe(true);
      expect(validation.formatInfo?.format).toBe('stl');
    });

    it('should validate OFF content', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const validation = await importService.validateFileContent(offContent, {
        file: 'test.off',
      });

      expect(validation.isValid).toBe(true);
      expect(validation.formatInfo?.format).toBe('off');
    });

    it('should detect invalid content', async () => {
      const validation = await importService.validateFileContent('', {
        file: 'test.stl',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('File content is empty');
    });

    it('should warn about large files', async () => {
      const largeContent = 'x'.repeat(101 * 1024 * 1024); // 101MB

      const validation = await importService.validateFileContent(largeContent, {
        file: 'test.stl',
      });

      expect(validation.warnings).toContain('Large file size may impact performance');
    });
  });

  describe('Performance and Statistics', () => {
    it('should provide import statistics', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const result = await importService.importFile(offContent, {
        file: 'test.off',
      });

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const stats = result.data.metadata.importStatistics;
        expect(stats).toBeDefined();
        expect(stats?.format).toBe('off');
        expect(stats?.vertexCount).toBe(3);
        expect(stats?.faceCount).toBe(1);
        expect(stats?.parseTime).toBeGreaterThan(0);
        expect(stats?.totalTime).toBeGreaterThan(0);
      }
    });

    it('should import within reasonable time', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const startTime = performance.now();
      const result = await importService.importFile(offContent, {
        file: 'test.off',
      });
      const endTime = performance.now();

      const importTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(importTime).toBeLessThan(100); // Should import in <100ms

      console.log(`Import service time: ${importTime.toFixed(2)}ms`);
    });
  });
});
