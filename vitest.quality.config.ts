import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Vitest configuration for quality gate validation tests
 * 
 * This configuration is specifically for running validation tests that ensure
 * components meet our quality standards for:
 * - TypeScript compliance
 * - Functional programming patterns
 * - Glass morphism implementation
 * - Accessibility requirements
 * - Performance benchmarks
 */
export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    setupFiles: ['./src/test/quality-gates-setup.ts'],
    
    // Test file patterns for quality gates
    include: [
      'src/**/*.quality.test.ts',
      'src/**/*.quality.test.tsx',
      'src/test/quality-gates/**/*.test.ts'
    ],
    
    // Exclude regular tests
    exclude: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'node_modules/**',
      'dist/**'
    ],
    
    // Coverage configuration for quality gates
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/quality-gates',
      
      // Strict coverage thresholds for quality gates
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90
      },
      
      // Include only source files
      include: [
        'src/features/ui-components/**/*.ts',
        'src/features/ui-components/**/*.tsx'
      ],
      
      // Exclude test files and stories
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.stories.ts',
        'src/**/*.stories.tsx',
        'src/**/*.spec.ts',
        'src/**/*.spec.tsx',
        'src/test/**'
      ]
    },
    
    // Test timeout for quality validation
    testTimeout: 30000,
    
    // Reporters for quality gate results
    reporters: [
      'default',
      'json',
      ['html', { outputFile: './reports/quality-gates.html' }]
    ],
    
    // Fail fast on quality gate failures
    bail: 1,
    
    // Parallel execution for faster validation
    threads: true,
    maxThreads: 4,
    
    // Watch mode configuration
    watch: false, // Quality gates should not run in watch mode
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/test': resolve(__dirname, './src/test'),
      '@/features': resolve(__dirname, './src/features')
    }
  },
  
  // Define constants for quality gate validation
  define: {
    __QUALITY_GATE_MODE__: true,
    __STRICT_VALIDATION__: true
  }
});
