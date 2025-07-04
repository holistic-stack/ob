/**
 * OpenSCAD Parser Test Utilities (JavaScript version)
 * 
 * This is a simple JavaScript version imported by vitest-setup.ts
 * to register the global cleanup hooks. The actual implementation
 * is in the TypeScript file.
 */

// Import and re-export the TypeScript implementation
import * as testUtils from './openscad-parser-test-utils.ts';

// Re-export for consistency
export const createTestParser = testUtils.createTestParser;

console.log('OpenSCAD Parser test utilities loaded');
