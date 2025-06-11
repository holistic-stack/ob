/**
 * @file Vite configuration for React development server
 * 
 * Separate configuration for running the React development server
 * to test the OpenSCAD pipeline without interfering with vitest config.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['@babylonjs/core', '@holistic-stack/openscad-parser'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
