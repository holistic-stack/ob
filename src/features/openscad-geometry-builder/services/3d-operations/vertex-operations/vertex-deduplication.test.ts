/**
 * @file vertex-deduplication.test.ts
 * @description Tests for Vertex Deduplication Service following TDD methodology.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { isError, isSuccess } from '@/shared';
import type { Vector3 } from '../../../types/geometry-data';
import { VertexDeduplicationService } from './vertex-deduplication';

describe('VertexDeduplicationService', () => {
  let service: VertexDeduplicationService;

  beforeEach(() => {
    service = new VertexDeduplicationService();
  });

  describe('deduplicateVertices', () => {
    describe('basic deduplication', () => {
      it('should remove exact duplicate vertices', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 0 }, // Duplicate of vertex 0
          { x: 1, y: 0, z: 0 }, // Duplicate of vertex 1
        ];

        const faces = [
          [0, 1, 2],
          [3, 4, 2], // Uses duplicate vertices
        ];

        const result = service.deduplicateVertices(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBe(3); // Should have 3 unique vertices
          expect(result.data.duplicatesRemoved).toBe(2);
          expect(result.data.faces.length).toBe(2);
          expect(result.data.vertexMapping).toEqual([0, 1, 2, 0, 1]); // Mapping to unique indices
        }
      });

      it('should handle vertices within tolerance', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0.0000001, y: 0, z: 0 }, // Very close to vertex 0
        ];

        const faces = [[0, 1, 2]];

        const result = service.deduplicateVertices(vertices, faces, { tolerance: 1e-6 });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBe(2); // Should merge vertices 0 and 2
          expect(result.data.duplicatesRemoved).toBe(1);
        }
      });

      it('should preserve vertices outside tolerance', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0.001, y: 0, z: 0 }, // Outside default tolerance
        ];

        const faces = [[0, 1, 2]];

        const result = service.deduplicateVertices(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBe(3); // Should keep all vertices
          expect(result.data.duplicatesRemoved).toBe(0);
        }
      });
    });

    describe('face handling', () => {
      it('should update face indices correctly', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 }, // Index 0
          { x: 1, y: 0, z: 0 }, // Index 1
          { x: 0, y: 1, z: 0 }, // Index 2
          { x: 0, y: 0, z: 0 }, // Index 3 (duplicate of 0)
        ];

        const faces = [
          [0, 1, 2],
          [1, 3, 2], // Uses duplicate vertex 3
        ];

        const result = service.deduplicateVertices(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.faces).toEqual([
            [0, 1, 2],
            [1, 0, 2], // Index 3 mapped to 0
          ]);
        }
      });

      it('should remove degenerate faces', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 0 }, // Duplicate
          { x: 1, y: 0, z: 0 }, // Duplicate
        ];

        const faces = [
          [0, 1, 2], // Valid face
          [3, 4, 0], // Will become [0, 1, 0] - degenerate
        ];

        const result = service.deduplicateVertices(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.faces.length).toBe(1); // Degenerate face removed
          expect(result.data.faces[0]).toEqual([0, 1, 2]);
        }
      });
    });

    describe('performance and statistics', () => {
      it('should provide accurate statistics', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 0 }, // Duplicate
          { x: 1, y: 0, z: 0 }, // Duplicate
        ];

        const faces = [[0, 1, 2]];

        const result = service.deduplicateVertices(vertices, faces);

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          const stats = service.getDeduplicationStats(vertices.length, result.data);

          expect(stats.originalVertexCount).toBe(5);
          expect(stats.finalVertexCount).toBe(3);
          expect(stats.duplicatesRemoved).toBe(2);
          expect(stats.compressionRatio).toBeCloseTo(0.4, 2); // 2/5 = 0.4
          expect(stats.memoryReduction).toBeGreaterThan(0);
        }
      });

      it('should handle large vertex arrays efficiently', () => {
        // Create a large array with many duplicates
        const vertices: Vector3[] = [];
        const faces: number[][] = [];

        // Add 1000 vertices with many duplicates
        for (let i = 0; i < 1000; i++) {
          vertices.push({
            x: Math.floor(i / 10), // Creates 10 duplicates for each unique position
            y: 0,
            z: 0,
          });
        }

        // Add some faces
        for (let i = 0; i < 990; i += 3) {
          faces.push([i, i + 1, i + 2]);
        }

        const startTime = performance.now();
        const result = service.deduplicateVertices(vertices, faces);
        const endTime = performance.now();

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBe(100); // Should have ~100 unique vertices
          expect(result.data.duplicatesRemoved).toBe(900);
          expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
        }
      });
    });

    describe('error handling', () => {
      it('should handle empty vertex array', () => {
        const result = service.deduplicateVertices([], [[0, 1, 2]]);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('empty');
        }
      });

      it('should handle empty faces array', () => {
        const vertices = [{ x: 0, y: 0, z: 0 }];
        const result = service.deduplicateVertices(vertices, []);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
          expect(result.error.message).toContain('empty');
        }
      });

      it('should handle null inputs gracefully', () => {
        const result = service.deduplicateVertices(null as never, null as never);

        expect(isError(result)).toBe(true);
        if (isError(result)) {
          expect(result.error.type).toBe('INVALID_PARAMETERS');
        }
      });
    });

    describe('custom options', () => {
      it('should respect custom tolerance', () => {
        const vertices: Vector3[] = [
          { x: 0, y: 0, z: 0 },
          { x: 0.5, y: 0, z: 0 }, // Within custom tolerance
        ];

        const faces = [[0, 1, 0]]; // Dummy face

        const result = service.deduplicateVertices(vertices, faces, { tolerance: 1.0 });

        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data.vertices.length).toBe(1); // Should merge with large tolerance
        }
      });
    });
  });
});
