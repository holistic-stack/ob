/**
 * @file index.ts
 * @description This file is the barrel export for the types in the code editor feature.
 * It exports all the type definitions related to the editor's functionality and its integration with Monaco.
 *
 * @architectural_decision
 * Using a barrel export for types simplifies imports in other modules.
 * It allows components and services to import all necessary types from a single, consolidated source.
 *
 * @example
 * ```ts
 * import type { MonacoEditorProps, EditorChangeEvent } from '@/features/code-editor/types';
 * ```
 */

export type * from './editor.types';
export type * from './monaco.types';
