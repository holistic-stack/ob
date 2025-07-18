/**
 * @file index.ts
 * @description This file serves as the barrel export for the hooks in the code editor feature.
 * It exports custom hooks related to the Monaco editor functionality.
 *
 * @architectural_decision
 * Using a barrel export for hooks simplifies imports in components that use them.
 * This promotes a clean and organized import structure.
 *
 * @example
 * ```tsx
 * import { useMonacoEditor } from '@/features/code-editor/hooks';
 * ```
 */

export { default as useMonacoEditorDefault, useMonacoEditor } from './use-monaco-editor';
// export { useOpenSCADParsing } from './use-openscad-parsing';
