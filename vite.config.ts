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
      ],
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
            // Three.js ecosystem - 3D rendering (excluding @types packages)
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            // CSG and parsing libraries
            parsing: ['web-tree-sitter', 'three-csg-ts'],
            // React ecosystem
            'react-vendor': ['react', 'react-dom'],
            // State management and utilities
            utils: ['zustand', 'clsx', 'class-variance-authority', 'tslog'],
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
      // Optimize for memory usage and prevent OOM errors
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true, // Run tests sequentially to prevent race conditions
          isolate: false, // Disable isolation to reduce memory overhead
          maxForks: 1, // Force single fork for memory-intensive tests
        },
      },
      // Force sequential execution for memory-intensive tests
      sequence: {
        concurrent: false,
        shuffle: false,
      },
      // Prevent test hanging with proper cleanup
      teardownTimeout: 2000,
      // Disable test isolation to prevent memory issues with WASM/Three.js
      isolate: false,
    },
  };
});
