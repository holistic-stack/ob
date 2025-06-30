/**
 * Vitest Configuration for Integration Tests
 *
 * Specialized configuration for running integration tests for the OpenSCAD 3D visualization pipeline
 * with proper mocking, performance monitoring, and visual regression testing setup.
 *
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup-integration.ts'],

    // Test file patterns
    include: [
      'src/**/*.integration.test.{ts,tsx}',
      'src/**/*.e2e.test.{ts,tsx}',
      'src/**/*.pipeline.test.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.vspec.tsx', // Visual tests run separately with Playwright
    ],

    // Test timeout configuration
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/integration',
      include: ['src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.vspec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/types/**',
        '**/mocks/**',
        '**/test/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Specific thresholds for critical components
        'src/features/ui-components/editor/code-editor/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/features/r3f-renderer/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },

    // Performance monitoring
    benchmark: {
      include: ['**/*.bench.{ts,tsx}'],
      exclude: ['node_modules/**'],
    },

    // Retry configuration for flaky tests
    retry: 2,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // Reporter configuration
    reporter: [
      'default',
      'json',
      'html',
      ['junit', { outputFile: './test-results/integration-results.xml' }],
    ],

    // Mock configuration
    deps: {
      inline: ['three', 'three-csg-ts', '@monaco-editor/react', 'monaco-editor'],
    },

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_TEST_MODE: 'integration',
      VITE_PERFORMANCE_MONITORING: 'true',
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },

  // Define configuration for test environment
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.VITE_TEST_MODE': '"integration"',
  },

  // Optimizations for test performance
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/user-event',
      '@testing-library/jest-dom',
    ],
  },

  // Build configuration for test assets
  build: {
    target: 'node14',
    sourcemap: true,
  },
});
