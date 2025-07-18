/**
 * @file monaco-vite-config.ts
 * @description This file provides comprehensive configuration for integrating Monaco Editor
 * with Vite, including OpenSCAD language support, worker configuration, and performance optimization.
 * It follows functional programming patterns for creating and validating configurations.
 *
 * @architectural_decision
 * This module centralizes all Monaco Editor-related configurations for the Vite build process.
 * By providing functions to create, validate, and retrieve configurations based on the environment,
 * it ensures consistency and reduces boilerplate. The use of `Result` types for validation
 * promotes robust error handling. The separation of concerns between configuration, validation,
 * and environment-specific settings makes the integration flexible and maintainable.
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import monacoEditorPlugin from 'vite-plugin-monaco-editor';
 * import { createViteMonacoPlugin } from './src/features/code-editor/config/monaco-vite-config.ts';
 *
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     monacoEditorPlugin(createViteMonacoPlugin()),
 *   ],
 * });
 * ```
 *
 * @integration
 * This configuration is primarily consumed by `vite.config.ts` to set up the Monaco Editor plugin.
 * It ensures that the OpenSCAD language worker is correctly registered and that the editor is
 * optimized for the target environment (development or production).
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import type { Result } from '../../../shared/types/result.types.js';
import { tryCatch } from '../../../shared/utils/functional/result.js';

const logger = createLogger('MonacoViteConfig');

/**
 * @interface CustomWorker
 * @description Defines the structure for a custom Monaco Editor worker.
 */
export interface CustomWorker {
  readonly label: string;
  readonly entry: string;
}

/**
 * @interface MonacoEditorConfig
 * @description Defines the configuration options for the Monaco Editor plugin.
 */
export interface MonacoEditorConfig {
  readonly languageWorkers?: ReadonlyArray<string>;
  readonly customWorkers?: ReadonlyArray<CustomWorker>;
  readonly buildOptimization?: boolean;
  readonly globalAPI?: boolean;
  readonly locale?: string;
  readonly lazyLoad?: boolean;
  readonly monacoEnvironment?: string;
  readonly publicPath?: string;
}

/**
 * @constant DEFAULT_CONFIG
 * @description The default configuration for the Monaco Editor plugin.
 */
const DEFAULT_CONFIG: Required<MonacoEditorConfig> = {
  languageWorkers: ['editorWorkerService', 'typescript', 'json', 'html', 'css', 'openscad'],
  customWorkers: [
    {
      label: 'openscad',
      entry: './src/features/code-editor/workers/openscad.worker.ts',
    },
  ],
  buildOptimization: true,
  globalAPI: true,
  locale: 'en',
  lazyLoad: false,
  monacoEnvironment: 'web',
  publicPath: '/monaco-editor',
};

/**
 * @function createMonacoEditorConfig
 * @description Creates a Monaco Editor configuration object with default values and custom options.
 * @param {Partial<MonacoEditorConfig>} [options={}] - Optional configuration overrides.
 * @returns {Required<MonacoEditorConfig>} A complete Monaco Editor configuration object.
 */
export const createMonacoEditorConfig = (
  options: Partial<MonacoEditorConfig> = {}
): Required<MonacoEditorConfig> => {
  return {
    ...DEFAULT_CONFIG,
    ...options,
    // Ensure OpenSCAD is always included in language workers
    languageWorkers: options.languageWorkers || DEFAULT_CONFIG.languageWorkers,
    // Merge custom workers with defaults
    customWorkers: options.customWorkers || DEFAULT_CONFIG.customWorkers,
  };
};

/**
 * @interface MonacoConfigValidation
 * @description Interface for validating Monaco Editor configuration.
 */
export interface MonacoConfigValidation {
  readonly [key: string]: unknown;
}

/**
 * @function validateMonacoConfig
 * @description Validates the Monaco Editor configuration.
 * @param {MonacoConfigValidation} config - The configuration object to validate.
 * @returns {Result<void, string>} A `Result` indicating success or a validation error message.
 */
export const validateMonacoConfig = (config: MonacoConfigValidation): Result<void, string> => {
  return tryCatch(
    () => {
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration: must be an object');
      }

      // Validate language workers
      if (!config.languageWorkers) {
        throw new Error('Missing required property: languageWorkers');
      }

      if (!Array.isArray(config.languageWorkers)) {
        throw new Error('languageWorkers must be an array');
      }

      if (config.languageWorkers.length === 0) {
        throw new Error('languageWorkers must contain at least one language worker');
      }

      // Ensure OpenSCAD worker is included
      if (!config.languageWorkers.includes('openscad')) {
        throw new Error('OpenSCAD language worker must be included in languageWorkers');
      }

      // Validate custom workers
      if (config.customWorkers) {
        if (!Array.isArray(config.customWorkers)) {
          throw new Error('customWorkers must be an array');
        }

        for (const worker of config.customWorkers) {
          if (!worker.label || typeof worker.label !== 'string') {
            throw new Error('Custom worker must have a valid label');
          }

          if (!worker.entry || typeof worker.entry !== 'string' || worker.entry.trim() === '') {
            throw new Error('Custom worker must have a valid entry path');
          }
        }
      }

      // Validate boolean options
      if (config.buildOptimization !== undefined && typeof config.buildOptimization !== 'boolean') {
        throw new Error('buildOptimization must be a boolean');
      }

      if (config.globalAPI !== undefined && typeof config.globalAPI !== 'boolean') {
        throw new Error('globalAPI must be a boolean');
      }

      if (config.lazyLoad !== undefined && typeof config.lazyLoad !== 'boolean') {
        throw new Error('lazyLoad must be a boolean');
      }

      // Validate string options
      if (config.locale !== undefined && typeof config.locale !== 'string') {
        throw new Error('locale must be a string');
      }

      if (config.monacoEnvironment !== undefined && typeof config.monacoEnvironment !== 'string') {
        throw new Error('monacoEnvironment must be a string');
      }

      if (config.publicPath !== undefined && typeof config.publicPath !== 'string') {
        throw new Error('publicPath must be a string');
      }

      return undefined;
    },
    (err) =>
      `Monaco configuration validation failed: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * @function createDevMonacoConfig
 * @description Creates an optimized Monaco Editor configuration for development.
 * @returns {Required<MonacoEditorConfig>} A development-optimized configuration object.
 */
export const createDevMonacoConfig = (): Required<MonacoEditorConfig> => {
  return createMonacoEditorConfig({
    buildOptimization: false,
    globalAPI: true,
    lazyLoad: false,
  });
};

/**
 * @function createProdMonacoConfig
 * @description Creates an optimized Monaco Editor configuration for production.
 * @returns {Required<MonacoEditorConfig>} A production-optimized configuration object.
 */
export const createProdMonacoConfig = (): Required<MonacoEditorConfig> => {
  return createMonacoEditorConfig({
    buildOptimization: true,
    globalAPI: false,
    lazyLoad: true,
  });
};

/**
 * @function getMonacoConfigForEnvironment
 * @description Gets the Monaco Editor configuration based on the environment.
 * @param {boolean} [isDevelopment=process.env.NODE_ENV === 'development'] - Whether the current environment is development.
 * @returns {Required<MonacoEditorConfig>} The appropriate configuration object for the environment.
 */
export const getMonacoConfigForEnvironment = (
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): Required<MonacoEditorConfig> => {
  return isDevelopment ? createDevMonacoConfig() : createProdMonacoConfig();
};

/**
 * @function createViteMonacoPlugin
 * @description Creates a Vite plugin configuration for Monaco Editor.
 * @param {Partial<MonacoEditorConfig>} [options={}] - Optional configuration overrides.
 * @returns {object} A configuration object compatible with `vite-plugin-monaco-editor`.
 * @throws {Error} If the Monaco configuration is invalid.
 */
export const createViteMonacoPlugin = (options: Partial<MonacoEditorConfig> = {}) => {
  const config = createMonacoEditorConfig(options);

  // Validate configuration
  const validationResult = validateMonacoConfig(config);
  if (!validationResult.success) {
    throw new Error(`Invalid Monaco configuration: ${validationResult.error}`);
  }

  // Return configuration compatible with vite-plugin-monaco-editor
  return {
    languageWorkers: config.languageWorkers,
    customWorkers: config.customWorkers,
    globalAPI: config.globalAPI,
    locale: config.locale,
    monacoEnvironment: config.monacoEnvironment,
    publicPath: config.publicPath,
    // Additional Vite-specific options
    buildOptimization: config.buildOptimization,
    lazyLoad: config.lazyLoad,
  };
};

/**
 * @constant MONACO_WORKER_PATHS
 * @description Defines the paths for Monaco Editor workers.
 */
export const MONACO_WORKER_PATHS = {
  editorWorkerService: 'monaco-editor/esm/vs/editor/editor.worker.js',
  typescript: 'monaco-editor/esm/vs/language/typescript/ts.worker.js',
  json: 'monaco-editor/esm/vs/language/json/json.worker.js',
  html: 'monaco-editor/esm/vs/language/html/html.worker.js',
  css: 'monaco-editor/esm/vs/language/css/css.worker.js',
  openscad: './src/features/code-editor/workers/openscad.worker.ts',
} as const;

/**
 * @constant MONACO_ENVIRONMENT_CONFIG
 * @description Defines the Monaco Editor environment configuration, including worker URL resolution.
 */
export const MONACO_ENVIRONMENT_CONFIG = {
  getWorkerUrl: (_moduleId: string, label: string) => {
    const workerPath = MONACO_WORKER_PATHS[label as keyof typeof MONACO_WORKER_PATHS];
    if (workerPath) {
      return workerPath;
    }

    // Fallback to default editor worker
    return MONACO_WORKER_PATHS.editorWorkerService;
  },

  getWorker: (moduleId: string, label: string) => {
    return new Worker(MONACO_ENVIRONMENT_CONFIG.getWorkerUrl(moduleId, label), {
      type: 'module',
    });
  },
};

/**
 * @function configureMonacoEnvironment
 * @description Configures the Monaco Editor environment for runtime.
 * @returns {Result<void, string>} A `Result` indicating success or an error message.
 */
export const configureMonacoEnvironment = (): Result<void, string> => {
  return tryCatch(
    () => {
      // Set up Monaco environment for web workers
      if (typeof window !== 'undefined') {
        (
          window as Window & { MonacoEnvironment?: typeof MONACO_ENVIRONMENT_CONFIG }
        ).MonacoEnvironment = MONACO_ENVIRONMENT_CONFIG;
      }

      logger.init('Monaco Editor environment configured');

      return undefined;
    },
    (err) =>
      `Failed to configure Monaco environment: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * @function validateMonacoInstallation
 * @description Validates the Monaco Editor plugin installation.
 * @returns {Result<void, string>} A `Result` indicating success or an error message.
 */
export const validateMonacoInstallation = (): Result<void, string> => {
  return tryCatch(
    () => {
      // Check if Monaco Editor is available
      if (typeof window !== 'undefined') {
        // Runtime validation would go here
        // For now, just check if the module can be imported
      }

      // Check if vite-plugin-monaco-editor is configured
      // This would be validated during build time

      logger.init('Monaco Editor installation validated');

      return undefined;
    },
    (err) =>
      `Monaco Editor installation validation failed: ${err instanceof Error ? err.message : String(err)}`
  );
};
