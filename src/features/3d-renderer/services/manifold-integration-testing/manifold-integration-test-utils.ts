/**
 * @file Manifold Integration Test Utilities
 * Task 1.8: Setup Testing with Real OpenscadParser (Green Phase)
 *
 * Test utilities for Manifold + OpenSCAD parser integration testing
 * Following project guidelines:
 * - Use real OpenscadParser instances (no mocks)
 * - Result<T,E> error handling patterns
 * - Comprehensive cleanup and resource management
 */

import { createTestParser } from '@/vitest-helpers/openscad-parser-test-utils';
import type { Result } from '../../../../shared/types/result.types';
import type { OpenscadParser } from '../../../openscad-parser/openscad-parser';
import {
  clearAllResources,
  getMemoryStats,
} from '../manifold-memory-manager/manifold-memory-manager';
import { ManifoldWasmLoader } from '../manifold-wasm-loader/manifold-wasm-loader';

/**
 * Integration test context for Manifold + OpenSCAD testing
 */
export interface ManifoldIntegrationTestContext {
  parser: OpenscadParser;
  manifoldModule: any;
  cleanup: () => Promise<void>;
}

/**
 * Create a test context for Manifold + OpenSCAD integration testing
 * This function handles the complex initialization and cleanup with optimized patterns
 */
export async function createManifoldIntegrationTestContext(
  options: { enableWASM?: boolean; timeout?: number } = {}
): Promise<Result<ManifoldIntegrationTestContext, string>> {
  const { enableWASM = false, timeout = 3000 } = options;

  try {
    // Clear any existing resources
    clearAllResources();

    // Create real OpenSCAD parser instance with error handling
    let parser: OpenscadParser;
    try {
      parser = createTestParser();
      await parser.init();
    } catch (error) {
      return {
        success: false,
        error: `Parser initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Load Manifold WASM module (optional, with timeout to prevent hanging)
    let manifoldModule: any = null;
    if (enableWASM) {
      try {
        const loader = new ManifoldWasmLoader();
        // Add configurable timeout to prevent hanging
        const loadPromise = loader.load();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`WASM loading timeout after ${timeout}ms`)), timeout)
        );

        manifoldModule = await Promise.race([loadPromise, timeoutPromise]);
      } catch (error) {
        // WASM loading failure is handled gracefully
        console.warn('WASM loading failed:', error);
        manifoldModule = null;
      }
    }

    // Create cleanup function
    const cleanup = async (): Promise<void> => {
      try {
        // Dispose parser
        if (parser && typeof parser.dispose === 'function') {
          parser.dispose();
        }

        // Clear all Manifold resources
        clearAllResources();

        // Verify cleanup
        const stats = getMemoryStats();
        if (stats.activeResources > 0) {
          console.warn(
            `Memory leak detected: ${stats.activeResources} active resources after cleanup`
          );
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };

    const context: ManifoldIntegrationTestContext = {
      parser,
      manifoldModule,
      cleanup,
    };

    return { success: true, data: context };
  } catch (error) {
    const errorMessage = `Failed to create integration test context: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Parse OpenSCAD code and extract basic information
 * This is a safe wrapper around the parser that handles errors gracefully
 */
export function parseOpenSCADSafely(parser: OpenscadParser, code: string): Result<any, string> {
  try {
    const ast = parser.parseAST(code);
    if (!ast) {
      return { success: false, error: 'Parser returned null/undefined AST' };
    }

    return { success: true, data: ast };
  } catch (error) {
    const errorMessage = `OpenSCAD parsing failed: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Extract primitive information from AST node
 * Helper function to analyze parsed OpenSCAD primitives
 */
export function extractPrimitiveInfo(
  astNode: any
): Result<{ type: string; parameters: any }, string> {
  try {
    if (!astNode || typeof astNode !== 'object') {
      return { success: false, error: 'Invalid AST node' };
    }

    if (astNode.type !== 'function_call') {
      return { success: false, error: `Expected function_call, got ${astNode.type}` };
    }

    const primitiveInfo = {
      type: astNode.name || 'unknown',
      parameters: astNode.arguments || [],
    };

    return { success: true, data: primitiveInfo };
  } catch (error) {
    const errorMessage = `Failed to extract primitive info: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate memory state for testing
 * Ensures no memory leaks during testing
 */
export function validateMemoryState(): Result<{ isClean: boolean; stats: any }, string> {
  try {
    const stats = getMemoryStats();
    const isClean = stats.activeResources === 0;

    return {
      success: true,
      data: {
        isClean,
        stats,
      },
    };
  } catch (error) {
    const errorMessage = `Failed to validate memory state: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Create a lightweight test context for basic testing (no WASM loading)
 * This is useful for tests that don't need full Manifold integration
 */
export async function createLightweightTestContext(): Promise<
  Result<{ parser: OpenscadParser; cleanup: () => Promise<void> }, string>
> {
  try {
    clearAllResources();

    const parser = createTestParser();
    await parser.init();

    const cleanup = async (): Promise<void> => {
      try {
        if (parser && typeof parser.dispose === 'function') {
          parser.dispose();
        }
        clearAllResources();
      } catch (error) {
        console.error('Lightweight cleanup error:', error);
      }
    };

    return { success: true, data: { parser, cleanup } };
  } catch (error) {
    const errorMessage = `Failed to create lightweight test context: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMessage };
  }
}

/**
 * Benchmark utility for performance testing
 */
export function benchmarkOperation<T>(
  operation: () => T,
  name: string
): { result: T; duration: number } {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`[BENCHMARK] ${name}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Test data for OpenSCAD integration testing
 */
export const TEST_OPENSCAD_SAMPLES = {
  simpleCube: 'cube([10, 20, 30]);',
  simpleSphere: 'sphere(5);',
  simpleCylinder: 'cylinder(h=20, r=3);',
  invalidSyntax: 'cube([10, 20, 30;', // Missing closing bracket
  multipleShapes: `
    cube([10, 10, 10]);
    sphere(5);
    cylinder(h=20, r=3);
  `,
  unionOperation: `
    union() {
      cube([10, 10, 10]);
      sphere(8);
    }
  `,
  differenceOperation: `
    difference() {
      cube([10, 10, 10]);
      sphere(6);
    }
  `,
  complexNested: `
    difference() {
      union() {
        cube([20, 20, 20]);
        translate([10, 0, 0]) sphere(8);
      }
      cylinder(h=25, r=3);
    }
  `,
} as const;
