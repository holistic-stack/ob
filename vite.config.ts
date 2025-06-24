/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: react() as any,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
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
          'monaco': ['monaco-editor', '@monaco-editor/react'],
          // Three.js ecosystem - 3D rendering (excluding @types packages)
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          // CSG and parsing libraries
          'parsing': ['web-tree-sitter', '@holistic-stack/openscad-parser', 'three-csg-ts'],
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          // State management and utilities
          'utils': ['zustand', 'clsx', 'class-variance-authority'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    setupFiles: ['./src/vitest-setup.ts'],
    testTimeout: 1000, // Longer timeout for CSG2 operations
    hookTimeout: 1000, // Longer timeout for setup hooks
    reporters: 'verbose',
  },
});
