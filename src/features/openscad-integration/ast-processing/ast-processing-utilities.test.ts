/**
 * @file ast-processing-utilities.test.ts
 * @description Tests for reusable AST processing utilities following TDD methodology.
 * Tests AST node processors, processing pipeline utilities, AST analysis utilities, and processing performance utilities.
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ASTNode } from '@/features/openscad-parser';
import {
  ASTAnalyzer,
  ASTNodeProcessor,
  ASTProcessingPerformanceTracker,
  ASTProcessingPipeline,
  analyzeASTStructure,
  createProcessingPipeline,
  processASTNode,
  trackASTProcessingPerformance,
} from './ast-processing-utilities';

// Mock AST nodes for testing
const createMockCubeNode = (): ASTNode => ({
  type: 'cube',
  location: {
    start: { line: 1, column: 0, offset: 0 },
    end: { line: 1, column: 10, offset: 10 },
    text: 'cube([1,2,3])',
  },
  parameters: [
    { name: 'size', value: [1, 2, 3] },
    { name: 'center', value: false },
  ],
});

const createMockTranslateNode = (): ASTNode => ({
  type: 'translate',
  location: {
    start: { line: 2, column: 0, offset: 20 },
    end: { line: 2, column: 15, offset: 35 },
    text: 'translate([1,0,0])',
  },
  parameters: [{ name: 'v', value: [1, 0, 0] }],
  children: [createMockCubeNode()],
});

const createMockUnionNode = (): ASTNode => ({
  type: 'union',
  location: {
    start: { line: 3, column: 0, offset: 40 },
    end: { line: 5, column: 1, offset: 80 },
    text: 'union() { cube([1,2,3]); sphere(r=2); }',
  },
  children: [
    createMockCubeNode(),
    {
      type: 'sphere',
      location: {
        start: { line: 4, column: 2, offset: 60 },
        end: { line: 4, column: 12, offset: 70 },
        text: 'sphere(r=2)',
      },
      parameters: [{ name: 'r', value: 2 }],
    },
  ],
});

describe('ASTNodeProcessor', () => {
  let processor: ASTNodeProcessor;

  beforeEach(() => {
    processor = new ASTNodeProcessor();
  });

  describe('node type processing', () => {
    it('should process primitive nodes correctly', () => {
      const cubeNode = createMockCubeNode();
      const result = processor.processNode(cubeNode);

      expect(result.success).toBe(true);
      expect(result.data.nodeType).toBe('primitive');
      expect(result.data.originalNode).toBe(cubeNode);
      expect(result.data.processingMetadata.processingTime).toBeGreaterThan(0);
    });

    it('should process transformation nodes correctly', () => {
      const translateNode = createMockTranslateNode();
      const result = processor.processNode(translateNode);

      expect(result.success).toBe(true);
      expect(result.data.nodeType).toBe('transformation');
      expect(result.data.originalNode).toBe(translateNode);
      expect(result.data.children).toHaveLength(1);
    });

    it('should process CSG operation nodes correctly', () => {
      const unionNode = createMockUnionNode();
      const result = processor.processNode(unionNode);

      expect(result.success).toBe(true);
      expect(result.data.nodeType).toBe('csg_operation');
      expect(result.data.originalNode).toBe(unionNode);
      expect(result.data.children).toHaveLength(2);
    });

    it('should handle unknown node types gracefully', () => {
      const unknownNode = {
        type: 'unknown_type',
        location: {
          start: { line: 1, column: 0, offset: 0 },
          end: { line: 1, column: 10, offset: 10 },
          text: 'unknown()',
        },
      } as ASTNode;
      const result = processor.processNode(unknownNode);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Unknown node type');
    });
  });

  describe('parameter extraction', () => {
    it('should extract parameters from primitive nodes', () => {
      const cubeNode = createMockCubeNode();
      const parameters = processor.extractParameters(cubeNode);

      expect(parameters.size).toEqual([1, 2, 3]);
      expect(parameters.center).toBe(false);
    });

    it('should extract parameters from transformation nodes', () => {
      const translateNode = createMockTranslateNode();
      const parameters = processor.extractParameters(translateNode);

      expect(parameters.v).toEqual([1, 0, 0]);
    });

    it('should handle nodes without parameters', () => {
      const nodeWithoutParams = { type: 'children' } as ASTNode;
      const parameters = processor.extractParameters(nodeWithoutParams);

      expect(parameters).toEqual({});
    });
  });

  describe('node validation', () => {
    it('should validate correct primitive nodes', () => {
      const cubeNode = createMockCubeNode();
      const isValid = processor.validateNode(cubeNode);

      expect(isValid).toBe(true);
    });

    it('should reject nodes without required properties', () => {
      const invalidNode = { type: 'cube' } as ASTNode; // Missing location and parameters
      const isValid = processor.validateNode(invalidNode);

      expect(isValid).toBe(false);
    });

    it('should validate transformation nodes with children', () => {
      const translateNode = createMockTranslateNode();
      const isValid = processor.validateNode(translateNode);

      expect(isValid).toBe(true);
    });
  });
});

describe('ASTProcessingPipeline', () => {
  let pipeline: ASTProcessingPipeline;

  beforeEach(() => {
    pipeline = new ASTProcessingPipeline();
  });

  describe('pipeline execution', () => {
    it('should process single node through pipeline', async () => {
      const cubeNode = createMockCubeNode();
      const result = await pipeline.processNode(cubeNode);

      expect(result.success).toBe(true);
      expect(result.data.processedNode).toBeDefined();
      expect(result.data.pipelineMetadata.stagesExecuted.length).toBeGreaterThan(0);
    });

    it('should process multiple nodes through pipeline', async () => {
      const nodes = [createMockCubeNode(), createMockTranslateNode()];
      const result = await pipeline.processNodes(nodes);

      expect(result.success).toBe(true);
      expect(result.data.processedNodes).toHaveLength(2);
      expect(result.data.pipelineMetadata.totalProcessingTime).toBeGreaterThan(0);
    });

    it('should handle pipeline errors gracefully', async () => {
      const invalidNode = { type: 'invalid' } as ASTNode;
      const result = await pipeline.processNode(invalidNode);

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Pipeline validation failed');
    });
  });

  describe('pipeline stages', () => {
    it('should execute validation stage', async () => {
      const cubeNode = createMockCubeNode();
      const result = await pipeline.processNode(cubeNode);

      expect(result.data.pipelineMetadata.stagesExecuted).toContain('validation');
    });

    it('should execute processing stage', async () => {
      const cubeNode = createMockCubeNode();
      const result = await pipeline.processNode(cubeNode);

      expect(result.data.pipelineMetadata.stagesExecuted).toContain('processing');
    });

    it('should execute optimization stage', async () => {
      const cubeNode = createMockCubeNode();
      const result = await pipeline.processNode(cubeNode);

      expect(result.data.pipelineMetadata.stagesExecuted).toContain('optimization');
    });
  });

  describe('pipeline configuration', () => {
    it('should allow custom pipeline configuration', () => {
      const customConfig = {
        enableOptimization: false,
        enableCaching: true,
        maxProcessingTime: 1000,
      };

      const customPipeline = new ASTProcessingPipeline(customConfig);
      expect(customPipeline.getConfiguration().enableOptimization).toBe(false);
      expect(customPipeline.getConfiguration().enableCaching).toBe(true);
    });
  });
});

describe('ASTAnalyzer', () => {
  let analyzer: ASTAnalyzer;

  beforeEach(() => {
    analyzer = new ASTAnalyzer();
  });

  describe('structure analysis', () => {
    it('should analyze simple AST structure', () => {
      const cubeNode = createMockCubeNode();
      const analysis = analyzer.analyzeStructure(cubeNode);

      expect(analysis.nodeCount).toBe(1);
      expect(analysis.depth).toBe(1);
      expect(analysis.nodeTypes).toContain('cube');
      expect(analysis.primitiveCount).toBe(1);
      expect(analysis.transformationCount).toBe(0);
    });

    it('should analyze complex AST structure', () => {
      const unionNode = createMockUnionNode();
      const analysis = analyzer.analyzeStructure(unionNode);

      expect(analysis.nodeCount).toBe(3); // union + cube + sphere
      expect(analysis.depth).toBe(2);
      expect(analysis.nodeTypes).toContain('union');
      expect(analysis.nodeTypes).toContain('cube');
      expect(analysis.nodeTypes).toContain('sphere');
      expect(analysis.primitiveCount).toBe(2);
      expect(analysis.csgOperationCount).toBe(1);
    });

    it('should analyze transformation hierarchy', () => {
      const translateNode = createMockTranslateNode();
      const analysis = analyzer.analyzeStructure(translateNode);

      expect(analysis.nodeCount).toBe(2); // translate + cube
      expect(analysis.depth).toBe(2);
      expect(analysis.transformationCount).toBe(1);
      expect(analysis.primitiveCount).toBe(1);
    });
  });

  describe('node traversal', () => {
    it('should find nodes by type', () => {
      const unionNode = createMockUnionNode();
      const primitives = analyzer.findNodesByType(unionNode, 'primitive');

      expect(primitives).toHaveLength(2); // cube and sphere
    });

    it('should find nodes by predicate', () => {
      const unionNode = createMockUnionNode();
      const nodesWithRadius = analyzer.findNodesByPredicate(unionNode, (node) =>
        node.parameters?.some((p) => p.name === 'r')
      );

      expect(nodesWithRadius).toHaveLength(1); // sphere with radius
    });

    it('should traverse AST depth-first', () => {
      const unionNode = createMockUnionNode();
      const visitOrder: string[] = [];

      analyzer.traverseDepthFirst(unionNode, (node) => {
        visitOrder.push(node.type);
      });

      expect(visitOrder).toEqual(['union', 'cube', 'sphere']);
    });
  });

  describe('complexity analysis', () => {
    it('should calculate AST complexity', () => {
      const unionNode = createMockUnionNode();
      const complexity = analyzer.calculateComplexity(unionNode);

      expect(complexity.nodeComplexity).toBeGreaterThan(0);
      expect(complexity.depthComplexity).toBeGreaterThan(0);
      expect(complexity.overallComplexity).toBeGreaterThan(0);
    });
  });
});

describe('ASTProcessingPerformanceTracker', () => {
  let tracker: ASTProcessingPerformanceTracker;

  beforeEach(() => {
    tracker = new ASTProcessingPerformanceTracker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performance tracking', () => {
    it('should track processing time for single node', () => {
      const cubeNode = createMockCubeNode();

      tracker.startTracking('test-operation');
      // Simulate processing
      const result = tracker.endTracking('test-operation', cubeNode);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.nodeType).toBe('cube');
      expect(result.operationName).toBe('test-operation');
    });

    it('should track memory usage during processing', () => {
      const cubeNode = createMockCubeNode();

      tracker.startTracking('memory-test');
      const result = tracker.endTracking('memory-test', cubeNode);

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.before).toBeGreaterThanOrEqual(0);
      expect(result.memoryUsage.after).toBeGreaterThanOrEqual(0);
    });

    it('should calculate performance metrics', () => {
      const nodes = [createMockCubeNode(), createMockTranslateNode()];

      for (const node of nodes) {
        tracker.startTracking(`process-${node.type}`);
        tracker.endTracking(`process-${node.type}`, node);
      }

      const metrics = tracker.getPerformanceMetrics();

      expect(metrics.totalOperations).toBe(2);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.operationsByType.cube).toBe(1);
      expect(metrics.operationsByType.translate).toBe(1);
    });
  });
});

describe('utility functions', () => {
  describe('processASTNode', () => {
    it('should process AST node using standalone function', () => {
      const cubeNode = createMockCubeNode();
      const result = processASTNode(cubeNode);

      expect(result.success).toBe(true);
      expect(result.data.nodeType).toBe('primitive');
    });
  });

  describe('analyzeASTStructure', () => {
    it('should analyze AST structure using standalone function', () => {
      const unionNode = createMockUnionNode();
      const analysis = analyzeASTStructure(unionNode);

      expect(analysis.nodeCount).toBe(3);
      expect(analysis.primitiveCount).toBe(2);
      expect(analysis.csgOperationCount).toBe(1);
    });
  });

  describe('createProcessingPipeline', () => {
    it('should create processing pipeline using standalone function', () => {
      const config = { enableOptimization: true };
      const pipeline = createProcessingPipeline(config);

      expect(pipeline).toBeInstanceOf(ASTProcessingPipeline);
      expect(pipeline.getConfiguration().enableOptimization).toBe(true);
    });
  });

  describe('trackASTProcessingPerformance', () => {
    it('should track performance using standalone function', () => {
      const cubeNode = createMockCubeNode();
      const result = trackASTProcessingPerformance('test-op', cubeNode, () => {
        // Simulate processing
        return { processed: true };
      });

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.nodeType).toBe('cube');
      expect(result.result).toEqual({ processed: true });
    });
  });
});
