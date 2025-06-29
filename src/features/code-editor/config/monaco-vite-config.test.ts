/**
 * Monaco Editor Vite Configuration Test Suite
 * 
 * Tests for Vite Monaco Editor plugin configuration following TDD methodology
 * with OpenSCAD language support, worker configuration, and performance optimization.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createMonacoEditorConfig, validateMonacoConfig } from './monaco-vite-config';

describe('Monaco Editor Vite Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMonacoEditorConfig', () => {
    it('should create Monaco Editor plugin configuration', () => {
      const config = createMonacoEditorConfig();
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should include OpenSCAD language worker', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.languageWorkers).toContain('openscad');
    });

    it('should include standard language workers', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.languageWorkers).toContain('editorWorkerService');
      expect(config.languageWorkers).toContain('typescript');
      expect(config.languageWorkers).toContain('json');
      expect(config.languageWorkers).toContain('html');
    });

    it('should configure custom worker paths', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.customWorkers).toBeDefined();
      expect(Array.isArray(config.customWorkers)).toBe(true);
    });

    it('should include OpenSCAD custom worker', () => {
      const config = createMonacoEditorConfig();
      
      const openscadWorker = config.customWorkers?.find(
        worker => worker.label === 'openscad'
      );
      
      expect(openscadWorker).toBeDefined();
      expect(openscadWorker?.entry).toContain('openscad.worker');
    });

    it('should configure build optimization', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.buildOptimization).toBe(true);
    });

    it('should configure global Monaco API', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.globalAPI).toBe(true);
    });

    it('should configure locale support', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.locale).toBe('en');
    });

    it('should accept custom options', () => {
      const customOptions = {
        languageWorkers: ['typescript', 'json'],
        buildOptimization: false,
        locale: 'es'
      };
      
      const config = createMonacoEditorConfig(customOptions);
      
      expect(config.languageWorkers).toEqual(['typescript', 'json']);
      expect(config.buildOptimization).toBe(false);
      expect(config.locale).toBe('es');
    });
  });

  describe('validateMonacoConfig', () => {
    it('should validate correct Monaco configuration', () => {
      const validConfig = {
        languageWorkers: ['editorWorkerService', 'typescript', 'openscad'],
        customWorkers: [
          {
            label: 'openscad',
            entry: './src/features/code-editor/workers/openscad.worker.ts'
          }
        ],
        buildOptimization: true,
        globalAPI: true,
        locale: 'en'
      };
      
      const result = validateMonacoConfig(validConfig);
      
      expect(result.success).toBe(true);
    });

    it('should fail validation for missing language workers', () => {
      const invalidConfig = {
        customWorkers: [],
        buildOptimization: true,
        globalAPI: true,
        locale: 'en'
      };
      
      const result = validateMonacoConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('languageWorkers');
      }
    });

    it('should fail validation for empty language workers array', () => {
      const invalidConfig = {
        languageWorkers: [],
        customWorkers: [],
        buildOptimization: true,
        globalAPI: true,
        locale: 'en'
      };
      
      const result = validateMonacoConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least one language worker');
      }
    });

    it('should fail validation for missing OpenSCAD worker', () => {
      const invalidConfig = {
        languageWorkers: ['editorWorkerService', 'typescript'],
        customWorkers: [],
        buildOptimization: true,
        globalAPI: true,
        locale: 'en'
      };
      
      const result = validateMonacoConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('OpenSCAD');
      }
    });

    it('should validate custom worker configuration', () => {
      const configWithCustomWorker = {
        languageWorkers: ['editorWorkerService', 'openscad'],
        customWorkers: [
          {
            label: 'openscad',
            entry: './src/features/code-editor/workers/openscad.worker.ts'
          }
        ],
        buildOptimization: true,
        globalAPI: true,
        locale: 'en'
      };
      
      const result = validateMonacoConfig(configWithCustomWorker);
      
      expect(result.success).toBe(true);
    });

    it('should fail validation for invalid custom worker entry', () => {
      const invalidConfig = {
        languageWorkers: ['editorWorkerService', 'openscad'],
        customWorkers: [
          {
            label: 'openscad',
            entry: '' // Invalid empty entry
          }
        ],
        buildOptimization: true,
        globalAPI: true,
        locale: 'en'
      };
      
      const result = validateMonacoConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('entry path');
      }
    });
  });

  describe('Plugin Integration', () => {
    it('should create Vite plugin with Monaco configuration', () => {
      const config = createMonacoEditorConfig();
      
      // This would be tested with actual Vite plugin creation
      expect(config).toHaveProperty('languageWorkers');
      expect(config).toHaveProperty('customWorkers');
      expect(config).toHaveProperty('buildOptimization');
    });

    it('should support development mode configuration', () => {
      const devConfig = createMonacoEditorConfig({
        buildOptimization: false,
        globalAPI: true
      });
      
      expect(devConfig.buildOptimization).toBe(false);
      expect(devConfig.globalAPI).toBe(true);
    });

    it('should support production mode configuration', () => {
      const prodConfig = createMonacoEditorConfig({
        buildOptimization: true,
        globalAPI: false
      });
      
      expect(prodConfig.buildOptimization).toBe(true);
      expect(prodConfig.globalAPI).toBe(false);
    });
  });

  describe('Worker Configuration', () => {
    it('should configure worker paths correctly', () => {
      const config = createMonacoEditorConfig();
      
      const openscadWorker = config.customWorkers?.find(
        worker => worker.label === 'openscad'
      );
      
      expect(openscadWorker?.entry).toMatch(/\.worker\.(ts|js)$/);
    });

    it('should support multiple custom workers', () => {
      const config = createMonacoEditorConfig({
        customWorkers: [
          {
            label: 'openscad',
            entry: './src/features/code-editor/workers/openscad.worker.ts'
          },
          {
            label: 'custom-lang',
            entry: './src/features/code-editor/workers/custom.worker.ts'
          }
        ]
      });
      
      expect(config.customWorkers).toBeDefined();
      if (config.customWorkers) {
        expect(config.customWorkers[0]?.label).toBe('openscad');
        expect(config.customWorkers[1]?.label).toBe('custom-lang');
      }
    });

    it('should validate worker entry paths', () => {
      const config = createMonacoEditorConfig();
      
      config.customWorkers?.forEach(worker => {
        expect(worker.entry).toBeTruthy();
        expect(typeof worker.entry).toBe('string');
        expect(worker.entry.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should enable build optimization by default', () => {
      const config = createMonacoEditorConfig();
      
      expect(config.buildOptimization).toBe(true);
    });

    it('should configure chunk splitting for Monaco', () => {
      const config = createMonacoEditorConfig();
      
      // This would be validated in the actual Vite config
      expect(config.buildOptimization).toBe(true);
    });

    it('should support lazy loading configuration', () => {
      const config = createMonacoEditorConfig({
        lazyLoad: true
      });
      
      expect(config.lazyLoad).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', () => {
      const invalidConfig = null as any;
      
      const result = validateMonacoConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid configuration');
      }
    });

    it('should provide detailed error messages', () => {
      const invalidConfig = {
        languageWorkers: ['invalid-worker'],
        customWorkers: [
          {
            label: '',
            entry: ''
          }
        ]
      };
      
      const result = validateMonacoConfig(invalidConfig);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.length).toBeGreaterThan(10);
      }
    });
  });
});
