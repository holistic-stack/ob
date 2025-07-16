/**
 * @file AST Bridge Converter Service
 *
 * Implements the Bridge Pattern to convert OpenSCAD AST nodes to BabylonJS-Extended AST nodes.
 * This service preserves the existing OpenSCAD parser unchanged while providing conversion
 * to BabylonJS-compatible AST that extends BABYLON.AbstractMesh.
 *
 * Architecture: OpenscadAST → ASTBridgeConverter → BabylonJS-Extended AST → BabylonJS Meshes
 */

import type { Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

import type { ASTNode } from '../../../openscad-parser/ast/ast-types';
import type {
  BabylonJSError,
  BabylonJSNode,
  BridgeConversionResult,
} from '../../types/babylon-ast.types';

const logger = createLogger('ASTBridgeConverter');

/**
 * Configuration for AST bridge conversion
 */
export interface BridgeConversionConfig {
  readonly preserveSourceLocations: boolean;
  readonly optimizeConversion: boolean;
  readonly validateNodes: boolean;
  readonly timeout: number;
}

/**
 * Default bridge conversion configuration
 */
export const DEFAULT_BRIDGE_CONFIG: BridgeConversionConfig = {
  preserveSourceLocations: true,
  optimizeConversion: true,
  validateNodes: true,
  timeout: 5000,
} as const;

/**
 * AST Bridge Converter Service
 *
 * Converts OpenSCAD AST nodes to BabylonJS-Extended AST nodes using the Bridge Pattern.
 * This allows the existing OpenSCAD parser to remain unchanged while providing
 * BabylonJS-compatible AST nodes that extend BABYLON.AbstractMesh.
 */
export class ASTBridgeConverter {
  private scene: Scene | null = null;
  private config: BridgeConversionConfig;
  private isInitialized = false;
  private conversionCache = new Map<string, BabylonJSNode>();

  constructor(config: BridgeConversionConfig = DEFAULT_BRIDGE_CONFIG) {
    this.config = { ...config };
    logger.init('[INIT][ASTBridgeConverter] Bridge converter initialized');
  }

  /**
   * Initialize the bridge converter with a BabylonJS scene
   */
  async initialize(scene: Scene): Promise<Result<void, BabylonJSError>> {
    logger.debug('[DEBUG][ASTBridgeConverter] Initializing bridge converter...');

    return tryCatch(
      () => {
        if (!scene) {
          throw this.createError('INVALID_SCENE', 'Scene is required for bridge conversion');
        }

        this.scene = scene;
        this.isInitialized = true;
        logger.debug('[DEBUG][ASTBridgeConverter] Bridge converter initialized successfully');
      },
      (error) =>
        this.createError('INITIALIZATION_FAILED', `Failed to initialize bridge converter: ${error}`)
    );
  }

  /**
   * Convert OpenSCAD AST nodes to BabylonJS-Extended AST nodes
   *
   * This is the main bridge conversion method that implements the Bridge Pattern.
   * It takes OpenSCAD AST nodes and converts them to BabylonJS-compatible AST nodes.
   */
  async convertAST(
    openscadNodes: ReadonlyArray<ASTNode>,
    config?: Partial<BridgeConversionConfig>
  ): Promise<BridgeConversionResult> {
    if (!this.isInitialized || !this.scene) {
      return {
        success: false,
        error: this.createError(
          'NOT_INITIALIZED',
          'Bridge converter not initialized. Call initialize() first.'
        ),
      };
    }

    const startTime = performance.now();
    const effectiveConfig = config ? { ...this.config, ...config } : this.config;

    logger.debug(
      `[CONVERT] Converting ${openscadNodes.length} OpenSCAD AST nodes to BabylonJS AST`
    );

    return tryCatchAsync(
      async () => {
        const babylonNodes: BabylonJSNode[] = [];

        for (const openscadNode of openscadNodes) {
          const conversionResult = await this.convertSingleNode(openscadNode, effectiveConfig);

          if (!conversionResult.success) {
            throw new Error(
              `Failed to convert node ${openscadNode.type}: ${conversionResult.error.message}`
            );
          }

          babylonNodes.push(conversionResult.data);
        }

        const conversionTime = performance.now() - startTime;
        logger.debug(
          `[CONVERT] Converted ${babylonNodes.length} nodes in ${conversionTime.toFixed(2)}ms`
        );

        return babylonNodes;
      },
      (error) => this.createError('CONVERSION_FAILED', `AST conversion failed: ${error}`)
    );
  }

  /**
   * Convert a single OpenSCAD AST node to BabylonJS-Extended AST node
   */
  private async convertSingleNode(
    openscadNode: ASTNode,
    config: BridgeConversionConfig
  ): Promise<Result<BabylonJSNode, BabylonJSError>> {
    logger.debug(`[CONVERT] Converting ${openscadNode.type} node`);

    // Check cache first if optimization is enabled
    if (config.optimizeConversion) {
      const cacheKey = this.generateCacheKey(openscadNode);
      const cachedNode = this.conversionCache.get(cacheKey);
      if (cachedNode) {
        logger.debug(`[CACHE] Using cached conversion for ${openscadNode.type}`);
        return { success: true, data: cachedNode };
      }
    }

    return tryCatchAsync(
      async () => {
        // Create appropriate BabylonJS node based on type
        const babylonNode = await this.createBabylonNode(openscadNode, config);

        // Validate the converted node if validation is enabled
        if (config.validateNodes) {
          const validationResult = babylonNode.validateNode();
          if (!validationResult.success) {
            throw new Error(`Node validation failed: ${validationResult.error.message}`);
          }
        }

        // Cache the result if optimization is enabled
        if (config.optimizeConversion) {
          const cacheKey = this.generateCacheKey(openscadNode);
          this.conversionCache.set(cacheKey, babylonNode);
        }

        return babylonNode;
      },
      (error) =>
        this.createError(
          'NODE_CONVERSION_FAILED',
          `Failed to convert ${openscadNode.type} node: ${error}`
        )
    );
  }

  /**
   * Create appropriate BabylonJS node based on OpenSCAD node type
   */
  private async createBabylonNode(openscadNode: ASTNode, config: BridgeConversionConfig): Promise<BabylonJSNode> {
    const nodeId = `${openscadNode.type}_${Date.now()}`;

    // Check if this is a primitive type
    if (this.isPrimitiveType(openscadNode.type)) {
      const { PrimitiveBabylonNode } = await import('./primitive-babylon-node');
      return new PrimitiveBabylonNode(nodeId, this.scene, openscadNode, openscadNode.location);
    }

    // Check if this is a transformation type
    if (this.isTransformationType(openscadNode.type)) {
      const { TransformationBabylonNode } = await import('./transformation-babylon-node');

      // TODO: Extract child nodes from the transformation
      // For now, create with empty children array
      const childNodes: BabylonJSNode[] = [];

      return new TransformationBabylonNode(
        nodeId,
        this.scene,
        openscadNode,
        childNodes,
        openscadNode.location
      );
    }

    // Check if this is a CSG operation type
    if (this.isCSGOperationType(openscadNode.type)) {
      const { CSGBabylonNode } = await import('./csg-babylon-node');

      // Extract child nodes from the CSG operation
      const childNodes: BabylonJSNode[] = [];

      if ('children' in openscadNode && Array.isArray(openscadNode.children)) {
        for (const childOpenscadNode of openscadNode.children) {
          const childConversionResult = await this.convertSingleNode(childOpenscadNode, config);
          if (childConversionResult.success) {
            childNodes.push(childConversionResult.data);
          } else {
            logger.warn(
              `[CONVERT] Failed to convert child node for CSG operation: ${childConversionResult.error.message}`
            );
          }
        }
      }

      return new CSGBabylonNode(
        nodeId,
        this.scene,
        openscadNode,
        childNodes,
        openscadNode.location
      );
    }

    // Check if this is a control flow type
    if (this.isControlFlowType(openscadNode.type)) {
      const { ControlFlowBabylonNode } = await import('./control-flow-babylon-node');

      // Extract child nodes from the control flow operation
      const childNodes: BabylonJSNode[] = [];

      if ('children' in openscadNode && Array.isArray(openscadNode.children)) {
        for (const childOpenscadNode of openscadNode.children) {
          const childConversionResult = await this.convertSingleNode(childOpenscadNode, config);
          if (childConversionResult.success) {
            childNodes.push(childConversionResult.data);
          } else {
            logger.warn(
              `[CONVERT] Failed to convert child node for control flow operation: ${childConversionResult.error.message}`
            );
          }
        }
      }

      return new ControlFlowBabylonNode(
        nodeId,
        this.scene,
        openscadNode,
        childNodes,
        openscadNode.location
      );
    }

    // Check if this is an extrusion type
    if (this.isExtrusionType(openscadNode.type)) {
      const { ExtrusionBabylonNode } = await import('./extrusion-babylon-node');

      // TODO: Extract child nodes from the extrusion operation
      // For now, create with empty children array
      const childNodes: BabylonJSNode[] = [];

      return new ExtrusionBabylonNode(
        nodeId,
        this.scene,
        openscadNode,
        childNodes,
        openscadNode.location
      );
    }

    // Check if this is a modifier type
    if (this.isModifierType(openscadNode.type)) {
      const { ModifierBabylonNode } = await import('./modifier-babylon-node');

      // Extract child nodes from the modifier operation
      const childNodes: BabylonJSNode[] = [];

      if ('children' in openscadNode && Array.isArray(openscadNode.children)) {
        for (const childOpenscadNode of openscadNode.children) {
          const childConversionResult = await this.convertSingleNode(childOpenscadNode, config);
          if (childConversionResult.success) {
            childNodes.push(childConversionResult.data);
          } else {
            logger.warn(
              `[CONVERT] Failed to convert child node for modifier operation: ${childConversionResult.error.message}`
            );
          }
        }
      }

      return new ModifierBabylonNode(
        nodeId,
        this.scene,
        openscadNode.type as any, // Cast to ModifierType
        openscadNode,
        childNodes,
        openscadNode.location
      );
    }

    // For other types, use placeholder for now
    const { PlaceholderBabylonNode } = await import('./placeholder-babylon-node');
    return new PlaceholderBabylonNode(nodeId, this.scene, openscadNode, openscadNode.location);
  }

  /**
   * Check if the node type is a primitive type
   */
  private isPrimitiveType(nodeType: string): boolean {
    const primitiveTypes = [
      'cube',
      'sphere',
      'cylinder',
      'polyhedron',
      'circle',
      'square',
      'polygon',
      'text',
    ];
    return primitiveTypes.includes(nodeType);
  }

  /**
   * Check if the node type is a transformation type
   */
  private isTransformationType(nodeType: string): boolean {
    const transformationTypes = ['translate', 'rotate', 'scale', 'mirror', 'color'];
    return transformationTypes.includes(nodeType);
  }

  /**
   * Check if the node type is a CSG operation type
   */
  private isCSGOperationType(nodeType: string): boolean {
    const csgTypes = ['union', 'difference', 'intersection'];
    return csgTypes.includes(nodeType);
  }

  /**
   * Check if the node type is a control flow type
   */
  private isControlFlowType(nodeType: string): boolean {
    const controlFlowTypes = ['for_loop', 'if', 'let'];
    return controlFlowTypes.includes(nodeType);
  }

  /**
   * Check if the node type is an extrusion type
   */
  private isExtrusionType(nodeType: string): boolean {
    const extrusionTypes = ['linear_extrude', 'rotate_extrude'];
    return extrusionTypes.includes(nodeType);
  }

  /**
   * Check if the node type is a modifier type
   */
  private isModifierType(nodeType: string): boolean {
    const modifierTypes = ['disable', 'show_only', 'debug', 'background'];
    return modifierTypes.includes(nodeType);
  }

  /**
   * Generate cache key for OpenSCAD node
   */
  private generateCacheKey(node: ASTNode): string {
    // Create a simple cache key based on node type and basic properties
    // TODO: Implement more sophisticated cache key generation
    return `${node.type}_${JSON.stringify(node).slice(0, 100)}`;
  }

  /**
   * Create a BabylonJS error
   */
  private createError(code: string, message: string): BabylonJSError {
    return {
      code,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * Get conversion statistics
   */
  getStats(): Record<string, unknown> {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this.conversionCache.size,
      hasScene: !!this.scene,
      config: this.config,
    };
  }

  /**
   * Clear conversion cache
   */
  clearCache(): void {
    this.conversionCache.clear();
    logger.debug('[CACHE] Conversion cache cleared');
  }

  /**
   * Dispose of the bridge converter and clean up resources
   */
  dispose(): void {
    this.isInitialized = false;
    this.conversionCache.clear();
    this.scene = null;
    logger.debug('[DISPOSE] ASTBridgeConverter disposed');
  }
}
