/**
 * @file parser-integration-utilities.test.ts
 * @description Tests for reusable parser integration utilities following TDD methodology.
 * Tests complete OpenSCAD-to-geometry pipeline, performance integration, error handling, and module integration.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type { Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIntegrationPipeline,
  GeometryGenerationPipeline,
  handleIntegrationError,
  IntegrationErrorHandler,
  OpenSCADIntegrationPipeline,
  ParserPerformanceTracker,
  processOpenSCADCode,
  trackParserPerformance,
} from './parser-integration-utilities';

// Mock BabylonJS Scene for testing
const createMockScene = (): Scene =>
  ({
    dispose: vi.fn(),
    metadata: {},
  }) as unknown as Scene;

// Mock OpenSCAD code samples for testing
const SIMPLE_CUBE_CODE = 'cube([2, 3, 4]);';
const MODULE_CODE = `
module test_module(size=10) {
  cube([size, size, size]);
}
test_module(size=5);
`;
const CONDITIONAL_CODE = `
size = 10;
if (size > 5) {
  cube([size, size, size]);
} else {
  sphere(r=size/2);
}
`;
const COMPLEX_CODE = `
module box(w, h, d) {
  cube([w, h, d]);
}

for (i = [0:2]) {
  translate([i*10, 0, 0]) {
    box(5, 5, 5);
  }
}
`;

describe('OpenSCADIntegrationPipeline', () => {
  let pipeline: OpenSCADIntegrationPipeline;
  let mockScene: Scene;

  beforeEach(() => {
    mockScene = createMockScene();
    pipeline = new OpenSCADIntegrationPipeline(mockScene);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('pipeline initialization', () => {
    it('should initialize pipeline correctly', async () => {
      const result = await pipeline.initialize();

      expect(result.success).toBe(true);
      expect(pipeline.isInitialized()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      // Create a new pipeline and mock a component initialization failure
      const failingPipeline = new OpenSCADIntegrationPipeline(mockScene);

      // Mock the internal initialization to fail
      vi.spyOn(failingPipeline as any, 'astProcessor', 'get').mockImplementation(() => {
        throw new Error('Parser init failed');
      });

      const result = await failingPipeline.initialize();

      expect(result.success).toBe(false);
      if (result.success) return; // Type guard for TypeScript
      expect(result.error.message).toContain('Failed to initialize integration pipeline');
    });

    it('should allow custom configuration', () => {
      const customConfig = {
        enableModuleProcessing: true,
        enablePerformanceTracking: true,
        maxProcessingTime: 10000,
      };

      const customPipeline = new OpenSCADIntegrationPipeline(mockScene, customConfig);
      expect(customPipeline.getConfiguration().enableModuleProcessing).toBe(true);
      expect(customPipeline.getConfiguration().maxProcessingTime).toBe(10000);
    });
  });

  describe('OpenSCAD code processing', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should process simple OpenSCAD code correctly', async () => {
      const result = await pipeline.processCode(SIMPLE_CUBE_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(1);
      expect(result.data.processingMetadata.processingTime).toBeGreaterThan(0);
      expect(result.data.processingMetadata.stagesCompleted).toContain('parsing');
      expect(result.data.processingMetadata.stagesCompleted).toContain('ast_processing');
      expect(result.data.processingMetadata.stagesCompleted).toContain('geometry_generation');
    });

    it('should process module definitions and calls', async () => {
      const result = await pipeline.processCode(MODULE_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(1);
      expect(result.data.processingMetadata.stagesCompleted).toContain('module_processing');
    });

    it('should process conditional statements', async () => {
      const result = await pipeline.processCode(CONDITIONAL_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(1);
      expect(result.data.processingMetadata.stagesCompleted).toContain('conditional_processing');
    });

    it('should process complex OpenSCAD code with loops and modules', async () => {
      const result = await pipeline.processCode(COMPLEX_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(3); // 3 boxes from for loop
      expect(result.data.processingMetadata.stagesCompleted).toContain('module_processing');
      expect(result.data.processingMetadata.stagesCompleted).toContain('loop_processing');
    });

    it('should handle syntax errors gracefully', async () => {
      const invalidCode = 'cube([2, 3, 4;'; // Missing closing bracket
      const result = await pipeline.processCode(invalidCode);

      expect(result.success).toBe(false);
      if (result.success) return; // Type guard for TypeScript
      expect(result.error.message).toContain('Syntax error');
    });

    it('should handle empty code gracefully', async () => {
      const result = await pipeline.processCode('');

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(0);
    });
  });

  describe('performance tracking', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should track processing performance', async () => {
      const result = await pipeline.processCode(SIMPLE_CUBE_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.processingMetadata.processingTime).toBeGreaterThan(0);
      expect(result.data.processingMetadata.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should provide detailed stage timing', async () => {
      const result = await pipeline.processCode(MODULE_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.processingMetadata.stageTiming).toBeDefined();
      expect(result.data.processingMetadata.stageTiming.parsing).toBeGreaterThan(0);
      expect(result.data.processingMetadata.stageTiming.ast_processing).toBeGreaterThan(0);
      expect(result.data.processingMetadata.stageTiming.geometry_generation).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await pipeline.initialize();
    });

    it('should provide detailed error information', async () => {
      const invalidCode = 'invalid_function([1, 2, 3]);';
      const result = await pipeline.processCode(invalidCode);

      expect(result.success).toBe(false);
      if (result.success) return; // Type guard for TypeScript
      expect(result.error.stage).toBeDefined();
      expect(result.error.originalError).toBeDefined();
      expect(result.error.context).toBeDefined();
    });

    it('should handle parser errors with context', async () => {
      const invalidCode = 'cube([2, 3, 4;'; // Missing closing bracket
      const result = await pipeline.processCode(invalidCode);

      expect(result.success).toBe(false);
      if (result.success) return; // Type guard for TypeScript
      expect(result.error.stage).toBe('parsing');
      expect(result.error.context.sourceCode).toBe(invalidCode);
    });
  });

  describe('pipeline configuration', () => {
    it('should respect configuration settings', async () => {
      const config = {
        enableModuleProcessing: false,
        enablePerformanceTracking: false,
        maxProcessingTime: 1000,
      };

      const configuredPipeline = new OpenSCADIntegrationPipeline(mockScene, config);
      await configuredPipeline.initialize();

      const result = await configuredPipeline.processCode(MODULE_CODE);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      // Should not include module processing stage when disabled
      expect(result.data.processingMetadata.stagesCompleted).not.toContain('module_processing');
    });
  });
});

describe('ParserPerformanceTracker', () => {
  let tracker: ParserPerformanceTracker;

  beforeEach(() => {
    tracker = new ParserPerformanceTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performance tracking', () => {
    it('should track parsing performance', () => {
      tracker.startTracking('parse-operation', SIMPLE_CUBE_CODE);
      // Simulate processing
      const result = tracker.endTracking('parse-operation');

      expect(result.operationName).toBe('parse-operation');
      expect(result.sourceCode).toBe(SIMPLE_CUBE_CODE);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.memoryUsage).toBeDefined();
    });

    it('should track multiple operations', () => {
      tracker.startTracking('parse-1', SIMPLE_CUBE_CODE);
      tracker.endTracking('parse-1');

      tracker.startTracking('parse-2', MODULE_CODE);
      tracker.endTracking('parse-2');

      const metrics = tracker.getPerformanceMetrics();

      expect(metrics.totalOperations).toBe(2);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.operationsByType.parse).toBe(2);
    });

    it('should identify slowest operations', () => {
      tracker.startTracking('fast-op', 'cube(1);');
      tracker.endTracking('fast-op');

      tracker.startTracking('slow-op', COMPLEX_CODE);
      // Add small delay to make it slower
      const start = performance.now();
      while (performance.now() - start < 1) {
        /* wait */
      }
      tracker.endTracking('slow-op');

      const metrics = tracker.getPerformanceMetrics();
      expect(metrics.slowestOperations).toHaveLength(2);
      expect(metrics.slowestOperations[0].operationName).toBe('slow-op');
    });
  });
});

describe('IntegrationErrorHandler', () => {
  let errorHandler: IntegrationErrorHandler;

  beforeEach(() => {
    errorHandler = new IntegrationErrorHandler();
  });

  describe('error handling', () => {
    it('should handle parsing errors with context', () => {
      const error = new Error('Syntax error at line 1');
      const context = { sourceCode: 'invalid code', stage: 'parsing' };

      const result = errorHandler.handleError(error, context);

      expect(result.stage).toBe('parsing');
      expect(result.originalError).toBe(error);
      expect(result.context.sourceCode).toBe('invalid code');
      expect(result.message).toContain('Syntax error at line 1');
    });

    it('should categorize different error types', () => {
      const syntaxError = new Error('Unexpected token');
      const moduleError = new Error('Module not found');

      const syntaxResult = errorHandler.handleError(syntaxError, { stage: 'parsing' });
      const moduleResult = errorHandler.handleError(moduleError, { stage: 'module_processing' });

      expect(syntaxResult.category).toBe('syntax_error');
      expect(moduleResult.category).toBe('module_error');
    });

    it('should provide recovery suggestions', () => {
      const error = new Error('Missing closing bracket');
      const result = errorHandler.handleError(error, { stage: 'parsing' });

      expect(result.recoverySuggestions).toContain('Check for missing brackets');
    });
  });
});

describe('GeometryGenerationPipeline', () => {
  let pipeline: GeometryGenerationPipeline;
  let mockScene: Scene;

  beforeEach(() => {
    mockScene = createMockScene();
    pipeline = new GeometryGenerationPipeline(mockScene);
  });

  describe('geometry generation', () => {
    it('should generate geometry from AST nodes', async () => {
      const mockASTNodes = [
        {
          type: 'cube',
          parameters: [{ name: 'size', value: [2, 3, 4] }],
          location: {
            start: { line: 1, column: 0, offset: 0 },
            end: { line: 1, column: 15, offset: 15 },
            text: 'cube([2, 3, 4]);',
          },
        },
      ];

      const result = await pipeline.generateGeometry(mockASTNodes);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(1);
      expect(result.data.processingMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle empty AST gracefully', async () => {
      const result = await pipeline.generateGeometry([]);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(0);
    });

    it('should handle invalid AST nodes', async () => {
      const invalidNodes = [{ type: 'invalid_type' }];

      const result = await pipeline.generateGeometry(invalidNodes as any);

      expect(result.success).toBe(false);
      if (result.success) return; // Type guard for TypeScript
      expect(result.error.message).toContain('invalid_type');
    });
  });
});

describe('utility functions', () => {
  let mockScene: Scene;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  describe('processOpenSCADCode', () => {
    it('should process OpenSCAD code using standalone function', async () => {
      const result = await processOpenSCADCode(SIMPLE_CUBE_CODE, mockScene);

      expect(result.success).toBe(true);
      if (!result.success) return; // Type guard for TypeScript
      expect(result.data.geometryNodes).toHaveLength(1);
    });
  });

  describe('createIntegrationPipeline', () => {
    it('should create integration pipeline using standalone function', () => {
      const config = { enableModuleProcessing: true };
      const pipeline = createIntegrationPipeline(mockScene, config);

      expect(pipeline).toBeInstanceOf(OpenSCADIntegrationPipeline);
      expect(pipeline.getConfiguration().enableModuleProcessing).toBe(true);
    });
  });

  describe('trackParserPerformance', () => {
    it('should track parser performance using standalone function', () => {
      const result = trackParserPerformance('test-operation', SIMPLE_CUBE_CODE, () => {
        return { processed: true };
      });

      expect(result.operationName).toBe('test-operation');
      expect(result.sourceCode).toBe(SIMPLE_CUBE_CODE);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.result).toEqual({ processed: true });
    });
  });

  describe('handleIntegrationError', () => {
    it('should handle integration error using standalone function', () => {
      const error = new Error('Test error');
      const context = { stage: 'parsing', sourceCode: 'test code' };

      const result = handleIntegrationError(error, context);

      expect(result.stage).toBe('parsing');
      expect(result.originalError).toBe(error);
      expect(result.context.sourceCode).toBe('test code');
    });
  });
});
