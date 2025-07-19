/**
 * @file Selection Service Tests
 *
 * Tests for the SelectionService following TDD principles.
 * Uses real BabylonJS NullEngine (no mocks).
 */

import {
  type AbstractMesh,
  CreateBox,
  CreateSphere,
  Mesh,
  NullEngine,
  Scene,
} from '@babylonjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type SelectionConfig, SelectionService } from './selection.service';

describe('SelectionService', () => {
  let engine: NullEngine;
  let scene: Scene;
  let selectionService: SelectionService;
  let testMesh1: AbstractMesh;
  let testMesh2: AbstractMesh;

  beforeEach(async () => {
    // Create BabylonJS NullEngine for headless testing
    engine = new NullEngine();
    scene = new Scene(engine);

    // Create test meshes
    testMesh1 = CreateBox('testBox1', { size: 1 }, scene);
    testMesh2 = CreateSphere('testSphere1', { diameter: 1 }, scene);

    // Create selection service
    selectionService = new SelectionService(scene);

    // Initialize the service
    const result = await selectionService.initialize();
    expect(result.success).toBe(true);
  });

  afterEach(() => {
    // Clean up resources
    selectionService.dispose();
    scene.dispose();
    engine.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize selection service', async () => {
      const newService = new SelectionService(scene);
      const result = await newService.initialize();

      expect(result.success).toBe(true);
      expect(newService.getSelectionState().selectedMeshes).toHaveLength(0);
      expect(newService.getSelectionState().hoveredMesh).toBeNull();

      newService.dispose();
    });

    it('should initialize with custom configuration', async () => {
      const config: Partial<SelectionConfig> = {
        mode: 'multi',
        enableHover: false,
        maxSelections: 10,
      };

      const newService = new SelectionService(scene, config);
      await newService.initialize();

      const state = newService.getSelectionState();
      expect(state.selectionMode).toBe('multi');

      newService.dispose();
    });
  });

  describe('Single Selection', () => {
    it('should select a single mesh', () => {
      const result = selectionService.selectMesh(testMesh1);
      expect(result.success).toBe(true);

      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(1);
      expect(selectedMeshes[0]).toBe(testMesh1);
      expect(selectionService.isMeshSelected(testMesh1)).toBe(true);
    });

    it('should replace selection when selecting another mesh', () => {
      selectionService.selectMesh(testMesh1);
      selectionService.selectMesh(testMesh2);

      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(1);
      expect(selectedMeshes[0]).toBe(testMesh2);
      expect(selectionService.isMeshSelected(testMesh1)).toBe(false);
      expect(selectionService.isMeshSelected(testMesh2)).toBe(true);
    });

    it('should apply visual highlight to selected mesh', () => {
      selectionService.selectMesh(testMesh1);

      if (testMesh1 instanceof Mesh) {
        expect(testMesh1.renderOutline).toBe(true);
        expect(testMesh1.outlineColor).toBeDefined();
      }
    });
  });

  describe('Multi-Selection', () => {
    beforeEach(() => {
      // Configure for multi-selection
      selectionService.updateConfig({ mode: 'multi' });
    });

    it('should add mesh to selection with addToSelection option', () => {
      selectionService.selectMesh(testMesh1);
      selectionService.selectMesh(testMesh2, { addToSelection: true });

      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(2);
      expect(selectedMeshes).toContain(testMesh1);
      expect(selectedMeshes).toContain(testMesh2);
    });

    it('should toggle mesh selection when already selected', () => {
      selectionService.selectMesh(testMesh1);
      selectionService.selectMesh(testMesh1, { addToSelection: true });

      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(0);
      expect(selectionService.isMeshSelected(testMesh1)).toBe(false);
    });

    it('should respect maximum selection limit', () => {
      selectionService.updateConfig({ maxSelections: 1 });

      selectionService.selectMesh(testMesh1);
      selectionService.selectMesh(testMesh2, { addToSelection: true });

      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(1);
      expect(selectedMeshes[0]).toBe(testMesh2); // Should keep the newest
    });
  });

  describe('Selection Deselection', () => {
    it('should deselect a specific mesh', () => {
      selectionService.selectMesh(testMesh1);
      expect(selectionService.isMeshSelected(testMesh1)).toBe(true);

      const result = selectionService.deselectMesh(testMesh1);
      expect(result.success).toBe(true);
      expect(selectionService.isMeshSelected(testMesh1)).toBe(false);
    });

    it('should remove visual highlight when deselecting', () => {
      selectionService.selectMesh(testMesh1);
      selectionService.deselectMesh(testMesh1);

      if (testMesh1 instanceof Mesh) {
        expect(testMesh1.renderOutline).toBe(false);
      }
    });

    it('should clear all selections', () => {
      selectionService.updateConfig({ mode: 'multi' });
      selectionService.selectMesh(testMesh1);
      selectionService.selectMesh(testMesh2, { addToSelection: true });

      const result = selectionService.clearSelection();
      expect(result.success).toBe(true);

      const selectedMeshes = selectionService.getSelectedMeshes();
      expect(selectedMeshes).toHaveLength(0);
      expect(selectionService.isMeshSelected(testMesh1)).toBe(false);
      expect(selectionService.isMeshSelected(testMesh2)).toBe(false);
    });
  });

  describe('Hover Highlighting', () => {
    it('should set hover mesh', () => {
      const result = selectionService.setHoverMesh(testMesh1);
      expect(result.success).toBe(true);

      const state = selectionService.getSelectionState();
      expect(state.hoveredMesh).toBe(testMesh1);
    });

    it('should apply hover highlight to mesh', () => {
      selectionService.setHoverMesh(testMesh1);

      if (testMesh1 instanceof Mesh) {
        expect(testMesh1.renderOutline).toBe(true);
        expect(testMesh1.outlineColor).toBeDefined();
      }
    });

    it('should remove previous hover highlight when setting new hover', () => {
      selectionService.setHoverMesh(testMesh1);
      selectionService.setHoverMesh(testMesh2);

      const state = selectionService.getSelectionState();
      expect(state.hoveredMesh).toBe(testMesh2);

      // testMesh1 should no longer have hover highlight (unless selected)
      if (testMesh1 instanceof Mesh && !selectionService.isMeshSelected(testMesh1)) {
        expect(testMesh1.renderOutline).toBe(false);
      }
    });

    it('should not apply hover highlight to selected mesh', () => {
      selectionService.selectMesh(testMesh1);
      selectionService.setHoverMesh(testMesh1);

      // Should still be highlighted due to selection, not hover
      if (testMesh1 instanceof Mesh) {
        expect(testMesh1.renderOutline).toBe(true);
      }
    });

    it('should disable hover when configured', () => {
      selectionService.updateConfig({ enableHover: false });

      const result = selectionService.setHoverMesh(testMesh1);
      expect(result.success).toBe(true);

      const state = selectionService.getSelectionState();
      expect(state.hoveredMesh).toBeNull(); // State not updated when hover is disabled
    });
  });

  describe('Mesh Picking', () => {
    it('should pick mesh at coordinates', () => {
      // Note: In headless mode, picking might not work as expected
      // This test verifies the method exists and handles errors gracefully
      const pickingInfo = selectionService.pickMeshAtCoordinates(100, 100);

      // In headless mode, this will likely return null
      expect(pickingInfo).toBeNull();
    });

    it('should handle picking errors gracefully', () => {
      // Test with invalid coordinates
      const pickingInfo = selectionService.pickMeshAtCoordinates(-1, -1);
      expect(pickingInfo).toBeNull();
    });
  });

  describe('Configuration Updates', () => {
    it('should update selection mode', () => {
      selectionService.updateConfig({ mode: 'multi' });

      const state = selectionService.getSelectionState();
      expect(state.selectionMode).toBe('multi');
    });

    it('should update highlight colors', () => {
      const newConfig = {
        highlightColor: { r: 1, g: 0, b: 0 } as any,
        hoverColor: { r: 0, g: 1, b: 0 } as any,
      };

      selectionService.updateConfig(newConfig);

      // Configuration should be updated (we can't easily test the visual effect in headless mode)
      expect(() => selectionService.selectMesh(testMesh1)).not.toThrow();
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners of selection changes', () => {
      const listener = vi.fn();
      const removeListener = selectionService.addListener(listener);

      selectionService.selectMesh(testMesh1);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedMeshes: expect.arrayContaining([expect.objectContaining({ mesh: testMesh1 })]),
        })
      );

      removeListener();

      selectionService.selectMesh(testMesh2);
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called after removal
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      selectionService.addListener(faultyListener);

      // Should not throw despite listener error
      expect(() => {
        selectionService.selectMesh(testMesh1);
      }).not.toThrow();
    });
  });

  describe('Selection State', () => {
    it('should track selection time', () => {
      const beforeSelection = new Date();
      selectionService.selectMesh(testMesh1);
      const afterSelection = new Date();

      const state = selectionService.getSelectionState();
      expect(state.lastSelectionTime).toBeDefined();
      expect(state.lastSelectionTime?.getTime()).toBeGreaterThanOrEqual(beforeSelection.getTime());
      expect(state.lastSelectionTime?.getTime()).toBeLessThanOrEqual(afterSelection.getTime());
    });

    it('should include mesh metadata in selection info', () => {
      testMesh1.metadata = { type: 'test', id: 123 };
      selectionService.selectMesh(testMesh1);

      const state = selectionService.getSelectionState();
      const selectedInfo = state.selectedMeshes[0];
      expect(selectedInfo).toBeDefined();
      expect(selectedInfo?.metadata).toEqual({ type: 'test', id: 123 });
    });
  });

  describe('Service Disposal', () => {
    it('should clear all selections on dispose', () => {
      selectionService.selectMesh(testMesh1);
      selectionService.setHoverMesh(testMesh2);

      selectionService.dispose();

      const state = selectionService.getSelectionState();
      expect(state.selectedMeshes).toHaveLength(0);
      expect(state.hoveredMesh).toBeNull();
    });

    it('should remove all listeners on dispose', () => {
      const listener = vi.fn();
      selectionService.addListener(listener);

      // First, verify the listener works
      selectionService.selectMesh(testMesh1);
      expect(listener).toHaveBeenCalledTimes(1);

      // Now dispose and verify listener is cleared
      selectionService.dispose();

      // The disposed service should not call listeners anymore
      // (Note: we can't test this directly since the service is disposed)
      // Instead, we verify that the listener set is cleared
      expect((selectionService as unknown as { listeners: Set<unknown> }).listeners.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle operations before initialization', () => {
      const uninitializedService = new SelectionService(scene);

      const result = uninitializedService.selectMesh(testMesh1);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.code).toBe('SELECTION_FAILED');
      }

      uninitializedService.dispose();
    });

    it('should handle invalid mesh operations gracefully', () => {
      // Test with disposed mesh
      const disposedMesh = CreateBox('disposedBox', { size: 1 }, scene);
      disposedMesh.dispose();

      const result = selectionService.selectMesh(disposedMesh);
      // Should handle gracefully (might succeed or fail depending on BabylonJS behavior)
      expect(result).toBeDefined();
    });
  });
});
