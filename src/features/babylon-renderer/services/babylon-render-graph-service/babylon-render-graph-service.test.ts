/**
 * @file BabylonJS Render Graph Service Tests
 *
 * Tests for BabylonJS render graph service functionality.
 * Following TDD principles with real implementations where possible.
 */

import { NodeRenderGraph } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  RenderGraphBlockConfig,
  RenderGraphConfig,
  RenderGraphConnectionConfig,
} from './babylon-render-graph-service';
import {
  BabylonRenderGraphService,
  DEFAULT_RENDER_GRAPH_CONFIG,
  RenderGraphBlockType,
} from './babylon-render-graph-service';

// Mock BabylonJS components for testing
const createMockScene = () =>
  ({
    dispose: vi.fn(),
    render: vi.fn(),
  }) as any;

const createMockRenderGraph = (name: string) =>
  ({
    name,
    setScene: vi.fn(),
    build: vi.fn(),
    dispose: vi.fn(),
    getBlockByName: vi.fn(),
    addBlock: vi.fn(),
  }) as any;

const createMockRenderGraphBlock = (name: string) =>
  ({
    name,
    getInputByName: vi.fn(),
    getOutputByName: vi.fn(),
    visibleInInspector: false,
    dispose: vi.fn(),
  }) as any;

const createMockConnectionPoint = () =>
  ({
    connectTo: vi.fn(),
    value: null,
  }) as any;

// Mock BabylonJS core
vi.mock('@babylonjs/core', async () => {
  const actual = await vi.importActual('@babylonjs/core');

  const Vector2Mock = vi.fn().mockImplementation((x = 0, y = 0) => ({ x, y }));
  const Vector3Mock = vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z }));
  const Vector4Mock = vi.fn().mockImplementation((x = 0, y = 0, z = 0, w = 0) => ({ x, y, z, w }));
  const Color3Mock = vi.fn().mockImplementation((r = 1, g = 1, b = 1) => ({ r, g, b }));
  const Color4Mock = vi.fn().mockImplementation((r = 1, g = 1, b = 1, a = 1) => ({ r, g, b, a }));

  return {
    ...actual,
    NodeRenderGraph: vi.fn().mockImplementation((name: string) => createMockRenderGraph(name)),
    NodeRenderGraphBlock: vi
      .fn()
      .mockImplementation((name: string) => createMockRenderGraphBlock(name)),
    NodeRenderGraphConnectionPoint: vi.fn().mockImplementation(() => createMockConnectionPoint()),
    Vector2: Vector2Mock,
    Vector3: Vector3Mock,
    Vector4: Vector4Mock,
    Color3: Color3Mock,
    Color4: Color4Mock,
  };
});

describe('BabylonRenderGraphService', () => {
  let renderGraphService: BabylonRenderGraphService;
  let mockScene: any;

  beforeEach(() => {
    // Create fresh instances for each test
    renderGraphService = new BabylonRenderGraphService();
    mockScene = createMockScene();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    renderGraphService.dispose();
  });

  describe('constructor', () => {
    it('should initialize service', () => {
      const service = new BabylonRenderGraphService();

      // Service should be created without errors
      expect(service).toBeDefined();
    });
  });

  describe('init', () => {
    it('should initialize with valid scene', () => {
      const result = renderGraphService.init(mockScene);

      expect(result.success).toBe(true);
    });

    it('should handle null scene gracefully', () => {
      const result = renderGraphService.init(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene is required');
      }
    });
  });

  describe('createRenderGraph', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
    });

    it('should create render graph successfully', () => {
      const config: RenderGraphConfig = {
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-render-graph',
      };

      const result = renderGraphService.createRenderGraph(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('test-render-graph');
      }

      // Verify NodeRenderGraph was created
      expect(NodeRenderGraph).toHaveBeenCalledWith('test-render-graph', mockScene);

      // Verify render graph is stored
      const renderGraph = renderGraphService.getRenderGraph('test-render-graph');
      expect(renderGraph).toBeDefined();

      // Verify state was created
      const state = renderGraphService.getRenderGraphState('test-render-graph');
      expect(state).toBeDefined();
      expect(state?.isEnabled).toBe(true);
      expect(state?.isBuilt).toBe(false);
    });

    it('should handle creation without scene initialization', () => {
      const uninitializedService = new BabylonRenderGraphService();
      const config: RenderGraphConfig = {
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      };

      const result = uninitializedService.createRenderGraph(config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene must be initialized');
      }
    });
  });

  describe('addBlock', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      });
    });

    it('should add scene render block successfully', () => {
      const blockConfig: RenderGraphBlockConfig = {
        name: 'scene-render-block',
        type: RenderGraphBlockType.SCENE_RENDER,
        position: { x: 100, y: 100 } as any,
        inputs: {},
        outputs: {},
        properties: {},
      };

      const result = renderGraphService.addBlock('test-graph', blockConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.name).toBe('scene-render-block');
      }

      // Verify state was updated
      const state = renderGraphService.getRenderGraphState('test-graph');
      expect(state?.blockCount).toBe(1);
    });

    it('should add post process block successfully', () => {
      const blockConfig: RenderGraphBlockConfig = {
        name: 'post-process-block',
        type: RenderGraphBlockType.POST_PROCESS,
        position: { x: 200, y: 100 } as any,
        inputs: { intensity: 1.0 },
        outputs: {},
        properties: { enabled: true },
      };

      const result = renderGraphService.addBlock('test-graph', blockConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('post-process-block');
      }
    });

    it('should handle invalid block type', () => {
      const blockConfig: RenderGraphBlockConfig = {
        name: 'invalid-block',
        type: 'invalid-type' as any,
        position: { x: 0, y: 0 } as any,
        inputs: {},
        outputs: {},
        properties: {},
      };

      const result = renderGraphService.addBlock('test-graph', blockConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_BLOCK_TYPE');
        expect(result.error.message).toContain('Unsupported block type');
      }
    });

    it('should handle non-existent render graph', () => {
      const blockConfig: RenderGraphBlockConfig = {
        name: 'test-block',
        type: RenderGraphBlockType.SCENE_RENDER,
        position: { x: 0, y: 0 } as any,
        inputs: {},
        outputs: {},
        properties: {},
      };

      const result = renderGraphService.addBlock('non-existent', blockConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RENDER_GRAPH_NOT_FOUND');
        expect(result.error.message).toContain('Render graph not found');
      }
    });
  });

  describe('connectBlocks', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      });

      // Add two blocks to connect
      renderGraphService.addBlock('test-graph', {
        name: 'source-block',
        type: RenderGraphBlockType.TEXTURE_INPUT,
        position: { x: 0, y: 0 } as any,
        inputs: {},
        outputs: {},
        properties: {},
      });

      renderGraphService.addBlock('test-graph', {
        name: 'target-block',
        type: RenderGraphBlockType.TEXTURE_OUTPUT,
        position: { x: 200, y: 0 } as any,
        inputs: {},
        outputs: {},
        properties: {},
      });
    });

    it('should connect blocks successfully', () => {
      // Setup mock blocks with connection points
      const mockRenderGraph = renderGraphService.getRenderGraph('test-graph');
      const mockSourceBlock = createMockRenderGraphBlock('source-block');
      const mockTargetBlock = createMockRenderGraphBlock('target-block');
      const mockSourceOutput = createMockConnectionPoint();
      const mockTargetInput = createMockConnectionPoint();

      mockSourceBlock.getOutputByName.mockReturnValue(mockSourceOutput);
      mockTargetBlock.getInputByName.mockReturnValue(mockTargetInput);
      (mockRenderGraph?.getBlockByName as any)?.mockImplementation((name: string) => {
        if (name === 'source-block') return mockSourceBlock;
        if (name === 'target-block') return mockTargetBlock;
        return null;
      });

      const connection: RenderGraphConnectionConfig = {
        sourceBlockName: 'source-block',
        sourceOutputName: 'output',
        targetBlockName: 'target-block',
        targetInputName: 'input',
      };

      const result = renderGraphService.connectBlocks('test-graph', connection);

      expect(result.success).toBe(true);
      expect(mockSourceOutput.connectTo).toHaveBeenCalledWith(mockTargetInput);

      // Verify state was updated
      const state = renderGraphService.getRenderGraphState('test-graph');
      expect(state?.connectionCount).toBe(1);
    });

    it('should handle non-existent render graph', () => {
      const connection: RenderGraphConnectionConfig = {
        sourceBlockName: 'source-block',
        sourceOutputName: 'output',
        targetBlockName: 'target-block',
        targetInputName: 'input',
      };

      const result = renderGraphService.connectBlocks('non-existent', connection);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RENDER_GRAPH_NOT_FOUND');
      }
    });
  });

  describe('buildRenderGraph', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      });
    });

    it('should build render graph successfully', () => {
      const result = renderGraphService.buildRenderGraph('test-graph');

      expect(result.success).toBe(true);

      // Verify build was called
      const mockRenderGraph = renderGraphService.getRenderGraph('test-graph');
      expect(mockRenderGraph?.build).toHaveBeenCalled();

      // Verify state was updated
      const state = renderGraphService.getRenderGraphState('test-graph');
      expect(state?.isBuilt).toBe(true);
      expect(state?.error).toBeNull();
    });

    it('should handle build failure', () => {
      const mockRenderGraph = renderGraphService.getRenderGraph('test-graph');
      (mockRenderGraph?.build as any)?.mockImplementation(() => {
        throw new Error('Build failed');
      });

      const result = renderGraphService.buildRenderGraph('test-graph');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BUILD_FAILED');
      }

      // Verify state was updated with error
      const state = renderGraphService.getRenderGraphState('test-graph');
      expect(state?.isBuilt).toBe(false);
      expect(state?.error).toBeDefined();
    });

    it('should handle non-existent render graph', () => {
      const result = renderGraphService.buildRenderGraph('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RENDER_GRAPH_NOT_FOUND');
      }
    });
  });

  describe('getRenderGraph', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      });
    });

    it('should return existing render graph', () => {
      const renderGraph = renderGraphService.getRenderGraph('test-graph');
      expect(renderGraph).toBeDefined();
      expect(renderGraph?.name).toBe('test-graph');
    });

    it('should return undefined for non-existent render graph', () => {
      const renderGraph = renderGraphService.getRenderGraph('non-existent');
      expect(renderGraph).toBeUndefined();
    });
  });

  describe('getAllRenderGraphStates', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
    });

    it('should return empty array when no render graphs exist', () => {
      const states = renderGraphService.getAllRenderGraphStates();
      expect(states).toEqual([]);
    });

    it('should return all render graph states', () => {
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'graph-1',
      });
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'graph-2',
      });

      const states = renderGraphService.getAllRenderGraphStates();
      expect(states).toHaveLength(2);
      expect(states.map((s) => s.isEnabled)).toEqual([true, true]);
    });
  });

  describe('removeRenderGraph', () => {
    beforeEach(() => {
      renderGraphService.init(mockScene);
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      });
    });

    it('should remove render graph successfully', () => {
      const result = renderGraphService.removeRenderGraph('test-graph');

      expect(result.success).toBe(true);

      // Verify render graph was removed
      const renderGraph = renderGraphService.getRenderGraph('test-graph');
      expect(renderGraph).toBeUndefined();

      // Verify state was removed
      const state = renderGraphService.getRenderGraphState('test-graph');
      expect(state).toBeUndefined();
    });

    it('should handle removing non-existent render graph', () => {
      const result = renderGraphService.removeRenderGraph('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('RENDER_GRAPH_NOT_FOUND');
      }
    });
  });

  describe('dispose', () => {
    it('should dispose service cleanly', () => {
      renderGraphService.init(mockScene);
      renderGraphService.createRenderGraph({
        ...DEFAULT_RENDER_GRAPH_CONFIG,
        name: 'test-graph',
      });

      renderGraphService.dispose();

      // Verify all render graphs were disposed
      const states = renderGraphService.getAllRenderGraphStates();
      expect(states).toEqual([]);
    });

    it('should handle disposal when not initialized', () => {
      // Should not throw
      expect(() => renderGraphService.dispose()).not.toThrow();
    });
  });
});
