/**
 * @file Documentation Parser Tests
 * 
 * Comprehensive tests for the documentation parser including
 * JSDoc parsing, markdown formatting, and parameter extraction.
 */

import { describe, it, expect } from 'vitest';
import { 
  DocumentationParser, 
  parseDocumentation, 
  formatDocumentationAsMarkdown,
  DEFAULT_DOCUMENTATION_OPTIONS 
} from './documentation-parser';

describe('DocumentationParser', () => {
  let parser: DocumentationParser;

  beforeEach(() => {
    parser = new DocumentationParser();
  });

  describe('basic parsing', () => {
    it('should parse simple documentation', () => {
      const docString = 'Creates a cube primitive';
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.summary).toBe('Creates a cube primitive');
      expect(parsed.description).toBe('Creates a cube primitive');
      expect(parsed.parameters).toHaveLength(0);
      expect(parsed.examples).toHaveLength(0);
    });

    it('should handle empty documentation', () => {
      const parsed = parser.parseDocumentation('');
      
      expect(parsed.summary).toBe('');
      expect(parsed.description).toBe('');
      expect(parsed.parameters).toHaveLength(0);
      expect(parsed.examples).toHaveLength(0);
    });

    it('should clean comment markers', () => {
      const docString = `
        /**
         * Creates a cube primitive
         * with specified dimensions
         */
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.description).toBe('Creates a cube primitive with specified dimensions');
    });
  });

  describe('JSDoc tag parsing', () => {
    it('should parse @param tags', () => {
      const docString = `
        Creates a cube with hole
        @param size The size of the cube
        @param hole_size The diameter of the hole
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.parameters).toHaveLength(2);
      expect(parsed.parameters[0].name).toBe('size');
      expect(parsed.parameters[0].description).toBe('The size of the cube');
      expect(parsed.parameters[1].name).toBe('hole_size');
      expect(parsed.parameters[1].description).toBe('The diameter of the hole');
    });

    it('should parse @param tags with types', () => {
      const docString = `
        @param {number} size The size of the cube
        @param {string} color The color name
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.parameters).toHaveLength(2);
      expect(parsed.parameters[0].type).toBe('number');
      expect(parsed.parameters[0].name).toBe('size');
      expect(parsed.parameters[1].type).toBe('string');
      expect(parsed.parameters[1].name).toBe('color');
    });

    it('should parse @returns tags', () => {
      const docString = `
        Calculates volume
        @returns {number} The calculated volume
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.returns).toBeDefined();
      expect(parsed.returns?.type).toBe('number');
      expect(parsed.returns?.description).toBe('The calculated volume');
    });

    it('should parse @example tags', () => {
      const docString = `
        Creates a cube
        @example
        cube(10);
        @example
        cube(size=20);
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.examples).toHaveLength(2);
      expect(parsed.examples[0].code).toBe('cube(10);');
      expect(parsed.examples[1].code).toBe('cube(size=20);');
    });

    it('should parse @example tags with titles', () => {
      const docString = `
        @example Basic usage
        cube(10);
        @example With parameters
        cube(size=20, center=true);
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.examples).toHaveLength(2);
      expect(parsed.examples[0].title).toBe('Basic usage');
      expect(parsed.examples[0].code).toBe('cube(10);');
      expect(parsed.examples[1].title).toBe('With parameters');
      expect(parsed.examples[1].code).toBe('cube(size=20, center=true);');
    });

    it('should parse @see tags', () => {
      const docString = `
        Creates a cube
        @see cylinder
        @see sphere
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.seeAlso).toHaveLength(2);
      expect(parsed.seeAlso).toContain('cylinder');
      expect(parsed.seeAlso).toContain('sphere');
    });

    it('should parse @deprecated tags', () => {
      const docString = `
        Old function
        @deprecated Use newFunction instead
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.deprecated).toBe('Use newFunction instead');
    });
  });

  describe('markdown formatting', () => {
    it('should format basic documentation as markdown', () => {
      const parsed = {
        summary: 'Creates a cube',
        description: 'Creates a cube primitive with specified size',
        parameters: [],
        examples: [],
        seeAlso: [],
        tags: new Map()
      };
      
      const markdown = parser.formatAsMarkdown(parsed);
      
      expect(markdown).toContain('Creates a cube');
      expect(markdown).toContain('Creates a cube primitive with specified size');
    });

    it('should format parameters in markdown', () => {
      const parsed = {
        summary: 'Creates a cube',
        description: 'Creates a cube',
        parameters: [
          {
            name: 'size',
            type: 'number',
            description: 'The size of the cube',
            optional: false,
            defaultValue: '10'
          }
        ],
        examples: [],
        seeAlso: [],
        tags: new Map()
      };
      
      const markdown = parser.formatAsMarkdown(parsed);
      
      expect(markdown).toContain('**Parameters:**');
      expect(markdown).toContain('**size**');
      expect(markdown).toContain('(`number`)');
      expect(markdown).toContain('= `10`');
      expect(markdown).toContain('The size of the cube');
    });

    it('should format returns in markdown', () => {
      const parsed = {
        summary: 'Calculates volume',
        description: 'Calculates volume',
        parameters: [],
        returns: {
          type: 'number',
          description: 'The calculated volume'
        },
        examples: [],
        seeAlso: [],
        tags: new Map()
      };
      
      const markdown = parser.formatAsMarkdown(parsed);
      
      expect(markdown).toContain('**Returns:**');
      expect(markdown).toContain('`number`');
      expect(markdown).toContain('The calculated volume');
    });

    it('should format examples in markdown', () => {
      const parsed = {
        summary: 'Creates a cube',
        description: 'Creates a cube',
        parameters: [],
        examples: [
          {
            title: 'Basic usage',
            code: 'cube(10);',
            description: undefined
          }
        ],
        seeAlso: [],
        tags: new Map()
      };
      
      const markdown = parser.formatAsMarkdown(parsed);
      
      expect(markdown).toContain('**Examples:**');
      expect(markdown).toContain('*Basic usage*');
      expect(markdown).toContain('```openscad');
      expect(markdown).toContain('cube(10);');
      expect(markdown).toContain('```');
    });

    it('should format deprecated warning', () => {
      const parsed = {
        summary: 'Old function',
        description: 'Old function',
        parameters: [],
        examples: [],
        seeAlso: [],
        deprecated: 'Use newFunction instead',
        tags: new Map()
      };
      
      const markdown = parser.formatAsMarkdown(parsed);
      
      expect(markdown).toContain('⚠️ **Deprecated:**');
      expect(markdown).toContain('Use newFunction instead');
    });
  });

  describe('parameter signature extraction', () => {
    it('should extract parameters from function signature', () => {
      const signature = 'function calculate_volume(length, width, height)';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(3);
      expect(params[0].name).toBe('length');
      expect(params[1].name).toBe('width');
      expect(params[2].name).toBe('height');
    });

    it('should extract parameters with default values', () => {
      const signature = 'module cube_with_hole(size = 10, hole_size = 5)';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(2);
      expect(params[0].name).toBe('size');
      expect(params[0].defaultValue).toBe('10');
      expect(params[0].optional).toBe(true);
      expect(params[1].name).toBe('hole_size');
      expect(params[1].defaultValue).toBe('5');
      expect(params[1].optional).toBe(true);
    });

    it('should extract parameters with types', () => {
      const signature = 'function test(number size, string color)';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(2);
      expect(params[0].type).toBe('number');
      expect(params[0].name).toBe('size');
      expect(params[1].type).toBe('string');
      expect(params[1].name).toBe('color');
    });

    it('should handle complex parameter expressions', () => {
      const signature = 'module test(size = [10, 20, 30], center = true)';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(2);
      expect(params[0].name).toBe('size');
      expect(params[0].defaultValue).toBe('[10, 20, 30]');
      expect(params[1].name).toBe('center');
      expect(params[1].defaultValue).toBe('true');
    });

    it('should handle empty parameter list', () => {
      const signature = 'function test()';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(0);
    });
  });

  describe('options handling', () => {
    it('should respect parseJSDoc option', () => {
      const parserNoJSDoc = new DocumentationParser({ parseJSDoc: false });
      const docString = `
        Creates a cube
        @param size The size
      `;
      
      const parsed = parserNoJSDoc.parseDocumentation(docString);
      
      expect(parsed.parameters).toHaveLength(0);
      expect(parsed.description).toContain('@param size The size');
    });

    it('should respect maxExamples option', () => {
      const parserLimitedExamples = new DocumentationParser({ maxExamples: 1 });
      const docString = `
        @example cube(10);
        @example cube(20);
        @example cube(30);
      `;
      
      const parsed = parserLimitedExamples.parseDocumentation(docString);
      
      expect(parsed.examples).toHaveLength(1);
      expect(parsed.examples[0].code).toBe('cube(10);');
    });

    it('should respect sanitizeHtml option', () => {
      const parserNoSanitize = new DocumentationParser({ sanitizeHtml: false });
      const docString = 'Creates a cube <script>alert("test")</script>';
      
      const parsed = parserNoSanitize.parseDocumentation(docString);
      
      expect(parsed.description).toContain('<script>');
    });
  });

  describe('utility functions', () => {
    it('should provide quick parse function', () => {
      const parsed = parseDocumentation('Creates a cube');
      
      expect(parsed.summary).toBe('Creates a cube');
    });

    it('should provide quick format function', () => {
      const markdown = formatDocumentationAsMarkdown('Creates a cube');
      
      expect(markdown).toBe('Creates a cube');
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSDoc tags', () => {
      const docString = `
        @param
        @returns
        @example
      `;
      
      const parsed = parser.parseDocumentation(docString);
      
      expect(parsed.parameters).toHaveLength(1);
      expect(parsed.parameters[0].name).toBe('unknown');
      expect(parsed.returns).toBeUndefined();
      expect(parsed.examples).toHaveLength(1);
    });

    it('should handle nested parentheses in parameters', () => {
      const signature = 'module test(size = max(10, min(20, 30)))';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(1);
      expect(params[0].name).toBe('size');
      expect(params[0].defaultValue).toBe('max(10, min(20, 30))');
    });

    it('should handle string parameters with commas', () => {
      const signature = 'module test(text = "hello, world")';
      const params = parser.extractParametersFromSignature(signature);
      
      expect(params).toHaveLength(1);
      expect(params[0].name).toBe('text');
      expect(params[0].defaultValue).toBe('"hello, world"');
    });
  });
});

describe('DEFAULT_DOCUMENTATION_OPTIONS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_DOCUMENTATION_OPTIONS.parseJSDoc).toBe(true);
    expect(DEFAULT_DOCUMENTATION_OPTIONS.includeExamples).toBe(true);
    expect(DEFAULT_DOCUMENTATION_OPTIONS.maxExamples).toBe(5);
    expect(DEFAULT_DOCUMENTATION_OPTIONS.sanitizeHtml).toBe(true);
    expect(DEFAULT_DOCUMENTATION_OPTIONS.preserveWhitespace).toBe(false);
  });
});
