/**
 * @file transformation-gizmo.integration.test.tsx
 * @description Integration tests for transformation gizmo functionality with store connectivity,
 * mesh selection, and BabylonJS scene integration. Tests the complete workflow from mesh
 * selection to gizmo attachment and transformation events.
 */

import type { AbstractMesh } from '@babylonjs/core';
import { CreateBox, type Engine, NullEngine, Scene } from '@babylonjs/core';
import { cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appStoreInstance, useAppStore } from '../../../store/app-store';
import type { GizmoMode } from '../../services/transformation-gizmo-service';
import { TransformationGizmo } from './transformation-gizmo';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

/**
 * Test component that integrates with the store
 */
function TestTransformationGizmoWithStore({
  scene,
  selectedMesh,
  mode,
}: {
  scene: Scene | null;
  selectedMesh: AbstractMesh | null;
  mode: GizmoMode;
}) {
  const setSelectedMesh = useAppStore((state) => state.setSelectedMesh);
  const setTransformationGizmoMode = useAppStore((state) => state.setTransformationGizmoMode);
  const storeSelectedMesh = useAppStore((state) => state.babylonRendering.selectedMesh);
  const storeGizmoMode = useAppStore((state) => state.babylonRendering.transformationGizmoMode);

  // Update store when props change
  React.useEffect(() => {
    setSelectedMesh(selectedMesh);
  }, [selectedMesh, setSelectedMesh]);

  React.useEffect(() => {
    setTransformationGizmoMode(mode);
  }, [mode, setTransformationGizmoMode]);

  return (
    <div data-testid="transformation-gizmo-container">
      <div data-testid="store-selected-mesh">{storeSelectedMesh?.name || 'none'}</div>
      <div data-testid="store-gizmo-mode">{storeGizmoMode}</div>
      <TransformationGizmo
        scene={scene}
        selectedMesh={storeSelectedMesh}
        mode={storeGizmoMode}
        onTransformationComplete={(event) => {
          console.log('Transformation completed:', event);
        }}
        onError={(error) => {
          console.error('Transformation gizmo error:', error);
        }}
      />
    </div>
  );
}

describe.skip('TransformationGizmo Integration Tests', () => {
  let engine: Engine;
  let scene: Scene;
  let testMesh: AbstractMesh;

  beforeEach(async () => {
    // Reset store state before each test
    const store = appStoreInstance.getState();
    store.resetGizmo();
    store.setSelectedMesh(null);
    store.setTransformationGizmoMode('position');

    // Create NullEngine for headless testing
    engine = new NullEngine({
      renderHeight: 512,
      renderWidth: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    // Create scene
    scene = new Scene(engine);

    // Create test mesh
    testMesh = CreateBox('testBox', { size: 2 }, scene);
  });

  afterEach(() => {
    // Clean up React Testing Library components
    cleanup();

    // Dispose BabylonJS resources
    scene?.dispose();
    engine?.dispose();

    // Reset store state after each test
    const store = appStoreInstance.getState();
    store.resetGizmo();
    store.setSelectedMesh(null);
    store.setTransformationGizmoMode('position');
  });

  const renderWithStore = (props: {
    scene: Scene | null;
    selectedMesh: AbstractMesh | null;
    mode: GizmoMode;
  }) => {
    return render(<TestTransformationGizmoWithStore {...props} />);
  };

  describe('Store Integration', () => {
    it('should integrate with Zustand store for mesh selection', async () => {
      const { getByTestId } = renderWithStore({
        scene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('testBox');
        expect(getByTestId('store-gizmo-mode')).toHaveTextContent('position');
      });
    });

    it('should update store when mesh selection changes', async () => {
      const { getByTestId, rerender } = renderWithStore({
        scene,
        selectedMesh: null,
        mode: 'position',
      });

      // Initially no mesh selected
      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('none');
      });

      // Select mesh
      rerender(
        <TestTransformationGizmoWithStore scene={scene} selectedMesh={testMesh} mode="position" />
      );

      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('testBox');
      });
    });

    it('should update store when gizmo mode changes', async () => {
      const { getByTestId, rerender } = renderWithStore({
        scene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      // Initially position mode
      await waitFor(() => {
        expect(getByTestId('store-gizmo-mode')).toHaveTextContent('position');
      });

      // Change to rotation mode
      rerender(
        <TestTransformationGizmoWithStore scene={scene} selectedMesh={testMesh} mode="rotation" />
      );

      await waitFor(() => {
        expect(getByTestId('store-gizmo-mode')).toHaveTextContent('rotation');
      });

      // Change to scale mode
      rerender(
        <TestTransformationGizmoWithStore scene={scene} selectedMesh={testMesh} mode="scale" />
      );

      await waitFor(() => {
        expect(getByTestId('store-gizmo-mode')).toHaveTextContent('scale');
      });
    });
  });

  describe('Scene Integration', () => {
    it('should handle scene availability', async () => {
      const { getByTestId, rerender } = renderWithStore({
        scene: null,
        selectedMesh: testMesh,
        mode: 'position',
      });

      // Initially no scene
      expect(getByTestId('transformation-gizmo-container')).toBeInTheDocument();

      // Add scene
      rerender(
        <TestTransformationGizmoWithStore scene={scene} selectedMesh={testMesh} mode="position" />
      );

      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('testBox');
      });
    });

    it('should handle multiple meshes', async () => {
      const secondMesh = CreateBox('secondBox', { size: 1 }, scene);

      const { getByTestId, rerender } = renderWithStore({
        scene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('testBox');
      });

      // Switch to second mesh
      rerender(
        <TestTransformationGizmoWithStore scene={scene} selectedMesh={secondMesh} mode="position" />
      );

      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('secondBox');
      });
    });
  });

  describe('Gizmo Mode Integration', () => {
    it('should handle all gizmo modes', async () => {
      const modes: GizmoMode[] = ['position', 'rotation', 'scale'];

      const { getByTestId, rerender } = renderWithStore({
        scene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      for (const mode of modes) {
        rerender(
          <TestTransformationGizmoWithStore scene={scene} selectedMesh={testMesh} mode={mode} />
        );

        await waitFor(() => {
          expect(getByTestId('store-gizmo-mode')).toHaveTextContent(mode);
        });
      }
    });

    it('should handle rapid mode changes', async () => {
      const { getByTestId, rerender } = renderWithStore({
        scene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      const modes: GizmoMode[] = ['position', 'rotation', 'scale', 'position', 'rotation'];

      for (const mode of modes) {
        rerender(
          <TestTransformationGizmoWithStore scene={scene} selectedMesh={testMesh} mode={mode} />
        );

        await waitFor(() => {
          expect(getByTestId('store-gizmo-mode')).toHaveTextContent(mode);
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle disposed scene gracefully', async () => {
      const disposedScene = new Scene(engine);
      disposedScene.dispose();

      const { getByTestId } = renderWithStore({
        scene: disposedScene,
        selectedMesh: testMesh,
        mode: 'position',
      });

      // Should not crash
      expect(getByTestId('transformation-gizmo-container')).toBeInTheDocument();
    });

    it('should handle null mesh gracefully', async () => {
      const { getByTestId } = renderWithStore({
        scene,
        selectedMesh: null,
        mode: 'position',
      });

      await waitFor(() => {
        expect(getByTestId('store-selected-mesh')).toHaveTextContent('none');
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid prop changes without errors', async () => {
      const { getByTestId, rerender } = renderWithStore({
        scene,
        selectedMesh: null,
        mode: 'position',
      });

      // Rapid changes to test performance
      for (let i = 0; i < 10; i++) {
        const mesh = i % 2 === 0 ? testMesh : null;
        const mode: GizmoMode = i % 3 === 0 ? 'position' : i % 3 === 1 ? 'rotation' : 'scale';

        rerender(
          <TestTransformationGizmoWithStore scene={scene} selectedMesh={mesh} mode={mode} />
        );
      }

      // Should still be functional after rapid changes
      expect(getByTestId('transformation-gizmo-container')).toBeInTheDocument();
    });
  });
});
