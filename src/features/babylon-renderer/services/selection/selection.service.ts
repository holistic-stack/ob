/**
 * @file Selection Service
 *
 * Service for managing 3D object selection and highlighting in BabylonJS scenes.
 * Provides comprehensive selection management with visual feedback and interaction support.
 *
 * @example
 * ```typescript
 * const selectionService = new SelectionService(scene);
 *
 * // Setup selection system
 * await selectionService.initialize();
 *
 * // Select a mesh
 * const result = selectionService.selectMesh(mesh, { addToSelection: false });
 *
 * // Get selected meshes
 * const selected = selectionService.getSelectedMeshes();
 * ```
 */

import { type AbstractMesh, Color3, Mesh, type PickingInfo, type Scene } from '@babylonjs/core';
import { createLogger } from '../../../../shared/services/logger.service';
import type { Result } from '../../../../shared/types/result.types';
import { tryCatch, tryCatchAsync } from '../../../../shared/utils/functional/result';

const logger = createLogger('Selection');

/**
 * Selection mode types
 */
export type SelectionMode = 'single' | 'multi' | 'range';

/**
 * Selection visual feedback types
 */
export type SelectionHighlightType = 'outline' | 'wireframe' | 'color' | 'glow';

/**
 * Selection configuration
 */
export interface SelectionConfig {
  readonly mode: SelectionMode;
  readonly highlightType: SelectionHighlightType;
  readonly highlightColor: Color3;
  readonly hoverColor: Color3;
  readonly outlineWidth: number;
  readonly enableHover: boolean;
  readonly enableKeyboardShortcuts: boolean;
  readonly maxSelections?: number; // Limit for multi-selection
}

/**
 * Selection operation options
 */
export interface SelectionOptions {
  readonly addToSelection?: boolean; // For multi-selection
  readonly clearPrevious?: boolean; // Clear previous selection
  readonly triggerEvents?: boolean; // Trigger selection events
}

/**
 * Selected mesh information
 */
export interface SelectedMeshInfo {
  readonly mesh: AbstractMesh;
  readonly selectionTime: Date;
  readonly pickingInfo?: PickingInfo;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Selection state
 */
export interface SelectionState {
  readonly selectedMeshes: readonly SelectedMeshInfo[];
  readonly hoveredMesh: AbstractMesh | null;
  readonly selectionMode: SelectionMode;
  readonly isSelectionActive: boolean;
  readonly lastSelectionTime: Date | null;
}

/**
 * Selection error
 */
export interface SelectionError {
  readonly code:
    | 'INITIALIZATION_FAILED'
    | 'MESH_NOT_FOUND'
    | 'SELECTION_FAILED'
    | 'HIGHLIGHT_FAILED'
    | 'INVALID_OPERATION';
  readonly message: string;
  readonly timestamp: Date;
  readonly meshId?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Selection event listener
 */
export type SelectionEventListener = (state: SelectionState) => void;

/**
 * Selection Service
 *
 * Manages 3D object selection and highlighting with support for single/multi-selection,
 * hover effects, and various visual feedback modes.
 */
export class SelectionService {
  private readonly scene: Scene;
  private config: SelectionConfig;
  private state: SelectionState;
  private listeners = new Set<SelectionEventListener>();
  private isInitialized = false;

  constructor(scene: Scene, config?: Partial<SelectionConfig>) {
    this.scene = scene;

    // Default configuration optimized for CAD visualization
    const defaultConfig: SelectionConfig = {
      mode: 'single',
      highlightType: 'outline',
      highlightColor: new Color3(0.2, 0.6, 1.0), // Blue
      hoverColor: new Color3(1.0, 0.8, 0.2), // Orange
      outlineWidth: 0.02,
      enableHover: true,
      enableKeyboardShortcuts: true,
      maxSelections: 50,
    };

    this.config = { ...defaultConfig, ...config };

    this.state = {
      selectedMeshes: [],
      hoveredMesh: null,
      selectionMode: this.config.mode,
      isSelectionActive: false,
      lastSelectionTime: null,
    };

    logger.init('[INIT] Selection service initialized');
  }

  /**
   * Initialize the selection system
   */
  async initialize(): Promise<Result<void, SelectionError>> {
    logger.debug('[INITIALIZE] Setting up selection system...');

    return tryCatchAsync(
      async () => {
        // Setup outline renderer for highlight effects
        if (this.config.highlightType === 'outline') {
          // OutlineRenderer is created automatically by BabylonJS when needed
          // We don't need to create it manually
        }

        // Setup pointer event handlers
        this.setupPointerEvents();

        // Setup keyboard event handlers
        if (this.config.enableKeyboardShortcuts) {
          this.setupKeyboardEvents();
        }

        this.isInitialized = true;
        logger.debug('[INITIALIZE] Selection system initialized successfully');
      },
      (error) =>
        this.createError('INITIALIZATION_FAILED', `Failed to initialize selection system: ${error}`)
    );
  }

  /**
   * Select a mesh with options
   */
  selectMesh(mesh: AbstractMesh, options: SelectionOptions = {}): Result<void, SelectionError> {
    return tryCatch(
      () => {
        if (!this.isInitialized) {
          throw this.createError('INVALID_OPERATION', 'Selection service not initialized');
        }

        const {
          addToSelection = false,
          clearPrevious = !addToSelection,
          triggerEvents = true,
        } = options;

        // Clear previous selection if requested
        if (clearPrevious) {
          this.clearSelection(false);
        }

        // Check if mesh is already selected
        const isAlreadySelected = this.state.selectedMeshes.some((info) => info.mesh === mesh);

        if (isAlreadySelected && addToSelection) {
          // Remove from selection if already selected (toggle behavior)
          this.deselectMesh(mesh, { triggerEvents: false });
        } else if (!isAlreadySelected) {
          // Add to selection
          const selectionInfo: SelectedMeshInfo = {
            mesh,
            selectionTime: new Date(),
            metadata: (mesh.metadata as Record<string, unknown>) || {},
          };

          // Check selection limit for multi-selection
          if (
            this.config.maxSelections &&
            this.state.selectedMeshes.length >= this.config.maxSelections
          ) {
            // Remove oldest selection
            const oldestSelection = this.state.selectedMeshes[0];
            if (oldestSelection) {
              this.deselectMesh(oldestSelection.mesh, { triggerEvents: false });
            }
          }

          this.state = {
            ...this.state,
            selectedMeshes: [...this.state.selectedMeshes, selectionInfo],
            lastSelectionTime: selectionInfo.selectionTime,
          };

          // Apply visual highlight
          this.applySelectionHighlight(mesh);
        }

        if (triggerEvents) {
          this.notifyListeners();
        }

        logger.debug(`[SELECT_MESH] Selected mesh: ${mesh.name || mesh.id}`);
      },
      (error) => this.createError('SELECTION_FAILED', `Failed to select mesh: ${error}`, mesh.id)
    );
  }

  /**
   * Deselect a specific mesh
   */
  deselectMesh(
    mesh: AbstractMesh,
    options: { triggerEvents?: boolean } = {}
  ): Result<void, SelectionError> {
    return tryCatch(
      () => {
        const { triggerEvents = true } = options;

        this.state = {
          ...this.state,
          selectedMeshes: this.state.selectedMeshes.filter((info) => info.mesh !== mesh),
        };

        // Remove visual highlight
        this.removeSelectionHighlight(mesh);

        if (triggerEvents) {
          this.notifyListeners();
        }

        logger.debug(`[DESELECT_MESH] Deselected mesh: ${mesh.name || mesh.id}`);
      },
      (error) => this.createError('SELECTION_FAILED', `Failed to deselect mesh: ${error}`, mesh.id)
    );
  }

  /**
   * Clear all selections
   */
  clearSelection(triggerEvents = true): Result<void, SelectionError> {
    return tryCatch(
      () => {
        // Remove highlights from all selected meshes
        for (const selectionInfo of this.state.selectedMeshes) {
          this.removeSelectionHighlight(selectionInfo.mesh);
        }

        this.state = {
          ...this.state,
          selectedMeshes: [],
          lastSelectionTime: null,
        };

        if (triggerEvents) {
          this.notifyListeners();
        }

        logger.debug('[CLEAR_SELECTION] Cleared all selections');
      },
      (error) => this.createError('SELECTION_FAILED', `Failed to clear selection: ${error}`)
    );
  }

  /**
   * Set hover highlight for a mesh
   */
  setHoverMesh(mesh: AbstractMesh | null): Result<void, SelectionError> {
    return tryCatch(
      () => {
        if (!this.config.enableHover) {
          // When hover is disabled, clear any existing hover state
          this.state = {
            ...this.state,
            hoveredMesh: null,
          };
          this.notifyListeners();
          return;
        }

        // Remove previous hover highlight
        if (this.state.hoveredMesh && this.state.hoveredMesh !== mesh) {
          this.removeHoverHighlight(this.state.hoveredMesh);
        }

        this.state = {
          ...this.state,
          hoveredMesh: mesh,
        };

        // Apply hover highlight
        if (mesh && !this.isMeshSelected(mesh)) {
          this.applyHoverHighlight(mesh);
        }

        this.notifyListeners();
      },
      (error) =>
        this.createError('HIGHLIGHT_FAILED', `Failed to set hover mesh: ${error}`, mesh?.id)
    );
  }

  /**
   * Pick mesh at screen coordinates
   */
  pickMeshAtCoordinates(x: number, y: number): PickingInfo | null {
    try {
      const pickingInfo = this.scene.pick(x, y);
      return pickingInfo?.hit ? pickingInfo : null;
    } catch (error) {
      logger.warn(`[PICK_MESH] Failed to pick mesh at coordinates (${x}, ${y}): ${error}`);
      return null;
    }
  }

  /**
   * Get currently selected meshes
   */
  getSelectedMeshes(): readonly AbstractMesh[] {
    return this.state.selectedMeshes.map((info) => info.mesh);
  }

  /**
   * Get selection state
   */
  getSelectionState(): SelectionState {
    return this.state;
  }

  /**
   * Check if a mesh is selected
   */
  isMeshSelected(mesh: AbstractMesh): boolean {
    return this.state.selectedMeshes.some((info) => info.mesh === mesh);
  }

  /**
   * Update selection configuration
   */
  updateConfig(newConfig: Partial<SelectionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update state if selection mode changed
    if (newConfig.mode && newConfig.mode !== this.state.selectionMode) {
      this.state = {
        ...this.state,
        selectionMode: newConfig.mode,
      };
    }

    logger.debug('[UPDATE_CONFIG] Selection configuration updated');
  }

  /**
   * Add selection event listener
   */
  addListener(listener: SelectionEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply selection highlight to mesh
   */
  private applySelectionHighlight(mesh: AbstractMesh): void {
    try {
      switch (this.config.highlightType) {
        case 'outline':
          if (mesh instanceof Mesh) {
            mesh.renderOutline = true;
            mesh.outlineColor = this.config.highlightColor;
            mesh.outlineWidth = 0.02;
          }
          break;
        case 'wireframe':
          // For wireframe mode, we use the outline rendering instead
          // This provides better visual feedback for selection
          if (mesh instanceof Mesh) {
            mesh.renderOutline = true;
            mesh.outlineColor = this.config.highlightColor;
            mesh.outlineWidth = 0.02;
          }
          break;
        case 'color':
          // Color overlay implementation would go here
          break;
        case 'glow':
          // Glow effect implementation would go here
          break;
      }
    } catch (error) {
      logger.warn(`[APPLY_HIGHLIGHT] Failed to apply selection highlight: ${error}`);
    }
  }

  /**
   * Remove selection highlight from mesh
   */
  private removeSelectionHighlight(mesh: AbstractMesh): void {
    try {
      switch (this.config.highlightType) {
        case 'outline':
          if (mesh instanceof Mesh) {
            mesh.renderOutline = false;
          }
          break;
        case 'wireframe':
          // For wireframe mode, we just disable wireframe
          // The original material state is handled by the rendering mode service
          break;
      }
    } catch (error) {
      logger.warn(`[REMOVE_HIGHLIGHT] Failed to remove selection highlight: ${error}`);
    }
  }

  /**
   * Apply hover highlight to mesh
   */
  private applyHoverHighlight(mesh: AbstractMesh): void {
    try {
      if (this.config.highlightType === 'outline' && mesh instanceof Mesh) {
        mesh.renderOutline = true;
        mesh.outlineColor = this.config.hoverColor;
        mesh.outlineWidth = this.config.outlineWidth * 0.5; // Thinner for hover
      }
    } catch (error) {
      logger.warn(`[APPLY_HOVER] Failed to apply hover highlight: ${error}`);
    }
  }

  /**
   * Remove hover highlight from mesh
   */
  private removeHoverHighlight(mesh: AbstractMesh): void {
    try {
      if (
        this.config.highlightType === 'outline' &&
        mesh instanceof Mesh &&
        !this.isMeshSelected(mesh)
      ) {
        mesh.renderOutline = false;
      }
    } catch (error) {
      logger.warn(`[REMOVE_HOVER] Failed to remove hover highlight: ${error}`);
    }
  }

  /**
   * Setup pointer event handlers
   */
  private setupPointerEvents(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      try {
        switch (pointerInfo.type) {
          case 1: // POINTERDOWN
            if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
              const mesh = pointerInfo.pickInfo.pickedMesh;
              const isCtrlPressed = pointerInfo.event.ctrlKey || pointerInfo.event.metaKey;

              this.selectMesh(mesh, {
                addToSelection: isCtrlPressed && this.config.mode === 'multi',
                clearPrevious: !isCtrlPressed,
              });
            } else {
              // Clicked on empty space - clear selection
              this.clearSelection();
            }
            break;

          case 4: // POINTERMOVE
            if (this.config.enableHover && pointerInfo.pickInfo?.hit) {
              const mesh = pointerInfo.pickInfo.pickedMesh;
              this.setHoverMesh(mesh);
            } else {
              this.setHoverMesh(null);
            }
            break;
        }
      } catch (error) {
        logger.warn(`[POINTER_EVENT] Error handling pointer event: ${error}`);
      }
    });
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardEvents(): void {
    // Keyboard shortcuts would be implemented here
    // For now, we'll keep it simple and focus on mouse interaction
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        logger.warn(`[NOTIFY_LISTENERS] Listener error: ${error}`);
      }
    }
  }

  /**
   * Create a selection error
   */
  private createError(
    code: SelectionError['code'],
    message: string,
    meshId?: string,
    details?: Record<string, unknown>
  ): SelectionError {
    return {
      code,
      message,
      timestamp: new Date(),
      ...(meshId && { meshId }),
      ...(details && { details }),
    };
  }

  /**
   * Dispose service and clean up resources
   */
  dispose(): void {
    this.clearSelection(false);
    this.setHoverMesh(null);
    this.listeners.clear();
    this.isInitialized = false;

    logger.debug('[DISPOSE] Selection service disposed');
  }
}
