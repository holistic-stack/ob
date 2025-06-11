/**
 * @file Complete OpenSCAD to Babylon.js Pipeline Implementation
 * 
 * This module provides the complete pipeline for converting OpenSCAD code to Babylon.js scenes:
 * OpenSCAD Code → @holistic-stack/openscad-parser → Enhanced AST Visitor → CSG2 → Babylon.js Scene
 * 
 * Key Features:
 * - Functional programming patterns with Result types
 * - Automatic resource management for parser lifecycle
 * - CSG2 integration with proper initialization
 * - Comprehensive error handling and logging
 * - Type-safe AST processing
 * 
 * @example
 * ```typescript
 * const pipeline = new OpenScadPipeline();
 * await pipeline.initialize();
 * 
 * const result = await pipeline.processOpenScadCode(
 *   'union() { cube([10, 20, 30]); sphere(r=5); }',
 *   scene
 * );
 * 
 * if (result.success) {
 *   console.log('Generated mesh:', result.value);
 * } else {
 *   console.error('Pipeline error:', result.error);
 * }
 * ```
 */

import * as BABYLON from '@babylonjs/core';
import { EnhancedOpenscadParser } from '@holistic-stack/openscad-parser';
import type { ASTNode } from '@holistic-stack/openscad-parser';
import { ParserResourceManager } from '../utils/parser-resource-manager';
import { OpenScadAstVisitor } from '../openscad-ast-visitor/openscad-ast-visitor';
import type { ModuleDefinitionNode } from '@holistic-stack/openscad-parser';
import { isModuleDefinitionNode } from '../utils/ast-type-guards';

/**
 * Result type for pipeline operations
 */
export type PipelineResult<T> = 
  | { success: true; value: T; metadata?: PipelineMetadata }
  | { success: false; error: string; details?: unknown };

/**
 * Pipeline execution metadata
 */
export interface PipelineMetadata {
  readonly parseTimeMs: number;
  readonly visitTimeMs: number;
  readonly totalTimeMs: number;
  readonly nodeCount: number;
  readonly meshCount: number;
}

/**
 * Pipeline configuration options
 */
export interface PipelineOptions {
  readonly enableLogging?: boolean;
  readonly enableMetrics?: boolean;
  readonly csg2Timeout?: number;
  readonly maxNodeDepth?: number;
}

/**
 * Complete OpenSCAD to Babylon.js Pipeline
 * 
 * Orchestrates the entire conversion process from OpenSCAD code to Babylon.js meshes.
 * Uses functional programming patterns and proper resource management.
 */
export class OpenScadPipeline {
  private parserManager: ParserResourceManager;
  private visitor: OpenScadAstVisitor | null = null;
  private isInitialized = false;
  private options: Required<PipelineOptions>;

  /**
   * Initialize the pipeline with configuration options
   * @param options Pipeline configuration
   */
  constructor(options: PipelineOptions = {}) {
    this.options = {
      enableLogging: options.enableLogging ?? true,
      enableMetrics: options.enableMetrics ?? true,
      csg2Timeout: options.csg2Timeout ?? 30000,
      maxNodeDepth: options.maxNodeDepth ?? 100
    };

    this.parserManager = new ParserResourceManager();
    this.log('[INIT] OpenScadPipeline created with options:', this.options);
  }

  /**
   * Initialize the pipeline components
   * Must be called before processing any OpenSCAD code
   */
  async initialize(): Promise<PipelineResult<void>> {
    if (this.isInitialized) {
      this.log('[DEBUG] Pipeline already initialized');
      return { success: true, value: undefined };
    }

    this.log('[INIT] Initializing OpenSCAD pipeline...');
    
    try {
      // Initialize CSG2 first (required for visitor)
      this.log('[DEBUG] Initializing CSG2...');
      await this.initializeCSG2WithTimeout();
      
      this.isInitialized = true;
      this.log('[DEBUG] Pipeline initialized successfully');
      
      return { success: true, value: undefined };
    } catch (error) {
      const errorMsg = `Pipeline initialization failed: ${error}`;
      this.log('[ERROR]', errorMsg);
      return { success: false, error: errorMsg, details: error };
    }
  }

  /**
   * Process OpenSCAD code and generate Babylon.js meshes
   * @param openscadCode The OpenSCAD code to process
   * @param scene The Babylon.js scene to add meshes to
   * @returns Result containing the generated mesh or error
   */
  async processOpenScadCode(
    openscadCode: string,
    scene: BABYLON.Scene
  ): Promise<PipelineResult<BABYLON.Mesh | null>> {
    if (!this.isInitialized) {
      return { 
        success: false, 
        error: 'Pipeline not initialized. Call initialize() first.' 
      };
    }

    const startTime = performance.now();
    this.log('[INIT] Processing OpenSCAD code:', openscadCode.substring(0, 100) + '...');

    try {
      // Step 1: Parse OpenSCAD code to AST
      const parseResult = await this.parseOpenScadCode(openscadCode);
      if (!parseResult.success) {
        return parseResult;
      }

      const parseTime = performance.now();
      this.log('[DEBUG] Parsing completed, AST nodes:', parseResult.value.length);

      // Step 2: Collect module definitions and filter out non-executable nodes
      const moduleDefinitions = new Map<string, ModuleDefinitionNode>();
      const executableNodes: ASTNode[] = [];

      for (const node of parseResult.value) {
        if (isModuleDefinitionNode(node)) {
          moduleDefinitions.set(node.name, node);
          this.log(`[DEBUG] Collected module definition: ${node.name}`);
        } else {
          executableNodes.push(node);
        }
      }

      // Step 3: Create visitor for this scene, passing collected module definitions
      this.visitor = new OpenScadAstVisitor(scene, moduleDefinitions);

      // Step 4: Process executable AST nodes to generate meshes
      const visitResult = await this.processASTNodes(executableNodes); // Pass only executable nodes
      if (!visitResult.success) {
        return visitResult;
      }

      const endTime = performance.now();
      
      // Step 4: Generate metadata if enabled
      const metadata: PipelineMetadata | undefined = this.options.enableMetrics ? {
        parseTimeMs: parseTime - startTime,
        visitTimeMs: endTime - parseTime,
        totalTimeMs: endTime - startTime,
        nodeCount: parseResult.value.length,
        meshCount: visitResult.value ? 1 : 0
      } : undefined;

      this.log('[END] Pipeline processing completed successfully');

      return {
        success: true,
        value: visitResult.value,
        ...(metadata && { metadata })
      };

    } catch (error) {
      const errorMsg = `Pipeline processing failed: ${error}`;
      this.log('[ERROR]', errorMsg);
      return { success: false, error: errorMsg, details: error };
    }
  }

  /**
   * Parse OpenSCAD code using the parser resource manager
   * @param openscadCode The code to parse
   * @returns Result containing AST nodes or error
   */
  private async parseOpenScadCode(openscadCode: string): Promise<PipelineResult<readonly ASTNode[]>> {
    this.log('[DEBUG] Starting OpenSCAD code parsing...');

    const result = await this.parserManager.parseOpenSCAD(openscadCode);

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    this.log('[DEBUG] Successfully parsed AST with', result.value.length, 'root nodes');
    return {
      success: true,
      value: result.value as ASTNode[] // Cast readonly array to mutable for processing
    };
  }

  /**
   * Process AST nodes using the visitor pattern
   * @param astNodes The AST nodes to process
   * @returns Result containing the generated mesh or error
   */
  private async processASTNodes(astNodes: ASTNode[]): Promise<PipelineResult<BABYLON.Mesh | null>> {
    if (!this.visitor) {
      return { success: false, error: 'Visitor not initialized' };
    }

    this.log('[DEBUG] Processing', astNodes.length, 'AST nodes...');

    try {
      // For now, process the first root node
      // TODO: Handle multiple root nodes (union them together)
      if (astNodes.length === 0) {
        this.log('[WARN] No AST nodes to process');
        return { success: true, value: null };
      }

      const firstNode = astNodes[0]!; // Safe access - length check ensures element exists
      this.log('[DEBUG] Processing first AST node of type:', firstNode.type);

      const mesh = this.visitor.visit(firstNode);
      
      if (mesh) {
        this.log('[DEBUG] Successfully generated mesh:', mesh.name);
        return { success: true, value: mesh };
      } else {
        this.log('[WARN] Visitor returned null mesh');
        return { success: true, value: null };
      }

    } catch (error) {
      return { 
        success: false, 
        error: `AST processing error: ${error}`,
        details: error 
      };
    }
  }

  /**
   * Initialize CSG2 with timeout protection
   */
  private async initializeCSG2WithTimeout(): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('CSG2 initialization timeout')), this.options.csg2Timeout);
    });

    try {
      // Check if we're in test environment
      if ((globalThis as any).__MOCK_CSG2__) {
        this.log('[DEBUG] Using mock CSG2 for tests');
        return;
      }

      // Try real CSG2 initialization with timeout
      if (BABYLON.InitializeCSG2Async) {
        await Promise.race([
          BABYLON.InitializeCSG2Async(),
          timeoutPromise
        ]);
        this.log('[DEBUG] CSG2 initialized successfully');
      } else {
        this.log('[WARN] CSG2 not available, operations will use fallbacks');
      }
    } catch (error) {
      this.log('[WARN] CSG2 initialization failed, using fallbacks:', error);
      // Don't throw - allow pipeline to continue with fallback behavior
    }
  }

  /**
   * Dispose pipeline resources
   */
  async dispose(): Promise<void> {
    this.log('[DEBUG] Disposing pipeline resources...');
    
    try {
      await this.parserManager.dispose();
      this.visitor = null;
      this.isInitialized = false;
      this.log('[DEBUG] Pipeline disposed successfully');
    } catch (error) {
      this.log('[ERROR] Error disposing pipeline:', error);
    }
  }

  /**
   * Check if pipeline is ready for processing
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Internal logging method
   */
  private log(level: string, ...args: unknown[]): void {
    if (this.options.enableLogging) {
      console.log(level, ...args);
    }
  }
}
