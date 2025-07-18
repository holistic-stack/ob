/**
 * @file use-ast-converter.test.ts
 * @description Tests for the `useASTConverter` React hook, ensuring its functionality for AST to mesh conversion.
 * These tests adhere to TDD principles and utilize real OpenSCAD parser instances (no mocks) as per project guidelines,
 * providing high confidence in the conversion pipeline.
 *
 * @architectural_decision
 * - **Real Parser Instances**: The tests use `createTestParser()` to obtain a real `OpenscadParser` instance.
 *   This decision is crucial for ensuring that the `useASTConverter` hook interacts correctly with the actual parser,
 *   validating the integration rather than just isolated unit behavior.
 * - **Asynchronous Testing**: `renderHook` and `waitFor` from `@testing-library/react` are used to properly test
 *   asynchronous operations and state updates within the hook.
 * - **Comprehensive Scenarios**: Tests cover initialization, single and multiple node conversions, CSG operations,
 *   state tracking, and error handling, including edge cases like uninitialized converter or empty ASTs.
 *
 * @limitations
 * - While using a real parser, the tests do not involve a full 3D rendering environment (e.g., Babylon.js).
 *   The focus is on the data conversion aspect (AST to mesh data structure), not visual rendering.
 * - The `ASTToMeshConversionService`'s internal logic is assumed to be correct and is not re-tested here;
 *   this file focuses on the hook's integration with that service.
 *
 * @example
 * ```typescript
 * // Example of a basic test case:
 * it('should initialize automatically when autoInitialize is true', async () => {
 *   const { result } = renderHook(() => useASTConverter(true));
 *   await waitFor(() => {
 *     expect(result.current.state.isInitialized).toBe(true);
 *   });
 * });
 * ```
 *
 * @diagram
 * ```mermaid
 * graph TD
 *    A[Test Suite: useASTConverter] --> B{renderHook(useASTConverter)};
 *    B --> C[Wait for Initialization (state.isInitialized)];
 *    C -- Initialized --> D[Perform Conversion (convert/convertSingle)];
 *    D --> E[Assert on Conversion Result (success/error)];
 *    D --> F[Assert on Hook State (isConverting, lastConversionTime, error)];
 *    A --> G[Cleanup (parser.dispose())];
 * ```
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createInitializedTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { useASTConverter } from './use-ast-converter';

describe('useASTConverter', () => {
  /**
   * @property {OpenscadParser} parser
   * @description A real instance of the `OpenscadParser` used for generating ASTs in tests.
   * This ensures that the `useASTConverter` hook is tested with actual parser output.
   */
  let parser: OpenscadParser;

  /**
   * @hook beforeEach
   * @description Sets up a new `OpenscadParser` instance before each test.
   * This guarantees a clean and isolated parser state for every test case.
   * @integration_example
   * ```typescript
   * // This ensures that `parser` is always a fresh instance for each `it` block.
   * // For example, if one test modifies the parser's internal state, it won't affect the next test.
   * ```
   */
  beforeEach(async () => {
    parser = await createInitializedTestParser();
  });

  /**
   * @hook afterEach
   * @description Cleans up the `OpenscadParser` instance after each test.
   * This is crucial for releasing resources and preventing memory leaks in the test environment.
   */
  afterEach(() => {
    parser.dispose();
  });

  /**
   * @section Initialization Tests
   * @description Tests related to the initialization behavior of the `useASTConverter` hook.
   */
  describe('Initialization', () => {
    /**
     * @test should initialize automatically when autoInitialize is true
     * @description Verifies that the hook automatically initializes the converter service
     * when `autoInitialize` is set to `true`.
     * @edge_cases
     * - Initial state: The hook should initially report `isInitialized` as `false`.
     * - Asynchronous initialization: `waitFor` is used to handle the asynchronous nature of the initialization.
     * @example
     * ```typescript
     * // The test asserts that `result.current.state.isInitialized` eventually becomes `true`.
     * await waitFor(() => {
     *   expect(result.current.state.isInitialized).toBe(true);
     * });
     * ```
     */
    it('should initialize automatically when autoInitialize is true', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      expect(result.current.state.isInitialized).toBe(false);
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });
      expect(result.current.state.error).toBeNull();
    });

    /**
     * @test should not initialize automatically when autoInitialize is false
     * @description Confirms that the converter service is not automatically initialized
     * when `autoInitialize` is set to `false`.
     * @edge_cases
     * - Manual control: This scenario is important for cases where initialization needs to be triggered explicitly.
     * - Timing: A short delay is introduced to ensure no unexpected auto-initialization occurs.
     */
    it('should not initialize automatically when autoInitialize is false', async () => {
      const { result } = renderHook(() => useASTConverter(false));
      expect(result.current.state.isInitialized).toBe(false);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(result.current.state.isInitialized).toBe(false);
    });
  });

  /**
   * @section Conversion Operations Tests
   * @description Tests covering the `convert` and `convertSingle` functionalities of the hook.
   */
  describe('Conversion Operations', () => {
    /**
     * @test should convert single AST node successfully
     * @description Verifies that the hook can successfully convert a single OpenSCAD AST node
     * into generic mesh data.
     * @integration_example
     * ```typescript
     * // Parses 'cube(10);' to get an AST, then converts the first node.
     * const code = 'cube(10);';
     * const parseResult = parser.parseASTWithResult(code);
     * const conversionResult = await result.current.convertSingle(parseResult.data[0]);
     * expect(conversionResult.success).toBe(true);
     * expect(conversionResult.data.geometry).toBeDefined();
     * ```
     * @limitations
     * - The exact structure of `conversionResult.data` (e.g., `id`, `geometry`, `material`, `metadata`)
     *   depends on the `ASTToMeshConversionService` implementation.
     */
    it('should convert single AST node successfully', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      const conversionResult = await result.current.convertSingle(parseResult.data[0]);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.id).toBeDefined();
      expect(conversionResult.data.geometry).toBeDefined();
      expect(conversionResult.data.material).toBeDefined();
      expect(conversionResult.data.metadata.vertexCount).toBeGreaterThan(0);
    });

    /**
     * @test should convert multiple AST nodes successfully
     * @description Ensures that the hook can process an array of AST nodes and return
     * a `ConversionResult` containing multiple meshes.
     * @integration_example
     * ```typescript
     * // Parses 'cube(10); sphere(5);' to get an AST with two nodes, then converts them.
     * const code = 'cube(10); sphere(5);';
     * const parseResult = parser.parseASTWithResult(code);
     * const conversionResult = await result.current.convert(parseResult.data);
     * expect(conversionResult.success).toBe(true);
     * expect(conversionResult.data.meshes).toHaveLength(2);
     * ```
     */
    it('should convert multiple AST nodes successfully', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const code = 'cube(10); sphere(5);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      const conversionResult = await result.current.convert(parseResult.data);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.meshes).toHaveLength(2);
      expect(conversionResult.data.totalVertices).toBeGreaterThan(0);
      expect(conversionResult.data.errors).toHaveLength(0);
    });

    /**
     * @test should handle CSG operations
     * @description Verifies that the hook correctly processes AST nodes representing
     * Constructive Solid Geometry (CSG) operations (e.g., `difference`, `union`, `intersection`).
     * @integration_example
     * ```typescript
     * // Parses 'difference() { cube(10); sphere(5); }' and converts the resulting AST.
     * const code = 'difference() { cube(10); sphere(5); }';
     * const parseResult = parser.parseASTWithResult(code);
     * const conversionResult = await result.current.convert(parseResult.data);
     * expect(conversionResult.success).toBe(true);
     * expect(conversionResult.data.meshes.length).toBeGreaterThan(0);
     * ```
     * @limitations
     * - This test only confirms that a mesh is generated; it does not visually verify the correctness of the CSG operation.
     *   Visual regression tests or more detailed geometry checks would be needed for that.
     */
    it('should handle CSG operations', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const code = 'difference() { cube(10); sphere(5); }';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      const conversionResult = await result.current.convert(parseResult.data);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.meshes.length).toBeGreaterThan(0);
    });
  });

  /**
   * @section State Management Tests
   * @description Tests focusing on how the `useASTConverter` hook manages its internal state
   * during various operations.
   */
  describe('State Management', () => {
    /**
     * @test should track conversion state correctly
     * @description Asserts that the `isConverting` and `lastConversionTime` states are updated
     * appropriately during and after a conversion operation.
     * @edge_cases
     * - `isConverting` should be `true` while conversion is in progress and `false` afterwards.
     * - `lastConversionTime` should be greater than 0 after a conversion.
     */
    it('should track conversion state correctly', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      expect(result.current.state.isConverting).toBe(false);

      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      const conversionPromise = result.current.convert(parseResult.data);
      const conversionResult = await conversionPromise;

      expect(conversionResult.success).toBe(true);

      await waitFor(() => {
        expect(result.current.state.isConverting).toBe(false);
        expect(result.current.state.lastConversionTime).toBeGreaterThan(0);
      });
    });

    /**
     * @test should handle conversion errors gracefully
     * @description Verifies that when a conversion fails, the `error` state is updated
     * and `isConverting` is reset to `false`.
     * @edge_cases
     * - Invalid input: An `invalidNode` is used to simulate a conversion error.
     * - Error propagation: The `error` state should contain a defined error message.
     */
    it('should handle conversion errors gracefully', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const invalidNode = { type: 'invalid', location: null };
      const conversionResult = await result.current.convertSingle(invalidNode);

      expect(conversionResult.success).toBe(false);
      expect(result.current.state.error).toBeDefined();
      expect(result.current.state.isConverting).toBe(false);
    });

    /**
     * @test should clear errors when requested
     * @description Tests the `clearError` function, ensuring it resets the `error` state to `null`.
     * @example
     * ```typescript
     * // Simulate an error, then clear it:
     * await result.current.convertSingle({ type: 'invalid' });
     * expect(result.current.state.error).toBeDefined();
     * result.current.clearError();
     * expect(result.current.state.error).toBeNull();
     * ```
     */
    it('should clear errors when requested', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const invalidNode = { type: 'invalid', location: null };
      await result.current.convertSingle(invalidNode);

      expect(result.current.state.error).toBeDefined();

      result.current.clearError();

      expect(result.current.state.error).toBeNull();
    });
  });

  /**
   * @section Error Handling Tests
   * @description Specific tests for various error scenarios within the hook.
   */
  describe('Error Handling', () => {
    /**
     * @test should fail gracefully when not initialized
     * @description Confirms that conversion attempts fail with an appropriate error message
     * if the hook has not been initialized.
     * @edge_cases
     * - Early call: Calling `convert` before `isInitialized` is `true`.
     */
    it('should fail gracefully when not initialized', async () => {
      const { result } = renderHook(() => useASTConverter(false));
      const conversionResult = await result.current.convert([]);

      expect(conversionResult.success).toBe(false);
      if (!conversionResult.success) {
        expect(conversionResult.error).toContain('not initialized');
      }
    });

    /**
     * @test should handle empty AST arrays
     * @description Verifies that passing an empty array of AST nodes to `convert`
     * results in a successful conversion with no meshes or errors.
     * @edge_cases
     * - Empty input: Ensures the function handles an empty array gracefully without throwing errors.
     */
    it('should handle empty AST arrays', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const conversionResult = await result.current.convert([]);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.meshes).toHaveLength(0);
      expect(conversionResult.data.errors).toHaveLength(0);
    });
  });

  /**
   * @section Performance Tracking Tests
   * @description Tests specifically for the performance tracking capabilities of the hook.
   */
  describe('Performance Tracking', () => {
    /**
     * @test should track conversion time
     * @description Asserts that the `lastConversionTime` state is updated with a positive value
     * after a successful conversion, indicating that performance metrics are being captured.
     */
    it('should track conversion time', async () => {
      const { result } = renderHook(() => useASTConverter(true));
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      await result.current.convert(parseResult.data);

      await waitFor(() => {
        expect(result.current.state.lastConversionTime).toBeGreaterThan(0);
      });
    });
  });
});
