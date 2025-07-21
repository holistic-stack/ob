/**
 * Store Selectors Test Suite
 *
 * Tests for store selectors following TDD methodology
 * with comprehensive coverage of all selector functions.
 */

import type { Mesh } from '@babylonjs/core';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ASTNode } from '../../openscad-parser/core/ast-types.js';
import type { AppState, BabylonRenderingState } from '../types/store.types';
import {
  selectAllErrors,
  selectApplicationStatus,
  selectCanParse,
  selectCanRender,
  selectDebugInfo,
  selectEditorCode,
  selectEditorIsDirty,
  selectEditorStats,
  selectFeatureFlags,
  selectHasAnyErrors,
  selectHasUnsavedChanges,
  selectIsCodeEmpty,
  selectIsProcessing,
  selectLastActivity,
  selectParsingErrors,
  selectParsingHasErrors,
  selectParsingStats,
  selectRenderingHasErrors,
  selectRenderingMeshCount,
  selectRenderingStats,
  selectTotalErrors,
} from './store.selectors';

describe('Store Selectors', () => {
  let mockState: AppState;

  beforeEach(() => {
    mockState = {
      editor: {
        code: 'cube(10);',
        cursorPosition: { line: 1, column: 8 },
        selection: null,
        isDirty: true,
        lastSaved: new Date('2024-01-01T10:00:00Z'),
      },
      parsing: {
        ast: [{ type: 'cube' } as ASTNode],
        errors: [],
        warnings: ['Warning: deprecated syntax'],
        isLoading: false,
        lastParsed: new Date('2024-01-01T10:01:00Z'),
        lastParsedCode: null,
        parseTime: 15.5,
      },
      babylonRendering: {
        meshes: [{} as Mesh, {} as Mesh],
        isRendering: false,
        renderErrors: [],
        lastRendered: new Date('2024-01-01T10:02:00Z'),
        renderTime: 25.3,
        scene: null, // Add missing scene property
        camera: {
          position: [10, 10, 10],
          target: [0, 0, 0],
          zoom: 1,
          fov: 75,
          near: 0.1,
          far: 1000,
          enableControls: true,
          enableAutoRotate: false,
          autoRotateSpeed: 1,
        },
        engine: {} as any,
        inspector: {} as any,
        csg: {} as any,

        materials: [],

        performanceMetrics: {} as any,
      },
      config: {
        debounceMs: 300,
        enableAutoSave: false,
        enableRealTimeParsing: true,
        enableRealTimeRendering: true,
        theme: 'dark',
        performance: {
          enableMetrics: true,
          maxRenderTime: 16,
          enableWebGL2: true,
          enableHardwareAcceleration: true,
        },
      },
    };
  });

  describe('Basic Selectors', () => {
    it('should select editor code', () => {
      expect(selectEditorCode(mockState)).toBe('cube(10);');
    });

    it('should select editor dirty state', () => {
      expect(selectEditorIsDirty(mockState)).toBe(true);
    });

    it('should select parsing errors', () => {
      expect(selectParsingErrors(mockState)).toEqual([]);
    });

    it('should select parsing has errors', () => {
      expect(selectParsingHasErrors(mockState)).toBe(false);
    });

    it('should select rendering mesh count', () => {
      expect(selectRenderingMeshCount(mockState)).toBe(2);
    });

    it('should select rendering has errors', () => {
      expect(selectRenderingHasErrors(mockState)).toBe(false);
    });
  });

  describe('Computed Selectors', () => {
    it('should determine if code is empty', () => {
      expect(selectIsCodeEmpty(mockState)).toBe(false);

      const emptyState = { ...mockState, editor: { ...mockState.editor, code: '' } };
      expect(selectIsCodeEmpty(emptyState)).toBe(true);

      const whitespaceState = { ...mockState, editor: { ...mockState.editor, code: '   \n  ' } };
      expect(selectIsCodeEmpty(whitespaceState)).toBe(true);
    });

    it('should determine if can parse', () => {
      expect(selectCanParse(mockState)).toBe(true);

      const loadingState = { ...mockState, parsing: { ...mockState.parsing, isLoading: true } };
      expect(selectCanParse(loadingState)).toBe(false);

      const emptyCodeState = { ...mockState, editor: { ...mockState.editor, code: '' } };
      expect(selectCanParse(emptyCodeState)).toBe(false);

      const disabledState = {
        ...mockState,
        config: { ...mockState.config, enableRealTimeParsing: false },
      };
      expect(selectCanParse(disabledState)).toBe(false);
    });

    it('should determine if can render', () => {
      expect(selectCanRender(mockState)).toBe(true);

      const renderingState: AppState = {
        ...mockState,
        babylonRendering: {
          ...mockState.babylonRendering,
          isRendering: true,
        } as BabylonRenderingState,
      };
      expect(selectCanRender(renderingState)).toBe(false);

      const noASTState = { ...mockState, parsing: { ...mockState.parsing, ast: [] } };
      expect(selectCanRender(noASTState)).toBe(false);

      const errorsState = { ...mockState, parsing: { ...mockState.parsing, errors: ['error'] } };
      expect(selectCanRender(errorsState)).toBe(false);

      const disabledState = {
        ...mockState,
        config: { ...mockState.config, enableRealTimeRendering: false },
      };
      expect(selectCanRender(disabledState)).toBe(false);
    });

    it('should determine if has unsaved changes', () => {
      expect(selectHasUnsavedChanges(mockState)).toBe(true);

      const savedState = { ...mockState, editor: { ...mockState.editor, isDirty: false } };
      expect(selectHasUnsavedChanges(savedState)).toBe(false);
    });

    it('should determine if processing', () => {
      expect(selectIsProcessing(mockState)).toBe(false);

      const parsingState = { ...mockState, parsing: { ...mockState.parsing, isLoading: true } };
      expect(selectIsProcessing(parsingState)).toBe(true);

      const renderingState: AppState = {
        ...mockState,
        babylonRendering: {
          ...mockState.babylonRendering,
          isRendering: true,
        } as BabylonRenderingState,
      };
      expect(selectIsProcessing(renderingState)).toBe(true);
    });

    it('should determine if has any errors', () => {
      expect(selectHasAnyErrors(mockState)).toBe(false);

      const parseErrorState = {
        ...mockState,
        parsing: { ...mockState.parsing, errors: ['parse error'] },
      };
      expect(selectHasAnyErrors(parseErrorState)).toBe(true);

      const renderErrorState: AppState = {
        ...mockState,
        babylonRendering: {
          ...mockState.babylonRendering,
          renderErrors: [
            { code: 'webgl', message: 'render error', timestamp: new Date(), service: 'rendering' },
          ],
        } as BabylonRenderingState,
      };
      expect(selectHasAnyErrors(renderErrorState)).toBe(true);
    });

    it('should count total errors', () => {
      expect(selectTotalErrors(mockState)).toBe(0);

      const errorState: AppState = {
        ...mockState,
        parsing: { ...mockState.parsing, errors: ['error1', 'error2'] },
        babylonRendering: {
          ...mockState.babylonRendering,
          renderErrors: [
            { code: 'csg', message: 'error3', timestamp: new Date(), service: 'rendering' },
          ],
        } as BabylonRenderingState,
      };
      expect(selectTotalErrors(errorState)).toBe(3);
    });

    it('should get all errors', () => {
      expect(selectAllErrors(mockState)).toEqual([]);

      const errorState: AppState = {
        ...mockState,
        parsing: { ...mockState.parsing, errors: ['parse error'] },
        babylonRendering: {
          ...mockState.babylonRendering,
          renderErrors: [
            { code: 'csg', message: 'render error', timestamp: new Date(), service: 'rendering' },
          ],
        } as BabylonRenderingState,
      };
      expect(selectAllErrors(errorState)).toEqual(['parse error', 'render error']);
    });
  });

  describe('selectLastActivity', () => {
    it('should return the most recent activity from state', () => {
      // Test with normal state - should return the most recent date
      const result = selectLastActivity(mockState);
      expect(result).toEqual(new Date('2024-01-01T10:02:00Z')); // rendering.lastRendered is most recent

      // Test with state where editor is most recent
      const editorRecentState = {
        ...mockState,
        editor: { ...mockState.editor, lastSaved: new Date('2024-01-01T10:05:00Z') },
      };
      expect(selectLastActivity(editorRecentState)).toEqual(new Date('2024-01-01T10:05:00Z'));

      // Test with state where parsing is most recent
      const parsingRecentState = {
        ...mockState,
        parsing: { ...mockState.parsing, lastParsed: new Date('2024-01-01T10:04:00Z') },
      };
      expect(selectLastActivity(parsingRecentState)).toEqual(new Date('2024-01-01T10:04:00Z'));

      // Test with state where all activity dates are null
      const noActivityState = {
        ...mockState,
        editor: { ...mockState.editor, lastSaved: null },
        parsing: { ...mockState.parsing, lastParsed: null },
        babylonRendering: mockState.babylonRendering
          ? { ...mockState.babylonRendering, lastRendered: null }
          : {
              meshes: [],
              isRendering: false,
              renderErrors: [],
              camera: {
                position: [0, 0, 10] as [number, number, number],
                target: [0, 0, 0] as [number, number, number],
                zoom: 1,
                fov: 75,
                near: 0.1,
                far: 1000,
                enableControls: true,
                enableAutoRotate: false,
                autoRotateSpeed: 2.0,
              },
              renderTime: 0,
              lastRendered: null,
              engine: {} as any,
              scene: null,
              inspector: {} as any,
              csg: {} as any,
              particles: [],
              iblShadows: {} as any,
              materials: [],
              renderGraphs: [],
              performanceMetrics: {} as any,
            },
      };
      expect(selectLastActivity(noActivityState)).toBeNull();

      // Test with state where rendering has default values
      const noRenderingState = {
        ...mockState,
        babylonRendering: {
          meshes: [],
          isRendering: false,
          renderErrors: [],
          camera: {
            position: [0, 0, 10] as [number, number, number],
            target: [0, 0, 0] as [number, number, number],
            zoom: 1,
            fov: 75,
            near: 0.1,
            far: 1000,
            enableControls: true,
            enableAutoRotate: false,
            autoRotateSpeed: 2.0,
          },
          renderTime: 0,
          lastRendered: null,
          engine: {} as any,
          scene: null,
          inspector: {} as any,
          csg: {} as any,
          particles: [],
          iblShadows: {} as any,
          materials: [],
          renderGraphs: [],
          performanceMetrics: {} as any,
        },
      };
      expect(selectLastActivity(noRenderingState)).toEqual(new Date('2024-01-01T10:01:00Z')); // parsing.lastParsed is most recent
    });
  });

  describe('Application Status Selector', () => {
    it('should return idle status', () => {
      expect(selectApplicationStatus(mockState)).toBe('idle');
    });

    it('should return working status', () => {
      const workingState = { ...mockState, parsing: { ...mockState.parsing, isLoading: true } };
      expect(selectApplicationStatus(workingState)).toBe('working');
    });

    it('should return error status', () => {
      const errorState = { ...mockState, parsing: { ...mockState.parsing, errors: ['error'] } };
      expect(selectApplicationStatus(errorState)).toBe('error');
    });
  });

  describe('Stats Selectors', () => {
    it('should select editor stats', () => {
      const stats = selectEditorStats(mockState);
      expect(stats.codeLength).toBe(9);
      expect(stats.lineCount).toBe(1);
      expect(stats.wordCount).toBe(1);
      expect(stats.isDirty).toBe(true);
      expect(stats.lastSaved).toEqual(mockState.editor.lastSaved);
    });

    it('should select parsing stats', () => {
      const stats = selectParsingStats(mockState);
      expect(stats.nodeCount).toBe(1);
      expect(stats.errorCount).toBe(0);
      expect(stats.warningCount).toBe(1);
      expect(stats.parseTime).toBe(15.5);
      expect(stats.lastParsed).toEqual(mockState.parsing.lastParsed);
      expect(stats.isLoading).toBe(false);
    });

    it('should select rendering stats', () => {
      const stats = selectRenderingStats(mockState);
      expect(stats.meshCount).toBe(2); // mockState has 2 meshes
      expect(stats.errorCount).toBe(0);
      expect(stats.renderTime).toBe(25.3);
      expect(stats.lastRendered).toEqual(mockState.babylonRendering?.lastRendered);
      expect(stats.isRendering).toBe(false);
      expect(stats.camera).toEqual(mockState.babylonRendering?.camera);
    });

    it('should select feature flags', () => {
      const flags = selectFeatureFlags(mockState);
      expect(flags.realTimeParsing).toBe(true);
      expect(flags.realTimeRendering).toBe(true);
      expect(flags.autoSave).toBe(false);
    });

    it('should select debug info', () => {
      const debugInfo = selectDebugInfo(mockState);
      expect(debugInfo).toHaveProperty('editorState');
      expect(debugInfo).toHaveProperty('parsingState');
      expect(debugInfo).toHaveProperty('renderingState');
      expect(debugInfo).toHaveProperty('applicationStatus');
      expect(debugInfo).toHaveProperty('lastActivity');
      expect(debugInfo).toHaveProperty('featureFlags');
      expect(debugInfo.applicationStatus).toBe('idle');
    });
  });
});
