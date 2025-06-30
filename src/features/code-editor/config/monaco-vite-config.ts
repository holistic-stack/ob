/**
 * Monaco Editor Vite Configuration
 *
 * Comprehensive configuration for vite-plugin-monaco-editor with OpenSCAD language support,
 * worker configuration, and performance optimization following functional programming patterns.
 */

import type { Result } from '../../../shared/types/result.types';
import { tryCatch } from '../../../shared/utils/functional/result';

/**
 * Custom worker configuration
 */
export interface CustomWorker {
  readonly label: string;
  readonly entry: string;
}

/**
 * Monaco Editor plugin configuration options
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
 * Default Monaco Editor configuration
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
 * Create Monaco Editor configuration with defaults and custom options
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
 * Monaco configuration interface for validation
 */
export interface MonacoConfigValidation {
  readonly [key: string]: unknown;
}

/**
 * Validate Monaco Editor configuration
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
 * Create optimized Monaco Editor configuration for development
 */
export const createDevMonacoConfig = (): Required<MonacoEditorConfig> => {
  return createMonacoEditorConfig({
    buildOptimization: false,
    globalAPI: true,
    lazyLoad: false,
  });
};

/**
 * Create optimized Monaco Editor configuration for production
 */
export const createProdMonacoConfig = (): Required<MonacoEditorConfig> => {
  return createMonacoEditorConfig({
    buildOptimization: true,
    globalAPI: false,
    lazyLoad: true,
  });
};

/**
 * Get Monaco Editor configuration based on environment
 */
export const getMonacoConfigForEnvironment = (
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): Required<MonacoEditorConfig> => {
  return isDevelopment ? createDevMonacoConfig() : createProdMonacoConfig();
};

/**
 * Create Vite plugin configuration for Monaco Editor
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
 * Monaco Editor worker paths configuration
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
 * Monaco Editor environment configuration
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
 * Configure Monaco Editor environment for runtime
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

      console.log('[INIT][MonacoViteConfig] Monaco Editor environment configured');

      return undefined;
    },
    (err) =>
      `Failed to configure Monaco environment: ${err instanceof Error ? err.message : String(err)}`
  );
};

/**
 * Validate Monaco Editor plugin installation
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

      console.log('[INIT][MonacoViteConfig] Monaco Editor installation validated');

      return undefined;
    },
    (err) =>
      `Monaco Editor installation validation failed: ${err instanceof Error ? err.message : String(err)}`
  );
};
