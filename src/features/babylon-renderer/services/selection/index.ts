/**
 * @file Selection Service Exports
 *
 * Exports for the selection service and hooks.
 */

export type {
  SelectedMeshInfo,
  SelectionConfig,
  SelectionError,
  SelectionEventListener,
  SelectionHighlightType,
  SelectionMode,
  SelectionOptions,
  SelectionState,
} from './selection.service';
export { SelectionService } from './selection.service';
export type { UseSelectionReturn } from './use-selection.hook';
export {
  cleanupSelectionServices,
  useInteractiveSelection,
  useSelection,
  useSelectionShortcuts,
  useSelectionStats,
} from './use-selection.hook';
