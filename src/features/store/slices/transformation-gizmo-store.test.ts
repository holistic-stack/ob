/**
 * @file transformation-gizmo-store.test.ts
 * @description Tests for transformation gizmo store integration including selectors,
 * actions, and state management for mesh selection and gizmo mode handling.
 */

import type { AbstractMesh } from '@babylonjs/core';
import { CreateBox, type Engine, NullEngine, Scene } from '@babylonjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../app-store';
import { selectSelectedMesh, selectTransformationGizmoMode } from '../selectors/store.selectors';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Transformation Gizmo Store Integration', () => {
  let store: ReturnType<typeof createAppStore>;
  let engine: Engine;
  let scene: Scene;
  let testMesh: AbstractMesh;

  beforeEach(() => {
    // Create store instance
    store = createAppStore();

    // Create BabylonJS test environment
    engine = new NullEngine({
      renderHeight: 512,
      renderWidth: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    scene = new Scene(engine);
    testMesh = CreateBox('testBox', { size: 2 }, scene);
  });

  afterEach(() => {
    if (scene) {
      scene.dispose();
    }
    if (engine) {
      engine.dispose();
    }
  });

  describe('Initial State', () => {
    it('should have correct initial transformation gizmo state', () => {
      const state = store.getState();

      expect(state.babylonRendering.selectedMesh).toBeNull();
      expect(state.babylonRendering.transformationGizmoMode).toBe('position');
    });

    it('should have working selectors for initial state', () => {
      const state = store.getState();

      expect(selectSelectedMesh(state)).toBeNull();
      expect(selectTransformationGizmoMode(state)).toBe('position');
    });
  });

  describe('Mesh Selection Actions', () => {
    it('should set selected mesh', () => {
      store.getState().setSelectedMesh(testMesh);

      const state = store.getState();
      expect(state.babylonRendering.selectedMesh).toBe(testMesh);
      expect(selectSelectedMesh(state)).toBe(testMesh);
    });

    it('should clear selected mesh', () => {
      // First set a mesh
      store.getState().setSelectedMesh(testMesh);
      expect(selectSelectedMesh(store.getState())).toBe(testMesh);

      // Then clear it
      store.getState().setSelectedMesh(null);
      expect(selectSelectedMesh(store.getState())).toBeNull();
    });

    it('should handle multiple mesh selections', () => {
      const secondMesh = CreateBox('secondBox', { size: 1 }, scene);

      // Select first mesh
      store.getState().setSelectedMesh(testMesh);
      expect(selectSelectedMesh(store.getState())).toBe(testMesh);

      // Select second mesh
      store.getState().setSelectedMesh(secondMesh);
      expect(selectSelectedMesh(store.getState())).toBe(secondMesh);

      // Clear selection
      store.getState().setSelectedMesh(null);
      expect(selectSelectedMesh(store.getState())).toBeNull();
    });
  });

  describe('Gizmo Mode Actions', () => {
    it('should set transformation gizmo mode to position', () => {
      store.getState().setTransformationGizmoMode('position');

      const state = store.getState();
      expect(state.babylonRendering.transformationGizmoMode).toBe('position');
      expect(selectTransformationGizmoMode(state)).toBe('position');
    });

    it('should set transformation gizmo mode to rotation', () => {
      store.getState().setTransformationGizmoMode('rotation');

      const state = store.getState();
      expect(state.babylonRendering.transformationGizmoMode).toBe('rotation');
      expect(selectTransformationGizmoMode(state)).toBe('rotation');
    });

    it('should set transformation gizmo mode to scale', () => {
      store.getState().setTransformationGizmoMode('scale');

      const state = store.getState();
      expect(state.babylonRendering.transformationGizmoMode).toBe('scale');
      expect(selectTransformationGizmoMode(state)).toBe('scale');
    });

    it('should handle rapid mode changes', () => {
      const modes = ['position', 'rotation', 'scale', 'position', 'rotation'] as const;

      for (const mode of modes) {
        store.getState().setTransformationGizmoMode(mode);
        expect(selectTransformationGizmoMode(store.getState())).toBe(mode);
      }
    });
  });

  describe('Combined Actions', () => {
    it('should handle mesh selection and mode changes together', () => {
      // Set mesh and mode
      store.getState().setSelectedMesh(testMesh);
      store.getState().setTransformationGizmoMode('rotation');

      const state = store.getState();
      expect(selectSelectedMesh(state)).toBe(testMesh);
      expect(selectTransformationGizmoMode(state)).toBe('rotation');

      // Change mode while keeping mesh
      store.getState().setTransformationGizmoMode('scale');
      const state2 = store.getState();
      expect(selectSelectedMesh(state2)).toBe(testMesh);
      expect(selectTransformationGizmoMode(state2)).toBe('scale');

      // Clear mesh while keeping mode
      store.getState().setSelectedMesh(null);
      const state3 = store.getState();
      expect(selectSelectedMesh(state3)).toBeNull();
      expect(selectTransformationGizmoMode(state3)).toBe('scale');
    });

    it('should maintain state consistency across multiple operations', () => {
      const secondMesh = CreateBox('secondBox', { size: 1 }, scene);

      // Perform multiple operations
      store.getState().setSelectedMesh(testMesh);
      store.getState().setTransformationGizmoMode('position');
      store.getState().setSelectedMesh(secondMesh);
      store.getState().setTransformationGizmoMode('rotation');
      store.getState().setSelectedMesh(null);
      store.getState().setTransformationGizmoMode('scale');

      const finalState = store.getState();
      expect(selectSelectedMesh(finalState)).toBeNull();
      expect(selectTransformationGizmoMode(finalState)).toBe('scale');
    });
  });

  describe('Selector Performance', () => {
    it('should return same reference for unchanged state', () => {
      const state1 = store.getState();
      const mesh1 = selectSelectedMesh(state1);
      const mode1 = selectTransformationGizmoMode(state1);

      const state2 = store.getState();
      const mesh2 = selectSelectedMesh(state2);
      const mode2 = selectTransformationGizmoMode(state2);

      expect(mesh1).toBe(mesh2);
      expect(mode1).toBe(mode2);
    });

    it('should handle undefined babylonRendering state gracefully', () => {
      // Create a minimal state without babylonRendering
      const minimalState = {} as any;

      expect(selectSelectedMesh(minimalState)).toBeNull();
      expect(selectTransformationGizmoMode(minimalState)).toBe('position');
    });
  });

  describe('State Immutability', () => {
    it('should not mutate original state when setting mesh', () => {
      const originalState = store.getState();
      const originalBabylonRendering = originalState.babylonRendering;

      store.getState().setSelectedMesh(testMesh);

      // Original state should remain unchanged
      expect(originalBabylonRendering.selectedMesh).toBeNull();
      expect(originalBabylonRendering.transformationGizmoMode).toBe('position');

      // New state should have changes
      const newState = store.getState();
      expect(newState.babylonRendering.selectedMesh).toBe(testMesh);
    });

    it('should not mutate original state when setting mode', () => {
      const originalState = store.getState();
      const originalBabylonRendering = originalState.babylonRendering;

      store.getState().setTransformationGizmoMode('rotation');

      // Original state should remain unchanged
      expect(originalBabylonRendering.transformationGizmoMode).toBe('position');

      // New state should have changes
      const newState = store.getState();
      expect(newState.babylonRendering.transformationGizmoMode).toBe('rotation');
    });
  });

  describe('Integration with Existing Store', () => {
    it('should not interfere with existing babylon rendering state', () => {
      const initialState = store.getState();

      // Set transformation gizmo state
      store.getState().setSelectedMesh(testMesh);
      store.getState().setTransformationGizmoMode('rotation');

      const newState = store.getState();

      // Existing babylon rendering state should be preserved
      expect(newState.babylonRendering.isRendering).toBe(initialState.babylonRendering.isRendering);
      expect(newState.babylonRendering.meshes).toBe(initialState.babylonRendering.meshes);
      expect(newState.babylonRendering.renderErrors).toBe(
        initialState.babylonRendering.renderErrors
      );
      expect(newState.babylonRendering.gizmo).toBe(initialState.babylonRendering.gizmo);

      // Only transformation gizmo state should change
      expect(newState.babylonRendering.selectedMesh).toBe(testMesh);
      expect(newState.babylonRendering.transformationGizmoMode).toBe('rotation');
    });

    it('should work with other store slices', () => {
      // Test that transformation gizmo actions don't affect other slices
      const initialEditorState = store.getState().editor;
      const initialParsingState = store.getState().parsing;

      store.getState().setSelectedMesh(testMesh);
      store.getState().setTransformationGizmoMode('scale');

      const newState = store.getState();

      // Other slices should remain unchanged
      expect(newState.editor).toBe(initialEditorState);
      expect(newState.parsing).toBe(initialParsingState);

      // Only babylon rendering transformation state should change
      expect(newState.babylonRendering.selectedMesh).toBe(testMesh);
      expect(newState.babylonRendering.transformationGizmoMode).toBe('scale');
    });
  });
});
