/**
 * @file off-importer.test.ts
 * @description Tests for OFFImporterService
 *
 * Tests OFF (Object File Format) file parsing, mesh validation, and OpenSCAD import() primitive compatibility.
 * Follows TDD approach with comprehensive test coverage for OFF import functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared/types';
import type { ImportParameters } from '../../../../types/import-parameters';
import { OFFImporterService } from './off-importer';

describe('OFFImporterService', () => {
  let offImporter: OFFImporterService;

  beforeEach(() => {
    offImporter = new OFFImporterService();
  });

  describe('Basic OFF Parsing', () => {
    it('should parse simple OFF triangle', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(3);
        expect(mesh.faces).toHaveLength(1);
        expect(mesh.faces[0]).toEqual([0, 1, 2]);
        expect(mesh.metadata.vertexCount).toBe(3);
        expect(mesh.metadata.faceCount).toBe(1);
      }
    });

    it('should parse OFF with multiple faces', async () => {
      const offContent = `OFF
4 2 0
0.0 0.0 0.0
1.0 0.0 0.0
1.0 1.0 0.0
0.0 1.0 0.0
3 0 1 2
3 0 2 3`;

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(4);
        expect(mesh.faces).toHaveLength(2);
        expect(mesh.metadata.faceCount).toBe(2);
      }
    });

    it('should handle OFF with comments', async () => {
      const offContent = `# This is a comment
OFF
# Another comment
3 1 0
# Vertices
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
# Faces
3 0 1 2`;

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(3);
        expect(mesh.faces).toHaveLength(1);
      }
    });

    it('should handle OFF with quad faces', async () => {
      const offContent = `OFF
4 1 0
0.0 0.0 0.0
1.0 0.0 0.0
1.0 1.0 0.0
0.0 1.0 0.0
4 0 1 2 3`;

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(4);
        expect(mesh.faces).toHaveLength(2); // Quad should be triangulated into 2 triangles
        expect(mesh.faces[0]).toEqual([0, 1, 2]);
        expect(mesh.faces[1]).toEqual([0, 2, 3]);
      }
    });
  });

  describe('Import with Parameters', () => {
    it('should import OFF with scaling', async () => {
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

      const result = await offImporter.importOFF(offContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        // Vertices should be scaled by 2.0
        expect(mesh.vertices[1]).toEqual({ x: 2, y: 0, z: 0 });
        expect(mesh.vertices[2]).toEqual({ x: 0, y: 2, z: 0 });
      }
    });

    it('should import OFF with centering', async () => {
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

      const result = await offImporter.importOFF(offContent, params);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const polyhedronData = result.data;

        // Create OFFMesh from polyhedron data for bounds calculation
        const offMesh = {
          vertices: Array.from(polyhedronData.vertices),
          faces: Array.from(polyhedronData.faces),
          metadata: {
            vertexCount: polyhedronData.vertices.length,
            faceCount: polyhedronData.faces.length,
            edgeCount: 0, // Not needed for bounds calculation
          },
        };

        // Mesh should be centered around origin
        const bounds = offImporter.calculateBounds(offMesh);
        const centerX = (bounds.min.x + bounds.max.x) / 2;
        const centerY = (bounds.min.y + bounds.max.y) / 2;

        expect(centerX).toBeCloseTo(0, 5);
        expect(centerY).toBeCloseTo(0, 5);
      }
    });

    it('should import OFF with origin offset', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const params: ImportParameters = {
        file: 'test.off',
        origin: [5, 10],
      };

      const result = await offImporter.importOFF(offContent, params);

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
    it('should handle malformed OFF header', async () => {
      const malformedOFF = `INVALID
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const result = await offImporter.parseOFFContent(malformedOFF);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('invalid');
      }
    });

    it('should handle invalid vertex count', async () => {
      const invalidOFF = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
# Missing third vertex
3 0 1 2`;

      const result = await offImporter.parseOFFContent(invalidOFF);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('vertex');
      }
    });

    it('should handle invalid face indices', async () => {
      const invalidOFF = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 5`; // Index 5 doesn't exist

      const result = await offImporter.parseOFFContent(invalidOFF);
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('index');
      }
    });

    it('should handle empty OFF content', async () => {
      const result = await offImporter.parseOFFContent('');
      expect(isError(result)).toBe(true);

      if (isError(result)) {
        expect(result.error.message).toContain('empty');
      }
    });
  });

  describe('Mesh Validation', () => {
    it('should validate mesh topology', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        const validation = offImporter.validateMesh(mesh);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });

    it('should detect invalid face indices', async () => {
      // Create a mesh with invalid face indices manually
      const offContent = `OFF
2 1 0
0.0 0.0 0.0
1.0 0.0 0.0
3 0 1 2`; // Index 2 doesn't exist (only 0 and 1 are valid)

      const result = await offImporter.parseOFFContent(offContent);
      expect(isError(result)).toBe(true);
    });
  });

  describe('Advanced Features', () => {
    it('should handle polygon faces with more than 4 vertices', async () => {
      const offContent = `OFF
5 1 0
0.0 0.0 0.0
1.0 0.0 0.0
1.0 1.0 0.0
0.0 1.0 0.0
0.5 0.5 1.0
5 0 1 2 3 4`; // Pentagon

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(5);
        expect(mesh.faces.length).toBeGreaterThan(1); // Pentagon should be triangulated
      }
    });

    it('should handle mixed triangle and quad faces', async () => {
      const offContent = `OFF
5 2 0
0.0 0.0 0.0
1.0 0.0 0.0
1.0 1.0 0.0
0.0 1.0 0.0
0.5 0.5 1.0
3 0 1 4
4 1 2 3 0`;

      const result = await offImporter.parseOFFContent(offContent);

      expect(isSuccess(result)).toBe(true);

      if (isSuccess(result)) {
        const mesh = result.data;
        expect(mesh.vertices).toHaveLength(5);
        expect(mesh.faces).toHaveLength(3); // 1 triangle + 1 quad (triangulated) = 3 triangles
      }
    });
  });

  describe('Performance', () => {
    it('should parse OFF within reasonable time', async () => {
      const offContent = `OFF
3 1 0
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
3 0 1 2`;

      const startTime = performance.now();
      const result = await offImporter.parseOFFContent(offContent);
      const endTime = performance.now();

      const parseTime = endTime - startTime;

      expect(isSuccess(result)).toBe(true);
      expect(parseTime).toBeLessThan(100); // Should parse in <100ms

      console.log(`OFF parsing time: ${parseTime.toFixed(2)}ms`);
    });
  });
});
