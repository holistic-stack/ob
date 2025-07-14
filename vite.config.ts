/// <reference types="vitest" />

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => {
  return {
    plugins: [
      react(),
      // Monaco Editor plugin temporarily disabled for initial integration
      // monacoEditorPlugin(createViteMonacoPlugin(monacoConfig))
    ],
    define: {
      // Polyfill process.env for browser environment
      'process.env': {},
      // Polyfill global process object for WASM modules
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: [
        'zustand',
        'zustand/middleware',
        'immer',
        'monaco-editor',
        '@monaco-editor/react',
        'tslog',
        // TODO: Add BabylonJS dependencies
      ],
      // TODO: Add BabylonJS exclusions if needed
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Increase chunk size warning limit for large dependencies
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        input: 'src/main.tsx',
        output: {
          // Manual chunk splitting for better caching and loading
          manualChunks: {
            // Monaco Editor - large code editor dependency
            monaco: ['monaco-editor', '@monaco-editor/react'],
            // BabylonJS - 3D rendering engine
            babylon: [
              '@babylonjs/core',
              '@babylonjs/materials',
              '@babylonjs/loaders',
              'react-babylonjs',
            ],
            // Parsing libraries
            parsing: ['web-tree-sitter'],
            // React ecosystem
            'react-vendor': ['react', 'react-dom'],
            // State management and utilities
            utils: ['zustand', 'class-variance-authority', 'tslog'],
            // 'babylon-wasm': ['@babylonjs/core'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          resources: 'usable',
        },
      },
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
      setupFiles: ['./src/vitest-setup.ts'],
      testTimeout: 5000, // Increased timeout for matrix operations
      hookTimeout: 3000, // Increased timeout for setup hooks
      reporters: 'verbose',
      pool: 'threads',
      poolOptions: {
        threads: {
          minThreads: 1,
          maxThreads: 4,
          isolate: false,
        },
      },
      sequence: {
        hooks: 'stack',
      },
      teardownTimeout: 20000,
      isolate: false,
    },
  };
});
