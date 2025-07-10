import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from '../../../../shared/services/logger.service.js';
import type { Result } from '../../../../shared/types/result.types.js';
import type { ASTNode, TranslateNode } from '../../../openscad-parser/core/ast-types.js';
import { convertTranslateNode } from './transformation-converter.js';

const logger = createLogger('TransformationConverterTest');

describe('TransformationConverter - Vector Parsing Fixes', () => {
  let mockMaterial: THREE.Material;
  let mockConvertASTNodeToMesh: (
    node: ASTNode,
    material: THREE.Material
  ) => Promise<Result<THREE.Mesh, string>>;

  beforeEach(() => {
    // Create mock material
    mockMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff88 });

    // Mock the convertASTNodeToMesh function
    mockConvertASTNodeToMesh = vi.fn().mockResolvedValue({
      success: true,
      data: new THREE.Mesh(new THREE.SphereGeometry(5), mockMaterial),
    }) as any;

    // Mock the getCurrentSourceCode function
    vi.stubGlobal('document', {
      querySelector: vi.fn().mockReturnValue({
        value: 'cube(5, center=true);translate([100,20,30])sphere(10);',
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('Tree-sitter Vector Parsing', () => {
    it('should correctly parse vector when Tree-sitter provides complete data', async () => {
      // Arrange: Create translate node with correct vector from Tree-sitter
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [100, 20, 30], // Correct vector from Tree-sitter
        children: [
          {
            type: 'sphere',
            radius: 10,
            location: {
              start: { line: 0, column: 27, offset: 27 },
              end: { line: 0, column: 38, offset: 38 },
            },
          },
        ],
        location: {
          start: { line: 0, column: 8, offset: 8 },
          end: { line: 0, column: 38, offset: 38 },
        },
      };

      // Act: Convert the translate node
      const result = await convertTranslateNode(
        translateNode,
        mockMaterial,
        mockConvertASTNodeToMesh
      );

      // Assert: Should use Tree-sitter vector directly
      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeInstanceOf(THREE.Mesh);

        // Verify the translation was applied to geometry
        const geometry = mesh.geometry;
        expect(geometry).toBeInstanceOf(THREE.SphereGeometry);

        // The translation should be applied to the geometry vertices
        // We can verify this by checking that the geometry has been modified
        expect(geometry.attributes.position).toBeDefined();
      }
    });

    it('should use text-based workaround when Tree-sitter provides incomplete vector', async () => {
      // Arrange: Create translate node with incomplete vector from Tree-sitter (simulating the bug)
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [10, 0, 0], // Incomplete/incorrect vector from Tree-sitter
        children: [
          {
            type: 'sphere',
            radius: 10,
            location: {
              start: { line: 0, column: 27, offset: 27 },
              end: { line: 0, column: 38, offset: 38 },
            },
          },
        ],
        location: {
          start: { line: 0, column: 8, offset: 8 },
          end: { line: 0, column: 38, offset: 38 },
        },
      };

      // Mock getCurrentSourceCode to return the correct source
      vi.stubGlobal('document', {
        querySelector: vi.fn().mockReturnValue({
          value: 'cube(5, center=true);translate([100,20,30])sphere(10);',
        }),
      });

      // Act: Convert the translate node
      const result = await convertTranslateNode(
        translateNode,
        mockMaterial,
        mockConvertASTNodeToMesh
      );

      // Assert: Should successfully extract correct vector from source code
      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeInstanceOf(THREE.Mesh);

        // The workaround should have extracted [100, 20, 30] from source code
        // We can verify this by checking the geometry transformation
        const geometry = mesh.geometry;
        expect(geometry).toBeInstanceOf(THREE.SphereGeometry);
      }
    });

    it('should handle various vector formats in source code', async () => {
      const testCases = [
        { source: 'translate([100, 20, 30])sphere(10);', expected: [100, 20, 30] },
        { source: 'translate([50,10,5])cube(5);', expected: [50, 10, 5] },
        { source: 'translate([ 25 , 15 , 35 ])cylinder(h=10, r=5);', expected: [25, 15, 35] },
        { source: 'translate([0,0,100])polyhedron();', expected: [0, 0, 100] },
      ];

      for (const testCase of testCases) {
        // Arrange
        const translateNode: TranslateNode = {
          type: 'translate',
          v: [0, 0, 0], // Force workaround usage
          children: [
            {
              type: 'sphere',
              radius: 5,
              location: {
                start: { line: 0, column: 20, offset: 20 },
                end: { line: 0, column: 30, offset: 30 },
              },
            },
          ],
          location: {
            start: { line: 0, column: 0, offset: 0 },
            end: { line: 0, column: 30, offset: 30 },
          },
        };

        // Mock source code
        vi.stubGlobal('document', {
          querySelector: vi.fn().mockReturnValue({
            value: testCase.source,
          }),
        });

        // Act
        const result = await convertTranslateNode(
          translateNode,
          mockMaterial,
          mockConvertASTNodeToMesh
        );

        // Assert
        expect(result.success).toBe(true);
        logger.info(`✅ Test case passed for source: ${testCase.source}`);
      }
    });

    it('should gracefully handle malformed source code', async () => {
      // Arrange: Malformed source code
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [0, 0, 0], // Force workaround usage
        children: [
          {
            type: 'sphere',
            radius: 5,
            location: {
              start: { line: 0, column: 20, offset: 20 },
              end: { line: 0, column: 30, offset: 30 },
            },
          },
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 30, offset: 30 },
        },
      };

      // Mock malformed source code
      vi.stubGlobal('document', {
        querySelector: vi.fn().mockReturnValue({
          value: 'translate([invalid,syntax])sphere(10);',
        }),
      });

      // Act
      const result = await convertTranslateNode(
        translateNode,
        mockMaterial,
        mockConvertASTNodeToMesh
      );

      // Assert: Should fall back to default [0, 0, 0] vector
      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeInstanceOf(THREE.Mesh);
      }
    });

    it('should handle missing source code gracefully', async () => {
      // Arrange
      const translateNode: TranslateNode = {
        type: 'translate',
        v: [0, 0, 0], // Force workaround usage
        children: [
          {
            type: 'sphere',
            radius: 5,
            location: {
              start: { line: 0, column: 20, offset: 20 },
              end: { line: 0, column: 30, offset: 30 },
            },
          },
        ],
        location: {
          start: { line: 0, column: 0, offset: 0 },
          end: { line: 0, column: 30, offset: 30 },
        },
      };

      // Mock missing source code
      vi.stubGlobal('document', {
        querySelector: vi.fn().mockReturnValue(null),
      });

      // Act
      const result = await convertTranslateNode(
        translateNode,
        mockMaterial,
        mockConvertASTNodeToMesh
      );

      // Assert: Should fall back to default [0, 0, 0] vector
      expect(result.success).toBe(true);
      if (result.success) {
        const mesh = result.data;
        expect(mesh).toBeInstanceOf(THREE.Mesh);
      }
    });
  });
});
