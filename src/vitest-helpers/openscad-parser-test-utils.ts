/**
 * OpenSCAD Parser Test Utilities
 *
 * Provides test helpers with automatic cleanup and memory management
 * for OpenSCAD parser instances.
 */

import { afterEach } from 'vitest';
import { OpenscadParser } from '@/features/openscad-parser/openscad-parser';
import { createLogger } from '@/shared/services/logger.service';

const logger = createLogger('ParserTestUtils');

// Track all parser instances for global cleanup
const parserInstances = new Set<OpenscadParser>();

/**
 * Creates a test parser instance with automatic cleanup
 * All parsers created with this function will be automatically disposed
 * after each test to prevent memory leaks.
 *
 * @returns Uninitialized parser instance - call `await parser.init()` before use
 */
export function createTestParser(): OpenscadParser {
  const parser = new OpenscadParser();

  // Track the parser for cleanup
  parserInstances.add(parser);

  return parser;
}

/**
 * Creates and initializes a test parser instance with automatic cleanup
 * This is the recommended way to create parsers for tests as it ensures
 * the parser is ready to use immediately.
 *
 * @returns Promise<OpenscadParser> - Fully initialized parser ready for use
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   parser = await createInitializedTestParser();
 *   // Parser is ready to use immediately
 *   const result = parser.parseASTWithResult('cube(10);');
 * });
 * ```
 */
export async function createInitializedTestParser(): Promise<OpenscadParser> {
  const parser = createTestParser();

  try {
    await parser.init();
    logger.debug('[DEBUG][ParserTestUtils] Parser initialized successfully');
    return parser;
  } catch (error) {
    logger.error('[ERROR][ParserTestUtils] Failed to initialize parser:', error);
    // Clean up the failed parser
    parserInstances.delete(parser);
    throw error;
  }
}

/**
 * Global cleanup hook - automatically disposes all test parsers
 * This runs after each test to ensure proper cleanup
 */
afterEach(() => {
  // Dispose all tracked parser instances
  for (const parser of parserInstances) {
    try {
      if (parser && typeof parser.dispose === 'function') {
        parser.dispose();
      }
    } catch (error) {
      logger.error('[ERROR][ParserTestUtils] Failed to dispose parser:', error);
    }
  }

  // Clear the tracking set
  parserInstances.clear();
});
