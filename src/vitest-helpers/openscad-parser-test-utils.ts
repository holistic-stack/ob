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
 */
export function createTestParser(): OpenscadParser {
  const parser = new OpenscadParser();

  // Track the parser for cleanup
  parserInstances.add(parser);

  return parser;
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
