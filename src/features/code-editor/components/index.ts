/**
 * @file index.ts
 * @description This file is the barrel export for the components in the code editor feature.
 * It exports the main editor components for use in other parts of the application.
 *
 * @architectural_decision
 * A barrel file is used here to simplify component imports. This makes it easier to manage dependencies
 * and provides a single point of entry for all components related to the code editor.
 *
 * @example
 * ```tsx
 * import { StoreConnectedEditor } from '@/features/code-editor/components';
 * ```
 */

export { default as MonacoEditor, MonacoEditorComponent } from './monaco-editor';
export { StoreConnectedEditor } from './store-connected-editor';
