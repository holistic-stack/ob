/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: [
      'find-up',
      'unicorn-magic',
      'locate-path',
      'path-exists',
      'resolve',
      'vitest-fetch-mock',
      '@testing-library/jest-dom',
      'vitest'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@babylonjs/core',
        // Exclude Node.js modules that shouldn't be in browser build
        'node:fs',
        'node:path',
        'node:url',
        'node:process',
        'fs',
        'path',
        'os',
        'module',
        'find-up',
        'unicorn-magic',
        'locate-path',
        'path-exists',
        'resolve',
        'vitest-fetch-mock',
        '@testing-library/jest-dom',
        'vitest',
        // Exclude test setup files
        './src/vitest-setup.ts',
        './src/vitest-setup',
        'vitest-setup'
      ],
      input: 'src/main.tsx',
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@babylonjs/core': 'BABYLON',
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
