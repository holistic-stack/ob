/**
 * @file Selection Service Exports
 *
 * Exports for the selection service and hooks.
 */

export { SelectionService } from './selection.service';
export type {
  SelectionMode,
  SelectionHighlightType,
  SelectionConfig,
  SelectionOptions,
  SelectedMeshInfo,
  SelectionState,
  SelectionError,
  SelectionEventListener,
} from './selection.service';

export {
  useSelection,
  useSelectionStats,
  useSelectionShortcuts,
  useInteractiveSelection,
  cleanupSelectionServices,
} from './use-selection.hook';
export type {
  UseSelectionReturn,
} from './use-selection.hook';
