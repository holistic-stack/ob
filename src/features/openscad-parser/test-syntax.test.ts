import { describe, it, expect, beforeEach } from 'vitest';
import { OpenscadParser } from './openscad-parser.js';
import { createLogger } from '../../shared/services/logger.service.js';

const logger = createLogger('SyntaxTest');

describe('OpenSCAD Syntax Tests', () => {
  let parser: OpenscadParser;

  beforeEach(async () => {
    parser = new OpenscadParser();
    await parser.init();
  });

  it('should parse a simple vector assignment', () => {
    const code = `pos1 = [10, 0, 0];`;
    const cst = parser.parseCST(code);
    expect(cst).toBeDefined();
    expect(parser.getErrorHandler().getErrors()).toEqual([]);
  });
});
