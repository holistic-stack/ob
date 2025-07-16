/**
 * @file Selection Hooks
 *
 * React hooks for managing selection state in components.
 * Provides reactive selection tracking with automatic cleanup.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedMeshes, selectMesh, clearSelection, hoveredMesh } = useSelection(scene);
 *   
 *   const handleMeshClick = (mesh: AbstractMesh) => {
 *     selectMesh(mesh, { addToSelection: false });
 *   };
 *   
 *   return (
 *     <div>
 *       <p>Selected: {selectedMeshes.length} objects</p>
 *       {hoveredMesh && <p>Hovering: {hoveredMesh.name}</p>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useState } from 'react';
import { Scene, AbstractMesh } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import {
  SelectionService,
  type SelectionState,
  type SelectionConfig,
  type SelectionOptions,
  type SelectedMeshInfo,
} from './selection.service';

const logger = createLogger('SelectionHook');

// Global selection service instances per scene
const selectionServices = new Map<Scene, SelectionService>();

/**
 * Get or create selection service for a scene
 */
function getSelectionService(scene: Scene, config?: Partial<SelectionConfig>): SelectionService {
  let service = selectionServices.get(scene);
  
  if (!service) {
    service = new SelectionService(scene, config);
    selectionServices.set(scene, service);
    
    // Initialize the service
    service.initialize().then(result => {
      if (!result.success) {
        logger.error(`[GET_SERVICE] Failed to initialize selection service: ${result.error.message}`);
      }
    });
  }
  
  return service;
}

/**
 * Selection hook return type
 */
export interface UseSelectionReturn {
  readonly selectedMeshes: readonly AbstractMesh[];
  readonly selectedMeshInfos: readonly SelectedMeshInfo[];
  readonly hoveredMesh: AbstractMesh | null;
  readonly selectionState: SelectionState;
  readonly selectMesh: (mesh: AbstractMesh, options?: SelectionOptions) => boolean;
  readonly deselectMesh: (mesh: AbstractMesh) => boolean;
  readonly clearSelection: () => boolean;
  readonly isMeshSelected: (mesh: AbstractMesh) => boolean;
  readonly setHoverMesh: (mesh: AbstractMesh | null) => boolean;
  readonly pickMeshAtCoordinates: (x: number, y: number) => AbstractMesh | null;
  readonly updateConfig: (config: Partial<SelectionConfig>) => void;
}

/**
 * Main selection hook for managing 3D object selection
 */
export const useSelection = (
  scene: Scene | null,
  config?: Partial<SelectionConfig>
): UseSelectionReturn => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedMeshes: [],
    hoveredMesh: null,
    selectionMode: 'single',
    isSelectionActive: false,
    lastSelectionTime: null,
  });

  const selectionService = scene ? getSelectionService(scene, config) : null;

  // Update selection state when service state changes
  useEffect(() => {
    if (!selectionService) {
      return;
    }

    const updateState = (newState: SelectionState) => {
      setSelectionState(newState);
    };

    // Initial state
    updateState(selectionService.getSelectionState());

    // Listen for changes
    const removeListener = selectionService.addListener(updateState);

    return removeListener;
  }, [selectionService]);

  const selectMesh = useCallback((mesh: AbstractMesh, options?: SelectionOptions): boolean => {
    if (!selectionService) {
      logger.warn('[SELECT_MESH] No selection service available');
      return false;
    }

    const result = selectionService.selectMesh(mesh, options);
    if (!result.success) {
      logger.error(`[SELECT_MESH] Failed to select mesh: ${result.error.message}`);
      return false;
    }
    return true;
  }, [selectionService]);

  const deselectMesh = useCallback((mesh: AbstractMesh): boolean => {
    if (!selectionService) {
      logger.warn('[DESELECT_MESH] No selection service available');
      return false;
    }

    const result = selectionService.deselectMesh(mesh);
    if (!result.success) {
      logger.error(`[DESELECT_MESH] Failed to deselect mesh: ${result.error.message}`);
      return false;
    }
    return true;
  }, [selectionService]);

  const clearSelection = useCallback((): boolean => {
    if (!selectionService) {
      logger.warn('[CLEAR_SELECTION] No selection service available');
      return false;
    }

    const result = selectionService.clearSelection();
    if (!result.success) {
      logger.error(`[CLEAR_SELECTION] Failed to clear selection: ${result.error.message}`);
      return false;
    }
    return true;
  }, [selectionService]);

  const isMeshSelected = useCallback((mesh: AbstractMesh): boolean => {
    if (!selectionService) {
      return false;
    }
    return selectionService.isMeshSelected(mesh);
  }, [selectionService]);

  const setHoverMesh = useCallback((mesh: AbstractMesh | null): boolean => {
    if (!selectionService) {
      logger.warn('[SET_HOVER_MESH] No selection service available');
      return false;
    }

    const result = selectionService.setHoverMesh(mesh);
    if (!result.success) {
      logger.error(`[SET_HOVER_MESH] Failed to set hover mesh: ${result.error.message}`);
      return false;
    }
    return true;
  }, [selectionService]);

  const pickMeshAtCoordinates = useCallback((x: number, y: number): AbstractMesh | null => {
    if (!selectionService) {
      return null;
    }

    const pickingInfo = selectionService.pickMeshAtCoordinates(x, y);
    return pickingInfo?.pickedMesh || null;
  }, [selectionService]);

  const updateConfig = useCallback((newConfig: Partial<SelectionConfig>): void => {
    if (!selectionService) {
      logger.warn('[UPDATE_CONFIG] No selection service available');
      return;
    }

    selectionService.updateConfig(newConfig);
  }, [selectionService]);

  const selectedMeshes = selectionState.selectedMeshes.map(info => info.mesh);

  return {
    selectedMeshes,
    selectedMeshInfos: selectionState.selectedMeshes,
    hoveredMesh: selectionState.hoveredMesh,
    selectionState,
    selectMesh,
    deselectMesh,
    clearSelection,
    isMeshSelected,
    setHoverMesh,
    pickMeshAtCoordinates,
    updateConfig,
  };
};

/**
 * Hook for tracking selection count and statistics
 */
export const useSelectionStats = (scene: Scene | null) => {
  const { selectedMeshes, selectionState } = useSelection(scene);

  const stats = {
    selectedCount: selectedMeshes.length,
    hasSelection: selectedMeshes.length > 0,
    isMultiSelection: selectedMeshes.length > 1,
    lastSelectionTime: selectionState.lastSelectionTime,
    selectionMode: selectionState.selectionMode,
  };

  return stats;
};

/**
 * Hook for selection keyboard shortcuts
 */
export const useSelectionShortcuts = (scene: Scene | null) => {
  const { clearSelection, selectMesh } = useSelection(scene);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key clears selection
      if (event.key === 'Escape') {
        clearSelection();
        event.preventDefault();
      }

      // Ctrl+A selects all (if implemented in the future)
      if (event.ctrlKey && event.key === 'a') {
        // TODO: Implement select all functionality
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  return {
    clearSelection,
    selectMesh,
  };
};

/**
 * Hook for selection with automatic hover handling
 */
export const useInteractiveSelection = (scene: Scene | null) => {
  const selection = useSelection(scene);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!scene) return;

    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const mesh = selection.pickMeshAtCoordinates(x, y);
    selection.setHoverMesh(mesh);
  }, [scene, selection]);

  const handlePointerClick = useCallback((event: PointerEvent) => {
    if (!scene) return;

    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const mesh = selection.pickMeshAtCoordinates(x, y);
    if (mesh) {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      selection.selectMesh(mesh, {
        addToSelection: isCtrlPressed,
        clearPrevious: !isCtrlPressed,
      });
    } else {
      selection.clearSelection();
    }
  }, [scene, selection]);

  useEffect(() => {
    if (!scene) return;

    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerClick);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerClick);
    };
  }, [scene, handlePointerMove, handlePointerClick]);

  return selection;
};

/**
 * Cleanup function for selection services
 */
export const cleanupSelectionServices = (): void => {
  for (const [scene, service] of selectionServices.entries()) {
    service.dispose();
    selectionServices.delete(scene);
  }
};
