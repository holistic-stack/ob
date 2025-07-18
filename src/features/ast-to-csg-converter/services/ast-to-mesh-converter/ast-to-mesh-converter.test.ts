/**
 * @file ast-to-mesh-converter.test.ts
 * @description Comprehensive test suite for the `ASTToMeshConversionService`.
 * These tests adhere to TDD principles and utilize real OpenSCAD parser instances (no mocks)
 * to ensure robust and reliable conversion from AST nodes to generic mesh data.
 *
 * @architectural_decision
 * - **Real Dependencies**: The tests use `createInitializedTestParser()` and a real `ASTToMeshConversionService`
 *   instance. This approach validates the integration between the parser and the converter,
 *   providing higher confidence than isolated unit tests with mocks.
 * - **Lifecycle Management**: `beforeEach` and `afterEach` hooks are used to ensure a clean state
 *   for each test, including proper initialization and disposal of services.
 * - **Result Type Validation**: Tests explicitly check the `success` and `error` properties of the `Result` type
 *   returned by conversion operations, ensuring robust error handling.
 *
 * @limitations
 * - While the tests verify the data structure of the generated meshes, they do not perform visual validation
 *   of the 3D geometry. This would typically be covered by visual regression tests in a separate suite.
 * - The `BabylonCSG2Service` is initialized internally by `ASTToMeshConversionService`, but its specific
 *   functionality is not deeply tested here; it's assumed to work correctly based on its own test suite.
 *
 * @example
 * ```typescript
 * // Example of a test case for single node conversion:
 * it('should convert cube AST node to generic mesh', async () => {
 *   const code = 'cube(10);';
 *   const parseResult = parser.parseASTWithResult(code);
 *   const result = await converter.convertSingle(parseResult.data[0]);
 *   expect(result.success).toBe(true);
 *   expect(result.data.geometry).toBeDefined();
 * });
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[Test Suite: ASTToMeshConversionService] --> B[beforeEach: Initialize Parser & Converter];
 *    B --> C[Test Case: Single Node Conversion];
 *    C --> C1[Parse OpenSCAD Code];
 *    C1 --> C2[Call converter.convertSingle()];
 *    C2 --> C3[Assert on Result (success, data structure)];
 *    B --> D[Test Case: Multiple Node Conversion];
 *    D --> D1[Parse OpenSCAD Code (multiple objects)];
 *    D1 --> D2[Call converter.convert()];
 *    D2 --> D3[Assert on Result (success, array length, totals)];
 *    B --> E[afterEach: Dispose Parser & Converter];
 * ```
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createInitializedTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { ASTNode } from '../../../openscad-parser/ast/ast-types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import type { ConversionOptions } from '../../types/conversion.types';
import { ASTToMeshConversionService } from './ast-to-mesh-converter';

describe('ASTToMeshConversionService', () => {
  /**
   * @property {OpenscadParser} parser
   * @description An initialized instance of the `OpenscadParser` used to generate ASTs for testing.
   */
  let parser: OpenscadParser;

  /**
   * @property {ASTToMeshConversionService} converter
   * @description An instance of the `ASTToMeshConversionService` under test.
   */
  let converter: ASTToMeshConversionService;

  /**
   * @hook beforeEach
   * @description Sets up the testing environment before each test.
   * It initializes a real `OpenscadParser` and `ASTToMeshConversionService`,
   * ensuring a clean and ready-to-use state for every test case.
   */
  beforeEach(async () => {
    parser = await createInitializedTestParser();
    converter = new ASTToMeshConversionService();
    await converter.initialize();
  });

  /**
   * @hook afterEach
   * @description Cleans up resources after each test.
   * It disposes of both the `ASTToMeshConversionService` and `OpenscadParser` instances
   * to prevent memory leaks and ensure test isolation.
   */
  afterEach(() => {
    converter.dispose();
    parser.dispose();
  });

  /**
   * @section Initialization Tests
   * @description Tests related to the initialization and lifecycle of the `ASTToMeshConversionService`.
   */
  describe('Initialization', () => {
    /**
     * @test should initialize successfully
     * @description Verifies that a new instance of the service can be initialized without errors.
     * @example
     * ```typescript
     * const newConverter = new ASTToMeshConversionService();
     * const result = await newConverter.initialize();
     * expect(result.success).toBe(true);
     * newConverter.dispose();
     * ```
     */
    it('should initialize successfully', async () => {
      const newConverter = new ASTToMeshConversionService();
      const result = await newConverter.initialize();
      expect(result.success).toBe(true);
      newConverter.dispose();
    });

    /**
     * @test should handle multiple initialization calls
     * @description Ensures that calling `initialize()` multiple times on the same instance
     * does not cause errors and the service remains in a valid state.
     * @edge_cases
     * - Idempotency: The `initialize` method should be idempotent, meaning subsequent calls
     *   have no additional effect or side effects.
     */
    it('should handle multiple initialization calls', async () => {
      const result1 = await converter.initialize();
      const result2 = await converter.initialize();
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  /**
   * @section Single Node Conversion Tests
   * @description Tests for converting individual AST nodes into mesh data.
   */
  describe('Single Node Conversion', () => {
    /**
     * @test should convert cube AST node to generic mesh
     * @description Verifies that a `cube` AST node can be successfully converted into `GenericMeshData`,
     * and that the resulting mesh has defined properties and positive vertex/triangle counts.
     * @integration_example
     * ```typescript
     * const code = 'cube(10);';
     * const parseResult = parser.parseASTWithResult(code);
     * const result = await converter.convertSingle(parseResult.data[0]);
     * expect(result.success).toBe(true);
     * expect(result.data.geometry).toBeDefined();
     * expect(result.data.metadata.vertexCount).toBeGreaterThan(0);
     * ```
     */
    it('should convert cube AST node to generic mesh', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      expect(ast.length).toBe(1);

      const result = await converter.convertSingle(ast[0]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const mesh = result.data;
      expect(mesh.id).toBeDefined();
      expect(mesh.geometry).toBeDefined();
      expect(mesh.material).toBeDefined();
      expect(mesh.transform).toBeDefined();
      expect(mesh.metadata).toBeDefined();

      expect(mesh.metadata.meshId).toBeDefined();
      expect(mesh.metadata.vertexCount).toBeGreaterThan(0);
      expect(mesh.metadata.triangleCount).toBeGreaterThan(0);
    });

    /**
     * @test should convert sphere AST node to generic mesh
     * @description Confirms that a `sphere` AST node can be converted, similar to the cube test.
     */
    it('should convert sphere AST node to generic mesh', async () => {
      const code = 'sphere(5);';
      const parseResult = parser.parseASTWithResult(code);

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convertSingle(ast[0]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.metadata.vertexCount).toBeGreaterThan(0);
    });

    /**
     * @test should handle conversion errors gracefully
     * @description Verifies that the service gracefully handles invalid AST nodes during single conversion,
     * returning a failed `Result` with an error message.
     * @edge_cases
     * - Invalid input: An `invalidNode` is passed to simulate a scenario where the AST structure is unexpected.
     */
    it('should handle conversion errors gracefully', async () => {
      const invalidNode = { type: 'invalid', location: null } as unknown as ASTNode;

      const result = await converter.convertSingle(invalidNode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  /**
   * @section Multiple Node Conversion Tests
   * @description Tests for converting an array of AST nodes into a collection of mesh data.
   */
  describe('Multiple Node Conversion', () => {
    /**
     * @test should convert multiple AST nodes to generic meshes
     * @description Ensures that the service can process multiple AST nodes (e.g., `cube` and `sphere`)
     * and return a `ConversionResult` containing all converted meshes and aggregate statistics.
     * @integration_example
     * ```typescript
     * const code = 'cube(10); sphere(5);';
     * const parseResult = parser.parseASTWithResult(code);
     * const result = await converter.convert(parseResult.data);
     * expect(result.success).toBe(true);
     * expect(result.data.meshes).toHaveLength(2);
     * expect(result.data.totalVertices).toBeGreaterThan(0);
     * ```
     */
    it('should convert multiple AST nodes to generic meshes', async () => {
      const code = 'cube(10); sphere(5);';
      const parseResult = parser.parseASTWithResult(code);

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convert(ast);

      expect(result.success).toBe(true);
      if (!result.success) return;

      const conversionResult = result.data;
      expect(conversionResult.meshes).toHaveLength(2);
      expect(conversionResult.totalVertices).toBeGreaterThan(0);
      expect(conversionResult.totalTriangles).toBeGreaterThan(0);
      expect(conversionResult.operationTime).toBeGreaterThan(0);
      expect(conversionResult.errors).toHaveLength(0);
    });

    /**
     * @test should handle CSG operations
     * @description Verifies that the service correctly processes AST nodes representing
     * Constructive Solid Geometry (CSG) operations (e.g., `difference`).
     * @integration_example
     * ```typescript
     * const code = 'difference() { cube(10); sphere(5); }';
     * const parseResult = parser.parseASTWithResult(code);
     * const result = await converter.convert(parseResult.data);
     * expect(result.success).toBe(true);
     * expect(result.data.meshes.length).toBeGreaterThan(0);
     * ```
     */
    it('should handle CSG operations', async () => {
      const code = 'difference() { cube(10); sphere(5); }';
      const parseResult = parser.parseASTWithResult(code);

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const ast = parseResult.data;
      const result = await converter.convert(ast);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.meshes.length).toBeGreaterThan(0);
    });

    /**
     * @test should collect errors for failed conversions
     * @description Ensures that when converting multiple nodes, the service collects errors
     * for failed individual conversions while still returning successfully for valid ones.
     * @edge_cases
     * - Mixed input: An array containing both valid and invalid AST nodes.
     * - Partial success: The `meshes` array should contain only successfully converted items,
     *   and the `errors` array should list all failures.
     */
    it('should collect errors for failed conversions', async () => {
      const validNode = { type: 'cube', size: 10, location: null } as unknown as ASTNode;
      const invalidNode = { type: 'invalid', location: null } as unknown as ASTNode;

      const result = await converter.convert([validNode, invalidNode]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.meshes.length).toBe(1);
      expect(result.data.errors.length).toBe(1);
    });
  });

  /**
   * @section Conversion Options Tests
   * @description Tests for verifying that conversion options are correctly applied.
   */
  describe('Conversion Options', () => {
    /**
     * @test should respect optimization options
     * @description Checks if the `optimizeResult` option is correctly reflected in the `metadata`
     * of the generated mesh.
     */
    it('should respect optimization options', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const options: ConversionOptions = {
        optimizeResult: true,
        preserveMaterials: false,
      };

      const result = await converter.convertSingle(parseResult.data[0], options);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.metadata.isOptimized).toBe(true);
    });

    /**
     * @test should handle caching when enabled
     * @description Verifies that when caching is enabled, subsequent conversions of the same AST node
     * return the cached result (indicated by identical mesh IDs).
     * @edge_cases
     * - Cache hit: The second conversion should be faster and return the same mesh ID.
     * - Cache key: The `generateCacheKey` method is implicitly tested here.
     */
    it('should handle caching when enabled', async () => {
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;

      const options: ConversionOptions = { enableCaching: true };

      const result1 = await converter.convertSingle(parseResult.data[0], options);
      expect(result1.success).toBe(true);

      const result2 = await converter.convertSingle(parseResult.data[0], options);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result1.data.id).toBe(result2.data.id);
      }
    });
  });

  /**
   * @section Resource Management Tests
   * @description Tests for proper disposal of service resources.
   */
  describe('Resource Management', () => {
    /**
     * @test should dispose resources properly
     * @description Ensures that calling the `dispose()` method does not throw any errors,
     * indicating that resources are being cleaned up gracefully.
     */
    it('should dispose resources properly', () => {
      expect(() => converter.dispose()).not.toThrow();
    });

    /**
     * @test should handle disposal of uninitialized converter
     * @description Verifies that `dispose()` can be called safely even on a service
     * that has not been initialized.
     */
    it('should handle disposal of uninitialized converter', () => {
      const newConverter = new ASTToMeshConversionService();
      expect(() => newConverter.dispose()).not.toThrow();
    });
  });

  /**
   * @section Error Handling Tests (Service Level)
   * @description Additional tests for error handling at the service level, beyond individual node conversion.
   */
  describe('Error Handling', () => {
    /**
     * @test should fail gracefully when not initialized
     * @description Confirms that conversion attempts fail with an appropriate error message
     * if the service has not been initialized by calling `initialize()`.
     */
    it('should fail gracefully when not initialized', async () => {
      const uninitializedConverter = new ASTToMeshConversionService();

      const result = await uninitializedConverter.convert([]);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not initialized');
      }
    });

    /**
     * @test should handle empty AST arrays
     * @description Verifies that passing an empty array of AST nodes to `convert`
     * results in a successful conversion with no meshes or errors, indicating graceful handling of empty input.
     */
    it('should handle empty AST arrays', async () => {
      const result = await converter.convert([]);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.meshes).toHaveLength(0);
      expect(result.data.errors).toHaveLength(0);
    });
  });
});
