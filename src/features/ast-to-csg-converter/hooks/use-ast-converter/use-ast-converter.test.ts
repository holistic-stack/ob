/**
 * @file React Hook Tests for AST Converter
 *
 * Tests for the useASTConverter hook following TDD principles.
 * Uses real OpenSCAD parser instances (no mocks) as per project guidelines.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import { useASTConverter } from './use-ast-converter';

describe('useASTConverter', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    // Create real parser instance (no mocks)
    parser = await createTestParser();
  });

  afterEach(() => {
    // Clean up resources
    parser.dispose();
  });

  describe('Initialization', () => {
    it('should initialize automatically when autoInitialize is true', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Initially not initialized
      expect(result.current.state.isInitialized).toBe(false);

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      expect(result.current.state.error).toBeNull();
    });

    it('should not initialize automatically when autoInitialize is false', async () => {
      const { result } = renderHook(() => useASTConverter(false));

      // Should remain uninitialized
      expect(result.current.state.isInitialized).toBe(false);

      // Wait a bit to ensure it doesn't auto-initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(result.current.state.isInitialized).toBe(false);
    });
  });

  describe('Conversion Operations', () => {
    it('should convert single AST node successfully', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Parse OpenSCAD code
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      // Convert single node
      const conversionResult = await result.current.convertSingle(parseResult.data[0]);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.id).toBeDefined();
      expect(conversionResult.data.geometry).toBeDefined();
      expect(conversionResult.data.material).toBeDefined();
      expect(conversionResult.data.metadata.vertexCount).toBeGreaterThan(0);
    });

    it('should convert multiple AST nodes successfully', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Parse OpenSCAD code with multiple objects
      const code = 'cube(10); sphere(5);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      // Convert multiple nodes
      const conversionResult = await result.current.convert(parseResult.data);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.meshes).toHaveLength(2);
      expect(conversionResult.data.totalVertices).toBeGreaterThan(0);
      expect(conversionResult.data.errors).toHaveLength(0);
    });

    it('should handle CSG operations', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Parse CSG operation
      const code = 'difference() { cube(10); sphere(5); }';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      // Convert CSG operation
      const conversionResult = await result.current.convert(parseResult.data);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.meshes.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should track conversion state correctly', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Initially not converting
      expect(result.current.state.isConverting).toBe(false);

      // Parse simple code
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      // Start conversion (should set isConverting to true)
      const conversionPromise = result.current.convert(parseResult.data);

      // Wait for conversion to complete
      const conversionResult = await conversionPromise;

      expect(conversionResult.success).toBe(true);
      expect(result.current.state.isConverting).toBe(false);
      expect(result.current.state.lastConversionTime).toBeGreaterThan(0);
    });

    it('should handle conversion errors gracefully', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Try to convert invalid node
      const invalidNode = { type: 'invalid', location: null };
      const conversionResult = await result.current.convertSingle(invalidNode);

      expect(conversionResult.success).toBe(false);
      expect(result.current.state.error).toBeDefined();
      expect(result.current.state.isConverting).toBe(false);
    });

    it('should clear errors when requested', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Create an error
      const invalidNode = { type: 'invalid', location: null };
      await result.current.convertSingle(invalidNode);

      expect(result.current.state.error).toBeDefined();

      // Clear error
      result.current.clearError();

      expect(result.current.state.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should fail gracefully when not initialized', async () => {
      const { result } = renderHook(() => useASTConverter(false));

      // Try to convert without initialization
      const conversionResult = await result.current.convert([]);

      expect(conversionResult.success).toBe(false);
      if (!conversionResult.success) {
        expect(conversionResult.error).toContain('not initialized');
      }
    });

    it('should handle empty AST arrays', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Convert empty array
      const conversionResult = await result.current.convert([]);

      expect(conversionResult.success).toBe(true);
      if (!conversionResult.success) return;

      expect(conversionResult.data.meshes).toHaveLength(0);
      expect(conversionResult.data.errors).toHaveLength(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track conversion time', async () => {
      const { result } = renderHook(() => useASTConverter(true));

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.state.isInitialized).toBe(true);
      });

      // Parse and convert
      const code = 'cube(10);';
      const parseResult = parser.parseASTWithResult(code);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) return;

      await result.current.convert(parseResult.data);

      expect(result.current.state.lastConversionTime).toBeGreaterThan(0);
    });
  });
});
