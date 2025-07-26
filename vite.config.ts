/// <reference types="vitest" />

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      // Enable fast refresh for better HMR
      fastRefresh: true,
      // Include .tsx files in fast refresh
      include: '**/*.{jsx,tsx}',
    }),
    // Monaco Editor plugin temporarily disabled for initial integration
    // monacoEditorPlugin(createViteMonacoPlugin(monacoConfig))
  ],
  define: {
    // Add any global defines here if needed
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  server: {
    // HMR optimization
    hmr: {
      overlay: true,
    },
    // File watching optimization
    watch: {
      // Ignore node_modules for better performance
      ignored: ['**/node_modules/**', '**/dist/**'],
    },
    // Faster startup
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
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
      '@babylonjs/core',
      '@babylonjs/materials',
      '@babylonjs/loaders',
      'web-tree-sitter',
      'class-variance-authority',
    ],
    exclude: [
      // Exclude WASM files from optimization
      '@babylonjs/core/Engines/WebGPU',
      '@babylonjs/core/ShadersWGSL',
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
          // BabylonJS - 3D rendering engine
          babylon: ['@babylonjs/core', '@babylonjs/materials', '@babylonjs/loaders'],
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
    testTimeout: 10000, // Increased timeout for complex tests
    hookTimeout: 5000, // Increased timeout for setup hooks
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      hooks: 'stack',
    },
    teardownTimeout: 10000,
    // Memory optimization settings
    maxConcurrency: 1,
    // Additional memory settings
    logHeapUsage: true,
    allowOnly: true,
  },
});
