/**
 * App Store Test Suite
 *
 * Comprehensive tests for Zustand store implementation following TDD methodology
 * with functional programming patterns and Result<T,E> error handling.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  CameraConfig,
  EditorPosition,
  EditorSelection,
} from '../../shared/types/common.types';
import { createAppStore } from './app-store';

let store: ReturnType<typeof createAppStore>;

describe('App Store', () => {
  beforeEach(() => {
    // Create a fresh store instance for each test
    store = createAppStore({
      enableDevtools: false,
      enablePersistence: false,
      debounceConfig: {
        parseDelayMs: 0, // Disable debouncing for tests
        renderDelayMs: 0,
        saveDelayMs: 0,
      },
    });
  });

  describe('Initial State', () => {
    it('should have correct initial editor state', () => {
      const state = store.getState();
      expect(state.editor.code).toBe('');
      expect(state.editor.cursorPosition).toEqual({ line: 1, column: 1 });
      expect(state.editor.selection).toBeNull();
      expect(state.editor.isDirty).toBe(false);
      expect(state.editor.lastSaved).toBeNull();
    });

    it('should have correct initial parsing state', () => {
      const state = store.getState();
      expect(state.parsing.ast).toEqual([]);
      expect(state.parsing.errors).toEqual([]);
      expect(state.parsing.warnings).toEqual([]);
      expect(state.parsing.isLoading).toBe(false);
      expect(state.parsing.lastParsed).toBeNull();
      expect(state.parsing.parseTime).toBe(0);
    });

    it('should have correct initial rendering state', () => {
      const state = store.getState();
      expect(state.rendering?.meshes).toEqual([]);
      expect(state.rendering?.isRendering).toBe(false);
      expect(state.rendering?.renderErrors).toEqual([]);
      expect(state.rendering?.lastRendered).toBeNull();
      expect(state.rendering?.renderTime).toBe(0);
      expect(state.rendering?.camera?.position).toEqual([10, 10, 10]);
      expect(state.rendering?.camera?.target).toEqual([0, 0, 0]);
      expect(state.rendering?.camera?.zoom).toBe(1);
    });

    it('should have correct initial performance state', () => {
      const state = store.getState();
      expect(state.performance.metrics.renderTime).toBe(0);
      expect(state.performance.metrics.parseTime).toBe(0);
      expect(state.performance.metrics.memoryUsage).toBe(0);
      expect(state.performance.metrics.frameRate).toBe(60);
      expect(state.performance.isMonitoring).toBe(false);
      expect(state.performance.violations).toEqual([]);
      expect(state.performance.lastUpdated).toBeNull();
    });

    it('should have correct initial config state', () => {
      const state = store.getState();
      expect(state.config.debounceMs).toBe(300);
      expect(state.config.enableAutoSave).toBe(false);
      expect(state.config.enableRealTimeParsing).toBe(true);
      expect(state.config.enableRealTimeRendering).toBe(true);
      expect(state.config.theme).toBe('dark');
      expect(state.config.performance.enableMetrics).toBe(true);
      expect(state.config.performance.maxRenderTime).toBe(16);
    });
  });

  describe('Editor Actions', () => {
    it('should update code and mark as dirty', () => {
      const testCode = 'cube(10);';
      store.getState().updateCode(testCode);

      const state = store.getState();
      expect(state.editor.code).toBe(testCode);
      expect(state.editor.isDirty).toBe(true);
    });

    it('should update cursor position', () => {
      const position: EditorPosition = { line: 5, column: 10 };
      store.getState().updateCursorPosition(position);

      const state = store.getState();
      expect(state.editor.cursorPosition).toEqual(position);
    });

    it('should update selection', () => {
      const selection: EditorSelection = {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 11,
      };
      store.getState().updateSelection(selection);

      const state = store.getState();
      expect(state.editor.selection).toEqual(selection);
    });

    it('should mark editor as dirty', () => {
      store.getState().markDirty();

      const state = store.getState();
      expect(state.editor.isDirty).toBe(true);
    });

    it('should mark editor as saved', () => {
      // First mark as dirty
      store.getState().markDirty();
      expect(store.getState().editor.isDirty).toBe(true);

      // Then mark as saved
      store.getState().markSaved();

      const state = store.getState();
      expect(state.editor.isDirty).toBe(false);
      expect(state.editor.lastSaved).toBeInstanceOf(Date);
    });

    it('should save code and return AsyncResult', async () => {
      const result = await store.getState().saveCode();

      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.editor.isDirty).toBe(false);
      expect(state.editor.lastSaved).toBeInstanceOf(Date);
    });

    it('should load code from source', async () => {
      const source = 'sphere(5);';
      const result = await store.getState().loadCode(source);

      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.editor.code).toBe(source);
      expect(state.editor.isDirty).toBe(false);
      expect(state.editor.lastSaved).toBeInstanceOf(Date);
      expect(state.editor.cursorPosition).toEqual({ line: 1, column: 1 });
      expect(state.editor.selection).toBeNull();
    });

    it('should reset editor to initial state', () => {
      // First modify the editor state
      store.getState().updateCode('test code');
      store.getState().updateCursorPosition({ line: 5, column: 10 });
      store.getState().markDirty();

      // Then reset
      store.getState().resetEditor();

      const state = store.getState();
      expect(state.editor.code).toBe('');
      expect(state.editor.cursorPosition).toEqual({ line: 1, column: 1 });
      expect(state.editor.selection).toBeNull();
      expect(state.editor.isDirty).toBe(false);
      expect(state.editor.lastSaved).toBeNull();
    });
  });

  describe('Parsing Actions', () => {
    it('should parse code successfully', async () => {
      const code = 'cube(10);';
      const result = await store.getState().parseCode(code);

      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.parsing.isLoading).toBe(false);
      expect(state.parsing.lastParsed).toBeInstanceOf(Date);
      expect(state.parsing.parseTime).toBeGreaterThan(0);
      expect(state.parsing.errors).toEqual([]);
    });

    it('should clear parsing state', () => {
      // First set some parsing state
      store.getState().addParsingError('test error');
      expect(store.getState().parsing.errors).toHaveLength(1);

      // Then clear it
      store.getState().clearParsingState();

      const state = store.getState();
      expect(state.parsing.ast).toEqual([]);
      expect(state.parsing.errors).toEqual([]);
      expect(state.parsing.warnings).toEqual([]);
      expect(state.parsing.isLoading).toBe(false);
      expect(state.parsing.lastParsed).toBeNull();
      expect(state.parsing.parseTime).toBe(0);
    });

    it('should add parsing error', () => {
      const error = 'Syntax error at line 1';
      store.getState().addParsingError(error);

      const state = store.getState();
      expect(state.parsing.errors).toContain(error);
    });

    it('should clear parsing errors', () => {
      // First add some errors
      store.getState().addParsingError('error 1');
      store.getState().addParsingError('error 2');
      expect(store.getState().parsing.errors).toHaveLength(2);

      // Then clear them
      store.getState().clearParsingErrors();

      const state = store.getState();
      expect(state.parsing.errors).toEqual([]);
    });

    it('should handle debounced parse', () => {
      const code = 'sphere(5);';
      // Since debouncing is disabled in tests, this should work immediately
      store.getState().debouncedParse(code);

      // The debounced parse function exists and can be called
      expect(typeof store.getState().debouncedParse).toBe('function');
    });
  });

  describe('Rendering Actions', () => {
    it('should update meshes', () => {
      const meshes = [] as unknown as readonly THREE.Mesh[]; // Mock THREE.Mesh array
      store.getState().updateMeshes(meshes);

      const state = store.getState();
      expect(state.rendering?.meshes).toEqual(meshes);
      expect(state.rendering?.lastRendered).toBeInstanceOf(Date);
    });

    it('should render from AST successfully', async () => {
      const ast = [] as unknown as readonly ASTNode[]; // Mock AST nodes
      const result = await store.getState().renderFromAST(ast);

      expect(result.success).toBe(true);

      const state = store.getState();
      expect(state.rendering?.isRendering).toBe(false);
      expect(state.rendering?.lastRendered).toBeInstanceOf(Date);
      expect(state.rendering?.renderTime).toBeGreaterThan(0);
      expect(state.rendering?.renderErrors).toEqual([]);
    });

    it('should clear scene', () => {
      // First set some rendering state
      store.getState().updateMeshes([{} as THREE.Mesh]);
      store.getState().addRenderError({ type: 'initialization', message: 'test error' });
      expect(store.getState().rendering?.meshes).toHaveLength(1);
      expect(store.getState().rendering?.renderErrors).toHaveLength(1);

      // Then clear the scene
      store.getState().clearScene();

      const state = store.getState();
      expect(state.rendering?.meshes).toEqual([]);
      expect(state.rendering?.renderErrors).toEqual([]);
      expect(state.rendering?.lastRendered).toBeNull();
      expect(state.rendering?.renderTime).toBe(0);
    });

    it('should update camera', () => {
      const camera = {
        position: [5, 5, 5] as const,
        target: [1, 1, 1] as const,
        zoom: 1.5,
      };
      store.getState().updateCamera(camera);

      const state = store.getState();
      expect(state.rendering?.camera).toEqual(camera);
    });

    it('should reset camera to default', () => {
      // First modify camera
      const customCamera: CameraConfig = {
        position: [5, 5, 5],
        target: [1, 1, 1],
        zoom: 1.5,
        fov: 75,
        near: 0.1,
        far: 1000,
        enableControls: true,
        enableAutoRotate: false,
        autoRotateSpeed: 1,
      };
      store.getState().updateCamera(customCamera);
      expect(store.getState().rendering?.camera).toEqual(customCamera);

      // Then reset
      store.getState().resetCamera();

      const state = store.getState();
      expect(state.rendering?.camera?.position).toEqual([10, 10, 10]);
      expect(state.rendering?.camera?.target).toEqual([0, 0, 0]);
      expect(state.rendering?.camera?.zoom).toBe(1);
    });

    it('should add render error', () => {
      const error = { type: 'webgl' as const, message: 'Render error occurred' };
      store.getState().addRenderError(error);

      const state = store.getState();
      expect(state.rendering?.renderErrors).toContain(error);
    });

    it('should clear render errors', () => {
      // First add some errors
      store.getState().addRenderError({ type: 'geometry', message: 'error 1' });
      store.getState().addRenderError({ type: 'material', message: 'error 2' });
      expect(store.getState().rendering?.renderErrors).toHaveLength(2);

      // Then clear them
      store.getState().clearRenderErrors();

      const state = store.getState();
      expect(state.rendering?.renderErrors).toEqual([]);
    });
  });

  describe('Performance Actions', () => {
    it('should update metrics', () => {
      const metrics = {
        renderTime: 12,
        parseTime: 5,
        memoryUsage: 25,
        frameRate: 60,
      };
      store.getState().updateMetrics(metrics);

      const state = store.getState();
      expect(state.performance.metrics).toEqual(metrics);
      expect(state.performance.lastUpdated).toBeInstanceOf(Date);
    });

    it('should start monitoring', () => {
      store.getState().startMonitoring();

      const state = store.getState();
      expect(state.performance.isMonitoring).toBe(true);
    });

    it('should stop monitoring', () => {
      // First start monitoring
      store.getState().startMonitoring();
      expect(store.getState().performance.isMonitoring).toBe(true);

      // Then stop
      store.getState().stopMonitoring();

      const state = store.getState();
      expect(state.performance.isMonitoring).toBe(false);
    });

    it('should record parse time', () => {
      const duration = 15.5;
      store.getState().recordParseTime(duration);

      const state = store.getState();
      expect(state.performance.metrics.parseTime).toBe(duration);
      expect(state.performance.lastUpdated).toBeInstanceOf(Date);
    });

    it('should record render time', () => {
      const duration = 8.2;
      store.getState().recordRenderTime(duration);

      const state = store.getState();
      expect(state.performance.metrics.renderTime).toBe(duration);
      expect(state.performance.lastUpdated).toBeInstanceOf(Date);
    });

    it('should add performance violation', () => {
      const violation = 'Render time exceeded threshold';
      store.getState().addPerformanceViolation(violation);

      const state = store.getState();
      expect(state.performance.violations).toContain(violation);
    });

    it('should clear performance violations', () => {
      // First add some violations
      store.getState().addPerformanceViolation('violation 1');
      store.getState().addPerformanceViolation('violation 2');
      expect(store.getState().performance.violations).toHaveLength(2);

      // Then clear them
      store.getState().clearPerformanceViolations();

      const state = store.getState();
      expect(state.performance.violations).toEqual([]);
    });
  });

  describe('Configuration Actions', () => {
    it('should update config', () => {
      const configUpdate = { debounceMs: 500 };
      store.getState().updateConfig(configUpdate);

      const state = store.getState();
      expect(state.config.debounceMs).toBe(500);
      // Other config values should remain unchanged
      expect(state.config.enableAutoSave).toBe(false);
      expect(state.config.theme).toBe('dark');
    });

    it('should reset config to defaults', () => {
      // First modify config
      store.getState().updateConfig({ debounceMs: 500, enableAutoSave: true });
      expect(store.getState().config.debounceMs).toBe(500);
      expect(store.getState().config.enableAutoSave).toBe(true);

      // Then reset
      store.getState().resetConfig();

      const state = store.getState();
      expect(state.config.debounceMs).toBe(300);
      expect(state.config.enableAutoSave).toBe(false);
      expect(state.config.enableRealTimeParsing).toBe(true);
      expect(state.config.enableRealTimeRendering).toBe(true);
      expect(state.config.theme).toBe('dark');
    });

    it('should toggle real time parsing', () => {
      const initialValue = store.getState().config.enableRealTimeParsing;

      store.getState().toggleRealTimeParsing();

      const state = store.getState();
      expect(state.config.enableRealTimeParsing).toBe(!initialValue);
    });

    it('should toggle real time rendering', () => {
      const initialValue = store.getState().config.enableRealTimeRendering;

      store.getState().toggleRealTimeRendering();

      const state = store.getState();
      expect(state.config.enableRealTimeRendering).toBe(!initialValue);
    });

    it('should toggle auto save', () => {
      const initialValue = store.getState().config.enableAutoSave;

      store.getState().toggleAutoSave();

      const state = store.getState();
      expect(state.config.enableAutoSave).toBe(!initialValue);
    });
  });
});
