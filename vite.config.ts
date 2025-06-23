/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: 'src/main.tsx',
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
