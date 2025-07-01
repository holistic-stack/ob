/**
 * @file Parser Setup Utilities for Testing
 *
 * Utilities for setting up OpenSCAD parser instances in test environments.
 * Provides helper functions for creating and initializing parsers with WASM support.
 * Based on patterns from docs/openscad-parser/src/test-utils/parser-setup.ts
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import { OpenscadParser } from '../core/openscad-parser.js';
import { SimpleErrorHandler } from '../core/simple-error-handler.js';

const logger = createLogger('ParserSetup');

/**
 * Creates a basic OpenSCAD parser instance for testing
 * @returns OpenSCAD parser instance with error handler
 */
export function createTestParser(): OpenscadParser {
  logger.debug('Creating test parser instance');
  const errorHandler = new SimpleErrorHandler();
  const parser = new OpenscadParser(errorHandler);
  return parser;
}

/**
 * Sets up a fully initialized OpenSCAD parser for testing
 * Requires WASM files to be available and fetch mocking to be set up
 * @param wasmPath - Path to OpenSCAD grammar WASM file (default: './tree-sitter-openscad.wasm')
 * @param treeSitterWasmPath - Path to tree-sitter WASM file (default: './tree-sitter.wasm')
 * @returns Promise that resolves to initialized parser instance
 */
export async function setupTestParser(
  wasmPath = './tree-sitter-openscad.wasm',
  treeSitterWasmPath = './tree-sitter.wasm'
): Promise<OpenscadParser> {
  logger.debug('Setting up test parser with WASM initialization');

  const parser = createTestParser();

  try {
    await parser.init(wasmPath, treeSitterWasmPath);
    logger.debug('Test parser initialized successfully');
    return parser;
  } catch (error) {
    logger.error('Failed to initialize test parser:', error);
    throw error;
  }
}

/**
 * Creates a mock OpenSCAD parser for testing without WASM dependencies
 * Useful for testing parser API without actual parsing functionality
 * @returns Mock parser instance
 */
export function createMockParser(): OpenscadParser {
  logger.debug('Creating mock parser instance');
  const errorHandler = new SimpleErrorHandler();
  const parser = new OpenscadParser(errorHandler);

  // Mock init to avoid WASM loading
  parser.init = vi.fn().mockImplementation(async () => {
    logger.debug('Mock parser init called');
    // Set internal state to initialized without actual WASM loading
    // biome-ignore lint/suspicious/noExplicitAny: Required for test mocking
    (parser as any).isInitialized = true;
    // biome-ignore lint/suspicious/noExplicitAny: Required for test mocking
    (parser as any).parser = {
      parse: vi.fn(),
      delete: vi.fn(),
    };
    // biome-ignore lint/suspicious/noExplicitAny: Required for test mocking
    (parser as any).language = { name: 'openscad' };
  });

  // Mock parseCST to return a basic tree structure
  parser.parseCST = vi.fn().mockImplementation((content: string) => {
    logger.debug(`Mock parseCST called with content: ${content.substring(0, 50)}...`);
    return {
      rootNode: {
        type: 'source_file',
        hasError: false,
        isMissing: false,
        childCount: 0,
        child: vi.fn().mockReturnValue(null),
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: content.length },
        text: content,
      },
      delete: vi.fn(),
    };
  });

  // Mock parseAST to return empty array
  parser.parseAST = vi.fn().mockImplementation((content: string) => {
    logger.debug(`Mock parseAST called with content: ${content.substring(0, 50)}...`);
    return [];
  });

  return parser;
}

/**
 * Cleanup parser instance and dispose resources
 * @param parser - Parser instance to cleanup
 */
export function cleanupTestParser(parser: OpenscadParser): void {
  logger.debug('Cleaning up test parser');
  try {
    parser.dispose();
    logger.debug('Test parser disposed successfully');
  } catch (error) {
    logger.warn('Error disposing test parser:', error);
  }
}

/**
 * Test helper to verify parser API compatibility
 * @param parser - Parser instance to test
 */
export function verifyParserAPI(parser: OpenscadParser): void {
  logger.debug('Verifying parser API compatibility');

  // Verify all required methods exist
  expect(typeof parser.init).toBe('function');
  expect(typeof parser.parseAST).toBe('function');
  expect(typeof parser.parseCST).toBe('function');
  expect(typeof parser.dispose).toBe('function');
  expect(typeof parser.isReady).toBe('function');

  logger.debug('Parser API verification completed');
}

/**
 * Test helper to create sample OpenSCAD code for testing
 * @returns Object with various OpenSCAD code samples
 */
export function getSampleOpenSCADCode() {
  return {
    simple: {
      cube: 'cube(10);',
      sphere: 'sphere(5);',
      cylinder: 'cylinder(h=10, r=5);',
    },
    complex: {
      union: 'union() { cube(10); sphere(5); }',
      difference: 'difference() { cube(10); sphere(5); }',
      intersection: 'intersection() { cube(10); sphere(5); }',
    },
    transforms: {
      translate: 'translate([10, 0, 0]) cube(5);',
      rotate: 'rotate([0, 0, 45]) cube(5);',
      scale: 'scale([2, 1, 1]) cube(5);',
    },
    invalid: {
      syntax: 'cube(10',
      missing: 'unknown_function();',
      empty: '',
    },
  };
}
