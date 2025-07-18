/**
 * @file index.ts
 * @description This file is the barrel export for the services in the code editor feature.
 * It exports services related to the OpenSCAD language support in the Monaco Editor.
 *
 * @architectural_decision
 * A barrel file is used to provide a single entry point for all services in this feature.
 * This simplifies imports and improves code organization.
 *
 * @example
 * ```ts
 * import { registerOpenSCADLanguage } from '@/features/code-editor/services';
 * ```
 */

export * from './openscad-language';
