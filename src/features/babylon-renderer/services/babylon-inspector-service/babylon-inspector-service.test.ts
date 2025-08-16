/**
 * @file BabylonJS Inspector Service Tests
 *
 * Tests for BabylonJS Inspector service functionality.
 * Following TDD principles with real implementations where possible.
 */

import { NullEngine, Scene } from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InspectorConfig } from './babylon-inspector-service';
import {
  BabylonInspectorService,
  DEFAULT_INSPECTOR_CONFIG,
  InspectorTab,
} from './babylon-inspector-service';

// JSDOM compatibility: minimal ResizeObserver stub required by Inspector UI
class TestResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || TestResizeObserver;

describe('BabylonInspectorService', () => {
  let inspectorService: BabylonInspectorService;
  let engine: NullEngine;
  let scene: Scene;

  beforeEach(() => {
    inspectorService = new BabylonInspectorService();
    engine = new NullEngine({
      renderHeight: 600,
      renderWidth: 800,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });
    scene = new Scene(engine);

    vi.clearAllMocks();
  });

  afterEach(() => {
    inspectorService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new BabylonInspectorService();
      const state = service.getState();

      expect(state.isVisible).toBe(false);
      expect(state.isEmbedded).toBe(false);
      expect(state.currentTab).toBe(InspectorTab.SCENE);
      expect(state.scene).toBeNull();
    });

    it('should initialize with custom configuration', () => {
      const customConfig: InspectorConfig = {
        ...DEFAULT_INSPECTOR_CONFIG,
        enablePopup: true,
        initialTab: InspectorTab.DEBUG,
      };

      const service = new BabylonInspectorService(customConfig);
      const state = service.getState();

      expect(state.currentTab).toBe(InspectorTab.SCENE); // Initial state, not config
    });
  });

  describe('show', () => {
    it('should show inspector with valid scene', async () => {
      const result = await inspectorService.show(scene, {
        enableEmbedded: false,
        enablePopup: true,
        showExplorer: false,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVisible).toBe(true);
        expect(result.data.scene).toBe(scene);
        expect(result.data.currentTab).toBe(InspectorTab.SCENE);
      }
    });

    it('should handle null scene gracefully', async () => {
      const result = await inspectorService.show(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
        expect(result.error.message).toContain('Scene is required');
      }
    });

    it('should apply custom configuration', async () => {
      const customConfig = {
        enablePopup: true,
        showExplorer: false,
      };

      const result = await inspectorService.show(scene, customConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isVisible).toBe(true);
      }
    });
  });

  describe('hide', () => {
    it('should hide visible inspector', async () => {
      // First show the inspector
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });

      const hideResult = inspectorService.hide();

      expect(hideResult.success).toBe(true);
      expect(inspectorService.isInspectorVisible()).toBe(false);
    });

    it('should handle hiding when already hidden', () => {
      const hideResult = inspectorService.hide();

      expect(hideResult.success).toBe(true);
      expect(inspectorService.isInspectorVisible()).toBe(false);
    });
  });

  describe('switchTab', () => {
    it('should switch tab when inspector is visible', async () => {
      // First show the inspector
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });

      const result = await inspectorService.switchTab(InspectorTab.DEBUG);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentTab).toBe(InspectorTab.DEBUG);
      }
    });

    it('should fail to switch tab when inspector is not visible', async () => {
      const result = await inspectorService.switchTab(InspectorTab.DEBUG);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TAB_SWITCH_FAILED');
        expect(result.error.message).toContain('Inspector must be visible');
      }
    });
  });

  describe('toggle', () => {
    it('should show inspector when hidden', async () => {
      const result = await inspectorService.toggle(scene);

      expect(result.success).toBe(true);
      expect(inspectorService.isInspectorVisible()).toBe(true);
    });

    it('should hide inspector when visible', async () => {
      // First show the inspector
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });

      const result = await inspectorService.toggle();

      expect(result.success).toBe(true);
      expect(inspectorService.isInspectorVisible()).toBe(false);
    });

    it('should fail to show when no scene provided and none cached', async () => {
      const result = await inspectorService.toggle();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SCENE_NOT_PROVIDED');
      }
    });
  });

  describe('getState', () => {
    it('should return correct initial state', () => {
      const state = inspectorService.getState();

      expect(state.isVisible).toBe(false);
      expect(state.isEmbedded).toBe(false);
      expect(state.currentTab).toBe(InspectorTab.SCENE);
      expect(state.scene).toBeNull();
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return correct state after showing inspector', async () => {
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });
      const state = inspectorService.getState();

      expect(state.isVisible).toBe(true);
      expect(state.scene).toBe(scene);
    });
  });

  describe('isInspectorVisible', () => {
    it('should return false initially', () => {
      expect(inspectorService.isInspectorVisible()).toBe(false);
    });

    it('should return true after showing inspector', async () => {
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });
      expect(inspectorService.isInspectorVisible()).toBe(true);
    });

    it('should return false after hiding inspector', async () => {
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });
      inspectorService.hide();
      expect(inspectorService.isInspectorVisible()).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should dispose service cleanly', async () => {
      await inspectorService.show(scene, { enableEmbedded: false, enablePopup: true });

      inspectorService.dispose();

      expect(inspectorService.isInspectorVisible()).toBe(false);
      expect(inspectorService.getState().scene).toBeNull();
    });

    it('should handle disposal when inspector is not visible', () => {
      // Should not throw
      expect(() => inspectorService.dispose()).not.toThrow();
    });
  });
});
