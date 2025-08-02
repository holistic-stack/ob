/**
 * @file ast-processing-utilities.ts
 * @description Reusable AST processing utilities for OpenSCAD integration.
 * Provides AST node processors, processing pipeline utilities, AST analysis utilities,
 * and processing performance utilities to eliminate code duplication and improve reusability.
 *
 * @example
 * ```typescript
 * // AST node processing
 * const processor = new ASTNodeProcessor();
 * const result = processor.processNode(astNode);
 *
 * // AST processing pipeline
 * const pipeline = new ASTProcessingPipeline();
 * const pipelineResult = await pipeline.processNode(astNode);
 *
 * // AST structure analysis
 * const analyzer = new ASTAnalyzer();
 * const analysis = analyzer.analyzeStructure(astNode);
 *
 * // Performance tracking
 * const tracker = new ASTProcessingPerformanceTracker();
 * tracker.startTracking('operation');
 * const perfResult = tracker.endTracking('operation', astNode);
 * ```
 *
 * @author OpenSCAD Babylon Team
 * @version 1.0.0
 * @since 2025-07-30
 */

import type { ASTNode } from '@/features/openscad-parser';
import type { Result } from '@/shared';
import { error, success } from '@/shared';
import { MemoryMonitor, PerformanceTimer } from '@/shared/utils/performance';

/**
 * Processed AST node with metadata
 */
export interface ProcessedASTNode {
  readonly originalNode: ASTNode;
  readonly nodeType: 'primitive' | 'transformation' | 'csg_operation' | 'control_flow' | 'unknown';
  readonly parameters: Record<string, unknown>;
  readonly children?: ProcessedASTNode[];
  readonly processingMetadata: {
    readonly processingTime: number;
    readonly memoryUsage: number;
    readonly validationPassed: boolean;
  };
}

/**
 * AST structure analysis result
 */
export interface ASTStructureAnalysis {
  readonly nodeCount: number;
  readonly depth: number;
  readonly nodeTypes: readonly string[];
  readonly primitiveCount: number;
  readonly transformationCount: number;
  readonly csgOperationCount: number;
  readonly controlFlowCount: number;
  readonly complexity: {
    readonly nodeComplexity: number;
    readonly depthComplexity: number;
    readonly overallComplexity: number;
  };
}

/**
 * Pipeline processing result
 */
export interface PipelineProcessingResult {
  readonly processedNode?: ProcessedASTNode;
  readonly processedNodes?: ProcessedASTNode[];
  readonly pipelineMetadata: {
    readonly stagesExecuted: readonly string[];
    readonly totalProcessingTime: number;
    readonly memoryUsage: number;
  };
}

/**
 * Pipeline configuration
 */
export interface PipelineConfiguration {
  readonly enableOptimization: boolean;
  readonly enableCaching: boolean;
  readonly maxProcessingTime: number;
  readonly enableValidation: boolean;
}

/**
 * Performance tracking result
 */
export interface PerformanceTrackingResult {
  readonly operationName: string;
  readonly nodeType: string;
  readonly processingTime: number;
  readonly memoryUsage: {
    readonly before: number;
    readonly after: number;
    readonly delta: number;
  };
  readonly result?: unknown;
}

/**
 * Performance metrics summary
 */
export interface PerformanceMetrics {
  readonly totalOperations: number;
  readonly averageProcessingTime: number;
  readonly totalMemoryUsage: number;
  readonly operationsByType: Record<string, number>;
  readonly slowestOperations: readonly PerformanceTrackingResult[];
}

/**
 * Default pipeline configuration
 */
const DEFAULT_PIPELINE_CONFIG: PipelineConfiguration = {
  enableOptimization: true,
  enableCaching: true,
  maxProcessingTime: 5000, // 5 seconds
  enableValidation: true,
} as const;

/**
 * AST node processor for processing individual AST nodes
 */
export class ASTNodeProcessor {
  private timer = new PerformanceTimer();
  private memoryMonitor = new MemoryMonitor();

  /**
   * Process a single AST node
   *
   * @param node - AST node to process
   * @returns Result with processed node or error
   */
  processNode(node: ASTNode): Result<ProcessedASTNode, Error> {
    try {
      this.timer.start();
      const memoryBefore = this.memoryMonitor.getCurrentUsageMB();

      // Validate node
      if (!this.validateNode(node)) {
        return error(new Error(`Invalid AST node: ${node.type}`));
      }

      // Determine node type
      const nodeType = this.determineNodeType(node);
      if (nodeType === 'unknown') {
        return error(new Error(`Unknown node type: ${node.type}`));
      }

      // Extract parameters
      const parameters = this.extractParameters(node);

      // Process children if present
      const children = this.processChildren(node);

      const processingTime = this.timer.stop();
      const memoryAfter = this.memoryMonitor.getCurrentUsageMB();

      const processedNode: ProcessedASTNode = {
        originalNode: node,
        nodeType,
        parameters,
        processingMetadata: {
          processingTime,
          memoryUsage: memoryAfter - memoryBefore,
          validationPassed: true,
        },
      };

      // Only include children if they exist
      if (children !== undefined) {
        (processedNode as any).children = children;
      }

      return success(processedNode);
    } catch (err) {
      return error(
        new Error(
          `Failed to process AST node: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Extract parameters from AST node
   *
   * @param node - AST node
   * @returns Parameters object
   */
  extractParameters(node: ASTNode): Record<string, unknown> {
    if (!('parameters' in node) || !Array.isArray(node.parameters)) {
      return {};
    }

    const parameters: Record<string, unknown> = {};
    for (const param of node.parameters) {
      if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
        parameters[param.name as string] = param.value;
      }
    }

    return parameters;
  }

  /**
   * Validate AST node structure
   *
   * @param node - AST node to validate
   * @returns True if valid
   */
  validateNode(node: ASTNode): boolean {
    if (
      !node ||
      typeof node !== 'object' ||
      typeof node.type !== 'string' ||
      node.type.length === 0
    ) {
      return false;
    }

    // Check for required location property for most nodes
    if (!('location' in node) || !node.location) {
      return false;
    }

    return true;
  }

  /**
   * Determine the category of AST node
   */
  private determineNodeType(node: ASTNode): ProcessedASTNode['nodeType'] {
    const primitiveTypes = [
      'cube',
      'sphere',
      'cylinder',
      'circle',
      'square',
      'polygon',
      'polyhedron',
      'text',
    ];
    const transformationTypes = ['translate', 'rotate', 'scale', 'mirror', 'multmatrix', 'color'];
    const csgTypes = ['union', 'difference', 'intersection', 'hull', 'minkowski'];
    const controlFlowTypes = ['for', 'if', 'let', 'each', 'module', 'function'];

    if (primitiveTypes.includes(node.type)) return 'primitive';
    if (transformationTypes.includes(node.type)) return 'transformation';
    if (csgTypes.includes(node.type)) return 'csg_operation';
    if (controlFlowTypes.includes(node.type)) return 'control_flow';

    return 'unknown';
  }

  /**
   * Process children nodes if present
   */
  private processChildren(node: ASTNode): ProcessedASTNode[] | undefined {
    if (!('children' in node) || !Array.isArray(node.children)) {
      return undefined;
    }

    const processedChildren: ProcessedASTNode[] = [];
    for (const child of node.children) {
      const result = this.processNode(child);
      if (result.success) {
        processedChildren.push(result.data);
      }
    }

    return processedChildren.length > 0 ? processedChildren : undefined;
  }
}

/**
 * AST processing pipeline for coordinated processing
 */
export class ASTProcessingPipeline {
  private config: PipelineConfiguration;
  private processor = new ASTNodeProcessor();
  private timer = new PerformanceTimer();
  private memoryMonitor = new MemoryMonitor();

  constructor(config: Partial<PipelineConfiguration> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
  }

  /**
   * Process a single node through the pipeline
   *
   * @param node - AST node to process
   * @returns Pipeline processing result
   */
  async processNode(node: ASTNode): Promise<Result<PipelineProcessingResult, Error>> {
    try {
      this.timer.start();
      const memoryBefore = this.memoryMonitor.getCurrentUsageMB();
      const stagesExecuted: string[] = [];

      // Validation stage
      if (this.config.enableValidation) {
        if (!this.processor.validateNode(node)) {
          return error(new Error('Pipeline validation failed'));
        }
        stagesExecuted.push('validation');
      }

      // Processing stage
      const processingResult = this.processor.processNode(node);
      if (!processingResult.success) {
        return error(new Error(`Pipeline processing failed: ${processingResult.error.message}`));
      }

      // TypeScript now knows processingResult is successful
      const processedNode = processingResult.data;
      stagesExecuted.push('processing');

      // Optimization stage
      if (this.config.enableOptimization) {
        // Placeholder for optimization logic
        stagesExecuted.push('optimization');
      }

      const totalProcessingTime = this.timer.stop();
      const memoryAfter = this.memoryMonitor.getCurrentUsageMB();

      const result: PipelineProcessingResult = {
        processedNode,
        pipelineMetadata: {
          stagesExecuted,
          totalProcessingTime,
          memoryUsage: memoryAfter - memoryBefore,
        },
      };

      return success(result);
    } catch (err) {
      return error(
        new Error(
          `Pipeline execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Process multiple nodes through the pipeline
   *
   * @param nodes - AST nodes to process
   * @returns Pipeline processing result
   */
  async processNodes(nodes: readonly ASTNode[]): Promise<Result<PipelineProcessingResult, Error>> {
    try {
      // Use a separate timer for batch processing
      const batchTimer = new PerformanceTimer();
      batchTimer.start();

      const memoryBefore = this.memoryMonitor.getCurrentUsageMB();
      const stagesExecuted: string[] = [];
      const processedNodes: ProcessedASTNode[] = [];

      for (const node of nodes) {
        // Process each node individually (this will use its own timer)
        const processingResult = this.processor.processNode(node);
        if (processingResult.success) {
          processedNodes.push(processingResult.data);
        } else {
          return error(processingResult.error);
        }
      }

      stagesExecuted.push('batch_processing');

      const totalProcessingTime = batchTimer.stop();
      const memoryAfter = this.memoryMonitor.getCurrentUsageMB();

      const result: PipelineProcessingResult = {
        processedNodes,
        pipelineMetadata: {
          stagesExecuted,
          totalProcessingTime,
          memoryUsage: memoryAfter - memoryBefore,
        },
      };

      return success(result);
    } catch (err) {
      return error(
        new Error(
          `Batch pipeline execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      );
    }
  }

  /**
   * Get current pipeline configuration
   *
   * @returns Pipeline configuration
   */
  getConfiguration(): PipelineConfiguration {
    return { ...this.config };
  }
}

/**
 * AST analyzer for structure analysis and traversal
 */
export class ASTAnalyzer {
  /**
   * Analyze AST structure and complexity
   *
   * @param node - Root AST node
   * @returns Structure analysis
   */
  analyzeStructure(node: ASTNode): ASTStructureAnalysis {
    const nodeTypes = new Set<string>();
    let nodeCount = 0;
    let primitiveCount = 0;
    let transformationCount = 0;
    let csgOperationCount = 0;
    let controlFlowCount = 0;
    let maxDepth = 0;

    const _processor = new ASTNodeProcessor();

    this.traverseDepthFirst(node, (currentNode, depth) => {
      nodeCount++;
      nodeTypes.add(currentNode.type);
      maxDepth = Math.max(maxDepth, depth);

      const nodeType = this.determineNodeCategory(currentNode);
      switch (nodeType) {
        case 'primitive':
          primitiveCount++;
          break;
        case 'transformation':
          transformationCount++;
          break;
        case 'csg_operation':
          csgOperationCount++;
          break;
        case 'control_flow':
          controlFlowCount++;
          break;
      }
    });

    const complexity = this.calculateComplexity(node);

    return {
      nodeCount,
      depth: maxDepth,
      nodeTypes: Array.from(nodeTypes),
      primitiveCount,
      transformationCount,
      csgOperationCount,
      controlFlowCount,
      complexity,
    };
  }

  /**
   * Find nodes by type
   *
   * @param root - Root node to search from
   * @param nodeType - Type to search for
   * @returns Array of matching nodes
   */
  findNodesByType(root: ASTNode, nodeType: string): ASTNode[] {
    const matches: ASTNode[] = [];

    this.traverseDepthFirst(root, (node) => {
      if (this.determineNodeCategory(node) === nodeType) {
        matches.push(node);
      }
    });

    return matches;
  }

  /**
   * Find nodes by predicate function
   *
   * @param root - Root node to search from
   * @param predicate - Function to test nodes
   * @returns Array of matching nodes
   */
  findNodesByPredicate(root: ASTNode, predicate: (node: ASTNode) => boolean): ASTNode[] {
    const matches: ASTNode[] = [];

    this.traverseDepthFirst(root, (node) => {
      if (predicate(node)) {
        matches.push(node);
      }
    });

    return matches;
  }

  /**
   * Traverse AST depth-first
   *
   * @param node - Root node
   * @param visitor - Function to call for each node
   * @param depth - Current depth (internal)
   */
  traverseDepthFirst(
    node: ASTNode,
    visitor: (node: ASTNode, depth?: number) => void,
    depth: number = 1
  ): void {
    visitor(node, depth);

    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseDepthFirst(child, visitor, depth + 1);
      }
    }
  }

  /**
   * Calculate AST complexity metrics
   *
   * @param node - Root AST node
   * @returns Complexity metrics
   */
  calculateComplexity(node: ASTNode): ASTStructureAnalysis['complexity'] {
    let nodeComplexity = 0;
    let maxDepth = 0;

    this.traverseDepthFirst(node, (currentNode, depth = 1) => {
      // Base complexity for each node
      nodeComplexity += 1;

      // Additional complexity for certain node types
      const nodeType = this.determineNodeCategory(currentNode);
      switch (nodeType) {
        case 'csg_operation':
          nodeComplexity += 2; // CSG operations are more complex
          break;
        case 'control_flow':
          nodeComplexity += 3; // Control flow adds significant complexity
          break;
        case 'transformation':
          nodeComplexity += 1; // Transformations add moderate complexity
          break;
      }

      maxDepth = Math.max(maxDepth, depth);
    });

    const depthComplexity = maxDepth * 0.5; // Depth contributes to complexity
    const overallComplexity = nodeComplexity + depthComplexity;

    return {
      nodeComplexity,
      depthComplexity,
      overallComplexity,
    };
  }

  /**
   * Determine node category for analysis
   */
  private determineNodeCategory(node: ASTNode): string {
    const primitiveTypes = [
      'cube',
      'sphere',
      'cylinder',
      'circle',
      'square',
      'polygon',
      'polyhedron',
      'text',
    ];
    const transformationTypes = ['translate', 'rotate', 'scale', 'mirror', 'multmatrix', 'color'];
    const csgTypes = ['union', 'difference', 'intersection', 'hull', 'minkowski'];
    const controlFlowTypes = ['for', 'if', 'let', 'each', 'module', 'function'];

    if (primitiveTypes.includes(node.type)) return 'primitive';
    if (transformationTypes.includes(node.type)) return 'transformation';
    if (csgTypes.includes(node.type)) return 'csg_operation';
    if (controlFlowTypes.includes(node.type)) return 'control_flow';

    return 'unknown';
  }
}

/**
 * AST processing performance tracker
 */
export class ASTProcessingPerformanceTracker {
  private operations = new Map<string, { startTime: number; startMemory: number }>();
  private completedOperations: PerformanceTrackingResult[] = [];
  private memoryMonitor = new MemoryMonitor();

  /**
   * Start tracking an operation
   *
   * @param operationName - Name of the operation
   */
  startTracking(operationName: string): void {
    this.operations.set(operationName, {
      startTime: performance.now(),
      startMemory: this.memoryMonitor.getCurrentUsageMB(),
    });
  }

  /**
   * End tracking an operation
   *
   * @param operationName - Name of the operation
   * @param node - AST node that was processed
   * @returns Performance tracking result
   */
  endTracking(operationName: string, node: ASTNode): PerformanceTrackingResult {
    const operation = this.operations.get(operationName);
    if (!operation) {
      throw new Error(`Operation ${operationName} was not started`);
    }

    const endTime = performance.now();
    const endMemory = this.memoryMonitor.getCurrentUsageMB();

    const result: PerformanceTrackingResult = {
      operationName,
      nodeType: node.type,
      processingTime: endTime - operation.startTime,
      memoryUsage: {
        before: operation.startMemory,
        after: endMemory,
        delta: endMemory - operation.startMemory,
      },
    };

    this.completedOperations.push(result);
    this.operations.delete(operationName);

    return result;
  }

  /**
   * Get performance metrics summary
   *
   * @returns Performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const totalOperations = this.completedOperations.length;
    const averageProcessingTime =
      totalOperations > 0
        ? this.completedOperations.reduce((sum, op) => sum + op.processingTime, 0) / totalOperations
        : 0;

    const totalMemoryUsage = this.completedOperations.reduce(
      (sum, op) => sum + Math.abs(op.memoryUsage.delta),
      0
    );

    const operationsByType: Record<string, number> = {};
    for (const operation of this.completedOperations) {
      operationsByType[operation.nodeType] = (operationsByType[operation.nodeType] || 0) + 1;
    }

    const slowestOperations = [...this.completedOperations]
      .sort((a, b) => b.processingTime - a.processingTime)
      .slice(0, 5);

    return {
      totalOperations,
      averageProcessingTime,
      totalMemoryUsage,
      operationsByType,
      slowestOperations,
    };
  }
}

/**
 * Process AST node (standalone utility)
 *
 * @param node - AST node to process
 * @returns Processing result
 */
export function processASTNode(node: ASTNode): Result<ProcessedASTNode, Error> {
  const processor = new ASTNodeProcessor();
  return processor.processNode(node);
}

/**
 * Analyze AST structure (standalone utility)
 *
 * @param node - Root AST node
 * @returns Structure analysis
 */
export function analyzeASTStructure(node: ASTNode): ASTStructureAnalysis {
  const analyzer = new ASTAnalyzer();
  return analyzer.analyzeStructure(node);
}

/**
 * Create processing pipeline (standalone utility)
 *
 * @param config - Pipeline configuration
 * @returns Processing pipeline
 */
export function createProcessingPipeline(
  config?: Partial<PipelineConfiguration>
): ASTProcessingPipeline {
  return new ASTProcessingPipeline(config);
}

/**
 * Track AST processing performance (standalone utility)
 *
 * @param operationName - Name of the operation
 * @param node - AST node being processed
 * @param operation - Function to execute and track
 * @returns Performance tracking result with operation result
 */
export function trackASTProcessingPerformance<T>(
  operationName: string,
  node: ASTNode,
  operation: () => T
): PerformanceTrackingResult & { result: T } {
  const tracker = new ASTProcessingPerformanceTracker();

  tracker.startTracking(operationName);
  const result = operation();
  const perfResult = tracker.endTracking(operationName, node);

  return {
    ...perfResult,
    result,
  };
}
