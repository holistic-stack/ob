/**
 * @file stl-importer.test.ts
 * @description Tests for STLImporterService
 *
 * Tests STL file parsing, mesh validation, and OpenSCAD import() primitive compatibility.
 * Follows TDD approach with comprehensive test coverage for STL import functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types';
import type { ImportParameters } from '../../../../types/import-parameters';
import { STLImporterService } from './stl-importer';

describe('STLImporterService', () => {
  let stlImporter: STLImporterService;

  beforeEach(() => {
    stlImporter = new STLImporterService();
  });

  describe('ASCII STL Parsing', () => {
    it('should parse simple ASCII STL triangle', async () => {
      const asciiSTL = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid test`;

      const result = await stlImporter.parseSTLContent(asciiSTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(3);
        expect(mesh.faces).toHaveLength(1);
        expect(mesh.faces[0]).toEqual([0, 1, 2]);
        expect(mesh.metadata.format).toBe('ascii');
        expect(mesh.metadata.triangleCount).toBe(1);
      }
    });

    it('should parse ASCII STL with multiple triangles', async () => {
      const asciiSTL = `solid cube
facet normal 0 0 1
  outer loop
    vertex 0 0 1
    vertex 1 0 1
    vertex 1 1 1
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 1
    vertex 1 1 1
    vertex 0 1 1
  endloop
endfacet
endsolid cube`;

      const result = await stlImporter.parseSTLContent(asciiSTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(6);
        expect(mesh.faces).toHaveLength(2);
        expect(mesh.metadata.triangleCount).toBe(2);
      }
    });

    it('should handle ASCII STL with header name', async () => {
      const asciiSTL = `solid MyModel
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid MyModel`;

      const result = await stlImporter.parseSTLContent(asciiSTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.metadata.header).toBe('MyModel');
      }
    });
  });

  describe('Binary STL Parsing', () => {
    it('should detect binary STL format', async () => {
      // Create a minimal binary STL (80-byte header + 4-byte count + triangle data)
      const header = new ArrayBuffer(80);
      const triangleCount = new Uint32Array([1]);
      const triangleData = new Float32Array([
        // Normal vector
        0, 0, 1,
        // Vertex 1
        0, 0, 0,
        // Vertex 2
        1, 0, 0,
        // Vertex 3
        0, 1, 0,
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

      const result = await stlImporter.parseSTLBinary(binarySTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(3);
        expect(mesh.faces).toHaveLength(1);
        expect(mesh.metadata.format).toBe('binary');
        expect(mesh.metadata.triangleCount).toBe(1);
      }
    });

    it('should handle empty binary STL', async () => {
      // Create binary STL with zero triangles
      const header = new ArrayBuffer(80);
      const triangleCount = new Uint32Array([0]);

      const binarySTL = new Uint8Array(header.byteLength + triangleCount.byteLength);
      binarySTL.set(new Uint8Array(header), 0);
      binarySTL.set(new Uint8Array(triangleCount.buffer), header.byteLength);

      const result = await stlImporter.parseSTLBinary(binarySTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(0);
        expect(mesh.faces).toHaveLength(0);
        expect(mesh.metadata.triangleCount).toBe(0);
      }
    });
  });

  describe('STL Format Detection', () => {
    it('should detect ASCII STL format', () => {
      const asciiContent = 'solid test\nfacet normal 0 0 1\n';
      const isAscii = stlImporter.isASCIISTL(asciiContent);
      expect(isAscii).toBe(true);
    });

    it('should detect binary STL format', () => {
      const binaryContent = new Uint8Array([0x00, 0x01, 0x02, 0x03]); // Non-ASCII bytes
      const isAscii = stlImporter.isASCIISTL(binaryContent);
      expect(isAscii).toBe(false);
    });

    it('should handle edge cases in format detection', () => {
      // Empty content
      expect(stlImporter.isASCIISTL('')).toBe(false);

      // Content starting with "solid" but not ASCII STL
      const fakeAscii = 'solid but not really ascii \x00\x01';
      expect(stlImporter.isASCIISTL(fakeAscii)).toBe(false);
    });
  });

  describe('Import with Parameters', () => {
    it('should import STL with scaling', async () => {
      const asciiSTL = `solid test
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
        scale: 2.0,
      };

      const result = await stlImporter.importSTL(asciiSTL, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        // Vertices should be scaled by 2.0
        expect(mesh.vertices[1]).toEqual({ x: 2, y: 0, z: 0 });
        expect(mesh.vertices[2]).toEqual({ x: 0, y: 2, z: 0 });
      }
    });

    it('should import STL with centering', async () => {
      const asciiSTL = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 2 0 0
    vertex 0 2 0
  endloop
endfacet
endsolid test`;

      const params: ImportParameters = {
        file: 'test.stl',
        center: true,
      };

      const result = await stlImporter.importSTL(asciiSTL, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const polyhedronData = result.data;

        // Create STLMesh from polyhedron data for bounds calculation
        const stlMesh = {
          vertices: Array.from(polyhedronData.vertices),
          faces: polyhedronData.faces.map((face) => Array.from(face) as [number, number, number]),
          normals: Array.from(polyhedronData.normals),
          metadata: {
            triangleCount: polyhedronData.faces.length,
            vertexCount: polyhedronData.vertices.length,
            format: 'ascii' as const,
          },
        };

        // Mesh should be centered around origin
        const bounds = stlImporter.calculateBounds(stlMesh);
        const centerX = (bounds.min.x + bounds.max.x) / 2;
        const centerY = (bounds.min.y + bounds.max.y) / 2;

        expect(centerX).toBeCloseTo(0, 5);
        expect(centerY).toBeCloseTo(0, 5);
      }
    });

    it('should import STL with origin offset', async () => {
      const asciiSTL = `solid test
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
        origin: [5, 10],
      };

      const result = await stlImporter.importSTL(asciiSTL, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        // Vertices should be offset by origin
        expect(mesh.vertices[0]).toEqual({ x: 5, y: 10, z: 0 });
        expect(mesh.vertices[1]).toEqual({ x: 6, y: 10, z: 0 });
        expect(mesh.vertices[2]).toEqual({ x: 5, y: 11, z: 0 });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed ASCII STL', async () => {
      const malformedSTL = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    // Missing third vertex
  endloop
endfacet
endsolid test`;

      const result = await stlImporter.parseSTLContent(malformedSTL);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('malformed');
      }
    });

    it('should handle invalid binary STL', async () => {
      // Too short binary data
      const invalidBinary = new Uint8Array([0x00, 0x01, 0x02]);

      const result = await stlImporter.parseSTLBinary(invalidBinary);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('invalid');
      }
    });

    it('should handle empty STL content', async () => {
      const result = await stlImporter.parseSTLContent('');
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('empty');
      }
    });
  });

  describe('Mesh Validation', () => {
    it('should validate mesh topology', async () => {
      const asciiSTL = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid test`;

      const result = await stlImporter.parseSTLContent(asciiSTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        const validation = stlImporter.validateMesh(mesh);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });

    it('should detect degenerate triangles', async () => {
      const degenerateSTL = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 0 0 0
    vertex 0 0 0
  endloop
endfacet
endsolid test`;

      const result = await stlImporter.parseSTLContent(degenerateSTL);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        const validation = stlImporter.validateMesh(mesh);

        expect(validation.isValid).toBe(false);
        expect(validation.errors.some((error) => error.includes('degenerate'))).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should parse STL within reasonable time', async () => {
      const asciiSTL = `solid test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid test`;

      const startTime = performance.now();
      const result = await stlImporter.parseSTLContent(asciiSTL);
      const endTime = performance.now();

      const parseTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(parseTime).toBeLessThan(100); // Should parse in <100ms

      console.log(`STL parsing time: ${parseTime.toFixed(2)}ms`);
    });
  });
});
