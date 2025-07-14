/**
 * @file BabylonJS Node Render Graph Service
 * 
 * Service for managing BabylonJS Node Render Graph for advanced rendering pipeline management.
 * Provides comprehensive render graph creation, configuration, and execution.
 */

import { 
  Scene, 
  NodeRenderGraph,
  NodeRenderGraphBlock,
  NodeRenderGraphConnectionPoint,
  RenderTargetTexture,
  PostProcess,
  Camera,
  AbstractMesh,
  Texture,
  Vector2,
  Vector3,
  Vector4,
  Color3,
  Color4
} from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('BabylonRenderGraphService');

/**
 * Render graph configuration
 */
export interface RenderGraphConfig {
  readonly name: string;
  readonly enabled: boolean;
  readonly autoResize: boolean;
  readonly renderTargetSize: Vector2;
  readonly multiSampling: number;
  readonly generateMipMaps: boolean;
  readonly enableDepthBuffer: boolean;
  readonly enableStencilBuffer: boolean;
  readonly clearColor: Color4;
  readonly clearDepth: number;
  readonly clearStencil: number;
}

/**
 * Render graph block configuration
 */
export interface RenderGraphBlockConfig {
  readonly name: string;
  readonly type: RenderGraphBlockType;
  readonly position: Vector2;
  readonly inputs: Record<string, unknown>;
  readonly outputs: Record<string, unknown>;
  readonly properties: Record<string, unknown>;
}

/**
 * Render graph connection configuration
 */
export interface RenderGraphConnectionConfig {
  readonly sourceBlockName: string;
  readonly sourceOutputName: string;
  readonly targetBlockName: string;
  readonly targetInputName: string;
}

/**
 * Render graph block types
 */
export enum RenderGraphBlockType {
  SCENE_RENDER = 'sceneRender',
  POST_PROCESS = 'postProcess',
  TEXTURE_INPUT = 'textureInput',
  TEXTURE_OUTPUT = 'textureOutput',
  CLEAR_BLOCK = 'clearBlock',
  COPY_TEXTURE = 'copyTexture',
  BLUR = 'blur',
  BLOOM = 'bloom',
  TONE_MAPPING = 'toneMapping',
  COLOR_GRADING = 'colorGrading',
  FXAA = 'fxaa',
  SSAO = 'ssao',
  SSR = 'ssr',
  DEPTH_OF_FIELD = 'depthOfField',
  MOTION_BLUR = 'motionBlur',
  CUSTOM = 'custom',
}

/**
 * Render graph state
 */
export interface RenderGraphState {
  readonly isEnabled: boolean;
  readonly isBuilt: boolean;
  readonly blockCount: number;
  readonly connectionCount: number;
  readonly renderTargets: readonly string[];
  readonly lastBuildTime: Date;
  readonly lastRenderTime: Date;
  readonly error: RenderGraphError | null;
}

/**
 * Render graph error types
 */
export interface RenderGraphError {
  readonly code: RenderGraphErrorCode;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp: Date;
}

export enum RenderGraphErrorCode {
  CREATION_FAILED = 'CREATION_FAILED',
  BUILD_FAILED = 'BUILD_FAILED',
  BLOCK_CREATION_FAILED = 'BLOCK_CREATION_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  SCENE_NOT_PROVIDED = 'SCENE_NOT_PROVIDED',
  RENDER_GRAPH_NOT_FOUND = 'RENDER_GRAPH_NOT_FOUND',
  INVALID_BLOCK_TYPE = 'INVALID_BLOCK_TYPE',
  INVALID_CONNECTION = 'INVALID_CONNECTION',
}

/**
 * Render graph operation results
 */
export type RenderGraphCreateResult = Result<NodeRenderGraph, RenderGraphError>;
export type RenderGraphBuildResult = Result<void, RenderGraphError>;
export type RenderGraphExecuteResult = Result<void, RenderGraphError>;

/**
 * Default render graph configuration
 */
export const DEFAULT_RENDER_GRAPH_CONFIG: RenderGraphConfig = {
  name: 'default-render-graph',
  enabled: true,
  autoResize: true,
  renderTargetSize: new Vector2(1920, 1080),
  multiSampling: 4,
  generateMipMaps: false,
  enableDepthBuffer: true,
  enableStencilBuffer: false,
  clearColor: new Color4(0, 0, 0, 1),
  clearDepth: 1.0,
  clearStencil: 0,
} as const;

/**
 * BabylonJS Node Render Graph Service
 * 
 * Manages advanced rendering pipelines using Node Render Graph.
 * Follows SRP by focusing solely on render graph management.
 */
export class BabylonRenderGraphService {
  private scene: Scene | null = null;
  private renderGraphs = new Map<string, NodeRenderGraph>();
  private renderGraphStates = new Map<string, RenderGraphState>();

  constructor() {
    logger.init('[INIT][BabylonRenderGraphService] Service initialized');
  }

  /**
   * Initialize the render graph service with a scene
   */
  init(scene: Scene): Result<void, RenderGraphError> {
    logger.debug('[DEBUG][BabylonRenderGraphService] Initializing render graph service...');

    return tryCatch(() => {
      if (!scene) {
        throw this.createError('SCENE_NOT_PROVIDED', 'Scene is required for render graph management');
      }

      this.scene = scene;
      logger.debug('[DEBUG][BabylonRenderGraphService] Render graph service initialized successfully');
    }, (error) => {
      // If error is already a RenderGraphError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as RenderGraphError;
      }
      return this.createError('CREATION_FAILED', `Failed to initialize render graph service: ${error}`);
    });
  }

  /**
   * Create a new render graph
   */
  createRenderGraph(config: RenderGraphConfig): RenderGraphCreateResult {
    logger.debug(`[DEBUG][BabylonRenderGraphService] Creating render graph: ${config.name}`);

    return tryCatch(() => {
      if (!this.scene) {
        throw this.createError('SCENE_NOT_PROVIDED', 'Scene must be initialized before creating render graphs');
      }

      const renderGraph = new NodeRenderGraph(config.name);

      // Configure render graph properties
      renderGraph.setScene(this.scene);

      // Store render graph and initial state
      this.renderGraphs.set(config.name, renderGraph);
      this.renderGraphStates.set(config.name, {
        isEnabled: config.enabled,
        isBuilt: false,
        blockCount: 0,
        connectionCount: 0,
        renderTargets: [],
        lastBuildTime: new Date(),
        lastRenderTime: new Date(),
        error: null,
      });

      logger.debug(`[DEBUG][BabylonRenderGraphService] Render graph created: ${config.name}`);
      return renderGraph;
    }, (error) => {
      // If error is already a RenderGraphError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as RenderGraphError;
      }
      return this.createError('CREATION_FAILED', `Failed to create render graph: ${error}`);
    });
  }

  /**
   * Add a block to a render graph
   */
  addBlock(
    renderGraphName: string, 
    blockConfig: RenderGraphBlockConfig
  ): Result<NodeRenderGraphBlock, RenderGraphError> {
    logger.debug(`[DEBUG][BabylonRenderGraphService] Adding block ${blockConfig.name} to ${renderGraphName}`);

    return tryCatch(() => {
      const renderGraph = this.renderGraphs.get(renderGraphName);
      if (!renderGraph) {
        throw this.createError('RENDER_GRAPH_NOT_FOUND', `Render graph not found: ${renderGraphName}`);
      }

      let block: NodeRenderGraphBlock;

      // Create block based on type
      switch (blockConfig.type) {
        case RenderGraphBlockType.SCENE_RENDER:
          block = this.createSceneRenderBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.POST_PROCESS:
          block = this.createPostProcessBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.TEXTURE_INPUT:
          block = this.createTextureInputBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.TEXTURE_OUTPUT:
          block = this.createTextureOutputBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.CLEAR_BLOCK:
          block = this.createClearBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.COPY_TEXTURE:
          block = this.createCopyTextureBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.BLUR:
          block = this.createBlurBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.BLOOM:
          block = this.createBloomBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.TONE_MAPPING:
          block = this.createToneMappingBlock(renderGraph, blockConfig);
          break;
        case RenderGraphBlockType.FXAA:
          block = this.createFXAABlock(renderGraph, blockConfig);
          break;
        default:
          throw this.createError('INVALID_BLOCK_TYPE', `Unsupported block type: ${blockConfig.type}`);
      }

      // Set block position if provided
      if (blockConfig.position) {
        block.visibleInInspector = true;
        // Note: Position setting would depend on the specific block implementation
      }

      // Configure block inputs
      for (const [inputName, inputValue] of Object.entries(blockConfig.inputs)) {
        const input = block.getInputByName(inputName);
        if (input && inputValue !== undefined) {
          input.value = inputValue;
        }
      }

      // Configure block properties
      for (const [propertyName, propertyValue] of Object.entries(blockConfig.properties)) {
        if (propertyName in block && propertyValue !== undefined) {
          (block as any)[propertyName] = propertyValue;
        }
      }

      // Update state
      const state = this.renderGraphStates.get(renderGraphName);
      if (state) {
        this.renderGraphStates.set(renderGraphName, {
          ...state,
          blockCount: state.blockCount + 1,
          lastBuildTime: new Date(),
        });
      }

      logger.debug(`[DEBUG][BabylonRenderGraphService] Block added: ${blockConfig.name}`);
      return block;
    }, (error) => {
      // If error is already a RenderGraphError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as RenderGraphError;
      }
      return this.createError('BLOCK_CREATION_FAILED', `Failed to add block: ${error}`);
    });
  }

  /**
   * Connect two blocks in a render graph
   */
  connectBlocks(
    renderGraphName: string,
    connection: RenderGraphConnectionConfig
  ): Result<void, RenderGraphError> {
    logger.debug(`[DEBUG][BabylonRenderGraphService] Connecting blocks in ${renderGraphName}`);

    return tryCatch(() => {
      const renderGraph = this.renderGraphs.get(renderGraphName);
      if (!renderGraph) {
        throw this.createError('RENDER_GRAPH_NOT_FOUND', `Render graph not found: ${renderGraphName}`);
      }

      // Find source and target blocks
      const sourceBlock = renderGraph.getBlockByName(connection.sourceBlockName);
      const targetBlock = renderGraph.getBlockByName(connection.targetBlockName);

      if (!sourceBlock) {
        throw this.createError('INVALID_CONNECTION', `Source block not found: ${connection.sourceBlockName}`);
      }

      if (!targetBlock) {
        throw this.createError('INVALID_CONNECTION', `Target block not found: ${connection.targetBlockName}`);
      }

      // Find connection points
      const sourceOutput = sourceBlock.getOutputByName(connection.sourceOutputName);
      const targetInput = targetBlock.getInputByName(connection.targetInputName);

      if (!sourceOutput) {
        throw this.createError('INVALID_CONNECTION', `Source output not found: ${connection.sourceOutputName}`);
      }

      if (!targetInput) {
        throw this.createError('INVALID_CONNECTION', `Target input not found: ${connection.targetInputName}`);
      }

      // Create connection
      sourceOutput.connectTo(targetInput);

      // Update state
      const state = this.renderGraphStates.get(renderGraphName);
      if (state) {
        this.renderGraphStates.set(renderGraphName, {
          ...state,
          connectionCount: state.connectionCount + 1,
          lastBuildTime: new Date(),
        });
      }

      logger.debug(`[DEBUG][BabylonRenderGraphService] Blocks connected successfully`);
    }, (error) => {
      // If error is already a RenderGraphError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as RenderGraphError;
      }
      return this.createError('CONNECTION_FAILED', `Failed to connect blocks: ${error}`);
    });
  }

  /**
   * Build a render graph
   */
  buildRenderGraph(renderGraphName: string): RenderGraphBuildResult {
    logger.debug(`[DEBUG][BabylonRenderGraphService] Building render graph: ${renderGraphName}`);

    return tryCatch(() => {
      const renderGraph = this.renderGraphs.get(renderGraphName);
      if (!renderGraph) {
        throw this.createError('RENDER_GRAPH_NOT_FOUND', `Render graph not found: ${renderGraphName}`);
      }

      // Build the render graph
      renderGraph.build();

      // Update state
      const state = this.renderGraphStates.get(renderGraphName);
      if (state) {
        this.renderGraphStates.set(renderGraphName, {
          ...state,
          isBuilt: true,
          lastBuildTime: new Date(),
          error: null,
        });
      }

      logger.debug(`[DEBUG][BabylonRenderGraphService] Render graph built successfully: ${renderGraphName}`);
    }, (error) => {
      // If error is already a RenderGraphError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        // Update state with error if it's a build-related error
        if (error.code !== 'RENDER_GRAPH_NOT_FOUND') {
          const state = this.renderGraphStates.get(renderGraphName);
          if (state) {
            this.renderGraphStates.set(renderGraphName, {
              ...state,
              isBuilt: false,
              error: error as RenderGraphError,
              lastBuildTime: new Date(),
            });
          }
        }
        return error as RenderGraphError;
      }

      // Update state with generic build error
      const state = this.renderGraphStates.get(renderGraphName);
      const buildError = this.createError('BUILD_FAILED', `Failed to build render graph: ${error}`);
      if (state) {
        this.renderGraphStates.set(renderGraphName, {
          ...state,
          isBuilt: false,
          error: buildError,
          lastBuildTime: new Date(),
        });
      }
      return buildError;
    });
  }

  /**
   * Get render graph by name
   */
  getRenderGraph(name: string): NodeRenderGraph | undefined {
    return this.renderGraphs.get(name);
  }

  /**
   * Get render graph state
   */
  getRenderGraphState(name: string): RenderGraphState | undefined {
    return this.renderGraphStates.get(name);
  }

  /**
   * Get all render graph states
   */
  getAllRenderGraphStates(): readonly RenderGraphState[] {
    return Array.from(this.renderGraphStates.values());
  }

  /**
   * Remove a render graph
   */
  removeRenderGraph(name: string): Result<void, RenderGraphError> {
    logger.debug(`[DEBUG][BabylonRenderGraphService] Removing render graph: ${name}`);

    return tryCatch(() => {
      const renderGraph = this.renderGraphs.get(name);
      if (!renderGraph) {
        throw this.createError('RENDER_GRAPH_NOT_FOUND', `Render graph not found: ${name}`);
      }

      renderGraph.dispose();
      this.renderGraphs.delete(name);
      this.renderGraphStates.delete(name);

      logger.debug(`[DEBUG][BabylonRenderGraphService] Render graph removed: ${name}`);
    }, (error) => {
      // If error is already a RenderGraphError, preserve it
      if (error && typeof error === 'object' && 'code' in error) {
        return error as RenderGraphError;
      }
      return this.createError('CREATION_FAILED', `Failed to remove render graph: ${error}`);
    });
  }

  /**
   * Create scene render block
   */
  private createSceneRenderBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    // Implementation would depend on specific BabylonJS API
    // This is a placeholder for the actual implementation
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create post process block
   */
  private createPostProcessBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    // Implementation would depend on specific BabylonJS API
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create texture input block
   */
  private createTextureInputBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create texture output block
   */
  private createTextureOutputBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create clear block
   */
  private createClearBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create copy texture block
   */
  private createCopyTextureBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create blur block
   */
  private createBlurBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create bloom block
   */
  private createBloomBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create tone mapping block
   */
  private createToneMappingBlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create FXAA block
   */
  private createFXAABlock(
    renderGraph: NodeRenderGraph, 
    config: RenderGraphBlockConfig
  ): NodeRenderGraphBlock {
    const block = new (NodeRenderGraphBlock as any)(config.name, renderGraph);
    return block;
  }

  /**
   * Create render graph error
   */
  private createError(
    code: RenderGraphErrorCode,
    message: string,
    details?: unknown
  ): RenderGraphError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * Dispose the render graph service and clean up all render graphs
   */
  dispose(): void {
    logger.debug('[DEBUG][BabylonRenderGraphService] Disposing render graph service...');
    
    // Dispose all render graphs
    for (const [name, renderGraph] of this.renderGraphs) {
      try {
        renderGraph.dispose();
      } catch (error) {
        logger.warn(`[WARN][BabylonRenderGraphService] Failed to dispose render graph ${name}: ${error}`);
      }
    }
    
    this.renderGraphs.clear();
    this.renderGraphStates.clear();
    this.scene = null;
    
    logger.end('[END][BabylonRenderGraphService] Render graph service disposed');
  }
}
