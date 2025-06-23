/**
 * Vitest Configuration for Unit Tests
 * 
 * Basic configuration for running unit tests for the OpenSCAD 3D visualization pipeline
 * with proper mocking and test environment setup.
 * 
 * @author OpenSCAD-Babylon Pipeline
 * @version 1.0.0
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/vitest-setup.ts'],
    
    // Test file patterns
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'src/features/**/*.integration.test.{ts,tsx}',
      'src/features/**/*.e2e.test.{ts,tsx}',
      '**/*.vspec.tsx' // Visual tests run separately with Playwright
    ],
    
    // Test timeout configuration
    testTimeout: 10000, // 10 seconds for unit tests
    hookTimeout: 5000, // 5 seconds for setup/teardown
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/unit',
      include: [
        'src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.vspec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/types/**',
        '**/mocks/**',
        '**/test/**',
        'src/main.tsx',
        'src/App.tsx'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Retry configuration for flaky tests
    retry: 1,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2,
        minThreads: 1
      }
    },
    
    // Reporter configuration
    reporter: ['default', 'json'],
    
    // Mock configuration
    deps: {
      inline: [
        '@monaco-editor/react',
        'monaco-editor',
        'three',
        'three-csg-ts'
      ]
    },
    
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      VITE_TEST_MODE: 'unit'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@test': path.resolve(__dirname, './src/test')
    }
  },
  
  // Define configuration for test environment
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.VITE_TEST_MODE': '"unit"'
  },
  
  // Optimizations for test performance
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@testing-library/react',
      '@testing-library/user-event',
      '@testing-library/jest-dom'
    ]
  }
});
