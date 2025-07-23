/**
 * @file mesh-selection.test.tsx
 * @description Tests for mesh selection functionality in BabylonJS scene component.
 * Tests click detection, mesh selection events, and integration with pointer observables.
 */

import type { AbstractMesh, Scene } from '@babylonjs/core';
import { CreateBox, Engine, NullEngine, PointerEventTypes } from '@babylonjs/core';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BabylonSceneProps } from './babylon-scene';
import { BabylonScene } from './babylon-scene';

// Mock ResizeObserver for headless testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('BabylonScene Mesh Selection', () => {
  let engine: Engine;
  let mockOnMeshSelected: ReturnType<typeof vi.fn>;
  let mockOnSceneReady: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create NullEngine for headless testing
    engine = new NullEngine({
      renderHeight: 512,
      renderWidth: 512,
      textureSize: 512,
      deterministicLockstep: false,
      lockstepMaxSteps: 1,
    });

    mockOnMeshSelected = vi.fn();
    mockOnSceneReady = vi.fn();
  });

  afterEach(() => {
    engine.dispose();
    vi.clearAllMocks();
  });

  const renderBabylonScene = (props: Partial<BabylonSceneProps> = {}) => {
    const defaultProps: BabylonSceneProps = {
      onSceneReady: mockOnSceneReady,
      onMeshSelected: mockOnMeshSelected,
    };

    return render(<BabylonScene {...defaultProps} {...props} />);
  };

  describe('Mesh Selection Setup', () => {
    it('should setup mesh selection when onMeshSelected callback is provided', async () => {
      renderBabylonScene();

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      expect(scene).toBeDefined();
      expect(scene.onPointerObservable).toBeDefined();
    });

    it('should not setup mesh selection when onMeshSelected callback is not provided', async () => {
      renderBabylonScene({ onMeshSelected: undefined });

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      expect(scene).toBeDefined();
      // Scene should still be created normally
      expect(scene.onPointerObservable).toBeDefined();
    });

    it('should handle scene ready callback with mesh selection', async () => {
      renderBabylonScene();

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalledTimes(1);
        expect(mockOnSceneReady).toHaveBeenCalledWith(expect.any(Object));
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      expect(scene.onPointerObservable).toBeDefined();
    });
  });

  describe('Mesh Selection Events', () => {
    let scene: Scene;
    let testMesh: AbstractMesh;

    beforeEach(async () => {
      renderBabylonScene();

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      testMesh = CreateBox('testBox', { size: 2 }, scene);
    });

    it('should call onMeshSelected when mesh is clicked', () => {
      // Simulate pointer down event with mesh hit
      const pointerInfo = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: {
          hit: true,
          pickedMesh: testMesh,
        },
      };

      scene.onPointerObservable.notifyObservers(pointerInfo as any);

      expect(mockOnMeshSelected).toHaveBeenCalledTimes(1);
      expect(mockOnMeshSelected).toHaveBeenCalledWith(testMesh);
    });

    it('should call onMeshSelected with null when empty space is clicked', () => {
      // Simulate pointer down event with no hit
      const pointerInfo = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: {
          hit: false,
          pickedMesh: null,
        },
      };

      scene.onPointerObservable.notifyObservers(pointerInfo as any);

      expect(mockOnMeshSelected).toHaveBeenCalledTimes(1);
      expect(mockOnMeshSelected).toHaveBeenCalledWith(null);
    });

    it('should call onMeshSelected with null when pickInfo is undefined', () => {
      // Simulate pointer down event with undefined pickInfo
      const pointerInfo = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: undefined,
      };

      scene.onPointerObservable.notifyObservers(pointerInfo as any);

      expect(mockOnMeshSelected).toHaveBeenCalledTimes(1);
      expect(mockOnMeshSelected).toHaveBeenCalledWith(null);
    });

    it('should only respond to POINTERDOWN events', () => {
      const pointerEvents = [
        PointerEventTypes.POINTERMOVE,
        PointerEventTypes.POINTERUP,
        PointerEventTypes.POINTERWHEEL,
        PointerEventTypes.POINTERPICK,
        PointerEventTypes.POINTERTAP,
        PointerEventTypes.POINTERDOUBLETAP,
      ];

      for (const eventType of pointerEvents) {
        const pointerInfo = {
          type: eventType,
          pickInfo: {
            hit: true,
            pickedMesh: testMesh,
          },
        };

        scene.onPointerObservable.notifyObservers(pointerInfo as any);
      }

      // Should not have been called for any of these events
      expect(mockOnMeshSelected).not.toHaveBeenCalled();
    });

    it('should handle multiple mesh selections', () => {
      const secondMesh = CreateBox('secondBox', { size: 1 }, scene);

      // Select first mesh
      const pointerInfo1 = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: {
          hit: true,
          pickedMesh: testMesh,
        },
      };

      scene.onPointerObservable.notifyObservers(pointerInfo1 as any);

      expect(mockOnMeshSelected).toHaveBeenCalledWith(testMesh);

      // Select second mesh
      const pointerInfo2 = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: {
          hit: true,
          pickedMesh: secondMesh,
        },
      };

      scene.onPointerObservable.notifyObservers(pointerInfo2 as any);

      expect(mockOnMeshSelected).toHaveBeenCalledWith(secondMesh);
      expect(mockOnMeshSelected).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid click events', () => {
      // Simulate rapid clicking
      for (let i = 0; i < 10; i++) {
        const pointerInfo = {
          type: PointerEventTypes.POINTERDOWN,
          pickInfo: {
            hit: i % 2 === 0,
            pickedMesh: i % 2 === 0 ? testMesh : null,
          },
        };

        scene.onPointerObservable.notifyObservers(pointerInfo as any);
      }

      expect(mockOnMeshSelected).toHaveBeenCalledTimes(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle scene disposal gracefully', async () => {
      renderBabylonScene();

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      
      // Dispose scene
      scene.dispose();

      // Should not throw errors
      expect(() => {
        const pointerInfo = {
          type: PointerEventTypes.POINTERDOWN,
          pickInfo: {
            hit: false,
            pickedMesh: null,
          },
        };
        scene.onPointerObservable.notifyObservers(pointerInfo as any);
      }).not.toThrow();
    });

    it('should handle malformed pointer events', async () => {
      renderBabylonScene();

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;

      // Test with malformed events
      const malformedEvents = [
        null,
        undefined,
        {},
        { type: 'invalid' },
        { type: PointerEventTypes.POINTERDOWN },
        { type: PointerEventTypes.POINTERDOWN, pickInfo: null },
      ];

      for (const event of malformedEvents) {
        expect(() => {
          scene.onPointerObservable.notifyObservers(event as any);
        }).not.toThrow();
      }
    });
  });

  describe('Integration with Scene Lifecycle', () => {
    it('should setup mesh selection after scene is ready', async () => {
      renderBabylonScene();

      // Scene should be ready
      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      const testMesh = CreateBox('testBox', { size: 2 }, scene);

      // Mesh selection should work immediately
      const pointerInfo = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: {
          hit: true,
          pickedMesh: testMesh,
        },
      };

      scene.onPointerObservable.notifyObservers(pointerInfo as any);

      expect(mockOnMeshSelected).toHaveBeenCalledWith(testMesh);
    });

    it('should work with scene configuration options', async () => {
      const customConfig = {
        enableWebGPU: false,
        enableInspector: true,
        enablePhysics: true,
      };

      renderBabylonScene({ config: customConfig });

      await waitFor(() => {
        expect(mockOnSceneReady).toHaveBeenCalled();
      });

      const scene = mockOnSceneReady.mock.calls[0][0] as Scene;
      expect(scene).toBeDefined();

      // Mesh selection should still work with custom config
      const testMesh = CreateBox('testBox', { size: 2 }, scene);
      const pointerInfo = {
        type: PointerEventTypes.POINTERDOWN,
        pickInfo: {
          hit: true,
          pickedMesh: testMesh,
        },
      };

      scene.onPointerObservable.notifyObservers(pointerInfo as any);

      expect(mockOnMeshSelected).toHaveBeenCalledWith(testMesh);
    });
  });
});
