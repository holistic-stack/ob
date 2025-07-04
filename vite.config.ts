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
      isolate: true,
      environment: 'jsdom',
      environmentOptions: {
        jsdom: {
          resources: 'usable',
        },
      },
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
      setupFiles: ['./src/vitest-setup.ts'],
      testTimeout: 1000, // Longer timeout for CSG2 operations
      hookTimeout: 1000, // Longer timeout for setup hooks
      reporters: 'verbose',
      // Run tests sequentially to avoid race conditions and memory issues
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      // Disable parallel execution
      fileParallelism: false,
      maxConcurrency: 1,
    },
  };
});
