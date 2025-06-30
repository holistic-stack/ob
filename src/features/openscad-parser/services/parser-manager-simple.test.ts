/**
 * Simple OpenSCAD Parser Manager Test
 *
 * Basic test to debug the parser manager implementation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createParserManager } from './parser-manager';

// Mock the @holistic-stack/openscad-parser
vi.mock('@holistic-stack/openscad-parser', () => ({
  parseCode: vi.fn().mockResolvedValue([{ type: 'cube', size: [10, 10, 10] }]),
  validateAST: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
  transformAST: vi.fn().mockResolvedValue([{ type: 'cube', size: [10, 10, 10] }]),
}));

describe('Simple Parser Manager Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create parser manager', () => {
    const manager = createParserManager();
    expect(manager).toBeDefined();
    expect(typeof manager.parse).toBe('function');
  });

  it('should get configuration', () => {
    const manager = createParserManager();
    const config = manager.getConfig();
    expect(config).toBeDefined();
    expect(config.enableOptimization).toBe(true);
  });

  it('should parse simple code', async () => {
    const manager = createParserManager();
    const result = await manager.parse('cube([10, 10, 10]);');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ast).toBeDefined();
      expect(result.data.nodeCount).toBe(1);
    }

    manager.dispose();
  });
});
