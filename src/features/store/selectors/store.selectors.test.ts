/**
 * Store Selectors Test Suite
 *
 * Tests for store selectors following TDD methodology
 * with comprehensive coverage of all selector functions.
 */

import type { ASTNode } from '@holistic-stack/openscad-parser';
import type * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AppState, RenderingError, RenderingState } from '../types/store.types';
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
  selectPerformanceStats,
  selectPerformanceStatus,
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
        parseTime: 15.5,
      },
      rendering: {
        meshes: [{} as THREE.Mesh, {} as THREE.Mesh],
        isRendering: false,
        renderErrors: [] as RenderingError[],
        lastRendered: new Date('2024-01-01T10:02:00Z'),
        renderTime: 25.3,
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
      },
      performance: {
        metrics: {
          renderTime: 12.5,
          parseTime: 8.2,
          memoryUsage: 45.7,
          frameRate: 60,
        },
        isMonitoring: true,
        violations: [],
        lastUpdated: new Date('2024-01-01T10:03:00Z'),
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
        rendering: { ...mockState.rendering, isRendering: true } as RenderingState,
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
        rendering: { ...mockState.rendering, isRendering: true } as RenderingState,
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
        rendering: {
          ...mockState.rendering,
          renderErrors: [{ type: 'webgl' as const, message: 'render error' }],
        } as RenderingState,
      };
      expect(selectHasAnyErrors(renderErrorState)).toBe(true);
    });

    it('should count total errors', () => {
      expect(selectTotalErrors(mockState)).toBe(0);

      const errorState: AppState = {
        ...mockState,
        parsing: { ...mockState.parsing, errors: ['error1', 'error2'] },
        rendering: {
          ...mockState.rendering,
          renderErrors: [{ type: 'csg' as const, message: 'error3' }],
        } as RenderingState,
      };
      expect(selectTotalErrors(errorState)).toBe(3);
    });

    it('should get all errors', () => {
      expect(selectAllErrors(mockState)).toEqual([]);

      const errorState: AppState = {
        ...mockState,
        parsing: { ...mockState.parsing, errors: ['parse error'] },
        rendering: {
          ...mockState.rendering,
          renderErrors: [{ type: 'csg' as const, message: 'render error' }],
        } as RenderingState,
      };
      expect(selectAllErrors(errorState)).toEqual(['parse error', 'render error']);
    });

    it('should get last activity', () => {
      const lastActivity = selectLastActivity(mockState);
      expect(lastActivity).toBeInstanceOf(Date);
      expect(lastActivity?.getTime()).toBe(new Date('2024-01-01T10:03:00Z').getTime());

      const noActivityState: AppState = {
        ...mockState,
        editor: { ...mockState.editor, lastSaved: null },
        parsing: { ...mockState.parsing, lastParsed: null },
        rendering: { ...mockState.rendering, lastRendered: null } as RenderingState,
        performance: { ...mockState.performance, lastUpdated: null },
      };
      expect(selectLastActivity(noActivityState)).toBeNull();
    });
  });

  describe('Performance Status Selector', () => {
    it('should return good performance status', () => {
      expect(selectPerformanceStatus(mockState)).toBe('good');
    });

    it('should return warning performance status', () => {
      const warningState = {
        ...mockState,
        performance: {
          ...mockState.performance,
          metrics: { ...mockState.performance.metrics, renderTime: 20 }, // > 16ms threshold
        },
      };
      expect(selectPerformanceStatus(warningState)).toBe('warning');
    });

    it('should return critical performance status', () => {
      const criticalState = {
        ...mockState,
        performance: {
          ...mockState.performance,
          metrics: { ...mockState.performance.metrics, renderTime: 35 }, // > 32ms (2x threshold)
        },
      };
      expect(selectPerformanceStatus(criticalState)).toBe('critical');
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
      expect(stats.meshCount).toBe(2);
      expect(stats.errorCount).toBe(0);
      expect(stats.renderTime).toBe(25.3);
      expect(stats.lastRendered).toEqual(mockState.rendering?.lastRendered);
      expect(stats.isRendering).toBe(false);
      expect(stats.camera).toEqual(mockState.rendering?.camera);
    });

    it('should select performance stats', () => {
      const stats = selectPerformanceStats(mockState);
      expect(stats.renderTime).toBe(12.5);
      expect(stats.parseTime).toBe(8.2);
      expect(stats.memoryUsage).toBe(45.7);
      expect(stats.frameRate).toBe(60);
      expect(stats.violationCount).toBe(0);
      expect(stats.isMonitoring).toBe(true);
      expect(stats.lastUpdated).toEqual(mockState.performance.lastUpdated);
      expect(stats.status).toBe('good');
    });

    it('should select feature flags', () => {
      const flags = selectFeatureFlags(mockState);
      expect(flags.realTimeParsing).toBe(true);
      expect(flags.realTimeRendering).toBe(true);
      expect(flags.autoSave).toBe(false);
      expect(flags.performanceMetrics).toBe(true);
      expect(flags.webGL2).toBe(true);
      expect(flags.hardwareAcceleration).toBe(true);
    });

    it('should select debug info', () => {
      const debugInfo = selectDebugInfo(mockState);
      expect(debugInfo).toHaveProperty('editorState');
      expect(debugInfo).toHaveProperty('parsingState');
      expect(debugInfo).toHaveProperty('renderingState');
      expect(debugInfo).toHaveProperty('performanceState');
      expect(debugInfo).toHaveProperty('applicationStatus');
      expect(debugInfo).toHaveProperty('lastActivity');
      expect(debugInfo).toHaveProperty('featureFlags');
      expect(debugInfo.applicationStatus).toBe('idle');
    });
  });
});
