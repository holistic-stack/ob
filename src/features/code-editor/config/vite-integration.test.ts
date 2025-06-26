/**
 * Vite Monaco Editor Integration Test Suite
 * 
 * Tests for Vite configuration integration with Monaco Editor plugin
 * following TDD methodology with build and development mode validation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  createViteMonacoPlugin, 
  getMonacoConfigForEnvironment,
  validateMonacoInstallation,
  configureMonacoEnvironment 
} from './monaco-vite-config';

describe('Vite Monaco Editor Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Configuration', () => {
    it('should create development configuration', () => {
      const devConfig = getMonacoConfigForEnvironment(true);
      
      expect(devConfig.buildOptimization).toBe(false);
      expect(devConfig.globalAPI).toBe(true);
      expect(devConfig.lazyLoad).toBe(false);
    });

    it('should create production configuration', () => {
      const prodConfig = getMonacoConfigForEnvironment(false);
      
      expect(prodConfig.buildOptimization).toBe(true);
      expect(prodConfig.globalAPI).toBe(false);
      expect(prodConfig.lazyLoad).toBe(true);
    });

    it('should include OpenSCAD worker in both environments', () => {
      const devConfig = getMonacoConfigForEnvironment(true);
      const prodConfig = getMonacoConfigForEnvironment(false);
      
      expect(devConfig.languageWorkers).toContain('openscad');
      expect(prodConfig.languageWorkers).toContain('openscad');
    });

    it('should include OpenSCAD custom worker in both environments', () => {
      const devConfig = getMonacoConfigForEnvironment(true);
      const prodConfig = getMonacoConfigForEnvironment(false);
      
      const devOpenSCADWorker = devConfig.customWorkers.find(w => w.label === 'openscad');
      const prodOpenSCADWorker = prodConfig.customWorkers.find(w => w.label === 'openscad');
      
      expect(devOpenSCADWorker).toBeDefined();
      expect(prodOpenSCADWorker).toBeDefined();
      expect(devOpenSCADWorker?.entry).toContain('openscad.worker');
      expect(prodOpenSCADWorker?.entry).toContain('openscad.worker');
    });
  });

  describe('Vite Plugin Configuration', () => {
    it('should create valid Vite plugin configuration', () => {
      const pluginConfig = createViteMonacoPlugin();
      
      expect(pluginConfig).toBeDefined();
      expect(pluginConfig.languageWorkers).toBeDefined();
      expect(pluginConfig.customWorkers).toBeDefined();
      expect(pluginConfig.globalAPI).toBeDefined();
      expect(pluginConfig.buildOptimization).toBeDefined();
    });

    it('should include all required language workers', () => {
      const pluginConfig = createViteMonacoPlugin();
      
      expect(pluginConfig.languageWorkers).toContain('editorWorkerService');
      expect(pluginConfig.languageWorkers).toContain('typescript');
      expect(pluginConfig.languageWorkers).toContain('json');
      expect(pluginConfig.languageWorkers).toContain('html');
      expect(pluginConfig.languageWorkers).toContain('css');
      expect(pluginConfig.languageWorkers).toContain('openscad');
    });

    it('should include OpenSCAD custom worker configuration', () => {
      const pluginConfig = createViteMonacoPlugin();
      
      const openscadWorker = pluginConfig.customWorkers?.find(w => w.label === 'openscad');
      expect(openscadWorker).toBeDefined();
      expect(openscadWorker?.entry).toBe('./src/features/code-editor/workers/openscad.worker.ts');
    });

    it('should accept custom configuration options', () => {
      const customConfig = createViteMonacoPlugin({
        buildOptimization: false,
        globalAPI: true,
        locale: 'es'
      });
      
      expect(customConfig.buildOptimization).toBe(false);
      expect(customConfig.globalAPI).toBe(true);
      expect(customConfig.locale).toBe('es');
    });

    it('should validate configuration before creating plugin', () => {
      // This should not throw
      expect(() => createViteMonacoPlugin()).not.toThrow();
      
      // This should throw due to invalid configuration
      expect(() => createViteMonacoPlugin({
        languageWorkers: [] // Invalid: empty array
      })).toThrow();
    });
  });

  describe('Monaco Environment Setup', () => {
    it('should configure Monaco environment for browser', () => {
      // Mock window object
      const mockWindow = {
        MonacoEnvironment: undefined
      };
      
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true
      });
      
      const result = configureMonacoEnvironment();
      
      expect(result.success).toBe(true);
      expect(mockWindow.MonacoEnvironment).toBeDefined();
    });

    it('should handle server-side environment gracefully', () => {
      // Remove window object
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });
      
      const result = configureMonacoEnvironment();
      
      expect(result.success).toBe(true);
    });

    it('should provide worker URL resolution', () => {
      const mockWindow = {
        MonacoEnvironment: undefined
      };
      
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true
      });
      
      configureMonacoEnvironment();
      
      expect(mockWindow.MonacoEnvironment).toBeDefined();
      expect(typeof mockWindow.MonacoEnvironment.getWorkerUrl).toBe('function');
      expect(typeof mockWindow.MonacoEnvironment.getWorker).toBe('function');
    });
  });

  describe('Installation Validation', () => {
    it('should validate Monaco Editor installation', () => {
      const result = validateMonacoInstallation();
      
      expect(result.success).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      // This test would check for actual installation issues
      // For now, just ensure it doesn't throw
      expect(() => validateMonacoInstallation()).not.toThrow();
    });
  });

  describe('Worker Path Resolution', () => {
    it('should resolve standard worker paths', () => {
      const pluginConfig = createViteMonacoPlugin();
      
      // Check that standard workers are included
      expect(pluginConfig.languageWorkers).toContain('editorWorkerService');
      expect(pluginConfig.languageWorkers).toContain('typescript');
      expect(pluginConfig.languageWorkers).toContain('json');
    });

    it('should resolve custom worker paths', () => {
      const pluginConfig = createViteMonacoPlugin();
      
      const openscadWorker = pluginConfig.customWorkers?.find(w => w.label === 'openscad');
      expect(openscadWorker?.entry).toMatch(/\.worker\.(ts|js)$/);
    });

    it('should handle multiple custom workers', () => {
      const pluginConfig = createViteMonacoPlugin({
        customWorkers: [
          {
            label: 'openscad',
            entry: './src/features/code-editor/workers/openscad.worker.ts'
          },
          {
            label: 'custom',
            entry: './src/features/code-editor/workers/custom.worker.ts'
          }
        ]
      });
      
      expect(pluginConfig.customWorkers).toHaveLength(2);
      expect(pluginConfig.customWorkers?.[0].label).toBe('openscad');
      expect(pluginConfig.customWorkers?.[1].label).toBe('custom');
    });
  });

  describe('Build Optimization', () => {
    it('should enable optimization for production', () => {
      const prodConfig = createViteMonacoPlugin(getMonacoConfigForEnvironment(false));
      
      expect(prodConfig.buildOptimization).toBe(true);
      expect(prodConfig.lazyLoad).toBe(true);
    });

    it('should disable optimization for development', () => {
      const devConfig = createViteMonacoPlugin(getMonacoConfigForEnvironment(true));
      
      expect(devConfig.buildOptimization).toBe(false);
      expect(devConfig.lazyLoad).toBe(false);
    });

    it('should configure global API based on environment', () => {
      const devConfig = createViteMonacoPlugin(getMonacoConfigForEnvironment(true));
      const prodConfig = createViteMonacoPlugin(getMonacoConfigForEnvironment(false));
      
      expect(devConfig.globalAPI).toBe(true);
      expect(prodConfig.globalAPI).toBe(false);
    });
  });

  describe('Locale Support', () => {
    it('should default to English locale', () => {
      const config = createViteMonacoPlugin();
      
      expect(config.locale).toBe('en');
    });

    it('should support custom locale configuration', () => {
      const config = createViteMonacoPlugin({
        locale: 'es'
      });
      
      expect(config.locale).toBe('es');
    });

    it('should validate locale configuration', () => {
      expect(() => createViteMonacoPlugin({
        locale: 'fr'
      })).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid plugin configuration', () => {
      expect(() => createViteMonacoPlugin({
        languageWorkers: [] // Invalid
      })).toThrow();
    });

    it('should provide detailed error messages', () => {
      try {
        createViteMonacoPlugin({
          languageWorkers: [],
          customWorkers: [{ label: '', entry: '' }]
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('Invalid Monaco configuration');
      }
    });

    it('should handle environment configuration errors', () => {
      // Mock error scenario
      const originalWindow = global.window;
      
      try {
        Object.defineProperty(global, 'window', {
          get: () => { throw new Error('Window access error'); },
          configurable: true
        });
        
        const result = configureMonacoEnvironment();
        expect(result.success).toBe(false);
      } finally {
        Object.defineProperty(global, 'window', {
          value: originalWindow,
          configurable: true
        });
      }
    });
  });
});
