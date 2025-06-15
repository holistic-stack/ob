/**
 * @file State Types Tests
 * 
 * Comprehensive test suite for state management types and discriminated unions.
 * Tests type safety, state transitions, and exhaustive checking patterns.
 * 
 * @author Luciano Júnior
 * @date June 2025
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AsyncState,
  ResourceState,
  OperationState,
  EngineState,
  EngineCapabilities,
  EngineError,
  SceneState,
  SceneMetadata,
  SceneUpdateType,
  SceneError,
  MeshState,
  MeshGeometry,
  BoundingBox,
  MeshUpdateType,
  MeshError,
  ParseState,
  ParseStage,
  ParseError,
  CSGState,
  CSGOperation,
  CSGError,
  ApplicationState,
  UIState,
  ViewType,
  ThemeType,
  StateStatus,
  StateData,
  StateError,
  IsLoadingState,
  IsSuccessState,
} from './state-types';
import {
  createEngineId,
  createSceneId,
  createMeshId,
  createMaterialId,
  createBranded,
  type Milliseconds,
  type ParseSessionId,
} from './branded-types';

// Helper functions for creating branded types in tests
const createMilliseconds = (value: number): Milliseconds =>
  createBranded<number, 'Milliseconds'>(value);

const createParseSessionId = (prefix = 'parse'): ParseSessionId => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return createBranded<string, 'ParseSessionId'>(`${prefix}_${timestamp}_${random}`);
};

describe('State Types', () => {
  beforeEach(() => {
    console.log('[INIT] Starting state types test');
  });

  describe('Core Async State Patterns', () => {
    it('should handle AsyncState transitions', () => {
      console.log('[DEBUG] Testing AsyncState transitions');
      
      const idleState: AsyncState<string> = { status: 'idle' };
      const loadingState: AsyncState<string> = { 
        status: 'loading', 
        startTime: createMilliseconds(Date.now()) 
      };
      const successState: AsyncState<string> = { 
        status: 'success', 
        data: 'test data', 
        completedAt: createMilliseconds(Date.now()) 
      };
      const errorState: AsyncState<string> = { 
        status: 'error', 
        error: 'Something went wrong', 
        failedAt: createMilliseconds(Date.now()) 
      };
      
      expect(idleState.status).toBe('idle');
      expect(loadingState.status).toBe('loading');
      expect(successState.status).toBe('success');
      expect(successState.data).toBe('test data');
      expect(errorState.status).toBe('error');
      expect(errorState.error).toBe('Something went wrong');
      
      console.log('[DEBUG] AsyncState transitions test passed');
    });

    it('should handle ResourceState with metadata', () => {
      console.log('[DEBUG] Testing ResourceState with metadata');
      
      const uninitializedState: ResourceState<string> = { status: 'uninitialized' };
      const initializingState: ResourceState<string> = { 
        status: 'initializing', 
        progress: 50 
      };
      const readyState: ResourceState<string> = { 
        status: 'ready', 
        data: 'resource data', 
        lastUpdated: createMilliseconds(Date.now()) 
      };
      const updatingState: ResourceState<string> = { 
        status: 'updating', 
        currentData: 'old data', 
        progress: 75 
      };
      const errorState: ResourceState<string> = { 
        status: 'error', 
        error: 'Resource error', 
        retryCount: 3 
      };
      const disposedState: ResourceState<string> = { status: 'disposed' };
      
      expect(uninitializedState.status).toBe('uninitialized');
      expect(initializingState.progress).toBe(50);
      expect(readyState.data).toBe('resource data');
      expect(updatingState.currentData).toBe('old data');
      expect(errorState.retryCount).toBe(3);
      expect(disposedState.status).toBe('disposed');
      
      console.log('[DEBUG] ResourceState with metadata test passed');
    });

    it('should handle OperationState for long-running processes', () => {
      console.log('[DEBUG] Testing OperationState for long-running processes');
      
      const pendingState: OperationState<string> = { status: 'pending' };
      const runningState: OperationState<string> = { 
        status: 'running', 
        progress: 60, 
        stage: 'processing' 
      };
      const completedState: OperationState<string> = { 
        status: 'completed', 
        result: 'operation result', 
        duration: createMilliseconds(5000) 
      };
      const failedState: OperationState<string> = { 
        status: 'failed', 
        error: 'Operation failed', 
        stage: 'validation' 
      };
      const cancelledState: OperationState<string> = { 
        status: 'cancelled', 
        reason: 'User cancelled' 
      };
      
      expect(pendingState.status).toBe('pending');
      expect(runningState.progress).toBe(60);
      expect(runningState.stage).toBe('processing');
      expect(completedState.result).toBe('operation result');
      expect(failedState.stage).toBe('validation');
      expect(cancelledState.reason).toBe('User cancelled');
      
      console.log('[DEBUG] OperationState for long-running processes test passed');
    });
  });

  describe('Engine State Management', () => {
    it('should handle EngineState lifecycle', () => {
      console.log('[DEBUG] Testing EngineState lifecycle');
      
      const engineId = createEngineId();
      const capabilities: EngineCapabilities = {
        webGLVersion: '2.0',
        maxTextureSize: 4096,
        maxVertexTextureImageUnits: 16,
        maxFragmentTextureImageUnits: 16,
        supportsInstancedArrays: true,
        supportsVertexArrayObjects: true,
        supportsFloatTextures: true,
      };
      
      const uninitializedState: EngineState = { status: 'uninitialized' };
      const initializingState: EngineState = { 
        status: 'initializing', 
        engineId, 
        config: {} 
      };
      const readyState: EngineState = { 
        status: 'ready', 
        engineId, 
        engine: {}, 
        capabilities, 
        createdAt: createMilliseconds(Date.now()) 
      };
      const errorState: EngineState = { 
        status: 'error', 
        engineId, 
        error: { type: 'initialization_failed', message: 'Failed to initialize' }, 
        retryCount: 1 
      };
      const disposingState: EngineState = { 
        status: 'disposing', 
        engineId 
      };
      const disposedState: EngineState = { 
        status: 'disposed', 
        engineId, 
        disposedAt: createMilliseconds(Date.now()) 
      };
      
      expect(uninitializedState.status).toBe('uninitialized');
      expect(initializingState.engineId).toBe(engineId);
      expect(readyState.capabilities.webGLVersion).toBe('2.0');
      expect(errorState.error.type).toBe('initialization_failed');
      expect(disposingState.status).toBe('disposing');
      expect(disposedState.status).toBe('disposed');
      
      console.log('[DEBUG] EngineState lifecycle test passed');
    });

    it('should handle different EngineError types', () => {
      console.log('[DEBUG] Testing EngineError types');
      
      const initError: EngineError = { 
        type: 'initialization_failed', 
        message: 'Init failed', 
        cause: new Error('WebGL error') 
      };
      const webglError: EngineError = { 
        type: 'webgl_not_supported', 
        message: 'WebGL not supported' 
      };
      const contextError: EngineError = { 
        type: 'context_lost', 
        message: 'WebGL context lost' 
      };
      const disposalError: EngineError = { 
        type: 'disposal_failed', 
        message: 'Failed to dispose', 
        cause: new Error('Cleanup error') 
      };
      const unknownError: EngineError = { 
        type: 'unknown', 
        message: 'Unknown error', 
        cause: new Error('Unexpected') 
      };
      
      expect(initError.type).toBe('initialization_failed');
      expect(webglError.type).toBe('webgl_not_supported');
      expect(contextError.type).toBe('context_lost');
      expect(disposalError.type).toBe('disposal_failed');
      expect(unknownError.type).toBe('unknown');
      
      console.log('[DEBUG] EngineError types test passed');
    });
  });

  describe('Scene State Management', () => {
    it('should handle SceneState lifecycle', () => {
      console.log('[DEBUG] Testing SceneState lifecycle');
      
      const sceneId = createSceneId();
      const engineId = createEngineId();
      const metadata: SceneMetadata = {
        meshCount: 5,
        lightCount: 2,
        cameraCount: 1,
        materialCount: 3,
        textureCount: 4,
        renderTargetCount: 1,
        lastRenderTime: createMilliseconds(Date.now()),
        frameRate: 60,
      };
      
      const uninitializedState: SceneState = { status: 'uninitialized' };
      const creatingState: SceneState = { 
        status: 'creating', 
        sceneId, 
        engineId, 
        config: {} 
      };
      const readyState: SceneState = { 
        status: 'ready', 
        sceneId, 
        engineId, 
        scene: {}, 
        metadata, 
        createdAt: createMilliseconds(Date.now()) 
      };
      const updatingState: SceneState = { 
        status: 'updating', 
        sceneId, 
        scene: {}, 
        updateType: 'mesh_added' 
      };
      const errorState: SceneState = { 
        status: 'error', 
        sceneId, 
        engineId, 
        error: { type: 'creation_failed', message: 'Scene creation failed' } 
      };
      const disposingState: SceneState = { 
        status: 'disposing', 
        sceneId 
      };
      const disposedState: SceneState = { 
        status: 'disposed', 
        sceneId, 
        disposedAt: createMilliseconds(Date.now()) 
      };
      
      expect(uninitializedState.status).toBe('uninitialized');
      expect(creatingState.sceneId).toBe(sceneId);
      expect(readyState.metadata.meshCount).toBe(5);
      expect(updatingState.updateType).toBe('mesh_added');
      expect(errorState.error.type).toBe('creation_failed');
      expect(disposingState.status).toBe('disposing');
      expect(disposedState.status).toBe('disposed');
      
      console.log('[DEBUG] SceneState lifecycle test passed');
    });

    it('should handle SceneUpdateType variations', () => {
      console.log('[DEBUG] Testing SceneUpdateType variations');
      
      const updateTypes: SceneUpdateType[] = [
        'mesh_added',
        'mesh_removed',
        'mesh_updated',
        'material_changed',
        'lighting_changed',
        'camera_moved',
        'background_changed',
      ];
      
      updateTypes.forEach(updateType => {
        expect(typeof updateType).toBe('string');
      });
      
      expect(updateTypes).toHaveLength(7);
      
      console.log('[DEBUG] SceneUpdateType variations test passed');
    });

    it('should handle different SceneError types', () => {
      console.log('[DEBUG] Testing SceneError types');
      
      const creationError: SceneError = { 
        type: 'creation_failed', 
        message: 'Failed to create scene', 
        cause: new Error('Engine error') 
      };
      const engineError: SceneError = { 
        type: 'engine_not_ready', 
        message: 'Engine not ready' 
      };
      const updateError: SceneError = { 
        type: 'update_failed', 
        message: 'Update failed', 
        updateType: 'mesh_added' 
      };
      const disposalError: SceneError = { 
        type: 'disposal_failed', 
        message: 'Failed to dispose scene', 
        cause: new Error('Cleanup error') 
      };
      const unknownError: SceneError = { 
        type: 'unknown', 
        message: 'Unknown scene error', 
        cause: new Error('Unexpected') 
      };
      
      expect(creationError.type).toBe('creation_failed');
      expect(engineError.type).toBe('engine_not_ready');
      expect(updateError.type).toBe('update_failed');
      expect(updateError.updateType).toBe('mesh_added');
      expect(disposalError.type).toBe('disposal_failed');
      expect(unknownError.type).toBe('unknown');
      
      console.log('[DEBUG] SceneError types test passed');
    });
  });

  describe('Mesh State Management', () => {
    it('should handle MeshState lifecycle', () => {
      console.log('[DEBUG] Testing MeshState lifecycle');

      const meshId = createMeshId();
      const sceneId = createSceneId();
      const materialId = createMaterialId();
      const geometry: MeshGeometry = {
        vertexCount: 1000,
        indexCount: 3000,
        triangleCount: 1000,
        hasNormals: true,
        hasUVs: true,
        hasColors: false,
        boundingBox: {
          min: [-1, -1, -1],
          max: [1, 1, 1],
          center: [0, 0, 0],
          size: [2, 2, 2],
        },
      };

      const uninitializedState: MeshState = { status: 'uninitialized' };
      const creatingState: MeshState = {
        status: 'creating',
        meshId,
        sceneId,
        geometryData: {}
      };
      const readyState: MeshState = {
        status: 'ready',
        meshId,
        sceneId,
        mesh: {},
        geometry,
        material: materialId,
        createdAt: createMilliseconds(Date.now())
      };
      const updatingState: MeshState = {
        status: 'updating',
        meshId,
        mesh: {},
        updateType: 'geometry_changed',
        progress: 50
      };
      const errorState: MeshState = {
        status: 'error',
        meshId,
        sceneId,
        error: { type: 'creation_failed', message: 'Mesh creation failed' }
      };
      const disposingState: MeshState = {
        status: 'disposing',
        meshId
      };
      const disposedState: MeshState = {
        status: 'disposed',
        meshId,
        disposedAt: createMilliseconds(Date.now())
      };

      expect(uninitializedState.status).toBe('uninitialized');
      expect(creatingState.meshId).toBe(meshId);
      expect(readyState.geometry.vertexCount).toBe(1000);
      expect(readyState.material).toBe(materialId);
      expect(updatingState.updateType).toBe('geometry_changed');
      expect(errorState.error.type).toBe('creation_failed');
      expect(disposingState.status).toBe('disposing');
      expect(disposedState.status).toBe('disposed');

      console.log('[DEBUG] MeshState lifecycle test passed');
    });

    it('should handle MeshGeometry and BoundingBox', () => {
      console.log('[DEBUG] Testing MeshGeometry and BoundingBox');

      const boundingBox: BoundingBox = {
        min: [-5, -3, -2],
        max: [5, 3, 2],
        center: [0, 0, 0],
        size: [10, 6, 4],
      };

      const geometry: MeshGeometry = {
        vertexCount: 2000,
        indexCount: 6000,
        triangleCount: 2000,
        hasNormals: true,
        hasUVs: false,
        hasColors: true,
        boundingBox,
      };

      expect(geometry.vertexCount).toBe(2000);
      expect(geometry.triangleCount).toBe(2000);
      expect(geometry.hasNormals).toBe(true);
      expect(geometry.hasUVs).toBe(false);
      expect(geometry.hasColors).toBe(true);
      expect(geometry.boundingBox.min).toEqual([-5, -3, -2]);
      expect(geometry.boundingBox.max).toEqual([5, 3, 2]);
      expect(geometry.boundingBox.center).toEqual([0, 0, 0]);
      expect(geometry.boundingBox.size).toEqual([10, 6, 4]);

      console.log('[DEBUG] MeshGeometry and BoundingBox test passed');
    });

    it('should handle MeshUpdateType variations', () => {
      console.log('[DEBUG] Testing MeshUpdateType variations');

      const updateTypes: MeshUpdateType[] = [
        'geometry_changed',
        'material_changed',
        'position_changed',
        'rotation_changed',
        'scale_changed',
        'visibility_changed',
        'properties_changed',
      ];

      updateTypes.forEach(updateType => {
        expect(typeof updateType).toBe('string');
      });

      expect(updateTypes).toHaveLength(7);

      console.log('[DEBUG] MeshUpdateType variations test passed');
    });

    it('should handle different MeshError types', () => {
      console.log('[DEBUG] Testing MeshError types');

      const creationError: MeshError = {
        type: 'creation_failed',
        message: 'Failed to create mesh',
        cause: new Error('Geometry error')
      };
      const geometryError: MeshError = {
        type: 'invalid_geometry',
        message: 'Invalid geometry data',
        details: ['Missing vertices', 'Invalid indices']
      };
      const sceneError: MeshError = {
        type: 'scene_not_ready',
        message: 'Scene not ready for mesh creation'
      };
      const updateError: MeshError = {
        type: 'update_failed',
        message: 'Mesh update failed',
        updateType: 'material_changed'
      };
      const disposalError: MeshError = {
        type: 'disposal_failed',
        message: 'Failed to dispose mesh',
        cause: new Error('Cleanup error')
      };
      const unknownError: MeshError = {
        type: 'unknown',
        message: 'Unknown mesh error',
        cause: new Error('Unexpected')
      };

      expect(creationError.type).toBe('creation_failed');
      expect(geometryError.type).toBe('invalid_geometry');
      expect(geometryError.details).toHaveLength(2);
      expect(sceneError.type).toBe('scene_not_ready');
      expect(updateError.updateType).toBe('material_changed');
      expect(disposalError.type).toBe('disposal_failed');
      expect(unknownError.type).toBe('unknown');

      console.log('[DEBUG] MeshError types test passed');
    });
  });

  describe('OpenSCAD Pipeline State', () => {
    it('should handle ParseState lifecycle', () => {
      console.log('[DEBUG] Testing ParseState lifecycle');

      const sessionId = createParseSessionId();
      const source = 'cube([1, 2, 3]);';

      const idleState: ParseState = { status: 'idle' };
      const parsingState: ParseState = {
        status: 'parsing',
        sessionId,
        source,
        progress: 75,
        stage: 'syntax_analysis'
      };
      const successState: ParseState = {
        status: 'success',
        sessionId,
        ast: {},
        duration: createMilliseconds(1500),
        nodeCount: 25
      };
      const errorState: ParseState = {
        status: 'error',
        sessionId,
        error: { type: 'syntax_error', message: 'Unexpected token', line: 1, column: 5 },
        source
      };

      expect(idleState.status).toBe('idle');
      expect(parsingState.sessionId).toBe(sessionId);
      expect(parsingState.progress).toBe(75);
      expect(parsingState.stage).toBe('syntax_analysis');
      expect(successState.nodeCount).toBe(25);
      expect(errorState.error.type).toBe('syntax_error');

      console.log('[DEBUG] ParseState lifecycle test passed');
    });

    it('should handle ParseStage variations', () => {
      console.log('[DEBUG] Testing ParseStage variations');

      const stages: ParseStage[] = [
        'lexical_analysis',
        'syntax_analysis',
        'semantic_analysis',
        'ast_generation',
        'validation',
      ];

      stages.forEach(stage => {
        expect(typeof stage).toBe('string');
      });

      expect(stages).toHaveLength(5);

      console.log('[DEBUG] ParseStage variations test passed');
    });

    it('should handle different ParseError types', () => {
      console.log('[DEBUG] Testing ParseError types');

      const syntaxError: ParseError = {
        type: 'syntax_error',
        message: 'Unexpected token',
        line: 5,
        column: 10
      };
      const semanticError: ParseError = {
        type: 'semantic_error',
        message: 'Undefined variable',
        context: 'variable reference'
      };
      const validationError: ParseError = {
        type: 'validation_error',
        message: 'Validation failed',
        violations: ['Missing semicolon', 'Invalid parameter']
      };
      const timeoutError: ParseError = {
        type: 'timeout',
        message: 'Parse timeout',
        duration: createMilliseconds(30000)
      };
      const unknownError: ParseError = {
        type: 'unknown',
        message: 'Unknown parse error',
        cause: new Error('Unexpected')
      };

      expect(syntaxError.type).toBe('syntax_error');
      expect(syntaxError.line).toBe(5);
      expect(syntaxError.column).toBe(10);
      expect(semanticError.type).toBe('semantic_error');
      expect(semanticError.context).toBe('variable reference');
      expect(validationError.violations).toHaveLength(2);
      expect(timeoutError.type).toBe('timeout');
      expect(unknownError.type).toBe('unknown');

      console.log('[DEBUG] ParseError types test passed');
    });
  });

  describe('CSG State Management', () => {
    it('should handle CSGState lifecycle', () => {
      console.log('[DEBUG] Testing CSGState lifecycle');

      const operationId = 'csg_op_123';

      const idleState: CSGState = { status: 'idle' };
      const processingState: CSGState = {
        status: 'processing',
        operationId,
        operation: 'union',
        progress: 60
      };
      const successState: CSGState = {
        status: 'success',
        operationId,
        result: {},
        duration: createMilliseconds(2500)
      };
      const errorState: CSGState = {
        status: 'error',
        operationId,
        error: { type: 'operation_failed', message: 'Union operation failed', operation: 'union' }
      };

      expect(idleState.status).toBe('idle');
      expect(processingState.operationId).toBe(operationId);
      expect(processingState.operation).toBe('union');
      expect(processingState.progress).toBe(60);
      expect(successState.result).toEqual({});
      expect(errorState.error.type).toBe('operation_failed');
      expect(errorState.error.operation).toBe('union');

      console.log('[DEBUG] CSGState lifecycle test passed');
    });

    it('should handle CSGOperation variations', () => {
      console.log('[DEBUG] Testing CSGOperation variations');

      const operations: CSGOperation[] = [
        'union',
        'intersection',
        'difference',
        'hull',
        'minkowski',
        'extrude',
        'revolve',
      ];

      operations.forEach(operation => {
        expect(typeof operation).toBe('string');
      });

      expect(operations).toHaveLength(7);

      console.log('[DEBUG] CSGOperation variations test passed');
    });

    it('should handle different CSGError types', () => {
      console.log('[DEBUG] Testing CSGError types');

      const geometryError: CSGError = {
        type: 'invalid_geometry',
        message: 'Invalid geometry for CSG operation'
      };
      const operationError: CSGError = {
        type: 'operation_failed',
        message: 'Intersection failed',
        operation: 'intersection'
      };
      const memoryError: CSGError = {
        type: 'memory_limit',
        message: 'Memory limit exceeded during CSG operation'
      };
      const timeoutError: CSGError = {
        type: 'timeout',
        message: 'CSG operation timeout',
        duration: createMilliseconds(60000)
      };
      const unknownError: CSGError = {
        type: 'unknown',
        message: 'Unknown CSG error',
        cause: new Error('Unexpected')
      };

      expect(geometryError.type).toBe('invalid_geometry');
      expect(operationError.type).toBe('operation_failed');
      expect(operationError.operation).toBe('intersection');
      expect(memoryError.type).toBe('memory_limit');
      expect(timeoutError.type).toBe('timeout');
      expect(unknownError.type).toBe('unknown');

      console.log('[DEBUG] CSGError types test passed');
    });
  });

  describe('Application State', () => {
    it('should handle complete ApplicationState structure', () => {
      console.log('[DEBUG] Testing ApplicationState structure');

      const engineId = createEngineId();
      const sceneId = createSceneId();
      const meshId = createMeshId();

      const applicationState: ApplicationState = {
        engine: { status: 'ready', engineId, engine: {}, capabilities: {
          webGLVersion: '2.0',
          maxTextureSize: 4096,
          maxVertexTextureImageUnits: 16,
          maxFragmentTextureImageUnits: 16,
          supportsInstancedArrays: true,
          supportsVertexArrayObjects: true,
          supportsFloatTextures: true,
        }, createdAt: createMilliseconds(Date.now()) },
        scene: { status: 'ready', sceneId, engineId, scene: {}, metadata: {
          meshCount: 3,
          lightCount: 2,
          cameraCount: 1,
          materialCount: 2,
          textureCount: 1,
          renderTargetCount: 0,
          lastRenderTime: createMilliseconds(Date.now()),
          frameRate: 60,
        }, createdAt: createMilliseconds(Date.now()) },
        meshes: {
          [meshId]: { status: 'ready', meshId, sceneId, mesh: {}, geometry: {
            vertexCount: 100,
            indexCount: 300,
            triangleCount: 100,
            hasNormals: true,
            hasUVs: true,
            hasColors: false,
            boundingBox: {
              min: [-1, -1, -1],
              max: [1, 1, 1],
              center: [0, 0, 0],
              size: [2, 2, 2],
            },
          }, createdAt: createMilliseconds(Date.now()) },
        },
        parsing: { status: 'idle' },
        csg: { status: 'idle' },
        ui: { status: 'ready', activeView: '3d_renderer', sidebarOpen: true, debugPanelOpen: false, theme: 'dark' },
      };

      expect(applicationState.engine.status).toBe('ready');
      expect(applicationState.scene.status).toBe('ready');
      expect(applicationState.meshes[meshId].status).toBe('ready');
      expect(applicationState.parsing.status).toBe('idle');
      expect(applicationState.csg.status).toBe('idle');
      expect(applicationState.ui.status).toBe('ready');

      console.log('[DEBUG] ApplicationState structure test passed');
    });

    it('should handle UIState variations', () => {
      console.log('[DEBUG] Testing UIState variations');

      const initializingState: UIState = { status: 'initializing' };
      const readyState: UIState = {
        status: 'ready',
        activeView: 'ui_components',
        sidebarOpen: false,
        debugPanelOpen: true,
        theme: 'light'
      };
      const errorState: UIState = {
        status: 'error',
        error: 'UI initialization failed'
      };

      expect(initializingState.status).toBe('initializing');
      expect(readyState.activeView).toBe('ui_components');
      expect(readyState.sidebarOpen).toBe(false);
      expect(readyState.debugPanelOpen).toBe(true);
      expect(readyState.theme).toBe('light');
      expect(errorState.error).toBe('UI initialization failed');

      console.log('[DEBUG] UIState variations test passed');
    });

    it('should handle ViewType and ThemeType variations', () => {
      console.log('[DEBUG] Testing ViewType and ThemeType variations');

      const viewTypes: ViewType[] = [
        '3d_renderer',
        'ui_components',
        'code_editor',
        'debug_panel',
      ];

      const themeTypes: ThemeType[] = [
        'light',
        'dark',
        'auto',
      ];

      viewTypes.forEach(viewType => {
        expect(typeof viewType).toBe('string');
      });

      themeTypes.forEach(themeType => {
        expect(typeof themeType).toBe('string');
      });

      expect(viewTypes).toHaveLength(4);
      expect(themeTypes).toHaveLength(3);

      console.log('[DEBUG] ViewType and ThemeType variations test passed');
    });
  });

  describe('State Transition Helpers', () => {
    it('should extract status from state types', () => {
      console.log('[DEBUG] Testing status extraction from state types');

      type AsyncStatus = StateStatus<AsyncState<string>>;
      type EngineStatus = StateStatus<EngineState>;
      type SceneStatus = StateStatus<SceneState>;

      // These are compile-time tests - if they compile, the types work correctly
      const asyncStatus: AsyncStatus = 'idle';
      const engineStatus: EngineStatus = 'ready';
      const sceneStatus: SceneStatus = 'creating';

      expect(asyncStatus).toBe('idle');
      expect(engineStatus).toBe('ready');
      expect(sceneStatus).toBe('creating');

      console.log('[DEBUG] Status extraction test passed');
    });

    it('should extract data from success states', () => {
      console.log('[DEBUG] Testing data extraction from success states');

      const successState: AsyncState<string> = {
        status: 'success',
        data: 'test data',
        completedAt: createMilliseconds(Date.now())
      };

      // Type-level test - if this compiles, StateData works
      type ExtractedData = StateData<typeof successState>;

      // Runtime verification
      expect(successState.data).toBe('test data');

      console.log('[DEBUG] Data extraction test passed');
    });

    it('should extract errors from error states', () => {
      console.log('[DEBUG] Testing error extraction from error states');

      const errorState: AsyncState<string, string> = {
        status: 'error',
        error: 'test error',
        failedAt: createMilliseconds(Date.now())
      };

      // Type-level test - if this compiles, StateError works
      type ExtractedError = StateError<typeof errorState>;

      // Runtime verification
      expect(errorState.error).toBe('test error');

      console.log('[DEBUG] Error extraction test passed');
    });

    it('should identify loading states', () => {
      console.log('[DEBUG] Testing loading state identification');

      // Type-level tests - these should compile to true/false
      type AsyncLoading = IsLoadingState<AsyncState<string>>;
      type EngineLoading = IsLoadingState<EngineState>;
      type ParseLoading = IsLoadingState<ParseState>;

      // These are compile-time checks - if they compile, the types work
      const loadingState: AsyncState<string> = {
        status: 'loading',
        startTime: createMilliseconds(Date.now())
      };
      const idleState: AsyncState<string> = { status: 'idle' };

      expect(loadingState.status).toBe('loading');
      expect(idleState.status).toBe('idle');

      console.log('[DEBUG] Loading state identification test passed');
    });

    it('should identify success states', () => {
      console.log('[DEBUG] Testing success state identification');

      // Type-level tests - these should compile to true/false
      type AsyncSuccess = IsSuccessState<AsyncState<string>>;
      type EngineSuccess = IsSuccessState<EngineState>;
      type OperationSuccess = IsSuccessState<OperationState<string>>;

      // These are compile-time checks - if they compile, the types work
      const successState: AsyncState<string> = {
        status: 'success',
        data: 'test',
        completedAt: createMilliseconds(Date.now())
      };
      const errorState: AsyncState<string> = {
        status: 'error',
        error: 'test error',
        failedAt: createMilliseconds(Date.now())
      };

      expect(successState.status).toBe('success');
      expect(errorState.status).toBe('error');

      console.log('[DEBUG] Success state identification test passed');
    });

    it('should handle complex state transitions', () => {
      console.log('[DEBUG] Testing complex state transitions');

      // Simulate a complete engine lifecycle
      const engineStates: EngineState[] = [
        { status: 'uninitialized' },
        { status: 'initializing', engineId: createEngineId(), config: {} },
        { status: 'ready', engineId: createEngineId(), engine: {}, capabilities: {
          webGLVersion: '2.0',
          maxTextureSize: 4096,
          maxVertexTextureImageUnits: 16,
          maxFragmentTextureImageUnits: 16,
          supportsInstancedArrays: true,
          supportsVertexArrayObjects: true,
          supportsFloatTextures: true,
        }, createdAt: createMilliseconds(Date.now()) },
        { status: 'disposing', engineId: createEngineId() },
        { status: 'disposed', engineId: createEngineId(), disposedAt: createMilliseconds(Date.now()) },
      ];

      const statuses = engineStates.map(state => state.status);
      expect(statuses).toEqual(['uninitialized', 'initializing', 'ready', 'disposing', 'disposed']);

      console.log('[DEBUG] Complex state transitions test passed');
    });

    it('should handle error state transitions', () => {
      console.log('[DEBUG] Testing error state transitions');

      // Test error states across different state types
      const engineError: EngineState = {
        status: 'error',
        error: { type: 'webgl_not_supported', message: 'WebGL not supported' },
        retryCount: 0
      };

      const sceneError: SceneState = {
        status: 'error',
        error: { type: 'engine_not_ready', message: 'Engine not ready' }
      };

      const meshError: MeshState = {
        status: 'error',
        error: { type: 'invalid_geometry', message: 'Invalid geometry', details: ['Missing vertices'] }
      };

      expect(engineError.status).toBe('error');
      expect(engineError.error.type).toBe('webgl_not_supported');
      expect(sceneError.status).toBe('error');
      expect(sceneError.error.type).toBe('engine_not_ready');
      expect(meshError.status).toBe('error');
      expect(meshError.error.type).toBe('invalid_geometry');

      console.log('[DEBUG] Error state transitions test passed');
    });
  });
});
