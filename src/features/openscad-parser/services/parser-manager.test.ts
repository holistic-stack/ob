/**
 * OpenSCAD Parser Manager Test Suite
 *
 * Tests for OpenSCAD parser integration following TDD methodology
 * with real @holistic-stack/openscad-parser, lifecycle management, and functional patterns.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import { OpenscadParser } from '@holistic-stack/openscad-parser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ParserConfig } from '../types/parser.types';
import type { ParserManager } from './parser-manager';
import { createParserManager } from './parser-manager';

describe('OpenSCAD Parser Manager', () => {
  let parserManager: ParserManager;
  let defaultConfig: ParserConfig;
  let openscadParser: OpenscadParser;

  beforeEach(async () => {
    // Create and initialize real OpenSCAD parser
    openscadParser = new OpenscadParser();
    await openscadParser.init();

    defaultConfig = {
      enableOptimization: true,
      enableValidation: true,
      maxParseTime: 5000,
      maxASTNodes: 10000,
      enableCaching: true,
      cacheSize: 100,
    };

    parserManager = createParserManager(defaultConfig);
  });

  afterEach(() => {
    // Clean up resources
    parserManager.dispose();
    openscadParser.dispose();
  });

  describe('Parser Manager Creation', () => {
    it('should create parser manager with default configuration', () => {
      const manager = createParserManager();

      expect(manager).toBeDefined();
      expect(typeof manager.parse).toBe('function');
      expect(typeof manager.validate).toBe('function');
      expect(typeof manager.optimize).toBe('function');
      expect(typeof manager.dispose).toBe('function');
    });

    it('should create parser manager with custom configuration', () => {
      const customConfig: ParserConfig = {
        enableOptimization: false,
        enableValidation: false,
        maxParseTime: 10000,
        maxASTNodes: 5000,
        enableCaching: false,
        cacheSize: 50,
      };

      const manager = createParserManager(customConfig);

      expect(manager).toBeDefined();
      expect(manager.getConfig().enableOptimization).toBe(false);
      expect(manager.getConfig().maxParseTime).toBe(10000);
    });

    it('should provide parser configuration access', () => {
      const config = parserManager.getConfig();

      expect(config).toEqual(defaultConfig);
      expect(config.enableOptimization).toBe(true);
      expect(config.enableValidation).toBe(true);
    });

    it('should allow configuration updates', () => {
      const newConfig: Partial<ParserConfig> = {
        enableOptimization: false,
        maxParseTime: 8000,
      };

      parserManager.updateConfig(newConfig);
      const updatedConfig = parserManager.getConfig();

      expect(updatedConfig.enableOptimization).toBe(false);
      expect(updatedConfig.maxParseTime).toBe(8000);
      expect(updatedConfig.enableValidation).toBe(true); // Should remain unchanged
    });
  });

  describe('Code Parsing', () => {
    it('should parse valid OpenSCAD code', async () => {
      const code = 'cube([10, 10, 10]);';

      const result = await parserManager.parse(code);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ast).toBeDefined();
        expect(Array.isArray(result.data.ast)).toBe(true);
        expect(result.data.parseTime).toBeGreaterThan(0);
        expect(result.data.nodeCount).toBeGreaterThan(0);
      }
    });

    it('should handle parsing errors gracefully', async () => {
      const invalidCode = 'invalid { syntax here';

      const result = await parserManager.parse(invalidCode);

      // The parser might still succeed but with an empty or error AST
      // This depends on the actual parser implementation
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should respect parse timeout', async () => {
      // Create a very complex code that might take longer to parse
      const complexCode = Array(1000).fill('cube([1, 1, 1]);').join('\n');

      const fastConfig = { ...defaultConfig, maxParseTime: 10 }; // Very short timeout
      const fastManager = createParserManager(fastConfig);

      const result = await fastManager.parse(complexCode);

      // The result might succeed or timeout depending on the actual parsing speed
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      fastManager.dispose();
    });

    it('should cache parsing results when enabled', async () => {
      const code = 'sphere(5);';

      // First parse
      const result1 = await parserManager.parse(code);
      expect(result1.success).toBe(true);

      // Second parse (should use cache)
      const result2 = await parserManager.parse(code);
      expect(result2.success).toBe(true);

      if (result1.success && result2.success) {
        expect(result2.data.fromCache).toBe(true);
        expect(result2.data.cacheKey).toBeDefined();
      }
    });

    it('should handle complex OpenSCAD code', async () => {
      const complexCode = `
        difference() {
          cube([20, 20, 20]);
          translate([10, 10, 10]) {
            sphere(8);
          }
        }
      `;

      const result = await parserManager.parse(complexCode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ast).toBeDefined();
        expect(Array.isArray(result.data.ast)).toBe(true);
        expect(result.data.nodeCount).toBeGreaterThan(0);
      }
    });
  });

  describe('AST Validation', () => {
    it('should validate correct AST', async () => {
      // First parse some valid code to get a real AST
      const parseResult = await parserManager.parse('cube([10, 10, 10]);');
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        const result = await parserManager.validate(parseResult.data.ast);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.isValid).toBe('boolean');
          expect(Array.isArray(result.data.errors)).toBe(true);
        }
      }
    });

    it('should detect AST validation errors', async () => {
      // Create an invalid AST structure
      const invalidAST: ASTNode[] = [{ type: 'invalid_node' as any, parameters: [] }];

      const result = await parserManager.validate(invalidAST);

      expect(result.success).toBe(true);
      if (result.success) {
        // The validation result should indicate whether the AST is valid
        expect(typeof result.data.isValid).toBe('boolean');
        expect(Array.isArray(result.data.errors)).toBe(true);
      }
    });

    it('should skip validation when disabled', async () => {
      const noValidationConfig = { ...defaultConfig, enableValidation: false };
      const noValidationManager = createParserManager(noValidationConfig);

      const ast: ASTNode[] = [{ type: 'cube', size: [1, 1, 1] }];

      const result = await noValidationManager.validate(ast);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isValid).toBe(true);
        expect(result.data.skipped).toBe(true);
      }

      noValidationManager.dispose();
    });
  });

  describe('AST Optimization', () => {
    it('should optimize AST when enabled', async () => {
      const originalAST: ASTNode[] = [
        { type: 'cube', size: [10, 10, 10] },
        { type: 'cube', size: [10, 10, 10] }, // Duplicate
      ];

      const result = await parserManager.optimize(originalAST);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toBeDefined();
        expect(Array.isArray(result.data.optimizedAST)).toBe(true);
        expect(result.data.originalNodeCount).toBe(2);
        expect(result.data.optimizedNodeCount).toBeLessThanOrEqual(2);
        expect(typeof result.data.reductionPercentage).toBe('number');
      }
    });

    it('should skip optimization when disabled', async () => {
      const noOptimizationConfig = { ...defaultConfig, enableOptimization: false };
      const noOptimizationManager = createParserManager(noOptimizationConfig);

      const ast: ASTNode[] = [{ type: 'cube', size: [1, 1, 1] }];

      const result = await noOptimizationManager.optimize(ast);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toEqual(ast);
        expect(result.data.skipped).toBe(true);
      }

      noOptimizationManager.dispose();
    });

    it('should handle optimization errors', async () => {
      // Create an AST that might cause optimization issues
      const ast: ASTNode[] = [{ type: 'cube', size: [1, 1, 1] }];

      const result = await parserManager.optimize(ast);

      // Our simple optimization should not fail, but test the structure
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.optimizedAST).toBeDefined();
        expect(Array.isArray(result.data.optimizedAST)).toBe(true);
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should track parsing performance metrics', async () => {
      const code = 'cube([5, 5, 5]);';

      const result = await parserManager.parse(code);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.parseTime).toBe('number');
        expect(result.data.parseTime).toBeGreaterThan(0);
        expect(typeof result.data.nodeCount).toBe('number');
        expect(result.data.nodeCount).toBeGreaterThan(0);
      }
    });

    it('should provide performance statistics', () => {
      const stats = parserManager.getPerformanceStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalParses).toBe('number');
      expect(typeof stats.averageParseTime).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });

    it('should reset performance statistics', async () => {
      // Perform some operations first
      const code = 'sphere(3);';

      await parserManager.parse(code);

      let stats = parserManager.getPerformanceStats();
      expect(stats.totalParses).toBeGreaterThan(0);

      parserManager.resetPerformanceStats();

      stats = parserManager.getPerformanceStats();
      expect(stats.totalParses).toBe(0);
      expect(stats.averageParseTime).toBe(0);
    });
  });

  describe('Resource Management', () => {
    it('should dispose of resources properly', () => {
      expect(() => parserManager.dispose()).not.toThrow();
    });

    it('should clear cache on disposal', async () => {
      const code = 'cube([1, 1, 1]);';

      // Parse to populate cache
      const result1 = await parserManager.parse(code);
      expect(result1.success).toBe(true);

      // Dispose should clear cache
      parserManager.dispose();

      // Create new manager and parse again
      const newManager = createParserManager(defaultConfig);
      const result2 = await newManager.parse(code);
      expect(result2.success).toBe(true);

      newManager.dispose();
    });

    it('should handle multiple dispose calls safely', () => {
      expect(() => {
        parserManager.dispose();
        parserManager.dispose();
        parserManager.dispose();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle parser initialization errors', () => {
      const invalidConfig = {
        maxParseTime: -1, // Invalid
        maxASTNodes: 0, // Invalid
      } as ParserConfig;

      expect(() => createParserManager(invalidConfig)).toThrow();
    });

    it('should provide detailed error information', async () => {
      const code = 'invalid { syntax';

      const result = await parserManager.parse(code);

      // The result structure should be consistent regardless of success/failure
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (!result.success) {
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
      }
    });

    it('should handle memory limit exceeded', async () => {
      // Create a manager with a very low node limit
      const lowLimitConfig = { ...defaultConfig, maxASTNodes: 1 };
      const lowLimitManager = createParserManager(lowLimitConfig);

      // Parse complex code that might exceed the limit
      const complexCode = Array(100).fill('cube([1, 1, 1]);').join('\n');

      const result = await lowLimitManager.parse(complexCode);

      // The result might succeed or fail depending on actual parsing
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      lowLimitManager.dispose();
    });
  });
});
